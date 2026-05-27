'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  createEngineerMobileAssignedAppointmentDbRepository,
  SAFE_REPOSITORY_ADAPTER_ERROR_MESSAGE,
} = require('../../src/engineerMobile/engineerMobileAssignedAppointmentDbRepository');
const {
  createEngineerMobileAssignedAppointmentRepositoryGuard,
} = require('../../src/engineerMobile/engineerMobileAssignedAppointmentRepositoryGuard');

const REPOSITORY_SOURCE = path.join(
  __dirname,
  '../../src/engineerMobile/engineerMobileAssignedAppointmentDbRepository.js',
);

function listInput(overrides = {}) {
  return {
    engineerUserId: 'eng_task1760',
    filters: {
      from: '2026-05-27T00:00:00.000Z',
      rawSql: 'DROP TABLE task1760_unsafe',
      status: 'confirmed',
      token: 'token_should_not_pass_to_executor',
      to: '2026-05-28T00:00:00.000Z',
    },
    organizationId: 'org_task1760',
    rawRequest: {
      authorization: 'auth_header_should_not_pass_to_executor',
      cookie: 'cookie_should_not_pass_to_executor',
      session: 'session_should_not_pass_to_executor',
    },
    ...overrides,
  };
}

function detailInput(overrides = {}) {
  return {
    appointmentId: 'apt_task1760',
    engineerUserId: 'eng_task1760',
    organizationId: 'org_task1760',
    session: 'session_should_not_pass_to_executor',
    user: {
      password: 'password_should_not_pass_to_executor',
    },
    ...overrides,
  };
}

function appointmentRow(overrides = {}) {
  return {
    appointment_id: 'apt_task1760',
    appointment_status: 'confirmed',
    appointment_window: '2026-05-27 09:00-11:00',
    case_reference: 'CASE-1760-001',
    checklist_preview: ['confirm parts'],
    customer_display_name: 'Task1760 masked customer',
    engineer_user_id: 'eng_task1760',
    location_label: 'Taipei Zhongshan',
    organization_id: 'org_task1760',
    priority_label: 'normal',
    public_customer_notes: 'safe public note',
    scheduled_end: '2026-05-27T03:00:00.000Z',
    scheduled_start: '2026-05-27T01:00:00.000Z',
    service_summary: 'safe summary',
    service_type: 'onsite',
    ...overrides,
  };
}

function mappedAppointmentRow(overrides = {}) {
  return {
    appointmentId: 'apt_task1760',
    appointmentWindow: '2026-05-27 09:00-11:00',
    caseReference: 'CASE-1760-001',
    checklistPreview: [{ label: 'confirm parts' }],
    customerDisplayName: 'Task1760 masked customer',
    engineerUserId: 'eng_task1760',
    locationLabel: 'Taipei Zhongshan',
    organizationId: 'org_task1760',
    priorityLabel: 'normal',
    publicCustomerNotes: 'safe public note',
    scheduledEnd: '2026-05-27T03:00:00.000Z',
    scheduledStart: '2026-05-27T01:00:00.000Z',
    serviceSummary: 'safe summary',
    serviceType: 'onsite',
    status: 'confirmed',
    ...overrides,
  };
}

async function assertRejectsSafely(promise) {
  await assert.rejects(
    promise,
    (error) => {
      assert.equal(error.message, SAFE_REPOSITORY_ADAPTER_ERROR_MESSAGE);
      assertNoForbiddenLeak({ message: error.message });
      return true;
    },
  );
}

