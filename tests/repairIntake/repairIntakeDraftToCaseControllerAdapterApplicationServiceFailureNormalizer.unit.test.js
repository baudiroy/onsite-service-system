'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createRepairIntakeDraftCaseControllerAdapter,
} = require('../../src/repairIntake/repairIntakeDraftCaseControllerAdapter');
const {
  createRepairIntakeDraftToCaseApiModule,
} = require('../../src/repairIntake/repairIntakeDraftToCaseApiModule');

const UNSAFE_TEXT = [
  'select * from unsafe_controller_table',
  'postgres://unsafe-controller-db',
  'DATABASE_URL',
  'process.env',
  'unsafe token',
  'unsafe password',
  'unsafe secret',
  'unsafe stack trace',
  'unsafe provider payload',
  'unsafe customer phone',
  'unsafe customer address',
  'unsafe raw draft',
  'unsafe raw request',
  'unsafe audit internal',
  'unsafe debug detail',
  'unsafe billing invoice settlement',
  'unsafe rag payload',
].join(' ');

function requestLike() {
  return {
    params: {
      draftId: 'draft-task2228',
    },
    body: {
      organizationId: 'org-task2228',
      idempotencyKey: 'idem-task2228',
      approvalContext: {
        accepted: true,
        approvalId: 'approval-task2228',
      },
      permissionContext: {
        canCreateCaseFromRepairIntakeDraft: true,
        permissionSource: 'task2228-test',
      },
      customerPhone: 'unsafe customer phone',
      fullAddress: 'unsafe customer address',
      rawDraftInput: 'unsafe raw draft',
      providerPayload: 'unsafe provider payload',
    },
    context: {
      organizationId: 'org-task2228',
      actorId: 'actor-task2228',
      requestId: 'req-task2228',
    },
  };
}

function successResult(overrides = {}) {
  return {
    ok: true,
    action: 'repair_intake_draft_to_case_submit',
    draftId: 'draft-task2228',
    organizationId: 'org-task2228',
    submitted: true,
    eligible: true,
    status: 'submitted',
    caseCreationAllowed: true,
    candidateReady: true,
    reasonCode: 'TASK2228_SUBMIT_READY',
    requiredActions: [],
    caseRef: {
      id: 'case-task2228',
      organizationId: 'org-task2228',
      sourceDraftId: 'draft-task2228',
      status: 'created',
    },
    caseCandidate: {
      sourceDraftId: 'draft-task2228',
      organizationId: 'org-task2228',
      intakeSource: 'repair_intake',
    },
    auditEvent: {
      eventType: 'repair_intake_draft_to_case_submission',
      outcome: 'submitted',
      draftId: 'draft-task2228',
      organizationId: 'org-task2228',
      actorId: 'actor-task2228',
      requestId: 'req-task2228',
      idempotencyKey: 'idem-task2228',
      caseRef: {
        id: 'case-task2228',
        organizationId: 'org-task2228',
        sourceDraftId: 'draft-task2228',
        status: 'created',
      },
    },
    ...overrides,
  };
}

function createAdapter(applicationService) {
  return createRepairIntakeDraftCaseControllerAdapter({ applicationService });
}

function assertNoUnsafeText(value) {
  const serialized = JSON.stringify(value);

  for (const marker of [
    'select *',
    'postgres://',
    'DATABASE_URL',
    'process.env',
    'unsafe',
    'token',
    'password',
    'secret',
    'stack',
    'providerPayload',
    'provider payload',
    'customerPhone',
    'customer phone',
    'customer address',
    'fullAddress',
    'rawDraftInput',
    'raw draft',
    'raw request',
    'auditInternal',
    'audit internal',
    'debug detail',
    'unsafe billing',
    'invoice',
    'settlement',
    'rag',
  ]) {
    assert.equal(serialized.includes(marker), false, `leaked unsafe marker ${marker}`);
  }
}

test('controller adapter normalizes thrown and rejected application service failures', async () => {
  const failures = [
    {
      label: 'plan thrown',
      method: 'planDraftToCase',
      service: {
        planDraftToCase() {
          const error = new Error(UNSAFE_TEXT);
          error.stack = UNSAFE_TEXT;
          throw error;
        },
        submitDraftToCase: async () => successResult(),
      },
    },
    {
      label: 'submit rejected',
      method: 'submitDraftToCase',
      service: {
        planDraftToCase: async () => successResult({ action: 'repair_intake_draft_to_case_plan' }),
        submitDraftToCase: async () => Promise.reject(new Error(UNSAFE_TEXT)),
      },
    },
  ];

  for (const failure of failures) {
    const adapter = createAdapter(failure.service);
    const result = await adapter[failure.method](requestLike());

    assert.equal(result.ok, false, failure.label);
    assert.equal(result.statusCode, 500, failure.label);
    assert.equal(result.body.reasonCode, 'CONTROLLER_APPLICATION_SERVICE_FAILED', failure.label);
    assert.deepEqual(result.body.requiredActions, ['retry_or_manual_review'], failure.label);
    assertNoUnsafeText(result);
  }
});

