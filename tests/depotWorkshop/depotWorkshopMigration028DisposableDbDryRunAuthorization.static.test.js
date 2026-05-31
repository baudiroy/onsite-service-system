'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const MIGRATION_028 = 'migrations/028_create_depot_workshop_repair_orders.sql';
const TASK2413_DOC = 'docs/task-2413-depot-workshop-migration-028-disposable-db-dry-run-authorization-packet-no-db-execution-no-migration-apply-no-provider-no-package.md';
const ROUTE_FILE = 'src/routes/depotRepair.routes.js';

const REQUIRED_CONTEXT_ARTIFACTS = Object.freeze([
  'docs/task-2401-depot-workshop-repair-order-migration-schema-design-packet-no-runtime-change-no-db-execution-no-migration-no-provider-no-package.md',
  'docs/task-2402-depot-workshop-repair-order-migration-file-creation-authorization-packet-no-runtime-change-no-db-execution-no-migration-creation-no-provider-no-package.md',
  'docs/task-2403-depot-workshop-repair-order-migration-file-creation-static-sql-review-no-db-execution-no-migration-apply-no-provider-no-package.md',
  'docs/task-2404-depot-workshop-repair-order-migration-028-static-review-portfolio-guard-no-runtime-change-no-db-execution-no-migration-apply-no-provider-no-package.md',
  'docs/task-2405-depot-workshop-repair-order-migration-028-static-review-branch-closure-no-runtime-change-no-db-execution-no-migration-apply-no-provider-no-package.md',
  'docs/task-2406-depot-workshop-repair-order-repository-adapter-design-packet-no-runtime-change-no-db-execution-no-provider-no-package.md',
  'docs/task-2407-depot-workshop-repair-order-sql-repository-adapter-fake-client-implementation-no-real-db-execution-no-migration-apply-no-route-no-provider-no-package.md',
  'docs/task-2408-depot-workshop-repair-order-sql-repository-adapter-static-portfolio-guard-no-runtime-change-no-real-db-no-migration-apply-no-provider-no-package.md',
  'docs/task-2409-depot-workshop-repair-order-sql-repository-adapter-branch-closure-no-runtime-change-no-real-db-no-migration-apply-no-provider-no-package.md',
  'docs/task-2410-depot-workshop-repair-order-write-command-to-sql-repository-adapter-fake-chain-test-no-runtime-change-no-real-db-no-migration-apply-no-provider-no-package.md',
  'docs/task-2411-depot-workshop-repair-order-write-command-repository-adapter-fake-chain-static-portfolio-guard-no-runtime-change-no-real-db-no-migration-apply-no-provider-no-package.md',
  'docs/task-2412-depot-workshop-repair-order-write-command-repository-adapter-fake-chain-branch-closure-no-runtime-change-no-real-db-no-migration-apply-no-provider-no-package.md',
  'tests/depotWorkshop/depotWorkshopRepairOrderMigration028.static.test.js',
  'tests/depotWorkshop/depotWorkshopRepairOrderMigration028Portfolio.static.test.js',
  'tests/depotWorkshop/depotWorkshopRepairOrderSqlRepositoryAdapterPortfolio.static.test.js',
  'tests/depotWorkshop/depotWorkshopRepairOrderWriteCommandRepositoryAdapterFakeChainPortfolio.static.test.js',
  'docs/task-2338-repair-intake-migration-026-disposable-db-dry-run-authorization-packet-no-db-execution-no-migration-apply-no-smoke-no-provider.md',
  'tests/repairIntake/repairIntakeMigration026DisposableDbDryRunAuthorization.static.test.js',
  'docs/task-2340-repair-intake-migration-026-disposable-db-dry-run-blocked-checkpoint-no-db-execution-no-migration-no-smoke-no-provider.md',
]);

