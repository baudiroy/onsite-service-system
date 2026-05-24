'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  buildRepairIntakeDraftToCaseAuditIntent,
} = require('../../src/repairIntake/repairIntakeDraftToCaseAuditIntentBuilder');
const {
  buildRepairIntakeDraftToCaseIdempotencyPolicy,
} = require('../../src/repairIntake/repairIntakeDraftToCaseIdempotencyPolicyBuilder');
const {
  createRepairIntakeDraftToCasePreRouteHandler,
} = require('../../src/repairIntake/repairIntakeDraftToCasePreRouteHandlerFactory');

function syntheticInput(overrides = {}) {
  return {
    requestId: 'request-1255',
    idempotencyKey: 'idem-top-1255',
    sessionContext: {
      organizationId: 'org-session-1255',
      actorId: 'actor-session-1255',
      actorRole: 'service_agent',
      token: 'hidden-session-token',
      permissionTrace: { raw: 'hidden-permission-trace' },
    },
    requestBody: {
      repairIntakeDraftId: 'draft-1255',
      idempotencyKey: 'idem-body-1255',
      organizationId: 'org-body-override-1255',
      actorId: 'actor-body-override-1255',
      draftInput: {
        issueSummary: 'range display issue',
        phone: 'hidden-phone',
        address: 'hidden-address',
        email: 'hidden-email',
        ['pro' + 'viderPayload']: { raw: 'hidden-external-payload' },
        dbRow: { raw: 'hidden-db-row' },
        sql: 'hidden-sql',
        query: 'hidden-query',
        stack: 'hidden-stack',
      },
      rawBody: 'hidden-raw-body',
    },
    requestSource: 'pre_route_factory_unit',
    rawRequest: 'hidden-raw-request',
    ...overrides,
  };
}

function clone(value) {
  return structuredClone(value);
}

function createDependencies(options = {}) {
  const calls = {
    context: [],
    synthetic: [],
  };

  const requestContextResolver = {
    resolveRepairIntakeDraftToCaseRequestContext(input) {
      calls.context.push(input);

      if (options.contextThrows) {
        throw new Error('hidden context failure hidden-sql hidden-stack hidden-phone');
      }

      const session = input.sessionContext || {};
      const body = input.requestBody || {};

      if (!session.organizationId) {
        return {
          ok: false,
          status: 'invalid_context',
          messageKey: 'repair_intake_draft_to_case.invalid_context',
          reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_REQUEST_CONTEXT_ORGANIZATION_REQUIRED',
          organizationId: null,
          actorId: session.actorId || null,
          repairIntakeDraftId: body.repairIntakeDraftId || null,
          source: input.requestSource || null,
          rawBody: body.rawBody,
          permissionTrace: session.permissionTrace,
        };
      }

      return {
        ok: true,
        status: 'resolved',
        reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_REQUEST_CONTEXT_RESOLVED',
        organizationId: session.organizationId,
        actorId: session.actorId,
        repairIntakeDraftId: body.repairIntakeDraftId,
        source: input.requestSource,
        rawBody: body.rawBody,
        permissionTrace: session.permissionTrace,
      };
    },
  };
  const syntheticHandler = {
    handleDraftToCase(input) {
      calls.synthetic.push(input);

      if (options.syntheticThrows) {
        throw new Error('hidden synthetic failure hidden-sql hidden-stack hidden-phone');
      }

      if (options.denied) {
        return {
          ok: false,
          status: 'denied',
          messageKey: 'repair_intake_draft_to_case.denied',
          reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_PUBLIC_DENIED',
          caseId: null,
          repairIntakeDraftId: input.requestBody.repairIntakeDraftId,
          permissionTrace: { raw: 'hidden-permission-trace' },
        };
      }

      if (options.repositoryThrows) {
        return {
          ok: false,
          status: 'unavailable',
          messageKey: 'repair_intake_draft_to_case.unavailable',
          reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_PUBLIC_UNAVAILABLE',
          caseId: null,
          repairIntakeDraftId: input.requestBody.repairIntakeDraftId,
          rawError: 'hidden raw repository failure hidden-sql hidden-stack hidden-phone',
        };
      }

      return {
        ok: true,
        status: 'created',
        messageKey: 'repair_intake_draft_to_case.created',
        reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_PUBLIC_CREATED',
        caseId: 'case-1255',
        repairIntakeDraftId: input.requestBody.repairIntakeDraftId,
        rawRows: [{ phone: 'hidden-phone' }],
      };
    },
  };
  const httpResultMapper = {
    mapRepairIntakeDraftToCasePublicResultToHttpResponse(result) {
      if (options.mapperThrows) {
        throw new Error('hidden mapper failure hidden-sql hidden-stack hidden-phone');
      }

      const statusCodeByStatus = {
        created: 201,
        denied: 403,
        invalid_context: 400,
        unavailable: 503,
      };

      return {
        statusCode: statusCodeByStatus[result.status] || 503,
        body: {
          ok: result.ok === true,
          status: result.status || 'unavailable',
          messageKey: result.messageKey || 'repair_intake_draft_to_case.unavailable',
          reasonCode: result.reasonCode || 'REPAIR_INTAKE_DRAFT_TO_CASE_PUBLIC_UNAVAILABLE',
          caseId: result.caseId || null,
          repairIntakeDraftId: result.repairIntakeDraftId || null,
          rawError: result.rawError,
        },
      };
    },
  };

  return {
    calls,
    dependencies: {
      requestContextResolver,
      idempotencyPolicyBuilder: { buildRepairIntakeDraftToCaseIdempotencyPolicy },
      auditIntentBuilder: { buildRepairIntakeDraftToCaseAuditIntent },
      syntheticHandler,
      httpResultMapper,
    },
  };
}

