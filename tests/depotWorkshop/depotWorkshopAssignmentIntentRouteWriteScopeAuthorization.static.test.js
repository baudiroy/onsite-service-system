'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const ROUTE_FILE = 'src/routes/depotRepair.routes.js';
const SERVICE_FILE = 'src/services/WorkshopAssignmentService.js';
const PRESENTER_FILE = 'src/depotWorkshop/depotWorkshopAssignmentIntentResponsePresenter.js';
const TASK2392_DOC = 'docs/task-2392-depot-workshop-assignment-intent-route-write-scope-authorization-packet-no-runtime-change-no-db-no-provider-no-package.md';

const CONTEXT_ARTIFACTS = Object.freeze([
  'docs/task-2371-depot-workshop-repair-branch-re-entry-boundary-inventory-no-runtime-change-no-db-no-smoke-no-provider-no-package.md',
  'docs/task-2372-depot-workshop-repair-order-contract-state-model-static-guard-no-db-no-route-no-provider-no-package.md',
  'docs/task-2373-depot-workshop-repair-order-state-model-pure-constants-helper-no-route-no-db-no-provider-no-package.md',
  'docs/task-2374-depot-workshop-repair-order-contract-pure-helper-no-route-no-db-no-provider-no-package.md',
  'docs/task-2375-depot-workshop-repair-order-transition-policy-pure-helper-no-route-no-db-no-provider-no-package.md',
  'docs/task-2376-depot-workshop-repair-order-audit-event-pure-helper-no-route-no-db-no-provider-no-package.md',
  'docs/task-2377-depot-workshop-repair-order-customer-visible-projection-pure-helper-no-route-no-db-no-provider-no-package.md',
  'docs/task-2378-depot-workshop-repair-order-pure-helper-portfolio-static-guard-no-runtime-change-no-db-no-provider-no-package.md',
  'docs/task-2379-depot-workshop-repair-order-pure-helper-branch-closure-no-runtime-change-no-db-no-provider-no-package.md',
  'docs/task-2380-depot-workshop-repair-order-helper-workshop-assignment-service-integration-decision-gate-no-runtime-change-no-db-no-provider-no-package.md',
  'docs/task-2381-depot-workshop-repair-order-helper-workshop-assignment-service-integration-no-route-no-db-no-provider-no-package.md',
  'docs/task-2382-depot-workshop-repair-order-helper-workshop-assignment-integration-checkpoint-no-runtime-change-no-db-no-provider-no-package.md',
  'docs/task-2383-depot-workshop-repair-order-workshop-assignment-service-integration-static-portfolio-guard-no-runtime-change-no-db-no-provider-no-package.md',
  'docs/task-2384-depot-workshop-repair-order-workshop-assignment-service-integration-branch-closure-no-runtime-change-no-db-no-provider-no-package.md',
  'docs/task-2385-depot-workshop-assignment-intent-route-response-shape-checkpoint-no-runtime-change-no-db-no-provider-no-package.md',
  'docs/task-2386-depot-workshop-assignment-intent-route-response-presenter-design-packet-no-runtime-change-no-db-no-provider-no-package.md',
  'docs/task-2387-depot-workshop-assignment-intent-route-response-presenter-pure-helper-no-route-wiring-no-db-no-provider-no-package.md',
  'docs/task-2388-depot-workshop-assignment-intent-route-response-presenter-wiring-no-route-path-change-no-db-no-provider-no-package.md',
  'docs/task-2389-depot-workshop-assignment-intent-route-response-presenter-wiring-checkpoint-no-runtime-change-no-db-no-provider-no-package.md',
  'docs/task-2390-depot-workshop-assignment-intent-route-response-presenter-wiring-static-portfolio-guard-no-runtime-change-no-db-no-provider-no-package.md',
  'docs/task-2391-depot-workshop-assignment-intent-route-response-presenter-wiring-branch-closure-no-runtime-change-no-db-no-provider-no-package.md',
  'tests/depotWorkshop/depotWorkshopAssignmentIntentRouteResponsePresenterWiringPortfolio.static.test.js',
  'tests/depotWorkshop/workshopAssignmentServiceRepairOrderIntegrationPortfolio.static.test.js',
  'tests/depotWorkshop/workshopAssignmentServiceRepairOrderHelperIntegration.unit.test.js',
  'tests/depotWorkshop/workshopAssignmentService.unit.test.js',
  'tests/depotWorkshop/depotWorkshopRepairOrderTransitionPolicy.unit.test.js',
  'tests/depotWorkshop/depotAccessScopeGuard.unit.test.js',
  'tests/depotWorkshop/depotRepairStatusBoundary.unit.test.js',
]);

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

