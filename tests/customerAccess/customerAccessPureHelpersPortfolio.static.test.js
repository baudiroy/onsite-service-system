'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const FILES = Object.freeze({
  presenter: 'src/customerAccess/customerServiceReportSafeEnvelopePresenter.js',
  resolverDecisionHelper: 'src/customerAccess/customerAccessResolverDecisionHelper.js',
  presenterUnit: 'tests/customerAccess/customerServiceReportSafeEnvelopePresenter.unit.test.js',
  resolverDecisionUnit: 'tests/customerAccess/customerAccessResolverDecisionHelper.unit.test.js',
  presenterBoundary: 'tests/customerAccess/customerServiceReportSafeEnvelopePresenterBoundary.static.test.js',
  resolverDecisionBoundary: 'tests/customerAccess/customerAccessResolverDecisionHelperBoundary.static.test.js',
  task2252: 'docs/task-2252-customer-access-safe-report-envelope-pure-helper-no-route-no-db-no-smoke-no-provider.md',
  task2253: 'docs/task-2253-customer-access-safe-report-envelope-presenter-static-boundary-guard-no-runtime-change-no-db-no-smoke-no-provider.md',
  task2254: 'docs/task-2254-customer-access-safe-report-envelope-branch-checkpoint-no-runtime-change-no-db-no-smoke-no-provider.md',
  task2258: 'docs/task-2258-customer-access-context-source-boundary-branch-checkpoint-no-runtime-change-no-db-no-smoke-no-provider.md',
  task2259: 'docs/task-2259-customer-access-pure-resolver-decision-helper-no-route-no-db-no-smoke-no-provider.md',
  task2260: 'docs/task-2260-customer-access-resolver-decision-helper-static-boundary-guard-no-runtime-change-no-db-no-smoke-no-provider.md',
  task2261: 'docs/task-2261-customer-access-resolver-decision-helper-branch-checkpoint-no-runtime-change-no-db-no-smoke-no-provider.md',
});

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function objectFreezeArray(source, constantName) {
  const match = source.match(new RegExp(`${constantName} = Object\\.freeze\\(\\[([\\s\\S]*?)\\]\\);`));

  assert.ok(match, `${constantName} should be declared as an Object.freeze array`);

  return [...match[1].matchAll(/'([^']+)'/g)].map((item) => item[1]);
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

function functionSource(source, functionName, nextFunctionName) {
  const start = source.indexOf(`function ${functionName}`);
  const end = nextFunctionName
    ? source.indexOf(`function ${nextFunctionName}`, start + 1)
    : -1;

  assert.notEqual(start, -1, `${functionName} should exist`);

  return source.slice(start, end === -1 ? undefined : end);
}

function assertContainsAll(source, patterns, label) {
  for (const pattern of patterns) {
    assert.match(source, pattern, label);
  }
}

function customerAccessSourceFiles() {
  const sourceDir = path.join(repoRoot, 'src/customerAccess');

  return fs.readdirSync(sourceDir)
    .filter((file) => file.endsWith('.js'))
    .map((file) => `src/customerAccess/${file}`)
    .filter((file) => ![
      FILES.presenter,
      FILES.resolverDecisionHelper,
    ].includes(file));
}

test('Task2262 portfolio guard source test doc and pure helper files exist', () => {
  for (const file of Object.values(FILES)) {
    assert.equal(fs.existsSync(path.join(repoRoot, file)), true, `${file} should exist`);
  }
});

test('pure helpers stay dependency-free and do not reference runtime integration modules', () => {
  const presenter = read(FILES.presenter);
  const resolverDecisionHelper = read(FILES.resolverDecisionHelper);

  for (const [label, source] of [
    ['safe envelope presenter', presenter],
    ['resolver decision helper', resolverDecisionHelper],
  ]) {
    assert.deepEqual(requireSpecifiers(source), [], `${label} should not require modules`);
    assert.doesNotMatch(source, /import\s+/, `${label} should not import modules`);
    assert.doesNotMatch(source, /\broutes?\b|\bcontrollers?\b|\bhandlers?\b|\bDTO\b|app\.|\bserver\b|listen\(|express|Router/i, label);
    assert.doesNotMatch(source, /pg\b|knex|sequelize|prisma|mysql|sqlite|repository|Repository|dbClient|query\(|transaction/i, label);
    assert.doesNotMatch(source, /providerPayload|provider|LINE|SMS|email|webhook|push|axios|fetch\(|http\.request|https\.request/i, label);
    assert.doesNotMatch(source, /OpenAI|AI\/RAG|RAG|vector|embedding|model/i, label);
    assert.doesNotMatch(source, /billing|settlement|payment|invoice/i, label);
    assert.doesNotMatch(source, /process\.env|DATABASE_URL|Zeabur|credential|config/i, label);
  }
});

test('pure helpers export only the expected public helper functions', () => {
  const presenter = read(FILES.presenter);
  const resolverDecisionHelper = read(FILES.resolverDecisionHelper);

  assert.match(presenter, /function buildCustomerServiceReportSafeEnvelope\(input\)/);
  assert.match(presenter, /function buildCustomerServiceReportSafeDenyEnvelope\(\)/);
  assert.match(presenter, /module\.exports = \{\s*buildCustomerServiceReportSafeDenyEnvelope,\s*buildCustomerServiceReportSafeEnvelope,\s*\};/);

  assert.match(resolverDecisionHelper, /function buildCustomerAccessResolverDecision\(input\)/);
  assert.match(resolverDecisionHelper, /function buildCustomerAccessResolverDenyDecision\(\)/);
  assert.match(resolverDecisionHelper, /module\.exports = \{\s*buildCustomerAccessResolverDecision,\s*buildCustomerAccessResolverDenyDecision,\s*\};/);
});

test('safe envelope presenter keeps explicit customer-facing envelope shape and generic unavailable deny', () => {
  const presenter = read(FILES.presenter);

  assert.deepEqual(objectFreezeArray(presenter, 'SERVICE_REPORT_RESPONSE_KEYS'), [
    'customerReportReference',
    'caseReference',
    'serviceStatus',
    'appointmentWindow',
    'engineerDisplayName',
    'serviceSummary',
    'completionTime',
  ]);
  assert.deepEqual(objectFreezeArray(presenter, 'PUBLIC_ATTACHMENT_RESPONSE_KEYS'), [
    'attachmentId',
    'label',
    'mimeType',
  ]);
  assertContainsAll(functionSource(presenter, 'buildCustomerServiceReportSafeDenyEnvelope', 'projectionSource'), [
    /ok:\s*false/,
    /status:\s*'deny'/,
    /messageKey:\s*DENY_MESSAGE_KEY/,
  ], FILES.presenter);
  assertContainsAll(functionSource(presenter, 'buildCustomerServiceReportSafeEnvelope'), [
    /ok:\s*true/,
    /status:\s*'allow'/,
    /messageKey:\s*ALLOW_MESSAGE_KEY/,
    /envelope\[key\] = value/,
    /envelope\.publicAttachments = publicAttachments/,
  ], FILES.presenter);
  assert.match(presenter, /const DENY_MESSAGE_KEY = 'customerAccess\.unavailable';/);
});

test('resolver decision helper keeps explicit customer-facing decision shape and generic unavailable deny', () => {
  const resolverDecisionHelper = read(FILES.resolverDecisionHelper);

  assert.deepEqual(objectFreezeArray(resolverDecisionHelper, 'PROJECTION_KEYS'), [
    'customerReportReference',
    'caseReference',
    'serviceStatus',
    'appointmentWindow',
    'engineerDisplayName',
    'serviceSummary',
    'completionTime',
  ]);
  assert.deepEqual(objectFreezeArray(resolverDecisionHelper, 'PUBLIC_ATTACHMENT_KEYS'), [
    'attachmentId',
    'label',
    'mimeType',
  ]);
  assertContainsAll(functionSource(resolverDecisionHelper, 'buildCustomerAccessResolverDenyDecision', 'normalizedContext'), [
    /allowed:\s*false/,
    /status:\s*'deny'/,
    /messageKey:\s*DENY_MESSAGE_KEY/,
  ], FILES.resolverDecisionHelper);
  assertContainsAll(functionSource(resolverDecisionHelper, 'buildCustomerAccessResolverDecision'), [
    /allowed:\s*true/,
    /status:\s*'allow'/,
    /messageKey:\s*ALLOW_MESSAGE_KEY/,
    /projection,/,
  ], FILES.resolverDecisionHelper);
  assert.match(resolverDecisionHelper, /const DENY_MESSAGE_KEY = 'customerAccess\.unavailable';/);
});

test('helper unit and boundary tests keep raw private internal non-exposure and immutability coverage visible', () => {
  const presenterUnit = read(FILES.presenterUnit);
  const resolverDecisionUnit = read(FILES.resolverDecisionUnit);
  const presenterBoundary = read(FILES.presenterBoundary);
  const resolverDecisionBoundary = read(FILES.resolverDecisionBoundary);

  for (const [label, source] of [
    ['presenter unit', presenterUnit],
    ['resolver decision unit', resolverDecisionUnit],
  ]) {
    for (const marker of [
      'raw_case_should_not_leak',
      'raw_appointment_should_not_leak',
      'raw_completion_should_not_leak',
      'raw_fsr_should_not_leak',
      'repository_row_should_not_leak',
      'db_row_should_not_leak',
      'provider_payload_should_not_leak',
      'line_user_should_not_leak',
      'ai_raw_should_not_leak',
      'rag_result_should_not_leak',
      'billing_internal_should_not_leak',
      'settlement_internal_should_not_leak',
      'payment_should_not_leak',
      'invoice_should_not_leak',
      'debug_should_not_leak',
      'token_should_not_leak',
      'password_should_not_leak',
      'secret_should_not_leak',
    ]) {
      assert.match(source, new RegExp(marker), `${label} should keep ${marker}`);
    }
  }

  assert.match(presenterUnit, /input projection and attachments are not mutated/);
  assert.match(resolverDecisionUnit, /input context projection and attachments are not mutated/);
  assert.match(presenterBoundary, /unit tests keep raw private system internal sentinels and immutability coverage visible/);
  assert.match(resolverDecisionBoundary, /unit coverage keeps internal raw private system provider AI billing and debug sentinels visible/);
  assert.match(resolverDecisionBoundary, /helper copies output into new allowlisted objects and unit tests keep immutability coverage/);
});

test('current runtime source files do not import or call either pure helper yet', () => {
  const helperImportPatterns = [
    /customerServiceReportSafeEnvelopePresenter/,
    /customerAccessResolverDecisionHelper/,
    /buildCustomerServiceReportSafeEnvelope/,
    /buildCustomerServiceReportSafeDenyEnvelope/,
    /buildCustomerAccessResolverDecision/,
    /buildCustomerAccessResolverDenyDecision/,
  ];

  for (const file of customerAccessSourceFiles()) {
    const source = read(file);

    for (const pattern of helperImportPatterns) {
      assert.doesNotMatch(source, pattern, `${file} should not import or call pure helpers yet`);
    }
  }
});

test('docs keep pure helper portfolio unwired and non-authorized before future runtime work', () => {
  const task2252 = read(FILES.task2252);
  const task2254 = read(FILES.task2254);
  const task2258 = read(FILES.task2258);
  const task2259 = read(FILES.task2259);
  const task2260 = read(FILES.task2260);
  const task2261 = read(FILES.task2261);

  assert.match(task2252, /does not wire the helper into routes, resolvers, handlers, repositories, DB, providers, smoke, app\/server, or runtime paths/);
  assert.match(task2254, /The helper is not wired into any route, resolver, handler, DTO, repository, app\/server, or runtime path/);
  assert.match(task2258, /No safe envelope helper runtime wiring is authorized/);
  assert.match(task2259, /does not wire the helper into routes, resolvers, handlers, repositories, DTOs, app\/server, DB, providers, smoke, or runtime paths/);
  assert.match(task2260, /No runtime\/source behavior changed/);
  assert.match(task2261, /No resolver decision helper runtime wiring is authorized/);
  assert.match(task2261, /No safe envelope helper runtime wiring is authorized/);

  const nonAuthorizedDocs = [
    task2258,
    task2261,
  ].join('\n');

  for (const marker of [
    'No Customer Access route/API/DTO/projection/resolver behavior change is authorized',
    'No DB, repository, audit persistence',
    'No route mount, open/public route behavior',
    'No provider sending',
    'auth/session middleware',
    'rate-limit',
    'package dependency',
  ]) {
    assert.match(nonAuthorizedDocs, new RegExp(marker), `${marker} should remain documented`);
  }
});
