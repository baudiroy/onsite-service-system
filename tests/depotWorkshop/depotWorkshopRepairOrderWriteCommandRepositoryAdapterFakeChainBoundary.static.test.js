'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const FAKE_CHAIN_UNIT_TEST = 'tests/depotWorkshop/depotWorkshopRepairOrderWriteCommandRepositoryAdapterFakeChain.unit.test.js';
const FAKE_CHAIN_BOUNDARY_TEST = 'tests/depotWorkshop/depotWorkshopRepairOrderWriteCommandRepositoryAdapterFakeChainBoundary.static.test.js';
const TASK2410_DOC = 'docs/task-2410-depot-workshop-repair-order-write-command-to-sql-repository-adapter-fake-chain-test-no-runtime-change-no-real-db-no-migration-apply-no-provider-no-package.md';
const WRITE_COMMAND_HELPER = 'src/depotWorkshop/depotWorkshopAssignmentIntentWriteCommand.js';
const REPOSITORY_CONTRACT = 'src/depotWorkshop/depotWorkshopRepairOrderRepositoryContract.js';
const SQL_ADAPTER = 'src/repositories/DepotWorkshopRepairOrderSqlRepositoryAdapter.js';
const MIGRATION_028 = 'migrations/028_create_depot_workshop_repair_orders.sql';
const ROUTE_FILE = 'src/routes/depotRepair.routes.js';

