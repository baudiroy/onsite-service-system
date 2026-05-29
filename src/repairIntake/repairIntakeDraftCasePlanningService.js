'use strict';

const {
  evaluateRepairIntakeDraftCaseEligibility,
} = require('./repairIntakeDraftCaseEligibility');
const {
  buildRepairIntakeDraftCaseCandidate,
} = require('./repairIntakeDraftCaseCandidateBuilder');

const ACTION = 'repair_intake_draft_to_case_plan';

const UNSAFE_FIELD_NAMES = new Set([
  'address',
  'authorization',
  'caseid',
  'case_id',
  'caseno',
  'case_no',
  'caseref',
  'case_ref',
  'confirmedduplicate',
  'confirmed_duplicate',
  'cookie',
  'customerpayload',
  'database_url',
  'databaseurl',
  'db',
  'error',
  'finalappointmentid',
  'final_appointment_id',
  'headers',
  'lineaccesstoken',
  'lineuserid',
  'phone',
  'providerpayload',
  'raw',
  'rawbody',
  'rawdraft',
  'rawinput',
  'rawpayload',
  'rawportoutput',
  'rawrows',
  'secret',
  'sql',
  'stack',
  'token',
]);

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stringValue(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function firstString(source, keys) {
  if (!isObject(source)) {
    return undefined;
  }

  for (const key of keys) {
    const value = stringValue(source[key]);

    if (value) {
      return value;
    }
  }

  return undefined;
}

function safeArray(value, fallback = []) {
  const source = Array.isArray(value) ? value : fallback;

  return source
    .filter((item) => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.trim());
}

function fieldIsUnsafe(key) {
  return UNSAFE_FIELD_NAMES.has(String(key).toLowerCase());
}

function sanitizeValue(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeValue(item))
      .filter((item) => item !== undefined);
  }

  if (isObject(value)) {
    const result = {};

    for (const [key, fieldValue] of Object.entries(value)) {
      if (fieldIsUnsafe(key)) {
        continue;
      }

      const sanitized = sanitizeValue(fieldValue);

      if (sanitized !== undefined) {
        result[key] = sanitized;
      }
    }

    return result;
  }

  if (value === undefined || typeof value === 'function' || typeof value === 'symbol') {
    return undefined;
  }

  return value;
}

