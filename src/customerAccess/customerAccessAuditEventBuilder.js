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
const VALID_ROUTES = new Set([
  '/customer-access/:caseId',
  '/customer-access/:caseId/service-report/:reportId',
]);
const VALID_SOURCES = new Set([
  'customer_access_route',
  'customer_access_controller',
  'customer_access_context',
  'customer_access_http_adapter',
  'customer_access_projection',
  'route_registration',
  'synthetic_test',
]);
const VALID_REASON_CODES = new Set([
  'mount_target_invalid',
  'db_client_invalid',
  'route_registration_failed',
  'customer_access_unavailable',
  'context_missing',
  'identifier_invalid',
  'dependency_invalid',
  'publication_not_allowed',
  'policy_failed',
  'invalid_input',
  'invalid_event_type',
]);
const VALID_REGISTRATION_RESULTS = new Set(['success', 'failure', 'invalid', 'skipped', 'unavailable']);
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
  return {
    ok: false,
    reasonCode,
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
    decision: safeSetValue(input.decision, VALID_DECISIONS) || decisionFromEventType(eventType),
    reasonCode: safeSetValue(input.reasonCode, VALID_REASON_CODES),
    route: safeSetValue(input.route, VALID_ROUTES),
    method: safeMethod(input.method),
    source: safeSetValue(input.source, VALID_SOURCES),
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
