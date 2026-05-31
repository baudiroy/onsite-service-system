'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const ROUTE_FILE = 'src/routes/depotRepair.routes.js';
const PRESENTER_FILE = 'src/depotWorkshop/depotWorkshopAssignmentIntentResponsePresenter.js';
const UNIT_TEST_FILE = 'tests/depotWorkshop/depotWorkshopAssignmentIntentRouteResponsePresenterWiring.unit.test.js';
const STATIC_TEST_FILE = 'tests/depotWorkshop/depotWorkshopAssignmentIntentRouteResponsePresenterWiringBoundary.static.test.js';
const TASK2387_DOC = 'docs/task-2387-depot-workshop-assignment-intent-route-response-presenter-pure-helper-no-route-wiring-no-db-no-provider-no-package.md';
const TASK2388_DOC = 'docs/task-2388-depot-workshop-assignment-intent-route-response-presenter-wiring-no-route-path-change-no-db-no-provider-no-package.md';

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

test('Task2388 route presenter wiring artifacts exist', () => {
  for (const relativePath of [ROUTE_FILE, PRESENTER_FILE, UNIT_TEST_FILE, STATIC_TEST_FILE, TASK2387_DOC, TASK2388_DOC]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }
});

test('route imports presenter and success body delegates to it', () => {
  const route = read(ROUTE_FILE);

  assertIncludesAll(route, [
    "require('../depotWorkshop/depotWorkshopAssignmentIntentResponsePresenter')",
    'presentDepotWorkshopAssignmentIntentResponse',
    'function successBody(result, req = {})',
    'return presentDepotWorkshopAssignmentIntentResponse(result, {',
    'requestId: requestIdFrom(req, bodyFromRequest(req))',
  ], 'route presenter wiring');
});

test('route path permission and write scope markers remain unchanged', () => {
  const route = read(ROUTE_FILE);

  assertIncludesAll(route, [
    "const DEPOT_REPAIR_ROUTE_PERMISSION = 'depot.repair.prepare'",
    "const DEPOT_REPAIR_ROUTE_PATH = '/api/v1/depot/repairs/:depotIntakeId/assignment-intent'",
    'requirePermission(DEPOT_REPAIR_ROUTE_PERMISSION)',
    'depot_repair_route_write_scope_not_approved',
    'writeRequested(req)',
    'presentDepotWorkshopAssignmentIntentResponse',
  ], 'route boundary markers');
});

test('presenter remains pure and has no route DB provider package imports', () => {
  const presenter = read(PRESENTER_FILE);

  assert.deepEqual(requireSpecifiers(presenter), []);
  assertDoesNotMatchAny(presenter, [
    /require\(/,
    /import\s+/,
    /process\.env/,
    /DATABASE_URL\s*=/,
    /src\/routes|routes\/depotRepair/i,
    /src\/repositories|DepotIntakeSqlRepositoryAdapter/i,
    /require\(['"].*provider/i,
    /package-lock|package\.json/,
    /\bnew\s+Pool\b|require\(['"]pg['"]\)|require\(['"]postgres['"]\)/,
    /\bpsql\b|db:migrate|migrations\//i,
    /send(Line|Sms|SMS|Email|Webhook)/,
    /fetch\s*\(|axios|got|superagent/i,
    /\bapp\.listen\s*\(|\bserver\.listen\s*\(|\blisten\s*\(/,
  ], 'presenter purity after route wiring');
});

test('route and presenter introduce no formal report final appointment provider DB package or smoke behavior', () => {
  const source = `${read(ROUTE_FILE)}\n${read(PRESENTER_FILE)}`;

  assertDoesNotMatchAny(source, [
    /createFieldServiceReport|approveFieldServiceReport|publishFieldServiceReport|finalizeFieldServiceReport/i,
    /createCompletionReport|approveCompletionReport|publishCompletionReport|finalizeCompletionReport/i,
    /finalAppointmentId\s*[:=]/,
    /\bINSERT\s+INTO\b/i,
    /\bUPDATE\s+\w+\b/i,
    /\bDELETE\s+FROM\b/i,
    /\bALTER\s+TABLE\b/i,
    /\bCREATE\s+TABLE\b/i,
    /send(Line|Sms|SMS|Email|Webhook)/,
    /createSettlement|runSettlement|stripe/i,
    /supertest\s*\(|fetch\s*\(|axios|got|superagent/i,
    /\/healthz/i,
  ], 'Task2388 route presenter wiring forbidden source behavior');
});

test('Task2388 doc records bounded route presenter wiring and non-authorization', () => {
  const doc = read(TASK2388_DOC);

  assertIncludesAll(doc, [
    'Task2388 Depot Workshop Assignment Intent Route Response Presenter Wiring',
    'success response boundary',
    'presentDepotWorkshopAssignmentIntentResponse(result, requestContext)',
    'No route path or mount changes.',
    'No permission change.',
    'No service behavior changes.',
    'No DB commands, SQL execution, real DB connection, migration creation, migration dry-run, or migration apply.',
    'No provider sending.',
    'No package or package-lock changes.',
    'No formal Field Service Report / Completion Report creation, approval, publication, or finalization behavior.',
    'No `finalAppointmentId` mutation path.',
    'The 7 held historical docs remain outside Task2388 scope',
  ], 'Task2388 doc');
});

test('Task2388 docs and tests do not introduce executable authorization or real credentials', () => {
  const combined = [
    read(TASK2388_DOC),
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
  ], 'Task2388 docs/tests executable authorization');
});
