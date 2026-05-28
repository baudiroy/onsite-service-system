'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  ENGINEER_MOBILE_START_TRAVEL_ACTION,
  ENGINEER_MOBILE_START_TRAVEL_PERMISSION,
  evaluateEngineerMobileStartTravelAction,
} = require('../../src/engineerMobile/engineerMobileStartTravelActionPolicy');

function actor(overrides = {}) {
  return {
    id: 'eng_task_1794',
    organizationId: 'org_task_1794',
    permissions: [ENGINEER_MOBILE_START_TRAVEL_PERMISSION],
    ...overrides,
  };
}

function appointment(overrides = {}) {
  return {
    appointmentId: 'apt_task_1794',
    organizationId: 'org_task_1794',
    assignedEngineerId: 'eng_task_1794',
    status: 'scheduled',
    customerPhone: 'raw_phone_should_not_leak',
    address: 'raw_address_should_not_leak',
    lineUserId: 'raw_line_should_not_leak',
    customerName: 'raw_customer_should_not_leak',
    privateNote: 'raw_private_note_should_not_leak',
    ...overrides,
  };
}

function evaluate(overrides = {}) {
  return evaluateEngineerMobileStartTravelAction({
    actor: actor(overrides.actor),
    appointment: appointment(overrides.appointment),
    now: '2026-05-28T08:00:00.000Z',
  });
}

function assertDenied(result, reasonCode) {
  assert.equal(result.ok, false);
  assert.equal(result.allowed, false);
  assert.equal(result.action, ENGINEER_MOBILE_START_TRAVEL_ACTION);
  assert.equal(result.permission, ENGINEER_MOBILE_START_TRAVEL_PERMISSION);
  assert.equal(result.reasonCode, reasonCode);
  assert.equal(result.auditIntent.allowed, false);
  assert.equal(result.auditIntent.reasonCode, reasonCode);
}

function assertAllowed(result) {
  assert.equal(result.ok, true);
  assert.equal(result.allowed, true);
  assert.equal(result.action, ENGINEER_MOBILE_START_TRAVEL_ACTION);
  assert.equal(result.permission, ENGINEER_MOBILE_START_TRAVEL_PERMISSION);
  assert.equal(result.reasonCode, 'allowed');
  assert.equal(result.subject.actorId, 'eng_task_1794');
  assert.equal(result.subject.appointmentId, 'apt_task_1794');
  assert.equal(result.subject.organizationId, 'org_task_1794');
  assert.equal(result.auditIntent.allowed, true);
  assert.equal(result.auditIntent.occurredAt, '2026-05-28T08:00:00.000Z');
}

function assertNoSensitiveLeak(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'raw_phone_should_not_leak',
    'raw_address_should_not_leak',
    'raw_line_should_not_leak',
    'raw_customer_should_not_leak',
    'raw_private_note_should_not_leak',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test('allows a same-org assigned engineer with permission on a scheduled appointment', () => {
  const result = evaluate();

  assertAllowed(result);
  assertNoSensitiveLeak(result);
});

test('allows a same-org assigned engineer with permission on a rescheduled appointment', () => {
  const result = evaluate({ appointment: { status: 'rescheduled' } });

  assertAllowed(result);
});

test('denies missing actor', () => {
  const result = evaluateEngineerMobileStartTravelAction({
    appointment: appointment(),
    now: '2026-05-28T08:00:00.000Z',
  });

  assertDenied(result, 'actor_required');
  assertNoSensitiveLeak(result);
});

test('denies missing appointment', () => {
  const result = evaluateEngineerMobileStartTravelAction({
    actor: actor(),
    now: '2026-05-28T08:00:00.000Z',
  });

  assertDenied(result, 'appointment_required');
});

test('denies organization mismatch', () => {
  assertDenied(evaluate({
    appointment: { organizationId: 'org_other' },
  }), 'organization_mismatch');
});

test('denies missing permission', () => {
  assertDenied(evaluate({
    actor: { permissions: [] },
  }), 'permission_required');
});

test('denies actor not assigned to the appointment', () => {
  assertDenied(evaluate({
    appointment: { assignedEngineerId: 'eng_other' },
  }), 'not_assigned_engineer');
});

test('denies cancelled completed and no_show appointment statuses', () => {
  for (const status of ['cancelled', 'completed', 'no_show']) {
    assertDenied(evaluate({ appointment: { status } }), 'appointment_not_open');
  }
});

test('denies already arrived appointment', () => {
  assertDenied(evaluate({
    appointment: { arrivedAt: '2026-05-28T08:05:00.000Z' },
  }), 'already_arrived');
});

test('denies already finished appointment', () => {
  assertDenied(evaluate({
    appointment: { completedAt: '2026-05-28T09:00:00.000Z' },
  }), 'already_finished');
});

test('denies terminal visit result', () => {
  assertDenied(evaluate({
    appointment: { visitResult: 'completed' },
  }), 'terminal_visit_result');
});

test('denies completion-report boundary indicators', () => {
  for (const indicator of [
    { completionReportRequested: true },
    { createReport: true },
    { publishReport: true },
    { fieldServiceReportId: 'fsr_task_1794' },
    { reportFinalizedAt: '2026-05-28T09:00:00.000Z' },
  ]) {
    assertDenied(evaluate({ appointment: indicator }), 'completion_report_boundary');
  }
});

test('accepts common assigned engineer snapshot keys', () => {
  const result = evaluate({
    appointment: {
      assignedEngineerId: undefined,
      engineerId: 'eng_task_1794',
    },
  });

  assertAllowed(result);
});

test('confirms sanitized output does not include phone address line customer raw data or private notes', () => {
  const result = evaluate();

  assertNoSensitiveLeak(result);
  assert.deepEqual(Object.keys(result.subject).sort(), [
    'actorId',
    'appointmentId',
    'organizationId',
    'status',
  ]);
});

test('confirms function is pure and does not mutate input actor or appointment', () => {
  const sourceActor = actor();
  const sourceAppointment = appointment({
    completionReportRequested: false,
  });
  const beforeActor = clone(sourceActor);
  const beforeAppointment = clone(sourceAppointment);

  evaluateEngineerMobileStartTravelAction({
    actor: sourceActor,
    appointment: sourceAppointment,
    now: '2026-05-28T08:00:00.000Z',
  });

  assert.deepEqual(sourceActor, beforeActor);
  assert.deepEqual(sourceAppointment, beforeAppointment);
});
