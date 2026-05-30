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

const NOW = '2026-05-31T09:00:00.000Z';
const REQUEST_ID = 'req_task_2289';

const ACTION_CASES = Object.freeze([
  {
    action: ENGINEER_MOBILE_START_TRAVEL_ACTION,
    permission: ENGINEER_MOBILE_START_TRAVEL_PERMISSION,
    mobileVisitStatus: 'traveling',
  },
  {
    action: ENGINEER_MOBILE_ARRIVE_ACTION,
    permission: ENGINEER_MOBILE_ARRIVE_PERMISSION,
    appointmentOverrides: { mobileVisitStatus: 'traveling' },
    mobileVisitStatus: 'arrived',
  },
  {
    action: ENGINEER_MOBILE_START_WORK_ACTION,
    permission: ENGINEER_MOBILE_START_WORK_PERMISSION,
    appointmentOverrides: { mobileVisitStatus: 'arrived' },
    mobileVisitStatus: 'working',
  },
  {
    action: ENGINEER_MOBILE_FINISH_WORK_ACTION,
    permission: ENGINEER_MOBILE_FINISH_WORK_PERMISSION,
    appointmentOverrides: { mobileVisitStatus: 'working' },
    mobileVisitStatus: 'work_finished',
  },
  {
    action: ENGINEER_MOBILE_RECORD_VISIT_RESULT_ACTION,
    permission: ENGINEER_MOBILE_RECORD_VISIT_RESULT_PERMISSION,
    appointmentOverrides: { mobileVisitStatus: 'work_finished' },
    mobileVisitStatus: 'visit_result_recorded',
    visitResult: 'resolved',
  },
]);

const FORBIDDEN_MARKERS = Object.freeze([
  'raw_command_should_not_leak',
  'raw_actor_should_not_leak',
  'raw_assignment_should_not_leak',
  'raw_case_should_not_leak',
  'raw_appointment_should_not_leak',
  'raw_completion_report_should_not_leak',
  'raw_field_service_report_should_not_leak',
  'raw_db_row_should_not_leak',
  'raw_repository_row_should_not_leak',
  'raw_audit_should_not_leak',
  'raw_provider_payload_should_not_leak',
  'raw_ai_should_not_leak',
  'raw_rag_should_not_leak',
  'raw_openai_should_not_leak',
  'raw_vector_should_not_leak',
  'raw_billing_should_not_leak',
  'raw_settlement_should_not_leak',
  'raw_payment_should_not_leak',
  'raw_invoice_should_not_leak',
  'raw_debug_should_not_leak',
  'raw_internal_should_not_leak',
  'raw_sql_should_not_leak',
  'raw_token_should_not_leak',
  'raw_password_should_not_leak',
  'raw_secret_should_not_leak',
  'raw_full_address_should_not_leak',
  'raw_phone_should_not_leak',
  'raw_signature_should_not_leak',
  'raw_photo_should_not_leak',
  'raw_private_should_not_leak',
  'raw_helper_decision_should_not_leak',
  'raw_transition_subject_should_not_leak',
]);

function actor(permission, overrides = {}) {
  return {
    id: 'eng_task_2289',
    organizationId: 'org_task_2289',
    permissions: [permission],
    rawActor: 'raw_actor_should_not_leak',
    assignment: { marker: 'raw_assignment_should_not_leak' },
    audit: { marker: 'raw_audit_should_not_leak' },
    token: 'raw_token_should_not_leak',
    password: 'raw_password_should_not_leak',
    secret: 'raw_secret_should_not_leak',
    ...overrides,
  };
}

