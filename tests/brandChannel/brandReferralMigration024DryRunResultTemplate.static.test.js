'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const templatePath = 'docs/task-767-brand-referral-migration-024-disposable-db-dry-run-result-template-no-db-execution.md';
const migrationPath = 'migrations/024_create_brand_referral_contact_events.sql';
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

test('Task767 dry-run result template and migration 024 exist', () => {
  assertFileExists(templatePath);
  assertFileExists(migrationPath);
});

test('template references migration 024 and authorizes no DB execution', () => {
  const source = read(templatePath);

  assertContainsAll(
    source,
    [
      /Status: completed/,
      /future dry-run result template only/,
      /migrations\/024_create_brand_referral_contact_events\.sql/,
      /does not connect to a DB/,
      /does not use psql/,
      /does not run `db:migrate`/,
      /does not run DDL/,
      /does not dry-run/,
      /does not apply/,
      /does not execute SQL/,
      /does not modify `migrations\/024_create_brand_referral_contact_events\.sql`/,
      /does not authorize dry-run execution/,
    ],
    'Task767 no DB execution boundary',
  );
});

test('template includes all required future report sections', () => {
  const source = read(templatePath);

  assertContainsAll(
    source,
    [
      /Authorization Reference/,
      /Disposable DB Target Confirmation/,
      /Migration File Integrity/,
      /Command Envelope Placeholder/,
      /Sanitized Success \/ Failure Summary/,
      /Created Objects Checklist/,
      /Index Checklist/,
      /Rollback Readiness/,
      /Stop Conditions Review/,
      /Sensitive-output Review/,
    ],
    'Task767 template sections',
  );
});

test('template requires authorization target and disabled runtime reporting', () => {
  const source = read(templatePath);

  assertContainsAll(
    source,
    [
      /Authorization task id/,
      /Approved migration file/,
      /Approved command/,
      /disposable local\/test DB only/,
      /not shared, production, staging, or Zeabur shared runtime/,
      /no real customer data/,
      /`DATABASE_URL` and credentials were not printed/,
      /Runtime traffic disabled/,
      /Provider sending disabled/,
      /LINE\/SMS\/App push\/webhook\/email sending disabled/,
      /AI\/RAG disabled/,
      /Audit\/contact writer disabled/,
      /Identity verification disabled/,
      /Case Binding disabled/,
      /Repair intake and Case creation disabled/,
    ],
    'Task767 authorization and disabled runtime reporting',
  );
});

test('template checks created objects and indexes without unsafe fields', () => {
  const source = read(templatePath);

  assertContainsAll(
    source,
    [
      /`brand_referral_contact_events` table/,
      /`id` column/,
      /`organization_id` column/,
      /`brand_id` column/,
      /`source_channel` column/,
      /`referral_source` column/,
      /`entry_context` column/,
      /`line_channel_id` column/,
      /`event_type` column/,
      /`reason_key` column/,
      /`result_status` column/,
      /`request_id` column/,
      /`created_at` column/,
      /`retention_until` column/,
      /`deleted_at` column/,
      /`organization_id, created_at` index/,
      /`organization_id, brand_id, created_at` index/,
      /`organization_id, source_channel, created_at` index/,
      /`organization_id, request_id` index/,
      /`organization_id, retention_until` index/,
      /`organization_id, deleted_at` index/,
      /No cross-organization lookup index/,
      /No index on raw sensitive values/,
    ],
    'Task767 created object checks',
  );
});

test('template includes stop conditions and sensitive output rules', () => {
  const source = read(templatePath);

  assertContainsAll(
    source,
    [
      /missing disposable local\/test DB confirmation/,
      /unexpected migration target/,
      /command tries to run more than migration 024/,
      /unsafe logs/,
      /credential printing/,
      /`DATABASE_URL` printing/,
      /token or secret output/,
      /provider traffic/,
      /LINE\/SMS\/App push\/webhook\/email sending/,
      /AI\/RAG runtime/,
      /audit\/contact writer runtime/,
      /identity verification runtime/,
      /Case Binding runtime/,
      /repair intake or Case creation runtime/,
      /shared, production, staging, or Zeabur target/,
      /SQL logs with secrets/,
      /full runtime payloads/,
      /stopped, redacted, and re-reported/,
    ],
    'Task767 stop and sensitive-output rules',
  );
});

test('template keeps runtime provider AI audit and contact behavior forbidden', () => {
  const source = read(templatePath);

  assertContainsAll(
    source,
    [
      /DB connection/,
      /psql/,
      /`db:migrate`/,
      /DDL execution/,
      /dry-run/,
      /apply/,
      /SQL execution/,
      /migration file modification/,
      /repository/,
      /audit writer/,
      /contact writer/,
      /runtime persistence/,
      /route behavior change/,
      /permission runtime/,
      /entitlement runtime/,
      /identity verification/,
      /Case Binding/,
      /repair intake creation/,
      /provider, LINE, SMS, App push, webhook, or email runtime/,
      /AI\/RAG runtime/,
    ],
    'Task767 runtime forbidden',
  );
});

test('migration 024 remains no-apply and unchanged by Task767 marker', () => {
  const source = read(migrationPath);

  assertContainsAll(
    source,
    [
      /MIGRATION FILE AUTHORING ONLY/,
      /NOT APPLIED IN TASK 765/,
      /APPLY OR DRY-RUN REQUIRES A SEPARATE TASK/,
      /NO DB CONNECTION, PSQL, OR SQL EXECUTION IS AUTHORIZED BY THIS FILE/,
    ],
    'migration 024 no-apply header',
  );

  assert.doesNotMatch(source, /Task767/);
});

test('design document cross-references Task767 without promoting dry-run execution', () => {
  const source = read(designPath);

  assertContainsAll(
    source,
    [
      /Task767 adds a redacted disposable DB dry-run result template/,
      /migrations\/024_create_brand_referral_contact_events\.sql/,
      /no DB execution/,
      /no psql/,
      /no `db:migrate`/,
      /no DDL/,
      /no dry-run/,
      /no apply/,
      /no SQL execution/,
    ],
    'Task767 design note',
  );
});

test('Task767 touched docs avoid real-looking credential and database URL literals', () => {
  const source = [templatePath, designPath].map((file) => read(file)).join('\n');

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
