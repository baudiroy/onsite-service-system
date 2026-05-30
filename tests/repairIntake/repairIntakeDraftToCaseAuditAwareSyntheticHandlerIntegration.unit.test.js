'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  buildRepairIntakeDraftToCaseAuditIntent,
} = require('../../src/repairIntake/repairIntakeDraftToCaseAuditIntentBuilder');
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
  '../../docs/task-1246-repair-intake-draft-to-case-audit-aware-synthetic-handler-integration-no-db-no-route.md',
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
    repairIntakeDraftId: 'draft-1246',
    sessionContext: {
      organizationId: 'org-session-1246',
      actorId: 'actor-session-1246',
      actorRole: 'service_agent',
      token: 'hidden-session-token',
      permissionTrace: { raw: 'hidden-permission-trace' },
    },
    requestBody: {
      repairIntakeDraftId: 'draft-1246',
      organizationId: 'org-body-override-1246',
      actorId: 'actor-body-override-1246',
      draftInput: {
        issueSummary: 'washer drain issue',
        preferredWindow: 'morning',
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
    requestSource: 'synthetic_audit_integration',
    rawRequest: 'hidden-raw-request',
    ...overrides,
  };
}

function clone(value) {
  return structuredClone(value);
}

function auditInputFromSyntheticInput(input, phase) {
  const sessionContext = input.sessionContext || {};
  const requestBody = input.requestBody || {};

  return {
    phase,
    organizationId: sessionContext.organizationId,
    actorId: sessionContext.actorId,
    repairIntakeDraftId: requestBody.repairIntakeDraftId,
    resultStatus: 'started',
    reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_AUDIT_ATTEMPT',
    source: input.requestSource,
    occurredAt: '2026-05-24T12:46:00.000Z',
    rawRequest: input.rawRequest,
    rawBody: requestBody.rawBody,
    permissionTrace: sessionContext.permissionTrace,
    phone: requestBody.draftInput && requestBody.draftInput.phone,
  };
}

function auditInputFromResult(input, result) {
  const sessionContext = input.sessionContext || {};
  const requestBody = input.requestBody || {};
  const phase = result.ok === true
    ? 'submitted'
    : (result.status === 'denied' ? 'denied' : 'failed');

  return {
    phase,
    organizationId: sessionContext.organizationId,
    actorId: sessionContext.actorId,
    repairIntakeDraftId: requestBody.repairIntakeDraftId,
    caseId: result.caseId,
    resultStatus: result.status,
    reasonCode: result.reasonCode,
    source: input.requestSource,
    occurredAt: '2026-05-24T12:46:30.000Z',
    rawError: result.rawError,
    rawBody: requestBody.rawBody,
    rawRequest: input.rawRequest,
    permissionTrace: result.permissionTrace,
    phone: requestBody.draftInput && requestBody.draftInput.phone,
    email: requestBody.draftInput && requestBody.draftInput.email,
    stack: result.stack,
    sql: result.sql,
  };
}

