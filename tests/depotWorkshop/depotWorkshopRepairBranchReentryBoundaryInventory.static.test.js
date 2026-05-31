'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const TASK2371_DOC_PATH = 'docs/task-2371-depot-workshop-repair-branch-re-entry-boundary-inventory-no-runtime-change-no-db-no-smoke-no-provider-no-package.md';

const CORE_DOC_PATHS = Object.freeze({
  design: 'docs/design/depot-workshop-repair.md',
  designIndex: 'docs/design/README.md',
  guardrails: 'docs/PROJECT_GUARDRAILS.md',
  shortInstruction: 'docs/PROJECT_SHORT_INSTRUCTION.md',
  priorClosure: 'docs/task-1918-depot-workshop-branch-final-review.md',
});

const DEPOT_SOURCE_PATHS = Object.freeze({
  statusBoundary: 'src/guards/DepotRepairStatusBoundary.js',
  accessScopeGuard: 'src/guards/DepotAccessScopeGuard.js',
  assignmentService: 'src/services/WorkshopAssignmentService.js',
  route: 'src/routes/depotRepair.routes.js',
  customerVisibleFilter: 'src/depotWorkshop/depotRepairCustomerVisibleDataFilter.js',
  auditBoundary: 'src/depotWorkshop/depotWorkshopAuditBoundary.js',
  repositoryAdapter: 'src/repositories/DepotIntakeSqlRepositoryAdapter.js',
});

