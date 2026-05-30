'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  ACTION_ALIASES,
  decideEngineerMobileVisitAction,
} = require('../../src/engineerMobile/engineerMobileVisitActionDecisionHelper');

const repoRoot = path.resolve(__dirname, '../..');
const sourceFile = path.join(
  repoRoot,
  'src/engineerMobile/engineerMobileVisitActionDecisionHelper.js',
);

const ACTION_FIXTURES = Object.freeze({
  arrive: {
    action: 'arrive',
    canonicalAction: 'engineer_mobile.arrive',
    permission: 'engineer_mobile.visit.arrive',
    subject: { mobileVisitStatus: 'traveling', status: 'scheduled' },
    transitionStatus: 'arrived',
  },
  finish_work: {
    action: 'finish_work',
    canonicalAction: 'engineer_mobile.finish_work',
    permission: 'engineer_mobile.visit.finish_work',
    subject: { mobileVisitStatus: 'working', status: 'scheduled' },
    transitionStatus: 'work_finished',
  },
  record_visit_result: {
    action: 'record_visit_result',
    canonicalAction: 'engineer_mobile.record_visit_result',
    permission: 'engineer_mobile.visit.record_result',
    subject: { mobileVisitStatus: 'work_finished', status: 'scheduled' },
    transitionStatus: 'visit_result_recorded',
    visitResult: 'resolved',
  },
  start_travel: {
    action: 'start_travel',
    canonicalAction: 'engineer_mobile.start_travel',
    permission: 'engineer_mobile.visit.start_travel',
    subject: { status: 'scheduled' },
    transitionStatus: 'traveling',
  },
  start_work: {
    action: 'start_work',
    canonicalAction: 'engineer_mobile.start_work',
    permission: 'engineer_mobile.visit.start_work',
    subject: { mobileVisitStatus: 'arrived', status: 'scheduled' },
    transitionStatus: 'working',
  },
});

function trustedContext(permission) {
  return {
    engineerId: 'eng_decision_001',
    organizationId: 'org_decision_001',
    permissions: [permission],
  };
}

function assignment(overrides = {}) {
  return {
    assignedEngineerId: 'eng_decision_001',
    organizationId: 'org_decision_001',
    ...overrides,
  };
}

function actionSubject(overrides = {}) {
  return {
    appointmentId: 'apt_decision_001',
    assignedEngineerId: 'eng_decision_001',
    caseId: 'case_decision_001',
    organizationId: 'org_decision_001',
    status: 'scheduled',
    ...overrides,
  };
}

function inputFor(fixture, overrides = {}) {
  return {
    action: fixture.action,
    trustedContext: trustedContext(fixture.permission),
    assignmentContext: assignment(),
    actionSubject: actionSubject(fixture.subject),
    now: '2026-05-31T10:00:00.000Z',
    requestId: 'req_decision_001',
    visitResult: fixture.visitResult,
    ...overrides,
  };
}

function assertSafeOutput(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'raw_case_should_not_leak',
    'raw_appointment_should_not_leak',
    'completion_report_should_not_leak',
    'field_service_report_should_not_leak',
    'final_appointment_should_not_leak',
    'audit_should_not_leak',
    'provider_should_not_leak',
    'ai_should_not_leak',
    'billing_should_not_leak',
    'debug_should_not_leak',
    'token_should_not_leak',
    'password_should_not_leak',
    'secret_should_not_leak',
    'rawCase',
    'rawAppointment',
    'completionReportId',
    'fieldServiceReportId',
    'finalAppointmentId',
    'auditContext',
    'providerPayload',
    'aiRawPayload',
    'billingInternal',
    'debugPayload',
    'token',
    'password',
    'secret',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object') {
    return value;
  }

  Object.freeze(value);

  for (const child of Object.values(value)) {
    deepFreeze(child);
  }

  return value;
}

function requireSpecifiers(source) {
  const specifiers = [];
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
  let match;

  while ((match = requireRegex.exec(source)) !== null) {
    specifiers.push(match[1]);
  }

  return specifiers;
}

test('exports supported action aliases and pure decision helper', () => {
  assert.equal(typeof decideEngineerMobileVisitAction, 'function');
  assert.deepEqual(Object.keys(ACTION_ALIASES).sort(), [
    'arrive',
    'engineer_mobile.arrive',
    'engineer_mobile.finish_work',
    'engineer_mobile.record_visit_result',
    'engineer_mobile.start_travel',
    'engineer_mobile.start_work',
    'finish_work',
    'record_visit_result',
    'start_travel',
    'start_work',
  ]);
});

