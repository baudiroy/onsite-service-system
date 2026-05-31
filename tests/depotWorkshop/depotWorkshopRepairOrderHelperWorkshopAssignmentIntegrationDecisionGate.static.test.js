'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const TASK2380_DOC = 'docs/task-2380-depot-workshop-repair-order-helper-workshop-assignment-service-integration-decision-gate-no-runtime-change-no-db-no-provider-no-package.md';

const PURE_HELPER_ARTIFACTS = Object.freeze([
  'src/depotWorkshop/depotWorkshopRepairOrderStateModel.js',
  'src/depotWorkshop/depotWorkshopRepairOrderContract.js',
  'src/depotWorkshop/depotWorkshopRepairOrderTransitionPolicy.js',
  'src/depotWorkshop/depotWorkshopRepairOrderAuditEvent.js',
  'src/depotWorkshop/depotWorkshopRepairOrderCustomerProjection.js',
  'tests/depotWorkshop/depotWorkshopRepairOrderPureHelperPortfolio.static.test.js',
  'docs/task-2371-depot-workshop-repair-branch-re-entry-boundary-inventory-no-runtime-change-no-db-no-smoke-no-provider-no-package.md',
  'docs/task-2372-depot-workshop-repair-order-contract-state-model-static-guard-no-db-no-route-no-provider-no-package.md',
  'docs/task-2373-depot-workshop-repair-order-state-model-pure-constants-helper-no-route-no-db-no-provider-no-package.md',
  'docs/task-2374-depot-workshop-repair-order-contract-pure-helper-no-route-no-db-no-provider-no-package.md',
  'docs/task-2375-depot-workshop-repair-order-transition-policy-pure-helper-no-route-no-db-no-provider-no-package.md',
  'docs/task-2376-depot-workshop-repair-order-audit-event-pure-helper-no-route-no-db-no-provider-no-package.md',
  'docs/task-2377-depot-workshop-repair-order-customer-visible-projection-pure-helper-no-route-no-db-no-provider-no-package.md',
  'docs/task-2378-depot-workshop-repair-order-pure-helper-portfolio-static-guard-no-runtime-change-no-db-no-provider-no-package.md',
  'docs/task-2379-depot-workshop-repair-order-pure-helper-branch-closure-no-runtime-change-no-db-no-provider-no-package.md',
]);

const BOUNDARY_FILES = Object.freeze([
  'src/services/WorkshopAssignmentService.js',
  'src/routes/depotRepair.routes.js',
  'src/guards/DepotRepairStatusBoundary.js',
  'src/guards/DepotAccessScopeGuard.js',
  'src/depotWorkshop/depotRepairCustomerVisibleDataFilter.js',
  'src/depotWorkshop/depotWorkshopAuditBoundary.js',
]);

