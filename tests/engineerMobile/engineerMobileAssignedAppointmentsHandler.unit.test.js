'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  createEngineerMobileAssignedAppointmentsHandler,
  getEngineerMobileAssignedAppointments,
} = require('../../src/engineerMobile/engineerMobileAssignedAppointmentsHandler');

const HANDLER_SOURCE = path.join(
  __dirname,
  '../../src/engineerMobile/engineerMobileAssignedAppointmentsHandler.js',
);

function engineerContext(overrides = {}) {
  return {
    organizationId: 'org_engineer_mobile_1735',
    engineerUserId: 'eng_user_1735',
    permissions: ['engineer_mobile.assigned_appointments.read'],
    ...overrides,
  };
}

function appointment(overrides = {}) {
  return {
    appointmentId: 'apt_1735_001',
    caseReference: 'CASE-1735-001',
    appointmentWindow: '2026-05-28 09:00-11:00',
    scheduledStart: '2026-05-28T01:00:00.000Z',
    scheduledEnd: '2026-05-28T03:00:00.000Z',
    serviceType: 'onsite',
    customerDisplayName: 'Wang masked',
    locationLabel: 'Taipei Da-an',
    status: 'confirmed',
    priorityLabel: 'normal',
    organizationId: 'org_engineer_mobile_1735',
    engineerUserId: 'eng_user_1735',
    phone: 'raw_phone_should_not_leak',
    mobile: 'raw_mobile_should_not_leak',
    tel: 'raw_tel_should_not_leak',
    address: 'raw_address_should_not_leak',
    fullAddress: 'full_address_should_not_leak',
    lineUserId: 'line_user_should_not_leak',
    providerRawPayload: 'provider_payload_should_not_leak',
    token: 'token_should_not_leak',
    secret: 'secret_should_not_leak',
    internalNote: 'internal_note_should_not_leak',
    dispatcherNote: 'dispatcher_note_should_not_leak',
    rawSql: 'select * from appointments',
    stack: 'stack_trace_should_not_leak',
    billingInternal: 'billing_internal_should_not_leak',
    settlementInternal: 'settlement_internal_should_not_leak',
    aiRawPayload: 'ai_raw_payload_should_not_leak',
    finalAppointmentId: 'final_appointment_should_not_leak',
    fieldServiceReportId: 'field_service_report_should_not_leak',
    rawCasePayload: {
      phone: 'nested_phone_should_not_leak',
      token: 'nested_token_should_not_leak',
    },
    ...overrides,
  };
}

function repository(result = [appointment()]) {
  const calls = [];

  return {
    calls,
    async findAssignedAppointments(params) {
      calls.push({
        method: 'findAssignedAppointments',
        params,
      });

      if (result instanceof Error) {
        throw result;
      }

      return result;
    },
    create() {
      throw new Error('create must not be called');
    },
    update() {
      throw new Error('update must not be called');
    },
    insert() {
      throw new Error('insert must not be called');
    },
    delete() {
      throw new Error('delete must not be called');
    },
    save() {
      throw new Error('save must not be called');
    },
    complete() {
      throw new Error('complete must not be called');
    },
  };
}

function assertSafeDeny(result) {
  assert.deepEqual(result, {
    status: 'deny',
    messageKey: 'engineerMobile.assignedAppointments.unavailable',
    engineerMobileVisible: false,
    data: {
      appointments: [],
    },
    error: {
      messageKey: 'engineerMobile.assignedAppointments.unavailable',
    },
  });
}

