'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const SERVICE_FILE = 'src/services/WorkshopAssignmentService.js';
const ROUTE_FILE = 'src/routes/depotRepair.routes.js';
const UNIT_TEST_FILE = 'tests/depotWorkshop/workshopAssignmentServiceRepairOrderHelperIntegration.unit.test.js';
const STATIC_TEST_FILE = 'tests/depotWorkshop/workshopAssignmentServiceRepairOrderHelperIntegrationBoundary.static.test.js';
const TASK_DOC = 'docs/task-2381-depot-workshop-repair-order-helper-workshop-assignment-service-integration-no-route-no-db-no-provider-no-package.md';

const ACCEPTED_HELPER_IMPORTS = Object.freeze([
  '../depotWorkshop/depotWorkshopRepairOrderAuditEvent',
  '../depotWorkshop/depotWorkshopRepairOrderContract',
  '../depotWorkshop/depotWorkshopRepairOrderCustomerProjection',
  '../depotWorkshop/depotWorkshopRepairOrderTransitionPolicy',
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

test('Task2381 allowed files exist', () => {
  for (const relativePath of [SERVICE_FILE, ROUTE_FILE, UNIT_TEST_FILE, STATIC_TEST_FILE, TASK_DOC]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }
});

test('WorkshopAssignmentService imports only accepted pure repair order helpers', () => {
  const source = read(SERVICE_FILE);

  assert.deepEqual(requireSpecifiers(source).sort(), [...ACCEPTED_HELPER_IMPORTS].sort());
  assertIncludesAll(source, [
    'buildDepotWorkshopRepairOrderDraft',
    'planDepotWorkshopRepairOrderStatusTransition',
    'buildDepotWorkshopRepairOrderAuditEvent',
    'buildDepotWorkshopRepairOrderCustomerProjection',
    'buildRepairOrderHelperSections',
    'buildRepairOrderHelperInput',
    'buildRepairOrderTransitionPlan',
    'buildRepairOrderAuditIntent',
    'buildRepairOrderCustomerProjection',
  ], 'WorkshopAssignmentService helper integration');
});

test('WorkshopAssignmentService remains prepare-only and written false', () => {
  const source = read(SERVICE_FILE);

  assertIncludesAll(source, [
    'prepareAssignmentIntent',
    'written: false',
    'writeRequired: false',
    'workshop_assignment_write_scope_not_approved',
    'findDepotIntakeState',
    'repairOrderDraft',
    'repairOrderTransitionPlan',
    'repairOrderAuditIntent',
    'repairOrderCustomerProjection',
  ], 'WorkshopAssignmentService prepare-only integration');

  assertDoesNotMatchAny(source, [
    /\bINSERT\s+INTO\b/i,
    /\bUPDATE\s+\w+\b/i,
    /\bDELETE\s+FROM\b/i,
    /\bALTER\s+TABLE\b/i,
    /\bCREATE\s+TABLE\b/i,
    /\bnew\s+Pool\b|require\(['"]pg['"]\)|require\(['"]postgres['"]\)/,
    /process\.env|DATABASE_URL\s*=/,
    /src\/routes|routes\/depotRepair|createDepotRepairRouteHandler/,
    /src\/app|src\/server|express/i,
    /\bfetch\s*\(|axios|got|superagent/i,
    /send(Line|Sms|SMS|Email|Webhook)/,
    /createFieldServiceReport|approveFieldServiceReport|publishFieldServiceReport|completeAppointment|finalizeAppointment/i,
    /finalAppointmentId\s*[:=]/,
  ], 'WorkshopAssignmentService forbidden behavior');
});

test('route remains the write-scope boundary and has no repair order helper wiring', () => {
  const route = read(ROUTE_FILE);

  assertIncludesAll(route, [
    'depot_repair_route_write_scope_not_approved',
    'written: false',
    "const DEPOT_REPAIR_ROUTE_PATH = '/api/v1/depot/repairs/:depotIntakeId/assignment-intent'",
  ], 'depot repair route');

  for (const marker of [
    'depotWorkshopRepairOrderContract',
    'depotWorkshopRepairOrderTransitionPolicy',
    'depotWorkshopRepairOrderAuditEvent',
    'depotWorkshopRepairOrderCustomerProjection',
    'buildDepotWorkshopRepairOrderDraft',
    'planDepotWorkshopRepairOrderStatusTransition',
  ]) {
    assert.equal(route.includes(marker), false, `route should not include ${marker}`);
  }
});

test('Task2381 tests prove safe helper sections and forbidden field exclusion', () => {
  const unitTest = read(UNIT_TEST_FILE);

  assertIncludesAll(unitTest, [
    'assignment intent remains prepare-only and includes safe detached repair order helper sections',
    'missing repair order source requirements safely omit helper sections without breaking base assignment intent',
    'invalid transition target is omitted safely while draft audit and projection stay bounded',
    'forbidden command payload and route write intent still fail before repository read',
    'subcontractor assignment scope remains required before helper-derived sections are prepared',
    'repairOrderDraft',
    'repairOrderTransitionPlan',
    'repairOrderAuditIntent',
    'repairOrderCustomerProjection',
    'finalAppointmentId',
    'fieldServiceReport',
    'completionReport',
    'providerPayload',
    'billingInternals',
    'aiOutput',
  ], 'Task2381 unit tests');
});

test('Task2381 documentation records service-only integration and non-authorized scopes', () => {
  const doc = read(TASK_DOC);

  assertIncludesAll(doc, [
    'Task2381 Depot Workshop Repair Order Helper Workshop Assignment Service Integration',
    'Exact service boundary changed',
    '`src/services/WorkshopAssignmentService.js#createWorkshopAssignmentService().prepareAssignmentIntent`',
    'No route path or mount changes.',
    'No DB commands, SQL execution, real DB connection, migration creation, migration dry-run, or migration apply.',
    'No provider sending.',
    'No package or package-lock changes.',
    'No formal Field Service Report / Completion Report creation, approval, publication, or finalization behavior.',
    'No `finalAppointmentId` mutation path.',
    'The 7 held historical docs remain outside Task2381 scope',
  ], 'Task2381 doc');
});

test('Task2381 docs and tests introduce no executable authorization or real credentials', () => {
  const combined = [
    read(TASK_DOC),
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
  ], 'Task2381 docs/tests');
});
