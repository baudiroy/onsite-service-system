'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  ENGINEER_MOBILE_ARRIVE_ACTION,
  ENGINEER_MOBILE_ARRIVE_PERMISSION,
  evaluateEngineerMobileArriveAction,
} = require('../../src/engineerMobile/engineerMobileArriveActionPolicy');

function actor(overrides = {}) {
  return {
    id: 'eng_task_1796',
    organizationId: 'org_task_1796',
    permissions: [ENGINEER_MOBILE_ARRIVE_PERMISSION],
    ...overrides,
  };
}

function appointment(overrides = {}) {
  return {
    appointmentId: 'apt_task_1796',
    organizationId: 'org_task_1796',
    assignedEngineerId: 'eng_task_1796',
    status: 'scheduled',
    mobileVisitStatus: 'traveling',
    customerPhone: 'raw_phone_should_not_leak',
    address: 'raw_address_should_not_leak',
    lineUserId: 'raw_line_should_not_leak',
    customerName: 'raw_customer_should_not_leak',
    privateNote: 'raw_private_note_should_not_leak',
    ...overrides,
  };
}

function evaluate(overrides = {}) {
  return evaluateEngineerMobileArriveAction({
    actor: actor(overrides.actor),
    appointment: appointment(overrides.appointment),
    now: '2026-05-28T09:00:00.000Z',
  });
}

function assertDenied(result, reasonCode) {
  assert.equal(result.ok, false);
  assert.equal(result.allowed, false);
  assert.equal(result.action, ENGINEER_MOBILE_ARRIVE_ACTION);
  assert.equal(result.permission, ENGINEER_MOBILE_ARRIVE_PERMISSION);
  assert.equal(result.reasonCode, reasonCode);
  assert.equal(result.auditIntent.allowed, false);
  assert.equal(result.auditIntent.reasonCode, reasonCode);
}

function assertAllowed(result) {
  assert.equal(result.ok, true);
  assert.equal(result.allowed, true);
  assert.equal(result.action, ENGINEER_MOBILE_ARRIVE_ACTION);
  assert.equal(result.permission, ENGINEER_MOBILE_ARRIVE_PERMISSION);
  assert.equal(result.reasonCode, 'allowed');
  assert.equal(result.subject.actorId, 'eng_task_1796');
  assert.equal(result.subject.appointmentId, 'apt_task_1796');
  assert.equal(result.subject.organizationId, 'org_task_1796');
  assert.equal(result.auditIntent.allowed, true);
  assert.equal(result.auditIntent.occurredAt, '2026-05-28T09:00:00.000Z');
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

test('allows same-org assigned engineer with arrive permission when mobile visit status is traveling', () => {
  const result = evaluate();

  assertAllowed(result);
  assertNoSensitiveLeak(result);
});

test('allows when travel has started by visit status traveling', () => {
  const result = evaluate({
    appointment: {
      mobileVisitStatus: undefined,
      visitStatus: 'traveling',
    },
  });

  assertAllowed(result);
});

test('allows when travel has started by travelStartedAt', () => {
  const result = evaluate({
    appointment: {
      mobileVisitStatus: undefined,
      travelStartedAt: '2026-05-28T08:45:00.000Z',
    },
  });

  assertAllowed(result);
});

test('denies missing actor', () => {
  const result = evaluateEngineerMobileArriveAction({
    appointment: appointment(),
    now: '2026-05-28T09:00:00.000Z',
  });

  assertDenied(result, 'actor_required');
  assertNoSensitiveLeak(result);
});

test('denies missing appointment', () => {
  const result = evaluateEngineerMobileArriveAction({
    actor: actor(),
    now: '2026-05-28T09:00:00.000Z',
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

test('denies actor not assigned to appointment', () => {
  assertDenied(evaluate({
    appointment: { assignedEngineerId: 'eng_other' },
  }), 'not_assigned_engineer');
});

test('denies cancelled completed and no_show appointment statuses', () => {
  for (const status of ['cancelled', 'completed', 'no_show']) {
    assertDenied(evaluate({ appointment: { status } }), 'appointment_not_open');
  }
});

test('denies when travel has not started', () => {
  assertDenied(evaluate({
    appointment: {
      mobileVisitStatus: undefined,
      visitStatus: undefined,
      travelStartedAt: undefined,
    },
  }), 'travel_not_started');
});

test('denies already arrived appointment', () => {
  assertDenied(evaluate({
    appointment: { arrivedAt: '2026-05-28T09:01:00.000Z' },
  }), 'already_arrived');
});

test('denies already finished appointment', () => {
  assertDenied(evaluate({
    appointment: { completedAt: '2026-05-28T10:00:00.000Z' },
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
    { fieldServiceReportId: 'fsr_task_1796' },
    { reportFinalizedAt: '2026-05-28T10:00:00.000Z' },
  ]) {
    assertDenied(evaluate({ appointment: indicator }), 'completion_report_boundary');
  }
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

test('confirms no mutation of input actor or appointment', () => {
  const sourceActor = actor();
  const sourceAppointment = appointment({
    completionReportRequested: false,
  });
  const beforeActor = clone(sourceActor);
  const beforeAppointment = clone(sourceAppointment);

  evaluateEngineerMobileArriveAction({
    actor: sourceActor,
    appointment: sourceAppointment,
    now: '2026-05-28T09:00:00.000Z',
  });

  assert.deepEqual(sourceActor, beforeActor);
  assert.deepEqual(sourceAppointment, beforeAppointment);
});
