'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

const {
  createRepairIntakeCaseRepositoryContract,
} = require('../../src/repairIntake/repairIntakeCaseRepositoryContract');
const {
  createRepairIntakeCaseCreatorPortAdapter,
} = require('../../src/repairIntake/repairIntakeCaseCreatorPortAdapter');

const UNSAFE_ERROR_MESSAGE = [
  'SQL SELECT * FROM unsafe_task1081_table',
  'DATABASE_URL=postgres://unsafe-task1081',
  'phone +886900001081',
  'address unsafe task1081 address',
  'customerName unsafe task1081 customer',
  'lineUserId unsafe_task1081_line',
  'lineAccessToken unsafe_task1081_line_token',
  'finalAppointmentId unsafe_task1081_final',
  'stack trace unsafe task1081',
].join(' ');

function unsafeCreationInput() {
  return {
    draftId: 'draft_task1081',
    organizationId: 'org_task1081',
    tenantId: 'tenant_task1081',
    requestId: 'req_task1081',
    actorId: 'actor_task1081',
    draft: {
      id: 'draft_task1081',
      draftId: 'draft_task1081',
      organizationId: 'org_task1081',
      tenantId: 'tenant_task1081',
      status: 'ready',
      summary: {
        title: 'safe draft summary task1081',
        phone: '+886900001081',
      },
      rawRows: [{ phone: '+886900001081' }],
    },
    plan: {
      status: 'planned',
      reasonCode: 'PLAN_READY_TASK1081',
      candidate: {
        sourceDraftId: 'draft_task1081',
        organizationId: 'org_task1081',
        tenantId: 'tenant_task1081',
        customerPhone: '+886900001081',
      },
      summary: {
        title: 'safe plan summary task1081',
        phone: '+886900001081',
      },
      rawRows: [{ phone: '+886900001081' }],
    },
    metadata: {
      safeKey: 'safe metadata task1081',
      authorization: 'Bearer unsafe_task1081',
    },
    warnings: ['safe warning task1081'],
    rawRows: [{ phone: '+886900001081' }],
    sql: 'SELECT * FROM unsafe_creation_task1081',
    databaseUrl: 'postgres://unsafe-task1081',
    authorization: 'Bearer unsafe_task1081',
    phone: '+886900001081',
    address: 'unsafe task1081 address',
    customerName: 'unsafe task1081 customer',
    lineUserId: 'unsafe_task1081_line',
    lineAccessToken: 'unsafe_task1081_line_token',
    finalAppointmentId: 'unsafe_task1081_final',
    stack: 'unsafe task1081 creation stack',
    repository: { unsafe: true },
  };
}

function createRawCaseRepository(calls, options = {}) {
  return {
    createCaseFromDraft: async (input) => {
      calls.push(input);

      if (options.throwCreate) {
        throw new Error(UNSAFE_ERROR_MESSAGE);
      }

      if (options.rejectCreate) {
        return Promise.reject(new Error(UNSAFE_ERROR_MESSAGE));
      }

      if (options.invalidResult) {
        return null;
      }

      return {
        caseId: 'case_task1081',
        caseRef: {
          caseId: 'case_task1081_ref',
          organizationId: 'org_task1081',
          finalAppointmentId: 'unsafe_task1081_final',
        },
        organizationId: 'org_task1081',
        tenantId: 'tenant_task1081',
        sourceDraftId: 'draft_task1081',
        status: 'created',
        source: 'repair_intake',
        summary: {
          title: 'safe case summary task1081',
          phone: '+886900001081',
        },
        metadata: {
          safeKey: 'safe result metadata task1081',
          rawRows: [{ phone: '+886900001081' }],
        },
        warnings: ['safe result warning task1081'],
        rawRows: [{ phone: '+886900001081' }],
        sql: 'SELECT * FROM unsafe_result_task1081',
        query: 'SELECT unsafe query task1081',
        paramsSql: ['unsafe param task1081'],
        db: 'unsafe db task1081',
        databaseUrl: 'postgres://unsafe-task1081',
        authorization: 'Bearer unsafe_task1081',
        phone: '+886900001081',
        address: 'unsafe task1081 address',
        customerName: 'unsafe task1081 customer',
        lineUserId: 'unsafe_task1081_line',
        lineAccessToken: 'unsafe_task1081_line_token',
        finalAppointmentId: 'unsafe_task1081_final',
        stack: 'unsafe task1081 stack',
        error: new Error(UNSAFE_ERROR_MESSAGE),
        repository: { unsafe: true },
        connection: { unsafe: true },
      };
    },
  };
}

