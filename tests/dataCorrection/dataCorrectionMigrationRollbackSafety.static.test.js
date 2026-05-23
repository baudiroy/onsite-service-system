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

const TABLES_IN_CREATE_ORDER = Object.freeze([
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
  'record_type',
  'occurred_at',
  'created_at',
]);

const CORE_TABLES = Object.freeze([
  'field_service_reports',
  'appointments',
  'cases',
  'customers',
  'customer_channel_identities',
]);

const FORBIDDEN_COLUMNS = Object.freeze([
  'raw_phone',
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

function rollbackPlanSection(source) {
  const marker = '-- ROLLBACK PLAN DOCUMENTATION ONLY.';
  const markerIndex = source.indexOf(marker);

  assert.notEqual(markerIndex, -1, 'rollback plan marker missing');
  return source.slice(markerIndex);
}

function stripSqlComments(source) {
  return source
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('--'))
    .join('\n');
}

test('migration rollback safety target exists', () => {
  assert.equal(fs.existsSync(migrationPath), true);
});

test('authoring-only and no shared DB safety comments exist', () => {
  const source = readMigration();

  for (const phrase of [
    'MIGRATION FILE AUTHORING ONLY',
    'NOT APPLIED IN TASK 682',
    'APPLY OR DRY-RUN REQUIRES A SEPARATE TASK',
    'NO DB CONNECTION, PSQL, OR SQL EXECUTION IS AUTHORIZED BY THIS FILE',
    'ROLLBACK PLAN DOCUMENTATION ONLY',
    'DO NOT APPLY OR DRY-RUN WITHOUT A SEPARATE EXPLICIT DISPOSABLE DB TASK',
    'SHARED RUNTIME / PRODUCTION ROLLBACK IS NOT AUTHORIZED BY THIS DRAFT',
  ]) {
    assert.equal(source.includes(phrase), true, `missing safety phrase: ${phrase}`);
  }
});

test('rollback plan lists all tables in reverse create order', () => {
  const plan = rollbackPlanSection(readMigration());
  const expectedReverse = [...TABLES_IN_CREATE_ORDER].reverse();
  let previousIndex = -1;

  for (const tableName of expectedReverse) {
    const index = plan.indexOf(tableName);

    assert.notEqual(index, -1, `${tableName} missing from rollback plan`);
    assert.ok(index > previousIndex, `${tableName} is out of rollback order`);
    previousIndex = index;
  }
});

test('no active destructive DDL or seed data exists', () => {
  const activeSql = stripSqlComments(readMigration());

  assert.doesNotMatch(activeSql, /\bDROP\s+TABLE\b/i);
  assert.doesNotMatch(activeSql, /\bTRUNCATE\b/i);
  assert.doesNotMatch(activeSql, /\bDELETE\s+FROM\b/i);
  assert.doesNotMatch(activeSql, /\bINSERT\s+INTO\b/i);
});

test('no core tables are altered or recreated', () => {
  const activeSql = stripSqlComments(readMigration());

  for (const tableName of CORE_TABLES) {
    assert.doesNotMatch(activeSql, new RegExp(`\\bALTER\\s+TABLE\\s+${tableName}\\b`, 'i'));
    assert.doesNotMatch(activeSql, new RegExp(`\\bCREATE\\s+TABLE\\s+IF\\s+NOT\\s+EXISTS\\s+${tableName}\\b`, 'i'));
  }
});

test('all tables include record_type occurred_at and created_at', () => {
  const source = readMigration();

  for (const tableName of TABLES_IN_CREATE_ORDER) {
    const body = tableBody(source, tableName);

    for (const fieldName of REQUIRED_FIELDS) {
      assert.match(body, new RegExp(`\\b${fieldName}\\b`, 'i'), `${tableName} missing ${fieldName}`);
    }
  }
});

test('no forbidden sensitive columns are defined', () => {
  const source = readMigration();

  for (const tableName of TABLES_IN_CREATE_ORDER) {
    const body = tableBody(source, tableName);

    for (const columnName of FORBIDDEN_COLUMNS) {
      assert.doesNotMatch(body, new RegExp(`(^|\\n)\\s*${columnName}\\s+`, 'i'), `${tableName} contains ${columnName}`);
    }
  }
});

test('no real-looking credentials or database URLs are embedded', () => {
  const source = readMigration();

  assert.doesNotMatch(source, /postgres:\/\/|postgresql:\/\/|mysql:\/\//i);
  assert.doesNotMatch(source, /\bDATABASE_URL\s*=/);
  assert.doesNotMatch(source, /\bLINE_CHANNEL_ACCESS_TOKEN\s*=/);
  assert.doesNotMatch(source, /\bLINE_CHANNEL_SECRET\s*=/);
  assert.doesNotMatch(source, /\bBearer\s+[A-Za-z0-9._-]+/);
  assert.doesNotMatch(source, /\bsk-[A-Za-z0-9]{12,}/);
});