function appointment(overrides = {}) {
  return {
    appointmentId: 'apt_task_2289',
    caseId: 'case_task_2289',
    organizationId: 'org_task_2289',
    assignedEngineerId: 'eng_task_2289',
    status: 'scheduled',
    rawCase: { marker: 'raw_case_should_not_leak' },
    rawAppointment: { marker: 'raw_appointment_should_not_leak' },
    completionReport: { marker: 'raw_completion_report_should_not_leak' },
    fieldServiceReport: { marker: 'raw_field_service_report_should_not_leak' },
    dbRow: { marker: 'raw_db_row_should_not_leak' },
    repositoryRow: { marker: 'raw_repository_row_should_not_leak' },
    providerPayload: { marker: 'raw_provider_payload_should_not_leak' },
    ai: { marker: 'raw_ai_should_not_leak' },
    rag: { marker: 'raw_rag_should_not_leak' },
    openai: { marker: 'raw_openai_should_not_leak' },
    vector: { marker: 'raw_vector_should_not_leak' },
    billing: { marker: 'raw_billing_should_not_leak' },
    settlement: { marker: 'raw_settlement_should_not_leak' },
    payment: { marker: 'raw_payment_should_not_leak' },
    invoice: { marker: 'raw_invoice_should_not_leak' },
    debug: { marker: 'raw_debug_should_not_leak' },
    internal: { marker: 'raw_internal_should_not_leak' },
    rawSql: 'raw_sql_should_not_leak',
    fullAddress: 'raw_full_address_should_not_leak',
    customerPhone: 'raw_phone_should_not_leak',
    signature: 'raw_signature_should_not_leak',
    photo: 'raw_photo_should_not_leak',
    privateNote: 'raw_private_should_not_leak',
    ...overrides,
  };
}

