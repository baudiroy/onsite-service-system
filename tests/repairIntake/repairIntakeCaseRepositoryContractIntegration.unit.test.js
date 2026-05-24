'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createRepairIntakeCaseRepository,
} = require('../../src/repairIntake/repairIntakeCaseRepository');
const {
  createRepairIntakeCaseRepositoryContract,
} = require('../../src/repairIntake/repairIntakeCaseRepositoryContract');

function createContractChain(caseCreationPort) {
  const repository = createRepairIntakeCaseRepository({ caseCreationPort });
  const repositoryCalls = [];
  const contract = createRepairIntakeCaseRepositoryContract({
    caseRepository: {
      async createCaseFromDraft(input) {
        repositoryCalls.push(input);
        return repository.createCaseFromDraft(input);
      },
    },
  });

  return { contract, repositoryCalls };
}

function hasMarker(value, marker) {
  return JSON.stringify(value).includes(marker);
}

function assertNoUnsafeMarkers(value) {
  for (const marker of [
    'finalAppointmentId',
    'final_appointment_id',
    'DATABASE_URL',
    'lineAccessToken',
    'lineUserId',
    'customerName',
    'customerPhone',
    'phone',
    'address',
    'authorization',
    'cookie',
    'headers',
    'query',
    'rawDraft',
    'rawPlan',
    'rawRow',
    'rawRows',
    'sql',
    'stack',
    'token',
  ]) {
    assert.equal(hasMarker(value, marker), false, `unsafe marker leaked: ${marker}`);
  }
}

test('success path composes synthetic caseCreationPort through repository and contract', async () => {
  const dependencyCalls = [];
  const { contract, repositoryCalls } = createContractChain({
    async createCaseFromDraft(input) {
      dependencyCalls.push(input);
      return {
        caseId: 'case-1207',
        caseRef: {
          caseId: 'case-1207',
          displayId: 'CASE-1207',
          rawRow: { sql: 'hidden' },
        },
        draftId: input.draftId,
        sourceDraftId: input.sourceDraftId,
        organizationId: input.organizationId,
        tenantId: input.tenantId,
        requestId: input.requestId,
        actorId: input.actorId,
        status: 'created',
        summary: { safe: true, customerPhone: 'hidden' },
        metadata: { safe: true, token: 'hidden' },
        warnings: ['safe-warning'],
        finalAppointmentId: 'appt-hidden',
      };
    },
  });

  const result = await contract.createCaseFromDraft({
    draft: {
      draftId: 'draft-1207',
      organizationId: 'org-1207',
      tenantId: 'tenant-1207',
      source: 'repair-intake',
      rawDraft: { token: 'hidden' },
      customerPhone: 'hidden',
      query: 'hidden',
    },
    plan: {
      status: 'ready',
      candidate: {
        sourceDraftId: 'draft-1207',
        organizationId: 'org-1207',
        tenantId: 'tenant-1207',
      },
      query: 'hidden',
      rawPlan: { sql: 'hidden' },
    },
    requestId: 'req-1207',
    actorId: 'actor-1207',
    authorization: 'hidden',
    finalAppointmentId: 'appt-hidden',
  });

  assert.equal(repositoryCalls.length, 1);
  assert.equal(dependencyCalls.length, 1);
  assert.equal(dependencyCalls[0].draftId, 'draft-1207');
  assert.equal(dependencyCalls[0].sourceDraftId, 'draft-1207');
  assert.equal(dependencyCalls[0].organizationId, 'org-1207');
  assert.equal(dependencyCalls[0].tenantId, 'tenant-1207');
  assert.equal(dependencyCalls[0].requestId, 'req-1207');
  assert.equal(dependencyCalls[0].actorId, 'actor-1207');
  assert.equal(hasMarker(repositoryCalls[0], 'finalAppointmentId'), false);
  assert.equal(hasMarker(repositoryCalls[0], 'authorization'), false);
  assertNoUnsafeMarkers(dependencyCalls[0]);

  assert.equal(result.ok, true);
  assert.equal(result.caseId, 'case-1207');
  assert.equal(result.caseRef.caseId, 'case-1207');
  assert.equal(result.draftId, 'draft-1207');
  assert.equal(result.sourceDraftId, 'draft-1207');
  assert.equal(result.organizationId, 'org-1207');
  assert.equal(result.tenantId, 'tenant-1207');
  assert.equal(result.requestId, 'req-1207');
  assert.equal(result.actorId, 'actor-1207');
  assert.equal(result.status, 'created');
  assert.deepEqual(result.metadata, { safe: true });
  assert.deepEqual(result.warnings, ['safe-warning']);
  assertNoUnsafeMarkers(result);
});

test('invalid input fails before repository and dependency calls', async () => {
  const dependencyCalls = [];
  const { contract, repositoryCalls } = createContractChain({
    async createCaseFromDraft(input) {
      dependencyCalls.push(input);
      return { caseId: 'case-should-not-run' };
    },
  });

  const result = await contract.createCaseFromDraft({ draft: { draftId: 'draft-invalid' } });

  assert.equal(repositoryCalls.length, 0);
  assert.equal(dependencyCalls.length, 0);
  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_CASE_REPOSITORY_CONTRACT_INPUT_INVALID');
  assertNoUnsafeMarkers(result);
});

test('null dependency result is sanitized through repository and contract', async () => {
  const dependencyCalls = [];
  const { contract, repositoryCalls } = createContractChain({
    async createCaseFromDraft(input) {
      dependencyCalls.push(input);
      return null;
    },
  });

  const result = await contract.createCaseFromDraft({
    draft: { draftId: 'draft-null', organizationId: 'org-null' },
    plan: { status: 'ready' },
  });

  assert.equal(repositoryCalls.length, 1);
  assert.equal(dependencyCalls.length, 1);
  assert.equal(result.caseId, null);
  assert.equal(result.status, 'failed');
  assert.equal(result.draftId, 'draft-null');
  assert.equal(result.organizationId, 'org-null');
  assertNoUnsafeMarkers(result);
});

test('thrown dependency error is sanitized through repository and contract', async () => {
  const dependencyCalls = [];
  const { contract, repositoryCalls } = createContractChain({
    async createCaseFromDraft(input) {
      dependencyCalls.push(input);
      throw new Error('DATABASE_URL token stack sql phone lineAccessToken finalAppointmentId');
    },
  });

  const result = await contract.createCaseFromDraft({
    draft: { draftId: 'draft-throw', organizationId: 'org-throw' },
    plan: { status: 'ready' },
  });

  assert.equal(repositoryCalls.length, 1);
  assert.equal(dependencyCalls.length, 1);
  assert.equal(result.caseId, null);
  assert.equal(result.status, 'failed');
  assert.equal(result.draftId, 'draft-throw');
  assert.equal(result.organizationId, 'org-throw');
  assertNoUnsafeMarkers(result);
});
