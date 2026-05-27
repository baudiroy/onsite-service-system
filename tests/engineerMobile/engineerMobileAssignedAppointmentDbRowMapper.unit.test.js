'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  mapAssignedAppointmentDetailDbRow,
  mapAssignedAppointmentListDbRow,
} = require('../../src/engineerMobile/engineerMobileAssignedAppointmentDbRowMapper');

const MAPPER_SOURCE = path.join(
  __dirname,
  '../../src/engineerMobile/engineerMobileAssignedAppointmentDbRowMapper.js',
);

function dbRow(overrides = {}) {
  return {
    appointment_id: 'apt_task1766',
    appointment_status: 'confirmed',
    appointment_window: '2026-05-27 09:00-11:00',
    case_id: 'case_task1766',
    case_reference: 'CASE-1766-001',
    checklist_preview: [
      { label: 'Confirm model', rawDbRow: 'raw_db_row_should_not_leak', status: 'pending' },
      'Collect signature',
      { name: 'Ignored empty status', state: '' },
    ],
    customer_display_name: 'Task1766 masked customer',
    engineer_user_id: 'eng_task1766',
    final_appointment_id: 'final_appointment_id_should_not_leak',
    internal_notes: 'internal_notes_should_not_leak',
    location_label: 'Taipei safe district',
    organization_id: 'org_task1766',
    password: 'password_should_not_leak',
    priority_label: 'normal',
    provider_payload: 'provider_payload_should_not_leak',
    public_customer_notes: 'Customer-visible note',
    raw_address: 'raw_address_should_not_leak',
    raw_db_row: { secret: 'raw_db_row_secret_should_not_leak' },
    raw_phone: 'raw_phone_should_not_leak',
    raw_sql: 'raw_sql_should_not_leak',
    scheduled_end_at: '2026-05-27T03:00:00.000Z',
    scheduled_start_at: '2026-05-27T01:00:00.000Z',
    secret: 'secret_should_not_leak',
    service_summary: 'Safe public service summary',
    service_type: 'onsite',
    stack: 'stack_trace_should_not_leak',
    token: 'token_should_not_leak',
    ...overrides,
  };
}

function expectedMappedRow(overrides = {}) {
  return {
    appointmentId: 'apt_task1766',
    appointmentWindow: '2026-05-27 09:00-11:00',
    caseId: 'case_task1766',
    caseReference: 'CASE-1766-001',
    checklistPreview: [
      { label: 'Confirm model', status: 'pending' },
      { label: 'Collect signature' },
      { label: 'Ignored empty status' },
    ],
    customerDisplayName: 'Task1766 masked customer',
    engineerUserId: 'eng_task1766',
    locationLabel: 'Taipei safe district',
    organizationId: 'org_task1766',
    priorityLabel: 'normal',
    publicCustomerNotes: 'Customer-visible note',
    scheduledEnd: '2026-05-27T03:00:00.000Z',
    scheduledStart: '2026-05-27T01:00:00.000Z',
    serviceSummary: 'Safe public service summary',
    serviceType: 'onsite',
    status: 'confirmed',
    ...overrides,
  };
}

