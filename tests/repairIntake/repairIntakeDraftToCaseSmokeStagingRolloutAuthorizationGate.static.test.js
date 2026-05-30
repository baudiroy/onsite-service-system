'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const ROUTE_SOURCE_PATH = 'src/routes/repairIntakeDraftToCase.routes.js';
const TASK2211_DOC_PATH = 'docs/task-2211-repair-intake-draft-to-case-route-mount-readiness-inventory-no-runtime-change-no-db-no-smoke-no-provider.md';
const TASK2212_DOC_PATH = 'docs/task-2212-repair-intake-draft-to-case-production-route-exposure-decision-gate-no-runtime-change-no-db-no-smoke-no-provider.md';
const TASK2222_DOC_PATH = 'docs/task-2222-repair-intake-draft-to-case-production-auth-session-readiness-decision-gate-no-runtime-change-no-db-no-smoke-no-provider.md';
const TASK2223_DOC_PATH = 'docs/task-2223-repair-intake-draft-to-case-rate-limit-payload-size-readiness-decision-gate-no-runtime-change-no-db-no-smoke-no-provider.md';
const TASK2224_DOC_PATH = 'docs/task-2224-repair-intake-draft-to-case-smoke-staging-rollout-authorization-gate-no-runtime-change-no-db-no-smoke-no-provider.md';
const TASK2224_TEST_PATH = 'tests/repairIntake/repairIntakeDraftToCaseSmokeStagingRolloutAuthorizationGate.static.test.js';

const PUBLIC_ROUTE_MARKERS = Object.freeze([
  '/public',
  '/open',
  '/customer',
  '/intake/open',
  '/repair-intake/open',
  'public.routes',
  'openRepairIntake',
  'customerAccess',
  'customer-access',
]);

const ALLOWED_TEST_IMPORTS = Object.freeze([
  'node:assert/strict',
  'node:fs',
  'node:path',
  'node:test',
]);

const RUNTIME_COMMAND_IMPORT_PATTERNS = Object.freeze([
  /^axios$/i,
  /^supertest$/i,
  /^node-fetch$/i,
  /^undici$/i,
  /^child_process$/,
  /^execa$/i,
  /(?:^|\/)(?:server|app|runtime|smoke|deploy|zeabur|providers?|line|sms|email|webhooks?|db|database|migrations?)(?:$|\/)/i,
]);

const RUNTIME_COMMAND_PATTERNS = Object.freeze([
  new RegExp('/hea' + 'lthz', 'i'),
  new RegExp('\\bapp\\.lis' + 'ten\\s*\\('),
  new RegExp('\\bserver\\.lis' + 'ten\\s*\\('),
  new RegExp('\\blis' + 'ten\\s*\\('),
  new RegExp('\\bfet' + 'ch\\s*\\('),
  new RegExp('\\bax' + 'ios\\.'),
  new RegExp('\\bcu' + 'rl\\s+'),
  new RegExp('\\bsuper' + 'test\\s*\\('),
  new RegExp('\\bexec(?:File)?\\s*\\('),
  new RegExp('\\bspawn\\s*\\('),
  new RegExp('\\bps' + 'ql\\s+'),
  new RegExp('\\bdb:mig' + 'rate\\s+', 'i'),
  new RegExp('\\bsend' + '(?:Line|Sms|Email|Webhook)\\b'),
  new RegExp('\\bweb' + 'hookClient\\.'),
]);

function projectPath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(projectPath(relativePath), 'utf8');
}

function requireSpecifiers(source) {
  return Array.from(source.matchAll(/require\(\s*['"]([^'"]+)['"]\s*\)/g), (match) => match[1]);
}

function stripRuntimePatternBlock(source) {
  const marker = 'const RUNTIME_COMMAND_PATTERNS = Object.freeze([';
  const start = source.indexOf(marker);

  if (start === -1) {
    return source;
  }

  const end = source.indexOf(']);', start);

  assert.notEqual(end, -1, 'unterminated runtime pattern block');

  return `${source.slice(0, start)}${source.slice(end + 3)}`;
}

function assertIncludesAll(source, markers, label) {
  for (const marker of markers) {
    assert.equal(source.includes(marker), true, `${label} missing marker ${marker}`);
  }
}

function assertExcludesAll(source, markers, label) {
  for (const marker of markers) {
    assert.equal(source.includes(marker), false, `${label} contains marker ${marker}`);
  }
}

function assertDoesNotMatchAny(source, patterns, label) {
  for (const pattern of patterns) {
    assert.doesNotMatch(source, pattern, `${label} should not contain ${pattern}`);
  }
}

