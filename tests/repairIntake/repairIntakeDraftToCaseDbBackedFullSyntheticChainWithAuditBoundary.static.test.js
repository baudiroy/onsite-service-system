'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const TASK2335_UNIT_PATH = 'tests/repairIntake/repairIntakeDraftToCaseDbBackedFullSyntheticChainWithAudit.unit.test.js';
const TASK2326_UNIT_PATH = 'tests/repairIntake/repairIntakeDraftToCaseDbBackedFullSyntheticChain.unit.test.js';
const TASK2328_GUARD_PATH = 'tests/repairIntake/repairIntakeDraftToCaseDbBackedFullSyntheticChainBoundary.static.test.js';
const TASK2334_UNIT_PATH = 'tests/repairIntake/repairIntakeDraftToCaseRuntimePortsFactoryAuditPersistenceFakeClient.unit.test.js';
const TASK2334_GUARD_PATH = 'tests/repairIntake/repairIntakeDraftToCaseRuntimePortsFactoryAuditPersistenceBoundary.static.test.js';
const FACTORY_PATH = 'src/repairIntake/repairIntakeDraftToCaseRuntimePortsFactory.js';
const APPLICATION_SERVICE_PATH = 'src/repairIntake/repairIntakeDraftToCaseApplicationService.js';
const API_MODULE_PATH = 'src/repairIntake/repairIntakeDraftToCaseApiModule.js';
const AUDIT_ADAPTER_PATH = 'src/repairIntake/repairIntakeDraftCaseAuditWriterAdapter.js';
const TASK2335_DOC_PATH = 'docs/task-2335-repair-intake-draft-to-case-db-backed-full-synthetic-chain-with-audit-persistence-no-db-execution-no-migration-no-smoke-no-provider.md';
const TASK2336_DOC_PATH = 'docs/task-2336-repair-intake-draft-to-case-db-backed-full-synthetic-chain-with-audit-static-boundary-guard-no-runtime-change-no-db-execution-no-migration-no-smoke-no-provider.md';

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

function assertExcludesAll(source, patterns, label) {
  for (const pattern of patterns) {
    assert.doesNotMatch(source, pattern, `${label} should not match ${pattern}`);
  }
}

function stripSplitForbiddenMarkerAssertions(source) {
  return source
    .replace(/'process\.env'/g, '')
    .replace(/'process\.env\.DATA'\s\+\s'BASE_URL'/g, '')
    .replace(/'new '\s\+\s'Pool'/g, '')
    .replace(/'app\.'\s\+\s'listen'/g, '')
    .replace(/'server\.'\s\+\s'listen'/g, '')
    .replace(/'npm run '\s\+\s'migrate'/g, '')
    .replace(/'db'\s\+\s':migrate'/g, '')
    .replace(/'\/health'\s\+\s'z'/g, '')
    .replace(/'send'\s\+\s'Line'/g, '')
    .replace(/'send'\s\+\s'Sms'/g, '')
    .replace(/'send'\s\+\s'Email'/g, '')
    .replace(/'webhook\.'\s\+\s'send'/g, '')
    .replace(/'package'\s\+\s'-lock'/g, '');
}

test('Task2336 guard reads source test and doc artifacts as text only', () => {
  for (const relativePath of [
    TASK2335_UNIT_PATH,
    TASK2326_UNIT_PATH,
    TASK2328_GUARD_PATH,
    TASK2334_UNIT_PATH,
    TASK2334_GUARD_PATH,
    FACTORY_PATH,
    APPLICATION_SERVICE_PATH,
    API_MODULE_PATH,
    AUDIT_ADAPTER_PATH,
    TASK2335_DOC_PATH,
    TASK2336_DOC_PATH,
  ]) {
    assert.equal(fs.existsSync(path.join(repoRoot, relativePath)), true, `missing ${relativePath}`);
  }

  const guardSource = read('tests/repairIntake/repairIntakeDraftToCaseDbBackedFullSyntheticChainWithAuditBoundary.static.test.js');
  const topLevelImports = guardSource.split('\n').slice(0, 8).join('\n');

  assert.deepEqual(requireSpecifiers(topLevelImports).sort(), [
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:test',
  ]);
});

