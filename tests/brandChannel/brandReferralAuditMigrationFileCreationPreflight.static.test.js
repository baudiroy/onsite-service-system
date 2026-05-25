'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const preflightPath = 'docs/task-764-brand-referral-audit-contact-migration-file-creation-preflight-gate-no-migration-no-db.md';
const designPath = 'docs/design/brand-official-line-channel-integration.md';
const task765MigrationPath = 'migrations/024_create_brand_referral_contact_events.sql';
const task765DocPath = 'docs/task-765-brand-referral-audit-contact-events-migration-file-no-apply-no-db.md';
const priorDocs = [
  'docs/task-761-brand-referral-audit-contact-persistence-schema-proposal-no-migration-no-db.md',
  'docs/task-762-brand-referral-audit-contact-persistence-migration-authorization-packet-no-migration-no-db.md',
  'docs/task-763-brand-referral-audit-contact-migration-draft-plan-no-migration-no-db.md',
];

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

test('Task761 through Task763 evidence docs exist before preflight closure', () => {
  priorDocs.forEach(assertFileExists);
  assertFileExists(preflightPath);
});

test('Task764 preflight doc creates no migration and no DB work', () => {
  const source = read(preflightPath);

  assertContainsAll(
    source,
    [
      /Status: completed/,
      /preflight gate only/,
      /no migration/i,
      /no DB/i,
      /creates no migration file/,
      /no DDL/,
      /no psql/,
      /no DB connection/,
      /no dry-run/,
      /no apply/,
      /does not implement repository, writer, route behavior, audit\/contact persistence/,
    ],
    'Task764 no migration boundary',
  );
});

test('preflight requires explicit next migration filename and no-apply boundary', () => {
  const source = read(preflightPath);

  assertContainsAll(
    source,
    [
      /migration filename/,
      /migration number/,
      /table name/,
      /no shared DB target/,
      /no production DB target/,
      /no staging DB target/,
      /no Zeabur shared runtime DB target/,
      /no credential printing/,
      /no `DATABASE_URL` printing/,
      /The future migration-file task may create a SQL file only if it says so explicitly/,
      /Creating the SQL file must still not authorize running that SQL/,
    ],
    'Task764 next-task authorization',
  );
});

test('preflight repeats safe columns and forbidden sensitive columns', () => {
  const source = read(preflightPath);

  assertContainsAll(
    source,
    [
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
    'Task764 safe and forbidden columns',
  );
});

test('future migration acceptance checklist is explicit', () => {
  const source = read(preflightPath);

  assertContainsAll(
    source,
    [
      /`CREATE TABLE brand_referral_contact_events`/,
      /`organization_id` tenant scope/,
      /safe metadata columns only/,
      /safe indexes with `organization_id`/,
      /`retention_until` and\/or `deleted_at`/,
      /no raw sensitive data columns/,
      /rollback section/,
      /no credential printing/,
      /no `DATABASE_URL` printing/,
      /no shared, production, staging, or Zeabur shared runtime DB target/,
      /explicit no-apply wording/,
      /SQL file creation does not run DDL/,
    ],
    'Task764 acceptance checklist',
  );
});

test('preflight keeps runtime behavior forbidden', () => {
  const source = read(preflightPath);

  assertContainsAll(
    source,
    [
      /migration file creation or modification/,
      /DB schema change/,
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
      /identity verification/,
      /Case Binding/,
      /repair intake creation/,
      /provider, LINE, SMS, App push, webhook, or email runtime/,
      /AI\/RAG runtime/,
      /smoke or integration test/,
    ],
    'Task764 runtime forbidden',
  );
});

test('design document cross-references Task764 preflight gate', () => {
  const source = read(designPath);

  assertContainsAll(
    source,
    [
      /Task764 records the final preflight gate/,
      /brand_referral_contact_events/,
      /migration filename/,
      /no migration file/,
      /no DDL/,
      /no psql/,
      /no DB connection/,
      /no dry-run/,
      /no apply/,
    ],
    'Task764 design note',
  );
});

test('no Task764 migration file or unauthorized brand referral contact events migration exists', () => {
  const migrationsDir = path.join(repoRoot, 'migrations');
  const files = fs.existsSync(migrationsDir) ? fs.readdirSync(migrationsDir) : [];
  const joined = files.join('\n');

  assert.doesNotMatch(joined, /task[-_]?764/i);
  assertNoUnauthorizedBrandReferralMigration(files);

  if (files.includes(path.basename(task765MigrationPath))) {
    assertFileExists(task765DocPath);
  }
});

test('preflight docs avoid real-looking credential and database URL literals', () => {
  const sources = [preflightPath, designPath, ...priorDocs]
    .map((file) => read(file))
    .join('\n');

  [
    /postgres(?:ql)?:\/\/\S+/i,
    /mysql:\/\/\S+/i,
    /mongodb(?:\+srv)?:\/\/\S+/i,
    /(?<![A-Za-z])sk-[A-Za-z0-9_-]{20,}/,
    /xox[baprs]-[A-Za-z0-9-]{20,}/,
  ].forEach((pattern) => {
    assert.doesNotMatch(sources, pattern);
  });
});