function createInjectedCaseCreator(calls, repositoryOptions) {
  const caseRepositoryContract = createRepairIntakeCaseRepositoryContract({
    caseRepository: createRawCaseRepository(calls, repositoryOptions),
  });

  const caseCreator = createRepairIntakeCaseCreatorPortAdapter({
    caseCreationPort: caseRepositoryContract,
  });

  return { caseCreator, caseRepositoryContract };
}

function assertNoUnsafeText(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'SELECT *',
    'unsafe_task1081',
    'unsafe task1081',
    'postgres://unsafe-task1081',
    '+886900001081',
    'Bearer unsafe_task1081',
    'rawRows',
    'raw',
    'sql',
    'query',
    'paramsSql',
    'db',
    'databaseUrl',
    'DATABASE_URL',
    'authorization',
    'phone',
    'address',
    'customerPhone',
    'customerName',
    'lineUserId',
    'lineAccessToken',
    'finalAppointmentId',
    'stack',
    'error',
    'repository',
    'connection',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('contract can back caseCreator success path without forwarding unsafe creation or result fields', async () => {
  const calls = [];
  const { caseCreator } = createInjectedCaseCreator(calls);

  const result = await caseCreator.createCaseFromDraft(unsafeCreationInput());

  assert.equal(calls.length, 1);
  assert.equal(calls[0].draftId, 'draft_task1081');
  assert.equal(calls[0].organizationId, 'org_task1081');
  assert.equal(calls[0].tenantId, 'tenant_task1081');
  assert.equal(calls[0].requestId, 'req_task1081');
  assert.equal(calls[0].draft.summary.title, 'safe draft summary task1081');
  assert.equal(calls[0].plan.reasonCode, 'PLAN_READY_TASK1081');
  assert.equal(calls[0].plan.candidate.sourceDraftId, 'draft_task1081');
  assertNoUnsafeText(calls);

  assert.equal(result.ok, true);
  assert.equal(result.id, 'case_task1081');
  assert.equal(result.caseId, 'case_task1081');
  assert.equal(result.organizationId, 'org_task1081');
  assert.equal(result.tenantId, 'tenant_task1081');
  assert.equal(result.sourceDraftId, 'draft_task1081');
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_CASE_REPOSITORY_CONTRACT_CASE_CREATED');
  assert.deepEqual(result.summary, { title: 'safe case summary task1081' });
  assertNoUnsafeText(result);
});

test('contract invalid result envelope remains sanitized when consumed by caseCreator', async () => {
  const calls = [];
  const { caseCreator } = createInjectedCaseCreator(calls, { invalidResult: true });

  const result = await caseCreator.createCaseFromDraft(unsafeCreationInput());

  assert.equal(calls.length, 1);
  assert.equal(result.ok, false);
  assert.equal(result.status, 'failed');
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_CASE_REPOSITORY_CONTRACT_CREATE_FAILED');
  assert.deepEqual(result.requiredActions, ['retry_or_manual_review']);
  assertNoUnsafeText(calls);
  assertNoUnsafeText(result);
});

test('contract create failure envelope remains sanitized when raw case repository throws or rejects', async () => {
  for (const repositoryOptions of [{ throwCreate: true }, { rejectCreate: true }]) {
    const calls = [];
    const { caseCreator } = createInjectedCaseCreator(calls, repositoryOptions);

    const result = await caseCreator.createCaseFromDraft(unsafeCreationInput());

    assert.equal(calls.length, 1);
    assert.equal(result.ok, false);
    assert.equal(result.status, 'failed');
    assert.equal(result.reasonCode, 'REPAIR_INTAKE_CASE_REPOSITORY_CONTRACT_CREATE_FAILED');
    assert.deepEqual(result.requiredActions, ['retry_or_manual_review']);
    assertNoUnsafeText(calls);
    assertNoUnsafeText(result);
  }
});

test('integration test source stays limited to contract and caseCreator adapter imports', () => {
  const source = fs.readFileSync(__filename, 'utf8');
  const repairIntakeRequires = Array.from(
    source.matchAll(/require\('\.\.\/\.\.\/src\/repairIntake\/([^']+)'\)/g),
    (match) => match[1],
  );

  assert.deepEqual(repairIntakeRequires, [
    'repairIntakeCaseRepositoryContract',
    'repairIntakeCaseCreatorPortAdapter',
  ]);
});
