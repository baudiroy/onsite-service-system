'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createRepairIntakeDraftCasePlanningService,
} = require('../../src/repairIntake/repairIntakeDraftCasePlanningService');
const {
  ACTION,
  createRepairIntakeDraftCaseSubmissionService,
} = require('../../src/repairIntake/repairIntakeDraftCaseSubmissionService');

function stableEnvelopeKeys() {
  return [
    'ok',
    'action',
    'draftId',
    'organizationId',
    'submitted',
    'caseCreationAllowed',
    'candidateReady',
    'reasonCode',
    'requiredActions',
    'caseRef',
    'auditEvent',
  ];
}

function command(overrides = {}) {
  return {
    draftId: 'draft_task947_001',
    organizationId: 'org_task947',
    actorId: 'actor_task947',
    requestId: 'request_task947',
    idempotencyKey: 'idem_task947',
    approvalContext: {
      accepted: true,
      approvalId: 'approval_task947',
      acceptedByActorId: 'actor_task947',
    },
    permissionContext: {
      canCreateCaseFromRepairIntakeDraft: true,
      permissionSource: 'synthetic_test_context',
    },
    ...overrides,
  };
}

function eligibleDraft(overrides = {}) {
  return {
    draftId: 'draft_task947_001',
    organizationId: 'org_task947',
    intakeSource: 'web',
    brandId: 'brand_task947',
    serviceProviderId: 'provider_task947',
    serviceType: 'onsite',
    priority: 'normal',
    contactRoleSeparation: 'complete',
    platformAccepted: true,
    reporterRef: { refId: 'reporter_ref_task947', type: 'reporter' },
    customerRef: { refId: 'customer_ref_task947', type: 'customer' },
    billingContactRef: { refId: 'billing_ref_task947', type: 'billing_contact' },
    siteRef: { refId: 'site_ref_task947', type: 'service_site' },
    issueSummaryRef: { refId: 'issue_ref_task947', type: 'issue_summary' },
    ...overrides,
  };
}

function caseRef(overrides = {}) {
  return {
    id: 'case_ref_task947',
    organizationId: 'org_task947',
    sourceDraftId: 'draft_task947_001',
    status: 'created',
    ...overrides,
  };
}