test('Task2392 write-scope authorization packet source and context artifacts exist', () => {
  for (const relativePath of [ROUTE_FILE, SERVICE_FILE, PRESENTER_FILE, TASK2392_DOC, ...CONTEXT_ARTIFACTS]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }
});

test('current route remains prepare-only with write scope denied', () => {
  const route = read(ROUTE_FILE);

  assertIncludesAll(route, [
    "const DEPOT_REPAIR_ROUTE_PATH = '/api/v1/depot/repairs/:depotIntakeId/assignment-intent'",
    "const DEPOT_REPAIR_ROUTE_PERMISSION = 'depot.repair.prepare'",
    'requirePermission(DEPOT_REPAIR_ROUTE_PERMISSION)',
    'writeRequested(req)',
    "failure('depot_repair_route_write_scope_not_approved', req)",
    'return sendResponse(res, statusCodeFromResult(result), failureBody(result, req))',
    'presentDepotWorkshopAssignmentIntentResponse',
    'function successBody(result, req = {})',
    'return presentDepotWorkshopAssignmentIntentResponse(result, {',
    'requestId: requestIdFrom(req, bodyFromRequest(req))',
    'function failureBody(result, req = {})',
  ], 'Task2392 route write-scope authorization source');
});

test('current service boundary remains prepareAssignmentIntent with false write flags', () => {
  const service = read(SERVICE_FILE);

  assertIncludesAll(service, [
    'createWorkshopAssignmentService',
    'async prepareAssignmentIntent(input = {})',
    'WorkshopAssignmentService',
    'written: false',
    'writeRequired: false',
    'workshop_assignment_write_scope_not_approved',
    'depotIntakeRepository.findDepotIntakeState',
    'planDepotWorkshopRepairOrderStatusTransition',
    'buildDepotWorkshopRepairOrderAuditEvent',
    'buildDepotWorkshopRepairOrderCustomerProjection',
  ], 'Task2392 service write-scope authorization source');
});

