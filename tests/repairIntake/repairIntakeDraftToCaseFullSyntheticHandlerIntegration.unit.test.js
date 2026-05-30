'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

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

const FORBIDDEN_MARKERS = [
  "require('../d" + "b",
  "require('../../src/d" + "b",
  'src/d' + 'b',
  '../migrations',
  '../../migrations',
  'migrations/',
  "require('../app')",
  "require('../server')",
  "require('../routes')",
  "require('../controllers')",
  "require('../providers')",
  "require('../admin')",
  'process.env.DATA' + 'BASE_URL',
  'ps' + 'ql',
  'd' + 'b:migrate',
  'listen(',
  'app.post',
  'router.post',
  'express.Router',
  'req.',
  'res.',
  'res.json',
  'sendSms',
  'sendLine',
  'sendEmail',
  'webhook',
  'openai',
  'RAG',
  'vector',
  'billing',
  'settlement',
  'SELECT ',
  'INSERT ',
  'UPDATE ',
  'DELETE ',
  'CREATE TABLE',
  'ALTER TABLE',
  'DROP TABLE',
  '/repair-intake',
  '/cases',
  'jsonwebtoken',
  'passport',
  'jwks',
  'jose',
  'auth0',
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

function requireSpecifiers(source) {
  return Array.from(source.matchAll(/require\((['"])([^'"]+)\1\)/g))
    .map((match) => match[2]);
}

function syntheticHandlerInput(overrides = {}) {
  return {
    sessionContext: {
      organizationId: 'org-session-1222',
      actorId: 'actor-session-1222',
      actorRole: 'service_agent',
      token: 'hidden-session-token',
      permissionTrace: { raw: 'hidden-permission-trace' },
    },
    requestBody: {
      repairIntakeDraftId: 'draft-1222',
      organizationId: 'org-body-override-1222',
      actorId: 'actor-body-override-1222',
      draftInput: {
        issueSummary: 'dishwasher leaks',
        preferredWindow: 'morning',
        organizationId: 'org-draft-override-1222',
        actorId: 'actor-draft-override-1222',
        phone: 'hidden-phone',
        address: 'hidden-address',
        email: 'hidden-email',
        providerPayload: { raw: 'hidden-provider-payload' },
        auditRecord: { raw: 'hidden-audit-record' },
        dbRow: { raw: 'hidden-db-row' },
        rawError: 'hidden-raw-error',
        sql: 'hidden-sql',
        query: 'hidden-query',
        stack: 'hidden-stack',
      },
      rawBody: 'hidden-raw-body',
    },
    requestSource: 'synthetic_handler_integration',
    ...overrides,
  };
}

function createFullSyntheticHandler(options = {}) {
  const order = [];
  const contextResolverCalls = [];
  const adapterCalls = [];
  const authCalls = [];
  const repositoryCalls = [];
  const baseContextResolver = createRepairIntakeDraftToCaseRequestContextResolver();

  const requestContextResolver = {
    resolveRepairIntakeDraftToCaseRequestContext(input) {
      order.push('contextResolver');
      contextResolverCalls.push(input);

      return baseContextResolver.resolveRepairIntakeDraftToCaseRequestContext(input);
    },
  };

  const repositoryConsumer = createRepairIntakeCaseRepositoryConsumer({
    caseRepository: {
      async createCaseFromDraft(input) {
        order.push('repository');
        repositoryCalls.push(input);

        if (options.repositoryThrows) {
          throw new Error('hidden repository raw failure hidden-phone hidden-stack');
        }

        if (options.repositorySkipped) {
          return {};
        }

        return {
          caseId: 'case-1222',
          caseRef: {
            caseId: 'case-1222',
            rawRows: [{ phone: 'hidden-phone' }],
          },
          draftId: input.draftId,
          sourceDraftId: input.sourceDraftId,
          organizationId: input.organizationId,
          tenantId: input.tenantId,
          requestId: input.requestId,
          actorId: input.actorId,
          status: 'created',
          metadata: {
            safeKey: 'safe repository metadata',
            headers: { authorization: 'hidden-authorization' },
          },
          warnings: ['safe repository warning'],
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
            rawRows: [{ phone: 'hidden-phone' }],
          };
        }

        return {
          allowed: true,
          status: 'allowed',
          reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_AUTHORIZATION_GATE_ALLOWED',
          rawRows: [{ phone: 'hidden-phone' }],
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
      adapterCalls.push(input);

      return baseControllerAdapter.submitDraftToCase(input);
    },
  };
  const handler = createRepairIntakeDraftToCaseSyntheticHandler({
    requestContextResolver,
    controllerAdapter,
  });

  return {
    adapterCalls,
    authCalls,
    contextResolverCalls,
    handler,
    order,
    repositoryCalls,
  };
}

function assertPublicShape(value) {
  assert.deepEqual(Object.keys(value).sort(), [
    'caseId',
    'messageKey',
    'ok',
    'reasonCode',
    'repairIntakeDraftId',
    'status',
  ]);
}

function assertNoUnsafeText(value) {
  const serialized = JSON.stringify(value);

  for (const marker of [
    'org-body-override-1222',
    'actor-body-override-1222',
    'org-draft-override-1222',
    'actor-draft-override-1222',
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
    'providerPayload',
    'auditRecord',
    'dbRow',
    'token',
  ]) {
    assert.equal(serialized.includes(marker), false, `leaked unsafe marker ${marker}`);
  }
}

test('valid session body allowed auth and repository success returns safe public success', async () => {
  const input = syntheticHandlerInput();
  const before = JSON.parse(JSON.stringify(input));
  const {
    adapterCalls,
    authCalls,
    handler,
    order,
    repositoryCalls,
  } = createFullSyntheticHandler();

  const result = await handler.handleDraftToCase(input);

  assert.deepEqual(order, [
    'contextResolver',
    'controllerAdapter',
    'permissionResolver',
    'applicationService',
    'repository',
    'presenter',
  ]);
  assert.equal(adapterCalls.length, 1);
  assert.equal(authCalls.length, 1);
  assert.equal(repositoryCalls.length, 1);
  assertPublicShape(result);
  assert.equal(result.ok, true);
  assert.equal(result.status, 'created');
  assert.equal(result.caseId, 'case-1222');
  assert.equal(result.repairIntakeDraftId, 'draft-1222');
  assertNoUnsafeText(adapterCalls);
  assertNoUnsafeText(authCalls);
  assertNoUnsafeText(repositoryCalls);
  assertNoUnsafeText(result);
  assert.deepEqual(input, before);
});

test('invalid session context does not call controller adapter permission resolver or repository', async () => {
  const {
    adapterCalls,
    authCalls,
    handler,
    order,
    repositoryCalls,
  } = createFullSyntheticHandler();

  const result = await handler.handleDraftToCase(syntheticHandlerInput({
    sessionContext: {
      actorId: 'actor-session-1222',
      actorRole: 'service_agent',
    },
  }));

  assert.deepEqual(order, ['contextResolver']);
  assert.deepEqual(adapterCalls, []);
  assert.deepEqual(authCalls, []);
  assert.deepEqual(repositoryCalls, []);
  assert.equal(result.ok, false);
  assert.equal(result.status, 'invalid_context');
  assert.equal(
    result.reasonCode,
    'REPAIR_INTAKE_DRAFT_TO_CASE_REQUEST_CONTEXT_ORGANIZATION_REQUIRED',
  );
  assertNoUnsafeText(result);
});

test('body organization and actor override attempt keeps session values downstream', async () => {
  const {
    adapterCalls,
    authCalls,
    handler,
    repositoryCalls,
  } = createFullSyntheticHandler();

  await handler.handleDraftToCase(syntheticHandlerInput());

  for (const call of [adapterCalls[0], authCalls[0], repositoryCalls[0]]) {
    assert.equal(call.organizationId, 'org-session-1222');
    assert.equal(call.actorId, 'actor-session-1222');
    assert.equal(JSON.stringify(call).includes('org-body-override-1222'), false);
    assert.equal(JSON.stringify(call).includes('actor-body-override-1222'), false);
  }
  assertNoUnsafeText(adapterCalls);
  assertNoUnsafeText(authCalls);
  assertNoUnsafeText(repositoryCalls);
});

test('denied authorization does not call repository and returns safe public denied', async () => {
  const {
    handler,
    order,
    repositoryCalls,
  } = createFullSyntheticHandler({ authDenied: true });

  const result = await handler.handleDraftToCase(syntheticHandlerInput());

  assert.deepEqual(order, ['contextResolver', 'controllerAdapter', 'permissionResolver', 'presenter']);
  assert.deepEqual(repositoryCalls, []);
  assertPublicShape(result);
  assert.equal(result.ok, false);
  assert.equal(result.status, 'denied');
  assert.equal(result.messageKey, 'repair_intake_draft_to_case.denied');
  assert.equal(result.caseId, null);
  assertNoUnsafeText(result);
});

test('repository skipped no-case returns safe public not-created', async () => {
  const {
    handler,
    order,
    repositoryCalls,
  } = createFullSyntheticHandler({ repositorySkipped: true });

  const result = await handler.handleDraftToCase(syntheticHandlerInput());

  assert.deepEqual(order, [
    'contextResolver',
    'controllerAdapter',
    'permissionResolver',
    'applicationService',
    'repository',
    'presenter',
  ]);
  assert.equal(repositoryCalls.length, 1);
  assertPublicShape(result);
  assert.equal(result.ok, false);
  assert.equal(result.status, 'not_created');
  assert.equal(result.messageKey, 'repair_intake_draft_to_case.not_created');
  assert.equal(result.caseId, null);
  assertNoUnsafeText(result);
});

test('repository throw with sensitive raw message returns generic safe public failure', async () => {
  const {
    handler,
    order,
    repositoryCalls,
  } = createFullSyntheticHandler({ repositoryThrows: true });

  const result = await handler.handleDraftToCase(syntheticHandlerInput());

  assert.deepEqual(order, [
    'contextResolver',
    'controllerAdapter',
    'permissionResolver',
    'applicationService',
    'repository',
    'presenter',
  ]);
  assert.equal(repositoryCalls.length, 1);
  assertPublicShape(result);
  assert.equal(result.ok, false);
  assert.equal(result.status, 'unavailable');
  assert.equal(result.messageKey, 'repair_intake_draft_to_case.unavailable');
  assert.equal(result.caseId, null);
  assertNoUnsafeText(result);
});

test('unsafe input fields are stripped before permission resolver and repository', async () => {
  const {
    adapterCalls,
    authCalls,
    handler,
    repositoryCalls,
  } = createFullSyntheticHandler();

  await handler.handleDraftToCase(syntheticHandlerInput());

  assert.deepEqual(adapterCalls[0].draftInput, {
    problemDescription: 'dishwasher leaks',
    preferredTimeDescription: 'morning',
  });
  assert.equal(authCalls[0].organizationId, 'org-session-1222');
  assert.equal(repositoryCalls[0].organizationId, 'org-session-1222');
  assertNoUnsafeText(adapterCalls);
  assertNoUnsafeText(authCalls);
  assertNoUnsafeText(repositoryCalls);
});

test('integration test source stays synthetic without route http db provider migration or auth rollout', () => {
  const source = sourceWithoutAllowedLists(fs.readFileSync(TEST_SOURCE_PATH, 'utf8'));

  assert.deepEqual(requireSpecifiers(source), [
    'node:assert/strict',
    'node:fs',
    'node:test',
    '../../src/repairIntake/repairIntakeCaseRepositoryConsumer',
    '../../src/repairIntake/repairIntakeDraftToCaseApplicationService',
    '../../src/repairIntake/repairIntakeDraftToCaseAuthorizationGate',
    '../../src/repairIntake/repairIntakeDraftToCaseOrchestrator',
    '../../src/repairIntake/repairIntakeDraftToCasePublicResultPresenter',
    '../../src/repairIntake/repairIntakeDraftToCaseControllerAdapter',
    '../../src/repairIntake/repairIntakeDraftToCaseRequestContextResolver',
    '../../src/repairIntake/repairIntakeDraftToCaseSyntheticHandler',
  ]);

  for (const marker of FORBIDDEN_MARKERS) {
    assert.equal(source.includes(marker), false, `integration test contains forbidden marker ${marker}`);
  }

  assert.doesNotMatch(source, /(^|[^'"])listen\(/);
});
