const bcrypt = require('bcryptjs');

const { UserRepository } = require('../repositories/UserRepository');
const { RoleRepository } = require('../repositories/RoleRepository');
const { AuditService } = require('./AuditService');
const { withTransaction } = require('../db/transaction');
const { toDbStatus, toUserDTO, toUserRoleDTO } = require('../mappers/userMapper');
const { ConflictError, NotFoundError, PermissionError, ValidationError } = require('../utils/errors');

function pickUserChanges(beforeRow, afterRow) {
  const beforeData = {};
  const afterData = {};
  const fields = [
    ['displayName', 'display_name'],
    ['status', 'status']
  ];

  for (const [dtoField, dbField] of fields) {
    if (beforeRow[dbField] !== afterRow[dbField]) {
      beforeData[dtoField] = beforeRow[dbField] ?? null;
      afterData[dtoField] = afterRow[dbField] ?? null;
    }
  }

  return {
    beforeData,
    afterData,
    hasChanges: Object.keys(afterData).length > 0
  };
}

function handleUniqueError(error) {
  if (error?.code === '23505') {
    throw new ConflictError('email already exists.');
  }

  throw error;
}

class UserService {
  constructor({
    userRepository = new UserRepository(),
    roleRepository = new RoleRepository(),
    auditService = new AuditService()
  } = {}) {
    this.userRepository = userRepository;
    this.roleRepository = roleRepository;
    this.auditService = auditService;
  }

  async getUserOrThrow(userId, client) {
    const user = await this.userRepository.getUserById(userId, client);
    if (!user) throw new NotFoundError('User not found.');
    return user;
  }

  async createUser(input, actor, req = null) {
    return withTransaction(async (client) => {
      const email = input.email.toLowerCase();
      const existing = await this.userRepository.getUserByEmail(email, client);
      if (existing) throw new ConflictError('email already exists.');

      const passwordHash = await bcrypt.hash(input.password, 12);

      try {
        const user = await this.userRepository.createUser({
          displayName: input.displayName,
          email,
          userType: input.userType || 'customer_service',
          status: toDbStatus(input.status || 'active'),
          passwordHash,
          authProvider: 'password',
          metadata: { createdByAdminApi: true }
        }, client);

        await this.auditService.record({
          actorType: actor?.userType || 'admin',
          actorId: actor?.id || null,
          actorDisplayName: actor?.displayName || null,
          action: 'user.created',
          entityType: 'user',
          entityId: user.id,
          afterData: toUserDTO(user),
          ipAddress: req?.ip || null,
          userAgent: req?.get?.('user-agent') || null,
          metadata: { requestId: req?.requestId || null }
        }, client);

        return toUserDTO(user);
      } catch (error) {
        handleUniqueError(error);
      }
    });
  }

  async getUser(userId) {
    const user = await this.getUserOrThrow(userId);
    const roles = await this.listUserRoles(userId);
    return toUserDTO(user, { roles });
  }

  async listUsers(query = {}) {
    const result = await this.userRepository.listUsers({
      filters: {
        q: query.q,
        email: query.email,
        status: query.status ? toDbStatus(query.status) : undefined,
        roleId: query.roleId,
        organizationId: query.organizationId
      },
      pagination: {
        limit: query.limit,
        offset: query.offset
      },
      sort: query.sort
    });

    return {
      data: result.rows.map((row) => toUserDTO(row)),
      pagination: result.pagination
    };
  }

  async updateUser(userId, input, actor, req = null) {
    return withTransaction(async (client) => {
      const existing = await this.getUserOrThrow(userId, client);

      if (actor?.id === userId && input.status === 'disabled') {
        throw new ValidationError('Users cannot disable themselves.', [
          { field: 'status', message: 'Users cannot disable themselves.', code: 'self_disable_not_allowed' }
        ]);
      }

      const updated = await this.userRepository.updateUser(userId, {
        displayName: input.displayName,
        status: input.status ? toDbStatus(input.status) : undefined
      }, client);
      const changes = pickUserChanges(existing, updated);

      if (changes.hasChanges) {
        await this.auditService.record({
          actorType: actor?.userType || 'admin',
          actorId: actor?.id || null,
          actorDisplayName: actor?.displayName || null,
          action: updated.status === 'inactive' && existing.status !== 'inactive'
            ? 'user.disabled'
            : 'user.updated',
          entityType: 'user',
          entityId: userId,
          beforeData: changes.beforeData,
          afterData: changes.afterData,
          ipAddress: req?.ip || null,
          userAgent: req?.get?.('user-agent') || null,
          metadata: { requestId: req?.requestId || null }
        }, client);
      }

      return toUserDTO(updated);
    });
  }

  async disableUser(userId, actor, req = null) {
    return this.updateUser(userId, { status: 'disabled' }, actor, req);
  }

  async listUserRoles(userId) {
    await this.getUserOrThrow(userId);
    const roles = await this.roleRepository.listUserRoleAssignments(userId);
    return roles.map(toUserRoleDTO);
  }

  async assignRoleToUser(userId, input, actor, req = null) {
    if (actor?.id === userId) {
      throw new PermissionError('Users cannot assign roles to themselves.');
    }

    return withTransaction(async (client) => {
      await this.getUserOrThrow(userId, client);
      const role = await this.roleRepository.getRoleById(input.roleId, client);
      if (!role || !role.enabled) {
        throw new ValidationError('Invalid roleId.', [
          { field: 'roleId', message: 'Role does not exist or is disabled.', code: 'invalid_reference' }
        ]);
      }

      await this.roleRepository.assignRoleToUser({
        userId,
        roleId: input.roleId,
        assignedBy: actor?.id || null
      }, client);

      const roles = await this.roleRepository.listUserRoleAssignments(userId, client);
      const assignment = roles.find((item) => item.role_id === input.roleId);

      await this.auditService.record({
        actorType: actor?.userType || 'admin',
        actorId: actor?.id || null,
        actorDisplayName: actor?.displayName || null,
        action: 'user_role.assigned',
        entityType: 'user_role',
        entityId: assignment?.id,
        afterData: {
          userId,
          roleId: input.roleId,
          roleKey: role.role_key
        },
        ipAddress: req?.ip || null,
        userAgent: req?.get?.('user-agent') || null,
        metadata: { requestId: req?.requestId || null }
      }, client);

      return toUserRoleDTO(assignment);
    });
  }

  async removeRoleFromUser(userId, roleId, actor, req = null) {
    if (actor?.id === userId) {
      throw new PermissionError('Users cannot remove roles from themselves.');
    }

    return withTransaction(async (client) => {
      await this.getUserOrThrow(userId, client);
      const removed = await this.roleRepository.removeRoleFromUser({ userId, roleId }, client);
      if (!removed) throw new NotFoundError('User role assignment not found.');

      await this.auditService.record({
        actorType: actor?.userType || 'admin',
        actorId: actor?.id || null,
        actorDisplayName: actor?.displayName || null,
        action: 'user_role.removed',
        entityType: 'user_role',
        entityId: removed.id,
        beforeData: {
          userId,
          roleId
        },
        ipAddress: req?.ip || null,
        userAgent: req?.get?.('user-agent') || null,
        metadata: { requestId: req?.requestId || null }
      }, client);

      return { removed: true };
    });
  }
}

module.exports = {
  UserService
};
