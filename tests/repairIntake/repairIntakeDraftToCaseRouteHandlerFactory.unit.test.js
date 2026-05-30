'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createRepairIntakeDraftToCaseRouteHandler,
} = require('../../src/repairIntake/repairIntakeDraftToCaseRouteHandlerFactory');

function clone(value) {
  return structuredClone(value);
}

function futureRouterInput(overrides = {}) {
  return {
    sessionContext: {
      organizationId: 'org-session-1263',
      actorId: 'actor-session-1263',
      actorRole: 'service_agent',
      token: 'hidden-session-token',
      rawSessionTrace: 'hidden-raw-session-trace',
    },
    params: {
      repairIntakeDraftId: 'draft-path-1263',
      rawParams: 'hidden-raw-params',
    },
    body: {
      repairIntakeDraftId: 'draft-body-ignored-1263',
      issueSummary: 'dishwasher pump noise',
      organizationId: 'org-body-override-1263',
      actorId: 'actor-body-override-1263',
      idempotencyKey: 'idem-body-ignored-1263',
      rawBody: 'hidden-raw-body',
      nested: {
        safeField: 'safe nested value',
        phone: 'hidden-phone',
      },
    },
    headers: {
      'idempotency-key': ' idem-header-1263 ',
      'x-request-id': ' header-request-1263 ',
      'x-request-source': ' header-source-1263 ',
      authorization: 'hidden-authorization',
      cookie: 'hidden-cookie',
      raw: { token: 'hidden-token' },
    },
    requestId: 'request-1263',
    source: 'route_handler_factory_unit',
    rawRequest: { token: 'hidden-raw-request-token' },
    ...overrides,
  };
}

function safeAdapterOutput(overrides = {}) {
  return {
    statusCode: 201,
    body: {
      ok: true,
      status: 'created',
      reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_PUBLIC_CREATED',
      caseId: 'case-1263',
      repairIntakeDraftId: 'draft-path-1263',
    },
    auditIntents: [
      {
        ok: true,
        auditIntent: {
          phase: 'submitted',
          organizationId: 'org-session-1263',
        },
      },
    ],
    idempotencyPolicy: {
      ok: true,
      idempotencyKey: 'idem-header-1263',
    },
    ...overrides,
  };
}

function createHandlerWithSpy(options = {}) {
  const calls = [];
  const returnedOutput = options.output || safeAdapterOutput();
  const routeAdapter = {
    async handleRouteLikeRequest(input) {
      calls.push(input);

      if (options.throwError) {
        throw new Error('hidden raw adapter failure token secret phone address stack');
      }

      return returnedOutput;
    },
  };
  const handler = createRepairIntakeDraftToCaseRouteHandler({
    routeAdapter,
  });

  return {
    calls,
    handler,
    returnedOutput,
  };
}

function assertNoUnsafeText(value) {
  const serialized = JSON.stringify(value);

  for (const marker of [
    'draft-body-ignored-1263',
    'org-body-override-1263',
    'actor-body-override-1263',
    'idem-body-ignored-1263',
    'hidden',
    'rawBody',
    'rawParams',
    'rawRequest',
    'params',
    'authorization',
    'cookie',
    'phone',
    'address',
    'token',
    'secret',
    'stack',
    'cache' + '.set',
    'red' + 'is',
    'audit' + 'Writer',
    'audit' + 'Repository',
  ]) {
    assert.equal(serialized.includes(marker), false, `leaked unsafe marker ${marker}`);
  }
}

test('valid future-router-shaped input calls route adapter with path-derived draft id', async () => {
  const { calls, handler } = createHandlerWithSpy();

  const result = await handler.handle(futureRouterInput());

  assert.equal(result.statusCode, 201);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], {
    sessionContext: {
      organizationId: 'org-session-1263',
      actorId: 'actor-session-1263',
      actorRole: 'service_agent',
    },
    repairIntakeDraftId: 'draft-path-1263',
    body: {
      issueSummary: 'dishwasher pump noise',
      nested: {
        safeField: 'safe nested value',
      },
    },
    headers: {
      'idempotency-key': 'idem-header-1263',
      'x-request-id': 'header-request-1263',
      'x-request-source': 'header-source-1263',
    },
    requestId: 'request-1263',
    source: 'route_handler_factory_unit',
  });
  assertNoUnsafeText(calls[0]);
  assertNoUnsafeText(result);
});

