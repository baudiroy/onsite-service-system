'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const docsDir = path.join(repoRoot, 'docs');
const migrationsDir = path.join(repoRoot, 'migrations');
const migrationPath = path.join(migrationsDir, '025_create_data_correction_decision_audit_events.sql');
const task878DocPath = path.join(docsDir, 'task-878-data-correction-decision-audit-migration-025-disposable-db-dry-run-authorization-packet-no-db-execution.md');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function assertIncludesAll(source, phrases) {
  for (const phrase of phrases) {
    assert.match(source, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), `missing phrase: ${phrase}`);
  }
}

test('Task878 authorization packet and migration 025 exist', () => {
  assert.equal(fs.existsSync(task878DocPath), true);
  assert.equal(fs.existsSync(migrationPath), true);
});

test('authorization packet references migration 025 without authorizing modification', () => {
  const doc = read(task878DocPath);

  assertIncludesAll(doc, [
    'migrations/025_create_data_correction_decision_audit_events.sql',
    'Task878 does not modify the migration file',
    'no migration file modification',
  ]);
});

test('authorization packet keeps no DB execution boundary explicit', () => {
  const doc = read(task878DocPath);

  assertIncludesAll(doc, [
    'no DB execution',
    'no DB connection',
    'no `psql`',
    'no `npm run db:migrate`',
    'no DDL',
    'no dry-run',
    'no apply',
    'no SQL execution',
  ]);
});

test('authorization packet requires explicit disposable local test DB approval only', () => {
  const doc = read(task878DocPath);

  assertIncludesAll(doc, [
    'explicit user approval',
    'disposable local/test DB only',
    'not shared, production, staging, or Zeabur',
    'Printing or exposing `DATABASE_URL` is forbidden',
    'Printing or exposing credentials is forbidden',
  ]);
});

test('generic approval wording is not dry-run approval', () => {
  const doc = read(task878DocPath);

  assertIncludesAll(doc, [
    'Generic wording',
    'continue',
    'go ahead',
    'approved',
    'keep going',
    'I agree',
    'must not be treated as dry-run approval',
  ]);
});

test('future dry-run must keep runtime provider AI audit and business mutation disabled', () => {
  const doc = read(task878DocPath);

  assertIncludesAll(doc, [
    'Runtime traffic is disabled',
    'Provider sending is disabled',
    'LINE / SMS / App push / webhook / email delivery is disabled',
    'AI / RAG execution is disabled',
    'Audit writer / sink runtime is disabled',
    'Repository / writer runtime integration is disabled',
    'Case / Appointment / Field Service Report mutation is disabled',
    '`finalAppointmentId` mutation is disabled',
    'Correction application creation is disabled',
    'Billing / settlement behavior is disabled',
  ]);
});

test('future command boundary is limited to migration 025 only', () => {
  const doc = read(task878DocPath);

  assertIncludesAll(doc, [
    'bounded to migration 025 only',
    'run all migrations',
    'create seed data',
    'run runtime app servers against a DB',
    'create audit event rows from runtime traffic',
  ]);
});

test('stop conditions are explicit for unsafe targets logs traffic and mutations', () => {
  const doc = read(task878DocPath);

  assertIncludesAll(doc, [
    'disposable local/test DB confirmation is missing',
    'target could be shared, production, staging, or Zeabur',
    'command attempts to run more than migration 025',
    'command attempts to print or echo a DB URL',
    'command attempts to print or echo credentials',
    'command attempts to run provider traffic',
    'command attempts to send LINE / SMS / App push / webhook / email notifications',
    'command attempts to run AI / RAG',
    'command attempts to enable audit writer / sink runtime',
    'command attempts to enable repository / writer runtime',
    'command attempts to mutate Case / Appointment / Field Service Report data',
    'command attempts to mutate `finalAppointmentId`',
    'command attempts to create correction applications',
    'command attempts to touch billing / settlement behavior',
  ]);
});

test('future evidence requirements forbid sensitive output', () => {
  const doc = read(task878DocPath);

  assertIncludesAll(doc, [
    'safe summaries',
    'target classification: disposable local/test DB',
    'command class, without printing secrets or connection strings',
    'migration file name',
    'confirmation that no runtime traffic ran',
    'confirmation that no provider sending ran',
    'confirmation that no AI / RAG ran',
    'confirmation that no shared/prod/staging/Zeabur target was used',
    'must not include credentials',
    'DB URL',
    'customer data',
    'raw payloads',
    'provider payloads',
    'LINE access token',
    'channel secret',
    'AI provider config',
  ]);
});

test('authorization packet avoids real-looking database urls credentials and phone values', () => {
  const doc = read(task878DocPath);

  [
    /postgres(?:ql)?:\/\/[^\s)]+/i,
    /mysql:\/\/[^\s)]+/i,
    /(?:^|[\s"'=])sk-[A-Za-z0-9_-]{20,}/,
    /[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
    /09\d{2}[-\s]?\d{3}[-\s]?\d{3}/,
    /Bearer\s+[A-Za-z0-9._-]+/i,
    /LINE(?:_|-)?ACCESS(?:_|-)?TOKEN\s*[:=]/i,
  ].forEach((pattern) => {
    assert.equal(pattern.test(doc), false, `unexpected sensitive-looking pattern: ${pattern}`);
  });
});

test('static test itself imports no runtime modules', () => {
  const source = fs.readFileSync(__filename, 'utf8');
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
  const imports = [];
  let match;

  while ((match = requireRegex.exec(source)) !== null) {
    imports.push(match[1]);
  }

  assert.deepEqual(imports.sort(), [
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:test',
  ]);
});
