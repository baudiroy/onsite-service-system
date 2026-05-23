'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  ACTION,
  buildRepairIntakeDraftCaseCandidate,
} = require('../../src/repairIntake/repairIntakeDraftCaseCandidateBuilder');

const SOURCE_PATH = path.join(__dirname, '../../src/repairIntake/repairIntakeDraftCaseCandidateBuilder.js');

function eligiblePreflight(overrides = {}) {
  return {
    ok: true,
    action: 'repair_intake_draft_to_case_preflight',
    draftId: 'draft_task936_001',
    organizationId: 'org_task936',
    eligible: true,
    status: 'eligible',
    reasonCode: 'eligible',
    requiredActions: [],
    caseCreationAllowed: true,
    ...overrides,
  };
}

function blockedPreflight(overrides = {}) {
  return {
    ok: false,
    action: 'repair_intake_draft_to_case_preflight',
    draftId: 'draft_task936_001',
    organizationId: 'org_task936',
    eligible: false,
    status: 'blocked',
    reasonCode: 'duplicate_confirmed',
    requiredActions: ['link_or_close_duplicate_draft'],
    caseCreationAllowed: false,
    ...overrides,
  };
}

function sanitizedDraft(overrides = {}) {
  return {
    draftId: 'draft_task936_001',
    organizationId: 'org_task936',
    brandId: 'brand_task936',
    serviceProviderId: 'provider_task936',
    intakeSource: 'web',
    serviceType: 'onsite',
    priority: 'normal',
    reporterRef: { refId: 'reporter_ref_task936', type: 'reporter' },
    customerRef: { refId: 'customer_ref_task936', type: 'customer' },
    billingContactRef: { refId: 'billing_ref_task936', type: 'billing_contact' },
    siteRef: { refId: 'site_ref_task936', type: 'service_site' },
    issueSummaryRef: { refId: 'issue_ref_task936', type: 'issue_summary' },
    ...overrides,
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertNoForbiddenFields(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'caseId',
    'case_id',
    'createdCaseId',
    'finalAppointmentId',
    'final_appointment_id',
    'phone',
    'address',
    'customerPayload',
    'rawPayload',
    'sql',
    'stack',
    'providerPayload',
    'token',
    'secret',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('eligible preflight builds sanitized candidate', () => {
  const result = buildRepairIntakeDraftCaseCandidate({
    draft: sanitizedDraft(),
    preflightResult: eligiblePreflight(),
    actorContext: { actorId: 'actor_task936' },
  });

  assert.equal(result.ok, true);
  assert.equal(result.action, ACTION);
  assert.equal(result.candidateReady, true);
  assert.equal(result.reasonCode, 'candidate_ready');
  assert.deepEqual(result.requiredActions, []);
  assert.deepEqual(result.caseCandidate, {
    sourceDraftId: 'draft_task936_001',
    organizationId: 'org_task936',
    brandId: 'brand_task936',
    serviceProviderId: 'provider_task936',
    intakeSource: 'web',
    serviceType: 'onsite',
    priority: 'normal',
    reporterRef: { refId: 'reporter_ref_task936', type: 'reporter' },
    customerRef: { refId: 'customer_ref_task936', type: 'customer' },
    billingContactRef: { refId: 'billing_ref_task936', type: 'billing_contact' },
    siteRef: { refId: 'site_ref_task936', type: 'service_site' },
    issueSummaryRef: { refId: 'issue_ref_task936', type: 'issue_summary' },
    createdByActorId: 'actor_task936',
  });
  assertNoForbiddenFields(result);
});

test('blocked preflight does not build candidate and preserves required actions', () => {
  const result = buildRepairIntakeDraftCaseCandidate({
    draft: sanitizedDraft(),
    preflightResult: blockedPreflight(),
  });

  assert.deepEqual(result, {
    ok: false,
    action: ACTION,
    candidateReady: false,
    reasonCode: 'preflight_not_allowed',
    requiredActions: ['link_or_close_duplicate_draft'],
    caseCandidate: null,
  });
});

test('needs-review preflight does not build candidate', () => {
  const result = buildRepairIntakeDraftCaseCandidate({
    draft: sanitizedDraft(),
    preflightResult: blockedPreflight({
      status: 'needs_review',
      reasonCode: 'duplicate_unresolved',
      requiredActions: ['resolve_duplicate_review'],
    }),
  });

  assert.equal(result.candidateReady, false);
  assert.equal(result.reasonCode, 'preflight_not_allowed');
  assert.deepEqual(result.requiredActions, ['resolve_duplicate_review']);
});

test('missing preflight returns safe blocked envelope', () => {
  assert.deepEqual(buildRepairIntakeDraftCaseCandidate({
    draft: sanitizedDraft(),
  }), {
    ok: false,
    action: ACTION,
    candidateReady: false,
    reasonCode: 'missing_preflight_result',
    requiredActions: ['run_draft_to_case_preflight'],
    caseCandidate: null,
  });
});

test('missing draft returns safe blocked envelope', () => {
  assert.deepEqual(buildRepairIntakeDraftCaseCandidate({
    preflightResult: eligiblePreflight(),
  }), {
    ok: false,
    action: ACTION,
    candidateReady: false,
    reasonCode: 'missing_draft',
    requiredActions: ['provide_sanitized_draft_metadata'],
    caseCandidate: null,
  });
});

test('missing organization scope returns safe blocked envelope', () => {
  assert.deepEqual(buildRepairIntakeDraftCaseCandidate({
    draft: sanitizedDraft({ organizationId: undefined }),
    preflightResult: eligiblePreflight({ organizationId: null }),
  }), {
    ok: false,
    action: ACTION,
    candidateReady: false,
    reasonCode: 'missing_organization_scope',
    requiredActions: ['provide_organization_scope'],
    caseCandidate: null,
  });
});

test('candidate does not include caseId or finalAppointmentId even if draft has unsafe fields', () => {
  const result = buildRepairIntakeDraftCaseCandidate({
    draft: sanitizedDraft({
      caseId: 'case_should_not_copy',
      finalAppointmentId: 'final_should_not_copy',
    }),
    preflightResult: eligiblePreflight(),
  });

  assertNoForbiddenFields(result);
});

test('candidate does not include raw phone address customer payload or provider payload', () => {
  const result = buildRepairIntakeDraftCaseCandidate({
    draft: sanitizedDraft({
      phone: 'phone',
      address: 'address',
      customerPayload: { value: 'customerPayload' },
      rawPayload: 'rawPayload',
      providerPayload: 'providerPayload',
      token: 'token',
      secret: 'secret',
      reporterRef: {
        refId: 'reporter_ref_task936',
        type: 'reporter',
        phone: 'phone',
        address: 'address',
      },
    }),
    preflightResult: eligiblePreflight(),
  });

  assert.deepEqual(result.caseCandidate.reporterRef, {
    refId: 'reporter_ref_task936',
    type: 'reporter',
  });
  assertNoForbiddenFields(result);
});

test('candidate preserves allowed sanitized refs and nullable scope fields', () => {
  const result = buildRepairIntakeDraftCaseCandidate({
    draft: sanitizedDraft({
      brandId: undefined,
      serviceProviderId: undefined,
      reporterRef: 'reporter_ref_string_task936',
      customerRef: { id: 'customer_id_task936', role: 'customer', reviewStatus: 'reviewed' },
      billingContactRef: undefined,
      siteRef: undefined,
      issueSummaryRef: undefined,
    }),
    preflightResult: eligiblePreflight(),
  });

  assert.equal(result.caseCandidate.brandId, null);
  assert.equal(result.caseCandidate.serviceProviderId, null);
  assert.deepEqual(result.caseCandidate.reporterRef, { refId: 'reporter_ref_string_task936' });
  assert.deepEqual(result.caseCandidate.customerRef, {
    id: 'customer_id_task936',
    role: 'customer',
    reviewStatus: 'reviewed',
  });
  assert.equal(result.caseCandidate.billingContactRef, null);
  assert.equal(result.caseCandidate.siteRef, null);
  assert.equal(result.caseCandidate.issueSummaryRef, null);
});

test('unsafe raw fields are ignored and incomplete metadata uses stable reason code', () => {
  const result = buildRepairIntakeDraftCaseCandidate({
    draft: sanitizedDraft({
      draftId: undefined,
      intakeSource: undefined,
      phone: 'phone',
      address: 'address',
    }),
    preflightResult: eligiblePreflight({ draftId: null }),
  });

  assert.deepEqual(result, {
    ok: false,
    action: ACTION,
    candidateReady: false,
    reasonCode: 'candidate_metadata_incomplete',
    requiredActions: ['provide_required_candidate_metadata'],
    caseCandidate: null,
  });
});

test('input is not mutated', () => {
  const input = {
    draft: sanitizedDraft(),
    preflightResult: eligiblePreflight(),
    actorContext: { actorId: 'actor_task936' },
  };
  const before = clone(input);

  buildRepairIntakeDraftCaseCandidate(input);

  assert.deepEqual(input, before);
});

test('source has no DB repository provider or audit dependencies', () => {
  const source = fs.readFileSync(SOURCE_PATH, 'utf8');

  for (const forbidden of [
    'require(',
    'Repository',
    'query(',
    'execute(',
    'auditWriter',
    'axios',
    'fetch(',
  ]) {
    if (forbidden === 'require(') {
      assert.equal(source.includes(forbidden), false, 'builder should not import dependencies');
    } else {
      assert.equal(source.includes(forbidden), false, `source should not include ${forbidden}`);
    }
  }
});
