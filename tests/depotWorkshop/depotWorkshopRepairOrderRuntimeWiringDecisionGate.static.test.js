'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const TASK2415_DOC = 'docs/task-2415-depot-workshop-repair-order-runtime-wiring-decision-gate-no-runtime-change-no-real-db-no-migration-apply-no-provider-no-package.md';
const SERVICE_FILE = 'src/services/WorkshopAssignmentService.js';
const ROUTE_FILE = 'src/routes/depotRepair.routes.js';
const WRITE_COMMAND_FILE = 'src/depotWorkshop/depotWorkshopAssignmentIntentWriteCommand.js';
const REPOSITORY_CONTRACT_FILE = 'src/depotWorkshop/depotWorkshopRepairOrderRepositoryContract.js';
const SQL_ADAPTER_FILE = 'src/repositories/DepotWorkshopRepairOrderSqlRepositoryAdapter.js';
const MIGRATION_028 = 'migrations/028_create_depot_workshop_repair_orders.sql';
const TASK2414_DOC = 'docs/task-2414-depot-workshop-migration-028-disposable-db-dry-run-authorization-branch-closure-no-runtime-change-no-db-execution-no-migration-apply-no-provider-no-package.md';

const CONTEXT_ARTIFACTS = Object.freeze([
  'src/depotWorkshop/depotWorkshopRepairOrderStateModel.js',
  'src/depotWorkshop/depotWorkshopRepairOrderContract.js',
  'src/depotWorkshop/depotWorkshopRepairOrderTransitionPolicy.js',
  'src/depotWorkshop/depotWorkshopRepairOrderAuditEvent.js',
  'src/depotWorkshop/depotWorkshopRepairOrderCustomerProjection.js',
  'docs/task-2371-depot-workshop-repair-branch-re-entry-boundary-inventory-no-runtime-change-no-db-no-smoke-no-provider-no-package.md',
  'docs/task-2378-depot-workshop-repair-order-pure-helper-portfolio-static-guard-no-runtime-change-no-db-no-provider-no-package.md',
  'docs/task-2383-depot-workshop-repair-order-workshop-assignment-service-integration-static-portfolio-guard-no-runtime-change-no-db-no-provider-no-package.md',
  'docs/task-2392-depot-workshop-assignment-intent-route-write-scope-authorization-packet-no-runtime-change-no-db-no-provider-no-package.md',
  'docs/task-2395-depot-workshop-assignment-intent-write-command-helper-static-portfolio-guard-no-runtime-change-no-db-no-provider-no-package.md',
  'docs/task-2399-depot-workshop-repair-order-repository-contract-static-portfolio-guard-no-runtime-change-no-db-no-migration-no-provider-no-package.md',
  'docs/task-2404-depot-workshop-repair-order-migration-028-static-review-portfolio-guard-no-runtime-change-no-db-execution-no-migration-apply-no-provider-no-package.md',
  'docs/task-2408-depot-workshop-repair-order-sql-repository-adapter-static-portfolio-guard-no-runtime-change-no-real-db-no-migration-apply-no-provider-no-package.md',
  'docs/task-2411-depot-workshop-repair-order-write-command-repository-adapter-fake-chain-static-portfolio-guard-no-runtime-change-no-real-db-no-migration-apply-no-provider-no-package.md',
  'docs/task-2412-depot-workshop-repair-order-write-command-repository-adapter-fake-chain-branch-closure-no-runtime-change-no-real-db-no-migration-apply-no-provider-no-package.md',
  'docs/task-2413-depot-workshop-migration-028-disposable-db-dry-run-authorization-packet-no-db-execution-no-migration-apply-no-provider-no-package.md',
  TASK2414_DOC,
  'tests/depotWorkshop/depotWorkshopRepairOrderPureHelperPortfolio.static.test.js',
  'tests/depotWorkshop/workshopAssignmentServiceRepairOrderIntegrationPortfolio.static.test.js',
  'tests/depotWorkshop/depotWorkshopAssignmentIntentRouteWriteScopeAuthorization.static.test.js',
  'tests/depotWorkshop/depotWorkshopRepairOrderRepositoryContractPortfolio.static.test.js',
  'tests/depotWorkshop/depotWorkshopRepairOrderSqlRepositoryAdapterPortfolio.static.test.js',
  'tests/depotWorkshop/depotWorkshopRepairOrderWriteCommandRepositoryAdapterFakeChainPortfolio.static.test.js',
  'tests/depotWorkshop/depotWorkshopMigration028DisposableDbDryRunAuthorization.static.test.js',
]);

