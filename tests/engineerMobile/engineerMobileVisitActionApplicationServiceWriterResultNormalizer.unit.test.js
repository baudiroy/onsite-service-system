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

const NOW = '2026-05-31T12:00:00.000Z';
const REQUEST_ID = 'req_task_2297';

const FORBIDDEN_MARKERS = Object.freeze([
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
  'raw_provider_result_should_not_leak',
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
  'raw_writer_result_should_not_leak',
  'raw_transition_writer_should_not_leak',
  'raw_audit_writer_should_not_leak',
  'raw_case_object_should_not_leak',
  'raw_appointment_object_should_not_leak',
  'raw_completion_report_object_should_not_leak',
  'raw_field_service_report_object_should_not_leak',
  'raw_final_appointment_should_not_leak',
  'raw_publish_report_should_not_leak',
  'raw_approve_report_should_not_leak',
  'raw_formalize_report_should_not_leak',
  'raw_create_report_should_not_leak',
]);

function actor(permission, overrides = {}) {
  return {
    id: 'eng_task_2297',
    organizationId: 'org_task_2297',
    permissions: [permission],
    rawActor: 'raw_actor_should_not_leak',
    assignment: { marker: 'raw_assignment_should_not_leak' },
    ...overrides,
  };
}

function appointment(overrides = {}) {
  return {
    appointmentId: 'apt_task_2297',
    caseId: 'case_task_2297',
    organizationId: 'org_task_2297',
    assignedEngineerId: 'eng_task_2297',
    status: 'scheduled',
    rawCase: { marker: 'raw_case_should_not_leak' },
    rawAppointment: { marker: 'raw_appointment_should_not_leak' },
    completionReport: { marker: 'raw_completion_report_should_not_leak' },
    fieldServiceReport: { marker: 'raw_field_service_report_should_not_leak' },
    dbRow: { marker: 'raw_db_row_should_not_leak' },
    repositoryRow: { marker: 'raw_repository_row_should_not_leak' },
    auditInternals: { marker: 'raw_audit_should_not_leak' },
    providerPayload: { marker: 'raw_provider_payload_should_not_leak' },
    providerResult: { marker: 'raw_provider_result_should_not_leak' },
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
    token: 'raw_token_should_not_leak',
    password: 'raw_password_should_not_leak',
    secret: 'raw_secret_should_not_leak',
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
    ...overrides,
  };
}

function validPlannerResult(overrides = {}) {
  return {
    ok: true,
    allowed: true,
    action: ENGINEER_MOBILE_START_TRAVEL_ACTION,
    reasonCode: 'allowed',
    actorId: 'eng_task_2297',
    appointmentId: 'apt_task_2297',
    caseId: 'case_task_2297',
    organizationId: 'org_task_2297',
    requestId: REQUEST_ID,
    transitionIntent: {
      kind: 'engineer_mobile.visit_action_transition_intent',
      action: ENGINEER_MOBILE_START_TRAVEL_ACTION,
      actorId: 'eng_task_2297',
      appointmentId: 'apt_task_2297',
      caseId: 'case_task_2297',
      organizationId: 'org_task_2297',
      mobileVisitStatus: 'traveling',
      requestId: REQUEST_ID,
      plannedAt: NOW,
      rawCaseObject: 'raw_case_object_should_not_leak',
      rawAppointmentObject: 'raw_appointment_object_should_not_leak',
      completionReportId: 'raw_completion_report_object_should_not_leak',
      fieldServiceReportId: 'raw_field_service_report_object_should_not_leak',
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
      actorId: 'eng_task_2297',
      appointmentId: 'apt_task_2297',
      caseId: 'case_task_2297',
      organizationId: 'org_task_2297',
      requestId: REQUEST_ID,
      occurredAt: NOW,
      rawAudit: 'raw_audit_should_not_leak',
      token: 'raw_token_should_not_leak',
    },
    ...overrides,
  };
}

