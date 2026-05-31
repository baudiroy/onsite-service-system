'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const TASK2372_DOC_PATH = 'docs/task-2372-depot-workshop-repair-order-contract-state-model-static-guard-no-db-no-route-no-provider-no-package.md';

const DOC_PATHS = Object.freeze({
  design: 'docs/design/depot-workshop-repair.md',
  task2371: 'docs/task-2371-depot-workshop-repair-branch-re-entry-boundary-inventory-no-runtime-change-no-db-no-smoke-no-provider-no-package.md',
  guardrails: 'docs/PROJECT_GUARDRAILS.md',
  shortInstruction: 'docs/PROJECT_SHORT_INSTRUCTION.md',
});

const SOURCE_PATHS = Object.freeze({
  statusBoundary: 'src/guards/DepotRepairStatusBoundary.js',
  accessScopeGuard: 'src/guards/DepotAccessScopeGuard.js',
  assignmentService: 'src/services/WorkshopAssignmentService.js',
  route: 'src/routes/depotRepair.routes.js',
  customerVisibleFilter: 'src/depotWorkshop/depotRepairCustomerVisibleDataFilter.js',
  auditBoundary: 'src/depotWorkshop/depotWorkshopAuditBoundary.js',
  repositoryAdapter: 'src/repositories/DepotIntakeSqlRepositoryAdapter.js',
});

const TEST_PATHS = Object.freeze([
  'tests/depotWorkshop/depotWorkshopRepairBranchReentryBoundaryInventory.static.test.js',
  'tests/depotWorkshop/depotRepairStatusBoundary.unit.test.js',
  'tests/depotWorkshop/depotAccessScopeGuard.unit.test.js',
  'tests/depotWorkshop/workshopAssignmentService.unit.test.js',
  'tests/depotWorkshop/depotRepairCustomerVisibleDataFilter.unit.test.js',
  'tests/depotWorkshop/depotWorkshopAuditBoundary.unit.test.js',
  'tests/depotWorkshop/depotRepairRoutePermissionGuard.static.test.js',
  'tests/depotWorkshop/depotIntakeSqlRepositoryAdapter.unit.test.js',
]);

const PUBLIC_OPEN_ROUTE_MARKERS = Object.freeze([
  '/public',
  '/open',
  '/customer',
  '/intake/open',
  '/repair-intake/open',
  'openRepairIntake',
  'customerAccess',
  'customer-access',
]);

const EXECUTABLE_AUTHORIZATION_PATTERNS = Object.freeze([
  new RegExp('\\bcurl\\s+', 'i'),
  new RegExp('\\bfet' + 'ch\\s*\\('),
  new RegExp('\\bsuper' + 'test\\s*\\('),
  new RegExp('\\bapp\\.lis' + 'ten\\s*\\('),
  new RegExp('\\bserver\\.lis' + 'ten\\s*\\('),
  new RegExp('\\blis' + 'ten\\s*\\('),
  new RegExp('/hea' + 'lthz', 'i'),
  new RegExp('\\bps' + 'ql\\s+', 'i'),
  new RegExp('\\bdb:mig' + 'rate\\b', 'i'),
  new RegExp('\\bDATA' + 'BASE_URL\\s*='),
]);

