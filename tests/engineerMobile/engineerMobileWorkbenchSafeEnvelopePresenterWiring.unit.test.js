'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  getEngineerMobileAssignedAppointmentDetail,
} = require('../../src/engineerMobile/engineerMobileAssignedAppointmentDetailHandler');

const HANDLER_SOURCE = path.join(
  __dirname,
  '../../src/engineerMobile/engineerMobileAssignedAppointmentDetailHandler.js',
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
    organizationId: 'org_task_2280',
    engineerUserId: 'eng_task_2280',
    permissions: ['engineer_mobile.assigned_appointments.read'],
    ...overrides,
  };
}

function rawAppointmentRow(overrides = {}) {
  return {
    organizationId: 'org_task_2280',
    engineerUserId: 'eng_task_2280',
    appointmentId: 'apt_task_2280',
    caseReference: 'CASE-2280',
    appointmentWindow: '2026-06-03 09:00-11:00',
    scheduledStart: '2026-06-03T01:00:00.000Z',
    scheduledEnd: '2026-06-03T03:00:00.000Z',
    serviceType: 'onsite',
    customerDisplayName: 'Customer masked',
    locationLabel: 'Taipei service area',
    status: 'confirmed',
    priorityLabel: 'high',
    serviceSummary: 'Customer-visible work order summary',
    publicCustomerNotes: 'Customer-visible preparation note',
    checklistPreview: [
      {
        key: 'confirm_model',
        label: 'Confirm model',
        status: 'pending',
        rawAppointment: 'raw_appointment_should_not_leak',
        fieldServiceReportId: 'field_service_report_should_not_leak',
      },
    ],
    rawCase: {
      id: 'raw_case_should_not_leak',
      privateAddress: 'private_address_should_not_leak',
    },
    rawAppointment: {
      id: 'raw_appointment_should_not_leak',
      fullAddress: 'full_address_should_not_leak',
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
    providerPayload: {
      line: 'provider_payload_should_not_leak',
    },
    auditInternal: 'audit_internal_should_not_leak',
    aiRawPayload: 'ai_raw_payload_should_not_leak',
    ragTrace: 'rag_trace_should_not_leak',
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

function repository(row) {
  const calls = [];

  return {
    calls,
    async findAssignedAppointmentDetail(query) {
      calls.push(query);

      return row;
    },
    findAssignedAppointments() {
      throw new Error('list reader must not be called');
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
    'select * from',
    'provider_payload_should_not_leak',
    'audit_internal_should_not_leak',
    'ai_raw_payload_should_not_leak',
    'rag_trace_should_not_leak',
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

function assertSafeWorkbenchEnvelope(value) {
  assert.equal(value.ok, true);
  assert.equal(value.status, 'available');
  assert.equal(value.messageKey, 'engineerMobile.assignedAppointmentDetail.available');
  assert.equal(value.appointmentReference, 'apt_task_2280');
  assert.equal(value.caseReference, 'CASE-2280');
  assert.equal(value.serviceStatus, 'confirmed');
  assert.equal(value.appointmentWindow, '2026-06-03 09:00-11:00');
  assert.deepEqual(value.customerDisplay, {
    displayName: 'Customer masked',
  });
  assert.deepEqual(value.locationSummary, {
    label: 'Taipei service area',
  });
  assert.deepEqual(value.workOrderSummary, {
    serviceType: 'onsite',
    serviceSummary: 'Customer-visible work order summary',
    publicCustomerNotes: 'Customer-visible preparation note',
    priorityLabel: 'high',
    checklistPreview: [
      {
        label: 'Confirm model',
        status: 'pending',
      },
    ],
  });
  assert.deepEqual(value.eligibility, {
    canOpenDetails: true,
  });
  assert.deepEqual(value.actions, []);

  for (const key of Object.keys(value)) {
    assert.equal(SAFE_WORKBENCH_FIELDS.has(key), true, `unexpected workbench field ${key}`);
  }
}

test('assigned appointment detail handler wires success detail through safe workbench presenter', async () => {
  const row = rawAppointmentRow();
  const beforeRow = JSON.stringify(row);
  const input = {
    appointmentId: 'apt_task_2280',
    rawSql: 'input_raw_sql_should_not_leak',
    finalAppointmentId: 'input_final_appointment_should_not_leak',
  };
  const beforeInput = JSON.stringify(input);
  const assignedAppointmentRepository = repository(row);

  const result = await getEngineerMobileAssignedAppointmentDetail({
    assignedAppointmentRepository,
    context: engineerContext(),
    input,
  });

  assert.equal(result.status, 'allow');
  assert.equal(result.messageKey, 'engineerMobile.assignedAppointmentDetail.available');
  assert.equal(result.engineerMobileVisible, true);
  assertSafeWorkbenchEnvelope(result.data.appointment);
  assertNoForbiddenLeak(result);
  assert.equal(JSON.stringify(row), beforeRow);
  assert.equal(JSON.stringify(input), beforeInput);
  assert.deepEqual(assignedAppointmentRepository.calls, [
    {
      organizationId: 'org_task_2280',
      engineerUserId: 'eng_task_2280',
      appointmentId: 'apt_task_2280',
    },
  ]);
});

test('missing denied and unavailable detail requests remain generic safe deny envelopes', async () => {
  const assignedAppointmentRepository = repository(rawAppointmentRow());

  for (const options of [
    undefined,
    {
      assignedAppointmentRepository,
      context: engineerContext({ permissions: [] }),
      input: { appointmentId: 'apt_task_2280' },
    },
    {
      assignedAppointmentRepository,
      context: engineerContext(),
      input: { appointmentId: 'bad id with spaces' },
    },
    {
      assignedAppointmentRepository: repository(undefined),
      context: engineerContext(),
      input: { appointmentId: 'apt_task_2280' },
    },
  ]) {
    const result = await getEngineerMobileAssignedAppointmentDetail(options);

    assert.deepEqual(result, {
      status: 'deny',
      messageKey: 'engineerMobile.assignedAppointmentDetail.unavailable',
      engineerMobileVisible: false,
      data: {
        appointment: null,
      },
      error: {
        messageKey: 'engineerMobile.assignedAppointmentDetail.unavailable',
      },
    });
    assertNoForbiddenLeak(result);
  }
});

test('selected runtime boundary imports presenter without adding route DB provider AI or billing behavior', () => {
  const source = fs.readFileSync(HANDLER_SOURCE, 'utf8');

  assert.equal(source.includes("require('./engineerMobileWorkbenchSafeEnvelopePresenter')"), true);
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
