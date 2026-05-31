'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const TASK2314_DOC_PATH = 'docs/task-2314-repair-intake-draft-to-case-db-backed-runtime-implementation-authorization-packet-no-db-execution-no-migration-no-smoke-no-provider.md';
const ROUTE_SOURCE_PATH = 'src/routes/repairIntakeDraftToCase.routes.js';
const OPEN_REPAIR_INTAKE_SOURCE_DIR = 'src/openRepairIntake';
const OPEN_REPAIR_INTAKE_TEST_DIR = 'tests/openRepairIntake';
const CONTROLLERS_DIR = 'src/controllers';

const REQUIRED_GATE_DOCS = Object.freeze([
  'docs/task-2217-repair-intake-draft-to-case-audit-persistence-decision-gate-no-runtime-change-no-db-no-smoke-no-provider.md',
  'docs/task-2218-repair-intake-draft-to-case-db-repository-transaction-boundary-decision-gate-no-runtime-change-no-db-no-smoke-no-provider.md',
  'docs/task-2219-repair-intake-draft-to-case-db-runtime-port-contract-inventory-no-runtime-change-no-db-no-smoke-no-provider.md',
  'docs/task-2220-repair-intake-draft-to-case-db-runtime-port-contract-static-boundary-guard-no-runtime-change-no-db-no-smoke-no-provider.md',
  'docs/task-2221-repair-intake-draft-to-case-persistence-readiness-branch-checkpoint-no-runtime-change-no-db-no-smoke-no-provider.md',
  'docs/task-2222-repair-intake-draft-to-case-production-auth-session-readiness-decision-gate-no-runtime-change-no-db-no-smoke-no-provider.md',
  'docs/task-2223-repair-intake-draft-to-case-rate-limit-payload-size-readiness-decision-gate-no-runtime-change-no-db-no-smoke-no-provider.md',
  'docs/task-2224-repair-intake-draft-to-case-smoke-staging-rollout-authorization-gate-no-runtime-change-no-db-no-smoke-no-provider.md',
  'docs/task-2225-repair-intake-draft-to-case-readiness-decision-gates-branch-checkpoint-no-runtime-change-no-db-no-smoke-no-provider.md',
  'docs/task-2243-repair-intake-draft-to-case-runtime-hardening-branch-closure-no-runtime-change-no-db-no-smoke-no-provider.md',
  'docs/task-2245-project-status-portfolio-checkpoint-after-repair-intake-draft-to-case-closure-no-runtime-change-no-db-no-smoke-no-provider.md',
]);

const SEAM_SOURCE_PATHS = Object.freeze([
  'src/repairIntake/repairIntakeDraftReaderPortAdapter.js',
  'src/repairIntake/repairIntakeDraftRepositoryContract.js',
  'src/repairIntake/repairIntakeDraftRepository.js',
  'src/repairIntake/repairIntakeCasePlannerPortAdapter.js',
  'src/repairIntake/repairIntakeCaseCreatorPortAdapter.js',
  'src/repairIntake/repairIntakeCaseRepositoryContract.js',
  'src/repairIntake/repairIntakeCaseRepository.js',
  'src/repairIntake/repairIntakeCaseRepositoryAdapter.js',
  'src/repairIntake/repairIntakeCaseCreatorRepositoryAdapter.js',
  'src/repairIntake/repairIntakeIdempotencyPortAdapter.js',
  'src/repairIntake/repairIntakeIdempotencyRepositoryContract.js',
  'src/repairIntake/repairIntakeIdempotencyRepository.js',
  'src/repairIntake/repairIntakeAuditWriterPortAdapter.js',
  'src/repairIntake/repairIntakeDraftCaseAuditWriterAdapter.js',
  'src/repairIntake/repairIntakeDraftToCaseRuntimePortsFactory.js',
  'migrations/026_create_repair_intake_persistence_tables.sql',
]);

