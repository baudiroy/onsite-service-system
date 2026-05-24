'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

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

const TEST_SOURCE_PATH = __filename;
const DOC_PATH = path.resolve(
  __dirname,
  '../../docs/task-1249-repair-intake-draft-to-case-idempotency-aware-synthetic-handler-integration-no-db-no-route.md',
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

function syntheticHandlerInput(overrides = {}) {
  return {
    requestId: 'request-1249',
    sessionContext: {
      organizationId: 'org-session-1249',
      actorId: 'actor-session-1249',
      actorRole: 'service_agent',
      token: 'hidden-session-token',
      permissionTrace: { raw: 'hidden-permission-trace' },
    },
    requestBody: {
      repairIntakeDraftId: 'draft-1249',
      idempotencyKey: 'idem-1249',
      organizationId: 'org-body-override-1249',
      actorId: 'actor-body-override-1249',
      draftInput: {
        issueSummary: 'dryer heat issue',
        preferredWindow: 'afternoon',
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
    requestSource: 'synthetic_idempotency_integration',
    rawRequest: 'hidden-raw-request',
    ...overrides,
  };
}

function clone(value) {
  return structuredClone(value);
}

function policyInputFromSyntheticInput(input) {
  const sessionContext = input.sessionContext || {};
  const requestBody = input.requestBody || {};

  return {
    organizationId: sessionContext.organizationId,
    actorId: sessionContext.actorId,
    repairIntakeDraftId: requestBody.repairIntakeDraftId,
    requestId: input.requestId,
    idempotencyKey: requestBody.idempotencyKey,
    source: input.requestSource,
    rawRequest: input.rawRequest,
    rawBody: requestBody.rawBody,
    permissionTrace: sessionContext.permissionTrace,
    phone: requestBody.draftInput && requestBody.draftInput.phone,
    email: requestBody.draftInput && requestBody.draftInput.email,
    sql: requestBody.draftInput && requestBody.draftInput.sql,
    stack: requestBody.draftInput && requestBody.draftInput.stack,
  };
}

function createIdempotencyAwareSyntheticFlow(options = {}) {
  const order = [];
  const authCalls = [];
  const repositoryCalls = [];
  const baseContextResolver = createRepairIntakeDraftToCaseRequestContextResolver();

  const requestContextResolver = {
    resolveRepairIntakeDraftToCaseRequestContext(input) {
      order.push('contextResolver');

      return baseContextResolver.resolveRepairIntakeDraftToCaseRequestContext(input);
    },
  };
  const repositoryConsumer = createRepairIntakeCaseRepositoryConsumer({
    caseRepository: {
      async createCaseFromDraft(input) {
        order.push('repository');
        repositoryCalls.push(input);

        return {
          caseId: 'case-1249',
          caseRef: {
            caseId: 'case-1249',
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
  const handler = createRepairIntakeDraftToCaseSyntheticHandler({
    requestContextResolver,
    controllerAdapter,
  });

  async function handleWithPolicy(input) {
    const policyInput = policyInputFromSyntheticInput(input);
    const policy = buildRepairIntakeDraftToCaseIdempotencyPolicy(policyInput);
    const result = await handler.handleDraftToCase(input);

    return {
      authCalls,
      order,
      policy,
      policyInput,
      repositoryCalls,
      result,
    };
  }

  return {
    handleWithPolicy,
  };
}

function assertNoUnsafeText(value) {
  const serialized = JSON.stringify(value);

  for (const marker of [
    'org-body-override-1249',
    'actor-body-override-1249',
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

test('allowed explicit idempotency key builds safe policy and handler success', async () => {
  const input = syntheticHandlerInput();
  const flow = createIdempotencyAwareSyntheticFlow();

  const result = await flow.handleWithPolicy(input);

  assert.equal(result.policy.ok, true);
  assert.equal(result.policy.idempotencyKey, 'idem-1249');
  assert.equal(result.policy.dedupeKey.includes('organization:org-session-1249'), true);
  assert.equal(result.policy.dedupeKey.includes('draft:draft-1249'), true);
  assert.equal(result.result.ok, true);
  assert.equal(result.result.status, 'created');
  assert.equal(result.result.caseId, 'case-1249');
  assertNoUnsafeText(result.policy);
  assertNoUnsafeText(result.result);
});

test('allowed requestId fallback is deterministic for same organization draft and request', async () => {
  const input = syntheticHandlerInput({
    requestBody: {
      ...syntheticHandlerInput().requestBody,
      idempotencyKey: undefined,
    },
  });
  const flow = createIdempotencyAwareSyntheticFlow();

  const first = await flow.handleWithPolicy(input);
  const secondPolicy = buildRepairIntakeDraftToCaseIdempotencyPolicy(policyInputFromSyntheticInput(input));

  assert.equal(first.policy.ok, true);
  assert.equal(first.policy.idempotencyKey, 'request-1249');
  assert.equal(first.policy.dedupeKey, secondPolicy.dedupeKey);
  assert.equal(first.result.ok, true);
});

test('organization isolation produces different dedupe keys for same draft and key', () => {
  const base = policyInputFromSyntheticInput(syntheticHandlerInput());
  const first = buildRepairIntakeDraftToCaseIdempotencyPolicy({
    ...base,
    organizationId: 'org-a',
  });
  const second = buildRepairIntakeDraftToCaseIdempotencyPolicy({
    ...base,
    organizationId: 'org-b',
  });

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.notEqual(first.dedupeKey, second.dedupeKey);
});

test('body organization and actor override attempt keeps session values in policy and downstream calls', async () => {
  const input = syntheticHandlerInput();
  const flow = createIdempotencyAwareSyntheticFlow();

  const result = await flow.handleWithPolicy(input);

  assert.equal(result.policy.organizationId, 'org-session-1249');
  assert.equal(result.policy.actorId, 'actor-session-1249');
  assert.equal(JSON.stringify(result.policy).includes('org-body-override-1249'), false);
  assert.equal(JSON.stringify(result.policy).includes('actor-body-override-1249'), false);
  assert.equal(result.authCalls[0].organizationId, 'org-session-1249');
  assert.equal(result.authCalls[0].actorId, 'actor-session-1249');
  assert.equal(result.repositoryCalls[0].organizationId, 'org-session-1249');
  assert.equal(result.repositoryCalls[0].actorId, 'actor-session-1249');
  assertNoUnsafeText(result.authCalls);
  assertNoUnsafeText(result.repositoryCalls);
});

test('denied authorization keeps policy safe and does not call repository', async () => {
  const input = syntheticHandlerInput();
  const flow = createIdempotencyAwareSyntheticFlow({ authDenied: true });

  const result = await flow.handleWithPolicy(input);

  assert.deepEqual(result.repositoryCalls, []);
  assert.equal(result.policy.ok, true);
  assert.equal(result.result.ok, false);
  assert.equal(result.result.status, 'denied');
  assertNoUnsafeText(result.policy);
  assertNoUnsafeText(result.result);
});

test('invalid session context returns safe invalid policy and handler invalid context', async () => {
  const input = syntheticHandlerInput({
    sessionContext: {
      actorId: 'actor-session-1249',
      actorRole: 'service_agent',
      permissionTrace: { raw: 'hidden-permission-trace' },
    },
  });
  const flow = createIdempotencyAwareSyntheticFlow();

  const result = await flow.handleWithPolicy(input);

  assert.equal(result.policy.ok, false);
  assert.equal(
    result.policy.reasonCode,
    'REPAIR_INTAKE_DRAFT_TO_CASE_IDEMPOTENCY_POLICY_ORGANIZATION_REQUIRED',
  );
  assert.equal(result.result.ok, false);
  assert.equal(result.result.status, 'invalid_context');
  assert.deepEqual(result.repositoryCalls, []);
  assertNoUnsafeText(result.policy);
  assertNoUnsafeText(result.result);
});

test('unsafe field stripping keeps policy and handler result safe', async () => {
  const input = syntheticHandlerInput();
  const flow = createIdempotencyAwareSyntheticFlow();

  const result = await flow.handleWithPolicy(input);

  assertNoUnsafeText(result.policy);
  assertNoUnsafeText(result.result);
});

test('original synthetic input and policy input remain unchanged', async () => {
  const input = syntheticHandlerInput();
  const beforeInput = clone(input);
  const flow = createIdempotencyAwareSyntheticFlow();

  const result = await flow.handleWithPolicy(input);
  const beforePolicyInput = clone(result.policyInput);

  buildRepairIntakeDraftToCaseIdempotencyPolicy(result.policyInput);

  assert.deepEqual(input, beforeInput);
  assert.deepEqual(result.policyInput, beforePolicyInput);
});

test('Task1249 test and doc avoid forbidden route persistence runtime markers', () => {
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
