const { OrganizationAccessService } = require('../services/OrganizationAccessService');

const organizationAccessService = new OrganizationAccessService();

function getOrganizationId(req) {
  return req.params.organizationId || req.body?.organizationId || req.query?.organizationId || null;
}

function requireOrganizationAccess() {
  return async function organizationAccessMiddleware(req, res, next) {
    try {
      const organizationId = getOrganizationId(req);
      await organizationAccessService.assertAccess(req.user, organizationId);
      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = {
  requireOrganizationAccess
};
