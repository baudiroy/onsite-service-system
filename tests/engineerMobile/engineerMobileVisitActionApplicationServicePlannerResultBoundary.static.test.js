'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const FILES = Object.freeze({
  applicationService: 'src/engineerMobile/engineerMobileVisitActionApplicationService.js',
  focusedTest: 'tests/engineerMobile/engineerMobileVisitActionApplicationServicePlannerResultNormalizer.unit.test.js',
  task2292Doc: 'docs/task-2292-engineer-mobile-visit-action-application-service-planner-result-normalizer-no-db-no-smoke-no-provider.md',
});

const NORMALIZER_MARKERS = Object.freeze([
  'function normalizePlannerResult(plan)',
  'function normalizePlannerTransitionIntent(plan)',
  'function normalizePlannerAuditIntent(plan, allowed, reasonCode)',
  'function safeAction(value)',
  'function safePlanReasonCode(value, fallback = \'denied\')',
  'const normalizedPlan = normalizePlannerResult(plan);',
  'transitionWriter.write(clonePlain(normalizedPlan.transitionIntent))',
  'auditWriter.record(clonePlain(normalizedPlan.auditIntent))',
]);

const SUPPORTED_ACTIONS = Object.freeze([
  'engineer_mobile.start_travel',
  'engineer_mobile.arrive',
  'engineer_mobile.start_work',
  'engineer_mobile.finish_work',
  'engineer_mobile.record_visit_result',
]);

const REPORT_BOUNDARY_MARKERS = Object.freeze([
  'completionReportId',
  'fieldServiceReportId',
  'finalAppointmentId',
  'publishReport',
  'approveReport',
  'formalizeReport',
  'createReport',
]);

