'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const SOURCE_PATH = 'src/repairIntake/repairIntakeDraftCaseAuditWriterAdapter.js';
const FAKE_WIRING_TEST_PATH = 'tests/repairIntake/repairIntakeDraftToCaseAuditPersistenceFakeClientWiring.unit.test.js';
const CONTRACT_TEST_PATH = 'tests/repairIntake/repairIntakeDraftToCaseAuditEventPersistenceContract.unit.test.js';
const CONTRACT_GUARD_PATH = 'tests/repairIntake/repairIntakeDraftToCaseAuditEventPersistenceBoundary.static.test.js';
const TASK2331_DOC_PATH = 'docs/task-2331-repair-intake-draft-to-case-audit-event-persistence-contract-guard-table-shape-alignment-no-db-execution-no-migration-no-smoke-no-provider.md';
const TASK2332_DOC_PATH = 'docs/task-2332-repair-intake-draft-to-case-audit-persistence-fake-client-runtime-wiring-no-db-execution-no-migration-no-smoke-no-provider.md';
const TASK2333_DOC_PATH = 'docs/task-2333-repair-intake-draft-to-case-audit-persistence-fake-client-wiring-static-boundary-guard-no-runtime-change-no-db-execution-no-migration-no-smoke-no-provider.md';

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

function assertExcludesAll(source, patterns, label) {
  for (const pattern of patterns) {
    assert.doesNotMatch(source, pattern, `${label} should not contain ${pattern}`);
  }
}

test('Task2333 guard reads source test and docs as text only', () => {
  for (const relativePath of [
    SOURCE_PATH,
    FAKE_WIRING_TEST_PATH,
    CONTRACT_TEST_PATH,
    CONTRACT_GUARD_PATH,
    TASK2331_DOC_PATH,
    TASK2332_DOC_PATH,
    TASK2333_DOC_PATH,
  ]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }

  const guardSource = read('tests/repairIntake/repairIntakeDraftToCaseAuditPersistenceFakeClientWiringBoundary.static.test.js');
  const topLevelImports = guardSource.split('\n').slice(0, 8).join('\n');

  assert.deepEqual(requireSpecifiers(topLevelImports).sort(), [
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:test',
  ]);
});

test('fake-client wiring test keeps accepted injected application audit composition', () => {
  const source = read(FAKE_WIRING_TEST_PATH);

  assertIncludesAll(source, [
    'createRepairIntakeDraftToCaseApplicationService',
    'createRepairIntakeAuditWriterPortAdapter',
    'createRepairIntakeDraftCaseAuditWriterAdapter',
    'function createFakeDbClient(calls, options = {})',
    'draftReader: {',
    'casePlanner: {',
    'caseCreator: {',
    'getDraftForConversion: async',
    'planCaseFromDraft: async',
    'createCaseFromDraft: async',
    'createService({ dbClient, calls })',
  ], 'fake-client wiring composition');

  assertIncludesAll(source, [
    'tableName: \'repair_intake_audit_events\'',
    'organization_id',
    'tenant_id',
    'event_type',
    'draft_id',
    'case_id',
    'case_ref',
    'actor_id',
    'actor_type',
    'request_id',
    'decision',
    'outcome',
    'reason_code',
    'safe_metadata',
    'visibility',
    'occurred_at',
  ], 'fake-client wiring payload markers');
});

test('fake-client wiring keeps success fail-closed leakage and no-mutation coverage visible', () => {
  const source = read(FAKE_WIRING_TEST_PATH);
  const doc = read(TASK2333_DOC_PATH);
  const adapterSource = read(SOURCE_PATH);
  const coverageText = `${source}\n${doc}\n${adapterSource}`;

  assertIncludesAll(coverageText, [
    'successful application submit writes fake audit persistence payload aligned to repair_intake_audit_events',
    'missing organization and malformed event contract fail closed before fake DB call',
    'fake DB thrown rejected and malformed results fail closed through application submit without raw leakage',
    'unsafe audit context values are stripped before fake persistence payload and inputs remain immutable',
    'REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_SUBMIT_FAILED',
    'malformedResult',
    'throwInsert',
    'rejectInsert',
    'REPAIR_INTAKE_DRAFT_CASE_AUDIT_WRITE_FAILED',
    'JSON.stringify(command)',
    'JSON.stringify(fakeDbClient)',
  ], 'fake-client wiring coverage');

  assertIncludesAll(coverageText, [
    'raw request body',
    'raw draft input',
    'raw service payloads',
    'rawRows',
    'select *',
    'stack trace',
    'providerPayload',
    'token',
    'password',
    'secret',
    'phone',
    'address',
    'AI/RAG/OpenAI/vector markers',
    'openai',
    'vector',
    'billing',
    'settlement',
    'invoice',
    'payment',
    'private customer',
  ], 'unsafe leakage coverage markers');
});

test('adapter keeps malformed fake DB result fail-closed marker', () => {
  const source = read(SOURCE_PATH);

  assertIncludesAll(source, [
    'if (!isObject(result) || result.ok === false)',
    'REPAIR_INTAKE_DRAFT_CASE_AUDIT_WRITE_FAILED',
    'recordWithClient',
    'createRepairIntakeDraftCaseAuditWriterAdapter',
  ], 'adapter fail-closed marker');
});

test('fake-client wiring and docs do not introduce forbidden runtime coupling', () => {
  const fakeTest = read(FAKE_WIRING_TEST_PATH);
  const doc = read(TASK2333_DOC_PATH);
  const source = read(SOURCE_PATH);
  const executableText = `${fakeTest}\n${source}`;

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
    /openai\s*\(/i,
    /billing[A-Z]\w*\s*\(/,
    /settlement[A-Z]\w*\s*\(/,
    /invoice[A-Z]\w*\s*\(/,
    /payment[A-Z]\w*\s*\(/,
  ], 'fake-client wiring forbidden coupling');

  assertIncludesAll(doc, [
    'No runtime/source behavior changed.',
    'No DB execution occurred.',
    'No SQL was executed against a real DB.',
    'No migration was created, dry-run, or applied.',
    'Migration 026 was not applied.',
    'No provider sending occurred.',
  ], 'Task2333 non-authorization');
});
