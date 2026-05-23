'use strict';

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stringValue(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function blocked(reasonCode, requiredActions) {
  return {
    ok: false,
    reasonCode,
    requiredActions,
    caseRef: null,
  };
}

function creatorCaseRef(creatorResult) {
  if (!isObject(creatorResult)) {
    return undefined;
  }

  return isObject(creatorResult.caseRef) ? creatorResult.caseRef : creatorResult;
}

function normalizeRepairIntakeDraftCaseSubmissionResult(input = {}) {
  if (!isObject(input)) {
    return blocked('CASE_CREATOR_RESULT_MISSING', ['manual_review']);
  }

  const source = creatorCaseRef(input.creatorResult);

  if (!source) {
    return blocked('CASE_CREATOR_RESULT_MISSING', ['manual_review']);
  }

  const id = stringValue(source.id);

  if (!id) {
    return blocked('CASE_REF_ID_MISSING', ['manual_review']);
  }

  const contextOrganizationId = stringValue(input.organizationId);
  const resultOrganizationId = stringValue(source.organizationId || source.organization_id);

  if (!resultOrganizationId) {
    return blocked('CASE_REF_ORGANIZATION_MISSING', ['manual_review']);
  }

  if (contextOrganizationId && resultOrganizationId !== contextOrganizationId) {
    return blocked('CASE_REF_ORGANIZATION_MISMATCH', ['manual_review']);
  }

  const contextSourceDraftId = stringValue(input.sourceDraftId || input.draftId);
  const resultSourceDraftId = stringValue(source.sourceDraftId || source.source_draft_id);

  if (!resultSourceDraftId && !contextSourceDraftId) {
    return blocked('CASE_REF_SOURCE_DRAFT_MISSING', ['manual_review']);
  }

  if (resultSourceDraftId && contextSourceDraftId && resultSourceDraftId !== contextSourceDraftId) {
    return blocked('CASE_REF_SOURCE_DRAFT_MISMATCH', ['manual_review']);
  }

  const status = stringValue(source.status);

  if (!status) {
    return blocked('CASE_REF_STATUS_MISSING', ['manual_review']);
  }

  return {
    ok: true,
    reasonCode: 'CASE_REF_NORMALIZED',
    requiredActions: [],
    caseRef: {
      id,
      organizationId: resultOrganizationId,
      sourceDraftId: resultSourceDraftId || contextSourceDraftId,
      status,
    },
  };
}

module.exports = {
  normalizeRepairIntakeDraftCaseSubmissionResult,
};
