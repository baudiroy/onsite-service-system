const { env } = require('../config/env');
const { UserOrganizationRepository } = require('../repositories/UserOrganizationRepository');
const { PermissionError, ValidationError } = require('../utils/errors');

function isSystemOrSuperAdmin(user) {
  const roles = Array.isArray(user?.roles) ? user.roles : [];
  return user?.userType === 'system' || roles.includes('admin') || roles.includes('system');
}

class OrganizationAccessService {
  constructor({ userOrganizationRepository = new UserOrganizationRepository() } = {}) {
    this.userOrganizationRepository = userOrganizationRepository;
  }

  async canAccessOrganization(user, organizationId, client) {
    if (!organizationId) return true;
    if (isSystemOrSuperAdmin(user)) return true;

    return this.userOrganizationRepository.hasUserOrganization(
      user?.id,
      organizationId,
      client
    );
  }

  async assertAccess(user, organizationId, client) {
    const hasAccess = await this.canAccessOrganization(user, organizationId, client);

    if (!hasAccess) {
      throw new PermissionError('Organization access denied.');
    }

    return true;
  }

  async buildScopedFilter(user, requestedOrganizationId, client) {
    if (requestedOrganizationId) {
      await this.assertAccess(user, requestedOrganizationId, client);
      return { organizationId: requestedOrganizationId };
    }

    if (isSystemOrSuperAdmin(user)) {
      return {};
    }

    const organizationIds = await this.userOrganizationRepository.getUserOrganizationIds(user?.id, client);
    return { organizationIds };
  }

  resolveCreateOrganizationId(user, requestedOrganizationId) {
    if (requestedOrganizationId) return requestedOrganizationId;

    if (env.isProduction) {
      throw new ValidationError('organizationId is required in production.', [
        { field: 'organizationId', message: 'organizationId is required in production.', code: 'required' }
      ]);
    }

    return null;
  }
}

module.exports = {
  OrganizationAccessService,
  isSystemOrSuperAdmin
};
