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
  'app.listen',
  'server.listen',
  'express()',
  'fastify',
  'koa',
  'next(',
  'req.',
  'res.',
  'router.',
  'sendLine',
  'sendSms',
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

function syntheticRequest(overrides = {}) {
  return {
    organizationId: 'org-1218',
    actorId: 'actor-1218',
    repairIntakeDraftId: 'draft-1218',
    source: 'repair_intake',
    actorRole: 'service_agent',
    requestId: 'request-1218',
    tenantId: 'tenant-1218',
    draftInput: {
      status: 'ready',
      summary: { title: 'safe draft title', phone: 'hidden' },
      rawRows: [{ phone: 'hidden' }],
      customerPhone: 'hidden',
    },
    metadata: {
      safeKey: 'safe request metadata',
      headers: { authorization: 'hidden' },
    },
    sql: 'hidden',
    query: { unsafe: true },
    stack: 'hidden',
    rawError: 'hidden',
    phone: 'hidden',
    address: 'hidden',
    email: 'hidden',
    providerPayload: { token: 'hidden' },
    auditRecord: { internal: 'hidden' },
    ...overrides,
  };
}

function createFullSyntheticAdapter(options = {}) {
  const order = [];
  const authCalls = [];
  const repositoryCalls = [];

  const repositoryConsumer = createRepairIntakeCaseRepositoryConsumer({
    caseRepository: {
      async createCaseFromDraft(input) {
        order.push('repository');
        repositoryCalls.push(input);

        if (options.repositoryThrows) {
          throw new Error('hidden repository raw failure phone stack');
        }

        if (options.repositorySkipped) {
          return {};
        }

        return {
          caseId: 'case-1218',
          caseRef: {
            caseId: 'case-1218',
            rawRows: [{ phone: 'hidden' }],
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
            headers: { authorization: 'hidden' },
          },
          warnings: ['safe repository warning'],
          rawRows: [{ phone: 'hidden' }],
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
        order.push('authorization');
        authCalls.push(context);

        if (options.authDenied) {
          return {
            allowed: false,
            status: 'denied',
            reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_AUTHORIZATION_GATE_DENIED',
            requiredActions: ['request_permission_review'],
            rawRows: [{ phone: 'hidden' }],
          };
        }

        return {
          allowed: true,
          status: 'allowed',
          reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_AUTHORIZATION_GATE_ALLOWED',
          rawRows: [{ phone: 'hidden' }],
        };
      },
    },
  });

  const orchestrator = createRepairIntakeDraftToCaseOrchestrator({
    authorizationGate,
    draftToCaseApplicationService: applicationService,
  });
  const adapter = createRepairIntakeDraftToCaseControllerAdapter({
    orchestrator,
    publicResultPresenter: {
      presentRepairIntakeDraftToCaseResult(result) {
        order.push('presenter');
        return presentRepairIntakeDraftToCaseResult(result);
      },
    },
  });

  return {
    adapter,
    authCalls,
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
    'hidden',
    'rawRows',
    'raw',
    'headers',
    'customerPhone',
    'phone',
    'address',
    'email',
    'query',
    'stack',
    'providerPayload',
    'auditRecord',
    'token',
    'authorization',
  ]) {
    assert.equal(serialized.includes(marker), false, `leaked unsafe marker ${marker}`);
  }
}

test('allowed repository success returns safe public success through full injected adapter chain', async () => {
  const request = syntheticRequest();
  const before = JSON.parse(JSON.stringify(request));
  const { adapter, authCalls, order, repositoryCalls } = createFullSyntheticAdapter();

  const result = await adapter.submitDraftToCase(request);

  assert.deepEqual(order, ['authorization', 'repository', 'presenter']);
  assert.equal(authCalls.length, 1);
  assert.equal(repositoryCalls.length, 1);
  assert.equal(authCalls[0].organizationId, 'org-1218');
  assert.equal(authCalls[0].actorId, 'actor-1218');
  assert.equal(authCalls[0].repairIntakeDraftId, 'draft-1218');
  assert.equal(repositoryCalls[0].organizationId, 'org-1218');
  assert.equal(repositoryCalls[0].actorId, 'actor-1218');
  assert.equal(repositoryCalls[0].draftId, 'draft-1218');
  assertPublicShape(result);
  assert.equal(result.ok, true);
  assert.equal(result.status, 'created');
  assert.equal(result.caseId, 'case-1218');
  assert.equal(result.repairIntakeDraftId, 'draft-1218');
  assertNoUnsafeText(authCalls);
  assertNoUnsafeText(repositoryCalls);
  assertNoUnsafeText(result);
  assert.deepEqual(request, before);
});

test('denied authorization does not call repository and returns safe public denied', async () => {
  const { adapter, order, repositoryCalls } = createFullSyntheticAdapter({ authDenied: true });

  const result = await adapter.submitDraftToCase(syntheticRequest());

  assert.deepEqual(order, ['authorization', 'presenter']);
  assert.deepEqual(repositoryCalls, []);
  assertPublicShape(result);
  assert.equal(result.ok, false);
  assert.equal(result.status, 'denied');
  assert.equal(result.messageKey, 'repair_intake_draft_to_case.denied');
  assert.equal(result.caseId, null);
  assertNoUnsafeText(result);
});

test('repository skipped result returns safe public not-created', async () => {
  const { adapter, order, repositoryCalls } = createFullSyntheticAdapter({ repositorySkipped: true });

  const result = await adapter.submitDraftToCase(syntheticRequest());

  assert.deepEqual(order, ['authorization', 'repository', 'presenter']);
  assert.equal(repositoryCalls.length, 1);
  assertPublicShape(result);
  assert.equal(result.ok, false);
  assert.equal(result.status, 'not_created');
  assert.equal(result.messageKey, 'repair_intake_draft_to_case.not_created');
  assert.equal(result.caseId, null);
  assertNoUnsafeText(result);
});

test('repository throw returns generic safe public failure without raw leakage', async () => {
  const { adapter, order, repositoryCalls } = createFullSyntheticAdapter({ repositoryThrows: true });

  const result = await adapter.submitDraftToCase(syntheticRequest());

  assert.deepEqual(order, ['authorization', 'repository', 'presenter']);
  assert.equal(repositoryCalls.length, 1);
  assertPublicShape(result);
  assert.equal(result.ok, false);
  assert.equal(result.status, 'unavailable');
  assert.equal(result.messageKey, 'repair_intake_draft_to_case.unavailable');
  assert.equal(result.caseId, null);
  assertNoUnsafeText(result);
});

test('integration test source stays synthetic without route http db provider or migration coupling', () => {
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
  ]);

  for (const marker of FORBIDDEN_MARKERS) {
    assert.equal(source.includes(marker), false, `integration test contains forbidden marker ${marker}`);
  }

  assert.doesNotMatch(source, /(^|[^'"])listen\(/);
});
