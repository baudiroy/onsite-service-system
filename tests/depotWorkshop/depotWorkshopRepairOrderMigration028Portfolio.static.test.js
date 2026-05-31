'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const MIGRATION_028 = 'migrations/028_create_depot_workshop_repair_orders.sql';
const TASK2404_DOC = 'docs/task-2404-depot-workshop-repair-order-migration-028-static-review-portfolio-guard-no-runtime-change-no-db-execution-no-migration-apply-no-provider-no-package.md';
const TASK2403_DOC = 'docs/task-2403-depot-workshop-repair-order-migration-file-creation-static-sql-review-no-db-execution-no-migration-apply-no-provider-no-package.md';
const TASK2403_TEST = 'tests/depotWorkshop/depotWorkshopRepairOrderMigration028.static.test.js';
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

test('Task2404 migration 028 portfolio artifacts exist', () => {
  for (const relativePath of [
    MIGRATION_028,
    TASK2404_DOC,
    TASK2403_DOC,
    TASK2403_TEST,
    TASK2402_DOC,
    TASK2401_DOC,
    REPOSITORY_CONTRACT_FILE,
    STATE_MODEL_FILE,
    ROUTE_FILE,
  ]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }
});

test('migration 028 portfolio keeps schema table and required columns frozen', () => {
  const migration = read(MIGRATION_028);

  assertIncludesAll(migration, [
    'CREATE TABLE IF NOT EXISTS depot_workshop_repair_orders',
    'id uuid PRIMARY KEY DEFAULT gen_random_uuid()',
    'organization_id uuid NOT NULL',
    'tenant_id uuid',
    'case_id uuid NOT NULL REFERENCES cases(id)',
    'depot_intake_id uuid REFERENCES repair_intake_drafts(id)',
    'repair_order_ref text NOT NULL',
    'depot_status text NOT NULL DEFAULT',
    'workflow_type text NOT NULL DEFAULT',
    'brand_id uuid',
    'service_provider_id uuid',
    'subcontractor_organization_id uuid',
    'workshop_id uuid',
    'workshop_team_id uuid',
    'assigned_technician_id uuid',
    'request_id text',
    'created_by_actor_id uuid',
    'updated_by_actor_id uuid',
    'created_at timestamptz NOT NULL DEFAULT now()',
    'updated_at timestamptz NOT NULL DEFAULT now()',
    'metadata_safe jsonb NOT NULL DEFAULT',
    'customer_projection_safe jsonb NOT NULL DEFAULT',
  ], 'Task2404 required migration columns');
});

test('migration 028 portfolio keeps accepted state constraint and safe JSON checks', () => {
  const migration = read(MIGRATION_028);
  const stateModel = read(STATE_MODEL_FILE);

  assertIncludesAll(stateModel, [
    'DEPOT_WORKSHOP_REPAIR_ORDER_STATUSES',
    'isDepotWorkshopRepairOrderStatus',
  ], 'Task2373 state model');

  assertIncludesAll(migration, [
    'CONSTRAINT depot_workshop_repair_orders_status_check CHECK',
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
    'CONSTRAINT depot_workshop_repair_orders_metadata_safe_object_check CHECK',
    'CONSTRAINT depot_workshop_repair_orders_customer_projection_safe_object_check CHECK',
  ], 'Task2404 status and JSON checks');
});

