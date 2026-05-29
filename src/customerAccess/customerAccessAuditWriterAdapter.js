'use strict';

const {
  CUSTOMER_ACCESS_AUDIT_EVENT_KEYS,
  CUSTOMER_ACCESS_AUDIT_METADATA_KEYS,
  SUPPORTED_CUSTOMER_ACCESS_AUDIT_EVENT_TYPES,
} = require('./customerAccessAuditEventBuilder');
const {
  normalizeCustomerAccessAuditWriterResult,
} = require('./customerAccessAuditWriterResultNormalizer');

const VALID_EVENT_TYPES = new Set(SUPPORTED_CUSTOMER_ACCESS_AUDIT_EVENT_TYPES);
const VALID_EVENT_KEYS = new Set(CUSTOMER_ACCESS_AUDIT_EVENT_KEYS);
const VALID_METADATA_KEYS = new Set(CUSTOMER_ACCESS_AUDIT_METADATA_KEYS);
const SENSITIVE_KEY_PATTERN = /raw|request|response|header|authorization|auth|token|secret|cookie|session|sql|query|provider|debug|private|password|stack|internal/i;
const SENSITIVE_VALUE_PATTERN = /bearer|authorization|token|secret|select|insert|update|delete|drop|postgres|database|password|stack|debug|sql/i;

function failed(reasonCode) {
  return normalizeCustomerAccessAuditWriterResult({
    ok: false,
    status: 'failed',
    auditWritten: false,
    persisted: false,
    reasonCode,
  });
}

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

function isBufferLike(value) {
  return Boolean(
    value
    && typeof value === 'object'
    && typeof value.byteLength === 'number'
    && typeof value.slice === 'function',
  );
}

function isSafeString(value) {
  return typeof value === 'string'
    && value.trim().length > 0
    && !SENSITIVE_VALUE_PATTERN.test(value)
    && !value.includes('@');
}

function safeScalar(value) {
  if (value === true || value === false) {
    return value;
  }

  return isSafeString(value) ? value : undefined;
}

function hasSensitiveKey(value) {
  return Object.keys(value).some((key) => SENSITIVE_KEY_PATTERN.test(key));
}

function sanitizedMetadata(value) {
  if (value === undefined) {
    return undefined;
  }

  if (!isPlainObject(value) || hasSensitiveKey(value)) {
    return undefined;
  }

  const metadata = {};

  for (const key of Object.keys(value)) {
    if (!VALID_METADATA_KEYS.has(key)) {
      return undefined;
    }

    const safeValue = safeScalar(value[key]);

    if (safeValue === undefined) {
      return undefined;
    }

    metadata[key] = safeValue;
  }

  return metadata;
}

function sanitizedAuditEvent(value) {
  if (!isPlainObject(value) || isBufferLike(value)) {
    return undefined;
  }

  if (!VALID_EVENT_TYPES.has(value.eventType)) {
    return undefined;
  }

  const auditEvent = {};

  for (const key of Object.keys(value)) {
    if (!VALID_EVENT_KEYS.has(key)) {
      return undefined;
    }

    if (key === 'metadata') {
      const metadata = sanitizedMetadata(value.metadata);

      if (metadata === undefined) {
        return undefined;
      }

      auditEvent.metadata = metadata;
      continue;
    }

    const safeValue = safeScalar(value[key]);

    if (safeValue === undefined) {
      return undefined;
    }

    auditEvent[key] = safeValue;
  }

  return auditEvent;
}

async function writeCustomerAccessAuditEvent(input = {}) {
  const writer = isPlainObject(input) ? input.writer : undefined;
  const auditEvent = isPlainObject(input) ? sanitizedAuditEvent(input.auditEvent) : undefined;

  if (!auditEvent) {
    return failed('audit_event_invalid');
  }

  if (typeof writer !== 'function') {
    return failed('audit_writer_unavailable');
  }

  try {
    const writerResult = await writer(auditEvent);

    return normalizeCustomerAccessAuditWriterResult(writerResult);
  } catch (_error) {
    return failed('audit_persistence_failed');
  }
}

module.exports = {
  writeCustomerAccessAuditEvent,
};