function assertNoForbiddenLeak(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'authorization_header_should_not_leak',
    'cookie_should_not_leak',
    'final_appointment_id_should_not_leak',
    'finalAppointmentId_should_not_leak',
    'internal_notes_should_not_leak',
    'password_should_not_leak',
    'provider_payload_should_not_leak',
    'raw_address_should_not_leak',
    'raw_db_row_secret_should_not_leak',
    'raw_db_row_should_not_leak',
    'raw_phone_should_not_leak',
    'raw_sql_should_not_leak',
    'secret_should_not_leak',
    'stack_trace_should_not_leak',
    'token_should_not_leak',
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

test('list row maps DB snake_case into internal safe row shape', () => {
  const mapped = mapAssignedAppointmentListDbRow(dbRow());

  assert.deepEqual(mapped, expectedMappedRow());
  assert.equal(Object.isFrozen(mapped), true);
  assert.equal(Object.isFrozen(mapped.checklistPreview), true);
  assert.equal(Object.isFrozen(mapped.checklistPreview[0]), true);
  assertNoForbiddenLeak(mapped);
});

test('detail row maps DB snake_case aliases into internal safe row shape', () => {
  const mapped = mapAssignedAppointmentDetailDbRow(dbRow({
    scheduled_end: '2026-05-27T04:00:00.000Z',
    scheduled_end_at: undefined,
    scheduled_start: '2026-05-27T02:00:00.000Z',
    scheduled_start_at: undefined,
  }));

  assert.deepEqual(mapped, expectedMappedRow({
    scheduledEnd: '2026-05-27T04:00:00.000Z',
    scheduledStart: '2026-05-27T02:00:00.000Z',
  }));
  assertNoForbiddenLeak(mapped);
});

test('camelCase fields remain supported only for allowed fields', () => {
  const mapped = mapAssignedAppointmentListDbRow({
    appointmentId: 'apt_camel',
    appointmentWindow: '2026-05-28 09:00-11:00',
    authorization: 'authorization_header_should_not_leak',
    caseId: 'case_camel',
    caseReference: 'CASE-CAMEL',
    checklistPreview: [{ label: 'Safe task', rawSql: 'raw_sql_should_not_leak' }],
    cookie: 'cookie_should_not_leak',
    customerDisplayName: 'Camel customer',
    engineerUserId: 'eng_camel',
    finalAppointmentId: 'finalAppointmentId_should_not_leak',
    locationLabel: 'Safe district',
    organizationId: 'org_camel',
    priorityLabel: 'high',
    providerDebug: 'provider_payload_should_not_leak',
    publicCustomerNotes: 'Safe customer note',
    scheduledEnd: '2026-05-28T03:00:00.000Z',
    scheduledStart: '2026-05-28T01:00:00.000Z',
    serviceSummary: 'Safe summary',
    serviceType: 'maintenance',
    status: 'en_route',
  });

  assert.deepEqual(mapped, {
    appointmentId: 'apt_camel',
    appointmentWindow: '2026-05-28 09:00-11:00',
    caseId: 'case_camel',
    caseReference: 'CASE-CAMEL',
    checklistPreview: [{ label: 'Safe task' }],
    customerDisplayName: 'Camel customer',
    engineerUserId: 'eng_camel',
    locationLabel: 'Safe district',
    organizationId: 'org_camel',
    priorityLabel: 'high',
    publicCustomerNotes: 'Safe customer note',
    scheduledEnd: '2026-05-28T03:00:00.000Z',
    scheduledStart: '2026-05-28T01:00:00.000Z',
    serviceSummary: 'Safe summary',
    serviceType: 'maintenance',
    status: 'en_route',
  });
  assertNoForbiddenLeak(mapped);
});

test('forbidden DB fields are stripped and input row is not mutated', () => {
  const row = dbRow({
    checklist_preview: [{ label: 'Keep label', password: 'password_should_not_leak' }],
  });
  const before = structuredClone(row);

  const mapped = mapAssignedAppointmentDetailDbRow(row);

  assert.deepEqual(row, before);
  assert.deepEqual(mapped.checklistPreview, [{ label: 'Keep label' }]);
  assert.equal(Object.prototype.hasOwnProperty.call(mapped, 'finalAppointmentId'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(mapped, 'final_appointment_id'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(mapped, 'rawSql'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(mapped, 'raw_sql'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(mapped, 'rawDbRow'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(mapped, 'raw_db_row'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(mapped, 'stack'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(mapped, 'internal_notes'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(mapped, 'provider_payload'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(mapped, 'token'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(mapped, 'cookie'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(mapped, 'password'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(mapped, 'secret'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(mapped, 'authorization'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(mapped, 'raw_phone'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(mapped, 'raw_address'), false);
  assertNoForbiddenLeak(mapped);
});

test('missing or partial optional fields remain safe', () => {
  assert.equal(mapAssignedAppointmentListDbRow(undefined), undefined);
  assert.equal(mapAssignedAppointmentListDbRow(null), undefined);
  assert.equal(mapAssignedAppointmentListDbRow([]), undefined);
  assert.equal(mapAssignedAppointmentListDbRow({ appointment_status: 'confirmed' }), undefined);

  assert.deepEqual(mapAssignedAppointmentListDbRow({
    appointment_id: 'apt_partial',
    checklist_preview: [{ rawSql: 'raw_sql_should_not_leak' }, ''],
    organization_id: '',
    scheduled_start_at: new Date('2026-05-29T01:00:00.000Z'),
  }), {
    appointmentId: 'apt_partial',
    scheduledStart: '2026-05-29T01:00:00.000Z',
  });
});

test('mapper source has no DB client env route provider or write dependency', () => {
  const source = fs.readFileSync(MAPPER_SOURCE, 'utf8');
  const requireSpecifiers = Array.from(source.matchAll(/require\(['"]([^'"]+)['"]\)/g), (match) => match[1]);

  assert.deepEqual(requireSpecifiers, []);
  assertNoForbiddenSource(source);
});
