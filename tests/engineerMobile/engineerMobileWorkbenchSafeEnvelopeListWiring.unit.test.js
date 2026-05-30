'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  getEngineerMobileAssignedAppointments,
} = require('../../src/engineerMobile/engineerMobileAssignedAppointmentsHandler');

const HANDLER_SOURCE = path.join(
  __dirname,
  '../../src/engineerMobile/engineerMobileAssignedAppointmentsHandler.js',
);

const SAFE_WORKBENCH_FIELDS = new Set([
  'ok',
  'status',
  'messageKey',
  'assignmentReference',
  'caseReference',
  'appointmentReference',
  'serviceStatus',
  'appointmentWindow',
  'customerDisplay',
  'locationSummary',
  'workOrderSummary',
  'eligibility',
  'actions',
]);

function engineerContext(overrides = {}) {
  return {
    organizationId: 'org_task_2283',
    engineerUserId: 'eng_task_2283',
    permissions: ['engineer_mobile.assigned_appointments.read'],
    ...overrides,
  };
}

function rawListRow(overrides = {}) {
  return {
    organizationId: 'org_task_2283',
    engineerUserId: 'eng_task_2283',
    appointmentId: 'apt_task_2283',
    caseReference: 'CASE-2283',
    appointmentWindow: '2026-06-04 09:00-11:00',
    scheduledStart: '2026-06-04T01:00:00.000Z',
    scheduledEnd: '2026-06-04T03:00:00.000Z',
    serviceType: 'onsite',
    customerDisplayName: 'Customer masked',
    locationLabel: 'Taipei service area',
    status: 'confirmed',
    priorityLabel: 'normal',
    rawCase: {
      id: 'raw_case_should_not_leak',
      fullAddress: 'full_address_should_not_leak',
    },
    rawAppointment: {
      id: 'raw_appointment_should_not_leak',
    },
    completionReport: {
      id: 'completion_report_should_not_leak',
    },
    fieldServiceReport: {
      id: 'field_service_report_should_not_leak',
    },
    rawDbRow: {
      sql: 'select * from appointments',
    },
    repositoryRow: 'raw_repository_row_should_not_leak',
    providerPayload: 'provider_payload_should_not_leak',
    auditInternal: 'audit_internal_should_not_leak',
    aiRawPayload: 'ai_raw_payload_should_not_leak',
    ragTrace: 'rag_trace_should_not_leak',
    openaiTrace: 'openai_trace_should_not_leak',
    vectorPayload: 'vector_payload_should_not_leak',
    billingInternal: 'billing_internal_should_not_leak',
    settlementInternal: 'settlement_internal_should_not_leak',
    paymentInternal: 'payment_internal_should_not_leak',
    invoiceInternal: 'invoice_internal_should_not_leak',
    debugPayload: 'debug_payload_should_not_leak',
    rawSql: 'select * from engineer_mobile',
    token: 'token_should_not_leak',
    password: 'password_should_not_leak',
    secret: 'secret_should_not_leak',
    customerPhone: 'customer_phone_should_not_leak',
    phone: 'raw_phone_should_not_leak',
    contact: 'contact_should_not_leak',
    address: 'address_should_not_leak',
    fullAddress: 'full_address_should_not_leak',
    photo: 'photo_should_not_leak',
    signature: 'signature_should_not_leak',
    finalAppointmentId: 'final_appointment_should_not_leak',
    ...overrides,
  };
}

function repository(rows) {
  const calls = [];

  return {
    calls,
    async findAssignedAppointments(query) {
      calls.push(query);

      if (rows instanceof Error) {
        throw rows;
      }

      return rows;
    },
    findAssignedAppointmentDetail() {
      throw new Error('detail reader must not be called');
    },
  };
}