test('controller adapter fails closed for null and non-object application service results', async () => {
  const malformedResults = [
    null,
    undefined,
    'unsafe raw service result token stack',
    42,
    ['unsafe provider payload'],
  ];

  for (const malformedResult of malformedResults) {
    const adapter = createAdapter({
      planDraftToCase: async () => malformedResult,
      submitDraftToCase: async () => malformedResult,
    });

    const plan = await adapter.planDraftToCase(requestLike());
    const submit = await adapter.submitDraftToCase(requestLike());

    for (const result of [plan, submit]) {
      assert.equal(result.ok, false);
      assert.equal(result.statusCode, 500);
      assert.equal(result.body.reasonCode, 'CONTROLLER_APPLICATION_SERVICE_RESULT_INVALID');
      assert.deepEqual(result.body.requiredActions, ['retry_or_manual_review']);
      assertNoUnsafeText(result);
    }
  }
});

test('controller adapter strips unsafe application service fields and does not mutate inputs or service result', async () => {
  const request = requestLike();
  const serviceResult = successResult({
    providerPayload: UNSAFE_TEXT,
    rawError: UNSAFE_TEXT,
    stack: UNSAFE_TEXT,
    token: UNSAFE_TEXT,
    requiredActions: ['manual_review', 'unsafe token'],
    auditEvent: {
      ...successResult().auditEvent,
      auditInternal: UNSAFE_TEXT,
      providerPayload: UNSAFE_TEXT,
      debug: UNSAFE_TEXT,
    },
    caseCandidate: {
      ...successResult().caseCandidate,
      customerPhone: UNSAFE_TEXT,
      rawDraft: UNSAFE_TEXT,
    },
  });
  const requestBefore = JSON.stringify(request);
  const serviceResultBefore = JSON.stringify(serviceResult);
  const calls = [];
  const adapter = createAdapter({
    planDraftToCase: async (input) => {
      calls.push(input);
      return serviceResult;
    },
    submitDraftToCase: async (input) => {
      calls.push(input);
      return serviceResult;
    },
  });

  const result = await adapter.submitDraftToCase(request);

  assert.equal(result.ok, true);
  assert.equal(result.statusCode, 200);
  assert.equal(result.body.reasonCode, 'TASK2228_SUBMIT_READY');
  assert.deepEqual(result.body.requiredActions, ['manual_review']);
  assert.equal(result.body.caseRef.id, 'case-task2228');
  assert.equal(result.body.auditEvent.eventType, 'repair_intake_draft_to_case_submission');
  assertNoUnsafeText(calls[0]);
  assertNoUnsafeText(result);
  assert.equal(JSON.stringify(request), requestBefore);
  assert.equal(JSON.stringify(serviceResult), serviceResultBefore);
});

test('controller adapter preserves existing allowed success path', async () => {
  const adapter = createAdapter({
    planDraftToCase: async () => successResult({
      action: 'repair_intake_draft_to_case_plan',
      submitted: false,
      status: 'planned',
      caseRef: null,
      auditEvent: null,
    }),
    submitDraftToCase: async () => successResult(),
  });

  const plan = await adapter.planDraftToCase(requestLike());
  const submit = await adapter.submitDraftToCase(requestLike());

  assert.deepEqual(plan, {
    ok: true,
    statusCode: 200,
    body: {
      ok: true,
      action: 'repair_intake_draft_to_case_plan',
      draftId: 'draft-task2228',
      organizationId: 'org-task2228',
      submitted: false,
      eligible: true,
      status: 'planned',
      caseCreationAllowed: true,
      candidateReady: true,
      reasonCode: 'TASK2228_SUBMIT_READY',
      requiredActions: [],
      caseRef: null,
      caseCandidate: {
        sourceDraftId: 'draft-task2228',
        organizationId: 'org-task2228',
        brandId: null,
        serviceProviderId: null,
        intakeSource: 'repair_intake',
        serviceType: null,
        priority: null,
        reporterRef: null,
        customerRef: null,
        billingContactRef: null,
        siteRef: null,
        issueSummaryRef: null,
        createdByActorId: null,
      },
      auditEvent: null,
    },
  });
  assert.equal(submit.ok, true);
  assert.equal(submit.statusCode, 200);
  assert.equal(submit.body.caseRef.id, 'case-task2228');
  assertNoUnsafeText(plan);
  assertNoUnsafeText(submit);
});

test('api module application-service route handlers inherit controller adapter failure normalization', async () => {
  const moduleResult = createRepairIntakeDraftToCaseApiModule({
    applicationService: {
      planDraftToCase: async () => Promise.reject(new Error(UNSAFE_TEXT)),
      submitDraftToCase: async () => 'unsafe raw service result token stack',
    },
  });

  assert.equal(moduleResult.ok, true);

  const plan = await moduleResult.routes[0].handler(requestLike());
  const submit = await moduleResult.routes[1].handler(requestLike());

  assert.equal(plan.ok, false);
  assert.equal(plan.statusCode, 500);
  assert.equal(plan.body.reasonCode, 'CONTROLLER_APPLICATION_SERVICE_FAILED');
  assert.equal(submit.ok, false);
  assert.equal(submit.statusCode, 500);
  assert.equal(submit.body.reasonCode, 'CONTROLLER_APPLICATION_SERVICE_RESULT_INVALID');
  assertNoUnsafeText(plan);
  assertNoUnsafeText(submit);
});
