'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const TASK2402_DOC = 'docs/task-2402-depot-workshop-repair-order-migration-file-creation-authorization-packet-no-runtime-change-no-db-execution-no-migration-creation-no-provider-no-package.md';
const TASK2401_DOC = 'docs/task-2401-depot-workshop-repair-order-migration-schema-design-packet-no-runtime-change-no-db-execution-no-migration-no-provider-no-package.md';
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

test('Task2402 authorization packet and context artifacts exist', () => {
  for (const relativePath of [
    TASK2402_DOC,
    TASK2401_DOC,
    REPOSITORY_CONTRACT_FILE,
    STATE_MODEL_FILE,
    ROUTE_FILE,
  ]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }
});

test('migration inventory records next recommended file without creating it', () => {
  const doc = read(TASK2402_DOC);
  const migrations = migrationFiles();

  assert.equal(migrations.includes('027_create_customer_access_audit_events.sql'), true);
  assert.equal(migrations.includes('028_create_depot_workshop_repair_orders.sql'), false);
  assertIncludesAll(doc, [
    'Observed highest migration prefix: `027`.',
    '027_create_customer_access_audit_events.sql',
    'Recommended future migration file name, not created by this task:',
    '028_create_depot_workshop_repair_orders.sql',
    'No file with that name exists in this task.',
  ], 'Task2402 migration inventory');
});

test('authorization packet freezes target table columns constraints and indexes', () => {
  const doc = read(TASK2402_DOC);

  assertIncludesAll(doc, [
    'table candidate: `depot_workshop_repair_orders`',
    '`depot_workshop_repair_order_events`',
    '`id`',
    '`organization_id`',
    '`tenant_id`',
    '`case_id`',
    '`depot_intake_id`',
    '`repair_order_ref`',
    '`depot_status`',
    '`workflow_type`',
    '`brand_id`',
    '`service_provider_id`',
    '`subcontractor_organization_id`',
    '`workshop_id`',
    '`workshop_team_id`',
    '`assigned_technician_id`',
    '`request_id`',
    '`created_by_actor_id`',
    '`updated_by_actor_id`',
    '`created_at`',
    '`updated_at`',
    'optional `metadata_safe`',
    'optional `customer_projection_safe`',
    'organization scoping index candidates',
    'tenant scoping index candidates',
    'case reference index candidate',
    'depot intake reference index candidate',
    '`repair_order_ref` uniqueness within organization scope',
    '`request_id` idempotency candidate',
    '`depot_status` constraint aligned to Task2373 state model',
  ], 'Task2402 target schema');
});

test('status constraint references accepted Task2373 statuses', () => {
  const doc = read(TASK2402_DOC);
  const stateModel = read(STATE_MODEL_FILE);

  assertIncludesAll(stateModel, [
    'DEPOT_WORKSHOP_REPAIR_ORDER_STATUSES',
    'isDepotWorkshopRepairOrderStatus',
  ], 'Task2373 state model source');

  assertIncludesAll(doc, [
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
  ], 'Task2402 accepted statuses');
});

test('forbidden columns and behavior remain rejected', () => {
  const doc = read(TASK2402_DOC);

  assertIncludesAll(doc, [
    'Explicitly Rejected Future Columns And Behavior',
    '`final_appointment_id`',
    'formal Field Service Report columns',
    'formal Completion Report columns',
    'Field Service Report approval/publication/finalization columns',
    'Completion Report approval/publication/finalization columns',
    'raw customer contact columns',
    'raw customer address columns',
    'raw customer signature columns',
    'raw customer photo columns',
    'raw DB row dump columns',
    'provider payload columns',
    'billing columns',
    'settlement columns',
    'payment columns',
    'invoice columns',
    'AI/RAG/vector/raw model output columns',
    'SQL/stack/token/password/secret/debug payload columns',
  ], 'Task2402 forbidden columns');
});

test('repository contract remains visible and route write scope remains blocked', () => {
  const contract = read(REPOSITORY_CONTRACT_FILE);
  const route = read(ROUTE_FILE);

  assertIncludesAll(contract, [
    'DEPOT_WORKSHOP_REPAIR_ORDER_REPOSITORY_CONTRACT_KIND',
    'normalizeDepotWorkshopRepairOrderRepositoryWriteCommand',
    'normalizeDepotWorkshopRepairOrderRepositoryResult',
    'buildDepotWorkshopRepairOrderRepositorySafeFailure',
    'depot_workshop.assignment_intent.write',
  ], 'Task2398 repository contract');

  assertIncludesAll(route, [
    'depot_repair_route_write_scope_not_approved',
    'writeRequested(req)',
  ], 'Task2402 route write scope');
});

test('authorization packet recommends exactly one next bounded task', () => {
  const doc = read(TASK2402_DOC);

  assertIncludesAll(doc, [
    'Recommended next bounded task: migration file creation with static tests only.',
    'The next bounded step can create the migration file and static SQL-review tests',
  ], 'Task2402 next task recommendation');

  assert.equal(
    (doc.match(/Recommended next bounded task:/g) || []).length,
    1,
    'Task2402 should recommend exactly one next bounded task',
  );
});

test('Task2402 docs and static guard introduce no executable DB SQL migration provider package authorization', () => {
  const combined = [
    read(TASK2402_DOC),
    read('tests/depotWorkshop/depotWorkshopRepairOrderMigrationFileCreationAuthorization.static.test.js'),
  ].join('\n');

  assertIncludesAll(combined, [
    'No file with that name exists in this task.',
    'no DB execution',
    'no migration dry-run/apply',
    'no `DATABASE_URL`, env, Zeabur, or secrets inspection',
    'No DB commands',
    'No SQL execution',
    'No provider sending',
    'No package or package-lock changes',
    'formal Field Service Report / Completion Report creation, approval, publication, or finalization behavior',
    '`finalAppointmentId` mutation path',
    'The 7 held historical docs remain outside Task2402 scope',
  ], 'Task2402 non-authorization');

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
  ], 'Task2402 executable authorization');
});
