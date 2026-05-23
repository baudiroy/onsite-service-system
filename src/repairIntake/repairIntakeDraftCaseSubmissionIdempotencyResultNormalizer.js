'use strict';

const DEFAULT_CONFLICT_ACTION = 'REVIEW_EXISTING_DRAFT_TO_CASE_SUBMISSION';

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stringValue(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function safeArray(value, fallback = []) {
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string' && item.trim().length > 0) : fallback.slice();
}

function result(ok, decision, reasonCode, requiredActions, caseRef = null) {
  return {
    ok,
    decision,
    reasonCode,
    requiredActions,
    caseRef,
  };
}

function sanitizeCommand(command) {
  if (!isObject(command)) {
    return null;
  }

  const draftId = stringValue(command.draftId);
  const organizationId = stringValue(command.organizationId);
  const actorId = stringValue(command.actorId);
  const idempotencyKey = stringValue(command.idempotencyKey);

  if (!draftId || !organizationId || !actorId || !idempotencyKey) {
    return null;
  }

  return {
    draftId,
    organizationId,
    actorId,
    idempotencyKey,
  };
}

function normalizeDecision(checkerResult) {
  const decision = stringValue(checkerResult.decision || checkerResult.status);

  if (decision === 'available' || decision === 'pass' || decision === 'passed') {
    return 'available';
  }

  if (decision === 'conflict' || decision === 'duplicate' || decision === 'blocked') {
    return 'conflict';
  }

  if (decision === 'failed' || decision === 'error' || decision === 'unknown') {
    return 'failed';
  }

  return undefined;
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

function normalizeRepairIntakeDraftCaseSubmissionIdempotencyResult(input = {}) {
  if (!isObject(input)) {
    return result(false, 'failed', 'IDEMPOTENCY_INPUT_MISSING', ['provide_idempotency_context']);
  }

  const command = sanitizeCommand(input.sanitizedCommand);

  if (!command) {
    return result(false, 'failed', 'IDEMPOTENCY_COMMAND_MISSING', ['provide_sanitized_command']);
  }

  if (!isObject(input.checkerResult)) {
    return result(false, 'failed', 'IDEMPOTENCY_RESULT_MISSING', ['retry_or_manual_review']);
  }

  const decision = normalizeDecision(input.checkerResult);

  if (!decision) {
    return result(false, 'failed', 'IDEMPOTENCY_RESULT_UNRECOGNIZED', ['retry_or_manual_review']);
  }

  if (decision === 'available') {
    return result(true, 'available', 'IDEMPOTENCY_AVAILABLE', []);
  }

  const caseRef = sanitizeCaseRef(input.checkerResult.caseRef || input.checkerResult.existingCaseRef);

  if (caseRef && caseRef.organizationId !== command.organizationId) {
    return result(false, 'failed', 'IDEMPOTENCY_CASE_REF_ORGANIZATION_MISMATCH', ['manual_review']);
  }

  if (caseRef && caseRef.sourceDraftId !== command.draftId) {
    return result(false, 'failed', 'IDEMPOTENCY_CASE_REF_SOURCE_DRAFT_MISMATCH', ['manual_review']);
  }

  if (decision === 'conflict') {
    return result(
      false,
      'conflict',
      stringValue(input.checkerResult.reasonCode) || 'IDEMPOTENCY_CONFLICT',
      safeArray(input.checkerResult.requiredActions, [DEFAULT_CONFLICT_ACTION]),
      caseRef,
    );
  }

  return result(
    false,
    'failed',
    stringValue(input.checkerResult.reasonCode) || 'IDEMPOTENCY_CHECK_FAILED',
    safeArray(input.checkerResult.requiredActions, ['retry_or_manual_review']),
  );
}

module.exports = {
  DEFAULT_CONFLICT_ACTION,
  normalizeRepairIntakeDraftCaseSubmissionIdempotencyResult,
};
