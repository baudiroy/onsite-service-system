'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const TASK2385_DOC = 'docs/task-2385-depot-workshop-assignment-intent-route-response-shape-checkpoint-no-runtime-change-no-db-no-provider-no-package.md';
const TASK2386_DOC = 'docs/task-2386-depot-workshop-assignment-intent-route-response-presenter-design-packet-no-runtime-change-no-db-no-provider-no-package.md';
const ROUTE_FILE = 'src/routes/depotRepair.routes.js';
const SERVICE_FILE = 'src/services/WorkshopAssignmentService.js';
const CUSTOMER_FILTER_TEST = 'tests/depotWorkshop/depotRepairCustomerVisibleDataFilter.unit.test.js';
const CUSTOMER_PROJECTION_BOUNDARY_TEST = 'tests/depotWorkshop/depotWorkshopRepairOrderCustomerProjectionBoundary.static.test.js';

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

test('Task2386 presenter design packet artifacts and Task2385 checkpoint exist', () => {
  for (const relativePath of [
    TASK2385_DOC,
    TASK2386_DOC,
    ROUTE_FILE,
    SERVICE_FILE,
    CUSTOMER_FILTER_TEST,
    CUSTOMER_PROJECTION_BOUNDARY_TEST,
  ]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }
});

test('current route response shape remains documented from Task2385', () => {
  const checkpoint = read(TASK2385_DOC);
  const design = read(TASK2386_DOC);

  for (const source of [checkpoint, design]) {
    assertIncludesAll(source, [
      '`POST /api/v1/depot/repairs/:depotIntakeId/assignment-intent`',
      '`depot.repair.prepare`',
      '`depot_repair_route_write_scope_not_approved`',
      '`data.depotRepair`',
      'result.assignmentIntent || result.depotRepair || result.intent || null',
      '`written: false`',
      '`assignmentIntent.writeRequired` remains `false`',
    ], 'documented current route response shape');
  }
});

test('design packet compares multiple response strategies and recommends exactly one', () => {
  const design = read(TASK2386_DOC);

  assertIncludesAll(design, [
    'Option A: keep current sanitized full assignment intent.',
    'Option B: narrow route response to an explicit admin-safe allowlist.',
    'Option C: split internal service intent from route response presenter.',
    'Option D: expose only summary references for helper-derived sections.',
    'Recommended future strategy: split internal service intent from route response presenter with an explicit admin-safe allowlist.',
  ], 'Task2386 response strategy comparison');

  const recommendations = design.match(/Recommended future strategy:/g) || [];
  assert.equal(recommendations.length, 1, 'Task2386 should recommend exactly one future strategy');
});

test('future presenter contract and allowlist are explicit', () => {
  const design = read(TASK2386_DOC);

  assertIncludesAll(design, [
    'presentDepotWorkshopAssignmentIntentResponse(result, requestContext)',
    'Accepted input shape:',
    'Output envelope shape compatible with current route behavior:',
    'Allowed top-level response fields:',
    'Allowed `data.depotRepair` fields:',
    '`repairOrderDraftSummary`',
    '`repairOrderTransitionPlanSummary`',
    '`repairOrderAuditIntentSummary`',
    '`repairOrderCustomerProjectionPreview`',
    'Safe-deny / failure behavior:',
    'No-mutation requirement:',
    '`meta.written` must remain `false`',
    '`writeRequired` must remain `false`',
  ], 'Task2386 presenter contract');
});

test('future helper-derived section handling narrows internal service intent', () => {
  const design = read(TASK2386_DOC);

  assertIncludesAll(design, [
    'do not expose the full draft object by default',
    'expose only `repairOrderDraftSummary`',
    'expose only `repairOrderTransitionPlanSummary`',
    'do not expose full audit payload or metadata',
    'require `customerVisible` to remain `false`',
    'expose only `repairOrderCustomerProjectionPreview`',
    'this preview is not customer-visible publication',
    'never publish, approve, revoke, or finalize a customer-visible record',
  ], 'Task2386 helper-derived section handling');
});

test('route response source now uses accepted presenter wiring while service source remains unchanged', () => {
  const route = read(ROUTE_FILE);
  const service = read(SERVICE_FILE);

  assertIncludesAll(route, [
    "require('../depotWorkshop/depotWorkshopAssignmentIntentResponsePresenter')",
    'presentDepotWorkshopAssignmentIntentResponse',
    'return presentDepotWorkshopAssignmentIntentResponse(result, {',
    'depot_repair_route_write_scope_not_approved',
  ], 'accepted Task2388 route response presenter source');

  assertIncludesAll(service, [
    '...buildRepairOrderHelperSections(depotIntake, validation)',
    'writeRequired: false',
    'written: false',
  ], 'current service source');

  assertDoesNotMatchAny(service, [
    /presentDepotWorkshopAssignmentIntentResponse/,
    /repairOrderDraftSummary/,
    /repairOrderTransitionPlanSummary/,
    /repairOrderAuditIntentSummary/,
    /repairOrderCustomerProjectionPreview/,
  ], 'WorkshopAssignmentService remains independent of route presenter');
});

test('design explicitly forbids sensitive output and internal leakage', () => {
  const design = read(TASK2386_DOC);

  assertIncludesAll(design, [
    '`finalAppointmentId`',
    'formal Field Service Report / Completion Report creation, approval, publication, or finalization markers',
    'raw customer contact, address, signature, photo, or private fields',
    'raw DB rows, SQL, stack, token, password, or secret',
    'provider payloads',
    'billing, settlement, payment, or invoice internals',
    'AI/RAG/OpenAI/vector payloads',
    'internal audit payloads beyond safe references',
    'subcontractor-private fields beyond accepted minimized visibility',
  ], 'Task2386 forbidden output');
});

test('customer-visible filter and projection boundary remain referenced for presenter design', () => {
  const customerFilterTest = read(CUSTOMER_FILTER_TEST);
  const projectionBoundaryTest = read(CUSTOMER_PROJECTION_BOUNDARY_TEST);

  assertIncludesAll(customerFilterTest, [
    'allowed safe customer-visible DTO shape includes only explicit fields',
    'forbidden fields and nested raw structures are excluded',
    'filter does not create publication mutation or FSR/finalAppointment behavior',
  ], 'customer-visible filter test');

  assertIncludesAll(projectionBoundaryTest, [
    'customer projection helper exports pure allowlist constants and functions',
    'existing customer visible filter remains allowlist projection only',
    'customer projection helper does not approve publish formalize FSR Completion Report or expose finalAppointmentId',
  ], 'customer projection boundary test');
});

test('Task2386 introduces no route API controller DB provider package or smoke authorization', () => {
  const combined = `${read(TASK2386_DOC)}\n${read('tests/depotWorkshop/depotWorkshopAssignmentIntentRouteResponsePresenterDesign.static.test.js')}`;

  assertIncludesAll(combined, [
    'no presenter/helper implementation is added by Task2386',
    'no route/API/controller/DB/provider/package authorization is introduced',
    'Task2386 does not authorize:',
    'runtime/source behavior changes',
    'route response shape changes',
    'presenter/helper implementation',
    'DB commands',
    'provider sending',
    'package or package-lock changes',
    'smoke test execution',
  ], 'Task2386 non-authorization text');

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
  ], 'Task2386 docs/static guard executable authorization');
});
