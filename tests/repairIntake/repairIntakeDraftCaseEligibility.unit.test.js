'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  evaluateRepairIntakeDraftCaseEligibility,
} = require('../../src/repairIntake/repairIntakeDraftCaseEligibility');

function eligibleDraft(overrides = {}) {
  return {
    draftId: 'draft_task934_001',
    intakeSource: 'web',
    organizationId: 'org_task934',
    serviceProviderId: 'provider_task934',
    duplicateStatus: 'cleared',
    contactRoleSeparation: 'complete',
    platformAccepted: true,
    ...overrides,
  };
}

function assertEnvelope(result, expected) {
  assert.deepEqual(result, {
    eligible: expected.status === 'eligible',
    status: expected.status,
    reasonCode: expected.reasonCode,
    requiredActions: expected.requiredActions,
  });
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertDoesNotRequireRawPayloadFields(draft) {
  for (const key of [
    'phone',
    'phoneNumber',
    'address',
    'customerName',
    'customerPayload',
    'rawPayload',
  ]) {
    assert.equal(Object.prototype.hasOwnProperty.call(draft, key), false, `${key} should not be required`);
  }
}

test('eligible happy path returns stable eligibility envelope', () => {
  const draft = eligibleDraft();

  assertDoesNotRequireRawPayloadFields(draft);
  assertEnvelope(evaluateRepairIntakeDraftCaseEligibility({ draft }), {
    status: 'eligible',
    reasonCode: 'eligible',
    requiredActions: [],
  });
});

test('missing draft blocks safely', () => {
  assertEnvelope(evaluateRepairIntakeDraftCaseEligibility(), {
    status: 'blocked',
    reasonCode: 'missing_draft',
    requiredActions: ['provide_sanitized_draft_metadata'],
  });

  assertEnvelope(evaluateRepairIntakeDraftCaseEligibility(null), {
    status: 'blocked',
    reasonCode: 'missing_draft',
    requiredActions: ['provide_sanitized_draft_metadata'],
  });
});

test('unknown source blocks for manual review without API expansion', () => {
  assertEnvelope(evaluateRepairIntakeDraftCaseEligibility({
    draft: eligibleDraft({ intakeSource: 'unknown_partner_feed' }),
  }), {
    status: 'blocked',
    reasonCode: 'unsupported_source',
    requiredActions: ['manual_source_review'],
  });
});

test('already linked formal Case blocks duplicate Case creation', () => {
  assertEnvelope(evaluateRepairIntakeDraftCaseEligibility({
    draft: eligibleDraft({ linkedCaseId: 'case_task934_existing' }),
  }), {
    status: 'blocked',
    reasonCode: 'already_linked_case',
    requiredActions: ['do_not_create_duplicate_case'],
  });
});

test('referral or handoff source needs platform acceptance before Case promotion', () => {
  assertEnvelope(evaluateRepairIntakeDraftCaseEligibility({
    draft: eligibleDraft({
      intakeSource: 'handoff',
      platformAccepted: false,
    }),
  }), {
    status: 'needs_review',
    reasonCode: 'referral_not_platform_accepted',
    requiredActions: ['obtain_platform_acceptance'],
  });
});

test('import or staging source needs explicit import acceptance', () => {
  assertEnvelope(evaluateRepairIntakeDraftCaseEligibility({
    draft: eligibleDraft({
      intakeSource: 'csv_import',
      importAccepted: false,
      platformAccepted: true,
    }),
  }), {
    status: 'needs_review',
    reasonCode: 'staged_import_not_accepted',
    requiredActions: ['accept_import_staging_result'],
  });
});

test('unresolved duplicate needs review', () => {
  assertEnvelope(evaluateRepairIntakeDraftCaseEligibility({
    draft: eligibleDraft({ duplicateStatus: 'possible_duplicate' }),
  }), {
    status: 'needs_review',
    reasonCode: 'duplicate_unresolved',
    requiredActions: ['resolve_duplicate_review'],
  });
});

test('duplicate candidate stays advisory even when duplicate status was cleared', () => {
  assertEnvelope(evaluateRepairIntakeDraftCaseEligibility({
    draft: eligibleDraft({
      duplicateStatus: 'cleared',
      duplicateCandidate: {
        candidateRef: 'draft_candidate_task1890',
        confirmedDuplicate: true,
        caseId: 'case_should_not_copy',
      },
    }),
  }), {
    status: 'needs_review',
    reasonCode: 'duplicate_candidate_review_required',
    requiredActions: ['review_duplicate_candidate'],
  });
});

test('missing duplicate signal requires review instead of silently allowing promotion', () => {
  assertEnvelope(evaluateRepairIntakeDraftCaseEligibility({
    draft: eligibleDraft({ duplicateStatus: undefined }),
  }), {
    status: 'needs_review',
    reasonCode: 'duplicate_signal_missing',
    requiredActions: ['review_duplicate_candidate_status'],
  });
});

test('confirmed duplicate blocks Case promotion', () => {
  assertEnvelope(evaluateRepairIntakeDraftCaseEligibility({
    draft: eligibleDraft({ duplicateStatus: 'confirmed_duplicate' }),
  }), {
    status: 'blocked',
    reasonCode: 'duplicate_confirmed',
    requiredActions: ['link_or_close_duplicate_draft'],
  });
});

test('missing organization scope blocks promotion', () => {
  assertEnvelope(evaluateRepairIntakeDraftCaseEligibility({
    draft: eligibleDraft({ organizationId: undefined }),
  }), {
    status: 'blocked',
    reasonCode: 'missing_organization_scope',
    requiredActions: ['provide_organization_scope'],
  });
});

test('missing brand or service-provider context needs review', () => {
  assertEnvelope(evaluateRepairIntakeDraftCaseEligibility({
    draft: eligibleDraft({
      serviceProviderId: undefined,
      brandId: undefined,
    }),
  }), {
    status: 'needs_review',
    reasonCode: 'missing_service_context',
    requiredActions: ['confirm_brand_or_service_provider_context'],
  });
});

test('incomplete reporter customer billing contact separation needs review', () => {
  assertEnvelope(evaluateRepairIntakeDraftCaseEligibility({
    draft: eligibleDraft({ contactRoleSeparation: 'incomplete' }),
  }), {
    status: 'needs_review',
    reasonCode: 'contact_role_separation_incomplete',
    requiredActions: ['review_reporter_customer_billing_contact_roles'],
  });
});

test('missing human acceptance needs review for otherwise supported source', () => {
  assertEnvelope(evaluateRepairIntakeDraftCaseEligibility({
    draft: eligibleDraft({ platformAccepted: false }),
  }), {
    status: 'needs_review',
    reasonCode: 'human_acceptance_missing',
    requiredActions: ['record_human_acceptance'],
  });
});

test('snake_case metadata fields are supported for sanitized draft input', () => {
  assertEnvelope(evaluateRepairIntakeDraftCaseEligibility({
    draft: eligibleDraft({
      intakeSource: undefined,
      organizationId: undefined,
      serviceProviderId: undefined,
      duplicateStatus: undefined,
      contactRoleSeparation: undefined,
      platformAccepted: undefined,
      intake_source: 'phone',
      organization_id: 'org_task934',
      service_provider_id: 'provider_task934',
      duplicate_status: 'none',
      contact_roles_reviewed: true,
      platform_accepted: true,
    }),
  }), {
    status: 'eligible',
    reasonCode: 'eligible',
    requiredActions: [],
  });
});

test('input draft is not mutated', () => {
  const draft = eligibleDraft();
  const before = clone(draft);

  evaluateRepairIntakeDraftCaseEligibility({ draft });

  assert.deepEqual(draft, before);
});
