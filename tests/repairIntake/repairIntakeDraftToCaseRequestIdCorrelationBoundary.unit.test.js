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
  createRepairIntakeDraftToCaseRouteHandler,
} = require('../../src/repairIntake/repairIntakeDraftToCaseRouteHandlerFactory');
const {
  createRepairIntakeDraftToCaseSyntheticHandler,
} = require('../../src/repairIntake/repairIntakeDraftToCaseSyntheticHandler');
const {
  buildAdminRequestLike,
} = require('../../src/routes/repairIntakeDraftToCase.routes');

function unsafeBody() {
  return {
    requestId: 'body-request-hidden-2205',
    correlationId: 'body-correlation-hidden-2205',
    traceId: 'body-trace-hidden-2205',
    debugId: 'body-debug-hidden-2205',
    idempotencyKey: 'body-idem-hidden-2205',
    dedupeKey: 'body-dedupe-hidden-2205',
    caseId: 'body-case-hidden-2205',
    replay: 'body-replay-hidden-2205',
    duplicate: 'body-duplicate-hidden-2205',
    providerPayload: { requestId: 'provider-request-hidden-2205' },
    ai: { correlationId: 'ai-correlation-hidden-2205' },
    rag: { traceId: 'rag-trace-hidden-2205' },
    billing: { invoice: 'billing-hidden-2205' },
    auditActor: { requestId: 'audit-request-hidden-2205' },
    token: 'token-hidden-2205',
    password: 'password-hidden-2205',
    sql: 'sql-hidden-2205',
    stack: 'stack-hidden-2205',
    draftInput: {
      problemDescription: 'safe problem',
      requestId: 'draft-request-hidden-2205',
      correlationId: 'draft-correlation-hidden-2205',
      rawBody: 'draft-raw-body-hidden-2205',
      customerPhone: 'draft-phone-hidden-2205',
      address: 'draft-address-hidden-2205',
      internal: 'draft-internal-hidden-2205',
      rawError: 'draft-raw-error-hidden-2205',
    },
    rawBody: 'raw-body-hidden-2205',
  };
}

function trustedContext(overrides = {}) {
  return {
    ok: true,
    status: 'resolved',
    messageKey: 'repair_intake_draft_to_case.request_context_resolved',
    reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_REQUEST_CONTEXT_RESOLVED',
    organizationId: 'org-correlation-2205',
    actorId: 'actor-correlation-2205',
    actorRole: 'service_agent',
    repairIntakeDraftId: 'draft-correlation-2205',
    source: 'route_adapter_contract',
    draftInput: {
      problemDescription: 'safe problem',
    },
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

        return {
          ok: true,
          status: 'policy_built',
          idempotencyKey: input.idempotencyKey || input.requestId || 'fallback',
          requestId: input.requestId,
          organizationId: input.organizationId,
          actorId: input.actorId,
          repairIntakeDraftId: input.repairIntakeDraftId,
        };
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
            reasonCode: input.reasonCode,
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
          reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_PUBLIC_CREATED',
          caseId: 'case-correlation-2205',
          repairIntakeDraftId: 'draft-correlation-2205',
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
    'body-request-hidden-2205',
    'body-correlation-hidden-2205',
    'body-trace-hidden-2205',
    'body-debug-hidden-2205',
    'body-idem-hidden-2205',
    'body-dedupe-hidden-2205',
    'body-case-hidden-2205',
    'body-replay-hidden-2205',
    'body-duplicate-hidden-2205',
    'provider-request-hidden-2205',
    'ai-correlation-hidden-2205',
    'rag-trace-hidden-2205',
    'billing-hidden-2205',
    'audit-request-hidden-2205',
    'token-hidden-2205',
    'password-hidden-2205',
    'sql-hidden-2205',
    'stack-hidden-2205',
    'draft-request-hidden-2205',
    'draft-correlation-hidden-2205',
    'draft-raw-body-hidden-2205',
    'draft-phone-hidden-2205',
    'draft-address-hidden-2205',
    'draft-internal-hidden-2205',
    'draft-raw-error-hidden-2205',
    'raw-body-hidden-2205',
    'unsafe request select token',
    'x'.repeat(129),
  ]) {
    assert.equal(serialized.includes(marker), false, `leaked unsafe marker ${marker}`);
  }
}

function assertNoUnsafeCorrelationText(value) {
  const serialized = JSON.stringify(value);

  for (const marker of [
    'body-request-hidden-2205',
    'body-correlation-hidden-2205',
    'body-trace-hidden-2205',
    'body-debug-hidden-2205',
    'body-idem-hidden-2205',
    'body-dedupe-hidden-2205',
    'body-case-hidden-2205',
    'body-replay-hidden-2205',
    'body-duplicate-hidden-2205',
    'draft-request-hidden-2205',
    'draft-correlation-hidden-2205',
  ]) {
    assert.equal(serialized.includes(marker), false, `leaked unsafe correlation marker ${marker}`);
  }
}