test('Task2335 full synthetic chain with audit composition remains visible', () => {
  const source = read(TASK2335_UNIT_PATH);
  const doc = read(TASK2335_DOC_PATH);

  assertIncludesAll(source, [
    "require('../../src/repairIntake/repairIntakeDraftToCaseRuntimePortsFactory')",
    "require('../../src/repairIntake/repairIntakeDraftToCaseApplicationService')",
    "require('../../src/repairIntake/repairIntakeDraftToCaseApiModule')",
    'function createFakeDbClient(calls, options = {})',
    'function createAuditDbClient(calls, options = {})',
    'function createTransactionRunner(calls)',
    'function createCaseRepository(calls)',
    'function createSyntheticChain(options = {})',
    'const runtimePorts = createRepairIntakeDraftToCaseRuntimePorts({',
    'const applicationService = createRepairIntakeDraftToCaseApplicationService({',
    'const apiModule = createRepairIntakeDraftToCaseApiModule({',
    'dbClient,',
    'auditDbClient,',
    'transactionRunner,',
    'caseCreatorCaseRepository: caseRepository',
    'controllerFromApplicationService(applicationService)',
  ], 'Task2335 full synthetic composition');

  assertIncludesAll(doc, [
    'fake draft/idempotency query DB client',
    'fake transaction runner',
    'fake case repository',
    'fake audit DB client',
    '`createRepairIntakeDraftToCaseRuntimePorts`',
    '`createRepairIntakeDraftToCaseApplicationService`',
    '`createRepairIntakeDraftToCaseApiModule`',
  ], 'Task2335 doc composition');
});

test('Task2335 successful path and audit payload coverage remain visible', () => {
  const source = read(TASK2335_UNIT_PATH);

  assertIncludesAll(source, [
    'successful fake full synthetic chain records sanitized audit persistence through runtime factory',
    "call.text.includes('FROM repair_intake_drafts')",
    "call.text.includes('FROM repair_intake_idempotency_records')",
    "call.text.includes('INSERT INTO repair_intake_idempotency_records')",
    "chain.calls.db.some((call) => call.text.toLowerCase().includes('repair_intake_audit_events')), false",
    "'begin'",
    "'tx:create'",
    "'tx:link'",
    "'audit:repair_intake_audit_events'",
    "'commit'",
    "tableName === 'repair_intake_audit_events'",
    'assertAuditPayload(chain.calls.auditDb[0].payload)',
    'assertAuditPayload(chain.calls.auditDb[1].payload)',
    'assertNoUnsafeText(response)',
    'assertDependenciesUnmutated(chain)',
  ], 'Task2335 successful path');

  assertIncludesAll(source, [
    'function assertAuditPayload(payload)',
    "payload.event_type, 'repair_intake_draft_to_case_submission'",
    'payload.organization_id',
    'payload.tenant_id',
    'payload.draft_id',
    'payload.case_id',
    'payload.case_ref',
    'payload.actor_id',
    'payload.actor_type',
    'payload.request_id',
    'payload.decision',
    'payload.outcome',
    'payload.reason_code',
    'payload.safe_metadata',
    'payload.visibility',
    'payload.occurred_at',
    "source: 'repair_intake_draft_to_case_runtime_ports_factory'",
  ], 'Task2335 audit payload');
});

test('Task2335 fail-closed leakage and no-mutation coverage remain visible', () => {
  const source = read(TASK2335_UNIT_PATH);

  assertIncludesAll(source, [
    'fake audit DB throw reject and malformed result fail closed without raw leakage',
    'throwInsert',
    'rejectInsert',
    'malformedResult',
    'REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_SUBMIT_FAILED',
    'missing organization audit event fails before fake audit DB call',
    'REPAIR_INTAKE_DRAFT_CASE_AUDIT_ORGANIZATION_MISSING',
    'cross-organization draft fails closed before transaction and audit persistence',
    'REPAIR_INTAKE_DRAFT_READER_PORT_ADAPTER_DRAFT_NOT_FOUND',
    'wrong idempotency replay scope does not replay attacker data and still records safe audit',
    'case_attacker_task2335',
    'org_attacker_task2335',
  ], 'Task2335 fail-closed coverage');

  assertIncludesAll(source, [
    'raw DB rows',
    'rawRows',
    'SQL',
    'stack',
    'DB error',
    'token',
    'password',
    'secret',
    'provider payload',
    'openai',
    'RAG',
    'vector',
    'billingPayload',
    'settlement',
    'payment',
    'invoice',
    'auditInternal',
    'customer private',
    'contact',
    'address',
    'raw service payloads',
  ], 'Task2335 unsafe marker coverage');

  assertIncludesAll(source, [
    'const beforeRequest = clone(request)',
    'assert.deepEqual(request, beforeRequest)',
    'function assertDependenciesUnmutated(chain)',
    'auditDbClientKeys',
    'caseRepositoryKeys',
    'dbClientKeys',
    'transactionRunnerKeys',
    'draftRow: clone(dbClient.draftRow)',
    'assert.deepEqual(chain.dbClient.draftRow, chain.dependencySnapshot.draftRow)',
  ], 'Task2335 no-mutation coverage');
});