function assertNoForbiddenLeak(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'auth_header_should_not_pass_to_executor',
    'cookie_should_not_pass_to_executor',
    'final_appointment_id_should_not_leak',
    'finalAppointmentId_should_not_leak',
    'internal_notes_should_not_leak',
    'password_should_not_pass_to_executor',
    'provider_payload_should_not_leak',
    'raw_address_should_not_leak',
    'raw_db_row_should_not_leak',
    'raw_executor_error_should_not_leak',
    'raw_phone_should_not_leak',
    'raw_sql_should_not_leak',
    'secret_should_not_pass_to_executor',
    'session_should_not_pass_to_executor',
    'stack_trace_should_not_leak',
    'task1760_unsafe',
    'token_should_not_pass_to_executor',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

function assertNoForbiddenSource(source) {
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
    /provider/i,
    /\bINSERT\b/i,
    /\bUPDATE\b/i,
    /\bDELETE\b/i,
    /\bUPSERT\b/i,
    /\bMERGE\b/i,
    /\bALTER\b/i,
    /\bDROP\b/i,
    /\bCREATE\b/i,
    /completeAppointment/,
    /startTravel/,
    /submitReport/,
    /publishReport/,
  ]) {
    assert.doesNotMatch(source, forbidden);
  }
}

test('repository exposes both expected methods', () => {
  const repository = createEngineerMobileAssignedAppointmentDbRepository({
    queryExecutor: async () => [],
  });

  assert.equal(typeof repository.findAssignedAppointments, 'function');
  assert.equal(typeof repository.findAssignedAppointmentDetail, 'function');
  assert.deepEqual(Object.keys(repository).sort(), [
    'findAssignedAppointmentDetail',
    'findAssignedAppointments',
  ]);
});

test('missing queryExecutor fails closed', async () => {
  const repository = createEngineerMobileAssignedAppointmentDbRepository();

  await assertRejectsSafely(repository.findAssignedAppointments(listInput()));
  await assertRejectsSafely(repository.findAssignedAppointmentDetail(detailInput()));
});

test('valid list call builds query spec and calls synthetic executor', async () => {
  const executorCalls = [];
  const repository = createEngineerMobileAssignedAppointmentDbRepository({
    queryExecutor: async (querySpec) => {
      executorCalls.push(querySpec);

      return [appointmentRow()];
    },
  });

  const result = await repository.findAssignedAppointments(listInput());

  assert.deepEqual(result, [mappedAppointmentRow()]);
  assert.equal(executorCalls.length, 1);
  assert.equal(executorCalls[0].ok, true);
  assert.equal(executorCalls[0].executable, false);
  assert.match(executorCalls[0].sql, /^SELECT\b/);
  assert.deepEqual(executorCalls[0].params, {
    engineerUserId: 'eng_task1760',
    from: '2026-05-27T00:00:00.000Z',
    organizationId: 'org_task1760',
    status: 'confirmed',
    to: '2026-05-28T00:00:00.000Z',
  });
  assertNoForbiddenLeak(executorCalls);
});

test('valid detail call builds query spec and calls synthetic executor', async () => {
  const executorCalls = [];
  const repository = createEngineerMobileAssignedAppointmentDbRepository({
    queryExecutor: async (querySpec) => {
      executorCalls.push(querySpec);

      return {
        rows: [appointmentRow()],
      };
    },
  });

  const result = await repository.findAssignedAppointmentDetail(detailInput());

  assert.deepEqual(result, mappedAppointmentRow());
  assert.equal(executorCalls.length, 1);
  assert.equal(executorCalls[0].ok, true);
  assert.equal(executorCalls[0].executable, false);
  assert.match(executorCalls[0].sql, /^SELECT\b/);
  assert.deepEqual(executorCalls[0].params, {
    appointmentId: 'apt_task1760',
    engineerUserId: 'eng_task1760',
    organizationId: 'org_task1760',
  });
  assertNoForbiddenLeak(executorCalls);
});

