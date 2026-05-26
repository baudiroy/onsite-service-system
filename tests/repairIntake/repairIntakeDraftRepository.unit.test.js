'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  RepairIntakeDraftRepositoryError,
  createRepairIntakeDraftRepository,
} = require('../../src/repairIntake/repairIntakeDraftRepository');

const repoRoot = path.resolve(__dirname, '../..');
const sourcePath = path.join(repoRoot, 'src/repairIntake/repairIntakeDraftRepository.js');

function assertRepositoryError(error, reasonCode) {
  assert.equal(error instanceof RepairIntakeDraftRepositoryError, true);
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
            'unsafe sql select * from repair_intake_drafts',
            'DATABASE_URL=postgres://unsafe',
            'unsafe phone',
            'unsafe address',
            'unsafe customer',
            'unsafe_line_user',
            'unsafe_line_token',
            'unsafe_final_appointment',
            'unsafe stack',
          ].join(' '));
        }

        if (options.noRow) {
          return { rows: [] };
        }

        return {
          rows: [{
            id: 'draft_1166',
            organization_id: 'org_1166',
            tenant_id: 'tenant_1166',
            draft_status: 'ready_for_conversion',
            source: 'repair_intake',
            source_ref: 'source_1166',
            intake_source: 'manual',
            safe_summary: {
              title: 'safe summary',
              phone: 'unsafe phone',
              finalAppointmentId: 'unsafe_final_appointment',
            },
            safe_metadata: {
              safeKey: 'safe metadata',
              rawRow: {
                customerPhone: 'unsafe phone',
              },
              headers: {
                authorization: 'Bearer unsafe',
              },
            },
            validation_errors_safe: ['safe warning', '', 42],
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
      () => createRepairIntakeDraftRepository(options),
      (error) => assertRepositoryError(
        error,
        'REPAIR_INTAKE_DRAFT_REPOSITORY_DB_CLIENT_REQUIRED',
      ),
    );
  }
});

test('factory accepts query-capable dbClient instances', async () => {
  class QueryCapableClient {
    constructor() {
      this.calls = [];
    }

    async query(sql, params) {
      this.calls.push({ sql, params });
      return { rows: [] };
    }
  }

  const client = new QueryCapableClient();
  const repository = createRepairIntakeDraftRepository({ dbClient: client });

  const result = await repository.findDraftForConversion({ draftId: 'draft_instance_client' });

  assert.equal(result, null);
  assert.equal(client.calls.length, 1);
  assert.match(client.calls[0].sql, /FROM repair_intake_drafts/);
});

test('invalid input fails closed before dbClient query', async () => {
  const { client, calls } = createDbClient();
  const repository = createRepairIntakeDraftRepository({ dbClient: client });

  for (const input of [
    undefined,
    null,
    'draft_1166',
    {},
    { draftId: '' },
    { draftId: '   ' },
  ]) {
    await assert.rejects(
      () => repository.findDraftForConversion(input),
      (error) => assertRepositoryError(error, 'REPAIR_INTAKE_DRAFT_REPOSITORY_INPUT_INVALID'),
    );
  }

  assert.equal(calls.length, 0);
});

test('valid lookup calls dbClient.query once with parameterized scoped SELECT', async () => {
  const { client, calls } = createDbClient();
  const repository = createRepairIntakeDraftRepository({ dbClient: client });

  await repository.findDraftForConversion({
    draftId: 'draft_1166',
    organizationId: 'org_1166',
    tenantId: 'tenant_1166',
    requestId: 'req_1166',
    actorId: 'actor_1166',
  });

  assert.equal(calls.length, 1);
  assert.match(calls[0].sql, /^SELECT/);
  assert.match(calls[0].sql, /FROM repair_intake_drafts/);
  assert.match(calls[0].sql, /id = \$1/);
  assert.match(calls[0].sql, /organization_id = \$2/);
  assert.match(calls[0].sql, /tenant_id = \$3/);
  assert.equal(calls[0].sql.includes('draft_1166'), false);
  assert.equal(calls[0].sql.includes('org_1166'), false);
  assert.equal(calls[0].sql.includes('tenant_1166'), false);
  assert.deepEqual(calls[0].params, ['draft_1166', 'org_1166', 'tenant_1166']);
});

test('organization and tenant scope are optional but included when provided', async () => {
  const { client, calls } = createDbClient();
  const repository = createRepairIntakeDraftRepository({ dbClient: client });

  await repository.findDraftForConversion({
    draftId: 'draft_1166',
    organizationId: 'org_1166',
  });

  assert.match(calls[0].sql, /organization_id = \$2/);
  assert.equal(calls[0].sql.includes('tenant_id ='), false);
  assert.deepEqual(calls[0].params, ['draft_1166', 'org_1166']);
});

test('no row returns null', async () => {
  const { client } = createDbClient({ noRow: true });
  const repository = createRepairIntakeDraftRepository({ dbClient: client });

  const result = await repository.findDraftForConversion({ draftId: 'draft_missing' });

  assert.equal(result, null);
});

test('found row returns sanitized draft-like object', async () => {
  const { client } = createDbClient();
  const repository = createRepairIntakeDraftRepository({ dbClient: client });

  const result = await repository.findDraftForConversion({
    draftId: 'draft_1166',
    organizationId: 'org_1166',
    tenantId: 'tenant_1166',
  });

  assert.deepEqual(result, {
    draftId: 'draft_1166',
    organizationId: 'org_1166',
    tenantId: 'tenant_1166',
    status: 'ready_for_conversion',
    source: 'repair_intake',
    sourceRef: 'source_1166',
    intakeSource: 'manual',
    summary: {
      title: 'safe summary',
    },
    metadata: {
      safeKey: 'safe metadata',
    },
    warnings: ['safe warning'],
  });
  assertNoUnsafeText(result);
});

test('rejected query throws sanitized repository error', async () => {
  const { client } = createDbClient({ reject: true });
  const repository = createRepairIntakeDraftRepository({ dbClient: client });

  await assert.rejects(
    () => repository.findDraftForConversion({ draftId: 'draft_1166' }),
    (error) => assertRepositoryError(error, 'REPAIR_INTAKE_DRAFT_REPOSITORY_QUERY_FAILED'),
  );
});

test('source has no forbidden imports and no write SQL markers', () => {
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
    'INSERT ',
    'UPDATE ',
    'DELETE ',
    'UPSERT ',
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
});
