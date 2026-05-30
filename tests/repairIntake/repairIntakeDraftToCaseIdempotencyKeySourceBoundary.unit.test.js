'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createRepairIntakeDraftToCasePreRouteHandler,
} = require('../../src/repairIntake/repairIntakeDraftToCasePreRouteHandlerFactory');
const {
  createRepairIntakeDraftToCaseRouteAdapterContract,
} = require('../../src/repairIntake/repairIntakeDraftToCaseRouteAdapterContract');
const {
  buildRepairIntakeDraftToCaseIdempotencyPolicy,
} = require('../../src/repairIntake/repairIntakeDraftToCaseIdempotencyPolicyBuilder');
const {
  createRepairIntakeDraftToCaseSyntheticHandler,
} = require('../../src/repairIntake/repairIntakeDraftToCaseSyntheticHandler');

function trustedContext(overrides = {}) {
  return {
    ok: true,
    status: 'resolved',
    messageKey: 'repair_intake_draft_to_case.request_context_resolved',
    reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_REQUEST_CONTEXT_RESOLVED',
    organizationId: 'org-idem-boundary-2203',
    actorId: 'actor-idem-boundary-2203',
    actorRole: 'service_agent',
    repairIntakeDraftId: 'draft-idem-boundary-2203',
    source: 'route_adapter_contract',
    draftInput: {
      problemDescription: 'safe problem',
    },
    ...overrides,
  };
}

function unsafeRequestBody() {
  return {
    idempotencyKey: 'body-idem-hidden-2203',
    requestId: 'body-request-hidden-2203',
    dedupeKey: 'body-dedupe-hidden-2203',
    caseId: 'body-case-hidden-2203',
    repairIntakeDraftId: 'body-draft-hidden-2203',
    replay: 'body-replay-hidden-2203',
    duplicate: 'body-duplicate-hidden-2203',
    providerPayload: { idempotencyKey: 'provider-idem-hidden-2203' },
    auditActor: { requestId: 'audit-request-hidden-2203' },
    billing: { invoice: 'billing-invoice-hidden-2203' },
    token: 'body-token-hidden-2203',
    password: 'body-password-hidden-2203',
    sql: 'body-sql-hidden-2203',
    stack: 'body-stack-hidden-2203',
    draftInput: {
      problemDescription: 'safe problem',
      idempotencyKey: 'draft-idem-hidden-2203',
      requestId: 'draft-request-hidden-2203',
      rawBody: 'draft-raw-body-hidden-2203',
      customerPhone: 'draft-phone-hidden-2203',
      address: 'draft-address-hidden-2203',
      ai: { idempotencyKey: 'ai-idem-hidden-2203' },
      rag: { requestId: 'rag-request-hidden-2203' },
      debug: 'draft-debug-hidden-2203',
      internal: 'draft-internal-hidden-2203',
      rawError: 'draft-raw-error-hidden-2203',
    },
    rawBody: 'body-raw-body-hidden-2203',
  };
}

function preRouteInput(overrides = {}) {
  return {
    sessionContext: {
      organizationId: 'org-idem-boundary-2203',
      actorId: 'actor-idem-boundary-2203',
      actorRole: 'service_agent',
    },
    repairIntakeDraftId: 'draft-idem-boundary-2203',
    requestSource: 'route_adapter_contract',
    requestId: 'trusted-request-2203',
    idempotencyKey: 'trusted-idem-2203',
    requestBody: unsafeRequestBody(),
    ...overrides,
  };
}

