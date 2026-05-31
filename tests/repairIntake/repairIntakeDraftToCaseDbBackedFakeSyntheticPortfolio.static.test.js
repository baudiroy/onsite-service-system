'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const TASK_DOCS = Object.freeze([
  ['Task2314', 'docs/task-2314-repair-intake-draft-to-case-db-backed-runtime-implementation-authorization-packet-no-db-execution-no-migration-no-smoke-no-provider.md'],
  ['Task2315', 'docs/task-2315-repair-intake-draft-to-case-db-backed-draft-reader-port-adapter-no-db-execution-no-migration-no-smoke-no-provider.md'],
  ['Task2316', 'docs/task-2316-repair-intake-draft-to-case-db-backed-draft-reader-static-boundary-guard-no-runtime-change-no-db-execution-no-migration-no-smoke-no-provider.md'],
  ['Task2317', 'docs/task-2317-repair-intake-draft-to-case-db-backed-idempotency-port-adapter-no-db-execution-no-migration-no-smoke-no-provider.md'],
  ['Task2318', 'docs/task-2318-repair-intake-draft-to-case-db-backed-idempotency-port-static-boundary-guard-no-runtime-change-no-db-execution-no-migration-no-smoke-no-provider.md'],
  ['Task2319', 'docs/task-2319-repair-intake-draft-to-case-db-backed-persistence-seams-checkpoint-no-runtime-change-no-db-execution-no-migration-no-smoke-no-provider.md'],
  ['Task2320', 'docs/task-2320-repair-intake-draft-to-case-case-creator-repository-contract-pre-transaction-guard-no-db-execution-no-migration-no-smoke-no-provider.md'],
  ['Task2321', 'docs/task-2321-repair-intake-draft-to-case-db-backed-case-creator-transaction-skeleton-no-db-execution-no-migration-no-smoke-no-provider.md'],
  ['Task2322', 'docs/task-2322-repair-intake-draft-to-case-db-backed-case-creator-transaction-static-boundary-guard-no-runtime-change-no-db-execution-no-migration-no-smoke-no-provider.md'],
  ['Task2323', 'docs/task-2323-repair-intake-draft-to-case-db-backed-case-creator-transaction-checkpoint-no-runtime-change-no-db-execution-no-migration-no-smoke-no-provider.md'],
  ['Task2324', 'docs/task-2324-repair-intake-draft-to-case-runtime-ports-factory-db-backed-seam-wiring-no-db-execution-no-migration-no-smoke-no-provider.md'],
  ['Task2325', 'docs/task-2325-repair-intake-draft-to-case-runtime-ports-factory-db-backed-seams-static-boundary-guard-no-runtime-change-no-db-execution-no-migration-no-smoke-no-provider.md'],
  ['Task2326', 'docs/task-2326-repair-intake-draft-to-case-db-backed-full-synthetic-chain-no-db-execution-no-migration-no-smoke-no-provider.md'],
  ['Task2327', 'docs/task-2327-repair-intake-draft-to-case-db-backed-full-synthetic-chain-checkpoint-no-runtime-change-no-db-execution-no-migration-no-smoke-no-provider.md'],
  ['Task2328', 'docs/task-2328-repair-intake-draft-to-case-db-backed-full-synthetic-chain-static-boundary-guard-no-runtime-change-no-db-execution-no-migration-no-smoke-no-provider.md'],
  ['Task2329', 'docs/task-2329-repair-intake-draft-to-case-db-backed-fake-synthetic-persistence-branch-closure-no-runtime-change-no-db-execution-no-migration-no-smoke-no-provider.md'],
  ['Task2330', 'docs/task-2330-repair-intake-draft-to-case-audit-persistence-implementation-authorization-packet-no-db-execution-no-migration-no-smoke-no-provider.md'],
  ['Task2331', 'docs/task-2331-repair-intake-draft-to-case-audit-event-persistence-contract-guard-table-shape-alignment-no-db-execution-no-migration-no-smoke-no-provider.md'],
  ['Task2332', 'docs/task-2332-repair-intake-draft-to-case-audit-persistence-fake-client-runtime-wiring-no-db-execution-no-migration-no-smoke-no-provider.md'],
  ['Task2333', 'docs/task-2333-repair-intake-draft-to-case-audit-persistence-fake-client-wiring-static-boundary-guard-no-runtime-change-no-db-execution-no-migration-no-smoke-no-provider.md'],
  ['Task2334', 'docs/task-2334-repair-intake-draft-to-case-runtime-ports-factory-audit-persistence-fake-client-wiring-no-db-execution-no-migration-no-smoke-no-provider.md'],
  ['Task2335', 'docs/task-2335-repair-intake-draft-to-case-db-backed-full-synthetic-chain-with-audit-persistence-no-db-execution-no-migration-no-smoke-no-provider.md'],
  ['Task2336', 'docs/task-2336-repair-intake-draft-to-case-db-backed-full-synthetic-chain-with-audit-static-boundary-guard-no-runtime-change-no-db-execution-no-migration-no-smoke-no-provider.md'],
  ['Task2337', 'docs/task-2337-repair-intake-draft-to-case-audit-persistence-fake-client-branch-closure-no-runtime-change-no-db-execution-no-migration-no-smoke-no-provider.md'],
  ['Task2338', 'docs/task-2338-repair-intake-migration-026-disposable-db-dry-run-authorization-packet-no-db-execution-no-migration-apply-no-smoke-no-provider.md'],
  ['Task2340', 'docs/task-2340-repair-intake-migration-026-disposable-db-dry-run-blocked-checkpoint-no-db-execution-no-migration-no-smoke-no-provider.md'],
]);

