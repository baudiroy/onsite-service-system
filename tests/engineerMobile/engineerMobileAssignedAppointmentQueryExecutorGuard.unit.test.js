'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  ASSIGNED_APPOINTMENT_DETAIL_QUERY_NAME,
  ASSIGNED_APPOINTMENT_LIST_QUERY_NAME,
  buildEngineerMobileAssignedAppointmentDetailQuerySpec,
  buildEngineerMobileAssignedAppointmentListQuerySpec,
} = require('../../src/engineerMobile/engineerMobileAssignedAppointmentSqlQueryBuilder');
const {
  ASSIGNED_APPOINTMENT_QUERY_INTENT_BY_NAME,
  createEngineerMobileAssignedAppointmentQueryExecutorGuard,
} = require('../../src/engineerMobile/engineerMobileAssignedAppointmentQueryExecutorGuard');
const {
  createEngineerMobileAssignedAppointmentDbRepository,
} = require('../../src/engineerMobile/engineerMobileAssignedAppointmentDbRepository');

const GUARD_SOURCE = path.join(
  __dirname,
  '../../src/engineerMobile/engineerMobileAssignedAppointmentQueryExecutorGuard.js',
);

function listSpec(overrides = {}) {
  const spec = buildEngineerMobileAssignedAppointmentListQuerySpec({
    engineerUserId: 'eng_task1770',
    filters: {
      from: '2026-06-01T00:00:00.000Z',
      status: 'confirmed',
      to: '2026-06-02T00:00:00.000Z',
    },
    organizationId: 'org_task1770',
  });

  return {
    ...spec,
    params: { ...spec.params },
    values: [...spec.values],
    ...overrides,
  };
}

function detailSpec(overrides = {}) {
  const spec = buildEngineerMobileAssignedAppointmentDetailQuerySpec({
    appointmentId: 'apt_task1770',
    engineerUserId: 'eng_task1770',
    organizationId: 'org_task1770',
  });

  return {
    ...spec,
    params: { ...spec.params },
    values: [...spec.values],
    ...overrides,
  };
}

function appointmentRow(overrides = {}) {
  return {
    appointment_id: 'apt_task1770',
    appointment_status: 'confirmed',
    appointment_window: '2026-06-01 09:00-11:00',
    case_reference: 'CASE-1770-001',
    checklist_preview: ['confirm model'],
    customer_display_name: 'Task1770 safe customer',
    location_label: 'Taipei safe district',
    priority_label: 'normal',
    public_customer_notes: 'safe note',
    scheduled_end: '2026-06-01T03:00:00.000Z',
    scheduled_start: '2026-06-01T01:00:00.000Z',
    service_summary: 'safe summary',
    service_type: 'onsite',
    ...overrides,
  };
}