const PURE_HELPER_WIRING_MARKERS = Object.freeze([
  'depotWorkshopRepairOrderStateModel',
  'depotWorkshopRepairOrderContract',
  'depotWorkshopRepairOrderTransitionPolicy',
  'depotWorkshopRepairOrderAuditEvent',
  'depotWorkshopRepairOrderCustomerProjection',
  'buildDepotWorkshopRepairOrderDraft',
  'planDepotWorkshopRepairOrderStatusTransition',
  'buildDepotWorkshopRepairOrderAuditEvent',
  'buildDepotWorkshopRepairOrderCustomerProjection',
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

function countOccurrences(source, phrase) {
  return source.split(phrase).length - 1;
}

test('Task2380 allowed files and accepted pure helper portfolio artifacts exist', () => {
  assert.equal(fs.existsSync(projectPath(TASK2380_DOC)), true, `${TASK2380_DOC} should exist`);

  for (const relativePath of [...PURE_HELPER_ARTIFACTS, ...BOUNDARY_FILES]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }
});

test('WorkshopAssignmentService remains prepare-only with written false and no helper wiring', () => {
  const source = read('src/services/WorkshopAssignmentService.js');

  assert.deepEqual(requireSpecifiers(source), []);
  assertIncludesAll(source, [
    'createWorkshopAssignmentService',
    'prepareAssignmentIntent',
    'buildAssignmentIntent',
    'written: false',
    'writeRequired: false',
    'workshop_assignment_write_scope_not_approved',
    'findDepotIntakeState',
    'depotIntakeRepository',
    'organizationId',
    'brandId',
    'serviceProviderId',
    'subcontractorOrganizationId',
  ], 'WorkshopAssignmentService');

  assertDoesNotMatchAny(source, [
    /\bINSERT\s+INTO\b/i,
    /\bUPDATE\s+\w+\b/i,
    /\bDELETE\s+FROM\b/i,
    /\bALTER\s+TABLE\b/i,
    /\bCREATE\s+TABLE\b/i,
    /\bnew\s+Pool\b|require\(['"]pg['"]\)|require\(['"]postgres['"]\)/,
    /process\.env|DATABASE_URL\s*=/,
    /\bfetch\s*\(|axios|got|superagent/i,
    /send(Line|Sms|SMS|Email|Webhook)/,
    /createFieldServiceReport|approveFieldServiceReport|publishFieldServiceReport|completeAppointment|finalizeAppointment/i,
  ], 'WorkshopAssignmentService');
});

test('route remains prepare-only and blocks write scope before service invocation', () => {
  const source = read('src/routes/depotRepair.routes.js');

  assert.deepEqual(requireSpecifiers(source), [
    '../middlewares/requirePermission',
    '../guards/DepotAccessScopeGuard',
  ]);
  assertIncludesAll(source, [
    "const DEPOT_REPAIR_ROUTE_PERMISSION = 'depot.repair.prepare'",
    "const DEPOT_REPAIR_ROUTE_PATH = '/api/v1/depot/repairs/:depotIntakeId/assignment-intent'",
    'writeRequested(req)',
    'depot_repair_route_write_scope_not_approved',
    'written: false',
    'createDepotRepairRouteHandler',
    'buildServiceInput',
  ], 'depot repair route');
});

test('Task2380 recommends exactly one future source boundary and compares rejected alternatives', () => {
  const doc = read(TASK2380_DOC);

  assert.equal(countOccurrences(doc, 'Recommended future source boundary:'), 1);
  assert.equal(countOccurrences(doc, 'Decision: recommended.'), 1);
  assert.equal(countOccurrences(doc, 'Decision: not recommended.'), 5);

  assertIncludesAll(doc, [
    'Recommended future source boundary: `src/services/WorkshopAssignmentService.js#createWorkshopAssignmentService().prepareAssignmentIntent`',
    'WorkshopAssignmentService Prepare-Assignment-Intent Boundary',
    'Depot Route Assignment-Intent Handler Boundary',
    'Status Boundary Guard',
    'Access Scope Guard',
    'Customer-Visible Projection Filter',
    'Audit Boundary',
    'Do not wire helpers into runtime',
    'do not approve route writes',
  ], 'Task2380 decision gate doc');
});

test('Task2380 future integration requirements preserve prepare-only and domain safety boundaries', () => {
  const doc = read(TASK2380_DOC);

  assertIncludesAll(doc, [
    '`written: false`',
    'prepare-only route behavior',
    '`depot_repair_route_write_scope_not_approved`',
    'use pure repair order contract only to shape internal draft intent, not persist it',
    'use transition policy only for planning/validation, not writing state',
    'use audit event helper only for internal prepared audit intent, not DB write',
    'use customer projection helper only for allowlisted projection preparation, not publication',
    'brand, service-provider, and subcontractor access boundaries',
    'customer-visible minimization',
    'no formal Field Service Report creation, approval, publication, or finalization',
    'no Completion Report approval, publication, or finalization',
    'no `finalAppointmentId` mutation',
    'no route write scope approval',
    'no DB, repository, migration, SQL execution, real DB connection, or persistence implementation',
    'no provider sending',
    'no package or package-lock changes',
    'no admin UI work',
  ], 'Task2380 future integration requirements');
});

test('repair order helpers are not wired into current service route guard filter or audit boundaries', () => {
  for (const boundaryFile of BOUNDARY_FILES) {
    const source = read(boundaryFile);

    for (const marker of PURE_HELPER_WIRING_MARKERS) {
      assert.equal(source.includes(marker), false, `${boundaryFile} should not include ${marker}`);
    }
  }
});

test('Task2380 docs and static guard introduce no executable authorization or real credentials', () => {
  const combined = [
    read(TASK2380_DOC),
    read('tests/depotWorkshop/depotWorkshopRepairOrderHelperWorkshopAssignmentIntegrationDecisionGate.static.test.js'),
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
  ], 'Task2380 docs/static guard');
});
