'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const TASK2401_DOC = 'docs/task-2401-depot-workshop-repair-order-migration-schema-design-packet-no-runtime-change-no-db-execution-no-migration-no-provider-no-package.md';
const TASK2397_DOC = 'docs/task-2397-depot-workshop-repair-order-repository-migration-authorization-packet-no-runtime-change-no-db-execution-no-migration-no-provider-no-package.md';
const TASK2398_DOC = 'docs/task-2398-depot-workshop-repair-order-repository-contract-pure-helper-no-db-no-migration-no-route-no-provider-no-package.md';
const TASK2399_DOC = 'docs/task-2399-depot-workshop-repair-order-repository-contract-static-portfolio-guard-no-runtime-change-no-db-no-migration-no-provider-no-package.md';
const TASK2400_DOC = 'docs/task-2400-depot-workshop-repair-order-repository-contract-branch-closure-no-runtime-change-no-db-no-migration-no-provider-no-package.md';
const REPOSITORY_CONTRACT_FILE = 'src/depotWorkshop/depotWorkshopRepairOrderRepositoryContract.js';
const STATE_MODEL_FILE = 'src/depotWorkshop/depotWorkshopRepairOrderStateModel.js';
const ROUTE_FILE = 'src/routes/depotRepair.routes.js';

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

function migrationFiles() {
  return fs.readdirSync(projectPath('migrations'))
    .filter((fileName) => fileName.endsWith('.sql'))
    .sort();
}

test('Task2401 schema design packet and context artifacts exist', () => {
  for (const relativePath of [
    TASK2401_DOC,
    TASK2397_DOC,
    TASK2398_DOC,
    TASK2399_DOC,
    TASK2400_DOC,
    REPOSITORY_CONTRACT_FILE,
    STATE_MODEL_FILE,
    ROUTE_FILE,
  ]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }
});

test('Task2401 migration absence guard now allows only PM-authorized Task2403 migration', () => {
  const depotWorkshopMigrations = migrationFiles().filter((fileName) => (
    /depot|workshop|repair_order|repair_orders|work_order|work_orders/i.test(fileName)
  ));

  assert.deepEqual(depotWorkshopMigrations, ['028_create_depot_workshop_repair_orders.sql']);
});

test('design packet documents table candidate core columns constraints and indexes', () => {
  const doc = read(TASK2401_DOC);

  assertIncludesAll(doc, [
    'Task2401 Depot Workshop Repair Order Migration Schema Design Packet',
    'depot_workshop_repair_orders',
    'id',
    'organization_id',
    'tenant_id',
    'case_id',
    'depot_intake_id',
    'repair_order_ref',
    'depot_status',
    'workflow_type',
    'brand_id',
    'service_provider_id',
    'subcontractor_organization_id',
    'workshop_id',
    'workshop_team_id',
    'assigned_technician_id',
    'request_id',
    'created_by_actor_id',
    'updated_by_actor_id',
    'created_at',
    'updated_at',
    'metadata_safe',
    'customer_projection_safe',
    'organization scoping on `organization_id`',
    'tenant scoping on `tenant_id`',
    'Case reference on `case_id`',
    'Depot intake reference on `depot_intake_id`',
    'repair order reference uniqueness within organization scope',
    'idempotency candidate using `organization_id` plus `request_id`',
  ], 'Task2401 design packet core schema');
});

test('design packet status constraint matches accepted Task2373 state model', () => {
  const doc = read(TASK2401_DOC);
  const stateModel = read(STATE_MODEL_FILE);

  assertIncludesAll(stateModel, [
    'DEPOT_WORKSHOP_REPAIR_ORDER_STATUSES',
    'isDepotWorkshopRepairOrderStatus',
  ], 'Task2373 state model source');

  assertIncludesAll(doc, [
    'Status Constraint',
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
    'Any future migration file must encode the accepted state model without inventing new statuses.',
  ], 'Task2401 status constraint');
});

test('design packet explicitly rejects forbidden columns and behavior', () => {
  const doc = read(TASK2401_DOC);

  assertIncludesAll(doc, [
    'Explicitly Rejected Columns',
    'final_appointment_id',
    'field_service_report_id',
    'field_service_report',
    'completion_report_id',
    'completion_report',
    'formal Field Service Report approval/publication/finalization columns',
    'formal Completion Report approval/publication/finalization columns',
    'raw customer contact columns',
    'raw customer address columns',
    'raw customer signature columns',
    'raw customer photo columns',
    'provider payload columns',
    'billing payload columns',
    'settlement payload columns',
    'payment payload columns',
    'invoice payload columns',
    'AI raw output columns',
    'RAG/vector payload columns',
    'SQL, stack, token, password, secret, or debug payload columns',
  ], 'Task2401 forbidden columns');
});

test('repository contract remains visible and route write scope remains blocked', () => {
  const contract = read(REPOSITORY_CONTRACT_FILE);
  const route = read(ROUTE_FILE);
  const doc = read(TASK2401_DOC);

  assertIncludesAll(contract, [
    'DEPOT_WORKSHOP_REPAIR_ORDER_REPOSITORY_CONTRACT_KIND',
    'normalizeDepotWorkshopRepairOrderRepositoryWriteCommand',
    'normalizeDepotWorkshopRepairOrderRepositoryResult',
    'buildDepotWorkshopRepairOrderRepositorySafeFailure',
    'depot_workshop.assignment_intent.write',
  ], 'Task2398 repository contract source');

  assertIncludesAll(route, [
    'depot_repair_route_write_scope_not_approved',
    'writeRequested(req)',
  ], 'Task2401 route write-scope block');

  assertIncludesAll(doc, [
    'Repository Contract Alignment',
    'exact action remains `depot_workshop.assignment_intent.write`',
    'repository result `written` remains repository-result-only and does not authorize route write scope',
    'Task2401 does not implement that adapter mapping.',
  ], 'Task2401 repository contract alignment');
});

test('design packet recommends exactly one next bounded task', () => {
  const doc = read(TASK2401_DOC);

  assertIncludesAll(doc, [
    'Recommended next bounded task: migration file creation authorization packet.',
    'The next safe step is still not to create the migration',
  ], 'Task2401 next task recommendation');

  assert.equal(
    (doc.match(/Recommended next bounded task:/g) || []).length,
    1,
    'Task2401 should recommend exactly one next bounded task',
  );
});

test('Task2401 docs and static guard introduce no executable DB SQL migration provider package authorization', () => {
  const combined = [
    read(TASK2401_DOC),
    read('tests/depotWorkshop/depotWorkshopRepairOrderMigrationSchemaDesign.static.test.js'),
  ].join('\n');

  assertIncludesAll(combined, [
    'No dedicated Depot / Workshop repair order migration exists',
    'No migration file may be created',
    'No DB commands',
    'No SQL execution',
    'No migration file creation',
    'No provider sending',
    'No package or package-lock changes',
    'formal Field Service Report / Completion Report creation, approval, publication, or finalization behavior',
    '`finalAppointmentId` mutation path',
    'The 7 held historical docs remain outside Task2401 scope',
  ], 'Task2401 non-authorization');

  assertDoesNotMatchAny(combined, [
    /\bCREATE\s+TABLE\b/i,
    /\bALTER\s+TABLE\b/i,
    /\bDROP\s+TABLE\b/i,
    /\bINSERT\s+INTO\b/i,
    /\bUPDATE\s+(?:SET|[a-z_]+\s+SET)\b/i,
    /\bDELETE\s+FROM\b/i,
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
  ], 'Task2401 executable authorization');
});
