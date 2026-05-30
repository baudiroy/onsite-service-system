'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createRepairIntakeDraftToCaseApiModule,
} = require('../../src/repairIntake/repairIntakeDraftToCaseApiModule');

const UNSAFE_TEXT = [
  'select * from unsafe_api_module_table',
  'postgres://unsafe-api-module-db',
  'DATABASE_URL',
  'process.env',
  'unsafe token',
  'unsafe password',
  'unsafe secret',
  'unsafe stack trace',
  'unsafe provider payload',
  'unsafe customer phone',
  'unsafe customer address',
  'unsafe raw request',
  'unsafe raw draftInput',
  'unsafe audit internal',
  'unsafe debug detail',
  'unsafe billing invoice settlement',
  'unsafe rag payload',
].join(' ');

function unsafeRequestLike() {
  return {
    params: {
      draftId: 'draft-task2232',
      phone: 'unsafe customer phone',
      rawDraftInput: 'unsafe raw draftInput',
    },
    body: {
      organizationId: 'org-task2232',
      idempotencyKey: 'idem-task2232',
      approvalContext: {
        accepted: true,
        approvalId: 'approval-task2232',
        auditInternal: UNSAFE_TEXT,
      },
      permissionContext: {
        canCreateCaseFromRepairIntakeDraft: true,
        permissionSource: 'task2232-test',
        authorization: 'Bearer unsafe token',
      },
      customerPhone: 'unsafe customer phone',
      fullAddress: 'unsafe customer address',
      rawDraftInput: 'unsafe raw draftInput',
      providerPayload: 'unsafe provider payload',
      DATABASE_URL: 'postgres://unsafe-api-module-db',
    },
    context: {
      organizationId: 'org-task2232',
      actorId: 'actor-task2232',
      requestId: 'req-task2232',
      headers: {
        authorization: 'Bearer unsafe token',
      },
    },
    rawBody: 'unsafe raw request',
    rawRequest: 'unsafe raw request',
    draftInput: 'unsafe raw draftInput',
    customerAddress: 'unsafe customer address',
    providerPayload: 'unsafe provider payload',
    billing: 'unsafe billing invoice settlement',
    rag: 'unsafe rag payload',
    token: 'unsafe token',
  };
}

function successOutput(overrides = {}) {
  return {
    ok: true,
    statusCode: 200,
    body: {
      ok: true,
      action: 'repair_intake_draft_to_case_submit',
      draftId: 'draft-task2232',
      organizationId: 'org-task2232',
      status: 'submitted',
      reasonCode: 'TASK2232_SUBMIT_READY',
      requiredActions: [],
      caseRef: {
        id: 'case-task2232',
        organizationId: 'org-task2232',
        sourceDraftId: 'draft-task2232',
        status: 'created',
      },
      metadata: {
        source: 'task2232-safe-controller',
      },
    },
    ...overrides,
  };
}

function createModule(controller) {
  return createRepairIntakeDraftToCaseApiModule({ controller });
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
    'stack trace',
    'providerPayload',
    'provider payload',
    'customerPhone',
    'customer phone',
    'customer address',
    'fullAddress',
    'rawBody',
    'rawRequest',
    'raw request',
    'draftInput',
    'raw draftInput',
    'auditInternal',
    'audit internal',
    'debug detail',
    'billing',
    'invoice',
    'settlement',
    'rag',
  ]) {
    assert.equal(serialized.includes(marker), false, `leaked unsafe marker ${marker}`);
  }
}

test('safe controller normalizes thrown and rejected controller handler failures', async () => {
  const moduleEnvelope = createModule({
    planDraftToCase() {
      const error = new Error(UNSAFE_TEXT);
      error.stack = UNSAFE_TEXT;
      throw error;
    },
    submitDraftToCase: async () => Promise.reject(new Error(UNSAFE_TEXT)),
  });

  const plan = await moduleEnvelope.controller.planDraftToCase(unsafeRequestLike());
  const submit = await moduleEnvelope.controller.submitDraftToCase(unsafeRequestLike());
  const routePlan = await moduleEnvelope.routes[0].handler(unsafeRequestLike());

  for (const result of [plan, submit, routePlan]) {
    assert.equal(result.ok, false);
    assert.equal(result.statusCode, 500);
    assert.equal(result.body.reasonCode, 'REPAIR_INTAKE_DRAFT_CASE_ROUTE_HANDLER_FAILED');
    assert.deepEqual(result.body.requiredActions, ['retry_or_manual_review']);
    assertNoUnsafeText(result);
  }
});

