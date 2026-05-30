'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const FILES = Object.freeze({
  commandPlanner: 'src/engineerMobile/engineerMobileVisitActionCommandPlanner.js',
  decisionHelper: 'src/engineerMobile/engineerMobileVisitActionDecisionHelper.js',
  task2286WiringTest: 'tests/engineerMobile/engineerMobileVisitActionDecisionHelperWiring.unit.test.js',
  task2286Doc: 'docs/task-2286-engineer-mobile-visit-action-decision-helper-runtime-wiring-no-db-no-smoke-no-provider.md',
});

const SAFE_COMMAND_FIELDS = Object.freeze([
  'ok',
  'allowed',
  'plannerKind',
  'action',
  'reasonCode',
  'actorId',
  'appointmentId',
  'caseId',
  'organizationId',
  'requestId',
  'transitionIntent',
  'auditIntent',
]);

const UNSAFE_MARKERS = Object.freeze([
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
]);

const REPORT_BOUNDARY_MARKERS = Object.freeze([
  'completionreportid',
  'fieldservicereportid',
  'finalappointmentid',
  'publishreport',
  'createcompletionreport',
  'createfieldservicereport',
  'approvecompletionreport',
  'approvefieldservicereport',
  'formalizereport',
]);

const FORBIDDEN_RUNTIME_PATTERNS = Object.freeze([
  /require\(['"]pg['"]\)/,
  /\bdbClient\b/,
  /\.query\s*\(/,
  /\bpsql\b/i,
  /db:migrate/i,
  /\bcreateServer\b/,
  /\blisten\s*\(/,
  /\bregisterRoute\b/,
  /\brouter\./,
  /\bapp\./,
  /sendLine|sendSms|sendEmail|webhook/i,
  /openai|rag|vectorDb/i,
  /billingService|settlementService|paymentService|invoiceService/i,
  /process\.env|DATABASE_URL|ZEABUR/i,
  /INSERT\s+|UPDATE\s+|DELETE\s+/,
]);

function absolutePath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(absolutePath(relativePath), 'utf8');
}

function functionBody(source, name) {
  const signatureIndex = source.indexOf(`function ${name}(`);

  assert.notEqual(signatureIndex, -1, `missing function ${name}`);

  const closingParenIndex = source.indexOf(')', signatureIndex);
  const openingBraceIndex = source.indexOf('{', closingParenIndex);
  let depth = 0;

  for (let index = openingBraceIndex; index < source.length; index += 1) {
    const char = source[index];

    if (char === '{') {
      depth += 1;
    }

    if (char === '}') {
      depth -= 1;

      if (depth === 0) {
        return source.slice(openingBraceIndex + 1, index);
      }
    }
  }

  assert.fail(`unterminated function ${name}`);
}

function assertIncludesAll(source, values, label) {
  for (const value of values) {
    assert.equal(source.includes(value), true, `${label} missing ${value}`);
  }
}

function assertNoPattern(source, patterns, label) {
  for (const pattern of patterns) {
    assert.doesNotMatch(source, pattern, `${label} contains ${pattern}`);
  }
}

test('Task2287 static guard input files exist and this guard is text-only', () => {
  for (const file of Object.values(FILES)) {
    assert.equal(fs.existsSync(absolutePath(file)), true, `${file} should exist`);
  }

  const thisSource = fs.readFileSync(__filename, 'utf8');

  assert.doesNotMatch(thisSource, /require\(['"]\.\.\/\.\.\/src\//);
  assert.doesNotMatch(thisSource, /require\(['"]node:child_process['"]\)/);
  assert.doesNotMatch(thisSource, /require\(['"]pg['"]\)/);
});

test('command planner keeps authorized Task2286 decision helper wiring', () => {
  const source = read(FILES.commandPlanner);
  const plannerBody = functionBody(source, 'planEngineerMobileVisitActionCommand');

  assertIncludesAll(source, [
    "require('./engineerMobileVisitActionDecisionHelper')",
    'decideEngineerMobileVisitAction',
    'function trustedContextFromActor(actor)',
    'function assignmentContextFromAppointment(appointment)',
    'function actionSubjectFromAppointment(appointment)',
    'function hasUnsafeRequestContainer(source)',
    'function hasReportBoundaryMarker(source)',
  ], 'command planner decision helper wiring');
  assertIncludesAll(plannerBody, [
    'decideEngineerMobileVisitAction({',
    'action: source.action',
    'trustedContext: trustedContextFromActor(source.actor)',
    'assignmentContext: assignmentContextFromAppointment(source.appointment)',
    'actionSubject:',
    'visitResult: source.visitResult',
    'requestId: source.requestId',
    'hasUnsafeRequestContainer(source) ? { body: {} } : {}',
    'return deniedCommandResult',
    'return allowedCommandResult',
  ], 'command planner helper decision flow');
});

test('trusted context and subject selection excludes raw request containers and client identity authorization', () => {
  const source = read(FILES.commandPlanner);
  const trustedContextBody = functionBody(source, 'trustedContextFromActor');
  const assignmentContextBody = functionBody(source, 'assignmentContextFromAppointment');
  const actionSubjectBody = functionBody(source, 'actionSubjectFromAppointment');
  const wiringTest = read(FILES.task2286WiringTest);

  assertIncludesAll(trustedContextBody, [
    'engineerId:',
    'organizationId:',
    'permissions:',
  ], 'trusted context selected fields');
  assertIncludesAll(assignmentContextBody, [
    'assignedEngineerId:',
    'organizationId:',
  ], 'assignment context selected fields');
  assertIncludesAll(actionSubjectBody, [
    'appointmentId:',
    'assignedEngineerId:',
    'caseId:',
    'organizationId:',
    'mobileVisitStatus:',
    'status:',
  ], 'action subject selected fields');
  assertIncludesAll(source, [
    "'body'",
    "'query'",
    "'headers'",
    "'cookie'",
    "'session'",
    "'provider'",
    "'debug'",
    "'env'",
  ], 'raw container deny list');
  assertIncludesAll(wiringTest, [
    'raw body query header cookie session provider debug env fields cannot authorize action',
    'raw client-provided engineerId cannot authorize action without trusted actor context',
    'body_engineer_should_not_authorize',
    'attacker_engineer',
  ], 'client identity non-authorization evidence');
});

test('supported aliases helper decisions and command output shape remain guarded', () => {
  const source = read(FILES.commandPlanner);
  const decisionHelper = read(FILES.decisionHelper);
  const wiringTest = read(FILES.task2286WiringTest);
  const task2286Doc = read(FILES.task2286Doc);

  assertIncludesAll(decisionHelper, [
    "start_travel: 'engineer_mobile.start_travel'",
    "arrive: 'engineer_mobile.arrive'",
    "start_work: 'engineer_mobile.start_work'",
    "finish_work: 'engineer_mobile.finish_work'",
    "record_visit_result: 'engineer_mobile.record_visit_result'",
  ], 'supported aliases');
  assertIncludesAll(source, [
    'function allowedCommandResult({ policyDecision, actor, appointment, now, requestId })',
    'transitionIntent: transitionIntentFor({',
    'auditIntent: auditIntentFor({',
    'if (!policyDecision || policyDecision.allowed !== true)',
  ], 'allowed-only command output flow');
  assertIncludesAll(wiringTest, [
    'visit action command planner wires allowed supported actions through decision helper transition intent',
    'canonical action names remain accepted and normalized through helper output',
    'assertAllowedPlan(result, fixture)',
    'assert.equal(result.ok, true)',
    'assert.equal(result.allowed, true)',
  ], 'Task2286 allowed behavior evidence');
  assertIncludesAll(task2286Doc, SAFE_COMMAND_FIELDS.map((field) => `\`${field}\``), 'Task2286 command fields');
});

test('deny ineligible report-boundary and unsafe leakage protections remain covered', () => {
  const source = read(FILES.commandPlanner);
  const wiringTest = read(FILES.task2286WiringTest);
  const task2286Doc = read(FILES.task2286Doc);

  assertIncludesAll(source, REPORT_BOUNDARY_MARKERS, 'report boundary marker source checks');
  assertIncludesAll(wiringTest, [
    'unsupported malformed cross-scope not-assigned unauthorized and invalid-state inputs fail closed',
    'report boundary markers fail closed and do not create approve publish formalize or leak reports',
    'assert.equal(\'transitionIntent\' in result, false)',
    'completionReportId',
    'fieldServiceReportId',
    'finalAppointmentId',
    'publishReport',
  ], 'Task2286 deny and report boundary evidence');
  assertIncludesAll([
    wiringTest,
    task2286Doc,
  ].join('\n'), UNSAFE_MARKERS, 'unsafe marker evidence');
  assertIncludesAll(task2286Doc, [
    'Denied, malformed, unsupported, cross-scope, not-assigned, unauthorized, invalid-state, raw-container, client-controlled identity, and report-boundary inputs fail closed without transition intent.',
    'Raw Case, Appointment, Completion Report, Field Service Report, repository/DB rows',
    '`finalAppointmentId`',
  ], 'Task2286 safety summary');
});

test('command planner remains free of DB provider route smoke package AI billing and report workflow behavior', () => {
  const source = read(FILES.commandPlanner);

  assertNoPattern(source, FORBIDDEN_RUNTIME_PATTERNS, 'command planner');
  assertNoPattern(source, [
    /createFieldServiceReport\s*\(/,
    /approveFieldServiceReport\s*\(/,
    /publishFieldServiceReport\s*\(/,
    /createCompletionReport\s*\(/,
    /approveCompletionReport\s*\(/,
    /publishCompletionReport\s*\(/,
    /formalize[A-Z]\w*Report\s*\(/,
  ], 'report workflow behavior');
});