test('Task2205 route handler and adapter use trusted top-level/header request id only', async () => {
  let routeLikeSeen;
  let preRouteSeen;
  const routeAdapter = createRepairIntakeDraftToCaseRouteAdapterContract({
    preRouteHandler: {
      handleDraftToCasePreRoute(input) {
        preRouteSeen = input;

        return {
          statusCode: 201,
          body: { ok: true },
          idempotencyPolicy: { requestId: input.requestId },
        };
      },
    },
  });
  const handler = createRepairIntakeDraftToCaseRouteHandler({
    routeAdapter: {
      handleRouteLikeRequest(input) {
        routeLikeSeen = input;

        return routeAdapter.handleRouteLikeRequest(input);
      },
    },
  });
  const input = {
    sessionContext: {
      organizationId: 'org-correlation-2205',
      actorId: 'actor-correlation-2205',
      actorRole: 'service_agent',
    },
    params: {
      repairIntakeDraftId: 'draft-correlation-2205',
    },
    requestId: '',
    headers: {
      'x-request-id': ' trusted-header-request-2205 ',
      'x-correlation-id': 'body-correlation-hidden-2205',
      authorization: 'token-hidden-2205',
    },
    body: unsafeBody(),
    source: 'route_handler',
  };
  const before = structuredClone(input);

  const result = await handler.handle(input);

  assert.equal(preRouteSeen.requestId, 'trusted-header-request-2205');
  assert.equal(result.body.ok, true);
  assert.equal(Object.hasOwn(routeLikeSeen.body, 'requestId'), false);
  assert.equal(Object.hasOwn(routeLikeSeen.body, 'correlationId'), false);
  assert.equal(Object.hasOwn(routeLikeSeen.body, 'traceId'), false);
  assert.equal(Object.hasOwn(routeLikeSeen.body, 'debugId'), false);
  assert.equal(Object.hasOwn(preRouteSeen.requestBody, 'requestId'), false);
  assert.equal(Object.hasOwn(preRouteSeen.requestBody, 'correlationId'), false);
  assert.deepEqual(input, before);
  assertNoUnsafeText(routeLikeSeen);
  assertNoUnsafeText(preRouteSeen);
  assertNoUnsafeText(result);
});

test('Task2205 pre-route policy and audit omit unsafe body or draftInput request correlation', async () => {
  const flow = createPreRouteFlow();
  const input = {
    requestId: undefined,
    idempotencyKey: undefined,
    requestBody: unsafeBody(),
  };
  const before = structuredClone(input);

  const result = await flow.handler.handleDraftToCasePreRoute(input);

  assert.equal(flow.policyInputs[0].requestId, null);
  assert.equal(result.idempotencyPolicy.requestId, null);
  assert.equal(Object.hasOwn(flow.auditInputs[0], 'requestId'), false);
  assert.equal(Object.hasOwn(flow.auditInputs[0], 'correlationId'), false);
  assert.deepEqual(input, before);
  assertNoUnsafeText(flow.policyInputs);
  assertNoUnsafeText(flow.auditInputs);
  assertNoUnsafeText(result);
});

test('Task2205 malformed or overly long request correlation values are omitted safely', async () => {
  const flow = createPreRouteFlow();
  const result = await flow.handler.handleDraftToCasePreRoute({
    requestId: 'unsafe request select token',
    idempotencyKey: 'trusted-idem-2205',
    requestBody: unsafeBody(),
  });
  const longFlow = createPreRouteFlow();
  const longResult = await longFlow.handler.handleDraftToCasePreRoute({
    requestId: 'x'.repeat(129),
    idempotencyKey: undefined,
    requestBody: unsafeBody(),
  });

  assert.equal(flow.policyInputs[0].requestId, null);
  assert.equal(result.idempotencyPolicy.requestId, null);
  assert.equal(longFlow.policyInputs[0].requestId, null);
  assert.equal(longResult.idempotencyPolicy.requestId, null);
  assertNoUnsafeText(result);
  assertNoUnsafeText(longResult);
});

test('Task2205 admin request helper does not accept body request correlation fields', () => {
  const requestLike = buildAdminRequestLike({
    user: {
      id: 'actor-correlation-2205',
      organizationId: 'org-correlation-2205',
    },
    context: {
      requestId: 'trusted-admin-request-2205',
      organizationId: 'org-correlation-2205',
    },
    requestId: '',
    params: {
      draftId: 'draft-correlation-2205',
    },
    body: unsafeBody(),
  });

  assert.equal(requestLike.requestId, 'trusted-admin-request-2205');
  assert.equal(requestLike.context.requestId, 'trusted-admin-request-2205');
  assert.equal(Object.hasOwn(requestLike.body, 'requestId'), false);
  assert.equal(Object.hasOwn(requestLike.body, 'correlationId'), false);
  assert.equal(Object.hasOwn(requestLike.body, 'traceId'), false);
  assert.equal(Object.hasOwn(requestLike.body, 'debugId'), false);
  assertNoUnsafeCorrelationText(requestLike);
});

test('Task2205 permission-denied and adapter-failure envelopes remain sanitized', async () => {
  const deniedAdapterCalls = [];
  const deniedHandler = createRepairIntakeDraftToCaseSyntheticHandler({
    requestContextResolver() {
      return trustedContext({ actorRole: 'customer', source: 'customer_access' });
    },
    controllerAdapter: {
      submitDraftToCase(input) {
        deniedAdapterCalls.push(input);

        return { ok: true };
      },
    },
  });
  const failingHandler = createRepairIntakeDraftToCaseSyntheticHandler({
    requestContextResolver() {
      return trustedContext({ source: 'synthetic_handler' });
    },
    controllerAdapter: {
      submitDraftToCase() {
        throw new Error('unsafe request select token raw-body-hidden-2205');
      },
    },
  });

  const denied = await deniedHandler.handleDraftToCase({ requestBody: unsafeBody() });
  const failed = await failingHandler.handleDraftToCase({ requestBody: unsafeBody() });

  assert.equal(deniedAdapterCalls.length, 0);
  assert.equal(denied.status, 'denied');
  assert.equal(failed.status, 'failed');
  assertNoUnsafeText(denied);
  assertNoUnsafeText(failed);
});
