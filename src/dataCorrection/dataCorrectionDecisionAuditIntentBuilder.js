'use strict';

const DATA_CORRECTION_AUDIT_ACTIONS = Object.freeze({
  APPLY: 'pre_departure_apply',
  REQUEST: 'data_correction_request',
});

const DATA_CORRECTION_AUDIT_RESULTS = Object.freeze({
  ALLOWED: 'allowed',
  DENIED: 'denied',
  MALFORMED: 'malformed',
  MANUAL_HANDLING: 'manual_handling',
  VALIDATION_FAILED: 'validation_failed',
  WRITER_FAILED: 'writer_failed',
});

const DATA_CORRECTION_AUDIT_EVENT_TYPES = Object.freeze({
  APPLY_ALLOWED: 'data_correction_apply_allowed',
  APPLY_DENIED: 'data_correction_apply_denied',
  APPLY_VALIDATION_FAILED: 'data_correction_apply_validation_failed',
  APPLY_WRITER_FAILED: 'data_correction_apply_writer_failed',
  DECISION_MALFORMED: 'data_correction_decision_malformed',
  REQUEST_ACCEPTED: 'data_correction_request_accepted',
  REQUEST_DENIED: 'data_correction_request_denied',
  REQUEST_MANUAL_HANDLING: 'data_correction_request_manual_handling',
  REQUEST_VALIDATION_FAILED: 'data_correction_request_validation_failed',
  REQUEST_WRITER_FAILED: 'data_correction_request_writer_failed',
});

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function safeString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function pickObject(...values) {
  return values.find(isPlainObject) || {};
}

function readString(source, ...keys) {
  const object = isPlainObject(source) ? source : {};

  for (const key of keys) {
    const value = safeString(object[key]);

    if (value) {
      return value;
    }
  }

  return undefined;
}

function readBoolean(source, ...keys) {
  const object = isPlainObject(source) ? source : {};

  for (const key of keys) {
    if (typeof object[key] === 'boolean') {
      return object[key];
    }
  }

  return undefined;
}

function normalizeAction(value) {
  const action = safeString(value);

  if (!action) {
    return undefined;
  }

  return Object.values(DATA_CORRECTION_AUDIT_ACTIONS).includes(action)
    ? action
    : undefined;
}

function normalizeResult(value, allowed, manualHandlingRequired) {
  const normalized = String(value || '').trim().toLowerCase();

  if (['writer_failed', 'writerfailed', 'failed'].includes(normalized)) {
    return DATA_CORRECTION_AUDIT_RESULTS.WRITER_FAILED;
  }

  if (['validation_failed', 'validationfailed', 'malformed', 'invalid'].includes(normalized)) {
    return DATA_CORRECTION_AUDIT_RESULTS.VALIDATION_FAILED;
  }

  if (['manual_handling', 'manualhandling'].includes(normalized) || manualHandlingRequired === true) {
    return DATA_CORRECTION_AUDIT_RESULTS.MANUAL_HANDLING;
  }

  if (['allow', 'allowed', 'applied', 'accepted', 'success'].includes(normalized) || allowed === true) {
    return DATA_CORRECTION_AUDIT_RESULTS.ALLOWED;
  }

  if (['deny', 'denied', 'blocked', 'not_applied', 'safe_deny'].includes(normalized) || allowed === false) {
    return DATA_CORRECTION_AUDIT_RESULTS.DENIED;
  }

  return DATA_CORRECTION_AUDIT_RESULTS.MALFORMED;
}

function eventTypeFor(action, resultStatus) {
  if (action === DATA_CORRECTION_AUDIT_ACTIONS.REQUEST) {
    if (resultStatus === DATA_CORRECTION_AUDIT_RESULTS.ALLOWED) {
      return DATA_CORRECTION_AUDIT_EVENT_TYPES.REQUEST_ACCEPTED;
    }

    if (resultStatus === DATA_CORRECTION_AUDIT_RESULTS.MANUAL_HANDLING) {
      return DATA_CORRECTION_AUDIT_EVENT_TYPES.REQUEST_MANUAL_HANDLING;
    }

    if (resultStatus === DATA_CORRECTION_AUDIT_RESULTS.VALIDATION_FAILED) {
      return DATA_CORRECTION_AUDIT_EVENT_TYPES.REQUEST_VALIDATION_FAILED;
    }

    if (resultStatus === DATA_CORRECTION_AUDIT_RESULTS.WRITER_FAILED) {
      return DATA_CORRECTION_AUDIT_EVENT_TYPES.REQUEST_WRITER_FAILED;
    }

    return DATA_CORRECTION_AUDIT_EVENT_TYPES.REQUEST_DENIED;
  }

  if (action === DATA_CORRECTION_AUDIT_ACTIONS.APPLY) {
    if (resultStatus === DATA_CORRECTION_AUDIT_RESULTS.ALLOWED) {
      return DATA_CORRECTION_AUDIT_EVENT_TYPES.APPLY_ALLOWED;
    }

    if (resultStatus === DATA_CORRECTION_AUDIT_RESULTS.VALIDATION_FAILED) {
      return DATA_CORRECTION_AUDIT_EVENT_TYPES.APPLY_VALIDATION_FAILED;
    }

    if (resultStatus === DATA_CORRECTION_AUDIT_RESULTS.WRITER_FAILED) {
      return DATA_CORRECTION_AUDIT_EVENT_TYPES.APPLY_WRITER_FAILED;
    }

    return DATA_CORRECTION_AUDIT_EVENT_TYPES.APPLY_DENIED;
  }

  return DATA_CORRECTION_AUDIT_EVENT_TYPES.DECISION_MALFORMED;
}

