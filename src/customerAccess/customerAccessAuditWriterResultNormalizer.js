'use strict';

const CUSTOMER_ACCESS_AUDIT_WRITER_RESULT_KEYS = Object.freeze([
  'ok',
  'status',
  'auditWritten',
  'persisted',
  'reasonCode',
]);

const CUSTOMER_ACCESS_AUDIT_WRITER_STATUSES = Object.freeze([
  'recorded',
  'skipped',
  'failed',
]);

const CUSTOMER_ACCESS_AUDIT_WRITER_REASON_CODES = Object.freeze([
  'audit_writer_unavailable',
  'audit_event_invalid',
  'audit_persistence_failed',
  'audit_skipped',
  'audit_not_configured',
  'invalid_writer_result',
]);

const VALID_REASON_CODES = new Set(CUSTOMER_ACCESS_AUDIT_WRITER_REASON_CODES);
const STATUS_RECORDED = 'recorded';
const STATUS_SKIPPED = 'skipped';
const STATUS_FAILED = 'failed';
const FALLBACK_REASON_CODE = 'invalid_writer_result';

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

function safeReasonCode(value) {
  const candidate = stringValue(value);

  return candidate && VALID_REASON_CODES.has(candidate) ? candidate : undefined;
}

function failed(reasonCode = FALLBACK_REASON_CODE) {
  return {
    ok: false,
    status: STATUS_FAILED,
    auditWritten: false,
    persisted: false,
    reasonCode: safeReasonCode(reasonCode) || FALLBACK_REASON_CODE,
  };
}

function recorded() {
  return {
    ok: true,
    status: STATUS_RECORDED,
    auditWritten: true,
    persisted: true,
  };
}

function skipped(reasonCode) {
  return {
    ok: true,
    status: STATUS_SKIPPED,
    auditWritten: false,
    persisted: false,
    reasonCode: safeReasonCode(reasonCode) || 'audit_skipped',
  };
}

function normalizeCustomerAccessAuditWriterResult(input) {
  if (!isPlainObject(input)) {
    return failed();
  }

  const status = stringValue(input.status);

  if (
    status === STATUS_RECORDED
    && input.ok === true
    && input.auditWritten === true
    && input.persisted === true
  ) {
    return recorded();
  }

  if (
    status === STATUS_SKIPPED
    && input.ok === true
    && input.auditWritten === false
    && input.persisted === false
  ) {
    return skipped(input.reasonCode);
  }

  if (
    status === STATUS_FAILED
    && input.ok === false
    && input.auditWritten === false
    && input.persisted === false
  ) {
    return failed(input.reasonCode);
  }

  return failed();
}

module.exports = {
  CUSTOMER_ACCESS_AUDIT_WRITER_REASON_CODES,
  CUSTOMER_ACCESS_AUDIT_WRITER_RESULT_KEYS,
  CUSTOMER_ACCESS_AUDIT_WRITER_STATUSES,
  normalizeCustomerAccessAuditWriterResult,
};
