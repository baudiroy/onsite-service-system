'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const migrationPath = path.join(repoRoot, 'migrations/025_create_data_correction_decision_audit_events.sql');
const task877DocPath = path.join(repoRoot, 'docs/task-877-data-correction-decision-audit-events-migration-file-no-apply-no-db.md');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function stripSqlComments(source) {
  return source
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('--'))
    .join('\n');
}

function assertIncludesAll(source, phrases) {
  for (const phrase of phrases) {
    assert.match(source, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), `missing phrase: ${phrase}`);
  }
}

function extractTableBody(sql) {
  const match = sql.match(/CREATE TABLE IF NOT EXISTS data_correction_decision_audit_events\s*\(([\s\S]*?)\n\);/i);
  assert.ok(match, 'missing data_correction_decision_audit_events create table body');
  return match[1];
}

test('Task877 migration file exists', () => {
  assert.equal(fs.existsSync(migrationPath), true);
});

test('migration creates only the approved data correction decision audit table', () => {
  const sql = read(migrationPath);
  const activeSql = stripSqlComments(sql);
  const createTableMatches = activeSql.match(/CREATE TABLE IF NOT EXISTS\s+([a-z0-9_]+)/gi) || [];

  assert.equal(createTableMatches.length, 1);
  assert.match(createTableMatches[0], /data_correction_decision_audit_events/i);
  assert.doesNotMatch(activeSql, /CREATE TABLE IF NOT EXISTS\s+(?!data_correction_decision_audit_events\b)[a-z0-9_]+/i);
});

test('migration includes only approved safe columns', () => {
  const tableBody = extractTableBody(read(migrationPath));
  const columnLines = tableBody
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('CONSTRAINT') && !line.startsWith('length(') && !line.startsWith(')'))
    .map((line) => line.replace(/,.*/, ''))
    .map((line) => line.split(/\s+/)[0]);

  assert.deepEqual(columnLines, [
    'id',
    'organization_id',
    'case_id',
    'appointment_id',
    'actor_id',
    'actor_role',
    'action',
    'field_key',
    'field_group',
    'event_type',
    'decision',
    'reason_code',
    'safe_message_key',
    'result_status',
    'request_id',
    'created_at',
    'retention_until',
    'deleted_at',
  ]);
});

test('migration includes required organization-scoped indexes', () => {
  const sql = read(migrationPath);

  [
    'idx_dc_decision_audit_events_org_created',
    'idx_dc_decision_audit_events_org_case_created',
    'idx_dc_decision_audit_events_org_actor_created',
    'idx_dc_decision_audit_events_org_event_created',
    'idx_dc_decision_audit_events_org_request',
    'idx_dc_decision_audit_events_org_retention',
    'idx_dc_decision_audit_events_org_deleted',
  ].forEach((indexName) => {
    assert.match(sql, new RegExp(`CREATE INDEX IF NOT EXISTS ${indexName}\\b`, 'i'), `missing index: ${indexName}`);
  });

  assertIncludesAll(sql, [
    'data_correction_decision_audit_events(organization_id, created_at DESC)',
    'data_correction_decision_audit_events(organization_id, case_id, created_at DESC)',
    'data_correction_decision_audit_events(organization_id, actor_id, created_at DESC)',
    'data_correction_decision_audit_events(organization_id, event_type, created_at DESC)',
    'data_correction_decision_audit_events(organization_id, request_id)',
    'data_correction_decision_audit_events(organization_id, retention_until)',
    'data_correction_decision_audit_events(organization_id, deleted_at)',
  ]);
});

test('migration documents no-apply no-DB boundary and rollback plan', () => {
  const sql = read(migrationPath);

  assertIncludesAll(sql, [
    'MIGRATION FILE AUTHORING ONLY',
    'NOT APPLIED IN TASK 877',
    'APPLY OR DRY-RUN REQUIRES A SEPARATE TASK',
    'NO DB CONNECTION, PSQL, OR SQL EXECUTION IS AUTHORIZED BY THIS FILE',
    'ROLLBACK PLAN',
    'data_correction_decision_audit_events',
    'no active DROP, TRUNCATE, DELETE, or ALTER',
  ]);
});

test('migration avoids unsafe columns and stored values', () => {
  const tableBody = extractTableBody(read(migrationPath)).toLowerCase();

  [
    'before',
    'after',
    'raw_correction_payload',
    'raw_phone',
    'raw_mobile',
    'raw_address',
    'raw_line_user_id',
    'token',
    'secret',
    'db_url',
    'stack',
    'sql_input',
    'final_appointment_id',
    'finalappointmentid',
    'field_service_report_id',
    'report_id',
    'internal_note',
    'audit_raw_payload',
    'ai_raw_payload',
    'billing_internal',
    'settlement_internal',
    'full_payload',
    'cross_organization',
    'provider_payload',
    'customer_visible_report_body',
    'photo',
    'signature',
    'file_content',
  ].forEach((forbidden) => {
    assert.equal(tableBody.includes(forbidden), false, `forbidden table token: ${forbidden}`);
  });
});

test('migration has no seed data commands no runtime execution commands and no active destructive SQL', () => {
  const sql = read(migrationPath);
  const activeSql = stripSqlComments(sql);

  assert.doesNotMatch(activeSql, /\bINSERT\b/i);
  assert.doesNotMatch(activeSql, /\bUPDATE\b/i);
  assert.doesNotMatch(activeSql, /\bDROP\b/i);
  assert.doesNotMatch(activeSql, /\bTRUNCATE\b/i);
  assert.doesNotMatch(activeSql, /\bDELETE\b/i);
  assert.doesNotMatch(activeSql, /\bALTER\b/i);
  assert.doesNotMatch(sql, /\bnpm\s+run\s+db:migrate\b/i);
  assert.doesNotMatch(sql, /\bpsql\s+[-\w]/i);
});

test('migration avoids real-looking credentials database urls and phone values', () => {
  const sql = read(migrationPath);

  [
    /postgres(?:ql)?:\/\/[^\s)]+/i,
    /mysql:\/\/[^\s)]+/i,
    /(?:^|[\s"'=])sk-[A-Za-z0-9_-]{20,}/,
    /[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
    /09\d{2}[-\s]?\d{3}[-\s]?\d{3}/,
    /Bearer\s+[A-Za-z0-9._-]+/i,
    /LINE(?:_|-)?ACCESS(?:_|-)?TOKEN\s*[:=]/i,
  ].forEach((pattern) => {
    assert.equal(pattern.test(sql), false, `unexpected sensitive-looking pattern: ${pattern}`);
  });
});

test('Task877 doc states no DB connection no DDL execution no psql no dry-run no apply', () => {
  assert.equal(fs.existsSync(task877DocPath), true);
  const doc = read(task877DocPath);

  assertIncludesAll(doc, [
    'no DB connection',
    'no DDL execution',
    'no `psql`',
    'no dry-run',
    'no apply',
    'no audit writer / sink',
    'no repository',
    'no route/controller/API change',
  ]);
});

test('static test itself imports no runtime modules', () => {
  const source = fs.readFileSync(__filename, 'utf8');
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
  const imports = [];
  let match;

  while ((match = requireRegex.exec(source)) !== null) {
    imports.push(match[1]);
  }

  assert.deepEqual(imports.sort(), [
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:test',
  ]);
});
