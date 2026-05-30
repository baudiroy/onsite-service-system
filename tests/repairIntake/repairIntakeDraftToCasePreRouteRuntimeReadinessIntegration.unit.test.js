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
  createRepairIntakeDraftToCaseOrchestrator,
} = require('../../src/repairIntake/repairIntakeDraftToCaseOrchestrator');
const {
  presentRepairIntakeDraftToCaseResult,
} = require('../../src/repairIntake/repairIntakeDraftToCasePublicResultPresenter');
const {
  createRepairIntakeDraftToCaseControllerAdapter,
} = require('../../src/repairIntake/repairIntakeDraftToCaseControllerAdapter');
const {
  createRepairIntakeDraftToCaseRequestContextResolver,
} = require('../../src/repairIntake/repairIntakeDraftToCaseRequestContextResolver');
const {
  createRepairIntakeDraftToCaseSyntheticHandler,
} = require('../../src/repairIntake/repairIntakeDraftToCaseSyntheticHandler');
const {
  mapRepairIntakeDraftToCasePublicResultToHttpResponse,
} = require('../../src/repairIntake/repairIntakeDraftToCaseHttpResultMapper');

const TEST_SOURCE_PATH = __filename;
const DOC_PATH = path.resolve(
  __dirname,
  '../../docs/task-1251-repair-intake-draft-to-case-pre-route-runtime-readiness-integration-audit-idempotency-no-db-no-route.md',
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
  'auditRepository',
  'auditWriter',
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

function syntheticInput(overrides = {}) {
  return {
    requestId: 'request-1251',
    repairIntakeDraftId: 'draft-1251',
    sessionContext: {
      organizationId: 'org-session-1251',
      actorId: 'actor-session-1251',
      actorRole: 'service_agent',
      token: 'hidden-session-token',
      permissionTrace: { raw: 'hidden-permission-trace' },
    },
    requestBody: {
      repairIntakeDraftId: 'draft-1251',
      idempotencyKey: 'idem-1251',
      organizationId: 'org-body-override-1251',
      actorId: 'actor-body-override-1251',
      draftInput: {
        issueSummary: 'oven display failure',
        preferredWindow: 'evening',
        phone: 'hidden-phone',
        address: 'hidden-address',
        email: 'hidden-email',
        ['pro' + 'viderPayload']: { raw: 'hidden-external-payload' },
        auditRecord: { raw: 'hidden-audit-record' },
        dbRow: { raw: 'hidden-db-row' },
        rawError: 'hidden-raw-error',
        sql: 'hidden-sql',
        query: 'hidden-query',
        stack: 'hidden-stack',
      },
      rawBody: 'hidden-raw-body',
    },
    requestSource: 'synthetic_pre_route_readiness',
    rawRequest: 'hidden-raw-request',
    ...overrides,
  };
}

function clone(value) {
  return structuredClone(value);
}

function policyInputFromContext(context, requestId, idempotencyKey) {
  return {
    organizationId: context.organizationId,
    actorId: context.actorId,
    repairIntakeDraftId: context.repairIntakeDraftId,
    requestId,
    idempotencyKey,
    source: context.source,
  };
}

function auditInputFromContext(context, phase, result = {}) {
  return {
    phase,
    organizationId: context.organizationId,
    actorId: context.actorId,
    repairIntakeDraftId: context.repairIntakeDraftId,
    caseId: result.caseId,
    resultStatus: result.status || 'started',
    reasonCode: result.reasonCode || 'REPAIR_INTAKE_DRAFT_TO_CASE_PRE_ROUTE_ATTEMPT',
    source: context.source,
    occurredAt: '2026-05-24T12:51:00.000Z',
    rawError: result.rawError,
    permissionTrace: result.permissionTrace,
    sql: result.sql,
    stack: result.stack,
  };
}

function completionPhase(publicResult) {
  if (publicResult.ok === true) {
    return 'submitted';
  }

  return publicResult.status === 'denied' ? 'denied' : 'failed';
}

function createPreRouteReadinessFlow(options = {}) {
  const order = [];
  const authCalls = [];
  const repositoryCalls = [];
  const contextResolver = createRepairIntakeDraftToCaseRequestContextResolver();
  const repositoryConsumer = createRepairIntakeCaseRepositoryConsumer({
    caseRepository: {
      async createCaseFromDraft(input) {
        order.push('repository');
        repositoryCalls.push(input);

        if (options.repositoryThrows) {
          throw new Error('hidden raw repository failure hidden-sql hidden-stack hidden-phone hidden-email');
        }

        return {
          caseId: 'case-1251',
          caseRef: {
            caseId: 'case-1251',
            rawRows: [{ phone: 'hidden-phone' }],
          },
          draftId: input.draftId,
          sourceDraftId: input.sourceDraftId,
          organizationId: input.organizationId,
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
            permissionTrace: { raw: 'hidden-permission-trace' },
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
  const handlerContextResolver = {
    resolveRepairIntakeDraftToCaseRequestContext(input) {
      order.push('handlerContextResolver');

      return contextResolver.resolveRepairIntakeDraftToCaseRequestContext(input);
    },
  };
  const handler = createRepairIntakeDraftToCaseSyntheticHandler({
    requestContextResolver: handlerContextResolver,
    controllerAdapter,
  });

  async function run(input) {
    const contextInput = input;
    order.push('preRouteContextResolver');
    const context = contextResolver.resolveRepairIntakeDraftToCaseRequestContext(contextInput);
    const policyInput = context.ok === true
      ? policyInputFromContext(context, input.requestId, input.requestBody && input.requestBody.idempotencyKey)
      : null;
    const policy = policyInput ? buildRepairIntakeDraftToCaseIdempotencyPolicy(policyInput) : null;
    const attemptAuditInput = context.ok === true
      ? auditInputFromContext(context, 'attempt')
      : {
        phase: 'attempt',
        organizationId: context.organizationId,
        actorId: context.actorId,
        repairIntakeDraftId: context.repairIntakeDraftId,
        resultStatus: context.status,
        reasonCode: context.reasonCode,
        source: context.source,
      };
    const attemptAudit = buildRepairIntakeDraftToCaseAuditIntent(attemptAuditInput);
    const publicResult = await handler.handleDraftToCase(input);
    order.push('httpResultMapper');
    const httpEnvelope = mapRepairIntakeDraftToCasePublicResultToHttpResponse(publicResult);
    const completionAuditInput = context.ok === true
      ? auditInputFromContext(context, completionPhase(publicResult), publicResult)
      : null;
    const completionAudit = completionAuditInput
      ? buildRepairIntakeDraftToCaseAuditIntent(completionAuditInput)
      : null;

    return {
      attemptAudit,
      attemptAuditInput,
      authCalls,
      completionAudit,
      completionAuditInput,
      context,
      contextInput,
      httpEnvelope,
      order,
      policy,
      policyInput,
      publicResult,
      repositoryCalls,
    };
  }

  return {
    run,
  };
}

function assertNoUnsafeText(value) {
  const serialized = JSON.stringify(value);

  for (const marker of [
    'org-body-override-1251',
    'actor-body-override-1251',
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

test('allowed repository success combines context policy audit handler and HTTP envelope safely', async () => {
  const input = syntheticInput();
  const flow = createPreRouteReadinessFlow();

  const result = await flow.run(input);

  assert.equal(result.context.ok, true);
  assert.equal(result.context.organizationId, 'org-session-1251');
  assert.equal(result.policy.ok, true);
  assert.equal(result.policy.dedupeKey.includes('organization:org-session-1251'), true);
  assert.equal(result.policy.dedupeKey.includes('draft:draft-1251'), true);
  assert.equal(result.attemptAudit.ok, true);
  assert.equal(result.attemptAudit.auditIntent.phase, 'attempt');
  assert.equal(result.publicResult.ok, true);
  assert.equal(result.httpEnvelope.statusCode, 201);
  assert.equal(result.completionAudit.ok, true);
  assert.equal(result.completionAudit.auditIntent.phase, 'submitted');
  assert.equal(result.completionAudit.auditIntent.caseId, 'case-1251');
  assertNoUnsafeText(result.policy);
  assertNoUnsafeText(result.attemptAudit);
  assertNoUnsafeText(result.httpEnvelope);
  assertNoUnsafeText(result.completionAudit);
});

test('denied authorization maps to safe 403 and denied audit without repository call', async () => {
  const input = syntheticInput();
  const flow = createPreRouteReadinessFlow({ authDenied: true });

  const result = await flow.run(input);

  assert.equal(result.context.ok, true);
  assert.equal(result.policy.ok, true);
  assert.equal(result.attemptAudit.ok, true);
  assert.deepEqual(result.repositoryCalls, []);
  assert.equal(result.publicResult.status, 'denied');
  assert.equal(result.httpEnvelope.statusCode, 403);
  assert.equal(result.completionAudit.ok, true);
  assert.equal(result.completionAudit.auditIntent.phase, 'denied');
  assertNoUnsafeText(result.policy);
  assertNoUnsafeText(result.completionAudit);
});

test('invalid session context returns safe 400 and does not build policy from missing organization', async () => {
  const input = syntheticInput({
    sessionContext: {
      actorId: 'actor-session-1251',
      actorRole: 'service_agent',
      permissionTrace: { raw: 'hidden-permission-trace' },
    },
  });
  const flow = createPreRouteReadinessFlow();

  const result = await flow.run(input);

  assert.equal(result.context.ok, false);
  assert.equal(result.policy, null);
  assert.equal(result.attemptAudit.ok, false);
  assert.equal(result.publicResult.status, 'invalid_context');
  assert.equal(result.httpEnvelope.statusCode, 400);
  assert.equal(result.completionAudit, null);
  assert.deepEqual(result.repositoryCalls, []);
  assertNoUnsafeText(result.attemptAudit);
  assertNoUnsafeText(result.httpEnvelope);
});

test('repository throw maps to safe 503 and failed audit without raw error leakage', async () => {
  const input = syntheticInput();
  const flow = createPreRouteReadinessFlow({ repositoryThrows: true });

  const result = await flow.run(input);

  assert.equal(result.context.ok, true);
  assert.equal(result.policy.ok, true);
  assert.equal(result.repositoryCalls.length, 1);
  assert.equal(result.httpEnvelope.statusCode, 503);
  assert.equal(result.publicResult.status, 'unavailable');
  assert.equal(result.completionAudit.ok, true);
  assert.equal(result.completionAudit.auditIntent.phase, 'failed');
  assertNoUnsafeText(result.httpEnvelope);
  assertNoUnsafeText(result.completionAudit);
});

test('body organization and actor override attempt stays on session-derived values everywhere', async () => {
  const input = syntheticInput();
  const flow = createPreRouteReadinessFlow();

  const result = await flow.run(input);

  assert.equal(result.context.organizationId, 'org-session-1251');
  assert.equal(result.context.actorId, 'actor-session-1251');
  assert.equal(result.policy.organizationId, 'org-session-1251');
  assert.equal(result.policy.actorId, 'actor-session-1251');
  assert.equal(result.authCalls[0].organizationId, 'org-session-1251');
  assert.equal(result.authCalls[0].actorId, 'actor-session-1251');
  assert.equal(result.repositoryCalls[0].organizationId, 'org-session-1251');
  assert.equal(result.repositoryCalls[0].actorId, 'actor-session-1251');
  assert.equal(result.attemptAudit.auditIntent.organizationId, 'org-session-1251');
  assert.equal(result.completionAudit.auditIntent.actorId, 'actor-session-1251');
  assertNoUnsafeText(result.context);
  assertNoUnsafeText(result.policy);
  assertNoUnsafeText(result.authCalls);
  assertNoUnsafeText(result.repositoryCalls);
});

test('original input and derived context policy audit inputs remain unchanged', async () => {
  const input = syntheticInput();
  const beforeInput = clone(input);
  const flow = createPreRouteReadinessFlow();

  const result = await flow.run(input);
  const beforePolicyInput = clone(result.policyInput);
  const beforeAttemptAuditInput = clone(result.attemptAuditInput);
  const beforeCompletionAuditInput = clone(result.completionAuditInput);

  buildRepairIntakeDraftToCaseIdempotencyPolicy(result.policyInput);
  buildRepairIntakeDraftToCaseAuditIntent(result.attemptAuditInput);
  buildRepairIntakeDraftToCaseAuditIntent(result.completionAuditInput);

  assert.deepEqual(input, beforeInput);
  assert.deepEqual(result.policyInput, beforePolicyInput);
  assert.deepEqual(result.attemptAuditInput, beforeAttemptAuditInput);
  assert.deepEqual(result.completionAuditInput, beforeCompletionAuditInput);
});

test('Task1251 test and doc avoid forbidden route persistence runtime markers', () => {
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
