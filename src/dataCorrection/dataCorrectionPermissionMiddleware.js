'use strict';

const DATA_CORRECTION_PERMISSION_ACTIONS = Object.freeze({
  DATA_CORRECTION_REQUEST: 'data_correction_request',
  FOLLOW_UP_PROPOSAL: 'follow_up_proposal',
  POST_DEPARTURE_FREEZE: 'post_departure_freeze',
  PRE_DEPARTURE_APPLY: 'pre_departure_apply',
  UNABLE_TO_COMPLETE_RESULT: 'unable_to_complete_result',
});

const DATA_CORRECTION_PERMISSION_ACTION_ORDER = Object.freeze([
  DATA_CORRECTION_PERMISSION_ACTIONS.DATA_CORRECTION_REQUEST,
  DATA_CORRECTION_PERMISSION_ACTIONS.FOLLOW_UP_PROPOSAL,
  DATA_CORRECTION_PERMISSION_ACTIONS.POST_DEPARTURE_FREEZE,
  DATA_CORRECTION_PERMISSION_ACTIONS.PRE_DEPARTURE_APPLY,
  DATA_CORRECTION_PERMISSION_ACTIONS.UNABLE_TO_COMPLETE_RESULT,
]);

const DATA_CORRECTION_ACTION_PERMISSION_MAP = Object.freeze({
  [DATA_CORRECTION_PERMISSION_ACTIONS.DATA_CORRECTION_REQUEST]: 'case.correction.request',
  [DATA_CORRECTION_PERMISSION_ACTIONS.FOLLOW_UP_PROPOSAL]: 'appointment.follow_up.propose',
  [DATA_CORRECTION_PERMISSION_ACTIONS.POST_DEPARTURE_FREEZE]: 'case.correction.request',
  [DATA_CORRECTION_PERMISSION_ACTIONS.PRE_DEPARTURE_APPLY]: 'case.correction.apply',
  [DATA_CORRECTION_PERMISSION_ACTIONS.UNABLE_TO_COMPLETE_RESULT]: 'appointment.result.record',
});

const DATA_CORRECTION_ACTION_PERMISSION_ALIASES = Object.freeze({
  [DATA_CORRECTION_PERMISSION_ACTIONS.DATA_CORRECTION_REQUEST]: Object.freeze([
    'data_correction.request',
  ]),
  [DATA_CORRECTION_PERMISSION_ACTIONS.FOLLOW_UP_PROPOSAL]: Object.freeze([
    'dispatch.follow_up.propose',
  ]),
  [DATA_CORRECTION_PERMISSION_ACTIONS.POST_DEPARTURE_FREEZE]: Object.freeze([
    'data_correction.request',
  ]),
  [DATA_CORRECTION_PERMISSION_ACTIONS.PRE_DEPARTURE_APPLY]: Object.freeze([
    'data_correction.apply',
  ]),
  [DATA_CORRECTION_PERMISSION_ACTIONS.UNABLE_TO_COMPLETE_RESULT]: Object.freeze([]),
});

const DATA_CORRECTION_PERMISSION_ACTION_PERMISSION_CONTRACT = Object.freeze({
  ACTION_ORDER: DATA_CORRECTION_PERMISSION_ACTION_ORDER,
  CANONICAL_PERMISSION_MAP: DATA_CORRECTION_ACTION_PERMISSION_MAP,
  ALIAS_PERMISSION_MAP: DATA_CORRECTION_ACTION_PERMISSION_ALIASES,
});

const DATA_CORRECTION_PERMISSION_ACTION_SOURCE_PATHS = Object.freeze([
  'body.actionType',
  'body.payload.actionType',
]);

const DATA_CORRECTION_GENERAL_CORRECTION_ROLES = Object.freeze([
  'admin',
  'customer_service',
  'dispatch_assistant',
  'supervisor',
]);

const DATA_CORRECTION_ENGINEER_ALLOWED_ACTIONS = Object.freeze([
  DATA_CORRECTION_PERMISSION_ACTIONS.UNABLE_TO_COMPLETE_RESULT,
]);

const DATA_CORRECTION_PERMISSION_ROLE_CONTRACT = Object.freeze({
  GENERAL_CORRECTION_ROLES: DATA_CORRECTION_GENERAL_CORRECTION_ROLES,
  ENGINEER_ALLOWED_ACTIONS: DATA_CORRECTION_ENGINEER_ALLOWED_ACTIONS,
});

const GENERAL_CORRECTION_ROLES = new Set(DATA_CORRECTION_GENERAL_CORRECTION_ROLES);

const ENGINEER_ALLOWED_ACTIONS = new Set(DATA_CORRECTION_ENGINEER_ALLOWED_ACTIONS);

const DATA_CORRECTION_PERMISSION_STATUS_CODES = Object.freeze({
  FORBIDDEN: 403,
  OK: 200,
});

const DATA_CORRECTION_PERMISSION_SAFE_DENY_RESPONSE = Object.freeze({
  status: 'deny',
  messageKey: 'dataCorrection.unavailable',
  data: null,
});

const DATA_CORRECTION_PERMISSION_CONTEXT_KEYS = Object.freeze([
  'organizationId',
  'userId',
  'role',
  'permissions',
  'allowedActionTypes',
]);

const DATA_CORRECTION_PERMISSION_REQUEST_CONTEXT_KEYS = Object.freeze({
  AUTH: 'auth',
  PERMISSION_CONTEXT: 'dataCorrectionPermissionContext',
});

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function safeString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function safePermissions(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((permission) => typeof permission === 'string' && permission.trim())
    .map((permission) => permission.trim());
}

