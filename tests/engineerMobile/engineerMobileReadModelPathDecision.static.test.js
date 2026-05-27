'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const taskDocPath = 'docs/task-1778-engineer-mobile-read-model-path-decision-guard-no-db-no-migration.md';

const inspectedFiles = [
  'docs/task-1776-engineer-mobile-assigned-appointment-existing-schema-compatibility-inventory-no-db-no-migration.md',
  'migrations/022_create_engineer_mobile_read_model.sql',
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

test('Task1778 decision guard doc and inspected files exist', () => {
  assert.equal(fs.existsSync(path.join(repoRoot, taskDocPath)), true, `${taskDocPath} should exist`);

  for (const file of inspectedFiles) {
    assert.equal(fs.existsSync(path.join(repoRoot, file)), true, `${file} should exist`);
  }
});

test('Task1778 doc records the allowed read-only inspection set', () => {
  assertDocIncludesAll(
    inspectedFiles.map((file) => new RegExp(file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))),
    'inspected file list',
  );
});

test('Task1778 doc records decision: read-model path first', () => {
  assertDocIncludesAll([
    /Decision/,
    /Proceed with the read-model path first/,
    /Engineer Mobile assigned appointment read-only DB-adjacent work/,
    /current Task1758 query-builder selected fields, mapper aliases, and projection contract align better with the read model draft/,
  ], 'read-model path decision');
});

test('Task1778 doc defers the direct base-table path as a future option only', () => {
  assertDocIncludesAll([
    /The direct base-table path remains a future option only/,
    /Direct base-table path has missing\/uncertain display fields/,
    /Direct base-table path would require a future join\/query rewrite decision/,
    /joins across `appointments`, `dispatch_assignments`, `cases`, and approved safe projection sources/,
  ], 'direct base-table deferred decision');
});

test('Task1778 doc records no DB execution, no migration apply, no DDL, no psql, and no db:migrate', () => {
  assertDocIncludesAll([
    /does not authorize DB execution/,
    /does not authorize migration apply/,
    /does not authorize DDL/,
    /does not authorize `psql`/,
    /does not authorize `db:migrate`/,
    /No real DB connection/,
    /No real SQL execution/,
  ], 'no DB and no migration boundary');
});

test('Task1778 doc records read model migration is not assumed applied', () => {
  assertDocIncludesAll([
    /does not claim `migrations\/022_create_engineer_mobile_read_model\.sql` is applied anywhere/,
    /The read model migration is not assumed applied/,
    /remains an unapplied migration authoring draft/,
    /No disposable DB dry-run is authorized in this task/,
  ], 'unapplied read model migration boundary');
});

test('Task1778 doc records query builder alignment requirement', () => {
  assertDocIncludesAll([
    /Query builder alignment requirement/,
    /align with the read-model contract first/,
    /should not assume direct base-table fields/,
    /preserve safe selected fields and avoid forbidden fields/,
  ], 'query builder alignment requirement');
});

test('Task1778 doc records repository guard and query executor guard requirement', () => {
  assertDocIncludesAll([
    /injected executor/,
    /query executor guard/,
    /repository guard/,
    /Repository guard \/ query executor guard requirement remains mandatory/,
    /fail-closed missing-scope behavior/,
  ], 'repository and query executor guard requirement');
});

test('Task1778 doc records one Case / one formal FSR and finalAppointmentId non-exposure boundaries', () => {
  assertDocIncludesAll([
    /One Case \/ one formal FSR boundary remains untouched/,
    /`field_service_reports\.case_id` uniqueness remains untouched/,
    /This decision cannot create a second formal FSR/,
    /`finalAppointmentId` remains system-owned\/admin override only and must not be exposed/,
    /Task detail and assigned appointment reads are not Field Service Reports/,
  ], 'FSR and finalAppointmentId boundaries');
});

test('Task1778 static test itself does not import DB clients, execute SQL, or run migrations', () => {
  const source = read('tests/engineerMobile/engineerMobileReadModelPathDecision.static.test.js');
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
