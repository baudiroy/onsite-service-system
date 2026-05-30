'use strict';

const {
  ENGINEER_MOBILE_AUDIT_EVENT_KEYS,
  ENGINEER_MOBILE_AUDIT_METADATA_KEYS,
  SUPPORTED_ENGINEER_MOBILE_AUDIT_EVENT_TYPES,
} = require('./engineerMobileAuditEventBuilder');
const {
  normalizeEngineerMobileAuditWriterResult,
} = require('./engineerMobileAuditWriterResultNormalizer');

const VALID_EVENT_TYPES = new Set(SUPPORTED_ENGINEER_MOBILE_AUDIT_EVENT_TYPES);
const VALID_EVENT_KEYS = new Set(ENGINEER_MOBILE_AUDIT_EVENT_KEYS);
const VALID_METADATA_KEYS = new Set(ENGINEER_MOBILE_AUDIT_METADATA_KEYS);
const SENSITIVE_KEY_PATTERN = /raw|request|response|header|authorization|auth|token|secret|cookie|session|sql|query|params|provider|debug|private|password|stack|internal|admin|billing|payment|body/i;
const SENSITIVE_VALUE_PATTERN = /bearer|authorization|token|secret|select|insert|update|delete|drop|postgres|database|password|stack|debug|sql/i;

function failed(reasonCode) {
  return normalizeEngineerMobileAuditWriterResult({
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

function sanitizeEngineerMobileAuditEventForWriter(input) {
  if (!isPlainObject(input) || isBufferLike(input)) {
    return undefined;
  }

  if (!VALID_EVENT_TYPES.has(input.eventType)) {
    return undefined;
  }

  const auditEvent = {};

  for (const key of Object.keys(input)) {
    if (!VALID_EVENT_KEYS.has(key)) {
      return undefined;
    }

    if (key === 'metadata') {
      const metadata = sanitizedMetadata(input.metadata);

      if (metadata === undefined) {
        return undefined;
      }

      auditEvent.metadata = metadata;
      continue;
    }

    const safeValue = safeScalar(input[key]);

    if (safeValue === undefined) {
      return undefined;
    }

    auditEvent[key] = safeValue;
  }

  return auditEvent;
}

async function writeEngineerMobileAuditEvent(input = {}) {
  const options = isPlainObject(input) ? input : {};
  const auditEvent = sanitizeEngineerMobileAuditEventForWriter(options.auditEvent);

  if (!auditEvent) {
    return failed('audit_event_invalid');
  }

  if (typeof options.auditWriter !== 'function') {
    return failed('audit_writer_unavailable');
  }

  try {
    const writerResult = await options.auditWriter(auditEvent);

    return normalizeEngineerMobileAuditWriterResult(writerResult);
  } catch (_error) {
    return failed('audit_persistence_failed');
  }
}

module.exports = {
  sanitizeEngineerMobileAuditEventForWriter,
  writeEngineerMobileAuditEvent,
};
