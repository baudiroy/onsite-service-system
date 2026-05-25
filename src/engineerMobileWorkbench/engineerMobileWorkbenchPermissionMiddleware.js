'use strict';

const ENGINEER_MOBILE_WORKBENCH_REQUIRED_PERMISSIONS = Object.freeze([
  'engineer_mobile.tasks.read',
  'engineer_mobile.tasks.read.assigned',
  'engineer_mobile.workbench.access',
]);

const ENGINEER_MOBILE_WORKBENCH_ALLOWED_ROLES = Object.freeze([
  'admin',
  'dispatch_assistant',
  'engineer',
  'supervisor',
]);

const ENGINEER_MOBILE_WORKBENCH_PERMISSION_DENIED_RESPONSE = Object.freeze({
  status: 'deny',
  messageKey: 'engineerMobileWorkbench.unavailable',
  data: null,
});

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function safeString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function safePermissions(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((permission) => typeof permission === 'string' && permission.trim())
    .map((permission) => permission.trim());
}

function normalizeRole(value) {
  return String(value || '').trim().toLowerCase();
}

function hasWorkbenchPermission(permissions) {
  const permissionSet = new Set(safePermissions(permissions));

  return ENGINEER_MOBILE_WORKBENCH_REQUIRED_PERMISSIONS.some((permission) => (
    permissionSet.has(permission)
  ));
}

function safeDeny() {
  return {
    allowed: false,
    statusCode: 403,
    responseBody: { ...ENGINEER_MOBILE_WORKBENCH_PERMISSION_DENIED_RESPONSE },
  };
}

function safeAllow(auth, permissions) {
  return {
    allowed: true,
    statusCode: 200,
    permissionContext: {
      organizationId: safeString(auth.organizationId),
      userId: safeString(auth.userId),
      engineerId: safeString(auth.engineerId),
      role: normalizeRole(auth.role),
      permissions: safePermissions(permissions),
    },
  };
}

function buildEngineerMobileWorkbenchPermissionContext(req, options = {}) {
  const request = isPlainObject(req) ? req : {};
  const auth = isPlainObject(request.auth) ? request.auth : {};
  const permissions = safePermissions(auth.permissions);
  const role = normalizeRole(auth.role);
  const allowedRoles = new Set(
    Array.isArray(options.allowedRoles)
      ? options.allowedRoles.map(normalizeRole)
      : ENGINEER_MOBILE_WORKBENCH_ALLOWED_ROLES,
  );

  if (
    !safeString(auth.organizationId)
    || !safeString(auth.userId)
    || !safeString(auth.engineerId)
    || !role
    || permissions.length === 0
  ) {
    return safeDeny();
  }

  if (role === 'ai' || !allowedRoles.has(role)) {
    return safeDeny();
  }

  if (!hasWorkbenchPermission(permissions)) {
    return safeDeny();
  }

  return safeAllow(auth, permissions);
}

function writeDeniedResponse(res, decision) {
  if (!res || typeof res.status !== 'function' || typeof res.json !== 'function') {
    return decision;
  }

  return res.status(decision.statusCode).json(decision.responseBody);
}

function createEngineerMobileWorkbenchPermissionMiddleware(options = {}) {
  return function engineerMobileWorkbenchPermissionMiddleware(req, res, next) {
    const decision = buildEngineerMobileWorkbenchPermissionContext(req, options);

    if (!decision.allowed) {
      return writeDeniedResponse(res, decision);
    }

    if (isPlainObject(req)) {
      req.engineerMobileWorkbenchPermissionContext = decision.permissionContext;
    }

    if (typeof next === 'function') {
      return next();
    }

    return decision;
  };
}

module.exports = {
  ENGINEER_MOBILE_WORKBENCH_ALLOWED_ROLES,
  ENGINEER_MOBILE_WORKBENCH_REQUIRED_PERMISSIONS,
  buildEngineerMobileWorkbenchPermissionContext,
  createEngineerMobileWorkbenchPermissionMiddleware,
};
