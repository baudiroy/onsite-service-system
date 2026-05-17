const { requireAuth } = require('./requireAuth');
const { isSystemOrSuperAdmin } = require('../services/OrganizationAccessService');
const { PermissionError } = require('../utils/errors');

function requireSystemOrSuperAdmin(req, res, next) {
  requireAuth(req, res, (authError) => {
    if (authError) {
      next(authError);
      return;
    }

    if (!isSystemOrSuperAdmin(req.user)) {
      next(new PermissionError('System or super admin access required.'));
      return;
    }

    next();
  });
}

module.exports = {
  requireSystemOrSuperAdmin
};