function permissionsForAction(actionType) {
  const canonicalPermission = DATA_CORRECTION_ACTION_PERMISSION_MAP[actionType];

  if (!canonicalPermission) {
    return [];
  }

  return [
    canonicalPermission,
    ...(DATA_CORRECTION_ACTION_PERMISSION_ALIASES[actionType] || []),
  ];
}

function actionSourceValueFor(path, body, payload) {
  if (path === 'body.actionType') {
    return body.actionType;
  }

  if (path === 'body.payload.actionType') {
    return payload.actionType;
  }

  return undefined;
}

function resolveActionType(req) {
  const body = isPlainObject(req && req.body) ? req.body : {};
  const payload = isPlainObject(body.payload) ? body.payload : {};
  const actionSourceValues = DATA_CORRECTION_PERMISSION_ACTION_SOURCE_PATHS.map((path) => (
    actionSourceValueFor(path, body, payload)
  ));

  return normalize(actionSourceValues[0] || actionSourceValues[1]);
}

function isAiRole(role) {
  return normalize(role) === 'ai';
}

function roleCanAttemptAction(role, actionType) {
  const normalizedRole = normalize(role);

  if (GENERAL_CORRECTION_ROLES.has(normalizedRole)) {
    return true;
  }

  if (normalizedRole === 'engineer') {
    return ENGINEER_ALLOWED_ACTIONS.has(actionType);
  }

  return false;
}

function allowedActionTypesFor(role, permissions) {
  const safePermissionSet = new Set(safePermissions(permissions));

  return DATA_CORRECTION_PERMISSION_ACTION_ORDER
    .filter((actionType) => (
      roleCanAttemptAction(role, actionType)
      && permissionsForAction(actionType).some((permission) => safePermissionSet.has(permission))
    ))
    .map((actionType) => actionType);
}

function safeDeny() {
  return {
    allowed: false,
    statusCode: DATA_CORRECTION_PERMISSION_STATUS_CODES.FORBIDDEN,
    responseBody: { ...DATA_CORRECTION_PERMISSION_SAFE_DENY_RESPONSE },
  };
}

function safeAllow(auth, actionType, permissions) {
  return {
    allowed: true,
    statusCode: DATA_CORRECTION_PERMISSION_STATUS_CODES.OK,
    permissionContext: {
      organizationId: safeString(auth.organizationId),
      userId: safeString(auth.userId),
      role: safeString(auth.role),
      permissions: safePermissions(permissions),
      allowedActionTypes: allowedActionTypesFor(auth.role, permissions),
    },
  };
}

function evaluateDataCorrectionPermission(req) {
  const request = isPlainObject(req) ? req : {};
  const auth = isPlainObject(request[DATA_CORRECTION_PERMISSION_REQUEST_CONTEXT_KEYS.AUTH])
    ? request[DATA_CORRECTION_PERMISSION_REQUEST_CONTEXT_KEYS.AUTH]
    : {};
  const permissions = safePermissions(auth.permissions);
  const actionType = resolveActionType(request);
  const allowedPermissions = permissionsForAction(actionType);

  if (
    !safeString(auth.organizationId)
    || !safeString(auth.userId)
    || !safeString(auth.role)
    || permissions.length === 0
    || allowedPermissions.length === 0
  ) {
    return safeDeny();
  }

  if (isAiRole(auth.role)) {
    return safeDeny();
  }

  if (!roleCanAttemptAction(auth.role, actionType)) {
    return safeDeny();
  }

  if (!allowedPermissions.some((permission) => permissions.includes(permission))) {
    return safeDeny();
  }

  return safeAllow(auth, actionType, permissions);
}

function writeDeniedResponse(res, decision) {
  if (!res || typeof res.status !== 'function' || typeof res.json !== 'function') {
    return decision;
  }

  return res.status(decision.statusCode).json(decision.responseBody);
}

function createDataCorrectionPermissionMiddleware() {
  return function dataCorrectionPermissionMiddleware(req, res, next) {
    const decision = evaluateDataCorrectionPermission(req);

    if (!decision.allowed) {
      return writeDeniedResponse(res, decision);
    }

    if (isPlainObject(req)) {
      req[DATA_CORRECTION_PERMISSION_REQUEST_CONTEXT_KEYS.PERMISSION_CONTEXT] = decision.permissionContext;
    }

    if (typeof next === 'function') {
      return next();
    }

    return decision;
  };
}

module.exports = {
  DATA_CORRECTION_ACTION_PERMISSION_MAP,
  DATA_CORRECTION_ACTION_PERMISSION_ALIASES,
  DATA_CORRECTION_PERMISSION_ACTION_PERMISSION_CONTRACT,
  DATA_CORRECTION_PERMISSION_ROLE_CONTRACT,
  DATA_CORRECTION_PERMISSION_ACTIONS,
  DATA_CORRECTION_PERMISSION_ACTION_ORDER,
  DATA_CORRECTION_PERMISSION_ACTION_SOURCE_PATHS,
  DATA_CORRECTION_PERMISSION_CONTEXT_KEYS,
  DATA_CORRECTION_PERMISSION_REQUEST_CONTEXT_KEYS,
  DATA_CORRECTION_PERMISSION_SAFE_DENY_RESPONSE,
  DATA_CORRECTION_PERMISSION_STATUS_CODES,
  createDataCorrectionPermissionMiddleware,
  evaluateDataCorrectionPermission,
};