test('migration 028 portfolio keeps expected organization isolation and lookup indexes', () => {
  const migration = read(MIGRATION_028);

  assertIncludesAll(migration, [
    'CREATE UNIQUE INDEX IF NOT EXISTS idx_depot_workshop_repair_orders_org_ref',
    'ON depot_workshop_repair_orders(organization_id, repair_order_ref)',
    'CREATE UNIQUE INDEX IF NOT EXISTS idx_depot_workshop_repair_orders_org_request',
    'ON depot_workshop_repair_orders(organization_id, request_id)',
    'CREATE INDEX IF NOT EXISTS idx_depot_workshop_repair_orders_org_tenant_status',
    'ON depot_workshop_repair_orders(organization_id, tenant_id, depot_status, created_at DESC)',
    'CREATE INDEX IF NOT EXISTS idx_depot_workshop_repair_orders_org_case',
    'ON depot_workshop_repair_orders(organization_id, case_id, created_at DESC)',
    'CREATE INDEX IF NOT EXISTS idx_depot_workshop_repair_orders_org_depot_intake',
    'ON depot_workshop_repair_orders(organization_id, depot_intake_id, created_at DESC)',
    'CREATE INDEX IF NOT EXISTS idx_depot_workshop_repair_orders_org_status',
    'ON depot_workshop_repair_orders(organization_id, depot_status, created_at DESC)',
    'CREATE INDEX IF NOT EXISTS idx_depot_workshop_repair_orders_org_assignment',
    'CREATE INDEX IF NOT EXISTS idx_depot_workshop_repair_orders_org_provider_scope',
  ], 'Task2404 migration indexes');
});

test('migration 028 portfolio keeps forbidden columns and payload families absent', () => {
  const migration = read(MIGRATION_028);

  assertDoesNotMatchAny(migration, [
    /\bfinal_appointment_id\b/i,
    /\bfield_service_report\b/i,
    /\bfield_service_report_id\b/i,
    /\bcompletion_report\b/i,
    /\bcompletion_report_id\b/i,
    /\bapproved_at\b/i,
    /\bpublished_at\b/i,
    /\bfinalized_at\b/i,
    /\bcustomer_(?:contact|address|signature|photo|phone|email|mobile|private)\b/i,
    /\braw_(?:customer|db|row|rows|payload|input|error|body)\b/i,
    /\bprovider_payload\b/i,
    /\b(?:billing|settlement|payment|invoice)(?:_|\\b)/i,
    /\b(?:ai|rag|vector|model)_?(?:output|payload|trace|embedding)?\b/i,
    /\b(?:sql|stack|token|password|secret|debug)_payload\b/i,
  ], 'Task2404 forbidden migration columns');
});

test('route write scope and repository adapter implementation remain blocked', () => {
  const route = read(ROUTE_FILE);
  const repositoryContract = read(REPOSITORY_CONTRACT_FILE);

  assertIncludesAll(route, [
    'depot_repair_route_write_scope_not_approved',
    'writeRequested(req)',
  ], 'Task2404 route write scope');

  assertIncludesAll(repositoryContract, [
    'normalizeDepotWorkshopRepairOrderRepositoryWriteCommand',
    'normalizeDepotWorkshopRepairOrderRepositoryResult',
    'written: false',
  ], 'Task2404 repository contract');

  assertDoesNotMatchAny(route, [
    /normalizeDepotWorkshopRepairOrderRepositoryWriteCommand/,
    /depotWorkshopRepairOrderRepositoryContract/,
    /INSERT\s+INTO\s+depot_workshop_repair_orders/i,
    /UPDATE\s+depot_workshop_repair_orders/i,
  ], 'Task2404 route repository wiring');
});

test('Task2404 docs and portfolio guard preserve no DB execution or apply authorization', () => {
  const combined = [
    read(TASK2404_DOC),
    read(TASK2403_DOC),
    read(TASK2403_TEST),
    read('tests/depotWorkshop/depotWorkshopRepairOrderMigration028Portfolio.static.test.js'),
  ].join('\n');

  assertIncludesAll(combined, [
    'migration 028 current status',
    'static SQL review status',
    'no DB execution / no migration apply status',
    'current safety boundaries',
    'migration 028 branch closure',
    'disposable DB dry-run authorization packet',
    'repository adapter design packet',
    'route write-scope authorization packet',
    'No DB/SQL execution occurred.',
    'No migration dry-run/apply occurred.',
  ], 'Task2404 doc summary');

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
  ], 'Task2404 executable command authorization');
});
