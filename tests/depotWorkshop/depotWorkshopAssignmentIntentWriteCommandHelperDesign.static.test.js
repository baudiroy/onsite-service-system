'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const ROUTE_FILE = 'src/routes/depotRepair.routes.js';
const SERVICE_FILE = 'src/services/WorkshopAssignmentService.js';
const TRANSITION_POLICY_FILE = 'src/depotWorkshop/depotWorkshopRepairOrderTransitionPolicy.js';
const AUDIT_HELPER_FILE = 'src/depotWorkshop/depotWorkshopRepairOrderAuditEvent.js';
const CUSTOMER_PROJECTION_FILE = 'src/depotWorkshop/depotWorkshopRepairOrderCustomerProjection.js';
const PRESENTER_FILE = 'src/depotWorkshop/depotWorkshopAssignmentIntentResponsePresenter.js';
const FUTURE_HELPER_FILE = 'src/depotWorkshop/depotWorkshopAssignmentIntentWriteCommand.js';
const TASK2392_DOC = 'docs/task-2392-depot-workshop-assignment-intent-route-write-scope-authorization-packet-no-runtime-change-no-db-no-provider-no-package.md';
const TASK2393_DOC = 'docs/task-2393-depot-workshop-assignment-intent-write-command-helper-design-packet-no-runtime-change-no-db-no-provider-no-package.md';

const CONTEXT_ARTIFACTS = Object.freeze([
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
  'tests/depotWorkshop/depotWorkshopAssignmentIntentRouteWriteScopeAuthorization.static.test.js',
  'tests/depotWorkshop/depotWorkshopAssignmentIntentRouteResponsePresenterWiringPortfolio.static.test.js',
  'tests/depotWorkshop/workshopAssignmentServiceRepairOrderIntegrationPortfolio.static.test.js',
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

test('Task2393 design packet source and context artifacts exist without implementation file', () => {
  for (const relativePath of [
    ROUTE_FILE,
    SERVICE_FILE,
    TRANSITION_POLICY_FILE,
    AUDIT_HELPER_FILE,
    CUSTOMER_PROJECTION_FILE,
    PRESENTER_FILE,
    TASK2392_DOC,
    TASK2393_DOC,
    ...CONTEXT_ARTIFACTS,
  ]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }

  assert.equal(fs.existsSync(projectPath(FUTURE_HELPER_FILE)), false, `${FUTURE_HELPER_FILE} must not be implemented by Task2393`);
});

test('current route and service remain prepare-only with write scope blocked', () => {
  const route = read(ROUTE_FILE);
  const service = read(SERVICE_FILE);

  assertIncludesAll(route, [
    "const DEPOT_REPAIR_ROUTE_PATH = '/api/v1/depot/repairs/:depotIntakeId/assignment-intent'",
    "const DEPOT_REPAIR_ROUTE_PERMISSION = 'depot.repair.prepare'",
    'requirePermission(DEPOT_REPAIR_ROUTE_PERMISSION)',
    'writeRequested(req)',
    "failure('depot_repair_route_write_scope_not_approved', req)",
    'presentDepotWorkshopAssignmentIntentResponse',
  ], 'Task2393 route prepare-only source');

  assertIncludesAll(service, [
    'async prepareAssignmentIntent(input = {})',
    'written: false',
    'writeRequired: false',
    'workshop_assignment_write_scope_not_approved',
    'buildRepairOrderAuditIntent',
    'buildRepairOrderCustomerProjection',
  ], 'Task2393 service prepare-only source');
});

test('design packet names future helper file action and trusted input contract', () => {
  const doc = read(TASK2393_DOC);

  assertIncludesAll(doc, [
    'buildDepotWorkshopAssignmentIntentWriteCommand(input)',
    'src/depotWorkshop/depotWorkshopAssignmentIntentWriteCommand.js',
    'depot_workshop.assignment_intent.write',
    '`WorkshopAssignmentService.prepareAssignmentIntent` result with `ok: true`',
    '`organizationId`',
    '`caseId`',
    '`depotIntakeId` or `repairOrderId`',
    'actor/permission context',
    '`brandId` scope when present',
    '`serviceProviderId` scope when present',
    '`subcontractorOrganizationId` and explicit subcontractor assignment scope when present',
    'transition validation uses the accepted repair order transition policy',
    'audit intent handling uses the accepted audit helper',
    'customer projection handling uses the accepted projection helper and remains allowlisted',
    'presenter compatibility is preserved',
  ], 'Task2393 future helper design contract');
});

test('design packet defines safe command output and fail-closed behavior', () => {
  const doc = read(TASK2393_DOC);

  assertIncludesAll(doc, [
    'safe command envelope only',
    '`ok`',
    '`status`',
    '`reasonCode`',
    '`action`',
    '`command`',
    '`auditIntent`',
    '`customerProjectionPreview` if safe',
    'DB persistence result',
    'provider payload',
    'missing trusted organization/case/source fails closed',
    'invalid transition fails closed',
    'missing permission/write authorization fails closed',
    'subcontractor scope mismatch fails closed',
    'malformed prepared intent fails closed',
    'forbidden fields fail closed or are stripped',
  ], 'Task2393 command output and fail-closed design');
});

test('design recommends exactly one next bounded task', () => {
  const doc = read(TASK2393_DOC);

  assertIncludesAll(doc, [
    'Recommended next bounded task: pure write command helper implementation with unit/static tests.',
    'Repository/migration authorization should remain separate',
  ], 'Task2393 next task recommendation');

  assert.equal(
    (doc.match(/Recommended next bounded task:/g) || []).length,
    1,
    'Task2393 should recommend exactly one next bounded task',
  );
});

test('Task2393 adds no runtime source implementation or forbidden source behavior', () => {
  const source = [
    read(ROUTE_FILE),
    read(SERVICE_FILE),
    read(TRANSITION_POLICY_FILE),
    read(AUDIT_HELPER_FILE),
    read(CUSTOMER_PROJECTION_FILE),
    read(PRESENTER_FILE),
  ].join('\n');

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
  ], 'Task2393 source portfolio forbidden behavior');
});

test('Task2393 docs and static guard introduce no executable authorization or real credentials', () => {
  const combined = [
    read(TASK2393_DOC),
    read('tests/depotWorkshop/depotWorkshopAssignmentIntentWriteCommandHelperDesign.static.test.js'),
  ].join('\n');

  assertIncludesAll(combined, [
    'Task2393 does not authorize:',
    'helper implementation',
    'route write-scope behavior',
    'No DB commands.',
    'No provider sending.',
    'No package or package-lock changes.',
    'No formal Field Service Report / Completion Report creation, approval, publication, or finalization behavior.',
    'No `finalAppointmentId` mutation path.',
    'The 7 held historical docs remain outside Task2393 scope',
  ], 'Task2393 non-authorization docs/static guard');

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
  ], 'Task2393 docs/static guard executable authorization');
});
