'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const FILES = Object.freeze({
  commandPlanner: 'src/engineerMobile/engineerMobileVisitActionCommandPlanner.js',
  safeOutputTest: 'tests/engineerMobile/engineerMobileVisitActionCommandPlannerSafeOutputNormalizer.unit.test.js',
  task2289Doc: 'docs/task-2289-engineer-mobile-visit-action-command-planner-safe-output-normalizer-no-db-no-smoke-no-provider.md',
});

const SAFE_OUTPUT_FUNCTIONS = Object.freeze([
  'function safeAction(value)',
  'function safeReasonCode(value, fallback = \'denied\')',
  'function safeSubject(policyDecision, actor, appointment)',
  'function safeSupportedActions(value)',
  'function auditIntentFor({ action, allowed, reasonCode, subject, now, requestId })',
  'function deniedCommandResult({ policyDecision, actor, appointment, now, requestId })',
  'function transitionIntentFor({ policyDecision, subject, now, requestId })',
  'function allowedCommandResult({ policyDecision, actor, appointment, now, requestId })',
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

test('Task2290 static guard input files exist and this guard is text-only', () => {
  for (const file of Object.values(FILES)) {
    assert.equal(fs.existsSync(absolutePath(file)), true, `${file} should exist`);
  }

  const thisSource = fs.readFileSync(__filename, 'utf8');

  assert.doesNotMatch(thisSource, /require\(['"]\.\.\/\.\.\/src\//);
  assert.doesNotMatch(thisSource, /require\(['"]node:child_process['"]\)/);
  assert.doesNotMatch(thisSource, /require\(['"]pg['"]\)/);
});

test('command planner keeps explicit safe output normalizer boundary', () => {
  const source = read(FILES.commandPlanner);

  assertIncludesAll(source, SAFE_OUTPUT_FUNCTIONS, 'safe output normalizer functions');
  assertIncludesAll(source, [
    'const SUPPORTED_VISIT_RESULTS = Object.freeze([',
    'const SAFE_REASON_CODES = Object.freeze([',
    'Object.prototype.hasOwnProperty.call(MOBILE_VISIT_STATUS_BY_ACTION, action)',
    '.map((action) => safeAction(action))',
    'action: safeAction(action)',
    'reasonCode: safeReasonCode(reasonCode)',
    'const action = safeAction(policyDecision.action);',
    'const reasonCode = safeReasonCode(policyDecision.reasonCode);',
    'const transitionIntent = transitionIntentFor({',
    'reasonCode: \'malformed_decision\'',
    'reasonCode: \'malformed_transition_intent\'',
  ], 'safe output normalizer wiring');
});

test('allowed actions reason codes and transition intent fields remain explicit', () => {
  const source = read(FILES.commandPlanner);
  const transitionIntentBody = functionBody(source, 'transitionIntentFor');
  const allowedBody = functionBody(source, 'allowedCommandResult');

  assertIncludesAll(source, SUPPORTED_ACTIONS, 'supported actions');
  assertIncludesAll(source, [
    'malformed_decision',
    'malformed_transition_intent',
    'unsupported_action',
    'report_boundary',
    'invalid_context',
    'invalid_state',
    'invalid_visit_result',
    'not_assigned',
    'cross_scope',
    'unauthorized',
  ], 'safe reason codes');
  assertIncludesAll(transitionIntentBody, [
    'helperAction !== action',
    'helperMobileVisitStatus !== mobileVisitStatus',
    'stringValue(helperTransitionIntent.actorId) !== subject.actorId',
    'stringValue(helperTransitionIntent.appointmentId) !== subject.appointmentId',
    'stringValue(helperTransitionIntent.organizationId) !== subject.organizationId',
    'SUPPORTED_VISIT_RESULTS.includes(visitResult)',
    'kind: ENGINEER_MOBILE_VISIT_ACTION_TRANSITION_INTENT_KIND',
    'visitResult: action === \'engineer_mobile.record_visit_result\' ? visitResult : undefined',
  ], 'transition intent validation');
  assertIncludesAll(allowedBody, [
    'if (!action || !subject.actorId || !subject.appointmentId || !subject.organizationId)',
    'if (!transitionIntent)',
    'transitionIntent,',
    'auditIntent: auditIntentFor({',
  ], 'allowed output guard');
});

test('safe output unit coverage proves allowed compatibility malformed safety and no wholesale pass-through', () => {
  const unitTest = read(FILES.safeOutputTest);

  assertIncludesAll(unitTest, [
    'allowed success output remains compatible for all supported actions',
    'explicit transition intent is present only on allowed actions',
    'raw command actor appointment assignment policy and helper objects are not passed through',
    'malformed helper decisions fail closed without leaking helper internals',
    'malformed transition intents fail closed without exposing raw transition subject',
    'safe output normalizer strips extra helper decision and transition intent fields',
    'assert.equal(result.reasonCode, \'malformed_decision\')',
    'assert.equal(result.reasonCode, \'malformed_transition_intent\')',
    'assert.deepEqual(source, before)',
  ], 'safe output unit coverage');
});

test('report-boundary protections remain visible in source tests and docs', () => {
  const source = read(FILES.commandPlanner);
  const unitTest = read(FILES.safeOutputTest);
  const doc = read(FILES.task2289Doc);

  assertIncludesAll(source, [
    'completionreportid',
    'fieldservicereportid',
    'finalappointmentid',
    'publishreport',
    'approvereport',
    'formalizereport',
    'createreport',
  ], 'source report boundary markers');
  assertIncludesAll(unitTest, REPORT_BOUNDARY_MARKERS, 'unit report boundary markers');
  assertIncludesAll(doc, REPORT_BOUNDARY_MARKERS, 'doc report boundary markers');
  assertIncludesAll(unitTest, [
    'report-boundary markers fail closed and are not emitted',
    'assert.equal(result.reasonCode, \'report_boundary\')',
    'assert.equal(\'transitionIntent\' in result, false)',
  ], 'report boundary unit behavior');
});

test('unsafe leakage coverage remains present for raw private system and internal fields', () => {
  const unitTest = read(FILES.safeOutputTest);
  const doc = read(FILES.task2289Doc);

  assertIncludesAll(unitTest, UNSAFE_MARKERS, 'unit unsafe markers');
  assertIncludesAll(doc, [
    'raw Case, Appointment, Completion Report, Field Service Report objects',
    'DB/repository rows',
    'audit internals',
    'provider payloads',
    'AI/RAG/OpenAI/vector data',
    'billing/settlement/payment/invoice data',
    'debug/internal/raw SQL/token/password/secret fields',
    'private customer fullAddress/raw phone/signature/photo/private fields',
  ], 'doc unsafe coverage');
});

test('safe output guard and command planner remain free of forbidden runtime behavior', () => {
  const source = read(FILES.commandPlanner);
  const unitTest = read(FILES.safeOutputTest);
  const doc = read(FILES.task2289Doc);

  assertNoPattern(source, FORBIDDEN_RUNTIME_PATTERNS, 'command planner');
  assertNoPattern(unitTest, [
    /require\(['"]\.\.\/\.\.\/src\/.*(?:Db|Repository|Provider|Route|Server|Migration)/,
    /require\(['"]node:child_process['"]\)/,
    /require\(['"]pg['"]\)/,
    /DATABASE_URL|ZEABUR/,
  ], 'safe output unit test');
  assertIncludesAll(doc, [
    'No new route path or mount was added.',
    'No DB command, SQL execution, SQL runtime construction',
    'No provider sending behavior was added',
    'No AI/RAG/OpenAI/vector DB behavior was added.',
    'No admin frontend, billing, settlement, payment, invoice',
    'The same 7 held historical docs remain untracked and untouched.',
  ], 'Task2289 no-runtime-expansion doc');
});