function assertNoForbiddenLeak(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'raw_case_should_not_leak',
    'raw_appointment_should_not_leak',
    'completion_report_should_not_leak',
    'field_service_report_should_not_leak',
    'raw_repository_row_should_not_leak',
    'select * from',
    'provider_payload_should_not_leak',
    'audit_internal_should_not_leak',
    'ai_raw_payload_should_not_leak',
    'rag_trace_should_not_leak',
    'openai_trace_should_not_leak',
    'vector_payload_should_not_leak',
    'billing_internal_should_not_leak',
    'settlement_internal_should_not_leak',
    'payment_internal_should_not_leak',
    'invoice_internal_should_not_leak',
    'debug_payload_should_not_leak',
    'token_should_not_leak',
    'password_should_not_leak',
    'secret_should_not_leak',
    'customer_phone_should_not_leak',
    'raw_phone_should_not_leak',
    'contact_should_not_leak',
    'address_should_not_leak',
    'full_address_should_not_leak',
    'photo_should_not_leak',
    'signature_should_not_leak',
    'final_appointment_should_not_leak',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

function assertSafeListItem(item, expected = {}) {
  assert.equal(item.ok, true);
  assert.equal(item.status, 'available');
  assert.equal(item.messageKey, 'engineerMobile.assignedAppointments.available');
  assert.equal(item.appointmentReference, expected.appointmentReference || 'apt_task_2283');
  assert.equal(item.caseReference, expected.caseReference || 'CASE-2283');
  assert.equal(item.serviceStatus, expected.serviceStatus || 'confirmed');
  assert.equal(item.appointmentWindow, '2026-06-04 09:00-11:00');
  assert.deepEqual(item.customerDisplay, {
    displayName: 'Customer masked',
  });
  assert.deepEqual(item.locationSummary, {
    label: 'Taipei service area',
  });
  assert.deepEqual(item.workOrderSummary, {
    serviceType: 'onsite',
    priorityLabel: 'normal',
  });
  assert.deepEqual(item.eligibility, {
    canOpenDetails: true,
  });
  assert.deepEqual(item.actions, []);
  assert.equal(Object.hasOwn(item, 'appointmentId'), false);
  assert.equal(Object.hasOwn(item, 'scheduledStart'), false);
  assert.equal(Object.hasOwn(item, 'scheduledEnd'), false);

  for (const key of Object.keys(item)) {
    assert.equal(SAFE_WORKBENCH_FIELDS.has(key), true, `unexpected workbench list field ${key}`);
  }
}

test('assigned appointment list success output keeps top-level envelope and shapes each item through safe presenter', async () => {
  const rows = [
    rawListRow({
      appointmentId: 'apt_task_2283_later',
      caseReference: 'CASE-2283-LATER',
      scheduledStart: '2026-06-04T06:00:00.000Z',
    }),
    rawListRow({
      appointmentId: 'apt_task_2283_first',
      caseReference: 'CASE-2283-FIRST',
      scheduledStart: '2026-06-04T01:00:00.000Z',
      status: 'scheduled',
    }),
  ];
  const beforeRows = JSON.stringify(rows);
  const filters = {
    status: 'confirmed',
    rawSql: 'input_raw_sql_should_not_leak',
    finalAppointmentId: 'input_final_appointment_should_not_leak',
  };
  const beforeFilters = JSON.stringify(filters);
  const assignedAppointmentRepository = repository(rows);

  const result = await getEngineerMobileAssignedAppointments({
    assignedAppointmentRepository,
    context: engineerContext(),
    filters,
  });

  assert.equal(result.status, 'allow');
  assert.equal(result.messageKey, 'engineerMobile.assignedAppointments.available');
  assert.equal(result.engineerMobileVisible, true);
  assert.deepEqual(
    result.data.appointments.map((item) => item.appointmentReference),
    ['apt_task_2283_first', 'apt_task_2283_later'],
  );
  assertSafeListItem(result.data.appointments[0], {
    appointmentReference: 'apt_task_2283_first',
    caseReference: 'CASE-2283-FIRST',
    serviceStatus: 'scheduled',
  });
  assertSafeListItem(result.data.appointments[1], {
    appointmentReference: 'apt_task_2283_later',
    caseReference: 'CASE-2283-LATER',
  });
  assertNoForbiddenLeak(result);
  assert.equal(JSON.stringify(rows), beforeRows);
  assert.equal(JSON.stringify(filters), beforeFilters);
  assert.deepEqual(assignedAppointmentRepository.calls, [
    {
      organizationId: 'org_task_2283',
      engineerUserId: 'eng_task_2283',
      filters: {
        status: 'confirmed',
      },
    },
  ]);
});

test('denied unavailable and empty list behavior remains generic and safe', async () => {
  const assignedAppointmentRepository = repository([]);

  const emptyResult = await getEngineerMobileAssignedAppointments({
    assignedAppointmentRepository,
    context: engineerContext(),
  });

  assert.equal(emptyResult.status, 'allow');
  assert.deepEqual(emptyResult.data.appointments, []);
  assertNoForbiddenLeak(emptyResult);

  for (const options of [
    undefined,
    {
      assignedAppointmentRepository,
      context: engineerContext({ permissions: [] }),
    },
    {
      assignedAppointmentRepository: repository(new Error('raw db unavailable should_not_leak')),
      context: engineerContext(),
    },
  ]) {
    const result = await getEngineerMobileAssignedAppointments(options);

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
    assertNoForbiddenLeak(result);
  }
});

test('list handler selected runtime boundary imports presenter without adding route DB provider AI or billing behavior', () => {
  const source = fs.readFileSync(HANDLER_SOURCE, 'utf8');

  assert.equal(source.includes("require('./engineerMobileWorkbenchSafeEnvelopePresenter')"), true);
  assert.equal(source.includes('function buildAllowEnvelope(appointments)'), true);
  assert.equal(source.includes('appointments: appointments.map(presentListAppointment)'), true);
  assert.equal(source.includes('presentEngineerMobileWorkbenchSafeEnvelope({'), true);

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
    'openai',
    'vectorDb',
    'billingService',
    'settlementService',
    'INSERT ',
    'UPDATE ',
    'DELETE ',
  ]) {
    assert.equal(source.includes(forbidden), false, `source contains ${forbidden}`);
  }
});
