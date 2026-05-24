'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  RepairIntakeIdempotencyRepositoryContractError,
  createRepairIntakeIdempotencyRepositoryContract,
} = require('../../src/repairIntake/repairIntakeIdempotencyRepositoryContract');

const UNSAFE_ERROR_MESSAGE = [
  'SQL SELECT * FROM unsafe_idempotency_contract_table',
  'DATABASE_URL=postgres://unsafe-idempotency-contract',
  'phone +886900001085',
  'address unsafe idempotency contract address',
  'customerName unsafe idempotency contract customer',
  'lineUserId unsafe_idempotency_contract_line',
  'lineAccessToken unsafe_idempotency_contract_line_token',
  'finalAppointmentId unsafe_idempotency_contract_final',
  'stack trace unsafe idempotency contract',
].join(' ');

function unsafeLookupInput() {
  return {
    idempotencyKey: 'idem_task1085',
    draftId: 'draft_task1085',
    caseId: 'case_task1085_input',
    organizationId: 'org_task1085',
    tenantId: 'tenant_task1085',
    requestId: 'req_task1085',
    actorId: 'actor_task1085',
    status: 'submitted',
    metadata: {
      safeKey: 'safe lookup metadata',
      headers: {
        authorization: 'Bearer unsafe',
      },
    },
    warnings: ['safe lookup warning'],
    raw: { phone: '+886900001085' },
    rawRows: [{ customerPhone: '+886900001085' }],
    sql: 'SELECT * FROM unsafe_lookup',
    query: 'SELECT unsafe lookup query',
    paramsSql: ['unsafe param'],
    db: 'unsafe db',
    databaseUrl: 'postgres://unsafe-idempotency-contract',
    DATABASE_URL: 'postgres://unsafe-idempotency-contract-uppercase',
    authorization: 'Bearer unsafe',
    cookie: 'unsafe cookie',
    headers: { authorization: 'Bearer unsafe' },
    phone: '+886900001085',
    address: 'unsafe idempotency contract address',
    customerPhone: '+886900001085',
    customerName: 'unsafe idempotency contract customer',
    lineUserId: 'unsafe_idempotency_contract_line',
    lineAccessToken: 'unsafe_idempotency_contract_line_token',
    finalAppointmentId: 'unsafe_idempotency_contract_final',
    stack: 'unsafe idempotency contract stack',
    error: new Error(UNSAFE_ERROR_MESSAGE),
    repository: { unsafe: true },
    connection: { unsafe: true },
  };
}

function unsafeRecordInput() {
  return {
    ...unsafeLookupInput(),
    result: {
      ok: true,
      submitted: true,
      draftId: 'draft_task1085',
      caseId: 'case_task1085',
      organizationId: 'org_task1085',
      tenantId: 'tenant_task1085',
      status: 'submitted',
      reasonCode: 'SAFE_RESULT_READY_TASK1085',
      caseRef: {
        caseId: 'case_task1085_ref',
        organizationId: 'org_task1085',
        finalAppointmentId: 'unsafe_idempotency_contract_final',
      },
      metadata: {
        safeResultKey: 'safe record result metadata',
        rawRows: [{ phone: '+886900001085' }],
      },
      rawRows: [{ phone: '+886900001085' }],
      sql: 'SELECT * FROM unsafe_record_result',
      token: 'unsafe_record_result_token',
      lineAccessToken: 'unsafe_record_result_line_token',
      finalAppointmentId: 'unsafe_idempotency_contract_final',
      stack: 'unsafe record result stack',
    },
    caseRef: {
      caseId: 'case_task1085_ref',
      organizationId: 'org_task1085',
      finalAppointmentId: 'unsafe_idempotency_contract_final',
    },
  };
}