const PUBLIC_OPEN_ROUTE_MARKERS = Object.freeze([
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

const EXECUTABLE_AUTHORIZATION_PATTERNS = Object.freeze([
  /\bDATABASE_URL\b/,
  /\bprocess\.env\b/,
  /\bnew\s+Pool\b/,
  /\bpsql\b/i,
  new RegExp('\\bdb:mig' + 'rate\\b', 'i'),
  new RegExp('\\bnpm\\s+run\\s+(?:db|mig' + 'rate|smoke|dev|start)', 'i'),
  new RegExp('\\bnode\\s+.*(?:server|smoke|zeabur|mig' + 'rate)', 'i'),
  new RegExp('\\bcu' + 'rl\\s+'),
  new RegExp('\\bfet' + 'ch\\s*\\('),
  new RegExp('\\bax' + 'ios\\.'),
  new RegExp('\\bsuper' + 'test\\s*\\('),
  new RegExp('\\bapp\\.lis' + 'ten\\s*\\('),
  new RegExp('\\bserver\\.lis' + 'ten\\s*\\('),
  new RegExp('\\blis' + 'ten\\s*\\('),
  new RegExp('/hea' + 'lthz', 'i'),
  /\bZeabur\b.*\binspect\b/i,
  /\bsecrets?\b.*\binspect\b/i,
]);

function projectPath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(projectPath(relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(projectPath(relativePath));
}

function repairIntakeControllerFiles() {
  if (!exists(CONTROLLERS_DIR)) {
    return [];
  }

  return fs.readdirSync(projectPath(CONTROLLERS_DIR))
    .filter((entry) => /repair|intake/i.test(entry));
}

function stripPatternBlock(source) {
  const marker = 'const EXECUTABLE_AUTHORIZATION_PATTERNS = Object.freeze([';
  const start = source.indexOf(marker);

  if (start === -1) {
    return source;
  }

  const end = source.indexOf(']);', start);

  assert.notEqual(end, -1, 'unterminated executable pattern block');

  return `${source.slice(0, start)}${source.slice(end + 3)}`;
}

function assertIncludesAll(source, markers, label) {
  for (const marker of markers) {
    assert.equal(source.includes(marker), true, `${label} missing marker ${marker}`);
  }
}

function assertDoesNotMatchAny(source, patterns, label) {
  for (const pattern of patterns) {
    assert.doesNotMatch(source, pattern, `${label} should not contain ${pattern}`);
  }
}

test('Task2314 static guard reads existing source doc test and migration inputs only', () => {
  for (const relativePath of [
    TASK2314_DOC_PATH,
    ROUTE_SOURCE_PATH,
    ...REQUIRED_GATE_DOCS,
    ...SEAM_SOURCE_PATHS,
  ]) {
    assert.equal(exists(relativePath), true, `${relativePath} should exist`);
  }

  const guardSource = read('tests/repairIntake/repairIntakeDraftToCaseDbBackedImplementationAuthorization.static.test.js');

  assertIncludesAll(guardSource, [
    "require('node:assert/strict')",
    "require('node:fs')",
    "require('node:path')",
    "require('node:test')",
    'fs.readFileSync(projectPath(relativePath), \'utf8\')',
  ], 'Task2314 static guard');
});

test('draft-to-case route remains admin injected only and permission gated', () => {
  const routeSource = read(ROUTE_SOURCE_PATH);

  assertIncludesAll(routeSource, [
    "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_BASE_PATH = '/api/v1/admin'",
    "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH = '/api/v1/admin/repair-intake/drafts/:draftId/case/submit'",
    "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION = 'cases.create'",
    'getRepairIntakeDraftToCaseRuntimePorts',
    'createRepairIntakeDraftToCaseInjectedRouteComposition',
    'requirePermission(REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION)',
    'registerRepairIntakeDraftToCaseAdminRoutes',
  ], 'admin route boundary');

  for (const marker of PUBLIC_OPEN_ROUTE_MARKERS) {
    assert.equal(routeSource.includes(marker), false, `unexpected public/open/customer marker ${marker}`);
  }
});

test('public open Repair Intake paths and controllers remain absent', () => {
  assert.equal(exists(OPEN_REPAIR_INTAKE_SOURCE_DIR), false, 'unexpected src/openRepairIntake directory');
  assert.equal(exists(OPEN_REPAIR_INTAKE_TEST_DIR), false, 'unexpected tests/openRepairIntake directory');
  assert.deepEqual(repairIntakeControllerFiles(), []);
});

test('Task2314 authorization packet records non-authorized DB runtime execution boundary', () => {
  const doc = read(TASK2314_DOC_PATH);

  assertIncludesAll(doc, [
    'Task2314 does not authorize DB execution',
    'Current route remains `POST /api/v1/admin/repair-intake/drafts/:draftId/case/submit`',
    'Current route remains permission-gated by `requirePermission` / `cases.create`',
    'No public/open/customer route expansion is authorized or present',
    'DB-backed draft reader only',
    'PM must still authorize one exact task at a time',
    'does not authorize DB-backed draft reader implementation',
    'does not authorize migration creation, dry-run, apply, schema changes, or DB connectivity',
  ], 'Task2314 authorization packet');
});

test('Task2314 inventories DB repository and migration seams without executing them', () => {
  const doc = read(TASK2314_DOC_PATH);
  const runtimeFactory = read('src/repairIntake/repairIntakeDraftToCaseRuntimePortsFactory.js');
  const migration026 = read('migrations/026_create_repair_intake_persistence_tables.sql');

  assertIncludesAll(doc, [
    'repairIntakeDraftRepository.js',
    'repairIntakeCaseRepository.js',
    'repairIntakeIdempotencyRepository.js',
    'repairIntakeDraftCaseAuditWriterAdapter.js',
    'repairIntakeDraftToCaseRuntimePortsFactory.js',
    'migrations/026_create_repair_intake_persistence_tables.sql',
  ], 'Task2314 seam inventory');

  assertIncludesAll(runtimeFactory, [
    'createRepairIntakeDraftRepository({ dbClient })',
    'createRepairIntakeIdempotencyRepository({ dbClient })',
    'createRepairIntakeCaseRepositoryAdapter({',
    'function createConversionWriter({ dbClient, generateId: generate, now })',
    'function createAuditPort({ dbClient, generateId: generate, now })',
  ], 'DB-capable runtime factory');

  assertIncludesAll(migration026, [
    'NO DB CONNECTION OR EXECUTION IS AUTHORIZED BY THIS FILE',
    'CREATE TABLE IF NOT EXISTS repair_intake_drafts',
    'CREATE TABLE IF NOT EXISTS repair_intake_draft_case_conversions',
    'CREATE TABLE IF NOT EXISTS repair_intake_idempotency_records',
    'CREATE TABLE IF NOT EXISTS repair_intake_audit_events',
  ], 'Repair Intake migration inventory');
});

test('existing decision gate and closure docs remain visible', () => {
  const docs = Object.fromEntries(REQUIRED_GATE_DOCS.map((relativePath) => [relativePath, read(relativePath)]));

  assertIncludesAll(docs[REQUIRED_GATE_DOCS[0]], [
    'Future audit persistence requires a separate exact PM-authorized task.',
  ], 'Task2217 audit gate');
  assertIncludesAll(docs[REQUIRED_GATE_DOCS[1]], [
    'Future DB/repository implementation requires a separate exact PM task.',
  ], 'Task2218 DB gate');
  assertIncludesAll(docs[REQUIRED_GATE_DOCS[2]], [
    'DB-capable but not authorized for execution by this task',
  ], 'Task2219 inventory');
  assertIncludesAll(docs[REQUIRED_GATE_DOCS[3]], [
    'does not import or execute the DB-capable runtime ports factory',
  ], 'Task2220 guard');
  assertIncludesAll(docs[REQUIRED_GATE_DOCS[4]], [
    'No audit persistence implementation is authorized or present in this slice.',
    'No DB/repository transaction behavior is authorized.',
    'No smoke, staging, or production rollout is authorized.',
  ], 'Task2221 checkpoint');
  assertIncludesAll(docs[REQUIRED_GATE_DOCS[5]], [
    'Staging/smoke/production rollout authorization',
  ], 'Task2222 auth gate');
  assertIncludesAll(docs[REQUIRED_GATE_DOCS[6]], [
    'Staging/smoke/production rollout authorization',
  ], 'Task2223 rate gate');
  assertIncludesAll(docs[REQUIRED_GATE_DOCS[7]], [
    'Any future smoke/staging/prod validation requires a separate exact PM-authorized task',
  ], 'Task2224 rollout gate');
  assertIncludesAll(docs[REQUIRED_GATE_DOCS[8]], [
    'DB-backed repository transaction implementation packet',
  ], 'Task2225 checkpoint');
  assertIncludesAll(docs[REQUIRED_GATE_DOCS[9]], [
    'The Repair Intake draft-to-case runtime hardening branch is closed for this phase at Task2243',
  ], 'Task2243 closure');
  assertIncludesAll(docs[REQUIRED_GATE_DOCS[10]], [
    'The same 7 held historical docs remain untracked and untouched',
  ], 'Task2245 portfolio checkpoint');
});

test('Task2314 does not introduce executable DB migration smoke runtime provider or env authorization', () => {
  const doc = read(TASK2314_DOC_PATH);
  const guardSource = stripPatternBlock(read('tests/repairIntake/repairIntakeDraftToCaseDbBackedImplementationAuthorization.static.test.js'));

  assertDoesNotMatchAny(doc, EXECUTABLE_AUTHORIZATION_PATTERNS, 'Task2314 authorization packet');
  assertDoesNotMatchAny(guardSource, EXECUTABLE_AUTHORIZATION_PATTERNS, 'Task2314 static guard source');
});
