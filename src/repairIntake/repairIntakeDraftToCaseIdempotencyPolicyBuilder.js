'use strict';

const MESSAGE_KEY = 'repair_intake_draft_to_case.idempotency_policy';
const OPERATION = 'repair_intake_draft_to_case';

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
    return Number.isFinite(value) ? String(value) : null;
  }

  if (typeof value === 'boolean') {
    return String(value);
  }

  return null;
}

function encodeSegment(value) {
  return encodeURIComponent(String(value));
}

function invalidEnvelope(reasonCode, input = {}) {
  const safeInput = isPlainObject(input) ? input : {};

  return {
    ok: false,
    status: 'invalid_input',
    messageKey: MESSAGE_KEY,
    reasonCode,
    requiredActions: ['provide_valid_idempotency_policy_input'],
    idempotencyScope: null,
    idempotencyKey: null,
    dedupeKey: null,
    organizationId: safeScalar(safeInput.organizationId),
    actorId: safeScalar(safeInput.actorId),
    repairIntakeDraftId: safeScalar(safeInput.repairIntakeDraftId),
    requestId: safeScalar(safeInput.requestId),
    source: safeScalar(safeInput.source),
  };
}

function buildRepairIntakeDraftToCaseIdempotencyPolicy(input = {}) {
  if (!isPlainObject(input)) {
    return invalidEnvelope(
      'REPAIR_INTAKE_DRAFT_TO_CASE_IDEMPOTENCY_POLICY_INPUT_INVALID',
    );
  }

  const organizationId = safeScalar(input.organizationId);
  const actorId = safeScalar(input.actorId);
  const repairIntakeDraftId = safeScalar(input.repairIntakeDraftId);
  const requestId = safeScalar(input.requestId);
  const idempotencyKey = safeScalar(input.idempotencyKey);
  const source = safeScalar(input.source);

  if (!organizationId) {
    return invalidEnvelope(
      'REPAIR_INTAKE_DRAFT_TO_CASE_IDEMPOTENCY_POLICY_ORGANIZATION_REQUIRED',
      input,
    );
  }

  if (!actorId) {
    return invalidEnvelope(
      'REPAIR_INTAKE_DRAFT_TO_CASE_IDEMPOTENCY_POLICY_ACTOR_REQUIRED',
      input,
    );
  }

  if (!repairIntakeDraftId) {
    return invalidEnvelope(
      'REPAIR_INTAKE_DRAFT_TO_CASE_IDEMPOTENCY_POLICY_DRAFT_REQUIRED',
      input,
    );
  }

  const effectiveKey = idempotencyKey
    || requestId
    || `fallback:${actorId}:${repairIntakeDraftId}`;
  const idempotencyScope = `${OPERATION}:organization:${encodeSegment(organizationId)}`;
  const dedupeKey = [
    idempotencyScope,
    `draft:${encodeSegment(repairIntakeDraftId)}`,
    `key:${encodeSegment(effectiveKey)}`,
  ].join(':');

  return {
    ok: true,
    status: 'policy_built',
    messageKey: MESSAGE_KEY,
    reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_IDEMPOTENCY_POLICY_BUILT',
    requiredActions: [],
    idempotencyScope,
    idempotencyKey: effectiveKey,
    dedupeKey,
    organizationId,
    actorId,
    repairIntakeDraftId,
    requestId,
    source,
  };
}

module.exports = {
  buildRepairIntakeDraftToCaseIdempotencyPolicy,
};