const DEPOT_TEST_PATHS = Object.freeze([
  'tests/depotWorkshop/depotAccessScopeGuard.static.test.js',
  'tests/depotWorkshop/depotAccessScopeGuard.unit.test.js',
  'tests/depotWorkshop/depotIntakeSqlRepositoryAdapter.unit.test.js',
  'tests/depotWorkshop/depotIntakeSqlRepositoryAdapterBoundary.static.test.js',
  'tests/depotWorkshop/depotRepairCustomerVisibleDataFilter.static.test.js',
  'tests/depotWorkshop/depotRepairCustomerVisibleDataFilter.unit.test.js',
  'tests/depotWorkshop/depotRepairRoutePermissionGuard.static.test.js',
  'tests/depotWorkshop/depotRepairRoutePermissionGuard.unit.test.js',
  'tests/depotWorkshop/depotRepairStatusBoundary.static.test.js',
  'tests/depotWorkshop/depotRepairStatusBoundary.unit.test.js',
  'tests/depotWorkshop/depotWorkshopAuditBoundary.static.test.js',
  'tests/depotWorkshop/depotWorkshopAuditBoundary.unit.test.js',
  'tests/depotWorkshop/workshopAssignmentService.static.test.js',
  'tests/depotWorkshop/workshopAssignmentService.unit.test.js',
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

test('Task2371 inventory guard reads docs source and tests as text only', () => {
  for (const relativePath of [
    TASK2371_DOC_PATH,
    ...Object.values(CORE_DOC_PATHS),
    ...Object.values(DEPOT_SOURCE_PATHS),
    ...DEPOT_TEST_PATHS,
  ]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }

  const guardSource = read('tests/depotWorkshop/depotWorkshopRepairBranchReentryBoundaryInventory.static.test.js');
  const topLevelImports = guardSource.split('\n').slice(0, 8).join('\n');

  assert.deepEqual(requireSpecifiers(topLevelImports).sort(), [
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:test',
  ]);
});

test('project guardrails preserve Case FSR Completion Report and finalAppointmentId boundary', () => {
  const guardrails = read(CORE_DOC_PATHS.guardrails);
  const shortInstruction = read(CORE_DOC_PATHS.shortInstruction);
  const combined = `${guardrails}\n${shortInstruction}`;

  assertIncludesAll(combined, [
    '一張 Case 只能有一份正式 Field Service Report',
    '正式完成報告',
    'field_service_reports.case_id',
    'finalAppointmentId',
    'Depot / Workshop Repair',
    '不得破壞一個 Case 最終只有一份正式完成報告的原則',
  ], 'project guardrail depot completion boundary');
});

test('depot workshop design doc and inventory doc record source of truth and future boundaries', () => {
  const design = read(CORE_DOC_PATHS.design);
  const designIndex = read(CORE_DOC_PATHS.designIndex);
  const inventory = read(TASK2371_DOC_PATH);

  assertIncludesAll(design, [
    'Depot / Workshop Repair / 非到府維修模組',
    'Status: future design / no runtime change.',
    'Depot / Workshop Repair is a second service workflow beside On-site Service.',
    'Repair Receiving -> Diagnosis -> Quote -> Customer Approval / Rejection -> Repair Work -> Parts Usage -> Quality Check',
    'The same Case must not produce conflicting formal completion reports.',
    'Customer-facing surfaces must not show internal notes',
    'AI must not decide warranty, approve quotes, decide formal fees',
  ], 'depot workshop design doc');

  assertIncludesAll(designIndex, [
    '[depot-workshop-repair.md](./depot-workshop-repair.md)',
    'Design docs are not runtime approval.',
    'Do not place secrets, raw customer data',
  ], 'design index depot workshop entry');

  assertIncludesAll(inventory, [
    'Existing docs found',
    'Existing runtime source found',
    'Existing tests found',
    'Route API controller repository DB migration provider admin inventory',
    'Project invariants preserved',
    'Expected future domain boundaries',
  ], 'Task2371 inventory doc');
});

test('existing depot workshop source and test boundaries remain visible', () => {
  const statusBoundary = read(DEPOT_SOURCE_PATHS.statusBoundary);
  const accessGuard = read(DEPOT_SOURCE_PATHS.accessScopeGuard);
  const assignmentService = read(DEPOT_SOURCE_PATHS.assignmentService);
  const route = read(DEPOT_SOURCE_PATHS.route);
  const customerFilter = read(DEPOT_SOURCE_PATHS.customerVisibleFilter);
  const auditBoundary = read(DEPOT_SOURCE_PATHS.auditBoundary);
  const repository = read(DEPOT_SOURCE_PATHS.repositoryAdapter);
  const tests = DEPOT_TEST_PATHS.map(read).join('\n');

  assertIncludesAll(statusBoundary, [
    'DEPOT_REPAIR_STATUS_BOUNDARY_KIND',
    'DEPOT_REPAIR_STATUSES',
    'diagnosis_pending',
    'quote_pending',
    'quality_check',
    'finalAppointmentId',
    'fieldServiceReport',
    'evaluateDepotRepairStatusTransition',
  ], 'depot repair status boundary');

  assertIncludesAll(accessGuard, [
    'DEPOT_ACCESS_SCOPE_ROLES',
    'SERVICE_PROVIDER',
    'SUBCONTRACTOR',
    'subcontractor_minimized',
    'evaluateDepotAccessScope',
  ], 'depot access scope guard');

  assertIncludesAll(assignmentService, [
    'WORKSHOP_ASSIGN_PERMISSION',
    'workshop.assign',
    'workshop_assignment_write_scope_not_approved',
    'written: false',
    'createWorkshopAssignmentService',
  ], 'workshop assignment service');

  assertIncludesAll(route, [
    "DEPOT_REPAIR_ROUTE_PERMISSION = 'depot.repair.prepare'",
    "DEPOT_REPAIR_ROUTE_PATH = '/api/v1/depot/repairs/:depotIntakeId/assignment-intent'",
    'requirePermission(DEPOT_REPAIR_ROUTE_PERMISSION)',
    'depot_repair_route_write_scope_not_approved',
    'registerDepotRepairRoutes',
  ], 'depot repair route boundary');

  assertIncludesAll(customerFilter, [
    'DEPOT_REPAIR_CUSTOMER_VISIBLE_ALLOWED_FIELDS',
    'buildDepotRepairCustomerVisibleDto',
    'UNSAFE_TEXT_PATTERNS',
    'final\\s*appointment',
  ], 'depot customer visible filter');

  assertIncludesAll(auditBoundary, [
    'DEPOT_WORKSHOP_AUDIT_BOUNDARY_KIND',
    'internalOnly: true',
    'customerVisible: false',
    'buildDepotWorkshopAuditEvent',
  ], 'depot workshop audit boundary');

  assertIncludesAll(repository, [
    'DEPOT_INTAKE_SQL_REPOSITORY_ADAPTER_KIND',
    'READ_DEPOT_INTAKE_BY_DRAFT_SQL',
    'FROM repair_intake_drafts',
    'written: false',
    'createDepotIntakeSqlRepositoryAdapter',
  ], 'depot intake repository adapter');

  assertIncludesAll(tests, [
    'depotRepairStatusBoundary',
    'depotAccessScopeGuard',
    'workshopAssignmentService',
    'depotRepairRoutePermissionGuard',
    'depotRepairCustomerVisibleDataFilter',
    'depotWorkshopAuditBoundary',
    'depotIntakeSqlRepositoryAdapter',
  ], 'existing depot workshop tests');
});

test('inventory records existing route repository and absent controller migration provider admin pieces', () => {
  const inventory = read(TASK2371_DOC_PATH);

  assertIncludesAll(inventory, [
    'Route/API boundary exists: `src/routes/depotRepair.routes.js`.',
    'Existing route path: `POST /api/v1/depot/repairs/:depotIntakeId/assignment-intent`.',
    'Existing permission marker: `depot.repair.prepare`.',
    'Depot / Workshop controller: none found under `src/controllers/`.',
    'Repository boundary exists: `src/repositories/DepotIntakeSqlRepositoryAdapter.js`.',
    'Dedicated Depot / Workshop DB migration: none found.',
    'Provider sending boundary: no Depot / Workshop provider-sending module found.',
    'Admin frontend Depot / Workshop UI/API client: none found in `admin/src/`.',
  ], 'Task2371 component inventory');
});

test('Task2371 introduces no runtime DB smoke provider package or public route authorization', () => {
  const inventory = read(TASK2371_DOC_PATH);
  const route = read(DEPOT_SOURCE_PATHS.route);
  const guardSource = sourceWithoutAllowedLists(read('tests/depotWorkshop/depotWorkshopRepairBranchReentryBoundaryInventory.static.test.js'));

  assertIncludesAll(inventory, [
    'No new route/API/controller/runtime behavior is authorized by Task2371.',
    'No DB/migration/provider/smoke/package authorization is introduced.',
    'No public/open/customer route is introduced.',
    'This recommendation is non-authorized and must not start without explicit PM approval.',
    'Task2371 does not introduce:',
    'Runtime/source behavior changes.',
    'Route path or mount changes.',
    'DB commands, SQL execution, real DB connection, migration creation, migration dry-run, or migration apply.',
    '`DATABASE_URL`, Zeabur, env, or secrets inspection.',
    'Provider sending.',
    'Package or package-lock changes.',
  ], 'Task2371 non-authorization inventory');

  assertDoesNotMatchAny(inventory, EXECUTABLE_AUTHORIZATION_PATTERNS, 'Task2371 inventory executable authorization');
  assertDoesNotMatchAny(guardSource, EXECUTABLE_AUTHORIZATION_PATTERNS, 'Task2371 guard executable authorization');
  assertDoesNotMatchAny(inventory, REAL_LOOKING_SECRET_PATTERNS, 'Task2371 inventory credential boundary');
  assertDoesNotMatchAny(guardSource, REAL_LOOKING_SECRET_PATTERNS, 'Task2371 guard credential boundary');
  assertExcludesAll(route, PUBLIC_OPEN_ROUTE_MARKERS, 'depot repair route public/open/customer expansion');
});

test('future bounded source task is explicit and non-authorized', () => {
  const inventory = read(TASK2371_DOC_PATH);
  const matches = inventory.match(/Recommended next exact bounded source task:/g) || [];

  assert.equal(matches.length, 1, 'inventory must recommend exactly one next bounded source task');
  assertIncludesAll(inventory, [
    'Recommended next exact bounded source task:',
    'Depot Workshop Repair Order Contract and State Model Static Guard / No DB No Route No Provider No Package.',
    'A pure contract/static guard can define that next boundary without adding DB, route, controller, provider, package, smoke, or runtime write behavior.',
    'This recommendation is non-authorized and must not start without explicit PM approval.',
  ], 'Task2371 next bounded source task');
});
