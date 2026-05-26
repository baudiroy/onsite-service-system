'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  createRepairIntakeCaseRepositoryAdapter,
} = require('../../src/repairIntake/repairIntakeCaseRepositoryAdapter');

const SOURCE_PATH = path.join(__dirname, '../../src/repairIntake/repairIntakeCaseRepositoryAdapter.js');

function command(overrides = {}) {
  return {
    draftId: 'draft_task953_001',
    organizationId: 'org_task953',
    actorId: 'actor_task953',
    requestId: 'request_task953',
    idempotencyKey: 'idem_task953',
    ...overrides,
  };
}

function caseCandidate(overrides = {}) {
  return {
    sourceDraftId: 'draft_task953_001',
    organizationId: 'org_task953',
    caseNo: 'CASE-TASK953-001',
    customerId: 'customer_task953',
    source: 'web',
    brand: 'brand safe task953',
    brandId: 'brand_task953',
    serviceProviderId: 'provider_task953',
    intakeSource: 'web',
    serviceType: 'onsite',
    productType: 'appliance',
    modelNo: 'model_task953',
    problemDescription: 'task953 safe issue summary',
    priority: 'normal',
    reporterRef: { refId: 'reporter_ref_task953', type: 'reporter' },
    customerRef: { refId: 'customer_ref_task953', type: 'customer' },
    billingContactRef: { refId: 'billing_ref_task953', type: 'billing_contact' },
    siteRef: { refId: 'site_ref_task953', type: 'service_site' },
    issueSummaryRef: { refId: 'issue_ref_task953', type: 'issue_summary' },
    ...overrides,
  };
}

function wrappedInput(overrides = {}) {
  return {
    command: command(),
    caseCandidate: caseCandidate(),
    ...overrides,
  };
}

