'use strict';

const {
  normalizeRepairIntakeContactRoleDto,
} = require('./repairIntakeContactRoleDtoGuard');

const ACTION = 'repair_intake_draft_to_case_candidate_build';

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

function textHasUnsafeMarker(value) {
  const text = stringValue(value);

  return text ? UNSAFE_TEXT_PATTERNS.some((pattern) => pattern.test(text)) : false;
}

function safeReasonCode(value, fallback) {
  const reasonCode = stringValue(value);

  return reasonCode && !textHasUnsafeMarker(reasonCode) ? reasonCode : fallback;
}

function safeRequiredActions(value, fallback = []) {
  const source = Array.isArray(value) ? value : fallback;
  const sanitized = source
    .filter((item) => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.trim())
    .filter((item) => !textHasUnsafeMarker(item));

  if (sanitized.length > 0) {
    return sanitized;
  }

  return Array.isArray(fallback)
    ? fallback
      .filter((item) => typeof item === 'string' && item.trim().length > 0)
      .map((item) => item.trim())
      .filter((item) => !textHasUnsafeMarker(item))
    : [];
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

function sanitizeRef(value) {
  if (typeof value === 'string') {
    const refId = stringValue(value);

    return refId && !textHasUnsafeMarker(refId) ? { refId } : null;
  }

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

    if (refValue && !textHasUnsafeMarker(refValue)) {
      sanitized[key] = refValue;
    }
  }

  return Object.keys(sanitized).length > 0 ? sanitized : null;
}

function blocked(reasonCode, requiredActions = ['manual_review']) {
  return {
    ok: false,
    action: ACTION,
    candidateReady: false,
    reasonCode: safeReasonCode(reasonCode, 'candidate_metadata_incomplete'),
    requiredActions: safeRequiredActions(requiredActions, ['manual_review']),
    caseCandidate: null,
  };
}

function normalizedPreflight(preflightResult) {
  return isObject(preflightResult) ? preflightResult : undefined;
}

function buildCandidate({ draft, preflightResult, actorContext }) {
  const sourceDraftId = firstString(draft, ['draftId', 'draft_id']) || stringValue(preflightResult.draftId);
  const organizationId = firstString(draft, ['organizationId', 'organization_id']) || stringValue(preflightResult.organizationId);
  const intakeSource = firstString(draft, ['intakeSource', 'intake_source', 'caseSource', 'case_source', 'source']);

  if (!sourceDraftId) {
    return undefined;
  }

  if (!organizationId) {
    return undefined;
  }

  if (!intakeSource) {
    return undefined;
  }

  const contactRoleDto = normalizeRepairIntakeContactRoleDto({
    reporterRef: draft.reporterRef || draft.reporter_ref,
    customerRef: draft.customerRef || draft.customer_ref,
    billingContactRef: draft.billingContactRef || draft.billing_contact_ref,
    onSiteContactOverrideRef: draft.onSiteContactOverrideRef || draft.on_site_contact_override_ref,
  });
  const onSiteContactOverrideRef = contactRoleDto.onSiteContactOverrideRef;

  return {
    sourceDraftId,
    organizationId,
    brandId: firstString(draft, ['brandId', 'brand_id']) || null,
    serviceProviderId: firstString(draft, ['serviceProviderId', 'service_provider_id', 'providerId', 'provider_id']) || null,
    intakeSource,
    serviceType: firstString(draft, ['serviceType', 'service_type']) || null,
    priority: firstString(draft, ['priority']) || null,
    reporterRef: contactRoleDto.reporterRef,
    customerRef: contactRoleDto.customerRef,
    billingContactRef: contactRoleDto.billingContactRef,
    ...(onSiteContactOverrideRef ? { onSiteContactOverrideRef } : {}),
    siteRef: sanitizeRef(draft.siteRef || draft.site_ref),
    issueSummaryRef: sanitizeRef(draft.issueSummaryRef || draft.issue_summary_ref),
    createdByActorId: firstString(actorContext, ['actorId', 'actor_id', 'userId', 'user_id']) || null,
  };
}

function buildRepairIntakeDraftCaseCandidate(input = {}) {
  if (!isObject(input)) {
    return blocked('missing_input', ['provide_candidate_builder_input']);
  }

  const preflightResult = normalizedPreflight(input.preflightResult);

  if (!preflightResult) {
    return blocked('missing_preflight_result', ['run_draft_to_case_preflight']);
  }

  if (preflightResult.caseCreationAllowed !== true) {
    const requiredActions = Array.isArray(preflightResult.requiredActions) && preflightResult.requiredActions.length > 0
      ? safeRequiredActions(preflightResult.requiredActions, ['resolve_preflight_result'])
      : ['resolve_preflight_result'];

    return blocked('preflight_not_allowed', requiredActions);
  }

  const draft = isObject(input.draft) ? input.draft : undefined;

  if (!draft) {
    return blocked('missing_draft', ['provide_sanitized_draft_metadata']);
  }

  if (!firstString(draft, ['organizationId', 'organization_id']) && !stringValue(preflightResult.organizationId)) {
    return blocked('missing_organization_scope', ['provide_organization_scope']);
  }

  const caseCandidate = buildCandidate({
    draft,
    preflightResult,
    actorContext: isObject(input.actorContext) ? input.actorContext : {},
  });

  if (!caseCandidate) {
    return blocked('candidate_metadata_incomplete', ['provide_required_candidate_metadata']);
  }

  return {
    ok: true,
    action: ACTION,
    candidateReady: true,
    reasonCode: 'candidate_ready',
    requiredActions: [],
    caseCandidate,
  };
}

module.exports = {
  ACTION,
  buildRepairIntakeDraftCaseCandidate,
};