test('scope params are passed to injected query builder only', async () => {
  const builderCalls = [];
  const executorCalls = [];
  const repository = createEngineerMobileAssignedAppointmentDbRepository({
    queryBuilder: {
      buildEngineerMobileAssignedAppointmentListQuerySpec(query) {
        builderCalls.push(query);

        return Object.freeze({
          executable: false,
          ok: true,
          params: {
            engineerUserId: query.engineerUserId,
            organizationId: query.organizationId,
          },
          sql: 'SELECT 1',
          values: [],
        });
      },
    },
    queryExecutor: async (querySpec) => {
      executorCalls.push(querySpec);

      return [];
    },
  });

  await repository.findAssignedAppointments(listInput({
    debugPayload: 'secret_should_not_pass_to_executor',
  }));

  assert.deepEqual(builderCalls, [
    {
      engineerUserId: 'eng_task1760',
      filters: {
        from: '2026-05-27T00:00:00.000Z',
        rawSql: 'DROP TABLE task1760_unsafe',
        status: 'confirmed',
        token: 'token_should_not_pass_to_executor',
        to: '2026-05-28T00:00:00.000Z',
      },
      organizationId: 'org_task1760',
    },
  ]);
  assert.equal(executorCalls.length, 1);
  assertNoForbiddenLeak(executorCalls);
});

test('executor receives only query spec and not raw request context session or user', async () => {
  const executorCalls = [];
  const repository = createEngineerMobileAssignedAppointmentDbRepository({
    queryExecutor: async (...args) => {
      executorCalls.push(args);

      return [];
    },
  });

  await repository.findAssignedAppointments(listInput({
    secret: 'secret_should_not_pass_to_executor',
  }));

  assert.equal(executorCalls.length, 1);
  assert.equal(executorCalls[0].length, 1);
  assert.equal(executorCalls[0][0].ok, true);
  assertNoForbiddenLeak(executorCalls);
});

test('executor array and rows results are normalized', async () => {
  const arrayRepository = createEngineerMobileAssignedAppointmentDbRepository({
    queryExecutor: async () => [appointmentRow({ appointment_id: 'apt_array' })],
  });
  const rowsRepository = createEngineerMobileAssignedAppointmentDbRepository({
    queryExecutor: {
      async execute() {
        return {
          rows: [appointmentRow({ appointment_id: 'apt_rows' })],
        };
      },
    },
  });

  assert.deepEqual(await arrayRepository.findAssignedAppointments(listInput()), [
    mappedAppointmentRow({ appointmentId: 'apt_array' }),
  ]);
  assert.deepEqual(await rowsRepository.findAssignedAppointments(listInput()), [
    mappedAppointmentRow({ appointmentId: 'apt_rows' }),
  ]);
});

test('repository adapter maps executor rows and strips forbidden fields before returning', async () => {
  const repository = createEngineerMobileAssignedAppointmentDbRepository({
    queryExecutor: async () => ({
      rows: [appointmentRow({
        authorization: 'auth_header_should_not_pass_to_executor',
        cookie: 'cookie_should_not_pass_to_executor',
        final_appointment_id: 'final_appointment_id_should_not_leak',
        finalAppointmentId: 'finalAppointmentId_should_not_leak',
        internal_notes: 'internal_notes_should_not_leak',
        password: 'password_should_not_pass_to_executor',
        provider_payload: 'provider_payload_should_not_leak',
        raw_address: 'raw_address_should_not_leak',
        raw_db_row: 'raw_db_row_should_not_leak',
        raw_phone: 'raw_phone_should_not_leak',
        raw_sql: 'raw_sql_should_not_leak',
        secret: 'secret_should_not_pass_to_executor',
        stack: 'stack_trace_should_not_leak',
        token: 'token_should_not_pass_to_executor',
      })],
    }),
  });

  const listResult = await repository.findAssignedAppointments(listInput());
  const detailResult = await repository.findAssignedAppointmentDetail(detailInput());

  assert.deepEqual(listResult, [mappedAppointmentRow()]);
  assert.deepEqual(detailResult, mappedAppointmentRow());
  assertNoForbiddenLeak(listResult);
  assertNoForbiddenLeak(detailResult);
});

test('invalid executor result normalizes to empty safely', async () => {
  const repository = createEngineerMobileAssignedAppointmentDbRepository({
    queryExecutor: async () => ({ rowCount: 1 }),
  });

  assert.deepEqual(await repository.findAssignedAppointments(listInput()), []);
  assert.equal(await repository.findAssignedAppointmentDetail(detailInput()), undefined);
});

