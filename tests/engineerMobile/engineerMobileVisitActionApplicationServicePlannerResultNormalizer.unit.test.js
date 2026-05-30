'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  ENGINEER_MOBILE_START_TRAVEL_ACTION,
  ENGINEER_MOBILE_START_TRAVEL_PERMISSION,
} = require('../../src/engineerMobile/engineerMobileStartTravelActionPolicy');
const {
  ENGINEER_MOBILE_RECORD_VISIT_RESULT_ACTION,
  ENGINEER_MOBILE_RECORD_VISIT_RESULT_PERMISSION,
} = require('../../src/engineerMobile/engineerMobileRecordVisitResultActionPolicy');
const {
  ENGINEER_MOBILE_VISIT_ACTION_APPLICATION_SERVICE_KIND,
  createEngineerMobileVisitActionApplicationService,
} = require('../../src/engineerMobile/engineerMobileVisitActionApplicationService');

const NOW = '2026-05-31T10:00:00.000Z';
const REQUEST_ID = 'req_task_2292';

const FORBIDDEN_MARKERS = Object.freeze([
  'raw_command_should_not_leak',
  'raw_planner_should_not_leak',
  'raw_actor_should_not_leak',
  'raw_assignment_should_not_leak',
  'raw_helper_should_not_leak',
  'raw_policy_should_not_leak',
  'raw_transition_should_not_leak',
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
  'raw_final_appointment_should_not_leak',
  'raw_publish_report_should_not_leak',
  'raw_approve_report_should_not_leak',
  'raw_formalize_report_should_not_leak',
  'raw_create_report_should_not_leak',
]);

function actor(permission, overrides = {}) {
  return {
    id: 'eng_task_2292',
    organizationId: 'org_task_2292',
    permissions: [permission],
    rawActor: 'raw_actor_should_not_leak',
    assignment: { marker: 'raw_assignment_should_not_leak' },
    ...overrides,
  };
}

