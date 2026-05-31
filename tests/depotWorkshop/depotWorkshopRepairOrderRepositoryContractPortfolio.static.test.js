'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const TASK2397_DOC = 'docs/task-2397-depot-workshop-repair-order-repository-migration-authorization-packet-no-runtime-change-no-db-execution-no-migration-no-provider-no-package.md';
const TASK2398_DOC = 'docs/task-2398-depot-workshop-repair-order-repository-contract-pure-helper-no-db-no-migration-no-route-no-provider-no-package.md';
const TASK2399_DOC = 'docs/task-2399-depot-workshop-repair-order-repository-contract-static-portfolio-guard-no-runtime-change-no-db-no-migration-no-provider-no-package.md';
const HELPER_FILE = 'src/depotWorkshop/depotWorkshopRepairOrderRepositoryContract.js';
const WRITE_COMMAND_HELPER_FILE = 'src/depotWorkshop/depotWorkshopAssignmentIntentWriteCommand.js';
const ROUTE_FILE = 'src/routes/depotRepair.routes.js';
const REPOSITORY_ADAPTER_FILE = 'src/repositories/DepotIntakeSqlRepositoryAdapter.js';
const TASK2398_UNIT_TEST = 'tests/depotWorkshop/depotWorkshopRepairOrderRepositoryContract.unit.test.js';
const TASK2398_BOUNDARY_TEST = 'tests/depotWorkshop/depotWorkshopRepairOrderRepositoryContractBoundary.static.test.js';
const TASK2397_STATIC_TEST = 'tests/depotWorkshop/depotWorkshopRepairOrderRepositoryMigrationAuthorization.static.test.js';

function projectPath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(projectPath(relativePath), 'utf8');
}

