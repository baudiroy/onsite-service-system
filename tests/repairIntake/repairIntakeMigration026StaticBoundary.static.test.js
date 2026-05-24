'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const migrationPath = path.join(repoRoot, 'migrations/026_create_repair_intake_persistence_tables.sql');

function readMigration() {
  return fs.readFileSync(migrationPath, 'utf8');
}

test('Repair Intake migration 026 proposal file exists', () => {
  assert.equal(fs.existsSync(migrationPath), true);
});

test('migration creates the expected Repair Intake persistence tables', () => {
  const source = readMigration();

  [
    'repair_intake_drafts',
    'repair_intake_draft_case_conversions',
    'repair_intake_idempotency_records',
    'repair_intake_audit_events',
  ].forEach((tableName) => {
    assert.match(source, new RegExp(`CREATE TABLE IF NOT EXISTS ${tableName}\\b`));
  });
});

test('migration includes organization and tenant isolation markers', () => {
  const source = readMigration();

  assert.match(source, /organization_id uuid NOT NULL/);
  assert.match(source, /tenant_id uuid/);
  assert.match(source, /idx_repair_intake_drafts_org_tenant_created/);
});

test('migration includes idempotency uniqueness scope', () => {
  const source = readMigration();

  assert.match(source, /CREATE UNIQUE INDEX IF NOT EXISTS idx_repair_intake_idempotency_org_tenant_operation_key/);
  assert.match(source, /organization_id,[\s\S]*COALESCE\(tenant_id,[\s\S]*operation_type,[\s\S]*idempotency_key/);
});

test('migration includes audit event structure', () => {
  const source = readMigration();

  [
    'repair_intake_audit_events',
    'event_type',
    'draft_id',
    'case_id',
    'actor_id',
    'decision',
    'outcome',
    'safe_metadata',
    'internal_only',
  ].forEach((marker) => {
    assert.equal(source.includes(marker), true, `missing audit marker ${marker}`);
  });
});

test('migration excludes unsafe sensitive and appointment markers', () => {
  const source = readMigration();

  [
    'finalAppointmentId',
    'final_appointment_id',
    'lineUserId',
    'lineAccessToken',
    'customerPhone',
    'customerName',
    'raw_credential',
    'raw_credentials',
    'DATABASE_URL',
    'postgres://',
  ].forEach((marker) => {
    assert.equal(source.includes(marker), false, `unsafe marker must stay absent: ${marker}`);
  });
});

test('migration excludes destructive SQL and execution command markers', () => {
  const source = readMigration();

  [
    'DROP TABLE',
    'TRUNCATE',
    'DELETE FROM',
    'ALTER TABLE DROP',
    'psql',
    'db:migrate',
  ].forEach((marker) => {
    assert.equal(source.includes(marker), false, `forbidden marker must stay absent: ${marker}`);
  });
});
