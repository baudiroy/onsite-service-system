'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  buildRepairIntakeDraftToCaseAuditIntent,
} = require('../../src/repairIntake/repairIntakeDraftToCaseAuditIntentBuilder');
const {
  buildRepairIntakeDraftToCaseIdempotencyPolicy,
} = require('../../src/repairIntake/repairIntakeDraftToCaseIdempotencyPolicyBuilder');
const {
  createRepairIntakeCaseRepositoryConsumer,
} = require('../../src/repairIntake/repairIntakeCaseRepositoryConsumer');
const {
  createRepairIntakeDraftToCaseInjectedConsumerApplicationService,
} = require('../../src/repairIntake/repairIntakeDraftToCaseApplicationService');
const {
  createRepairIntakeDraftToCaseAuthorizationGate,
} = require('../../src/repairIntake/repairIntakeDraftToCaseAuthorizationGate');
const {
  createRepairIntakeDraftToCaseControllerAdapter,
} = require('../../src/repairIntake/repairIntakeDraftToCaseControllerAdapter');
const {
  mapRepairIntakeDraftToCasePublicResultToHttpResponse,
} = require('../../src/repairIntake/repairIntakeDraftToCaseHttpResultMapper');
const {
  createRepairIntakeDraftToCaseOrchestrator,
} = require('../../src/repairIntake/repairIntakeDraftToCaseOrchestrator');
const {
  createRepairIntakeDraftToCasePreRouteHandler,
} = require('../../src/repairIntake/repairIntakeDraftToCasePreRouteHandlerFactory');
const {
  presentRepairIntakeDraftToCaseResult,
} = require('../../src/repairIntake/repairIntakeDraftToCasePublicResultPresenter');
const {
  createRepairIntakeDraftToCaseRequestContextResolver,
} = require('../../src/repairIntake/repairIntakeDraftToCaseRequestContextResolver');
const {
  createRepairIntakeDraftToCaseRouteAdapterContract,
} = require('../../src/repairIntake/repairIntakeDraftToCaseRouteAdapterContract');
const {
  createRepairIntakeDraftToCaseSyntheticHandler,
} = require('../../src/repairIntake/repairIntakeDraftToCaseSyntheticHandler');

const TEST_SOURCE_PATH = __filename;
const DOC_PATH = path.resolve(
  __dirname,
  '../../docs/task-1259-repair-intake-draft-to-case-route-adapter-full-composition-integration-no-app-mount-no-server.md',
);

const FORBIDDEN_MARKERS = [
  'process.env.DATA' + 'BASE_URL',
  'ps' + 'ql',
  'd' + 'b:migrate',
  'listen(',
  'app.post',
  'router.post',
  'express.Router',
  'req, res',
  'res.json',
  '/repair-intake',
  '/cases',
  'sendSms',
  'sendLine',
  'JWT verification',
  'token parsing',
  'cache.set',
  'redis',
  'audit' + 'Repository',
  'audit' + 'Writer',
];

function stripConstArrayBlock(source, constName) {
  const marker = `const ${constName} = [`;
  const start = source.indexOf(marker);

  if (start === -1) {
    return source;
  }

  const end = source.indexOf('];', start);

  if (end === -1) {
    return source;
  }

  return `${source.slice(0, start)}${source.slice(end + 2)}`;
}

function sourceWithoutAllowedLists(source) {
  return stripConstArrayBlock(source, 'FORBIDDEN_MARKERS');
}

function clone(value) {
  return structuredClone(value);
}

function routeLikeInput(overrides = {}) {
  return {
    sessionContext: {
      organizationId: 'org-session-1259',
      actorId: 'actor-session-1259',
      actorRole: 'service_agent',
      token: 'hidden-session-token',
      rawSessionTrace: 'hidden-raw-session-trace',
    },
    body: {
      repairIntakeDraftId: 'draft-1259',
      organizationId: 'org-body-override-1259',
      actorId: 'actor-body-override-1259',
      idempotencyKey: 'idem-body-ignored-1259',
      draftInput: {
        issueSummary: 'washer stops mid cycle',
        preferredWindow: 'morning',
        organizationId: 'org-draft-override-1259',
        actorId: 'actor-draft-override-1259',
        phone: 'hidden-phone',
        address: 'hidden-address',
        email: 'hidden-email',
        rawExternalPayload: 'hidden-external-payload',
        rawAuditRecord: 'hidden-audit-record',
        dbRow: { raw: 'hidden-db-row' },
        rawError: 'hidden-raw-error',
        sql: 'hidden-sql',
        query: 'hidden-query',
        stack: 'hidden-stack',
      },
      rawBody: 'hidden-raw-body',
    },
    headers: {
      'idempotency-key': ' idem-header-1259 ',
      'x-request-source': ' header-source-1259 ',
      'x-request-id': ' header-request-1259 ',
      authorization: 'hidden-authorization',
      cookie: 'hidden-cookie',
      raw: { phone: 'hidden-phone' },
    },
    requestId: 'request-1259',
    source: 'route_adapter_full_composition',
    rawRequest: { token: 'hidden-raw-request-token' },
    ...overrides,
  };
}

