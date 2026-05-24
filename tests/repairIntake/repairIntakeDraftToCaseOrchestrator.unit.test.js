'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createRepairIntakeDraftToCaseOrchestrator,
} = require('../../src/repairIntake/repairIntakeDraftToCaseOrchestrator');

const UNSAFE_ERROR_TEXT = [
  'unsafe dependency detail',
  'unsafe customer contact',
  'unsafe stack detail',
  'unsafe infrastructure detail',
].join(' ');

function requestInput(overrides = {}) {
  return {
    organizationId: 'org-1214',
    actorId: 'actor-1214',
    repairIntakeDraftId: 'draft-1214',
    source: 'repair_intake',
    actorRole: 'service_agent',
    requestId: 'req-1214',
    tenantId: 'tenant-1214',
    draftInput: {
      status: 'ready',
      summary: { title: 'safe draft title', phone: 'hidden' },
      rawRows: [{ phone: 'hidden' }],
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

function allowedAuthorizationResult() {
  return {
    ok: true,
    allowed: true,
    status: 'allowed',
    reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_AUTHORIZATION_GATE_ALLOWED',
    organizationId: 'org-1214',
    actorId: 'actor-1214',
    repairIntakeDraftId: 'draft-1214',
    metadata: { safeKey: 'safe auth metadata', headers: { authorization: 'hidden' } },
    warnings: ['safe auth warning'],
    rawRows: [{ phone: 'hidden' }],
  };
}

function successApplicationResult() {
  return {
    ok: true,
    submitted: true,
    status: 'created',
    reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_CONSUMER_APPLICATION_SERVICE_CASE_READY',
    organizationId: 'org-1214',
    actorId: 'actor-1214',
    repairIntakeDraftId: 'draft-1214',
    draftId: 'draft-1214',
    caseId: 'case-1214',
    caseRef: {
      caseId: 'case-1214',
      rawRows: [{ phone: 'hidden' }],
    },
    metadata: { safeKey: 'safe app metadata', headers: { authorization: 'hidden' } },
    warnings: ['safe app warning'],
    rawRows: [{ phone: 'hidden' }],
  };
}

function createOrchestrator(calls, options = {}) {
  return createRepairIntakeDraftToCaseOrchestrator({
    authorizationGate: {
      async authorizeDraftToCase(context) {
        calls.push({ dependency: 'authorizationGate', input: context });

        if (options.throwAuthorization) {
          throw new Error(UNSAFE_ERROR_TEXT);
        }

        return options.authorizationResult || allowedAuthorizationResult();
      },
    },
    draftToCaseApplicationService: {
      async submitDraftToCase(request) {
        calls.push({ dependency: 'applicationService', input: request });

        if (options.throwApplication) {
          throw new Error(UNSAFE_ERROR_TEXT);
        }

        return options.applicationResult || successApplicationResult();
      },
    },
  });
}

function assertNoUnsafeText(value) {
  const serialized = JSON.stringify(value);

  for (const marker of [
    'unsafe dependency detail',
    'unsafe customer contact',
    'unsafe stack detail',
    'unsafe infrastructure detail',
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

test('allowed authorization calls application service and returns safe success', async () => {
  const calls = [];
  const orchestrator = createOrchestrator(calls);

  const result = await orchestrator.submitDraftToCase(requestInput());

  assert.deepEqual(calls.map(({ dependency }) => dependency), ['authorizationGate', 'applicationService']);
  assert.equal(calls[0].input.organizationId, 'org-1214');
  assert.equal(calls[0].input.actorId, 'actor-1214');
  assert.equal(calls[0].input.repairIntakeDraftId, 'draft-1214');
  assertNoUnsafeText(calls[0].input);
  assert.equal(calls[1].input.organizationId, 'org-1214');
  assert.equal(calls[1].input.actorId, 'actor-1214');
  assert.equal(calls[1].input.repairIntakeDraftId, 'draft-1214');
  assertNoUnsafeText(calls[1].input);
  assert.equal(result.ok, true);
  assert.equal(result.allowed, true);
  assert.equal(result.submitted, true);
  assert.equal(result.status, 'created');
  assert.equal(result.caseId, 'case-1214');
  assert.equal(result.authorizationStatus, 'allowed');
  assert.equal(result.applicationStatus, 'created');
  assert.deepEqual(result.metadata, { safeKey: 'safe app metadata' });
  assert.deepEqual(result.warnings, ['safe app warning']);
  assertNoUnsafeText(result);
});

test('denied authorization does not call application service', async () => {
  const calls = [];
  const orchestrator = createOrchestrator(calls, {
    authorizationResult: {
      allowed: false,
      status: 'denied',
      reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_AUTHORIZATION_GATE_DENIED',
      requiredActions: ['request_permission_review'],
      rawRows: [{ phone: 'hidden' }],
    },
  });

  const result = await orchestrator.submitDraftToCase(requestInput());

  assert.deepEqual(calls.map(({ dependency }) => dependency), ['authorizationGate']);
  assert.equal(result.ok, false);
  assert.equal(result.allowed, false);
  assert.equal(result.status, 'denied');
  assert.equal(result.applicationStatus, null);
  assertNoUnsafeText(result);
});

test('authorization invalid input does not call application service', async () => {
  const calls = [];
  const orchestrator = createOrchestrator(calls, {
    authorizationResult: {
      allowed: false,
      status: 'invalid_input',
      reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_AUTHORIZATION_GATE_ORGANIZATION_REQUIRED',
      rawRows: [{ phone: 'hidden' }],
    },
  });

  const result = await orchestrator.submitDraftToCase(requestInput({ organizationId: '' }));

  assert.deepEqual(calls.map(({ dependency }) => dependency), ['authorizationGate']);
  assert.equal(result.ok, false);
  assert.equal(result.status, 'invalid_input');
  assert.equal(result.applicationStatus, null);
  assertNoUnsafeText(result);
});

test('authorization throws and returns generic safe failure without raw leakage', async () => {
  const calls = [];
  const orchestrator = createOrchestrator(calls, { throwAuthorization: true });

  const result = await orchestrator.submitDraftToCase(requestInput());

  assert.deepEqual(calls.map(({ dependency }) => dependency), ['authorizationGate']);
  assert.equal(result.ok, false);
  assert.equal(result.status, 'failed');
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_ORCHESTRATOR_AUTHORIZATION_FAILED');
  assert.equal(result.applicationStatus, null);
  assertNoUnsafeText(result);
});

test('missing authorization gate returns invalid_dependency', async () => {
  const orchestrator = createRepairIntakeDraftToCaseOrchestrator({
    draftToCaseApplicationService: { async submitDraftToCase() { return successApplicationResult(); } },
  });

  const result = await orchestrator.submitDraftToCase(requestInput());

  assert.equal(result.status, 'invalid_dependency');
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_ORCHESTRATOR_AUTHORIZATION_GATE_REQUIRED');
  assertNoUnsafeText(result);
});

test('missing application service returns invalid_dependency', async () => {
  const orchestrator = createRepairIntakeDraftToCaseOrchestrator({
    authorizationGate: { async authorizeDraftToCase() { return allowedAuthorizationResult(); } },
  });

  const result = await orchestrator.submitDraftToCase(requestInput());

  assert.equal(result.status, 'invalid_dependency');
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_ORCHESTRATOR_APPLICATION_SERVICE_REQUIRED');
  assertNoUnsafeText(result);
});

test('authorization gate missing required method returns invalid_dependency', async () => {
  const orchestrator = createRepairIntakeDraftToCaseOrchestrator({
    authorizationGate: {},
    draftToCaseApplicationService: { async submitDraftToCase() { return successApplicationResult(); } },
  });

  const result = await orchestrator.submitDraftToCase(requestInput());

  assert.equal(result.status, 'invalid_dependency');
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_ORCHESTRATOR_AUTHORIZATION_METHOD_REQUIRED');
  assertNoUnsafeText(result);
});

test('application service missing required method returns invalid_dependency', async () => {
  const orchestrator = createRepairIntakeDraftToCaseOrchestrator({
    authorizationGate: { async authorizeDraftToCase() { return allowedAuthorizationResult(); } },
    draftToCaseApplicationService: {},
  });

  const result = await orchestrator.submitDraftToCase(requestInput());

  assert.equal(result.status, 'invalid_dependency');
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_ORCHESTRATOR_APPLICATION_METHOD_REQUIRED');
  assertNoUnsafeText(result);
});

test('application service skipped result is preserved safely', async () => {
  const calls = [];
  const orchestrator = createOrchestrator(calls, {
    applicationResult: {
      ok: false,
      submitted: false,
      status: 'skipped',
      reasonCode: 'REPAIR_INTAKE_CASE_REPOSITORY_CONSUMER_NOT_FOUND_OR_SKIPPED',
      requiredActions: ['manual_review'],
      repairIntakeDraftId: 'draft-1214',
      organizationId: 'org-1214',
      actorId: 'actor-1214',
      rawRows: [{ phone: 'hidden' }],
    },
  });

  const result = await orchestrator.submitDraftToCase(requestInput());

  assert.deepEqual(calls.map(({ dependency }) => dependency), ['authorizationGate', 'applicationService']);
  assert.equal(result.ok, false);
  assert.equal(result.allowed, true);
  assert.equal(result.status, 'skipped');
  assert.equal(result.applicationStatus, 'skipped');
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_CASE_REPOSITORY_CONSUMER_NOT_FOUND_OR_SKIPPED');
  assert.deepEqual(result.requiredActions, ['manual_review']);
  assertNoUnsafeText(result);
});

test('application service throws and returns generic safe failure without raw leakage', async () => {
  const calls = [];
  const orchestrator = createOrchestrator(calls, { throwApplication: true });

  const result = await orchestrator.submitDraftToCase(requestInput());

  assert.deepEqual(calls.map(({ dependency }) => dependency), ['authorizationGate', 'applicationService']);
  assert.equal(result.ok, false);
  assert.equal(result.allowed, true);
  assert.equal(result.status, 'failed');
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_ORCHESTRATOR_APPLICATION_FAILED');
  assertNoUnsafeText(result);
});

test('orchestrator does not mutate request object', async () => {
  const request = requestInput();
  const before = JSON.parse(JSON.stringify(request));
  const orchestrator = createOrchestrator([]);

  await orchestrator.submitDraftToCase(request);

  assert.deepEqual(request, before);
});

test('orchestrator does not mutate authorization result', async () => {
  const authorizationResult = allowedAuthorizationResult();
  const before = JSON.parse(JSON.stringify(authorizationResult));
  const orchestrator = createOrchestrator([], { authorizationResult });

  await orchestrator.submitDraftToCase(requestInput());

  assert.deepEqual(authorizationResult, before);
});

test('orchestrator does not mutate application service result', async () => {
  const applicationResult = successApplicationResult();
  const before = JSON.parse(JSON.stringify(applicationResult));
  const orchestrator = createOrchestrator([], { applicationResult });

  await orchestrator.submitDraftToCase(requestInput());

  assert.deepEqual(applicationResult, before);
});

test('unsafe raw fields from auth and app results are not leaked', async () => {
  const orchestrator = createOrchestrator([], {
    authorizationResult: {
      ...allowedAuthorizationResult(),
      metadata: { safeKey: 'safe auth metadata', token: 'hidden' },
      rawRows: [{ phone: 'hidden' }],
    },
    applicationResult: {
      ...successApplicationResult(),
      metadata: { safeKey: 'safe app metadata', token: 'hidden' },
      rawRows: [{ phone: 'hidden' }],
      stack: 'hidden',
      error: 'hidden',
    },
  });

  const result = await orchestrator.submitDraftToCase(requestInput());

  assert.equal(result.ok, true);
  assert.deepEqual(result.metadata, { safeKey: 'safe app metadata' });
  assertNoUnsafeText(result);
});
