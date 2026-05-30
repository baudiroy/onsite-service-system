'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createRepairIntakeDraftToCaseRouteAdapterContract,
} = require('../../src/repairIntake/repairIntakeDraftToCaseRouteAdapterContract');
const {
  createRepairIntakeDraftToCaseRouteHandler,
} = require('../../src/repairIntake/repairIntakeDraftToCaseRouteHandlerFactory');

const UNSAFE_TEXT = [
  'select * from route_adapter_task2235',
  'postgres://task2235-db',
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
  'unsafe raw body',
  'unsafe raw draftInput',
  'unsafe audit internal',
  'unsafe debug detail',
  'unsafe billing invoice settlement',
  'unsafe rag payload',
].join(' ');

function routeLikeInput(overrides = {}) {
  return {
    sessionContext: {
      organizationId: 'org-task2235',
      actorId: 'actor-task2235',
      role: 'service_agent',
      rawSessionTrace: UNSAFE_TEXT,
      safeButUnsafeValue: UNSAFE_TEXT,
    },
    repairIntakeDraftId: 'draft-task2235',
    body: {
      issueSummary: 'screen flickers after warm-up',
      customerNote: 'safe note',
      rawBody: UNSAFE_TEXT,
      draftInput: UNSAFE_TEXT,
      safeButUnsafeValue: UNSAFE_TEXT,
      nested: {
        safeCode: 'nested-safe-task2235',
        leakedSql: UNSAFE_TEXT,
      },
    },
    headers: {
      'idempotency-key': 'idem-task2235',
      'x-request-id': 'req-task2235',
      'x-request-source': UNSAFE_TEXT,
      authorization: `Bearer ${UNSAFE_TEXT}`,
    },
    requestId: 'req-task2235-top',
    source: UNSAFE_TEXT,
    rawRequest: UNSAFE_TEXT,
    providerPayload: UNSAFE_TEXT,
    ...overrides,
  };
}

function futureRouterInput(overrides = {}) {
  return {
    sessionContext: {
      organizationId: 'org-task2235',
      actorId: 'actor-task2235',
      actorRole: 'service_agent',
      rawSessionTrace: UNSAFE_TEXT,
      safeButUnsafeValue: UNSAFE_TEXT,
    },
    params: {
      repairIntakeDraftId: 'draft-task2235',
      rawParams: UNSAFE_TEXT,
    },
    body: {
      issueSummary: 'washer drains slowly',
      customerNote: 'safe route handler note',
      rawBody: UNSAFE_TEXT,
      draftInput: UNSAFE_TEXT,
      safeButUnsafeValue: UNSAFE_TEXT,
      nested: {
        safeField: 'nested-handler-safe-task2235',
        providerPayload: UNSAFE_TEXT,
      },
    },
    headers: {
      'idempotency-key': 'idem-task2235',
      'x-request-id': 'req-task2235',
      'x-request-source': UNSAFE_TEXT,
      authorization: `Bearer ${UNSAFE_TEXT}`,
    },
    requestId: 'req-task2235-top',
    source: UNSAFE_TEXT,
    rawRequest: UNSAFE_TEXT,
    providerPayload: UNSAFE_TEXT,
    ...overrides,
  };
}

function safeOutput(overrides = {}) {
  return {
    statusCode: 201,
    body: {
      ok: true,
      status: 'created',
      reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_PUBLIC_CREATED',
      caseId: 'case-task2235',
      repairIntakeDraftId: 'draft-task2235',
    },
    auditIntents: [
      {
        ok: true,
        auditIntent: {
          phase: 'submitted',
          organizationId: 'org-task2235',
        },
      },
    ],
    idempotencyPolicy: {
      ok: true,
      key: 'idem-task2235',
    },
    ...overrides,
  };
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
    'customer phone',
    'customer address',
    'rawRequest',
    'raw request',
    'rawBody',
    'raw body',
    'draftInput',
    'raw draftInput',
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

function createAdapter(options = {}) {
  const calls = [];
  const output = Object.prototype.hasOwnProperty.call(options, 'output') ? options.output : safeOutput();
  const preRouteHandler = {
    async handleDraftToCasePreRoute(input) {
      calls.push(input);

      if (options.rejectError) {
        return Promise.reject(new Error(UNSAFE_TEXT));
      }

      if (options.throwError) {
        throw new Error(UNSAFE_TEXT);
      }

      return output;
    },
  };
  const adapter = createRepairIntakeDraftToCaseRouteAdapterContract({
    preRouteHandler,
  });

  return {
    adapter,
    calls,
    output,
  };
}

function createHandler(options = {}) {
  const calls = [];
  const output = Object.prototype.hasOwnProperty.call(options, 'output') ? options.output : safeOutput();
  const routeAdapter = {
    async handleRouteLikeRequest(input) {
      calls.push(input);

      if (options.rejectError) {
        return Promise.reject(new Error(UNSAFE_TEXT));
      }

      if (options.throwError) {
        throw new Error(UNSAFE_TEXT);
      }

      return output;
    },
  };
  const handler = createRepairIntakeDraftToCaseRouteHandler({
    routeAdapter,
  });

  return {
    calls,
    handler,
    output,
  };
}

test('route adapter normalizes thrown and rejected pre-route handler failures', async () => {
  for (const options of [{ throwError: true }, { rejectError: true }]) {
    const { adapter } = createAdapter(options);
    const result = await adapter.handleRouteLikeRequest(routeLikeInput());

    assert.equal(result.statusCode, 503);
    assert.equal(
      result.body.reasonCode,
      'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_ADAPTER_PRE_ROUTE_HANDLER_FAILED',
    );
    assertNoUnsafeText(result);
  }
});

test('route handler normalizes thrown and rejected route adapter failures', async () => {
  for (const options of [{ throwError: true }, { rejectError: true }]) {
    const { handler } = createHandler(options);
    const result = await handler.handle(futureRouterInput());

    assert.equal(result.statusCode, 503);
    assert.equal(
      result.body.reasonCode,
      'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_HANDLER_ADAPTER_FAILED',
    );
    assertNoUnsafeText(result);
  }
});

test('route adapter and route handler fail closed for malformed delegate outputs', async () => {
  for (const output of [null, undefined, 'unsafe route output token stack', 42, ['unsafe provider payload']]) {
    const { adapter } = createAdapter({ output });
    const adapterResult = await adapter.handleRouteLikeRequest(routeLikeInput());

    assert.equal(adapterResult.statusCode, 503);
    assert.equal(
      adapterResult.body.reasonCode,
      'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_ADAPTER_OUTPUT_INVALID',
    );
    assertNoUnsafeText(adapterResult);

    const { handler } = createHandler({ output });
    const handlerResult = await handler.handle(futureRouterInput());

    assert.equal(handlerResult.statusCode, 503);
    assert.equal(
      handlerResult.body.reasonCode,
      'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_HANDLER_ADAPTER_OUTPUT_INVALID',
    );
    assertNoUnsafeText(handlerResult);
  }
});

test('route adapter sanitizes unsafe request input before pre-route invocation', async () => {
  const input = routeLikeInput();
  const beforeInput = structuredClone(input);
  const { adapter, calls } = createAdapter();

  await adapter.handleRouteLikeRequest(input);

  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], {
    sessionContext: {
      organizationId: 'org-task2235',
      actorId: 'actor-task2235',
      role: 'service_agent',
    },
    repairIntakeDraftId: 'draft-task2235',
    requestBody: {
      issueSummary: 'screen flickers after warm-up',
      customerNote: 'safe note',
      nested: {
        safeCode: 'nested-safe-task2235',
      },
    },
    requestSource: null,
    requestId: 'req-task2235-top',
    idempotencyKey: 'idem-task2235',
  });
  assertNoUnsafeText(calls[0]);
  assert.deepEqual(input, beforeInput);
});

