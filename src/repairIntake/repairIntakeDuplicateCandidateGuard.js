'use strict';

const ACTION = 'repair_intake_duplicate_candidate_guard';

const CLEAR_DUPLICATE_STATUSES = new Set([
  'clear',
  'cleared',
  'no_duplicate',
  'none',
  'not_duplicate',
]);

const REVIEW_DUPLICATE_STATUSES = new Set([
  'candidate',
  'candidate_found',
  'pending_review',
  'possible_duplicate',
  'possible_match',
  'review_required',
  'unresolved',
]);

const CONFIRMED_DUPLICATE_STATUSES = new Set([
  'confirmed_duplicate',
  'duplicate',
]);

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

function normalizedString(value) {
  const raw = stringValue(value);

  return raw ? raw.toLowerCase() : undefined;
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

function pickDraft(input) {
  if (!isObject(input)) {
    return undefined;
  }

  return isObject(input.draft) ? input.draft : input;
}

function duplicateStatusOf(draft) {
  return normalizedString(
    draft.duplicateStatus
      || draft.duplicate_status
      || draft.dedupeStatus
      || draft.dedupe_status,
  );
}

function duplicateCandidateOf(draft) {
  if (!isObject(draft)) {
    return undefined;
  }

  return isObject(draft.duplicateCandidate)
    ? draft.duplicateCandidate
    : isObject(draft.duplicate_candidate)
      ? draft.duplicate_candidate
      : undefined;
}

function organizationIdOf(value) {
  return firstString(value, [
    'organizationId',
    'organization_id',
  ]);
}

function fieldIsUnsafe(key) {
  return UNSAFE_FIELD_NAMES.has(String(key).toLowerCase());
}

function sanitizeCandidate(candidate) {
  if (!isObject(candidate)) {
    return null;
  }

  const sanitized = {};

  for (const [key, value] of Object.entries({
    candidateId: candidate.candidateId || candidate.candidate_id,
    candidateRef: candidate.candidateRef || candidate.candidate_ref,
    matchScore: typeof candidate.matchScore === 'number' ? candidate.matchScore : undefined,
    reasonCode: candidate.reasonCode || candidate.reason_code,
    source: candidate.source,
    sourceRef: candidate.sourceRef || candidate.source_ref,
    status: candidate.status,
  })) {
    if (fieldIsUnsafe(key)) {
      continue;
    }

    const safeValue = typeof value === 'number' ? value : stringValue(value);

    if (safeValue !== undefined) {
      sanitized[key] = safeValue;
    }
  }

  return Object.keys(sanitized).length > 0 ? sanitized : null;
}

function envelope({
  ok = false,
  status = 'review_required',
  reasonCode,
  requiredActions = ['review_duplicate_candidate'],
  duplicateCandidate = null,
}) {
  return {
    ok,
    action: ACTION,
    status,
    reasonCode,
    requiredActions,
    duplicateCandidate,
  };
}

function evaluateRepairIntakeDuplicateCandidateGuard(input = {}) {
  const draft = pickDraft(input);

  if (!draft) {
    return envelope({
      reasonCode: 'duplicate_signal_missing',
      requiredActions: ['review_duplicate_candidate_status'],
    });
  }

  const lookupOrganizationId = organizationIdOf(input);
  const draftOrganizationId = organizationIdOf(draft);

  if (
    lookupOrganizationId
    && draftOrganizationId
    && lookupOrganizationId !== draftOrganizationId
  ) {
    return envelope({
      status: 'blocked',
      reasonCode: 'organization_scope_mismatch',
      requiredActions: ['retry_with_matching_organization_scope'],
    });
  }

  const duplicateStatus = duplicateStatusOf(draft);
  const duplicateCandidate = sanitizeCandidate(duplicateCandidateOf(draft));

  if (CONFIRMED_DUPLICATE_STATUSES.has(duplicateStatus)) {
    return envelope({
      status: 'blocked',
      reasonCode: 'duplicate_confirmed',
      requiredActions: ['link_or_close_duplicate_draft'],
      duplicateCandidate,
    });
  }

  if (REVIEW_DUPLICATE_STATUSES.has(duplicateStatus)) {
    return envelope({
      reasonCode: 'duplicate_unresolved',
      requiredActions: ['resolve_duplicate_review'],
      duplicateCandidate,
    });
  }

  if (CLEAR_DUPLICATE_STATUSES.has(duplicateStatus) && !duplicateCandidate) {
    return envelope({
      ok: true,
      status: 'clear',
      reasonCode: 'duplicate_clear',
      requiredActions: [],
    });
  }

  if (duplicateCandidate) {
    return envelope({
      reasonCode: 'duplicate_candidate_review_required',
      requiredActions: ['review_duplicate_candidate'],
      duplicateCandidate,
    });
  }

  return envelope({
    reasonCode: 'duplicate_signal_missing',
    requiredActions: ['review_duplicate_candidate_status'],
  });
}

module.exports = {
  ACTION,
  evaluateRepairIntakeDuplicateCandidateGuard,
};
