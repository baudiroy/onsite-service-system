'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const ADAPTER_FILE = 'src/repositories/DepotWorkshopRepairOrderSqlRepositoryAdapter.js';
const MIGRATION_028 = 'migrations/028_create_depot_workshop_repair_orders.sql';
const ROUTE_FILE = 'src/routes/depotRepair.routes.js';
const TASK2407_DOC = 'docs/task-2407-depot-workshop-repair-order-sql-repository-adapter-fake-client-implementation-no-real-db-execution-no-migration-apply-no-route-no-provider-no-package.md';

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

test('Task2407 adapter source docs and migration artifacts exist', () => {
  for (const relativePath of [
    ADAPTER_FILE,
    MIGRATION_028,
    ROUTE_FILE,
    TASK2407_DOC,
  ]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }
});

test('adapter imports only the accepted repository contract helper', () => {
  const adapter = read(ADAPTER_FILE);

  assertIncludesAll(adapter, [
    "require('../depotWorkshop/depotWorkshopRepairOrderRepositoryContract')",
    'normalizeDepotWorkshopRepairOrderRepositoryWriteCommand',
    'normalizeDepotWorkshopRepairOrderRepositoryResult',
    'buildDepotWorkshopRepairOrderRepositorySafeFailure',
    'createDepotWorkshopRepairOrderSqlRepositoryAdapter',
  ], 'Task2407 adapter contract imports');

  assertDoesNotMatchAny(adapter, [
    /require\(['"]pg['"]\)/,
    /require\(['"]postgres['"]\)/,
    /new\s+Pool\b/,
    /Pool\s*\(/,
    /process\.env/,
    /DATABASE_URL\s*[:=]/,
    /ZEABUR/i,
    /fetch\s*\(/,
    /axios|superagent|node-fetch/,
  ], 'Task2407 forbidden adapter imports and globals');
});

test('adapter remains fake-client injectable and parameterized only', () => {
  const adapter = read(ADAPTER_FILE);

  assertIncludesAll(adapter, [
    'const dbClient = source.dbClient',
    'resolveQueryExecutor(dbClient)',
    'dbClient.query',
    'dbClient.execute',
    'values: Object.freeze([',
    'INSERT INTO depot_workshop_repair_orders',
    'ON CONFLICT (organization_id, repair_order_ref)',
  ], 'Task2407 injected parameterized adapter');

  assertDoesNotMatchAny(adapter, [
    /`[^`]*\$\{[^}]+}/,
    /\+\s*command\./,
    /\+\s*normalized\./,
    /\+\s*input\./,
  ], 'Task2407 SQL interpolation');
});

test('adapter is not wired into routes services controllers or runtime factory', () => {
  const runtimeFiles = [
    'src/routes/depotRepair.routes.js',
    'src/services/WorkshopAssignmentService.js',
    'src/server.js',
    'src/app.js',
    'src/routes/index.js',
  ].filter((relativePath) => fs.existsSync(projectPath(relativePath)));

  const runtimeSource = runtimeFiles.map(read).join('\n');

  assertDoesNotMatchAny(runtimeSource, [
    /DepotWorkshopRepairOrderSqlRepositoryAdapter/,
    /createDepotWorkshopRepairOrderSqlRepositoryAdapter/,
  ], 'Task2407 runtime wiring');
});

test('route write scope remains blocked and migration 028 remains present', () => {
  const route = read(ROUTE_FILE);
  const migration = read(MIGRATION_028);

  assertIncludesAll(route, [
    'depot_repair_route_write_scope_not_approved',
    'writeRequested(req)',
  ], 'Task2407 route write scope');

  assertIncludesAll(migration, [
    'CREATE TABLE IF NOT EXISTS depot_workshop_repair_orders',
    'metadata_safe',
    'customer_projection_safe',
  ], 'Task2407 migration 028');
});

test('Task2407 docs and static guard introduce no real DB migration provider package authorization', () => {
  const combined = [
    read(TASK2407_DOC),
    read('tests/depotWorkshop/depotWorkshopRepairOrderSqlRepositoryAdapterBoundary.static.test.js'),
  ].join('\n');

  assertIncludesAll(combined, [
    'No real DB execution occurred.',
    'No migration dry-run/apply occurred.',
    'No route/service/controller/runtime wiring occurred.',
    'No provider sending occurred.',
    'No package or package-lock changes occurred.',
    'No formal Field Service Report / Completion Report behavior was added.',
    'No finalAppointmentId mutation path was added.',
  ], 'Task2407 non-authorization');

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
  ], 'Task2407 executable authorization');
});
