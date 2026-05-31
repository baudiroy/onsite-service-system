'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const TASK2410_DOC = 'docs/task-2410-depot-workshop-repair-order-write-command-to-sql-repository-adapter-fake-chain-test-no-runtime-change-no-real-db-no-migration-apply-no-provider-no-package.md';
const TASK2411_DOC = 'docs/task-2411-depot-workshop-repair-order-write-command-repository-adapter-fake-chain-static-portfolio-guard-no-runtime-change-no-real-db-no-migration-apply-no-provider-no-package.md';
const FAKE_CHAIN_UNIT_TEST = 'tests/depotWorkshop/depotWorkshopRepairOrderWriteCommandRepositoryAdapterFakeChain.unit.test.js';
const FAKE_CHAIN_BOUNDARY_TEST = 'tests/depotWorkshop/depotWorkshopRepairOrderWriteCommandRepositoryAdapterFakeChainBoundary.static.test.js';
const SQL_ADAPTER_UNIT_TEST = 'tests/depotWorkshop/depotWorkshopRepairOrderSqlRepositoryAdapter.unit.test.js';
const SQL_ADAPTER_PORTFOLIO_TEST = 'tests/depotWorkshop/depotWorkshopRepairOrderSqlRepositoryAdapterPortfolio.static.test.js';
const WRITE_COMMAND_HELPER = 'src/depotWorkshop/depotWorkshopAssignmentIntentWriteCommand.js';
const SQL_ADAPTER = 'src/repositories/DepotWorkshopRepairOrderSqlRepositoryAdapter.js';
const REPOSITORY_CONTRACT = 'src/depotWorkshop/depotWorkshopRepairOrderRepositoryContract.js';
const MIGRATION_028 = 'migrations/028_create_depot_workshop_repair_orders.sql';
const ROUTE_FILE = 'src/routes/depotRepair.routes.js';

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

test('Task2411 portfolio context artifacts exist', () => {
  for (const relativePath of [
    TASK2410_DOC,
    TASK2411_DOC,
    FAKE_CHAIN_UNIT_TEST,
    FAKE_CHAIN_BOUNDARY_TEST,
    SQL_ADAPTER_UNIT_TEST,
    SQL_ADAPTER_PORTFOLIO_TEST,
    WRITE_COMMAND_HELPER,
    SQL_ADAPTER,
    REPOSITORY_CONTRACT,
    MIGRATION_028,
    ROUTE_FILE,
    'docs/task-2407-depot-workshop-repair-order-sql-repository-adapter-fake-client-implementation-no-real-db-execution-no-migration-apply-no-route-no-provider-no-package.md',
    'docs/task-2408-depot-workshop-repair-order-sql-repository-adapter-static-portfolio-guard-no-runtime-change-no-real-db-no-migration-apply-no-provider-no-package.md',
    'docs/task-2409-depot-workshop-repair-order-sql-repository-adapter-branch-closure-no-runtime-change-no-real-db-no-migration-apply-no-provider-no-package.md',
  ]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }
});

test('fake-chain composition and accepted adapter method surface remain covered', () => {
  const unitTest = read(FAKE_CHAIN_UNIT_TEST);

  assertIncludesAll(unitTest, [
    'buildDepotWorkshopAssignmentIntentWriteCommand',
    'createDepotWorkshopRepairOrderSqlRepositoryAdapter',
    'fakeAdapter({ onQuery } = {})',
    'dbClient: {',
    'async query(querySpec)',
    'adapter.writeRepairOrder(commandEnvelope)',
    'write command composes with fake SQL adapter into parameterized repository result',
  ], 'Task2411 fake-chain composition');
});

test('fake-chain parameterized query and target table coverage remain visible', () => {
  const unitTest = read(FAKE_CHAIN_UNIT_TEST);

  assertIncludesAll(unitTest, [
    'calls[0].text',
    'calls[0].values.slice(0, 6)',
    'INSERT INTO depot_workshop_repair_orders',
    'ON CONFLICT \\(organization_id, repair_order_ref\\)',
    "calls[0].text.includes('org-chain-1'), false",
    "calls[0].text.includes('case-chain-1'), false",
    "calls[0].text.includes('RO-chain-1'), false",
    "'diagnosis_pending'",
  ], 'Task2411 fake-chain parameterized SQL coverage');
});

test('fake-chain safe result written evidence and route write-scope denial remain covered', () => {
  const unitTest = read(FAKE_CHAIN_UNIT_TEST);
  const boundaryTest = read(FAKE_CHAIN_BOUNDARY_TEST);
  const route = read(ROUTE_FILE);

  assertIncludesAll(unitTest, [
    "result.repositoryKind, 'depot_workshop.repair_order_repository_contract'",
    "result.status, 'written'",
    'written remains repository result evidence only',
    'routeWriteScopeApproved',
    'writeScopeApproved',
  ], 'Task2411 safe repository result evidence');

  assertIncludesAll(boundaryTest, [
    'adapter remains unwired and route write scope remains blocked',
    "failure('depot_repair_route_write_scope_not_approved', req)",
  ], 'Task2411 boundary route write-scope coverage');

  assertIncludesAll(route, [
    'writeRequested(req)',
    "failure('depot_repair_route_write_scope_not_approved', req)",
  ], 'Task2411 route write-scope source');
});