function assertNoForbiddenLeak(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'raw_phone_should_not_leak',
    'raw_mobile_should_not_leak',
    'raw_tel_should_not_leak',
    'raw_address_should_not_leak',
    'full_address_should_not_leak',
    'line_user_should_not_leak',
    'provider_payload_should_not_leak',
    'token_should_not_leak',
    'secret_should_not_leak',
    'internal_note_should_not_leak',
    'dispatcher_note_should_not_leak',
    'select * from appointments',
    'stack_trace_should_not_leak',
    'billing_internal_should_not_leak',
    'settlement_internal_should_not_leak',
    'ai_raw_payload_should_not_leak',
    'final_appointment_should_not_leak',
    'field_service_report_should_not_leak',
    'nested_phone_should_not_leak',
    'nested_token_should_not_leak',
    'raw db failure',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('valid engineer and organization context returns safe assigned appointments', async () => {
  const assignedAppointmentRepository = repository([
    appointment({
      appointmentId: 'apt_1735_later',
      caseReference: 'CASE-1735-LATER',
      scheduledStart: '2026-05-28T06:00:00.000Z',
    }),
    appointment({
      appointmentId: 'apt_1735_first',
      caseReference: 'CASE-1735-FIRST',
      scheduledStart: '2026-05-28T01:00:00.000Z',
      status: 'scheduled',
    }),
  ]);
  const auditEvents = [];
  const result = await getEngineerMobileAssignedAppointments({
    assignedAppointmentRepository,
    auditLogger: auditEvents.push.bind(auditEvents),
    context: engineerContext(),
    filters: {
      dateRange: {
        from: '2026-05-28T00:00:00.000Z',
        to: '2026-05-28T23:59:59.999Z',
      },
      appointmentStatus: 'confirmed',
      phone: 'filter_phone_should_not_pass',
    },
  });

  assert.equal(result.status, 'allow');
  assert.equal(result.engineerMobileVisible, true);
  assert.deepEqual(
    result.data.appointments.map((item) => item.appointmentId),
    ['apt_1735_first', 'apt_1735_later'],
  );
  assert.deepEqual(Object.keys(result.data.appointments[0]).sort(), [
    'appointmentId',
    'appointmentWindow',
    'canOpenDetails',
    'caseReference',
    'customerDisplayName',
    'locationLabel',
    'priorityLabel',
    'scheduledEnd',
    'scheduledStart',
    'serviceType',
    'status',
  ]);
  assertNoForbiddenLeak(result);
  assert.deepEqual(auditEvents, [
    {
      event: 'engineerMobile.assignedAppointments.read',
      outcome: 'allow',
      organizationId: 'org_engineer_mobile_1735',
      engineerUserId: 'eng_user_1735',
      appointmentCount: 2,
    },
  ]);
});

test('repository receives scoped read-only query parameters only', async () => {
  const assignedAppointmentRepository = repository();

  await getEngineerMobileAssignedAppointments({
    assignedAppointmentRepository,
    context: engineerContext(),
    filters: {
      from: '2026-05-28T00:00:00.000Z',
      to: '2026-05-28T23:59:59.999Z',
      status: 'confirmed',
      finalAppointmentId: 'must_not_pass',
      rawSql: 'must_not_pass',
    },
  });

  assert.deepEqual(assignedAppointmentRepository.calls, [
    {
      method: 'findAssignedAppointments',
      params: {
        organizationId: 'org_engineer_mobile_1735',
        engineerUserId: 'eng_user_1735',
        filters: {
          from: '2026-05-28T00:00:00.000Z',
          to: '2026-05-28T23:59:59.999Z',
          status: 'confirmed',
        },
      },
    },
  ]);
});

test('missing organization fails closed without repository access', async () => {
  const assignedAppointmentRepository = repository();

  assertSafeDeny(await getEngineerMobileAssignedAppointments({
    assignedAppointmentRepository,
    context: engineerContext({ organizationId: '' }),
  }));
  assert.deepEqual(assignedAppointmentRepository.calls, []);
});

test('missing engineer identity fails closed without repository access', async () => {
  const assignedAppointmentRepository = repository();

  assertSafeDeny(await getEngineerMobileAssignedAppointments({
    assignedAppointmentRepository,
    context: engineerContext({ engineerUserId: '' }),
  }));
  assert.deepEqual(assignedAppointmentRepository.calls, []);
});

test('missing read permission fails closed without repository access', async () => {
  const assignedAppointmentRepository = repository();

  assertSafeDeny(await getEngineerMobileAssignedAppointments({
    assignedAppointmentRepository,
    context: engineerContext({ permissions: [] }),
  }));
  assert.deepEqual(assignedAppointmentRepository.calls, []);
});

test('repository throw fails closed without leaking raw error details', async () => {
  const assignedAppointmentRepository = repository(new Error('raw db failure stack trace'));
  const auditEvents = [];

  const result = await getEngineerMobileAssignedAppointments({
    assignedAppointmentRepository,
    auditLogger: {
      record(event) {
        auditEvents.push(event);
      },
    },
    context: engineerContext(),
  });

  assertSafeDeny(result);
  assertNoForbiddenLeak(result);
  assert.deepEqual(auditEvents, [
    {
      event: 'engineerMobile.assignedAppointments.read',
      outcome: 'deny',
      organizationId: 'org_engineer_mobile_1735',
      engineerUserId: 'eng_user_1735',
      appointmentCount: 0,
      reason: 'repository_unavailable',
    },
  ]);
});

test('cross-organization or cross-engineer repository rows are excluded', async () => {
  const result = await getEngineerMobileAssignedAppointments({
    assignedAppointmentRepository: repository([
      appointment({ appointmentId: 'apt_allowed' }),
      appointment({
        appointmentId: 'apt_wrong_org',
        organizationId: 'org_other',
      }),
      appointment({
        appointmentId: 'apt_wrong_engineer',
        engineerUserId: 'eng_other',
      }),
    ]),
    context: engineerContext(),
  });

  assert.equal(result.status, 'allow');
  assert.deepEqual(
    result.data.appointments.map((item) => item.appointmentId),
    ['apt_allowed'],
  );
});

test('created handler accepts injected repository and synthetic request context', async () => {
  const assignedAppointmentRepository = repository();
  const handler = createEngineerMobileAssignedAppointmentsHandler({
    assignedAppointmentRepository,
  });

  const result = await handler({
    engineerContext: engineerContext(),
    query: {
      status: 'confirmed',
    },
  });

  assert.equal(result.status, 'allow');
  assert.equal(result.data.appointments.length, 1);
  assert.deepEqual(assignedAppointmentRepository.calls[0].params, {
    organizationId: 'org_engineer_mobile_1735',
    engineerUserId: 'eng_user_1735',
    filters: {
      status: 'confirmed',
    },
  });
});

test('handler source has no DB, app/server, route mount, listen, provider sending, or mutation surface', () => {
  const source = fs.readFileSync(HANDLER_SOURCE, 'utf8');

  for (const forbidden of [
    'require(\'pg\')',
    'require("pg")',
    'dbClient',
    '.query(',
    'psql',
    'db:migrate',
    'createServer',
    'listen(',
    'registerRoute',
    'router.',
    'app.',
    'sendLine',
    'sendSms',
    'sendEmail',
    'webhook',
    'finalAppointmentId',
    'fieldServiceReportId',
    'INSERT ',
    'UPDATE ',
    'DELETE ',
  ]) {
    assert.equal(source.includes(forbidden), false, `source contains ${forbidden}`);
  }
});

test('handler exports no global route mount helper', () => {
  const moduleExports = require('../../src/engineerMobile/engineerMobileAssignedAppointmentsHandler');

  assert.equal(moduleExports.registerRoute, undefined);
  assert.equal(moduleExports.mount, undefined);
  assert.equal(moduleExports.router, undefined);
});