test('Task2224 static guard reads current rollout authorization inputs only', () => {
  for (const relativePath of [
    ROUTE_SOURCE_PATH,
    TASK2211_DOC_PATH,
    TASK2212_DOC_PATH,
    TASK2222_DOC_PATH,
    TASK2223_DOC_PATH,
    TASK2224_DOC_PATH,
    TASK2224_TEST_PATH,
  ]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }
});

test('draft-to-case route remains admin scoped permission gated and not public/open/customer', () => {
  const routeSource = read(ROUTE_SOURCE_PATH);

  assertIncludesAll(routeSource, [
    "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_BASE_PATH = '/api/v1/admin'",
    "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH = '/api/v1/admin/repair-intake/drafts/:draftId/case/submit'",
    "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION = 'cases.create'",
    'requirePermission(REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION)',
    "method: 'POST'",
    'registerRepairIntakeDraftToCaseAdminRoutes',
  ], 'admin route rollout boundary');
  assertExcludesAll(routeSource, PUBLIC_ROUTE_MARKERS, 'draft-to-case route source');
});

test('Task2224 static guard imports only source-reading Node core modules', () => {
  const testSource = read(TASK2224_TEST_PATH);

  assert.deepEqual(requireSpecifiers(testSource), ALLOWED_TEST_IMPORTS);
  assertIncludesAll(testSource, [
    'fs.readFileSync(projectPath(relativePath), \'utf8\')',
    'fs.existsSync(projectPath(relativePath))',
  ], 'Task2224 source-reading guard');

  for (const specifier of requireSpecifiers(testSource)) {
    for (const pattern of RUNTIME_COMMAND_IMPORT_PATTERNS) {
      assert.doesNotMatch(specifier, pattern, `Task2224 guard must not import runtime/probe module ${specifier}`);
    }
  }
});

test('Task2224 static guard source contains no executable runtime probe deploy DB env or provider calls', () => {
  const testSource = stripRuntimePatternBlock(read(TASK2224_TEST_PATH));

  assertDoesNotMatchAny(testSource, RUNTIME_COMMAND_PATTERNS, 'Task2224 static guard source');
});

test('Task2224 doc records rollout validation as future non-authorized work', () => {
  const doc = read(TASK2224_DOC_PATH);

  for (const marker of [
    'Current route remains admin/injected-only',
    'Current route remains permission-gated by `requirePermission` / `cases.create`',
    'No public/open/customer route expansion is authorized by this task',
    'Task2224 does not authorize smoke tests, endpoint probes, server/listener startup',
    'Zeabur/env/secrets inspection',
    'Any future smoke/staging/prod validation requires a separate exact PM-authorized task',
    'target environment, allowed endpoints, auth/session source, fixture data, expected safe envelopes, rollback plan, and stop conditions',
    'Local synthetic-only vs staging vs production target',
    'Endpoint path and method',
    'Auth/session/permission source',
    'Organization/tenant fixture and draft id fixture',
    'DB/repository readiness and migration status',
    'Audit persistence expectation',
    'Provider/notification non-goals',
    'Rate limiting/payload size policy status',
    'Safe response assertions',
    'Rollback/stop conditions',
  ]) {
    assert.equal(doc.includes(marker), true, `Task2224 doc missing marker ${marker}`);
  }
});

test('prior decision docs keep rollout and exposure behind explicit PM authorization', () => {
  const task2211 = read(TASK2211_DOC_PATH);
  const task2212 = read(TASK2212_DOC_PATH);
  const task2222 = read(TASK2222_DOC_PATH);
  const task2223 = read(TASK2223_DOC_PATH);

  assertIncludesAll(task2211, [
    'PM must explicitly decide whether Repair Intake draft-to-case remains admin/injected-only or becomes any public/open intake path',
    'Smoke, staging, and production rollout plans require separate explicit authorization',
  ], 'Task2211 rollout inventory');
  assertIncludesAll(task2212, [
    'Any future public/open route exposure requires a separate exact PM-authorized task',
    'Smoke, staging, and production rollout authorization',
  ], 'Task2212 exposure gate');
  assertIncludesAll(task2222, [
    'Staging/smoke/production rollout authorization',
    'Task2222 does not authorize Task2223',
  ], 'Task2222 auth/session gate');
  assertIncludesAll(task2223, [
    'Staging/smoke/production rollout authorization',
    'Task2223 does not authorize Task2224',
  ], 'Task2223 rate/payload gate');
});
