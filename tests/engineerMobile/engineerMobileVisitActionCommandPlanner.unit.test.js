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
  ENGINEER_MOBILE_VISIT_ACTION_COMMAND_PLANNER_KIND,
  planEngineerMobileVisitActionCommand,
} = require('../../src/engineerMobile/engineerMobileVisitActionCommandPlanner');

const NOW = '2026-05-28T12:00:00.000Z';

function actor(permission, overrides = {}) {
  return {
    id: 'eng_task_1806',
    organizationId: 'org_task_1806',
    permissions: [permission],
    ...overrides,
  };
}

function appointment(overrides = {}) {
  return {
    appointmentId: 'apt_task_1806',
    caseId: 'case_task_1806',
    organizationId: 'org_task_1806',
    assignedEngineerId: 'eng_task_1806',
    status: 'scheduled',
    customerPhone: 'raw_phone_should_not_leak',
    address: 'raw_address_should_not_leak',
    lineUserId: 'raw_line_should_not_leak',
    customerName: 'raw_customer_should_not_leak',
    privateNote: 'raw_private_note_should_not_leak',
    reportDraftBody: 'raw_report_draft_should_not_leak',
    providerPayload: 'raw_provider_payload_should_not_leak',
    ...overrides,
  };
}

function plan({
  action,
  permission,
  appointmentOverrides,
  actorOverrides,
  visitResult,
}) {
  return planEngineerMobileVisitActionCommand({
    action,
    actor: actor(permission, actorOverrides),
    appointment: appointment(appointmentOverrides),
    visitResult,
    now: NOW,
  });
}

