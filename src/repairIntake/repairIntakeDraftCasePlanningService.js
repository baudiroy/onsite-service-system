'use strict';

const {
  evaluateRepairIntakeDraftCaseEligibility,
} = require('./repairIntakeDraftCaseEligibility');
const {
  buildRepairIntakeDraftCaseCandidate,
} = require('./repairIntakeDraftCaseCandidateBuilder');
const {
  createRepairIntakeDraftToCasePlanningAuditBoundary,
} = require('./repairIntakeDraftToCasePlanningAuditBoundary');

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

const UNSAFE_TEXT_PATTERNS = Object.freeze([
  /select\s+\*/i,
  /database[_\s-]*url/i,
  /jwt[_\s-]*secret/i,
  /provider\s*payload/i,
  /\braw(?:body|draft|input|payload|request|result|row|rows)?\b/i,
  /\bphone\b/i,
  /\baddress\b/i,
  /\bsql\b/i,
  /\bstack\b/i,
  /\btoken\b/i,
  /\bsecret\b/i,
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

function textHasUnsafeMarker(value) {
  const text = stringValue(value);

  return text ? UNSAFE_TEXT_PATTERNS.some((pattern) => pattern.test(text)) : false;
}

function safeReasonCode(value, fallback) {
  const reasonCode = stringValue(value);

  return reasonCode && !textHasUnsafeMarker(reasonCode) ? reasonCode : fallback;
}

function safeRequiredActions(value, fallback = []) {
  const sanitized = safeArray(value)
    .filter((item) => !textHasUnsafeMarker(item));

  if (sanitized.length > 0) {
    return sanitized;
  }

  return safeArray(fallback)
    .filter((item) => !textHasUnsafeMarker(item));
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

function resolvePlanningAuditRecorder(options) {
  if (isObject(options.planningAuditBoundary)
    && typeof options.planningAuditBoundary.recordPlanningDecision === 'function') {
    return options.planningAuditBoundary.recordPlanningDecision.bind(options.planningAuditBoundary);
  }

  if (isObject(options.auditBoundary)
    && typeof options.auditBoundary.recordPlanningDecision === 'function') {
    return options.auditBoundary.recordPlanningDecision.bind(options.auditBoundary);
  }

  if (options.auditWriter !== undefined) {
    return createRepairIntakeDraftToCasePlanningAuditBoundary({
      auditWriter: options.auditWriter,
      clock: options.clock,
    }).recordPlanningDecision;
  }

  return null;
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
    reasonCode: safeReasonCode(reasonCode, 'repair_intake_draft_to_case_plan_blocked'),
    requiredActions: safeRequiredActions(requiredActions),
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

function auditPlanResult(result) {
  return sanitizeValue({
    ok: result.ok === true,
    action: stringValue(result.action),
    draftId: stringValue(result.draftId),
    organizationId: stringValue(result.organizationId),
    eligible: result.eligible === true,
    status: stringValue(result.status),
    reasonCode: stringValue(result.reasonCode),
    requiredActions: safeArray(result.requiredActions),
    caseCreationAllowed: result.caseCreationAllowed === true,
    candidateReady: result.candidateReady === true,
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
    reasonCode: safeReasonCode(eligibility && eligibility.reasonCode, 'eligibility_unavailable'),
    requiredActions: safeRequiredActions(eligibility && eligibility.requiredActions, ['manual_review']),
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

  const safeOptions = options;
  const readDraft = resolveReaderFunction(safeOptions.draftReader);
  const eligibilityEvaluator = typeof safeOptions.eligibilityEvaluator === 'function'
    ? safeOptions.eligibilityEvaluator
    : evaluateRepairIntakeDraftCaseEligibility;
  const candidateBuilder = typeof safeOptions.candidateBuilder === 'function'
    ? safeOptions.candidateBuilder
    : buildRepairIntakeDraftCaseCandidate;
  const recordPlanningAudit = resolvePlanningAuditRecorder(safeOptions);

  async function returnWithAudit(result, lookup) {
    if (typeof recordPlanningAudit !== 'function') {
      return result;
    }

    try {
      await recordPlanningAudit({
        draftId: result.draftId || lookup.draftId,
        organizationId: result.organizationId || lookup.organizationId,
        actorId: lookup.actorId,
        requestId: lookup.requestId,
        sourceBoundary: 'repair_intake_draft_case_planning_service',
        planResult: auditPlanResult(result),
      });
    } catch (error) {
      // Audit is internal-only and must not change the planning response.
    }

    return result;
  }

  async function planDraftToCase(input = {}) {
    const safeInput = isObject(input) ? input : {};
    const lookup = sanitizedLookup(safeInput);

    if (!lookup.draftId) {
      return returnWithAudit(blocked({
        reasonCode: 'missing_draft_id',
        requiredActions: ['provide_draft_id'],
      }), lookup);
    }

    if (!lookup.organizationId) {
      return returnWithAudit(blocked({
        draftId: lookup.draftId,
        reasonCode: 'missing_organization_scope',
        requiredActions: ['provide_organization_scope'],
      }), lookup);
    }

    let draft;

    try {
      draft = await readDraft(lookup);
    } catch (error) {
      return returnWithAudit(blocked({
        draftId: lookup.draftId,
        organizationId: lookup.organizationId,
        reasonCode: 'draft_reader_failed',
        requiredActions: ['retry_or_manual_review'],
      }), lookup);
    }

    if (!isObject(draft)) {
      return returnWithAudit(blocked({
        draftId: lookup.draftId,
        organizationId: lookup.organizationId,
        reasonCode: 'draft_not_found',
        requiredActions: ['manual_review'],
      }), lookup);
    }

    if (!draftMatchesLookupOrganization(draft, lookup)) {
      return returnWithAudit(envelope({
        draftId: lookup.draftId,
        organizationId: lookup.organizationId,
        status: 'blocked',
        reasonCode: 'organization_scope_mismatch',
        requiredActions: ['retry_with_matching_organization_scope'],
      }), lookup);
    }

    const eligibility = eligibilityEvaluator({ draft });
    const preflightResult = preflightFromEligibility({
      draftId: lookup.draftId,
      organizationId: lookup.organizationId,
      eligibility,
    });

    if (preflightResult.caseCreationAllowed !== true) {
      return returnWithAudit(envelope({
        draftId: lookup.draftId,
        organizationId: lookup.organizationId,
        eligible: false,
        status: preflightResult.status,
        reasonCode: preflightResult.reasonCode,
        requiredActions: preflightResult.requiredActions,
      }), lookup);
    }

    const candidateResult = candidateBuilder({
      draft,
      preflightResult,
      actorContext: {
        actorId: lookup.actorId,
      },
    });

    if (!isObject(candidateResult) || candidateResult.candidateReady !== true) {
      return returnWithAudit(envelope({
        draftId: lookup.draftId,
        organizationId: lookup.organizationId,
        eligible: true,
        status: 'blocked',
        reasonCode: safeReasonCode(candidateResult && candidateResult.reasonCode, 'candidate_not_ready'),
        requiredActions: safeRequiredActions(candidateResult && candidateResult.requiredActions, ['manual_review']),
        caseCreationAllowed: true,
      }), lookup);
    }

    return returnWithAudit(envelope({
      ok: true,
      draftId: lookup.draftId,
      organizationId: lookup.organizationId,
      eligible: true,
      status: 'eligible',
      reasonCode: safeReasonCode(candidateResult.reasonCode, 'candidate_ready'),
      requiredActions: safeRequiredActions(candidateResult.requiredActions),
      caseCreationAllowed: true,
      candidateReady: true,
      caseCandidate: candidateResult.caseCandidate,
    }), lookup);
  }

  return {
    planDraftToCase,
  };
}

module.exports = {
  ACTION,
  createRepairIntakeDraftCasePlanningService,
};