const REAL_LOOKING_SECRET_PATTERNS = Object.freeze([
  /postgres(?:ql)?:\/\/[^@\s]+:[^@\s]+@[^/\s]+\/[^\s)]+/i,
  /\b[a-z][a-z0-9_]*:\/\/[^@\s]+:[^@\s]+@/i,
  /\b(?:password|passwd|pwd|secret|token|api[_-]?key)\s*[:=]\s*['"]?[A-Za-z0-9._~+/=-]{12,}/i,
  /\b(?:DATABASE_URL|POSTGRES_URL|POSTGRES_PASSWORD|PGPASSWORD)\s*[:=]\s*['"]?[^'"\s]+/i,
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

function stripConstArrayBlock(source, constName) {
  const marker = `const ${constName} = Object.freeze([`;
  const start = source.indexOf(marker);

  if (start === -1) {
    return source;
  }

  const end = source.indexOf(']);', start);

  assert.notEqual(end, -1, `unterminated ${constName}`);

  return `${source.slice(0, start)}${source.slice(end + 4)}`;
}

function sourceWithoutAllowedLists(source) {
  return [
    'PUBLIC_OPEN_ROUTE_MARKERS',
    'EXECUTABLE_AUTHORIZATION_PATTERNS',
    'REAL_LOOKING_SECRET_PATTERNS',
  ].reduce((result, constName) => stripConstArrayBlock(result, constName), source);
}

function assertIncludesAll(source, markers, label) {
  for (const marker of markers) {
    assert.equal(source.includes(marker), true, `${label} missing marker ${marker}`);
  }
}

function assertExcludesAll(source, markers, label) {
  for (const marker of markers) {
    assert.equal(source.includes(marker), false, `${label} should not include ${marker}`);
  }
}

function assertDoesNotMatchAny(source, patterns, label) {
  for (const pattern of patterns) {
    assert.doesNotMatch(source, pattern, `${label} should not match ${pattern}`);
  }
}

test('Task2372 static guard reads source test and doc files as text only', () => {
  for (const relativePath of [
    TASK2372_DOC_PATH,
    ...Object.values(DOC_PATHS),
    ...Object.values(SOURCE_PATHS),
    ...TEST_PATHS,
  ]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }

  const guardSource = read('tests/depotWorkshop/depotWorkshopRepairOrderContractStateModel.static.test.js');
  const topLevelImports = guardSource.split('\n').slice(0, 8).join('\n');

  assert.deepEqual(requireSpecifiers(topLevelImports).sort(), [
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:test',
  ]);
});

test('design and inventory docs exist and contract is documented', () => {
  const design = read(DOC_PATHS.design);
  const task2371 = read(DOC_PATHS.task2371);
  const contract = read(TASK2372_DOC_PATH);

  assertIncludesAll(design, [
    'Depot / Workshop Repair / 非到府維修模組',
    'Repair Receiving -> Diagnosis -> Quote -> Customer Approval / Rejection -> Repair Work -> Parts Usage -> Quality Check',
    'The same Case must not produce conflicting formal completion reports.',
  ], 'Depot / Workshop design doc');

  assertIncludesAll(task2371, [
    'Task2371 Depot Workshop Repair Branch Re-entry Boundary Inventory',
    'Existing runtime source found',
    'Candidate future source boundary',
    'Depot Workshop Repair Order Contract and State Model Static Guard / No DB No Route No Provider No Package.',
  ], 'Task2371 inventory doc');

  assertIncludesAll(contract, [
    'Future repair order / workshop job contract',
    'Safe internal fields',
    'Forbidden fields',
    'State model',
    'Handoff and ownership context',
    'Customer-visible projection boundary',
    'Audit event boundary',
  ], 'Task2372 contract doc');
});

test('repair order contract preserves Case FSR Completion Report and finalAppointmentId boundaries', () => {
  const contract = read(TASK2372_DOC_PATH);
  const guardrails = `${read(DOC_PATHS.guardrails)}\n${read(DOC_PATHS.shortInstruction)}`;
  const statusBoundary = read(SOURCE_PATHS.statusBoundary);

  assertIncludesAll(guardrails, [
    '一張 Case 只能有一份正式 Field Service Report',
    'field_service_reports.case_id',
    'finalAppointmentId',
    '不得破壞一個 Case 最終只有一份正式完成報告的原則',
  ], 'project completion guardrails');

  assertIncludesAll(statusBoundary, [
    'finalAppointmentId',
    'completionReport',
    'fieldServiceReport',
    'depot_repair_status_mutation_scope_forbidden',
  ], 'depot status boundary forbidden completion mutation markers');

  assertIncludesAll(contract, [
    'operational/internal workflow record boundary',
    'not a formal customer-facing Field Service Report approval',
    'not a Completion Report approval',
    'not a `finalAppointmentId` mutation path',
    'must not create, approve, publish, revoke, or mutate a formal Field Service Report / Completion Report',
    'must not write `finalAppointmentId`',
  ], 'Task2372 completion boundary contract');
});

test('state model uses current source statuses and separates depot status from onsite completion', () => {
  const contract = read(TASK2372_DOC_PATH);
  const statusBoundary = read(SOURCE_PATHS.statusBoundary);

  assertIncludesAll(statusBoundary, [
    'intake_received',
    'diagnosis_pending',
    'diagnosis_completed',
    'quote_pending',
    'quote_approved',
    'repair_in_progress',
    'quality_check',
    'ready_for_return',
    'returned',
    'cancelled',
    'closed',
  ], 'current depot status source model');

  assertIncludesAll(contract, [
    '`intake_received`',
    '`diagnosis_pending`',
    '`diagnosis_completed`',
    '`quote_pending`',
    '`quote_approved`',
    '`repair_in_progress`',
    '`quality_check`',
    '`ready_for_return`',
    '`returned`',
    '`cancelled`',
    '`closed`',
    '`repair_waiting_parts` is a future proposal only and is not current runtime behavior.',
    'The state model remains separate from onsite appointment completion.',
  ], 'Task2372 state model');
});

test('current route remains assignment intent prepare-only with no route write scope approved', () => {
  const route = read(SOURCE_PATHS.route);
  const assignmentService = read(SOURCE_PATHS.assignmentService);
  const contract = read(TASK2372_DOC_PATH);

  assertIncludesAll(route, [
    "DEPOT_REPAIR_ROUTE_PERMISSION = 'depot.repair.prepare'",
    "DEPOT_REPAIR_ROUTE_PATH = '/api/v1/depot/repairs/:depotIntakeId/assignment-intent'",
    'requirePermission(DEPOT_REPAIR_ROUTE_PERMISSION)',
    'writeRequested(req)',
    'depot_repair_route_write_scope_not_approved',
  ], 'depot route prepare-only boundary');

  assertIncludesAll(assignmentService, [
    'workshop_assignment_write_scope_not_approved',
    'written: false',
    'writeRequired: false',
    'createWorkshopAssignmentService',
  ], 'workshop assignment prepare-only service');

  assertIncludesAll(contract, [
    'Current route remains assignment-intent prepare-only and `written: false`.',
    'No route write scope is approved.',
  ], 'Task2372 route write non-authorization');
});

test('customer-visible output and audit boundary remain allowlisted internal and sanitized', () => {
  const customerFilter = read(SOURCE_PATHS.customerVisibleFilter);
  const auditBoundary = read(SOURCE_PATHS.auditBoundary);
  const contract = read(TASK2372_DOC_PATH);

  assertIncludesAll(customerFilter, [
    'DEPOT_REPAIR_CUSTOMER_VISIBLE_ALLOWED_FIELDS',
    'DEPOT_REPAIR_CUSTOMER_VISIBLE_DTO_TYPE',
    'buildDepotRepairCustomerVisibleDto',
    'UNSAFE_TEXT_PATTERNS',
  ], 'customer-visible projection source');

  assertIncludesAll(auditBoundary, [
    'DEPOT_WORKSHOP_AUDIT_BOUNDARY_KIND',
    'internalOnly: true',
    'customerVisible: false',
    'FORBIDDEN_AUDIT_INPUT_KEYS',
    'buildDepotWorkshopAuditEvent',
  ], 'internal-only audit boundary source');

  assertIncludesAll(contract, [
    'Customer-visible output remains allowlisted/projection-only.',
    'Future contract work must not expose raw internal diagnosis, audit log, billing internals, provider payload, AI raw output, raw customer data, raw DB rows, phone, address, or cross-organization data.',
    'Audit events remain internal-only and sanitized.',
  ], 'Task2372 projection and audit boundary');
});

test('safe internal fields forbidden fields ownership and handoff contract remain explicit', () => {
  const contract = read(TASK2372_DOC_PATH);

  assertIncludesAll(contract, [
    '`repairOrderId`',
    '`caseId`',
    '`depotIntakeId`',
    '`organizationId`',
    '`tenantId`',
    '`workflowType`',
    '`depotStatus`',
    '`workshopJobId`',
    '`workshopId`',
    '`assignedTechnicianId`',
    '`subcontractorOrganizationId`',
    '`diagnosisSummaryRef`',
    '`quoteSummaryRef`',
    '`estimateSummaryRef`',
    '`partsSummaryRef`',
    '`qcSummaryRef`',
    '`customerVisibleProjectionRef`',
    '`auditEventRef`',
    '`finalAppointmentId`',
    '`fieldServiceReport`',
    '`completionReport`',
    '`providerPayload`',
    '`billingInternals`',
    'Case handoff to workshop/depot.',
    'Repair Intake draft or depot intake source reference.',
    'Brand/service-provider/subcontractor assignment scope.',
  ], 'Task2372 fields and ownership contract');
});

test('Task2372 introduces no forbidden route DB provider package public route raw customer or AI behavior', () => {
  const contract = read(TASK2372_DOC_PATH);
  const route = read(SOURCE_PATHS.route);
  const guardSource = sourceWithoutAllowedLists(read('tests/depotWorkshop/depotWorkshopRepairOrderContractStateModel.static.test.js'));

  assertIncludesAll(contract, [
    'New route/API/controller behavior.',
    'DB commands, SQL execution, real DB connection, migration creation, migration dry-run, or migration apply.',
    '`DATABASE_URL`, Zeabur, env, or secrets inspection.',
    'Provider sending.',
    'Package or package-lock changes.',
    'AI/RAG/OpenAI/vector DB runtime behavior or scope expansion.',
    'Public/open/customer route expansion.',
    'Customer-visible raw internal data exposure.',
  ], 'Task2372 forbidden behavior contract');

  assertDoesNotMatchAny(contract, EXECUTABLE_AUTHORIZATION_PATTERNS, 'Task2372 contract executable authorization');
  assertDoesNotMatchAny(guardSource, EXECUTABLE_AUTHORIZATION_PATTERNS, 'Task2372 guard executable authorization');
  assertDoesNotMatchAny(contract, REAL_LOOKING_SECRET_PATTERNS, 'Task2372 contract credential boundary');
  assertDoesNotMatchAny(guardSource, REAL_LOOKING_SECRET_PATTERNS, 'Task2372 guard credential boundary');
  assertExcludesAll(route, PUBLIC_OPEN_ROUTE_MARKERS, 'depot route public/open/customer expansion');
});
