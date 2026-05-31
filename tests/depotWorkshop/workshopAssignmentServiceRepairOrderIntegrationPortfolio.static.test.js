'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const TASK2383_DOC = 'docs/task-2383-depot-workshop-repair-order-workshop-assignment-service-integration-static-portfolio-guard-no-runtime-change-no-db-no-provider-no-package.md';
const SERVICE_FILE = 'src/services/WorkshopAssignmentService.js';
const ROUTE_FILE = 'src/routes/depotRepair.routes.js';
const PRESENTER_FILE = 'src/depotWorkshop/depotWorkshopAssignmentIntentResponsePresenter.js';

const PORTFOLIO_ARTIFACTS = Object.freeze([
  'docs/task-2373-depot-workshop-repair-order-state-model-pure-constants-helper-no-route-no-db-no-provider-no-package.md',
  'docs/task-2374-depot-workshop-repair-order-contract-pure-helper-no-route-no-db-no-provider-no-package.md',
  'docs/task-2375-depot-workshop-repair-order-transition-policy-pure-helper-no-route-no-db-no-provider-no-package.md',
  'docs/task-2376-depot-workshop-repair-order-audit-event-pure-helper-no-route-no-db-no-provider-no-package.md',
  'docs/task-2377-depot-workshop-repair-order-customer-visible-projection-pure-helper-no-route-no-db-no-provider-no-package.md',
  'docs/task-2378-depot-workshop-repair-order-pure-helper-portfolio-static-guard-no-runtime-change-no-db-no-provider-no-package.md',
  'docs/task-2380-depot-workshop-repair-order-helper-workshop-assignment-service-integration-decision-gate-no-runtime-change-no-db-no-provider-no-package.md',
  'docs/task-2381-depot-workshop-repair-order-helper-workshop-assignment-service-integration-no-route-no-db-no-provider-no-package.md',
  'docs/task-2382-depot-workshop-repair-order-helper-workshop-assignment-integration-checkpoint-no-runtime-change-no-db-no-provider-no-package.md',
  'tests/depotWorkshop/workshopAssignmentServiceRepairOrderHelperIntegration.unit.test.js',
  'tests/depotWorkshop/workshopAssignmentServiceRepairOrderHelperIntegrationBoundary.static.test.js',
  'tests/depotWorkshop/depotWorkshopRepairOrderHelperWorkshopAssignmentIntegrationDecisionGate.static.test.js',
  'tests/depotWorkshop/depotWorkshopRepairOrderPureHelperPortfolio.static.test.js',
]);

