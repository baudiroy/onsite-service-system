'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const FACTORY_PATH = 'src/repairIntake/repairIntakeDraftToCaseRuntimePortsFactory.js';
const TASK2324_UNIT_PATH = 'tests/repairIntake/repairIntakeDraftToCaseRuntimePortsFactoryDbBackedSeams.unit.test.js';
const TASK2324_STATIC_PATH = 'tests/repairIntake/repairIntakeDraftToCaseRuntimePortsFactoryDbBackedSeams.static.test.js';
const FACTORY_UNIT_PATH = 'tests/repairIntake/repairIntakeDraftToCaseRuntimePortsFactory.unit.test.js';
const DRAFT_READER_TEST_PATH = 'tests/repairIntake/repairIntakeDraftReaderPortAdapterDbBacked.unit.test.js';
const IDEMPOTENCY_TEST_PATH = 'tests/repairIntake/repairIntakeIdempotencyPortAdapterDbBacked.unit.test.js';
const CASE_CREATOR_TEST_PATH = 'tests/repairIntake/repairIntakeCaseCreatorDbBackedTransactionSkeleton.unit.test.js';
const TRANSACTION_BOUNDARY_TEST_PATH = 'tests/repairIntake/repairIntakeCaseCreatorTransactionSkeletonBoundary.static.test.js';
const TASK2324_DOC_PATH = 'docs/task-2324-repair-intake-draft-to-case-runtime-ports-factory-db-backed-seam-wiring-no-db-execution-no-migration-no-smoke-no-provider.md';
const TASK2325_DOC_PATH = 'docs/task-2325-repair-intake-draft-to-case-runtime-ports-factory-db-backed-seams-static-boundary-guard-no-runtime-change-no-db-execution-no-migration-no-smoke-no-provider.md';

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
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

function requireSpecifiers(source) {
  return Array.from(source.matchAll(/require\(\s*['"]([^'"]+)['"]\s*\)/g), (match) => match[1]);
}

test('Task2325 static guard reads source test and doc artifacts only', () => {
  for (const relativePath of [
    FACTORY_PATH,
    TASK2324_UNIT_PATH,
    TASK2324_STATIC_PATH,
    FACTORY_UNIT_PATH,
    DRAFT_READER_TEST_PATH,
    IDEMPOTENCY_TEST_PATH,
    CASE_CREATOR_TEST_PATH,
    TRANSACTION_BOUNDARY_TEST_PATH,
    TASK2324_DOC_PATH,
    TASK2325_DOC_PATH,
  ]) {
    assert.equal(fs.existsSync(path.join(repoRoot, relativePath)), true, `missing ${relativePath}`);
  }
});

test('factory keeps explicit injected dependency gates for DB-backed seam composition', () => {
  const source = read(FACTORY_PATH);
  const task2324Unit = read(TASK2324_UNIT_PATH);
  const task2324Doc = read(TASK2324_DOC_PATH);

  assertIncludesAll(source, [
    'function createRepairIntakeDraftToCaseRuntimePorts(options = {})',
    'const { dbClient } = safeOptions;',
    'assertDbClient(dbClient);',
    'safeOptions.idGenerator',
    'REPAIR_INTAKE_DRAFT_TO_CASE_RUNTIME_PORTS_ID_GENERATOR_REQUIRED',
    'createRepairIntakeDraftRepository({ dbClient })',
    'createRepairIntakeDraftRepositoryAdapter({ dbClient })',
    'createRepairIntakeIdempotencyRepository({ dbClient })',
    'createRepairIntakeCaseRepositoryAdapter({',
    'const draftReader = createRepairIntakeDraftReaderPortAdapter({',
    'const idempotencyPort = createRepairIntakeIdempotencyPortAdapter({',
    'const caseCreator = createRepairIntakeCaseCreatorPortAdapter({',
    'const caseCreatorRepository = safeOptions.transactionRunner',
    'createRepairIntakeCaseCreatorRepositoryAdapter({',
    'transactionRunner: safeOptions.transactionRunner',
    'caseRepository: safeOptions.caseCreatorCaseRepository || caseRepository',
    'repairIntakeDraftRepository: draftWriterRepository',
    '...(caseCreatorRepository ? { caseCreatorRepository } : {})',
  ], 'runtime ports factory DB-backed dependency gates');

  assertIncludesAll(task2324Unit, [
    'factory omits DB-backed case creator transaction repository when transactionRunner is missing',
    'assert.equal(ports.caseCreatorRepository, undefined)',
    'assert.equal(typeof ports.draftReader.getDraftForConversion, \'function\')',
    'assert.equal(typeof ports.idempotencyPort.findExistingDraftToCaseResult, \'function\')',
    'assert.equal(typeof ports.caseCreator.createCaseFromDraft, \'function\')',
    'dbClient.calls, []',
    'transactionCalls, []',
  ], 'Task2324 unit dependency behavior');

  assertIncludesAll(task2324Doc, [
    'The factory continues to require an explicit injected `dbClient` and `idGenerator`.',
    'The factory now returns `caseCreatorRepository` only when an explicit injected `transactionRunner` is provided.',
    'Composition does not call fake query or transaction clients.',
    'Missing `transactionRunner` omits `caseCreatorRepository` while preserving existing runtime factory outputs.',
  ], 'Task2324 doc dependency behavior');
});