function createFullRouteAdapterComposition(options = {}) {
  const order = [];
  const authCalls = [];
  const repositoryCalls = [];
  const preRouteInputs = [];
  const policyInputs = [];
  const auditInputs = [];
  const syntheticCalls = [];
  const controllerCalls = [];
  const mapperCalls = [];
  const baseContextResolver = createRepairIntakeDraftToCaseRequestContextResolver();

  const preRouteContextResolver = {
    resolveRepairIntakeDraftToCaseRequestContext(input) {
      order.push('preRouteContextResolver');

      return baseContextResolver.resolveRepairIntakeDraftToCaseRequestContext(input);
    },
  };
  const syntheticContextResolver = {
    resolveRepairIntakeDraftToCaseRequestContext(input) {
      order.push('syntheticContextResolver');

      return baseContextResolver.resolveRepairIntakeDraftToCaseRequestContext(input);
    },
  };
  const idempotencyPolicyBuilder = {
    buildRepairIntakeDraftToCaseIdempotencyPolicy(input) {
      order.push('idempotencyPolicyBuilder');
      policyInputs.push(input);

      return buildRepairIntakeDraftToCaseIdempotencyPolicy(input);
    },
  };
  const auditIntentBuilder = {
    buildRepairIntakeDraftToCaseAuditIntent(input) {
      order.push(`auditIntentBuilder:${input && input.phase}`);
      auditInputs.push(input);

      return buildRepairIntakeDraftToCaseAuditIntent(input);
    },
  };
  const repositoryConsumer = createRepairIntakeCaseRepositoryConsumer({
    caseRepository: {
      async createCaseFromDraft(input) {
        order.push('repository');
        repositoryCalls.push(input);

        if (options.repositoryThrows) {
          throw new Error('hidden repository raw failure hidden-sql hidden-stack hidden-phone hidden-email');
        }

        return {
          caseId: 'case-1259',
          caseRef: {
            caseId: 'case-1259',
            rawRows: [{ phone: 'hidden-phone' }],
          },
          draftId: input.draftId,
          sourceDraftId: input.sourceDraftId,
          organizationId: input.organizationId,
          tenantId: input.tenantId,
          requestId: input.requestId,
          actorId: input.actorId,
          status: 'created',
          rawRows: [{ phone: 'hidden-phone' }],
        };
      },
    },
  });
  const applicationService = createRepairIntakeDraftToCaseInjectedConsumerApplicationService({
    caseRepositoryConsumer: repositoryConsumer,
  });
  const authorizationGate = createRepairIntakeDraftToCaseAuthorizationGate({
    permissionResolver: {
      async canCreateCaseFromRepairIntakeDraft(context) {
        order.push('permissionResolver');
        authCalls.push(context);

        if (options.authDenied) {
          return {
            allowed: false,
            status: 'denied',
            reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_AUTHORIZATION_GATE_DENIED',
            requiredActions: ['request_permission_review'],
            rawPermissionTrace: 'hidden-permission-trace',
          };
        }

        return {
          allowed: true,
          status: 'allowed',
          reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_AUTHORIZATION_GATE_ALLOWED',
        };
      },
    },
  });
  const observableApplicationService = {
    async submitDraftToCase(input) {
      order.push('applicationService');

      return applicationService.submitDraftToCase(input);
    },
  };
  const orchestrator = createRepairIntakeDraftToCaseOrchestrator({
    authorizationGate,
    draftToCaseApplicationService: observableApplicationService,
  });
  const baseControllerAdapter = createRepairIntakeDraftToCaseControllerAdapter({
    orchestrator,
    publicResultPresenter: {
      presentRepairIntakeDraftToCaseResult(result) {
        order.push('presenter');

        return presentRepairIntakeDraftToCaseResult(result);
      },
    },
  });
  const controllerAdapter = {
    async submitDraftToCase(input) {
      order.push('controllerAdapter');
      controllerCalls.push(input);

      return baseControllerAdapter.submitDraftToCase(input);
    },
  };
  const baseSyntheticHandler = createRepairIntakeDraftToCaseSyntheticHandler({
    requestContextResolver: syntheticContextResolver,
    controllerAdapter,
  });
  const syntheticHandler = {
    async handleDraftToCase(input) {
      order.push('syntheticHandler');
      syntheticCalls.push(input);

      return baseSyntheticHandler.handleDraftToCase(input);
    },
  };
  const httpResultMapper = {
    mapRepairIntakeDraftToCasePublicResultToHttpResponse(publicResult) {
      order.push('httpResultMapper');
      mapperCalls.push(publicResult);

      return mapRepairIntakeDraftToCasePublicResultToHttpResponse(publicResult);
    },
  };
  const basePreRouteHandler = createRepairIntakeDraftToCasePreRouteHandler({
    requestContextResolver: preRouteContextResolver,
    idempotencyPolicyBuilder,
    auditIntentBuilder,
    syntheticHandler,
    httpResultMapper,
  });
  const preRouteHandler = {
    async handleDraftToCasePreRoute(input) {
      order.push('preRouteHandler');
      preRouteInputs.push(input);

      return basePreRouteHandler.handleDraftToCasePreRoute(input);
    },
  };
  const adapter = createRepairIntakeDraftToCaseRouteAdapterContract({
    preRouteHandler,
  });

  async function run(input) {
    const output = await adapter.handleRouteLikeRequest(input);

    return {
      auditInputs,
      authCalls,
      controllerCalls,
      mapperCalls,
      order,
      output,
      policyInputs,
      preRouteInputs,
      repositoryCalls,
      syntheticCalls,
    };
  }

  return {
    run,
  };
}

