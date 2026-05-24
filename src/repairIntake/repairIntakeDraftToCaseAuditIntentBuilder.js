'use strict';

const EVENT_TYPE = 'repair_intake_draft_to_case';
const SUPPORTED_PHASES = new Set(['attempt', 'authorized', 'denied', 'submitted', 'failed']);

function isPlainObject(value) {
  return Boolean(value)
    && typeof value === 'object'
    && !Array.isArray(value)
    && Object.getPrototypeOf(value) === Object.prototype;
}

function safeScalar(value) {
  if (typeof value === 'string') {
    const trimmed = value.trim();

    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  return null;
}

function invalidEnvelope(reasonCode, input = {}) {
  const safeInput = isPlainObject(input) ? input : {};

  return {
    ok: false,
    status: 'invalid_input',
    reasonCode,
    requiredActions: ['provide_valid_audit_intent_input'],
    auditIntent: null,
    phase: safeScalar(safeInput.phase),
    organizationId: safeScalar(safeInput.organizationId),
    actorId: safeScalar(safeInput.actorId),
    repairIntakeDraftId: safeScalar(safeInput.repairIntakeDraftId),
    caseId: safeScalar(safeInput.caseId),
    resultStatus: safeScalar(safeInput.resultStatus),
    source: safeScalar(safeInput.source),
  };
}

function buildRepairIntakeDraftToCaseAuditIntent(input = {}) {
  if (!isPlainObject(input)) {
    return invalidEnvelope(
      'REPAIR_INTAKE_DRAFT_TO_CASE_AUDIT_INTENT_INPUT_INVALID',
    );
  }

  const phase = safeScalar(input.phase);
  const organizationId = safeScalar(input.organizationId);
  const actorId = safeScalar(input.actorId);
  const repairIntakeDraftId = safeScalar(input.repairIntakeDraftId);
  const caseId = safeScalar(input.caseId);
  const resultStatus = safeScalar(input.resultStatus);
  const reasonCode = safeScalar(input.reasonCode);
  const source = safeScalar(input.source);
  const occurredAt = safeScalar(input.occurredAt);

  if (!phase || !SUPPORTED_PHASES.has(phase)) {
    return invalidEnvelope(
      'REPAIR_INTAKE_DRAFT_TO_CASE_AUDIT_INTENT_PHASE_UNSUPPORTED',
      input,
    );
  }

  if (!organizationId) {
    return invalidEnvelope(
      'REPAIR_INTAKE_DRAFT_TO_CASE_AUDIT_INTENT_ORGANIZATION_REQUIRED',
      input,
    );
  }

  if (!actorId) {
    return invalidEnvelope(
      'REPAIR_INTAKE_DRAFT_TO_CASE_AUDIT_INTENT_ACTOR_REQUIRED',
      input,
    );
  }

  if (!repairIntakeDraftId) {
    return invalidEnvelope(
      'REPAIR_INTAKE_DRAFT_TO_CASE_AUDIT_INTENT_DRAFT_REQUIRED',
      input,
    );
  }

  return {
    ok: true,
    status: 'audit_intent_built',
    reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_AUDIT_INTENT_BUILT',
    requiredActions: [],
    auditIntent: {
      eventType: EVENT_TYPE,
      phase,
      organizationId,
      actorId,
      repairIntakeDraftId,
      caseId,
      resultStatus,
      reasonCode,
      source,
      occurredAt,
    },
  };
}

module.exports = {
  buildRepairIntakeDraftToCaseAuditIntent,
};