function createRepository(calls, options = {}) {
  return {
    findExistingDraftToCaseResult: async (input) => {
      calls.push({ name: 'findExistingDraftToCaseResult', input });

      if (options.throwFind) {
        throw new Error(UNSAFE_ERROR_MESSAGE);
      }

      if (options.rejectFind) {
        return Promise.reject(new Error(UNSAFE_ERROR_MESSAGE));
      }

      if (options.findNoExisting) {
        return null;
      }

      return {
        ok: true,
        idempotencyKey: 'idem_task1085',
        draftId: 'draft_task1085',
        caseId: 'case_task1085',
        organizationId: 'org_task1085',
        tenantId: 'tenant_task1085',
        requestId: 'req_task1085',
        actorId: 'actor_task1085',
        status: 'submitted',
        submitted: true,
        reasonCode: 'REPLAY_READY_TASK1085',
        requiredActions: ['safe action', '', 42],
        result: {
          draftId: 'draft_task1085',
          caseId: 'case_task1085',
          status: 'submitted',
          caseRef: {
            caseId: 'case_task1085_ref',
            organizationId: 'org_task1085',
            finalAppointmentId: 'unsafe_idempotency_contract_final',
          },
          rawRows: [{ phone: '+886900001085' }],
          sql: 'SELECT * FROM unsafe_find_result',
          token: 'unsafe_find_token',
        },
        caseRef: {
          caseId: 'case_task1085_ref',
          organizationId: 'org_task1085',
          finalAppointmentId: 'unsafe_idempotency_contract_final',
        },
        metadata: {
          safeKey: 'safe find result metadata',
          rawRows: [{ phone: '+886900001085' }],
        },
        warnings: ['safe find warning', '', 42],
        rawRows: [{ phone: '+886900001085' }],
        sql: 'SELECT * FROM unsafe_find',
        query: 'SELECT unsafe find query',
        paramsSql: ['unsafe param'],
        db: 'unsafe db',
        databaseUrl: 'postgres://unsafe-idempotency-contract',
        DATABASE_URL: 'postgres://unsafe-idempotency-contract-uppercase',
        authorization: 'Bearer unsafe',
        cookie: 'unsafe cookie',
        headers: { authorization: 'Bearer unsafe' },
        phone: '+886900001085',
        address: 'unsafe idempotency contract address',
        customerPhone: '+886900001085',
        customerName: 'unsafe idempotency contract customer',
        lineUserId: 'unsafe_idempotency_contract_line',
        lineAccessToken: 'unsafe_idempotency_contract_line_token',
        finalAppointmentId: 'unsafe_idempotency_contract_final',
        stack: 'unsafe idempotency contract stack',
        error: new Error(UNSAFE_ERROR_MESSAGE),
        repository: { unsafe: true },
        connection: { unsafe: true },
      };
    },
    recordDraftToCaseResult: async (input) => {
      calls.push({ name: 'recordDraftToCaseResult', input });

      if (options.throwRecord) {
        throw new Error(UNSAFE_ERROR_MESSAGE);
      }

      if (options.rejectRecord) {
        return Promise.reject(new Error(UNSAFE_ERROR_MESSAGE));
      }

      if (options.invalidRecordResult) {
        return null;
      }

      return {
        ok: true,
        recordId: 'record_task1085',
        idempotencyKey: 'idem_task1085',
        draftId: 'draft_task1085',
        caseId: 'case_task1085',
        organizationId: 'org_task1085',
        tenantId: 'tenant_task1085',
        requestId: 'req_task1085',
        actorId: 'actor_task1085',
        status: 'recorded',
        submitted: true,
        reasonCode: 'RECORDED_TASK1085',
        requiredActions: ['safe record action', '', 42],
        result: {
          draftId: 'draft_task1085',
          caseId: 'case_task1085',
          status: 'submitted',
          rawRows: [{ phone: '+886900001085' }],
          sql: 'SELECT * FROM unsafe_record_result',
        },
        caseRef: {
          caseId: 'case_task1085_ref',
          organizationId: 'org_task1085',
          finalAppointmentId: 'unsafe_idempotency_contract_final',
        },
        metadata: {
          safeKey: 'safe record result metadata',
          rawRows: [{ phone: '+886900001085' }],
        },
        warnings: ['safe record warning', '', 42],
        rawRows: [{ phone: '+886900001085' }],
        sql: 'SELECT * FROM unsafe_record',
        query: 'SELECT unsafe record query',
        paramsSql: ['unsafe param'],
        db: 'unsafe db',
        databaseUrl: 'postgres://unsafe-idempotency-contract',
        DATABASE_URL: 'postgres://unsafe-idempotency-contract-uppercase',
        authorization: 'Bearer unsafe',
        cookie: 'unsafe cookie',
        headers: { authorization: 'Bearer unsafe' },
        phone: '+886900001085',
        address: 'unsafe idempotency contract address',
        customerPhone: '+886900001085',
        customerName: 'unsafe idempotency contract customer',
        lineUserId: 'unsafe_idempotency_contract_line',
        lineAccessToken: 'unsafe_idempotency_contract_line_token',
        finalAppointmentId: 'unsafe_idempotency_contract_final',
        stack: 'unsafe idempotency contract stack',
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
    'unsafe_idempotency_contract_table',
    'unsafe_lookup',
    'unsafe_find',
    'unsafe_record',
    'unsafe query',
    'unsafe param',
    'DATABASE_URL',
    'databaseUrl',
    'postgres://',
    '+886900001085',
    'unsafe idempotency contract address',
    'unsafe idempotency contract customer',
    'unsafe_idempotency_contract_line',
    'unsafe_idempotency_contract_line_token',
    'unsafe_idempotency_contract_final',
    'unsafe idempotency contract stack',
    'unsafe record result stack',
    'stack trace',
    'Bearer unsafe',
    'unsafe cookie',
    'rawRows',
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
    'token',
    'error',
    'repository',
    'connection',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('factory requires injected idempotency repository methods', () => {
  for (const options of [
    undefined,
    null,
    {},
    { idempotencyRepository: null },
    { idempotencyRepository: {} },
    { idempotencyStore: { findExistingDraftToCaseResult: async () => null } },
    { repository: { recordDraftToCaseResult: async () => ({}) } },
    { findExistingDraftToCaseResult: 'not-a-function', recordDraftToCaseResult: async () => ({}) },
  ]) {
    assert.throws(
      () => createRepairIntakeIdempotencyRepositoryContract(options),
      (error) => {
        assert.equal(error instanceof RepairIntakeIdempotencyRepositoryContractError, true);
        assert.equal(error.reasonCode, 'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_CONTRACT_REQUIRED');
        assert.deepEqual(error.requiredActions, ['configure_idempotency_contract_methods']);
        assertNoUnsafeText(error);
        return true;
      },
    );
  }
});

test('findExistingDraftToCaseResult forwards only sanitized lookup fields and returns no-existing envelope', async () => {
  const calls = [];
  const contract = createRepairIntakeIdempotencyRepositoryContract({
    idempotencyRepository: createRepository(calls, { findNoExisting: true }),
  });

  const result = await contract.findExistingDraftToCaseResult(unsafeLookupInput());

  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], {
    name: 'findExistingDraftToCaseResult',
    input: {
      idempotencyKey: 'idem_task1085',
      draftId: 'draft_task1085',
      caseId: 'case_task1085_input',
      organizationId: 'org_task1085',
      tenantId: 'tenant_task1085',
      requestId: 'req_task1085',
      actorId: 'actor_task1085',
      status: 'submitted',
      metadata: {
        safeKey: 'safe lookup metadata',
      },
      warnings: ['safe lookup warning'],
    },
  });
  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_CONTRACT_NO_EXISTING_RESULT');
  assert.equal(result.idempotencyKey, 'idem_task1085');
  assert.equal(result.status, 'not_found');
  assertNoUnsafeText(calls);
  assertNoUnsafeText(result);
});

test('findExistingDraftToCaseResult returns sanitized replay-ready envelope', async () => {
  const calls = [];
  const contract = createRepairIntakeIdempotencyRepositoryContract(createRepository(calls));

  const result = await contract.findExistingDraftToCaseResult(unsafeLookupInput());

  assert.equal(calls.length, 1);
  assert.equal(result.ok, true);
  assert.equal(result.reasonCode, 'REPLAY_READY_TASK1085');
  assert.equal(result.idempotencyKey, 'idem_task1085');
  assert.equal(result.caseId, 'case_task1085');
  assert.equal(result.caseRef.caseId, 'case_task1085_ref');
  assert.deepEqual(result.metadata, { safeKey: 'safe find result metadata' });
  assert.deepEqual(result.warnings, ['safe find warning']);
  assertNoUnsafeText(calls);
  assertNoUnsafeText(result);
});

test('findExistingDraftToCaseResult invalid input fails closed before repository call', async () => {
  for (const invalidInput of [
    undefined,
    null,
    'input',
    42,
    true,
    [],
    () => {},
    {},
    { idempotencyKey: '' },
    { draftId: 'draft_task1085' },
  ]) {
    const calls = [];
    const contract = createRepairIntakeIdempotencyRepositoryContract({
      repository: createRepository(calls),
    });

    const result = await contract.findExistingDraftToCaseResult(invalidInput);

    assert.equal(result.ok, false);
    assert.equal(result.reasonCode, 'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_CONTRACT_INPUT_INVALID');
    assert.deepEqual(calls, []);
    assertNoUnsafeText(result);
  }
});

test('findExistingDraftToCaseResult thrown and rejected errors return sanitized failure envelopes', async () => {
  for (const options of [{ throwFind: true }, { rejectFind: true }]) {
    const calls = [];
    const contract = createRepairIntakeIdempotencyRepositoryContract({
      idempotencyStore: createRepository(calls, options),
    });

    const result = await contract.findExistingDraftToCaseResult(unsafeLookupInput());

    assert.equal(calls.length, 1);
    assert.equal(result.ok, false);
    assert.equal(result.reasonCode, 'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_CONTRACT_FIND_FAILED');
    assert.deepEqual(result.requiredActions, ['retry_or_manual_review']);
    assertNoUnsafeText(calls);
    assertNoUnsafeText(result);
  }
});

test('recordDraftToCaseResult forwards only sanitized record fields and returns recorded envelope', async () => {
  const calls = [];
  const contract = createRepairIntakeIdempotencyRepositoryContract({
    idempotencyRepository: createRepository(calls),
  });

  const result = await contract.recordDraftToCaseResult(unsafeRecordInput());

  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], {
    name: 'recordDraftToCaseResult',
    input: {
      idempotencyKey: 'idem_task1085',
      draftId: 'draft_task1085',
      caseId: 'case_task1085_input',
      organizationId: 'org_task1085',
      tenantId: 'tenant_task1085',
      requestId: 'req_task1085',
      actorId: 'actor_task1085',
      status: 'submitted',
      metadata: {
        safeKey: 'safe lookup metadata',
      },
      warnings: ['safe lookup warning'],
      result: {
        ok: true,
        submitted: true,
        draftId: 'draft_task1085',
        caseId: 'case_task1085',
        organizationId: 'org_task1085',
        tenantId: 'tenant_task1085',
        status: 'submitted',
        reasonCode: 'SAFE_RESULT_READY_TASK1085',
        caseRef: {
          caseId: 'case_task1085_ref',
          organizationId: 'org_task1085',
        },
        metadata: {
          safeResultKey: 'safe record result metadata',
        },
      },
      caseRef: {
        caseId: 'case_task1085_ref',
        organizationId: 'org_task1085',
      },
    },
  });
  assert.equal(result.ok, true);
  assert.equal(result.reasonCode, 'RECORDED_TASK1085');
  assert.equal(result.recordId, 'record_task1085');
  assert.equal(result.caseId, 'case_task1085');
  assert.equal(result.caseRef.caseId, 'case_task1085_ref');
  assert.deepEqual(result.metadata, { safeKey: 'safe record result metadata' });
  assert.deepEqual(result.warnings, ['safe record warning']);
  assertNoUnsafeText(calls);
  assertNoUnsafeText(result);
});

