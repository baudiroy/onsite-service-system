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
  createRepairIntakeDraftToCaseRouteHandler,
} = require('../../src/repairIntake/repairIntakeDraftToCaseRouteHandlerFactory');
const {
  createRepairIntakeDraftToCaseSyntheticHandler,
} = require('../../src/repairIntake/repairIntakeDraftToCaseSyntheticHandler');

const TEST_SOURCE_PATH = __filename;
const DOC_PATH = path.resolve(
  __dirname,
  '../../docs/task-1265-repair-intake-draft-to-case-route-handler-full-composition-integration-no-app-mount-no-server.md',
);
const DECISION_ROUTE = 'POST /internal/repair-intake/drafts/:repairIntakeDraftId/submit-to-case';

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
  return stripConstArrayBlock(source, 'FORBIDDEN_MARKERS')
    .replaceAll(DECISION_ROUTE, 'TASK1261_DECISION_ROUTE');
}

function clone(value) {
  return structuredClone(value);
}

function futureRouterInput(overrides = {}) {
  return {
    sessionContext: {
      organizationId: 'org-session-1265',
      actorId: 'actor-session-1265',
      actorRole: 'service_agent',
      token: 'hidden-session-token',
      rawSessionTrace: 'hidden-raw-session-trace',
    },
    params: {
      repairIntakeDraftId: 'draft-path-1265',
      rawParams: 'hidden-raw-params',
    },
    body: {
      repairIntakeDraftId: 'draft-body-ignored-1265',
      organizationId: 'org-body-override-1265',
      actorId: 'actor-body-override-1265',
      idempotencyKey: 'idem-body-ignored-1265',
      draftInput: {
        issueSummary: 'dryer stops after heating',
        preferredWindow: 'afternoon',
        rawFrameworkObject: 'hidden-raw-framework-object',
        phone: 'hidden-phone',
        address: 'hidden-address',
        email: 'hidden-email',
      },
      rawBody: 'hidden-raw-body',
    },
    headers: {
      'idempotency-key': ' idem-header-1265 ',
      'x-request-id': ' header-request-1265 ',
      'x-request-source': ' header-source-1265 ',
      authorization: 'hidden-authorization',
      cookie: 'hidden-cookie',
      raw: { token: 'hidden-token' },
    },
    requestId: 'request-1265',
    source: 'route_handler_full_composition',
    req: { token: 'hidden-req-token' },
    res: { token: 'hidden-res-token' },
    next: 'hidden-next',
    router: { raw: 'hidden-router' },
    rawRequest: { token: 'hidden-raw-request-token' },
    ...overrides,
  };
}

