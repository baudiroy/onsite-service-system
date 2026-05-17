const { OrganizationRepository } = require('../repositories/OrganizationRepository');
const { UserRepository } = require('../repositories/UserRepository');
const { UserOrganizationRepository } = require('../repositories/UserOrganizationRepository');
const { AuditService } = require('./AuditService');
const { OrganizationAccessService } = require('./OrganizationAccessService');
const { withTransaction } = require('../db/transaction');
const { ConflictError, NotFoundError, ValidationError } = require('../utils/errors');
const { toOrganizationDTO, toUserOrganizationDTO } = require('../mappers/organizationMapper');

function pickOrganizationChanges(beforeRow, afterRow) {
  const beforeData = {};
  const afterData = {};
  const fields = [
    ['organizationName', 'organization_name'],
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

class OrganizationService {
  constructor({
    organizationRepository = new OrganizationRepository(),
    userRepository = new UserRepository(),
    userOrganizationRepository = new UserOrganizationRepository(),
    organizationAccessService = new OrganizationAccessService(),
    auditService = new AuditService()
  } = {}) {
    this.organizationRepository = organizationRepository;
    this.userRepository = userRepository;
    this.userOrganizationRepository = userOrganizationRepository;
    this.organizationAccessService = organizationAccessService;
    this.auditService = auditService;
  }

  async createOrganization(input, actor, req = null) {
    return withTransaction(async (client) => {
      const existing = await this.organizationRepository.getOrganizationByCode(input.organizationCode, client);
      if (existing) throw new ConflictError('organizationCode already exists.');

      const organization = await this.organizationRepository.createOrganization(input, client);
      await this.auditService.record({
        actorType: actor?.userType || 'admin',
        actorId: actor?.id || null,
        actorDisplayName: actor?.displayName || null,
        action: 'organization.created',
        entityType: 'organization',
        entityId: organization.id,
        afterData: {
          id: organization.id,
          organizationCode: organization.organization_code,
          organizationName: organization.organization_name,
          status: organization.status
        },
        ipAddress: req?.ip || null,
        userAgent: req?.get?.('user-agent') || null,
        metadata: { requestId: req?.requestId || null }
      }, client);

      return toOrganizationDTO(organization);
    });
  }

  async getOrganization(organizationId, actor) {
    const organization = await this.organizationRepository.getOrganizationById(organizationId);
    if (!organization) throw new NotFoundError('Organization not found.');
    await this.organizationAccessService.assertAccess(actor, organization.id);
    return toOrganizationDTO(organization);
  }

  async listOrganizations(query, actor) {
    const scopedFilter = await this.organizationAccessService.buildScopedFilter(actor, query.organizationId || null);
    const result = await this.organizationRepository.listOrganizations({
      filters: {
        ...query,
        ...scopedFilter
      },
      pagination: {
        limit: query.limit,
        offset: query.offset
      },
      sort: query.sort
    });

    return {
      data: result.rows.map(toOrganizationDTO),
      pagination: result.pagination
    };
  }

  async updateOrganization(organizationId, updates, actor, req = null) {
    return withTransaction(async (client) => {
      const existing = await this.organizationRepository.getOrganizationById(organizationId, client);
      if (!existing) throw new NotFoundError('Organization not found.');
      await this.organizationAccessService.assertAccess(actor, existing.id, client);

      const updated = await this.organizationRepository.updateOrganization(organizationId, updates, client);
      const changes = pickOrganizationChanges(existing, updated);

      if (changes.hasChanges) {
        await this.auditService.record({
          actorType: actor?.userType || 'admin',
          actorId: actor?.id || null,
          actorDisplayName: actor?.displayName || null,
          action: 'organization.updated',
          entityType: 'organization',
          entityId: organizationId,
          beforeData: changes.beforeData,
          afterData: changes.afterData,
          ipAddress: req?.ip || null,
          userAgent: req?.get?.('user-agent') || null,
          metadata: { requestId: req?.requestId || null }
        }, client);
      }

      return toOrganizationDTO(updated);
    });
  }

  async assignUserToOrganization(userId, input, actor, req = null) {
    return withTransaction(async (client) => {
      const user = await this.userRepository.findById(userId, client);
      if (!user) throw new ValidationError('Invalid userId.', [
        { field: 'userId', message: 'User does not exist or is deleted.', code: 'invalid_reference' }
      ]);

      const organization = await this.organizationRepository.getOrganizationById(input.organizationId, client);
      if (!organization) throw new ValidationError('Invalid organizationId.', [
        { field: 'organizationId', message: 'Organization does not exist or is deleted.', code: 'invalid_reference' }
      ]);
      await this.organizationAccessService.assertAccess(actor, organization.id, client);

      const membership = await this.userOrganizationRepository.assignUserToOrganization({
        userId,
        organizationId: input.organizationId,
        roleNote: input.roleNote || null
      }, client);

      await this.auditService.record({
        actorType: actor?.userType || 'admin',
        actorId: actor?.id || null,
        actorDisplayName: actor?.displayName || null,
        action: 'user_organization.assigned',
        entityType: 'user_organization',
        entityId: membership.id,
        afterData: {
          userId,
          organizationId: input.organizationId,
          roleNote: input.roleNote || null
        },
        ipAddress: req?.ip || null,
        userAgent: req?.get?.('user-agent') || null,
        metadata: { requestId: req?.requestId || null }
      }, client);

      return toUserOrganizationDTO(membership);
    });
  }

  async removeUserFromOrganization(userId, organizationId, actor, req = null) {
    return withTransaction(async (client) => {
      await this.organizationAccessService.assertAccess(actor, organizationId, client);
      const removed = await this.userOrganizationRepository.removeUserFromOrganization({ userId, organizationId }, client);
      if (!removed) throw new NotFoundError('User organization membership not found.');

      await this.auditService.record({
        actorType: actor?.userType || 'admin',
        actorId: actor?.id || null,
        actorDisplayName: actor?.displayName || null,
        action: 'user_organization.removed',
        entityType: 'user_organization',
        entityId: removed.id,
        beforeData: {
          userId,
          organizationId
        },
        ipAddress: req?.ip || null,
        userAgent: req?.get?.('user-agent') || null,
        metadata: { requestId: req?.requestId || null }
      }, client);

      return { removed: true };
    });
  }

  async listUserOrganizations(userId, actor) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundError('User not found.');

    const rows = await this.userOrganizationRepository.listUserOrganizations(userId);
    const visibleRows = [];

    for (const row of rows) {
      // The list is small in phase 1 and this keeps the boundary explicit.
      // If memberships grow large, push this filter into the repository.
      if (await this.organizationAccessService.canAccessOrganization(actor, row.organization_id)) {
        visibleRows.push(row);
      }
    }

    return visibleRows.map(toUserOrganizationDTO);
  }
}

module.exports = {
  OrganizationService
};
