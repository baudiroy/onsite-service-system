'use strict';

const ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_ACTIONS = Object.freeze({
  TASK_DETAIL: 'task_detail',
  TASK_LIST: 'task_list',
});

const ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_DECISIONS = Object.freeze({
  ALLOW: 'allow',
  DENY: 'deny',
});

const ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_REASON_KEYS = Object.freeze({
  ALLOWED: 'engineer_mobile.assignment.allowed',
  ASSIGNMENT_NOT_ALLOWED: 'engineer_mobile.assignment.not_allowed',
  CROSS_ORGANIZATION: 'engineer_mobile.assignment.cross_organization',
  MISSING_ASSIGNMENT: 'engineer_mobile.assignment.missing',
  MISSING_PERMISSION: 'engineer_mobile.assignment.missing_permission',
  MISSING_SCOPE: 'engineer_mobile.assignment.missing_scope',
  ROLE_NOT_ALLOWED: 'engineer_mobile.assignment.role_not_allowed',
  UNSUPPORTED_ACTION: 'engineer_mobile.assignment.unsupported_action',
});

const ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_REQUIRED_PERMISSIONS = Object.freeze([
  'engineer_mobile.tasks.read',
  'engineer_mobile.tasks.read.assigned',
  'engineer_mobile.workbench.access',
]);

const ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_ALLOWED_ROLES = Object.freeze([
  'admin',
  'dispatch_assistant',
  'engineer',
  'supervisor',
]);

const ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_PRIVILEGED_ROLES = Object.freeze([
  'admin',
  'dispatch_assistant',
  'supervisor',
]);

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function safeString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function safeStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(safeString)
    .filter(Boolean);
}