function assertNoForbiddenFields(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'caseId',
    'case_id',
    'finalAppointmentId',
    'final_appointment_id',
    'phone',
    'address',
    'customerPayload',
    'rawImportedRowPayload',
    'rawPayload',
    'select *',
    'stack trace',
    'providerPayload',
    'token',
    'secret',
    'lineAccessToken',
    'LINE access token',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

function createSyntheticFlow({
  draft = eligibleDraft(),
  idempotencyResult = { decision: 'available' },
  caseCreatorResult = caseRef(),
} = {}) {
  const calls = {
    draftReader: [],
    idempotencyChecker: [],
    caseCreator: [],
  };

  const planningService = createRepairIntakeDraftCasePlanningService({
    draftReader: async (lookup) => {
      calls.draftReader.push(lookup);
      return draft;
    },
  });

  const submissionService = createRepairIntakeDraftCaseSubmissionService({
    planner: planningService.planDraftToCase,
    idempotencyChecker: async (lookup) => {
      calls.idempotencyChecker.push(lookup);
      return idempotencyResult;
    },
    caseCreator: async (input) => {
      calls.caseCreator.push(input);
      return caseCreatorResult;
    },
  });

  return {
    calls,
    submissionService,
  };
}

test('eligible synthetic draft submits successfully through the no-DB flow', async () => {
  const { calls, submissionService } = createSyntheticFlow({
    draft: eligibleDraft({
      phone: 'phone',
      address: 'address',
      customerPayload: 'customerPayload',
      rawImportedRowPayload: 'rawImportedRowPayload',
      rawPayload: 'rawPayload',
      finalAppointmentId: 'final_should_not_copy',
      providerPayload: 'providerPayload',
      token: 'token',
      secret: 'secret',
      lineAccessToken: 'LINE access token',
    }),
    caseCreatorResult: caseRef({
      phone: 'phone',
      address: 'address',
      customerPayload: 'customerPayload',
      rawImportedRowPayload: 'rawImportedRowPayload',
      rawPayload: 'rawPayload',
      sql: 'select *',
      stack: 'stack trace',
      providerPayload: 'providerPayload',
      token: 'token',
      secret: 'secret',
      lineAccessToken: 'LINE access token',
      caseId: 'unsafe_case_id',
      finalAppointmentId: 'final_should_not_copy',
    }),
  });

  const result = await submissionService.submitDraftToCase(command({
    phone: 'phone',
    address: 'address',
    customerPayload: 'customerPayload',
    rawImportedRowPayload: 'rawImportedRowPayload',
    rawPayload: 'rawPayload',
    sql: 'select *',
    stack: 'stack trace',
    providerPayload: 'providerPayload',
    token: 'token',
    secret: 'secret',
    lineAccessToken: 'LINE access token',
    caseId: 'unsafe_case_id',
    finalAppointmentId: 'final_should_not_copy',
  }));

  assert.deepEqual(Object.keys(result), stableEnvelopeKeys());
  assert.equal(result.ok, true);
  assert.equal(result.action, ACTION);
  assert.equal(result.submitted, true);
  assert.equal(result.reasonCode, 'CASE_SUBMITTED');
  assert.deepEqual(result.caseRef, caseRef());
  assert.equal(result.auditEvent.outcome, 'submitted');
  assert.deepEqual(result.auditEvent.caseRef, caseRef());
  assert.equal(calls.draftReader.length, 1);
  assert.equal(calls.idempotencyChecker.length, 1);
  assert.equal(calls.caseCreator.length, 1);
  assert.deepEqual(calls.caseCreator[0], {
    command: {
      draftId: 'draft_task947_001',
      organizationId: 'org_task947',
      actorId: 'actor_task947',
      requestId: 'request_task947',
      idempotencyKey: 'idem_task947',
    },
    caseCandidate: {
      sourceDraftId: 'draft_task947_001',
      organizationId: 'org_task947',
      brandId: 'brand_task947',
      serviceProviderId: 'provider_task947',
      intakeSource: 'web',
      serviceType: 'onsite',
      priority: 'normal',
      reporterRef: { refId: 'reporter_ref_task947', type: 'reporter' },
      customerRef: { refId: 'customer_ref_task947', type: 'customer' },
      billingContactRef: { refId: 'billing_ref_task947', type: 'billing_contact' },
      siteRef: { refId: 'site_ref_task947', type: 'service_site' },
      issueSummaryRef: { refId: 'issue_ref_task947', type: 'issue_summary' },
      createdByActorId: 'actor_task947',
    },
  });
  assertNoForbiddenFields(calls.caseCreator[0]);
  assertNoForbiddenFields(result);
});

test('blocked eligibility path does not call caseCreator', async () => {
  const { calls, submissionService } = createSyntheticFlow({
    draft: eligibleDraft({
      duplicateStatus: 'confirmed_duplicate',
      phone: 'phone',
      address: 'address',
      customerPayload: 'customerPayload',
      finalAppointmentId: 'final_should_not_copy',
    }),
  });

  const result = await submissionService.submitDraftToCase(command());

  assert.deepEqual(Object.keys(result), stableEnvelopeKeys());
  assert.equal(result.ok, false);
  assert.equal(result.submitted, false);
  assert.equal(result.reasonCode, 'duplicate_confirmed');
  assert.deepEqual(result.requiredActions, ['link_or_close_duplicate_draft']);
  assert.equal(result.caseRef, null);
  assert.equal(result.auditEvent.outcome, 'blocked');
  assert.equal(calls.draftReader.length, 1);
  assert.equal(calls.idempotencyChecker.length, 1);
  assert.equal(calls.caseCreator.length, 0);
  assertNoForbiddenFields(result);
});

test('idempotency conflict path does not call planner or caseCreator and may return sanitized existing caseRef', async () => {
  const { calls, submissionService } = createSyntheticFlow({
    idempotencyResult: {
      decision: 'conflict',
      phone: 'phone',
      address: 'address',
      customerPayload: 'customerPayload',
      rawImportedRowPayload: 'rawImportedRowPayload',
      sql: 'select *',
      stack: 'stack trace',
      providerPayload: 'providerPayload',
      token: 'token',
      secret: 'secret',
      lineAccessToken: 'LINE access token',
      finalAppointmentId: 'final_should_not_copy',
      caseId: 'unsafe_case_id',
      caseRef: caseRef({
        phone: 'phone',
        address: 'address',
        finalAppointmentId: 'final_should_not_copy',
      }),
    },
  });

  const result = await submissionService.submitDraftToCase(command());

  assert.deepEqual(Object.keys(result), stableEnvelopeKeys());
  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'IDEMPOTENCY_CONFLICT');
  assert.deepEqual(result.caseRef, caseRef());
  assert.equal(result.auditEvent.outcome, 'blocked');
  assert.deepEqual(result.auditEvent.caseRef, caseRef());
  assert.equal(calls.idempotencyChecker.length, 1);
  assert.equal(calls.draftReader.length, 0);
  assert.equal(calls.caseCreator.length, 0);
  assertNoForbiddenFields(result);
});

test('command guard failure path does not call idempotency checker planner or caseCreator', async () => {
  const { calls, submissionService } = createSyntheticFlow();

  const result = await submissionService.submitDraftToCase(command({ idempotencyKey: '' }));

  assert.deepEqual(Object.keys(result), stableEnvelopeKeys());
  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'SUBMISSION_COMMAND_IDEMPOTENCY_KEY_MISSING');
  assert.equal(result.auditEvent, null);
  assert.equal(calls.idempotencyChecker.length, 0);
  assert.equal(calls.draftReader.length, 0);
  assert.equal(calls.caseCreator.length, 0);
  assertNoForbiddenFields(result);
});
