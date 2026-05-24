'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createRepairIntakeDraftToCaseInjectedConsumerApplicationService,
} = require('../../src/repairIntake/repairIntakeDraftToCaseApplicationService');

const UNSAFE_ERROR_TEXT = [
  'unsafe infrastructure detail',
  'unsafe customer contact',
  'unsafe stack detail',
  'unsafe dependency detail',
].join(' ');

function requestInput(overrides = {}) {
  return {
    organizationId: 'org-1212',
    actorId: 'actor-1212',
    repairIntakeDraftId: 'draft-1212',
    requestId: 'req-1212',
    tenantId: 'tenant-1212',
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
    warnings: ['safe request warning'],
    raw: { phone: 'hidden' },
    headers: { authorization: 'hidden' },
    ...overrides,
  };
}

function assertNoUnsafeText(value) {
  const serialized = JSON.stringify(value);

  for (const marker of [
    'unsafe infrastructure detail',
    'unsafe customer contact',
    'unsafe stack detail',
    'unsafe dependency detail',
    'hidden',
    'rawRows',
    'raw',
    'headers',
    'authorization',
    'customerPhone',
    'phone',
    'stack',
    'error',
  ]) {
    assert.equal(serialized.includes(marker), false, `leaked unsafe marker ${marker}`);
  }
}

test('valid request and successful synthetic consumer returns safe success envelope', async () => {
  const calls = [];
  const service = createRepairIntakeDraftToCaseInjectedConsumerApplicationService({
    caseRepositoryConsumer: {
      async createCaseFromDraft(input) {
        calls.push(input);

        return {
          ok: true,
          status: 'created',
          reasonCode: 'REPAIR_INTAKE_CASE_REPOSITORY_CONSUMER_CASE_READY',
          caseId: 'case-1212',
          caseRef: {
            caseId: 'case-1212',
            displayId: 'CASE-1212',
            rawRows: [{ phone: 'hidden' }],
          },
          draftId: input.draftId,
          sourceDraftId: input.sourceDraftId,
          organizationId: input.organizationId,
          tenantId: input.tenantId,
          requestId: input.requestId,
          actorId: input.actorId,
          summary: { title: 'safe case summary', phone: 'hidden' },
          metadata: { safeKey: 'safe consumer metadata', headers: { authorization: 'hidden' } },
          warnings: ['safe consumer warning'],
        };
      },
    },
  });

  const result = await service.submitDraftToCase(requestInput());

  assert.equal(calls.length, 1);
  assert.equal(calls[0].draftId, 'draft-1212');
  assert.equal(calls[0].sourceDraftId, 'draft-1212');
  assert.equal(calls[0].organizationId, 'org-1212');
  assert.equal(calls[0].actorId, 'actor-1212');
  assert.equal(calls[0].draft.status, 'ready');
  assert.equal(calls[0].plan.status, 'repository_consumer_ready');
  assertNoUnsafeText(calls[0]);

  assert.equal(result.ok, true);
  assert.equal(result.action, 'repair_intake_draft_to_case_consumer_submit');
  assert.equal(result.submitted, true);
  assert.equal(result.caseId, 'case-1212');
  assert.equal(result.caseRef.caseId, 'case-1212');
  assert.equal(result.repairIntakeDraftId, 'draft-1212');
  assert.equal(result.organizationId, 'org-1212');
  assert.equal(result.actorId, 'actor-1212');
  assert.deepEqual(result.metadata, { safeKey: 'safe consumer metadata' });
  assert.deepEqual(result.warnings, ['safe consumer warning']);
  assertNoUnsafeText(result);
});