const EXECUTABLE_AUTHORIZATION_PATTERNS = Object.freeze([
  /`{3}/,
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

function countOccurrences(source, phrase) {
  return source.split(phrase).length - 1;
}

test('Task2415 decision gate source docs tests and migration context exist', () => {
  for (const relativePath of [
    TASK2415_DOC,
    SERVICE_FILE,
    ROUTE_FILE,
    WRITE_COMMAND_FILE,
    REPOSITORY_CONTRACT_FILE,
    SQL_ADAPTER_FILE,
    MIGRATION_028,
    ...CONTEXT_ARTIFACTS,
  ]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }
});

test('current source artifacts keep prepare route write command contract adapter and migration boundaries visible', () => {
  const service = read(SERVICE_FILE);
  const route = read(ROUTE_FILE);
  const writeCommand = read(WRITE_COMMAND_FILE);
  const contract = read(REPOSITORY_CONTRACT_FILE);
  const adapter = read(SQL_ADAPTER_FILE);
  const migration = read(MIGRATION_028);
  const closure = read(TASK2414_DOC);

  assertIncludesAll(service, [
    'prepareAssignmentIntent',
    'written: false',
    'writeRequired: false',
    'workshop_assignment_write_scope_not_approved',
  ], 'Task2415 service prepare-only boundary');

  assertIncludesAll(route, [
    'writeRequested(req)',
    "failure('depot_repair_route_write_scope_not_approved', req)",
    'presentDepotWorkshopAssignmentIntentResponse',
  ], 'Task2415 route write-scope boundary');

  assertIncludesAll(writeCommand, [
    'buildDepotWorkshopAssignmentIntentWriteCommand',
    'DEPOT_WORKSHOP_ASSIGNMENT_INTENT_WRITE_ACTION',
    'permissionAllowed(input, scope)',
    'buildTransitionPlan(command)',
  ], 'Task2415 write command boundary');

  assertIncludesAll(contract, [
    'normalizeDepotWorkshopRepairOrderRepositoryWriteCommand',
    'normalizeDepotWorkshopRepairOrderRepositoryResult',
    'buildDepotWorkshopRepairOrderRepositorySafeFailure',
  ], 'Task2415 repository contract boundary');

  assertIncludesAll(adapter, [
    'createDepotWorkshopRepairOrderSqlRepositoryAdapter',
    'const dbClient = source.dbClient',
    'resolveQueryExecutor(dbClient)',
    'INSERT INTO depot_workshop_repair_orders',
    'values: Object.freeze([',
  ], 'Task2415 SQL adapter boundary');

  assertIncludesAll(migration, [
    '-- NOT APPLIED IN TASK 2403.',
    '-- APPLY OR DRY-RUN REQUIRES A SEPARATE TASK.',
    'CREATE TABLE IF NOT EXISTS depot_workshop_repair_orders',
  ], 'Task2415 migration 028 boundary');

  assertIncludesAll(closure, [
    'DB work remains paused until PM provides a safe disposable target/tooling and exact authorization.',
    'Future disposable DB dry-run requires separate exact PM authorization naming the target/tooling.',
  ], 'Task2415 DB dry-run paused closure');
});

test('decision gate compares required future wiring boundaries and recommends exactly one future boundary', () => {
  const doc = read(TASK2415_DOC);

  assertIncludesAll(doc, [
    '`WorkshopAssignmentService.prepareAssignmentIntent`',
    'New service method separate from prepare intent',
    'Route write-scope handler',
    'Runtime factory / dependency composition boundary',
    'Repository adapter direct use',
    'Recommended future boundary: `src/services/WorkshopAssignmentService.js#createWorkshopAssignmentService().writePreparedAssignmentIntent`',
    'keeps `prepareAssignmentIntent` read/prepare-only',
    'explicit dependency injection',
    'fake-composition tested without route write-scope enablement or real DB execution',
  ], 'Task2415 compared future wiring boundaries');

  assert.equal(countOccurrences(doc, 'Recommended future boundary:'), 1);
  assert.equal(countOccurrences(doc, 'Decision: recommended.'), 1);
  assert.equal(countOccurrences(doc, 'Decision: not recommended.'), 4);
});

