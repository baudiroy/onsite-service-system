'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const readinessPath = 'docs/task-768-brand-referral-audit-contact-repository-writer-runtime-readiness-no-runtime-no-db.md';
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

test('Task768 readiness document exists and authorizes no runtime or DB work', () => {
  assertFileExists(readinessPath);
  const source = read(readinessPath);

  assertContainsAll(
    source,
    [
      /Status: completed/,
      /repository\/writer readiness only/,
      /no runtime/,
      /no DB/,
      /no migration apply/,
      /does not implement repository code/,
      /does not implement writer code/,
      /DB access/,
      /route wiring/,
      /audit\/contact persistence/,
      /provider integration/,
      /AI\/RAG/,
    ],
    'Task768 non-runtime boundary',
  );
});

test('readiness document defines injected synthetic DB boundary', () => {
  const source = read(readinessPath);

  assertContainsAll(
    source,
    [
      /injected synthetic `dbClient`/,
      /injected transaction object/,
      /must not import a global DB client/,
      /must not read env configuration/,
      /must not access `DATABASE_URL`/,
      /must not print credentials/,
      /safe event metadata only/,
      /in-memory fake or synthetic DB adapter/,
    ],
    'Task768 injected DB boundary',
  );
});

test('readiness document defines writer contract from safe auditIntent only', () => {
  const source = read(readinessPath);

  assertContainsAll(
    source,
    [
      /safe `auditIntent`/,
      /Task757\/758 intent side-channel/,
      /metadata, not as authorization/,
      /verify identity/,
      /bind a Case/,
      /create a Case/,
      /create repair intake/,
      /grant customer access/,
      /call LINE\/SMS\/App\/webhook\/email/,
      /call AI\/RAG/,
      /optional and injected/,
      /public route must continue to return the same safe normalization response/,
    ],
    'Task768 writer contract',
  );
});

test('readiness document lists migration 024 safe insert fields only', () => {
  const source = read(readinessPath);

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
      /must not insert any unapproved columns/,
    ],
    'Task768 safe insert fields',
  );
});

test('readiness document forbids unsafe persisted data', () => {
  const source = read(readinessPath);

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
      /provider payload/,
      /AI payload/,
      /full customer payload/,
      /credential/,
      /`DATABASE_URL`/,
      /SQL input/,
      /customer case data/,
      /internal note/,
      /billing or settlement internal data/,
      /cross-organization data/,
    ],
    'Task768 forbidden persisted data',
  );
});

test('readiness document defines fail-closed and safe route writer behavior', () => {
  const source = read(readinessPath);

  assertContainsAll(
    source,
    [
      /missing `organization_id`/,
      /unsafe or unknown `event_type`/,
      /unsafe extra fields/,
      /cross-organization context/,
      /duplicate `request_id`/,
      /DB error/,
      /transaction failure/,
      /Failure must not expose SQL text/,
      /public response body must not expose writer internals/,
      /writer failure must not reveal internals/,
      /no writer may run before organization scope, permission, and entitlement guard/,
    ],
    'Task768 fail-closed behavior',
  );
});

test('readiness document includes future runtime test plan without implementing it', () => {
  const source = read(readinessPath);

  assertContainsAll(
    source,
    [
      /writer accepts safe `auditIntent`/,
      /writer rejects missing `organization_id`/,
      /writer rejects unsafe extra fields/,
      /writer persists safe columns only with fake DB adapter/,
      /writer handles duplicate `request_id`/,
      /writer handles DB error with safe redacted error/,
      /writer is optional and route response stays unchanged when disabled/,
      /writer never creates Case, repair intake, identity verification, Case Binding, provider calls, or AI\/RAG calls/,
      /Task768 itself authorizes none of the above/,
    ],
    'Task768 future test plan',
  );
});

test('design document cross-references Task768 readiness without promoting runtime', () => {
  const source = read(designPath);

  assertContainsAll(
    source,
    [
      /Task768 records repository\/writer runtime readiness/,
      /injected synthetic DB/,
      /safe `auditIntent`/,
      /safe migration 024 columns/,
      /no repository/,
      /no writer/,
      /no DB connection/,
      /no route wiring/,
      /no audit\/contact persistence runtime/,
    ],
    'Task768 design note',
  );
});

test('Task768 touched docs avoid real-looking credential and database URL literals', () => {
  const source = [readinessPath, designPath].map((file) => read(file)).join('\n');

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