function createdResult(overrides = {}) {
  return {
    id: 'case_task953_001',
    organizationId: 'org_task953',
    sourceDraftId: 'draft_task953_001',
    status: 'created',
    ...overrides,
  };
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
    'field_service_reports',
    'token',
    'secret',
    'lineAccessToken',
    'LINE access token',
    'LINE marker',
    'rows',
    'sql',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('happy path creates Case using synthetic query db client and injected idGenerator', async () => {
  const calls = [];
  const dbClient = {
    query: async (sqlText, values) => {
      calls.push({ sqlText, values });
      return {
        rowCount: 1,
        rows: [{
          phone: 'phone',
          address: 'address',
          token: 'token',
          secret: 'secret',
        }],
      };
    },
  };
  const repository = createRepairIntakeCaseRepositoryAdapter({
    dbClient,
    idGenerator: () => 'case_task953_001',
    clock: () => '2026-05-23T12:00:00.000Z',
  });

  const result = await repository.createCaseFromRepairIntakeCandidate(wrappedInput());

  assert.deepEqual(result, createdResult());
  assert.equal(calls.length, 1);
  assert.equal(calls[0].sqlText.includes('insert into cases'), true);
  assert.deepEqual(calls[0].values, [
    'case_task953_001',
    'CASE-TASK953-001',
    'customer_task953',
    'org_task953',
    'draft',
    'normal',
    'website',
    'brand safe task953',
    'repair',
    'appliance',
    'model_task953',
    'task953 safe issue summary',
    null,
    null,
    null,
    '2026-05-23T12:00:00.000Z',
    null,
  ]);
  assertNoForbiddenFields(result);
});

test('supports wrapped creator input with command and caseCandidate', async () => {
  const calls = [];
  const repository = createRepairIntakeCaseRepositoryAdapter({
    dbClient: {
      insert: async (tableName, payload) => {
        calls.push({ tableName, payload });
        return { ok: true };
      },
    },
    idGenerator: {
      generate: () => 'case_task953_001',
    },
    clock: () => new Date('2026-05-23T12:00:00.000Z'),
  });

  const result = await repository.createCaseFromRepairIntakeCandidate(wrappedInput());

  assert.deepEqual(result, createdResult());
  assert.deepEqual(calls, [{
    tableName: 'cases',
    payload: {
      id: 'case_task953_001',
      sourceDraftId: 'draft_task953_001',
      case_no: 'CASE-TASK953-001',
      customer_id: 'customer_task953',
      organization_id: 'org_task953',
      status: 'draft',
      priority: 'normal',
      source: 'website',
      brand: 'brand safe task953',
      case_type: 'repair',
      product_type: 'appliance',
      model_no: 'model_task953',
      problem_description: 'task953 safe issue summary',
      service_region: null,
      customer_snapshot: null,
      metadata: null,
      created_at: '2026-05-23T12:00:00.000Z',
      created_by: null,
    },
  }]);
});

test('supports direct caseCandidate input', async () => {
  const calls = [];
  const repository = createRepairIntakeCaseRepositoryAdapter({
    dbClient: {
      insert: async (tableName, payload) => {
        calls.push({ tableName, payload });
        return { ok: true };
      },
    },
    idGenerator: () => 'case_task953_001',
  });

  const result = await repository.createCaseFromRepairIntakeCandidate(caseCandidate());

  assert.deepEqual(result, createdResult());
  assert.equal(calls.length, 1);
  assert.equal(calls[0].payload.case_no, 'CASE-TASK953-001');
  assert.equal(calls[0].payload.source, 'website');
});

test('supports tx override instead of base db client', async () => {
  const calls = { base: 0, tx: 0 };
  const repository = createRepairIntakeCaseRepositoryAdapter({
    dbClient: {
      query: async () => {
        calls.base += 1;
        return { rowCount: 1 };
      },
    },
    idGenerator: () => 'case_task953_001',
  });
  const tx = {
    query: async () => {
      calls.tx += 1;
      return { rowCount: 1 };
    },
  };

  const result = await repository.createCaseFromRepairIntakeCandidate(wrappedInput({ tx }));

  assert.deepEqual(result, createdResult());
  assert.equal(calls.base, 0);
  assert.equal(calls.tx, 1);
});

test('tx override no-row insert result is not reported as created', async () => {
  const calls = { base: 0, tx: 0 };
  const repository = createRepairIntakeCaseRepositoryAdapter({
    dbClient: {
      query: async () => {
        calls.base += 1;
        return { rowCount: 1 };
      },
    },
    idGenerator: () => 'case_task953_001',
  });
  const tx = {
    query: async () => {
      calls.tx += 1;
      return {
        rowCount: 0,
        rows: [{
          field_service_reports: 'field_service_reports',
          finalAppointmentId: 'finalAppointmentId',
          providerPayload: 'providerPayload',
          token: 'token',
          secret: 'secret',
          phone: 'phone',
          address: 'address',
          lineAccessToken: 'LINE marker',
        }],
        sql: 'select *',
        stack: 'stack trace',
      };
    },
  };

  const result = await repository.createCaseFromRepairIntakeCandidate(wrappedInput({ tx }));

  assert.equal(calls.tx, 1);
  assert.equal(calls.base, 0);
  assert.deepEqual(result, {
    ok: false,
    id: 'case_task953_001',
    organizationId: 'org_task953',
    sourceDraftId: 'draft_task953_001',
    status: 'failed',
    reasonCode: 'REPAIR_INTAKE_CASE_REPOSITORY_CREATE_FAILED',
    requiredActions: ['retry_or_manual_review'],
  });
  assertNoForbiddenFields(result);
});

test('missing dbClient fails safely', async () => {
  const repository = createRepairIntakeCaseRepositoryAdapter({
    idGenerator: () => 'case_task953_001',
  });

  const result = await repository.createCaseFromRepairIntakeCandidate(wrappedInput());

  assert.deepEqual(result, {
    ok: false,
    id: null,
    organizationId: 'org_task953',
    sourceDraftId: 'draft_task953_001',
    status: 'failed',
    reasonCode: 'REPAIR_INTAKE_CASE_REPOSITORY_DB_CLIENT_NOT_CONFIGURED',
    requiredActions: ['configure_db_client'],
  });
});

test('missing idGenerator fails safely', async () => {
  let called = false;
  const repository = createRepairIntakeCaseRepositoryAdapter({
    dbClient: {
      query: async () => {
        called = true;
        return { rowCount: 1 };
      },
    },
  });

  const result = await repository.createCaseFromRepairIntakeCandidate(wrappedInput());

  assert.deepEqual(result, {
    ok: false,
    id: null,
    organizationId: 'org_task953',
    sourceDraftId: 'draft_task953_001',
    status: 'failed',
    reasonCode: 'REPAIR_INTAKE_CASE_REPOSITORY_ID_GENERATOR_NOT_CONFIGURED',
    requiredActions: ['configure_id_generator'],
  });
  assert.equal(called, false);
});

test('missing caseNo without generator fails safely before DB call', async () => {
  let called = false;
  const repository = createRepairIntakeCaseRepositoryAdapter({
    dbClient: {
      query: async () => {
        called = true;
        return { rowCount: 1 };
      },
    },
    idGenerator: () => 'case_task953_001',
  });

  const result = await repository.createCaseFromRepairIntakeCandidate(caseCandidate({ caseNo: '' }));

  assert.deepEqual(result, {
    ok: false,
    id: 'case_task953_001',
    organizationId: 'org_task953',
    sourceDraftId: 'draft_task953_001',
    status: 'failed',
    reasonCode: 'REPAIR_INTAKE_CASE_REPOSITORY_CASE_NO_GENERATOR_NOT_CONFIGURED',
    requiredActions: ['configure_case_no_generator'],
  });
  assert.equal(called, false);
});

test('caseNumberGenerator supplies missing caseNo', async () => {
  const calls = [];
  const repository = createRepairIntakeCaseRepositoryAdapter({
    dbClient: {
      query: async (sqlText, values) => {
        calls.push({ sqlText, values });
        return { rowCount: 1 };
      },
    },
    idGenerator: () => 'case_task953_001',
    caseNumberGenerator: {
      next: () => 'CASE-GENERATED-953',
    },
  });

  const result = await repository.createCaseFromRepairIntakeCandidate(caseCandidate({ caseNo: '' }));

  assert.deepEqual(result, createdResult());
  assert.equal(calls[0].values[1], 'CASE-GENERATED-953');
});

test('missing formal case fields fail before DB call', async () => {
  for (const [overrides, reasonCode] of [
    [{ customerId: '' }, 'REPAIR_INTAKE_CASE_REPOSITORY_CUSTOMER_ID_MISSING'],
    [{ brand: '' }, 'REPAIR_INTAKE_CASE_REPOSITORY_BRAND_MISSING'],
    [{ productType: '' }, 'REPAIR_INTAKE_CASE_REPOSITORY_PRODUCT_TYPE_MISSING'],
    [{ modelNo: '' }, 'REPAIR_INTAKE_CASE_REPOSITORY_MODEL_NO_MISSING'],
    [{ problemDescription: '' }, 'REPAIR_INTAKE_CASE_REPOSITORY_PROBLEM_DESCRIPTION_MISSING'],
    [{ source: '', intakeSource: '' }, 'REPAIR_INTAKE_CASE_REPOSITORY_SOURCE_UNSUPPORTED'],
  ]) {
    let called = false;
    const repository = createRepairIntakeCaseRepositoryAdapter({
      dbClient: {
        query: async () => {
          called = true;
          return { rowCount: 1 };
        },
      },
      idGenerator: () => 'case_task953_001',
    });

    const result = await repository.createCaseFromRepairIntakeCandidate(caseCandidate(overrides));

    assert.equal(result.reasonCode, reasonCode);
    assert.equal(result.status, 'blocked');
    assert.equal(called, false);
  }
});

test('missing sourceDraftId fails before DB call', async () => {
  let called = false;
  const repository = createRepairIntakeCaseRepositoryAdapter({
    dbClient: {
      query: async () => {
        called = true;
        return { rowCount: 1 };
      },
    },
    idGenerator: () => 'case_task953_001',
  });

  const result = await repository.createCaseFromRepairIntakeCandidate(caseCandidate({ sourceDraftId: '' }));

  assert.deepEqual(result, {
    ok: false,
    id: null,
    organizationId: null,
    sourceDraftId: null,
    status: 'blocked',
    reasonCode: 'REPAIR_INTAKE_CASE_REPOSITORY_CANDIDATE_MISSING',
    requiredActions: ['provide_sanitized_case_candidate'],
  });
  assert.equal(called, false);
});

test('missing organizationId fails before DB call', async () => {
  let called = false;
  const repository = createRepairIntakeCaseRepositoryAdapter({
    dbClient: {
      query: async () => {
        called = true;
        return { rowCount: 1 };
      },
    },
    idGenerator: () => 'case_task953_001',
  });

  const result = await repository.createCaseFromRepairIntakeCandidate(caseCandidate({ organizationId: '' }));

  assert.deepEqual(result, {
    ok: false,
    id: null,
    organizationId: null,
    sourceDraftId: null,
    status: 'blocked',
    reasonCode: 'REPAIR_INTAKE_CASE_REPOSITORY_CANDIDATE_MISSING',
    requiredActions: ['provide_sanitized_case_candidate'],
  });
  assert.equal(called, false);
});

test('missing generated case id fails before DB call', async () => {
  let called = false;
  const repository = createRepairIntakeCaseRepositoryAdapter({
    dbClient: {
      query: async () => {
        called = true;
        return { rowCount: 1 };
      },
    },
    idGenerator: () => '',
  });

  const result = await repository.createCaseFromRepairIntakeCandidate(wrappedInput());

  assert.deepEqual(result, {
    ok: false,
    id: null,
    organizationId: 'org_task953',
    sourceDraftId: 'draft_task953_001',
    status: 'blocked',
    reasonCode: 'REPAIR_INTAKE_CASE_REPOSITORY_CASE_ID_MISSING',
    requiredActions: ['provide_case_id_generator'],
  });
  assert.equal(called, false);
});

test('invalid generated case id fails before DB call', async () => {
  let called = false;
  const repository = createRepairIntakeCaseRepositoryAdapter({
    dbClient: {
      query: async () => {
        called = true;
        return { rowCount: 1 };
      },
    },
    idGenerator: () => null,
  });

  const result = await repository.createCaseFromRepairIntakeCandidate(wrappedInput());

  assert.equal(result.reasonCode, 'REPAIR_INTAKE_CASE_REPOSITORY_CASE_ID_MISSING');
  assert.equal(called, false);
});

test('command and candidate organization mismatch fails before DB call', async () => {
  let called = false;
  const repository = createRepairIntakeCaseRepositoryAdapter({
    dbClient: {
      query: async () => {
        called = true;
        return { rowCount: 1 };
      },
    },
    idGenerator: () => 'case_task953_001',
  });

  const result = await repository.createCaseFromRepairIntakeCandidate(wrappedInput({
    command: command({ organizationId: 'org_other' }),
  }));

  assert.deepEqual(result, {
    ok: false,
    id: null,
    organizationId: 'org_task953',
    sourceDraftId: 'draft_task953_001',
    status: 'blocked',
    reasonCode: 'REPAIR_INTAKE_CASE_REPOSITORY_ORGANIZATION_MISMATCH',
    requiredActions: ['manual_review'],
  });
  assert.equal(called, false);
});

test('command draft and candidate sourceDraft mismatch fails before DB call', async () => {
  let called = false;
  const repository = createRepairIntakeCaseRepositoryAdapter({
    dbClient: {
      query: async () => {
        called = true;
        return { rowCount: 1 };
      },
    },
    idGenerator: () => 'case_task953_001',
  });

  const result = await repository.createCaseFromRepairIntakeCandidate(wrappedInput({
    command: command({ draftId: 'draft_other' }),
  }));

  assert.deepEqual(result, {
    ok: false,
    id: null,
    organizationId: 'org_task953',
    sourceDraftId: 'draft_task953_001',
    status: 'blocked',
    reasonCode: 'REPAIR_INTAKE_CASE_REPOSITORY_SOURCE_DRAFT_MISMATCH',
    requiredActions: ['manual_review'],
  });
  assert.equal(called, false);
});

test('unsafe input fields are rejected before DB call', async () => {
  let called = false;
  const repository = createRepairIntakeCaseRepositoryAdapter({
    dbClient: {
      query: async () => {
        called = true;
        return { rowCount: 1 };
      },
    },
    idGenerator: () => 'case_task953_001',
  });

  const result = await repository.createCaseFromRepairIntakeCandidate(wrappedInput({
    caseCandidate: caseCandidate({
      phone: 'phone',
      address: 'address',
      customerPayload: 'customerPayload',
      rawImportedRowPayload: 'rawImportedRowPayload',
      rawPayload: 'rawPayload',
      providerPayload: 'providerPayload',
      token: 'token',
      secret: 'secret',
      lineAccessToken: 'LINE access token',
      finalAppointmentId: 'final_should_not_copy',
      caseId: 'unsafe_case_id',
    }),
  }));

  assert.deepEqual(result, {
    ok: false,
    id: null,
    organizationId: null,
    sourceDraftId: null,
    status: 'blocked',
    reasonCode: 'REPAIR_INTAKE_CASE_REPOSITORY_UNSAFE_INPUT',
    requiredActions: ['provide_sanitized_case_candidate'],
  });
  assert.equal(called, false);
  assertNoForbiddenFields(result);
});

test('DB client throw returns safe failed envelope without raw error leakage', async () => {
  const repository = createRepairIntakeCaseRepositoryAdapter({
    dbClient: {
      query: async () => {
        throw new Error('select * stack trace providerPayload token secret phone address customerPayload lineAccessToken');
      },
    },
    idGenerator: () => 'case_task953_001',
  });

  const result = await repository.createCaseFromRepairIntakeCandidate(wrappedInput());

  assert.deepEqual(result, {
    ok: false,
    id: 'case_task953_001',
    organizationId: 'org_task953',
    sourceDraftId: 'draft_task953_001',
    status: 'failed',
    reasonCode: 'REPAIR_INTAKE_CASE_REPOSITORY_CREATE_FAILED',
    requiredActions: ['retry_or_manual_review'],
  });
  assertNoForbiddenFields(result);
});

test('DB explicit failure returns safe failed envelope without raw rows or SQL', async () => {
  const repository = createRepairIntakeCaseRepositoryAdapter({
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
    idGenerator: () => 'case_task953_001',
  });

  const result = await repository.createCaseFromRepairIntakeCandidate(wrappedInput());

  assert.deepEqual(result, {
    ok: false,
    id: 'case_task953_001',
    organizationId: 'org_task953',
    sourceDraftId: 'draft_task953_001',
    status: 'failed',
    reasonCode: 'REPAIR_INTAKE_CASE_REPOSITORY_CREATE_FAILED',
    requiredActions: ['retry_or_manual_review'],
  });
  assertNoForbiddenFields(result);
});

test('execute style passes parameter values separately and does not interpolate raw user values into SQL', async () => {
  let observed;
  const repository = createRepairIntakeCaseRepositoryAdapter({
    dbClient: {
      execute: async (sqlText, values) => {
        observed = { sqlText, values };
        return { rowCount: 1 };
      },
    },
    idGenerator: () => 'case_task953_001',
  });
  const rawSourceDraftId = "draft_task953_002'; drop table repair_intake_drafts; --";
  const rawBrandText = "brand_task953_002'; unsafe marker; --";

  const result = await repository.createCaseFromRepairIntakeCandidate(caseCandidate({
    sourceDraftId: rawSourceDraftId,
    brand: rawBrandText,
  }));

  assert.equal(result.ok, undefined);
  assert.equal(result.id, 'case_task953_001');
  assert.equal(observed.sqlText.includes(rawSourceDraftId), false);
  assert.equal(observed.sqlText.includes(rawBrandText), false);
  assert.equal(observed.values.includes(rawSourceDraftId), false);
  assert.equal(observed.values.includes(rawBrandText), true);
  assertNoForbiddenFields(result);
});

test('insert style db client receives sanitized payload without SQL text', async () => {
  const calls = [];
  const repository = createRepairIntakeCaseRepositoryAdapter({
    dbClient: {
      insert: async (tableName, payload) => {
        calls.push({ tableName, payload });
        return {
          rows: [{ phone: 'phone', address: 'address', token: 'token' }],
        };
      },
    },
    idGenerator: {
      next: () => 'case_task953_001',
    },
  });

  const result = await repository.createCaseFromRepairIntakeCandidate(wrappedInput());

  assert.deepEqual(result, createdResult());
  assert.equal(calls[0].tableName, 'cases');
  assert.equal(calls[0].payload.id, 'case_task953_001');
  assert.equal(calls[0].payload.sourceDraftId, 'draft_task953_001');
  assert.equal(calls[0].payload.source_repair_intake_draft_id, undefined);
  assert.equal(calls[0].payload.phone, undefined);
  assertNoForbiddenFields(result);
});

test('invalid table name fails safely before DB call', async () => {
  let called = false;
  const repository = createRepairIntakeCaseRepositoryAdapter({
    dbClient: {
      query: async () => {
        called = true;
        return { rowCount: 1 };
      },
    },
    idGenerator: () => 'case_task953_001',
    tableName: 'cases; drop table cases',
  });

  const result = await repository.createCaseFromRepairIntakeCandidate(wrappedInput());

  assert.deepEqual(result, {
    ok: false,
    id: null,
    organizationId: 'org_task953',
    sourceDraftId: 'draft_task953_001',
    status: 'failed',
    reasonCode: 'REPAIR_INTAKE_CASE_REPOSITORY_TABLE_NAME_INVALID',
    requiredActions: ['configure_repository_table'],
  });
  assert.equal(called, false);
});

test('unsupported db client fails safely', async () => {
  const repository = createRepairIntakeCaseRepositoryAdapter({
    dbClient: {},
    idGenerator: () => 'case_task953_001',
  });

  const result = await repository.createCaseFromRepairIntakeCandidate(wrappedInput());

  assert.deepEqual(result, {
    ok: false,
    id: 'case_task953_001',
    organizationId: 'org_task953',
    sourceDraftId: 'draft_task953_001',
    status: 'failed',
    reasonCode: 'REPAIR_INTAKE_CASE_REPOSITORY_DB_CLIENT_UNSUPPORTED',
    requiredActions: ['configure_db_client'],
  });
});

test('idGenerator throw returns safe failed envelope without raw error leakage', async () => {
  let called = false;
  const repository = createRepairIntakeCaseRepositoryAdapter({
    dbClient: {
      query: async () => {
        called = true;
        return { rowCount: 1 };
      },
    },
    idGenerator: () => {
      throw new Error('select * stack trace providerPayload token secret phone address customerPayload');
    },
  });

  const result = await repository.createCaseFromRepairIntakeCandidate(wrappedInput());

  assert.deepEqual(result, {
    ok: false,
    id: null,
    organizationId: 'org_task953',
    sourceDraftId: 'draft_task953_001',
    status: 'failed',
    reasonCode: 'REPAIR_INTAKE_CASE_REPOSITORY_ID_GENERATION_FAILED',
    requiredActions: ['retry_or_manual_review'],
  });
  assert.equal(called, false);
  assertNoForbiddenFields(result);
});

test('clock failure does not block DB call or leak raw error', async () => {
  const calls = [];
  const repository = createRepairIntakeCaseRepositoryAdapter({
    dbClient: {
      query: async (sqlText, values) => {
        calls.push({ sqlText, values });
        return { rowCount: 1 };
      },
    },
    idGenerator: () => 'case_task953_001',
    clock: () => {
      throw new Error('select * stack trace providerPayload token secret phone address customerPayload');
    },
  });

  const result = await repository.createCaseFromRepairIntakeCandidate(wrappedInput());

  assert.deepEqual(result, createdResult());
  assert.equal(typeof calls[0].values[15], 'string');
  assertNoForbiddenFields(result);
});

test('create alias works', async () => {
  const repository = createRepairIntakeCaseRepositoryAdapter({
    dbClient: {
      query: async () => ({ rowCount: 1 }),
    },
    idGenerator: () => 'case_task953_001',
  });

  const result = await repository.create(wrappedInput());

  assert.deepEqual(result, createdResult());
});

test('adapter source does not import global DB API provider AI admin billing smoke or concrete runtime', () => {
  const source = fs.readFileSync(SOURCE_PATH, 'utf8');
  const specifiers = [];
  const requirePattern = /\brequire\(\s*['"]([^'"]+)['"]\s*\)/g;
  let match;

  while ((match = requirePattern.exec(source)) !== null) {
    specifiers.push(match[1]);
  }

  assert.deepEqual(specifiers, []);

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
  ]) {
    assert.equal(source.includes(`require('${forbidden}`), false, `source should not import ${forbidden}`);
    assert.equal(source.includes(`require("${forbidden}`), false, `source should not import ${forbidden}`);
    assert.equal(source.includes(`from '${forbidden}`), false, `source should not import ${forbidden}`);
    assert.equal(source.includes(`from "${forbidden}`), false, `source should not import ${forbidden}`);
  }

  for (const forbiddenRuntime of [
    'createDefault',
    'defaultDbClient',
    'defaultIdGenerator',
    'auditWriter',
    'idempotencyStore',
    'markDraftLinkedToCase',
  ]) {
    assert.equal(source.includes(forbiddenRuntime), false, `source should not include ${forbiddenRuntime}`);
  }
});
