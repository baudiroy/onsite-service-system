'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  createRepairIntakeDraftCaseIdempotencyCheckerAdapter,
} = require('../../src/repairIntake/repairIntakeDraftCaseIdempotencyCheckerAdapter');

const SOURCE_PATH = path.join(__dirname, '../../src/repairIntake/repairIntakeDraftCaseIdempotencyCheckerAdapter.js');

function checkInput(overrides = {}) {
  return {
    draftId: 'draft_task956_001',
    organizationId: 'org_task956',
    actorId: 'actor_task956',
    requestId: 'request_task956',
    idempotencyKey: 'idem_task956',
    ...overrides,
  };
}

function caseRef(overrides = {}) {
  return {
    id: 'case_task956_001',
    organizationId: 'org_task956',
    sourceDraftId: 'draft_task956_001',
    status: 'created',
    ...overrides,
  };
}

function dbRow(overrides = {}) {
  return {
    related_case_id: 'case_task956_001',
    organization_id: 'org_task956',
    source_draft_id: 'draft_task956_001',
    case_status: 'created',
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

test('available path when no existing record is found', async () => {
  const repository = createRepairIntakeDraftCaseIdempotencyCheckerAdapter({
    dbClient: {
      query: async () => ({ rows: [] }),
    },
  });

  const result = await repository.checkDraftToCaseSubmission(checkInput());

  assert.deepEqual(result, {
    ok: true,
    decision: 'available',
    reasonCode: 'IDEMPOTENCY_AVAILABLE',
    requiredActions: [],
    caseRef: null,
  });
});

test('conflict path when existing sanitized case ref is found', async () => {
  const repository = createRepairIntakeDraftCaseIdempotencyCheckerAdapter({
    dbClient: {
      query: async () => ({ rows: [dbRow()] }),
    },
  });

  const result = await repository.checkDraftToCaseSubmission(checkInput());

  assert.deepEqual(result, {
    ok: false,
    decision: 'conflict',
    reasonCode: 'IDEMPOTENCY_CONFLICT',
    requiredActions: ['REVIEW_EXISTING_DRAFT_TO_CASE_SUBMISSION'],
    caseRef: caseRef(),
  });
  assertNoForbiddenFields(result);
});

test('supports query sqlText and values with separate parameter values', async () => {
  let observed;
  const repository = createRepairIntakeDraftCaseIdempotencyCheckerAdapter({
    dbClient: {
      query: async (sqlText, values) => {
        observed = { sqlText, values };
        return { rows: [] };
      },
    },
  });
  const rawDraftId = "draft_task956_002'; drop table cases; --";
  const rawKey = "idem_task956_002'; unsafe marker; --";

  const result = await repository.checkDraftToCaseSubmission(checkInput({
    draftId: rawDraftId,
    idempotencyKey: rawKey,
  }));

  assert.equal(result.decision, 'available');
  assert.equal(observed.sqlText.includes(rawDraftId), false);
  assert.equal(observed.sqlText.includes(rawKey), false);
  assert.equal(observed.values.includes(rawDraftId), true);
  assert.equal(observed.values.includes(rawKey), true);
});

test('supports execute sqlText and values with separate parameter values', async () => {
  let observed;
  const repository = createRepairIntakeDraftCaseIdempotencyCheckerAdapter({
    dbClient: {
      execute: async (sqlText, values) => {
        observed = { sqlText, values };
        return { rows: [dbRow()] };
      },
    },
  });

  const result = await repository.checkDraftToCaseSubmission(checkInput());

  assert.equal(result.decision, 'conflict');
  assert.equal(observed.sqlText.includes('repair_intake_draft_case_submissions'), true);
  assert.deepEqual(observed.values, ['org_task956', 'draft_task956_001', 'idem_task956']);
});

test('supports findOne query-builder style', async () => {
  const calls = [];
  const repository = createRepairIntakeDraftCaseIdempotencyCheckerAdapter({
    dbClient: {
      findOne: async (tableName, where) => {
        calls.push({ tableName, where });
        return dbRow();
      },
    },
  });

  const result = await repository.checkDraftToCaseSubmission(checkInput());

  assert.equal(result.decision, 'conflict');
  assert.deepEqual(calls, [{
    tableName: 'repair_intake_draft_case_submissions',
    where: {
      organization_id: 'org_task956',
      source_draft_id: 'draft_task956_001',
      idempotency_key: 'idem_task956',
    },
  }]);
});

test('supports selectOne query-builder style', async () => {
  const repository = createRepairIntakeDraftCaseIdempotencyCheckerAdapter({
    dbClient: {
      selectOne: async () => ({
        caseRef: caseRef(),
        rows: [{ phone: 'phone', address: 'address', token: 'token' }],
      }),
    },
  });

  const result = await repository.checkDraftToCaseSubmission(checkInput());

  assert.deepEqual(result.caseRef, caseRef());
  assertNoForbiddenFields(result);
});

test('missing dbClient fails safely', async () => {
  const repository = createRepairIntakeDraftCaseIdempotencyCheckerAdapter();

  const result = await repository.checkDraftToCaseSubmission(checkInput());

  assert.deepEqual(result, {
    ok: false,
    decision: 'failed',
    reasonCode: 'IDEMPOTENCY_DB_CLIENT_NOT_CONFIGURED',
    requiredActions: ['configure_db_client'],
    caseRef: null,
  });
});

test('missing draftId fails before DB-client call', async () => {
  let called = false;
  const repository = createRepairIntakeDraftCaseIdempotencyCheckerAdapter({
    dbClient: {
      query: async () => {
        called = true;
        return { rows: [] };
      },
    },
  });

  const result = await repository.checkDraftToCaseSubmission(checkInput({ draftId: '' }));

  assert.equal(result.reasonCode, 'IDEMPOTENCY_DRAFT_ID_MISSING');
  assert.equal(result.decision, 'failed');
  assert.equal(called, false);
});

test('missing organizationId fails before DB-client call', async () => {
  let called = false;
  const repository = createRepairIntakeDraftCaseIdempotencyCheckerAdapter({
    dbClient: {
      query: async () => {
        called = true;
        return { rows: [] };
      },
    },
  });

  const result = await repository.checkDraftToCaseSubmission(checkInput({ organizationId: '' }));

  assert.equal(result.reasonCode, 'IDEMPOTENCY_ORGANIZATION_MISSING');
  assert.equal(called, false);
});

test('missing idempotencyKey fails before DB-client call', async () => {
  let called = false;
  const repository = createRepairIntakeDraftCaseIdempotencyCheckerAdapter({
    dbClient: {
      query: async () => {
        called = true;
        return { rows: [] };
      },
    },
  });

  const result = await repository.checkDraftToCaseSubmission(checkInput({ idempotencyKey: '' }));

  assert.equal(result.reasonCode, 'IDEMPOTENCY_KEY_MISSING');
  assert.equal(called, false);
});

test('invalid table name fails before DB-client call', async () => {
  let called = false;
  const repository = createRepairIntakeDraftCaseIdempotencyCheckerAdapter({
    dbClient: {
      query: async () => {
        called = true;
        return { rows: [] };
      },
    },
    tableName: 'repair_intake_draft_case_submissions; drop table cases',
  });

  const result = await repository.checkDraftToCaseSubmission(checkInput());

  assert.equal(result.reasonCode, 'IDEMPOTENCY_TABLE_NAME_INVALID');
  assert.equal(called, false);
});

test('DB client throw returns safe failed result without raw error leakage', async () => {
  const repository = createRepairIntakeDraftCaseIdempotencyCheckerAdapter({
    dbClient: {
      query: async () => {
        throw new Error('select * stack trace providerPayload token secret phone address customerPayload lineAccessToken');
      },
    },
  });

  const result = await repository.checkDraftToCaseSubmission(checkInput());

  assert.deepEqual(result, {
    ok: false,
    decision: 'failed',
    reasonCode: 'IDEMPOTENCY_CHECK_FAILED',
    requiredActions: ['retry_or_manual_review'],
    caseRef: null,
  });
  assertNoForbiddenFields(result);
});

test('raw DB rows SQL text and sensitive fields are not returned', async () => {
  const repository = createRepairIntakeDraftCaseIdempotencyCheckerAdapter({
    dbClient: {
      query: async () => ({
        rows: [dbRow({
          phone: 'phone',
          address: 'address',
          customerPayload: 'customerPayload',
          rawImportedRowPayload: 'rawImportedRowPayload',
          providerPayload: 'providerPayload',
          token: 'token',
          secret: 'secret',
          lineAccessToken: 'LINE access token',
          finalAppointmentId: 'final_should_not_copy',
          sql: 'select *',
        })],
      }),
    },
  });

  const result = await repository.checkDraftToCaseSubmission(checkInput());

  assert.equal(result.decision, 'conflict');
  assertNoForbiddenFields(result);
});

test('unsafe input fields are rejected before DB-client call', async () => {
  let called = false;
  const repository = createRepairIntakeDraftCaseIdempotencyCheckerAdapter({
    dbClient: {
      query: async () => {
        called = true;
        return { rows: [] };
      },
    },
  });

  const result = await repository.checkDraftToCaseSubmission(checkInput({
    phone: 'phone',
    address: 'address',
    customerPayload: 'customerPayload',
    rawImportedRowPayload: 'rawImportedRowPayload',
    providerPayload: 'providerPayload',
    token: 'token',
    secret: 'secret',
    lineAccessToken: 'LINE access token',
    finalAppointmentId: 'final_should_not_copy',
    caseId: 'unsafe_case_id',
  }));

  assert.equal(result.reasonCode, 'IDEMPOTENCY_CHECK_UNSAFE_INPUT');
  assert.equal(called, false);
  assertNoForbiddenFields(result);
});

test('organization mismatch in DB-like result fails safely without trusted caseRef', async () => {
  const repository = createRepairIntakeDraftCaseIdempotencyCheckerAdapter({
    dbClient: {
      query: async () => ({ rows: [dbRow({ organization_id: 'org_other' })] }),
    },
  });

  const result = await repository.checkDraftToCaseSubmission(checkInput());

  assert.deepEqual(result, {
    ok: false,
    decision: 'failed',
    reasonCode: 'IDEMPOTENCY_CASE_REF_ORGANIZATION_MISMATCH',
    requiredActions: ['manual_review'],
    caseRef: null,
  });
});

test('draft/sourceDraft mismatch in DB-like result fails safely without trusted caseRef', async () => {
  const repository = createRepairIntakeDraftCaseIdempotencyCheckerAdapter({
    dbClient: {
      query: async () => ({ rows: [dbRow({ source_draft_id: 'draft_other' })] }),
    },
  });

  const result = await repository.checkDraftToCaseSubmission(checkInput());

  assert.equal(result.reasonCode, 'IDEMPOTENCY_CASE_REF_SOURCE_DRAFT_MISMATCH');
  assert.equal(result.caseRef, null);
});

test('record without safe case reference fails safely', async () => {
  const repository = createRepairIntakeDraftCaseIdempotencyCheckerAdapter({
    dbClient: {
      query: async () => ({ rows: [{ organization_id: 'org_task956', source_draft_id: 'draft_task956_001' }] }),
    },
  });

  const result = await repository.checkDraftToCaseSubmission(checkInput());

  assert.equal(result.reasonCode, 'IDEMPOTENCY_EXISTING_CASE_REF_MISSING');
  assert.equal(result.caseRef, null);
});

test('unsupported db client fails safely', async () => {
  const repository = createRepairIntakeDraftCaseIdempotencyCheckerAdapter({
    dbClient: {},
  });

  const result = await repository.checkDraftToCaseSubmission(checkInput());

  assert.equal(result.reasonCode, 'IDEMPOTENCY_DB_CLIENT_UNSUPPORTED');
  assert.equal(result.decision, 'failed');
});

test('check alias works', async () => {
  const repository = createRepairIntakeDraftCaseIdempotencyCheckerAdapter({
    dbClient: {
      query: async () => ({ rows: [] }),
    },
  });

  const result = await repository.check(checkInput());

  assert.equal(result.decision, 'available');
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
    'defaultChecker',
    'defaultStore',
    'defaultWriter',
    'auditWriter',
    'caseRepository',
    'draftRepository',
  ]) {
    assert.equal(source.includes(forbiddenRuntime), false, `source should not include ${forbiddenRuntime}`);
  }
});