function unsafeWriterResult(marker) {
  return {
    ok: true,
    marker,
    rawWriterResult: 'raw_writer_result_should_not_leak',
    providerPayload: 'raw_provider_payload_should_not_leak',
    providerResult: 'raw_provider_result_should_not_leak',
    dbRow: 'raw_db_row_should_not_leak',
    repositoryRow: 'raw_repository_row_should_not_leak',
    auditInternals: 'raw_audit_should_not_leak',
    ai: 'raw_ai_should_not_leak',
    rag: 'raw_rag_should_not_leak',
    openai: 'raw_openai_should_not_leak',
    vector: 'raw_vector_should_not_leak',
    billing: 'raw_billing_should_not_leak',
    settlement: 'raw_settlement_should_not_leak',
    payment: 'raw_payment_should_not_leak',
    invoice: 'raw_invoice_should_not_leak',
    debug: 'raw_debug_should_not_leak',
    internal: 'raw_internal_should_not_leak',
    sql: 'raw_sql_should_not_leak',
    token: 'raw_token_should_not_leak',
    password: 'raw_password_should_not_leak',
    secret: 'raw_secret_should_not_leak',
    fullAddress: 'raw_full_address_should_not_leak',
    customerPhone: 'raw_phone_should_not_leak',
    signature: 'raw_signature_should_not_leak',
    photo: 'raw_photo_should_not_leak',
    privateNote: 'raw_private_should_not_leak',
    completionReportId: 'raw_completion_report_object_should_not_leak',
    fieldServiceReportId: 'raw_field_service_report_object_should_not_leak',
    finalAppointmentId: 'raw_final_appointment_should_not_leak',
    publishReport: 'raw_publish_report_should_not_leak',
    approveReport: 'raw_approve_report_should_not_leak',
    formalizeReport: 'raw_formalize_report_should_not_leak',
    createReport: 'raw_create_report_should_not_leak',
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

test('existing allowed action success path remains compatible with normalized writer handling', () => {
  const calls = [];
  const service = createEngineerMobileVisitActionApplicationService({
    transitionWriter: {
      write(intent) {
        calls.push({ name: 'transition', payload: intent });
        return unsafeWriterResult('raw_transition_writer_should_not_leak');
      },
    },
    auditWriter: {
      record(intent) {
        calls.push({ name: 'audit', payload: intent });
        return unsafeWriterResult('raw_audit_writer_should_not_leak');
      },
    },
  });

  const result = service.handleEngineerMobileVisitAction(command());

  assert.equal(result.ok, true);
  assert.equal(result.allowed, true);
  assert.equal(result.serviceKind, ENGINEER_MOBILE_VISIT_ACTION_APPLICATION_SERVICE_KIND);
  assert.equal(result.reasonCode, 'applied');
  assert.equal(result.transitionApplied, true);
  assert.equal(result.auditRecorded, true);
  assert.deepEqual(calls.map((call) => call.name), ['transition', 'audit']);
  assertNoForbiddenLeak([result, calls]);
});

test('normalized transition writer result does not leak raw data or report-boundary fields', () => {
  const service = createEngineerMobileVisitActionApplicationService({
    transitionWriter: {
      write() {
        return unsafeWriterResult('raw_transition_writer_should_not_leak');
      },
    },
    auditWriter: { record() { return { recorded: true }; } },
  });

  const result = service.handleEngineerMobileVisitAction(command());

  assert.equal(result.ok, true);
  assert.equal(result.reasonCode, 'applied');
  assertNoForbiddenLeak(result);
});

test('normalized audit writer result does not leak raw data or report-boundary fields', () => {
  const service = createEngineerMobileVisitActionApplicationService({
    transitionWriter: { write() { return { written: true }; } },
    auditWriter: {
      record() {
        return unsafeWriterResult('raw_audit_writer_should_not_leak');
      },
    },
  });

  const result = service.handleEngineerMobileVisitAction(command());

  assert.equal(result.ok, true);
  assert.equal(result.reasonCode, 'applied');
  assertNoForbiddenLeak(result);
});

test('thrown and rejected transition writer failures are safe', async () => {
  const thrownService = createEngineerMobileVisitActionApplicationService({
    transitionWriter: {
      write() {
        throw new Error('raw_transition_writer_should_not_leak');
      },
    },
    auditWriter: { record() { assert.fail('audit writer should not run'); } },
  });
  const thrownResult = thrownService.handleEngineerMobileVisitAction(command());

  assert.equal(thrownResult.ok, false);
  assert.equal(thrownResult.reasonCode, 'transition_write_failed');
  assert.equal(thrownResult.transitionApplied, false);
  assert.equal(thrownResult.auditRecorded, false);
  assertNoForbiddenLeak(thrownResult);

  const rejectedService = createEngineerMobileVisitActionApplicationService({
    transitionWriter: {
      write() {
        return Promise.reject(new Error('raw_transition_writer_should_not_leak'));
      },
    },
    auditWriter: { record() { assert.fail('audit writer should not run'); } },
  });
  const rejectedResult = rejectedService.handleEngineerMobileVisitAction(command());

  assert.equal(rejectedResult.ok, false);
  assert.equal(rejectedResult.reasonCode, 'transition_write_failed');
  assert.equal(rejectedResult.transitionApplied, false);
  assert.equal(rejectedResult.auditRecorded, false);
  assertNoForbiddenLeak(rejectedResult);
  await new Promise((resolve) => setImmediate(resolve));
});

test('thrown and rejected audit writer failures are safe', async () => {
  const thrownService = createEngineerMobileVisitActionApplicationService({
    transitionWriter: { write() { return { written: true }; } },
    auditWriter: {
      record() {
        throw new Error('raw_audit_writer_should_not_leak');
      },
    },
  });
  const thrownResult = thrownService.handleEngineerMobileVisitAction(command());

  assert.equal(thrownResult.ok, false);
  assert.equal(thrownResult.reasonCode, 'audit_write_failed');
  assert.equal(thrownResult.transitionApplied, true);
  assert.equal(thrownResult.auditRecorded, false);
  assertNoForbiddenLeak(thrownResult);

  const rejectedService = createEngineerMobileVisitActionApplicationService({
    transitionWriter: { write() { return { written: true }; } },
    auditWriter: {
      record() {
        return Promise.reject(new Error('raw_audit_writer_should_not_leak'));
      },
    },
  });
  const rejectedResult = rejectedService.handleEngineerMobileVisitAction(command());

  assert.equal(rejectedResult.ok, false);
  assert.equal(rejectedResult.reasonCode, 'audit_write_failed');
  assert.equal(rejectedResult.transitionApplied, true);
  assert.equal(rejectedResult.auditRecorded, false);
  assertNoForbiddenLeak(rejectedResult);
  await new Promise((resolve) => setImmediate(resolve));
});

test('malformed writer result is safe', () => {
  const transitionService = createEngineerMobileVisitActionApplicationService({
    transitionWriter: {
      write() {
        return { message: 'raw_writer_result_should_not_leak' };
      },
    },
    auditWriter: { record() { assert.fail('audit writer should not run'); } },
  });
  const transitionResult = transitionService.handleEngineerMobileVisitAction(command());

  assert.equal(transitionResult.ok, false);
  assert.equal(transitionResult.reasonCode, 'transition_write_failed');
  assert.equal(transitionResult.transitionApplied, false);
  assertNoForbiddenLeak(transitionResult);

  const auditService = createEngineerMobileVisitActionApplicationService({
    transitionWriter: { write() { return { persisted: true }; } },
    auditWriter: {
      record() {
        return { message: 'raw_writer_result_should_not_leak' };
      },
    },
  });
  const auditResult = auditService.handleEngineerMobileVisitAction(command());

  assert.equal(auditResult.ok, false);
  assert.equal(auditResult.reasonCode, 'audit_write_failed');
  assert.equal(auditResult.transitionApplied, true);
  assertNoForbiddenLeak(auditResult);
});

test('denied ineligible and malformed planner outputs do not call writers', () => {
  for (const plan of [
    {
      ok: false,
      allowed: false,
      action: ENGINEER_MOBILE_RECORD_VISIT_RESULT_ACTION,
      reasonCode: 'denied',
      actorId: 'eng_task_2297',
      appointmentId: 'apt_task_2297',
      organizationId: 'org_task_2297',
      rawWriterResult: 'raw_writer_result_should_not_leak',
    },
    {
      ok: false,
      allowed: false,
      action: ENGINEER_MOBILE_RECORD_VISIT_RESULT_ACTION,
      reasonCode: 'ineligible',
      actorId: 'eng_task_2297',
      appointmentId: 'apt_task_2297',
      organizationId: 'org_task_2297',
    },
    validPlannerResult({
      action: 'engineer_mobile.unsafe',
      transitionIntent: { rawWriterResult: 'raw_writer_result_should_not_leak' },
    }),
  ]) {
    const calls = [];

    withMockedPlanner(() => plan, ({ createEngineerMobileVisitActionApplicationService: createService }) => {
      const result = createService({
        transitionWriter: { write(intent) { calls.push({ name: 'transition', payload: intent }); } },
        auditWriter: { record(intent) { calls.push({ name: 'audit', payload: intent }); } },
      }).handleEngineerMobileVisitAction(command({
        action: ENGINEER_MOBILE_RECORD_VISIT_RESULT_ACTION,
        actor: actor(ENGINEER_MOBILE_RECORD_VISIT_RESULT_PERMISSION),
        appointment: appointment({ mobileVisitStatus: 'work_finished' }),
        visitResult: 'resolved',
      }));

      assert.equal(result.ok, false);
      assert.equal(result.allowed, false);
      assert.equal(result.transitionApplied, false);
      assert.equal(result.auditRecorded, false);
      assert.deepEqual(calls, []);
      assertNoForbiddenLeak(result);
    });
  }
});

test('raw Case Appointment Completion Report Field Service Report objects are not exposed and inputs are not mutated', () => {
  const sourceCommand = command();
  const beforeCommand = clone(sourceCommand);
  const transitionResult = unsafeWriterResult('raw_transition_writer_should_not_leak');
  const auditResult = unsafeWriterResult('raw_audit_writer_should_not_leak');
  const beforeTransitionResult = clone(transitionResult);
  const beforeAuditResult = clone(auditResult);

  const service = createEngineerMobileVisitActionApplicationService({
    transitionWriter: { write() { return transitionResult; } },
    auditWriter: { record() { return auditResult; } },
  });
  const result = service.handleEngineerMobileVisitAction(sourceCommand);

  assert.equal(result.ok, true);
  assert.equal(result.reasonCode, 'applied');
  assert.deepEqual(sourceCommand, beforeCommand);
  assert.deepEqual(transitionResult, beforeTransitionResult);
  assert.deepEqual(auditResult, beforeAuditResult);
  assertNoForbiddenLeak(result);
});
