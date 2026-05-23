'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const packetPath = path.join(
  repoRoot,
  'docs/task-685-data-correction-migration-disposable-db-dry-run-authorization-packet-no-db-execution.md',
);

function readPacket() {
  return fs.readFileSync(packetPath, 'utf8');
}

function assertIncludesAll(source, values) {
  for (const value of values) {
    assert.equal(source.includes(value), true, `missing ${value}`);
  }
}

test('authorization packet exists', () => {
  assert.equal(fs.existsSync(packetPath), true);
});

test('status says no DB execution and no migration dry-run', () => {
  const source = readPacket();

  assertIncludesAll(source, [
    'Status: authorization packet only / no DB execution / no migration dry-run.',
    'does not authorize a database connection',
    'does not authorize a database connection, SQL execution, migration apply, migration dry-run',
  ]);
});

test('migration 021 path is referenced without authorizing execution', () => {
  const source = readPacket();

  assertIncludesAll(source, [
    'migrations/021_create_data_correction_persistence_schema.sql',
    'authoring-only',
    'remains unapplied',
  ]);
});

test('future dry-run requires disposable local or test database only', () => {
  const source = readPacket();

  assertIncludesAll(source, [
    'target is disposable local/test DB only',
    'target is not shared Zeabur, production, staging, or any shared runtime DB',
    'DB URL and credentials must not be printed',
    'migration dry-run command is explicitly listed',
    'rollback / destroy DB policy is accepted for the disposable target',
    'no provider sending',
    'no browser smoke',
    'no runtime traffic',
    'no customer data',
    'no real token, secret, LINE credential, provider credential, or AI provider credential',
  ]);
});

test('generic phrases are explicitly not authorization', () => {
  const source = readPacket();

  assertIncludesAll(source, [
    'Generic Phrases Are Not Authorization',
    'continue',
    'go ahead',
    '可以',
    '繼續',
    '下一步',
    '請繼續',
    '請給下一個 task',
  ]);
});

test('forbidden commands are listed for current task', () => {
  const source = readPacket();

  assertIncludesAll(source, [
    'npm run db:migrate',
    'psql',
    '任何 DB connection',
    '任何 migration apply',
    '任何 migration dry-run',
    '任何 SQL execution',
  ]);
});

test('future command shape is marked example only and not authorized', () => {
  const source = readPacket();

  assertIncludesAll(source, [
    'DATABASE_URL=<disposable-local-test-db-url> npm run db:migrate -- --dry-run',
    'example only in Task685',
    'never print `DATABASE_URL`',
    'not authorized by Task685',
    'only a future explicit disposable local/test DB dry-run task may authorize execution',
  ]);
});

test('stop conditions cover unsafe targets output and runtime starts', () => {
  const source = readPacket();

  assertIncludesAll(source, [
    'shared, production, staging, Zeabur, or shared runtime DB',
    'command would apply instead of dry-run',
    'output includes secrets, credentials, tokens, or raw sensitive values',
    'migration attempts to alter core tables',
    'any provider sending would occur',
    'any app runtime, browser smoke, or customer-facing traffic would start',
  ]);
});

test('packet contains no real-looking DB URL token or secret examples', () => {
  const source = readPacket();

  assert.doesNotMatch(source, /postgres:\/\/|postgresql:\/\/|mysql:\/\//i);
  assert.doesNotMatch(source, /\bDATABASE_URL\s*=\s*[^<\s]/);
  assert.doesNotMatch(source, /\bLINE_CHANNEL_ACCESS_TOKEN\s*=/);
  assert.doesNotMatch(source, /\bLINE_CHANNEL_SECRET\s*=/);
  assert.doesNotMatch(source, /\bBearer\s+[A-Za-z0-9._-]+/);
  assert.doesNotMatch(source, /\bsk-[A-Za-z0-9]{12,}/);
});

test('packet does not instruct command execution now', () => {
  const source = readPacket();

  assert.doesNotMatch(source, /\bexecute\s+now\b/i);
  assert.doesNotMatch(source, /\brun\s+now\b/i);
  assert.doesNotMatch(source, /現在執行/);
  assert.doesNotMatch(source, /立即執行/);
});
