'use strict';

const DATA_CORRECTION_DECISION_AUDIT_EVENT_TABLE = 'data_correction_decision_audit_events';

const DATA_CORRECTION_DECISION_AUDIT_EVENT_COLUMNS = Object.freeze([
  'organization_id',
  'case_id',
  'appointment_id',
  'actor_id',
  'actor_role',
  'action',
  'field_key',
  'field_group',
  'event_type',
  'decision',
  'reason_code',
  'safe_message_key',
  'result_status',
  'request_id',
  'created_at',
  'retention_until',
  'deleted_at',
]);

const REQUIRED_COLUMNS = Object.freeze([
  'organization_id',
  'action',
  'event_type',
  'decision',
  'result_status',
]);

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function resolveQueryClient(options = {}) {
  const candidate = options.transaction || options.dbClient;

  return isPlainObject(candidate) && typeof candidate.query === 'function'
    ? candidate
    : null;
}

function safeFailure(reasonCode) {
  return {
    ok: false,
    persisted: false,
    auditWritten: false,
    reasonCode,
  };
}

function safeSuccess(record) {
  return {
    ok: true,
    persisted: true,
    auditWritten: true,
    eventType: record.event_type,
    resultStatus: record.result_status,
  };
}

function classifyDbFailure(error) {
  const code = isPlainObject(error) ? String(error.code || '').trim() : '';
  const name = isPlainObject(error) ? String(error.name || '').trim() : '';
  const message = isPlainObject(error) ? String(error.message || '').trim().toLowerCase() : '';

  if (code === '23505' || message.includes('duplicate')) {
    return 'DUPLICATE_REQUEST_ID';
  }

  if (['ETIMEDOUT', 'ETIMEOUT'].includes(code) || /timeout/i.test(name) || message.includes('timeout')) {
    return 'DB_TIMEOUT';
  }

  if (message.includes('transaction')) {
    return 'TRANSACTION_FAILED';
  }

  return 'DB_WRITE_FAILED';
}

function normalizeRecord(record = {}) {
  if (!isPlainObject(record)) {
    return {
      ok: false,
      reasonCode: 'INVALID_RECORD',
    };
  }

  const normalized = {};

  for (const column of DATA_CORRECTION_DECISION_AUDIT_EVENT_COLUMNS) {
    normalized[column] = Object.prototype.hasOwnProperty.call(record, column)
      ? record[column]
      : null;
  }

  for (const column of REQUIRED_COLUMNS) {
    if (typeof normalized[column] !== 'string' || !normalized[column].trim()) {
      return {
        ok: false,
        reasonCode: `${column.toUpperCase()}_REQUIRED`,
      };
    }

    normalized[column] = normalized[column].trim();
  }

  return {
    ok: true,
    record: normalized,
  };
}

function buildInsertQuery() {
  const placeholders = DATA_CORRECTION_DECISION_AUDIT_EVENT_COLUMNS
    .map((_, index) => `$${index + 1}`)
    .join(', ');
  const columns = DATA_CORRECTION_DECISION_AUDIT_EVENT_COLUMNS.join(', ');

  return `INSERT INTO ${DATA_CORRECTION_DECISION_AUDIT_EVENT_TABLE} (${columns}) VALUES (${placeholders}) RETURNING id`;
}

function createDataCorrectionDecisionAuditRepository(options = {}) {
  const queryClient = resolveQueryClient(options);

  return Object.freeze({
    writeDecisionAuditEvent(record) {
      if (!queryClient) {
        return safeFailure('DB_CLIENT_NOT_CONFIGURED');
      }

      const normalized = normalizeRecord(record);

      if (!normalized.ok) {
        return safeFailure(normalized.reasonCode);
      }

      const queryText = buildInsertQuery();
      const params = DATA_CORRECTION_DECISION_AUDIT_EVENT_COLUMNS.map((column) => normalized.record[column]);

      try {
        const result = queryClient.query(queryText, params);

        if (result && typeof result.then === 'function') {
          return result
            .then(() => safeSuccess(normalized.record))
            .catch((error) => safeFailure(classifyDbFailure(error)));
        }

        return safeSuccess(normalized.record);
      } catch (error) {
        return safeFailure(classifyDbFailure(error));
      }
    },
  });
}

module.exports = {
  DATA_CORRECTION_DECISION_AUDIT_EVENT_COLUMNS,
  DATA_CORRECTION_DECISION_AUDIT_EVENT_TABLE,
  createDataCorrectionDecisionAuditRepository,
};
