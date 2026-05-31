'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const FILES = Object.freeze({
  applicationService: 'src/engineerMobile/engineerMobileVisitActionApplicationService.js',
  focusedTest: 'tests/engineerMobile/engineerMobileVisitActionApplicationServiceWriterResultNormalizer.unit.test.js',
  writerBoundaryTest: 'tests/engineerMobile/engineerMobileVisitActionWriterResultNormalizerBoundary.static.test.js',
  task2297Doc: 'docs/task-2297-engineer-mobile-visit-action-application-service-writer-result-normalizer-no-db-no-smoke-no-provider.md',
});

const WRITER_RESULT_BOUNDARY_MARKERS = Object.freeze([
  'function normalizeWriterResultForService(writerKind, result)',
  'function absorbWriterResultRejection(result)',
  'function writerResultSucceeded(normalizedWriterResult, writerKind)',
  'const SAFE_WRITER_KINDS = Object.freeze([',
  'const SAFE_WRITER_RESULT_REASON_CODES = Object.freeze([',
  'normalizeEngineerMobileVisitActionWriterResult({',
  'normalizerKind: ENGINEER_MOBILE_VISIT_ACTION_WRITER_RESULT_NORMALIZER_KIND',
  'reasonCode: safeWriterResultReasonCode(source.reasonCode)',
  'const normalizedTransitionResult = normalizeWriterResultForService(\'transition\', transitionResult);',
  'const normalizedAuditResult = normalizeWriterResultForService(\'audit\', auditResult);',
  'writerResultSucceeded(normalizedTransitionResult, \'transition\')',
  'writerResultSucceeded(normalizedAuditResult, \'audit\')',
]);

const SUCCESS_GUARD_MARKERS = Object.freeze([
  'normalizedWriterResult.ok === true',
  'normalizedWriterResult.writerKind === writerKind',
  'normalizedWriterResult.normalizerKind === ENGINEER_MOBILE_VISIT_ACTION_WRITER_RESULT_NORMALIZER_KIND',
  'normalizedWriterResult.reasonCode === \'writer_succeeded\'',
]);

const FOCUSED_TEST_MARKERS = Object.freeze([
  'existing allowed action success path remains compatible with normalized writer handling',
  'normalized transition writer result does not leak raw data or report-boundary fields',
  'normalized audit writer result does not leak raw data or report-boundary fields',
  'thrown and rejected transition writer failures are safe',
  'thrown and rejected audit writer failures are safe',
  'malformed writer result is safe',
  'denied ineligible and malformed planner outputs do not call writers',
  'raw Case Appointment Completion Report Field Service Report objects are not exposed and inputs are not mutated',
  'Promise.reject(new Error(\'raw_transition_writer_should_not_leak\'))',
  'Promise.reject(new Error(\'raw_audit_writer_should_not_leak\'))',
  'assert.deepEqual(sourceCommand, beforeCommand)',
  'assert.deepEqual(transitionResult, beforeTransitionResult)',
  'assert.deepEqual(auditResult, beforeAuditResult)',
]);