const ACCEPTED_FAKE_CHAIN_IMPORTS = Object.freeze([
  'node:assert/strict',
  'node:test',
  '../../src/depotWorkshop/depotWorkshopAssignmentIntentWriteCommand',
  '../../src/repositories/DepotWorkshopRepairOrderSqlRepositoryAdapter',
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

test('Task2410 fake-chain artifacts and required source context exist', () => {
  for (const relativePath of [
    FAKE_CHAIN_UNIT_TEST,
    FAKE_CHAIN_BOUNDARY_TEST,
    TASK2410_DOC,
    WRITE_COMMAND_HELPER,
    REPOSITORY_CONTRACT,
    SQL_ADAPTER,
    MIGRATION_028,
    ROUTE_FILE,
    'docs/task-2394-depot-workshop-assignment-intent-write-command-pure-helper-no-route-no-db-no-provider-no-package.md',
    'docs/task-2395-depot-workshop-assignment-intent-write-command-helper-static-portfolio-guard-no-runtime-change-no-db-no-provider-no-package.md',
    'docs/task-2396-depot-workshop-assignment-intent-write-command-helper-branch-closure-no-runtime-change-no-db-no-provider-no-package.md',
    'docs/task-2409-depot-workshop-repair-order-sql-repository-adapter-branch-closure-no-runtime-change-no-real-db-no-migration-apply-no-provider-no-package.md',
  ]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }
});

test('fake-chain unit test imports only accepted helper adapter and Node test utilities', () => {
  const unitTest = read(FAKE_CHAIN_UNIT_TEST);

  assert.deepEqual(requireSpecifiers(unitTest).sort(), [...ACCEPTED_FAKE_CHAIN_IMPORTS].sort());
  assertIncludesAll(unitTest, [
    'buildDepotWorkshopAssignmentIntentWriteCommand',
    'DEPOT_WORKSHOP_ASSIGNMENT_INTENT_WRITE_ACTION',
    'createDepotWorkshopRepairOrderSqlRepositoryAdapter',
    'adapter.writeRepairOrder(commandEnvelope)',
    'dbClient: {',
    'async query(querySpec)',
    'INSERT INTO depot_workshop_repair_orders',
    'ON CONFLICT \\(organization_id, repair_order_ref\\)',
    'malformed write command fails closed before fake DB call',
    'missing write authorization fails closed before fake DB call',
    'fake DB thrown and rejected errors fail closed without raw leakage',
    'raw DB row payloads are not returned wholesale',
    'input command and fake DB result objects are not mutated',
  ], 'Task2410 fake-chain unit test coverage');
});

test('fake-chain unit test has no real DB app server env Zeabur or secret access', () => {
  const unitTest = read(FAKE_CHAIN_UNIT_TEST);

  assertDoesNotMatchAny(unitTest, [
    /require\(['"]pg['"]\)/,
    /require\(['"]postgres['"]\)/,
    /new\s+Pool\b/,
    /\bPool\s*\(/,
    /createPool\s*\(/,
    /process\.env/,
    /DATABASE_URL\s*[:=]/,
    /ZEABUR/i,
    /\bfet' + 'ch\s*\(/,
    /\bsuper' + 'test\s*\(/,
    /axios|got|superagent|node-fetch/,
    /\bapp\.lis' + 'ten\s*\(/,
    /\bserver\.lis' + 'ten\s*\(/,
    /\blis' + 'ten\s*\(/,
    /\/hea' + 'lthz/i,
    /\bps' + 'ql\s+/i,
    /\bdb:mig' + 'rate\b/i,
  ], 'Task2410 fake-chain executable access');
});

test('accepted helper contract adapter and migration remain visible', () => {
  const helper = read(WRITE_COMMAND_HELPER);
  const contract = read(REPOSITORY_CONTRACT);
  const adapter = read(SQL_ADAPTER);
  const migration = read(MIGRATION_028);

  assertIncludesAll(helper, [
    'buildDepotWorkshopAssignmentIntentWriteCommand',
    'DEPOT_WORKSHOP_ASSIGNMENT_INTENT_WRITE_ACTION',
    'depot_workshop.assignment_intent.write',
  ], 'Task2410 write command helper');

  assertIncludesAll(contract, [
    'normalizeDepotWorkshopRepairOrderRepositoryWriteCommand',
    'normalizeDepotWorkshopRepairOrderRepositoryResult',
    'buildDepotWorkshopRepairOrderRepositorySafeFailure',
  ], 'Task2410 repository contract');

  assertIncludesAll(adapter, [
    'createDepotWorkshopRepairOrderSqlRepositoryAdapter',
    'const dbClient = source.dbClient',
    'text: WRITE_REPAIR_ORDER_SQL',
    'values: Object.freeze([',
    'safeJsonText(normalized.auditIntent)',
    'safeJsonText(normalized.customerProjectionPreview)',
  ], 'Task2410 SQL adapter');

  assertIncludesAll(migration, [
    '-- NOT APPLIED IN TASK 2403.',
    '-- NO DB CONNECTION OR DATABASE EXECUTION IS AUTHORIZED BY THIS FILE.',
    'CREATE TABLE IF NOT EXISTS depot_workshop_repair_orders',
  ], 'Task2410 migration 028 non-execution');
});

test('adapter remains unwired and route write scope remains blocked', () => {
  const runtimeFiles = [
    'src/routes/depotRepair.routes.js',
    'src/services/WorkshopAssignmentService.js',
    'src/server.js',
    'src/app.js',
    'src/routes/index.js',
  ].filter((relativePath) => fs.existsSync(projectPath(relativePath)));
  const runtimeSource = runtimeFiles.map(read).join('\n');
  const route = read(ROUTE_FILE);

  assertDoesNotMatchAny(runtimeSource, [
    /DepotWorkshopRepairOrderSqlRepositoryAdapter/,
    /createDepotWorkshopRepairOrderSqlRepositoryAdapter/,
    /buildDepotWorkshopAssignmentIntentWriteCommand/,
    /INSERT\s+INTO\s+depot_workshop_repair_orders/i,
    /UPDATE\s+depot_workshop_repair_orders/i,
  ], 'Task2410 runtime wiring');

  assertIncludesAll(route, [
    'writeRequested(req)',
    "failure('depot_repair_route_write_scope_not_approved', req)",
  ], 'Task2410 route write scope');
});

test('Task2410 doc records fake-chain coverage and preserves non-authorization', () => {
  const doc = read(TASK2410_DOC);

  assertIncludesAll(doc, [
    'Task2410 Depot Workshop Repair Order Write Command to SQL Repository Adapter Fake Chain Test',
    'command shaping',
    'contract normalization',
    'parameterized adapter query',
    'safe repository result normalization',
    'No real DB execution occurred.',
    'No SQL execution against a real DB occurred.',
    'No migration dry-run/apply occurred.',
    'No route/service/controller/runtime wiring occurred.',
    'No provider sending occurred.',
    'No package or package-lock changes occurred.',
    'No formal Field Service Report / Completion Report behavior was added.',
    'No finalAppointmentId mutation path was added.',
  ], 'Task2410 doc');
});

test('Task2410 artifacts introduce no DB command migration apply provider package or report authorization', () => {
  const combined = [
    read(FAKE_CHAIN_UNIT_TEST),
    read(FAKE_CHAIN_BOUNDARY_TEST),
    read(TASK2410_DOC),
  ].join('\n');

  assertDoesNotMatchAny(combined, [
    /postgres(?:ql)?:\/\/[^@\s]+:[^@\s]+@[^/\s]+\/[^\s)]+/i,
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
    /\b(?:create|approve|publish|finalize)FieldServiceReport\s*\(/i,
    /\b(?:create|approve|publish|finalize)CompletionReport\s*\(/i,
    /\b(?:complete|finalize|mutate|setFinal)Appointment\s*\(/i,
    /send(Line|Sms|SMS|Email|Webhook)/,
    /\b(?:create|run)Settlement\s*\(/i,
  ], 'Task2410 executable authorization');
});