test('route handler sanitizes unsafe request input before adapter invocation', async () => {
  const input = futureRouterInput();
  const beforeInput = structuredClone(input);
  const { calls, handler } = createHandler();

  await handler.handle(input);

  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], {
    sessionContext: {
      organizationId: 'org-task2235',
      actorId: 'actor-task2235',
      actorRole: 'service_agent',
    },
    repairIntakeDraftId: 'draft-task2235',
    body: {
      issueSummary: 'washer drains slowly',
      customerNote: 'safe route handler note',
      nested: {
        safeField: 'nested-handler-safe-task2235',
      },
    },
    headers: {
      'idempotency-key': 'idem-task2235',
      'x-request-id': 'req-task2235',
    },
    requestId: 'req-task2235-top',
    source: null,
  });
  assertNoUnsafeText(calls[0]);
  assert.deepEqual(input, beforeInput);
});

test('route adapter and route handler strip unsafe output fields without mutating delegate output', async () => {
  const unsafeOutput = safeOutput({
    body: {
      ...safeOutput().body,
      rawError: UNSAFE_TEXT,
      stack: UNSAFE_TEXT,
      debug: UNSAFE_TEXT,
      metadata: {
        safe: 'kept',
        unsafeDetails: UNSAFE_TEXT,
      },
    },
    providerPayload: UNSAFE_TEXT,
    rawRows: [{ phone: UNSAFE_TEXT }],
    auditIntents: [
      {
        ok: true,
        auditIntent: {
          phase: 'submitted',
          organizationId: 'org-task2235',
          rawAuditRecord: UNSAFE_TEXT,
        },
      },
    ],
  });
  const beforeOutput = structuredClone(unsafeOutput);
  const { adapter } = createAdapter({ output: unsafeOutput });
  const adapterResult = await adapter.handleRouteLikeRequest(routeLikeInput());

  assert.equal(adapterResult.statusCode, 201);
  assert.deepEqual(adapterResult.body, {
    ok: true,
    status: 'created',
    reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_PUBLIC_CREATED',
    caseId: 'case-task2235',
    repairIntakeDraftId: 'draft-task2235',
    metadata: {
      safe: 'kept',
    },
  });
  assertNoUnsafeText(adapterResult);

  const { handler } = createHandler({ output: unsafeOutput });
  const handlerResult = await handler.handle(futureRouterInput());

  assert.deepEqual(handlerResult, adapterResult);
  assertNoUnsafeText(handlerResult);
  assert.deepEqual(unsafeOutput, beforeOutput);
});

test('route adapter and route handler preserve existing allowed success path', async () => {
  const output = safeOutput();
  const { adapter } = createAdapter({ output });
  const adapterResult = await adapter.handleRouteLikeRequest(routeLikeInput({
    source: 'task2235-safe-source',
    headers: {
      'idempotency-key': 'idem-task2235',
      'x-request-id': 'req-task2235',
      'x-request-source': 'task2235-safe-header-source',
    },
  }));

  assert.deepEqual(adapterResult, output);
  assertNoUnsafeText(adapterResult);

  const { handler } = createHandler({ output });
  const handlerResult = await handler.handle(futureRouterInput({
    source: 'task2235-safe-source',
    headers: {
      'idempotency-key': 'idem-task2235',
      'x-request-id': 'req-task2235',
      'x-request-source': 'task2235-safe-header-source',
    },
  }));

  assert.deepEqual(handlerResult, output);
  assertNoUnsafeText(handlerResult);
});
