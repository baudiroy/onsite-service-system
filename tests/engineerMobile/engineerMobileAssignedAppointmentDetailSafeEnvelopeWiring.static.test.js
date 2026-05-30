'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const FILES = Object.freeze({
  handler: 'src/engineerMobile/engineerMobileAssignedAppointmentDetailHandler.js',
  presenter: 'src/engineerMobile/engineerMobileWorkbenchSafeEnvelopePresenter.js',
  task2280WiringTest: 'tests/engineerMobile/engineerMobileWorkbenchSafeEnvelopePresenterWiring.unit.test.js',
  task2280Doc: 'docs/task-2280-engineer-mobile-workbench-safe-envelope-presenter-runtime-wiring-no-db-no-smoke-no-provider.md',
});

const SAFE_WORKBENCH_FIELDS = Object.freeze([
  'ok',
  'status',
  'messageKey',
  'assignmentReference',
  'caseReference',
  'appointmentReference',
  'serviceStatus',
  'appointmentWindow',
  'customerDisplay',
  'locationSummary',
  'workOrderSummary',
  'eligibility',
  'actions',
]);

const UNSAFE_MARKERS = Object.freeze([
  'raw_case_should_not_leak',
  'raw_appointment_should_not_leak',
  'completion_report_should_not_leak',
  'field_service_report_should_not_leak',
  'select * from',
  'provider_payload_should_not_leak',
  'audit_internal_should_not_leak',
  'ai_raw_payload_should_not_leak',
  'rag_trace_should_not_leak',
  'vector_payload_should_not_leak',
  'billing_internal_should_not_leak',
  'settlement_internal_should_not_leak',
  'payment_internal_should_not_leak',
  'invoice_internal_should_not_leak',
  'debug_payload_should_not_leak',
  'token_should_not_leak',
  'password_should_not_leak',
  'secret_should_not_leak',
  'customer_phone_should_not_leak',
  'raw_phone_should_not_leak',
  'address_should_not_leak',
  'full_address_should_not_leak',
  'photo_should_not_leak',
  'signature_should_not_leak',
  'final_appointment_should_not_leak',
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

test('Task2281 static guard input files exist and this guard is text-only', () => {
  for (const file of Object.values(FILES)) {
    assert.equal(fs.existsSync(absolutePath(file)), true, `${file} should exist`);
  }

  const thisSource = fs.readFileSync(__filename, 'utf8');

  assert.doesNotMatch(thisSource, /require\(['"]\.\.\/\.\.\/src\//);
  assert.doesNotMatch(thisSource, /require\(['"]node:child_process['"]\)/);
  assert.doesNotMatch(thisSource, /require\(['"]pg['"]\)/);
});

test('assigned appointment detail handler keeps the authorized Task2280 presenter wiring', () => {
  const source = read(FILES.handler);
  const buildAllowEnvelopeBody = functionBody(source, 'buildAllowEnvelope');

  assertIncludesAll(source, [
    "require('./engineerMobileWorkbenchSafeEnvelopePresenter')",
    'presentEngineerMobileWorkbenchSafeEnvelope',
    'function buildAllowEnvelope(appointment)',
    'function eligibilityFromAppointment(appointment)',
  ], 'detail handler presenter wiring');
  assertIncludesAll(buildAllowEnvelopeBody, [
    'const safeAppointment = presentEngineerMobileWorkbenchSafeEnvelope({',
    'appointmentReference: appointment && appointment.appointmentId',
    'serviceStatus: appointment && appointment.status',
    'eligibility: eligibilityFromAppointment(appointment)',
    'createEngineerMobileWorkbenchSuccessEnvelope({',
    'messageKey: ALLOW_MESSAGE_KEY',
    'data: {',
    'appointment: safeAppointment',
  ], 'detail handler safe appointment output');
  assert.equal(
    /appointment\s*:\s*appointment\b/.test(buildAllowEnvelopeBody),
    false,
    'raw appointment object must not be returned directly under data.appointment',
  );
});

test('handler output preserves existing top-level envelope while nesting safe workbench detail', () => {
  const source = read(FILES.handler);
  const wiringTest = read(FILES.task2280WiringTest);

  assertIncludesAll(source, [
    'createEngineerMobileWorkbenchSuccessEnvelope',
    'createEngineerMobileWorkbenchDenyEnvelope',
    'SAFE_DENY_MESSAGE_KEY',
    'buildSafeDenyEnvelope()',
    'data: {',
  ], 'top-level workbench envelope construction');
  assertIncludesAll(wiringTest, [
    'assert.equal(result.status, \'allow\')',
    'assert.equal(result.messageKey, \'engineerMobile.assignedAppointmentDetail.available\')',
    'assert.equal(result.engineerMobileVisible, true)',
    'assertSafeWorkbenchEnvelope(result.data.appointment)',
    'missing denied and unavailable detail requests remain generic safe deny envelopes',
  ], 'Task2280 behavior evidence');
});

test('safe envelope output fields and no raw data pass-through remain guarded by Task2280 evidence', () => {
  const presenter = read(FILES.presenter);
  const wiringTest = read(FILES.task2280WiringTest);
  const task2280Doc = read(FILES.task2280Doc);

  assertIncludesAll(presenter, SAFE_WORKBENCH_FIELDS.map((field) => `${field}:`), 'presenter safe fields');
  assertIncludesAll(wiringTest, SAFE_WORKBENCH_FIELDS, 'wiring test safe fields');
  assertIncludesAll(task2280Doc, SAFE_WORKBENCH_FIELDS.map((field) => `\`${field}\``), 'Task2280 doc safe fields');
  assertIncludesAll(wiringTest, [
    'for (const key of Object.keys(value))',
    'SAFE_WORKBENCH_FIELDS.has(key)',
    'assert.equal(JSON.stringify(row), beforeRow)',
    'assert.equal(JSON.stringify(input), beforeInput)',
  ], 'Task2280 non-pass-through and immutability evidence');
});

test('unsafe leakage markers remain covered by the Task2280 wiring guard evidence', () => {
  const evidence = [
    read(FILES.task2280WiringTest),
    read(FILES.task2280Doc),
  ].join('\n');

  assertIncludesAll(evidence, UNSAFE_MARKERS, 'unsafe marker evidence');
  assertIncludesAll(evidence, [
    'rawCase',
    'rawAppointment',
    'completionReport',
    'fieldServiceReport',
    'rawDbRow',
    'providerPayload',
    'auditInternal',
    'aiRawPayload',
    'billingInternal',
    'finalAppointmentId',
  ], 'unsafe category evidence');
});

test('detail handler remains free of route DB provider AI billing env smoke and mutation behavior', () => {
  const source = read(FILES.handler);

  assertNoPattern(source, FORBIDDEN_RUNTIME_PATTERNS, 'detail handler');
  assertIncludesAll(source, [
    'repositoryReader(assignedAppointmentRepository)',
    'findAssignedAppointmentDetail',
    'projectEngineerMobileAssignedAppointmentDetail(row)',
  ], 'read-only detail handler flow');
});
