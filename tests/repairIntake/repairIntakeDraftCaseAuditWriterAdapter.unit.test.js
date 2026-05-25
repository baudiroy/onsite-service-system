'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  createRepairIntakeDraftCaseAuditWriterAdapter,
} = require('../../src/repairIntake/repairIntakeDraftCaseAuditWriterAdapter');

const SOURCE_PATH = path.join(__dirname, '../../src/repairIntake/repairIntakeDraftCaseAuditWriterAdapter.js');

function auditEvent(overrides = {}) {
  return {
    eventType: 'repair_intake_draft_to_case_submission',
    outcome: 'submitted',
    draftId: 'draft_task955_001',
    organizationId: 'org_task955',
    actorId: 'actor_task955',
    requestId: 'request_task955',
    idempotencyKey: 'idem_task955',
    caseRef: {
      id: 'case_task955_001',
      organizationId: 'org_task955',
      sourceDraftId: 'draft_task955_001',
      status: 'created',
    },
    reasonCode: 'CASE_REF_NORMALIZED',
    requiredActions: [],
    ...overrides,
  };
}

function wrappedInput(overrides = {}) {
  return {
    auditEvent: auditEvent(),
    ...overrides,
  };
}

function recordedResult(overrides = {}) {
  return {
    ok: true,
    auditEventId: 'audit_task955_001',
    eventType: 'repair_intake_draft_to_case_submission',
    organizationId: 'org_task955',
    subjectId: 'draft_task955_001',
    status: 'recorded',
    reasonCode: 'REPAIR_INTAKE_DRAFT_CASE_AUDIT_RECORDED',
    requiredActions: [],
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
    'field_service_reports',
    'rows',
    'sql',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('happy path records submitted audit event using synthetic query db client and injected idGenerator', async () => {
  const calls = [];
  const repository = createRepairIntakeDraftCaseAuditWriterAdapter({
    dbClient: {
      query: async (sqlText, values) => {
        calls.push({ sqlText, values });
        return {
          rowCount: 1,
          rows: [{ phone: 'phone', address: 'address', token: 'token' }],
        };
      },
    },
    idGenerator: () => 'audit_task955_001',
    clock: () => '2026-05-23T12:00:00.000Z',
  });

  const result = await repository.recordRepairIntakeDraftToCaseCreated(wrappedInput());

  assert.deepEqual(result, recordedResult());
  assert.equal(calls.length, 1);
  assert.equal(calls[0].sqlText.includes('insert into audit_events'), true);
  assert.deepEqual(calls[0].values, [
    'audit_task955_001',
    'repair_intake_draft_to_case_submission',
    'submitted',
    'org_task955',
    'actor_task955',
    'request_task955',
    'idem_task955',
    'repair_intake_draft',
    'draft_task955_001',
    'case_task955_001',
    'CASE_REF_NORMALIZED',
    [],
    '2026-05-23T12:00:00.000Z',
  ]);
  assertNoForbiddenFields(result);
});

test('supports wrapped auditEvent and tx input with insert style client', async () => {
  const calls = [];
  const tx = {
    insert: async (tableName, payload) => {
      calls.push({ tableName, payload });
      return { ok: true };
    },
  };
  const repository = createRepairIntakeDraftCaseAuditWriterAdapter({
    dbClient: {
      insert: async () => {
        throw new Error('base client should not be called');
      },
    },
    idGenerator: {
      generate: () => 'audit_task955_001',
    },
    clock: () => new Date('2026-05-23T12:00:00.000Z'),
  });

  const result = await repository.recordRepairIntakeDraftToCaseCreated(wrappedInput({ tx }));

  assert.deepEqual(result, recordedResult());
  assert.deepEqual(calls, [{
    tableName: 'audit_events',
    payload: {
      id: 'audit_task955_001',
      event_type: 'repair_intake_draft_to_case_submission',
      outcome: 'submitted',
      organization_id: 'org_task955',
      actor_id: 'actor_task955',
      request_id: 'request_task955',
      idempotency_key: 'idem_task955',
      subject_type: 'repair_intake_draft',
      subject_id: 'draft_task955_001',
      related_case_id: 'case_task955_001',
      reason_code: 'CASE_REF_NORMALIZED',
      required_actions: [],
      created_at: '2026-05-23T12:00:00.000Z',
    },
  }]);
});

test('tx query path uses transaction client and keeps SQL parameterized', async () => {
  const baseCalls = [];
  const txCalls = [];
  const tx = {
    query: async (sqlText, values) => {
      txCalls.push({ sqlText, values });
      return {
        rowCount: 1,
        rows: [{
          rawRows: [{ phone: 'phone', address: 'address' }],
          stack: 'stack trace',
          token: 'token',
          secret: 'secret',
          providerPayload: 'providerPayload',
          field_service_reports: 'field_service_reports',
          finalAppointmentId: 'finalAppointmentId',
          lineAccessToken: 'LINE access token',
        }],
      };
    },
  };
  const repository = createRepairIntakeDraftCaseAuditWriterAdapter({
    dbClient: {
      query: async (...args) => {
        baseCalls.push(args);
        throw new Error('base client should not be called');
      },
    },
    idGenerator: () => 'audit_task955_001',
    clock: () => '2026-05-23T12:00:00.000Z',
  });
  const rawRequestId = "request_task1602'; select * from field_service_reports; --";
  const rawCaseId = 'case_task1602_providerPayload_token_secret_phone_address_LINE access token';

  const result = await repository.recordRepairIntakeDraftToCaseCreated(wrappedInput({
    tx,
    auditEvent: auditEvent({
      requestId: rawRequestId,
      caseRef: {
        id: rawCaseId,
        organizationId: 'org_task955',
        sourceDraftId: 'draft_task955_001',
        status: 'created',
      },
    }),
  }));

  assert.deepEqual(result, recordedResult());
  assert.deepEqual(baseCalls, []);
  assert.equal(txCalls.length, 1);
  assert.equal(txCalls[0].sqlText.includes('$1'), true);
  assert.equal(txCalls[0].sqlText.includes('$13'), true);
  assert.equal(txCalls[0].sqlText.includes(rawRequestId), false);
  assert.equal(txCalls[0].sqlText.includes(rawCaseId), false);
  assert.equal(txCalls[0].sqlText.includes('field_service_reports'), false);
  assert.equal(txCalls[0].values.includes(rawRequestId), true);
  assert.equal(txCalls[0].values.includes(rawCaseId), true);
  assertNoForbiddenFields(result);
});

test('supports direct audit event input', async () => {
  const calls = [];
  const repository = createRepairIntakeDraftCaseAuditWriterAdapter({
    dbClient: {
      insert: async (tableName, payload) => {
        calls.push({ tableName, payload });
        return { ok: true };
      },
    },
    idGenerator: () => 'audit_task955_001',
  });

  const result = await repository.recordRepairIntakeDraftToCaseCreated(auditEvent());

  assert.deepEqual(result, recordedResult());
  assert.equal(calls.length, 1);
});

test('missing dbClient fails safely', async () => {
  const repository = createRepairIntakeDraftCaseAuditWriterAdapter({
    idGenerator: () => 'audit_task955_001',
  });

  const result = await repository.recordRepairIntakeDraftToCaseCreated(wrappedInput());

  assert.deepEqual(result, {
    ok: false,
    auditEventId: null,
    eventType: 'repair_intake_draft_to_case_submission',
    organizationId: 'org_task955',
    subjectId: 'draft_task955_001',
    status: 'failed',
    reasonCode: 'REPAIR_INTAKE_DRAFT_CASE_AUDIT_DB_CLIENT_NOT_CONFIGURED',
    requiredActions: ['configure_db_client'],
  });
});

test('missing idGenerator fails safely', async () => {
  let called = false;
  const repository = createRepairIntakeDraftCaseAuditWriterAdapter({
    dbClient: {
      query: async () => {
        called = true;
        return { rowCount: 1 };
      },
    },
  });

  const result = await repository.recordRepairIntakeDraftToCaseCreated(wrappedInput());

  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_CASE_AUDIT_ID_GENERATOR_NOT_CONFIGURED');
  assert.equal(result.status, 'failed');
  assert.equal(called, false);
});

test('missing required audit fields fail before DB call', async () => {
  for (const [field, reasonCode] of [
    ['draftId', 'REPAIR_INTAKE_DRAFT_CASE_AUDIT_DRAFT_ID_MISSING'],
    ['organizationId', 'REPAIR_INTAKE_DRAFT_CASE_AUDIT_ORGANIZATION_MISSING'],
    ['actorId', 'REPAIR_INTAKE_DRAFT_CASE_AUDIT_ACTOR_MISSING'],
  ]) {
    let called = false;
    const repository = createRepairIntakeDraftCaseAuditWriterAdapter({
      dbClient: {
        query: async () => {
          called = true;
          return { rowCount: 1 };
        },
      },
      idGenerator: () => 'audit_task955_001',
    });

    const result = await repository.recordRepairIntakeDraftToCaseCreated(wrappedInput({
      auditEvent: auditEvent({ [field]: '' }),
    }));

    assert.equal(result.reasonCode, reasonCode);
    assert.equal(result.status, 'blocked');
    assert.equal(called, false);
  }
});

test('invalid event type fails before DB call', async () => {
  let called = false;
  const repository = createRepairIntakeDraftCaseAuditWriterAdapter({
    dbClient: {
      query: async () => {
        called = true;
        return { rowCount: 1 };
      },
    },
    idGenerator: () => 'audit_task955_001',
  });

  const result = await repository.recordRepairIntakeDraftToCaseCreated(wrappedInput({
    auditEvent: auditEvent({ eventType: 'other_event' }),
  }));

  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_CASE_AUDIT_EVENT_TYPE_INVALID');
  assert.equal(result.status, 'blocked');
  assert.equal(called, false);
});

test('invalid outcome fails before DB call', async () => {
  let called = false;
  const repository = createRepairIntakeDraftCaseAuditWriterAdapter({
    dbClient: {
      query: async () => {
        called = true;
        return { rowCount: 1 };
      },
    },
    idGenerator: () => 'audit_task955_001',
  });

  const result = await repository.recordRepairIntakeDraftToCaseCreated(wrappedInput({
    auditEvent: auditEvent({ outcome: 'unknown' }),
  }));

  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_CASE_AUDIT_OUTCOME_INVALID');
  assert.equal(result.status, 'blocked');
  assert.equal(called, false);
});

test('unsafe input fields are rejected before DB call', async () => {
  let called = false;
  const repository = createRepairIntakeDraftCaseAuditWriterAdapter({
    dbClient: {
      query: async () => {
        called = true;
        return { rowCount: 1 };
      },
    },
    idGenerator: () => 'audit_task955_001',
  });

  const result = await repository.recordRepairIntakeDraftToCaseCreated(wrappedInput({
    auditEvent: auditEvent({
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
    }),
  }));

  assert.deepEqual(result, {
    ok: false,
    auditEventId: null,
    eventType: null,
    organizationId: null,
    subjectId: null,
    status: 'blocked',
    reasonCode: 'REPAIR_INTAKE_DRAFT_CASE_AUDIT_UNSAFE_INPUT',
    requiredActions: ['provide_sanitized_audit_event'],
  });
  assert.equal(called, false);
  assertNoForbiddenFields(result);
});

test('DB client throw returns safe failed envelope without raw error leakage', async () => {
  const repository = createRepairIntakeDraftCaseAuditWriterAdapter({
    dbClient: {
      query: async () => {
        throw new Error('select * stack trace providerPayload token secret phone address customerPayload lineAccessToken');
      },
    },
    idGenerator: () => 'audit_task955_001',
  });

  const result = await repository.recordRepairIntakeDraftToCaseCreated(wrappedInput());

  assert.deepEqual(result, {
    ok: false,
    auditEventId: 'audit_task955_001',
    eventType: 'repair_intake_draft_to_case_submission',
    organizationId: 'org_task955',
    subjectId: 'draft_task955_001',
    status: 'failed',
    reasonCode: 'REPAIR_INTAKE_DRAFT_CASE_AUDIT_WRITE_FAILED',
    requiredActions: ['retry_or_manual_review'],
  });
  assertNoForbiddenFields(result);
});

test('DB explicit failure returns safe failed envelope without raw rows or SQL', async () => {
  const repository = createRepairIntakeDraftCaseAuditWriterAdapter({
    dbClient: {
      query: async () => ({
        ok: false,
        sql: 'select *',
        rows: [{ phone: 'phone', address: 'address' }],
        token: 'token',
        secret: 'secret',
      }),
    },
    idGenerator: () => 'audit_task955_001',
  });

  const result = await repository.recordRepairIntakeDraftToCaseCreated(wrappedInput());

  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_CASE_AUDIT_WRITE_FAILED');
  assert.equal(result.status, 'failed');
  assertNoForbiddenFields(result);
});

test('execute style passes parameter values separately and does not interpolate raw user values into SQL', async () => {
  let observed;
  const repository = createRepairIntakeDraftCaseAuditWriterAdapter({
    dbClient: {
      execute: async (sqlText, values) => {
        observed = { sqlText, values };
        return { rowCount: 1 };
      },
    },
    idGenerator: {
      next: () => 'audit_task955_001',
    },
  });
  const rawDraftId = "draft_task955_002'; drop table audit_events; --";
  const rawRequestId = "request_task955_002'; unsafe marker; --";

  const result = await repository.recordRepairIntakeDraftToCaseCreated(auditEvent({
    draftId: rawDraftId,
    requestId: rawRequestId,
  }));

  assert.equal(result.auditEventId, 'audit_task955_001');
  assert.equal(observed.sqlText.includes(rawDraftId), false);
  assert.equal(observed.sqlText.includes(rawRequestId), false);
  assert.equal(observed.values.includes(rawDraftId), true);
  assert.equal(observed.values.includes(rawRequestId), true);
  assertNoForbiddenFields(result);
});

test('invalid table name fails safely before DB call', async () => {
  let called = false;
  const repository = createRepairIntakeDraftCaseAuditWriterAdapter({
    dbClient: {
      query: async () => {
        called = true;
        return { rowCount: 1 };
      },
    },
    idGenerator: () => 'audit_task955_001',
    tableName: 'audit_events; drop table audit_events',
  });

  const result = await repository.recordRepairIntakeDraftToCaseCreated(wrappedInput());

  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_CASE_AUDIT_TABLE_NAME_INVALID');
  assert.equal(result.status, 'failed');
  assert.equal(called, false);
});

test('unsupported db client fails safely', async () => {
  const repository = createRepairIntakeDraftCaseAuditWriterAdapter({
    dbClient: {},
    idGenerator: () => 'audit_task955_001',
  });

  const result = await repository.recordRepairIntakeDraftToCaseCreated(wrappedInput());

  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_CASE_AUDIT_DB_CLIENT_UNSUPPORTED');
  assert.equal(result.status, 'failed');
  assertNoForbiddenFields(result);
});

test('missing generated audit id fails before DB call', async () => {
  let called = false;
  const repository = createRepairIntakeDraftCaseAuditWriterAdapter({
    dbClient: {
      query: async () => {
        called = true;
        return { rowCount: 1 };
      },
    },
    idGenerator: () => '',
  });

  const result = await repository.recordRepairIntakeDraftToCaseCreated(wrappedInput());

  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_CASE_AUDIT_ID_MISSING');
  assert.equal(result.status, 'blocked');
  assert.equal(called, false);
});

test('idGenerator throw returns safe failed envelope without raw error leakage', async () => {
  let called = false;
  const repository = createRepairIntakeDraftCaseAuditWriterAdapter({
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

  const result = await repository.recordRepairIntakeDraftToCaseCreated(wrappedInput());

  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_CASE_AUDIT_ID_GENERATION_FAILED');
  assert.equal(result.status, 'failed');
  assert.equal(called, false);
  assertNoForbiddenFields(result);
});

test('record alias works', async () => {
  const repository = createRepairIntakeDraftCaseAuditWriterAdapter({
    dbClient: {
      query: async () => ({ rowCount: 1 }),
    },
    idGenerator: () => 'audit_task955_001',
  });

  const result = await repository.record(wrappedInput());

  assert.deepEqual(result, recordedResult());
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
    'defaultAuditWriter',
    'defaultIdGenerator',
    'caseRepository',
    'draftRepository',
    'idempotencyStore',
  ]) {
    assert.equal(source.includes(forbiddenRuntime), false, `source should not include ${forbiddenRuntime}`);
  }
});
