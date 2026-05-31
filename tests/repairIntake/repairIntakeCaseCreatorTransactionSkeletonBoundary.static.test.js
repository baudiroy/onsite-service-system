'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const SOURCE_PATH = path.resolve(
  __dirname,
  '../../src/repairIntake/repairIntakeCaseCreatorRepositoryAdapter.js',
);
const TASK2321_UNIT_TEST_PATH = path.resolve(
  __dirname,
  'repairIntakeCaseCreatorDbBackedTransactionSkeleton.unit.test.js',
);
const TASK2321_STATIC_TEST_PATH = path.resolve(
  __dirname,
  'repairIntakeCaseCreatorDbBackedTransactionBoundary.static.test.js',
);
const TASK2321_DOC_PATH = path.resolve(
  __dirname,
  '../../docs/task-2321-repair-intake-draft-to-case-db-backed-case-creator-transaction-skeleton-no-db-execution-no-migration-no-smoke-no-provider.md',
);
const TASK2322_DOC_PATH = path.resolve(
  __dirname,
  '../../docs/task-2322-repair-intake-draft-to-case-db-backed-case-creator-transaction-static-boundary-guard-no-runtime-change-no-db-execution-no-migration-no-smoke-no-provider.md',
);

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function stripAllowedDenyList(source) {
  return source
    .replace(/const FORBIDDEN_INPUT_FIELDS = new Set\(\[[\s\S]*?\]\);\n\n/, '')
    .replace(/billingContactRef/g, '');
}

function assertIncludes(source, marker) {
  assert.equal(source.includes(marker), true, `missing marker ${marker}`);
}

function assertOrder(source, markers) {
  let cursor = -1;

  for (const marker of markers) {
    const index = source.indexOf(marker, cursor + 1);

    assert.notEqual(index, -1, `missing ordered marker ${marker}`);
    assert.equal(index > cursor, true, `marker out of order ${marker}`);
    cursor = index;
  }
}

test('Task2322 static guard reads only Task2321 source test and doc artifacts', () => {
  for (const filePath of [
    SOURCE_PATH,
    TASK2321_UNIT_TEST_PATH,
    TASK2321_STATIC_TEST_PATH,
    TASK2321_DOC_PATH,
    TASK2322_DOC_PATH,
  ]) {
    assert.equal(fs.existsSync(filePath), true, `missing inspected artifact ${filePath}`);
  }
});

test('transaction skeleton remains behind injected transaction and repository seams', () => {
  const source = read(SOURCE_PATH);

  for (const marker of [
    'resolveTransactionRunner',
    'resolveManualTransactionRunner',
    'transactionRunner',
    'resolveCaseRepository',
    'resolveDraftRepository',
    'resolveAuditWriter',
    'createCaseFromRepairIntakeCandidate',
    'markDraftLinkedToCase',
    'recordRepairIntakeDraftToCaseCreated',
  ]) {
    assertIncludes(source, marker);
  }

  for (const methodName of [
    "'begin'",
    "'beginTransaction'",
    "'startTransaction'",
    "'commit'",
    "'commitTransaction'",
    "'rollback'",
    "'rollbackTransaction'",
  ]) {
    assertIncludes(source, methodName);
  }
});

test('create link audit commit and rollback behavior remains covered by Task2321 tests', () => {
  const unitTest = read(TASK2321_UNIT_TEST_PATH);

  for (const sequence of [
    "['begin', 'create', 'link', 'audit', 'commit']",
    "['begin', 'create', 'rollback']",
    "['begin', 'create', 'link', 'audit', 'commit', 'rollback']",
  ]) {
    assertIncludes(unitTest, sequence);
  }

  for (const marker of [
    'commit failure attempts rollback',
    'repository create failure rolls back',
    'malformed repository result rolls back',
    'rollback failure is swallowed',
    'begin failure fails closed',
  ]) {
    assertIncludes(`${unitTest}\n${read(TASK2321_DOC_PATH)}\n${read(TASK2322_DOC_PATH)}`, marker);
  }

  const source = read(SOURCE_PATH);
  assertOrder(source, [
    'return await runTransaction(async (tx) => {',
    'created = await createCase({',
    'const linkResult = await markDraftLinked({',
    'await writeAudit({',
    'return caseRef;',
  ]);
  assertIncludes(source, 'await rollbackTransaction(tx, transactionRunner)');
  assertIncludes(source, 'catch (error) {\n    return undefined;\n  }');
});

test('trusted org tenant and client-controlled field boundaries remain frozen', () => {
  const source = read(SOURCE_PATH);
  const unitTest = read(TASK2321_UNIT_TEST_PATH);

  for (const marker of [
    'const organizationId = stringValue(command.organizationId)',
    'if (!draftId || !organizationId || !actorId || !idempotencyKey)',
    'const tenantId = stringValue(command.tenantId)',
    'if (command.tenantId && caseCandidate.tenantId && command.tenantId !== caseCandidate.tenantId)',
    'REPAIR_INTAKE_CASE_CREATOR_TENANT_MISMATCH',
    'tenantId: command.tenantId',
  ]) {
    assertIncludes(source, marker);
  }

  for (const unsafeField of [
    'requestBody',
    'draftInput',
    'body',
    'client',
    'headers',
    'query',
    'rawBody',
    'providerPayload',
    'billingPayload',
    'password',
    'secret',
    'token',
  ]) {
    assertIncludes(source, `'${unsafeField}'`);
  }

  for (const marker of [
    'client controlled override fields fail before transaction work',
    'tenant mismatch fails before transaction work',
    'malformed trusted command',
  ]) {
    assertIncludes(unitTest, marker);
  }
});

test('sanitized output malformed result and no mutation coverage remains visible', () => {
  const source = read(SOURCE_PATH);
  const unitTest = read(TASK2321_UNIT_TEST_PATH);

  for (const marker of [
    'normalizeRepairIntakeDraftCaseSubmissionResult',
    'CASE_REF_ID_MISSING',
    'malformed repository result rolls back and fails closed',
    'repository failure envelope is sanitized and does not mutate result object',
    'creator input was mutated',
    'repository result object was mutated',
    'assertNoUnsafeMarkers(result)',
  ]) {
    assertIncludes(`${source}\n${unitTest}`, marker);
  }
});

test('no forbidden DB env runtime route migration provider AI or billing coupling exists in source', () => {
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
    'Zeabur',
    'secret',
    'new Pool',
    'Pool(',
    'pg',
    'knex',
    'sequelize',
    'mysql',
    'sqlite',
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
    'package.json',
  ]) {
    assert.equal(source.includes(forbidden), false, `forbidden coupling marker ${forbidden}`);
  }

  assert.doesNotMatch(source, /(^|[^'"])listen\(/);
});

test('unsafe leakage coverage remains visible in source tests and docs', () => {
  const combined = [
    read(SOURCE_PATH),
    read(TASK2321_UNIT_TEST_PATH),
    read(TASK2321_STATIC_TEST_PATH),
    read(TASK2321_DOC_PATH),
    read(TASK2322_DOC_PATH),
  ].join('\n');

  for (const marker of [
    'rawRows',
    'SQL',
    'stack trace',
    'database error',
    'token',
    'password',
    'secret',
    'providerPayload',
    'AI/RAG',
    'billing',
    'audit internals',
    'customer private',
    'customerPhone',
    'rawServicePayload',
  ]) {
    assertIncludes(combined, marker);
  }
});
