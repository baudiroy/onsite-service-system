'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const SERVICE_FILE = 'src/services/WorkshopAssignmentService.js';
const ROUTE_FILE = 'src/routes/depotRepair.routes.js';
const TASK2415_DOC = 'docs/task-2415-depot-workshop-repair-order-runtime-wiring-decision-gate-no-runtime-change-no-real-db-no-migration-apply-no-provider-no-package.md';
const TASK2416_DOC = 'docs/task-2416-depot-workshop-write-prepared-assignment-intent-service-method-fake-repository-composition-no-route-no-real-db-no-migration-apply-no-provider-no-package.md';
const TASK2417_DOC = 'docs/task-2417-depot-workshop-write-prepared-assignment-intent-service-method-static-portfolio-guard-no-runtime-change-no-real-db-no-migration-apply-no-provider-no-package.md';
const TASK2416_UNIT_TEST = 'tests/depotWorkshop/workshopAssignmentServiceWritePreparedAssignmentIntent.unit.test.js';
const TASK2416_BOUNDARY_TEST = 'tests/depotWorkshop/workshopAssignmentServiceWritePreparedAssignmentIntentBoundary.static.test.js';
const WRITE_COMMAND_FILE = 'src/depotWorkshop/depotWorkshopAssignmentIntentWriteCommand.js';
const REPOSITORY_CONTRACT_FILE = 'src/depotWorkshop/depotWorkshopRepairOrderRepositoryContract.js';

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

test('Task2417 portfolio context artifacts exist', () => {
  for (const relativePath of [
    SERVICE_FILE,
    ROUTE_FILE,
    TASK2415_DOC,
    TASK2416_DOC,
    TASK2417_DOC,
    TASK2416_UNIT_TEST,
    TASK2416_BOUNDARY_TEST,
    WRITE_COMMAND_FILE,
    REPOSITORY_CONTRACT_FILE,
  ]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }
});

test('WorkshopAssignmentService keeps prepare and write-prepared boundaries separate', () => {
  const source = read(SERVICE_FILE);

  assertIncludesAll(source, [
    'async prepareAssignmentIntent(input = {})',
    'async writePreparedAssignmentIntent(input = {})',
    'written: false',
    'writeRequired: false',
    'workshop_assignment_write_scope_not_approved',
    'buildDepotWorkshopAssignmentIntentWriteCommand(input)',
    'resolveRepairOrderRepository(options)',
    'repairOrderRepository',
    'repairOrderWriterFrom(repairOrderRepository)',
    'writeRepairOrder({',
    'normalizeDepotWorkshopRepairOrderRepositoryResult({',
    'trustedScope: commandEnvelope.command',
    'return writeSuccess(normalizedResult, commandEnvelope.command);',
  ], 'Task2417 service portfolio');

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
  ], 'Task2417 service direct DB adapter surface');
});

test('write method stays unwired from routes controllers runtime factory and route write scope remains blocked', () => {
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
  ], 'Task2417 route write scope');

  assertDoesNotMatchAny(runtimeSource, [
    /writePreparedAssignmentIntent/,
    /buildDepotWorkshopAssignmentIntentWriteCommand/,
    /createDepotWorkshopRepairOrderSqlRepositoryAdapter/,
    /DepotWorkshopRepairOrderSqlRepositoryAdapter/,
  ], 'Task2417 route controller runtime factory wiring');
});

test('Task2416 tests keep fail-closed fake repository safety coverage visible', () => {
  const unitTest = read(TASK2416_UNIT_TEST);
  const boundaryTest = read(TASK2416_BOUNDARY_TEST);
  const combined = `${unitTest}\n${boundaryTest}\n${read(TASK2416_DOC)}`;

  assertIncludesAll(combined, [
    'missing dependency',
    'malformed input',
    'missing authorization',
    'invalid transition',
    'fail closed',
    'repository thrown rejected malformed and cross-scope results fail closed without raw leakage',
    'raw leakage',
    'raw DB rows / SQL / stack / token / password / secret',
    'provider / billing / AI/RAG payload',
    'formal FSR / Completion Report',
    'finalAppointmentId',
    'input objects and fake repository result objects are not mutated',
    'written` is evidence from the normalized repository result only',
  ], 'Task2417 fail-closed safety coverage');
});

test('Task2417 doc records safety status and only non-authorized next candidates', () => {
  const doc = read(TASK2417_DOC);

  assertIncludesAll(doc, [
    'Current Service Method Boundary',
    'Current Safety Status',
    'No-Real-DB / No-Route-Write / No-Runtime-Wiring Boundaries',
    'service write-method branch closure',
    'runtime factory/service wiring decision follow-up',
    'route write-scope decision packet',
    'disposable DB dry-run tooling check',
    'repository adapter disposable DB verification packet',
    'Task2417 authorizes no runtime/source behavior changes.',
    'The 7 held historical docs remain outside Task2417 scope',
  ], 'Task2417 doc');
});

test('Task2417 artifacts introduce no executable authorization or real-looking credentials', () => {
  const combined = [
    read(TASK2417_DOC),
    read('tests/depotWorkshop/workshopAssignmentServiceWritePreparedAssignmentIntentPortfolio.static.test.js'),
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
  ], 'Task2417 executable authorization');
});
