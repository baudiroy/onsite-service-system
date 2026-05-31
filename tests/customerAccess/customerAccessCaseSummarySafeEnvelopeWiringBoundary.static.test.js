'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const FILES = Object.freeze({
  controller: 'src/controllers/customerAccessController.js',
  presenter: 'src/customerAccess/customerAccessCaseSummarySafeEnvelopePresenter.js',
  wiringTest: 'tests/customerAccess/customerAccessCaseSummarySafeEnvelopeWiring.unit.test.js',
  controllerTest: 'tests/customerAccess/customerAccessController.unit.test.js',
  task2310: 'docs/task-2310-customer-access-case-summary-safe-envelope-runtime-wiring-no-db-no-smoke-no-provider.md',
  task2311: 'docs/task-2311-customer-access-case-summary-safe-envelope-wiring-static-boundary-guard-no-runtime-change-no-db-no-smoke-no-provider.md',
});

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function functionSource(source, functionName, nextFunctionName) {
  const start = source.indexOf(`function ${functionName}`);
  const end = nextFunctionName
    ? source.indexOf(`function ${nextFunctionName}`, start + 1)
    : -1;

  assert.notEqual(start, -1, `${functionName} should exist`);

  return source.slice(start, end === -1 ? undefined : end);
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

test('Task2311 static guard reads source test and doc files only', () => {
  for (const file of Object.values(FILES)) {
    assert.equal(fs.existsSync(path.join(repoRoot, file)), true, `${file} should exist`);
  }

  const self = read('tests/customerAccess/customerAccessCaseSummarySafeEnvelopeWiringBoundary.static.test.js');

  assert.deepEqual(requireSpecifiers(self).sort(), [
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:test',
  ].sort());
  assert.doesNotMatch(self, /require\('\.\.\/\.\.\/src|import\(/);
});

test('controller imports the case summary safe allow and deny presenter helpers', () => {
  const controller = read(FILES.controller);

  assert.match(controller, /customerAccessCaseSummarySafeEnvelopePresenter/);
  assert.match(controller, /buildCustomerAccessCaseSummarySafeEnvelope/);
  assert.match(controller, /buildCustomerAccessCaseSummarySafeDenyEnvelope/);
  assert.match(controller, /buildCustomerAccessCaseSummarySafeDenyEnvelope,\s*\n\s*buildCustomerAccessCaseSummarySafeEnvelope,/);
});

test('safe deny path uses the case summary deny helper while preserving generic unavailable shape', () => {
  const controller = read(FILES.controller);
  const safeDenyEnvelope = functionSource(
    controller,
    'safeDenyEnvelope',
    'isUnsafeDisplayString',
  );

  assert.match(safeDenyEnvelope, /buildCustomerAccessCaseSummarySafeDenyEnvelope\(\)/);
  assert.match(safeDenyEnvelope, /SAFE_DENY_ENVELOPE\.status/);
  assert.match(safeDenyEnvelope, /SAFE_DENY_ENVELOPE\.messageKey/);
  assert.match(safeDenyEnvelope, /SAFE_DENY_ENVELOPE\.customerVisible/);
  assert.match(safeDenyEnvelope, /SAFE_DENY_ENVELOPE\.data/);
  assert.match(safeDenyEnvelope, /error:\s*\{\s*messageKey:\s*SAFE_DENY_ENVELOPE\.error\.messageKey,\s*\}/);
  assert.match(controller, /messageKey: 'customerAccess\.unavailable'/);
});

test('allow path shapes facade serviceReport through the case summary safe presenter before returning', () => {
  const controller = read(FILES.controller);
  const allowlistedServiceReport = functionSource(
    controller,
    'allowlistedServiceReport',
    'safeAllowEnvelopeFromFacadeResult',
  );
  const safeAllowEnvelopeFromFacadeResult = functionSource(
    controller,
    'safeAllowEnvelopeFromFacadeResult',
    'safeEnvelopeFromFacadeResult',
  );
  const safeEnvelopeFromFacadeResult = functionSource(
    controller,
    'safeEnvelopeFromFacadeResult',
    'sanitizedCustomerAccessContextFromRequest',
  );

  assert.match(safeEnvelopeFromFacadeResult, /safeAllowEnvelopeFromFacadeResult\(facadeResult\)/);
  assert.match(safeAllowEnvelopeFromFacadeResult, /allowlistedServiceReport\(safeProperty\(data,\s*'serviceReport'\)\)/);
  assert.match(allowlistedServiceReport, /const caseSummaryInput = \{\};/);
  assert.match(allowlistedServiceReport, /buildCustomerAccessCaseSummarySafeEnvelope\(\{\s*caseSummary: caseSummaryInput,\s*\}\)/);
  assert.match(allowlistedServiceReport, /safeProperty\(caseSummaryData,\s*'caseSummary'\)/);
  assert.match(safeAllowEnvelopeFromFacadeResult, /data:\s*\{\s*serviceReport,\s*\}/);
  assert.doesNotMatch(safeAllowEnvelopeFromFacadeResult, /\.\.\.\s*(?:facadeResult|data|serviceReport|caseSummary|candidate|input|row|projection)/);
});

test('case summary output allowlist excludes finalAppointmentId and raw identifiers', () => {
  const controller = read(FILES.controller);
  const presenter = read(FILES.presenter);
  const wiringTest = read(FILES.wiringTest);
  const controllerTest = read(FILES.controllerTest);
  const allowlistedServiceReport = functionSource(
    controller,
    'allowlistedServiceReport',
    'safeAllowEnvelopeFromFacadeResult',
  );

  for (const key of [
    'CUSTOMER_VISIBLE_CASE_NO_SOURCE_KEY',
    'CUSTOMER_VISIBLE_PUBLIC_REPORT_ID_SOURCE_KEY',
    'CUSTOMER_VISIBLE_STATUS_SOURCE_KEY',
    'CUSTOMER_VISIBLE_SUMMARY_SOURCE_KEY',
  ]) {
    assert.match(allowlistedServiceReport, new RegExp(key), `${key} should be assigned`);
  }

  assert.doesNotMatch(allowlistedServiceReport, /CUSTOMER_VISIBLE_FINAL_APPOINTMENT_ID_SOURCE_KEY/);
  assert.match(presenter, /const CASE_SUMMARY_RESPONSE_KEYS = Object\.freeze\(\[/);

  for (const key of ['caseNo', 'publicReportId', 'status', 'summary']) {
    assert.match(presenter, new RegExp(`'${key}'`), `${key} should be presenter-allowlisted`);
  }

  assert.match(wiringTest, /includes\('finalAppointmentId'\), false/);
  assert.match(controllerTest, /response\.data\.serviceReport\.finalAppointmentId,\s*undefined/);
});

test('unsafe leakage coverage stays visible in wiring tests and task docs', () => {
  const evidence = [
    read(FILES.wiringTest),
    read(FILES.controllerTest),
    read(FILES.task2310),
    read(FILES.task2311),
  ].join('\n');

  for (const marker of [
    'raw Case',
    'rawAppointment',
    'Completion Report',
    'Field Service Report',
    'repository',
    'DB',
    'audit',
    'providerPayload',
    'AI/RAG',
    'OpenAI',
    'vector',
    'billing',
    'settlement',
    'payment',
    'invoice',
    'customer private',
    'fullAddress',
    'photo',
    'signature',
    'debug',
    'raw SQL',
    'token',
    'password',
    'secret',
  ]) {
    assert.match(evidence, new RegExp(marker, 'i'), `${marker} leakage coverage should stay visible`);
  }
});

test('controller boundary path does not add forbidden runtime dependency patterns', () => {
  const controller = read(FILES.controller);
  const presenter = read(FILES.presenter);
  const source = `${controller}\n${presenter}`;

  assert.doesNotMatch(source, /process\.env|DATABASE_URL|Zeabur|new Pool|createPool|\.query\s*\(|fetch\s*\(|axios|http\.request|https\.request|listen\s*\(|app\.listen|send(Line|Sms|SMS|Email|Webhook)|new OpenAI\(|create.*Rag|create.*Billing|create.*Settlement|create.*Payment|create.*Invoice/i);
});
