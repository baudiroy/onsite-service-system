'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const migrationPath = 'migrations/022_create_engineer_mobile_read_model.sql';
const queryBuilderPath = 'src/engineerMobile/engineerMobileAssignedAppointmentSqlQueryBuilder.js';
const taskDocPath =
  'docs/task-1782-engineer-mobile-read-model-migration-022-static-readiness-guard-no-db-no-apply.md';

const inspectedReadOnlyFiles = [
  migrationPath,
  'docs/task-1778-engineer-mobile-read-model-path-decision-guard-no-db-no-migration.md',
  queryBuilderPath,
  'tests/engineerMobile/engineerMobileDbAdjacentRuntimeBoundary.static.test.js',
];

function absolutePath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(absolutePath(relativePath), 'utf8');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function assertContainsAll(source, patterns, label) {
  for (const pattern of patterns) {
    assert.match(source, pattern, `${label} is missing ${pattern}`);
  }
}

function assertNoPattern(source, patterns, label) {
  for (const pattern of patterns) {
    assert.doesNotMatch(source, pattern, `${label} contains forbidden pattern ${pattern}`);
  }
}

test('Task1782 doc and read-only inspected files exist', () => {
  assert.equal(fs.existsSync(absolutePath(taskDocPath)), true, `${taskDocPath} should exist`);

  for (const file of inspectedReadOnlyFiles) {
    assert.equal(fs.existsSync(absolutePath(file)), true, `${file} should exist`);
  }
});

test('migration 022 defines the read model table expected by Task1780', () => {
  const migration = read(migrationPath);
  const queryBuilder = read(queryBuilderPath);

  assertContainsAll(migration, [
    /CREATE TABLE IF NOT EXISTS engineer_mobile_task_read_models/,
    /\bid uuid PRIMARY KEY DEFAULT gen_random_uuid\(\)/,
    /\borganization_id uuid NOT NULL/,
    /\bcase_id uuid NOT NULL/,
    /\bappointment_id uuid NOT NULL/,
    /\bassigned_engineer_id uuid NOT NULL/,
  ], 'migration 022');

  assertContainsAll(queryBuilder, [
    /FROM engineer_mobile_task_read_models em/,
    /WHERE em\.organization_id = \$1/,
    /AND em\.assigned_engineer_id = \$2/,
    /AND em\.appointment_id = \$3/,
  ], 'Task1780 query builder');
});

test('migration 022 fields can map to Task1780 safe selected aliases', () => {
  const migration = read(migrationPath);
  const queryBuilder = read(queryBuilderPath);

  assertContainsAll(migration, [
    /\bscheduled_start timestamptz/,
    /\bscheduled_end timestamptz/,
    /\bstatus text NOT NULL/,
    /\bcustomer_name_masked text/,
    /\baddress_summary text/,
    /\bservice_summary text/,
    /\bservice_type text/,
    /\bsite_note_safe text/,
    /\bchecklist_summary jsonb NOT NULL DEFAULT '\[\]'::jsonb/,
  ], 'migration 022 selected field support');

  assertContainsAll(queryBuilder, [
    /em\.appointment_id AS appointment_id/,
    /em\.case_id AS case_reference/,
    /concat_ws\(' - ', em\.scheduled_start, em\.scheduled_end\) AS appointment_window/,
    /em\.service_type AS service_type/,
    /em\.customer_name_masked AS customer_display_name/,
    /em\.address_summary AS location_label/,
    /em\.status AS appointment_status/,
    /NULL::text AS priority_label/,
    /em\.service_summary AS service_summary/,
    /em\.site_note_safe AS public_customer_notes/,
    /em\.checklist_summary AS checklist_preview/,
  ], 'Task1780 selected alias mapping');
});

test('migration 022 does not expose finalAppointmentId as a visible projection field', () => {
  const migration = read(migrationPath);
  const queryBuilder = read(queryBuilderPath);

  assertNoPattern(migration, [
    /\bfinalAppointmentId\b/,
    /\bfinal_appointment_id\b/,
  ], 'migration 022');

  assertNoPattern(queryBuilder, [
    /\bfinalAppointmentId\b/,
    /\bfinal_appointment_id\b/,
  ], 'Task1780 query builder');
});

test('migration 022 is explicitly inert until future authorization', () => {
  const migration = read(migrationPath);

  assertContainsAll(migration, [
    /MIGRATION FILE AUTHORING ONLY/,
    /APPLY OR DRY-RUN REQUIRES A SEPARATE TASK/,
    /DO NOT RUN AGAINST SHARED RUNTIME WITHOUT EXPLICIT APPLY TASK/,
    /FUTURE DRY-RUN OR APPLY REQUIRES EXPLICIT DISPOSABLE DB AUTHORIZATION/,
    /NO DB CONNECTION, PSQL, OR SQL EXECUTION IS AUTHORIZED BY THIS FILE/,
    /TABLE IS INTENDED TO BE INERT UNTIL A FUTURE RUNTIME TASK/,
  ], 'migration 022 authorization boundary');
});

test('Task1782 doc records no DB execution, no migration apply, and no applied assumption', () => {
  const doc = read(taskDocPath);

  assertContainsAll(doc, [
    /No DB execution is authorized/,
    /No migration apply is authorized/,
    /No DDL or schema\/index change is authorized/,
    /Migration 022 is not assumed applied/,
    /Future dry-run or apply requires separate explicit authorization/,
    /No DB URL or credential may be printed/,
  ], 'Task1782 no DB and no apply boundary');
});

test('Task1782 doc records read-model readiness, inspected files, and FSR boundary', () => {
  const doc = read(taskDocPath);

  for (const file of inspectedReadOnlyFiles) {
    assert.match(doc, new RegExp(escapeRegExp(file)), `Task1782 doc should list ${file}`);
  }

  assertContainsAll(doc, [
    /engineer_mobile_task_read_models/,
    /organization_id/,
    /assigned_engineer_id/,
    /appointment_id/,
    /table\/field alignment/,
    /One Case \/ one formal FSR boundary remains untouched/,
    /`field_service_reports\.case_id` uniqueness remains untouched/,
    /`finalAppointmentId` remains system-owned\/admin override only/,
  ], 'Task1782 readiness and core boundary');
});

test('Task1782 static test itself does not import DB clients, execute SQL, or run migrations', () => {
  const source = read('tests/engineerMobile/engineerMobileReadModelMigration022Readiness.static.test.js');
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
