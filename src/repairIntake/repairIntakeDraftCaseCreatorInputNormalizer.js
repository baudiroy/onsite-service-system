'use strict';

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stringValue(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function safeArray(value, fallback = []) {
  return Array.isArray(value) ? value.slice() : fallback.slice();
}

function blocked(reasonCode, requiredActions) {
  return {
    ok: false,
    reasonCode,
    requiredActions,
    creatorInput: null,
  };
}

function sanitizeRef(value) {
  if (!isObject(value)) {
    return null;
  }

  const sanitized = {};

  for (const key of [
    'id',
    'refId',
    'referenceId',
    'type',
    'role',
    'source',
    'sourceRef',
    'externalRef',
    'reviewStatus',
  ]) {
    const refValue = stringValue(value[key]);

    if (refValue) {
      sanitized[key] = refValue;
    }
  }

  return Object.keys(sanitized).length > 0 ? sanitized : null;
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
    requestId: stringValue(command.requestId),
    idempotencyKey,
  };
}

function sanitizeCandidate(candidate) {
  if (!isObject(candidate)) {
    return null;
  }

  const sourceDraftId = stringValue(candidate.sourceDraftId);
  const organizationId = stringValue(candidate.organizationId);
  const intakeSource = stringValue(candidate.intakeSource);

  if (!sourceDraftId || !organizationId || !intakeSource) {
    return null;
  }

  return {
    sourceDraftId,
    organizationId,
    brandId: stringValue(candidate.brandId) || null,
    serviceProviderId: stringValue(candidate.serviceProviderId) || null,
    intakeSource,
    serviceType: stringValue(candidate.serviceType) || null,
    priority: stringValue(candidate.priority) || null,
    reporterRef: sanitizeRef(candidate.reporterRef),
    customerRef: sanitizeRef(candidate.customerRef),
    billingContactRef: sanitizeRef(candidate.billingContactRef),
    siteRef: sanitizeRef(candidate.siteRef),
    issueSummaryRef: sanitizeRef(candidate.issueSummaryRef),
    createdByActorId: stringValue(candidate.createdByActorId) || null,
  };
}

function normalizeRepairIntakeDraftCaseCreatorInput(input = {}) {
  if (!isObject(input)) {
    return blocked('CREATOR_INPUT_MISSING', ['provide_creator_input_context']);
  }

  const command = sanitizeCommand(input.sanitizedCommand);

  if (!command) {
    return blocked('CREATOR_INPUT_COMMAND_MISSING', ['provide_sanitized_command']);
  }

  const planResult = isObject(input.planResult) ? input.planResult : null;

  if (!planResult) {
    return blocked('CREATOR_INPUT_PLAN_MISSING', ['provide_plan_result']);
  }

  if (planResult.caseCreationAllowed !== true || planResult.candidateReady !== true) {
    return blocked(
      stringValue(planResult.reasonCode) || 'CREATOR_INPUT_PLAN_NOT_ALLOWED',
      safeArray(planResult.requiredActions, ['resolve_plan_result']),
    );
  }

  const caseCandidate = sanitizeCandidate(planResult.caseCandidate);

  if (!caseCandidate) {
    return blocked('CASE_CANDIDATE_NOT_READY', ['provide_sanitized_case_candidate']);
  }

  if (caseCandidate.organizationId !== command.organizationId) {
    return blocked('CREATOR_INPUT_ORGANIZATION_MISMATCH', ['manual_review']);
  }

  if (caseCandidate.sourceDraftId !== command.draftId) {
    return blocked('CREATOR_INPUT_SOURCE_DRAFT_MISMATCH', ['manual_review']);
  }

  return {
    ok: true,
    reasonCode: 'CREATOR_INPUT_NORMALIZED',
    requiredActions: [],
    creatorInput: {
      command,
      caseCandidate,
    },
  };
}

module.exports = {
  normalizeRepairIntakeDraftCaseCreatorInput,
};