function createFullRouteHandlerComposition(options = {}) {
  const order = [];
  const authCalls = [];
  const repositoryCalls = [];
  const routeHandlerInputs = [];
  const routeAdapterInputs = [];
  const preRouteInputs = [];
  const policyInputs = [];
  const auditInputs = [];
  const syntheticCalls = [];
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
          caseId: 'case-1265',
          caseRef: {
            caseId: 'case-1265',
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
  const controllerAdapter = createRepairIntakeDraftToCaseControllerAdapter({
    orchestrator,
    publicResultPresenter: {
      presentRepairIntakeDraftToCaseResult(result) {
        order.push('presenter');

        return presentRepairIntakeDraftToCaseResult(result);
      },
    },
  });
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
  const baseRouteAdapter = createRepairIntakeDraftToCaseRouteAdapterContract({
    preRouteHandler,
  });
  const routeAdapter = {
    async handleRouteLikeRequest(input) {
      order.push('routeAdapter');
      routeAdapterInputs.push(input);

      return baseRouteAdapter.handleRouteLikeRequest(input);
    },
  };
  const baseRouteHandler = createRepairIntakeDraftToCaseRouteHandler({
    routeAdapter,
  });
  const routeHandler = {
    async handle(input) {
      order.push('routeHandler');
      routeHandlerInputs.push(input);

      return baseRouteHandler.handle(input);
    },
  };

  async function run(input) {
    const output = await routeHandler.handle(input);

    return {
      auditInputs,
      authCalls,
      order,
      output,
      policyInputs,
      preRouteInputs,
      repositoryCalls,
      routeAdapterInputs,
      routeHandlerInputs,
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
    'draft-body-ignored-1265',
    'org-body-override-1265',
    'actor-body-override-1265',
    'idem-body-ignored-1265',
    'hidden',
    'rawRows',
    'raw',
    'authorization',
    'cookie',
    'phone',
    'address',
    'email',
    'query',
    'stack',
    'token',
    'hidden-req-token',
    'hidden-res-token',
    'hidden-next',
    'hidden-router',
    'cache' + '.set',
    'red' + 'is',
  ]) {
    assert.equal(serialized.includes(marker), false, `leaked unsafe marker ${marker}`);
  }
}

test('allowed success composes future-router-shaped input through full route-handler chain', async () => {
  const input = futureRouterInput();
  const flow = createFullRouteHandlerComposition();

  const result = await flow.run(input);

  assert.equal(result.output.statusCode, 201);
  assert.equal(result.output.body.ok, true);
  assert.equal(result.output.body.caseId, 'case-1265');
  assert.equal(result.output.body.repairIntakeDraftId, 'draft-path-1265');
  assert.equal(result.output.idempotencyPolicy.ok, true);
  assert.equal(result.output.idempotencyPolicy.idempotencyKey, 'idem-header-1265');
  assert.equal(result.output.idempotencyPolicy.repairIntakeDraftId, 'draft-path-1265');
  assert.deepEqual(result.output.auditIntents.map((item) => item.auditIntent.phase), ['attempt', 'submitted']);
  assert.equal(result.output.auditIntents[1].auditIntent.repairIntakeDraftId, 'draft-path-1265');
  assert.equal(result.routeAdapterInputs[0].body.repairIntakeDraftId, 'draft-path-1265');
  assert.equal(result.preRouteInputs[0].requestBody.repairIntakeDraftId, 'draft-path-1265');
  assertNoUnsafeText(result.output);
  assertNoUnsafeText(result.routeAdapterInputs);
  assertNoUnsafeText(result.preRouteInputs);
});

test('path draft id wins over body draft id throughout downstream calls', async () => {
  const input = futureRouterInput({
    params: {
      repairIntakeDraftId: 'draft-path-wins-1265',
    },
    body: {
      repairIntakeDraftId: 'draft-body-loses-1265',
      organizationId: 'org-body-override-1265',
      actorId: 'actor-body-override-1265',
      idempotencyKey: 'idem-body-ignored-1265',
      draftInput: {
        issueSummary: 'safe issue',
      },
    },
  });
  const flow = createFullRouteHandlerComposition();

  const result = await flow.run(input);

  assert.equal(result.routeAdapterInputs[0].body.repairIntakeDraftId, 'draft-path-wins-1265');
  assert.equal(result.policyInputs[0].repairIntakeDraftId, 'draft-path-wins-1265');
  assert.equal(result.authCalls[0].repairIntakeDraftId, 'draft-path-wins-1265');
  assert.equal(result.repositoryCalls[0].draftId, 'draft-path-wins-1265');
  assert.equal(result.auditInputs[0].repairIntakeDraftId, 'draft-path-wins-1265');
  assert.equal(result.auditInputs[1].repairIntakeDraftId, 'draft-path-wins-1265');
  assert.equal(
    JSON.stringify([
      result.routeAdapterInputs,
      result.preRouteInputs,
      result.policyInputs,
      result.authCalls,
      result.repositoryCalls,
      result.auditInputs,
      result.output,
    ]).includes('draft-body-loses-1265'),
    false,
  );
});

test('denied authorization returns 403 denied audit and skips repository', async () => {
  const input = futureRouterInput();
  const flow = createFullRouteHandlerComposition({ authDenied: true });

  const result = await flow.run(input);

  assert.equal(result.output.statusCode, 403);
  assert.equal(result.output.body.status, 'denied');
  assert.deepEqual(result.repositoryCalls, []);
  assert.deepEqual(result.output.auditIntents.map((item) => item.auditIntent.phase), ['attempt', 'denied']);
  assertNoUnsafeText(result.output);
  assertNoUnsafeText(result.authCalls);
});

test('missing path draft id returns safe 400 before adapter synthetic handler or repository', async () => {
  const input = futureRouterInput({
    params: {},
  });
  const flow = createFullRouteHandlerComposition();

  const result = await flow.run(input);

  assert.equal(result.output.statusCode, 400);
  assert.equal(result.output.body.status, 'invalid_request');
  assert.deepEqual(result.routeAdapterInputs, []);
  assert.deepEqual(result.syntheticCalls, []);
  assert.deepEqual(result.repositoryCalls, []);
  assertNoUnsafeText(result.output);
});

test('repository throw returns safe 503 without raw leakage', async () => {
  const input = futureRouterInput();
  const flow = createFullRouteHandlerComposition({ repositoryThrows: true });

  const result = await flow.run(input);

  assert.equal(result.repositoryCalls.length, 1);
  assert.equal(result.output.statusCode, 503);
  assert.equal(result.output.body.status, 'unavailable');
  assert.deepEqual(result.output.auditIntents.map((item) => item.auditIntent.phase), ['attempt', 'failed']);
  assertNoUnsafeText(result.output);
});

test('body organization actor and idempotency overrides lose to safe values', async () => {
  const input = futureRouterInput();
  const flow = createFullRouteHandlerComposition();

  const result = await flow.run(input);

  assert.equal(result.policyInputs[0].organizationId, 'org-session-1265');
  assert.equal(result.policyInputs[0].actorId, 'actor-session-1265');
  assert.equal(result.policyInputs[0].idempotencyKey, 'idem-header-1265');
  assert.equal(result.authCalls[0].organizationId, 'org-session-1265');
  assert.equal(result.authCalls[0].actorId, 'actor-session-1265');
  assert.equal(result.repositoryCalls[0].organizationId, 'org-session-1265');
  assert.equal(result.repositoryCalls[0].actorId, 'actor-session-1265');
  assert.equal(result.auditInputs[0].organizationId, 'org-session-1265');
  assert.equal(result.auditInputs[1].actorId, 'actor-session-1265');
  assertNoUnsafeText(result.policyInputs);
  assertNoUnsafeText(result.auditInputs);
});

test('fake framework objects and unsafe raw fields are not forwarded or leaked', async () => {
  const input = futureRouterInput();
  const flow = createFullRouteHandlerComposition();

  const result = await flow.run(input);

  assert.equal(JSON.stringify(result.routeAdapterInputs).includes('hidden-req-token'), false);
  assert.equal(JSON.stringify(result.routeAdapterInputs).includes('hidden-router'), false);
  assertNoUnsafeText(result.routeAdapterInputs);
  assertNoUnsafeText(result.output);
});

test('original future-router-shaped input remains unchanged', async () => {
  const input = futureRouterInput();
  const beforeInput = clone(input);
  const flow = createFullRouteHandlerComposition();

  await flow.run(input);

  assert.deepEqual(input, beforeInput);
});

test('Task1265 test and doc avoid forbidden route persistence runtime markers', () => {
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
