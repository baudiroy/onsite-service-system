'use strict';

const ACTION = 'repair_intake_draft_to_case_submit';
const AUDIT_EVENT_TYPE = 'repair_intake_draft_to_case_submission';
const AUDIT_OUTCOMES = new Set(['submitted', 'blocked', 'failed']);

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stringValue(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function safeArray(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string' && item.trim().length > 0) : [];
}

function sanitizeCaseRef(value) {
  if (!isObject(value)) {
    return null;
  }

  const id = stringValue(value.id);
  const organizationId = stringValue(value.organizationId || value.organization_id);
  const sourceDraftId = stringValue(value.sourceDraftId || value.source_draft_id);
  const status = stringValue(value.status);

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

function sanitizeAuditEvent(value) {
  if (!isObject(value)) {
    return null;
  }

  const eventType = stringValue(value.eventType);
  const outcome = stringValue(value.outcome);

  if (eventType !== AUDIT_EVENT_TYPE || !AUDIT_OUTCOMES.has(outcome)) {
    return null;
  }

  return {
    eventType,
    outcome,
    draftId: stringValue(value.draftId) || null,
    organizationId: stringValue(value.organizationId) || null,
    actorId: stringValue(value.actorId) || null,
    requestId: stringValue(value.requestId) || null,
    idempotencyKey: stringValue(value.idempotencyKey) || null,
    caseRef: sanitizeCaseRef(value.caseRef),
    reasonCode: stringValue(value.reasonCode) || 'AUDIT_EVENT_REASON_UNSPECIFIED',
    requiredActions: safeArray(value.requiredActions),
  };
}

function normalizeRepairIntakeDraftCaseSubmissionEnvelope(input = {}) {
  const source = isObject(input) ? input : {};

  return {
    ok: source.ok === true,
    action: ACTION,
    draftId: stringValue(source.draftId) || null,
    organizationId: stringValue(source.organizationId) || null,
    submitted: source.submitted === true,
    caseCreationAllowed: source.caseCreationAllowed === true,
    candidateReady: source.candidateReady === true,
    reasonCode: stringValue(source.reasonCode) || 'SUBMISSION_RESULT_UNSPECIFIED',
    requiredActions: safeArray(source.requiredActions),
    caseRef: sanitizeCaseRef(source.caseRef),
    auditEvent: sanitizeAuditEvent(source.auditEvent),
  };
}

module.exports = {
  ACTION,
  normalizeRepairIntakeDraftCaseSubmissionEnvelope,
};
