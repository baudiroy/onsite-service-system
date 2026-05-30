'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  PUBLIC_OPEN_REPAIR_INTAKE_REQUEST_DTO_ALLOWLIST,
  PUBLIC_OPEN_REPAIR_INTAKE_REQUEST_DTO_DENYLIST,
  sanitizeRepairIntakePublicOpenRequestDto,
} = require('../../src/repairIntake/repairIntakePublicOpenRequestDtoSanitizer');

const REQUIRED_DENIED_FIELDS = Object.freeze([
  'organizationId',
  'caseId',
  'appointmentId',
  'completionReportId',
  'finalAppointmentId',
  'status',
  'createdBy',
  'updatedBy',
  'assignedEngineerId',
  'engineerId',
  'provider',
  'providerPayload',
  'ai',
  'rag',
  'billing',
  'settlement',
  'invoice',
  'audit',
  'auditActor',
  'permission',
  'role',
  'token',
  'password',
  'raw',
  'rawBody',
  'debug',
  'internal',
  'sql',
]);

test('Task2189 sanitizer maps only explicit public/open intake DTO fields', () => {
  const rawInput = {
    customer: {
      displayName: '  Ms. Chen  ',
      contactIntent: '  callback only  ',
      contactMethod: '  line  ',
    },
    service: {
      category: '  appliance_repair  ',
    },
    problem: {
      description: '  washer does not drain  ',
    },
    schedule: {
      preferredTimeDescription: '  weekday afternoon  ',
    },
    site: {
      addressDescription: '  lobby pickup desk  ',
    },
    metadata: {
      source: 'public_form',
      consentConfirmed: true,
    },
  };

  assert.deepEqual(sanitizeRepairIntakePublicOpenRequestDto(rawInput), {
    customerDisplayName: 'Ms. Chen',
    customerContactIntent: 'callback only',
    customerContactMethod: 'line',
    serviceCategory: 'appliance_repair',
    problemDescription: 'washer does not drain',
    preferredTimeDescription: 'weekday afternoon',
    addressDescription: 'lobby pickup desk',
    source: 'public_form',
    consentConfirmed: true,
  });
});

test('Task2189 sanitizer strips unknown, system-controlled, and internal fields', () => {
  const unsafeInput = {
    customerDisplayName: 'Public Customer',
    problemDescription: 'Device will not power on',
    source: 'customer_access',
    consentConfirmed: false,
    unknownPublicField: 'must not pass',
    organizationId: 'org_client_controlled',
    caseId: 'case_client_controlled',
    appointmentId: 'appt_client_controlled',
    completionReportId: 'completion_client_controlled',
    finalAppointmentId: 'final_client_controlled',
    status: 'accepted',
    createdBy: 'client_user',
    updatedBy: 'client_user',
    assignedEngineerId: 'engineer_client_controlled',
    engineerId: 'engineer_client_controlled',
    provider: 'line',
    providerPayload: { token: 'provider_token' },
    ai: { prompt: 'unsafe' },
    rag: { context: 'unsafe' },
    billing: { amount: 1000 },
    settlement: { amount: 1000 },
    invoice: { number: 'INV-1' },
    audit: { actor: 'client' },
    auditActor: 'client_actor',
    permission: 'admin',
    role: 'admin',
    token: 'unsafe_token',
    password: 'unsafe_password',
    raw: 'unsafe_raw',
    rawBody: 'unsafe_raw_body',
    debug: 'unsafe_debug',
    internal: 'unsafe_internal',
    sql: 'select * from repair_intake',
  };

  const sanitized = sanitizeRepairIntakePublicOpenRequestDto(unsafeInput);

  assert.deepEqual(sanitized, {
    customerDisplayName: 'Public Customer',
    problemDescription: 'Device will not power on',
    source: 'customer_access',
    consentConfirmed: false,
  });

  assert.deepEqual(Object.keys(sanitized).sort(), [
    'consentConfirmed',
    'customerDisplayName',
    'problemDescription',
    'source',
  ]);

  const serialized = JSON.stringify(sanitized);

  for (const forbidden of [
    'client_controlled',
    'provider_token',
    'unsafe_token',
    'unsafe_password',
    'unsafe_raw',
    'unsafe_debug',
    'unsafe_internal',
    'select *',
    'admin',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
});

test('Task2189 sanitizer returns a new object and never mutates input', () => {
  const rawInput = {
    customerDisplayName: 'Alice',
    problemDescription: 'Screen issue',
    organizationId: 'org_should_stay_on_source_only',
  };
  const before = JSON.stringify(rawInput);

  const sanitized = sanitizeRepairIntakePublicOpenRequestDto(rawInput);

  assert.notEqual(sanitized, rawInput);
  assert.equal(JSON.stringify(rawInput), before);
  assert.equal(rawInput.organizationId, 'org_should_stay_on_source_only');
});

test('Task2189 sanitizer tolerates missing and non-plain input without leaking internals', () => {
  for (const value of [
    undefined,
    null,
    [],
    'customer',
    123,
    true,
    () => ({ customerDisplayName: 'unsafe' }),
    new Date('2026-05-30T00:00:00Z'),
  ]) {
    assert.deepEqual(sanitizeRepairIntakePublicOpenRequestDto(value), {});
  }
});

test('Task2189 sanitizer omits blank strings and unsafe source values', () => {
  const sanitized = sanitizeRepairIntakePublicOpenRequestDto({
    customerDisplayName: '   ',
    customerContactIntent: '\n',
    customerContactMethod: '\t',
    serviceCategory: '  repair  ',
    problemDescription: '  noisy fan  ',
    preferredTimeDescription: '',
    addressDescription: '   front desk   ',
    source: 'public form with spaces',
    metadata: {
      source: 'metadata_source',
    },
    consent: {
      confirmed: true,
    },
  });

  assert.deepEqual(sanitized, {
    serviceCategory: 'repair',
    problemDescription: 'noisy fan',
    addressDescription: 'front desk',
    consentConfirmed: true,
  });
});

test('Task2189 sanitizer exports explicit allowlist and denied system field coverage', () => {
  assert.deepEqual(PUBLIC_OPEN_REPAIR_INTAKE_REQUEST_DTO_ALLOWLIST, [
    'customerDisplayName',
    'customerContactIntent',
    'customerContactMethod',
    'serviceCategory',
    'problemDescription',
    'preferredTimeDescription',
    'addressDescription',
    'source',
    'consentConfirmed',
  ]);

  for (const field of REQUIRED_DENIED_FIELDS) {
    assert.equal(
      PUBLIC_OPEN_REPAIR_INTAKE_REQUEST_DTO_DENYLIST.includes(field),
      true,
      `missing denied field ${field}`,
    );
  }
});
