'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const TASK2406_DOC = 'docs/task-2406-depot-workshop-repair-order-repository-adapter-design-packet-no-runtime-change-no-db-execution-no-provider-no-package.md';
const TASK2407_DOC = 'docs/task-2407-depot-workshop-repair-order-sql-repository-adapter-fake-client-implementation-no-real-db-execution-no-migration-apply-no-route-no-provider-no-package.md';
const TASK2407_UNIT_TEST = 'tests/depotWorkshop/depotWorkshopRepairOrderSqlRepositoryAdapter.unit.test.js';
const TASK2407_BOUNDARY_TEST = 'tests/depotWorkshop/depotWorkshopRepairOrderSqlRepositoryAdapterBoundary.static.test.js';
const ADAPTER_FILE = 'src/repositories/DepotWorkshopRepairOrderSqlRepositoryAdapter.js';
const CONTRACT_FILE = 'src/depotWorkshop/depotWorkshopRepairOrderRepositoryContract.js';
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

test('Task2408 portfolio context artifacts exist', () => {
  for (const relativePath of [
    TASK2406_DOC,
    TASK2407_DOC,
    TASK2407_UNIT_TEST,
    TASK2407_BOUNDARY_TEST,
    ADAPTER_FILE,
    CONTRACT_FILE,
    MIGRATION_028,
    ROUTE_FILE,
  ]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }
});

test('adapter export dependency contract and target table remain frozen', () => {
  const adapter = read(ADAPTER_FILE);
  const contract = read(CONTRACT_FILE);

  assertIncludesAll(adapter, [
    'createDepotWorkshopRepairOrderSqlRepositoryAdapter',
    'const dbClient = source.dbClient',
    "require('../depotWorkshop/depotWorkshopRepairOrderRepositoryContract')",
    'normalizeDepotWorkshopRepairOrderRepositoryWriteCommand',
    'normalizeDepotWorkshopRepairOrderRepositoryResult',
    'buildDepotWorkshopRepairOrderRepositorySafeFailure',
    'INSERT INTO depot_workshop_repair_orders',
    'ON CONFLICT (organization_id, repair_order_ref)',
  ], 'Task2408 adapter frozen boundary');

  assertIncludesAll(contract, [
    'normalizeDepotWorkshopRepairOrderRepositoryWriteCommand',
    'normalizeDepotWorkshopRepairOrderRepositoryResult',
    'buildDepotWorkshopRepairOrderRepositorySafeFailure',
  ], 'Task2408 repository contract');
});

test('adapter remains fake-client injectable and parameterized', () => {
  const adapter = read(ADAPTER_FILE);

  assertIncludesAll(adapter, [
    'resolveQueryExecutor(dbClient)',
    'dbClient.query',
    'dbClient.execute',
    'text: WRITE_REPAIR_ORDER_SQL',
    'values: Object.freeze([',
    '$1, $2, $3, $4, $5, $6, $7, $8, $9',
    '$10, $11, $12, $13, $14, $15, $16, $17::jsonb, $18::jsonb',
    'safeJsonText(normalized.auditIntent)',
    'safeJsonText(normalized.customerProjectionPreview)',
  ], 'Task2408 fake-client parameterized adapter');

  assertDoesNotMatchAny(adapter, [
    /`[^`]*\$\{[^}]+}/,
    /\+\s*command\./,
    /\+\s*normalized\./,
    /\+\s*input\./,
  ], 'Task2408 interpolated SQL values');
});