function createPreRouteFlow({ context = trustedContext(), syntheticResult } = {}) {
  const auditInputs = [];
  const policyInputs = [];
  const syntheticInputs = [];
  const handler = createRepairIntakeDraftToCasePreRouteHandler({
    requestContextResolver: {
      resolveRepairIntakeDraftToCaseRequestContext() {
        return context;
      },
    },
    idempotencyPolicyBuilder: {
      buildRepairIntakeDraftToCaseIdempotencyPolicy(input) {
        policyInputs.push(input);

        return buildRepairIntakeDraftToCaseIdempotencyPolicy(input);
      },
    },
    auditIntentBuilder: {
      buildRepairIntakeDraftToCaseAuditIntent(input) {
        auditInputs.push(input);

        return {
          ok: true,
          auditIntent: {
            phase: input.phase,
            organizationId: input.organizationId,
            actorId: input.actorId,
            repairIntakeDraftId: input.repairIntakeDraftId,
          },
        };
      },
    },
    syntheticHandler: {
      handleDraftToCase(input) {
        syntheticInputs.push(input);

        return syntheticResult || {
          ok: true,
          status: 'created',
          messageKey: 'repair_intake_draft_to_case.created',
          reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_PUBLIC_CREATED',
          caseId: 'case-idem-boundary-2203',
          repairIntakeDraftId: 'draft-idem-boundary-2203',
        };
      },
    },
    httpResultMapper: {
      mapRepairIntakeDraftToCasePublicResultToHttpResponse(result) {
        return {
          statusCode: result.status === 'denied' ? 403 : 201,
          body: result,
        };
      },
    },
  });

  return {
    auditInputs,
    handler,
    policyInputs,
    syntheticInputs,
  };
}

function assertNoUnsafeText(value) {
  const serialized = JSON.stringify(value);

  for (const marker of [
    'body-idem-hidden-2203',
    'body-request-hidden-2203',
    'body-dedupe-hidden-2203',
    'body-case-hidden-2203',
    'body-draft-hidden-2203',
    'body-replay-hidden-2203',
    'body-duplicate-hidden-2203',
    'provider-idem-hidden-2203',
    'audit-request-hidden-2203',
    'billing-invoice-hidden-2203',
    'body-token-hidden-2203',
    'body-password-hidden-2203',
    'body-sql-hidden-2203',
    'body-stack-hidden-2203',
    'draft-idem-hidden-2203',
    'draft-request-hidden-2203',
    'draft-raw-body-hidden-2203',
    'draft-phone-hidden-2203',
    'draft-address-hidden-2203',
    'ai-idem-hidden-2203',
    'rag-request-hidden-2203',
    'draft-debug-hidden-2203',
    'draft-internal-hidden-2203',
    'draft-raw-error-hidden-2203',
    'body-raw-body-hidden-2203',
    'unsafe idempotency select token',
    'x'.repeat(129),
  ]) {
    assert.equal(serialized.includes(marker), false, `leaked unsafe marker ${marker}`);
  }
}

test('Task2203 pre-route policy uses trusted top-level idempotency context over body fields', async () => {
  const input = preRouteInput();
  const before = structuredClone(input);
  const flow = createPreRouteFlow();

  const result = await flow.handler.handleDraftToCasePreRoute(input);

  assert.equal(result.idempotencyPolicy.ok, true);
  assert.equal(result.idempotencyPolicy.idempotencyKey, 'trusted-idem-2203');
  assert.equal(result.idempotencyPolicy.requestId, 'trusted-request-2203');
  assert.deepEqual(flow.policyInputs[0], {
    organizationId: 'org-idem-boundary-2203',
    actorId: 'actor-idem-boundary-2203',
    repairIntakeDraftId: 'draft-idem-boundary-2203',
    requestId: 'trusted-request-2203',
    idempotencyKey: 'trusted-idem-2203',
    source: 'route_adapter_contract',
  });
  assert.deepEqual(input, before);
  assertNoUnsafeText(flow.policyInputs);
  assertNoUnsafeText(result.idempotencyPolicy);
});

