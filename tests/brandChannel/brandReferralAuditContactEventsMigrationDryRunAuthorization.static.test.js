'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const packetPath =
  'docs/task-766-brand-referral-audit-contact-events-migration-024-disposable-db-dry-run-authorization-packet-no-db-execution.md';
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

test('Task766 dry-run authorization packet and migration 024 exist', () => {
  assertFileExists(packetPath);
  assertFileExists(migrationPath);
});

test('packet references migration 024 without authorizing DB execution', () => {
  const source = read(packetPath);

  assertContainsAll(
    source,
    [
      /Status: completed/,
      /dry-run authorization packet only/,
      /migrations\/024_create_brand_referral_contact_events\.sql/,
      /does not connect to a DB/,
      /does not use psql/,
      /does not run `db:migrate`/,
      /does not run DDL/,
      /does not dry-run/,
      /does not apply/,
      /does not execute SQL/,
      /does not modify `migrations\/024_create_brand_referral_contact_events\.sql`/,
    ],
    'Task766 no DB execution boundary',
  );
});

test('packet requires explicit disposable local test DB approval', () => {
  const source = read(packetPath);

  assertContainsAll(
    source,
    [
      /exact migration file/,
      /exact command to run/,
      /disposable local\/test DB only/,
      /not shared, production, staging, or Zeabur shared runtime/,
      /no real customer data/,
      /`DATABASE_URL` and credentials will not be printed/,
      /runtime traffic is disabled/,
      /provider sending is disabled/,
      /LINE, SMS, App push, webhook, and email sending are disabled/,
      /AI\/RAG is disabled/,
      /audit\/contact writer runtime is disabled/,
      /identity verification, Case Binding, repair intake, and Case creation runtime are disabled/,
    ],
    'Task766 future approval requirements',
  );
});

test('packet rejects generic approval phrases as dry-run approval', () => {
  const source = read(packetPath);

  assertContainsAll(
    source,
    [
      /Generic approval phrases are not enough/,
      /continue/,
      /go ahead/,
      /do next/,
      /approved/,
      /I authorize all/,
      /keep going/,
      /execute the workflow/,
      /continue runtime/,
      /must explicitly say disposable local\/test DB/,
    ],
    'Task766 generic approval guard',
  );
});

test('packet includes forbidden targets and stop conditions', () => {
  const source = read(packetPath);

  assertContainsAll(
    source,
    [
      /shared DB/,
      /production DB/,
      /staging DB/,
      /Zeabur shared runtime DB/,
      /unclear ownership/,
      /production-like customer data/,
      /missing disposable local\/test DB confirmation/,
      /unexpected migration target/,
      /command tries to run more than migration 024/,
      /unsafe logs/,
      /credential printing/,
      /`DATABASE_URL` printing/,
      /provider traffic/,
      /LINE\/SMS\/App push\/webhook\/email sending/,
      /audit\/contact writer runtime/,
      /repair intake or Case creation runtime/,
    ],
    'Task766 stop conditions',
  );
});

test('packet keeps runtime provider AI audit and contact behavior forbidden', () => {
  const source = read(packetPath);

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
    'Task766 runtime forbidden',
  );
});

test('migration 024 remains a no-apply authoring-only migration file', () => {
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

  assert.doesNotMatch(source, /Task766/);
});

test('design document cross-references Task766 without promoting dry-run execution', () => {
  const source = read(designPath);

  assertContainsAll(
    source,
    [
      /Task766 records the disposable local\/test DB dry-run authorization packet/,
      /migrations\/024_create_brand_referral_contact_events\.sql/,
      /no DB execution/,
      /no psql/,
      /no `db:migrate`/,
      /no DDL/,
      /no dry-run/,
      /no apply/,
      /no SQL execution/,
    ],
    'Task766 design note',
  );
});

test('Task766 touched docs avoid real-looking credential and database URL literals', () => {
  const source = [packetPath, designPath].map((file) => read(file)).join('\n');

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
