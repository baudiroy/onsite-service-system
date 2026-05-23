'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  RepairIntakeDraftCaseRuntimeDependencyFactoryError,
  createRepairIntakeDraftCaseRuntimeDependencies,
} = require('../../src/repairIntake/repairIntakeDraftCaseRuntimeDependencyFactory');

const SOURCE_PATH = path.join(
  __dirname,
  '../../src/repairIntake/repairIntakeDraftCaseRuntimeDependencyFactory.js',
);

function command(overrides = {}) {
  return {
    draftId: 'draft_task957_001',
    organizationId: 'org_task957',
    actorId: 'actor_task957',
    requestId: 'request_task957',
    idempotencyKey: 'idem_task957',
    ...overrides,
  };
}

function caseCandidate(overrides = {}) {
  return {
    sourceDraftId: 'draft_task957_001',
    organizationId: 'org_task957',
    brandId: 'brand_task957',
    serviceProviderId: 'provider_task957',
    intakeSource: 'web',
    serviceType: 'onsite',
    priority: 'normal',
    reporterRef: { refId: 'reporter_ref_task957', type: 'reporter' },
    customerRef: { refId: 'customer_ref_task957', type: 'customer' },
    billingContactRef: { refId: 'billing_ref_task957', type: 'billing_contact' },
    siteRef: { refId: 'site_ref_task957', type: 'service_site' },
    issueSummaryRef: { refId: 'issue_ref_task957', type: 'issue_summary' },
    createdByActorId: 'actor_task957',
    ...overrides,
  };
}

function creatorInput(overrides = {}) {
  return {
    command: command(),
    caseCandidate: caseCandidate(),
    ...overrides,
  };
}

function createDbClient(calls = []) {
  return {
    transaction: async (callback) => callback({
      insert: async (tableName, payload) => {
        calls.push({ method: 'tx.insert', tableName, payload });
        return { ok: true };
      },
      update: async (tableName, payload, where) => {
        calls.push({ method: 'tx.update', tableName, payload, where });
        return { ok: true };
      },
    }),
    query: async (sqlText, values) => {
      calls.push({ method: 'query', sqlText, values });
      return { rows: [] };
    },
    execute: async (sqlText, values) => {
      calls.push({ method: 'execute', sqlText, values });
      return { rows: [] };
    },
    insert: async (tableName, payload) => {
      calls.push({ method: 'insert', tableName, payload });
      return { ok: true };
    },
    update: async (tableName, payload, where) => {
      calls.push({ method: 'update', tableName, payload, where });
      return { ok: true };
    },
    findOne: async (tableName, where) => {
      calls.push({ method: 'findOne', tableName, where });
      return null;
    },
    selectOne: async (tableName, where) => {
      calls.push({ method: 'selectOne', tableName, where });
      return null;
    },
  };
}

function createIdGenerator() {
  const ids = ['case_task957_001', 'audit_task957_001'];

  return () => ids.shift() || 'generated_task957_extra';
}

function assertFactoryError(error, reasonCode) {
  assert.equal(error instanceof RepairIntakeDraftCaseRuntimeDependencyFactoryError, true);
  assert.equal(error.reasonCode, reasonCode);
  assert.equal(error.message, reasonCode);
}