test('missing organizationId returns safe invalid_input envelope and does not call consumer', async () => {
  const calls = [];
  const service = createRepairIntakeDraftToCaseInjectedConsumerApplicationService({
    caseRepositoryConsumer: {
      async createCaseFromDraft(input) {
        calls.push(input);
        return { ok: true, caseId: 'case-should-not-run' };
      },
    },
  });

  const result = await service.submitDraftToCase(requestInput({ organizationId: '' }));

  assert.deepEqual(calls, []);
  assert.equal(result.ok, false);
  assert.equal(result.status, 'invalid_input');
  assert.equal(
    result.reasonCode,
    'REPAIR_INTAKE_DRAFT_TO_CASE_CONSUMER_APPLICATION_SERVICE_ORGANIZATION_REQUIRED',
  );
  assertNoUnsafeText(result);
});

test('missing actorId returns safe invalid_input envelope and does not call consumer', async () => {
  const calls = [];
  const service = createRepairIntakeDraftToCaseInjectedConsumerApplicationService({
    caseRepositoryConsumer: {
      async createCaseFromDraft(input) {
        calls.push(input);
        return { ok: true, caseId: 'case-should-not-run' };
      },
    },
  });

  const result = await service.submitDraftToCase(requestInput({ actorId: null }));

  assert.deepEqual(calls, []);
  assert.equal(result.ok, false);
  assert.equal(result.status, 'invalid_input');
  assert.equal(
    result.reasonCode,
    'REPAIR_INTAKE_DRAFT_TO_CASE_CONSUMER_APPLICATION_SERVICE_ACTOR_REQUIRED',
  );
  assertNoUnsafeText(result);
});

test('missing repairIntakeDraftId returns safe invalid_input envelope and does not call consumer', async () => {
  const calls = [];
  const service = createRepairIntakeDraftToCaseInjectedConsumerApplicationService({
    caseRepositoryConsumer: {
      async createCaseFromDraft(input) {
        calls.push(input);
        return { ok: true, caseId: 'case-should-not-run' };
      },
    },
  });

  const result = await service.submitDraftToCase(requestInput({ repairIntakeDraftId: undefined }));

  assert.deepEqual(calls, []);
  assert.equal(result.ok, false);
  assert.equal(result.status, 'invalid_input');
  assert.equal(
    result.reasonCode,
    'REPAIR_INTAKE_DRAFT_TO_CASE_CONSUMER_APPLICATION_SERVICE_DRAFT_REQUIRED',
  );
  assertNoUnsafeText(result);
});

test('invalid draftInput object returns safe invalid_input envelope and does not call consumer', async () => {
  const calls = [];
  const service = createRepairIntakeDraftToCaseInjectedConsumerApplicationService({
    caseRepositoryConsumer: {
      async createCaseFromDraft(input) {
        calls.push(input);
        return { ok: true, caseId: 'case-should-not-run' };
      },
    },
  });

  const result = await service.submitDraftToCase(requestInput({ draftInput: 'invalid' }));

  assert.deepEqual(calls, []);
  assert.equal(result.ok, false);
  assert.equal(result.status, 'invalid_input');
  assert.equal(
    result.reasonCode,
    'REPAIR_INTAKE_DRAFT_TO_CASE_CONSUMER_APPLICATION_SERVICE_DRAFT_INPUT_INVALID',
  );
  assertNoUnsafeText(result);
});

test('missing consumer returns safe invalid_dependency envelope', async () => {
  const service = createRepairIntakeDraftToCaseInjectedConsumerApplicationService();

  const result = await service.submitDraftToCase(requestInput());

  assert.equal(result.ok, false);
  assert.equal(result.status, 'invalid_dependency');
  assert.equal(
    result.reasonCode,
    'REPAIR_INTAKE_DRAFT_TO_CASE_CONSUMER_APPLICATION_SERVICE_CONSUMER_REQUIRED',
  );
  assert.deepEqual(result.requiredActions, ['configure_case_repository_consumer']);
  assertNoUnsafeText(result);
});

