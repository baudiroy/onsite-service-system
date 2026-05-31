'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createRepairIntakeDraftToCaseApiModule,
} = require('../../src/repairIntake/repairIntakeDraftToCaseApiModule');
const {
  guardRepairIntakeDraftToCaseRequest,
} = require('../../src/repairIntake/repairIntakeDraftToCaseRequestAbuseGuard');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function validRequest(overrides = {}) {
  return {
    params: {
      draftId: 'draft-task2342',
    },
    body: {
      organizationId: 'org-task2342',
      idempotencyKey: 'idem-task2342',
      approvalContext: {
        accepted: true,
        approvalId: 'approval-task2342',
      },
      permissionContext: {
        canCreateCaseFromRepairIntakeDraft: true,
        permissionSource: 'task2342-unit',
      },
    },
    context: {
      organizationId: 'org-task2342',
      actorId: 'actor-task2342',
      requestId: 'req-task2342',
    },
    ...overrides,
  };
}

function successOutput(reasonCode = 'TASK2342_SUBMIT_READY') {
  return {
    ok: true,
    statusCode: 200,
    body: {
      ok: true,
      action: 'repair_intake_draft_to_case_submit',
      draftId: 'draft-task2342',
      organizationId: 'org-task2342',
      submitted: true,
      eligible: true,
      status: 'submitted',
      caseCreationAllowed: true,
      candidateReady: true,
      reasonCode,
      requiredActions: [],
      caseRef: {
        id: 'case-task2342',
        organizationId: 'org-task2342',
        sourceDraftId: 'draft-task2342',
        status: 'created',
      },
      auditEvent: null,
    },
  };
}

function createControllerModule(calls) {
  return createRepairIntakeDraftToCaseApiModule({
    controller: {
      planDraftToCase: async (input) => {
        calls.push({ method: 'plan', input });
        return successOutput('TASK2342_PLAN_READY');
      },
      submitDraftToCase: async (input) => {
        calls.push({ method: 'submit', input });
        return successOutput();
      },
    },
  });
}

function createApplicationServiceModule(calls) {
  return createRepairIntakeDraftToCaseApiModule({
    applicationService: {
      planDraftToCase: async (input) => {
        calls.push({ method: 'plan', input });
        return successOutput('TASK2342_PLAN_READY').body;
      },
      submitDraftToCase: async (input) => {
        calls.push({ method: 'submit', input });
        return successOutput().body;
      },
    },
  });
}

function assertNoUnsafeText(value) {
  const text = JSON.stringify(value).toLowerCase();

  for (const marker of [
    'raw request',
    'raw body',
    'raw draft',
    'select *',
    'stack trace',
    'secret',
    'token',
    'provider payload',
    'openai',
    'rag',
    'vector',
    'billing',
    'settlement',
    'payment',
    'invoice',
    'customer private',
    'customer address',
    'full address',
    'signature',
    'photo',
  ]) {
    assert.equal(text.includes(marker), false, `unsafe marker leaked: ${marker}`);
  }
}

function assertRejected(result) {
  assert.equal(result.ok, false);
  assert.equal(result.statusCode, 500);
  assert.equal(result.body.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_REQUEST_ABUSE_REJECTED');
  assert.deepEqual(result.body.requiredActions, ['submit_safe_request']);
  assertNoUnsafeText(result);
}

test('normal valid request still succeeds through API module safe controller boundary', async () => {
  const calls = [];
  const moduleEnvelope = createControllerModule(calls);
  const request = validRequest();
  const before = clone(request);

  const result = await moduleEnvelope.controller.submitDraftToCase(request);

  assert.equal(result.ok, true);
  assert.equal(result.body.reasonCode, 'TASK2342_SUBMIT_READY');
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].input, request);
  assert.deepEqual(request, before);
});

test('oversized safe serialized payload fails closed before controller invocation', async () => {
  const calls = [];
  const moduleEnvelope = createControllerModule(calls);
  const request = validRequest({
    body: {
      ...validRequest().body,
      safeNotes: Array.from({ length: 20 }, (_, index) => `safe-note-${index}`).join('-'),
    },
  });

  const guardResult = guardRepairIntakeDraftToCaseRequest(request, {
    limits: { maxSafeSerializedLength: 120 },
  });
  assert.equal(guardResult.ok, false);

  const result = await moduleEnvelope.routes[1].handler({
    ...request,
    body: {
      ...request.body,
      safeNotes: 'x'.repeat(9000),
    },
  });

  assertRejected(result);
  assert.equal(calls.length, 0);
});

