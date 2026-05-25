'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const planPath = 'docs/task-763-brand-referral-audit-contact-migration-draft-plan-no-migration-no-db.md';
const designPath = 'docs/design/brand-official-line-channel-integration.md';
const task765MigrationPath = 'migrations/024_create_brand_referral_contact_events.sql';
const task765DocPath = 'docs/task-765-brand-referral-audit-contact-events-migration-file-no-apply-no-db.md';

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

function assertNoUnauthorizedBrandReferralMigration(files) {
  const allowed = new Set([path.basename(task765MigrationPath)]);
  const unauthorized = files.filter((file) => /brand_referral_contact_events/i.test(file) && !allowed.has(file));

  assert.deepEqual(unauthorized, []);
}

test('Task763 draft plan exists and changes no DB or migration behavior', () => {
  assertFileExists(planPath);
  const source = read(planPath);

  assertContainsAll(
    source,
    [
      /Status: completed/,
      /migration draft plan only/,
      /no migration/i,
      /no DB/i,
      /does not create or modify any migration file/,
      /run DDL/,
      /use psql/,
      /connect to a DB/,
      /dry-run a migration/,
      /apply a migration/,
      /change runtime behavior/,
    ],
    'Task763 no migration boundary',
  );
});

test('draft plan proposes safe table columns and type direction', () => {
  const source = read(planPath);

  assertContainsAll(
    source,
    [
      /brand_referral_contact_events/,
      /`id`/,
      /`organization_id`/,
      /`brand_id`/,
      /`source_channel`/,
      /`referral_source`/,
      /`entry_context`/,
      /`line_channel_id`/,
      /`event_type`/,
      /`reason_key`/,
      /`result_status`/,
      /`request_id`/,
      /`created_at`/,
      /`retention_until`/,
      /`deleted_at`/,
      /UUID or project-standard/,
      /timestamp with timezone/,
    ],
    'Task763 safe columns',
  );
});

test('draft plan proposes organization-scoped indexes', () => {
  const source = read(planPath);

  assertContainsAll(
    source,
    [
      /`organization_id, created_at`/,
      /`organization_id, brand_id, created_at`/,
      /`organization_id, source_channel, created_at`/,
      /`organization_id, brand_id, source_channel, created_at`/,
      /`organization_id, request_id`/,
      /`organization_id, retention_until`/,
      /`organization_id, deleted_at`/,
      /All operational lookups must include `organization_id`/,
    ],
    'Task763 indexes',
  );
});

test('draft SQL is labeled as non-executable and DO NOT RUN', () => {
  const source = read(planPath);

  assertContainsAll(
    source,
    [
      /Non-executable SQL Shape/,
      /DO NOT RUN/,
      /documentation-only pseudo-SQL/,
      /CREATE TABLE brand_referral_contact_events/,
      /CREATE INDEX idx_brand_referral_contact_events_org_created/,
      /CREATE INDEX idx_brand_referral_contact_events_org_brand_created/,
      /CREATE INDEX idx_brand_referral_contact_events_org_source_created/,
      /No migration is created by Task763/,
      /must decide naming, types, defaults, foreign keys, and indexes in a separate approved task/,
    ],
    'Task763 non-executable SQL',
  );
});

test('draft plan includes rollback outline and forbidden fields', () => {
  const source = read(planPath);

  assertContainsAll(
    source,
    [
      /drop only indexes created by the approved future migration/,
      /drop only the table created by the approved future migration/,
      /avoid destructive shared-data assumptions/,
      /not run against shared, production, or staging DB without separate explicit approval/,
      /raw `line_user_id`/,
      /token/,
      /secret/,
      /LINE access token/,
      /LINE channel secret/,
      /binding token/,
      /verification code/,
      /full phone/,
      /full address/,
      /full customer name/,
      /raw provider payload/,
      /AI payload/,
      /full customer payload/,
      /credential/,
      /DB URL/,
      /stack trace/,
      /SQL input/,
      /customer case data/,
      /internal note/,
      /billing or settlement internal data/,
      /cross-organization data/,
    ],
    'Task763 rollback and forbidden fields',
  );
});

test('draft plan keeps migration separate from runtime and smoke', () => {
  const source = read(planPath);

  assertContainsAll(
    source,
    [
      /migration file creation or modification/,
      /DDL/,
      /psql/,
      /DB connection/,
      /dry-run/,
      /migration apply/,
      /repository/,
      /audit writer/,
      /contact writer/,
      /runtime persistence/,
      /route behavior change/,
      /public response body change/,
      /identity verification/,
      /Case Binding/,
      /repair intake creation/,
      /provider, LINE, SMS, App push, webhook, or email runtime/,
      /AI\/RAG runtime/,
      /smoke or integration test/,
    ],
    'Task763 non-effects',
  );
});

test('design document cross-references Task763 draft plan', () => {
  const source = read(designPath);

  assertContainsAll(
    source,
    [
      /Task763 records a migration draft plan/,
      /brand_referral_contact_events/,
      /DO NOT RUN/,
      /no migration file/,
      /no DDL/,
      /no psql/,
      /no DB connection/,
      /no dry-run/,
      /no apply/,
    ],
    'Task763 design note',
  );
});

test('no Task763 migration file or unauthorized brand referral contact events migration exists', () => {
  const migrationsDir = path.join(repoRoot, 'migrations');
  const files = fs.existsSync(migrationsDir) ? fs.readdirSync(migrationsDir) : [];
  const joined = files.join('\n');

  assert.doesNotMatch(joined, /task[-_]?763/i);
  assertNoUnauthorizedBrandReferralMigration(files);

  if (files.includes(path.basename(task765MigrationPath))) {
    assertFileExists(task765DocPath);
  }
});

test('draft plan avoids real-looking credential and database URL literals', () => {
  const source = read(planPath);

  [
    /postgres(?:ql)?:\/\/\S+/i,
    /mysql:\/\/\S+/i,
    /mongodb(?:\+srv)?:\/\/\S+/i,
    /(?<![A-Za-z])sk-[A-Za-z0-9_-]{20,}/,
    /xox[baprs]-[A-Za-z0-9-]{20,}/,
  ].forEach((pattern) => {
    assert.doesNotMatch(source, pattern);
  });
});