const UNSAFE_MARKERS = Object.freeze([
  'raw_writer_result_should_not_leak',
  'raw_transition_writer_should_not_leak',
  'raw_audit_writer_should_not_leak',
  'raw_case_should_not_leak',
  'raw_appointment_should_not_leak',
  'raw_completion_report_should_not_leak',
  'raw_field_service_report_should_not_leak',
  'raw_case_object_should_not_leak',
  'raw_appointment_object_should_not_leak',
  'raw_completion_report_object_should_not_leak',
  'raw_field_service_report_object_should_not_leak',
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

const REPORT_BOUNDARY_MARKERS = Object.freeze([
  'completionReportId',
  'fieldServiceReportId',
  'finalAppointmentId',
  'publishReport',
  'approveReport',
  'formalizeReport',
  'createReport',
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
  /package-lock/i,
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

  const openingBraceIndex = source.indexOf('{', signatureIndex);
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

test('Task2298 static guard input files exist and this guard is text-only', () => {
  for (const file of Object.values(FILES)) {
    assert.equal(fs.existsSync(absolutePath(file)), true, `${file} should exist`);
  }

  const thisSource = fs.readFileSync(__filename, 'utf8');

  assert.doesNotMatch(thisSource, /require\(['"]\.\.\/\.\.\/src\//);
  assert.doesNotMatch(thisSource, /require\(['"]node:child_process['"]\)/);
  assert.doesNotMatch(thisSource, /require\(['"]pg['"]\)/);
});

test('application service keeps explicit local writer-result normalization boundary', () => {
  const source = read(FILES.applicationService);
  const normalizeBody = functionBody(source, 'normalizeWriterResultForService');
  const successBody = functionBody(source, 'writerResultSucceeded');

  assertIncludesAll(source, WRITER_RESULT_BOUNDARY_MARKERS, 'application service writer-result boundary markers');
  assertIncludesAll(successBody, SUCCESS_GUARD_MARKERS, 'writer-result success guard');
  assertIncludesAll(normalizeBody, [
    'absorbWriterResultRejection(result)',
    'ok: source.ok === true',
    'writerKind: safeWriterKind(source.writerKind)',
    'normalizerKind: ENGINEER_MOBILE_VISIT_ACTION_WRITER_RESULT_NORMALIZER_KIND',
    'reasonCode: safeWriterResultReasonCode(source.reasonCode)',
  ], 'writer-result safe wrapper body');
});

test('transition and audit writer results must normalize before successful handling', () => {
  const source = read(FILES.applicationService);

  assert.match(
    source,
    /const transitionResult = transitionWriter\.write\(clonePlain\(normalizedPlan\.transitionIntent\)\);\s*const normalizedTransitionResult = normalizeWriterResultForService\('transition', transitionResult\);\s*if \(!writerResultSucceeded\(normalizedTransitionResult, 'transition'\)\) \{\s*return transitionWriteFailed\(normalizedPlan\);/s,
  );
  assert.match(
    source,
    /const auditResult = auditWriter\.record\(clonePlain\(normalizedPlan\.auditIntent\)\);\s*const normalizedAuditResult = normalizeWriterResultForService\('audit', auditResult\);\s*if \(!writerResultSucceeded\(normalizedAuditResult, 'audit'\)\) \{\s*return auditWriteFailed\(normalizedPlan\);/s,
  );
});

test('rejected writer results are absorbed safely and raw writer output is not returned', () => {
  const source = read(FILES.applicationService);
  const rejectionBody = functionBody(source, 'absorbWriterResultRejection');

  assertIncludesAll(rejectionBody, [
    'typeof result.catch !== \'function\'',
    'result.catch(() => undefined)',
  ], 'writer-result rejection guard');

  assert.doesNotMatch(source, /return\s+transitionResult\b/);
  assert.doesNotMatch(source, /return\s+auditResult\b/);
  assert.doesNotMatch(source, /\.\.\.transitionResult\b/);
  assert.doesNotMatch(source, /\.\.\.auditResult\b/);
});

test('focused unit coverage proves thrown rejected malformed denied no-leak and mutation behavior', () => {
  const focusedTest = read(FILES.focusedTest);

  assertIncludesAll(focusedTest, FOCUSED_TEST_MARKERS, 'Task2297 focused unit coverage');
  assertIncludesAll(focusedTest, [
    'assert.equal(thrownResult.reasonCode, \'transition_write_failed\')',
    'assert.equal(rejectedResult.reasonCode, \'transition_write_failed\')',
    'assert.equal(thrownResult.reasonCode, \'audit_write_failed\')',
    'assert.equal(rejectedResult.reasonCode, \'audit_write_failed\')',
    'assert.equal(transitionResult.reasonCode, \'transition_write_failed\')',
    'assert.equal(auditResult.reasonCode, \'audit_write_failed\')',
    'assert.deepEqual(calls, [])',
  ], 'Task2297 safe failure assertions');
});

test('unsafe leakage and report-boundary coverage remains present in tests and docs', () => {
  const focusedTest = read(FILES.focusedTest);
  const doc = read(FILES.task2297Doc);
  const combined = `${focusedTest}
${doc}`;

  assertIncludesAll(combined, UNSAFE_MARKERS, 'Task2297 unsafe leakage coverage');
  assertIncludesAll(combined, REPORT_BOUNDARY_MARKERS, 'Task2297 report-boundary coverage');
  assertIncludesAll(doc, [
    'Raw writer results',
    'raw appointment/case/report objects',
    'repository rows',
    'provider payloads',
    'AI/RAG/OpenAI/vector data',
    'billing/settlement/payment/invoice data',
    'debug/internal/raw SQL/token/password/secret fields',
    'private customer fields',
  ], 'Task2297 doc coverage');
});

test('application-service writer-result boundary remains free of forbidden runtime behavior', () => {
  const source = read(FILES.applicationService);

  assertNoPattern(source, FORBIDDEN_RUNTIME_PATTERNS, 'Task2298 static guard scope');
});