test('oversized string field fails closed before controller invocation', async () => {
  const calls = [];
  const moduleEnvelope = createControllerModule(calls);
  const request = validRequest({
    body: {
      ...validRequest().body,
      approvalContext: {
        ...validRequest().body.approvalContext,
        approvalId: 'a'.repeat(1100),
      },
    },
  });

  const result = await moduleEnvelope.controller.submitDraftToCase(request);

  assertRejected(result);
  assert.equal(calls.length, 0);
});

test('oversized array and object fields fail closed before controller invocation', async () => {
  const calls = [];
  const moduleEnvelope = createControllerModule(calls);
  const oversizedArray = await moduleEnvelope.controller.planDraftToCase(validRequest({
    body: {
      ...validRequest().body,
      safeArray: Array.from({ length: 40 }, (_, index) => `item-${index}`),
    },
  }));
  const oversizedObject = await moduleEnvelope.controller.submitDraftToCase(validRequest({
    body: {
      ...validRequest().body,
      safeObject: Object.fromEntries(Array.from({ length: 70 }, (_, index) => [`key${index}`, `value${index}`])),
    },
  }));

  assertRejected(oversizedArray);
  assertRejected(oversizedObject);
  assert.equal(calls.length, 0);
});

test('null malformed non-object circular and bigint request inputs fail closed safely', async () => {
  const calls = [];
  const moduleEnvelope = createControllerModule(calls);
  const circular = validRequest();
  circular.body.self = circular.body;

  for (const request of [
    null,
    'not-an-object',
    ['not-an-object'],
    circular,
    validRequest({ body: { ...validRequest().body, unsafeBigInt: 10n } }),
  ]) {
    const result = await moduleEnvelope.controller.submitDraftToCase(request);
    assertRejected(result);
  }

  assert.equal(calls.length, 0);
});

test('unsafe raw fields are stripped and never leak while normal safe request still succeeds', async () => {
  const calls = [];
  const moduleEnvelope = createControllerModule(calls);
  const request = validRequest({
    rawBody: 'hidden raw request token',
    headers: { authorization: 'Bearer hidden token' },
    providerPayload: { raw: 'hidden provider payload' },
    body: {
      ...validRequest().body,
      rawDraftInput: 'hidden raw draft select * stack trace',
      customerPrivate: 'hidden customer private',
      customerAddress: 'hidden customer address',
      fullAddress: 'hidden full address',
      signature: 'hidden signature',
      photo: 'hidden photo',
      ai: 'hidden openai rag vector',
      billing: 'hidden billing settlement payment invoice',
      safeNote: 'safe-note-task2342',
    },
  });
  const before = clone(request);

  const result = await moduleEnvelope.routes[1].handler(request);

  assert.equal(result.ok, true);
  assert.equal(result.body.reasonCode, 'TASK2342_SUBMIT_READY');
  assert.equal(calls.length, 1);
  assertNoUnsafeText(calls);
  assertNoUnsafeText(result);
  assert.deepEqual(request, before);
});

test('body client-controlled values cannot override trusted context through application service adapter', async () => {
  const calls = [];
  const moduleEnvelope = createApplicationServiceModule(calls);
  const request = validRequest({
    context: {
      organizationId: 'org-trusted-task2342',
      actorId: 'actor-trusted-task2342',
      requestId: 'req-trusted-task2342',
    },
    body: {
      ...validRequest().body,
      organizationId: 'org-body-override-task2342',
      actorId: 'actor-body-override-task2342',
      requestId: 'req-body-override-task2342',
    },
  });

  const result = await moduleEnvelope.routes[1].handler(request);

  assert.equal(result.ok, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].input.organizationId, 'org-trusted-task2342');
  assert.equal(calls[0].input.actorId, 'actor-trusted-task2342');
  assert.equal(calls[0].input.requestId, 'req-trusted-task2342');
  assert.notEqual(calls[0].input.organizationId, 'org-body-override-task2342');
  assertNoUnsafeText(result);
});