function assertNoForbiddenFields(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'caseId',
    'case_id',
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

test('happy path returns all expected dependency keys', () => {
  const calls = [];
  const dependencies = createRepairIntakeDraftCaseRuntimeDependencies({
    dbClient: createDbClient(calls),
    idGenerator: createIdGenerator(),
    clock: () => '2026-05-23T12:00:00.000Z',
  });

  assert.deepEqual(Object.keys(dependencies).sort(), [
    'auditWriter',
    'caseCreator',
    'caseRepository',
    'idempotencyChecker',
    'repairIntakeDraftRepository',
    'transactionRunner',
  ]);
  assert.equal(typeof dependencies.caseRepository.createCaseFromRepairIntakeCandidate, 'function');
  assert.equal(typeof dependencies.repairIntakeDraftRepository.markDraftLinkedToCase, 'function');
  assert.equal(typeof dependencies.transactionRunner.runInTransaction, 'function');
  assert.equal(typeof dependencies.auditWriter.recordRepairIntakeDraftToCaseCreated, 'function');
  assert.equal(typeof dependencies.idempotencyChecker.checkDraftToCaseSubmission, 'function');
  assert.equal(typeof dependencies.caseCreator.createCaseFromCandidate, 'function');
  assert.deepEqual(calls, []);
});

test('returned caseCreator can be used with synthetic dependencies after factory creation', async () => {
  const calls = [];
  const dependencies = createRepairIntakeDraftCaseRuntimeDependencies({
    dbClient: createDbClient(calls),
    idGenerator: createIdGenerator(),
    clock: () => '2026-05-23T12:00:00.000Z',
  });

  assert.deepEqual(calls, []);

  const result = await dependencies.caseCreator.createCaseFromCandidate(creatorInput());

  assert.deepEqual(result, {
    id: 'case_task957_001',
    organizationId: 'org_task957',
    sourceDraftId: 'draft_task957_001',
    status: 'created',
  });
  assert.deepEqual(calls.map((call) => call.method), ['tx.insert', 'tx.update', 'tx.insert']);
  assert.equal(calls[0].tableName, 'cases');
  assert.equal(calls[1].tableName, 'repair_intake_drafts');
  assert.equal(calls[2].tableName, 'audit_events');
  assertNoForbiddenFields(result);
});

test('missing dbClient fails safely', () => {
  assert.throws(
    () => createRepairIntakeDraftCaseRuntimeDependencies({
      idGenerator: createIdGenerator(),
    }),
    (error) => {
      assertFactoryError(
        error,
        'REPAIR_INTAKE_DRAFT_CASE_RUNTIME_DEPENDENCIES_DB_CLIENT_REQUIRED',
      );
      assertNoForbiddenFields(error);
      return true;
    },
  );
});

test('missing idGenerator fails safely', () => {
  assert.throws(
    () => createRepairIntakeDraftCaseRuntimeDependencies({
      dbClient: createDbClient(),
    }),
    (error) => {
      assertFactoryError(
        error,
        'REPAIR_INTAKE_DRAFT_CASE_RUNTIME_DEPENDENCIES_ID_GENERATOR_REQUIRED',
      );
      assertNoForbiddenFields(error);
      return true;
    },
  );
});

test('invalid table name override fails safely', () => {
  assert.throws(
    () => createRepairIntakeDraftCaseRuntimeDependencies({
      dbClient: createDbClient(),
      idGenerator: createIdGenerator(),
      tableNames: {
        cases: 'cases; drop table cases',
      },
    }),
    (error) => {
      assertFactoryError(
        error,
        'REPAIR_INTAKE_DRAFT_CASE_RUNTIME_DEPENDENCIES_TABLE_NAME_INVALID',
      );
      assertNoForbiddenFields(error);
      return true;
    },
  );
});

test('unsupported table name override key fails safely', () => {
  assert.throws(
    () => createRepairIntakeDraftCaseRuntimeDependencies({
      dbClient: createDbClient(),
      idGenerator: createIdGenerator(),
      tableNames: {
        unsafe: 'safe_name',
      },
    }),
    (error) => {
      assertFactoryError(
        error,
        'REPAIR_INTAKE_DRAFT_CASE_RUNTIME_DEPENDENCIES_TABLE_NAME_KEY_INVALID',
      );
      return true;
    },
  );
});

test('valid table name overrides are passed to underlying adapters', async () => {
  const calls = [];
  const dependencies = createRepairIntakeDraftCaseRuntimeDependencies({
    dbClient: createDbClient(calls),
    idGenerator: createIdGenerator(),
    tableNames: {
      cases: 'runtime_cases',
      repairIntakeDrafts: 'runtime_repair_intake_drafts',
      auditEvents: 'runtime_audit_events',
      idempotencySubmissions: 'runtime_idempotency_submissions',
    },
  });

  await dependencies.caseRepository.createCaseFromRepairIntakeCandidate(creatorInput());
  await dependencies.repairIntakeDraftRepository.markDraftLinkedToCase({
    draftId: 'draft_task957_001',
    organizationId: 'org_task957',
    caseId: 'case_task957_001',
  });
  await dependencies.auditWriter.recordRepairIntakeDraftToCaseCreated({
    auditEvent: {
      eventType: 'repair_intake_draft_to_case_submission',
      outcome: 'submitted',
      draftId: 'draft_task957_001',
      organizationId: 'org_task957',
      actorId: 'actor_task957',
      caseRef: { id: 'case_task957_001' },
      reasonCode: 'CASE_REF_NORMALIZED',
      requiredActions: [],
    },
  });
  await dependencies.idempotencyChecker.checkDraftToCaseSubmission({
    draftId: 'draft_task957_001',
    organizationId: 'org_task957',
    idempotencyKey: 'idem_task957',
  });

  assert.deepEqual(calls.map((call) => call.tableName || call.sqlText), [
    'runtime_cases',
    'runtime_repair_intake_drafts',
    'runtime_audit_events',
    'runtime_idempotency_submissions',
  ]);
});

test('no adapter or db client method is called during factory creation', () => {
  const calls = [];
  const dbClient = createDbClient(calls);
  const idCalls = [];
  const idGenerator = () => {
    idCalls.push('called');
    return 'generated_task957';
  };

  createRepairIntakeDraftCaseRuntimeDependencies({
    dbClient,
    idGenerator,
  });

  assert.deepEqual(calls, []);
  assert.deepEqual(idCalls, []);
});

test('unsafe raw payload options are rejected and not returned', () => {
  assert.throws(
    () => createRepairIntakeDraftCaseRuntimeDependencies({
      dbClient: createDbClient(),
      idGenerator: createIdGenerator(),
      phone: '+886900000000',
      fullAddress: 'unsafe full address',
      customerPayload: { name: 'unsafe customer payload' },
      providerPayload: { token: 'unsafe token' },
      finalAppointmentId: 'final_appointment_task957',
    }),
    (error) => {
      assertFactoryError(
        error,
        'REPAIR_INTAKE_DRAFT_CASE_RUNTIME_DEPENDENCIES_UNSAFE_INPUT',
      );
      assertNoForbiddenFields(error);
      return true;
    },
  );
});

test('source does not import forbidden runtime areas', () => {
  const source = fs.readFileSync(SOURCE_PATH, 'utf8');

  for (const forbidden of [
    '../app',
    '../server',
    '../routes',
    '../controllers',
    '../providers',
    '../ai',
    '../admin',
    '../billing',
    '../smoke',
    '../migrations',
    '../db',
    'process.env',
    'pg',
    'knex',
    'sequelize',
  ]) {
    assert.equal(source.includes(forbidden), false, `source imports forbidden runtime ${forbidden}`);
  }
});
