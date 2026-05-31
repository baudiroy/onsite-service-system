'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const FACTORY_PATH = 'src/repairIntake/repairIntakeDraftToCaseRuntimePortsFactory.js';
const UNIT_TEST_PATH = 'tests/repairIntake/repairIntakeDraftToCaseRuntimePortsFactoryDbBackedSeams.unit.test.js';
const DOC_PATH = 'docs/task-2324-repair-intake-draft-to-case-runtime-ports-factory-db-backed-seam-wiring-no-db-execution-no-migration-no-smoke-no-provider.md';

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function requireSpecifiers(source) {
  return Array.from(source.matchAll(/require\(\s*['"]([^'"]+)['"]\s*\)/g), (match) => match[1]);
}

test('Task2324 files exist and factory remains text-inspectable', () => {
  for (const relativePath of [FACTORY_PATH, UNIT_TEST_PATH, DOC_PATH]) {
    assert.equal(fs.existsSync(path.join(repoRoot, relativePath)), true, `missing ${relativePath}`);
  }
});

test('runtime factory wires accepted DB-backed seams through injected modules', () => {
  const source = read(FACTORY_PATH);

  for (const specifier of [
    './repairIntakeDraftRepository',
    './repairIntakeDraftRepositoryAdapter',
    './repairIntakeDraftReaderPortAdapter',
    './repairIntakeIdempotencyRepository',
    './repairIntakeIdempotencyPortAdapter',
    './repairIntakeCaseRepositoryAdapter',
    './repairIntakeCaseCreatorRepositoryAdapter',
    './repairIntakeCaseCreatorPortAdapter',
    './repairIntakeCasePlannerPortAdapter',
    './repairIntakeAuditWriterPortAdapter',
  ]) {
    assert.equal(requireSpecifiers(source).includes(specifier), true, `missing import ${specifier}`);
  }

  for (const marker of [
    'createRepairIntakeDraftRepository({ dbClient })',
    'createRepairIntakeDraftRepositoryAdapter({ dbClient })',
    'createRepairIntakeIdempotencyRepository({ dbClient })',
    'createRepairIntakeCaseRepositoryAdapter({',
    'createRepairIntakeDraftReaderPortAdapter({',
    'createRepairIntakeIdempotencyPortAdapter({',
    'createRepairIntakeCasePlannerPortAdapter({',
    'createRepairIntakeCaseCreatorPortAdapter({',
    'createRepairIntakeCaseCreatorRepositoryAdapter({',
    'transactionRunner: safeOptions.transactionRunner',
  ]) {
    assert.equal(source.includes(marker), true, `missing wiring marker ${marker}`);
  }
});

test('runtime factory does not introduce env DB pool server migration route provider or package coupling', () => {
  const source = read(FACTORY_PATH);

  for (const forbidden of [
    'process.env',
    'DATABASE_URL',
    'Zeabur',
    "require('pg')",
    'require("pg")',
    'new Pool',
    'createPool',
    '../server',
    '../app',
    'app.listen',
    'server.listen',
    '/healthz',
    'npm run migrate',
    'db:migrate',
    'migrate:latest',
    'sendLine',
    'sendSms',
    'sendEmail',
    'provider.send',
    'openai',
    'vector',
    'rag',
    'billing',
    'settlement',
    'payment',
    'invoice',
    'package.json',
  ]) {
    assert.equal(source.includes(forbidden), false, `forbidden marker ${forbidden}`);
  }
});

test('focused unit test proves fake-only composition and no composition-time DB execution', () => {
  const testSource = read(UNIT_TEST_PATH);

  for (const marker of [
    'createFakeDbClient',
    'createTransactionRunner',
    'dbClient.calls, []',
    'transactionCalls, []',
    'composed draft reader idempotency and transaction skeleton ports work with fake clients only',
    'caseCreatorRepository.createCaseFromCandidate',
    'tx:insert into cases',
    'tx:update repair_intake_drafts set',
  ]) {
    assert.equal(testSource.includes(marker), true, `missing fake-only test marker ${marker}`);
  }

  for (const forbidden of [
    'process.env',
    'DATABASE_URL',
    'new Pool',
    'fetch(',
    'axios',
    '/healthz',
  ]) {
    assert.equal(testSource.includes(forbidden), false, `unit test contains forbidden marker ${forbidden}`);
  }
});