test('factory output remains application-service compatible with accepted DB-backed seams', () => {
  const source = read(FACTORY_PATH);
  const task2324Unit = read(TASK2324_UNIT_PATH);
  const factoryUnit = read(FACTORY_UNIT_PATH);

  assertIncludesAll(source, [
    'draftRepository,',
    'draftReader,',
    'idempotencyStore,',
    'idempotencyPort,',
    'planningPolicy,',
    'casePlanner,',
    'caseRepository,',
    'caseCreationPort,',
    'caseCreator,',
    'auditPort,',
    'auditWriter,',
  ], 'runtime ports factory returned port surface');

  assertIncludesAll(task2324Unit, [
    'assert.equal(typeof ports.draftReader.getDraftForConversion, \'function\')',
    'assert.equal(typeof ports.idempotencyPort.recordDraftToCaseResult, \'function\')',
    'assert.equal(typeof ports.casePlanner.planCaseFromDraft, \'function\')',
    'assert.equal(typeof ports.caseCreator.createCaseFromDraft, \'function\')',
    'assert.equal(typeof ports.auditWriter.recordDraftToCaseDecision, \'function\')',
    'caseCreatorRepository.createCaseFromCandidate',
  ], 'Task2324 app-level port compatibility coverage');

  assertIncludesAll(factoryUnit, [
    'factory returns runtime ports compatible with protected admin route mount',
    'case creation port writes case conversion and draft converted update through injected client',
    'audit and idempotency ports write safe rows through injected client',
  ], 'existing runtime factory compatibility coverage');
});

test('accepted seam behavior remains covered by focused text-only tests', () => {
  const draftReaderTest = read(DRAFT_READER_TEST_PATH);
  const idempotencyTest = read(IDEMPOTENCY_TEST_PATH);
  const caseCreatorTest = read(CASE_CREATOR_TEST_PATH);
  const transactionBoundaryTest = read(TRANSACTION_BOUNDARY_TEST_PATH);
  const task2324Unit = read(TASK2324_UNIT_PATH);

  assertIncludesAll(draftReaderTest, [
    'DB-backed draft reader reads by trusted organization and draft id with sanitized output',
    'tenantId',
    'cross-organization and wrong-tenant rows fail closed',
    'client-controlled body draftInput params cannot override trusted context',
  ], 'draft reader org tenant boundary coverage');

  assertIncludesAll(idempotencyTest, [
    'DB-backed lookup replays only matching organization idempotency key draft and tenant scope',
    'operation_type',
    'draft_to_case',
    'idempotencyKey',
    'tenantId',
    'body draftInput and client-controlled fields cannot override trusted top-level scope',
  ], 'idempotency scoped boundary coverage');

  assertIncludesAll(caseCreatorTest, [
    'successful transaction skeleton uses injected begin create link audit commit with trusted scope',
    'tenant mismatch fails before transaction work',
    'begin',
    'commit',
    'rollback',
  ], 'case creator transaction skeleton coverage');

  assertIncludesAll(transactionBoundaryTest, [
    'transaction skeleton remains behind injected transaction and repository seams',
    'trusted org tenant and client-controlled field boundaries remain frozen',
    'no forbidden DB env runtime route migration provider AI or billing coupling exists in source',
  ], 'case creator transaction static boundary coverage');

  assertIncludesAll(task2324Unit, [
    'dependencySnapshot',
    'Object.keys(dbClient).sort()',
    'Object.keys(transactionRunner).sort()',
    'assert.deepEqual(dbClient.calls, [])',
    'assert.deepEqual(transactionCalls, [])',
    'composed draft reader idempotency and transaction skeleton ports work with fake clients only',
  ], 'no composition-time DB execution and no dependency mutation coverage');
});

test('factory source has no forbidden env DB server migration provider AI billing or package coupling', () => {
  const source = read(FACTORY_PATH);

  assertExcludesAll(source, [
    'process.env',
    'DATABASE_URL',
    'Zeabur',
    'require(' + "'pg')",
    'require("pg"' + ')',
    'new Pool',
    'createPool',
    '../server',
    '../app',
    'src/server',
    'app.listen',
    'server.listen',
    '/healthz',
    'smoke',
    'endpoint',
    'deploy',
    'npm run migrate',
    'db:migrate',
    'migrate:latest',
    'migration:run',
    'sendLine',
    'sendSms',
    'sendEmail',
    'provider.send',
    'webhook',
    'openai',
    'vector',
    'rag',
    'billing',
    'settlement',
    'payment',
    'invoice',
    'package.json',
    'package-lock',
  ], 'runtime ports factory source');

  for (const specifier of requireSpecifiers(source)) {
    assert.doesNotMatch(specifier, /^pg$|postgres|server|app|routes|migrations?|package/, `forbidden import ${specifier}`);
  }
});

test('Task2325 guard itself stays text-only and does not import runtime source', () => {
  const guardSource = fs.readFileSync(__filename, 'utf8');
  const forbiddenRuntimeImport = '../../src/repairIntake/repairIntakeDraftToCaseRuntimePortsFactory';

  assert.deepEqual(requireSpecifiers(guardSource).sort(), [
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:test',
  ]);
  assert.equal(requireSpecifiers(guardSource).includes(forbiddenRuntimeImport), false);
  assert.doesNotMatch(guardSource, /=\s*createRepairIntakeDraftToCaseRuntimePorts\s*\(/);
});