test('adapter has no global DB pool env Zeabur secrets or package backed dependency', () => {
  const adapter = read(ADAPTER_FILE);

  assertDoesNotMatchAny(adapter, [
    /require\(['"]pg['"]\)/,
    /require\(['"]postgres['"]\)/,
    /require\(['"]mysql2?['"]\)/,
    /new\s+Pool\b/,
    /\bPool\s*\(/,
    /createPool\s*\(/,
    /process\.env/,
    /DATABASE_URL\s*[:=]/,
    /ZEABUR/i,
    /\bsecret\b/i,
    /\bpassword\b/i,
    /\btoken\b/i,
    /fetch\s*\(/,
    /axios|superagent|node-fetch/,
  ], 'Task2408 forbidden adapter dependency access');
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
    /INSERT\s+INTO\s+depot_workshop_repair_orders/i,
    /UPDATE\s+depot_workshop_repair_orders/i,
  ], 'Task2408 runtime adapter wiring');
});

test('route write scope remains blocked and migration 028 still targets repair orders', () => {
  const route = read(ROUTE_FILE);
  const migration = read(MIGRATION_028);

  assertIncludesAll(route, [
    'writeRequested(req)',
    "failure('depot_repair_route_write_scope_not_approved', req)",
  ], 'Task2408 route write scope');

  assertIncludesAll(migration, [
    'CREATE TABLE IF NOT EXISTS depot_workshop_repair_orders',
    'metadata_safe jsonb NOT NULL',
    'customer_projection_safe jsonb NOT NULL',
    'CREATE UNIQUE INDEX IF NOT EXISTS idx_depot_workshop_repair_orders_org_ref',
    'ON depot_workshop_repair_orders(organization_id, repair_order_ref)',
  ], 'Task2408 migration 028 target');
});

test('adapter safety surface exposes no raw rows errors payloads reports or final appointment mutation', () => {
  const adapter = read(ADAPTER_FILE);
  const unitTestSource = read(TASK2407_UNIT_TEST);

  assertIncludesAll(adapter, [
    'resultFromRow(row, command)',
    'normalizeDepotWorkshopRepairOrderRepositoryResult({',
    'return safeFailure(\'depot_workshop_repair_order_repository_write_failed\', normalized.command);',
  ], 'Task2408 safe adapter result path');

  assertIncludesAll(unitTestSource, [
    'rawDbRow',
    'fake DB thrown error fails closed without raw leakage',
    'fake DB rejected error fails closed without raw leakage',
    'no formal FSR Completion Report or finalAppointment fields are emitted',
    'input command and fake DB result objects are not mutated',
  ], 'Task2408 fake-client safety tests');

  assertDoesNotMatchAny(adapter, [
    /\brawDbRow\b/,
    /\braw_db_row\b/,
    /\brawRows\b/,
    /\braw_rows\b/,
    /\brawAuditPayload\b/,
    /\braw_audit_payload\b/,
    /\brawError\b/,
    /\braw_error\b/,
    /\bcaught\.(?:message|stack)\b/,
    /\berror\.(?:message|stack)\b/,
    /\bproviderPayload\b/,
    /\bprovider_payload\b/,
    /\bbilling\b/i,
    /\binvoice\b/i,
    /\bpayment\b/i,
    /\baiOutput\b/,
    /\bai_output\b/,
    /\brag\b/i,
    /\bvector\b/i,
    /\bfieldServiceReport\b/,
    /\bfield_service_report\b/,
    /\bcompletionReport\b/,
    /\bcompletion_report\b/,
    /\bfinalAppointmentId\b/,
    /\bfinal_appointment_id\b/,
  ], 'Task2408 forbidden adapter safety surface');
});

test('portfolio docs and guards introduce no executable DB migration provider package authorization', () => {
  const combined = [
    read(TASK2406_DOC),
    read(TASK2407_DOC),
    read(TASK2407_BOUNDARY_TEST),
  ].join('\n');

  assertIncludesAll(combined, [
    'No real DB execution occurred.',
    'No SQL execution against a real DB occurred.',
    'No migration dry-run/apply occurred.',
    'No real DB connection occurred.',
    'No route/service/controller/runtime wiring occurred.',
    'No provider sending occurred.',
    'No package or package-lock changes occurred.',
    'No formal Field Service Report / Completion Report behavior was added.',
    'No finalAppointmentId mutation path was added.',
  ], 'Task2408 existing non-authorization record');

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
  ], 'Task2408 executable authorization');
});
