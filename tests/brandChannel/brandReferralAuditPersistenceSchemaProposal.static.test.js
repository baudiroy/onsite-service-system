'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const proposalPath = 'docs/task-761-brand-referral-audit-contact-persistence-schema-proposal-no-migration-no-db.md';
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

test('Task761 schema proposal document exists and stays proposal-only', () => {
  assertFileExists(proposalPath);
  const source = read(proposalPath);

  assertContainsAll(
    source,
    [
      /Status: completed/,
      /schema proposal only/,
      /no migration/i,
      /no DB/i,
      /does not create a migration file/,
      /does not.*run DDL/,
      /does not.*connect to a DB/,
      /does not.*add a repository/,
      /does not.*audit writer/,
      /does not.*contact writer/,
      /does not.*runtime persistence/,
    ],
    'Task761 proposal boundary',
  );
});

test('proposal defines safe future table concept fields and storage-key mapping', () => {
  const source = read(proposalPath);

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
      /`eventType`/,
      /`reasonKey`/,
      /`resultStatus`/,
      /`createdAt`/,
      /`requestId`/,
      /map those intent keys to the future storage columns/,
    ],
    'Task761 safe fields',
  );
});

test('proposal includes organization-scoped indexes and tenant isolation', () => {
  const source = read(proposalPath);

  assertContainsAll(
    source,
    [
      /Every future row must be scoped by `organization_id`/,
      /Queries must include organization scope/,
      /`organization_id, created_at`/,
      /`organization_id, brand_id, created_at`/,
      /`organization_id, source_channel, created_at`/,
      /`organization_id, brand_id, source_channel, created_at`/,
      /`organization_id, request_id`/,
    ],
    'Task761 tenant indexes',
  );
});

test('proposal forbids raw identifiers secrets provider payloads AI payloads and case data', () => {
  const source = read(proposalPath);

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
      /internal billing or settlement data/,
      /cross-organization data/,
    ],
    'Task761 forbidden persisted values',
  );
});

test('proposal records redaction retention and non-effect boundaries', () => {
  const source = read(proposalPath);

  assertContainsAll(
    source,
    [
      /Redaction Policy/,
      /Retention and Deletion Expectations/,
      /`retention_until`/,
      /`deleted_at`/,
      /create a Case/,
      /create a repair intake draft/,
      /verify identity/,
      /bind a Case/,
      /grant customer access/,
      /call a provider/,
      /call LINE, SMS, App push, or webhook/,
      /call AI\/RAG/,
      /change customer channel identity/,
      /expose customer case data/,
      /evidence only/,
    ],
    'Task761 retention non-effects',
  );
});

test('design document cross-references Task761 without promoting runtime persistence', () => {
  const source = read(designPath);

  assertContainsAll(
    source,
    [
      /Task761 adds a schema proposal only/,
      /brand_referral_contact_events/,
      /no migration/i,
      /no DB/i,
      /no repository/,
      /no audit\/contact writer/,
      /no runtime persistence/,
    ],
    'Task761 design note',
  );
});

test('proposal avoids real-looking credential and database URL literals', () => {
  const source = read(proposalPath);

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
