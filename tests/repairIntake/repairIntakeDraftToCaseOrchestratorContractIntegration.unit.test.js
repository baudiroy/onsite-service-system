'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
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
  "require('../repositories')",
  "require('../providers')",
  "require('../admin')",
  'process.env.DATA' + 'BASE_URL',
  'ps' + 'ql',
  'd' + 'b:migrate',
  'listen(',
  'app.listen',
  'server.listen',
  'express()',
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

function requestInput(overrides = {}) {
  return {
    organizationId: 'org-1215',
    actorId: 'actor-1215',
    repairIntakeDraftId: 'draft-1215',
    source: 'repair_intake',
    actorRole: 'service_agent',
    requestId: 'req-1215',
    tenantId: 'tenant-1215',
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
    rawRequest: { phone: 'hidden' },
    headers: { authorization: 'hidden' },
    customerPhone: 'hidden',
    ...overrides,
  };
}

function createSyntheticChain(options = {}) {
  const order = [];
  const authCalls = [];
  const repositoryCalls = [];

  const repositoryConsumer = createRepairIntakeCaseRepositoryConsumer({
    caseRepository: {
      async createCaseFromDraft(input) {
        order.push('repository');
        repositoryCalls.push(input);

        if (options.repositoryThrows) {
          throw new Error('unsafe repository detail hidden stack customer contact');
        }

        if (options.repositorySkipped) {
          return {};
        }

        return {
          caseId: 'case-1215',
          caseRef: {
            caseId: 'case-1215',
            displayId: 'CASE-1215',
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
          metadata: {
            safeKey: 'safe auth metadata',
            headers: { authorization: 'hidden' },
          },
          warnings: ['safe auth warning'],
          rawRows: [{ phone: 'hidden' }],
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

  return {
    authCalls,
    order,
    orchestrator,
    repositoryCalls,
  };
}

function assertNoUnsafeText(value) {
  const serialized = JSON.stringify(value);

  for (const marker of [
    'unsafe repository detail',
    'customer contact',
    'hidden',
    'rawRequest',
    'rawRows',
    'raw',
    'headers',
    'customerPhone',
    'phone',
    'stack',
    'error',
    'token',
  ]) {
    assert.equal(serialized.includes(marker), false, `leaked unsafe marker ${marker}`);
  }
}

test('allowed auth and repository success compose through the real injected chain', async () => {
  const request = requestInput();
  const before = JSON.parse(JSON.stringify(request));
  const { authCalls, order, orchestrator, repositoryCalls } = createSyntheticChain();

  const result = await orchestrator.submitDraftToCase(request);

  assert.deepEqual(order, ['authorization', 'applicationService', 'repository']);
  assert.equal(authCalls.length, 1);
  assert.equal(repositoryCalls.length, 1);
  assert.equal(authCalls[0].organizationId, 'org-1215');
  assert.equal(authCalls[0].actorId, 'actor-1215');
  assert.equal(authCalls[0].repairIntakeDraftId, 'draft-1215');
  assert.equal(repositoryCalls[0].organizationId, 'org-1215');
  assert.equal(repositoryCalls[0].actorId, 'actor-1215');
  assert.equal(repositoryCalls[0].draftId, 'draft-1215');
  assert.equal(repositoryCalls[0].sourceDraftId, 'draft-1215');
  assert.equal(result.ok, true);
  assert.equal(result.allowed, true);
  assert.equal(result.submitted, true);
  assert.equal(result.caseId, 'case-1215');
  assert.equal(result.organizationId, 'org-1215');
  assert.equal(result.actorId, 'actor-1215');
  assert.equal(result.repairIntakeDraftId, 'draft-1215');
  assertNoUnsafeText(authCalls);
  assertNoUnsafeText(repositoryCalls);
  assertNoUnsafeText(result);
  assert.deepEqual(request, before);
});

test('denied auth does not call application service or repository', async () => {
  const { order, orchestrator, repositoryCalls } = createSyntheticChain({ authDenied: true });

  const result = await orchestrator.submitDraftToCase(requestInput());

  assert.deepEqual(order, ['authorization']);
  assert.deepEqual(repositoryCalls, []);
  assert.equal(result.ok, false);
  assert.equal(result.allowed, false);
  assert.equal(result.status, 'denied');
  assert.equal(result.applicationStatus, null);
  assertNoUnsafeText(result);
});

test('repository skipped result is preserved safely through the orchestrator', async () => {
  const { order, orchestrator, repositoryCalls } = createSyntheticChain({ repositorySkipped: true });

  const result = await orchestrator.submitDraftToCase(requestInput());

  assert.deepEqual(order, ['authorization', 'applicationService', 'repository']);
  assert.equal(repositoryCalls.length, 1);
  assert.equal(result.ok, false);
  assert.equal(result.allowed, true);
  assert.equal(result.status, 'skipped');
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_CASE_REPOSITORY_CONSUMER_NOT_FOUND_OR_SKIPPED');
  assertNoUnsafeText(result);
});

test('repository throw returns generic safe failure without raw leakage', async () => {
  const { order, orchestrator, repositoryCalls } = createSyntheticChain({ repositoryThrows: true });

  const result = await orchestrator.submitDraftToCase(requestInput());

  assert.deepEqual(order, ['authorization', 'applicationService', 'repository']);
  assert.equal(repositoryCalls.length, 1);
  assert.equal(result.ok, false);
  assert.equal(result.allowed, true);
  assert.equal(result.status, 'failed');
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_CASE_REPOSITORY_CONSUMER_REPOSITORY_FAILED');
  assertNoUnsafeText(result);
});

test('integration test source stays synthetic only without DB route provider or migration coupling', () => {
  const source = sourceWithoutAllowedLists(fs.readFileSync(TEST_SOURCE_PATH, 'utf8'));

  assert.deepEqual(requireSpecifiers(source), [
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:test',
    '../../src/repairIntake/repairIntakeCaseRepositoryConsumer',
    '../../src/repairIntake/repairIntakeDraftToCaseApplicationService',
    '../../src/repairIntake/repairIntakeDraftToCaseAuthorizationGate',
    '../../src/repairIntake/repairIntakeDraftToCaseOrchestrator',
  ]);

  for (const marker of FORBIDDEN_MARKERS) {
    assert.equal(source.includes(marker), false, `integration test contains forbidden marker ${marker}`);
  }

  assert.doesNotMatch(source, /(^|[^'"])listen\(/);
});
