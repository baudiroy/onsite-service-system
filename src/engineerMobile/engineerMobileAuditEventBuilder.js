'use strict';

const SUPPORTED_ENGINEER_MOBILE_AUDIT_EVENT_TYPES = Object.freeze([
  'engineer_mobile.task_list.allow',
  'engineer_mobile.task_list.deny',
  'engineer_mobile.task_detail.allow',
  'engineer_mobile.task_detail.deny',
  'engineer_mobile.visit_action.allow',
  'engineer_mobile.visit_action.deny',
  'engineer_mobile.route_registration.success',
  'engineer_mobile.route_registration.failure',
]);

const ENGINEER_MOBILE_AUDIT_EVENT_KEYS = Object.freeze([
  'eventType',
  'occurredAt',
  'requestId',
  'actorType',
  'organizationId',
  'engineerId',
  'caseId',
  'appointmentId',
  'action',
  'decision',
  'reasonCode',
  'route',
  'method',
  'source',
  'metadata',
]);

const ENGINEER_MOBILE_AUDIT_METADATA_KEYS = Object.freeze([
  'routeMatched',
  'contextPresent',
  'identifierValid',
  'permissionPassed',
  'actionAllowed',
  'dependencyValid',
  'registrationResult',
]);

const VALID_EVENT_TYPES = new Set(SUPPORTED_ENGINEER_MOBILE_AUDIT_EVENT_TYPES);
const VALID_ACTOR_TYPES = new Set(['engineer', 'runtime', 'system']);
const VALID_DECISIONS = new Set(['allow', 'deny', 'success', 'failure']);
const VALID_METHODS = new Set(['GET', 'POST']);
const VALID_VISIT_ACTIONS = new Set([
  'engineer_mobile.start_travel',
  'engineer_mobile.arrive',
  'engineer_mobile.start_work',
  'engineer_mobile.finish_work',
  'engineer_mobile.record_visit_result',
]);
const VALID_AUDIT_REASON_CODES = new Set([
  'engineerMobile.unavailable',
  'invalid_input',
  'invalid_context',
  'invalid_identifier',
  'permission_denied',
  'assignment_not_found',
  'action_not_allowed',
  'service_unavailable',
  'mount_target_invalid',
  'route_registration_failed',
]);
const VALID_INVALID_RESULT_REASON_CODES = new Set([
  'invalid_input',
  'invalid_event_type',
  'invalid_event_matrix',
  'invalid_decision',
  'invalid_reason_code',
  'invalid_route',
  'invalid_method',
  'invalid_source',
  'invalid_action',
]);
const VALID_REGISTRATION_RESULTS = new Set(['success', 'failure', 'invalid', 'skipped', 'unavailable']);

const ROUTES = Object.freeze({
  TASK_LIST: '/engineer-mobile/tasks',
  TASK_DETAIL: '/engineer-mobile/tasks/:appointmentId',
  VISIT_ACTION: '/engineer-mobile/appointments/:appointmentId/actions/:action',
});

const EVENT_METADATA_MATRIX = Object.freeze({
  'engineer_mobile.task_list.allow': Object.freeze([
    'routeMatched',
    'contextPresent',
    'identifierValid',
    'permissionPassed',
  ]),
  'engineer_mobile.task_list.deny': Object.freeze([
    'routeMatched',
    'contextPresent',
    'identifierValid',
    'permissionPassed',
  ]),
  'engineer_mobile.task_detail.allow': Object.freeze([
    'routeMatched',
    'contextPresent',
    'identifierValid',
    'permissionPassed',
  ]),
  'engineer_mobile.task_detail.deny': Object.freeze([
    'routeMatched',
    'contextPresent',
    'identifierValid',
    'permissionPassed',
  ]),
  'engineer_mobile.visit_action.allow': Object.freeze([
    'routeMatched',
    'contextPresent',
    'identifierValid',
    'permissionPassed',
    'actionAllowed',
  ]),
  'engineer_mobile.visit_action.deny': Object.freeze([
    'routeMatched',
    'contextPresent',
    'identifierValid',
    'permissionPassed',
    'actionAllowed',
  ]),
  'engineer_mobile.route_registration.success': Object.freeze([
    'dependencyValid',
    'registrationResult',
  ]),
  'engineer_mobile.route_registration.failure': Object.freeze([
    'dependencyValid',
    'registrationResult',
  ]),
});

