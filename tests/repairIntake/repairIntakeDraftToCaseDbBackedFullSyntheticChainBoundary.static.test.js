'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const FULL_CHAIN_TEST_PATH = 'tests/repairIntake/repairIntakeDraftToCaseDbBackedFullSyntheticChain.unit.test.js';
const FACTORY_PATH = 'src/repairIntake/repairIntakeDraftToCaseRuntimePortsFactory.js';
const APPLICATION_SERVICE_PATH = 'src/repairIntake/repairIntakeDraftToCaseApplicationService.js';
const API_MODULE_PATH = 'src/repairIntake/repairIntakeDraftToCaseApiModule.js';
const TASK2326_DOC_PATH = 'docs/task-2326-repair-intake-draft-to-case-db-backed-full-synthetic-chain-no-db-execution-no-migration-no-smoke-no-provider.md';
const TASK2327_DOC_PATH = 'docs/task-2327-repair-intake-draft-to-case-db-backed-full-synthetic-chain-checkpoint-no-runtime-change-no-db-execution-no-migration-no-smoke-no-provider.md';
const TASK2328_DOC_PATH = 'docs/task-2328-repair-intake-draft-to-case-db-backed-full-synthetic-chain-static-boundary-guard-no-runtime-change-no-db-execution-no-migration-no-smoke-no-provider.md';

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function requireSpecifiers(source) {
  return Array.from(source.matchAll(/require\(\s*['"]([^'"]+)['"]\s*\)/g), (match) => match[1]);
}

function assertIncludesAll(source, markers, label) {
  for (const marker of markers) {
    assert.equal(source.includes(marker), true, `${label} missing marker ${marker}`);
  }
}

function assertExcludesAll(source, markers, label) {
  for (const marker of markers) {
    assert.equal(source.includes(marker), false, `${label} contains forbidden marker ${marker}`);
  }
}

test('Task2328 static guard reads source test and doc artifacts only', () => {
  for (const relativePath of [
    FULL_CHAIN_TEST_PATH,
    FACTORY_PATH,
    APPLICATION_SERVICE_PATH,
    API_MODULE_PATH,
    TASK2326_DOC_PATH,
    TASK2327_DOC_PATH,
    TASK2328_DOC_PATH,
  ]) {
    assert.equal(fs.existsSync(path.join(repoRoot, relativePath)), true, `missing ${relativePath}`);
  }
});

test('full synthetic chain keeps accepted runtime factory application service and API module composition', () => {
  const testSource = read(FULL_CHAIN_TEST_PATH);
  const task2326Doc = read(TASK2326_DOC_PATH);
  const task2327Doc = read(TASK2327_DOC_PATH);

  assertIncludesAll(testSource, [
    "require('../../src/repairIntake/repairIntakeDraftToCaseRuntimePortsFactory')",
    "require('../../src/repairIntake/repairIntakeDraftToCaseApplicationService')",
    "require('../../src/repairIntake/repairIntakeDraftToCaseApiModule')",
    'createRepairIntakeDraftToCaseRuntimePorts({',
    'createRepairIntakeDraftToCaseApplicationService({',
    'createRepairIntakeDraftToCaseApiModule({',
    'controllerFromApplicationService(applicationService)',
    'appCaseCreatorFromRepository(runtimePorts.caseCreatorRepository)',
  ], 'Task2326 composition');

  assertIncludesAll(task2326Doc, [
    '`createRepairIntakeDraftToCaseRuntimePorts`',
    '`createRepairIntakeDraftToCaseApplicationService`',
    '`createRepairIntakeDraftToCaseApiModule`',
    'fake query client',
    'fake transaction runner',
    'No route mount, server, or listener is created.',
  ], 'Task2326 doc composition');

  assertIncludesAll(task2327Doc, [
    'Full synthetic chain composes runtime ports factory, application service, and API module with fake query/transaction clients.',
    'No real DB connection has been made.',
    'No route path or mount behavior has changed.',
  ], 'Task2327 checkpoint composition');
});

test('full synthetic chain stays fake injected DB and transaction only', () => {
  const testSource = read(FULL_CHAIN_TEST_PATH);

  assertIncludesAll(testSource, [
    'function createFakeDbClient(options = {})',
    'function createTransactionRunner(options = {})',
    'const dbClient = createFakeDbClient(options.db || {})',
    'const transactionRunner = createTransactionRunner(options.transaction || {})',
    'caseCreatorCaseRepository: caseRepository',
    'caseCreatorAuditWriter,',
    'assert.deepEqual(chain.dbClient.calls, [])',
    'assert.deepEqual(chain.transactionRunner.calls, [])',
  ], 'fake injected DB and transaction dependencies');

  assertExcludesAll(testSource, [
    'new ' + 'Pool',
    'create' + 'Pool',
    'DATABASE' + '_URL',
    'require(' + "'pg')",
    'require("pg"' + ')',
    'connect(',
    'listen(',
  ], 'Task2326 full chain test source');
});

