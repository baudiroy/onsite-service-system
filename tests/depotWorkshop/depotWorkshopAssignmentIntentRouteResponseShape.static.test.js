'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const TASK2385_DOC = 'docs/task-2385-depot-workshop-assignment-intent-route-response-shape-checkpoint-no-runtime-change-no-db-no-provider-no-package.md';
const ROUTE_FILE = 'src/routes/depotRepair.routes.js';
const SERVICE_FILE = 'src/services/WorkshopAssignmentService.js';
const TASK2381_DOC = 'docs/task-2381-depot-workshop-repair-order-helper-workshop-assignment-service-integration-no-route-no-db-no-provider-no-package.md';
const TASK2384_DOC = 'docs/task-2384-depot-workshop-repair-order-workshop-assignment-service-integration-branch-closure-no-runtime-change-no-db-no-provider-no-package.md';

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

test('Task2385 route response shape checkpoint artifacts exist', () => {
  for (const relativePath of [TASK2385_DOC, ROUTE_FILE, SERVICE_FILE, TASK2381_DOC, TASK2384_DOC]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }
});

test('assignment-intent route path permission and write-scope denial remain visible', () => {
  const route = read(ROUTE_FILE);

  assertIncludesAll(route, [
    "const DEPOT_REPAIR_ROUTE_PERMISSION = 'depot.repair.prepare'",
    "const DEPOT_REPAIR_ROUTE_PATH = '/api/v1/depot/repairs/:depotIntakeId/assignment-intent'",
    'requirePermission(DEPOT_REPAIR_ROUTE_PERMISSION)',
    'createDepotRepairRouteHandler(options)',
    'writeRequested(req)',
    'depot_repair_route_write_scope_not_approved',
  ], 'assignment-intent route boundary');
});

test('current route response exposes sanitized assignmentIntent as data.depotRepair', () => {
  const route = read(ROUTE_FILE);

  assert.match(route, /function successBody\(result, req = \{\}\) \{[\s\S]*data:\s*\{[\s\S]*depotRepair: sanitizeValue\(result\.assignmentIntent \|\| result\.depotRepair \|\| result\.intent \|\| null\),[\s\S]*meta:/);
  assertIncludesAll(route, [
    'sanitizeValue(result.assignmentIntent || result.depotRepair || result.intent || null)',
    'written: false',
    'prepared: result.prepared === true || result.ok === true',
  ], 'assignment-intent route success body');
});

test('service helper-derived sections are assignmentIntent data and remain prepare-only', () => {
  const service = read(SERVICE_FILE);

  assert.match(service, /function buildAssignmentIntent\(depotIntake, validation\) \{[\s\S]*writeRequired: false,[\s\S]*\.\.\.buildRepairOrderHelperSections\(depotIntake, validation\),[\s\S]*\}\);/);
  assertIncludesAll(service, [
    'repairOrderDraft',
    'repairOrderTransitionPlan',
    'repairOrderAuditIntent',
    'repairOrderCustomerProjection',
    'findDepotIntakeState',
    'written: false',
    'writeRequired: false',
  ], 'WorkshopAssignmentService assignment intent');
});

test('checkpoint records current exposed sanitized helper section response shape', () => {
  const doc = read(TASK2385_DOC);

  assertIncludesAll(doc, [
    'Task2385 Depot Workshop Assignment Intent Route Response Shape Checkpoint',
    '`POST /api/v1/depot/repairs/:depotIntakeId/assignment-intent`',
    '`depot.repair.prepare`',
    '`depot_repair_route_write_scope_not_approved`',
    '`data.depotRepair` is built from `sanitizeValue(result.assignmentIntent || result.depotRepair || result.intent || null)`',
    'the current route response exposes those sections under sanitized `data.depotRepair`',
    '`repairOrderDraft`',
    '`repairOrderTransitionPlan`',
    '`repairOrderAuditIntent`',
    '`repairOrderCustomerProjection`',
    'there is no route-level presenter or response narrowing layer',
    'Recommended next bounded task: route response presenter/helper design packet.',
  ], 'Task2385 checkpoint doc');
});

test('helper-derived sections remain service-level intent only with no publication or persistence meaning', () => {
  const combined = `${read(TASK2385_DOC)}\n${read(TASK2381_DOC)}\n${read(TASK2384_DOC)}`;

  assertIncludesAll(combined, [
    'service-level intent data only',
    'customer-visible publication',
    'audit persistence',
    'repository/DB persistence',
    'provider sending',
    'formal Field Service Report / Completion Report creation, approval, publication, or finalization',
    '`finalAppointmentId` mutation',
    '`repairOrderAuditIntent` remains internal-only',
    '`repairOrderCustomerProjection` remains allowlisted/projection-only',
  ], 'helper-derived route response safety meaning');
});

test('route and service introduce no formal report final appointment provider DB package or smoke behavior', () => {
  const source = `${read(ROUTE_FILE)}\n${read(SERVICE_FILE)}`;

  assertDoesNotMatchAny(source, [
    /createFieldServiceReport|approveFieldServiceReport|publishFieldServiceReport|finalizeFieldServiceReport/i,
    /createCompletionReport|approveCompletionReport|publishCompletionReport|finalizeCompletionReport/i,
    /finalAppointmentId\s*[:=]/,
    /\bINSERT\s+INTO\b/i,
    /\bUPDATE\s+\w+\b/i,
    /\bDELETE\s+FROM\b/i,
    /\bALTER\s+TABLE\b/i,
    /\bCREATE\s+TABLE\b/i,
    /\bnew\s+Pool\b|require\(['"]pg['"]\)|require\(['"]postgres['"]\)/,
    /\bpsql\b|db:migrate|migrations\//i,
    /send(Line|Sms|SMS|Email|Webhook)/,
    /require\(['"].*provider/i,
    /require\(['"].*package/i,
    /supertest\s*\(|fetch\s*\(|axios|got|superagent/i,
    /app\.listen\s*\(|server\.listen\s*\(|listen\s*\(/,
    /\/healthz/i,
    /OPENAI|vector|rag/i,
  ], 'assignment-intent route and service forbidden runtime behavior');
});

test('Task2385 docs and static guard contain no executable provider DB package smoke authorization', () => {
  const combined = `${read(TASK2385_DOC)}\n${read('tests/depotWorkshop/depotWorkshopAssignmentIntentRouteResponseShape.static.test.js')}`;

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
  ], 'Task2385 docs/static guard authorization text');
});