const SOURCE_PATHS = Object.freeze({
  draftReaderPortAdapter: 'src/repairIntake/repairIntakeDraftReaderPortAdapter.js',
  draftRepository: 'src/repairIntake/repairIntakeDraftRepository.js',
  idempotencyPortAdapter: 'src/repairIntake/repairIntakeIdempotencyPortAdapter.js',
  idempotencyRepository: 'src/repairIntake/repairIntakeIdempotencyRepository.js',
  caseCreatorRepositoryAdapter: 'src/repairIntake/repairIntakeCaseCreatorRepositoryAdapter.js',
  runtimePortsFactory: 'src/repairIntake/repairIntakeDraftToCaseRuntimePortsFactory.js',
  auditAdapter: 'src/repairIntake/repairIntakeDraftCaseAuditWriterAdapter.js',
  route: 'src/routes/repairIntakeDraftToCase.routes.js',
  migration026: 'migrations/026_create_repair_intake_persistence_tables.sql',
});

const TEST_ARTIFACTS = Object.freeze([
  'tests/repairIntake/repairIntakeDraftReaderPortAdapterDbBacked.unit.test.js',
  'tests/repairIntake/repairIntakeDraftReaderDbBackedBoundary.static.test.js',
  'tests/repairIntake/repairIntakeIdempotencyPortAdapterDbBacked.unit.test.js',
  'tests/repairIntake/repairIntakeIdempotencyPortAdapterDbBackedBoundary.static.test.js',
  'tests/repairIntake/repairIntakeCaseCreatorRepositoryPreTransactionBoundary.static.test.js',
  'tests/repairIntake/repairIntakeCaseCreatorDbBackedTransactionSkeleton.unit.test.js',
  'tests/repairIntake/repairIntakeCaseCreatorDbBackedTransactionBoundary.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseRuntimePortsFactoryDbBackedSeams.unit.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseRuntimePortsFactoryDbBackedSeams.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseDbBackedFullSyntheticChain.unit.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseDbBackedFullSyntheticChainBoundary.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseAuditEventPersistenceContract.unit.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseAuditEventPersistenceBoundary.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseAuditPersistenceFakeClientWiring.unit.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseAuditPersistenceFakeClientWiringBoundary.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseRuntimePortsFactoryAuditPersistenceFakeClient.unit.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseRuntimePortsFactoryAuditPersistenceBoundary.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseDbBackedFullSyntheticChainWithAudit.unit.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseDbBackedFullSyntheticChainWithAuditBoundary.static.test.js',
  'tests/repairIntake/repairIntakeMigration026DisposableDbDryRunAuthorization.static.test.js',
]);

const ROUTE_FORBIDDEN_MARKERS = Object.freeze([
  '/public',
  '/open',
  '/customer',
  '/intake/open',
  '/repair-intake/open',
  'public.routes',
  'openRepairIntake',
  'customerAccess',
  'customer-access',
]);

function projectPath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(projectPath(relativePath), 'utf8');
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
    assert.equal(source.includes(marker), false, `${label} should not include ${marker}`);
  }
}

test('Task2341 portfolio guard reads source test docs and migration files as text only', () => {
  for (const [, relativePath] of TASK_DOCS) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }

  for (const relativePath of [
    ...Object.values(SOURCE_PATHS),
    ...TEST_ARTIFACTS,
  ]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }

  const guardSource = read('tests/repairIntake/repairIntakeDraftToCaseDbBackedFakeSyntheticPortfolio.static.test.js');
  const topLevelImports = guardSource.split('\n').slice(0, 8).join('\n');

  assert.deepEqual(requireSpecifiers(topLevelImports).sort(), [
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:test',
  ]);
});

