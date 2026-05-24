'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createRepairIntakeDraftRepository,
} = require('../../src/repairIntake/repairIntakeDraftRepository');
const {
  createRepairIntakeDraftRepositoryContract,
} = require('../../src/repairIntake/repairIntakeDraftRepositoryContract');

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
    'unsafe_line_user',
    'unsafe_line_token',
    'unsafe_final_appointment',
    'rawRow',
    'rawRows',
    'rawSql',
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
            'unsafe sql select * from repair_intake_drafts',
            'DATABASE_URL=postgres://unsafe',
            'unsafe phone',
            'unsafe address',
            'unsafe customer',
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
            id: 'draft_1168',
            organization_id: 'org_1168',
            tenant_id: 'tenant_1168',
            draft_status: 'ready_for_conversion',
            source: 'repair_intake',
            source_ref: 'source_1168',
            intake_source: 'manual',
            safe_summary: {
              title: 'safe contract integration summary',
              phone: 'unsafe phone',
              finalAppointmentId: 'unsafe_final_appointment',
            },
            safe_metadata: {
              safeKey: 'safe contract integration metadata',
              rawRows: [{
                customerPhone: 'unsafe phone',
              }],
              headers: {
                authorization: 'Bearer unsafe',
              },
            },
            validation_errors_safe: ['safe warning', '', 42],
            rawRow: {
              phone: 'unsafe phone',
            },
            customerPhone: 'unsafe phone',
            customerName: 'unsafe customer',
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
  const repository = createRepairIntakeDraftRepository({ dbClient });
  const originalFindDraftForConversion = repository.findDraftForConversion;
  const repositoryCalls = [];

  repository.findDraftForConversion = async (input) => {
    repositoryCalls.push(input);
    return originalFindDraftForConversion(input);
  };

  const contract = createRepairIntakeDraftRepositoryContract({
    draftRepository: repository,
  });

  return {
    calls,
    contract,
    repositoryCalls,
  };
}

test('contract integration success path uses repository and synthetic parameterized query', async () => {
  const { calls, contract, repositoryCalls } = createContractHarness();

  const result = await contract.findDraftForConversion({
    draftId: 'draft_1168',
    organizationId: 'org_1168',
    tenantId: 'tenant_1168',
    requestId: 'req_1168',
    actorId: 'actor_1168',
    rawSql: 'unsafe sql',
    phone: 'unsafe phone',
    lineUserId: 'unsafe_line_user',
    finalAppointmentId: 'unsafe_final_appointment',
  });

  assert.equal(repositoryCalls.length, 1);
  assert.equal(calls.length, 1);
  assert.match(calls[0].sql, /FROM repair_intake_drafts/);
  assert.match(calls[0].sql, /id = \$1/);
  assert.match(calls[0].sql, /organization_id = \$2/);
  assert.match(calls[0].sql, /tenant_id = \$3/);
  assert.equal(calls[0].sql.includes('draft_1168'), false);
  assert.deepEqual(calls[0].params, ['draft_1168', 'org_1168', 'tenant_1168']);

  assert.deepEqual(result, {
    ok: true,
    draftId: 'draft_1168',
    organizationId: 'org_1168',
    tenantId: 'tenant_1168',
    requestId: null,
    actorId: null,
    status: 'ready_for_conversion',
    source: 'repair_intake',
    sourceRef: 'source_1168',
    intakeSource: 'manual',
    reasonCode: 'REPAIR_INTAKE_DRAFT_REPOSITORY_CONTRACT_DRAFT_READY',
    requiredActions: [],
    summary: {
      title: 'safe contract integration summary',
    },
    metadata: {
      safeKey: 'safe contract integration metadata',
    },
    warnings: ['safe warning'],
  });
  assertNoUnsafeText(result);
});

test('contract integration not-found path returns existing not-found envelope', async () => {
  const { calls, contract } = createContractHarness({ noRows: true });

  const result = await contract.findDraftForConversion({
    draftId: 'draft_missing_1168',
    organizationId: 'org_1168',
  });

  assert.equal(calls.length, 1);
  assert.deepEqual(result, {
    ok: false,
    draftId: null,
    organizationId: null,
    tenantId: null,
    status: 'not_found',
    reasonCode: 'REPAIR_INTAKE_DRAFT_REPOSITORY_CONTRACT_DRAFT_NOT_FOUND',
    requiredActions: ['verify_draft_exists'],
    summary: null,
    metadata: {},
    warnings: [],
  });
  assertNoUnsafeText(result);
});

test('contract integration rejected query returns sanitized contract failure', async () => {
  const { calls, contract } = createContractHarness({ reject: true });

  const result = await contract.findDraftForConversion({
    draftId: 'draft_1168',
    organizationId: 'org_1168',
    tenantId: 'tenant_1168',
  });

  assert.equal(calls.length, 1);
  assert.deepEqual(result, {
    ok: false,
    draftId: null,
    organizationId: null,
    tenantId: null,
    status: 'failed',
    reasonCode: 'REPAIR_INTAKE_DRAFT_REPOSITORY_CONTRACT_READ_FAILED',
    requiredActions: ['retry_or_manual_review'],
    summary: null,
    metadata: {},
    warnings: [],
  });
  assertNoUnsafeText(result);
});

test('contract integration invalid input fails before synthetic dbClient query', async () => {
  const { calls, contract, repositoryCalls } = createContractHarness();

  const result = await contract.findDraftForConversion({
    organizationId: 'org_1168',
    rawSql: 'unsafe sql',
    phone: 'unsafe phone',
  });

  assert.equal(repositoryCalls.length, 0);
  assert.equal(calls.length, 0);
  assert.deepEqual(result, {
    ok: false,
    draftId: null,
    organizationId: null,
    tenantId: null,
    status: 'failed',
    reasonCode: 'REPAIR_INTAKE_DRAFT_REPOSITORY_CONTRACT_INPUT_INVALID',
    requiredActions: ['provide_draft_id'],
    summary: null,
    metadata: {},
    warnings: [],
  });
  assertNoUnsafeText(result);
});
