const { PermissionError } = require('../utils/errors');
const { requireAuth } = require('./requireAuth');

function hasPermission(user, permissionKey) {
  return Array.isArray(user.permissions) && user.permissions.includes(permissionKey);
}

function requirePermission(permissionKey) {
  return async function permissionMiddleware(req, res, next) {
    requireAuth(req, res, (authError) => {
      if (authError) {
        next(authError);
        return;
      }

      if (!hasPermission(req.user, permissionKey)) {
        next(new PermissionError('Permission denied.'));
        return;
      }

      next();
    });
  };
}

module.exports = {
  requirePermission
};
