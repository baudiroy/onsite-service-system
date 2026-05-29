'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const MIGRATION_FILE = 'migrations/027_create_customer_access_audit_events.sql';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function withoutSqlComments(source) {
  return source
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('--'))
    .join('\n');
}

function escaped(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test('customer access audit migration file exists and creates only the audit table', () => {
  const source = read(MIGRATION_FILE);
  const sql = withoutSqlComments(source);
  const tableMatches = [...sql.matchAll(/\bCREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+([a-z_]+)/gi)];

  assert.equal(tableMatches.length, 1);
  assert.equal(tableMatches[0][1], 'customer_access_audit_events');
  assert.match(sql, /\bCREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+customer_access_audit_events\s*\(/i);
  assert.doesNotMatch(sql, /\bALTER\s+TABLE\s+(?!customer_access_audit_events\b)[a-z_]+/i);
});

test('customer access audit migration keeps required columns stable', () => {
  const sql = withoutSqlComments(read(MIGRATION_FILE));

  for (const column of [
    'id',
    'event_type',
    'occurred_at',
    'request_id',
    'actor_type',
    'organization_id',
    'customer_id',
    'case_id',
    'report_id',
    'decision',
    'reason_code',
    'route',
    'method',
    'source',
    'metadata_json',
    'created_at',
  ]) {
    assert.match(sql, new RegExp(`\\b${escaped(column)}\\b`), `${column} should be present`);
  }

  assert.match(sql, /\bid\s+uuid\s+PRIMARY\s+KEY\s+DEFAULT\s+gen_random_uuid\(\)/i);
  assert.match(sql, /\bmetadata_json\s+jsonb\s+NOT\s+NULL\s+DEFAULT\s+'\{\}'::jsonb/i);
  assert.match(sql, /\bcreated_at\s+timestamptz\s+NOT\s+NULL\s+DEFAULT\s+now\(\)/i);
});

test('customer access audit migration constrains safe event and decision values', () => {
  const sql = withoutSqlComments(read(MIGRATION_FILE));

  for (const eventType of [
    'customer_access.case_overview.allow',
    'customer_access.case_overview.deny',
    'customer_access.service_report.allow',
    'customer_access.service_report.deny',
    'customer_access.route_registration.success',
    'customer_access.route_registration.failure',
  ]) {
    assert.match(sql, new RegExp(escaped(eventType)), `${eventType} should be allowed`);
  }

  for (const decision of ['allow', 'deny', 'success', 'failure']) {
    assert.match(sql, new RegExp(`'${decision}'`), `${decision} should be allowed`);
  }

  assert.match(sql, /method\s*=\s*'GET'/);
  assert.match(sql, /reason_code\s+IS\s+NULL/i);
  assert.match(sql, /jsonb_typeof\(metadata_json\)\s*=\s*'object'/i);
});

test('customer access audit migration keeps required indexes stable', () => {
  const sql = withoutSqlComments(read(MIGRATION_FILE));

  for (const indexName of [
    'idx_customer_access_audit_events_org_created',
    'idx_customer_access_audit_events_org_case_created',
    'idx_customer_access_audit_events_org_report_created',
    'idx_customer_access_audit_events_event_created',
    'idx_customer_access_audit_events_org_request',
    'idx_customer_access_audit_events_created',
  ]) {
    assert.match(sql, new RegExp(`\\bCREATE\\s+INDEX\\s+IF\\s+NOT\\s+EXISTS\\s+${escaped(indexName)}\\b`, 'i'));
  }
});

test('customer access audit migration excludes raw sensitive columns and executable data operations', () => {
  const sql = withoutSqlComments(read(MIGRATION_FILE));

  for (const forbidden of [
    'raw_request',
    'raw_response',
    'headers',
    'raw_headers',
    'authorization',
    'cookies',
    'token',
    'body',
    'raw_body',
    'query',
    'params',
    'phone',
    'address',
    'email',
    'line_user_id',
    'provider_payload',
    'raw_payload',
    'ai_prompt',
    'ai_response',
    'debug',
    'stack',
    'sql',
    'private_report_body',
    'internal_notes',
    'engineer_notes',
    'diagnosis_notes',
    'completion_notes',
    'billing',
    'payment',
  ]) {
    assert.doesNotMatch(sql, new RegExp(`\\b${escaped(forbidden)}\\b`, 'i'), forbidden);
  }

  assert.doesNotMatch(sql, /\b(INSERT|UPDATE|DELETE|TRIGGER|FUNCTION|POLICY)\b/i);
  assert.doesNotMatch(sql, /\bDROP\s+TABLE\b/i);
  assert.doesNotMatch(sql, /\bCREATE\s+(TRIGGER|FUNCTION|POLICY)\b/i);
  assert.doesNotMatch(sql, /\bprocess\s*\.\s*env\b|PGHOST|PGUSER|PGPASSWORD|PGDATABASE|PGPORT/i);
});
