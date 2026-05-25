'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const templateFile = path.join(
  repoRoot,
  'docs/task-719-engineer-mobile-migration-022-disposable-db-dry-run-result-template-no-db-execution.md',
);

function readTemplate() {
  return fs.readFileSync(templateFile, 'utf8');
}

function assertIncludesAll(source, values) {
  for (const value of values) {
    assert.equal(source.includes(value), true, `missing ${value}`);
  }
}

test('dry-run result template exists', () => {
  assert.equal(fs.existsSync(templateFile), true);
});

test('document states Task719 performs no DB execution dry-run apply or psql', () => {
  const source = readTemplate();

  assertIncludesAll(source, [
    'Task 719 is a documentation-only dry-run result template.',
    'no DB execution',
    'no migration dry-run',
    'no migration apply',
    'no `psql`',
    'no DDL',
  ]);
});

test('document references migration 022 without authorizing modification', () => {
  const source = readTemplate();

  assertIncludesAll(source, [
    'migrations/022_create_engineer_mobile_read_model.sql',
    'This task does not modify that migration file.',
  ]);
});

test('template includes required future result sections', () => {
  const source = readTemplate();

  assertIncludesAll(source, [
    '### 1. Authorization Reference',
    '### 2. Target Migration',
    '### 3. Disposable DB Target Confirmation',
    '### 4. Command Envelope Placeholder',
    '### 5. Sanitized Result Summary',
    '### 6. Rollback Readiness',
    '### 7. Stop Conditions',
  ]);
});

test('template requires explicit disposable local or test DB approval before future execution', () => {
  const source = readTemplate();

  assertIncludesAll(source, [
    'separate task explicitly approves',
    'disposable local/test DB target',
    'migration `022` dry-run only',
    'Shared / production / staging / Zeabur excluded',
  ]);
});

test('generic approval wording is insufficient', () => {
  const source = readTemplate();

  assertIncludesAll(source, [
    'Generic phrases are insufficient approval',
    'continue',
    'go ahead',
    '可以',
    '繼續',
    '下一步',
    '請繼續',
    '請給下一個 task',
  ]);
});

test('stop conditions include unsafe DB runtime provider and core table risks', () => {
  const source = readTemplate();

  assertIncludesAll(source, [
    'shared runtime DB',
    'production DB',
    'staging DB',
    'Zeabur DB',
    'migration apply instead of dry-run',
    'provider sending',
    'runtime traffic',
    'core table alteration outside the target migration',
  ]);
});

test('placeholder forbids DB URLs credentials tokens passwords and secrets', () => {
  const source = readTemplate();

  assertIncludesAll(source, [
    'Do not insert DB URLs, credentials, tokens, passwords, or secrets here.',
    'Do not execute from this document.',
    'DB URL values',
    'password values',
    'token values',
    'secret values',
    'raw credential values',
  ]);
});

test('document contains no real-looking sensitive values or connection URLs', () => {
  const source = readTemplate();

  assert.equal(/postgres:\/\/|postgresql:\/\/|mysql:\/\/|mongodb:\/\//i.test(source), false);
  assert.equal(/sk-[A-Za-z0-9_-]{12,}/.test(source), false);
  assert.equal(/Bearer\s+[A-Za-z0-9._-]{12,}/i.test(source), false);
  assert.equal(/09\d{2}[-\s]?\d{3}[-\s]?\d{3}/.test(source), false);
  assert.equal(/[A-Za-z0-9_-]{24,}\.[A-Za-z0-9_-]{24,}/.test(source), false);
});