test('decision gate records blockers prerequisites and exactly one next bounded task', () => {
  const doc = read(TASK2415_DOC);

  assertIncludesAll(doc, [
    'migration 028 exists but has not been applied or dry-run',
    'no disposable DB target/tooling has been provided',
    'repository adapter is fake-client tested only and unwired',
    'route write scope remains blocked',
    'repository adapter must be provided through explicit dependency injection',
    'no global DB access',
    'no env access',
    'no `DATABASE_URL` access',
    'write command helper must validate trusted scope and permission',
    'transition policy must validate status transitions',
    'repository result must be normalized through the accepted contract',
    'presenter response must remain admin-safe and must not expose raw internals',
    'Recommended next bounded task: fake-runtime composition test only for `WorkshopAssignmentService.writePreparedAssignmentIntent`.',
  ], 'Task2415 blockers prerequisites and next task');

  assert.equal(countOccurrences(doc, 'Recommended next bounded task:'), 1);
});

test('Task2415 and later Task2416 keep adapter unwired from route app server runtime surfaces', () => {
  const runtimeFiles = [
    'src/routes/depotRepair.routes.js',
    'src/server.js',
    'src/app.js',
    'src/routes/index.js',
  ].filter((relativePath) => fs.existsSync(projectPath(relativePath)));
  const runtimeSource = runtimeFiles.map(read).join('\n');
  const serviceSource = read(SERVICE_FILE);

  assertDoesNotMatchAny(runtimeSource, [
    /DepotWorkshopRepairOrderSqlRepositoryAdapter/,
    /createDepotWorkshopRepairOrderSqlRepositoryAdapter/,
    /buildDepotWorkshopAssignmentIntentWriteCommand/,
    /writePreparedAssignmentIntent/,
    /INSERT\s+INTO\s+depot_workshop_repair_orders/i,
  ], 'Task2415 current runtime wiring');

  assertIncludesAll(serviceSource, [
    'async prepareAssignmentIntent(input = {})',
    'async writePreparedAssignmentIntent(input = {})',
    'buildDepotWorkshopAssignmentIntentWriteCommand(input)',
  ], 'Task2416 accepted service method alignment');
});

test('decision gate does not authorize DB migration provider package report or finalAppointment work', () => {
  const doc = read(TASK2415_DOC);

  assertIncludesAll(doc, [
    'Task2415 does not authorize runtime/source behavior changes.',
    'Task2415 does not authorize repository adapter wiring.',
    'Task2415 does not authorize DB adapter runtime wiring.',
    'Task2415 does not authorize route write-scope behavior.',
    'Task2415 does not authorize DB commands.',
    'Task2415 does not authorize SQL execution against any DB.',
    'Task2415 does not authorize real DB connection.',
    'Task2415 does not authorize migration dry-run/apply.',
    'Task2415 does not authorize `DATABASE_URL`, Zeabur, env, or secrets inspection.',
    'Task2415 does not authorize provider sending.',
    'Task2415 does not authorize package or package-lock changes.',
    'Task2415 does not authorize formal Field Service Report / Completion Report creation, approval, publication, or finalization behavior.',
    'Task2415 does not authorize `finalAppointmentId` mutation path.',
  ], 'Task2415 non-authorization record');
});

test('Task2415 docs and guard contain no executable authorization or real-looking credential', () => {
  const combined = [
    read(TASK2415_DOC),
    read('tests/depotWorkshop/depotWorkshopRepairOrderRuntimeWiringDecisionGate.static.test.js'),
  ].join('\n');

  assertDoesNotMatchAny(combined, EXECUTABLE_AUTHORIZATION_PATTERNS, 'Task2415 executable authorization');
  assertDoesNotMatchAny(combined, REAL_LOOKING_SECRET_PATTERNS, 'Task2415 credential boundary');
});