test('path draft id wins over conflicting body draft id', async () => {
  const { calls, handler } = createHandlerWithSpy();

  await handler.handle(futureRouterInput({
    params: {
      repairIntakeDraftId: 'draft-path-wins-1263',
    },
    body: {
      repairIntakeDraftId: 'draft-body-loses-1263',
      issueSummary: 'safe issue',
    },
  }));

  assert.equal(calls[0].repairIntakeDraftId, 'draft-path-wins-1263');
  assert.equal(Object.hasOwn(calls[0].body, 'repairIntakeDraftId'), false);
  assert.equal(JSON.stringify(calls[0]).includes('draft-body-loses-1263'), false);
});

test('body organization actor and idempotency override are not specially trusted', async () => {
  const { calls, handler } = createHandlerWithSpy();

  await handler.handle(futureRouterInput());

  assert.equal(Object.hasOwn(calls[0].body, 'organizationId'), false);
  assert.equal(Object.hasOwn(calls[0].body, 'actorId'), false);
  assert.equal(Object.hasOwn(calls[0].body, 'idempotencyKey'), false);
  assert.equal(calls[0].sessionContext.organizationId, 'org-session-1263');
  assert.equal(calls[0].sessionContext.actorId, 'actor-session-1263');
});

test('safe headers are forwarded only through adapter-compatible route-like input', async () => {
  const { calls, handler } = createHandlerWithSpy();

  await handler.handle(futureRouterInput({
    headers: {
      'Idempotency-Key': ' idem-case-header-1263 ',
      'Request-Source': ' source-header-1263 ',
      authorization: 'hidden-authorization',
      cookie: 'hidden-cookie',
      raw: { token: 'hidden-token' },
      nested: { ignored: true },
    },
  }));

  assert.deepEqual(calls[0].headers, {
    'idempotency-key': 'idem-case-header-1263',
    'request-source': 'source-header-1263',
  });
  assertNoUnsafeText(calls[0]);
});

test('missing path draft id returns safe invalid request and does not call adapter', async () => {
  const { calls, handler } = createHandlerWithSpy();

  const result = await handler.handle(futureRouterInput({
    params: {},
  }));

  assert.equal(result.statusCode, 400);
  assert.equal(result.body.ok, false);
  assert.equal(result.body.status, 'invalid_request');
  assert.deepEqual(calls, []);
  assertNoUnsafeText(result);
});

test('missing adapter returns safe dependency failure', async () => {
  const handler = createRepairIntakeDraftToCaseRouteHandler();

  const result = await handler.handle(futureRouterInput());

  assert.equal(result.statusCode, 503);
  assert.equal(
    result.body.reasonCode,
    'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_HANDLER_ADAPTER_REQUIRED',
  );
  assertNoUnsafeText(result);
});

test('adapter function form is accepted', async () => {
  const calls = [];
  const handler = createRepairIntakeDraftToCaseRouteHandler({
    routeAdapter(input) {
      calls.push(input);
      return safeAdapterOutput();
    },
  });

  const result = await handler.handle(futureRouterInput());

  assert.equal(result.statusCode, 201);
  assert.equal(calls[0].repairIntakeDraftId, 'draft-path-1263');
});

test('adapter throw returns generic safe failure', async () => {
  const { handler } = createHandlerWithSpy({ throwError: true });

  const result = await handler.handle(futureRouterInput());

  assert.equal(result.statusCode, 503);
  assert.equal(
    result.body.reasonCode,
    'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_HANDLER_ADAPTER_FAILED',
  );
  assertNoUnsafeText(result);
});

test('adapter output is returned safely with unsafe fields stripped', async () => {
  const { handler } = createHandlerWithSpy({
    output: safeAdapterOutput({
      rawRows: [{ phone: 'hidden-phone' }],
      body: {
        ok: true,
        status: 'created',
        caseId: 'case-1263',
        repairIntakeDraftId: 'draft-path-1263',
        rawError: 'hidden-raw-error',
        stack: 'hidden-stack',
      },
    }),
  });

  const result = await handler.handle(futureRouterInput());

  assert.deepEqual(result.body, {
    ok: true,
    status: 'created',
    caseId: 'case-1263',
    repairIntakeDraftId: 'draft-path-1263',
  });
  assert.equal(Object.hasOwn(result, 'rawRows'), false);
  assertNoUnsafeText(result);
});

test('input is not mutated', async () => {
  const { handler } = createHandlerWithSpy();
  const input = futureRouterInput();
  const beforeInput = clone(input);

  await handler.handle(input);

  assert.deepEqual(input, beforeInput);
});

test('output is detached from dependency output', async () => {
  const { handler, returnedOutput } = createHandlerWithSpy();

  const result = await handler.handle(futureRouterInput());

  result.body.status = 'mutated-after-return';
  result.auditIntents[0].auditIntent.phase = 'mutated-after-return';

  assert.equal(returnedOutput.body.status, 'created');
  assert.equal(returnedOutput.auditIntents[0].auditIntent.phase, 'submitted');
});
