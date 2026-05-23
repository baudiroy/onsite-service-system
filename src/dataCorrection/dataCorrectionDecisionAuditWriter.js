'use strict';

const {
  DATA_CORRECTION_AUDIT_ACTIONS,
  DATA_CORRECTION_AUDIT_EVENT_TYPES,
  DATA_CORRECTION_AUDIT_RESULTS,
} = require('./dataCorrectionDecisionAuditIntentBuilder');
const {
  createDataCorrectionDecisionAuditRepository,
} = require('./dataCorrectionDecisionAuditRepository');

const SAFE_TEXT_PATTERN = /^[A-Za-z0-9_.:-]{1,160}$/;

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function safeString(value) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();

  return SAFE_TEXT_PATTERN.test(trimmed) ? trimmed : undefined;
}

function safeTimestamp(value) {
  const text = typeof value === 'string' && value.trim() ? value.trim() : undefined;

  if (!text) {
    return null;
  }

  const parsed = Date.parse(text);

  return Number.isNaN(parsed) ? null : new Date(parsed).toISOString();
}

function safeFailure(reasonCode) {
  return {
    ok: false,
    persisted: false,
    auditWritten: false,
    reasonCode,
  };
}

function safeSuccess(result) {
  return {
    ok: true,
    persisted: true,
    auditWritten: true,
    eventType: result.eventType,
    resultStatus: result.resultStatus,
  };
}

function normalizeDecisionAuditIntent(intent = {}) {
  if (!isPlainObject(intent)) {
    return {
      ok: false,
      reasonCode: 'INVALID_AUDIT_INTENT',
    };
  }

  const action = safeString(intent.action);
  const eventType = safeString(intent.eventType);
  const resultStatus = safeString(intent.resultStatus);
  const organizationId = safeString(intent.organizationId);
  const decision = safeString(intent.decision) || resultStatus;

  if (!organizationId) {
    return {
      ok: false,
      reasonCode: 'ORGANIZATION_ID_REQUIRED',
    };
  }

  if (!action || !Object.values(DATA_CORRECTION_AUDIT_ACTIONS).includes(action)) {
    return {
      ok: false,
      reasonCode: 'ACTION_UNSAFE',
    };
  }

  if (!eventType || !Object.values(DATA_CORRECTION_AUDIT_EVENT_TYPES).includes(eventType)) {
    return {
      ok: false,
      reasonCode: 'EVENT_TYPE_UNSAFE',
    };
  }

  if (!resultStatus || !Object.values(DATA_CORRECTION_AUDIT_RESULTS).includes(resultStatus)) {
    return {
      ok: false,
      reasonCode: 'RESULT_STATUS_UNSAFE',
    };
  }

  if (!decision) {
    return {
      ok: false,
      reasonCode: 'DECISION_REQUIRED',
    };
  }

  return {
    ok: true,
    record: {
      organization_id: organizationId,
      case_id: safeString(intent.caseId) || null,
      appointment_id: safeString(intent.appointmentId) || null,
      actor_id: safeString(intent.actorId) || null,
      actor_role: safeString(intent.actorRole) || null,
      action,
      field_key: safeString(intent.fieldKey) || null,
      field_group: safeString(intent.fieldGroup) || null,
      event_type: eventType,
      decision,
      reason_code: safeString(intent.reasonCode) || null,
      safe_message_key: safeString(intent.safeMessageKey) || null,
      result_status: resultStatus,
      request_id: safeString(intent.requestId) || null,
      created_at: safeTimestamp(intent.timestamp),
      retention_until: safeTimestamp(intent.retentionUntil),
      deleted_at: null,
    },
  };
}

function resolveRepository(options = {}) {
  if (isPlainObject(options.repository) && typeof options.repository.writeDecisionAuditEvent === 'function') {
    return options.repository;
  }

  return createDataCorrectionDecisionAuditRepository(options);
}

function createDataCorrectionDecisionAuditWriter(options = {}) {
  const repository = resolveRepository(options);

  return function writeDataCorrectionDecisionAuditEvent(auditIntent) {
    const normalized = normalizeDecisionAuditIntent(auditIntent);

    if (!normalized.ok) {
      return safeFailure(normalized.reasonCode);
    }

    let result;

    try {
      result = repository.writeDecisionAuditEvent(normalized.record);
    } catch (error) {
      return safeFailure('REPOSITORY_WRITE_FAILED');
    }

    if (result && typeof result.then === 'function') {
      return result
        .then((resolved) => (resolved && resolved.ok ? safeSuccess(resolved) : safeFailure((resolved && resolved.reasonCode) || 'REPOSITORY_WRITE_FAILED')))
        .catch(() => safeFailure('REPOSITORY_WRITE_FAILED'));
    }

    return result && result.ok
      ? safeSuccess(result)
      : safeFailure((result && result.reasonCode) || 'REPOSITORY_WRITE_FAILED');
  };
}

module.exports = {
  createDataCorrectionDecisionAuditWriter,
  normalizeDecisionAuditIntent,
};
