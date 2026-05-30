'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createRepairIntakeDraftToCaseRouteAdapterContract,
} = require('../../src/repairIntake/repairIntakeDraftToCaseRouteAdapterContract');

function clone(value) {
  return structuredClone(value);
}

function routeLikeInput(overrides = {}) {
  return {
    sessionContext: {
      organizationId: 'org-session-1257',
      actorId: 'actor-session-1257',
      role: 'service_agent',
      token: 'hidden-session-token',
    },
    repairIntakeDraftId: 'draft-1257',
    body: {
      repairIntakeDraftId: 'draft-1257',
      issueSummary: 'display has intermittent lines',
      organizationId: 'org-body-override-1257',
      actorId: 'actor-body-override-1257',
      idempotencyKey: 'idem-body-ignored-1257',
      phone: 'hidden-phone',
      address: 'hidden-address',
      nested: {
        safeCode: 'nested-safe-1257',
        rawBody: 'hidden-raw-body',
        token: 'hidden-nested-token',
      },
    },
    headers: {
      'idempotency-key': ' idem-header-1257 ',
      'x-request-source': ' header-source-1257 ',
      'x-request-id': ' header-request-1257 ',
      authorization: 'hidden-authorization',
      cookie: 'hidden-cookie',
      raw: { phone: 'hidden-phone' },
    },
    requestId: 'request-1257',
    source: 'route-like-unit',
    rawRequest: { token: 'hidden-raw-request-token' },
    ...overrides,
  };
}

function safeOutput(overrides = {}) {
  return {
    statusCode: 201,
    body: {
      ok: true,
      status: 'created',
      reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_CREATED',
      caseId: 'case-1257',
      repairIntakeDraftId: 'draft-1257',
    },
    auditIntents: [
      {
        ok: true,
        auditIntent: {
          phase: 'submitted',
          organizationId: 'org-session-1257',
        },
      },
    ],
    idempotencyPolicy: {
      ok: true,
      key: 'idem-header-1257',
    },
    ...overrides,
  };
}

function createAdapterWithSpy(options = {}) {
  const calls = [];
  const returnedOutput = options.output || safeOutput();
  const preRouteHandler = {
    async handleDraftToCasePreRoute(input) {
      calls.push(input);

      if (options.throwError) {
        throw new Error('hidden raw failure stack trace token secret phone address');
      }

      return returnedOutput;
    },
  };
  const adapter = createRepairIntakeDraftToCaseRouteAdapterContract({
    preRouteHandler,
  });

  return {
    adapter,
    calls,
    returnedOutput,
  };
}

function assertNoUnsafeText(value) {
  const serialized = JSON.stringify(value);

  for (const marker of [
    'org-body-override-1257',
    'actor-body-override-1257',
    'idem-body-ignored-1257',
    'hidden',
    'authorization',
    'cookie',
    'rawRequest',
    'rawBody',
    'phone',
    'address',
    'token',
    'secret',
    'stack trace',
    'select *',
    'cache' + '.set',
    'red' + 'is',
    'audit' + 'Writer',
    'audit' + 'Repository',
    'lineAccess' + 'Token',
    'pro' + 'viderPayload',
  ]) {
    assert.equal(serialized.includes(marker), false, `leaked unsafe marker ${marker}`);
  }
}

test('valid route-like input calls pre-route handler with sanitized fields', async () => {
  const { adapter, calls } = createAdapterWithSpy();

  const result = await adapter.handleRouteLikeRequest(routeLikeInput());

  assert.equal(result.statusCode, 201);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], {
    sessionContext: {
      organizationId: 'org-session-1257',
      actorId: 'actor-session-1257',
      role: 'service_agent',
    },
    requestBody: {
      issueSummary: 'display has intermittent lines',
      nested: {
        safeCode: 'nested-safe-1257',
      },
    },
    repairIntakeDraftId: 'draft-1257',
    requestSource: 'route-like-unit',
    requestId: 'request-1257',
    idempotencyKey: 'idem-header-1257',
  });
  assertNoUnsafeText(calls[0]);
  assertNoUnsafeText(result);
});

test('body maps to sanitized requestBody', async () => {
  const { adapter, calls } = createAdapterWithSpy();

  await adapter.handleRouteLikeRequest(routeLikeInput({
    repairIntakeDraftId: 'draft-trusted-map-1257',
    body: {
      repairIntakeDraftId: 'draft-body-map-1257',
      applianceType: 'washer',
      customerNote: 'unit test safe note',
      rawInput: 'hidden-raw-input',
    },
  }));

  assert.deepEqual(calls[0].requestBody, {
    applianceType: 'washer',
    customerNote: 'unit test safe note',
  });
  assert.equal(calls[0].repairIntakeDraftId, 'draft-trusted-map-1257');
});

test('safe idempotency key is extracted from headers before top-level fallback', async () => {
  const { adapter, calls } = createAdapterWithSpy();

  await adapter.handleRouteLikeRequest(routeLikeInput({
    idempotencyKey: 'idem-input-1257',
    headers: {
      'Idempotency-Key': ' idem-header-case-insensitive-1257 ',
    },
  }));

  assert.equal(calls[0].idempotencyKey, 'idem-header-case-insensitive-1257');
});

test('top-level idempotency key is used when safe header is absent', async () => {
  const { adapter, calls } = createAdapterWithSpy();

  await adapter.handleRouteLikeRequest(routeLikeInput({
    idempotencyKey: ' idem-input-1257 ',
    headers: {},
  }));

  assert.equal(calls[0].idempotencyKey, 'idem-input-1257');
});

