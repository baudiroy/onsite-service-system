'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const migrationFile = path.join(repoRoot, 'migrations/022_create_engineer_mobile_read_model.sql');

function readMigration() {
  return fs.readFileSync(migrationFile, 'utf8');
}

function uncommentedSql(source) {
  return source
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('--'))
    .join('\n');
}

function assertIncludesAll(source, values) {
  for (const value of values) {
    assert.equal(source.includes(value), true, `missing ${value}`);
  }
}

test('migration draft keeps authoring-only not-applied safety comments', () => {
  const source = readMigration();

  assertIncludesAll(source, [
    'MIGRATION FILE AUTHORING ONLY.',
    'NOT APPLIED IN TASK 715.',
    'APPLY OR DRY-RUN REQUIRES A SEPARATE TASK.',
    'NO DB CONNECTION, PSQL, OR SQL EXECUTION IS AUTHORIZED BY THIS FILE.',
    'DO NOT RUN AGAINST SHARED RUNTIME WITHOUT EXPLICIT APPLY TASK.',
    'DO NOT RUN AGAINST PRODUCTION OR STAGING WITHOUT EXPLICIT APPLY TASK.',
  ]);
});

test('rollback plan exists and names the read model table', () => {
  const source = readMigration();

  assertIncludesAll(source, [
    'ROLLBACK PLAN (DOCUMENTATION ONLY; DO NOT EXECUTE FROM THIS DRAFT):',
    'Only create an executable rollback migration after a separately approved rollback task.',
    'Confirm no deployed runtime depends on engineer_mobile_task_read_models.',
    'Future rollback target: engineer_mobile_task_read_models.',
  ]);
});

test('rollback plan is documentation-only with no active destructive DDL', () => {
  const sql = uncommentedSql(readMigration());

  assert.equal(/\bDROP\b/i.test(sql), false);
  assert.equal(/\bTRUNCATE\b/i.test(sql), false);
  assert.equal(/\bDELETE\b/i.test(sql), false);
});

test('migration draft does not actively alter existing core tables', () => {
  const sql = uncommentedSql(readMigration());

  for (const table of [
    'field_service_reports',
    'appointments',
    'cases',
    'customers',
    'customer_channel_identities',
  ]) {
    assert.equal(new RegExp(`\\bALTER\\s+TABLE\\s+(IF\\s+EXISTS\\s+)?${table}\\b`, 'i').test(sql), false);
    assert.equal(new RegExp(`\\bDROP\\s+TABLE\\s+(IF\\s+EXISTS\\s+)?${table}\\b`, 'i').test(sql), false);
    assert.equal(new RegExp(`\\bCREATE\\s+TABLE\\s+(IF\\s+NOT\\s+EXISTS\\s+)?${table}\\b`, 'i').test(sql), false);
  }
});

test('migration draft remains scoped to engineer mobile read model table only', () => {
  const sql = uncommentedSql(readMigration());

  assert.match(sql, /CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+engineer_mobile_task_read_models/i);
  assert.equal(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+(?!engineer_mobile_task_read_models\b)[a-z_][a-z0-9_]*/i.test(sql), false);
});

test('migration draft includes no raw identity credentials seed data or final appointment fields', () => {
  const source = readMigration();

  for (const forbidden of [
    'raw_phone',
    'raw_address',
    'raw_line_user_id',
    'line_user_id',
    'token',
    'secret',
    'password',
    'DATABASE_URL',
    'finalAppointmentId',
    'final_appointment_id',
  ]) {
    assert.equal(source.includes(forbidden), false, `forbidden content ${forbidden}`);
  }

  assert.equal(/\bINSERT\s+INTO\b/i.test(uncommentedSql(source)), false);
  assert.equal(/postgres:\/\/|postgresql:\/\/|mysql:\/\/|mongodb:\/\//i.test(source), false);
  assert.equal(/sk-[A-Za-z0-9_-]{12,}/.test(source), false);
  assert.equal(/Bearer\s+[A-Za-z0-9._-]{12,}/i.test(source), false);
});
