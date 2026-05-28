'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  ENGINEER_MOBILE_RECORD_VISIT_RESULT_ACTION,
  ENGINEER_MOBILE_RECORD_VISIT_RESULT_PERMISSION,
  ENGINEER_MOBILE_ALLOWED_VISIT_RESULTS,
  evaluateEngineerMobileRecordVisitResultAction,
} = require('../../src/engineerMobile/engineerMobileRecordVisitResultActionPolicy');

function actor(overrides = {}) {
  return {
    id: 'eng_task_1802',
    organizationId: 'org_task_1802',
    permissions: [ENGINEER_MOBILE_RECORD_VISIT_RESULT_PERMISSION],
    ...overrides,
  };
}

function appointment(overrides = {}) {
  return {
    appointmentId: 'apt_task_1802',
    organizationId: 'org_task_1802',
    assignedEngineerId: 'eng_task_1802',
    status: 'scheduled',
    mobileVisitStatus: 'work_finished',
    customerPhone: 'raw_phone_should_not_leak',
    address: 'raw_address_should_not_leak',
    lineUserId: 'raw_line_should_not_leak',
    customerName: 'raw_customer_should_not_leak',
    privateNote: 'raw_private_note_should_not_leak',
    reportDraftBody: 'raw_report_draft_should_not_leak',
    ...overrides,
  };
}

function evaluate(overrides = {}) {
  return evaluateEngineerMobileRecordVisitResultAction({
    actor: actor(overrides.actor),
    appointment: appointment(overrides.appointment),
    visitResult: Object.prototype.hasOwnProperty.call(overrides, 'visitResult')
      ? overrides.visitResult
      : 'resolved',
    now: '2026-05-28T10:30:00.000Z',
  });
}

function assertDenied(result, reasonCode) {
  assert.equal(result.ok, false);
  assert.equal(result.allowed, false);
  assert.equal(result.action, ENGINEER_MOBILE_RECORD_VISIT_RESULT_ACTION);
  assert.equal(result.permission, ENGINEER_MOBILE_RECORD_VISIT_RESULT_PERMISSION);
  assert.equal(result.reasonCode, reasonCode);
  assert.equal(result.auditIntent.allowed, false);
  assert.equal(result.auditIntent.reasonCode, reasonCode);
}

function assertAllowed(result, visitResult = 'resolved') {
  assert.equal(result.ok, true);
  assert.equal(result.allowed, true);
  assert.equal(result.action, ENGINEER_MOBILE_RECORD_VISIT_RESULT_ACTION);
  assert.equal(result.permission, ENGINEER_MOBILE_RECORD_VISIT_RESULT_PERMISSION);
  assert.equal(result.reasonCode, 'allowed');
  assert.equal(result.visitResult, visitResult);
  assert.equal(result.subject.actorId, 'eng_task_1802');
  assert.equal(result.subject.appointmentId, 'apt_task_1802');
  assert.equal(result.subject.organizationId, 'org_task_1802');
  assert.equal(result.auditIntent.allowed, true);
  assert.equal(result.auditIntent.visitResult, visitResult);
  assert.equal(result.auditIntent.occurredAt, '2026-05-28T10:30:00.000Z');
}

function assertNoSensitiveLeak(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'raw_phone_should_not_leak',
    'raw_address_should_not_leak',
    'raw_line_should_not_leak',
    'raw_customer_should_not_leak',
    'raw_private_note_should_not_leak',
    'raw_report_draft_should_not_leak',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test('allows same-org assigned engineer with permission when work finished by mobile visit status', () => {
  const result = evaluate();

  assertAllowed(result);
  assertNoSensitiveLeak(result);
});

test('allows when work finished by visit status', () => {
  const result = evaluate({
    appointment: {
      mobileVisitStatus: undefined,
      visitStatus: 'work_finished',
    },
  });

  assertAllowed(result);
});

test('allows when work finished by workFinishedAt', () => {
  const result = evaluate({
    appointment: {
      mobileVisitStatus: undefined,
      workFinishedAt: '2026-05-28T10:20:00.000Z',
    },
  });

  assertAllowed(result);
});

test('allows when work finished by finishedWorkAt', () => {
  const result = evaluate({
    appointment: {
      mobileVisitStatus: undefined,
      finishedWorkAt: '2026-05-28T10:20:00.000Z',
    },
  });

  assertAllowed(result);
});

test('allows each supported visit result code', () => {
  for (const visitResult of ENGINEER_MOBILE_ALLOWED_VISIT_RESULTS) {
    assertAllowed(evaluate({ visitResult }), visitResult);
  }
});

test('denies missing actor', () => {
  const result = evaluateEngineerMobileRecordVisitResultAction({
    appointment: appointment(),
    visitResult: 'resolved',
    now: '2026-05-28T10:30:00.000Z',
  });

  assertDenied(result, 'actor_required');
  assertNoSensitiveLeak(result);
});

test('denies missing appointment', () => {
  const result = evaluateEngineerMobileRecordVisitResultAction({
    actor: actor(),
    visitResult: 'resolved',
    now: '2026-05-28T10:30:00.000Z',
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

test('denies when work-finished evidence is missing', () => {
  assertDenied(evaluate({
    appointment: {
      mobileVisitStatus: undefined,
      visitStatus: undefined,
      workFinishedAt: undefined,
      finishedWorkAt: undefined,
    },
  }), 'work_not_finished');
});

test('denies when visit result already recorded', () => {
  for (const indicator of [
    { visitResult: 'resolved' },
    { visit_outcome: 'customer_unavailable' },
    { recordedVisitResult: 'parts_required' },
    { visitResultRecordedAt: '2026-05-28T10:25:00.000Z' },
  ]) {
    assertDenied(evaluate({ appointment: indicator }), 'visit_result_already_recorded');
  }
});

test('denies invalid empty null object and array visit result', () => {
  for (const visitResult of [
    'unknown',
    '',
    null,
    {},
    [],
  ]) {
    assertDenied(evaluate({ visitResult }), 'invalid_visit_result');
  }
});

test('denies completion-report boundary indicators', () => {
  for (const indicator of [
    { completionReportRequested: true },
    { completionReportDraft: { status: 'draft' } },
    { createReport: true },
    { approveCompletion: true },
    { publishReport: true },
    { fieldServiceReportId: 'fsr_task_1802' },
    { reportFinalizedAt: '2026-05-28T10:30:00.000Z' },
  ]) {
    assertDenied(evaluate({ appointment: indicator }), 'completion_report_boundary');
  }
});

test('denies final appointment boundary indicators', () => {
  for (const indicator of [
    { finalAppointmentId: 'apt_task_1802' },
    { final_appointment_id: 'apt_task_1802' },
    { finalAppointmentOverride: true },
    { markFinalAppointment: true },
  ]) {
    assertDenied(evaluate({ appointment: indicator }), 'final_appointment_boundary');
  }
});

test('confirms sanitized output does not include phone address line customer raw data private notes or report draft fields', () => {
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

  evaluateEngineerMobileRecordVisitResultAction({
    actor: sourceActor,
    appointment: sourceAppointment,
    visitResult: 'resolved',
    now: '2026-05-28T10:30:00.000Z',
  });

  assert.deepEqual(sourceActor, beforeActor);
  assert.deepEqual(sourceAppointment, beforeAppointment);
});
