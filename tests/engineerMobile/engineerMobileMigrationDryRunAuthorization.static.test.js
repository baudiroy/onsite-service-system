'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const packetFile = path.join(
  repoRoot,
  'docs/task-718-engineer-mobile-migration-disposable-db-dry-run-authorization-packet-no-db-execution.md',
);

function readPacket() {
  return fs.readFileSync(packetFile, 'utf8');
}

function assertIncludesAll(source, values) {
  for (const value of values) {
    assert.equal(source.includes(value), true, `missing ${value}`);
  }
}

test('authorization packet exists', () => {
  assert.equal(fs.existsSync(packetFile), true);
});

test('status states packet only and no DB execution or dry-run', () => {
  const source = readPacket();

  assertIncludesAll(source, [
    'This is an authorization packet only.',
    'No DB execution is authorized by this task.',
    'No migration dry-run is authorized by this task.',
    'No migration apply is authorized by this task.',
    'No SQL execution is authorized by this task.',
  ]);
});

test('packet references migration 022 draft', () => {
  const source = readPacket();

  assertIncludesAll(source, [
    'migrations/022_create_engineer_mobile_read_model.sql',
    'This packet does not modify the migration file and does not execute it.',
  ]);
});

test('future dry-run requires explicit disposable local or test DB approval', () => {
  const source = readPacket();

  assertIncludesAll(source, [
    'the target is a disposable local/test DB',
    'the target DB may be destroyed after the dry-run',
    'explicitly name a disposable local/test DB',
    'explicitly allow a dry-run of migration `022`',
  ]);
});

test('shared production staging Zeabur and shared runtime DB are forbidden', () => {
  const source = readPacket();

  assertIncludesAll(source, [
    'the target is not shared runtime',
    'the target is not production',
    'the target is not staging',
    'the target is not Zeabur',
    'shared runtime DB access',
    'production DB access',
    'staging DB access',
    'Zeabur DB access',
  ]);
});

test('DB URL credentials and sensitive output must never be printed', () => {
  const source = readPacket();

  assertIncludesAll(source, [
    'no DB URL, password, token, secret, or credential may be printed',
    'no customer data, phone, address, raw LINE id, or full payload may be printed',
    'secrets or DB URL in command output',
    'customer data in command output',
  ]);
});

test('generic phrases are not authorization', () => {
  const source = readPacket();

  assertIncludesAll(source, [
    'Generic phrases are not authorization',
    'continue',
    'go ahead',
    '可以',
    '繼續',
    '下一步',
    '請繼續',
    '請給下一個 task',
  ]);
});

test('current forbidden commands and actions are listed', () => {
  const source = readPacket();

  assertIncludesAll(source, [
    '`npm run db:migrate`',
    '`psql`',
    'DB connection',
    'migration apply',
    'migration dry-run',
    'SQL execution',
  ]);
});

test('future command envelope is example-only and not authorized', () => {
  const source = readPacket();

  assertIncludesAll(source, [
    'Example-only Future Command Envelope',
    'EXAMPLE ONLY - DO NOT RUN IN TASK 718.',
    'not authorized by this task',
  ]);
});

test('stop conditions cover unsafe DB provider runtime and core table risk', () => {
  const source = readPacket();

  assertIncludesAll(source, [
    'Stop immediately',
    'shared runtime DB',
    'production DB',
    'staging DB',
    'Zeabur DB',
    'migration apply instead of dry-run',
    'core table alteration outside the approved migration target',
    'provider sending or runtime traffic',
    'AI/RAG/vector/provider traffic',
  ]);
});

test('packet contains no real-looking credential or DB URL examples', () => {
  const source = readPacket();

  assert.equal(/postgres:\/\/|postgresql:\/\/|mysql:\/\/|mongodb:\/\//i.test(source), false);
  assert.equal(/sk-[A-Za-z0-9_-]{12,}/.test(source), false);
  assert.equal(/Bearer\s+[A-Za-z0-9._-]{12,}/i.test(source), false);
});
