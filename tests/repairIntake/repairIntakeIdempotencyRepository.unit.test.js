'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  RepairIntakeIdempotencyRepositoryError,
  createRepairIntakeIdempotencyRepository,
} = require('../../src/repairIntake/repairIntakeIdempotencyRepository');

const repoRoot = path.resolve(__dirname, '../..');
const sourcePath = path.join(repoRoot, 'src/repairIntake/repairIntakeIdempotencyRepository.js');

function assertRepositoryError(error, reasonCode) {
  assert.equal(error instanceof RepairIntakeIdempotencyRepositoryError, true);
  assert.equal(error.reasonCode, reasonCode);
  assert.equal(error.stack, undefined);
  assertNoUnsafeText(error);
  return true;
}

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
    'unsafe raw body',
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

function createDbClient(options = {}) {
  const calls = [];

  return {
    calls,
    client: {
      query: async (sql, params) => {
        calls.push({ sql, params });

        if (options.reject) {
          throw new Error([
            'unsafe sql select * from repair_intake_idempotency_records',
            'DATABASE_URL=postgres://unsafe',
            'unsafe phone',
            'unsafe address',
            'unsafe customer',
            'unsafe raw body',
            'unsafe_line_user',
            'unsafe_line_token',
            'unsafe_final_appointment',
            'unsafe stack',
            'Bearer unsafe',
          ].join(' '));
        }

        if (/^INSERT INTO repair_intake_idempotency_records/.test(sql)) {
          if (options.noRecordRow) {
            return { rows: [] };
          }

          return {
            rows: [{
              id: 'idem_record_1191',
              organization_id: 'org_1178',
              tenant_id: 'tenant_1178',
              idempotency_key: 'idem_1178',
              operation_type: 'draft_to_case',
              draft_id: 'draft_1178',
              replay_case_id: 'case_1178',
              replay_case_ref: 'case_ref_1178',
              replay_result_safe: {
                caseId: 'case_1178',
                status: 'submitted',
                safeValue: 'safe recorded',
                phone: 'unsafe phone',
                finalAppointmentId: 'unsafe_final_appointment',
                rawRequestBody: 'unsafe raw body',
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
        }

        if (options.noRow) {
          return { rows: [] };
        }

        return {
          rows: [{
            id: 'idem_record_1178',
            organization_id: 'org_1178',
            tenant_id: 'tenant_1178',
            idempotency_key: 'idem_1178',
            operation_type: 'draft_to_case',
            draft_id: 'draft_1178',
            replay_case_id: 'case_1178',
            replay_case_ref: 'case_ref_1178',
            replay_result_safe: {
              caseId: 'case_1178',
              status: 'submitted',
              safeValue: 'safe replay',
              phone: 'unsafe phone',
              finalAppointmentId: 'unsafe_final_appointment',
              rawRequestBody: 'unsafe raw body',
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

test('factory rejects missing or invalid dbClient', () => {
  for (const options of [
    undefined,
    null,
    {},
    { dbClient: null },
    { dbClient: {} },
    { dbClient: { query: 'not-a-function' } },
  ]) {
    assert.throws(
      () => createRepairIntakeIdempotencyRepository(options),
      (error) => assertRepositoryError(
        error,
        'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_DB_CLIENT_REQUIRED',
      ),
    );
  }
});

test('invalid input fails closed before dbClient query', async () => {
  const { client, calls } = createDbClient();
  const repository = createRepairIntakeIdempotencyRepository({ dbClient: client });

  for (const input of [
    undefined,
    null,
    'idem_1178',
    {},
    { idempotencyKey: '' },
    { idempotencyKey: 'idem_1178' },
    { idempotencyKey: 'idem_1178', organizationId: '' },
  ]) {
    await assert.rejects(
      () => repository.findExistingDraftToCaseResult(input),
      (error) => assertRepositoryError(
        error,
        'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_INPUT_INVALID',
      ),
    );
  }

  assert.equal(calls.length, 0);
});

test('valid lookup calls dbClient.query once with parameterized scoped SELECT', async () => {
  const { client, calls } = createDbClient();
  const repository = createRepairIntakeIdempotencyRepository({ dbClient: client });

  await repository.findExistingDraftToCaseResult({
    idempotencyKey: 'idem_1178',
    organizationId: 'org_1178',
    tenantId: 'tenant_1178',
    operationType: 'draft_to_case',
    requestId: 'req_1178',
    actorId: 'actor_1178',
  });

  assert.equal(calls.length, 1);
  assert.match(calls[0].sql, /^SELECT/);
  assert.match(calls[0].sql, /FROM repair_intake_idempotency_records/);
  assert.match(calls[0].sql, /organization_id = \$1/);
  assert.match(calls[0].sql, /operation_type = \$2/);
  assert.match(calls[0].sql, /idempotency_key = \$3/);
  assert.match(calls[0].sql, /tenant_id = \$4/);
  assert.equal(calls[0].sql.includes('idem_1178'), false);
  assert.equal(calls[0].sql.includes('org_1178'), false);
  assert.deepEqual(calls[0].params, ['org_1178', 'draft_to_case', 'idem_1178', 'tenant_1178']);
});

test('operation scope defaults safely and tenant scope is optional', async () => {
  const { client, calls } = createDbClient();
  const repository = createRepairIntakeIdempotencyRepository({ dbClient: client });

  await repository.findExistingDraftToCaseResult({
    idempotencyKey: 'idem_1178',
    organizationId: 'org_1178',
  });

  assert.match(calls[0].sql, /organization_id = \$1/);
  assert.match(calls[0].sql, /operation_type = \$2/);
  assert.match(calls[0].sql, /idempotency_key = \$3/);
  assert.equal(calls[0].sql.includes('tenant_id ='), false);
  assert.deepEqual(calls[0].params, ['org_1178', 'draft_to_case', 'idem_1178']);
});

test('no row returns null', async () => {
  const { client } = createDbClient({ noRow: true });
  const repository = createRepairIntakeIdempotencyRepository({ dbClient: client });

  const result = await repository.findExistingDraftToCaseResult({
    idempotencyKey: 'idem_missing_1178',
    organizationId: 'org_1178',
  });

  assert.equal(result, null);
});

test('found row returns sanitized replay-like object', async () => {
  const { client } = createDbClient();
  const repository = createRepairIntakeIdempotencyRepository({ dbClient: client });

  const result = await repository.findExistingDraftToCaseResult({
    idempotencyKey: 'idem_1178',
    organizationId: 'org_1178',
    tenantId: 'tenant_1178',
    requestId: 'req_1178',
    actorId: 'actor_1178',
  });

  assert.deepEqual(result, {
    action: 'draft_to_case',
    idempotencyKey: 'idem_1178',
    draftId: 'draft_1178',
    caseId: 'case_1178',
    caseRef: {
      caseRef: 'case_ref_1178',
      caseId: 'case_1178',
    },
    organizationId: 'org_1178',
    tenantId: 'tenant_1178',
    requestId: 'req_1178',
    actorId: 'actor_1178',
    status: 'completed',
    submitted: true,
    reasonCode: 'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_REPLAY_READY',
    requiredActions: [],
    result: {
      caseId: 'case_1178',
      status: 'submitted',
      safeValue: 'safe replay',
    },
    metadata: {
      recordId: 'idem_record_1178',
    },
    warnings: [],
  });
  assertNoUnsafeText(result);
});

test('rejected query throws sanitized repository error', async () => {
  const { client } = createDbClient({ reject: true });
  const repository = createRepairIntakeIdempotencyRepository({ dbClient: client });

  await assert.rejects(
    () => repository.findExistingDraftToCaseResult({
      idempotencyKey: 'idem_1178',
      organizationId: 'org_1178',
    }),
    (error) => assertRepositoryError(error, 'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_QUERY_FAILED'),
  );
});

test('recordDraftToCaseResult valid input calls parameterized idempotent writer once', async () => {
  const { client, calls } = createDbClient();
  const repository = createRepairIntakeIdempotencyRepository({ dbClient: client });

  const result = await repository.recordDraftToCaseResult({
    idempotencyKey: 'idem_1178',
    organizationId: 'org_1178',
    tenantId: 'tenant_1178',
    operationType: 'draft_to_case',
    draftId: 'draft_1178',
    requestId: 'req_1178',
    actorId: 'actor_1178',
    safeRequestFingerprint: 'fingerprint_1178',
    result: {
      caseId: 'case_1178',
      status: 'submitted',
      safeValue: 'safe recorded',
      rawRequestBody: 'unsafe raw body',
      finalAppointmentId: 'unsafe_final_appointment',
    },
    caseRef: {
      caseRef: 'case_ref_1178',
      caseId: 'case_1178',
    },
    expiresAt: '2026-06-01T00:00:00.000Z',
    retentionUntil: '2026-07-01T00:00:00.000Z',
  });

  assert.equal(calls.length, 1);
  assert.match(calls[0].sql, /^INSERT INTO repair_intake_idempotency_records/);
  assert.match(calls[0].sql, /ON CONFLICT/);
  assert.match(calls[0].sql, /DO NOTHING/);
  assert.match(calls[0].sql, /RETURNING/);
  assert.equal(calls[0].sql.includes('idem_1178'), false);
  assert.equal(calls[0].sql.includes('org_1178'), false);
  assert.equal(calls[0].sql.includes('fingerprint_1178'), false);
  assert.deepEqual(calls[0].params, [
    'org_1178',
    'tenant_1178',
    'idem_1178',
    'draft_to_case',
    'draft_1178',
    'fingerprint_1178',
    'case_1178',
    'case_ref_1178',
    JSON.stringify({
      caseId: 'case_1178',
      status: 'submitted',
      safeValue: 'safe recorded',
      caseRef: {
        caseRef: 'case_ref_1178',
        caseId: 'case_1178',
      },
      draftId: 'draft_1178',
      organizationId: 'org_1178',
      tenantId: 'tenant_1178',
      requestId: 'req_1178',
      actorId: 'actor_1178',
      submitted: true,
    }),
    'submitted',
    '2026-06-01T00:00:00.000Z',
    '2026-07-01T00:00:00.000Z',
  ]);

  assert.deepEqual(result, {
    action: 'draft_to_case',
    idempotencyKey: 'idem_1178',
    draftId: 'draft_1178',
    caseId: 'case_1178',
    caseRef: {
      caseRef: 'case_ref_1178',
      caseId: 'case_1178',
    },
    organizationId: 'org_1178',
    tenantId: 'tenant_1178',
    requestId: 'req_1178',
    actorId: 'actor_1178',
    status: 'completed',
    submitted: true,
    reasonCode: 'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_RECORDED',
    requiredActions: [],
    result: {
      caseId: 'case_1178',
      status: 'submitted',
      safeValue: 'safe recorded',
    },
    metadata: {
      recordId: 'idem_record_1191',
    },
    warnings: [],
  });
  assertNoUnsafeText(result);
});

test('recordDraftToCaseResult invalid input fails before dbClient query', async () => {
  const { client, calls } = createDbClient();
  const repository = createRepairIntakeIdempotencyRepository({ dbClient: client });

  for (const input of [
    undefined,
    null,
    'idem_1178',
    {},
    { idempotencyKey: '', organizationId: 'org_1178' },
    { idempotencyKey: 'idem_1178', organizationId: '' },
    { idempotencyKey: 'idem_1178', organizationId: 'org_1178', safeRequestFingerprint: 'fp_1178' },
    {
      idempotencyKey: 'idem_1178',
      organizationId: 'org_1178',
      result: { caseId: 'case_1178' },
    },
  ]) {
    await assert.rejects(
      () => repository.recordDraftToCaseResult(input),
      (error) => error instanceof RepairIntakeIdempotencyRepositoryError
        && error.stack === undefined,
    );
  }

  assert.equal(calls.length, 0);
});

test('recordDraftToCaseResult rejected query throws sanitized repository error', async () => {
  const { client } = createDbClient({ reject: true });
  const repository = createRepairIntakeIdempotencyRepository({ dbClient: client });

  await assert.rejects(
    () => repository.recordDraftToCaseResult({
      idempotencyKey: 'idem_1178',
      organizationId: 'org_1178',
      safeRequestFingerprint: 'fingerprint_1178',
      result: { caseId: 'case_1178' },
    }),
    (error) => assertRepositoryError(error, 'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_RECORD_FAILED'),
  );
});

test('source has no forbidden imports and keeps writer isolated', () => {
  const source = fs.readFileSync(sourcePath, 'utf8');

  for (const forbidden of [
    "require('../db",
    "require('../../db",
    "require('../repositories",
    "require('../../repositories",
    'src/db',
    'src/repositories',
    'process.env',
    'DATABASE_URL',
    'UPDATE ',
    'DELETE ',
    'MERGE ',
    'createDefault',
    'app.js',
    'server.js',
    'routes/',
    'controllers/',
    'provider',
    'billing',
  ]) {
    assert.equal(source.includes(forbidden), false, `forbidden source marker found: ${forbidden}`);
  }

  assert.equal(source.includes('INSERT INTO repair_intake_idempotency_records'), true);
  assert.equal(source.includes('ON CONFLICT'), true);
  assert.equal(source.includes('DO NOTHING'), true);
});
