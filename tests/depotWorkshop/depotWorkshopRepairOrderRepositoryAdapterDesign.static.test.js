'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const TASK2406_DOC = 'docs/task-2406-depot-workshop-repair-order-repository-adapter-design-packet-no-runtime-change-no-db-execution-no-provider-no-package.md';
const MIGRATION_028 = 'migrations/028_create_depot_workshop_repair_orders.sql';
const REPOSITORY_CONTRACT_FILE = 'src/depotWorkshop/depotWorkshopRepairOrderRepositoryContract.js';
const EXISTING_DEPOT_INTAKE_ADAPTER_FILE = 'src/repositories/DepotIntakeSqlRepositoryAdapter.js';
const FUTURE_ADAPTER_FILE = 'src/repositories/DepotWorkshopRepairOrderSqlRepositoryAdapter.js';
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

test('Task2406 design packet context artifacts exist and future adapter is not implemented', () => {
  for (const relativePath of [
    TASK2406_DOC,
    MIGRATION_028,
    REPOSITORY_CONTRACT_FILE,
    EXISTING_DEPOT_INTAKE_ADAPTER_FILE,
    ROUTE_FILE,
  ]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }

  assert.equal(
    fs.existsSync(projectPath(FUTURE_ADAPTER_FILE)),
    false,
    'Task2406 must not add the future repository adapter implementation file',
  );
});

test('design packet documents future adapter file factory dependency input output and table', () => {
  const doc = read(TASK2406_DOC);

  assertIncludesAll(doc, [
    'src/repositories/DepotWorkshopRepairOrderSqlRepositoryAdapter.js',
    'createDepotWorkshopRepairOrderSqlRepositoryAdapter',
    'explicit injected `dbClient`',
    'optional clock only if needed',
    'optional id generator only if needed',
    'no global DB pool',
    'no `process.env`',
    'no `DATABASE_URL`',
    'normalized repository write command from `normalizeDepotWorkshopRepairOrderRepositoryWriteCommand`',
    'normalized result through `normalizeDepotWorkshopRepairOrderRepositoryResult`',
    'depot_workshop_repair_orders',
    'no write if contract normalization fails',
    'fail closed on thrown, rejected, malformed DB result',
  ], 'Task2406 adapter design');
});

test('design packet documents future SQL behavior as design-only and safe', () => {
  const doc = read(TASK2406_DOC);
  const migration = read(MIGRATION_028);

  assertIncludesAll(migration, [
    'CREATE TABLE IF NOT EXISTS depot_workshop_repair_orders',
    'repair_order_ref',
    'request_id',
    'metadata_safe',
    'customer_projection_safe',
  ], 'Task2406 migration context');

  assertIncludesAll(doc, [
    'Future SQL behavior is design-level only in this task.',
    'parameterized insert/upsert candidate only',
    'organization/tenant scoped write candidate',
    '`repair_order_ref` uniqueness within organization scope',
    '`request_id` idempotency behavior candidate',
    'safe JSON handling for `metadata_safe`',
    'safe JSON handling for `customer_projection_safe`',
    'no raw DB row return',
    'no raw SQL/error/stack exposure',
  ], 'Task2406 future SQL design');
});

test('repository contract helper remains the accepted input and output boundary', () => {
  const contract = read(REPOSITORY_CONTRACT_FILE);

  assertIncludesAll(contract, [
    'normalizeDepotWorkshopRepairOrderRepositoryWriteCommand',
    'normalizeDepotWorkshopRepairOrderRepositoryResult',
    'buildDepotWorkshopRepairOrderRepositorySafeFailure',
    'depot_workshop.assignment_intent.write',
    'written: false',
  ], 'Task2406 repository contract helper');
});

test('route write scope remains blocked and future adapter is not wired', () => {
  const route = read(ROUTE_FILE);

  assertIncludesAll(route, [
    'depot_repair_route_write_scope_not_approved',
    'writeRequested(req)',
  ], 'Task2406 route write scope');

  assertDoesNotMatchAny(route, [
    /DepotWorkshopRepairOrderSqlRepositoryAdapter/,
    /createDepotWorkshopRepairOrderSqlRepositoryAdapter/,
    /normalizeDepotWorkshopRepairOrderRepositoryWriteCommand/,
    /INSERT\s+INTO\s+depot_workshop_repair_orders/i,
    /UPDATE\s+depot_workshop_repair_orders/i,
  ], 'Task2406 route adapter wiring');
});

test('Task2406 docs and static guard introduce no executable DB migration provider package authorization', () => {
  const combined = [
    read(TASK2406_DOC),
    read('tests/depotWorkshop/depotWorkshopRepairOrderRepositoryAdapterDesign.static.test.js'),
  ].join('\n');

  assertIncludesAll(combined, [
    'SQL execution in Task2406',
    'migration apply/dry-run',
    'route write scope',
    'provider sending',
    'formal Field Service Report behavior',
    'formal Completion Report behavior',
    '`finalAppointmentId`',
    'package or package-lock changes',
    'Recommended next bounded task: pure adapter implementation with fake injected `dbClient` tests.',
  ], 'Task2406 non-authorization');

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
  ], 'Task2406 executable authorization');
});
