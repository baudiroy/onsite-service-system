'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const HELPER_FILE = 'src/depotWorkshop/depotWorkshopAssignmentIntentWriteCommand.js';
const ROUTE_FILE = 'src/routes/depotRepair.routes.js';
const SERVICE_FILE = 'src/services/WorkshopAssignmentService.js';
const UNIT_TEST_FILE = 'tests/depotWorkshop/depotWorkshopAssignmentIntentWriteCommand.unit.test.js';
const STATIC_TEST_FILE = 'tests/depotWorkshop/depotWorkshopAssignmentIntentWriteCommandBoundary.static.test.js';
const TASK2393_DOC = 'docs/task-2393-depot-workshop-assignment-intent-write-command-helper-design-packet-no-runtime-change-no-db-no-provider-no-package.md';
const TASK2394_DOC = 'docs/task-2394-depot-workshop-assignment-intent-write-command-pure-helper-no-route-no-db-no-provider-no-package.md';

const ACCEPTED_HELPER_IMPORTS = Object.freeze([
  './depotWorkshopRepairOrderAuditEvent',
  './depotWorkshopRepairOrderCustomerProjection',
  './depotWorkshopRepairOrderTransitionPolicy',
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

test('Task2394 pure write command helper artifacts exist', () => {
  for (const relativePath of [HELPER_FILE, UNIT_TEST_FILE, STATIC_TEST_FILE, TASK2393_DOC, TASK2394_DOC]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }
});

test('helper imports only accepted pure helpers and exports pure command builder', () => {
  const helper = read(HELPER_FILE);

  assert.deepEqual(requireSpecifiers(helper).sort(), [...ACCEPTED_HELPER_IMPORTS].sort());
  assertIncludesAll(helper, [
    'DEPOT_WORKSHOP_ASSIGNMENT_INTENT_WRITE_ACTION',
    "depot_workshop.assignment_intent.write",
    'function buildDepotWorkshopAssignmentIntentWriteCommand(input = {})',
    'buildDepotWorkshopRepairOrderAuditEvent',
    'buildDepotWorkshopRepairOrderCustomerProjection',
    'planDepotWorkshopRepairOrderStatusTransition',
    'module.exports',
  ], 'Task2394 helper export contract');
});

test('helper has no DB repository provider route app server env or package imports', () => {
  const helper = read(HELPER_FILE);

  assertDoesNotMatchAny(helper, [
    /require\(['"].*routes?/i,
    /require\(['"].*controllers?/i,
    /require\(['"].*repositories?/i,
    /require\(['"].*providers?/i,
    /require\(['"].*package/i,
    /process\.env/,
    /DATABASE_URL\s*=/,
    /\bnew\s+Pool\b|require\(['"]pg['"]\)|require\(['"]postgres['"]\)/,
    /\bpsql\b|db:migrate|migrations\//i,
    /supertest\s*\(|fetch\s*\(|axios|got|superagent/i,
    /\bapp\.listen\s*\(|\bserver\.listen\s*\(|\blisten\s*\(/,
  ], 'Task2394 helper forbidden imports and runtime calls');
});

test('helper is not wired into routes services controllers or repositories', () => {
  const route = read(ROUTE_FILE);
  const service = read(SERVICE_FILE);

  assertDoesNotMatchAny(`${route}\n${service}`, [
    /depotWorkshopAssignmentIntentWriteCommand/,
    /buildDepotWorkshopAssignmentIntentWriteCommand/,
  ], 'Task2394 helper runtime wiring');

  assertIncludesAll(route, [
    'depot_repair_route_write_scope_not_approved',
    'writeRequested(req)',
    'presentDepotWorkshopAssignmentIntentResponse',
  ], 'Task2394 route write scope boundary');
});

test('helper does not approve publish formalize reports provider DB package or final appointment behavior', () => {
  const helper = read(HELPER_FILE);

  assertDoesNotMatchAny(helper, [
    /createFieldServiceReport|approveFieldServiceReport|publishFieldServiceReport|finalizeFieldServiceReport/i,
    /createCompletionReport|approveCompletionReport|publishCompletionReport|finalizeCompletionReport/i,
    /completeAppointment|finalizeAppointment|mutateAppointment|setFinalAppointment/i,
    /finalAppointmentId\s*[:=]/,
    /\bINSERT\s+INTO\b/i,
    /\bUPDATE\s+\w+\b/i,
    /\bDELETE\s+FROM\b/i,
    /\bALTER\s+TABLE\b/i,
    /\bCREATE\s+TABLE\b/i,
    /send(Line|Sms|SMS|Email|Webhook)/,
    /createSettlement|runSettlement|stripe/i,
  ], 'Task2394 helper forbidden behavior');
});

test('Task2394 doc records pure helper scope and non-authorization', () => {
  const doc = read(TASK2394_DOC);

  assertIncludesAll(doc, [
    'Task2394 Depot Workshop Assignment Intent Write Command Pure Helper',
    'buildDepotWorkshopAssignmentIntentWriteCommand(input)',
    'depot_workshop.assignment_intent.write',
    'No route wiring',
    'No route write-scope behavior',
    'No DB commands',
    'No provider sending',
    'No package or package-lock changes',
    'No formal Field Service Report / Completion Report creation, approval, publication, or finalization behavior',
    'No `finalAppointmentId` mutation path',
    'The 7 held historical docs remain outside Task2394 scope',
  ], 'Task2394 doc');
});

test('Task2394 docs and tests introduce no executable authorization or real credentials', () => {
  const combined = [
    read(TASK2394_DOC),
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
  ], 'Task2394 docs/tests executable authorization');
});