test('presenter remains wired to admin-safe allowlisted response summaries', () => {
  const presenter = read(PRESENTER_FILE);

  assertIncludesAll(presenter, [
    'DEPOT_WORKSHOP_ASSIGNMENT_INTENT_RESPONSE_FIELDS',
    'presentDepotWorkshopAssignmentIntentResponse',
    'data: {',
    'depotRepair: buildDepotRepairPayload(intent)',
    'written: false',
    'writeRequired: false',
    'repairOrderDraftSummary',
    'repairOrderTransitionPlanSummary',
    'repairOrderAuditIntentSummary',
    'repairOrderCustomerProjectionPreview',
  ], 'Task2392 presenter authorization source');

  assertDoesNotMatchAny(presenter, [
    /require\(/,
    /process\.env/,
    /DATABASE_URL\s*=/,
    /\bINSERT\s+INTO\b/i,
    /\bUPDATE\s+\w+\b/i,
    /\bDELETE\s+FROM\b/i,
    /send(Line|Sms|SMS|Email|Webhook)/,
  ], 'Task2392 presenter forbidden runtime behavior');
});

test('authorization packet records prerequisites and compares future approaches', () => {
  const doc = read(TASK2392_DOC);

  assertIncludesAll(doc, [
    'Task2392 Depot Workshop Assignment Intent Route Write Scope Authorization Packet',
    'route write scope remains blocked by `depot_repair_route_write_scope_not_approved`',
    '`WorkshopAssignmentService.prepareAssignmentIntent` remains the accepted service boundary',
    'service returns `written: false`',
    '`assignmentIntent.writeRequired` remains `false`',
    'response presenter exposes only admin-safe allowlisted summaries',
    'exact write action name and route behavior must be separately authorized',
    'repository/persistence contract must exist before write scope is enabled',
    'DB/migration authorization must be explicit before persistence',
    'organization, tenant, brand, service-provider, and subcontractor access must be enforced',
    'transition policy must validate any status transition',
    'audit intent must remain internal-only and sanitized',
    'customer projection must remain allowlisted and must not become publication',
    'provider sending must remain separately authorized',
    'no formal Field Service Report / Completion Report creation, approval, publication, or finalization',
    'no `finalAppointmentId` mutation path',
    'Option A: keep route prepare-only and add repository/migration authorization first.',
    'Option B: add a pure write command/helper design packet before route write scope.',
    'Option C: add route write-scope runtime behavior after repository/DB contract exists.',
    'Option D: keep all write behavior blocked until DB/migration tooling is available.',
    'Recommended next bounded task: pure write command/helper design packet.',
  ], 'Task2392 authorization packet');

  assert.equal(
    (doc.match(/Recommended next bounded task:/g) || []).length,
    1,
    'Task2392 should recommend exactly one next bounded task',
  );
});

test('Task2392 source portfolio keeps forbidden runtime behavior absent', () => {
  const source = `${read(ROUTE_FILE)}\n${read(SERVICE_FILE)}\n${read(PRESENTER_FILE)}`;

  assertDoesNotMatchAny(source, [
    /\bINSERT\s+INTO\b/i,
    /\bUPDATE\s+\w+\b/i,
    /\bDELETE\s+FROM\b/i,
    /\bALTER\s+TABLE\b/i,
    /\bCREATE\s+TABLE\b/i,
    /\bnew\s+Pool\b|require\(['"]pg['"]\)|require\(['"]postgres['"]\)/,
    /\bpsql\b|db:migrate|migrations\//i,
    /send(Line|Sms|SMS|Email|Webhook)/,
    /createFieldServiceReport|approveFieldServiceReport|publishFieldServiceReport|finalizeFieldServiceReport/i,
    /createCompletionReport|approveCompletionReport|publishCompletionReport|finalizeCompletionReport/i,
    /completeAppointment|finalizeAppointment|mutateAppointment|setFinalAppointment/i,
    /finalAppointmentId\s*[:=]/,
    /createSettlement|runSettlement|stripe/i,
    /supertest\s*\(|fetch\s*\(|axios|got|superagent/i,
    /\bapp\.listen\s*\(|\bserver\.listen\s*\(|\blisten\s*\(/,
    /\/healthz/i,
  ], 'Task2392 route/service/presenter forbidden source behavior');
});

test('Task2392 docs and static guard introduce no executable authorization or real credentials', () => {
  const combined = [
    read(TASK2392_DOC),
    read('tests/depotWorkshop/depotWorkshopAssignmentIntentRouteWriteScopeAuthorization.static.test.js'),
  ].join('\n');

  assertIncludesAll(combined, [
    'Task2392 does not authorize:',
    'route write-scope behavior',
    'No DB commands.',
    'No provider sending.',
    'No package or package-lock changes.',
    'No formal Field Service Report / Completion Report creation, approval, publication, or finalization behavior.',
    'No `finalAppointmentId` mutation path.',
    'The 7 held historical docs remain outside Task2392 scope',
  ], 'Task2392 non-authorization docs/static guard');

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
  ], 'Task2392 docs/static guard executable authorization');
});
