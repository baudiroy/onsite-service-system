'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const HELPER_FILE = 'src/depotWorkshop/depotWorkshopRepairOrderStateModel.js';
const UNIT_TEST_FILE = 'tests/depotWorkshop/depotWorkshopRepairOrderStateModel.unit.test.js';
const STATIC_TEST_FILE = 'tests/depotWorkshop/depotWorkshopRepairOrderStateModelBoundary.static.test.js';
const TASK2373_DOC = 'docs/task-2373-depot-workshop-repair-order-state-model-pure-constants-helper-no-route-no-db-no-provider-no-package.md';
const TASK2372_DOC = 'docs/task-2372-depot-workshop-repair-order-contract-state-model-static-guard-no-db-no-route-no-provider-no-package.md';
const ROUTE_FILE = 'src/routes/depotRepair.routes.js';

function projectPath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(projectPath(relativePath), 'utf8');
}

function requireSpecifiers(source) {
  return Array.from(source.matchAll(/require\(\s*['"]([^'"]+)['"]\s*\)/g), (match) => match[1]);
}

function stripConstArrayBlock(source, constName) {
  const marker = `const ${constName} = Object.freeze([`;
  const start = source.indexOf(marker);

  if (start === -1) {
    return source;
  }

  const end = source.indexOf(']);', start);

  assert.notEqual(end, -1, `unterminated ${constName}`);

  return `${source.slice(0, start)}${source.slice(end + 4)}`;
}