function resolveReaderFunction(draftReader) {
  if (typeof draftReader === 'function') {
    return draftReader;
  }

  if (isObject(draftReader) && typeof draftReader.readDraftForCasePlanning === 'function') {
    return draftReader.readDraftForCasePlanning.bind(draftReader);
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

function envelope({
  ok = false,
  draftId = null,
  organizationId = null,
  eligible = false,
  status = 'blocked',
  reasonCode,
  requiredActions = [],
  caseCreationAllowed = false,
  candidateReady = false,
  caseCandidate = null,
}) {
  const sanitizedCandidate = caseCandidate === null ? null : sanitizeValue(caseCandidate);

  return sanitizeValue({
    ok,
    action: ACTION,
    draftId,
    organizationId,
    eligible,
    status,
    reasonCode,
    requiredActions: safeArray(requiredActions),
    caseCreationAllowed,
    candidateReady,
    caseCandidate: sanitizedCandidate,
  });
}

function blocked({ draftId = null, organizationId = null, reasonCode, requiredActions }) {
  return envelope({
    draftId,
    organizationId,
    reasonCode,
    requiredActions,
  });
}

function preflightFromEligibility({ draftId, organizationId, eligibility }) {
  const eligible = eligibility && eligibility.eligible === true;

  return {
    ok: eligible,
    action: 'repair_intake_draft_to_case_preflight',
    draftId,
    organizationId,
    eligible,
    status: stringValue(eligibility && eligibility.status) || 'blocked',
    reasonCode: stringValue(eligibility && eligibility.reasonCode) || 'eligibility_unavailable',
    requiredActions: safeArray(eligibility && eligibility.requiredActions, ['manual_review']),
    caseCreationAllowed: eligible,
  };
}

function draftOrganizationIdOf(draft) {
  return firstString(draft, [
    'organizationId',
    'organization_id',
  ]);
}

function draftMatchesLookupOrganization(draft, lookup) {
  const draftOrganizationId = draftOrganizationIdOf(draft);

  return !draftOrganizationId || draftOrganizationId === lookup.organizationId;
}

function createRepairIntakeDraftCasePlanningService(options = {}) {
  if (!isObject(options)) {
    throw new TypeError('draftReader_required');
  }

  const readDraft = resolveReaderFunction(options.draftReader);
  const eligibilityEvaluator = typeof options.eligibilityEvaluator === 'function'
    ? options.eligibilityEvaluator
    : evaluateRepairIntakeDraftCaseEligibility;
  const candidateBuilder = typeof options.candidateBuilder === 'function'
    ? options.candidateBuilder
    : buildRepairIntakeDraftCaseCandidate;

  async function planDraftToCase(input = {}) {
    const safeInput = isObject(input) ? input : {};
    const lookup = sanitizedLookup(safeInput);

    if (!lookup.draftId) {
      return blocked({
        reasonCode: 'missing_draft_id',
        requiredActions: ['provide_draft_id'],
      });
    }

    if (!lookup.organizationId) {
      return blocked({
        draftId: lookup.draftId,
        reasonCode: 'missing_organization_scope',
        requiredActions: ['provide_organization_scope'],
      });
    }

    let draft;

    try {
      draft = await readDraft(lookup);
    } catch (error) {
      return blocked({
        draftId: lookup.draftId,
        organizationId: lookup.organizationId,
        reasonCode: 'draft_reader_failed',
        requiredActions: ['retry_or_manual_review'],
      });
    }

    if (!isObject(draft)) {
      return blocked({
        draftId: lookup.draftId,
        organizationId: lookup.organizationId,
        reasonCode: 'draft_not_found',
        requiredActions: ['manual_review'],
      });
    }

    if (!draftMatchesLookupOrganization(draft, lookup)) {
      return envelope({
        draftId: lookup.draftId,
        organizationId: lookup.organizationId,
        status: 'blocked',
        reasonCode: 'organization_scope_mismatch',
        requiredActions: ['retry_with_matching_organization_scope'],
      });
    }

    const eligibility = eligibilityEvaluator({ draft });
    const preflightResult = preflightFromEligibility({
      draftId: lookup.draftId,
      organizationId: lookup.organizationId,
      eligibility,
    });

    if (preflightResult.caseCreationAllowed !== true) {
      return envelope({
        draftId: lookup.draftId,
        organizationId: lookup.organizationId,
        eligible: false,
        status: preflightResult.status,
        reasonCode: preflightResult.reasonCode,
        requiredActions: preflightResult.requiredActions,
      });
    }

    const candidateResult = candidateBuilder({
      draft,
      preflightResult,
      actorContext: {
        actorId: lookup.actorId,
      },
    });

    if (!isObject(candidateResult) || candidateResult.candidateReady !== true) {
      return envelope({
        draftId: lookup.draftId,
        organizationId: lookup.organizationId,
        eligible: true,
        status: 'blocked',
        reasonCode: stringValue(candidateResult && candidateResult.reasonCode) || 'candidate_not_ready',
        requiredActions: safeArray(candidateResult && candidateResult.requiredActions, ['manual_review']),
        caseCreationAllowed: true,
      });
    }

    return envelope({
      ok: true,
      draftId: lookup.draftId,
      organizationId: lookup.organizationId,
      eligible: true,
      status: 'eligible',
      reasonCode: candidateResult.reasonCode || 'candidate_ready',
      requiredActions: safeArray(candidateResult.requiredActions),
      caseCreationAllowed: true,
      candidateReady: true,
      caseCandidate: candidateResult.caseCandidate,
    });
  }

  return {
    planDraftToCase,
  };
}

module.exports = {
  ACTION,
  createRepairIntakeDraftCasePlanningService,
};