test('allows each supported action with explicit safe transition intent', () => {
  for (const fixture of Object.values(ACTION_FIXTURES)) {
    const decision = decideEngineerMobileVisitAction(inputFor(fixture));

    assert.equal(decision.allowed, true, `${fixture.action} should allow`);
    assert.equal(decision.status, 'allowed');
    assert.equal(decision.reasonCode, 'allowed');
    assert.equal(decision.action, fixture.canonicalAction);
    assert.deepEqual(decision.assignmentReference, {
      engineerId: 'eng_decision_001',
      organizationId: 'org_decision_001',
    });
    assert.deepEqual(decision.appointmentReference, {
      appointmentId: 'apt_decision_001',
      caseId: 'case_decision_001',
      organizationId: 'org_decision_001',
    });
    assert.deepEqual(decision.transitionIntent, {
      action: fixture.canonicalAction,
      actorId: 'eng_decision_001',
      appointmentId: 'apt_decision_001',
      caseId: 'case_decision_001',
      organizationId: 'org_decision_001',
      mobileVisitStatus: fixture.transitionStatus,
      ...(fixture.visitResult ? { visitResult: fixture.visitResult } : {}),
      requestId: 'req_decision_001',
      plannedAt: '2026-05-31T10:00:00.000Z',
    });
    assertSafeOutput(decision);
  }
});

test('allows canonical action names as well as short aliases', () => {
  const fixture = ACTION_FIXTURES.start_travel;
  const decision = decideEngineerMobileVisitAction(inputFor(fixture, {
    action: fixture.canonicalAction,
  }));

  assert.equal(decision.allowed, true);
  assert.equal(decision.action, fixture.canonicalAction);
  assert.equal(decision.transitionIntent.mobileVisitStatus, 'traveling');
});

test('returns generic ineligible decisions for missing malformed unsupported or cross-scope input', () => {
  assert.deepEqual(decideEngineerMobileVisitAction(), {
    allowed: false,
    status: 'ineligible',
    reasonCode: 'unsupported_action',
  });

  assert.deepEqual(decideEngineerMobileVisitAction({
    action: 'delete_visit',
  }), {
    allowed: false,
    status: 'ineligible',
    reasonCode: 'unsupported_action',
  });

  assert.deepEqual(decideEngineerMobileVisitAction({
    ...inputFor(ACTION_FIXTURES.start_travel),
    trustedContext: undefined,
  }), {
    allowed: false,
    status: 'ineligible',
    reasonCode: 'invalid_context',
    action: 'engineer_mobile.start_travel',
  });

  assert.deepEqual(decideEngineerMobileVisitAction({
    ...inputFor(ACTION_FIXTURES.start_travel),
    assignmentContext: assignment({ organizationId: 'org_other' }),
  }), {
    allowed: false,
    status: 'ineligible',
    reasonCode: 'cross_scope',
    action: 'engineer_mobile.start_travel',
  });

  assert.deepEqual(decideEngineerMobileVisitAction({
    ...inputFor(ACTION_FIXTURES.start_travel),
    assignmentContext: assignment({ assignedEngineerId: 'eng_other' }),
  }), {
    allowed: false,
    status: 'ineligible',
    reasonCode: 'not_assigned',
    action: 'engineer_mobile.start_travel',
  });
});

test('does not trust raw request containers or client-controlled identity fields', () => {
  const withOnlyClientFields = decideEngineerMobileVisitAction({
    action: 'start_travel',
    body: {
      actor: {
        engineerId: 'eng_decision_001',
        organizationId: 'org_decision_001',
        permissions: ['engineer_mobile.visit.start_travel'],
      },
      appointment: actionSubject(),
    },
  });
  const withClientOverride = decideEngineerMobileVisitAction({
    ...inputFor(ACTION_FIXTURES.start_travel),
    body: {
      engineerId: 'eng_attacker',
      organizationId: 'org_attacker',
      appointmentId: 'apt_attacker',
    },
  });

  assert.deepEqual(withOnlyClientFields, {
    allowed: false,
    status: 'ineligible',
    reasonCode: 'invalid_context',
    action: 'engineer_mobile.start_travel',
  });
  assert.deepEqual(withClientOverride, {
    allowed: false,
    status: 'ineligible',
    reasonCode: 'invalid_context',
    action: 'engineer_mobile.start_travel',
  });
  assertSafeOutput(withOnlyClientFields);
  assertSafeOutput(withClientOverride);
});

