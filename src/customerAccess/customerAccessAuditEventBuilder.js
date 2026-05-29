'use strict';

const SUPPORTED_CUSTOMER_ACCESS_AUDIT_EVENT_TYPES = Object.freeze([
  'customer_access.case_overview.allow',
  'customer_access.case_overview.deny',
  'customer_access.service_report.allow',
  'customer_access.service_report.deny',
  'customer_access.route_registration.success',
  'customer_access.route_registration.failure',
]);

const CUSTOMER_ACCESS_AUDIT_EVENT_KEYS = Object.freeze([
  'eventType',
  'occurredAt',
  'requestId',
  'actorType',
  'organizationId',
  'customerId',
  'caseId',
  'reportId',
  'decision',
  'reasonCode',
  'route',
  'method',
  'source',
  'metadata',
]);

const CUSTOMER_ACCESS_AUDIT_METADATA_KEYS = Object.freeze([
  'routeMatched',
  'contextPresent',
  'identifierValid',
  'dependencyValid',
  'registrationResult',
]);

const VALID_EVENT_TYPES = new Set(SUPPORTED_CUSTOMER_ACCESS_AUDIT_EVENT_TYPES);
const VALID_ACTOR_TYPES = new Set(['customer', 'runtime', 'system']);
const VALID_DECISIONS = new Set(['allow', 'deny', 'success', 'failure']);
const VALID_METHODS = new Set(['GET']);
const VALID_AUDIT_REASON_CODES = new Set([
  'customerAccess.unavailable',
  'invalid_input',
  'invalid_context',
  'invalid_identifier',
  'access_denied',
  'not_found',
  'service_unavailable',
  'mount_target_invalid',
  'db_client_invalid',
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
]);
const VALID_REGISTRATION_RESULTS = new Set(['success', 'failure', 'invalid', 'skipped', 'unavailable']);
const EVENT_MATRIX = Object.freeze({
  'customer_access.case_overview.allow': Object.freeze({
    decision: 'allow',
    routes: Object.freeze(['/customer-access/:caseId']),
    sources: Object.freeze(['customer_access_controller', 'customer_access_context_middleware']),
    reasonCodeAllowed: false,
  }),
  'customer_access.case_overview.deny': Object.freeze({
    decision: 'deny',
    routes: Object.freeze(['/customer-access/:caseId']),
    sources: Object.freeze(['customer_access_controller', 'customer_access_context_middleware']),
    reasonCodeAllowed: true,
  }),
  'customer_access.service_report.allow': Object.freeze({
    decision: 'allow',
    routes: Object.freeze(['/customer-access/:caseId/service-report/:reportId']),
    sources: Object.freeze(['customer_access_projection_service', 'customer_access_controller']),
    reasonCodeAllowed: false,
  }),
  'customer_access.service_report.deny': Object.freeze({
    decision: 'deny',
    routes: Object.freeze(['/customer-access/:caseId/service-report/:reportId']),
    sources: Object.freeze(['customer_access_projection_service', 'customer_access_controller']),
    reasonCodeAllowed: true,
  }),
  'customer_access.route_registration.success': Object.freeze({
    decision: 'success',
    routes: Object.freeze([
      '/customer-access/:caseId',
      '/customer-access/:caseId/service-report/:reportId',
    ]),
    sources: Object.freeze(['customer_access_route_registration']),
    reasonCodeAllowed: false,
  }),
  'customer_access.route_registration.failure': Object.freeze({
    decision: 'failure',
    routes: Object.freeze([
      '/customer-access/:caseId',
      '/customer-access/:caseId/service-report/:reportId',
    ]),
    sources: Object.freeze(['customer_access_route_registration']),
    reasonCodeAllowed: true,
  }),
});
const SAFE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9:_-]{0,127}$/;
const SAFE_OCCURRED_AT_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const UNSAFE_STRING_PATTERN = /bearer|authorization|token|secret|select|insert|update|delete|drop|postgres|database|password|stack|debug|sql/i;
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

function sanitizedMetadata(value) {
  if (!isPlainObject(value)) {
    return undefined;
  }

  const metadata = {};

  for (const key of ['routeMatched', 'contextPresent', 'identifierValid', 'dependencyValid']) {
    if (value[key] === true || value[key] === false) {
      metadata[key] = value[key];
    }
  }

  const registrationResult = safeSetValue(value.registrationResult, VALID_REGISTRATION_RESULTS);

  if (registrationResult) {
    metadata.registrationResult = registrationResult;
  }

  return Object.keys(metadata).length > 0 ? metadata : undefined;
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

function safeMatrixMethod(input) {
  if (!hasInputValue(input, 'method')) {
    return {
      ok: true,
      value: undefined,
    };
  }

  const method = safeMethod(input.method);

  return method
    ? {
      ok: true,
      value: method,
    }
    : safeInvalid('invalid_method');
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

  const methodResult = safeMatrixMethod(input);

  if (methodResult.ok === false) {
    return methodResult;
  }

  const sourceResult = safeMatrixValue(input, 'source', new Set(matrix.sources), 'invalid_source');

  if (sourceResult.ok === false) {
    return sourceResult;
  }

  return {
    ok: true,
    decision,
    reasonCode: reasonCodeResult.value,
    route: routeResult.value,
    method: methodResult.value,
    source: sourceResult.value,
  };
}

function buildCustomerAccessAuditEvent(input) {
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
    customerId: safeIdentifier(input.customerId),
    caseId: safeIdentifier(input.caseId),
    reportId: safeIdentifier(input.reportId),
    decision: matrixFields.decision,
    reasonCode: matrixFields.reasonCode,
    route: matrixFields.route,
    method: matrixFields.method,
    source: matrixFields.source,
    metadata: sanitizedMetadata(input.metadata),
  };

  for (const key of CUSTOMER_ACCESS_AUDIT_EVENT_KEYS) {
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
  CUSTOMER_ACCESS_AUDIT_EVENT_KEYS,
  CUSTOMER_ACCESS_AUDIT_METADATA_KEYS,
  SUPPORTED_CUSTOMER_ACCESS_AUDIT_EVENT_TYPES,
  buildCustomerAccessAuditEvent,
};