const EVENT_MATRIX = Object.freeze({
  'engineer_mobile.task_list.allow': Object.freeze({
    decision: 'allow',
    routes: Object.freeze([ROUTES.TASK_LIST]),
    methods: Object.freeze(['GET']),
    sources: Object.freeze(['engineer_mobile_task_list_handler']),
    actionAllowed: false,
    reasonCodeAllowed: false,
  }),
  'engineer_mobile.task_list.deny': Object.freeze({
    decision: 'deny',
    routes: Object.freeze([ROUTES.TASK_LIST]),
    methods: Object.freeze(['GET']),
    sources: Object.freeze(['engineer_mobile_task_list_handler']),
    actionAllowed: false,
    reasonCodeAllowed: true,
  }),
  'engineer_mobile.task_detail.allow': Object.freeze({
    decision: 'allow',
    routes: Object.freeze([ROUTES.TASK_DETAIL]),
    methods: Object.freeze(['GET']),
    sources: Object.freeze(['engineer_mobile_task_detail_handler']),
    actionAllowed: false,
    reasonCodeAllowed: false,
  }),
  'engineer_mobile.task_detail.deny': Object.freeze({
    decision: 'deny',
    routes: Object.freeze([ROUTES.TASK_DETAIL]),
    methods: Object.freeze(['GET']),
    sources: Object.freeze(['engineer_mobile_task_detail_handler']),
    actionAllowed: false,
    reasonCodeAllowed: true,
  }),
  'engineer_mobile.visit_action.allow': Object.freeze({
    decision: 'allow',
    routes: Object.freeze([ROUTES.VISIT_ACTION]),
    methods: Object.freeze(['POST']),
    sources: Object.freeze(['engineer_mobile_visit_action_handler']),
    actionAllowed: true,
    reasonCodeAllowed: false,
  }),
  'engineer_mobile.visit_action.deny': Object.freeze({
    decision: 'deny',
    routes: Object.freeze([ROUTES.VISIT_ACTION]),
    methods: Object.freeze(['POST']),
    sources: Object.freeze(['engineer_mobile_visit_action_handler']),
    actionAllowed: true,
    reasonCodeAllowed: true,
  }),
  'engineer_mobile.route_registration.success': Object.freeze({
    decision: 'success',
    routes: Object.freeze([
      ROUTES.TASK_LIST,
      ROUTES.TASK_DETAIL,
      ROUTES.VISIT_ACTION,
    ]),
    methods: Object.freeze(['GET', 'POST']),
    sources: Object.freeze(['engineer_mobile_route_registration']),
    actionAllowed: false,
    reasonCodeAllowed: false,
  }),
  'engineer_mobile.route_registration.failure': Object.freeze({
    decision: 'failure',
    routes: Object.freeze([
      ROUTES.TASK_LIST,
      ROUTES.TASK_DETAIL,
      ROUTES.VISIT_ACTION,
    ]),
    methods: Object.freeze(['GET', 'POST']),
    sources: Object.freeze(['engineer_mobile_route_registration']),
    actionAllowed: false,
    reasonCodeAllowed: true,
  }),
});

const ROUTE_METHOD_MATRIX = Object.freeze({
  [ROUTES.TASK_LIST]: 'GET',
  [ROUTES.TASK_DETAIL]: 'GET',
  [ROUTES.VISIT_ACTION]: 'POST',
});

const SAFE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9:_-]{0,127}$/;
const SAFE_OCCURRED_AT_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const UNSAFE_STRING_PATTERN = /bearer|authorization|token|secret|select|insert|update|delete|drop|postgres|database|password|stack|debug|sql|cookie|header/i;
const PHONE_LIKE_PATTERN = /^\+?[0-9][0-9\s().-]{7,}$/;
const RAW_CHANNEL_ID_PATTERN = /^U[0-9a-f]{16,}$/i;

function isPlainObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  if (typeof value.then === 'function') {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}

