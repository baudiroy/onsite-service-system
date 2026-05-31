'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const HELPER_FILE = 'src/depotWorkshop/depotWorkshopAssignmentIntentResponsePresenter.js';
const UNIT_TEST_FILE = 'tests/depotWorkshop/depotWorkshopAssignmentIntentResponsePresenter.unit.test.js';
const STATIC_TEST_FILE = 'tests/depotWorkshop/depotWorkshopAssignmentIntentResponsePresenterBoundary.static.test.js';
const TASK2386_DOC = 'docs/task-2386-depot-workshop-assignment-intent-route-response-presenter-design-packet-no-runtime-change-no-db-no-provider-no-package.md';
const TASK2387_DOC = 'docs/task-2387-depot-workshop-assignment-intent-route-response-presenter-pure-helper-no-route-wiring-no-db-no-provider-no-package.md';
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

test('Task2387 presenter helper docs and tests exist', () => {
  for (const relativePath of [HELPER_FILE, UNIT_TEST_FILE, STATIC_TEST_FILE, TASK2386_DOC, TASK2387_DOC, ROUTE_FILE]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }
});

test('presenter helper has no DB repository provider route app server env or package imports', () => {
  const source = read(HELPER_FILE);

  assert.deepEqual(requireSpecifiers(source), []);
  assertDoesNotMatchAny(source, [
    /import\s+/,
    /process\.env/,
    /DATABASE_URL\s*=/,
    /\bZeabur\b/,
    /require\(/,
    /src\/routes|routes\/depotRepair/i,
    /src\/repositories|DepotIntakeSqlRepositoryAdapter/i,
    /src\/app|src\/server|express/i,
    /\bapp\.listen\s*\(|\bserver\.listen\s*\(|\blisten\s*\(/,
    /\bfetch\s*\(|axios|got|superagent/i,
    /send(Line|Sms|SMS|Email|Webhook)/,
    /\bINSERT\s+INTO\b|\bUPDATE\s+\w+\b|\bDELETE\s+FROM\b|\bALTER\s+TABLE\b|\bCREATE\s+TABLE\b/i,
    /\bnew\s+Pool\b|require\(['"]pg['"]\)|require\(['"]postgres['"]\)/,
    /\bpsql\b|db:migrate|migrations\//i,
    /package-lock|package\.json/,
  ], 'Task2387 presenter helper');
});

test('presenter helper is not wired into depot repair route', () => {
  const route = read(ROUTE_FILE);

  assert.equal(route.includes('depotWorkshopAssignmentIntentResponsePresenter'), false);
  assert.equal(route.includes('presentDepotWorkshopAssignmentIntentResponse'), false);
  assertIncludesAll(route, [
    'depotRepair: sanitizeValue(result.assignmentIntent || result.depotRepair || result.intent || null)',
    'depot_repair_route_write_scope_not_approved',
    'written: false',
  ], 'current unwired route source');
});

test('presenter helper exports pure allowlist presenter contract', () => {
  const source = read(HELPER_FILE);

  assertIncludesAll(source, [
    'DEPOT_WORKSHOP_ASSIGNMENT_INTENT_RESPONSE_FIELDS',
    'CUSTOMER_PROJECTION_PREVIEW_FIELDS',
    'presentDepotWorkshopAssignmentIntentResponse',
    'repairOrderDraftSummary',
    'repairOrderTransitionPlanSummary',
    'repairOrderAuditIntentSummary',
    'repairOrderCustomerProjectionPreview',
    'writeRequired: false',
    'written: false',
    'failureEnvelope',
  ], 'Task2387 presenter helper contract');
});

test('presenter helper does not approve publish formalize FSR Completion Report or finalAppointmentId behavior', () => {
  const source = read(HELPER_FILE);

  assertDoesNotMatchAny(source, [
    /createFieldServiceReport|approveFieldServiceReport|publishFieldServiceReport|revokeFieldServiceReport/i,
    /createCompletionReport|approveCompletionReport|publishCompletionReport|finalizeCompletionReport/i,
    /completeAppointment|finalizeAppointment|mutateAppointment|setFinalAppointment/i,
    /finalAppointmentId\s*=/,
    /fieldServiceReport\s*=/,
    /completionReport\s*=/,
    /customerVisiblePublication\s*=/,
    /\bpublish\s*\(|\brevoke\s*\(|\bapprove\s*\(|\bfinalize\s*\(/,
  ], 'Task2387 presenter helper executable body');
});

test('Task2386 design and Task2387 doc preserve non-authorization boundaries', () => {
  const combined = `${read(TASK2386_DOC)}\n${read(TASK2387_DOC)}`;

  assertIncludesAll(combined, [
    'split internal service intent from route response presenter with an explicit admin-safe allowlist',
    'No route wiring',
    'No route response behavior changes',
    'No DB commands, SQL execution, real DB connection, migration creation, migration dry-run, or migration apply.',
    'No provider sending.',
    'No package or package-lock changes.',
    'No formal Field Service Report / Completion Report creation, approval, publication, or finalization behavior.',
    'No `finalAppointmentId` mutation path.',
    'The 7 held historical docs remain outside Task2387 scope',
  ], 'Task2386 Task2387 docs');
});

test('Task2387 docs and tests do not introduce executable authorization or real credentials', () => {
  const combined = [
    read(TASK2387_DOC),
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
  ], 'Task2387 docs/tests');
});
