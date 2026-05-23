'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  evaluateEngineerPreDepartureActionEligibility,
} = require('../../src/engineerMobile/engineerPreDepartureActionEligibility');

function engineerContext(overrides = {}) {
  return {
    organizationId: 'org_engineer_mobile_930',
    engineerId: 'eng_engineer_mobile_930',
    permissions: ['engineer_mobile.assigned_appointments.read'],
    ...overrides,
  };
}

function appointment(overrides = {}) {
  return {
    appointmentId: 'apt_930_001',
    organizationId: 'org_engineer_mobile_930',
    assignedEngineerId: 'eng_engineer_mobile_930',
    status: 'scheduled',
    phone: 'raw_phone_should_not_leak',
    address: 'raw_address_should_not_leak',
    lineUserId: 'line_user_should_not_leak',
    finalAppointmentId: 'final_appointment_should_not_leak',
    internalNote: 'internal_note_should_not_leak',
    providerRawPayload: 'provider_payload_should_not_leak',
    ...overrides,
  };
}

function assertSafeDeny(result, reason) {
  assert.deepEqual(result, {
    ok: false,
    canStartTravel: false,
    canRecordArrival: false,
    canPrepareCompletionDraft: false,
    reasons: [reason],
  });
}

function assertNoSensitiveLeak(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'raw_phone_should_not_leak',
    'raw_address_should_not_leak',
    'line_user_should_not_leak',
    'final_appointment_should_not_leak',
    'internal_note_should_not_leak',
    'provider_payload_should_not_leak',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test('missing context denies safely', () => {
  assertSafeDeny(evaluateEngineerPreDepartureActionEligibility(), 'missing_context');
  assertSafeDeny(evaluateEngineerPreDepartureActionEligibility({}), 'missing_context');
});

test('missing organizationId denies safely', () => {
  assertSafeDeny(evaluateEngineerPreDepartureActionEligibility({
    engineerContext: engineerContext({ organizationId: '' }),
    appointment: appointment(),
  }), 'missing_organization');
});

test('missing engineerId denies safely', () => {
  assertSafeDeny(evaluateEngineerPreDepartureActionEligibility({
    engineerContext: engineerContext({ engineerId: '' }),
    appointment: appointment(),
  }), 'missing_engineer');
});

test('missing appointment denies safely', () => {
  assertSafeDeny(evaluateEngineerPreDepartureActionEligibility({
    engineerContext: engineerContext(),
  }), 'missing_appointment');
});

test('organization mismatch denies safely', () => {
  assertSafeDeny(evaluateEngineerPreDepartureActionEligibility({
    engineerContext: engineerContext(),
    appointment: appointment({ organizationId: 'org_other' }),
  }), 'organization_mismatch');
});

test('assigned engineer mismatch denies safely', () => {
  assertSafeDeny(evaluateEngineerPreDepartureActionEligibility({
    engineerContext: engineerContext(),
    appointment: appointment({ assignedEngineerId: 'eng_other' }),
  }), 'engineer_mismatch');
});

test('missing permission denies safely', () => {
  assertSafeDeny(evaluateEngineerPreDepartureActionEligibility({
    engineerContext: engineerContext({ permissions: [] }),
    appointment: appointment(),
  }), 'permission_denied');
});

test('safe pre-departure statuses allow canStartTravel only as display hint', () => {
  for (const status of ['assigned', 'scheduled', 'confirmed', 'ready_to_start']) {
    assert.deepEqual(evaluateEngineerPreDepartureActionEligibility({
      engineerContext: engineerContext(),
      appointment: appointment({ status }),
    }), {
      ok: true,
      canStartTravel: true,
      canRecordArrival: false,
      canPrepareCompletionDraft: false,
      reasons: [],
    });
  }
});

test('workbench read permission is accepted as equivalent read context', () => {
  assert.equal(evaluateEngineerPreDepartureActionEligibility({
    engineerContext: engineerContext({
      permissions: ['engineer_mobile.workbench.read'],
    }),
    appointment: appointment(),
  }).canStartTravel, true);
});

test('travel-started arrived completed cancelled and closed statuses deny canStartTravel', () => {
  for (const status of ['travel_started', 'traveling', 'arrived', 'in_progress', 'completed', 'cancelled', 'canceled', 'closed']) {
    assertSafeDeny(evaluateEngineerPreDepartureActionEligibility({
      engineerContext: engineerContext(),
      appointment: appointment({ status }),
    }), 'not_pre_departure');
  }
});

test('unsupported status denies without internal leakage', () => {
  const result = evaluateEngineerPreDepartureActionEligibility({
    engineerContext: engineerContext(),
    appointment: appointment({ status: 'requires_manager_internal_review' }),
  });

  assertSafeDeny(result, 'unsupported_status');
  assertNoSensitiveLeak(result);
});

test('snake_case appointment fields are supported without exposing raw fields', () => {
  const result = evaluateEngineerPreDepartureActionEligibility({
    engineerContext: engineerContext(),
    appointment: appointment({
      organizationId: undefined,
      assignedEngineerId: undefined,
      status: undefined,
      organization_id: 'org_engineer_mobile_930',
      assigned_engineer_id: 'eng_engineer_mobile_930',
      appointment_status: 'confirmed',
    }),
  });

  assert.equal(result.canStartTravel, true);
  assertNoSensitiveLeak(result);
});

test('input context and appointment are not mutated', () => {
  const context = engineerContext();
  const sourceAppointment = appointment();
  const beforeContext = clone(context);
  const beforeAppointment = clone(sourceAppointment);

  evaluateEngineerPreDepartureActionEligibility({
    engineerContext: context,
    appointment: sourceAppointment,
  });

  assert.deepEqual(context, beforeContext);
  assert.deepEqual(sourceAppointment, beforeAppointment);
});
