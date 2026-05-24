'use strict';

const PUBLIC_RESULTS = {
  success: {
    status: 'created',
    messageKey: 'repair_intake_draft_to_case.created',
    reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_PUBLIC_CREATED',
  },
  denied: {
    status: 'denied',
    messageKey: 'repair_intake_draft_to_case.denied',
    reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_PUBLIC_DENIED',
  },
  invalidRequest: {
    status: 'invalid_request',
    messageKey: 'repair_intake_draft_to_case.invalid_request',
    reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_PUBLIC_INVALID_REQUEST',
  },
  skipped: {
    status: 'not_created',
    messageKey: 'repair_intake_draft_to_case.not_created',
    reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_PUBLIC_NOT_CREATED',
  },
  unavailable: {
    status: 'unavailable',
    messageKey: 'repair_intake_draft_to_case.unavailable',
    reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_PUBLIC_UNAVAILABLE',
  },
};

function isPlainObject(value) {
  return Boolean(value)
    && typeof value === 'object'
    && !Array.isArray(value)
    && Object.getPrototypeOf(value) === Object.prototype;
}

function safeScalar(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function publicBase(publicResult, ok) {
  return {
    ok,
    status: publicResult.status,
    messageKey: publicResult.messageKey,
    reasonCode: publicResult.reasonCode,
    caseId: null,
    repairIntakeDraftId: null,
  };
}

function safeDraftId(result) {
  return safeScalar(result.repairIntakeDraftId) || safeScalar(result.draftId);
}

function presentSuccess(result) {
  return {
    ...publicBase(PUBLIC_RESULTS.success, true),
    caseId: safeScalar(result.caseId),
    repairIntakeDraftId: safeDraftId(result),
  };
}

function presentDenied(result) {
  return {
    ...publicBase(PUBLIC_RESULTS.denied, false),
    repairIntakeDraftId: safeDraftId(result),
  };
}

function presentInvalidRequest(result) {
  return {
    ...publicBase(PUBLIC_RESULTS.invalidRequest, false),
    repairIntakeDraftId: safeDraftId(result),
  };
}

function presentSkipped(result) {
  return {
    ...publicBase(PUBLIC_RESULTS.skipped, false),
    repairIntakeDraftId: safeDraftId(result),
  };
}

function presentUnavailable(result) {
  return {
    ...publicBase(PUBLIC_RESULTS.unavailable, false),
    repairIntakeDraftId: safeDraftId(result),
  };
}

function presentRepairIntakeDraftToCaseResult(orchestratorResult) {
  if (!isPlainObject(orchestratorResult)) {
    return publicBase(PUBLIC_RESULTS.invalidRequest, false);
  }

  if (orchestratorResult.ok === true) {
    return presentSuccess(orchestratorResult);
  }

  if (orchestratorResult.status === 'denied') {
    return presentDenied(orchestratorResult);
  }

  if (orchestratorResult.status === 'invalid_input' || orchestratorResult.status === 'invalid_request') {
    return presentInvalidRequest(orchestratorResult);
  }

  if (orchestratorResult.status === 'skipped' || orchestratorResult.status === 'not_created') {
    return presentSkipped(orchestratorResult);
  }

  return presentUnavailable(orchestratorResult);
}

module.exports = {
  presentRepairIntakeDraftToCaseResult,
};
