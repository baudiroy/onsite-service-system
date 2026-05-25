'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const packetPath = 'docs/task-762-brand-referral-audit-contact-persistence-migration-authorization-packet-no-migration-no-db.md';
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

test('Task762 authorization packet exists and authorizes no migration or DB work', () => {
  assertFileExists(packetPath);
  const source = read(packetPath);

  assertContainsAll(
    source,
    [
      /Status: completed/,
      /authorization packet only/,
      /no migration/i,
      /no DB/i,
      /authorizes no migration creation/,
      /no DDL/,
      /no psql/,
      /no DB connection/,
      /no dry-run/,
      /no apply/,
      /does not create a migration file/,
      /does not run a migration/,
      /does not connect to any database/,
    ],
    'Task762 no migration boundary',
  );
});

test('packet references Task761 concept and safe fields only', () => {
  const source = read(packetPath);

  assertContainsAll(
    source,
    [
      /Task761/,
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
    ],
    'Task762 safe migration target',
  );
});

test('packet lists future approvals before migration creation', () => {
  const source = read(packetPath);

  assertContainsAll(
    source,
    [
      /migration filename and number/,
      /DDL review/,
      /rollback plan/,
      /disposable local\/test DB dry-run approval/,
      /no shared, production, or staging DB/,
      /credentials and `DATABASE_URL` are never printed/,
      /runtime traffic is disabled/,
      /provider sending is disabled/,
      /AI\/RAG is disabled/,
      /audit\/contact writer runtime is disabled/,
      /must not be treated as migration creation, DDL, dry-run, apply, or DB access approval/,
    ],
    'Task762 future approvals',
  );
});

test('packet includes dry-run and rollback guards', () => {
  const source = read(packetPath);

  assertContainsAll(
    source,
    [
      /disposable local\/test DB/,
      /no Zeabur shared runtime DB/,
      /no `npm run db:migrate` unless explicitly authorized/,
      /no psql unless explicitly authorized/,
      /`DATABASE_URL` must never be printed/,
      /If a future dry-run cannot prove the target is disposable local\/test, it must stop before any DB command/,
      /drop only objects created by the approved migration/,
      /avoid destructive shared-data assumptions/,
      /not run against shared, production, or staging DB without separate explicit approval/,
      /avoid touching unrelated tables or indexes/,
      /Rollback approval is separate/,
    ],
    'Task762 dry-run rollback guard',
  );
});

test('packet forbids unsafe columns and values', () => {
  const source = read(packetPath);

  assertContainsAll(
    source,
    [
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
      /SQL/,
      /customer case data/,
      /internal note/,
      /billing or settlement internal data/,
      /cross-organization data/,
    ],
    'Task762 forbidden columns',
  );
});

test('packet keeps migration separate from runtime authorization', () => {
  const source = read(packetPath);

  assertContainsAll(
    source,
    [
      /Future migration authorization must not be confused with runtime authorization/,
      /repository/,
      /audit writer/,
      /contact writer/,
      /transaction boundary/,
      /route injection/,
      /public route behavior/,
      /permission runtime/,
      /identity verification/,
      /Case Binding/,
      /repair intake creation/,
      /provider integration/,
      /AI\/RAG integration/,
      /smoke or integration testing/,
    ],
    'Task762 runtime separation',
  );
});

test('design document cross-references Task762 authorization packet', () => {
  const source = read(designPath);

  assertContainsAll(
    source,
    [
      /Task762 records the migration authorization packet/,
      /no migration file/,
      /no DDL/,
      /no psql/,
      /no DB connection/,
      /no dry-run/,
      /no apply/,
      /brand_referral_contact_events/,
    ],
    'Task762 design note',
  );
});

test('no Task762 migration file or unauthorized brand referral contact events migration exists', () => {
  const migrationsDir = path.join(repoRoot, 'migrations');
  const files = fs.existsSync(migrationsDir) ? fs.readdirSync(migrationsDir) : [];
  const joined = files.join('\n');

  assert.doesNotMatch(joined, /task[-_]?762/i);
  assertNoUnauthorizedBrandReferralMigration(files);

  if (files.includes(path.basename(task765MigrationPath))) {
    assertFileExists(task765DocPath);
  }
});

test('packet avoids real-looking credential and database URL literals', () => {
  const source = read(packetPath);

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