function stringValue(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function isUnsafeString(value) {
  return UNSAFE_STRING_PATTERN.test(value)
    || PHONE_LIKE_PATTERN.test(value)
    || RAW_CHANNEL_ID_PATTERN.test(value)
    || value.includes('@');
}

function safeIdentifier(value) {
  const candidate = stringValue(value);

  return candidate && SAFE_ID_PATTERN.test(candidate) && !isUnsafeString(candidate) ? candidate : undefined;
}

function safeSetValue(value, allowedValues) {
  const candidate = stringValue(value);

  return candidate && allowedValues.has(candidate) ? candidate : undefined;
}

function safeMethod(value) {
  const candidate = stringValue(value);

  return candidate && VALID_METHODS.has(candidate.toUpperCase()) ? candidate.toUpperCase() : undefined;
}

function safeOccurredAt(value) {
  const candidate = stringValue(value);

  return candidate && SAFE_OCCURRED_AT_PATTERN.test(candidate) ? candidate : undefined;
}

function decisionFromEventType(eventType) {
  if (eventType.endsWith('.allow')) {
    return 'allow';
  }

  if (eventType.endsWith('.deny')) {
    return 'deny';
  }

  if (eventType.endsWith('.success')) {
    return 'success';
  }

  if (eventType.endsWith('.failure')) {
    return 'failure';
  }

  return undefined;
}

function safeInvalid(reasonCode) {
  const safeReasonCode = safeSetValue(reasonCode, VALID_INVALID_RESULT_REASON_CODES) || 'invalid_event_matrix';

  return {
    ok: false,
    reasonCode: safeReasonCode,
  };
}

function hasInputValue(input, key) {
  return Object.prototype.hasOwnProperty.call(input, key) && input[key] !== undefined;
}

function safeMatrixValue(input, key, allowedValues, invalidReasonCode) {
  if (!hasInputValue(input, key)) {
    return {
      ok: true,
      value: undefined,
    };
  }

  const value = safeSetValue(input[key], allowedValues);

  return value
    ? {
      ok: true,
      value,
    }
    : safeInvalid(invalidReasonCode);
}

function safeMatrixMethod(input, matrix) {
  if (!hasInputValue(input, 'method')) {
    return {
      ok: true,
      value: undefined,
    };
  }

  const method = safeMethod(input.method);

  if (!method || !matrix.methods.includes(method)) {
    return safeInvalid('invalid_method');
  }

  return {
    ok: true,
    value: method,
  };
}

function safeMatrixReasonCode(input, matrix) {
  if (!hasInputValue(input, 'reasonCode')) {
    return {
      ok: true,
      value: undefined,
    };
  }

  if (!matrix.reasonCodeAllowed) {
    return safeInvalid('invalid_reason_code');
  }

  const reasonCode = safeSetValue(input.reasonCode, VALID_AUDIT_REASON_CODES);

  return reasonCode
    ? {
      ok: true,
      value: reasonCode,
    }
    : safeInvalid('invalid_reason_code');
}

function safeMatrixAction(input, matrix) {
  if (!hasInputValue(input, 'action')) {
    return matrix.actionAllowed
      ? safeInvalid('invalid_action')
      : {
        ok: true,
        value: undefined,
      };
  }

  if (!matrix.actionAllowed) {
    return safeInvalid('invalid_action');
  }

  const action = safeSetValue(input.action, VALID_VISIT_ACTIONS);

  return action
    ? {
      ok: true,
      value: action,
    }
    : safeInvalid('invalid_action');
}

function metadataKeyAllowed(eventType, key) {
  const allowedKeys = EVENT_METADATA_MATRIX[eventType];

  return Array.isArray(allowedKeys) && allowedKeys.includes(key);
}

function metadataBooleanAllowed(eventType, key, value) {
  if (!metadataKeyAllowed(eventType, key) || (value !== true && value !== false)) {
    return false;
  }

  if (eventType.endsWith('.allow') && value === false) {
    return false;
  }

  if (eventType === 'engineer_mobile.route_registration.success' && key === 'dependencyValid') {
    return value === true;
  }

  return true;
}

function metadataRegistrationResult(eventType, value) {
  if (!metadataKeyAllowed(eventType, 'registrationResult')) {
    return undefined;
  }

  const registrationResult = safeSetValue(value, VALID_REGISTRATION_RESULTS);

  if (!registrationResult) {
    return undefined;
  }

  if (eventType === 'engineer_mobile.route_registration.success') {
    return registrationResult === 'success' ? registrationResult : undefined;
  }

  if (eventType === 'engineer_mobile.route_registration.failure') {
    return registrationResult === 'success' ? undefined : registrationResult;
  }

  return undefined;
}

function sanitizedMetadata(value, eventType) {
  if (!isPlainObject(value)) {
    return undefined;
  }

  const metadata = {};

  for (const key of [
    'routeMatched',
    'contextPresent',
    'identifierValid',
    'permissionPassed',
    'actionAllowed',
    'dependencyValid',
  ]) {
    if (metadataBooleanAllowed(eventType, key, value[key])) {
      metadata[key] = value[key];
    }
  }

  const registrationResult = metadataRegistrationResult(eventType, value.registrationResult);

  if (registrationResult) {
    metadata.registrationResult = registrationResult;
  }

  return Object.keys(metadata).length > 0 ? metadata : undefined;
}

function routeMethodMatches(route, method) {
  if (!route || !method) {
    return true;
  }

  return ROUTE_METHOD_MATRIX[route] === method;
}

function normalizedMatrixFields(input, eventType) {
  const matrix = EVENT_MATRIX[eventType];

  if (!matrix) {
    return safeInvalid('invalid_event_matrix');
  }

  const decision = hasInputValue(input, 'decision')
    ? safeSetValue(input.decision, VALID_DECISIONS)
    : decisionFromEventType(eventType);

  if (decision !== matrix.decision) {
    return safeInvalid('invalid_decision');
  }

  const reasonCodeResult = safeMatrixReasonCode(input, matrix);

  if (reasonCodeResult.ok === false) {
    return reasonCodeResult;
  }

  const routeResult = safeMatrixValue(input, 'route', new Set(matrix.routes), 'invalid_route');

  if (routeResult.ok === false) {
    return routeResult;
  }

  const methodResult = safeMatrixMethod(input, matrix);

  if (methodResult.ok === false) {
    return methodResult;
  }

  if (!routeMethodMatches(routeResult.value, methodResult.value)) {
    return safeInvalid('invalid_method');
  }

  const sourceResult = safeMatrixValue(input, 'source', new Set(matrix.sources), 'invalid_source');

  if (sourceResult.ok === false) {
    return sourceResult;
  }

  const actionResult = safeMatrixAction(input, matrix);

  if (actionResult.ok === false) {
    return actionResult;
  }

  return {
    ok: true,
    action: actionResult.value,
    decision,
    method: methodResult.value,
    reasonCode: reasonCodeResult.value,
    route: routeResult.value,
    source: sourceResult.value,
  };
}

function buildEngineerMobileAuditEvent(input) {
  if (!isPlainObject(input)) {
    return safeInvalid('invalid_input');
  }

  const eventType = safeSetValue(input.eventType, VALID_EVENT_TYPES);

  if (!eventType) {
    return safeInvalid('invalid_event_type');
  }

  const matrixFields = normalizedMatrixFields(input, eventType);

  if (matrixFields.ok === false) {
    return matrixFields;
  }

  const auditEvent = {
    eventType,
  };
  const fields = {
    occurredAt: safeOccurredAt(input.occurredAt),
    requestId: safeIdentifier(input.requestId),
    actorType: safeSetValue(input.actorType, VALID_ACTOR_TYPES),
    organizationId: safeIdentifier(input.organizationId),
    engineerId: safeIdentifier(input.engineerId),
    caseId: safeIdentifier(input.caseId),
    appointmentId: safeIdentifier(input.appointmentId),
    action: matrixFields.action,
    decision: matrixFields.decision,
    reasonCode: matrixFields.reasonCode,
    route: matrixFields.route,
    method: matrixFields.method,
    source: matrixFields.source,
    metadata: sanitizedMetadata(input.metadata, eventType),
  };

  for (const key of ENGINEER_MOBILE_AUDIT_EVENT_KEYS) {
    if (key === 'eventType') {
      continue;
    }

    if (fields[key] !== undefined) {
      auditEvent[key] = fields[key];
    }
  }

  return {
    ok: true,
    auditEvent,
  };
}

module.exports = {
  ENGINEER_MOBILE_AUDIT_EVENT_KEYS,
  ENGINEER_MOBILE_AUDIT_METADATA_KEYS,
  SUPPORTED_ENGINEER_MOBILE_AUDIT_EVENT_TYPES,
  buildEngineerMobileAuditEvent,
};