test('successful path coverage remains visible', () => {
  const testSource = read(FULL_CHAIN_TEST_PATH);

  assertIncludesAll(testSource, [
    'successful fake DB-backed application API chain creates safe draft-to-case output',
    "call.text.includes('FROM repair_intake_drafts')",
    "call.text.includes('FROM repair_intake_idempotency_records')",
    "call.text.includes('INSERT INTO repair_intake_idempotency_records')",
    "textIncludes(call.text, 'insert into repair_intake_audit_events')",
    "'tx:insert into cases'",
    "'tx:update repair_intake_drafts set'",
    "'commit'",
    'assertNoUnsafeText(response)',
    'assertDependenciesUnmutated(chain)',
  ], 'Task2326 successful path coverage');
});

test('fail-closed coverage remains visible', () => {
  const testSource = read(FULL_CHAIN_TEST_PATH);
  const applicationServiceSource = read(APPLICATION_SERVICE_PATH);

  assertIncludesAll(testSource, [
    'cross-organization draft row fails closed before transaction work',
    'wrong idempotency scope fails closed and never replays attacker case data',
    'transaction create link audit and commit failures fail closed with rollback when supported',
    'malformed DB row and malformed writer result fail closed without raw leakage',
    'failCreate',
    'failLink',
    'failAudit',
    'failCommit',
    'malformedDraftRow',
    'malformedCreateResult',
    'malformedIdempotencyWrite',
    "'rollback'",
  ], 'Task2326 fail-closed path coverage');

  assertIncludesAll(applicationServiceSource, [
    'function portResultFailed(result)',
    'result.ok === false',
    "safeString(result.status) === 'failed'",
    'portResultFailed(caseRef)',
    'portResultFailed(auditEvent)',
    'portResultFailed(recordedResult)',
  ], 'Task2326 application service object-shaped port failure fix');
});

test('unsafe leakage and no-mutation coverage remain visible', () => {
  const testSource = read(FULL_CHAIN_TEST_PATH);

  assertIncludesAll(testSource, [
    'rawRows',
    'rawBody',
    'rawError',
    'rawServicePayload',
    'providerPayload',
    'token',
    'password',
    'secret',
    'select *',
    'stack',
    'customer private',
    'customerAddress',
    'customerPhone',
    'billingPayload',
    'settlement',
    'payment',
    'invoice',
    'openai',
    'vector',
    'rag',
    'auditInternal',
    'assert.deepEqual(request, beforeRequest)',
    'assertDependenciesUnmutated(chain)',
    'dependencySnapshot',
  ], 'Task2326 unsafe leakage and no-mutation coverage');
});

test('forbidden runtime route migration smoke provider package coupling remains absent', () => {
  const factorySource = read(FACTORY_PATH);
  const testSource = read(FULL_CHAIN_TEST_PATH);

  assertExcludesAll(factorySource, [
    'DATABASE_URL',
    'process.env',
    'require(' + "'pg')",
    'require("pg"' + ')',
    'new Pool',
    'createPool',
    'app.listen',
    'server.listen',
    'npm run migrate',
    'db:migrate',
    'migrate:latest',
    'sendLine',
    'sendSms',
    'sendEmail',
    'provider.send',
    'package-lock',
  ], 'Task2328 inspected runtime ports factory source');

  assertExcludesAll(testSource, [
    'process.env.DATA' + 'BASE_URL',
    'new ' + 'Pool',
    'npm run ' + 'migrate',
    'db' + ':migrate',
    '/health' + 'z',
    'send' + 'Line',
    'send' + 'Sms',
    'send' + 'Email',
    'webhook.' + 'send',
    'package' + '-lock',
  ], 'Task2326 full chain source forbidden coupling');

  assert.deepEqual(requireSpecifiers(testSource), [
    'node:assert/strict',
    'node:fs',
    'node:test',
    '../../src/repairIntake/repairIntakeDraftToCaseApiModule',
    '../../src/repairIntake/repairIntakeDraftToCaseApplicationService',
    '../../src/repairIntake/repairIntakeDraftToCaseRuntimePortsFactory',
  ]);
});

test('Task2328 guard itself stays text-only', () => {
  const guardSource = fs.readFileSync(__filename, 'utf8');
  const topLevelImports = guardSource.split('\n').slice(0, 8).join('\n');

  assert.deepEqual(requireSpecifiers(topLevelImports).sort(), [
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:test',
  ]);
  assert.doesNotMatch(guardSource, /=\s*createRepairIntakeDraftToCaseRuntimePorts\s*\(/);
});
