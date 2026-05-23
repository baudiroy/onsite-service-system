'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const migrationPath = path.join(
  repoRoot,
  'migrations/021_create_data_correction_persistence_schema.sql',
);

const TABLES = Object.freeze([
  'data_correction_audit_events',
  'data_correction_contact_logs',
  'data_correction_dispatch_notes',
  'data_correction_engineer_notification_intents',
  'data_correction_appointment_results',
  'data_correction_evidence_refs',
  'data_correction_follow_up_drafts',
  'data_correction_application_records',
]);

const REQUIRED_FIELDS = Object.freeze([
  'id',
  'organization_id',
  'case_id',
  'appointment_id',
  'actor_user_id',
  'actor_role',
  'action_type',
  'decision',
  'reason_code',
  'safe_message_key',
  'safe_metadata',
  'created_at',
]);

const FORBIDDEN_COLUMNS = Object.freeze([
  'phone',
  'raw_phone',
  'address',
  'raw_address',
  'line_user_id',
  'raw_line',
  'token',
  'secret',
  'password',
  'database_url',
  'from_value',
  'to_value',
  'ai_raw',
  'request_body',
  'response_body',
  'final_appointment_id',
  'field_service_report_id',
]);

const CORE_TABLES = Object.freeze([
  'field_service_reports',
  'appointments',
  'cases',
  'customers',
  'customer_channel_identities',
]);

function readMigration() {
  return fs.readFileSync(migrationPath, 'utf8');
}

function tableBody(source, tableName) {
  const match = source.match(new RegExp(
    `CREATE TABLE IF NOT EXISTS ${tableName} \\(([\\s\\S]*?)\\);`,
    'i',
  ));

  assert.ok(match, `missing create table body for ${tableName}`);
  return match[1];
}

function assertIncludesAll(source, values) {
  for (const value of values) {
    assert.equal(source.includes(value), true, `missing ${value}`);
  }
}

test('migration draft exists', () => {
  assert.equal(fs.existsSync(migrationPath), true);
});

test('all 8 data correction tables are created', () => {
  const source = readMigration();

  for (const table of TABLES) {
    assert.match(source, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`, 'i'));
  }
});

test('every table includes required common fields and organization scope', () => {
  const source = readMigration();

  for (const table of TABLES) {
    const body = tableBody(source, table);

    for (const field of REQUIRED_FIELDS) {
      assert.match(body, new RegExp(`\\b${field}\\b`, 'i'), `${table} missing ${field}`);
    }

    assert.match(body, /\borganization_id uuid NOT NULL\b/i, `${table} organization_id must be NOT NULL`);
    assert.match(body, /\bcase_id uuid NOT NULL\b/i, `${table} case_id must be NOT NULL`);
    assert.match(body, /\bsafe_metadata jsonb\b/i, `${table} safe_metadata must be jsonb`);
    assert.match(body, /\bcreated_at timestamptz NOT NULL DEFAULT now\(\)/i, `${table} created_at default missing`);
  }
});

test('indexes include organization scoped case appointment action and created_at indexes', () => {
  const source = readMigration();

  for (const table of TABLES) {
    assert.match(source, new RegExp(`ON ${table}\\(organization_id, case_id, created_at DESC\\)`, 'i'));
    assert.match(source, new RegExp(`ON ${table}\\(organization_id, appointment_id\\)`, 'i'));
    assert.match(source, new RegExp(`ON ${table}\\(organization_id, action_type, created_at DESC\\)`, 'i'));
    assert.match(source, new RegExp(`ON ${table}\\(organization_id, created_at DESC\\)`, 'i'));
  }
});

test('migration does not define forbidden raw or sensitive columns', () => {
  const source = readMigration();

  for (const table of TABLES) {
    const body = tableBody(source, table);

    for (const column of FORBIDDEN_COLUMNS) {
      assert.doesNotMatch(body, new RegExp(`(^|\\n)\\s*${column}\\s+`, 'i'), `${table} contains forbidden ${column}`);
    }
  }
});

test('migration does not alter existing core tables', () => {
  const source = readMigration();

  for (const table of CORE_TABLES) {
    assert.doesNotMatch(source, new RegExp(`ALTER TABLE\\\\s+${table}`, 'i'));
    assert.doesNotMatch(source, new RegExp(`CREATE TABLE IF NOT EXISTS\\\\s+${table}`, 'i'));
  }
});

test('migration does not contain destructive DDL or seed inserts', () => {
  const source = readMigration();

  assert.doesNotMatch(source, /\bDROP\s+TABLE\b/i);
  assert.doesNotMatch(source, /\bTRUNCATE\b/i);
  assert.doesNotMatch(source, /\bDELETE\s+FROM\b/i);
  assert.doesNotMatch(source, /\bINSERT\s+INTO\b/i);
});

test('migration avoids real-looking credential or DB URL examples', () => {
  const source = readMigration();

  assert.doesNotMatch(source, /postgres:\/\/|postgresql:\/\/|mysql:\/\//i);
  assert.doesNotMatch(source, /\bDATABASE_URL\s*=/);
  assert.doesNotMatch(source, /\bLINE_CHANNEL_ACCESS_TOKEN\s*=/);
  assert.doesNotMatch(source, /\bLINE_CHANNEL_SECRET\s*=/);
  assert.doesNotMatch(source, /\bBearer\s+[A-Za-z0-9._-]+/);
  assert.doesNotMatch(source, /\bsk-[A-Za-z0-9]{12,}/);
});

test('migration includes authoring-only and no raw storage comments', () => {
  const source = readMigration();

  assertIncludesAll(source, [
    'MIGRATION FILE AUTHORING ONLY',
    'NOT APPLIED IN TASK 682',
    'APPLY OR DRY-RUN REQUIRES A SEPARATE TASK',
    'NO DB CONNECTION, PSQL, OR SQL EXECUTION IS AUTHORIZED BY THIS FILE',
    'NO RAW PHONE/ADDRESS/LINE/FINAL APPOINTMENT VALUES ARE STORED BY THIS DRAFT',
  ]);
});
