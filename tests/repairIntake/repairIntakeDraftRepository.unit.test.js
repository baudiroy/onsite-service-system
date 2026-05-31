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

  const result = await repository.findDraftForConversion({
    draftId: 'draft_instance_client',
    organizationId: 'org_instance_client',
  });

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
    { draftId: 'draft_1166' },
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

test('organization scope is required and tenant scope is included when provided', async () => {
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

test('pg-style query result object maps rows even when result prototype is not plain', async () => {
  const resultPrototype = { command: 'SELECT' };
  const pgStyleResult = Object.create(resultPrototype);
  pgStyleResult.rows = [{
    id: 'draft_pg_result_1698',
    organization_id: 'org_pg_result_1698',
    tenant_id: 'tenant_pg_result_1698',
    draft_status: 'ready_for_conversion',
    source: 'repair_intake',
    source_ref: 'source_pg_result_1698',
    intake_source: 'manual',
    safe_summary: {
      title: 'safe pg result summary',
    },
    safe_metadata: {
      safeKey: 'safe pg result metadata',
    },
    validation_errors_safe: ['safe pg result warning'],
  }];

  const calls = [];
  const repository = createRepairIntakeDraftRepository({
    dbClient: {
      query: async (sql, params) => {
        calls.push({ sql, params });
        return pgStyleResult;
      },
    },
  });

  const result = await repository.findDraftForConversion({
    draftId: 'draft_pg_result_1698',
    organizationId: 'org_pg_result_1698',
    tenantId: 'tenant_pg_result_1698',
  });

  assert.deepEqual(result, {
    draftId: 'draft_pg_result_1698',
    organizationId: 'org_pg_result_1698',
    tenantId: 'tenant_pg_result_1698',
    status: 'ready_for_conversion',
    source: 'repair_intake',
    sourceRef: 'source_pg_result_1698',
    intakeSource: 'manual',
    summary: {
      title: 'safe pg result summary',
    },
    metadata: {
      safeKey: 'safe pg result metadata',
    },
    warnings: ['safe pg result warning'],
  });
  assert.equal(calls.length, 1);
  assertNoUnsafeText(result);
});

test('no row returns null', async () => {
  const { client } = createDbClient({ noRow: true });
  const repository = createRepairIntakeDraftRepository({ dbClient: client });

  const result = await repository.findDraftForConversion({
    draftId: 'draft_missing',
    organizationId: 'org_missing',
  });

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

test('safe metadata keeps draft-boundary fields without confirming duplicate or merging contacts', async () => {
  const calls = [];
  const repository = createRepairIntakeDraftRepository({
    dbClient: {
      query: async (sql, params) => {
        calls.push({ sql, params });
        return {
          rows: [{
            id: 'draft_1888',
            organization_id: 'org_1888',
            tenant_id: 'tenant_1888',
            draft_status: 'ready_for_conversion',
            source: 'repair_intake',
            source_ref: 'source_1888',
            intake_source: 'manual',
            safe_summary: {
              title: 'safe task1888 summary',
              brandId: 'brand_1888_summary',
              phone: 'unsafe phone',
              finalAppointmentId: 'unsafe_final_appointment',
            },
            safe_metadata: {
              brandId: 'brand_1888',
              serviceProviderId: 'provider_1888',
              duplicateStatus: 'possible_duplicate',
              duplicateCandidate: {
                candidateId: 'dup_candidate_1888',
                candidateRef: 'dup_ref_1888',
                matchScore: 0.82,
                status: 'candidate',
                reasonCode: 'possible_duplicate',
                confirmedDuplicate: true,
                caseId: 'case_should_not_escape',
                phone: 'unsafe phone',
                rawRow: { token: 'unsafe token' },
              },
              reporterRef: { id: 'reporter_ref_1888', role: 'reporter', phone: 'unsafe phone' },
              customerRef: { id: 'customer_ref_1888', role: 'customer', address: 'unsafe address' },
              billingContactRef: { id: 'billing_ref_1888', role: 'billing', token: 'unsafe token' },
              onSiteContactOverrideRef: { id: 'site_ref_1888', role: 'onsite', lineUserId: 'unsafe_line_user' },
              contactRoleSeparation: 'reviewed',
              platformAccepted: true,
              importAccepted: true,
              rawRows: [{ phone: 'unsafe phone' }],
            },
          }],
        };
      },
    },
  });

  const result = await repository.findDraftForConversion({
    draftId: 'draft_1888',
    organizationId: 'org_1888',
    tenantId: 'tenant_1888',
  });

  assert.equal(calls.length, 1);
  assert.equal(result.brandId, 'brand_1888');
  assert.equal(result.serviceProviderId, 'provider_1888');
  assert.equal(result.duplicateStatus, 'possible_duplicate');
  assert.deepEqual(result.duplicateCandidate, {
    candidateId: 'dup_candidate_1888',
    candidateRef: 'dup_ref_1888',
    matchScore: 0.82,
    reasonCode: 'possible_duplicate',
    status: 'candidate',
  });
  assert.deepEqual(result.reporterRef, { id: 'reporter_ref_1888', role: 'reporter' });
  assert.deepEqual(result.customerRef, { id: 'customer_ref_1888', role: 'customer' });
  assert.deepEqual(result.billingContactRef, { id: 'billing_ref_1888', role: 'billing' });
  assert.deepEqual(result.onSiteContactOverrideRef, { id: 'site_ref_1888', role: 'onsite' });
  assert.equal(result.contactRoleSeparation, 'reviewed');
  assert.equal(result.platformAccepted, true);
  assert.equal(result.importAccepted, true);
  assert.equal(JSON.stringify(result).includes('confirmedDuplicate'), false);
  assert.equal(JSON.stringify(result).includes('case_should_not_escape'), false);
  assertNoUnsafeText(result);
});

test('rejected query throws sanitized repository error', async () => {
  const { client } = createDbClient({ reject: true });
  const repository = createRepairIntakeDraftRepository({ dbClient: client });

  await assert.rejects(
    () => repository.findDraftForConversion({
      draftId: 'draft_1166',
      organizationId: 'org_1166',
    }),
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
    "require('../providers",
    "require('../../providers",
    "require('../billing",
    "require('../../billing",
    'provider sending',
    'billing event',
  ]) {
    assert.equal(source.includes(forbidden), false, `forbidden source marker found: ${forbidden}`);
  }
});
