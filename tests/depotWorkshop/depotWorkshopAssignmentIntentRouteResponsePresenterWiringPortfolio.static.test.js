'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const ROUTE_FILE = 'src/routes/depotRepair.routes.js';
const PRESENTER_FILE = 'src/depotWorkshop/depotWorkshopAssignmentIntentResponsePresenter.js';

const PORTFOLIO_FILES = Object.freeze([
  'docs/task-2385-depot-workshop-assignment-intent-route-response-shape-checkpoint-no-runtime-change-no-db-no-provider-no-package.md',
  'docs/task-2386-depot-workshop-assignment-intent-route-response-presenter-design-packet-no-runtime-change-no-db-no-provider-no-package.md',
  'docs/task-2387-depot-workshop-assignment-intent-route-response-presenter-pure-helper-no-route-wiring-no-db-no-provider-no-package.md',
  'docs/task-2388-depot-workshop-assignment-intent-route-response-presenter-wiring-no-route-path-change-no-db-no-provider-no-package.md',
  'docs/task-2389-depot-workshop-assignment-intent-route-response-presenter-wiring-checkpoint-no-runtime-change-no-db-no-provider-no-package.md',
  'docs/task-2390-depot-workshop-assignment-intent-route-response-presenter-wiring-static-portfolio-guard-no-runtime-change-no-db-no-provider-no-package.md',
  'tests/depotWorkshop/depotWorkshopAssignmentIntentResponsePresenter.unit.test.js',
  'tests/depotWorkshop/depotWorkshopAssignmentIntentResponsePresenterBoundary.static.test.js',
  'tests/depotWorkshop/depotWorkshopAssignmentIntentRouteResponsePresenterWiring.unit.test.js',
  'tests/depotWorkshop/depotWorkshopAssignmentIntentRouteResponsePresenterWiringBoundary.static.test.js',
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

test('Task2385 through Task2390 response presenter portfolio artifacts exist', () => {
  for (const relativePath of [ROUTE_FILE, PRESENTER_FILE, ...PORTFOLIO_FILES]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }
});

test('route success response delegates to accepted presenter while failure body remains safe', () => {
  const route = read(ROUTE_FILE);

  assertIncludesAll(route, [
    "const DEPOT_REPAIR_ROUTE_PERMISSION = 'depot.repair.prepare'",
    "const DEPOT_REPAIR_ROUTE_PATH = '/api/v1/depot/repairs/:depotIntakeId/assignment-intent'",
    "require('../depotWorkshop/depotWorkshopAssignmentIntentResponsePresenter')",
    'function successBody(result, req = {})',
    'return presentDepotWorkshopAssignmentIntentResponse(result, {',
    'requestId: requestIdFrom(req, bodyFromRequest(req))',
    'function failureBody(result, req = {})',
    "code: 'DEPOT_REPAIR_ROUTE_DENIED'",
    'depot_repair_route_write_scope_not_approved',
    'requirePermission(DEPOT_REPAIR_ROUTE_PERMISSION)',
  ], 'Task2390 route presenter portfolio route source');
});

test('presenter keeps payload under data.depotRepair with allowlisted summaries and false write flags', () => {
  const presenter = read(PRESENTER_FILE);
  const unitTest = read('tests/depotWorkshop/depotWorkshopAssignmentIntentResponsePresenter.unit.test.js');
  const routeWiringTest = read('tests/depotWorkshop/depotWorkshopAssignmentIntentRouteResponsePresenterWiring.unit.test.js');

  assertIncludesAll(`${presenter}\n${unitTest}\n${routeWiringTest}`, [
    'data: {',
    'depotRepair: buildDepotRepairPayload(intent)',
    'DEPOT_WORKSHOP_ASSIGNMENT_INTENT_RESPONSE_FIELDS',
    'writeRequired: false',
    'written: false',
    'repairOrderDraftSummary',
    'repairOrderTransitionPlanSummary',
    'repairOrderAuditIntentSummary',
    'repairOrderCustomerProjectionPreview',
    'Object.prototype.hasOwnProperty.call(depotRepair, \'repairOrderDraft\'), false',
    'Object.prototype.hasOwnProperty.call(depotRepair, \'repairOrderTransitionPlan\'), false',
    'Object.prototype.hasOwnProperty.call(depotRepair, \'repairOrderAuditIntent\'), false',
    'Object.prototype.hasOwnProperty.call(depotRepair, \'repairOrderCustomerProjection\'), false',
  ], 'Task2390 presenter allowlisted response portfolio');
});

test('portfolio docs record current presenter wiring status response shape and safety boundaries', () => {
  const doc = read('docs/task-2390-depot-workshop-assignment-intent-route-response-presenter-wiring-static-portfolio-guard-no-runtime-change-no-db-no-provider-no-package.md');

  assertIncludesAll(doc, [
    'Task2390 Depot Workshop Assignment Intent Route Response Presenter Wiring Static Portfolio Guard',
    'current presenter wiring status',
    'current safe route response shape',
    'current safety boundaries',
    '`src/routes/depotRepair.routes.js#successBody(result, req = {})`',
    '`presentDepotWorkshopAssignmentIntentResponse(result, { requestId })`',
    '`data.depotRepair`',
    '`repairOrderDraftSummary`',
    '`repairOrderTransitionPlanSummary`',
    '`repairOrderAuditIntentSummary`',
    '`repairOrderCustomerProjectionPreview`',
    '`meta.written` remains `false`',
    '`data.depotRepair.writeRequired` remains `false`',
    'route response presenter wiring branch closure',
    'route write scope authorization packet',
    'repository/migration authorization packet',
    'admin UI design packet',
  ], 'Task2390 doc');
});

test('source portfolio keeps forbidden runtime behavior absent', () => {
  const source = `${read(ROUTE_FILE)}\n${read(PRESENTER_FILE)}`;

  assertDoesNotMatchAny(source, [
    /require\(['"].*controllers/i,
    /require\(['"].*repositories/i,
    /require\(['"].*providers/i,
    /require\(['"].*package/i,
    /process\.env/,
    /DATABASE_URL\s*=/,
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
  ], 'Task2390 route presenter wiring source portfolio');
});

test('docs and tests preserve no authorization and no real credential boundaries', () => {
  const combined = PORTFOLIO_FILES.map(read).join('\n');

  assertIncludesAll(combined, [
    'No route path or mount changes.',
    'No permission change.',
    'No service behavior changes.',
    'No provider sending.',
    'No package or package-lock changes.',
    'No formal Field Service Report / Completion Report creation, approval, publication, or finalization behavior.',
    'No `finalAppointmentId` mutation path.',
    'The 7 held historical docs remain outside Task2390 scope',
  ], 'Task2390 portfolio non-authorization docs/tests');

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
  ], 'Task2390 portfolio docs/tests executable authorization');
});