const EXECUTABLE_DB_COMMAND_PATTERNS = Object.freeze([
  /```/,
  /\bpsql\s+(?:-|--|<|postgres|['"])/i,
  /\bcreatedb\s+/i,
  /\bdropdb\s+/i,
  /\bpg_dump\s+/i,
  /\bpg_restore\s+/i,
  /\bDATABASE_URL\s*=/,
  /\bPGPASSWORD\s*=/,
  /\bnpm\s+run\s+(?:db|migrate|migration|smoke|dev|start)\b/i,
  /\bnode\s+.*(?:server|smoke|zeabur|migrate|migration)\b/i,
  /\bdb:mig' + 'rate\b/i,
  /\bmigrate\s+(?:up|apply|latest|deploy|run|dry-run)\b/i,
  /\bcurl\s+/i,
  /\bfet' + 'ch\s*\(/,
  /\bsuper' + 'test\s*\(/,
  /\bapp\.lis' + 'ten\s*\(/,
  /\bserver\.lis' + 'ten\s*\(/,
  /\blis' + 'ten\s*\(/,
  /\/hea' + 'lthz/i,
]);

const REAL_LOOKING_SECRET_PATTERNS = Object.freeze([
  /postgres(?:ql)?:\/\/[^@\s]+:[^@\s]+@[^/\s]+\/[^\s)]+/i,
  /\b[a-z][a-z0-9_]*:\/\/[^@\s]+:[^@\s]+@/i,
  /\b(?:password|passwd|pwd|secret|token|api[_-]?key)\s*[:=]\s*['"]?[A-Za-z0-9._~+/=-]{12,}/i,
  /\b(?:DATABASE_URL|POSTGRES_URL|POSTGRES_PASSWORD|PGPASSWORD)\s*[:=]\s*['"]?[^'"\s]+/i,
]);

function projectPath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(projectPath(relativePath), 'utf8');
}

function assertIncludesAll(source, markers, label) {
  for (const marker of markers) {
    assert.equal(source.includes(marker), true, `${label} missing ${marker}`);
  }
}

function assertDoesNotMatchAny(source, patterns, label) {
  for (const pattern of patterns) {
    assert.doesNotMatch(source, pattern, `${label} should not match ${pattern}`);
  }
}

test('Task2413 authorization packet migration route and context artifacts exist', () => {
  for (const relativePath of [
    MIGRATION_028,
    TASK2413_DOC,
    ROUTE_FILE,
    ...REQUIRED_CONTEXT_ARTIFACTS,
  ]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }
});

test('migration 028 remains present authoring-only and targets depot workshop repair orders', () => {
  const migration = read(MIGRATION_028);

  assertIncludesAll(migration, [
    '-- MIGRATION FILE AUTHORING ONLY.',
    '-- NOT APPLIED IN TASK 2403.',
    '-- APPLY OR DRY-RUN REQUIRES A SEPARATE TASK.',
    '-- FUTURE DRY-RUN OR APPLY REQUIRES EXPLICIT DISPOSABLE DB AUTHORIZATION.',
    '-- NO DB CONNECTION OR DATABASE EXECUTION IS AUTHORIZED BY THIS FILE.',
    'CREATE TABLE IF NOT EXISTS depot_workshop_repair_orders',
  ], 'Task2413 migration 028');
});

test('authorization packet restricts future target to disposable local or test DB only', () => {
  const doc = read(TASK2413_DOC);

  assertIncludesAll(doc, [
    'Migration target: `migrations/028_create_depot_workshop_repair_orders.sql`',
    'Allowed future DB target type: disposable local/test DB only.',
    'shared DB',
    'staging DB',
    'production DB',
    'Zeabur DB',
    'app runtime DB',
    'any DB discovered through env/secret inspection',
  ], 'Task2413 disposable target boundary');
});

test('authorization packet explicitly forbids execution and secret inspection in Task2413', () => {
  const doc = read(TASK2413_DOC);

  assertIncludesAll(doc, [
    'Task2413 does not authorize DB execution.',
    'Task2413 does not authorize SQL execution.',
    'Task2413 does not authorize migration dry-run.',
    'Task2413 does not authorize migration apply.',
    'Task2413 does not authorize `DATABASE_URL`, env, Zeabur, or secrets inspection.',
    'No DB execution occurred.',
    'No SQL execution occurred.',
    'No migration dry-run/apply occurred.',
    'No real DB connection occurred.',
  ], 'Task2413 explicit non-execution');
});

test('authorization packet defines prerequisites stop conditions and cleanup expectations', () => {
  const doc = read(TASK2413_DOC);

  assertIncludesAll(doc, [
    'Explicit PM authorization naming the disposable DB target',
    'Local tooling availability check',
    'No secrets printed',
    'No production/staging/shared traffic',
    'Rollback/drop disposable DB plan',
    'Stop Conditions',
    'missing psql or migration tooling',
    'ambiguous DB target',
    'any need to inspect `DATABASE_URL` or secrets',
    'any accidental staging/prod/shared target',
    'any request to send provider notifications',
    'any route/runtime smoke request',
  ], 'Task2413 prerequisites and stop conditions');
});

test('authorization packet recommends exactly one next bounded task without authorizing dry-run', () => {
  const doc = read(TASK2413_DOC);

  assertIncludesAll(doc, [
    'Recommended next bounded task: pause until disposable DB target/tooling is provided.',
    'Do not start a dry-run from Task2413.',
    'Do not recommend immediate dry-run because no disposable DB target/tooling was explicitly provided in this task.',
  ], 'Task2413 next bounded task');

  assert.equal(
    (doc.match(/Recommended next bounded task:/g) || []).length,
    1,
    'Task2413 should recommend exactly one next bounded task',
  );
});

test('route write scope remains blocked and provider package report final appointment work is not authorized', () => {
  const route = read(ROUTE_FILE);
  const doc = read(TASK2413_DOC);

  assertIncludesAll(route, [
    'writeRequested(req)',
    "failure('depot_repair_route_write_scope_not_approved', req)",
  ], 'Task2413 route write scope');

  assertIncludesAll(doc, [
    'No route write-scope behavior is authorized.',
    'No provider sending is authorized.',
    'No package or package-lock changes are authorized.',
    'No formal Field Service Report / Completion Report behavior is authorized.',
    'No finalAppointmentId mutation path is authorized.',
  ], 'Task2413 forbidden behavior authorization');
});

test('authorization packet includes no executable DB commands or real-looking credentials', () => {
  const doc = read(TASK2413_DOC);

  assertDoesNotMatchAny(doc, EXECUTABLE_DB_COMMAND_PATTERNS, 'Task2413 executable DB command boundary');
  assertDoesNotMatchAny(doc, REAL_LOOKING_SECRET_PATTERNS, 'Task2413 credential boundary');
});
