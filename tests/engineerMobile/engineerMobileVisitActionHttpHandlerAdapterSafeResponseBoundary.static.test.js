'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const FILES = Object.freeze({
  adapter: 'src/engineerMobile/engineerMobileVisitActionHttpHandlerAdapter.js',
  focusedTest: 'tests/engineerMobile/engineerMobileVisitActionHttpHandlerAdapterSafeResponseNormalizer.unit.test.js',
  task2295Doc: 'docs/task-2295-engineer-mobile-visit-action-http-handler-adapter-safe-response-normalizer-no-db-no-smoke-no-provider.md',
});

const SAFE_RESPONSE_MARKERS = Object.freeze([
  'function safeHttpResponse(presented, fallback)',
  'function safeTransitionFromResponseBody(body)',
  'function safeAuditFromResponseBody(body)',
  'function safeErrorFromResponseBody(body, reasonCode)',
  'function safeStatusCode(value, fallback)',
  'function safeAction(value)',
  'function safeReasonCode(value, fallback = ERROR_CODES.SERVICE_INVOCATION_FAILED)',
  'function safeMobileVisitStatus(value)',
  'function safeVisitResult(value)',
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
  'raw_service_should_not_leak',
  'raw_transition_should_not_leak',
  'raw_audit_should_not_leak',
  'raw_case_should_not_leak',
  'raw_appointment_should_not_leak',
  'raw_completion_report_should_not_leak',
  'raw_field_service_report_should_not_leak',
  'raw_db_row_should_not_leak',
  'raw_repository_row_should_not_leak',
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

function requireSpecifiers(source) {
  const specifiers = [];
  const requireRegex = /require\(([^)]+)\)/g;
  let match;

  while ((match = requireRegex.exec(source)) !== null) {
    specifiers.push(match[1]);
  }

  return specifiers;
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

test('Task2296 static guard input files exist and this guard is text-only', () => {
  for (const file of Object.values(FILES)) {
    assert.equal(fs.existsSync(absolutePath(file)), true, `${file} should exist`);
  }

  const thisSource = fs.readFileSync(__filename, 'utf8');

  assert.doesNotMatch(thisSource, /require\(['"]\.\.\/\.\.\/src\//);
  assert.doesNotMatch(thisSource, /require\(['"]node:child_process['"]\)/);
  assert.doesNotMatch(thisSource, /require\(['"]pg['"]\)/);
});

test('HTTP handler adapter keeps explicit safe response normalizer boundary', () => {
  const source = read(FILES.adapter);

  assert.deepEqual(requireSpecifiers(source), [
    'HTTP_REQUEST_NORMALIZER_MODULE',
    'HTTP_RESPONSE_PRESENTER_MODULE',
  ]);
  assertIncludesAll(source, SAFE_RESPONSE_MARKERS, 'safe response normalizer functions');
  assertIncludesAll(source, [
    'const SUPPORTED_ACTIONS = Object.freeze([',
    'const SUPPORTED_MOBILE_VISIT_STATUSES = Object.freeze([',
    'const SUPPORTED_VISIT_RESULTS = Object.freeze([',
    'const SAFE_REASON_CODES = Object.freeze([',
    'return safeHttpResponse(presented, {',
    'return presentError(500, ERROR_CODES.SERVICE_INVOCATION_FAILED, requestId);',
    'return presentServiceResult(serviceResult, requestId);',
  ], 'safe response normalizer flow');
});

test('safe response output fields remain explicitly shaped and allowlisted', () => {
  const source = read(FILES.adapter);
  const responseBody = functionBody(source, 'safeHttpResponse');
  const transitionBody = functionBody(source, 'safeTransitionFromResponseBody');
  const errorBody = functionBody(source, 'safeErrorFromResponseBody');

  assertIncludesAll(source, SUPPORTED_ACTIONS, 'supported actions');
  assertIncludesAll(source, [
    'service_invocation_failed',
    'VISIT_ACTION_SERVICE_REQUIRED',
    'APPOINTMENT_ID_MISMATCH',
    'unsupported_action',
    'permission_required',
    'transition_write_failed',
    'audit_write_failed',
    'repository_adapter_write_failed',
    'applied',
  ], 'safe reason codes');
  assertIncludesAll(responseBody, [
    'statusCode: safeStatusCode(response.statusCode, fallback.statusCode)',
    'ok: body.ok === true',
    'accepted: body.accepted === true',
    'allowed: body.allowed === true',
    'action: safeAction(body.action)',
    'reasonCode,',
    'transition: safeTransitionFromResponseBody(body)',
    'audit: safeAuditFromResponseBody(body)',
    'error: safeErrorFromResponseBody(body, reasonCode)',
  ], 'safe HTTP response body fields');
  assertIncludesAll(transitionBody, [
    'applied: transition.applied === true',
    'mobileVisitStatus: safeMobileVisitStatus(transition.mobileVisitStatus)',
    'visitResult: safeVisitResult(transition.visitResult)',
  ], 'safe transition fields');
  assertIncludesAll(errorBody, [
    'code: safeReasonCode(body.error.code, reasonCode)',
  ], 'safe error fields');
});

test('focused unit coverage proves allowed denied unavailable malformed thrown no-leak and mutation behavior', () => {
  const focusedTest = read(FILES.focusedTest);

  assertIncludesAll(focusedTest, [
    'allowed success response is explicitly shaped and strips raw service fields',
    'generic denied ineligible and unavailable responses remain safe',
    'malformed service result fails safely without raw leakage',
    'malformed response fields are stripped from service result response',
    'thrown service errors return generic response without raw error details',
    'request and service result inputs are not mutated',
    'assert.equal(response.body.reasonCode, \'service_invocation_failed\')',
    'assert.deepEqual(req, beforeRequest)',
    'assert.deepEqual(serviceResult, beforeServiceResult)',
  ], 'Task2295 focused unit coverage');
});

test('unsafe leakage and report-boundary coverage remains present in tests and docs', () => {
  const focusedTest = read(FILES.focusedTest);
  const doc = read(FILES.task2295Doc);

  assertIncludesAll(focusedTest, UNSAFE_MARKERS, 'focused unit unsafe markers');
  assertIncludesAll(focusedTest, [
    'raw_final_appointment_should_not_leak',
    'raw_publish_report_should_not_leak',
    'raw_approve_report_should_not_leak',
    'raw_formalize_report_should_not_leak',
    'raw_create_report_should_not_leak',
  ], 'focused unit report boundary markers');
  assertIncludesAll(doc, REPORT_BOUNDARY_MARKERS, 'doc report boundary markers');
  assertIncludesAll(doc, [
    'raw service result, transition, audit',
    'Case, Appointment, Completion Report, Field Service Report',
    'DB/repository',
    'provider/providerPayload',
    'AI/RAG/OpenAI/vector',
    'billing/settlement/payment/invoice',
    'debug/internal/raw SQL/token/password/secret',
    'private customer fullAddress/raw phone/signature/photo/private fields',
  ], 'Task2295 doc unsafe coverage');
});

test('HTTP handler adapter safe response boundary remains free of forbidden runtime behavior', () => {
  const source = read(FILES.adapter);
  const focusedTest = read(FILES.focusedTest);
  const doc = read(FILES.task2295Doc);

  assertNoPattern(source, FORBIDDEN_RUNTIME_PATTERNS, 'HTTP handler adapter');
  assertNoPattern(focusedTest, [
    /require\(['"]\.\.\/\.\.\/src\/.*(?:Db|Repository|Provider|Route|Server|Migration)/,
    /require\(['"]node:child_process['"]\)/,
    /require\(['"]pg['"]\)/,
    /DATABASE_URL|ZEABUR/,
  ], 'Task2295 focused unit test');
  assertIncludesAll(doc, [
    'No new route path or mount was added.',
    'No DB command, SQL execution, SQL runtime construction',
    'No provider sending behavior was added',
    'No AI/RAG/OpenAI/vector DB behavior was added.',
    'No admin frontend, billing, settlement, payment, invoice',
    'The same 7 held historical docs remain untracked and untouched.',
  ], 'Task2295 no-runtime-expansion doc');
});
