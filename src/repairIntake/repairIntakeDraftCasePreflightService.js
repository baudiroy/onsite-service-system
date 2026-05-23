'use strict';

const {
  evaluateRepairIntakeDraftCaseEligibility,
} = require('./repairIntakeDraftCaseEligibility');

const ACTION = 'repair_intake_draft_to_case_preflight';

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stringValue(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function blockedEnvelope({ draftId = null, organizationId = null, reasonCode, requiredActions }) {
  return {
    ok: false,
    action: ACTION,
    draftId,
    organizationId,
    eligible: false,
    status: 'blocked',
    reasonCode,
    requiredActions,
    caseCreationAllowed: false,
  };
}

function envelopeFromEligibility({ draftId, organizationId, eligibility }) {
  const eligible = eligibility && eligibility.eligible === true;
  const status = stringValue(eligibility && eligibility.status) || 'blocked';
  const reasonCode = stringValue(eligibility && eligibility.reasonCode) || 'eligibility_unavailable';
  const requiredActions = Array.isArray(eligibility && eligibility.requiredActions)
    ? eligibility.requiredActions.slice()
    : ['manual_review'];

  return {
    ok: eligible,
    action: ACTION,
    draftId,
    organizationId,
    eligible,
    status,
    reasonCode,
    requiredActions,
    caseCreationAllowed: eligible,
  };
}

function resolveReaderFunction(draftReader) {
  if (typeof draftReader === 'function') {
    return draftReader;
  }

  if (isObject(draftReader) && typeof draftReader.readDraftForCasePreflight === 'function') {
    return draftReader.readDraftForCasePreflight.bind(draftReader);
  }

  if (isObject(draftReader) && typeof draftReader.read === 'function') {
    return draftReader.read.bind(draftReader);
  }

  throw new TypeError('draftReader_required');
}

function sanitizedLookup(input) {
  return {
    draftId: stringValue(input.draftId),
    organizationId: stringValue(input.organizationId),
    actorId: stringValue(input.actorId),
    requestId: stringValue(input.requestId),
  };
}

function assertServiceOptions(options) {
  if (!isObject(options)) {
    throw new TypeError('draftReader_required');
  }
}

function createRepairIntakeDraftCasePreflightService(options = {}) {
  assertServiceOptions(options);

  const readDraft = resolveReaderFunction(options.draftReader);
  const eligibilityEvaluator = typeof options.eligibilityEvaluator === 'function'
    ? options.eligibilityEvaluator
    : evaluateRepairIntakeDraftCaseEligibility;

  async function preflightDraftToCase(input = {}) {
    const safeInput = isObject(input) ? input : {};
    const lookup = sanitizedLookup(safeInput);

    if (!lookup.draftId) {
      return blockedEnvelope({
        reasonCode: 'missing_draft_id',
        requiredActions: ['provide_draft_id'],
      });
    }

    if (!lookup.organizationId) {
      return blockedEnvelope({
        draftId: lookup.draftId,
        reasonCode: 'missing_organization_scope',
        requiredActions: ['provide_organization_scope'],
      });
    }

    let draft;

    try {
      draft = await readDraft(lookup);
    } catch (error) {
      return blockedEnvelope({
        draftId: lookup.draftId,
        organizationId: lookup.organizationId,
        reasonCode: 'draft_reader_failed',
        requiredActions: ['retry_or_manual_review'],
      });
    }

    if (!isObject(draft)) {
      return blockedEnvelope({
        draftId: lookup.draftId,
        organizationId: lookup.organizationId,
        reasonCode: 'draft_not_found',
        requiredActions: ['manual_review'],
      });
    }

    const eligibility = eligibilityEvaluator({ draft });

    return envelopeFromEligibility({
      draftId: lookup.draftId,
      organizationId: lookup.organizationId,
      eligibility,
    });
  }

  return {
    preflightDraftToCase,
  };
}

module.exports = {
  ACTION,
  createRepairIntakeDraftCasePreflightService,
};
