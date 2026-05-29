'use strict';

const {
  buildCustomerAccessAuditEvent,
} = require('./customerAccessAuditEventBuilder');
const {
  normalizeCustomerAccessAuditWriterResult,
} = require('./customerAccessAuditWriterResultNormalizer');

const CUSTOMER_ACCESS_AUDIT_REPOSITORY_RECORD_KEYS = Object.freeze([
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

const CUSTOMER_ACCESS_AUDIT_REPOSITORY_INVALID_REASON = 'audit_event_invalid';

function failed(reasonCode = CUSTOMER_ACCESS_AUDIT_REPOSITORY_INVALID_REASON) {
  return {
    ok: false,
    status: 'failed',
    auditWritten: false,
    persisted: false,
    reasonCode,
  };
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

function safeAuditInput(value) {
  return isPlainObject(value) && !isBufferLike(value) && typeof value !== 'function'
    ? value
    : undefined;
}

function buildRecordFromAuditEvent(auditEvent) {
  const record = {};

  for (const key of CUSTOMER_ACCESS_AUDIT_REPOSITORY_RECORD_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(auditEvent, key)) {
      continue;
    }

    if (key === 'metadata' && isPlainObject(auditEvent.metadata)) {
      record.metadata = { ...auditEvent.metadata };
      continue;
    }

    record[key] = auditEvent[key];
  }

  return record;
}

function buildCustomerAccessAuditRepositoryRecord(input) {
  const auditInput = safeAuditInput(input);

  if (!auditInput) {
    return failed();
  }

  const auditEventResult = buildCustomerAccessAuditEvent(auditInput);

  if (!auditEventResult || auditEventResult.ok !== true || !auditEventResult.auditEvent) {
    return failed();
  }

  return {
    ok: true,
    record: buildRecordFromAuditEvent(auditEventResult.auditEvent),
  };
}

function normalizeCustomerAccessAuditRepositoryResult(input) {
  return normalizeCustomerAccessAuditWriterResult(input);
}

module.exports = {
  CUSTOMER_ACCESS_AUDIT_REPOSITORY_RECORD_KEYS,
  buildCustomerAccessAuditRepositoryRecord,
  normalizeCustomerAccessAuditRepositoryResult,
};
