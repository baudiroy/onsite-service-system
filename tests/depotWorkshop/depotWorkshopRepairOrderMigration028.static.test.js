'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const MIGRATION_028 = 'migrations/028_create_depot_workshop_repair_orders.sql';
const TASK2403_DOC = 'docs/task-2403-depot-workshop-repair-order-migration-file-creation-static-sql-review-no-db-execution-no-migration-apply-no-provider-no-package.md';
const TASK2402_DOC = 'docs/task-2402-depot-workshop-repair-order-migration-file-creation-authorization-packet-no-runtime-change-no-db-execution-no-migration-creation-no-provider-no-package.md';
const TASK2401_DOC = 'docs/task-2401-depot-workshop-repair-order-migration-schema-design-packet-no-runtime-change-no-db-execution-no-migration-no-provider-no-package.md';
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

test('Task2403 migration static review artifacts exist', () => {
  for (const relativePath of [
    MIGRATION_028,
    TASK2403_DOC,
    TASK2402_DOC,
    TASK2401_DOC,
    ROUTE_FILE,
  ]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }
});

test('migration 028 creates depot_workshop_repair_orders with required columns', () => {
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
  ], 'migration 028 required columns');
});

test('depot_status constraint includes accepted Task2373 statuses only', () => {
  const migration = read(MIGRATION_028);

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
  ], 'migration 028 depot status constraint');
});

test('migration 028 includes expected organization isolation and lookup indexes', () => {
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
  ], 'migration 028 indexes');
});

test('migration 028 excludes forbidden columns and payload families', () => {
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
  ], 'migration 028 forbidden columns');
});

test('Task2403 docs record static-only non-execution boundaries', () => {
  const doc = read(TASK2403_DOC);

  assertIncludesAll(doc, [
    'Migration file created but not executed.',
    'No DB/SQL execution occurred.',
    'No migration dry-run/apply occurred.',
    'No env/Zeabur/secrets were inspected.',
    'The migration is schema-only',
    'future application requires separate exact PM authorization',
    'Recommended next bounded task as non-authorized only: migration 028 static review portfolio guard.',
  ], 'Task2403 non-execution doc');
});

test('Task2403 introduces no executable DB apply dry-run provider package authorization', () => {
  const combined = [
    read(TASK2403_DOC),
    read(MIGRATION_028),
    read('tests/depotWorkshop/depotWorkshopRepairOrderMigration028.static.test.js'),
  ].join('\n');

  assertIncludesAll(combined, [
    'APPLY OR DRY-RUN REQUIRES A SEPARATE TASK.',
    'No DB/SQL execution occurred.',
    'No migration dry-run/apply occurred.',
    'No provider sending occurred.',
    'No package or package-lock changes occurred.',
  ], 'Task2403 non-authorization');

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
  ], 'Task2403 executable command authorization');
});

test('route write scope remains blocked', () => {
  const route = read(ROUTE_FILE);

  assertIncludesAll(route, [
    'depot_repair_route_write_scope_not_approved',
    'writeRequested(req)',
  ], 'Task2403 route write scope');
});