function normalizeRole(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeAction(value) {
  const action = safeString(value);

  if (!action) {
    return undefined;
  }

  return Object.values(ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_ACTIONS).includes(action)
    ? action
    : undefined;
}

function pickObject(...values) {
  return values.find(isPlainObject) || {};
}

function readString(source, ...keys) {
  const object = isPlainObject(source) ? source : {};

  for (const key of keys) {
    const value = safeString(object[key]);

    if (value) {
      return value;
    }
  }

  return undefined;
}

function readStringList(source, ...keys) {
  const object = isPlainObject(source) ? source : {};

  for (const key of keys) {
    const values = safeStringArray(object[key]);

    if (values.length > 0) {
      return values;
    }
  }

  return [];
}

function extractAuth(input) {
  const source = isPlainObject(input) ? input : {};

  return pickObject(
    source.auth,
    source.permissionContext,
    source.actor,
    source.context,
    source,
  );
}

function extractAssignment(input) {
  const source = isPlainObject(input) ? input : {};

  return pickObject(
    source.assignment,
    source.assignmentContext,
    source.taskScope,
    source.task,
  );
}

function extractPermissionContext(auth) {
  return {
    engineerId: readString(auth, 'engineerId', 'engineer_id'),
    organizationId: readString(auth, 'organizationId', 'organization_id'),
    permissions: readStringList(auth, 'permissions'),
    role: normalizeRole(auth.role),
    userId: readString(auth, 'userId', 'user_id'),
  };
}

function extractAssignmentContext(assignment) {
  return {
    assignedEngineerId: readString(
      assignment,
      'assignedEngineerId',
      'assigned_engineer_id',
      'engineerId',
      'engineer_id',
    ),
    eligibleEngineerIds: readStringList(
      assignment,
      'eligibleEngineerIds',
      'eligible_engineer_ids',
      'assignedEngineerIds',
      'assigned_engineer_ids',
      'engineerIds',
      'engineer_ids',
    ),
    organizationId: readString(assignment, 'organizationId', 'organization_id'),
  };
}

function hasRequiredPermission(permissions) {
  const permissionSet = new Set(safeStringArray(permissions));

  return ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_REQUIRED_PERMISSIONS
    .some((permission) => permissionSet.has(permission));
}

function isAllowedRole(role) {
  return ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_ALLOWED_ROLES.includes(role);
}

function isPrivilegedRole(role) {
  return ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_PRIVILEGED_ROLES.includes(role);
}

function isAssignedToEngineer(permissionContext, assignmentContext) {
  if (
    assignmentContext.assignedEngineerId
    && assignmentContext.assignedEngineerId === permissionContext.engineerId
  ) {
    return true;
  }

  return assignmentContext.eligibleEngineerIds.includes(permissionContext.engineerId);
}

function hasInScopeAssignment(permissionContext, assignmentContext) {
  if (isPrivilegedRole(permissionContext.role)) {
    return true;
  }

  return isAssignedToEngineer(permissionContext, assignmentContext);
}

function buildScope(permissionContext, assignmentContext, allowed) {
  const scope = {};

  if (permissionContext.organizationId) {
    scope.organizationId = permissionContext.organizationId;
  }

  if (permissionContext.engineerId) {
    scope.engineerId = permissionContext.engineerId;
  }

  if (allowed && assignmentContext.assignedEngineerId) {
    scope.assignedEngineerId = assignmentContext.assignedEngineerId;
  }

  return scope;
}

function buildAuditIntent({
  action,
  allowed,
  permissionContext,
  reasonKey,
}) {
  const auditIntent = {
    action: action || 'unknown',
    reasonKey,
    result: allowed
      ? ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_DECISIONS.ALLOW
      : ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_DECISIONS.DENY,
    type: 'engineer_mobile.permission_assignment_decision',
  };

  if (permissionContext.organizationId) {
    auditIntent.organizationId = permissionContext.organizationId;
  }

  if (permissionContext.userId) {
    auditIntent.userId = permissionContext.userId;
  }

  if (permissionContext.engineerId) {
    auditIntent.engineerId = permissionContext.engineerId;
  }

  if (permissionContext.role) {
    auditIntent.role = permissionContext.role;
  }

  return auditIntent;
}

function buildDecision({
  action,
  allowed,
  assignmentContext,
  permissionContext,
  reasonKey,
}) {
  return {
    allowed,
    auditIntent: buildAuditIntent({
      action,
      allowed,
      permissionContext,
      reasonKey,
    }),
    decision: allowed
      ? ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_DECISIONS.ALLOW
      : ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_DECISIONS.DENY,
    reasonKey,
    scope: buildScope(permissionContext, assignmentContext, allowed),
    action: action || 'unknown',
  };
}

function deny(reasonKey, action, permissionContext, assignmentContext) {
  return buildDecision({
    action,
    allowed: false,
    assignmentContext,
    permissionContext,
    reasonKey,
  });
}

function evaluateEngineerMobilePermissionAssignment(input = {}) {
  const request = isPlainObject(input) ? input : {};
  const action = normalizeAction(request.action);
  const permissionContext = extractPermissionContext(extractAuth(request));
  const assignmentContext = extractAssignmentContext(extractAssignment(request));

  if (!action) {
    return deny(
      ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_REASON_KEYS.UNSUPPORTED_ACTION,
      undefined,
      permissionContext,
      assignmentContext,
    );
  }

  if (
    !permissionContext.organizationId
    || !permissionContext.userId
    || !permissionContext.engineerId
    || !permissionContext.role
  ) {
    return deny(
      ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_REASON_KEYS.MISSING_SCOPE,
      action,
      permissionContext,
      assignmentContext,
    );
  }

  if (!isAllowedRole(permissionContext.role) || permissionContext.role === 'ai') {
    return deny(
      ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_REASON_KEYS.ROLE_NOT_ALLOWED,
      action,
      permissionContext,
      assignmentContext,
    );
  }

  if (!hasRequiredPermission(permissionContext.permissions)) {
    return deny(
      ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_REASON_KEYS.MISSING_PERMISSION,
      action,
      permissionContext,
      assignmentContext,
    );
  }

  if (!assignmentContext.organizationId) {
    return deny(
      ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_REASON_KEYS.MISSING_ASSIGNMENT,
      action,
      permissionContext,
      assignmentContext,
    );
  }

  if (assignmentContext.organizationId !== permissionContext.organizationId) {
    return deny(
      ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_REASON_KEYS.CROSS_ORGANIZATION,
      action,
      permissionContext,
      assignmentContext,
    );
  }

  if (!hasInScopeAssignment(permissionContext, assignmentContext)) {
    return deny(
      ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_REASON_KEYS.ASSIGNMENT_NOT_ALLOWED,
      action,
      permissionContext,
      assignmentContext,
    );
  }

  return buildDecision({
    action,
    allowed: true,
    assignmentContext,
    permissionContext,
    reasonKey: ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_REASON_KEYS.ALLOWED,
  });
}

module.exports = {
  ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_ACTIONS,
  ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_ALLOWED_ROLES,
  ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_DECISIONS,
  ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_REASON_KEYS,
  ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_REQUIRED_PERMISSIONS,
  evaluateEngineerMobilePermissionAssignment,
};
