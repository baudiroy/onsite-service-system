'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const FILES = Object.freeze({
  handler: 'src/engineerMobile/engineerMobileAssignedAppointmentsHandler.js',
  presenter: 'src/engineerMobile/engineerMobileWorkbenchSafeEnvelopePresenter.js',
  task2283WiringTest: 'tests/engineerMobile/engineerMobileWorkbenchSafeEnvelopeListWiring.unit.test.js',
  task2283Doc: 'docs/task-2283-engineer-mobile-workbench-safe-envelope-list-runtime-wiring-no-db-no-smoke-no-provider.md',
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
  'raw_repository_row_should_not_leak',
  'select * from',
  'provider_payload_should_not_leak',
  'audit_internal_should_not_leak',
  'ai_raw_payload_should_not_leak',
  'rag_trace_should_not_leak',
  'openai_trace_should_not_leak',
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
  'contact_should_not_leak',
  'address_should_not_leak',
  'full_address_should_not_leak',
  'photo_should_not_leak',
  'signature_should_not_leak',
  'final_appointment_should_not_leak',
]);

const UNSAFE_CATEGORIES = Object.freeze([
  'Raw Case',
  'Appointment',
  'Completion Report',
  'Field Service Report',
  'raw DB/repository rows',
  'audit internals',
  'provider payloads',
  'AI/RAG/OpenAI/vector data',
  'billing/settlement/payment/invoice internals',
  'private customer contact/address/fullAddress/photo/signature data',
  '`finalAppointmentId`',
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

test('Task2284 static guard input files exist and this guard is text-only', () => {
  for (const file of Object.values(FILES)) {
    assert.equal(fs.existsSync(absolutePath(file)), true, `${file} should exist`);
  }

  const thisSource = fs.readFileSync(__filename, 'utf8');

  assert.doesNotMatch(thisSource, /require\(['"]\.\.\/\.\.\/src\//);
  assert.doesNotMatch(thisSource, /require\(['"]node:child_process['"]\)/);
  assert.doesNotMatch(thisSource, /require\(['"]pg['"]\)/);
});

test('assigned appointments list handler keeps the authorized Task2283 presenter wiring', () => {
  const source = read(FILES.handler);
  const buildAllowEnvelopeBody = functionBody(source, 'buildAllowEnvelope');
  const presentListAppointmentBody = functionBody(source, 'presentListAppointment');

  assertIncludesAll(source, [
    "require('./engineerMobileWorkbenchSafeEnvelopePresenter')",
    'presentEngineerMobileWorkbenchSafeEnvelope',
    'function buildAllowEnvelope(appointments)',
    'function presentListAppointment(appointment)',
    'function eligibilityFromAppointment(appointment)',
  ], 'list handler presenter wiring');
  assertIncludesAll(buildAllowEnvelopeBody, [
    'createEngineerMobileWorkbenchSuccessEnvelope({',
    'messageKey: ALLOW_MESSAGE_KEY',
    'data: {',
    'appointments: appointments.map(presentListAppointment)',
  ], 'list handler safe appointments output');
  assertIncludesAll(presentListAppointmentBody, [
    'presentEngineerMobileWorkbenchSafeEnvelope({',
    'ok: true',
    'status: \'available\'',
    'messageKey: ALLOW_MESSAGE_KEY',
    'appointmentReference: appointment && appointment.appointmentId',
    'serviceStatus: appointment && appointment.status',
    'eligibility: eligibilityFromAppointment(appointment)',
  ], 'list item safe presenter input');
});

test('raw appointment list items are not returned directly under data.appointments', () => {
  const source = read(FILES.handler);
  const buildAllowEnvelopeBody = functionBody(source, 'buildAllowEnvelope');

  assert.equal(
    /appointments\s*:\s*appointments\s*[,}]/.test(buildAllowEnvelopeBody),
    false,
    'raw appointments array must not be returned directly',
  );
  assert.equal(
    /appointments\s*:\s*appointments\.map\(\s*\(?\s*\w+\s*\)?\s*=>\s*\w+\s*\)/.test(buildAllowEnvelopeBody),
    false,
    'identity-mapped appointment/list/read-model items must not be returned directly',
  );
  assert.equal(
    /data\s*:\s*{\s*appointments\s*}/s.test(buildAllowEnvelopeBody),
    false,
    'shorthand raw appointments must not be returned directly',
  );
});

test('outer list envelope and empty deny behavior remain guarded by Task2283 evidence', () => {
  const source = read(FILES.handler);
  const wiringTest = read(FILES.task2283WiringTest);

  assertIncludesAll(source, [
    'createEngineerMobileWorkbenchSuccessEnvelope',
    'createEngineerMobileWorkbenchDenyEnvelope',
    'SAFE_DENY_MESSAGE_KEY',
    'buildSafeDenyEnvelope()',
    'data: {',
    'appointments: []',
  ], 'top-level list envelope construction');
  assertIncludesAll(wiringTest, [
    'assert.equal(result.status, \'allow\')',
    'assert.equal(result.messageKey, \'engineerMobile.assignedAppointments.available\')',
    'assert.equal(result.engineerMobileVisible, true)',
    'result.data.appointments.map((item) => item.appointmentReference)',
    'assert.deepEqual(emptyResult.data.appointments, [])',
    'denied unavailable and empty list behavior remains generic and safe',
    'messageKey: \'engineerMobile.assignedAppointments.unavailable\'',
    'appointments: []',
  ], 'Task2283 top-level and empty deny behavior evidence');
});

test('safe list item allowlist and non-mutation evidence remain covered', () => {
  const presenter = read(FILES.presenter);
  const wiringTest = read(FILES.task2283WiringTest);
  const task2283Doc = read(FILES.task2283Doc);

  assertIncludesAll(presenter, SAFE_WORKBENCH_FIELDS.map((field) => `${field}:`), 'presenter safe fields');
  assertIncludesAll(wiringTest, SAFE_WORKBENCH_FIELDS, 'Task2283 wiring test safe fields');
  assertIncludesAll(task2283Doc, SAFE_WORKBENCH_FIELDS.map((field) => `\`${field}\``), 'Task2283 doc safe fields');
  assertIncludesAll(wiringTest, [
    'for (const key of Object.keys(item))',
    'SAFE_WORKBENCH_FIELDS.has(key)',
    'Object.hasOwn(item, \'appointmentId\')',
    'Object.hasOwn(item, \'scheduledStart\')',
    'Object.hasOwn(item, \'scheduledEnd\')',
    'assert.equal(JSON.stringify(rows), beforeRows)',
    'assert.equal(JSON.stringify(filters), beforeFilters)',
  ], 'Task2283 non-pass-through and immutability evidence');
});

test('unsafe leakage markers remain covered by Task2283 wiring guard evidence', () => {
  const evidence = [
    read(FILES.task2283WiringTest),
    read(FILES.task2283Doc),
  ].join('\n');

  assertIncludesAll(evidence, UNSAFE_MARKERS, 'unsafe marker evidence');
  assertIncludesAll(evidence, UNSAFE_CATEGORIES, 'unsafe category evidence');
});

test('list handler remains free of route DB provider AI billing env smoke and mutation behavior', () => {
  const source = read(FILES.handler);

  assertNoPattern(source, FORBIDDEN_RUNTIME_PATTERNS, 'list handler');
  assertIncludesAll(source, [
    'repositoryReader(assignedAppointmentRepository)',
    'findAssignedAppointments',
    'projectEngineerMobileAssignedAppointmentListItem',
    '.filter((row) => rowMatchesScope(row, { organizationId, engineerUserId }))',
    '.map(projectEngineerMobileAssignedAppointmentListItem)',
  ], 'read-only list handler flow');
});
