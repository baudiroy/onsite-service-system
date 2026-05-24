'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  RepairIntakeCaseRepositoryContractError,
  createRepairIntakeCaseRepositoryContract,
} = require('../../src/repairIntake/repairIntakeCaseRepositoryContract');

const UNSAFE_ERROR_MESSAGE = [
  'SQL SELECT * FROM unsafe_case_contract_table',
  'DATABASE_URL=postgres://unsafe-case-contract',
  'phone +886900001079',
  'address unsafe case contract address',
  'customerName unsafe case contract customer',
  'lineUserId unsafe_case_contract_line',
  'lineAccessToken unsafe_case_contract_line_token',
  'finalAppointmentId unsafe_case_contract_final',
  'stack trace unsafe case contract',
].join(' ');

function unsafeCreationInput() {
  return {
    draftId: 'draft_task1079',
    organizationId: 'org_task1079',
    tenantId: 'tenant_task1079',
    requestId: 'req_task1079',
    actorId: 'actor_task1079',
    draft: {
      draftId: 'draft_task1079',
      organizationId: 'org_task1079',
      tenantId: 'tenant_task1079',
      status: 'ready',
      summary: {
        title: 'safe draft summary',
        phone: '+886900001079',
      },
      rawRows: [{ phone: '+886900001079' }],
      rawPlan: { phone: '+886900001079' },
    },
    plan: {
      status: 'planned',
      reasonCode: 'PLAN_READY_TASK1079',
      candidate: {
        sourceDraftId: 'draft_task1079',
        organizationId: 'org_task1079',
        customerPhone: '+886900001079',
      },
      summary: {
        title: 'safe plan summary',
        phone: '+886900001079',
      },
      rawRows: [{ phone: '+886900001079' }],
    },
    summary: {
      title: 'safe creation summary',
      phone: '+886900001079',
    },
    metadata: {
      safeKey: 'safe metadata',
      headers: {
        authorization: 'Bearer unsafe',
      },
    },
    warnings: ['safe warning'],
    raw: { phone: '+886900001079' },
    rawRows: [{ customerPhone: '+886900001079' }],
    sql: 'SELECT * FROM unsafe_creation',
    query: 'SELECT unsafe query',
    paramsSql: ['unsafe param'],
    db: 'unsafe db',
    databaseUrl: 'postgres://unsafe-case-contract',
    DATABASE_URL: 'postgres://unsafe-case-contract-uppercase',
    authorization: 'Bearer unsafe',
    cookie: 'unsafe cookie',
    headers: { authorization: 'Bearer unsafe' },
    phone: '+886900001079',
    address: 'unsafe case contract address',
    customerPhone: '+886900001079',
    customerName: 'unsafe case contract customer',
    lineUserId: 'unsafe_case_contract_line',
    lineAccessToken: 'unsafe_case_contract_line_token',
    finalAppointmentId: 'unsafe_case_contract_final',
    stack: 'unsafe case contract stack',
    error: new Error(UNSAFE_ERROR_MESSAGE),
    repository: { unsafe: true },
    connection: { unsafe: true },
  };
}

function createRepository(calls, options = {}) {
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
        caseId: 'case_task1079',
        caseRef: {
          caseId: 'case_task1079_ref',
          organizationId: 'org_task1079',
          finalAppointmentId: 'unsafe_case_contract_final',
        },
        draftId: 'draft_task1079',
        sourceDraftId: 'draft_task1079',
        organizationId: 'org_task1079',
        tenantId: 'tenant_task1079',
        requestId: 'req_task1079',
        actorId: 'actor_task1079',
        status: 'created',
        source: 'repair_intake',
        plan: {
          status: 'planned',
          reasonCode: 'PLAN_READY_TASK1079',
          rawRows: [{ phone: '+886900001079' }],
          rawPlan: { phone: '+886900001079' },
        },
        summary: {
          title: 'safe case summary',
          phone: '+886900001079',
        },
        metadata: {
          safeKey: 'safe result metadata',
          rawRows: [{ phone: '+886900001079' }],
        },
        warnings: ['safe result warning', '', 42],
        rawRows: [{ phone: '+886900001079' }],
        sql: 'SELECT * FROM unsafe_result',
        query: 'SELECT unsafe query',
        paramsSql: ['unsafe param'],
        db: 'unsafe db',
        databaseUrl: 'postgres://unsafe-case-contract',
        DATABASE_URL: 'postgres://unsafe-case-contract-uppercase',
        authorization: 'Bearer unsafe',
        cookie: 'unsafe cookie',
        headers: { authorization: 'Bearer unsafe' },
        phone: '+886900001079',
        address: 'unsafe case contract address',
        customerPhone: '+886900001079',
        customerName: 'unsafe case contract customer',
        lineUserId: 'unsafe_case_contract_line',
        lineAccessToken: 'unsafe_case_contract_line_token',
        finalAppointmentId: 'unsafe_case_contract_final',
        stack: 'unsafe case contract stack',
        error: new Error(UNSAFE_ERROR_MESSAGE),
        repository: { unsafe: true },
        connection: { unsafe: true },
      };
    },
  };
}