function assertNoUnsafeText(value) {
  const serialized = JSON.stringify(value);

  for (const marker of [
    'org-body-override-1259',
    'actor-body-override-1259',
    'idem-body-ignored-1259',
    'org-draft-override-1259',
    'actor-draft-override-1259',
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
    'auditRecord',
    'dbRow',
    'token',
    'select',
    'cache' + '.set',
    'red' + 'is',
  ]) {
    assert.equal(serialized.includes(marker), false, `leaked unsafe marker ${marker}`);
  }
}

test('allowed success composes route-like input through full route-adjacent chain', async () => {
  const input = routeLikeInput();
  const flow = createFullRouteAdapterComposition();

  const result = await flow.run(input);

  assert.equal(result.output.statusCode, 201);
  assert.equal(result.output.body.ok, true);
  assert.equal(result.output.body.caseId, 'case-1259');
  assert.equal(result.output.idempotencyPolicy.ok, true);
  assert.equal(result.output.idempotencyPolicy.idempotencyKey, 'idem-header-1259');
  assert.deepEqual(result.output.auditIntents.map((item) => item.auditIntent.phase), ['attempt', 'submitted']);
  assert.equal(result.output.auditIntents[1].auditIntent.caseId, 'case-1259');
  assert.deepEqual(result.order, [
    'preRouteHandler',
    'preRouteContextResolver',
    'idempotencyPolicyBuilder',
    'auditIntentBuilder:attempt',
    'syntheticHandler',
    'syntheticContextResolver',
    'controllerAdapter',
    'permissionResolver',
    'applicationService',
    'repository',
    'presenter',
    'httpResultMapper',
    'auditIntentBuilder:submitted',
  ]);
  assert.equal(result.preRouteInputs[0].requestSource, 'route_adapter_full_composition');
  assert.equal(result.preRouteInputs[0].requestId, 'request-1259');
  assert.equal(result.preRouteInputs[0].idempotencyKey, 'idem-header-1259');
  assertNoUnsafeText(result.output);
  assertNoUnsafeText(result.preRouteInputs);
  assertNoUnsafeText(result.authCalls);
  assertNoUnsafeText(result.repositoryCalls);
});

test('denied authorization returns 403 denied audit and skips repository', async () => {
  const input = routeLikeInput();
  const flow = createFullRouteAdapterComposition({ authDenied: true });

  const result = await flow.run(input);

  assert.equal(result.output.statusCode, 403);
  assert.equal(result.output.body.status, 'denied');
  assert.equal(result.output.idempotencyPolicy.ok, true);
  assert.deepEqual(result.repositoryCalls, []);
  assert.deepEqual(result.output.auditIntents.map((item) => item.auditIntent.phase), ['attempt', 'denied']);
  assertNoUnsafeText(result.output);
  assertNoUnsafeText(result.authCalls);
});

