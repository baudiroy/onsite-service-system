'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  createRepairIntakeDraftRepositoryAdapter,
} = require('../../src/repairIntake/repairIntakeDraftRepositoryAdapter');

const SOURCE_PATH = path.join(__dirname, '../../src/repairIntake/repairIntakeDraftRepositoryAdapter.js');

function linkInput(overrides = {}) {
  return {
    draftId: 'draft_task952_001',
    organizationId: 'org_task952',
    caseId: 'case_task952_001',
    actorId: 'actor_task952',
    requestId: 'request_task952',
    idempotencyKey: 'idem_task952',
    ...overrides,
  };
}

function linkedResult(overrides = {}) {
  return {
    ok: true,
    draftId: 'draft_task952_001',
    organizationId: 'org_task952',
    caseId: 'case_task952_001',
    status: 'linked',
    reasonCode: 'REPAIR_INTAKE_DRAFT_LINKED_TO_CASE',
    requiredActions: [],
    ...overrides,
  };
}

function assertNoForbiddenFields(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'finalAppointmentId',
    'final_appointment_id',
    'phone',
    'address',
    'customerPayload',
    'rawImportedRowPayload',
    'rawPayload',
    'select *',
    'stack trace',
    'providerPayload',
    'token',
    'secret',
    'lineAccessToken',
    'LINE access token',
    'rows',
    'sql',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('happy path marks draft linked using synthetic query db client', async () => {
  const calls = [];
  const dbClient = {
    query: async (sqlText, values) => {
      calls.push({ sqlText, values });
      return {
        rowCount: 1,
        rows: [{
          phone: 'phone',
          address: 'address',
          customerPayload: 'customerPayload',
          token: 'token',
          secret: 'secret',
        }],
      };
    },
  };
  const repository = createRepairIntakeDraftRepositoryAdapter({
    dbClient,
    clock: () => '2026-05-23T12:00:00.000Z',
  });

  const result = await repository.markDraftLinkedToCase(linkInput());

  assert.deepEqual(result, linkedResult());
  assert.equal(calls.length, 1);
  assert.equal(calls[0].sqlText.includes('repair_intake_drafts'), true);
  assert.deepEqual(calls[0].values, [
    'case_task952_001',
    '2026-05-23T12:00:00.000Z',
    'actor_task952',
    'request_task952',
    'idem_task952',
    'draft_task952_001',
    'org_task952',
  ]);
  assertNoForbiddenFields(result);
});

test('query style passes parameter values separately and does not interpolate raw user values into SQL', async () => {
  let observed;
  const dbClient = {
    query: async (sqlText, values) => {
      observed = { sqlText, values };
      return { rowCount: 1 };
    },
  };
  const repository = createRepairIntakeDraftRepositoryAdapter({ dbClient });
  const rawDraftId = "draft_task952_002'; drop table customers; --";
  const rawCaseId = "case_task952_002'; unsafe marker; --";

  const result = await repository.markDraftLinkedToCase(linkInput({
    draftId: rawDraftId,
    caseId: rawCaseId,
    phone: 'phone',
    address: 'address',
    customerPayload: 'customerPayload',
  }));

  assert.equal(result.ok, true);
  assert.equal(observed.sqlText.includes(rawDraftId), false);
  assert.equal(observed.sqlText.includes(rawCaseId), false);
  assert.equal(observed.values.includes(rawDraftId), true);
  assert.equal(observed.values.includes(rawCaseId), true);
  assertNoForbiddenFields(result);
});

test('execute style db client is supported', async () => {
  const calls = [];
  const dbClient = {
    execute: async (sqlText, values) => {
      calls.push({ sqlText, values });
      return { rowCount: 1 };
    },
  };
  const repository = createRepairIntakeDraftRepositoryAdapter({
    dbClient,
    tableName: 'repair_intake_drafts',
  });

  const result = await repository.markDraftLinkedToCase(linkInput());

  assert.deepEqual(result, linkedResult());
  assert.equal(calls.length, 1);
  assert.equal(calls[0].values[0], 'case_task952_001');
});

test('update style db client is supported without SQL text', async () => {
  const calls = [];
  const dbClient = {
    update: async (tableName, payload, where) => {
      calls.push({ tableName, payload, where });
      return { rowCount: 1 };
    },
  };
  const repository = createRepairIntakeDraftRepositoryAdapter({
    dbClient,
    clock: () => new Date('2026-05-23T12:00:00.000Z'),
  });

  const result = await repository.markDraftLinkedToCase(linkInput());

  assert.deepEqual(result, linkedResult());
  assert.deepEqual(calls, [{
    tableName: 'repair_intake_drafts',
    payload: {
      linked_case_id: 'case_task952_001',
      linked_at: '2026-05-23T12:00:00.000Z',
      linked_by_actor_id: 'actor_task952',
      link_request_id: 'request_task952',
      link_idempotency_key: 'idem_task952',
    },
    where: {
      id: 'draft_task952_001',
      organization_id: 'org_task952',
    },
  }]);
});

test('tx override is used instead of base db client', async () => {
  const calls = {
    base: 0,
    tx: 0,
  };
  const dbClient = {
    query: async () => {
      calls.base += 1;
      return { rowCount: 1 };
    },
  };
  const tx = {
    query: async () => {
      calls.tx += 1;
      return { rowCount: 1 };
    },
  };
  const repository = createRepairIntakeDraftRepositoryAdapter({ dbClient });

  const result = await repository.markDraftLinkedToCase(linkInput({ tx }));

  assert.deepEqual(result, linkedResult());
  assert.equal(calls.base, 0);
  assert.equal(calls.tx, 1);
});

test('missing dbClient fails safely', async () => {
  const repository = createRepairIntakeDraftRepositoryAdapter();

  const result = await repository.markDraftLinkedToCase(linkInput());

  assert.deepEqual(result, {
    ok: false,
    draftId: 'draft_task952_001',
    organizationId: 'org_task952',
    caseId: 'case_task952_001',
    status: 'failed',
    reasonCode: 'REPAIR_INTAKE_DRAFT_REPOSITORY_DB_CLIENT_NOT_CONFIGURED',
    requiredActions: ['configure_db_client'],
  });
});

test('unsupported dbClient fails safely', async () => {
  const repository = createRepairIntakeDraftRepositoryAdapter({ dbClient: {} });

  const result = await repository.markDraftLinkedToCase(linkInput());

  assert.deepEqual(result, {
    ok: false,
    draftId: 'draft_task952_001',
    organizationId: 'org_task952',
    caseId: 'case_task952_001',
    status: 'failed',
    reasonCode: 'REPAIR_INTAKE_DRAFT_REPOSITORY_DB_CLIENT_UNSUPPORTED',
    requiredActions: ['configure_db_client'],
  });
});

test('invalid table name fails safely before db call', async () => {
  let called = false;
  const repository = createRepairIntakeDraftRepositoryAdapter({
    dbClient: {
      query: async () => {
        called = true;
        return { rowCount: 1 };
      },
    },
    tableName: 'repair_intake_drafts; drop table repair_intake_drafts',
  });

  const result = await repository.markDraftLinkedToCase(linkInput());

  assert.deepEqual(result, {
    ok: false,
    draftId: 'draft_task952_001',
    organizationId: 'org_task952',
    caseId: 'case_task952_001',
    status: 'failed',
    reasonCode: 'REPAIR_INTAKE_DRAFT_REPOSITORY_TABLE_NAME_INVALID',
    requiredActions: ['configure_repository_table'],
  });
  assert.equal(called, false);
});

test('missing draftId fails before DB call', async () => {
  let called = false;
  const repository = createRepairIntakeDraftRepositoryAdapter({
    dbClient: {
      query: async () => {
        called = true;
        return { rowCount: 1 };
      },
    },
  });

  const result = await repository.markDraftLinkedToCase(linkInput({ draftId: '' }));

  assert.deepEqual(result, {
    ok: false,
    draftId: null,
    organizationId: 'org_task952',
    caseId: 'case_task952_001',
    status: 'blocked',
    reasonCode: 'REPAIR_INTAKE_DRAFT_LINK_DRAFT_ID_MISSING',
    requiredActions: ['provide_draft_id'],
  });
  assert.equal(called, false);
});

test('missing organizationId fails before DB call', async () => {
  let called = false;
  const repository = createRepairIntakeDraftRepositoryAdapter({
    dbClient: {
      query: async () => {
        called = true;
        return { rowCount: 1 };
      },
    },
  });

  const result = await repository.markDraftLinkedToCase(linkInput({ organizationId: '' }));

  assert.deepEqual(result, {
    ok: false,
    draftId: 'draft_task952_001',
    organizationId: null,
    caseId: 'case_task952_001',
    status: 'blocked',
    reasonCode: 'REPAIR_INTAKE_DRAFT_LINK_ORGANIZATION_MISSING',
    requiredActions: ['provide_organization_scope'],
  });
  assert.equal(called, false);
});

test('missing caseId fails before DB call', async () => {
  let called = false;
  const repository = createRepairIntakeDraftRepositoryAdapter({
    dbClient: {
      query: async () => {
        called = true;
        return { rowCount: 1 };
      },
    },
  });

  const result = await repository.markDraftLinkedToCase(linkInput({ caseId: '' }));

  assert.deepEqual(result, {
    ok: false,
    draftId: 'draft_task952_001',
    organizationId: 'org_task952',
    caseId: null,
    status: 'blocked',
    reasonCode: 'REPAIR_INTAKE_DRAFT_LINK_CASE_ID_MISSING',
    requiredActions: ['provide_case_id'],
  });
  assert.equal(called, false);
});

test('caseRef input is accepted for Task950 adapter compatibility', async () => {
  const repository = createRepairIntakeDraftRepositoryAdapter({
    dbClient: {
      query: async () => ({ rowCount: 1 }),
    },
  });

  const result = await repository.markDraftLinkedToCase(linkInput({
    caseId: undefined,
    caseRef: { id: 'case_task952_001' },
  }));

  assert.deepEqual(result, linkedResult());
});

test('DB client throw returns safe failed envelope without raw error leakage', async () => {
  const repository = createRepairIntakeDraftRepositoryAdapter({
    dbClient: {
      query: async () => {
        throw new Error('select * stack trace providerPayload token secret phone address customerPayload lineAccessToken');
      },
    },
  });

  const result = await repository.markDraftLinkedToCase(linkInput());

  assert.deepEqual(result, {
    ok: false,
    draftId: 'draft_task952_001',
    organizationId: 'org_task952',
    caseId: 'case_task952_001',
    status: 'failed',
    reasonCode: 'REPAIR_INTAKE_DRAFT_LINK_DB_FAILED',
    requiredActions: ['retry_or_manual_review'],
  });
  assertNoForbiddenFields(result);
});

test('DB explicit failure returns safe failed envelope without raw rows', async () => {
  const repository = createRepairIntakeDraftRepositoryAdapter({
    dbClient: {
      query: async () => ({
        ok: false,
        sql: 'select *',
        rows: [{ phone: 'phone', address: 'address' }],
        stack: 'stack trace',
        providerPayload: 'providerPayload',
        token: 'token',
        secret: 'secret',
      }),
    },
  });

  const result = await repository.markDraftLinkedToCase(linkInput());

  assert.deepEqual(result, {
    ok: false,
    draftId: 'draft_task952_001',
    organizationId: 'org_task952',
    caseId: 'case_task952_001',
    status: 'failed',
    reasonCode: 'REPAIR_INTAKE_DRAFT_LINK_DB_FAILED',
    requiredActions: ['retry_or_manual_review'],
  });
  assertNoForbiddenFields(result);
});

test('zero affected rows returns safe blocked envelope', async () => {
  const repository = createRepairIntakeDraftRepositoryAdapter({
    dbClient: {
      query: async () => ({ rowCount: 0 }),
    },
  });

  const result = await repository.markDraftLinkedToCase(linkInput());

  assert.deepEqual(result, {
    ok: false,
    draftId: 'draft_task952_001',
    organizationId: 'org_task952',
    caseId: 'case_task952_001',
    status: 'blocked',
    reasonCode: 'REPAIR_INTAKE_DRAFT_LINK_NOT_APPLIED',
    requiredActions: ['manual_review'],
  });
});

test('clock failure does not block db call or leak raw error', async () => {
  const calls = [];
  const repository = createRepairIntakeDraftRepositoryAdapter({
    dbClient: {
      query: async (sqlText, values) => {
        calls.push({ sqlText, values });
        return { rowCount: 1 };
      },
    },
    clock: () => {
      throw new Error('select * stack trace providerPayload token secret phone address customerPayload');
    },
  });

  const result = await repository.markDraftLinkedToCase(linkInput());

  assert.deepEqual(result, linkedResult());
  assert.equal(calls[0].values[1], null);
  assertNoForbiddenFields(result);
});

test('markLinkedToCase alias works', async () => {
  const repository = createRepairIntakeDraftRepositoryAdapter({
    dbClient: {
      query: async () => ({ rowCount: 1 }),
    },
  });

  const result = await repository.markLinkedToCase(linkInput());

  assert.deepEqual(result, linkedResult());
});

test('adapter source does not import global DB API provider AI admin billing smoke or concrete runtime', () => {
  const source = fs.readFileSync(SOURCE_PATH, 'utf8');

  assert.equal(source.includes('require('), false);

  for (const forbidden of [
    '../repositories',
    '../routes',
    '../controllers',
    '../providers',
    '../ai',
    '../billing',
    '../admin',
    '../smoke',
    'pg',
    'sequelize',
    'knex',
    'openai',
    'line',
    'sms',
    'createDefault',
    'defaultDbClient',
    'auditWriter',
    'idempotencyStore',
  ]) {
    assert.equal(source.includes(forbidden), false, `source should not include ${forbidden}`);
  }
});