test('accepted Task2314 through Task2340 portfolio docs remain visible', () => {
  for (const [taskId, relativePath] of TASK_DOCS) {
    const doc = read(relativePath);

    assert.equal(doc.includes(taskId), true, `${relativePath} should identify ${taskId}`);
  }

  const combinedDocs = TASK_DOCS.map(([, relativePath]) => read(relativePath)).join('\n');

  assertIncludesAll(combinedDocs, [
    'DB-backed draft reader',
    'DB-backed idempotency',
    'case creator transaction skeleton',
    'runtime ports factory',
    'full synthetic chain',
    'audit persistence fake-client',
    'repair_intake_audit_events',
    'disposable local/test DB',
    'BLOCKED: no disposable DB target available',
  ], 'portfolio docs');
});

test('DB-backed source seams remain visible behind explicit injected dependencies', () => {
  const draftReader = read(SOURCE_PATHS.draftReaderPortAdapter);
  const draftRepository = read(SOURCE_PATHS.draftRepository);
  const idempotencyPort = read(SOURCE_PATHS.idempotencyPortAdapter);
  const idempotencyRepository = read(SOURCE_PATHS.idempotencyRepository);
  const caseCreator = read(SOURCE_PATHS.caseCreatorRepositoryAdapter);
  const runtimeFactory = read(SOURCE_PATHS.runtimePortsFactory);
  const auditAdapter = read(SOURCE_PATHS.auditAdapter);

  assertIncludesAll(draftReader, [
    'function createRepairIntakeDraftReaderPortAdapter(options = {})',
    'draftRepository.findDraftForConversion',
  ], 'draft reader port adapter');

  assertIncludesAll(draftRepository, [
    'function createRepairIntakeDraftRepository(options = {})',
    'FROM repair_intake_drafts',
    'organizationId',
    'tenantId',
  ], 'draft repository');

  assertIncludesAll(idempotencyPort, [
    'function createRepairIntakeIdempotencyPortAdapter(options = {})',
    'idempotencyStore.findExistingDraftToCaseResult',
    'idempotencyStore.recordDraftToCaseResult',
  ], 'idempotency port adapter');

  assertIncludesAll(idempotencyRepository, [
    'function createRepairIntakeIdempotencyRepository(options = {})',
    'FROM repair_intake_idempotency_records',
    'INSERT INTO repair_intake_idempotency_records',
  ], 'idempotency repository');

  assertIncludesAll(caseCreator, [
    'function createRepairIntakeCaseCreatorRepositoryAdapter(options = {})',
    'transactionRunner',
    'rollbackTransaction',
    'createCaseFromCandidate',
  ], 'case creator transaction skeleton');

  assertIncludesAll(runtimeFactory, [
    'function createRepairIntakeDraftToCaseRuntimePorts(options = {})',
    'createRepairIntakeDraftRepository({ dbClient })',
    'createRepairIntakeIdempotencyRepository({ dbClient })',
    'createRepairIntakeCaseCreatorRepositoryAdapter({',
    'transactionRunner: safeOptions.transactionRunner',
    "const DEFAULT_AUDIT_TABLE_NAME = 'repair_intake_audit_events';",
    'createRepairIntakeDraftCaseAuditWriterAdapter({',
    'dbClient: isObject(safeOptions.auditDbClient) ? safeOptions.auditDbClient : dbClient',
  ], 'runtime ports factory');

  assertIncludesAll(auditAdapter, [
    "const DEFAULT_TABLE_NAME = 'repair_intake_audit_events';",
    "'repair_intake_draft_to_case_submission'",
    "'repair_intake_draft_to_case_permission_denied'",
    'function queryText(tableName)',
    '`insert into ${tableName} (`',
  ], 'audit fake-client adapter');
});

test('full synthetic chains and fake-client audit tests remain visible', () => {
  const fullSynthetic = read('tests/repairIntake/repairIntakeDraftToCaseDbBackedFullSyntheticChain.unit.test.js');
  const fullSyntheticWithAudit = read('tests/repairIntake/repairIntakeDraftToCaseDbBackedFullSyntheticChainWithAudit.unit.test.js');
  const task2335Guard = read('tests/repairIntake/repairIntakeDraftToCaseDbBackedFullSyntheticChainWithAuditBoundary.static.test.js');

  assertIncludesAll(fullSynthetic, [
    'function createFakeDbClient(options = {})',
    'function createTransactionRunner(options = {})',
    'function createCaseRepository(options = {})',
    'createRepairIntakeDraftToCaseRuntimePorts',
    'createRepairIntakeDraftToCaseApplicationService',
    'createRepairIntakeDraftToCaseApiModule',
  ], 'full synthetic chain');

  assertIncludesAll(fullSyntheticWithAudit, [
    'function createFakeDbClient(calls, options = {})',
    'function createAuditDbClient(calls, options = {})',
    'function createTransactionRunner(calls)',
    'function createCaseRepository(calls)',
    "'audit:repair_intake_audit_events'",
    "tableName === 'repair_intake_audit_events'",
    'assertAuditPayload',
  ], 'full synthetic chain with audit');

  assertIncludesAll(task2335Guard, [
    'fake draft/idempotency query DB client',
    'fake transaction runner',
    'fake case repository',
    'fake audit DB client',
    'accepted runtime audit seam remains composed through fake injected audit DB client only',
  ], 'Task2335/Task2336 static guard');
});

