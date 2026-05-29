'use strict';

const {
  CUSTOMER_ACCESS_AUDIT_REPOSITORY_RECORD_KEYS,
  buildCustomerAccessAuditRepositoryRecord,
  normalizeCustomerAccessAuditRepositoryResult,
} = require('./customerAccessAuditRepositoryContract');

const REPOSITORY_METHOD = 'recordCustomerAccessAuditEvent';
const VALID_AUDIT_EVENT_KEYS = new Set(CUSTOMER_ACCESS_AUDIT_REPOSITORY_RECORD_KEYS);
const SENSITIVE_KEY_PATTERN = /(^request$)|raw|response|header|authorization|auth|token|secret|cookie|session|sql|query|params|provider|debug|private|password|stack|internal|admin|billing|payment|body/i;
const FAILED_AUDIT_EVENT_REASON = 'audit_event_invalid';
const FAILED_REPOSITORY_REASON = 'audit_writer_unavailable';
const FAILED_PERSISTENCE_REASON = 'audit_persistence_failed';

function failed(reasonCode) {
  return normalizeCustomerAccessAuditRepositoryResult({
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

function hasOnlyAcceptedAuditEventKeys(value) {
  return Object.keys(value).every((key) => VALID_AUDIT_EVENT_KEYS.has(key));
}

function hasSensitiveKey(value) {
  if (!isPlainObject(value)) {
    return false;
  }

  for (const key of Object.keys(value)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      return true;
    }

    if (hasSensitiveKey(value[key])) {
      return true;
    }
  }

  return false;
}

function safeAuditInput(value) {
  if (!isPlainObject(value) || isBufferLike(value)) {
    return undefined;
  }

  if (!hasOnlyAcceptedAuditEventKeys(value) || hasSensitiveKey(value)) {
    return undefined;
  }

  return value;
}

function repositoryMethod(auditRepository) {
  if (!isPlainObject(auditRepository) || isBufferLike(auditRepository)) {
    return undefined;
  }

  try {
    return typeof auditRepository[REPOSITORY_METHOD] === 'function'
      ? auditRepository[REPOSITORY_METHOD]
      : undefined;
  } catch (_error) {
    return undefined;
  }
}

function isolatedRecord(record) {
  const isolated = {};

  for (const key of CUSTOMER_ACCESS_AUDIT_REPOSITORY_RECORD_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(record, key)) {
      continue;
    }

    if (key === 'metadata' && isPlainObject(record.metadata)) {
      isolated.metadata = { ...record.metadata };
      continue;
    }

    isolated[key] = record[key];
  }

  return isolated;
}

async function writeCustomerAccessAuditEvent(input = {}) {
  const options = isPlainObject(input) ? input : {};
  const auditEvent = safeAuditInput(options.auditEvent);

  if (!auditEvent) {
    return failed(FAILED_AUDIT_EVENT_REASON);
  }

  const recordResult = buildCustomerAccessAuditRepositoryRecord(auditEvent);

  if (!recordResult || recordResult.ok !== true || !isPlainObject(recordResult.record)) {
    return normalizeCustomerAccessAuditRepositoryResult(recordResult);
  }

  const method = repositoryMethod(options.auditRepository);

  if (!method) {
    return failed(FAILED_REPOSITORY_REASON);
  }

  try {
    const repositoryResult = await method.call(
      options.auditRepository,
      isolatedRecord(recordResult.record),
    );

    return normalizeCustomerAccessAuditRepositoryResult(repositoryResult);
  } catch (_error) {
    return failed(FAILED_PERSISTENCE_REASON);
  }
}

function createCustomerAccessAuditPersistenceWriter(input = {}) {
  const auditRepository = isPlainObject(input) ? input.auditRepository : undefined;

  return function writer(auditEvent) {
    return writeCustomerAccessAuditEvent({
      auditEvent,
      auditRepository,
    });
  };
}

module.exports = {
  createCustomerAccessAuditPersistenceWriter,
  writeCustomerAccessAuditEvent,
};
