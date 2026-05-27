'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const taskDocPath = 'docs/task-1776-engineer-mobile-assigned-appointment-existing-schema-compatibility-inventory-no-db-no-migration.md';

const inspectedFiles = [
  'migrations/001_create_base_tables.sql',
  'migrations/002_create_cases.sql',
  'migrations/006_create_dispatch_appointment_tables.sql',
  'migrations/008_create_field_service_tables.sql',
  'migrations/013_add_organization_scope.sql',
  'migrations/018_add_visit_result_fields_to_appointments.sql',
  'migrations/019_add_final_appointment_id_to_field_service_reports.sql',
  'migrations/022_create_engineer_mobile_read_model.sql',
  'docs/design/engineer-mobile-workbench.md',
  'docs/design/engineer-mobile-read-model-schema-proposal.md',
  'src/engineerMobile/engineerMobileAssignedAppointmentSqlQueryBuilder.js',
  'src/engineerMobile/engineerMobileAssignedAppointmentDbRowMapper.js',
  'src/engineerMobile/engineerMobileAssignedAppointmentProjection.js',
];

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function assertDocIncludesAll(values, label) {
  const doc = read(taskDocPath);

  for (const value of values) {
    assert.match(doc, value instanceof RegExp ? value : new RegExp(value), `${label} missing ${value}`);
  }
}

test('Task1776 compatibility inventory doc and inspected files exist', () => {
  assert.equal(fs.existsSync(path.join(repoRoot, taskDocPath)), true, `${taskDocPath} should exist`);

  for (const file of inspectedFiles) {
    assert.equal(fs.existsSync(path.join(repoRoot, file)), true, `${file} should exist`);
  }
});

test('Task1776 doc records the inspected schema, migration, design, and source files', () => {
  assertDocIncludesAll(inspectedFiles.map((file) => new RegExp(file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))), 'inspected file list');
  assertDocIncludesAll([
    /No `schema\/\*\*` directory exists/,
  ], 'schema directory inventory');
});

test('Task1776 doc records current SQL builder expected fields and required scope fields', () => {
  assertDocIncludesAll([
    /Current SQL Builder Expected Fields/,
    /`appointment_id`/,
    /`case_reference`/,
    /`appointment_window`/,
    /`scheduled_start`/,
    /`scheduled_end`/,
    /`service_type`/,
    /`customer_display_name`/,
    /`location_label`/,
    /`appointment_status`/,
    /`priority_label`/,
    /`service_summary`/,
    /`public_customer_notes`/,
    /`checklist_preview`/,
    /`organizationId`/,
    /`engineerUserId`/,
    /`appointmentId`/,
    /`executable: false`/,
  ], 'SQL builder expected fields');
});

test('Task1776 doc records current DB row mapper accepted aliases', () => {
  assertDocIncludesAll([
    /Current DB Row Mapper Accepted Aliases/,
    /`appointment_id` \/ `appointmentId` -> `appointmentId`/,
    /`organization_id` \/ `organizationId` -> `organizationId`/,
    /`engineer_user_id` \/ `assigned_engineer_id` \/ `engineer_id`/,
    /`scheduled_start` \/ `scheduled_start_at`/,
    /`scheduled_end` \/ `scheduled_end_at`/,
    /`appointment_status` \/ `status`/,
    /`checklist_preview` \/ `checklistPreview`/,
  ], 'DB row mapper aliases');
});

test('Task1776 doc records compatibility findings and future-task-only mismatch policy', () => {
  assertDocIncludesAll([
    /Compatibility Summary/,
    /Fields aligned with existing base tables or read model draft/,
    /Fields missing or uncertain/,
    /`appointments\.organization_id` is not present/,
    /`appointments\.assigned_engineer_id` is not present/,
    /`appointments\.scheduled_start` is not present; base schema uses `scheduled_start_at`/,
    /`cases\.case_reference` is not present; existing schema uses `case_no`/,
    /The current DB-adjacent query builder is safer as a future read-model\/read-projection contract/,
    /Mismatch Handling Policy/,
    /document-only future task candidates/,
    /does not fix mismatches/,
    /does not edit migrations/,
    /does not create migrations/,
    /does not execute DB/,
    /does not execute SQL/,
  ], 'compatibility findings');
});

test('Task1776 doc records forbidden fields, no-runtime/no-migration boundary, and FSR invariant preservation', () => {
  assertDocIncludesAll([
    /Forbidden Fields and Sensitive Data/,
    /`finalAppointmentId`/,
    /`final_appointment_id`/,
    /raw phone\/address unless explicitly approved later/,
    /raw SQL\/debug fields/,
    /raw DB rows/,
    /internal notes/,
    /provider\/debug\/private fields/,
    /token\/cookie\/password\/secret\/auth header/,
    /No source\/runtime changes/,
    /No migration changes/,
    /No real DB connection/,
    /No real SQL execution/,
    /No `psql`/,
    /No `db:migrate`/,
    /No smoke/,
    /No provider sending/,
    /One Case \/ one formal FSR boundary remains untouched/,
    /`field_service_reports\.case_id` uniqueness remains untouched/,
    /This inventory cannot create a second formal FSR/,
  ], 'forbidden field and invariant boundary');
});

test('Task1776 static test itself does not import DB clients, execute SQL, or run migrations', () => {
  const source = read('tests/engineerMobile/engineerMobileAssignedAppointmentExistingSchemaCompatibility.static.test.js');
  const specifiers = Array.from(source.matchAll(/require\(['"]([^'"]+)['"]\)/g)).map((match) => match[1]);

  const forbiddenSpecifiers = [
    /^child_process$/,
    /^(?:pg|postgres|postgresql|mysql|mysql2|knex|sequelize|prisma|typeorm|mongodb|mssql|sqlite3?)$/i,
    /(?:^|[/.-])(?:dbClient|databaseClient|pool|connection|transaction)(?:$|[/.-])/i,
    /(?:^|[/.-])migrations?(?:$|[/.-])/i,
  ];

  for (const specifier of specifiers) {
    for (const pattern of forbiddenSpecifiers) {
      assert.equal(pattern.test(specifier), false, `static test imports forbidden specifier ${specifier}`);
    }
  }

  assert.deepEqual(specifiers.sort(), [
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:test',
  ]);
});