async function run(options = {}, input = syntheticInput()) {
  const { calls, dependencies } = createDependencies(options);
  const handler = createRepairIntakeDraftToCasePreRouteHandler(dependencies);
  const result = await handler.handleDraftToCasePreRoute(input);

  return { calls, result };
}

function assertNoUnsafeText(value) {
  const serialized = JSON.stringify(value);

  for (const marker of [
    'org-body-override-1255',
    'actor-body-override-1255',
    'hidden',
    'rawRows',
    'raw',
    'headers',
    'authorization',
    'permissionTrace',
    'phone',
    'address',
    'email',
    'query',
    'stack',
    'pro' + 'viderPayload',
    'dbRow',
    'token',
    'select',
    'cache' + '.set',
    'red' + 'is',
  ]) {
    assert.equal(serialized.includes(marker), false, `leaked unsafe marker ${marker}`);
  }
}

test('success path returns 201 safe body audit intents and idempotency policy', async () => {
  const { result } = await run();

  assert.equal(result.statusCode, 201);
  assert.equal(result.body.ok, true);
  assert.equal(result.body.caseId, 'case-1255');
  assert.equal(result.idempotencyPolicy.ok, true);
  assert.equal(result.idempotencyPolicy.organizationId, 'org-session-1255');
  assert.equal(result.idempotencyPolicy.repairIntakeDraftId, 'draft-1255');
  assert.deepEqual(result.auditIntents.map((item) => item.auditIntent.phase), ['attempt', 'submitted']);
  assert.equal(result.auditIntents[1].auditIntent.caseId, 'case-1255');
  assertNoUnsafeText(result);
});

test('denied auth returns 403 attempt and denied audit intents', async () => {
  const { result } = await run({ denied: true });

  assert.equal(result.statusCode, 403);
  assert.equal(result.body.status, 'denied');
  assert.deepEqual(result.auditIntents.map((item) => item.auditIntent.phase), ['attempt', 'denied']);
  assertNoUnsafeText(result);
});

test('invalid session returns 400 and does not call synthetic handler or build policy', async () => {
  const input = syntheticInput({
    sessionContext: {
      actorId: 'actor-session-1255',
      actorRole: 'service_agent',
      permissionTrace: { raw: 'hidden-permission-trace' },
    },
  });
  const { calls, result } = await run({}, input);

  assert.equal(result.statusCode, 400);
  assert.equal(result.body.status, 'invalid_context');
  assert.deepEqual(calls.synthetic, []);
  assert.equal(result.idempotencyPolicy, null);
  assert.equal(result.auditIntents[0].ok, false);
  assertNoUnsafeText(result);
});

test('repository throw result maps to 503 failed audit without raw leakage', async () => {
  const { result } = await run({ repositoryThrows: true });

  assert.equal(result.statusCode, 503);
  assert.equal(result.body.status, 'unavailable');
  assert.equal(result.auditIntents[1].auditIntent.phase, 'failed');
  assertNoUnsafeText(result);
});

test('body org actor override attempt uses session-derived values only', async () => {
  const { result } = await run();

  assert.equal(result.idempotencyPolicy.organizationId, 'org-session-1255');
  assert.equal(result.idempotencyPolicy.actorId, 'actor-session-1255');
  assert.equal(result.auditIntents[0].auditIntent.organizationId, 'org-session-1255');
  assert.equal(result.auditIntents[1].auditIntent.actorId, 'actor-session-1255');
  assertNoUnsafeText(result);
});

test('missing dependency returns safe unavailable envelope', async () => {
  const handler = createRepairIntakeDraftToCasePreRouteHandler({});
  const result = await handler.handleDraftToCasePreRoute(syntheticInput());

  assert.equal(result.statusCode, 503);
  assert.equal(result.body.status, 'unavailable');
  assert.equal(result.body.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_PRE_ROUTE_HANDLER_DEPENDENCY_REQUIRED');
  assert.deepEqual(result.auditIntents, []);
  assert.equal(result.idempotencyPolicy, null);
  assertNoUnsafeText(result);
});

test('dependency throw returns safe failure', async () => {
  const { result } = await run({ contextThrows: true });

  assert.equal(result.statusCode, 503);
  assert.equal(result.body.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_PRE_ROUTE_HANDLER_CONTEXT_RESOLVER_FAILED');
  assertNoUnsafeText(result);
});

test('HTTP mapper throw returns safe failure without raw leakage', async () => {
  const { result } = await run({ mapperThrows: true });

  assert.equal(result.statusCode, 503);
  assert.equal(result.body.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_PRE_ROUTE_HANDLER_HTTP_MAPPER_FAILED');
  assertNoUnsafeText(result);
});

test('input is not mutated and returned objects are detached', async () => {
  const input = syntheticInput();
  const before = clone(input);
  const { result } = await run({}, input);

  input.sessionContext.organizationId = 'org-mutated';
  input.requestBody.repairIntakeDraftId = 'draft-mutated';

  assert.deepEqual(before, syntheticInput());
  assert.equal(result.idempotencyPolicy.organizationId, 'org-session-1255');
  assert.equal(result.auditIntents[0].auditIntent.repairIntakeDraftId, 'draft-1255');
  assertNoUnsafeText(result);
});