function assertNoForbiddenLeak(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'authorization_header_should_not_leak',
    'cookie_should_not_leak',
    'DATABASE_URL_should_not_leak',
    'delegate raw error should_not_leak',
    'final_appointment_id_should_not_leak',
    'password_should_not_leak',
    'provider_debug_should_not_leak',
    'raw_sql_should_not_leak',
    'raw_session_should_not_leak',
    'raw_user_should_not_leak',
    'secret_should_not_leak',
    'stack_trace_should_not_leak',
    'token_should_not_leak',
    'unsafe_sql_should_not_delegate',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

function requireSpecifiers(source) {
  return Array.from(source.matchAll(/require\(['"]([^'"]+)['"]\)/g), (match) => match[1]);
}

function assertSourceBoundary(source) {
  for (const forbidden of [
    /require\(['"]pg['"]\)/,
    /require\(['"]postgres['"]\)/,
    /require\(['"]mysql/,
    new RegExp('DATABASE' + '_URL'),
    /process\.env/,
    /src\/app/,
    /src\/server/,
    /src\/routes/,
    /listen\s*\(/,
    /\b(?:dbClient|databaseClient|pool|transaction)\b/,
    /\b(?:sendLine|sendSms|sendEmail|webhook|openai|rag|vector)\b/i,
    /\b(?:completeAppointment|startTravel|submitReport|publishReport)\b/,
  ]) {
    assert.doesNotMatch(source, forbidden);
  }
}

test('guard exposes callable executor function and execute object shape', () => {
  const guarded = createEngineerMobileAssignedAppointmentQueryExecutorGuard({
    delegateExecutor: async () => [],
  });

  assert.equal(typeof guarded, 'function');
  assert.equal(typeof guarded.execute, 'function');
  assert.equal(Object.isFrozen(guarded), true);
});

test('missing delegate fails closed with safe audit metadata', async () => {
  const auditEvents = [];
  const guarded = createEngineerMobileAssignedAppointmentQueryExecutorGuard({
    auditLogger: auditEvents.push.bind(auditEvents),
  });

  const result = await guarded(listSpec());

  assert.deepEqual(result, { rows: [] });
  assert.deepEqual(auditEvents, [
    {
      event: 'engineerMobile.assignedAppointmentQueryExecutorGuard.read',
      name: ASSIGNED_APPOINTMENT_LIST_QUERY_NAME,
      outcome: 'deny',
      reason: 'missing_delegate_executor',
    },
  ]);
  assertNoForbiddenLeak(auditEvents);
});

test('valid Task1758 list query spec delegates to synthetic executor', async () => {
  const delegateCalls = [];
  const guarded = createEngineerMobileAssignedAppointmentQueryExecutorGuard({
    delegateExecutor: async (querySpec) => {
      delegateCalls.push(querySpec);

      return { rows: [appointmentRow()] };
    },
  });

  const result = await guarded(listSpec());

  assert.deepEqual(result.rows, [appointmentRow()]);
  assert.equal(delegateCalls.length, 1);
  assert.equal(delegateCalls[0].name, ASSIGNED_APPOINTMENT_LIST_QUERY_NAME);
  assert.equal(delegateCalls[0].intent, ASSIGNED_APPOINTMENT_QUERY_INTENT_BY_NAME[ASSIGNED_APPOINTMENT_LIST_QUERY_NAME]);
  assert.deepEqual(delegateCalls[0].params, {
    engineerUserId: 'eng_task1770',
    from: '2026-06-01T00:00:00.000Z',
    organizationId: 'org_task1770',
    status: 'confirmed',
    to: '2026-06-02T00:00:00.000Z',
  });
  assert.match(delegateCalls[0].sql, /^SELECT\b/);
  assertNoForbiddenLeak(delegateCalls);
});

test('valid Task1758 detail query spec delegates to synthetic executor', async () => {
  const delegateCalls = [];
  const guarded = createEngineerMobileAssignedAppointmentQueryExecutorGuard({
    async delegateExecutor(querySpec) {
      delegateCalls.push(querySpec);

      return [appointmentRow({ appointment_id: 'apt_task1770' })];
    },
  });

  const result = await guarded(detailSpec());

  assert.deepEqual(result.rows, [appointmentRow({ appointment_id: 'apt_task1770' })]);
  assert.equal(delegateCalls.length, 1);
  assert.equal(delegateCalls[0].name, ASSIGNED_APPOINTMENT_DETAIL_QUERY_NAME);
  assert.equal(delegateCalls[0].intent, ASSIGNED_APPOINTMENT_QUERY_INTENT_BY_NAME[ASSIGNED_APPOINTMENT_DETAIL_QUERY_NAME]);
  assert.deepEqual(delegateCalls[0].params, {
    appointmentId: 'apt_task1770',
    engineerUserId: 'eng_task1770',
    organizationId: 'org_task1770',
  });
});

test('raw string SQL input and malformed query specs are rejected before delegate', async () => {
  const delegateCalls = [];
  const guarded = createEngineerMobileAssignedAppointmentQueryExecutorGuard({
    delegateExecutor: async (querySpec) => {
      delegateCalls.push(querySpec);

      return [appointmentRow()];
    },
  });

  for (const spec of [
    'SELECT * FROM appointments',
    null,
    {},
    listSpec({ ok: false }),
    listSpec({ executable: true }),
    listSpec({ fields: ['appointment_id'] }),
    listSpec({ name: 'unknownAssignedAppointmentQuery' }),
    listSpec({ params: null }),
    detailSpec({ values: ['org_task1770'] }),
  ]) {
    assert.deepEqual(await guarded(spec), { rows: [] });
  }

  assert.deepEqual(delegateCalls, []);
});

test('unsafe SQL verbs and unsafe intent are rejected', async () => {
  const delegateCalls = [];
  const guarded = createEngineerMobileAssignedAppointmentQueryExecutorGuard({
    delegateExecutor: async (querySpec) => {
      delegateCalls.push(querySpec);

      return [appointmentRow()];
    },
  });

  for (const verb of ['INSERT', 'UPDATE', 'DELETE', 'UPSERT', 'MERGE', 'ALTER', 'DROP', 'CREATE', 'TRUNCATE']) {
    const result = await guarded(listSpec({
      sql: `SELECT appointment_id FROM appointments; ${verb} unsafe_sql_should_not_delegate`,
    }));

    assert.deepEqual(result, { rows: [] });
  }

  assert.deepEqual(await guarded(listSpec({
    intent: 'engineerMobileAssignedAppointments.writeUnsafe',
  })), { rows: [] });
  assert.deepEqual(delegateCalls, []);
});

test('unsafe metadata is stripped before delegate execution', async () => {
  const delegateCalls = [];
  const guarded = createEngineerMobileAssignedAppointmentQueryExecutorGuard({
    delegateExecutor: async (querySpec) => {
      delegateCalls.push(querySpec);

      return [];
    },
  });

  await guarded(listSpec({
    authorization: 'authorization_header_should_not_leak',
    cookie: 'cookie_should_not_leak',
    params: {
      ...listSpec().params,
      password: 'password_should_not_leak',
      providerDebug: 'provider_debug_should_not_leak',
      secret: 'secret_should_not_leak',
      token: 'token_should_not_leak',
    },
    rawSession: 'raw_session_should_not_leak',
    rawUser: 'raw_user_should_not_leak',
  }));

  assert.equal(delegateCalls.length, 1);
  assert.deepEqual(Object.keys(delegateCalls[0]).sort(), [
    'executable',
    'fields',
    'intent',
    'name',
    'ok',
    'params',
    'sql',
    'values',
  ]);
  assert.deepEqual(Object.keys(delegateCalls[0].params).sort(), [
    'engineerUserId',
    'from',
    'organizationId',
    'status',
    'to',
  ]);
  assertNoForbiddenLeak(delegateCalls);
});

test('delegate throw fails closed without raw error or stack leak', async () => {
  const auditEvents = [];
  const guarded = createEngineerMobileAssignedAppointmentQueryExecutorGuard({
    auditLogger: auditEvents.push.bind(auditEvents),
    delegateExecutor: async () => {
      throw new Error('delegate raw error should_not_leak stack_trace_should_not_leak token_should_not_leak');
    },
  });

  const result = await guarded(listSpec());

  assert.deepEqual(result, { rows: [] });
  assert.deepEqual(auditEvents, [
    {
      event: 'engineerMobile.assignedAppointmentQueryExecutorGuard.read',
      intent: ASSIGNED_APPOINTMENT_QUERY_INTENT_BY_NAME[ASSIGNED_APPOINTMENT_LIST_QUERY_NAME],
      name: ASSIGNED_APPOINTMENT_LIST_QUERY_NAME,
      outcome: 'deny',
      reason: 'delegate_executor_unavailable',
    },
  ]);
  assertNoForbiddenLeak(result);
  assertNoForbiddenLeak(auditEvents);
});

test('safe audit metadata records allow outcome only', async () => {
  const auditEvents = [];
  const guarded = createEngineerMobileAssignedAppointmentQueryExecutorGuard({
    auditLogger: {
      async record(metadata) {
        auditEvents.push(metadata);
      },
    },
    delegateExecutor: async () => ({ rows: [appointmentRow()] }),
  });

  await guarded(listSpec());

  assert.deepEqual(auditEvents, [
    {
      event: 'engineerMobile.assignedAppointmentQueryExecutorGuard.read',
      intent: ASSIGNED_APPOINTMENT_QUERY_INTENT_BY_NAME[ASSIGNED_APPOINTMENT_LIST_QUERY_NAME],
      name: ASSIGNED_APPOINTMENT_LIST_QUERY_NAME,
      outcome: 'allow',
      rowCount: 1,
    },
  ]);
  assertNoForbiddenLeak(auditEvents);
});

test('DB repository adapter can use guarded executor with synthetic delegate', async () => {
  const delegateCalls = [];
  const guardedExecutor = createEngineerMobileAssignedAppointmentQueryExecutorGuard({
    delegateExecutor: async (querySpec) => {
      delegateCalls.push(querySpec);

      return {
        rows: [appointmentRow({
          final_appointment_id: 'final_appointment_id_should_not_leak',
          raw_sql: 'raw_sql_should_not_leak',
          stack: 'stack_trace_should_not_leak',
        })],
      };
    },
  });
  const repository = createEngineerMobileAssignedAppointmentDbRepository({
    queryExecutor: guardedExecutor,
  });

  const result = await repository.findAssignedAppointments({
    engineerUserId: 'eng_task1770',
    filters: {
      from: '2026-06-01T00:00:00.000Z',
      status: 'confirmed',
      to: '2026-06-02T00:00:00.000Z',
    },
    organizationId: 'org_task1770',
  });

  assert.deepEqual(result, [
    {
      appointmentId: 'apt_task1770',
      appointmentWindow: '2026-06-01 09:00-11:00',
      caseReference: 'CASE-1770-001',
      checklistPreview: [{ label: 'confirm model' }],
      customerDisplayName: 'Task1770 safe customer',
      locationLabel: 'Taipei safe district',
      priorityLabel: 'normal',
      publicCustomerNotes: 'safe note',
      scheduledEnd: '2026-06-01T03:00:00.000Z',
      scheduledStart: '2026-06-01T01:00:00.000Z',
      serviceSummary: 'safe summary',
      serviceType: 'onsite',
      status: 'confirmed',
    },
  ]);
  assert.equal(delegateCalls.length, 1);
  assert.equal(delegateCalls[0].intent, ASSIGNED_APPOINTMENT_QUERY_INTENT_BY_NAME[ASSIGNED_APPOINTMENT_LIST_QUERY_NAME]);
  assertNoForbiddenLeak(result);
});

test('guard source imports no DB client env app server route provider or workflow writer', () => {
  const source = fs.readFileSync(GUARD_SOURCE, 'utf8');

  assert.deepEqual(requireSpecifiers(source), [
    './engineerMobileAssignedAppointmentSqlQueryBuilder',
  ]);
  assertSourceBoundary(source);
});