function extractActor(input) {
  return pickObject(input.actor, input.auth, input.context);
}

function extractCase(input) {
  return pickObject(input.caseContext, input.case, input.resource);
}

function extractAppointment(input) {
  return pickObject(input.appointmentContext, input.appointment, input.resource);
}

function extractCorrection(input) {
  return pickObject(input.correction, input.safeCorrection, input.resource);
}

function extractDecision(input) {
  return pickObject(input.decisionResult, input.decision, input.result, input.policy);
}

function baseMalformedIntent(timestamp) {
  const intent = {
    auditWritten: false,
    eventType: DATA_CORRECTION_AUDIT_EVENT_TYPES.DECISION_MALFORMED,
    reasonCode: 'MALFORMED_INPUT',
    resultStatus: DATA_CORRECTION_AUDIT_RESULTS.MALFORMED,
    safeMessageKey: 'dataCorrection.unavailable',
  };

  if (timestamp) {
    intent.timestamp = timestamp;
  }

  return intent;
}

function buildDataCorrectionDecisionAuditIntent(input = {}) {
  const request = isPlainObject(input) ? input : {};
  const actor = extractActor(request);
  const caseContext = extractCase(request);
  const appointmentContext = extractAppointment(request);
  const correction = extractCorrection(request);
  const decision = extractDecision(request);
  const timestamp = readString(request, 'timestamp', 'createdAt', 'created_at');
  const action = normalizeAction(
    readString(request, 'action')
      || readString(decision, 'action')
      || readString(correction, 'action'),
  );
  const organizationId = readString(request, 'organizationId', 'organization_id')
    || readString(caseContext, 'organizationId', 'organization_id')
    || readString(actor, 'organizationId', 'organization_id');
  const resultStatus = normalizeResult(
    readString(request, 'resultStatus', 'status', 'decision')
      || readString(decision, 'resultStatus', 'status', 'decision'),
    readBoolean(request, 'allowed') ?? readBoolean(decision, 'allowed'),
    readBoolean(request, 'manualHandlingRequired') ?? readBoolean(decision, 'manualHandlingRequired'),
  );

  if (
    !action
    || !organizationId
    || resultStatus === DATA_CORRECTION_AUDIT_RESULTS.MALFORMED
  ) {
    return baseMalformedIntent(timestamp);
  }

  const intent = {
    action,
    auditWritten: false,
    eventType: eventTypeFor(action, resultStatus),
    organizationId,
    resultStatus,
  };

  const actorId = readString(request, 'actorId', 'actor_id', 'userId', 'user_id')
    || readString(actor, 'actorId', 'actor_id', 'userId', 'user_id');
  const actorRole = readString(request, 'actorRole', 'role') || readString(actor, 'actorRole', 'role');
  const caseId = readString(request, 'caseId', 'case_id') || readString(caseContext, 'caseId', 'case_id');
  const appointmentId = readString(request, 'appointmentId', 'appointment_id')
    || readString(appointmentContext, 'appointmentId', 'appointment_id');
  const fieldKey = readString(request, 'fieldKey', 'field_key') || readString(correction, 'fieldKey', 'field_key');
  const fieldGroup = readString(request, 'fieldGroup', 'field_group')
    || readString(correction, 'fieldGroup', 'field_group');
  const decisionName = readString(request, 'decisionName', 'policyDecision')
    || readString(decision, 'decision', 'policyDecision');
  const reasonCode = readString(request, 'reasonCode', 'reason_code')
    || readString(decision, 'reasonCode', 'reason_code')
    || 'UNKNOWN';
  const safeMessageKey = readString(request, 'safeMessageKey', 'messageKey')
    || readString(decision, 'safeMessageKey', 'messageKey')
    || 'dataCorrection.unavailable';

  if (actorId) {
    intent.actorId = actorId;
  }

  if (actorRole) {
    intent.actorRole = actorRole;
  }

  if (caseId) {
    intent.caseId = caseId;
  }

  if (appointmentId) {
    intent.appointmentId = appointmentId;
  }

  if (fieldKey) {
    intent.fieldKey = fieldKey;
  }

  if (fieldGroup) {
    intent.fieldGroup = fieldGroup;
  }

  if (decisionName) {
    intent.decision = decisionName;
  }

  if (reasonCode) {
    intent.reasonCode = reasonCode;
  }

  if (safeMessageKey) {
    intent.safeMessageKey = safeMessageKey;
  }

  if (timestamp) {
    intent.timestamp = timestamp;
  }

  return intent;
}

module.exports = {
  DATA_CORRECTION_AUDIT_ACTIONS,
  DATA_CORRECTION_AUDIT_EVENT_TYPES,
  DATA_CORRECTION_AUDIT_RESULTS,
  buildDataCorrectionDecisionAuditIntent,
};
