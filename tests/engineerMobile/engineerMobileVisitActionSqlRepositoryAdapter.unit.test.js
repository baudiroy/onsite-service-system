'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  ENGINEER_MOBILE_VISIT_ACTION_SQL_REPOSITORY_ADAPTER_KIND,
  createEngineerMobileVisitActionSqlRepositoryAdapter,
} = require('../../src/engineerMobile/engineerMobileVisitActionSqlRepositoryAdapter');

const NOW = '2026-05-29T03:30:00.000Z';

function transitionPatchEnvelope(overrides = {}) {
  const patch = {
    mobileVisitStatus: 'traveling',
    updatedBy: '11111111-1111-4111-8111-111111111111',
    updatedAt: NOW,
    ...(overrides.patch || {}),
  };

  return {
    patchKind: 'engineer_mobile.visit_action_transition_patch',
    entityType: 'appointment',
    entityId: '22222222-2222-4222-8222-222222222222',
    organizationId: '33333333-3333-4333-8333-333333333333',
    action: 'engineer_mobile.start_travel',
    patch,
    auditContext: {
      actorId: '11111111-1111-4111-8111-111111111111',
      caseId: '44444444-4444-4444-8444-444444444444',
      appointmentId: '22222222-2222-4222-8222-222222222222',
      requestId: 'req_task_1865',
    },
    ...Object.fromEntries(Object.entries(overrides).filter(([key]) => key !== 'patch')),
  };
}

function auditEventEnvelope(overrides = {}) {
  const action = overrides.action || 'engineer_mobile.start_travel.allowed';
  const auditEvent = {
    action,
    entityType: 'appointment',
    entityId: '22222222-2222-4222-8222-222222222222',
    actorId: '11111111-1111-4111-8111-111111111111',
    organizationId: '33333333-3333-4333-8333-333333333333',
    occurredAt: NOW,
    caseId: '44444444-4444-4444-8444-444444444444',
    appointmentId: '22222222-2222-4222-8222-222222222222',
    requestId: 'req_task_1865',
    ...(overrides.auditEvent || {}),
  };

  return {
    eventKind: 'engineer_mobile.visit_action_audit_event',
    action,
    entityType: 'appointment',
    entityId: '22222222-2222-4222-8222-222222222222',
    actorId: '11111111-1111-4111-8111-111111111111',
    organizationId: '33333333-3333-4333-8333-333333333333',
    occurredAt: NOW,
    auditEvent,
    ...Object.fromEntries(Object.entries(overrides).filter(([key]) => key !== 'auditEvent')),
  };
}

function validInput(overrides = {}) {
  return {
    transitionPatchEnvelope: transitionPatchEnvelope(overrides.transitionPatchEnvelope || {}),
    ...(
      overrides.auditEventEnvelope === undefined
        ? {}
        : { auditEventEnvelope: auditEventEnvelope(overrides.auditEventEnvelope || {}) }
    ),
  };
}

function createSyntheticDbClient({ calls = [], queryImpl, transactionImpl } = {}) {
  const dbClient = {
    query(querySpec) {
      calls.push(querySpec);

      if (queryImpl) {
        return queryImpl(querySpec, calls.length);
      }

      return {
        rowCount: 1,
        rows: [{ raw_db_row: 'raw row should not leak' }],
      };
    },
  };

  if (transactionImpl) {
    dbClient.transaction = transactionImpl;
  }

  return dbClient;
}

function assertFailure(result, reasonCode) {
  assert.equal(result.ok, false);
  assert.equal(result.persisted, false);
  assert.equal(result.adapterKind, ENGINEER_MOBILE_VISIT_ACTION_SQL_REPOSITORY_ADAPTER_KIND);
  assert.equal(result.reasonCode, reasonCode);
}

function assertSuccess(result, auditRecorded) {
  assert.equal(result.ok, true);
  assert.equal(result.persisted, true);
  assert.equal(result.written, true);
  assert.equal(result.transitionPersisted, true);
  assert.equal(result.auditRecorded, auditRecorded);
  assert.equal(result.adapterKind, ENGINEER_MOBILE_VISIT_ACTION_SQL_REPOSITORY_ADAPTER_KIND);
  assert.equal(result.reasonCode, 'repository_write_succeeded');
}