test('consumer missing required method returns safe invalid_dependency envelope', async () => {
  const service = createRepairIntakeDraftToCaseInjectedConsumerApplicationService({
    caseRepositoryConsumer: {},
  });

  const result = await service.submitDraftToCase(requestInput());

  assert.equal(result.ok, false);
  assert.equal(result.status, 'invalid_dependency');
  assert.equal(
    result.reasonCode,
    'REPAIR_INTAKE_DRAFT_TO_CASE_CONSUMER_APPLICATION_SERVICE_CONSUMER_METHOD_REQUIRED',
  );
  assert.deepEqual(result.requiredActions, ['configure_case_repository_consumer']);
  assertNoUnsafeText(result);
});

test('consumer skipped result preserves safe skipped semantics', async () => {
  const service = createRepairIntakeDraftToCaseInjectedConsumerApplicationService({
    caseRepositoryConsumer: {
      async createCaseFromDraft(input) {
        return {
          ok: false,
          status: 'skipped',
          reasonCode: 'REPAIR_INTAKE_CASE_REPOSITORY_CONSUMER_NOT_FOUND_OR_SKIPPED',
          requiredActions: ['manual_review'],
          draftId: input.draftId,
          sourceDraftId: input.sourceDraftId,
          organizationId: input.organizationId,
          actorId: input.actorId,
          rawRows: [{ phone: 'hidden' }],
        };
      },
    },
  });

  const result = await service.submitDraftToCase(requestInput());

  assert.equal(result.ok, false);
  assert.equal(result.status, 'skipped');
  assert.equal(result.submitted, false);
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_CASE_REPOSITORY_CONSUMER_NOT_FOUND_OR_SKIPPED');
  assert.deepEqual(result.requiredActions, ['manual_review']);
  assert.equal(result.repairIntakeDraftId, 'draft-1212');
  assertNoUnsafeText(result);
});

test('consumer throws and service returns generic safe failed envelope without raw error leakage', async () => {
  const service = createRepairIntakeDraftToCaseInjectedConsumerApplicationService({
    caseRepositoryConsumer: {
      async createCaseFromDraft() {
        throw new Error(UNSAFE_ERROR_TEXT);
      },
    },
  });

  const result = await service.submitDraftToCase(requestInput());

  assert.equal(result.ok, false);
  assert.equal(result.status, 'failed');
  assert.equal(
    result.reasonCode,
    'REPAIR_INTAKE_DRAFT_TO_CASE_CONSUMER_APPLICATION_SERVICE_CONSUMER_FAILED',
  );
  assertNoUnsafeText(result);
});

test('service does not mutate request object', async () => {
  const request = requestInput();
  const before = JSON.parse(JSON.stringify(request));
  const service = createRepairIntakeDraftToCaseInjectedConsumerApplicationService({
    caseRepositoryConsumer: {
      async createCaseFromDraft(input) {
        return {
          ok: true,
          caseId: 'case-immutable-request-1212',
          draftId: input.draftId,
          sourceDraftId: input.sourceDraftId,
          organizationId: input.organizationId,
          actorId: input.actorId,
        };
      },
    },
  });

  await service.submitDraftToCase(request);

  assert.deepEqual(request, before);
});

test('service does not mutate consumer result object', async () => {
  const consumerResult = {
    ok: true,
    caseId: 'case-immutable-result-1212',
    caseRef: {
      caseId: 'case-immutable-result-1212',
      rawRows: [{ phone: 'hidden' }],
    },
    draftId: 'draft-1212',
    organizationId: 'org-1212',
    metadata: {
      safeKey: 'safe immutable result metadata',
      headers: { authorization: 'hidden' },
    },
    warnings: ['safe immutable result warning'],
    rawRows: [{ phone: 'hidden' }],
  };
  const before = JSON.parse(JSON.stringify(consumerResult));
  const service = createRepairIntakeDraftToCaseInjectedConsumerApplicationService({
    caseRepositoryConsumer: {
      async createCaseFromDraft() {
        return consumerResult;
      },
    },
  });

  const result = await service.submitDraftToCase(requestInput());

  assert.equal(result.ok, true);
  assert.deepEqual(consumerResult, before);
  assertNoUnsafeText(result);
});