test('Task2203 body and draftInput idempotency fields cannot provide fallback idempotency context', async () => {
  const flow = createPreRouteFlow();

  const result = await flow.handler.handleDraftToCasePreRoute(preRouteInput({
    requestId: undefined,
    idempotencyKey: undefined,
  }));

  assert.equal(flow.policyInputs[0].requestId, null);
  assert.equal(flow.policyInputs[0].idempotencyKey, null);
  assert.equal(result.idempotencyPolicy.ok, true);
  assert.equal(result.idempotencyPolicy.requestId, null);
  assert.equal(result.idempotencyPolicy.idempotencyKey, 'fallback:actor-idem-boundary-2203:draft-idem-boundary-2203');
  assertNoUnsafeText(flow.policyInputs);
  assertNoUnsafeText(result.idempotencyPolicy);
});

test('Task2203 unsafe malformed or overly long idempotency context is omitted safely', async () => {
  const flow = createPreRouteFlow();
  const result = await flow.handler.handleDraftToCasePreRoute(preRouteInput({
    requestId: 'x'.repeat(129),
    idempotencyKey: 'unsafe idempotency select token',
  }));

  assert.equal(flow.policyInputs[0].requestId, null);
  assert.equal(flow.policyInputs[0].idempotencyKey, null);
  assert.equal(result.idempotencyPolicy.idempotencyKey, 'fallback:actor-idem-boundary-2203:draft-idem-boundary-2203');
  assertNoUnsafeText(flow.policyInputs);
  assertNoUnsafeText(result.idempotencyPolicy);
});

test('Task2203 route adapter accepts header-like idempotency context and strips body overrides', async () => {
  let preRouteSeen;
  const routeAdapter = createRepairIntakeDraftToCaseRouteAdapterContract({
    preRouteHandler: {
      handleDraftToCasePreRoute(input) {
        preRouteSeen = input;

        return {
          statusCode: 201,
          body: { ok: true, status: 'created' },
          idempotencyPolicy: {
            ok: true,
            idempotencyKey: input.idempotencyKey,
            requestId: input.requestId,
          },
        };
      },
    },
  });
  const input = {
    sessionContext: {
      organizationId: 'org-idem-boundary-2203',
      actorId: 'actor-idem-boundary-2203',
      actorRole: 'service_agent',
    },
    repairIntakeDraftId: 'draft-idem-boundary-2203',
    source: 'route_adapter_contract',
    requestId: '',
    idempotencyKey: 'trusted-top-level-idem-2203',
    headers: {
      'idempotency-key': ' trusted-header-idem-2203 ',
      'x-request-id': ' trusted-header-request-2203 ',
      authorization: 'hidden-authorization-2203',
      cookie: 'hidden-cookie-2203',
    },
    body: unsafeRequestBody(),
  };
  const before = structuredClone(input);

  const result = await routeAdapter.handleRouteLikeRequest(input);

  assert.equal(preRouteSeen.idempotencyKey, 'trusted-header-idem-2203');
  assert.equal(preRouteSeen.requestId, 'trusted-header-request-2203');
  assert.equal(Object.hasOwn(preRouteSeen.requestBody, 'idempotencyKey'), false);
  assert.equal(Object.hasOwn(preRouteSeen.requestBody, 'requestId'), false);
  assert.equal(result.idempotencyPolicy.idempotencyKey, 'trusted-header-idem-2203');
  assert.deepEqual(input, before);
  assertNoUnsafeText(preRouteSeen);
  assertNoUnsafeText(result);
});

test('Task2203 permission-denied synthetic path still skips injected controller adapter', async () => {
  const adapterCalls = [];
  const handler = createRepairIntakeDraftToCaseSyntheticHandler({
    requestContextResolver() {
      return trustedContext({
        actorRole: 'customer',
        source: 'customer_access',
      });
    },
    controllerAdapter: {
      submitDraftToCase(input) {
        adapterCalls.push(input);

        return { ok: true };
      },
    },
  });

  const result = await handler.handleDraftToCase(preRouteInput());

  assert.equal(adapterCalls.length, 0);
  assert.equal(result.ok, false);
  assert.equal(result.status, 'denied');
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_PERMISSION_GATE_ROLE_NOT_ALLOWED');
  assertNoUnsafeText(result);
});