test('fake-chain failure and no-leakage safety coverage remains visible', () => {
  const unitTest = read(FAKE_CHAIN_UNIT_TEST);

  assertIncludesAll(unitTest, [
    'malformed write command fails closed before fake DB call',
    'missing trusted organization case source or action fails closed before fake DB call',
    'missing write authorization fails closed before fake DB call',
    'fake DB thrown and rejected errors fail closed without raw leakage',
    'malformed and cross-scope fake DB results fail closed',
    'raw DB row payloads are not returned wholesale',
    'formal reports finalAppointment and unsafe payload markers are not emitted',
    'input command and fake DB result objects are not mutated',
    'raw sql stack token password secret',
    'provider payload',
    'billing invoice',
    'openai rag vector',
    'completion report final appointment',
    'final_appointment_id',
  ], 'Task2411 fake-chain safety coverage');
});

test('accepted helper adapter contract migration and route boundaries remain frozen', () => {
  const helper = read(WRITE_COMMAND_HELPER);
  const adapter = read(SQL_ADAPTER);
  const contract = read(REPOSITORY_CONTRACT);
  const migration = read(MIGRATION_028);

  assertIncludesAll(helper, [
    'buildDepotWorkshopAssignmentIntentWriteCommand',
    'DEPOT_WORKSHOP_ASSIGNMENT_INTENT_WRITE_ACTION',
    'depot_workshop.assignment_intent.write',
  ], 'Task2411 write command helper');

  assertIncludesAll(adapter, [
    'createDepotWorkshopRepairOrderSqlRepositoryAdapter',
    'const dbClient = source.dbClient',
    'text: WRITE_REPAIR_ORDER_SQL',
    'values: Object.freeze([',
    'INSERT INTO depot_workshop_repair_orders',
  ], 'Task2411 SQL adapter');

  assertIncludesAll(contract, [
    'normalizeDepotWorkshopRepairOrderRepositoryWriteCommand',
    'normalizeDepotWorkshopRepairOrderRepositoryResult',
    'buildDepotWorkshopRepairOrderRepositorySafeFailure',
  ], 'Task2411 repository contract');

  assertIncludesAll(migration, [
    '-- NOT APPLIED IN TASK 2403.',
    '-- NO DB CONNECTION OR DATABASE EXECUTION IS AUTHORIZED BY THIS FILE.',
    'CREATE TABLE IF NOT EXISTS depot_workshop_repair_orders',
  ], 'Task2411 migration 028 inert status');
});

test('adapter remains unwired from runtime and no real DB surface is introduced', () => {
  const runtimeFiles = [
    'src/routes/depotRepair.routes.js',
    'src/services/WorkshopAssignmentService.js',
    'src/server.js',
    'src/app.js',
    'src/routes/index.js',
  ].filter((relativePath) => fs.existsSync(projectPath(relativePath)));
  const runtimeSource = runtimeFiles.map(read).join('\n');
  const fakeChainSource = read(FAKE_CHAIN_UNIT_TEST);

  assertDoesNotMatchAny(runtimeSource, [
    /DepotWorkshopRepairOrderSqlRepositoryAdapter/,
    /createDepotWorkshopRepairOrderSqlRepositoryAdapter/,
    /buildDepotWorkshopAssignmentIntentWriteCommand/,
    /INSERT\s+INTO\s+depot_workshop_repair_orders/i,
  ], 'Task2411 runtime wiring');

  assertDoesNotMatchAny(fakeChainSource, [
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
  ], 'Task2411 fake-chain real DB or runtime execution surface');
});

test('Task2411 doc records portfolio status and only non-authorized next candidates', () => {
  const doc = read(TASK2411_DOC);

  assertIncludesAll(doc, [
    'Task2411 Depot Workshop Repair Order Write Command Repository Adapter Fake Chain Static Portfolio Guard',
    'Fake-Chain Verification Status',
    'No-Real-DB / No-Runtime-Wiring Boundaries',
    'Current Safety Boundaries',
    'fake-chain branch closure',
    'disposable DB dry-run authorization packet',
    'runtime factory/service wiring decision gate',
    'route write-scope decision packet',
    'Task2411 does not authorize real DB execution',
  ], 'Task2411 doc portfolio summary');
});

test('Task2411 artifacts introduce no DB command migration apply provider package or report authorization', () => {
  const combined = [
    read(TASK2410_DOC),
    read(TASK2411_DOC),
    read(FAKE_CHAIN_UNIT_TEST),
    read(FAKE_CHAIN_BOUNDARY_TEST),
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
    /\b(?:create|run)Settlement\s*\(/i,
  ], 'Task2411 executable authorization');
});
