'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  ENGINEER_MOBILE_START_TRAVEL_ACTION,
  ENGINEER_MOBILE_START_TRAVEL_PERMISSION,
} = require('../../src/engineerMobile/engineerMobileStartTravelActionPolicy');
const {
  ENGINEER_MOBILE_ARRIVE_ACTION,
  ENGINEER_MOBILE_ARRIVE_PERMISSION,
} = require('../../src/engineerMobile/engineerMobileArriveActionPolicy');
const {
  ENGINEER_MOBILE_START_WORK_ACTION,
  ENGINEER_MOBILE_START_WORK_PERMISSION,
} = require('../../src/engineerMobile/engineerMobileStartWorkActionPolicy');
const {
  ENGINEER_MOBILE_FINISH_WORK_ACTION,
  ENGINEER_MOBILE_FINISH_WORK_PERMISSION,
} = require('../../src/engineerMobile/engineerMobileFinishWorkActionPolicy');
const {
  ENGINEER_MOBILE_RECORD_VISIT_RESULT_ACTION,
  ENGINEER_MOBILE_RECORD_VISIT_RESULT_PERMISSION,
} = require('../../src/engineerMobile/engineerMobileRecordVisitResultActionPolicy');
const {
  ENGINEER_MOBILE_SUPPORTED_VISIT_ACTIONS,
  evaluateEngineerMobileVisitAction,
} = require('../../src/engineerMobile/engineerMobileVisitActionPolicyRegistry');

const NOW = '2026-05-28T11:00:00.000Z';

function actor(permission, overrides = {}) {
  return {
    id: 'eng_task_1804',
    organizationId: 'org_task_1804',
    permissions: [permission],
    ...overrides,
  };
}

function appointment(overrides = {}) {
  return {
    appointmentId: 'apt_task_1804',
    organizationId: 'org_task_1804',
    assignedEngineerId: 'eng_task_1804',
    status: 'scheduled',
    customerPhone: 'raw_phone_should_not_leak',
    address: 'raw_address_should_not_leak',
    lineUserId: 'raw_line_should_not_leak',
    customerName: 'raw_customer_should_not_leak',
    privateNote: 'raw_private_note_should_not_leak',
    reportDraftBody: 'raw_report_draft_should_not_leak',
    ...overrides,
  };
}

function evaluate({
  action,
  permission,
  appointmentOverrides,
  actorOverrides,
  visitResult,
}) {
  return evaluateEngineerMobileVisitAction({
    action,
    actor: actor(permission, actorOverrides),
    appointment: appointment(appointmentOverrides),
    visitResult,
    now: NOW,
  });
}

