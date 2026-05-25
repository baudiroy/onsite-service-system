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

function assertIncludesAll(source, values) {
  for (const value of values) {
    assert.equal(source.includes(value), true, `missing ${value}`);
  }
}

function uncommentedSql(source) {
  return source
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('--'))
    .join('\n');
}

function columnNames(sql) {
  const tableMatch = sql.match(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+engineer_mobile_task_read_models\s*\(([\s\S]*?)\n\);/i);

  assert.ok(tableMatch, 'table body not found');

  return tableMatch[1]
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('CONSTRAINT'))
    .map((line) => line.replace(/,$/, '').split(/\s+/)[0])
    .filter((name) => /^[a-z_][a-z0-9_]*$/i.test(name));
}

test('migration draft exists', () => {
  assert.equal(fs.existsSync(migrationFile), true);
});

test('authoring-only not-applied safety comments exist', () => {
  const source = readMigration();

  assertIncludesAll(source, [
    'MIGRATION FILE AUTHORING ONLY.',
    'NOT APPLIED IN TASK 715.',
    'APPLY OR DRY-RUN REQUIRES A SEPARATE TASK.',
    'NO DB CONNECTION, PSQL, OR SQL EXECUTION IS AUTHORIZED BY THIS FILE.',
    'FUTURE DRY-RUN OR APPLY REQUIRES EXPLICIT DISPOSABLE DB AUTHORIZATION.',
    'READ MODEL SUPPORT ONLY; IT DOES NOT MUTATE CASE, APPOINTMENT, OR FIELD SERVICE REPORT DATA.',
  ]);
});

test('engineer mobile read model table exists', () => {
  const sql = uncommentedSql(readMigration());

  assert.match(sql, /CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+engineer_mobile_task_read_models/i);
});

test('all required fields are present', () => {
  const names = columnNames(uncommentedSql(readMigration()));

  for (const field of [
    'id',
    'organization_id',
    'case_id',
    'appointment_id',
    'assigned_engineer_id',
    'scheduled_start',
    'status',
    'customer_name_masked',
    'customer_phone_masked',
    'address_summary',
    'product_summary',
    'issue_summary',
    'service_summary',
    'site_note_safe',
    'checklist_summary',
    'evidence_refs',
    'created_at',
    'updated_at',
  ]) {
    assert.equal(names.includes(field), true, `missing ${field}`);
  }
});

test('organization case appointment and assigned engineer ids are present', () => {
  const sql = uncommentedSql(readMigration());

  assert.match(sql, /organization_id\s+uuid\s+NOT\s+NULL/i);
  assert.match(sql, /case_id\s+uuid\s+NOT\s+NULL/i);
  assert.match(sql, /appointment_id\s+uuid\s+NOT\s+NULL/i);
  assert.match(sql, /assigned_engineer_id\s+uuid\s+NOT\s+NULL/i);
});

test('checklist summary and evidence refs use jsonb safe metadata fields', () => {
  const sql = uncommentedSql(readMigration());

  assert.match(sql, /checklist_summary\s+jsonb/i);
  assert.match(sql, /evidence_refs\s+jsonb/i);
  assert.match(sql, /jsonb_typeof\(checklist_summary\)\s+=\s+'array'/i);
  assert.match(sql, /jsonb_typeof\(evidence_refs\)\s+=\s+'array'/i);
});

test('organization-scoped indexes are present', () => {
  const source = readMigration();

  assertIncludesAll(source, [
    'ON engineer_mobile_task_read_models(organization_id, assigned_engineer_id, scheduled_start)',
    'ON engineer_mobile_task_read_models(organization_id, assigned_engineer_id, appointment_id)',
    'ON engineer_mobile_task_read_models(organization_id, case_id)',
    'ON engineer_mobile_task_read_models(organization_id, appointment_id)',
  ]);
});

test('forbidden raw sensitive internal and final appointment columns are absent', () => {
  const names = columnNames(uncommentedSql(readMigration())).map((name) => name.toLowerCase());

  for (const forbidden of [
    'raw_phone',
    'raw_address',
    'raw_line_user_id',
    'line_user_id',
    'token',
    'secret',
    'password',
    'database_url',
    'internal_note',
    'audit_log',
    'ai_raw_payload',
    'billing_internal',
    'settlement_internal',
    'final_appointment_id',
    'field_service_report_id',
    'full_customer_payload',
  ]) {
    assert.equal(names.includes(forbidden), false, `forbidden column ${forbidden}`);
  }
});

test('migration does not alter existing core tables', () => {
  const sql = uncommentedSql(readMigration());

  for (const table of [
    'field_service_reports',
    'appointments',
    'cases',
    'customers',
    'customer_channel_identities',
  ]) {
    assert.equal(new RegExp(`ALTER\\s+TABLE\\s+(IF\\s+EXISTS\\s+)?${table}\\b`, 'i').test(sql), false);
    assert.equal(new RegExp(`CREATE\\s+TABLE\\s+(IF\\s+NOT\\s+EXISTS\\s+)?${table}\\b`, 'i').test(sql), false);
  }
});

test('migration contains no destructive DDL statements', () => {
  const sql = uncommentedSql(readMigration());

  assert.equal(/\bDROP\b/i.test(sql), false);
  assert.equal(/\bTRUNCATE\b/i.test(sql), false);
  assert.equal(/\bDELETE\b/i.test(sql), false);
});

test('migration contains no seed data', () => {
  const sql = uncommentedSql(readMigration());

  assert.equal(/\bINSERT\s+INTO\b/i.test(sql), false);
});

test('migration contains no real-looking credential or DB URL examples', () => {
  const source = readMigration();

  assert.equal(/postgres:\/\/|postgresql:\/\/|mysql:\/\/|mongodb:\/\//i.test(source), false);
  assert.equal(/sk-[A-Za-z0-9_-]{12,}/.test(source), false);
  assert.equal(/Bearer\s+[A-Za-z0-9._-]{12,}/i.test(source), false);
});

test('safety comments mention no shared production staging DB and explicit disposable authorization', () => {
  const source = readMigration();

  assertIncludesAll(source, [
    'DO NOT RUN AGAINST SHARED RUNTIME WITHOUT EXPLICIT APPLY TASK.',
    'DO NOT RUN AGAINST PRODUCTION OR STAGING WITHOUT EXPLICIT APPLY TASK.',
    'FUTURE DRY-RUN OR APPLY REQUIRES EXPLICIT DISPOSABLE DB AUTHORIZATION.',
  ]);
});