test('accepted runtime audit seam remains composed through fake injected audit DB client only', () => {
  const factory = read(FACTORY_PATH);
  const auditAdapter = read(AUDIT_ADAPTER_PATH);
  const task2334 = read(TASK2334_UNIT_PATH);
  const combined = `${factory}\n${auditAdapter}\n${task2334}`;

  assertIncludesAll(combined, [
    'createRepairIntakeDraftCaseAuditWriterAdapter',
    "const DEFAULT_AUDIT_TABLE_NAME = 'repair_intake_audit_events';",
    'dbClient: isObject(safeOptions.auditDbClient) ? safeOptions.auditDbClient : dbClient',
    'createAuditDbClient(calls, options = {})',
    'ports.auditWriter.recordDraftToCaseDecision',
    "tableName: 'repair_intake_audit_events'",
    'REPAIR_INTAKE_DRAFT_CASE_AUDIT_WRITE_FAILED',
  ], 'accepted runtime audit seam');
});

test('Task2335 executable test and inspected source avoid forbidden runtime coupling', () => {
  const executableText = stripSplitForbiddenMarkerAssertions([
    read(TASK2335_UNIT_PATH),
    read(TASK2326_UNIT_PATH),
    read(FACTORY_PATH),
    read(APPLICATION_SERVICE_PATH),
    read(API_MODULE_PATH),
    read(AUDIT_ADAPTER_PATH),
  ].join('\n'));

  assertExcludesAll(executableText, [
    /\bDATABASE_URL\b/,
    /\bprocess\.env\b/,
    /\bnew\s+Pool\b/,
    /require\(\s*['"](?:pg|knex|sequelize|typeorm|prisma|mysql2|sqlite3|mongodb|mongoose|redis)['"]\s*\)/,
    /\blisten\s*\(/,
    /\bapp\.use\s*\(/,
    /\brouter\./,
    /\bcreateServer\s*\(/,
    /\bdb:migrate\b/i,
    /\bmigrate\s+(?:up|apply|latest|deploy|run)\b/i,
    /\bpsql\b/i,
    /\bcurl\b/i,
    /send(?:Line|Sms|Email|Notification)\s*\(/,
    /webhook\s*\(/i,
    /billing[A-Z]\w*\s*\(/,
    /settlement[A-Z]\w*\s*\(/,
    /invoice[A-Z]\w*\s*\(/,
    /payment[A-Z]\w*\s*\(/,
  ], 'Task2335 executable and source text');

  assertIncludesAll(read(TASK2335_UNIT_PATH), [
    "'process.env.DATA' + 'BASE_URL'",
    "'new ' + 'Pool'",
    "'app.' + 'listen'",
    "'server.' + 'listen'",
    "'npm run ' + 'migrate'",
    "'db' + ':migrate'",
    "'/health' + 'z'",
    "'send' + 'Line'",
    "'send' + 'Sms'",
    "'send' + 'Email'",
    "'webhook.' + 'send'",
    "'package' + '-lock'",
  ], 'Task2335 self-forbidden marker checks');
});

test('Task2336 doc records no-runtime-change and non-authorization boundary', () => {
  const doc = read(TASK2336_DOC_PATH);

  assertIncludesAll(doc, [
    'No runtime/source behavior changed.',
    'reads source, test, and docs as text only',
    'does not import or execute DB clients, migration code, server code, route mounts, endpoint probes, smoke tests, providers, env, Zeabur, or secrets',
    'No DB execution occurred.',
    'No SQL was executed against a real DB.',
    'No migration was created, dry-run, or applied.',
    'Migration 026 was not applied.',
    'No env, Zeabur, secrets, or `DATABASE_URL` values were inspected.',
    'No server/listener was started.',
    'No smoke or endpoint probe was run.',
    'No provider sending occurred.',
    'Task2336 does not authorize DB, migration, smoke, runtime, deploy, staging, or provider execution.',
  ], 'Task2336 doc boundary');
});
