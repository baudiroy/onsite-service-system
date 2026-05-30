'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const FILES = Object.freeze({
  presenter: 'src/engineerMobile/engineerMobileWorkbenchSafeEnvelopePresenter.js',
  task2269Doc: 'docs/task-2269-engineer-mobile-safe-workbench-envelope-pure-helper-no-route-no-db-no-smoke-no-provider.md',
  unitTest: 'tests/engineerMobile/engineerMobileWorkbenchSafeEnvelopePresenter.unit.test.js',
});

const TOP_LEVEL_OUTPUT_FIELDS = Object.freeze([
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

const ELIGIBILITY_FIELDS = Object.freeze([
  'canOpenDetails',
  'canPrepareCompletionDraft',
  'canRecordArrival',
  'canRecordVisitResult',
  'canStartTravel',
  'canStartWork',
  'canFinishWork',
]);

const ACTION_FIELDS = Object.freeze([
  'key',
  'label',
  'enabled',
  'reasonCode',
  'messageKey',
]);

const FORBIDDEN_DEPENDENCY_PATTERNS = Object.freeze([
  /require\(/,
  /\bimport\s+/,
  /process\.env/,
  /\bdbClient\b/,
  /\.query\s*\(/,
  /\bsql`/,
  /\bpsql\b/i,
  /db:migrate/i,
  /repositories?/i,
  /\bcreateServer\b/,
  /\blisten\s*\(/,
  /\bregisterRoute\b/,
  /\brouter\./,
  /\bapp\./,
  /\bserver\b/i,
  /sendLine|sendSms|sendEmail|sendWebhook|dispatchPush/i,
  /providerPayload|providerRawPayload|providerDebug/,
  /openai|rag|vector(?:Db|Database)?/i,
  /billing|settlement|payment|invoice/i,
  /zeabur|DATABASE_URL|credential|secretRuntime|runtimeConfig/i,
]);

const FORBIDDEN_OUTPUT_PATTERNS = Object.freeze([
  /\brawCase\b/,
  /\brawAppointment\b/,
  /\bcompletionReport\b/,
  /\bfieldServiceReport\b/,
  /\brawDbRow\b/,
  /\bdbRows\b/,
  /\bauditActor\b/,
  /\bauditContext\b/,
  /\bauditWriter\b/,
  /\bproviderPayload\b/,
  /\blineUserId\b/,
  /\bsms\b/i,
  /\bemail\b/i,
  /\bwebhook\b/i,
  /\bfinalAppointmentId\b/,
  /\bactorId\b/,
  /\buserId\b/,
  /\bassignedEngineerId\b/,
  /\bengineerId\b/,
  /\borganizationId\b/,
  /\bfullAddress\b/,
  /\bsignature\b/,
  /\bphoto\b/,
  /\bdebugPayload\b/,
  /\brawSql\b/,
  /\bpassword\b/,
  /\bsecret\b/,
  /\btoken\b/,
]);

const UNIT_SENTINELS = Object.freeze([
  'raw_case_should_not_leak',
  'raw_appointment_should_not_leak',
  'raw_completion_report_should_not_leak',
  'raw_field_service_report_should_not_leak',
  'raw_db_row_should_not_leak',
  'raw_audit_actor_should_not_leak',
  'raw_audit_context_should_not_leak',
  'raw_provider_payload_should_not_leak',
  'raw_ai_payload_should_not_leak',
  'raw_billing_should_not_leak',
  'final_appointment_should_not_leak',
  'org_internal_should_not_leak',
  'eng_internal_should_not_leak',
  'raw_phone_should_not_leak',
  'raw_address_should_not_leak',
  'debug_should_not_leak',
  'select * from',
  'token_should_not_leak',
  'password_should_not_leak',
  'secret_should_not_leak',
]);

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function quotedStrings(source) {
  return Array.from(source.matchAll(/'([^']+)'/g), (match) => match[1]);
}

function constArray(source, name) {
  const match = source.match(new RegExp(`const ${name} = Object\\.freeze\\(\\[([\\s\\S]*?)\\]\\);`));

  assert.ok(match, `missing ${name}`);

  return quotedStrings(match[1]);
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

test('Task2270 boundary guard input files exist and this guard is source text only', () => {
  for (const file of Object.values(FILES)) {
    assert.equal(fs.existsSync(path.join(repoRoot, file)), true, `${file} should exist`);
  }

  const thisSource = fs.readFileSync(__filename, 'utf8');

  assert.doesNotMatch(thisSource, /require\(['"]\.\.\/\.\.\/src\//);
  assert.doesNotMatch(thisSource, /require\(['"]node:child_process['"]\)/);
});

test('presenter exports the accepted pure helper contract markers', () => {
  const source = read(FILES.presenter);

  assertIncludesAll(source, [
    "const ENGINEER_MOBILE_WORKBENCH_SAFE_ENVELOPE_PRESENTER_KIND = 'engineer_mobile.workbench_safe_envelope_presenter'",
    'function presentEngineerMobileWorkbenchSafeEnvelope(input = {})',
    'module.exports = {',
    'ENGINEER_MOBILE_WORKBENCH_SAFE_ENVELOPE_PRESENTER_KIND',
    'presentEngineerMobileWorkbenchSafeEnvelope',
  ], 'presenter export contract');
});

test('presenter top-level engineer-facing envelope allowlist remains explicit', () => {
  const source = read(FILES.presenter);
  const presenterBody = functionBody(source, 'presentEngineerMobileWorkbenchSafeEnvelope');
  const unitTest = read(FILES.unitTest);
  const doc = read(FILES.task2269Doc);

  for (const field of TOP_LEVEL_OUTPUT_FIELDS) {
    assert.equal(presenterBody.includes(`${field}:`), true, `presenter output missing ${field}`);
    assert.equal(unitTest.includes(`'${field}'`) || unitTest.includes(`${field}:`), true, `unit test missing ${field}`);
    assert.equal(doc.includes(`\`${field}\``), true, `doc missing ${field}`);
  }

  assertNoPattern(presenterBody, [
    /\.\.\.\s*(source|input|projection|workOrder|assignment)\b/,
    /Object\.assign\(/,
    /return\s+(source|input|projection|workOrder|assignment)\b/,
  ], 'presenter output construction');
});

test('eligibility and actions remain allowlisted and display-oriented', () => {
  const source = read(FILES.presenter);
  const unitTest = read(FILES.unitTest);
  const eligibilityFields = constArray(source, 'ELIGIBILITY_FIELDS');
  const actionFields = constArray(source, 'ACTION_FIELDS');
  const safeEligibilityBody = functionBody(source, 'safeEligibility');
  const safeActionBody = functionBody(source, 'safeAction');

  assert.deepEqual(eligibilityFields, ELIGIBILITY_FIELDS);
  assert.deepEqual(actionFields, ACTION_FIELDS);
  assertIncludesAll(safeEligibilityBody, [
    'for (const field of ELIGIBILITY_FIELDS)',
    'safe[field] = eligibility[field] === true',
    'safeCode(eligibility.reasonCode)',
    'safeCode(eligibility.messageKey)',
  ], 'eligibility allowlist');
  assertIncludesAll(safeActionBody, [
    'for (const field of ACTION_FIELDS)',
    "field === 'enabled'",
    "field === 'key' || field === 'reasonCode' || field === 'messageKey'",
    'return compacted.key ? compacted : undefined',
  ], 'action allowlist');
  assertIncludesAll(unitTest, [
    'eligibility and actions are allowlisted and display-oriented only',
    'transition_writer_should_not_leak',
    'raw_state_should_not_leak',
    'Missing key is dropped',
  ], 'unit action eligibility coverage');
});

test('generic unavailable deny envelope remains safe and non-mutating behavior is covered', () => {
  const source = read(FILES.presenter);
  const unitTest = read(FILES.unitTest);
  const isUnavailableBody = functionBody(source, 'isUnavailable');
  const unavailableBody = functionBody(source, 'presentUnavailable');

  assertIncludesAll(isUnavailableBody, [
    '!isObject(source)',
    'Object.keys(source).length === 0',
    "status === 'deny'",
    "status === 'unavailable'",
    "status === 'error'",
  ], 'unavailable decision');
  assertIncludesAll(unavailableBody, [
    'ok: false',
    "status: safeStatus(safeSource.status, 'unavailable')",
    'DEFAULT_UNAVAILABLE_MESSAGE_KEY',
    'actions: []',
    "appointmentReference: safeReference(safeSource, ['appointmentReference', 'appointmentId'])",
  ], 'safe unavailable envelope');
  assertIncludesAll(unitTest, [
    'deny unavailable and missing input produce generic safe envelope',
    'presenter returns a new object and does not mutate input',
    'structuredClone(projection)',
    'assert.deepEqual(projection, before)',
  ], 'deny and immutability unit coverage');
});

test('presenter remains isolated from runtime DB provider AI billing env and route dependencies', () => {
  const source = read(FILES.presenter);

  assertNoPattern(source, FORBIDDEN_DEPENDENCY_PATTERNS, 'presenter source');
});

test('raw private internal fields are denied or absent from output construction', () => {
  const source = read(FILES.presenter);
  const presenterBody = functionBody(source, 'presentEngineerMobileWorkbenchSafeEnvelope');
  const unavailableBody = functionBody(source, 'presentUnavailable');
  const customerBody = functionBody(source, 'safeCustomerDisplay');
  const locationBody = functionBody(source, 'safeLocationSummary');
  const workOrderBody = functionBody(source, 'safeWorkOrderSummary');
  const outputConstruction = [
    presenterBody,
    unavailableBody,
    customerBody,
    locationBody,
    workOrderBody,
  ].join('\n');

  assertIncludesAll(source, [
    'const UNSAFE_VALUE_PATTERNS = Object.freeze',
    '/authorization/i',
    '/password/i',
    '/raw[_-]/i',
    '/secret/i',
    '/select\\s+\\*/i',
    '/should_not_leak/i',
    '/token/i',
  ], 'unsafe value pattern list');
  assertIncludesAll(customerBody, [
    'phoneMasked',
    'customerPhoneMasked',
  ], 'customer display masked contact');
  assertIncludesAll(locationBody, [
    'addressSummary',
    'locationLabel',
  ], 'location summary allowlist');
  assertNoPattern(outputConstruction, FORBIDDEN_OUTPUT_PATTERNS, 'safe envelope output construction');
});

test('unit tests and task doc preserve non-exposure sentinel and no-runtime evidence', () => {
  const unitTest = read(FILES.unitTest);
  const doc = read(FILES.task2269Doc);

  for (const sentinel of UNIT_SENTINELS) {
    assert.equal(unitTest.includes(sentinel), true, `unit test missing sentinel ${sentinel}`);
  }

  assertIncludesAll(unitTest, [
    'output allowlist excludes raw private system provider AI billing and debug fields',
    'assertNoForbiddenLeak(envelope)',
    'presenter source stays pure and isolated from runtime boundaries',
    'source.includes(forbidden), false',
  ], 'unit non-exposure evidence');
  assertIncludesAll(doc, [
    'pure Engineer Mobile Workbench safe envelope presenter',
    'does not wire the helper into routes',
    'explicit approved fields',
    'Eligibility and actions are allowlisted and display-oriented only',
    'No route/runtime wiring was added',
    'The same 7 held historical docs remain untracked and untouched',
  ], 'Task2269 doc no-runtime evidence');
});