function assertNoRawLeak(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'raw row should not leak',
    'raw audit row should not leak',
    'raw query error should not leak',
    'raw transaction error should not leak',
    'raw db credential should not leak',
    'raw provider payload should not leak',
    'raw customer publication should not leak',
    'DATABASE_URL',
    'postgres' + '://',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

function assertParameterized(querySpec) {
  const allowedSqlLiterals = new Set([
    'traveling',
    'arrived',
    'working',
    'work_finished',
    'visit_result_recorded',
  ]);

  assert.equal(typeof querySpec.text, 'string');
  assert.equal(Array.isArray(querySpec.values), true);
  assert.equal(Object.isFrozen(querySpec.values), true);
  assert.equal(querySpec.text.includes('${'), false);

  for (const rawValue of querySpec.values.filter((value) => value !== null)) {
    if (allowedSqlLiterals.has(rawValue)) {
      continue;
    }

    assert.equal(querySpec.text.includes(String(rawValue)), false, `query text includes raw value ${rawValue}`);
  }
}

test('missing dbClient query or execute returns db_client_required', async () => {
  const missing = createEngineerMobileVisitActionSqlRepositoryAdapter({});
  const malformed = createEngineerMobileVisitActionSqlRepositoryAdapter({ dbClient: {} });

  assert.equal(missing.kind, ENGINEER_MOBILE_VISIT_ACTION_SQL_REPOSITORY_ADAPTER_KIND);
  assertFailure(await missing.persist(validInput()), 'db_client_required');
  assertFailure(await malformed.persist(validInput()), 'db_client_required');
});

test('accepted update and audit path uses injected dbClient transaction and parameterized query specs', async () => {
  const calls = [];
  const transactionCalls = [];
  const dbClient = createSyntheticDbClient({
    calls,
    transactionImpl(callback) {
      transactionCalls.push('transaction');

      return callback(this);
    },
  });
  const adapter = createEngineerMobileVisitActionSqlRepositoryAdapter({ dbClient });
  const result = await adapter.persist(validInput({ auditEventEnvelope: {} }));

  assertSuccess(result, true);
  assert.deepEqual(transactionCalls, ['transaction']);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].name, 'engineerMobileVisitActionUpdateAppointment');
  assert.match(calls[0].text, /^UPDATE appointments AS a/);
  assert.match(calls[0].text, /\bFROM cases AS c\b/);
  assert.deepEqual(calls[0].values, [
    '22222222-2222-4222-8222-222222222222',
    '33333333-3333-4333-8333-333333333333',
    'traveling',
    null,
    NOW,
    '11111111-1111-4111-8111-111111111111',
  ]);
  assert.equal(calls[1].name, 'engineerMobileVisitActionInsertAuditLog');
  assert.match(calls[1].text, /^INSERT INTO audit_logs/);
  assert.deepEqual(calls[1].values, [
    '11111111-1111-4111-8111-111111111111',
    'engineer_mobile.start_travel.allowed',
    '22222222-2222-4222-8222-222222222222',
    '33333333-3333-4333-8333-333333333333',
    '44444444-4444-4444-8444-444444444444',
    '22222222-2222-4222-8222-222222222222',
    'req_task_1865',
    NOW,
  ]);
  calls.forEach(assertParameterized);
  assertNoRawLeak(result);
});

test('record visit result persists visit_result_recorded and safe visit result values', async () => {
  const calls = [];
  const adapter = createEngineerMobileVisitActionSqlRepositoryAdapter({
    dbClient: createSyntheticDbClient({ calls }),
  });
  const result = await adapter.persist(validInput({
    transitionPatchEnvelope: {
      action: 'engineer_mobile.record_visit_result',
      patch: {
        mobileVisitStatus: 'visit_result_recorded',
        visitResult: 'parts_required',
      },
    },
    auditEventEnvelope: {
      action: 'engineer_mobile.record_visit_result.allowed',
    },
  }));

  assertSuccess(result, true);
  assert.equal(calls[0].values[2], 'visit_result_recorded');
  assert.equal(calls[0].values[3], 'parts_required');
  assert.equal(calls[1].values[1], 'engineer_mobile.record_visit_result.allowed');
});