const UNSAFE_MARKERS = Object.freeze([
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
  'raw_full_address_should_not_leak',
  'raw_phone_should_not_leak',
  'raw_signature_should_not_leak',
  'raw_photo_should_not_leak',
  'raw_private_should_not_leak',
  'raw_debug_should_not_leak',
  'raw_internal_should_not_leak',
  'raw_sql_should_not_leak',
  'raw_token_should_not_leak',
  'raw_password_should_not_leak',
  'raw_secret_should_not_leak',
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

test('Task2293 static guard input files exist and this guard is text-only', () => {
  for (const file of Object.values(FILES)) {
    assert.equal(fs.existsSync(absolutePath(file)), true, `${file} should exist`);
  }

  const thisSource = fs.readFileSync(__filename, 'utf8');

  assert.doesNotMatch(thisSource, /require\(['"]\.\.\/\.\.\/src\//);
  assert.doesNotMatch(thisSource, /require\(['"]node:child_process['"]\)/);
  assert.doesNotMatch(thisSource, /require\(['"]pg['"]\)/);
});

test('application service keeps explicit planner-result normalizer boundary', () => {
  const source = read(FILES.applicationService);

  assertIncludesAll(source, NORMALIZER_MARKERS, 'application service normalizer markers');
  assertIncludesAll(source, [
    'const MOBILE_VISIT_STATUS_BY_ACTION = Object.freeze({',
    'const SUPPORTED_VISIT_RESULTS = Object.freeze([',
    'const SAFE_PLAN_REASON_CODES = Object.freeze([',
    'Object.prototype.hasOwnProperty.call(MOBILE_VISIT_STATUS_BY_ACTION, action)',
    'source.allowed !== true',
    'return deniedPlannerResult(source, \'malformed_planner_result\')',
    'return deniedPlannerResult(source, \'malformed_transition_intent\')',
  ], 'normalizer constants and fail-closed flow');
});

test('allowed planner outputs transition intents and audit intents are validated before writer calls', () => {
  const source = read(FILES.applicationService);
  const transitionBody = functionBody(source, 'normalizePlannerTransitionIntent');
  const auditBody = functionBody(source, 'normalizePlannerAuditIntent');
  const resultBody = functionBody(source, 'normalizePlannerResult');

  assertIncludesAll(source, SUPPORTED_ACTIONS, 'supported canonical actions');
  assertIncludesAll(source, [
    'malformed_planner_result',
    'malformed_transition_intent',
    'unsupported_action',
    'report_boundary',
    'invalid_context',
    'invalid_state',
    'invalid_visit_result',
    'not_assigned',
    'cross_scope',
    'unauthorized',
  ], 'safe planner reason codes');
  assertIncludesAll(transitionBody, [
    'stringValue(transitionIntent.kind) !== ENGINEER_MOBILE_VISIT_ACTION_TRANSITION_INTENT_KIND',
    'transitionAction !== action',
    'transitionMobileVisitStatus !== mobileVisitStatus',
    'stringValue(transitionIntent.actorId) !== stringValue(plan.actorId)',
    'stringValue(transitionIntent.appointmentId) !== stringValue(plan.appointmentId)',
    'stringValue(transitionIntent.organizationId) !== stringValue(plan.organizationId)',
    'SUPPORTED_VISIT_RESULTS.includes(visitResult)',
    'visitResult: action === \'engineer_mobile.record_visit_result\' ? visitResult : undefined',
  ], 'transition intent normalizer checks');
  assertIncludesAll(auditBody, [
    'type: \'engineer_mobile.visit_action_command_planner_decision\'',
    'plannerKind: ENGINEER_MOBILE_VISIT_ACTION_COMMAND_PLANNER_KIND',
    'allowed: Boolean(allowed)',
    'reasonCode: safeReasonCode',
  ], 'audit intent normalizer checks');
  assertIncludesAll(resultBody, [
    'const transitionIntent = normalizePlannerTransitionIntent(source)',
    'transitionIntent,',
    'auditIntent: normalizePlannerAuditIntent(source, true, \'allowed\')',
  ], 'planner result normalizer output');
});

test('focused unit coverage proves allowed malformed deny leakage report-boundary and mutation behavior', () => {
  const focusedTest = read(FILES.focusedTest);

  assertIncludesAll(focusedTest, [
    'existing allowed action success path remains compatible with normalized transition and audit handling',
    'application service strips raw planner transition audit and report-boundary fields before writers',
    'malformed planner result fails closed without writer calls',
    'malformed transition intent fails closed without writer calls',
    'deny and ineligible planner results remain generic and safe',
    'service does not mutate input command actor appointment or planner result objects',
    'assert.equal(result.reasonCode, \'malformed_planner_result\')',
    'assert.equal(result.reasonCode, \'malformed_transition_intent\')',
    'assert.deepEqual(calls, [])',
  ], 'Task2292 focused unit coverage');
});

test('unsafe leakage and report-boundary coverage remains present in tests and docs', () => {
  const focusedTest = read(FILES.focusedTest);
  const doc = read(FILES.task2292Doc);

  assertIncludesAll(focusedTest, UNSAFE_MARKERS, 'focused unit unsafe markers');
  assertIncludesAll(focusedTest, [
    'raw_completion_report_should_not_leak',
    'raw_field_service_report_should_not_leak',
    'finalAppointmentId',
    'publishReport',
    'approveReport',
    'formalizeReport',
    'createReport',
  ], 'focused unit report boundary evidence');
  assertIncludesAll(doc, REPORT_BOUNDARY_MARKERS, 'doc report markers');
  assertIncludesAll(doc, [
    'raw command, planner result, appointment, actor, assignment, helper, policy, transition, or audit objects',
    'raw Case, Appointment, Completion Report, Field Service Report objects',
    'DB/repository rows',
    'audit internals',
    'provider/providerPayload',
    'AI/RAG/OpenAI/vector data',
    'billing/settlement/payment/invoice data',
    'debug/internal/raw SQL/token/password/secret fields',
    'private customer fullAddress/raw phone/signature/photo/private fields',
  ], 'Task2292 doc unsafe coverage');
});

test('application service planner-result boundary remains free of forbidden runtime behavior', () => {
  const source = read(FILES.applicationService);
  const focusedTest = read(FILES.focusedTest);
  const doc = read(FILES.task2292Doc);

  assertNoPattern(source, FORBIDDEN_RUNTIME_PATTERNS, 'application service');
  assertNoPattern(focusedTest, [
    /require\(['"]\.\.\/\.\.\/src\/.*(?:Db|Repository|Provider|Route|Server|Migration)/,
    /require\(['"]node:child_process['"]\)/,
    /require\(['"]pg['"]\)/,
    /DATABASE_URL|ZEABUR/,
  ], 'Task2292 focused unit test');
  assertIncludesAll(doc, [
    'No new route path or mount was added.',
    'No DB command, SQL execution, SQL runtime construction',
    'No provider sending behavior was added',
    'No AI/RAG/OpenAI/vector DB behavior was added.',
    'No admin frontend, billing, settlement, payment, invoice',
    'The same 7 held historical docs remain untracked and untouched.',
  ], 'Task2292 no-runtime-expansion doc');
});
