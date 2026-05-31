'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const HELPER_FILE = 'src/depotWorkshop/depotWorkshopRepairOrderRepositoryContract.js';
const ROUTE_FILE = 'src/routes/depotRepair.routes.js';
const SERVICE_FILE = 'src/services/WorkshopAssignmentService.js';
const REPOSITORY_ADAPTER_FILE = 'src/repositories/DepotIntakeSqlRepositoryAdapter.js';
const WRITE_COMMAND_HELPER_FILE = 'src/depotWorkshop/depotWorkshopAssignmentIntentWriteCommand.js';
const TASK2397_DOC = 'docs/task-2397-depot-workshop-repair-order-repository-migration-authorization-packet-no-runtime-change-no-db-execution-no-migration-no-provider-no-package.md';
const TASK2398_DOC = 'docs/task-2398-depot-workshop-repair-order-repository-contract-pure-helper-no-db-no-migration-no-route-no-provider-no-package.md';
const UNIT_TEST_FILE = 'tests/depotWorkshop/depotWorkshopRepairOrderRepositoryContract.unit.test.js';
const STATIC_TEST_FILE = 'tests/depotWorkshop/depotWorkshopRepairOrderRepositoryContractBoundary.static.test.js';

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

test('Task2398 pure repository contract artifacts exist', () => {
  for (const relativePath of [
    HELPER_FILE,
    UNIT_TEST_FILE,
    STATIC_TEST_FILE,
    TASK2397_DOC,
    TASK2398_DOC,
  ]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }
});

test('repository contract helper has no DB repository provider route app server env or package imports', () => {
  const helper = read(HELPER_FILE);

  assert.deepEqual(requireSpecifiers(helper), []);
  assertIncludesAll(helper, [
    'DEPOT_WORKSHOP_REPAIR_ORDER_REPOSITORY_CONTRACT_KIND',
    'depot_workshop.repair_order_repository_contract',
    'normalizeDepotWorkshopRepairOrderRepositoryWriteCommand',
    'normalizeDepotWorkshopRepairOrderRepositoryResult',
    'buildDepotWorkshopRepairOrderRepositorySafeFailure',
    'depot_workshop.assignment_intent.write',
    'organizationId',
    'tenantId',
    'caseId',
    'depotIntakeId',
    'repairOrderId',
    'written: false',
    'module.exports',
  ], 'Task2398 helper contract');

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
  ], 'Task2398 helper forbidden imports');
});

test('repository contract helper is not wired into routes services controllers or repositories', () => {
  const route = read(ROUTE_FILE);
  const service = read(SERVICE_FILE);
  const adapter = read(REPOSITORY_ADAPTER_FILE);

  assertDoesNotMatchAny(`${route}\n${service}\n${adapter}`, [
    /depotWorkshopRepairOrderRepositoryContract/,
    /normalizeDepotWorkshopRepairOrderRepositoryWriteCommand/,
    /normalizeDepotWorkshopRepairOrderRepositoryResult/,
    /DEPOT_WORKSHOP_REPAIR_ORDER_REPOSITORY_CONTRACT_KIND/,
  ], 'Task2398 helper runtime wiring');

  assertIncludesAll(route, [
    'depot_repair_route_write_scope_not_approved',
    'writeRequested(req)',
    'presentDepotWorkshopAssignmentIntentResponse',
  ], 'Task2398 route write scope boundary');
});

test('pure write command helper remains the upstream command source', () => {
  const writeHelper = read(WRITE_COMMAND_HELPER_FILE);
  const unitTest = read(UNIT_TEST_FILE);

  assertIncludesAll(writeHelper, [
    'function buildDepotWorkshopAssignmentIntentWriteCommand(input = {})',
    'DEPOT_WORKSHOP_ASSIGNMENT_INTENT_WRITE_ACTION',
    "depot_workshop.assignment_intent.write",
  ], 'Task2398 upstream write command helper');
  assertIncludesAll(unitTest, [
    'buildDepotWorkshopAssignmentIntentWriteCommand',
    'valid safe write command normalizes into repository command contract',
  ], 'Task2398 upstream command unit coverage');
});

test('Task2398 migration absence guard now allows only PM-authorized Task2403 migration', () => {
  const depotWorkshopMigrations = migrationFiles().filter((fileName) => (
    /depot|workshop|repair_order|repair_orders|work_order|work_orders/i.test(fileName)
  ));

  assert.deepEqual(depotWorkshopMigrations, ['028_create_depot_workshop_repair_orders.sql']);
});

test('repository contract source keeps DB SQL formal report provider and finalAppointment behavior absent', () => {
  const helper = read(HELPER_FILE);

  assertDoesNotMatchAny(helper, [
    /\bSELECT\b|\bINSERT\s+INTO\b|\bUPDATE\s+\w+\b|\bDELETE\s+FROM\b/i,
    /\bALTER\s+TABLE\b|\bCREATE\s+TABLE\b|\bDROP\s+TABLE\b|\bTRUNCATE\b/i,
    /\bquery\s*\(|\bexecute\s*\(|\btransaction\s*\(/,
    /createFieldServiceReport|approveFieldServiceReport|publishFieldServiceReport|finalizeFieldServiceReport/i,
    /createCompletionReport|approveCompletionReport|publishCompletionReport|finalizeCompletionReport/i,
    /completeAppointment|finalizeAppointment|mutateAppointment|setFinalAppointment/i,
    /finalAppointmentId\s*[:=]/,
    /send(Line|Sms|SMS|Email|Webhook)/,
    /createSettlement|runSettlement|stripe/i,
  ], 'Task2398 helper forbidden behavior');
});

test('Task2397 packet remains visible and Task2398 doc records non-authorization', () => {
  const task2397 = read(TASK2397_DOC);
  const task2398 = read(TASK2398_DOC);

  assertIncludesAll(task2397, [
    'Recommended next bounded task: pure repository contract helper/interface static guard.',
    'repository contract first',
    'No dedicated Depot / Workshop repair order repository implementation exists.',
  ], 'Task2397 packet');

  assertIncludesAll(task2398, [
    'Task2398 Depot Workshop Repair Order Repository Contract Pure Helper',
    'source-level contract task',
    'normalizeDepotWorkshopRepairOrderRepositoryWriteCommand(input)',
    'normalizeDepotWorkshopRepairOrderRepositoryResult(input)',
    'buildDepotWorkshopRepairOrderRepositorySafeFailure(reasonCode, details)',
    'No DB commands',
    'No SQL execution',
    'No migration creation',
    'No route write-scope behavior',
    'No formal Field Service Report / Completion Report creation, approval, publication, or finalization behavior',
    'No `finalAppointmentId` mutation path',
    'The 7 held historical docs remain outside Task2398 scope',
  ], 'Task2398 doc');
});

test('Task2398 docs and static guard introduce no executable authorization or real credentials', () => {
  const combined = [
    read(TASK2398_DOC),
    read(UNIT_TEST_FILE),
    read(STATIC_TEST_FILE),
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
  ], 'Task2398 docs/tests executable authorization');
});