function createAuditAwareSyntheticFlow(options = {}) {
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

        if (options.repositoryThrows) {
          throw new Error('hidden raw repository failure hidden-sql hidden-stack hidden-phone hidden-email');
        }

        return {
          caseId: 'case-1246',
          caseRef: {
            caseId: 'case-1246',
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
          metadata: {
            safeKey: 'safe repository metadata',
            headers: { authorization: 'hidden-authorization' },
          },
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

  async function handleWithAudit(input) {
    const attemptInput = auditInputFromSyntheticInput(input, 'attempt');
    const attemptIntent = buildRepairIntakeDraftToCaseAuditIntent(attemptInput);
    const result = await handler.handleDraftToCase(input);
    const completionInput = auditInputFromResult(input, result);
    const completionIntent = buildRepairIntakeDraftToCaseAuditIntent(completionInput);

    return {
      attemptInput,
      attemptIntent,
      authCalls,
      completionInput,
      completionIntent,
      order,
      repositoryCalls,
      result,
    };
  }

  return {
    handleWithAudit,
  };
}

function assertNoUnsafeText(value) {
  const serialized = JSON.stringify(value);

  for (const marker of [
    'org-body-override-1246',
    'actor-body-override-1246',
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
  ]) {
    assert.equal(serialized.includes(marker), false, `leaked unsafe marker ${marker}`);
  }
}

test('allowed repository success builds safe attempt and submitted audit intents', async () => {
  const input = syntheticHandlerInput();
  const before = clone(input);
  const flow = createAuditAwareSyntheticFlow();

  const result = await flow.handleWithAudit(input);

  assert.deepEqual(result.order, [
    'contextResolver',
    'permissionResolver',
    'applicationService',
    'repository',
    'presenter',
  ]);
  assert.equal(result.result.ok, true);
  assert.equal(result.result.status, 'created');
  assert.equal(result.result.caseId, 'case-1246');
  assert.equal(result.attemptIntent.ok, true);
  assert.equal(result.attemptIntent.auditIntent.phase, 'attempt');
  assert.equal(result.completionIntent.ok, true);
  assert.equal(result.completionIntent.auditIntent.phase, 'submitted');
  assert.equal(result.completionIntent.auditIntent.caseId, 'case-1246');
  assert.equal(result.completionIntent.auditIntent.repairIntakeDraftId, 'draft-1246');
  assert.equal(result.completionIntent.auditIntent.organizationId, 'org-session-1246');
  assert.equal(result.completionIntent.auditIntent.actorId, 'actor-session-1246');
  assertNoUnsafeText(result.attemptIntent);
  assertNoUnsafeText(result.completionIntent);
  assertNoUnsafeText(result.authCalls);
  assertNoUnsafeText(result.repositoryCalls);
  assert.deepEqual(input, before);
});

test('denied authorization builds safe attempt and denied audit intents without repository call', async () => {
  const input = syntheticHandlerInput();
  const flow = createAuditAwareSyntheticFlow({ authDenied: true });

  const result = await flow.handleWithAudit(input);

  assert.deepEqual(result.order, [
    'contextResolver',
    'permissionResolver',
    'presenter',
  ]);
  assert.deepEqual(result.repositoryCalls, []);
  assert.equal(result.result.ok, false);
  assert.equal(result.result.status, 'denied');
  assert.equal(result.attemptIntent.ok, true);
  assert.equal(result.completionIntent.ok, true);
  assert.equal(result.completionIntent.auditIntent.phase, 'denied');
  assert.equal(result.completionIntent.auditIntent.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_PUBLIC_DENIED');
  assertNoUnsafeText(result.attemptIntent);
  assertNoUnsafeText(result.completionIntent);
});

test('invalid session context keeps attempt and failed audit envelopes safe', async () => {
  const input = syntheticHandlerInput({
    sessionContext: {
      actorId: 'actor-session-1246',
      actorRole: 'service_agent',
      permissionTrace: { raw: 'hidden-permission-trace' },
    },
  });
  const before = clone(input);
  const flow = createAuditAwareSyntheticFlow();

  const result = await flow.handleWithAudit(input);

  assert.deepEqual(result.order, ['contextResolver']);
  assert.deepEqual(result.repositoryCalls, []);
  assert.equal(result.result.ok, false);
  assert.equal(result.result.status, 'invalid_context');
  assert.equal(result.attemptIntent.ok, false);
  assert.equal(
    result.attemptIntent.reasonCode,
    'REPAIR_INTAKE_DRAFT_TO_CASE_AUDIT_INTENT_ORGANIZATION_REQUIRED',
  );
  assert.equal(result.completionIntent.ok, false);
  assert.equal(
    result.completionIntent.reasonCode,
    'REPAIR_INTAKE_DRAFT_TO_CASE_AUDIT_INTENT_ORGANIZATION_REQUIRED',
  );
  assertNoUnsafeText(result.attemptIntent);
  assertNoUnsafeText(result.completionIntent);
  assertNoUnsafeText(result.result);
  assert.deepEqual(input, before);
});

test('repository throw returns generic handler failure and safe failed audit intent', async () => {
  const input = syntheticHandlerInput();
  const flow = createAuditAwareSyntheticFlow({ repositoryThrows: true });

  const result = await flow.handleWithAudit(input);

  assert.equal(result.repositoryCalls.length, 1);
  assert.equal(result.result.ok, false);
  assert.equal(result.result.status, 'unavailable');
  assert.equal(result.completionIntent.ok, true);
  assert.equal(result.completionIntent.auditIntent.phase, 'failed');
  assert.equal(result.completionIntent.auditIntent.caseId, null);
  assert.equal(result.completionIntent.auditIntent.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_PUBLIC_UNAVAILABLE');
  assertNoUnsafeText(result.result);
  assertNoUnsafeText(result.completionIntent);
});

test('audit intent input objects are not mutated', async () => {
  const input = syntheticHandlerInput();
  const flow = createAuditAwareSyntheticFlow();

  const result = await flow.handleWithAudit(input);
  const attemptBefore = clone(result.attemptInput);
  const completionBefore = clone(result.completionInput);

  buildRepairIntakeDraftToCaseAuditIntent(result.attemptInput);
  buildRepairIntakeDraftToCaseAuditIntent(result.completionInput);

  assert.deepEqual(result.attemptInput, attemptBefore);
  assert.deepEqual(result.completionInput, completionBefore);
});

test('Task1246 test and doc avoid forbidden route persistence runtime markers', () => {
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
