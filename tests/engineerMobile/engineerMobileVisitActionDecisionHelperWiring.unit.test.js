'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  planEngineerMobileVisitActionCommand,
} = require('../../src/engineerMobile/engineerMobileVisitActionCommandPlanner');

const PLANNER_SOURCE = path.join(
  __dirname,
  '../../src/engineerMobile/engineerMobileVisitActionCommandPlanner.js',
);

const NOW = '2026-06-01T08:30:00.000Z';

const ACTION_FIXTURES = Object.freeze({
  arrive: {
    action: 'arrive',
    canonicalAction: 'engineer_mobile.arrive',
    permission: 'engineer_mobile.visit.arrive',
    appointment: { mobileVisitStatus: 'traveling' },
    mobileVisitStatus: 'arrived',
  },
  finish_work: {
    action: 'finish_work',
    canonicalAction: 'engineer_mobile.finish_work',
    permission: 'engineer_mobile.visit.finish_work',
    appointment: { mobileVisitStatus: 'working' },
    mobileVisitStatus: 'work_finished',
  },
  record_visit_result: {
    action: 'record_visit_result',
    canonicalAction: 'engineer_mobile.record_visit_result',
    permission: 'engineer_mobile.visit.record_result',
    appointment: { mobileVisitStatus: 'work_finished' },
    mobileVisitStatus: 'visit_result_recorded',
    visitResult: 'resolved',
  },
  start_travel: {
    action: 'start_travel',
    canonicalAction: 'engineer_mobile.start_travel',
    permission: 'engineer_mobile.visit.start_travel',
    appointment: { status: 'scheduled' },
    mobileVisitStatus: 'traveling',
  },
  start_work: {
    action: 'start_work',
    canonicalAction: 'engineer_mobile.start_work',
    permission: 'engineer_mobile.visit.start_work',
    appointment: { mobileVisitStatus: 'arrived' },
    mobileVisitStatus: 'working',
  },
});

function actor(overrides = {}) {
  return {
    id: 'eng_task_2286',
    organizationId: 'org_task_2286',
    permissions: ['engineer_mobile.visit.start_travel'],
    body: {
      engineerId: 'body_engineer_should_not_authorize',
    },
    token: 'token_should_not_leak',
    password: 'password_should_not_leak',
    secret: 'secret_should_not_leak',
    ...overrides,
  };
}

function appointment(overrides = {}) {
  return {
    appointmentId: 'apt_task_2286',
    assignedEngineerId: 'eng_task_2286',
    caseId: 'case_task_2286',
    organizationId: 'org_task_2286',
    status: 'scheduled',
    customerPhone: 'raw_phone_should_not_leak',
    fullAddress: 'full_address_should_not_leak',
    signature: 'signature_should_not_leak',
    photo: 'photo_should_not_leak',
    rawCase: 'raw_case_should_not_leak',
    rawAppointment: 'raw_appointment_should_not_leak',
    rawDbRow: 'raw_db_row_should_not_leak',
    auditContext: 'audit_should_not_leak',
    providerPayload: 'provider_should_not_leak',
    aiRawPayload: 'ai_should_not_leak',
    ragTrace: 'rag_should_not_leak',
    billingInternal: 'billing_should_not_leak',
    debugPayload: 'debug_should_not_leak',
    token: 'token_should_not_leak',
    password: 'password_should_not_leak',
    secret: 'secret_should_not_leak',
    ...overrides,
  };
}