function command({
  action = ENGINEER_MOBILE_START_TRAVEL_ACTION,
  permission = ENGINEER_MOBILE_START_TRAVEL_PERMISSION,
  appointmentOverrides,
  actorOverrides,
  visitResult,
  requestId = REQUEST_ID,
  commandOverrides,
} = {}) {
  return {
    action,
    actor: actor(permission, actorOverrides),
    appointment: appointment(appointmentOverrides),
    visitResult,
    requestId,
    now: NOW,
    rawCommand: 'raw_command_should_not_leak',
    ...commandOverrides,
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertNoForbiddenLeak(value) {
  const serialized = JSON.stringify(value);

  for (const marker of FORBIDDEN_MARKERS) {
    assert.equal(serialized.includes(marker), false, `leaked ${marker}`);
  }
}

function assertAllowedShape(result, actionCase) {
  assert.equal(result.ok, true);
  assert.equal(result.allowed, true);
  assert.equal(result.plannerKind, ENGINEER_MOBILE_VISIT_ACTION_COMMAND_PLANNER_KIND);
  assert.equal(result.action, actionCase.action);
  assert.equal(result.reasonCode, 'allowed');
  assert.equal(result.actorId, 'eng_task_2289');
  assert.equal(result.appointmentId, 'apt_task_2289');
  assert.equal(result.caseId, 'case_task_2289');
  assert.equal(result.organizationId, 'org_task_2289');
  assert.equal(result.requestId, REQUEST_ID);
  assert.equal(result.transitionIntent.kind, 'engineer_mobile.visit_action_transition_intent');
  assert.equal(result.transitionIntent.action, actionCase.action);
  assert.equal(result.transitionIntent.actorId, 'eng_task_2289');
  assert.equal(result.transitionIntent.appointmentId, 'apt_task_2289');
  assert.equal(result.transitionIntent.caseId, 'case_task_2289');
  assert.equal(result.transitionIntent.organizationId, 'org_task_2289');
  assert.equal(result.transitionIntent.mobileVisitStatus, actionCase.mobileVisitStatus);
  assert.equal(result.transitionIntent.requestId, REQUEST_ID);
  assert.equal(result.transitionIntent.plannedAt, NOW);
  assert.equal(result.auditIntent.type, 'engineer_mobile.visit_action_command_planner_decision');
  assert.equal(result.auditIntent.action, actionCase.action);
  assert.equal(result.auditIntent.allowed, true);
  assert.equal(result.auditIntent.reasonCode, 'allowed');
  assertNoForbiddenLeak(result);
}

function withMockedDecision(decideEngineerMobileVisitAction, callback) {
  const helperPath = require.resolve('../../src/engineerMobile/engineerMobileVisitActionDecisionHelper');
  const plannerPath = require.resolve('../../src/engineerMobile/engineerMobileVisitActionCommandPlanner');
  const originalHelper = require.cache[helperPath];
  const originalPlanner = require.cache[plannerPath];

  delete require.cache[plannerPath];
  require.cache[helperPath] = {
    id: helperPath,
    filename: helperPath,
    loaded: true,
    exports: { decideEngineerMobileVisitAction },
  };

  try {
    return callback(require(plannerPath));
  } finally {
    delete require.cache[plannerPath];

    if (originalHelper) {
      require.cache[helperPath] = originalHelper;
    } else {
      delete require.cache[helperPath];
    }

    if (originalPlanner) {
      require.cache[plannerPath] = originalPlanner;
    }
  }
}

test('allowed success output remains compatible for all supported actions', () => {
  for (const actionCase of ACTION_CASES) {
    const result = planEngineerMobileVisitActionCommand(command({
      action: actionCase.action,
      permission: actionCase.permission,
      appointmentOverrides: actionCase.appointmentOverrides,
      visitResult: actionCase.visitResult,
    }));

    assertAllowedShape(result, actionCase);

    if (actionCase.action === ENGINEER_MOBILE_RECORD_VISIT_RESULT_ACTION) {
      assert.equal(result.transitionIntent.visitResult, actionCase.visitResult);
    } else {
      assert.equal('visitResult' in result.transitionIntent, false);
    }
  }
});

test('explicit transition intent is present only on allowed actions', () => {
  const allowed = planEngineerMobileVisitActionCommand(command());
  const denied = planEngineerMobileVisitActionCommand(command({
    action: ENGINEER_MOBILE_FINISH_WORK_ACTION,
    permission: ENGINEER_MOBILE_FINISH_WORK_PERMISSION,
    appointmentOverrides: { mobileVisitStatus: 'scheduled' },
  }));

  assert.equal(allowed.allowed, true);
  assert.equal(typeof allowed.transitionIntent, 'object');
  assert.equal(denied.allowed, false);
  assert.equal('transitionIntent' in denied, false);
  assertNoForbiddenLeak(denied);
});

test('raw command actor appointment assignment policy and helper objects are not passed through', () => {
  const source = command({
    action: ENGINEER_MOBILE_RECORD_VISIT_RESULT_ACTION,
    permission: ENGINEER_MOBILE_RECORD_VISIT_RESULT_PERMISSION,
    appointmentOverrides: { mobileVisitStatus: 'work_finished' },
    visitResult: 'parts_required',
  });
  const before = clone(source);
  const result = planEngineerMobileVisitActionCommand(source);

  assert.equal(result.ok, true);
  assert.equal(Object.values(result).includes(source), false);
  assert.equal(Object.values(result).includes(source.actor), false);
  assert.equal(Object.values(result).includes(source.appointment), false);
  assert.deepEqual(source, before);
  assertNoForbiddenLeak(result);
});

test('report-boundary markers fail closed and are not emitted', () => {
  for (const marker of [
    { completionReportId: 'raw_completion_report_should_not_leak' },
    { fieldServiceReportId: 'raw_field_service_report_should_not_leak' },
    { finalAppointmentId: 'raw_final_appointment_should_not_leak' },
    { publishReport: 'raw_publish_report_should_not_leak' },
    { approveReport: 'raw_approve_report_should_not_leak' },
    { formalizeReport: 'raw_formalize_report_should_not_leak' },
    { createReport: 'raw_create_report_should_not_leak' },
  ]) {
    const result = planEngineerMobileVisitActionCommand(command({
      commandOverrides: marker,
    }));

    assert.equal(result.ok, false);
    assert.equal(result.allowed, false);
    assert.equal(result.reasonCode, 'report_boundary');
    assert.equal('transitionIntent' in result, false);
    assertNoForbiddenLeak(result);
    assert.equal(JSON.stringify(result).includes(Object.values(marker)[0]), false);
  }
});

test('malformed helper decisions fail closed without leaking helper internals', () => {
  withMockedDecision(() => ({
    allowed: true,
    status: 'allowed',
    reasonCode: 'allowed',
    action: 'engineer_mobile.unsupported',
    rawHelperDecision: 'raw_helper_decision_should_not_leak',
    transitionIntent: {
      action: 'engineer_mobile.unsupported',
      actorId: 'eng_task_2289',
      appointmentId: 'apt_task_2289',
      organizationId: 'org_task_2289',
      mobileVisitStatus: 'raw_transition_subject_should_not_leak',
    },
  }), ({ planEngineerMobileVisitActionCommand: mockedPlan }) => {
    const result = mockedPlan(command());

    assert.equal(result.ok, false);
    assert.equal(result.allowed, false);
    assert.equal(result.reasonCode, 'malformed_decision');
    assert.equal('transitionIntent' in result, false);
    assertNoForbiddenLeak(result);
  });
});

test('malformed transition intents fail closed without exposing raw transition subject', () => {
  withMockedDecision(() => ({
    allowed: true,
    status: 'allowed',
    reasonCode: 'allowed',
    action: ENGINEER_MOBILE_START_TRAVEL_ACTION,
    assignmentReference: {
      engineerId: 'eng_task_2289',
      organizationId: 'org_task_2289',
    },
    appointmentReference: {
      appointmentId: 'apt_task_2289',
      caseId: 'case_task_2289',
      organizationId: 'org_task_2289',
    },
    transitionIntent: {
      action: ENGINEER_MOBILE_START_TRAVEL_ACTION,
      actorId: 'eng_task_2289',
      appointmentId: 'apt_task_2289',
      caseId: 'case_task_2289',
      organizationId: 'org_task_2289',
      mobileVisitStatus: 'raw_transition_subject_should_not_leak',
      providerPayload: 'raw_provider_payload_should_not_leak',
    },
  }), ({ planEngineerMobileVisitActionCommand: mockedPlan }) => {
    const result = mockedPlan(command());

    assert.equal(result.ok, false);
    assert.equal(result.allowed, false);
    assert.equal(result.reasonCode, 'malformed_transition_intent');
    assert.equal('transitionIntent' in result, false);
    assertNoForbiddenLeak(result);
  });
});

test('safe output normalizer strips extra helper decision and transition intent fields', () => {
  withMockedDecision(() => ({
    allowed: true,
    status: 'allowed',
    reasonCode: 'allowed',
    action: ENGINEER_MOBILE_START_TRAVEL_ACTION,
    rawHelperDecision: 'raw_helper_decision_should_not_leak',
    assignmentReference: {
      engineerId: 'eng_task_2289',
      organizationId: 'org_task_2289',
      rawAssignment: 'raw_assignment_should_not_leak',
    },
    appointmentReference: {
      appointmentId: 'apt_task_2289',
      caseId: 'case_task_2289',
      organizationId: 'org_task_2289',
      rawAppointment: 'raw_appointment_should_not_leak',
    },
    transitionIntent: {
      action: ENGINEER_MOBILE_START_TRAVEL_ACTION,
      actorId: 'eng_task_2289',
      appointmentId: 'apt_task_2289',
      caseId: 'case_task_2289',
      organizationId: 'org_task_2289',
      mobileVisitStatus: 'traveling',
      plannedAt: NOW,
      rawTransitionSubject: 'raw_transition_subject_should_not_leak',
      providerPayload: 'raw_provider_payload_should_not_leak',
      token: 'raw_token_should_not_leak',
    },
  }), ({ planEngineerMobileVisitActionCommand: mockedPlan }) => {
    const result = mockedPlan(command());

    assert.equal(result.ok, true);
    assert.deepEqual(Object.keys(result.transitionIntent).sort(), [
      'action',
      'actorId',
      'appointmentId',
      'caseId',
      'kind',
      'mobileVisitStatus',
      'organizationId',
      'plannedAt',
      'requestId',
    ].sort());
    assertNoForbiddenLeak(result);
  });
});
