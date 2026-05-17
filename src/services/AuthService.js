const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { env } = require('../config/env');
const { withTransaction } = require('../db/transaction');
const { UserRepository } = require('../repositories/UserRepository');
const { AuthError } = require('../utils/errors');
const { AuditService } = require('./AuditService');
const { PermissionService } = require('./PermissionService');

function toUserDto(user, roles = [], permissions = []) {
  return {
    id: user.id,
    displayName: user.display_name,
    email: user.email,
    mobile: user.mobile,
    userType: user.user_type,
    status: user.status,
    authProvider: user.auth_provider,
    lastLoginAt: user.last_login_at,
    roles: roles.map((role) => role.role_key),
    permissions
  };
}

class AuthService {
  constructor({
    userRepository = new UserRepository(),
    permissionService = new PermissionService(),
    auditService = new AuditService()
  } = {}) {
    this.userRepository = userRepository;
    this.permissionService = permissionService;
    this.auditService = auditService;
  }

  issueToken(user) {
    return jwt.sign(
      {
        sub: user.id,
        typ: 'access'
      },
      env.jwtSecret,
      {
        expiresIn: env.jwtExpiresIn
      }
    );
  }

  verifyToken(token) {
    try {
      const payload = jwt.verify(token, env.jwtSecret);

      if (!payload?.sub || payload.typ !== 'access') {
        throw new AuthError('Invalid token.');
      }

      return payload;
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }

      throw new AuthError('Invalid or expired token.');
    }
  }

  async login({ email, password, req = null }) {
    return withTransaction(async (client) => {
      const user = await this.userRepository.findByEmail(email, client);

      if (!user) {
        await this.auditService.recordLoginFailure({
          email,
          reason: 'user_not_found',
          req
        }, client);
        throw new AuthError('Invalid email or password.');
      }

      if (user.status !== 'active') {
        await this.auditService.recordLoginFailure({
          email,
          reason: `user_${user.status}`,
          user,
          req
        }, client);
        throw new AuthError('User is not active.');
      }

      if (user.auth_provider !== 'password' || !user.password_hash) {
        await this.auditService.recordLoginFailure({
          email,
          reason: 'password_login_not_available',
          user,
          req
        }, client);
        throw new AuthError('Invalid email or password.');
      }

      const passwordMatches = await bcrypt.compare(password, user.password_hash);

      if (!passwordMatches) {
        await this.auditService.recordLoginFailure({
          email,
          reason: 'invalid_password',
          user,
          req
        }, client);
        throw new AuthError('Invalid email or password.');
      }

      const updatedUser = await this.userRepository.updateLastLoginAt(user.id, client);
      const roles = await this.permissionService.getUserRoles(user.id, client);
      const permissions = await this.permissionService.getUserPermissions(user.id, client);
      const accessToken = this.issueToken(updatedUser);

      await this.auditService.recordLoginSuccess({ user: updatedUser, req }, client);

      return {
        accessToken,
        user: toUserDto(updatedUser, roles, permissions)
      };
    });
  }

  async getCurrentUserById(userId) {
    const user = await this.userRepository.findById(userId);

    if (!user || user.status !== 'active') {
      throw new AuthError('Authentication required.');
    }

    const roles = await this.permissionService.getUserRoles(user.id);
    const permissions = await this.permissionService.getUserPermissions(user.id);

    return toUserDto(user, roles, permissions);
  }

  async getCurrentUserFromToken(token) {
    const payload = this.verifyToken(token);
    return this.getCurrentUserById(payload.sub);
  }
}

module.exports = {
  AuthService,
  toUserDto
};