function commandFor(fixture, overrides = {}) {
  return {
    action: fixture.action,
    actor: actor({
      permissions: [fixture.permission],
    }),
    appointment: appointment(fixture.appointment),
    now: NOW,
    requestId: 'req_task_2286',
    visitResult: fixture.visitResult,
    ...overrides,
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertNoForbiddenLeak(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'raw_phone_should_not_leak',
    'full_address_should_not_leak',
    'signature_should_not_leak',
    'photo_should_not_leak',
    'raw_case_should_not_leak',
    'raw_appointment_should_not_leak',
    'raw_db_row_should_not_leak',
    'audit_should_not_leak',
    'provider_should_not_leak',
    'ai_should_not_leak',
    'rag_should_not_leak',
    'billing_should_not_leak',
    'debug_should_not_leak',
    'token_should_not_leak',
    'password_should_not_leak',
    'secret_should_not_leak',
    'completion_report_should_not_leak',
    'field_service_report_should_not_leak',
    'final_appointment_should_not_leak',
    'publish_report_should_not_leak',
    'body_engineer_should_not_authorize',
    'attacker_engineer',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

function assertAllowedPlan(result, fixture) {
  assert.equal(result.ok, true);
  assert.equal(result.allowed, true);
  assert.equal(result.action, fixture.canonicalAction);
  assert.equal(result.reasonCode, 'allowed');
  assert.equal(result.actorId, 'eng_task_2286');
  assert.equal(result.appointmentId, 'apt_task_2286');
  assert.equal(result.caseId, 'case_task_2286');
  assert.equal(result.organizationId, 'org_task_2286');
  assert.equal(result.requestId, 'req_task_2286');
  assert.deepEqual(result.transitionIntent, {
    kind: 'engineer_mobile.visit_action_transition_intent',
    action: fixture.canonicalAction,
    actorId: 'eng_task_2286',
    appointmentId: 'apt_task_2286',
    caseId: 'case_task_2286',
    organizationId: 'org_task_2286',
    mobileVisitStatus: fixture.mobileVisitStatus,
    ...(fixture.visitResult ? { visitResult: fixture.visitResult } : {}),
    requestId: 'req_task_2286',
    plannedAt: NOW,
  });
  assertNoForbiddenLeak(result);
}

test('visit action command planner wires allowed supported actions through decision helper transition intent', () => {
  for (const fixture of Object.values(ACTION_FIXTURES)) {
    const result = planEngineerMobileVisitActionCommand(commandFor(fixture));

    assertAllowedPlan(result, fixture);
  }
});

test('canonical action names remain accepted and normalized through helper output', () => {
  const fixture = ACTION_FIXTURES.start_travel;
  const result = planEngineerMobileVisitActionCommand(commandFor(fixture, {
    action: fixture.canonicalAction,
  }));

  assertAllowedPlan(result, fixture);
});

test('unsupported malformed cross-scope not-assigned unauthorized and invalid-state inputs fail closed', () => {
  const unsupported = planEngineerMobileVisitActionCommand(commandFor(ACTION_FIXTURES.start_travel, {
    action: 'delete_visit',
  }));
  const malformed = planEngineerMobileVisitActionCommand({
    action: 'start_travel',
  });
  const crossScope = planEngineerMobileVisitActionCommand(commandFor(ACTION_FIXTURES.start_travel, {
    appointment: appointment({ organizationId: 'org_other' }),
  }));
  const notAssigned = planEngineerMobileVisitActionCommand(commandFor(ACTION_FIXTURES.start_travel, {
    appointment: appointment({ assignedEngineerId: 'eng_other' }),
  }));
  const unauthorized = planEngineerMobileVisitActionCommand(commandFor(ACTION_FIXTURES.start_travel, {
    actor: actor({ permissions: ['engineer_mobile.tasks.read'] }),
  }));
  const invalidState = planEngineerMobileVisitActionCommand(commandFor(ACTION_FIXTURES.arrive, {
    appointment: appointment({ status: 'scheduled' }),
  }));

  assert.equal(unsupported.allowed, false);
  assert.equal(unsupported.reasonCode, 'unsupported_action');
  assert.equal(malformed.allowed, false);
  assert.equal(malformed.reasonCode, 'invalid_context');
  assert.equal(crossScope.allowed, false);
  assert.equal(crossScope.reasonCode, 'cross_scope');
  assert.equal(notAssigned.allowed, false);
  assert.equal(notAssigned.reasonCode, 'not_assigned');
  assert.equal(unauthorized.allowed, false);
  assert.equal(unauthorized.reasonCode, 'unauthorized');
  assert.equal(invalidState.allowed, false);
  assert.equal(invalidState.reasonCode, 'invalid_state');

  for (const result of [unsupported, malformed, crossScope, notAssigned, unauthorized, invalidState]) {
    assert.equal('transitionIntent' in result, false);
    assertNoForbiddenLeak(result);
  }
});

test('raw body query header cookie session provider debug env fields cannot authorize action', () => {
  for (const container of ['body', 'query', 'headers', 'cookie', 'session', 'provider', 'debug', 'env']) {
    const result = planEngineerMobileVisitActionCommand(commandFor(ACTION_FIXTURES.start_travel, {
      [container]: {
        engineerId: 'attacker_engineer',
        organizationId: 'org_task_2286',
        permissions: ['engineer_mobile.visit.start_travel'],
      },
    }));

    assert.equal(result.allowed, false);
    assert.equal(result.reasonCode, 'invalid_context');
    assert.equal('transitionIntent' in result, false);
    assertNoForbiddenLeak(result);
  }
});

test('raw client-provided engineerId cannot authorize action without trusted actor context', () => {
  const result = planEngineerMobileVisitActionCommand({
    action: 'start_travel',
    appointment: appointment(),
    body: {
      engineerId: 'eng_task_2286',
      permissions: ['engineer_mobile.visit.start_travel'],
    },
    now: NOW,
  });

  assert.equal(result.allowed, false);
  assert.equal(result.reasonCode, 'invalid_context');
  assert.equal('transitionIntent' in result, false);
  assertNoForbiddenLeak(result);
});

test('report boundary markers fail closed and do not create approve publish formalize or leak reports', () => {
  for (const unsafeAppointment of [
    { completionReportId: 'completion_report_should_not_leak' },
    { fieldServiceReportId: 'field_service_report_should_not_leak' },
    { finalAppointmentId: 'final_appointment_should_not_leak' },
    { publishReport: 'publish_report_should_not_leak' },
  ]) {
    const result = planEngineerMobileVisitActionCommand(commandFor(ACTION_FIXTURES.finish_work, {
      appointment: appointment({
        mobileVisitStatus: 'working',
        ...unsafeAppointment,
      }),
    }));

    assert.equal(result.allowed, false);
    assert.equal(result.reasonCode, 'report_boundary');
    assert.equal('transitionIntent' in result, false);
    assertNoForbiddenLeak(result);
  }
});

test('planner does not mutate existing input actor appointment or command objects', () => {
  const command = commandFor(ACTION_FIXTURES.record_visit_result);
  const before = clone(command);

  const result = planEngineerMobileVisitActionCommand(command);

  assert.equal(result.allowed, true);
  assert.deepEqual(command, before);
});

test('planner source imports decision helper without adding route DB provider AI billing or report workflow behavior', () => {
  const source = fs.readFileSync(PLANNER_SOURCE, 'utf8');

  assert.equal(source.includes("require('./engineerMobileVisitActionDecisionHelper')"), true);
  assert.equal(source.includes('decideEngineerMobileVisitAction({'), true);
  assert.equal(source.includes('trustedContextFromActor(source.actor)'), true);
  assert.equal(source.includes('assignmentContextFromAppointment(source.appointment)'), true);
  assert.equal(source.includes('actionSubjectFromAppointment(source.appointment)'), true);

  for (const forbidden of [
    'require(\'pg\')',
    'require("pg")',
    'dbClient',
    '.query(',
    'psql',
    'db:migrate',
    'createServer',
    'listen(',
    'registerRoute',
    'router.',
    'app.',
    'sendLine',
    'sendSms',
    'sendEmail',
    'webhook',
    'openai',
    'vectorDb',
    'billingService',
    'settlementService',
    'createFieldServiceReport(',
    'approveFieldServiceReport(',
    'publishFieldServiceReport(',
    'INSERT ',
    'UPDATE ',
    'DELETE ',
  ]) {
    assert.equal(source.includes(forbidden), false, `source contains ${forbidden}`);
  }
});
