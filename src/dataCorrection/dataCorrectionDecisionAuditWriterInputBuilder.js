'use strict';

const SAFE_STRING_FIELDS = Object.freeze([
  'action',
  'actorId',
  'actorRole',
  'appointmentId',
  'caseId',
  'decision',
  'eventType',
  'fieldGroup',
  'fieldKey',
  'organizationId',
  'reasonCode',
  'requestId',
  'resultStatus',
  'safeMessageKey',
  'timestamp',
]);

const SENSITIVE_KEY_PATTERN = /(?:phone|mobile|tel|address|line[_-]?user|lineUser|final[_-]?appointment|finalAppointment|field[_-]?service[_-]?report|fieldServiceReport|reportId|sql|dbUrl|connectionString|stack|token|secret|password|api[_-]?key|payload|raw|billing|settlement|internal[_-]?note|internalNote|ai[_-]?raw|aiRaw)/i;
const SENSITIVE_VALUE_PATTERNS = Object.freeze([
  /postgres(?:ql)?:\/\/[^\s"')]+/i,
  /(?:SELECT|INSERT|UPDATE|DELETE)\s+/i,
  /Bearer\s+[A-Za-z0-9._-]+/i,
  /09\d{2}[-\s]?\d{3}[-\s]?\d{3}/,
  /[縣市區鄉鎮路街巷弄號樓]\s*\d+/,
  /(?:token|secret|password|api[_-]?key|line[_-]?user|line user|db[_-]?url|connection string|stack trace|raw payload|internal note|billing internal|settlement internal|ai raw)/i,
]);

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isSensitiveKey(key) {
  return SENSITIVE_KEY_PATTERN.test(String(key || ''));
}

function isSafeString(value) {
  if (typeof value !== 'string') {
    return false;
  }

  const trimmed = value.trim();

  if (!trimmed || trimmed.length > 200) {
    return false;
  }

  return !SENSITIVE_VALUE_PATTERNS.some((pattern) => pattern.test(trimmed));
}

function safeString(value) {
  return isSafeString(value) ? value.trim() : undefined;
}

function readSafeString(source, key) {
  if (!isPlainObject(source) || isSensitiveKey(key)) {
    return undefined;
  }

  const value = safeString(source[key]);

  if (key === 'fieldKey' && isSensitiveKey(value)) {
    return undefined;
  }

  return value;
}

function buildDataCorrectionDecisionAuditWriterInput(input = {}) {
  const source = isPlainObject(input) ? input : {};
  const writerInput = {};

  for (const key of SAFE_STRING_FIELDS) {
    const value = readSafeString(source, key);

    if (value) {
      writerInput[key] = value;
    }
  }

  if (typeof source.auditWritten === 'boolean') {
    writerInput.auditWritten = source.auditWritten;
  }

  return writerInput;
}

module.exports = {
  buildDataCorrectionDecisionAuditWriterInput,
};
