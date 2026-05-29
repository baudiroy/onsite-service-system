'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  ACTION,
  createRepairIntakeDraftCasePlanningService,
} = require('../../src/repairIntake/repairIntakeDraftCasePlanningService');

function lookupInput(overrides = {}) {
  return {
    draftId: 'draft_task937_001',
    organizationId: 'org_task937',
    actorId: 'actor_task937',
    requestId: 'request_task937',
    ...overrides,
  };
}

function sanitizedDraft(overrides = {}) {
  return {
    draftId: 'draft_task937_001',
    organizationId: 'org_task937',
    brandId: 'brand_task937',
    serviceProviderId: 'provider_task937',
    intakeSource: 'web',
    serviceType: 'onsite',
    priority: 'normal',
    duplicateStatus: 'cleared',
    contactRoleSeparation: 'complete',
    platformAccepted: true,
    reporterRef: { refId: 'reporter_ref_task937', type: 'reporter' },
    customerRef: { refId: 'customer_ref_task937', type: 'customer' },
    billingContactRef: { refId: 'billing_ref_task937', type: 'billing_contact' },
    siteRef: { refId: 'site_ref_task937', type: 'service_site' },
    issueSummaryRef: { refId: 'issue_ref_task937', type: 'issue_summary' },
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
    'select *',
    'stack trace',
    'providerPayload',
    'token',
    'secret',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('eligible draft returns allowed plan with sanitized candidate', async () => {
  const service = createRepairIntakeDraftCasePlanningService({
    draftReader: async () => sanitizedDraft(),
  });

  const result = await service.planDraftToCase(lookupInput());

  assert.equal(result.ok, true);
  assert.equal(result.action, ACTION);
  assert.equal(result.draftId, 'draft_task937_001');
  assert.equal(result.organizationId, 'org_task937');
  assert.equal(result.eligible, true);
  assert.equal(result.status, 'eligible');
  assert.equal(result.reasonCode, 'candidate_ready');
  assert.deepEqual(result.requiredActions, []);
  assert.equal(result.caseCreationAllowed, true);
  assert.equal(result.candidateReady, true);
  assert.deepEqual(result.caseCandidate, {
    sourceDraftId: 'draft_task937_001',
    organizationId: 'org_task937',
    brandId: 'brand_task937',
    serviceProviderId: 'provider_task937',
    intakeSource: 'web',
    serviceType: 'onsite',
    priority: 'normal',
    reporterRef: { refId: 'reporter_ref_task937', type: 'reporter' },
    customerRef: { refId: 'customer_ref_task937', type: 'customer' },
    billingContactRef: { refId: 'billing_ref_task937', type: 'billing_contact' },
    siteRef: { refId: 'site_ref_task937', type: 'service_site' },
    issueSummaryRef: { refId: 'issue_ref_task937', type: 'issue_summary' },
    createdByActorId: 'actor_task937',
  });
  assertNoForbiddenFields(result);
});

test('blocked eligibility returns no candidate', async () => {
  const service = createRepairIntakeDraftCasePlanningService({
    draftReader: async () => sanitizedDraft({ linkedCaseId: 'existing_case_task937' }),
  });

  const result = await service.planDraftToCase(lookupInput());

  assert.equal(result.ok, false);
  assert.equal(result.eligible, false);
  assert.equal(result.status, 'blocked');
  assert.equal(result.reasonCode, 'already_linked_case');
  assert.deepEqual(result.requiredActions, ['do_not_create_duplicate_case']);
  assert.equal(result.caseCreationAllowed, false);
  assert.equal(result.candidateReady, false);
  assert.equal(result.caseCandidate, null);
});

test('needs-review eligibility returns no candidate', async () => {
  const service = createRepairIntakeDraftCasePlanningService({
    draftReader: async () => sanitizedDraft({ duplicateStatus: 'possible_duplicate' }),
  });

  const result = await service.planDraftToCase(lookupInput());

  assert.equal(result.ok, false);
  assert.equal(result.eligible, false);
  assert.equal(result.status, 'needs_review');
  assert.equal(result.reasonCode, 'duplicate_unresolved');
  assert.deepEqual(result.requiredActions, ['resolve_duplicate_review']);
  assert.equal(result.caseCandidate, null);
});

test('duplicate candidate metadata stays advisory and returns review-required plan only', async () => {
  const service = createRepairIntakeDraftCasePlanningService({
    draftReader: async () => sanitizedDraft({
      duplicateStatus: 'possible_duplicate',
      duplicateCandidate: {
        candidateRef: 'draft_candidate_task1889',
        confirmedDuplicate: true,
        caseId: 'case_should_not_copy',
        phone: 'phone',
      },
    }),
  });

  const result = await service.planDraftToCase(lookupInput());

  assert.equal(result.ok, false);
  assert.equal(result.status, 'needs_review');
  assert.equal(result.reasonCode, 'duplicate_unresolved');
  assert.deepEqual(result.requiredActions, ['resolve_duplicate_review']);
  assert.equal(result.caseCreationAllowed, false);
  assert.equal(result.candidateReady, false);
  assert.equal(result.caseCandidate, null);
  assertNoForbiddenFields(result);
});

test('organization mismatch fails closed before candidate builder is called', async () => {
  let builderCalled = false;
  const service = createRepairIntakeDraftCasePlanningService({
    draftReader: async () => sanitizedDraft({ organizationId: 'other_org_task1889' }),
    candidateBuilder: () => {
      builderCalled = true;
      return {
        ok: true,
        candidateReady: true,
        caseCandidate: { sourceDraftId: 'draft_task937_001', organizationId: 'other_org_task1889' },
      };
    },
  });

  const result = await service.planDraftToCase(lookupInput());

  assert.equal(builderCalled, false);
  assert.deepEqual(result, {
    ok: false,
    action: ACTION,
    draftId: 'draft_task937_001',
    organizationId: 'org_task937',
    eligible: false,
    status: 'blocked',
    reasonCode: 'organization_scope_mismatch',
    requiredActions: ['retry_with_matching_organization_scope'],
    caseCreationAllowed: false,
    candidateReady: false,
    caseCandidate: null,
  });
});

test('candidate builder blocked result is preserved as no candidate', async () => {
  const service = createRepairIntakeDraftCasePlanningService({
    draftReader: async () => sanitizedDraft({ intakeSource: undefined }),
    eligibilityEvaluator: () => ({
      eligible: true,
      status: 'eligible',
      reasonCode: 'eligible',
      requiredActions: [],
    }),
  });

  const result = await service.planDraftToCase(lookupInput());

  assert.equal(result.ok, false);
  assert.equal(result.eligible, true);
  assert.equal(result.status, 'blocked');
  assert.equal(result.reasonCode, 'candidate_metadata_incomplete');
  assert.deepEqual(result.requiredActions, ['provide_required_candidate_metadata']);
  assert.equal(result.caseCreationAllowed, true);
  assert.equal(result.candidateReady, false);
  assert.equal(result.caseCandidate, null);
});

test('missing draftId returns safe blocked envelope before reader lookup', async () => {
  let called = false;
  const service = createRepairIntakeDraftCasePlanningService({
    draftReader: async () => {
      called = true;
      return sanitizedDraft();
    },
  });

  const result = await service.planDraftToCase(lookupInput({ draftId: '' }));

  assert.equal(called, false);
  assert.deepEqual(result, {
    ok: false,
    action: ACTION,
    draftId: null,
    organizationId: null,
    eligible: false,
    status: 'blocked',
    reasonCode: 'missing_draft_id',
    requiredActions: ['provide_draft_id'],
    caseCreationAllowed: false,
    candidateReady: false,
    caseCandidate: null,
  });
});

test('missing organizationId returns safe blocked envelope before reader lookup', async () => {
  let called = false;
  const service = createRepairIntakeDraftCasePlanningService({
    draftReader: async () => {
      called = true;
      return sanitizedDraft();
    },
  });

  const result = await service.planDraftToCase(lookupInput({ organizationId: '' }));

  assert.equal(called, false);
  assert.deepEqual(result, {
    ok: false,
    action: ACTION,
    draftId: 'draft_task937_001',
    organizationId: null,
    eligible: false,
    status: 'blocked',
    reasonCode: 'missing_organization_scope',
    requiredActions: ['provide_organization_scope'],
    caseCreationAllowed: false,
    candidateReady: false,
    caseCandidate: null,
  });
});

test('missing or invalid draftReader is rejected at construction', () => {
  assert.throws(() => createRepairIntakeDraftCasePlanningService(), /draftReader_required/);
  assert.throws(() => createRepairIntakeDraftCasePlanningService({ draftReader: {} }), /draftReader_required/);
});

test('reader receives only sanitized lookup input', async () => {
  let readerInput;
  const service = createRepairIntakeDraftCasePlanningService({
    draftReader: async (lookup) => {
      readerInput = lookup;

      return sanitizedDraft();
    },
  });

  await service.planDraftToCase({
    ...lookupInput(),
    phone: 'phone',
    address: 'address',
    customerPayload: { value: 'customerPayload' },
    rawPayload: 'rawPayload',
  });

  assert.deepEqual(readerInput, {
    draftId: 'draft_task937_001',
    organizationId: 'org_task937',
    actorId: 'actor_task937',
    requestId: 'request_task937',
  });
});

test('reader returning null becomes safe blocked result', async () => {
  const service = createRepairIntakeDraftCasePlanningService({
    draftReader: async () => null,
  });

  const result = await service.planDraftToCase(lookupInput());

  assert.equal(result.reasonCode, 'draft_not_found');
  assert.deepEqual(result.requiredActions, ['manual_review']);
  assert.equal(result.caseCandidate, null);
});

test('reader throwing returns safe blocked result without raw error leakage', async () => {
  const service = createRepairIntakeDraftCasePlanningService({
    draftReader: async () => {
      throw new Error('select * stack trace providerPayload token secret phone address customerPayload');
    },
  });

  const result = await service.planDraftToCase(lookupInput());

  assert.deepEqual(result, {
    ok: false,
    action: ACTION,
    draftId: 'draft_task937_001',
    organizationId: 'org_task937',
    eligible: false,
    status: 'blocked',
    reasonCode: 'draft_reader_failed',
    requiredActions: ['retry_or_manual_review'],
    caseCreationAllowed: false,
    candidateReady: false,
    caseCandidate: null,
  });
  assertNoForbiddenFields(result);
});

test('unsafe raw fields from draft are ignored by final envelope', async () => {
  const service = createRepairIntakeDraftCasePlanningService({
    draftReader: async () => sanitizedDraft({
      phone: 'phone',
      address: 'address',
      customerPayload: 'customerPayload',
      rawPayload: 'rawPayload',
      providerPayload: 'providerPayload',
      token: 'token',
      secret: 'secret',
      reporterRef: {
        refId: 'reporter_ref_task937',
        type: 'reporter',
        phone: 'phone',
        address: 'address',
      },
    }),
  });

  const result = await service.planDraftToCase(lookupInput());

  assert.deepEqual(result.caseCandidate.reporterRef, {
    refId: 'reporter_ref_task937',
    type: 'reporter',
  });
  assertNoForbiddenFields(result);
});

test('caseId and finalAppointmentId from draft do not pass through final envelope', async () => {
  const service = createRepairIntakeDraftCasePlanningService({
    draftReader: async () => sanitizedDraft({
      caseId: 'case_should_not_copy',
      finalAppointmentId: 'final_should_not_copy',
    }),
    eligibilityEvaluator: () => ({
      eligible: true,
      status: 'eligible',
      reasonCode: 'eligible',
      requiredActions: [],
    }),
  });

  const result = await service.planDraftToCase(lookupInput());

  assert.equal(result.caseCandidate.sourceDraftId, 'draft_task937_001');
  assertNoForbiddenFields(result);
});

test('input is not mutated', async () => {
  const service = createRepairIntakeDraftCasePlanningService({
    draftReader: async () => sanitizedDraft(),
  });
  const input = lookupInput();
  const before = clone(input);

  await service.planDraftToCase(input);

  assert.deepEqual(input, before);
});

test('custom injected evaluator and candidate builder can be used without DB or provider access', async () => {
  let evaluatorInput;
  let builderInput;
  const customCandidate = {
    sourceDraftId: 'draft_task937_custom',
    organizationId: 'org_task937',
    intakeSource: 'web',
  };
  const service = createRepairIntakeDraftCasePlanningService({
    draftReader: async () => sanitizedDraft({ draftId: 'draft_task937_custom' }),
    eligibilityEvaluator: (input) => {
      evaluatorInput = input;

      return {
        eligible: true,
        status: 'eligible',
        reasonCode: 'eligible',
        requiredActions: [],
      };
    },
    candidateBuilder: (input) => {
      builderInput = input;

      return {
        ok: true,
        action: 'repair_intake_draft_to_case_candidate_build',
        candidateReady: true,
        reasonCode: 'candidate_ready',
        requiredActions: [],
        caseCandidate: customCandidate,
      };
    },
  });

  const result = await service.planDraftToCase(lookupInput());

  assert.deepEqual(evaluatorInput, { draft: sanitizedDraft({ draftId: 'draft_task937_custom' }) });
  assert.equal(builderInput.preflightResult.caseCreationAllowed, true);
  assert.deepEqual(builderInput.actorContext, { actorId: 'actor_task937' });
  assert.deepEqual(result.caseCandidate, customCandidate);
});

test('custom injected candidate builder output is sanitized before returning intent envelope', async () => {
  const service = createRepairIntakeDraftCasePlanningService({
    draftReader: async () => sanitizedDraft({ draftId: 'draft_task937_custom_sanitized' }),
    eligibilityEvaluator: () => ({
      eligible: true,
      status: 'eligible',
      reasonCode: 'eligible',
      requiredActions: [],
    }),
    candidateBuilder: () => ({
      ok: true,
      action: 'repair_intake_draft_to_case_candidate_build',
      candidateReady: true,
      reasonCode: 'candidate_ready',
      requiredActions: [],
      caseCandidate: {
        sourceDraftId: 'draft_task937_custom_sanitized',
        organizationId: 'org_task937',
        intakeSource: 'web',
        reporterRef: {
          refId: 'reporter_ref_task937',
          phone: 'phone',
          address: 'address',
        },
        rawRows: [{ phone: 'phone' }],
        providerPayload: 'providerPayload',
        caseId: 'case_should_not_copy',
        finalAppointmentId: 'final_should_not_copy',
        token: 'token',
        secret: 'secret',
      },
    }),
  });

  const result = await service.planDraftToCase(lookupInput());

  assert.equal(result.ok, true);
  assert.deepEqual(result.caseCandidate, {
    sourceDraftId: 'draft_task937_custom_sanitized',
    organizationId: 'org_task937',
    intakeSource: 'web',
    reporterRef: {
      refId: 'reporter_ref_task937',
    },
  });
  assertNoForbiddenFields(result);
});