const ACCEPTED_HELPER_IMPORTS = Object.freeze([
  '../depotWorkshop/depotWorkshopAssignmentIntentWriteCommand',
  '../depotWorkshop/depotWorkshopRepairOrderAuditEvent',
  '../depotWorkshop/depotWorkshopRepairOrderContract',
  '../depotWorkshop/depotWorkshopRepairOrderCustomerProjection',
  '../depotWorkshop/depotWorkshopRepairOrderRepositoryContract',
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

test('Task2383 portfolio guard sees accepted source doc and test artifacts', () => {
  for (const relativePath of [TASK2383_DOC, SERVICE_FILE, ROUTE_FILE, ...PORTFOLIO_ARTIFACTS]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }
});

test('WorkshopAssignmentService preserves prepare-only boundary and Task2416 write method seam', () => {
  const source = read(SERVICE_FILE);

  assert.deepEqual(requireSpecifiers(source).sort(), [...ACCEPTED_HELPER_IMPORTS].sort());
  assertIncludesAll(source, [
    'createWorkshopAssignmentService',
    'prepareAssignmentIntent',
    'writePreparedAssignmentIntent',
    'buildRepairOrderHelperSections',
    'buildDepotWorkshopRepairOrderDraft',
    'planDepotWorkshopRepairOrderStatusTransition',
    'buildDepotWorkshopRepairOrderAuditEvent',
    'buildDepotWorkshopRepairOrderCustomerProjection',
    'buildDepotWorkshopAssignmentIntentWriteCommand',
    'normalizeDepotWorkshopRepairOrderRepositoryResult',
    'repairOrderWriterFrom(repairOrderRepository)',
    'findDepotIntakeState',
    'written: false',
    'writeRequired: false',
    'workshop_assignment_write_scope_not_approved',
  ], 'WorkshopAssignmentService accepted boundary');

  assertDoesNotMatchAny(source, [
    /require\(['"].*routes/i,
    /require\(['"].*controllers/i,
    /require\(['"].*repositories/i,
    /require\(['"].*providers/i,
    /require\(['"].*package/i,
    /process\.env|DATABASE_URL\s*=/,
  ], 'WorkshopAssignmentService integration imports');
});

test('helper-derived sections remain safe optional and non-persistent', () => {
  const source = read(SERVICE_FILE);
  const unitTest = read('tests/depotWorkshop/workshopAssignmentServiceRepairOrderHelperIntegration.unit.test.js');
  const checkpoint = read('docs/task-2382-depot-workshop-repair-order-helper-workshop-assignment-integration-checkpoint-no-runtime-change-no-db-no-provider-no-package.md');

  assertIncludesAll(source, [
    'repairOrderDraft',
    'repairOrderTransitionPlan',
    'repairOrderAuditIntent',
    'repairOrderCustomerProjection',
    'transitionResult.ok ? { ...transitionResult.plannedTransition } : undefined',
  ], 'WorkshopAssignmentService helper-derived sections');

  assertIncludesAll(`${unitTest}\n${checkpoint}`, [
    'missing repair order source requirements safely omit helper sections without breaking base assignment intent',
    'invalid transition target is omitted safely while draft audit and projection stay bounded',
    'subcontractor assignment scope remains required before helper-derived sections are prepared',
    'internalOnly',
    'customerVisible',
    'audit intent remains internal-only / `customerVisible: false` and is not persisted',
    'customer projection remains allowlisted/projection-only and is not publication',
  ], 'Task2381 Task2382 safety evidence');
});

test('route write scope remains blocked and presenter owns false write response evidence', () => {
  const route = read(ROUTE_FILE);
  const service = read(SERVICE_FILE);
  const presenter = read(PRESENTER_FILE);

  assertIncludesAll(route, [
    'depot_repair_route_write_scope_not_approved',
    'writeRequested(req)',
    'presentDepotWorkshopAssignmentIntentResponse',
    'return presentDepotWorkshopAssignmentIntentResponse(result, {',
    "const DEPOT_REPAIR_ROUTE_PATH = '/api/v1/depot/repairs/:depotIntakeId/assignment-intent'",
  ], 'depot repair route write boundary');

  assertIncludesAll(`${service}\n${presenter}`, [
    'written: false',
    'writeRequired: false',
  ], 'presenter-owned write response evidence');

  assertDoesNotMatchAny(route, [
    /depotWorkshopRepairOrderContract/,
    /depotWorkshopRepairOrderTransitionPolicy/,
    /depotWorkshopRepairOrderAuditEvent/,
    /depotWorkshopRepairOrderCustomerProjection/,
    /buildDepotWorkshopRepairOrderDraft/,
    /planDepotWorkshopRepairOrderStatusTransition/,
  ], 'depot repair route helper wiring');
});

test('service integration portfolio keeps forbidden behavior absent from source', () => {
  const source = `${read(SERVICE_FILE)}\n${read(ROUTE_FILE)}`;

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
    /completeAppointment|finalizeAppointment|mutateAppointment/i,
    /createSettlement|runSettlement|stripe|invoice|payment/i,
    /OPENAI|vector|rag/i,
    /finalAppointmentId\s*[:=]/,
  ], 'service integration portfolio forbidden source behavior');
});

test('Task2383 doc records static portfolio coverage and non-authorization boundaries', () => {
  const doc = read(TASK2383_DOC);

  assertIncludesAll(doc, [
    'Task2383 Depot Workshop Repair Order Workshop Assignment Service Integration Static Portfolio Guard',
    'WorkshopAssignmentService.prepareAssignmentIntent remains the only accepted integration boundary',
    'helper imports in WorkshopAssignmentService are limited to accepted pure helpers',
    'service still returns `written: false`',
    '`assignmentIntent.writeRequired` remains `false`',
    'depotIntakeRepository.findDepotIntakeState remains the only repository call',
    '`depot_repair_route_write_scope_not_approved` remains visible',
    'No route path or mount changes.',
    'No DB commands, SQL execution, real DB connection, migration creation, migration dry-run, or migration apply.',
    'No provider sending.',
    'No package or package-lock changes.',
    'No formal Field Service Report / Completion Report creation, approval, publication, or finalization behavior.',
    'No `finalAppointmentId` mutation path.',
  ], 'Task2383 doc');
});

test('Task2383 docs and static guard introduce no executable authorization or real credentials', () => {
  const combined = [
    read(TASK2383_DOC),
    read('tests/depotWorkshop/workshopAssignmentServiceRepairOrderIntegrationPortfolio.static.test.js'),
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
  ], 'Task2383 docs/static guard');
});
