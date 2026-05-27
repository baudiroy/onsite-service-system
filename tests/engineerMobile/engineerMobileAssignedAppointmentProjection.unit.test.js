'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  projectEngineerMobileAssignedAppointmentDetail,
  projectEngineerMobileAssignedAppointmentListItem,
} = require('../../src/engineerMobile/engineerMobileAssignedAppointmentProjection');

const PROJECTION_SOURCE = path.join(
  __dirname,
  '../../src/engineerMobile/engineerMobileAssignedAppointmentProjection.js',
);

function appointmentRow(overrides = {}) {
  return {
    appointmentId: 'apt_1748_001',
    caseReference: 'CASE-1748-001',
    appointmentWindow: '2026-05-30 09:00-11:00',
    scheduledStart: new Date('2026-05-30T01:00:00.000Z'),
    scheduledEnd: '2026-05-30T03:00:00.000Z',
    serviceType: 'onsite',
    customerDisplayName: 'Lin masked',
    locationLabel: 'Taipei Zhongshan',
    appointmentStatus: 'confirmed',
    priorityLabel: 'normal',
    serviceSummary: 'Customer-visible repair summary.',
    publicCustomerNotes: 'Customer-visible preparation note.',
    checklistPreview: [
      {
        title: 'Confirm model',
        state: 'pending',
        phone: 'nested_phone_should_not_leak',
        token: 'nested_token_should_not_leak',
        finalAppointmentId: 'nested_final_appointment_should_not_leak',
      },
      'Take exterior photo',
      {},
      '',
    ],
    organizationId: 'org_engineer_mobile_1748',
    engineerUserId: 'eng_user_1748',
    phone: 'raw_phone_should_not_leak',
    mobile: 'raw_mobile_should_not_leak',
    tel: 'raw_tel_should_not_leak',
    address: 'raw_address_should_not_leak',
    fullAddress: 'full_address_should_not_leak',
    lineUserId: 'line_user_should_not_leak',
    providerRawPayload: 'provider_payload_should_not_leak',
    providerDebug: 'provider_debug_should_not_leak',
    authorization: 'auth_header_should_not_leak',
    cookie: 'cookie_should_not_leak',
    password: 'password_should_not_leak',
    token: 'token_should_not_leak',
    secret: 'secret_should_not_leak',
    internalNote: 'internal_note_should_not_leak',
    privateAuditFields: 'private_audit_should_not_leak',
    rawSql: 'select * from appointments',
    rawDbRow: { token: 'raw_db_row_should_not_leak' },
    stack: 'stack_trace_should_not_leak',
    finalAppointmentId: 'final_appointment_should_not_leak',
    fieldServiceReportId: 'field_service_report_should_not_leak',
    ...overrides,
  };
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
    'provider_debug_should_not_leak',
    'auth_header_should_not_leak',
    'cookie_should_not_leak',
    'password_should_not_leak',
    'token_should_not_leak',
    'secret_should_not_leak',
    'internal_note_should_not_leak',
    'private_audit_should_not_leak',
    'select * from appointments',
    'raw_db_row_should_not_leak',
    'stack_trace_should_not_leak',
    'final_appointment_should_not_leak',
    'field_service_report_should_not_leak',
    'nested_phone_should_not_leak',
    'nested_token_should_not_leak',
    'nested_final_appointment_should_not_leak',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('list projection returns only allowlisted safe fields', () => {
  const projected = projectEngineerMobileAssignedAppointmentListItem(appointmentRow());

  assert.deepEqual(projected, {
    appointmentId: 'apt_1748_001',
    caseReference: 'CASE-1748-001',
    appointmentWindow: '2026-05-30 09:00-11:00',
    scheduledStart: '2026-05-30T01:00:00.000Z',
    scheduledEnd: '2026-05-30T03:00:00.000Z',
    serviceType: 'onsite',
    customerDisplayName: 'Lin masked',
    locationLabel: 'Taipei Zhongshan',
    status: 'confirmed',
    priorityLabel: 'normal',
    canOpenDetails: true,
  });
  assertNoForbiddenLeak(projected);
});

test('detail projection returns only allowlisted safe fields', () => {
  const projected = projectEngineerMobileAssignedAppointmentDetail(appointmentRow());

  assert.deepEqual(projected, {
    appointmentId: 'apt_1748_001',
    canOpenDetails: true,
    caseReference: 'CASE-1748-001',
    appointmentWindow: '2026-05-30 09:00-11:00',
    scheduledStart: '2026-05-30T01:00:00.000Z',
    scheduledEnd: '2026-05-30T03:00:00.000Z',
    serviceType: 'onsite',
    customerDisplayName: 'Lin masked',
    locationLabel: 'Taipei Zhongshan',
    status: 'confirmed',
    priorityLabel: 'normal',
    serviceSummary: 'Customer-visible repair summary.',
    publicCustomerNotes: 'Customer-visible preparation note.',
    checklistPreview: [
      {
        label: 'Confirm model',
        status: 'pending',
      },
      {
        label: 'Take exterior photo',
      },
    ],
  });
  assertNoForbiddenLeak(projected);
});

test('projection does not mutate input rows', () => {
  const row = appointmentRow();
  const before = JSON.stringify(row);

  projectEngineerMobileAssignedAppointmentListItem(row);
  projectEngineerMobileAssignedAppointmentDetail(row);

  assert.equal(JSON.stringify(row), before);
  assert.equal(row.checklistPreview[0].phone, 'nested_phone_should_not_leak');
});

test('missing or partial optional fields are handled safely', () => {
  assert.equal(projectEngineerMobileAssignedAppointmentListItem({}), undefined);
  assert.equal(projectEngineerMobileAssignedAppointmentDetail(null), undefined);
  assert.deepEqual(projectEngineerMobileAssignedAppointmentListItem({
    appointment_id: 'apt_minimal',
    unknown: 'not_visible',
  }), {
    appointmentId: 'apt_minimal',
    canOpenDetails: true,
  });
  assert.deepEqual(projectEngineerMobileAssignedAppointmentDetail({
    appointment_id: 'apt_minimal_detail',
    checklist_preview: {
      name: 'Single checklist item',
      internalNote: 'must_not_leak',
    },
  }), {
    appointmentId: 'apt_minimal_detail',
    canOpenDetails: true,
    checklistPreview: [
      {
        label: 'Single checklist item',
      },
    ],
  });
});

test('projection source has no DB app server route listen provider or mutation dependency', () => {
  const source = fs.readFileSync(PROJECTION_SOURCE, 'utf8');

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
    'INSERT ',
    'UPDATE ',
    'DELETE ',
    '.create(',
    '.update(',
    '.insert(',
    '.delete(',
    '.save(',
    '.complete(',
    '.publish(',
  ]) {
    assert.equal(source.includes(forbidden), false, `source contains ${forbidden}`);
  }
});