function assertAllowed(result, action, mobileVisitStatus) {
  assert.equal(result.ok, true);
  assert.equal(result.allowed, true);
  assert.equal(result.plannerKind, ENGINEER_MOBILE_VISIT_ACTION_COMMAND_PLANNER_KIND);
  assert.equal(result.action, action);
  assert.equal(result.reasonCode, 'allowed');
  assert.equal(result.actorId, 'eng_task_1806');
  assert.equal(result.appointmentId, 'apt_task_1806');
  assert.equal(result.caseId, 'case_task_1806');
  assert.equal(result.organizationId, 'org_task_1806');
  assert.deepEqual(result.auditIntent, {
    type: 'engineer_mobile.visit_action_command_planner_decision',
    plannerKind: ENGINEER_MOBILE_VISIT_ACTION_COMMAND_PLANNER_KIND,
    action,
    allowed: true,
    reasonCode: 'allowed',
    actorId: 'eng_task_1806',
    appointmentId: 'apt_task_1806',
    caseId: 'case_task_1806',
    organizationId: 'org_task_1806',
    occurredAt: NOW,
  });
  assert.equal(result.transitionIntent.kind, 'engineer_mobile.visit_action_transition_intent');
  assert.equal(result.transitionIntent.action, action);
  assert.equal(result.transitionIntent.actorId, 'eng_task_1806');
  assert.equal(result.transitionIntent.appointmentId, 'apt_task_1806');
  assert.equal(result.transitionIntent.caseId, 'case_task_1806');
  assert.equal(result.transitionIntent.organizationId, 'org_task_1806');
  assert.equal(result.transitionIntent.mobileVisitStatus, mobileVisitStatus);
  assert.equal(result.transitionIntent.plannedAt, NOW);
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
    'raw_provider_payload_should_not_leak',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test('plans start_travel into a traveling transition intent', () => {
  const result = plan({
    action: ENGINEER_MOBILE_START_TRAVEL_ACTION,
    permission: ENGINEER_MOBILE_START_TRAVEL_PERMISSION,
  });

  assertAllowed(result, ENGINEER_MOBILE_START_TRAVEL_ACTION, 'traveling');
});

test('plans arrive into an arrived transition intent', () => {
  const result = plan({
    action: ENGINEER_MOBILE_ARRIVE_ACTION,
    permission: ENGINEER_MOBILE_ARRIVE_PERMISSION,
    appointmentOverrides: { mobileVisitStatus: 'traveling' },
  });

  assertAllowed(result, ENGINEER_MOBILE_ARRIVE_ACTION, 'arrived');
});

test('plans start_work into a working transition intent', () => {
  const result = plan({
    action: ENGINEER_MOBILE_START_WORK_ACTION,
    permission: ENGINEER_MOBILE_START_WORK_PERMISSION,
    appointmentOverrides: { mobileVisitStatus: 'arrived' },
  });

  assertAllowed(result, ENGINEER_MOBILE_START_WORK_ACTION, 'working');
});

test('plans finish_work into a work_finished transition intent', () => {
  const result = plan({
    action: ENGINEER_MOBILE_FINISH_WORK_ACTION,
    permission: ENGINEER_MOBILE_FINISH_WORK_PERMISSION,
    appointmentOverrides: { mobileVisitStatus: 'working' },
  });

  assertAllowed(result, ENGINEER_MOBILE_FINISH_WORK_ACTION, 'work_finished');
});

test('plans record_visit_result into a visit_result_recorded transition intent with safe visit result', () => {
  const result = plan({
    action: ENGINEER_MOBILE_RECORD_VISIT_RESULT_ACTION,
    permission: ENGINEER_MOBILE_RECORD_VISIT_RESULT_PERMISSION,
    appointmentOverrides: { mobileVisitStatus: 'work_finished' },
    visitResult: 'resolved',
  });

  assertAllowed(result, ENGINEER_MOBILE_RECORD_VISIT_RESULT_ACTION, 'visit_result_recorded');
  assert.equal(result.transitionIntent.visitResult, 'resolved');
});

test('preserves unsupported action denial as unsupported_action', () => {
  const result = planEngineerMobileVisitActionCommand({
    action: 'engineer_mobile.unknown',
    actor: actor(ENGINEER_MOBILE_START_TRAVEL_PERMISSION),
    appointment: appointment(),
    now: NOW,
  });

  assert.equal(result.ok, false);
  assert.equal(result.allowed, false);
  assert.equal(result.action, 'engineer_mobile.unknown');
  assert.equal(result.reasonCode, 'unsupported_action');
  assert.equal(result.appointmentId, 'apt_task_1806');
  assert.equal(result.caseId, 'case_task_1806');
  assert.equal(result.organizationId, 'org_task_1806');
  assert.ok(Array.isArray(result.supportedActions));
  assert.equal('transitionIntent' in result, false);
  assertNoSensitiveLeak(result);
});

test('preserves an underlying policy denial reason', () => {
  const result = plan({
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
  assert.equal('transitionIntent' in result, false);
  assertNoSensitiveLeak(result);
});

test('denied results remain sanitized and do not expose raw appointment or customer data', () => {
  const result = plan({
    action: ENGINEER_MOBILE_RECORD_VISIT_RESULT_ACTION,
    permission: ENGINEER_MOBILE_RECORD_VISIT_RESULT_PERMISSION,
    appointmentOverrides: { mobileVisitStatus: 'work_finished' },
    visitResult: 'invalid_result',
  });

  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'invalid_visit_result');
  assertNoSensitiveLeak(result);
});

test('allowed results remain sanitized and do not expose raw appointment or customer data', () => {
  const result = plan({
    action: ENGINEER_MOBILE_RECORD_VISIT_RESULT_ACTION,
    permission: ENGINEER_MOBILE_RECORD_VISIT_RESULT_PERMISSION,
    appointmentOverrides: { mobileVisitStatus: 'work_finished' },
    visitResult: 'parts_required',
  });

  assert.equal(result.ok, true);
  assertNoSensitiveLeak(result);
});

test('transitionIntent contains only safe command fields', () => {
  const result = plan({
    action: ENGINEER_MOBILE_RECORD_VISIT_RESULT_ACTION,
    permission: ENGINEER_MOBILE_RECORD_VISIT_RESULT_PERMISSION,
    appointmentOverrides: { mobileVisitStatus: 'work_finished' },
    visitResult: 'customer_unavailable',
  });

  assert.deepEqual(Object.keys(result.transitionIntent).sort(), [
    'action',
    'actorId',
    'appointmentId',
    'caseId',
    'kind',
    'mobileVisitStatus',
    'organizationId',
    'plannedAt',
    'visitResult',
  ].sort());
});

test('input actor and appointment are not mutated', () => {
  const sourceActor = actor(ENGINEER_MOBILE_RECORD_VISIT_RESULT_PERMISSION);
  const sourceAppointment = appointment({ mobileVisitStatus: 'work_finished' });
  const beforeActor = clone(sourceActor);
  const beforeAppointment = clone(sourceAppointment);

  planEngineerMobileVisitActionCommand({
    action: ENGINEER_MOBILE_RECORD_VISIT_RESULT_ACTION,
    actor: sourceActor,
    appointment: sourceAppointment,
    visitResult: 'resolved',
    now: NOW,
  });

  assert.deepEqual(sourceActor, beforeActor);
  assert.deepEqual(sourceAppointment, beforeAppointment);
});

test('does not throw for missing null object or array action', () => {
  for (const action of [undefined, null, {}, []]) {
    const result = planEngineerMobileVisitActionCommand({
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