function assertAllowed(result, action) {
  assert.equal(result.ok, true);
  assert.equal(result.allowed, true);
  assert.equal(result.action, action);
  assert.equal(result.reasonCode, 'allowed');
  assert.equal(result.subject.actorId, 'eng_task_1804');
  assert.equal(result.subject.appointmentId, 'apt_task_1804');
  assert.equal(result.subject.organizationId, 'org_task_1804');
  assert.equal(result.auditIntent.action, action);
  assert.equal(result.auditIntent.allowed, true);
  assert.equal(result.auditIntent.occurredAt, NOW);
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

test('dispatches engineer_mobile.start_travel and returns allowed result for valid snapshot', () => {
  const result = evaluate({
    action: ENGINEER_MOBILE_START_TRAVEL_ACTION,
    permission: ENGINEER_MOBILE_START_TRAVEL_PERMISSION,
  });

  assertAllowed(result, ENGINEER_MOBILE_START_TRAVEL_ACTION);
});

test('dispatches engineer_mobile.arrive and returns allowed result for valid traveling snapshot', () => {
  const result = evaluate({
    action: ENGINEER_MOBILE_ARRIVE_ACTION,
    permission: ENGINEER_MOBILE_ARRIVE_PERMISSION,
    appointmentOverrides: { mobileVisitStatus: 'traveling' },
  });

  assertAllowed(result, ENGINEER_MOBILE_ARRIVE_ACTION);
});

test('dispatches engineer_mobile.start_work and returns allowed result for valid arrived snapshot', () => {
  const result = evaluate({
    action: ENGINEER_MOBILE_START_WORK_ACTION,
    permission: ENGINEER_MOBILE_START_WORK_PERMISSION,
    appointmentOverrides: { mobileVisitStatus: 'arrived' },
  });

  assertAllowed(result, ENGINEER_MOBILE_START_WORK_ACTION);
});

test('dispatches engineer_mobile.finish_work and returns allowed result for valid working snapshot', () => {
  const result = evaluate({
    action: ENGINEER_MOBILE_FINISH_WORK_ACTION,
    permission: ENGINEER_MOBILE_FINISH_WORK_PERMISSION,
    appointmentOverrides: { mobileVisitStatus: 'working' },
  });

  assertAllowed(result, ENGINEER_MOBILE_FINISH_WORK_ACTION);
});

test('dispatches engineer_mobile.record_visit_result and forwards visitResult', () => {
  const result = evaluate({
    action: ENGINEER_MOBILE_RECORD_VISIT_RESULT_ACTION,
    permission: ENGINEER_MOBILE_RECORD_VISIT_RESULT_PERMISSION,
    appointmentOverrides: { mobileVisitStatus: 'work_finished' },
    visitResult: 'parts_required',
  });

  assertAllowed(result, ENGINEER_MOBILE_RECORD_VISIT_RESULT_ACTION);
  assert.equal(result.visitResult, 'parts_required');
  assert.equal(result.auditIntent.visitResult, 'parts_required');
});

test('returns unsupported_action for unknown action string', () => {
  const result = evaluateEngineerMobileVisitAction({
    action: 'engineer_mobile.unknown',
    actor: actor(ENGINEER_MOBILE_START_TRAVEL_PERMISSION),
    appointment: appointment(),
    now: NOW,
  });

  assert.equal(result.ok, false);
  assert.equal(result.allowed, false);
  assert.equal(result.action, 'engineer_mobile.unknown');
  assert.equal(result.reasonCode, 'unsupported_action');
  assert.deepEqual(result.supportedActions, ENGINEER_MOBILE_SUPPORTED_VISIT_ACTIONS);
  assertNoSensitiveLeak(result);
});

test('returns unsupported_action for missing null object and array action', () => {
  for (const action of [undefined, null, {}, []]) {
    const result = evaluateEngineerMobileVisitAction({
      action,
      actor: actor(ENGINEER_MOBILE_START_TRAVEL_PERMISSION),
      appointment: appointment(),
      now: NOW,
    });

    assert.equal(result.ok, false);
    assert.equal(result.allowed, false);
    assert.equal(result.action, undefined);
    assert.equal(result.reasonCode, 'unsupported_action');
    assertNoSensitiveLeak(result);
  }
});

test('preserves denial reason from an underlying policy', () => {
  const result = evaluate({
    action: ENGINEER_MOBILE_FINISH_WORK_ACTION,
    permission: ENGINEER_MOBILE_FINISH_WORK_PERMISSION,
    actorOverrides: { permissions: [] },
    appointmentOverrides: { mobileVisitStatus: 'working' },
  });

  assert.equal(result.ok, false);
  assert.equal(result.allowed, false);
  assert.equal(result.action, ENGINEER_MOBILE_FINISH_WORK_ACTION);
  assert.equal(result.reasonCode, 'permission_required');
  assert.equal(result.auditIntent.reasonCode, 'permission_required');
});

test('confirms sanitized output does not include phone address line customer raw data private notes or report draft fields', () => {
  const result = evaluate({
    action: ENGINEER_MOBILE_RECORD_VISIT_RESULT_ACTION,
    permission: ENGINEER_MOBILE_RECORD_VISIT_RESULT_PERMISSION,
    appointmentOverrides: { mobileVisitStatus: 'work_finished' },
    visitResult: 'resolved',
  });

  assertNoSensitiveLeak(result);
});

test('confirms no mutation of input actor or appointment', () => {
  const sourceActor = actor(ENGINEER_MOBILE_RECORD_VISIT_RESULT_PERMISSION);
  const sourceAppointment = appointment({ mobileVisitStatus: 'work_finished' });
  const beforeActor = clone(sourceActor);
  const beforeAppointment = clone(sourceAppointment);

  evaluateEngineerMobileVisitAction({
    action: ENGINEER_MOBILE_RECORD_VISIT_RESULT_ACTION,
    actor: sourceActor,
    appointment: sourceAppointment,
    visitResult: 'resolved',
    now: NOW,
  });

  assert.deepEqual(sourceActor, beforeActor);
  assert.deepEqual(sourceAppointment, beforeAppointment);
});

test('confirms supported actions list contains exactly the five accepted action names', () => {
  assert.deepEqual(ENGINEER_MOBILE_SUPPORTED_VISIT_ACTIONS, [
    ENGINEER_MOBILE_START_TRAVEL_ACTION,
    ENGINEER_MOBILE_ARRIVE_ACTION,
    ENGINEER_MOBILE_START_WORK_ACTION,
    ENGINEER_MOBILE_FINISH_WORK_ACTION,
    ENGINEER_MOBILE_RECORD_VISIT_RESULT_ACTION,
  ]);
});
