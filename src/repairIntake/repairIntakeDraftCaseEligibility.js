'use strict';

const {
  evaluateRepairIntakeDuplicateCandidateGuard,
} = require('./repairIntakeDuplicateCandidateGuard');

const SUPPORTED_SOURCES = new Set([
  'app',
  'brand_api',
  'call_center',
  'csv_import',
  'dealer_portal',
  'excel_import',
  'line',
  'phone',
  'vendor_portal',
  'web',
]);

const REFERRAL_ONLY_SOURCES = new Set([
  'assisted_referral',
  'handoff',
  'referral',
  'service_request',
]);

const STAGED_IMPORT_SOURCES = new Set([
  'brand_api',
  'csv_import',
  'excel_import',
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
  for (const key of keys) {
    const value = stringValue(source[key]);

    if (value) {
      return value;
    }
  }

  return undefined;
}

function flag(source, keys) {
  return keys.some((key) => source[key] === true);
}

function result(status, reasonCode, requiredActions = []) {
  return {
    eligible: status === 'eligible',
    status,
    reasonCode,
    requiredActions,
  };
}

function hasCaseLink(draft) {
  return Boolean(firstString(draft, [
    'caseId',
    'case_id',
    'formalCaseId',
    'formal_case_id',
    'linkedCaseId',
    'linked_case_id',
  ]));
}

function sourceOf(draft) {
  return normalizedString(
    draft.intakeSource
      || draft.intake_source
      || draft.caseSource
      || draft.case_source
      || draft.draftSource
      || draft.draft_source
      || draft.source,
  );
}

function hasOrganizationScope(draft) {
  return Boolean(firstString(draft, [
    'organizationId',
    'organization_id',
    'tenantId',
    'tenant_id',
  ]));
}

function hasServiceContext(draft) {
  return Boolean(firstString(draft, [
    'brandId',
    'brand_id',
    'serviceProviderId',
    'service_provider_id',
    'providerId',
    'provider_id',
    'responsibleOrganizationId',
    'responsible_organization_id',
  ]));
}

function platformAccepted(draft) {
  return flag(draft, [
    'platformAccepted',
    'platform_accepted',
    'humanAccepted',
    'human_accepted',
    'humanReviewAccepted',
    'human_review_accepted',
    'acceptedByHuman',
    'accepted_by_human',
  ]);
}

function importAccepted(draft) {
  return flag(draft, [
    'importAccepted',
    'import_accepted',
    'stagingAccepted',
    'staging_accepted',
    'draftAccepted',
    'draft_accepted',
    'humanAccepted',
    'human_accepted',
    'humanReviewAccepted',
    'human_review_accepted',
  ]);
}

function contactRolesReady(draft) {
  const separation = normalizedString(
    draft.contactRoleSeparation
      || draft.contact_role_separation
      || draft.reporterCustomerBillingContactSeparation
      || draft.reporter_customer_billing_contact_separation,
  );

  return separation === 'complete'
    || separation === 'reviewed'
    || flag(draft, [
      'contactRolesReviewed',
      'contact_roles_reviewed',
      'reporterCustomerBillingContactReviewed',
      'reporter_customer_billing_contact_reviewed',
    ]);
}

function pickDraft(input) {
  if (!isObject(input)) {
    return undefined;
  }

  if (Object.keys(input).length === 0) {
    return undefined;
  }

  return isObject(input.draft) ? input.draft : input;
}

function evaluateRepairIntakeDraftCaseEligibility(input) {
  const draft = pickDraft(input);

  if (!draft) {
    return result('blocked', 'missing_draft', ['provide_sanitized_draft_metadata']);
  }

  if (hasCaseLink(draft)) {
    return result('blocked', 'already_linked_case', ['do_not_create_duplicate_case']);
  }

  const source = sourceOf(draft);

  if (!source) {
    return result('blocked', 'missing_source', ['provide_supported_intake_source']);
  }

  if (REFERRAL_ONLY_SOURCES.has(source) && !platformAccepted(draft)) {
    return result('needs_review', 'referral_not_platform_accepted', ['obtain_platform_acceptance']);
  }

  if (!SUPPORTED_SOURCES.has(source) && !REFERRAL_ONLY_SOURCES.has(source)) {
    return result('blocked', 'unsupported_source', ['manual_source_review']);
  }

  if (!hasOrganizationScope(draft)) {
    return result('blocked', 'missing_organization_scope', ['provide_organization_scope']);
  }

  if (!hasServiceContext(draft)) {
    return result('needs_review', 'missing_service_context', ['confirm_brand_or_service_provider_context']);
  }

  const duplicateGuard = evaluateRepairIntakeDuplicateCandidateGuard({ draft });

  if (duplicateGuard.status === 'blocked') {
    return result('blocked', duplicateGuard.reasonCode, duplicateGuard.requiredActions);
  }

  if (duplicateGuard.status === 'review_required') {
    return result('needs_review', duplicateGuard.reasonCode, duplicateGuard.requiredActions);
  }

  if (!contactRolesReady(draft)) {
    return result('needs_review', 'contact_role_separation_incomplete', ['review_reporter_customer_billing_contact_roles']);
  }

  if (STAGED_IMPORT_SOURCES.has(source) && !importAccepted(draft)) {
    return result('needs_review', 'staged_import_not_accepted', ['accept_import_staging_result']);
  }

  if (!platformAccepted(draft)) {
    return result('needs_review', 'human_acceptance_missing', ['record_human_acceptance']);
  }

  return result('eligible', 'eligible', []);
}

module.exports = {
  evaluateRepairIntakeDraftCaseEligibility,
};
