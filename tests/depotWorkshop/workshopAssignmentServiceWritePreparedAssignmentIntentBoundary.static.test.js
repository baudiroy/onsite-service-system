'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const SERVICE_FILE = 'src/services/WorkshopAssignmentService.js';
const ROUTE_FILE = 'src/routes/depotRepair.routes.js';
const UNIT_TEST = 'tests/depotWorkshop/workshopAssignmentServiceWritePreparedAssignmentIntent.unit.test.js';
const TASK2416_DOC = 'docs/task-2416-depot-workshop-write-prepared-assignment-intent-service-method-fake-repository-composition-no-route-no-real-db-no-migration-apply-no-provider-no-package.md';
const TASK2415_DOC = 'docs/task-2415-depot-workshop-repair-order-runtime-wiring-decision-gate-no-runtime-change-no-real-db-no-migration-apply-no-provider-no-package.md';

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

test('Task2416 service method docs tests and decision context exist', () => {
  for (const relativePath of [SERVICE_FILE, ROUTE_FILE, UNIT_TEST, TASK2416_DOC, TASK2415_DOC]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }
});

test('WorkshopAssignmentService contains separate prepare and write prepared methods', () => {
  const source = read(SERVICE_FILE);

  assertIncludesAll(source, [
    'async prepareAssignmentIntent(input = {})',
    'async writePreparedAssignmentIntent(input = {})',
    'buildDepotWorkshopAssignmentIntentWriteCommand(input)',
    'resolveRepairOrderRepository(options)',
    'repairOrderRepository',
    'repairOrderWriterFrom(repairOrderRepository)',
    'writeRepairOrder({',
    'normalizeDepotWorkshopRepairOrderRepositoryResult({',
    'trustedScope: commandEnvelope.command',
  ], 'Task2416 service method');

  assertIncludesAll(source, [
    'written: false',
    'writeRequired: false',
    'workshop_assignment_write_scope_not_approved',
  ], 'Task2416 prepare-only preservation');
});

test('service uses injected repository only and avoids direct DB or adapter wiring', () => {
  const source = read(SERVICE_FILE);

  assertDoesNotMatchAny(source, [
    /DepotWorkshopRepairOrderSqlRepositoryAdapter/,
    /createDepotWorkshopRepairOrderSqlRepositoryAdapter/,
    /require\(['"].*repositories\/DepotWorkshopRepairOrderSqlRepositoryAdapter['"]\)/,
    /new\s+Pool\b/,
    /require\(['"]pg['"]\)/,
    /require\(['"]postgres['"]\)/,
    /process\.env/,
    /DATABASE_URL\s*[:=]/,
    /ZEABUR/i,
    /\bINSERT\s+INTO\b/i,
    /\bUPDATE\s+\w+\b/i,
    /\bDELETE\s+FROM\b/i,
    /\bALTER\s+TABLE\b/i,
    /\bCREATE\s+TABLE\b/i,
  ], 'Task2416 service DB and adapter wiring');
});

test('route write scope remains blocked and no route controller runtime factory wiring is introduced', () => {
  const route = read(ROUTE_FILE);
  const runtimeFiles = [
    'src/routes/depotRepair.routes.js',
    'src/server.js',
    'src/app.js',
    'src/routes/index.js',
  ].filter((relativePath) => fs.existsSync(projectPath(relativePath)));
  const runtimeSource = runtimeFiles.map(read).join('\n');

  assertIncludesAll(route, [
    'writeRequested(req)',
    "failure('depot_repair_route_write_scope_not_approved', req)",
  ], 'Task2416 route write-scope block');

  assertDoesNotMatchAny(runtimeSource, [
    /writePreparedAssignmentIntent/,
    /buildDepotWorkshopAssignmentIntentWriteCommand/,
    /createDepotWorkshopRepairOrderSqlRepositoryAdapter/,
    /DepotWorkshopRepairOrderSqlRepositoryAdapter/,
  ], 'Task2416 route runtime factory wiring');
});

test('unit tests and doc cover fake repository fail-closed safety boundaries', () => {
  const combined = `${read(UNIT_TEST)}\n${read(TASK2416_DOC)}`;

  assertIncludesAll(combined, [
    'fake repository',
    'missing dependency',
    'missing authorization',
    'invalid transition',
    'fail closed',
    'raw leakage',
    'No route write-scope behavior',
    'No real DB execution',
    'No migration dry-run/apply',
    'No provider sending',
    'No package or package-lock changes',
    'No formal Field Service Report / Completion Report behavior',
    'No finalAppointmentId mutation',
  ], 'Task2416 fake repository safety coverage');

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
  ], 'Task2416 executable authorization');
});
