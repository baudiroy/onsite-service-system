'use strict';

const EVENT_TYPE = 'repair_intake_draft_to_case_submission';
const OUTCOMES = new Set(['submitted', 'blocked', 'failed']);

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stringValue(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function safeArray(value, fallback = []) {
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string' && item.trim().length > 0) : fallback.slice();
}

function blocked(reasonCode, requiredActions) {
  return {
    ok: false,
    reasonCode,
    requiredActions,
    auditEvent: null,
  };
}

function normalizeOutcome(outcome) {
  const value = isObject(outcome) ? stringValue(outcome.outcome) : stringValue(outcome);

  return OUTCOMES.has(value) ? value : undefined;
}

function sanitizeCommand(command) {
  if (!isObject(command)) {
    return null;
  }

  return {
    draftId: stringValue(command.draftId),
    organizationId: stringValue(command.organizationId),
    actorId: stringValue(command.actorId),
    requestId: stringValue(command.requestId) || null,
    idempotencyKey: stringValue(command.idempotencyKey) || null,
  };
}

function caseRefSource(submissionResult) {
  if (!isObject(submissionResult)) {
    return null;
  }

  return isObject(submissionResult.caseRef) ? submissionResult.caseRef : null;
}

function sanitizeCaseRef(submissionResult) {
  const source = caseRefSource(submissionResult);

  if (!source) {
    return null;
  }

  const id = stringValue(source.id);
  const organizationId = stringValue(source.organizationId || source.organization_id);
  const sourceDraftId = stringValue(source.sourceDraftId || source.source_draft_id);
  const status = stringValue(source.status);

  if (!id || !organizationId || !sourceDraftId || !status) {
    return null;
  }

  return {
    id,
    organizationId,
    sourceDraftId,
    status,
  };
}

function resultReason(input, outcome) {
  const submissionResult = isObject(input.submissionResult) ? input.submissionResult : {};
  const planResult = isObject(input.planResult) ? input.planResult : {};
  const outcomeContext = isObject(input.outcome) ? input.outcome : {};

  return stringValue(outcomeContext.reasonCode)
    || stringValue(submissionResult.reasonCode)
    || stringValue(planResult.reasonCode)
    || `REPAIR_INTAKE_DRAFT_CASE_${outcome.toUpperCase()}`;
}

function resultRequiredActions(input) {
  const outcomeContext = isObject(input.outcome) ? input.outcome : {};
  const submissionResult = isObject(input.submissionResult) ? input.submissionResult : {};
  const planResult = isObject(input.planResult) ? input.planResult : {};

  return safeArray(
    outcomeContext.requiredActions,
    safeArray(submissionResult.requiredActions, safeArray(planResult.requiredActions)),
  );
}

function buildRepairIntakeDraftCaseSubmissionAuditEvent(input = {}) {
  if (!isObject(input)) {
    return blocked('AUDIT_EVENT_INPUT_MISSING', ['provide_audit_event_context']);
  }

  const command = sanitizeCommand(input.sanitizedCommand);

  if (!command) {
    return blocked('AUDIT_EVENT_COMMAND_MISSING', ['provide_sanitized_command']);
  }

  if (!command.draftId) {
    return blocked('AUDIT_EVENT_DRAFT_ID_MISSING', ['provide_draft_id']);
  }

  if (!command.organizationId) {
    return blocked('AUDIT_EVENT_ORGANIZATION_MISSING', ['provide_organization_scope']);
  }

  if (!command.actorId) {
    return blocked('AUDIT_EVENT_ACTOR_MISSING', ['provide_actor_id']);
  }

  const outcome = normalizeOutcome(input.outcome);

  if (!outcome) {
    return blocked('AUDIT_EVENT_OUTCOME_MISSING', ['provide_submission_outcome']);
  }

  const caseRef = sanitizeCaseRef(input.submissionResult);

  if (outcome === 'submitted' && !caseRef) {
    return blocked('AUDIT_EVENT_CASE_REF_MISSING', ['manual_review']);
  }

  if (caseRef && caseRef.organizationId !== command.organizationId) {
    return blocked('AUDIT_EVENT_CASE_REF_ORGANIZATION_MISMATCH', ['manual_review']);
  }

  if (caseRef && caseRef.sourceDraftId !== command.draftId) {
    return blocked('AUDIT_EVENT_CASE_REF_SOURCE_DRAFT_MISMATCH', ['manual_review']);
  }

  const reasonCode = resultReason(input, outcome);
  const requiredActions = resultRequiredActions(input);

  return {
    ok: true,
    reasonCode: 'AUDIT_EVENT_CANDIDATE_BUILT',
    requiredActions: [],
    auditEvent: {
      eventType: EVENT_TYPE,
      outcome,
      draftId: command.draftId,
      organizationId: command.organizationId,
      actorId: command.actorId,
      requestId: command.requestId,
      idempotencyKey: command.idempotencyKey,
      caseRef,
      reasonCode,
      requiredActions,
    },
  };
}

module.exports = {
  buildRepairIntakeDraftCaseSubmissionAuditEvent,
};