function assertNoUnsafeText(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'SELECT *',
    'unsafe_case_contract_table',
    'unsafe_creation',
    'unsafe_result',
    'unsafe query',
    'unsafe param',
    'DATABASE_URL',
    'databaseUrl',
    'postgres://',
    '+886900001079',
    'unsafe case contract address',
    'unsafe case contract customer',
    'unsafe_case_contract_line',
    'unsafe_case_contract_line_token',
    'unsafe_case_contract_final',
    'unsafe case contract stack',
    'stack trace',
    'Bearer unsafe',
    'unsafe cookie',
    'rawRows',
    'rawPlan',
    'rawDraft',
    'raw',
    'sql',
    'query',
    'paramsSql',
    'db',
    'authorization',
    'cookie',
    'headers',
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

test('factory requires injected createCaseFromDraft dependency', () => {
  for (const options of [
    undefined,
    null,
    {},
    { caseRepository: null },
    { caseRepository: {} },
    { repository: { createCaseFromDraft: 'not-a-function' } },
    { createCaseFromDraft: 'not-a-function' },
  ]) {
    assert.throws(
      () => createRepairIntakeCaseRepositoryContract(options),
      (error) => {
        assert.equal(error instanceof RepairIntakeCaseRepositoryContractError, true);
        assert.equal(error.reasonCode, 'REPAIR_INTAKE_CASE_REPOSITORY_CONTRACT_REQUIRED');
        assert.deepEqual(error.requiredActions, ['configure_create_case_from_draft']);
        assertNoUnsafeText(error);
        return true;
      },
    );
  }
});

test('createCaseFromDraft forwards only sanitized creation fields', async () => {
  const calls = [];
  const contract = createRepairIntakeCaseRepositoryContract({
    caseRepository: createRepository(calls),
  });

  const result = await contract.createCaseFromDraft(unsafeCreationInput());

  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], {
    draftId: 'draft_task1079',
    organizationId: 'org_task1079',
    tenantId: 'tenant_task1079',
    requestId: 'req_task1079',
    actorId: 'actor_task1079',
    draft: {
      draftId: 'draft_task1079',
      organizationId: 'org_task1079',
      tenantId: 'tenant_task1079',
      status: 'ready',
      summary: {
        title: 'safe draft summary',
      },
    },
    plan: {
      status: 'planned',
      reasonCode: 'PLAN_READY_TASK1079',
      candidate: {
        sourceDraftId: 'draft_task1079',
        organizationId: 'org_task1079',
      },
      summary: {
        title: 'safe plan summary',
      },
    },
    summary: {
      title: 'safe creation summary',
    },
    metadata: {
      safeKey: 'safe metadata',
    },
    warnings: ['safe warning'],
  });
  assert.equal(result.ok, true);
  assert.equal(result.caseId, 'case_task1079');
  assert.equal(result.organizationId, 'org_task1079');
  assert.equal(result.tenantId, 'tenant_task1079');
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_CASE_REPOSITORY_CONTRACT_CASE_CREATED');
  assert.deepEqual(result.summary, { title: 'safe case summary' });
  assert.deepEqual(result.metadata, { safeKey: 'safe result metadata' });
  assert.deepEqual(result.warnings, ['safe result warning']);
  assertNoUnsafeText(calls);
  assertNoUnsafeText(result);
});

test('factory accepts repository-like object directly', async () => {
  const calls = [];
  const contract = createRepairIntakeCaseRepositoryContract(createRepository(calls));

  const result = await contract.createCaseFromDraft(unsafeCreationInput());

  assert.equal(calls.length, 1);
  assert.equal(result.ok, true);
  assertNoUnsafeText(calls);
  assertNoUnsafeText(result);
});

test('invalid creation input fails closed before repository call', async () => {
  for (const invalidInput of [
    undefined,
    null,
    'input',
    42,
    true,
    [],
    () => {},
    {},
    { draft: {}, plan: null },
    { draft: null, plan: {} },
  ]) {
    const calls = [];
    const contract = createRepairIntakeCaseRepositoryContract({
      caseRepository: createRepository(calls),
    });

    const result = await contract.createCaseFromDraft(invalidInput);

    assert.equal(result.ok, false);
    assert.equal(result.reasonCode, 'REPAIR_INTAKE_CASE_REPOSITORY_CONTRACT_INPUT_INVALID');
    assert.deepEqual(calls, []);
    assertNoUnsafeText(result);
  }
});

test('null and non-object creation results return sanitized create failure envelopes', async () => {
  const calls = [];
  const contract = createRepairIntakeCaseRepositoryContract({
    repository: createRepository(calls, { invalidResult: true }),
  });

  const result = await contract.createCaseFromDraft(unsafeCreationInput());

  assert.equal(calls.length, 1);
  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_CASE_REPOSITORY_CONTRACT_CREATE_FAILED');
  assert.deepEqual(result.requiredActions, ['retry_or_manual_review']);
  assertNoUnsafeText(calls);
  assertNoUnsafeText(result);
});

test('thrown and rejected create errors return sanitized create failure envelopes', async () => {
  for (const options of [{ throwCreate: true }, { rejectCreate: true }]) {
    const calls = [];
    const contract = createRepairIntakeCaseRepositoryContract({
      caseRepository: createRepository(calls, options),
    });

    const result = await contract.createCaseFromDraft(unsafeCreationInput());

    assert.equal(calls.length, 1);
    assert.equal(result.ok, false);
    assert.equal(result.reasonCode, 'REPAIR_INTAKE_CASE_REPOSITORY_CONTRACT_CREATE_FAILED');
    assert.deepEqual(result.requiredActions, ['retry_or_manual_review']);
    assertNoUnsafeText(calls);
    assertNoUnsafeText(result);
  }
});
