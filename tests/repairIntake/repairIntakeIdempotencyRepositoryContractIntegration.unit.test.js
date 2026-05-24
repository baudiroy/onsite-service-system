'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createRepairIntakeIdempotencyRepository,
} = require('../../src/repairIntake/repairIntakeIdempotencyRepository');
const {
  createRepairIntakeIdempotencyRepositoryContract,
} = require('../../src/repairIntake/repairIntakeIdempotencyRepositoryContract');

function assertNoUnsafeText(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'DATABASE_URL',
    'postgres://',
    'unsafe sql',
    'unsafe stack',
    'unsafe phone',
    'unsafe address',
    'unsafe customer',
    'unsafe raw request',
    'unsafe_line_user',
    'unsafe_line_token',
    'unsafe_final_appointment',
    'rawRow',
    'rawRows',
    'rawSql',
    'rawRequestBody',
    'lineUserId',
    'lineAccessToken',
    'finalAppointmentId',
    'customerPhone',
    'customerName',
    'authorization',
    'Bearer unsafe',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

function createSyntheticDbClient(options = {}) {
  const calls = [];

  return {
    calls,
    dbClient: {
      query: async (sql, params) => {
        calls.push({ sql, params });

        if (options.reject) {
          throw new Error([
            'unsafe sql select * from repair_intake_idempotency_records',
            'DATABASE_URL=postgres://unsafe',
            'unsafe phone',
            'unsafe address',
            'unsafe customer',
            'unsafe raw request',
            'unsafe_line_user',
            'unsafe_line_token',
            'unsafe_final_appointment',
            'unsafe stack',
            'Bearer unsafe',
          ].join(' '));
        }

        if (options.noRows) {
          return { rows: [] };
        }

        return {
          rows: [{
            id: 'idem_record_1180',
            organization_id: 'org_1180',
            tenant_id: 'tenant_1180',
            idempotency_key: 'idem_1180',
            operation_type: 'draft_to_case',
            draft_id: 'draft_1180',
            replay_case_id: 'case_1180',
            replay_case_ref: 'case_ref_1180',
            replay_result_safe: {
              caseId: 'case_1180',
              status: 'submitted',
              safeValue: 'safe replay',
              phone: 'unsafe phone',
              rawRequestBody: 'unsafe raw request',
              finalAppointmentId: 'unsafe_final_appointment',
            },
            record_status: 'completed',
            rawRow: {
              phone: 'unsafe phone',
            },
            lineUserId: 'unsafe_line_user',
            lineAccessToken: 'unsafe_line_token',
            finalAppointmentId: 'unsafe_final_appointment',
          }],
        };
      },
    },
  };
}

function createContractHarness(options = {}) {
  const { dbClient, calls } = createSyntheticDbClient(options);
  const repository = createRepairIntakeIdempotencyRepository({ dbClient });
  const originalFindExistingDraftToCaseResult = repository.findExistingDraftToCaseResult;
  const originalRecordDraftToCaseResult = repository.recordDraftToCaseResult;
  const repositoryFindCalls = [];
  const repositoryRecordCalls = [];

  repository.findExistingDraftToCaseResult = async (input) => {
    repositoryFindCalls.push(input);
    return originalFindExistingDraftToCaseResult(input);
  };
  repository.recordDraftToCaseResult = async (input) => {
    repositoryRecordCalls.push(input);
    return originalRecordDraftToCaseResult(input);
  };

  const contract = createRepairIntakeIdempotencyRepositoryContract({
    idempotencyRepository: repository,
  });

  return {
    calls,
    contract,
    repositoryFindCalls,
    repositoryRecordCalls,
  };
}

test('contract integration find replay success path uses synthetic parameterized query', async () => {
  const { calls, contract, repositoryFindCalls } = createContractHarness();

  const result = await contract.findExistingDraftToCaseResult({
    idempotencyKey: 'idem_1180',
    organizationId: 'org_1180',
    tenantId: 'tenant_1180',
    action: 'draft_to_case',
    draftId: 'draft_1180',
    requestId: 'req_1180',
    actorId: 'actor_1180',
    rawSql: 'unsafe sql',
    phone: 'unsafe phone',
    lineUserId: 'unsafe_line_user',
    finalAppointmentId: 'unsafe_final_appointment',
  });

  assert.equal(repositoryFindCalls.length, 1);
  assert.equal(calls.length, 1);
  assert.match(calls[0].sql, /FROM repair_intake_idempotency_records/);
  assert.match(calls[0].sql, /organization_id = \$1/);
  assert.match(calls[0].sql, /operation_type = \$2/);
  assert.match(calls[0].sql, /idempotency_key = \$3/);
  assert.match(calls[0].sql, /tenant_id = \$4/);
  assert.equal(calls[0].sql.includes('idem_1180'), false);
  assert.deepEqual(calls[0].params, ['org_1180', 'draft_to_case', 'idem_1180', 'tenant_1180']);

  assert.deepEqual(result, {
    ok: true,
    action: 'draft_to_case',
    idempotencyKey: 'idem_1180',
    draftId: 'draft_1180',
    caseId: 'case_1180',
    caseRef: {
      caseRef: 'case_ref_1180',
      caseId: 'case_1180',
    },
    organizationId: 'org_1180',
    tenantId: 'tenant_1180',
    requestId: 'req_1180',
    actorId: 'actor_1180',
    status: 'completed',
    submitted: true,
    reasonCode: 'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_REPLAY_READY',
    requiredActions: [],
    result: {
      caseId: 'case_1180',
      status: 'submitted',
      safeValue: 'safe replay',
    },
    metadata: {
      recordId: 'idem_record_1180',
    },
    warnings: [],
  });
  assertNoUnsafeText(result);
});

test('contract integration find no-existing path returns existing no-result envelope', async () => {
  const { calls, contract } = createContractHarness({ noRows: true });

  const result = await contract.findExistingDraftToCaseResult({
    idempotencyKey: 'idem_missing_1180',
    organizationId: 'org_1180',
    tenantId: 'tenant_1180',
    draftId: 'draft_1180',
    requestId: 'req_1180',
    actorId: 'actor_1180',
  });

  assert.equal(calls.length, 1);
  assert.deepEqual(result, {
    ok: false,
    idempotencyKey: 'idem_missing_1180',
    draftId: 'draft_1180',
    caseId: null,
    caseRef: null,
    organizationId: 'org_1180',
    tenantId: 'tenant_1180',
    requestId: 'req_1180',
    actorId: 'actor_1180',
    status: 'not_found',
    submitted: false,
    reasonCode: 'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_CONTRACT_NO_EXISTING_RESULT',
    requiredActions: [],
    result: null,
    metadata: {},
    warnings: [],
  });
  assertNoUnsafeText(result);
});

test('contract integration rejected query returns sanitized find failure', async () => {
  const { calls, contract } = createContractHarness({ reject: true });

  const result = await contract.findExistingDraftToCaseResult({
    idempotencyKey: 'idem_1180',
    organizationId: 'org_1180',
    tenantId: 'tenant_1180',
    draftId: 'draft_1180',
    requestId: 'req_1180',
    actorId: 'actor_1180',
  });

  assert.equal(calls.length, 1);
  assert.deepEqual(result, {
    ok: false,
    idempotencyKey: 'idem_1180',
    draftId: 'draft_1180',
    caseId: null,
    caseRef: null,
    organizationId: 'org_1180',
    tenantId: 'tenant_1180',
    requestId: 'req_1180',
    actorId: 'actor_1180',
    status: 'failed',
    submitted: false,
    reasonCode: 'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_CONTRACT_FIND_FAILED',
    requiredActions: ['retry_or_manual_review'],
    result: null,
    metadata: {},
    warnings: [],
  });
  assertNoUnsafeText(result);
});

test('contract integration invalid input fails before synthetic dbClient query', async () => {
  const { calls, contract, repositoryFindCalls } = createContractHarness();

  const result = await contract.findExistingDraftToCaseResult({
    organizationId: 'org_1180',
    rawSql: 'unsafe sql',
    phone: 'unsafe phone',
  });

  assert.equal(repositoryFindCalls.length, 0);
  assert.equal(calls.length, 0);
  assert.deepEqual(result, {
    ok: false,
    idempotencyKey: null,
    draftId: null,
    caseId: null,
    caseRef: null,
    organizationId: 'org_1180',
    tenantId: null,
    requestId: null,
    actorId: null,
    status: 'failed',
    submitted: false,
    reasonCode: 'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_CONTRACT_INPUT_INVALID',
    requiredActions: ['provide_idempotency_key'],
    result: null,
    metadata: {},
    warnings: [],
  });
  assertNoUnsafeText(result);
});

test('contract integration record success path forwards sanitized writer input to synthetic dbClient', async () => {
  const { calls, contract, repositoryRecordCalls } = createContractHarness();

  const result = await contract.recordDraftToCaseResult({
    idempotencyKey: 'idem_1180',
    organizationId: 'org_1180',
    tenantId: 'tenant_1180',
    operationType: 'draft_to_case',
    draftId: 'draft_1180',
    requestId: 'req_1180',
    actorId: 'actor_1180',
    requestFingerprint: 'fingerprint_1180',
    result: {
      caseId: 'case_1180',
      status: 'submitted',
      safeValue: 'safe recorded',
      rawRequestBody: 'unsafe raw request',
      finalAppointmentId: 'unsafe_final_appointment',
    },
    caseRef: {
      caseRef: 'case_ref_1180',
      caseId: 'case_1180',
      finalAppointmentId: 'unsafe_final_appointment',
    },
    rawSql: 'unsafe sql',
    phone: 'unsafe phone',
    lineUserId: 'unsafe_line_user',
  });

  assert.equal(repositoryRecordCalls.length, 1);
  assert.deepEqual(repositoryRecordCalls[0], {
    idempotencyKey: 'idem_1180',
    draftId: 'draft_1180',
    caseId: 'case_1180',
    caseRef: {
      caseRef: 'case_ref_1180',
      caseId: 'case_1180',
    },
    organizationId: 'org_1180',
    tenantId: 'tenant_1180',
    requestId: 'req_1180',
    actorId: 'actor_1180',
    operationType: 'draft_to_case',
    result: {
      caseId: 'case_1180',
      status: 'submitted',
      safeValue: 'safe recorded',
    },
    safeRequestFingerprint: 'fingerprint_1180',
  });
  assert.equal(calls.length, 1);
  assert.match(calls[0].sql, /^INSERT INTO repair_intake_idempotency_records/);
  assert.match(calls[0].sql, /ON CONFLICT/);
  assert.match(calls[0].sql, /DO NOTHING/);
  assert.equal(calls[0].sql.includes('idem_1180'), false);
  assert.equal(calls[0].sql.includes('fingerprint_1180'), false);
  assert.deepEqual(calls[0].params.slice(0, 8), [
    'org_1180',
    'tenant_1180',
    'idem_1180',
    'draft_to_case',
    'draft_1180',
    'fingerprint_1180',
    'case_1180',
    'case_ref_1180',
  ]);
  assert.deepEqual(result, {
    ok: true,
    action: 'draft_to_case',
    idempotencyKey: 'idem_1180',
    draftId: 'draft_1180',
    caseId: 'case_1180',
    caseRef: {
      caseRef: 'case_ref_1180',
      caseId: 'case_1180',
    },
    organizationId: 'org_1180',
    tenantId: 'tenant_1180',
    requestId: 'req_1180',
    actorId: 'actor_1180',
    status: 'completed',
    submitted: true,
    reasonCode: 'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_RECORDED',
    requiredActions: [],
    result: {
      caseId: 'case_1180',
      status: 'submitted',
      safeValue: 'safe replay',
    },
    metadata: {
      recordId: 'idem_record_1180',
    },
    warnings: [],
    recordId: null,
  });
  assertNoUnsafeText(result);
});

test('contract integration record missing fingerprint fails before synthetic dbClient query', async () => {
  const { calls, contract, repositoryRecordCalls } = createContractHarness();

  const result = await contract.recordDraftToCaseResult({
    idempotencyKey: 'idem_1180',
    organizationId: 'org_1180',
    tenantId: 'tenant_1180',
    draftId: 'draft_1180',
    requestId: 'req_1180',
    actorId: 'actor_1180',
    result: {
      caseId: 'case_1180',
      rawRequestBody: 'unsafe raw request',
      finalAppointmentId: 'unsafe_final_appointment',
    },
  });

  assert.equal(repositoryRecordCalls.length, 0);
  assert.equal(calls.length, 0);
  assert.deepEqual(result, {
    ok: false,
    idempotencyKey: 'idem_1180',
    draftId: 'draft_1180',
    caseId: null,
    caseRef: null,
    organizationId: 'org_1180',
    tenantId: 'tenant_1180',
    requestId: 'req_1180',
    actorId: 'actor_1180',
    status: 'failed',
    submitted: false,
    reasonCode: 'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_CONTRACT_INPUT_INVALID',
    requiredActions: ['provide_request_fingerprint'],
    result: null,
    metadata: {},
    warnings: [],
  });
  assertNoUnsafeText(result);
});