function sourceWithoutAllowedLists(source) {
  return [
    'DEPOT_WORKSHOP_REPAIR_ORDER_INTERNAL_ONLY_FIELDS',
    'DEPOT_WORKSHOP_REPAIR_ORDER_CUSTOMER_VISIBLE_FIELDS',
    'UNSAFE_PUBLIC_TEXT_PATTERNS',
  ].reduce((result, constName) => stripConstArrayBlock(result, constName), source);
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

test('Task2373 allowed files exist and Task2372 contract remains visible', () => {
  for (const relativePath of [
    HELPER_FILE,
    UNIT_TEST_FILE,
    STATIC_TEST_FILE,
    TASK2373_DOC,
    TASK2372_DOC,
    ROUTE_FILE,
  ]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }

  assertIncludesAll(read(TASK2372_DOC), [
    'Future repair order / workshop job contract',
    'not a formal customer-facing Field Service Report approval',
    'not a Completion Report approval',
    'not a `finalAppointmentId` mutation path',
    '`repair_waiting_parts` is a future proposal only and is not current runtime behavior.',
  ], 'Task2372 contract doc');
});

test('pure state model helper has no DB route repository provider app server env or package imports', () => {
  const source = read(HELPER_FILE);

  assert.deepEqual(requireSpecifiers(source), []);
  assertDoesNotMatchAny(source, [
    /import\s+/,
    /process\.env/,
    /DATABASE_URL\s*=/,
    /\bZeabur\b/,
    /require\(/,
    /src\/routes|routes\/depotRepair/i,
    /src\/repositories|DepotIntakeSqlRepositoryAdapter/,
    /src\/app|src\/server|express/i,
    /\bapp\.listen\s*\(|\bserver\.listen\s*\(|\blisten\s*\(/,
    /\bfetch\s*\(|axios|got|superagent/i,
    /providerPayload\s*=|send(Line|Sms|SMS|Email|Webhook)/,
    /\bINSERT\s+INTO\b|\bUPDATE\s+\w+\b|\bDELETE\s+FROM\b|\bALTER\s+TABLE\b|\bCREATE\s+TABLE\b/i,
    /\bnew\s+Pool\b|require\(['"]pg['"]\)|require\(['"]postgres['"]\)/,
    /\bpsql\b|db:migrate|migrations\//i,
  ], 'Task2373 helper');
});

test('helper exports only pure state constants validators and projection sanitizer', () => {
  const source = read(HELPER_FILE);

  assertIncludesAll(source, [
    'DEPOT_WORKSHOP_REPAIR_ORDER_STATUSES',
    'DEPOT_WORKSHOP_REPAIR_ORDER_TERMINAL_STATUSES',
    'DEPOT_WORKSHOP_REPAIR_ORDER_INTERNAL_ONLY_FIELDS',
    'DEPOT_WORKSHOP_REPAIR_ORDER_CUSTOMER_VISIBLE_FIELDS',
    'isDepotWorkshopRepairOrderStatus',
    'isDepotWorkshopRepairOrderTerminalStatus',
    'sanitizeDepotWorkshopRepairOrderPublicProjection',
    'intake_received',
    'diagnosis_pending',
    'diagnosis_completed',
    'quote_pending',
    'quote_approved',
    'repair_in_progress',
    'quality_check',
    'ready_for_return',
    'returned',
    'cancelled',
    'closed',
  ], 'Task2373 helper source');

  assert.equal(source.includes('repair_waiting_parts'), false, 'future proposal status must not be exported as active runtime status');
});

test('helper is not wired into the current depot route', () => {
  const route = read(ROUTE_FILE);

  assertIncludesAll(route, [
    "DEPOT_REPAIR_ROUTE_PERMISSION = 'depot.repair.prepare'",
    "DEPOT_REPAIR_ROUTE_PATH = '/api/v1/depot/repairs/:depotIntakeId/assignment-intent'",
    'writeRequested(req)',
    'depot_repair_route_write_scope_not_approved',
  ], 'current depot route');

  assert.equal(route.includes('depotWorkshopRepairOrderStateModel'), false);
  assert.equal(route.includes('sanitizeDepotWorkshopRepairOrderPublicProjection'), false);
  assert.equal(route.includes('DEPOT_WORKSHOP_REPAIR_ORDER_STATUSES'), false);
});

test('helper does not approve publish formalize FSR Completion Report or finalAppointmentId behavior', () => {
  const source = sourceWithoutAllowedLists(read(HELPER_FILE));

  assertDoesNotMatchAny(source, [
    /createFieldServiceReport|approveFieldServiceReport|publishFieldServiceReport|revokeFieldServiceReport/i,
    /createCompletionReport|approveCompletionReport|publishCompletionReport|finalizeCompletionReport/i,
    /completeAppointment|finalizeAppointment|mutateAppointment|setFinalAppointment/i,
    /finalAppointmentId\s*=/,
    /fieldServiceReport\s*=/,
    /completionReport\s*=/,
    /customerVisiblePublication\s*=/,
    /\bpublish\s*\(|\brevoke\s*\(|\bapprove\s*\(|\bfinalize\s*\(/,
  ], 'Task2373 helper executable body');
});

test('Task2373 doc records pure helper contract and non-authorized scopes', () => {
  const doc = read(TASK2373_DOC);

  assertIncludesAll(doc, [
    'Task2373 Depot Workshop Repair Order State Model Pure Constants Helper',
    HELPER_FILE,
    UNIT_TEST_FILE,
    STATIC_TEST_FILE,
    'Existing runtime route behavior is not changed.',
    'No route wiring',
    'No DB commands, SQL execution, real DB connection, migration creation, migration dry-run, or migration apply.',
    'No provider sending.',
    'No package or package-lock changes.',
    'No formal Field Service Report / Completion Report creation, approval, publication, or finalization behavior.',
    'No `finalAppointmentId` mutation path.',
    'customer-visible projection',
    'forbidden field exclusion',
    'input mutation protection',
    'The 7 held historical docs remain outside Task2373 scope',
  ], 'Task2373 doc');
});

test('Task2373 doc and tests do not introduce executable authorization or real credentials', () => {
  const combined = [
    read(TASK2373_DOC),
    read(UNIT_TEST_FILE),
    read(STATIC_TEST_FILE),
  ].join('\n');

  assertDoesNotMatchAny(combined, [
    /postgres(?:ql)?:\/\/[^@\s]+:[^@\s]+@[^/\s]+\/[^\s)]+/i,
    /\b(?:password|passwd|pwd|secret|token|api[_-]?key)\s*[:=]\s*['"]?[A-Za-z0-9._~+/=-]{12,}/i,
    /\bDATABASE_URL\s*=\s*[^'"`\s]+/i,
    /\bcurl\s+/i,
    /\bfet' \+ 'ch\s*\(/,
    /\bsuper' \+ 'test\s*\(/,
    /\bapp\.lis' \+ 'ten\s*\(/,
    /\bserver\.lis' \+ 'ten\s*\(/,
    /\blis' \+ 'ten\s*\(/,
    /\/hea' \+ 'lthz/i,
    /\bps' \+ 'ql\s+/i,
    /\bdb:mig' \+ 'rate\b/i,
  ], 'Task2373 docs/tests');
});