test('recordDraftToCaseResult invalid input and invalid repository result fail closed', async () => {
  for (const invalidInput of [
    undefined,
    null,
    'input',
    42,
    true,
    [],
    () => {},
    {},
    { idempotencyKey: '' },
    { idempotencyKey: 'idem_task1085' },
    { idempotencyKey: 'idem_task1085', result: {} },
    { idempotencyKey: 'idem_task1085', caseRef: {} },
  ]) {
    const calls = [];
    const contract = createRepairIntakeIdempotencyRepositoryContract({
      repository: createRepository(calls),
    });

    const result = await contract.recordDraftToCaseResult(invalidInput);

    assert.equal(result.ok, false);
    assert.equal(result.reasonCode, 'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_CONTRACT_INPUT_INVALID');
    assert.deepEqual(calls, []);
    assertNoUnsafeText(result);
  }

  const calls = [];
  const contract = createRepairIntakeIdempotencyRepositoryContract({
    repository: createRepository(calls, { invalidRecordResult: true }),
  });

  const result = await contract.recordDraftToCaseResult(unsafeRecordInput());

  assert.equal(calls.length, 1);
  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_CONTRACT_RECORD_FAILED');
  assertNoUnsafeText(calls);
  assertNoUnsafeText(result);
});

test('recordDraftToCaseResult thrown and rejected errors return sanitized failure envelopes', async () => {
  for (const options of [{ throwRecord: true }, { rejectRecord: true }]) {
    const calls = [];
    const contract = createRepairIntakeIdempotencyRepositoryContract({
      idempotencyStore: createRepository(calls, options),
    });

    const result = await contract.recordDraftToCaseResult(unsafeRecordInput());

    assert.equal(calls.length, 1);
    assert.equal(result.ok, false);
    assert.equal(result.reasonCode, 'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_CONTRACT_RECORD_FAILED');
    assert.deepEqual(result.requiredActions, ['retry_or_manual_review']);
    assertNoUnsafeText(calls);
    assertNoUnsafeText(result);
  }
});