function appointment(overrides = {}) {
  return {
    appointmentId: 'apt_task_2292',
    caseId: 'case_task_2292',
    organizationId: 'org_task_2292',
    assignedEngineerId: 'eng_task_2292',
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

function command(overrides = {}) {
  return {
    action: ENGINEER_MOBILE_START_TRAVEL_ACTION,
    actor: actor(ENGINEER_MOBILE_START_TRAVEL_PERMISSION),
    appointment: appointment(),
    now: NOW,
    requestId: REQUEST_ID,
    rawCommand: 'raw_command_should_not_leak',
    ...overrides,
  };
}

function validPlannerResult(overrides = {}) {
  return {
    ok: true,
    allowed: true,
    plannerKind: 'engineer_mobile.visit_action_command_planner',
    action: ENGINEER_MOBILE_START_TRAVEL_ACTION,
    reasonCode: 'allowed',
    actorId: 'eng_task_2292',
    appointmentId: 'apt_task_2292',
    caseId: 'case_task_2292',
    organizationId: 'org_task_2292',
    requestId: REQUEST_ID,
    rawPlanner: 'raw_planner_should_not_leak',
    helperDecision: { marker: 'raw_helper_should_not_leak' },
    policyDecision: { marker: 'raw_policy_should_not_leak' },
    transitionIntent: {
      kind: 'engineer_mobile.visit_action_transition_intent',
      action: ENGINEER_MOBILE_START_TRAVEL_ACTION,
      actorId: 'eng_task_2292',
      appointmentId: 'apt_task_2292',
      caseId: 'case_task_2292',
      organizationId: 'org_task_2292',
      mobileVisitStatus: 'traveling',
      requestId: REQUEST_ID,
      plannedAt: NOW,
      rawTransition: 'raw_transition_should_not_leak',
      providerPayload: 'raw_provider_payload_should_not_leak',
      finalAppointmentId: 'raw_final_appointment_should_not_leak',
      publishReport: 'raw_publish_report_should_not_leak',
      approveReport: 'raw_approve_report_should_not_leak',
      formalizeReport: 'raw_formalize_report_should_not_leak',
      createReport: 'raw_create_report_should_not_leak',
    },
    auditIntent: {
      type: 'engineer_mobile.visit_action_command_planner_decision',
      plannerKind: 'engineer_mobile.visit_action_command_planner',
      action: ENGINEER_MOBILE_START_TRAVEL_ACTION,
      allowed: true,
      reasonCode: 'allowed',
      actorId: 'eng_task_2292',
      appointmentId: 'apt_task_2292',
      caseId: 'case_task_2292',
      organizationId: 'org_task_2292',
      requestId: REQUEST_ID,
      occurredAt: NOW,
      rawAudit: 'raw_audit_should_not_leak',
      token: 'raw_token_should_not_leak',
    },
    ...overrides,
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

function serviceWithWriters(calls = []) {
  return createEngineerMobileVisitActionApplicationService({
    transitionWriter: {
      write(intent) {
        calls.push({ name: 'transition', payload: intent });
        return { ok: true };
      },
    },
    auditWriter: {
      record(intent) {
        calls.push({ name: 'audit', payload: intent });
        return { ok: true };
      },
    },
  });
}

function withMockedPlanner(planFactory, callback) {
  const plannerPath = require.resolve('../../src/engineerMobile/engineerMobileVisitActionCommandPlanner');
  const servicePath = require.resolve('../../src/engineerMobile/engineerMobileVisitActionApplicationService');
  const originalPlanner = require.cache[plannerPath];
  const originalService = require.cache[servicePath];

  delete require.cache[servicePath];
  require.cache[plannerPath] = {
    id: plannerPath,
    filename: plannerPath,
    loaded: true,
    exports: { planEngineerMobileVisitActionCommand: planFactory },
  };

  try {
    return callback(require(servicePath));
  } finally {
    delete require.cache[servicePath];

    if (originalPlanner) {
      require.cache[plannerPath] = originalPlanner;
    } else {
      delete require.cache[plannerPath];
    }

    if (originalService) {
      require.cache[servicePath] = originalService;
    }
  }
}

test('existing allowed action success path remains compatible with normalized transition and audit handling', () => {
  const calls = [];
  const service = serviceWithWriters(calls);
  const result = service.handleEngineerMobileVisitAction(command());

  assert.equal(result.ok, true);
  assert.equal(result.allowed, true);
  assert.equal(result.serviceKind, ENGINEER_MOBILE_VISIT_ACTION_APPLICATION_SERVICE_KIND);
  assert.equal(result.reasonCode, 'applied');
  assert.equal(result.action, ENGINEER_MOBILE_START_TRAVEL_ACTION);
  assert.equal(result.transitionApplied, true);
  assert.equal(result.auditRecorded, true);
  assert.deepEqual(calls.map((call) => call.name), ['transition', 'audit']);
  assert.equal(calls[0].payload.kind, 'engineer_mobile.visit_action_transition_intent');
  assert.equal(calls[0].payload.mobileVisitStatus, 'traveling');
  assert.equal(calls[1].payload.type, 'engineer_mobile.visit_action_command_planner_decision');
  assertNoForbiddenLeak([result, calls]);
});

test('application service strips raw planner transition audit and report-boundary fields before writers', () => {
  const plan = validPlannerResult();
  const beforePlan = clone(plan);
  const calls = [];

  withMockedPlanner(() => plan, ({ createEngineerMobileVisitActionApplicationService: createService }) => {
    const service = createService({
      transitionWriter: {
        write(intent) {
          calls.push({ name: 'transition', payload: intent });
          return { ok: true };
        },
      },
      auditWriter: {
        record(intent) {
          calls.push({ name: 'audit', payload: intent });
          return { ok: true };
        },
      },
    });
    const result = service.handleEngineerMobileVisitAction(command());

    assert.equal(result.ok, true);
    assert.equal(result.reasonCode, 'applied');
    assert.deepEqual(plan, beforePlan);
    assert.deepEqual(Object.keys(calls[0].payload).sort(), [
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
    assertNoForbiddenLeak([result, calls]);
  });
});

test('malformed planner result fails closed without writer calls', () => {
  const calls = [];

  withMockedPlanner(() => validPlannerResult({
    action: 'engineer_mobile.unsafe',
    rawPlanner: 'raw_planner_should_not_leak',
  }), ({ createEngineerMobileVisitActionApplicationService: createService }) => {
    const result = createService({
      transitionWriter: { write(intent) { calls.push({ name: 'transition', payload: intent }); } },
      auditWriter: { record(intent) { calls.push({ name: 'audit', payload: intent }); } },
    }).handleEngineerMobileVisitAction(command());

    assert.equal(result.ok, false);
    assert.equal(result.allowed, false);
    assert.equal(result.reasonCode, 'malformed_planner_result');
    assert.equal(result.transitionApplied, false);
    assert.equal(result.auditRecorded, false);
    assert.deepEqual(calls, []);
    assertNoForbiddenLeak(result);
  });
});

test('malformed transition intent fails closed without writer calls', () => {
  const calls = [];

  withMockedPlanner(() => validPlannerResult({
    transitionIntent: {
      kind: 'engineer_mobile.visit_action_transition_intent',
      action: ENGINEER_MOBILE_START_TRAVEL_ACTION,
      actorId: 'eng_task_2292',
      appointmentId: 'apt_task_2292',
      caseId: 'case_task_2292',
      organizationId: 'org_task_2292',
      mobileVisitStatus: 'raw_transition_should_not_leak',
      requestId: REQUEST_ID,
      plannedAt: NOW,
    },
  }), ({ createEngineerMobileVisitActionApplicationService: createService }) => {
    const result = createService({
      transitionWriter: { write(intent) { calls.push({ name: 'transition', payload: intent }); } },
      auditWriter: { record(intent) { calls.push({ name: 'audit', payload: intent }); } },
    }).handleEngineerMobileVisitAction(command());

    assert.equal(result.ok, false);
    assert.equal(result.allowed, false);
    assert.equal(result.reasonCode, 'malformed_transition_intent');
    assert.deepEqual(calls, []);
    assertNoForbiddenLeak(result);
  });
});

test('deny and ineligible planner results remain generic and safe', () => {
  withMockedPlanner(() => ({
    ok: false,
    allowed: false,
    action: ENGINEER_MOBILE_RECORD_VISIT_RESULT_ACTION,
    reasonCode: 'raw_secret_should_not_leak',
    actorId: 'eng_task_2292',
    appointmentId: 'apt_task_2292',
    caseId: 'case_task_2292',
    organizationId: 'org_task_2292',
    requestId: REQUEST_ID,
    transitionIntent: { rawTransition: 'raw_transition_should_not_leak' },
    auditIntent: { rawAudit: 'raw_audit_should_not_leak' },
  }), ({ createEngineerMobileVisitActionApplicationService: createService }) => {
    const result = createService({}).handleEngineerMobileVisitAction(command({
      action: ENGINEER_MOBILE_RECORD_VISIT_RESULT_ACTION,
      actor: actor(ENGINEER_MOBILE_RECORD_VISIT_RESULT_PERMISSION),
      appointment: appointment({ mobileVisitStatus: 'work_finished' }),
      visitResult: 'resolved',
    }));

    assert.equal(result.ok, false);
    assert.equal(result.allowed, false);
    assert.equal(result.reasonCode, 'denied');
    assert.equal('transitionIntent' in result, false);
    assertNoForbiddenLeak(result);
  });
});

test('service does not mutate input command actor appointment or planner result objects', () => {
  const sourceCommand = command();
  const beforeCommand = clone(sourceCommand);
  const plan = validPlannerResult();
  const beforePlan = clone(plan);

  withMockedPlanner(() => plan, ({ createEngineerMobileVisitActionApplicationService: createService }) => {
    const result = createService({
      transitionWriter: { write() { return { ok: true }; } },
      auditWriter: { record() { return { ok: true }; } },
    }).handleEngineerMobileVisitAction(sourceCommand);

    assert.equal(result.ok, true);
    assert.deepEqual(sourceCommand, beforeCommand);
    assert.deepEqual(plan, beforePlan);
    assertNoForbiddenLeak(result);
  });
});