test('builder throw fails closed without raw error leak', async () => {
  const repository = createEngineerMobileAssignedAppointmentDbRepository({
    queryBuilder: {
      buildEngineerMobileAssignedAppointmentListQuerySpec() {
        throw new Error('raw_executor_error_should_not_leak stack_trace_should_not_leak');
      },
    },
    queryExecutor: async () => [appointmentRow()],
  });

  await assertRejectsSafely(repository.findAssignedAppointments(listInput()));
});

test('executor throw fails closed without raw error leak', async () => {
  const auditEvents = [];
  const repository = createEngineerMobileAssignedAppointmentDbRepository({
    auditLogger: auditEvents.push.bind(auditEvents),
    queryExecutor: async () => {
      throw new Error('raw_executor_error_should_not_leak stack_trace_should_not_leak');
    },
  });

  await assertRejectsSafely(repository.findAssignedAppointments(listInput()));
  assert.deepEqual(auditEvents, [
    {
      engineerUserId: 'eng_task1760',
      event: 'engineerMobile.assignedAppointmentDbRepository.read',
      method: 'findAssignedAppointments',
      organizationId: 'org_task1760',
      outcome: 'deny',
      reason: 'query_executor_unavailable',
    },
  ]);
  assertNoForbiddenLeak(auditEvents);
});

test('missing organization engineer or appointment scope fails closed before executor', async () => {
  const executorCalls = [];
  const repository = createEngineerMobileAssignedAppointmentDbRepository({
    queryExecutor: async (querySpec) => {
      executorCalls.push(querySpec);

      return [appointmentRow()];
    },
  });

  await assertRejectsSafely(repository.findAssignedAppointments({ engineerUserId: 'eng_task1760' }));
  await assertRejectsSafely(repository.findAssignedAppointments({ organizationId: 'org_task1760' }));
  await assertRejectsSafely(repository.findAssignedAppointmentDetail({
    engineerUserId: 'eng_task1760',
    organizationId: 'org_task1760',
  }));
  assert.deepEqual(executorCalls, []);
});

test('source has no DB client import env DB URL app server route provider or mutation dependency', () => {
  const source = fs.readFileSync(REPOSITORY_SOURCE, 'utf8');
  const requireSpecifiers = Array.from(source.matchAll(/require\(['"]([^'"]+)['"]\)/g), (match) => match[1]);

  assert.deepEqual(requireSpecifiers, [
    './engineerMobileAssignedAppointmentSqlQueryBuilder',
    './engineerMobileAssignedAppointmentDbRowMapper',
  ]);
  assertNoForbiddenSource(source);
});

test('optional audit metadata remains safe', async () => {
  const auditEvents = [];
  const repository = createEngineerMobileAssignedAppointmentDbRepository({
    auditLogger: {
      async record(metadata) {
        auditEvents.push(metadata);
      },
    },
    queryExecutor: async () => [appointmentRow()],
  });

  await repository.findAssignedAppointments(listInput());

  assert.deepEqual(auditEvents, [
    {
      engineerUserId: 'eng_task1760',
      event: 'engineerMobile.assignedAppointmentDbRepository.read',
      method: 'findAssignedAppointments',
      organizationId: 'org_task1760',
      outcome: 'allow',
      rowCount: 1,
    },
  ]);
  assertNoForbiddenLeak(auditEvents);
});

test('adapter can be used behind Task1750 repository guard with synthetic executor', async () => {
  const repository = createEngineerMobileAssignedAppointmentDbRepository({
    queryExecutor: async () => [appointmentRow()],
  });
  const guarded = createEngineerMobileAssignedAppointmentRepositoryGuard({
    delegateRepository: repository,
  });

  const result = await guarded.findAssignedAppointments(listInput());

  assert.deepEqual(result, [mappedAppointmentRow()]);
});