function requireSpecifiers(source) {
  return Array.from(source.matchAll(/require\(\s*['"]([^'"]+)['"]\s*\)/g), (match) => match[1]);
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

test('Task2397 through Task2399 repository contract portfolio artifacts exist', () => {
  for (const relativePath of [
    TASK2397_DOC,
    TASK2398_DOC,
    TASK2399_DOC,
    HELPER_FILE,
    WRITE_COMMAND_HELPER_FILE,
    ROUTE_FILE,
    REPOSITORY_ADAPTER_FILE,
    TASK2398_UNIT_TEST,
    TASK2398_BOUNDARY_TEST,
    TASK2397_STATIC_TEST,
  ]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }
});

test('repository contract helper exports remain visible and pure', () => {
  const helper = read(HELPER_FILE);

  assert.deepEqual(requireSpecifiers(helper), []);
  assertIncludesAll(helper, [
    'DEPOT_WORKSHOP_REPAIR_ORDER_REPOSITORY_CONTRACT_KIND',
    'normalizeDepotWorkshopRepairOrderRepositoryWriteCommand',
    'normalizeDepotWorkshopRepairOrderRepositoryResult',
    'buildDepotWorkshopRepairOrderRepositorySafeFailure',
    'depot_workshop.repair_order_repository_contract',
    'depot_workshop.assignment_intent.write',
    'organizationId',
    'caseId',
    'depotIntakeId',
    'repairOrderId',
    'written',
    'written: false',
    'repositoryKind',
    'module.exports',
  ], 'Task2399 helper exports');

  assertDoesNotMatchAny(helper, [
    /require\(['"].*routes?/i,
    /require\(['"].*controllers?/i,
    /require\(['"].*repositories?/i,
    /require\(['"].*providers?/i,
    /require\(['"].*package/i,
    /process\.env/,
    /DATABASE_URL\s*=/,
    /\bnew\s+Pool\b|require\(['"]pg['"]\)|require\(['"]postgres['"]\)/,
    /\bpsql\b|db:migrate|migrations\//i,
    /\bfet' + 'ch\s*\(/,
    /\bsuper' + 'test\s*\(/,
    /\bapp\.lis' + 'ten\s*\(/,
    /\bserver\.lis' + 'ten\s*\(/,
    /\blis' + 'ten\s*\(/,
  ], 'Task2399 helper imports and runtime calls');
});

test('repository contract helper remains unwired and route write scope remains blocked', () => {
  const route = read(ROUTE_FILE);
  const adapter = read(REPOSITORY_ADAPTER_FILE);

  assertDoesNotMatchAny(`${route}\n${adapter}`, [
    /depotWorkshopRepairOrderRepositoryContract/,
    /normalizeDepotWorkshopRepairOrderRepositoryWriteCommand/,
    /normalizeDepotWorkshopRepairOrderRepositoryResult/,
    /DEPOT_WORKSHOP_REPAIR_ORDER_REPOSITORY_CONTRACT_KIND/,
  ], 'Task2399 runtime wiring');

  assertIncludesAll(route, [
    'depot_repair_route_write_scope_not_approved',
    'writeRequested(req)',
    'presentDepotWorkshopAssignmentIntentResponse',
  ], 'Task2399 route write-scope block');
});

test('only PM-authorized Task2403 migration and no dedicated repository implementation were added', () => {
  const depotWorkshopMigrations = migrationFiles().filter((fileName) => (
    /depot|workshop|repair_order|repair_orders|work_order|work_orders/i.test(fileName)
  ));
  const repositoryImplementations = fs.readdirSync(projectPath('src/repositories')).filter((fileName) => (
    /DepotWorkshopRepairOrder|WorkshopRepairOrder|RepairOrderRepository|WorkshopJobRepository/i.test(fileName)
  ));

  assert.deepEqual(depotWorkshopMigrations, ['028_create_depot_workshop_repair_orders.sql']);
  assert.deepEqual(repositoryImplementations, []);
});

test('pure write command helper remains the upstream command source', () => {
  const writeHelper = read(WRITE_COMMAND_HELPER_FILE);
  const unitTest = read(TASK2398_UNIT_TEST);

  assertIncludesAll(writeHelper, [
    'function buildDepotWorkshopAssignmentIntentWriteCommand(input = {})',
    'DEPOT_WORKSHOP_ASSIGNMENT_INTENT_WRITE_ACTION',
    "depot_workshop.assignment_intent.write",
  ], 'Task2399 upstream write command helper');
  assertIncludesAll(unitTest, [
    'buildDepotWorkshopAssignmentIntentWriteCommand',
    'valid safe write command normalizes into repository command contract',
    'missing trusted organization case source or action fails closed',
  ], 'Task2399 upstream write command coverage');
});

test('DepotIntakeSqlRepositoryAdapter remains read-only and safe-field based', () => {
  const adapter = read(REPOSITORY_ADAPTER_FILE);

  assertIncludesAll(adapter, [
    'DEPOT_INTAKE_SQL_REPOSITORY_ADAPTER_KIND',
    'depot_workshop.depot_intake_sql_repository_adapter',
    'FROM repair_intake_drafts',
    'resolveQueryExecutor(dbClient)',
    'dbClient.query',
    'dbClient.execute',
    'findDepotIntakeState(input = {})',
    'recordDepotIntakeIntent(input = {})',
    "failure('depot_intake_write_scope_not_approved', input)",
    'written: false',
    'safe_summary',
    'safe_metadata',
    'validation_errors_safe',
  ], 'Task2399 depot intake repository adapter');

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
  ], 'Task2399 read-only adapter');
});

test('repository contract safety coverage remains represented in source and tests', () => {
  const helperAndTests = [
    read(HELPER_FILE),
    read(TASK2398_DOC),
    read(TASK2399_DOC),
    read(TASK2398_UNIT_TEST),
    read(TASK2398_BOUNDARY_TEST),
  ].join('\n');

  assertIncludesAll(helperAndTests, [
    'organization_id_required',
    'case_id_required',
    'repair_order_source_reference_required',
    'depot_workshop_repair_order_repository_action_required',
    'depot_workshop.assignment_intent.write',
    'normalizeDepotWorkshopRepairOrderRepositoryResult',
    'depot_workshop_repair_order_repository_result_scope_mismatch',
    'depot_workshop_repair_order_repository_result_rejected',
    'written reflects only a future repository adapter result',
    'does not authorize route write scope',
    'no DB repository adapter provider result is executed',
    'forbidden FSR Completion Report and finalAppointment fields are not emitted',
  ], 'Task2399 repository contract safety coverage');

  assertDoesNotMatchAny(read(HELPER_FILE), [
    /\bSELECT\b|\bINSERT\s+INTO\b|\bUPDATE\s+\w+\b|\bDELETE\s+FROM\b/i,
    /\bALTER\s+TABLE\b|\bCREATE\s+TABLE\b|\bDROP\s+TABLE\b|\bTRUNCATE\b/i,
    /\bquery\s*\(|\bexecute\s*\(|\btransaction\s*\(/,
    /createFieldServiceReport|approveFieldServiceReport|publishFieldServiceReport|finalizeFieldServiceReport/i,
    /createCompletionReport|approveCompletionReport|publishCompletionReport|finalizeCompletionReport/i,
    /completeAppointment|finalizeAppointment|mutateAppointment|setFinalAppointment/i,
    /finalAppointmentId\s*[:=]/,
    /send(Line|Sms|SMS|Email|Webhook)/,
    /createSettlement|runSettlement|stripe/i,
  ], 'Task2399 forbidden repository contract behavior');
});

test('Task2399 doc records current status boundaries and only non-authorized candidates', () => {
  const doc = read(TASK2399_DOC);

  assertIncludesAll(doc, [
    'Task2399 Depot Workshop Repair Order Repository Contract Static Portfolio Guard',
    'current repository contract status',
    'current persistence non-authorization state',
    'current safety boundaries',
    'repository contract branch closure',
    'migration/schema design packet',
    'repository adapter authorization packet',
    'route write-scope decision packet',
    'non-authorized candidates only',
    'No runtime/source behavior changes',
    'No DB commands',
    'No SQL execution',
    'No migration creation',
    'No provider sending',
    'No formal Field Service Report / Completion Report creation, approval, publication, or finalization behavior',
    'No `finalAppointmentId` mutation path',
    'The 7 held historical docs remain outside Task2399 scope',
  ], 'Task2399 doc');
});

test('Task2399 docs and static guard introduce no executable authorization or real credentials', () => {
  const combined = [
    read(TASK2399_DOC),
    read('tests/depotWorkshop/depotWorkshopRepairOrderRepositoryContractPortfolio.static.test.js'),
  ].join('\n');

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
  ], 'Task2399 docs/static guard executable authorization');
});
