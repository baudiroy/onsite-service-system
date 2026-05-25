'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const migrationPath = 'migrations/024_create_brand_referral_contact_events.sql';
const taskDocPath = 'docs/task-765-brand-referral-audit-contact-events-migration-file-no-apply-no-db.md';
const designPath = 'docs/design/brand-official-line-channel-integration.md';

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function assertFileExists(relativePath) {
  assert.ok(fs.existsSync(path.join(repoRoot, relativePath)), `${relativePath} should exist`);
}

function assertContainsAll(source, patterns, label) {
  for (const pattern of patterns) {
    assert.match(source, pattern, `${label} is missing ${pattern}`);
  }
}

test('Task765 migration file and task doc exist', () => {
  assertFileExists(migrationPath);
  assertFileExists(taskDocPath);
});

test('migration file is authoring only and no apply no DB', () => {
  const source = read(migrationPath);

  assertContainsAll(
    source,
    [
      /MIGRATION FILE AUTHORING ONLY/,
      /NOT APPLIED IN TASK 765/,
      /APPLY OR DRY-RUN REQUIRES A SEPARATE TASK/,
      /DO NOT RUN AGAINST SHARED RUNTIME WITHOUT EXPLICIT APPLY TASK/,
      /DO NOT RUN AGAINST PRODUCTION OR STAGING WITHOUT EXPLICIT APPLY TASK/,
      /NO DB CONNECTION, PSQL, OR SQL EXECUTION IS AUTHORIZED BY THIS FILE/,
      /TABLE IS INTENDED TO BE INERT UNTIL A FUTURE RUNTIME TASK/,
    ],
    'Task765 migration header',
  );
});

test('migration creates only brand_referral_contact_events with safe columns', () => {
  const source = read(migrationPath);

  assert.match(source, /CREATE TABLE IF NOT EXISTS brand_referral_contact_events/);
  assert.doesNotMatch(source, /CREATE TABLE IF NOT EXISTS (?!brand_referral_contact_events\b)/);

  assertContainsAll(
    source,
    [
      /id uuid PRIMARY KEY DEFAULT gen_random_uuid\(\)/,
      /organization_id uuid NOT NULL/,
      /brand_id uuid/,
      /source_channel text/,
      /referral_source text/,
      /entry_context text/,
      /line_channel_id text/,
      /event_type text NOT NULL/,
      /reason_key text/,
      /result_status text NOT NULL/,
      /request_id text/,
      /created_at timestamptz NOT NULL DEFAULT now\(\)/,
      /retention_until timestamptz/,
      /deleted_at timestamptz/,
      /event_type_not_blank_check/,
      /result_status_not_blank_check/,
    ],
    'Task765 migration safe columns',
  );
});

test('migration has organization-scoped indexes only', () => {
  const source = read(migrationPath);

  assertContainsAll(
    source,
    [
      /idx_br_contact_events_org_created/,
      /ON brand_referral_contact_events\(organization_id, created_at DESC\)/,
      /idx_br_contact_events_org_brand_created/,
      /ON brand_referral_contact_events\(organization_id, brand_id, created_at DESC\)/,
      /idx_br_contact_events_org_source_created/,
      /ON brand_referral_contact_events\(organization_id, source_channel, created_at DESC\)/,
      /idx_br_contact_events_org_request/,
      /ON brand_referral_contact_events\(organization_id, request_id\)/,
      /idx_br_contact_events_org_retention/,
      /ON brand_referral_contact_events\(organization_id, retention_until\)/,
      /idx_br_contact_events_org_deleted/,
      /ON brand_referral_contact_events\(organization_id, deleted_at\)/,
    ],
    'Task765 indexes',
  );
});

test('migration has rollback comments but no active destructive statements outside comments', () => {
  const source = read(migrationPath);
  const uncommented = source
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('--'))
    .join('\n');

  assertContainsAll(source, [/ROLLBACK PLAN/, /Future rollback target: brand_referral_contact_events/], 'rollback comments');
  assert.doesNotMatch(uncommented, /\bDROP\b/i);
  assert.doesNotMatch(uncommented, /\bTRUNCATE\b/i);
  assert.doesNotMatch(uncommented, /\bDELETE\b/i);
  assert.doesNotMatch(uncommented, /\bALTER\b/i);
});

test('migration excludes unsafe columns values seed data and runtime execution text', () => {
  const source = read(migrationPath);

  [
    /line_user_id/i,
    /token/i,
    /secret/i,
    /access_token/i,
    /channel_secret/i,
    /binding_token/i,
    /verification_code/i,
    /phone/i,
    /address/i,
    /customer_name/i,
    /provider_payload/i,
    /ai_payload/i,
    /customer_payload/i,
    /credential/i,
    /database_url/i,
    /stack/i,
    /sql_input/i,
    /case_data/i,
    /internal_note/i,
    /billing/i,
    /settlement/i,
    /cross_organization/i,
    /\bINSERT\b/i,
    /\bpsql\b(?!, OR SQL EXECUTION IS AUTHORIZED BY THIS FILE)/i,
    /db:migrate/i,
    /postgres(?:ql)?:\/\/\S+/i,
    /mysql:\/\/\S+/i,
    /mongodb(?:\+srv)?:\/\/\S+/i,
    /(?<![A-Za-z])sk-[A-Za-z0-9_-]{20,}/,
    /xox[baprs]-[A-Za-z0-9-]{20,}/,
  ].forEach((pattern) => {
    assert.doesNotMatch(source, pattern);
  });
});

test('Task765 document records no DB execution and no runtime behavior', () => {
  const source = read(taskDocPath);

  assertContainsAll(
    source,
    [
      /Status: completed/,
      /migration file authoring only/,
      /no apply/i,
      /no DB/i,
      /does not run DB commands/,
      /does not use psql/,
      /does not dry-run/,
      /does not apply/,
      /does not connect to a DB/,
      /does not implement repository, writer, route behavior, audit\/contact persistence/,
      /Future dry-run or apply requires separate explicit disposable local\/test DB approval/,
    ],
    'Task765 doc no apply',
  );
});

test('design document cross-references Task765 no-apply migration file', () => {
  const source = read(designPath);

  assertContainsAll(
    source,
    [
      /Task765 creates the no-apply migration file/,
      /migrations\/024_create_brand_referral_contact_events\.sql/,
      /brand_referral_contact_events/,
      /no DB connection/,
      /no DDL execution/,
      /no psql/,
      /no dry-run/,
      /no apply/,
      /no repository or writer/,
    ],
    'Task765 design note',
  );
});