test('keeps permission and action eligibility separate from display fields', () => {
  const decision = decideEngineerMobileVisitAction({
    ...inputFor(ACTION_FIXTURES.start_travel),
    trustedContext: trustedContext('engineer_mobile.tasks.read'),
    actionSubject: actionSubject({
      customerDisplay: 'allowed-looking customer display field',
      eligibility: { startTravel: true },
      actions: ['start_travel'],
    }),
  });

  assert.deepEqual(decision, {
    allowed: false,
    status: 'ineligible',
    reasonCode: 'unauthorized',
    action: 'engineer_mobile.start_travel',
  });
});

test('denies invalid state and invalid visit result without leaking policy internals', () => {
  const invalidState = decideEngineerMobileVisitAction(inputFor(ACTION_FIXTURES.arrive, {
    actionSubject: actionSubject({ status: 'scheduled' }),
  }));
  const invalidVisitResult = decideEngineerMobileVisitAction(inputFor(ACTION_FIXTURES.record_visit_result, {
    visitResult: 'raw_customer_text',
  }));

  assert.deepEqual(invalidState, {
    allowed: false,
    status: 'ineligible',
    reasonCode: 'invalid_state',
    action: 'engineer_mobile.arrive',
  });
  assert.deepEqual(invalidVisitResult, {
    allowed: false,
    status: 'ineligible',
    reasonCode: 'invalid_visit_result',
    action: 'engineer_mobile.record_visit_result',
  });
});

test('does not accept or emit report creation approval publication or final appointment fields', () => {
  for (const unsafeSubject of [
    { completionReportId: 'completion_report_should_not_leak' },
    { fieldServiceReportId: 'field_service_report_should_not_leak' },
    { finalAppointmentId: 'final_appointment_should_not_leak' },
    { publishReport: 'completion_report_should_not_leak' },
  ]) {
    const decision = decideEngineerMobileVisitAction({
      ...inputFor(ACTION_FIXTURES.finish_work),
      actionSubject: actionSubject({
        mobileVisitStatus: 'working',
        ...unsafeSubject,
      }),
    });

    assert.deepEqual(decision, {
      allowed: false,
      status: 'ineligible',
      reasonCode: 'report_boundary',
      action: 'engineer_mobile.finish_work',
    });
    assertSafeOutput(decision);
  }
});

test('does not expose raw internal provider audit AI billing debug or secret fields', () => {
  const decision = decideEngineerMobileVisitAction({
    ...inputFor(ACTION_FIXTURES.start_travel),
    actionSubject: actionSubject({
      auditContext: 'audit_should_not_leak',
      providerPayload: 'provider_should_not_leak',
      aiRawPayload: 'ai_should_not_leak',
      billingInternal: 'billing_should_not_leak',
      debugPayload: 'debug_should_not_leak',
      token: 'token_should_not_leak',
      password: 'password_should_not_leak',
      secret: 'secret_should_not_leak',
    }),
  });

  assert.deepEqual(decision, {
    allowed: false,
    status: 'ineligible',
    reasonCode: 'report_boundary',
    action: 'engineer_mobile.start_travel',
  });
  assertSafeOutput(decision);
});

test('does not mutate input and returns a new decision object', () => {
  const input = inputFor(ACTION_FIXTURES.start_work);
  const snapshot = JSON.stringify(input);

  deepFreeze(input);

  const decision = decideEngineerMobileVisitAction(input);

  assert.equal(decision.allowed, true);
  assert.notEqual(decision, input);
  assert.equal(JSON.stringify(input), snapshot);
});

test('helper imports only the existing visit action policy registry and no runtime sinks', () => {
  const source = fs.readFileSync(sourceFile, 'utf8');

  assert.deepEqual(requireSpecifiers(source), ['./engineerMobileVisitActionPolicyRegistry']);

  for (const pattern of [
    /require\(['"].*(?:db|pool|database|transaction|repository|queryExecutor)['"]\)/i,
    /require\(['"].*(?:line|sms|email|push|webhook)['"]\)/i,
    /require\(['"].*(?:openai|rag|vector|embedding|prompt)['"]\)/i,
    /require\(['"].*(?:billing|settlement|payment|invoice)['"]\)/i,
    /require\(['"].*(?:routes?|controllers?|app|server|listen|smoke)['"]\)/i,
    /process\.env|DATABASE_URL|ZEABUR/i,
    /\.query\s*\(|\bnew\s+Pool\b|\.listen\s*\(|fetch\s*\(|axios|XMLHttpRequest/i,
    /createFieldServiceReport|approveFieldServiceReport|publishFieldServiceReport/i,
    /createCompletionReport|approveCompletionReport|publishCompletionReport/i,
  ]) {
    assert.doesNotMatch(source, pattern, `source matched forbidden ${pattern}`);
  }
});