test('safe controller fails closed for null and non-object controller outputs', async () => {
  const malformedOutputs = [
    null,
    undefined,
    'unsafe raw controller output token stack',
    42,
    ['unsafe provider payload'],
  ];

  for (const malformedOutput of malformedOutputs) {
    const moduleEnvelope = createModule({
      planDraftToCase: async () => malformedOutput,
      submitDraftToCase: async () => malformedOutput,
    });

    const plan = await moduleEnvelope.controller.planDraftToCase(unsafeRequestLike());
    const submit = await moduleEnvelope.routes[1].handler(unsafeRequestLike());

    for (const result of [plan, submit]) {
      assert.equal(result.ok, false);
      assert.equal(result.statusCode, 500);
      assert.equal(result.body.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_API_MODULE_CONTROLLER_OUTPUT_INVALID');
      assert.deepEqual(result.body.requiredActions, ['retry_or_manual_review']);
      assertNoUnsafeText(result);
    }
  }
});

test('safe controller sanitizes unsafe request input before handler invocation', async () => {
  const calls = [];
  const request = unsafeRequestLike();
  const requestBefore = JSON.stringify(request);
  const moduleEnvelope = createModule({
    planDraftToCase: async (input) => {
      calls.push(input);
      return successOutput();
    },
    submitDraftToCase: async (input) => {
      calls.push(input);
      return successOutput();
    },
  });

  await moduleEnvelope.controller.planDraftToCase(request);
  await moduleEnvelope.routes[1].handler(request);

  assert.equal(calls.length, 2);
  assert.deepEqual(calls[0], {
    body: {
      organizationId: 'org-task2232',
      idempotencyKey: 'idem-task2232',
      approvalContext: {
        accepted: true,
        approvalId: 'approval-task2232',
      },
      permissionContext: {
        canCreateCaseFromRepairIntakeDraft: true,
        permissionSource: 'task2232-test',
      },
    },
    context: {
      organizationId: 'org-task2232',
      actorId: 'actor-task2232',
      requestId: 'req-task2232',
    },
    params: {
      draftId: 'draft-task2232',
    },
  });
  assertNoUnsafeText(calls);
  assert.equal(JSON.stringify(request), requestBefore);
});

test('safe controller strips unsafe handler output fields without mutating output object', async () => {
  const unsafeOutput = successOutput({
    body: {
      ...successOutput().body,
      providerPayload: UNSAFE_TEXT,
      auditInternal: UNSAFE_TEXT,
      debug: UNSAFE_TEXT,
      rawError: UNSAFE_TEXT,
      billing: UNSAFE_TEXT,
      rag: UNSAFE_TEXT,
      token: UNSAFE_TEXT,
      caseRef: {
        ...successOutput().body.caseRef,
        phone: 'unsafe customer phone',
        finalAppointmentId: 'unsafe final appointment',
      },
      metadata: {
        source: 'task2232-safe-controller',
        headers: {
          authorization: 'Bearer unsafe token',
        },
      },
    },
    stack: UNSAFE_TEXT,
    rawBody: UNSAFE_TEXT,
    headers: {
      authorization: 'Bearer unsafe token',
    },
  });
  const unsafeOutputBefore = JSON.stringify(unsafeOutput);
  const moduleEnvelope = createModule({
    planDraftToCase: async () => unsafeOutput,
    submitDraftToCase: async () => unsafeOutput,
  });

  const result = await moduleEnvelope.controller.submitDraftToCase(unsafeRequestLike());

  assert.equal(result.ok, true);
  assert.equal(result.statusCode, 200);
  assert.equal(result.body.reasonCode, 'TASK2232_SUBMIT_READY');
  assert.deepEqual(result.body.caseRef, {
    id: 'case-task2232',
    organizationId: 'org-task2232',
    sourceDraftId: 'draft-task2232',
    status: 'created',
  });
  assert.deepEqual(result.body.metadata, { source: 'task2232-safe-controller' });
  assertNoUnsafeText(result);
  assert.equal(JSON.stringify(unsafeOutput), unsafeOutputBefore);
});

test('safe controller preserves existing allowed success path', async () => {
  const moduleEnvelope = createModule({
    planDraftToCase: async () => successOutput({
      body: {
        ...successOutput().body,
        action: 'repair_intake_draft_to_case_plan',
        status: 'planned',
        reasonCode: 'TASK2232_PLAN_READY',
      },
    }),
    submitDraftToCase: async () => successOutput(),
  });

  const plan = await moduleEnvelope.controller.planDraftToCase(unsafeRequestLike());
  const submit = await moduleEnvelope.routes[1].handler(unsafeRequestLike());

  assert.deepEqual(plan, successOutput({
    body: {
      ...successOutput().body,
      action: 'repair_intake_draft_to_case_plan',
      status: 'planned',
      reasonCode: 'TASK2232_PLAN_READY',
    },
  }));
  assert.deepEqual(submit, successOutput());
  assertNoUnsafeText(plan);
  assertNoUnsafeText(submit);
});