test('migration 026 authorization and blocked dry-run state remain frozen', () => {
  const migration = read(SOURCE_PATHS.migration026);
  const task2338 = read('docs/task-2338-repair-intake-migration-026-disposable-db-dry-run-authorization-packet-no-db-execution-no-migration-apply-no-smoke-no-provider.md');
  const task2340 = read('docs/task-2340-repair-intake-migration-026-disposable-db-dry-run-blocked-checkpoint-no-db-execution-no-migration-no-smoke-no-provider.md');

  assertIncludesAll(migration, [
    'NO DB CONNECTION OR EXECUTION IS AUTHORIZED BY THIS FILE',
    'CREATE TABLE IF NOT EXISTS repair_intake_drafts',
    'CREATE TABLE IF NOT EXISTS repair_intake_draft_case_conversions',
    'CREATE TABLE IF NOT EXISTS repair_intake_idempotency_records',
    'CREATE TABLE IF NOT EXISTS repair_intake_audit_events',
  ], 'migration 026');

  assertIncludesAll(task2338, [
    'Task2338 does not authorize DB execution',
    'target must be a disposable local/test DB only',
    'no production DB',
    'no staging DB',
    'no shared DB',
    'Task2339 must not start unless PM explicitly authorizes DB execution and the disposable DB target.',
  ], 'Task2338 authorization packet');

  assertIncludesAll(task2340, [
    'psql` was not found',
    'createdb` was not found',
    'dropdb` was not found',
    'Result: `BLOCKED: no disposable DB target available`.',
    'no shared, staging, production, Zeabur, or app DB was used',
    'no commit/push was made by Task2339',
  ], 'Task2340 blocked checkpoint');
});

test('admin injected route boundary remains frozen with no public or open route expansion', () => {
  const routeSource = read(SOURCE_PATHS.route);

  assertIncludesAll(routeSource, [
    "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_BASE_PATH = '/api/v1/admin'",
    "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH = '/api/v1/admin/repair-intake/drafts/:draftId/case/submit'",
    "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION = 'cases.create'",
    'getRepairIntakeDraftToCaseRuntimePorts',
    'createRepairIntakeDraftToCaseInjectedRouteComposition',
    'requirePermission(REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION)',
  ], 'admin injected route');

  assertExcludesAll(routeSource, ROUTE_FORBIDDEN_MARKERS, 'admin injected route');
});

test('portfolio docs preserve no-runtime no-DB no-migration no-smoke no-provider boundaries', () => {
  const boundaryDocs = [
    read('docs/task-2329-repair-intake-draft-to-case-db-backed-fake-synthetic-persistence-branch-closure-no-runtime-change-no-db-execution-no-migration-no-smoke-no-provider.md'),
    read('docs/task-2337-repair-intake-draft-to-case-audit-persistence-fake-client-branch-closure-no-runtime-change-no-db-execution-no-migration-no-smoke-no-provider.md'),
    read('docs/task-2338-repair-intake-migration-026-disposable-db-dry-run-authorization-packet-no-db-execution-no-migration-apply-no-smoke-no-provider.md'),
    read('docs/task-2340-repair-intake-migration-026-disposable-db-dry-run-blocked-checkpoint-no-db-execution-no-migration-no-smoke-no-provider.md'),
    read('docs/task-2341-repair-intake-draft-to-case-db-backed-fake-synthetic-portfolio-static-guard-no-runtime-change-no-db-execution-no-migration-no-smoke-no-provider.md'),
  ].join('\n');

  assertIncludesAll(boundaryDocs, [
    'No real DB execution',
    'No SQL',
    'No migration',
    'No smoke',
    'No provider',
    'No server/listener',
    'No `DATABASE_URL`',
    'Zeabur',
    'secrets',
    'Future implementation remains blocked until PM authorizes one exact bounded task.',
  ], 'portfolio boundary docs');
});
