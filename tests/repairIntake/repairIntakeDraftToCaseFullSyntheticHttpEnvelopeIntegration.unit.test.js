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
const {
  mapRepairIntakeDraftToCasePublicResultToHttpResponse,
} = require('../../src/repairIntake/repairIntakeDraftToCaseHttpResultMapper');

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
      organizationId: 'org-session-1224',
      actorId: 'actor-session-1224',
      actorRole: 'service_agent',
      token: 'hidden-session-token',
      permissionTrace: { raw: 'hidden-permission-trace' },
    },
    requestBody: {
      repairIntakeDraftId: 'draft-1224',
      organizationId: 'org-body-override-1224',
      actorId: 'actor-body-override-1224',
      draftInput: {
        issueSummary: 'range burner does not ignite',
        preferredWindow: 'afternoon',
        organizationId: 'org-draft-override-1224',
        actorId: 'actor-draft-override-1224',
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
    requestSource: 'synthetic_http_envelope_integration',
    ...overrides,
  };
}

function createFullSyntheticHttpEnvelope(options = {}) {
  const order = [];
  const adapterCalls = [];
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

        if (options.repositoryThrows) {
          throw new Error('hidden repository raw failure hidden-sql hidden-stack hidden-phone hidden-email');
        }

        if (options.repositorySkipped) {
          return {};
        }

        return {
          caseId: 'case-1224',
          caseRef: {
            caseId: 'case-1224',
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

  async function handleToHttpEnvelope(input) {
    const publicResult = await handler.handleDraftToCase(input);

    order.push('httpResultMapper');

    return mapRepairIntakeDraftToCasePublicResultToHttpResponse(publicResult);
  }

  return {
    adapterCalls,
    authCalls,
    handleToHttpEnvelope,
    order,
    repositoryCalls,
  };
}

function assertHttpBodyShape(body) {
  assert.deepEqual(Object.keys(body).sort(), [
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
    'org-body-override-1224',
    'actor-body-override-1224',
    'org-draft-override-1224',
    'actor-draft-override-1224',
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
    'select',
  ]) {
    assert.equal(serialized.includes(marker), false, `leaked unsafe marker ${marker}`);
  }
}

test('valid session body allowed auth and repository success maps to 201 HTTP envelope', async () => {
  const input = syntheticHandlerInput();
  const before = JSON.parse(JSON.stringify(input));
  const {
    adapterCalls,
    authCalls,
    handleToHttpEnvelope,
    order,
    repositoryCalls,
  } = createFullSyntheticHttpEnvelope();

  const result = await handleToHttpEnvelope(input);

  assert.deepEqual(order, [
    'contextResolver',
    'controllerAdapter',
    'permissionResolver',
    'applicationService',
    'repository',
    'presenter',
    'httpResultMapper',
  ]);
  assert.equal(result.statusCode, 201);
  assertHttpBodyShape(result.body);
  assert.equal(result.body.ok, true);
  assert.equal(result.body.status, 'created');
  assert.equal(result.body.caseId, 'case-1224');
  assert.equal(result.body.repairIntakeDraftId, 'draft-1224');
  assertNoUnsafeText(adapterCalls);
  assertNoUnsafeText(authCalls);
  assertNoUnsafeText(repositoryCalls);
  assertNoUnsafeText(result);
  assert.deepEqual(input, before);
});

test('invalid session context maps to safe 400 envelope without downstream calls', async () => {
  const {
    adapterCalls,
    authCalls,
    handleToHttpEnvelope,
    order,
    repositoryCalls,
  } = createFullSyntheticHttpEnvelope();

  const result = await handleToHttpEnvelope(syntheticHandlerInput({
    sessionContext: {
      actorId: 'actor-session-1224',
      actorRole: 'service_agent',
    },
  }));

  assert.deepEqual(order, ['contextResolver', 'httpResultMapper']);
  assert.deepEqual(adapterCalls, []);
  assert.deepEqual(authCalls, []);
  assert.deepEqual(repositoryCalls, []);
  assert.equal(result.statusCode, 400);
  assert.equal(result.body.ok, false);
  assert.equal(result.body.status, 'invalid_context');
  assertHttpBodyShape(result.body);
  assertNoUnsafeText(result);
});

test('body organization and actor override attempt keeps session values downstream', async () => {
  const {
    adapterCalls,
    authCalls,
    handleToHttpEnvelope,
    repositoryCalls,
  } = createFullSyntheticHttpEnvelope();

  const result = await handleToHttpEnvelope(syntheticHandlerInput());

  assert.equal(result.statusCode, 201);
  for (const call of [adapterCalls[0], authCalls[0], repositoryCalls[0]]) {
    assert.equal(call.organizationId, 'org-session-1224');
    assert.equal(call.actorId, 'actor-session-1224');
    assert.equal(JSON.stringify(call).includes('org-body-override-1224'), false);
    assert.equal(JSON.stringify(call).includes('actor-body-override-1224'), false);
  }
  assertNoUnsafeText(adapterCalls);
  assertNoUnsafeText(authCalls);
  assertNoUnsafeText(repositoryCalls);
  assertNoUnsafeText(result);
});

test('denied authorization maps to 403 and does not call repository', async () => {
  const {
    handleToHttpEnvelope,
    order,
    repositoryCalls,
  } = createFullSyntheticHttpEnvelope({ authDenied: true });

  const result = await handleToHttpEnvelope(syntheticHandlerInput());

  assert.deepEqual(order, [
    'contextResolver',
    'controllerAdapter',
    'permissionResolver',
    'presenter',
    'httpResultMapper',
  ]);
  assert.deepEqual(repositoryCalls, []);
  assert.equal(result.statusCode, 403);
  assert.equal(result.body.status, 'denied');
  assert.equal(result.body.ok, false);
  assert.equal(result.body.caseId, null);
  assertHttpBodyShape(result.body);
  assertNoUnsafeText(result);
});

test('repository skipped no-case maps to documented 202 envelope', async () => {
  const {
    handleToHttpEnvelope,
    order,
    repositoryCalls,
  } = createFullSyntheticHttpEnvelope({ repositorySkipped: true });

  const result = await handleToHttpEnvelope(syntheticHandlerInput());

  assert.deepEqual(order, [
    'contextResolver',
    'controllerAdapter',
    'permissionResolver',
    'applicationService',
    'repository',
    'presenter',
    'httpResultMapper',
  ]);
  assert.equal(repositoryCalls.length, 1);
  assert.equal(result.statusCode, 202);
  assert.equal(result.body.status, 'not_created');
  assert.equal(result.body.ok, false);
  assert.equal(result.body.caseId, null);
  assertHttpBodyShape(result.body);
  assertNoUnsafeText(result);
});

test('repository throw with sensitive raw message maps to generic safe 503', async () => {
  const {
    handleToHttpEnvelope,
    repositoryCalls,
  } = createFullSyntheticHttpEnvelope({ repositoryThrows: true });

  const result = await handleToHttpEnvelope(syntheticHandlerInput());

  assert.equal(repositoryCalls.length, 1);
  assert.equal(result.statusCode, 503);
  assert.equal(result.body.status, 'unavailable');
  assert.equal(result.body.ok, false);
  assert.equal(result.body.caseId, null);
  assertHttpBodyShape(result.body);
  assertNoUnsafeText(result);
});

test('unsafe input fields are stripped before downstream calls and final body', async () => {
  const {
    adapterCalls,
    authCalls,
    handleToHttpEnvelope,
    repositoryCalls,
  } = createFullSyntheticHttpEnvelope();

  const result = await handleToHttpEnvelope(syntheticHandlerInput());

  assert.deepEqual(adapterCalls[0].draftInput, {
    issueSummary: 'range burner does not ignite',
    preferredWindow: 'afternoon',
  });
  assert.equal(authCalls[0].organizationId, 'org-session-1224');
  assert.equal(repositoryCalls[0].organizationId, 'org-session-1224');
  assertNoUnsafeText(adapterCalls);
  assertNoUnsafeText(authCalls);
  assertNoUnsafeText(repositoryCalls);
  assertNoUnsafeText(result);
});

test('integration test source stays synthetic without route http framework db provider migration or auth rollout', () => {
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
    '../../src/repairIntake/repairIntakeDraftToCaseHttpResultMapper',
  ]);

  for (const marker of FORBIDDEN_MARKERS) {
    assert.equal(source.includes(marker), false, `integration test contains forbidden marker ${marker}`);
  }

  assert.doesNotMatch(source, /(^|[^'"])listen\(/);
});