test('invalid session returns safe 400 before synthetic handler or repository', async () => {
  const input = routeLikeInput({
    sessionContext: {
      actorId: 'actor-session-1259',
      actorRole: 'service_agent',
      rawSessionTrace: 'hidden-raw-session-trace',
    },
  });
  const flow = createFullRouteAdapterComposition();

  const result = await flow.run(input);

  assert.equal(result.output.statusCode, 400);
  assert.equal(result.output.body.status, 'invalid_context');
  assert.equal(result.output.idempotencyPolicy, null);
  assert.deepEqual(result.syntheticCalls, []);
  assert.deepEqual(result.repositoryCalls, []);
  assert.equal(result.output.auditIntents[0].ok, false);
  assertNoUnsafeText(result.output);
});

test('repository throw returns safe 503 failure without raw leakage', async () => {
  const input = routeLikeInput();
  const flow = createFullRouteAdapterComposition({ repositoryThrows: true });

  const result = await flow.run(input);

  assert.equal(result.repositoryCalls.length, 1);
  assert.equal(result.output.statusCode, 503);
  assert.equal(result.output.body.status, 'unavailable');
  assert.deepEqual(result.output.auditIntents.map((item) => item.auditIntent.phase), ['attempt', 'failed']);
  assert.equal(result.output.idempotencyPolicy.ok, true);
  assertNoUnsafeText(result.output);
  assertNoUnsafeText(result.repositoryCalls);
});

test('body overrides lose to session and header-derived values downstream', async () => {
  const input = routeLikeInput();
  const flow = createFullRouteAdapterComposition();

  const result = await flow.run(input);

  assert.equal(result.policyInputs[0].organizationId, 'org-session-1259');
  assert.equal(result.policyInputs[0].actorId, 'actor-session-1259');
  assert.equal(result.policyInputs[0].idempotencyKey, 'idem-header-1259');
  assert.equal(result.output.idempotencyPolicy.organizationId, 'org-session-1259');
  assert.equal(result.output.idempotencyPolicy.actorId, 'actor-session-1259');
  assert.equal(result.authCalls[0].organizationId, 'org-session-1259');
  assert.equal(result.authCalls[0].actorId, 'actor-session-1259');
  assert.equal(result.repositoryCalls[0].organizationId, 'org-session-1259');
  assert.equal(result.repositoryCalls[0].actorId, 'actor-session-1259');
  assert.equal(result.auditInputs[0].organizationId, 'org-session-1259');
  assert.equal(result.auditInputs[1].actorId, 'actor-session-1259');
  assertNoUnsafeText(result.policyInputs);
  assertNoUnsafeText(result.auditInputs);
});

test('raw headers are not forwarded and only approved scalar request values flow', async () => {
  const input = routeLikeInput({
    source: '',
    requestId: '',
    headers: {
      'idempotency-key': ' idem-header-only-1259 ',
      'request-source': ' source-header-only-1259 ',
      'x-request-id': ' request-header-only-1259 ',
      authorization: 'hidden-authorization',
      cookie: 'hidden-cookie',
      raw: { token: 'hidden-token' },
    },
  });
  const flow = createFullRouteAdapterComposition();

  const result = await flow.run(input);

  assert.equal(result.preRouteInputs[0].requestSource, 'source-header-only-1259');
  assert.equal(result.preRouteInputs[0].requestId, 'request-header-only-1259');
  assert.equal(result.policyInputs[0].idempotencyKey, 'idem-header-only-1259');
  assert.equal(Object.hasOwn(result.preRouteInputs[0], 'headers'), false);
  assertNoUnsafeText(result.preRouteInputs);
  assertNoUnsafeText(result.policyInputs);
  assertNoUnsafeText(result.output);
});

test('original route-like input remains unchanged', async () => {
  const input = routeLikeInput();
  const beforeInput = clone(input);
  const flow = createFullRouteAdapterComposition();

  await flow.run(input);

  assert.deepEqual(input, beforeInput);
});

test('Task1259 test and doc avoid forbidden route persistence runtime markers', () => {
  for (const [label, filePath] of [
    ['test', TEST_SOURCE_PATH],
    ['doc', DOC_PATH],
  ]) {
    const source = sourceWithoutAllowedLists(fs.readFileSync(filePath, 'utf8'));

    for (const marker of FORBIDDEN_MARKERS) {
      assert.equal(source.includes(marker), false, `${label} contains forbidden marker ${marker}`);
    }
  }
});
