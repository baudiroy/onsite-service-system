'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const TASK2397_DOC = 'docs/task-2397-depot-workshop-repair-order-repository-migration-authorization-packet-no-runtime-change-no-db-execution-no-migration-no-provider-no-package.md';
const REPOSITORY_ADAPTER_FILE = 'src/repositories/DepotIntakeSqlRepositoryAdapter.js';
const SERVICE_FILE = 'src/services/WorkshopAssignmentService.js';
const ROUTE_FILE = 'src/routes/depotRepair.routes.js';
const WRITE_COMMAND_HELPER_FILE = 'src/depotWorkshop/depotWorkshopAssignmentIntentWriteCommand.js';
const STATE_MODEL_FILE = 'src/depotWorkshop/depotWorkshopRepairOrderStateModel.js';

const CONTEXT_ARTIFACTS = Object.freeze([
  'docs/design/depot-workshop-repair.md',
  'docs/task-2371-depot-workshop-repair-branch-re-entry-boundary-inventory-no-runtime-change-no-db-no-smoke-no-provider-no-package.md',
  'docs/task-2372-depot-workshop-repair-order-contract-state-model-static-guard-no-db-no-route-no-provider-no-package.md',
  'docs/task-2373-depot-workshop-repair-order-state-model-pure-constants-helper-no-route-no-db-no-provider-no-package.md',
  'docs/task-2374-depot-workshop-repair-order-contract-pure-helper-no-route-no-db-no-provider-no-package.md',
  'docs/task-2375-depot-workshop-repair-order-transition-policy-pure-helper-no-route-no-db-no-provider-no-package.md',
  'docs/task-2376-depot-workshop-repair-order-audit-event-pure-helper-no-route-no-db-no-provider-no-package.md',
  'docs/task-2377-depot-workshop-repair-order-customer-visible-projection-pure-helper-no-route-no-db-no-provider-no-package.md',
  'docs/task-2378-depot-workshop-repair-order-pure-helper-portfolio-static-guard-no-runtime-change-no-db-no-provider-no-package.md',
  'docs/task-2379-depot-workshop-repair-order-pure-helper-branch-closure-no-runtime-change-no-db-no-provider-no-package.md',
  'docs/task-2380-depot-workshop-repair-order-helper-workshop-assignment-service-integration-decision-gate-no-runtime-change-no-db-no-provider-no-package.md',
  'docs/task-2381-depot-workshop-repair-order-helper-workshop-assignment-service-integration-no-route-no-db-no-provider-no-package.md',
  'docs/task-2382-depot-workshop-repair-order-helper-workshop-assignment-integration-checkpoint-no-runtime-change-no-db-no-provider-no-package.md',
  'docs/task-2383-depot-workshop-repair-order-workshop-assignment-service-integration-static-portfolio-guard-no-runtime-change-no-db-no-provider-no-package.md',
  'docs/task-2384-depot-workshop-repair-order-workshop-assignment-service-integration-branch-closure-no-runtime-change-no-db-no-provider-no-package.md',
  'docs/task-2385-depot-workshop-assignment-intent-route-response-shape-checkpoint-no-runtime-change-no-db-no-provider-no-package.md',
  'docs/task-2386-depot-workshop-assignment-intent-route-response-presenter-design-packet-no-runtime-change-no-db-no-provider-no-package.md',
  'docs/task-2387-depot-workshop-assignment-intent-route-response-presenter-pure-helper-no-route-wiring-no-db-no-provider-no-package.md',
  'docs/task-2388-depot-workshop-assignment-intent-route-response-presenter-wiring-no-route-path-change-no-db-no-provider-no-package.md',
  'docs/task-2389-depot-workshop-assignment-intent-route-response-presenter-wiring-checkpoint-no-runtime-change-no-db-no-provider-no-package.md',
  'docs/task-2390-depot-workshop-assignment-intent-route-response-presenter-wiring-static-portfolio-guard-no-runtime-change-no-db-no-provider-no-package.md',
  'docs/task-2391-depot-workshop-assignment-intent-route-response-presenter-wiring-branch-closure-no-runtime-change-no-db-no-provider-no-package.md',
  'docs/task-2392-depot-workshop-assignment-intent-route-write-scope-authorization-packet-no-runtime-change-no-db-no-provider-no-package.md',
  'docs/task-2393-depot-workshop-assignment-intent-write-command-helper-design-packet-no-runtime-change-no-db-no-provider-no-package.md',
  'docs/task-2394-depot-workshop-assignment-intent-write-command-pure-helper-no-route-no-db-no-provider-no-package.md',
  'docs/task-2395-depot-workshop-assignment-intent-write-command-helper-static-portfolio-guard-no-runtime-change-no-db-no-provider-no-package.md',
  'docs/task-2396-depot-workshop-assignment-intent-write-command-helper-branch-closure-no-runtime-change-no-db-no-provider-no-package.md',
  'tests/depotWorkshop/depotIntakeSqlRepositoryAdapter.unit.test.js',
  'tests/depotWorkshop/depotWorkshopAssignmentIntentWriteCommandPortfolio.static.test.js',
  'tests/depotWorkshop/depotWorkshopAssignmentIntentWriteCommand.unit.test.js',
  'tests/depotWorkshop/depotWorkshopAssignmentIntentRouteWriteScopeAuthorization.static.test.js',
  'tests/depotWorkshop/workshopAssignmentServiceRepairOrderIntegrationPortfolio.static.test.js',
  'tests/depotWorkshop/depotWorkshopRepairOrderPureHelperPortfolio.static.test.js',
  'tests/depotWorkshop/depotRepairRoutePermissionGuard.static.test.js',
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

function migrationFiles() {
  return fs.readdirSync(projectPath('migrations'))
    .filter((fileName) => fileName.endsWith('.sql'))
    .sort();
}

test('Task2397 packet and required context artifacts exist', () => {
  for (const relativePath of [
    TASK2397_DOC,
    REPOSITORY_ADAPTER_FILE,
    SERVICE_FILE,
    ROUTE_FILE,
    WRITE_COMMAND_HELPER_FILE,
    STATE_MODEL_FILE,
    ...CONTEXT_ARTIFACTS,
  ]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }
});

test('current Depot Intake repository adapter remains read-only and injected-client based', () => {
  const adapter = read(REPOSITORY_ADAPTER_FILE);

  assertIncludesAll(adapter, [
    'DEPOT_INTAKE_SQL_REPOSITORY_ADAPTER_KIND',
    'depot_workshop.depot_intake_sql_repository_adapter',
    'READ_DEPOT_INTAKE_BY_DRAFT_SQL',
    'FROM repair_intake_drafts',
    'resolveQueryExecutor(dbClient)',
    'dbClient.query',
    'dbClient.execute',
    'findDepotIntakeState(input = {})',
    'written: false',
    'recordDepotIntakeIntent(input = {})',
    "failure('depot_intake_write_scope_not_approved', input)",
    'safe_summary',
    'safe_metadata',
    'validation_errors_safe',
  ], 'Task2397 read-only repository adapter');

  assertDoesNotMatchAny(adapter, [
    /\bINSERT\s+INTO\b/i,
    /\bUPDATE\s+\w+\b/i,
    /\bDELETE\s+FROM\b/i,
    /\bALTER\s+TABLE\b/i,
    /\bCREATE\s+TABLE\b/i,
    /\bDROP\s+TABLE\b/i,
    /\bTRUNCATE\b/i,
    /\bnew\s+Pool\b|require\(['"]pg['"]\)|require\(['"]postgres['"]\)/,
    /process\.env/,
  ], 'Task2397 read-only repository adapter');
});

test('route and service keep write scope blocked with false write flags', () => {
  const route = read(ROUTE_FILE);
  const service = read(SERVICE_FILE);

  assertIncludesAll(route, [
    "const DEPOT_REPAIR_ROUTE_PATH = '/api/v1/depot/repairs/:depotIntakeId/assignment-intent'",
    "const DEPOT_REPAIR_ROUTE_PERMISSION = 'depot.repair.prepare'",
    'writeRequested(req)',
    "failure('depot_repair_route_write_scope_not_approved', req)",
    'presentDepotWorkshopAssignmentIntentResponse',
  ], 'Task2397 route write scope');

  assertIncludesAll(service, [
    'createWorkshopAssignmentService',
    'async prepareAssignmentIntent(input = {})',
    'written: false',
    'writeRequired: false',
    'workshop_assignment_write_scope_not_approved',
    'depotIntakeRepository.findDepotIntakeState',
  ], 'Task2397 service prepare-only boundary');
});

test('pure write command helper remains unwired into route service and repositories', () => {
  const source = [
    read(ROUTE_FILE),
    read(SERVICE_FILE),
    read(REPOSITORY_ADAPTER_FILE),
  ].join('\n');
  const helper = read(WRITE_COMMAND_HELPER_FILE);

  assertIncludesAll(helper, [
    'function buildDepotWorkshopAssignmentIntentWriteCommand(input = {})',
    'DEPOT_WORKSHOP_ASSIGNMENT_INTENT_WRITE_ACTION',
    "depot_workshop.assignment_intent.write",
    'status: \'ready\'',
  ], 'Task2397 pure write command helper');

  assertDoesNotMatchAny(source, [
    /depotWorkshopAssignmentIntentWriteCommand/,
    /buildDepotWorkshopAssignmentIntentWriteCommand/,
    /DEPOT_WORKSHOP_ASSIGNMENT_INTENT_WRITE_ACTION/,
  ], 'Task2397 helper runtime wiring');
});

test('Task2397 guard now allows only PM-authorized Task2403 migration and Task2407 repository adapter implementation', () => {
  const depotWorkshopMigrations = migrationFiles().filter((fileName) => (
    /depot|workshop|repair_order|repair_orders|work_order|work_orders/i.test(fileName)
  ));
  const repositoryFiles = fs.readdirSync(projectPath('src/repositories')).filter((fileName) => (
    /DepotWorkshopRepairOrder|WorkshopRepairOrder|RepairOrderRepository|WorkshopJobRepository/i.test(fileName)
  ));

  assert.deepEqual(depotWorkshopMigrations, ['028_create_depot_workshop_repair_orders.sql']);
  assert.deepEqual(repositoryFiles, ['DepotWorkshopRepairOrderSqlRepositoryAdapter.js']);
});

test('authorization packet records persistence state prerequisites order and one recommendation', () => {
  const doc = read(TASK2397_DOC);

  assertIncludesAll(doc, [
    'Task2397 Depot Workshop Repair Order Repository Migration Authorization Packet',
    'Current Persistence State',
    '`DepotIntakeSqlRepositoryAdapter` is read-only for accepted behavior.',
    'injected DB client with `query` or `execute`',
    'reads existing `repair_intake_drafts` only',
    '`written: false`',
    'No dedicated Depot / Workshop repair order repository implementation exists.',
    'No dedicated Depot / Workshop migration exists.',
    'Current route write scope remains blocked by `depot_repair_route_write_scope_not_approved`.',
    '`WorkshopAssignmentService` remains prepare-only and returns `written: false`.',
    'The pure write command helper remains unwired',
    'exact entity/table candidate: `depot_workshop_repair_orders`',
    'required organization isolation column: `organization_id`',
    'optional tenant isolation column: `tenant_id`',
    'Case reference: `case_id`',
    'Repair Intake draft reference',
    'status column constrained to the Task2373 state model',
    'audit relationship',
    'customer projection storage boundary',
    'idempotency/write command boundary',
    'no formal Field Service Report mutation',
    'no Completion Report creation, approval, publication, finalization, or mutation',
    'no `finalAppointmentId` mutation',
    'repository contract first',
    'migration/schema authorization packet second',
    'disposable DB dry-run only with explicit DB authorization and approved tooling',
    'repository adapter implementation only after contract plus migration design',
    'route write scope only after repository/DB readiness and separate PM authorization',
    'Option A: pure repository contract helper/interface.',
    'Option B: migration/schema design packet.',
    'Option C: route write scope implementation.',
    'Option D: keep persistence blocked.',
    'Recommended next bounded task: pure repository contract helper/interface static guard.',
    'The 7 held historical docs remain outside Task2397 scope',
  ], 'Task2397 authorization packet');

  assert.equal(
    (doc.match(/Recommended next bounded task:/g) || []).length,
    1,
    'Task2397 should recommend exactly one next bounded task',
  );
});

test('Task2397 docs and static guard introduce no executable authorization or real credentials', () => {
  const combined = [
    read(TASK2397_DOC),
    read('tests/depotWorkshop/depotWorkshopRepairOrderRepositoryMigrationAuthorization.static.test.js'),
  ].join('\n');

  assertIncludesAll(combined, [
    'No migration file may be created by this packet.',
    'Task2397 does not authorize:',
    'repository implementation',
    'DB commands',
    'SQL execution',
    'real DB connection',
    'migration creation',
    'migration dry-run or apply',
    'provider sending',
    'package or package-lock changes',
    'formal Field Service Report / Completion Report creation, approval, publication, or finalization behavior',
    '`finalAppointmentId` mutation path',
  ], 'Task2397 non-authorization docs/static guard');

  assertDoesNotMatchAny(combined, [
    /postgres(?:ql)?:\/\/[^@\s]+:[^@\s]+@[^/\s]+\/[^\s)]+/i,
    /\b(?:password|passwd|pwd|secret|token|api[_-]?key)\s*[:=]\s*['"]?[A-Za-z0-9._~+/=-]{12,}/i,
    /\bDATABASE_URL\s*=\s*[^'"`\s]+/i,
    /\bcurl\s+/i,
    /\bfet' + 'ch\s*\(/,
    /\bsuper' + 'test\s*\(/,
    /\bapp\.lis' + 'ten\s*\(/,
    /\bserver\.lis' + 'ten\s*\(/,
    /\blis' + 'ten\s*\(/,
    /\/hea' + 'lthz/i,
    /\bps' + 'ql\s+/i,
    /\bdb:mig' + 'rate\b/i,
  ], 'Task2397 docs/static guard executable authorization');
});
