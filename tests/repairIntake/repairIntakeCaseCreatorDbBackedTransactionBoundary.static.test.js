'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const SOURCE_PATH = path.resolve(
  __dirname,
  '../../src/repairIntake/repairIntakeCaseCreatorRepositoryAdapter.js',
);
const TEST_PATH = path.resolve(
  __dirname,
  'repairIntakeCaseCreatorDbBackedTransactionSkeleton.unit.test.js',
);
const DOC_PATH = path.resolve(
  __dirname,
  '../../docs/task-2321-repair-intake-draft-to-case-db-backed-case-creator-transaction-skeleton-no-db-execution-no-migration-no-smoke-no-provider.md',
);

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function importSpecifiers(source) {
  const specifiers = [];
  const pattern = /\brequire\(\s*['"]([^'"]+)['"]\s*\)/g;
  let match;

  while ((match = pattern.exec(source)) !== null) {
    specifiers.push(match[1]);
  }

  return specifiers;
}

function stripAllowedDenyList(source) {
  return source
    .replace(/const FORBIDDEN_INPUT_FIELDS = new Set\(\[[\s\S]*?\]\);\n\n/, '')
    .replace(/billingContactRef/g, '');
}

test('Task2321 source test and doc boundaries exist', () => {
  assert.equal(fs.existsSync(SOURCE_PATH), true);
  assert.equal(fs.existsSync(TEST_PATH), true);
  assert.equal(fs.existsSync(DOC_PATH), true);
});

test('transaction skeleton remains behind injected repository and transaction seams', () => {
  const source = read(SOURCE_PATH);

  assert.deepEqual(importSpecifiers(source).sort(), [
    './repairIntakeDraftCaseSubmissionAuditEventBuilder',
    './repairIntakeDraftCaseSubmissionResultNormalizer',
  ].sort());

  for (const marker of [
    'resolveTransactionRunner',
    'resolveManualTransactionRunner',
    'resolveCaseRepository',
    'resolveDraftRepository',
    'resolveAuditWriter',
    'transactionRunner',
    'beginTransaction',
    'commitTransaction',
    'rollbackTransaction',
    'repository.createCaseFromRepairIntakeCandidate',
    'repairIntakeDraftRepository',
    'auditWriter',
  ]) {
    assert.equal(source.includes(marker), true, `missing injected skeleton marker ${marker}`);
  }
});

test('transaction skeleton has no direct DB pool env server route provider AI billing or audit persistence coupling', () => {
  const source = stripAllowedDenyList(read(SOURCE_PATH));

  for (const forbidden of [
    '../db',
    '../database',
    '../migrations',
    '../routes',
    '../controllers',
    '../app',
    '../server',
    'express()',
    'app.listen',
    'server.listen',
    'process.env',
    'DATABASE_URL',
    'new Pool',
    'Pool(',
    'pg',
    'knex',
    'sequelize',
    'mysql',
    'sqlite',
    'fetch(',
    'axios',
    'sendLine',
    'sendSms',
    'sendEmail',
    'provider.send',
    'openai',
    'rag',
    'vector',
      'billing.',
      'billing/',
    'settlement',
    'payment',
    'invoice',
    'auditPersistence',
    'writeAuditPersistence',
  ]) {
    assert.equal(source.includes(forbidden), false, `forbidden source marker ${forbidden}`);
  }

  assert.doesNotMatch(source, /(^|[^'"])listen\(/);
});

test('transaction skeleton source does not introduce SQL or migration execution strings', () => {
  const source = stripAllowedDenyList(read(SOURCE_PATH));

  for (const forbidden of [
    'INSERT INTO',
    'UPDATE ',
    'DELETE FROM',
    'SELECT ',
    'CREATE TABLE',
    'ALTER TABLE',
    'DROP TABLE',
    'npm run migrate',
    'db:migrate',
    'migrate:latest',
    'knex migrate',
    'sequelize db:migrate',
  ]) {
    assert.equal(source.includes(forbidden), false, `forbidden execution marker ${forbidden}`);
  }
});

test('unsafe client override and raw leakage fields remain blocked at creator input boundary', () => {
  const source = read(SOURCE_PATH);

  for (const marker of [
    'requestBody',
    'draftInput',
    'rawBody',
    'headers',
    'query',
    'client',
    'providerPayload',
    'billingPayload',
    'password',
    'secret',
    'token',
    'rawRepositoryResult',
    'rawServicePayload',
  ]) {
    assert.equal(source.includes(`'${marker}'`), true, `missing unsafe field marker ${marker}`);
  }
});

test('Task2321 tests use fake injected transaction clients only', () => {
  const source = read(TEST_PATH);

  for (const marker of [
    'begin',
    'commit',
    'rollback',
    'createManualTransactionHarness',
    'createRepairIntakeCaseCreatorRepositoryAdapter',
  ]) {
    assert.equal(source.includes(marker), true, `missing fake transaction marker ${marker}`);
  }

  assert.deepEqual(importSpecifiers(source), [
    'node:assert/strict',
    'node:test',
    '../../src/repairIntake/repairIntakeCaseCreatorRepositoryAdapter',
  ]);
});