test('no matching appointment returns safe not found or denied result and skips audit insert', async () => {
  const calls = [];
  const adapter = createEngineerMobileVisitActionSqlRepositoryAdapter({
    dbClient: createSyntheticDbClient({
      calls,
      queryImpl() {
        return {
          rowCount: 0,
          rows: [{ raw_db_row: 'raw row should not leak' }],
        };
      },
    }),
  });
  const result = await adapter.persist(validInput({ auditEventEnvelope: {} }));

  assertFailure(result, 'appointment_not_found_or_denied');
  assert.equal(calls.length, 1);
  assertNoRawLeak(result);
});

test('persistence failure path is sanitized and does not expose raw DB client details', async () => {
  const calls = [];
  const adapter = createEngineerMobileVisitActionSqlRepositoryAdapter({
    dbClient: createSyntheticDbClient({
      calls,
      queryImpl() {
        return {
          ok: false,
          error: 'raw query error should not leak',
          credential: 'raw db credential should not leak',
        };
      },
    }),
  });
  const result = await adapter.persist(validInput());

  assertFailure(result, 'repository_write_failed');
  assert.equal(calls.length, 1);
  assertNoRawLeak(result);
});

test('audit insert failure is sanitized after accepted appointment update', async () => {
  const calls = [];
  const adapter = createEngineerMobileVisitActionSqlRepositoryAdapter({
    dbClient: createSyntheticDbClient({
      calls,
      queryImpl(querySpec, callNumber) {
        if (callNumber === 2) {
          return {
            ok: false,
            error: 'raw audit row should not leak',
          };
        }

        return { rowCount: 1 };
      },
    }),
  });
  const result = await adapter.persist(validInput({ auditEventEnvelope: {} }));

  assertFailure(result, 'audit_write_failed');
  assert.equal(calls.length, 2);
  assertNoRawLeak(result);
});

test('transaction or client error path is sanitized', async () => {
  const adapter = createEngineerMobileVisitActionSqlRepositoryAdapter({
    dbClient: createSyntheticDbClient({
      transactionImpl() {
        throw new Error('raw transaction error should not leak');
      },
    }),
  });
  const result = await adapter.persist(validInput({ auditEventEnvelope: {} }));

  assertFailure(result, 'repository_write_failed');
  assertNoRawLeak(result);
});

test('async synthetic dbClient query is supported without exposing raw rows', async () => {
  const calls = [];
  const adapter = createEngineerMobileVisitActionSqlRepositoryAdapter({
    dbClient: createSyntheticDbClient({
      calls,
      queryImpl: async () => ({
        rowCount: 1,
        rows: [{ raw_db_row: 'raw row should not leak' }],
      }),
    }),
  });
  const result = await adapter.persist(validInput({ auditEventEnvelope: {} }));

  assertSuccess(result, true);
  assert.equal(calls.length, 2);
  assertNoRawLeak(result);
});

test('validation failure prevents DB client invocation', async () => {
  const calls = [];
  const adapter = createEngineerMobileVisitActionSqlRepositoryAdapter({
    dbClient: createSyntheticDbClient({ calls }),
  });
  const result = await adapter.persist(validInput({
    transitionPatchEnvelope: {
      finalAppointmentId: 'raw customer publication should not leak',
    },
  }));

  assertFailure(result, 'final_appointment_boundary');
  assert.deepEqual(calls, []);
  assertNoRawLeak(result);
});

test('raw rows and unsafe input fields are never returned to higher layers', async () => {
  const adapter = createEngineerMobileVisitActionSqlRepositoryAdapter({
    dbClient: createSyntheticDbClient({
      queryImpl() {
        return {
          rowCount: 1,
          rows: [{
            customer_phone: 'raw provider payload should not leak',
            customer_visible_publication: 'raw customer publication should not leak',
          }],
        };
      },
    }),
  });
  const result = await adapter.persist(validInput({ auditEventEnvelope: {} }));

  assert.deepEqual(Object.keys(result).sort(), [
    'adapterKind',
    'auditRecorded',
    'ok',
    'persisted',
    'reasonCode',
    'transitionPersisted',
    'written',
  ].sort());
  assertNoRawLeak(result);
});