test('source and request id can fall back to safe scalar headers', async () => {
  const { adapter, calls } = createAdapterWithSpy();

  await adapter.handleRouteLikeRequest(routeLikeInput({
    source: '',
    requestId: '',
    headers: {
      'request-source': ' source-from-header-1257 ',
      'x-request-id': ' request-from-header-1257 ',
    },
  }));

  assert.equal(calls[0].requestSource, 'source-from-header-1257');
  assert.equal(calls[0].requestId, 'request-from-header-1257');
});

test('body organization and actor overrides are not trusted or forwarded', async () => {
  const { adapter, calls } = createAdapterWithSpy();

  await adapter.handleRouteLikeRequest(routeLikeInput());

  assert.equal(Object.hasOwn(calls[0].requestBody, 'organizationId'), false);
  assert.equal(Object.hasOwn(calls[0].requestBody, 'actorId'), false);
  assert.equal(JSON.stringify(calls[0]).includes('org-body-override-1257'), false);
  assert.equal(JSON.stringify(calls[0]).includes('actor-body-override-1257'), false);
});

test('raw headers are not forwarded wholesale', async () => {
  const { adapter, calls } = createAdapterWithSpy();

  await adapter.handleRouteLikeRequest(routeLikeInput());

  assert.equal(Object.hasOwn(calls[0], 'headers'), false);
  assert.equal(JSON.stringify(calls[0]).includes('authorization'), false);
  assert.equal(JSON.stringify(calls[0]).includes('cookie'), false);
});

test('dependency missing returns safe failure envelope', async () => {
  const adapter = createRepairIntakeDraftToCaseRouteAdapterContract();

  const result = await adapter.handleRouteLikeRequest(routeLikeInput());

  assert.equal(result.statusCode, 503);
  assert.equal(result.body.ok, false);
  assert.equal(
    result.body.reasonCode,
    'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_ADAPTER_PRE_ROUTE_HANDLER_REQUIRED',
  );
  assertNoUnsafeText(result);
});

test('dependency function form is accepted', async () => {
  const calls = [];
  const adapter = createRepairIntakeDraftToCaseRouteAdapterContract({
    preRouteHandler(input) {
      calls.push(input);
      return safeOutput();
    },
  });

  const result = await adapter.handleRouteLikeRequest(routeLikeInput());

  assert.equal(result.statusCode, 201);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].repairIntakeDraftId, 'draft-1257');
  assert.equal(Object.hasOwn(calls[0].requestBody, 'repairIntakeDraftId'), false);
});

test('dependency throwing sensitive error returns generic safe failure', async () => {
  const { adapter } = createAdapterWithSpy({ throwError: true });

  const result = await adapter.handleRouteLikeRequest(routeLikeInput());

  assert.equal(result.statusCode, 503);
  assert.equal(
    result.body.reasonCode,
    'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_ADAPTER_PRE_ROUTE_HANDLER_FAILED',
  );
  assertNoUnsafeText(result);
});

test('pre-route handler output is returned safely with unsafe fields stripped', async () => {
  const { adapter } = createAdapterWithSpy({
    output: safeOutput({
      rawRows: [{ phone: 'hidden-phone' }],
      body: {
        ok: true,
        status: 'created',
        caseId: 'case-1257',
        repairIntakeDraftId: 'draft-1257',
        rawError: 'hidden-raw-error',
        stack: 'hidden-stack',
      },
    }),
  });

  const result = await adapter.handleRouteLikeRequest(routeLikeInput());

  assert.deepEqual(result.body, {
    ok: true,
    status: 'created',
    caseId: 'case-1257',
    repairIntakeDraftId: 'draft-1257',
  });
  assert.equal(Object.hasOwn(result, 'rawRows'), false);
  assertNoUnsafeText(result);
});

test('unsafe route-like fields are stripped from pre-route input', async () => {
  const { adapter, calls } = createAdapterWithSpy();

  await adapter.handleRouteLikeRequest(routeLikeInput({
    sessionContext: {
      organizationId: 'org-session-1257',
      actorId: 'actor-session-1257',
      token: 'hidden-token',
      rawContext: 'hidden-raw-context',
      safeFlag: true,
    },
    body: {
      repairIntakeDraftId: 'draft-1257',
      rawImportedRow: 'hidden-raw-imported-row',
      databaseUrl: 'hidden-database-url',
      sql: 'hidden-sql',
      safeField: 'kept',
    },
  }));

  assert.deepEqual(calls[0].sessionContext, {
    organizationId: 'org-session-1257',
    actorId: 'actor-session-1257',
    safeFlag: true,
  });
  assert.deepEqual(calls[0].requestBody, {
    safeField: 'kept',
  });
});

test('input is not mutated', async () => {
  const { adapter } = createAdapterWithSpy();
  const input = routeLikeInput();
  const before = clone(input);

  await adapter.handleRouteLikeRequest(input);

  assert.deepEqual(input, before);
});

test('output is detached from dependency output', async () => {
  const { adapter, returnedOutput } = createAdapterWithSpy();

  const result = await adapter.handleRouteLikeRequest(routeLikeInput());

  result.body.status = 'mutated-after-return';
  result.auditIntents[0].auditIntent.phase = 'mutated-after-return';

  assert.equal(returnedOutput.body.status, 'created');
  assert.equal(returnedOutput.auditIntents[0].auditIntent.phase, 'submitted');
});
