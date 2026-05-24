'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createRepairIntakeCaseRepositoryConsumer,
} = require('../../src/repairIntake/repairIntakeCaseRepositoryConsumer');

const UNSAFE_ERROR_TEXT = [
  'unsafe infrastructure detail',
  'unsafe token detail',
  'unsafe customer contact',
  'unsafe stack detail',
].join(' ');

function creationInput() {
  return {
    draftId: 'draft-1211',
    organizationId: 'org-1211',
    tenantId: 'tenant-1211',
    requestId: 'req-1211',
    actorId: 'actor-1211',
    draft: {
      draftId: 'draft-1211',
      organizationId: 'org-1211',
      tenantId: 'tenant-1211',
      status: 'ready',
      rawRows: [{ phone: 'hidden' }],
      customerPhone: 'hidden',
    },
    plan: {
      status: 'planned',
      sourceDraftId: 'draft-1211',
      organizationId: 'org-1211',
      rawPlan: { phone: 'hidden' },
      customerName: 'hidden',
    },
    metadata: {
      safeKey: 'safe metadata',
      headers: { authorization: 'hidden' },
    },
    warnings: ['safe warning'],
    raw: { token: 'hidden' },
    authorization: 'hidden',
  };
}

function assertNoUnsafeText(value) {
  const serialized = JSON.stringify(value);

  for (const marker of [
    'unsafe infrastructure detail',
    'unsafe token detail',
    'unsafe customer contact',
    'unsafe stack detail',
    'hidden',
    'rawRows',
    'rawPlan',
    'raw',
    'authorization',
    'customerPhone',
    'customerName',
    'token',
    'stack',
    'error',
    'headers',
  ]) {
    assert.equal(serialized.includes(marker), false, `leaked unsafe marker ${marker}`);
  }
}

test('OK injected synthetic repository returns safe success envelope', async () => {
  const calls = [];
  const consumer = createRepairIntakeCaseRepositoryConsumer({
    caseRepository: {
      async createCaseFromDraft(input) {
        calls.push(input);

        return {
          caseId: 'case-1211',
          caseRef: {
            caseId: 'case-1211',
            displayId: 'CASE-1211',
            rawRow: { phone: 'hidden' },
          },
          draftId: input.draftId,
          sourceDraftId: input.sourceDraftId,
          organizationId: input.organizationId,
          tenantId: input.tenantId,
          requestId: input.requestId,
          actorId: input.actorId,
          status: 'created',
          summary: { title: 'safe summary', customerPhone: 'hidden' },
          metadata: { safeKey: 'safe result metadata', headers: { authorization: 'hidden' } },
          warnings: ['safe result warning'],
          rawRows: [{ phone: 'hidden' }],
          authorization: 'hidden',
        };
      },
    },
  });

  const result = await consumer.createCaseFromDraft(creationInput());

  assert.equal(calls.length, 1);
  assert.equal(calls[0].draftId, 'draft-1211');
  assert.equal(calls[0].organizationId, 'org-1211');
  assertNoUnsafeText(calls[0]);
  assert.equal(result.ok, true);
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_CASE_REPOSITORY_CONSUMER_CASE_READY');
  assert.equal(result.caseId, 'case-1211');
  assert.equal(result.caseRef.caseId, 'case-1211');
  assert.equal(result.draftId, 'draft-1211');
  assert.equal(result.organizationId, 'org-1211');
  assert.equal(result.tenantId, 'tenant-1211');
  assert.equal(result.requestId, 'req-1211');
  assert.equal(result.actorId, 'actor-1211');
  assert.deepEqual(result.metadata, { safeKey: 'safe result metadata' });
  assert.deepEqual(result.warnings, ['safe result warning']);
  assertNoUnsafeText(result);
});

test('empty repository result returns safe non-success envelope', async () => {
  const consumer = createRepairIntakeCaseRepositoryConsumer({
    repository: {
      async createCaseFromDraft() {
        return {};
      },
    },
  });

  const result = await consumer.createCaseFromDraft(creationInput());

  assert.equal(result.ok, false);
  assert.equal(result.status, 'skipped');
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_CASE_REPOSITORY_CONSUMER_NOT_FOUND_OR_SKIPPED');
  assert.equal(result.caseId, null);
  assert.equal(result.caseRef, null);
  assert.equal(result.draftId, 'draft-1211');
  assertNoUnsafeText(result);
});

test('thrown repository error returns generic safe failure without raw error leakage', async () => {
  const consumer = createRepairIntakeCaseRepositoryConsumer({
    caseRepository: {
      async createCaseFromDraft() {
        throw new Error(UNSAFE_ERROR_TEXT);
      },
    },
  });

  const result = await consumer.createCaseFromDraft(creationInput());

  assert.equal(result.ok, false);
  assert.equal(result.status, 'failed');
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_CASE_REPOSITORY_CONSUMER_REPOSITORY_FAILED');
  assert.equal(result.caseId, null);
  assert.equal(result.caseRef, null);
  assertNoUnsafeText(result);
});

test('missing repository returns safe invalid-dependency result', async () => {
  const consumer = createRepairIntakeCaseRepositoryConsumer();

  const result = await consumer.createCaseFromDraft(creationInput());

  assert.equal(result.ok, false);
  assert.equal(result.status, 'invalid_dependency');
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_CASE_REPOSITORY_CONSUMER_REPOSITORY_REQUIRED');
  assert.deepEqual(result.requiredActions, ['configure_injected_case_repository']);
  assertNoUnsafeText(result);
});

test('missing required method returns safe invalid-dependency result', async () => {
  const consumer = createRepairIntakeCaseRepositoryConsumer({ caseRepository: {} });

  const result = await consumer.createCaseFromDraft(creationInput());

  assert.equal(result.ok, false);
  assert.equal(result.status, 'invalid_dependency');
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_CASE_REPOSITORY_CONSUMER_CREATE_METHOD_REQUIRED');
  assert.deepEqual(result.requiredActions, ['configure_injected_case_repository']);
  assertNoUnsafeText(result);
});

test('consumer does not mutate injected repository result object', async () => {
  const repositoryResult = {
    caseId: 'case-immutable-1211',
    caseRef: {
      caseId: 'case-immutable-1211',
      displayId: 'CASE-IMMUTABLE-1211',
      rawRows: [{ phone: 'hidden' }],
    },
    draftId: 'draft-1211',
    organizationId: 'org-1211',
    metadata: {
      safeKey: 'safe immutable metadata',
      headers: { authorization: 'hidden' },
    },
    warnings: ['safe immutable warning'],
    rawRows: [{ phone: 'hidden' }],
  };
  const before = JSON.parse(JSON.stringify(repositoryResult));
  const consumer = createRepairIntakeCaseRepositoryConsumer({
    caseRepository: {
      async createCaseFromDraft() {
        return repositoryResult;
      },
    },
  });

  const result = await consumer.createCaseFromDraft(creationInput());

  assert.equal(result.ok, true);
  assert.deepEqual(repositoryResult, before);
  assertNoUnsafeText(result);
});
