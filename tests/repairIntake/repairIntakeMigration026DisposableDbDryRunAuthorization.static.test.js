'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const MIGRATION_026_PATH = 'migrations/026_create_repair_intake_persistence_tables.sql';
const TASK2338_DOC_PATH = 'docs/task-2338-repair-intake-migration-026-disposable-db-dry-run-authorization-packet-no-db-execution-no-migration-apply-no-smoke-no-provider.md';

const RELATED_STATIC_TEXT_PATHS = Object.freeze([
  'docs/task-2314-repair-intake-draft-to-case-db-backed-runtime-implementation-authorization-packet-no-db-execution-no-migration-no-smoke-no-provider.md',
  'docs/task-2329-repair-intake-draft-to-case-db-backed-fake-synthetic-persistence-branch-closure-no-runtime-change-no-db-execution-no-migration-no-smoke-no-provider.md',
  'docs/task-2330-repair-intake-draft-to-case-audit-persistence-implementation-authorization-packet-no-db-execution-no-migration-no-smoke-no-provider.md',
  'docs/task-2337-repair-intake-draft-to-case-audit-persistence-fake-client-branch-closure-no-runtime-change-no-db-execution-no-migration-no-smoke-no-provider.md',
  'tests/repairIntake/repairIntakeDraftToCaseDbBackedImplementationAuthorization.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseAuditPersistenceImplementationAuthorization.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseDbRuntimePortContractBoundary.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseDbBackedFullSyntheticChainWithAuditBoundary.static.test.js',
]);

const EXPECTED_TABLE_MARKERS = Object.freeze([
  'CREATE TABLE IF NOT EXISTS repair_intake_drafts',
  'CREATE TABLE IF NOT EXISTS repair_intake_draft_case_conversions',
  'CREATE TABLE IF NOT EXISTS repair_intake_idempotency_records',
  'CREATE TABLE IF NOT EXISTS repair_intake_audit_events',
]);

const EXPECTED_MIGRATION_MARKERS = Object.freeze([
  'NO DB CONNECTION OR EXECUTION IS AUTHORIZED BY THIS FILE',
  'organization_id uuid NOT NULL',
  'tenant_id uuid',
  'idempotency_key text',
  'safe_request_fingerprint text NOT NULL',
  'safe_metadata jsonb NOT NULL',
  'visibility text NOT NULL DEFAULT',
  'idx_repair_intake_drafts_org_status_created',
  'idx_repair_intake_conversions_org_idempotency',
  'idx_repair_intake_idempotency_org_tenant_operation_key',
  'idx_repair_intake_audit_events_org_request',
]);

const REAL_DB_COMMAND_PATTERNS = Object.freeze([
  /```/,
  /\bpsql\b/i,
  /\bcreatedb\b/i,
  /\bdropdb\b/i,
  /\bpg_dump\b/i,
  /\bpg_restore\b/i,
  /\bDATABASE_URL\s*=/,
  /\bPGPASSWORD\s*=/,
  /\bnpm\s+run\s+(?:db|migrate|migration|smoke|dev|start)\b/i,
  /\bnode\s+.*(?:server|smoke|zeabur|migrate|migration)\b/i,
  /\bdb:migrate\b/i,
  /\bmigrate\s+(?:up|apply|latest|deploy|run|dry-run)\b/i,
  /\bcurl\s+/i,
  /\bapp\.listen\s*\(/,
  /\bserver\.listen\s*\(/,
  /\blisten\s*\(/,
  /\/healthz/i,
]);

const REAL_LOOKING_SECRET_PATTERNS = Object.freeze([
  /postgres(?:ql)?:\/\/[^@\s]+:[^@\s]+@[^/\s]+\/[^\s)]+/i,
  /\b[a-z][a-z0-9_]*:\/\/[^@\s]+:[^@\s]+@/i,
  /\b(?:password|passwd|pwd|secret|token|api[_-]?key)\s*[:=]\s*['"]?[A-Za-z0-9._~+/=-]{12,}/i,
  /\b(?:DATABASE_URL|POSTGRES_URL|POSTGRES_PASSWORD|PGPASSWORD)\s*[:=]\s*['"]?[^'"\s]+/i,
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

function assertExcludesAll(source, patterns, label) {
  for (const pattern of patterns) {
    assert.doesNotMatch(source, pattern, `${label} should not match ${pattern}`);
  }
}

test('Task2338 static guard reads migration doc and related text artifacts only', () => {
  for (const relativePath of [
    MIGRATION_026_PATH,
    TASK2338_DOC_PATH,
    ...RELATED_STATIC_TEXT_PATHS,
  ]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }

  const guardSource = read('tests/repairIntake/repairIntakeMigration026DisposableDbDryRunAuthorization.static.test.js');
  const topLevelImports = guardSource.split('\n').slice(0, 8).join('\n');

  assert.deepEqual(requireSpecifiers(topLevelImports).sort(), [
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:test',
  ]);
});

test('migration 026 contains expected Repair Intake persistence table markers', () => {
  const migration = read(MIGRATION_026_PATH);

  assertIncludesAll(migration, [
    ...EXPECTED_TABLE_MARKERS,
    ...EXPECTED_MIGRATION_MARKERS,
  ], 'migration 026');
});

test('Task2338 packet keeps DB migration execution non-authorized', () => {
  const doc = read(TASK2338_DOC_PATH);

  assertIncludesAll(doc, [
    'Task2338 does not authorize DB execution',
    'SQL execution',
    'migration dry-run',
    'migration apply',
    'migration creation or modification',
    'No DB execution occurred.',
    'No SQL was executed against a real DB.',
    'No migration was created, dry-run, modified, or applied.',
    'Migration 026 was not applied.',
  ], 'Task2338 non-authorization packet');
});

test('Task2338 packet restricts any future dry-run to disposable local or test DB only', () => {
  const doc = read(TASK2338_DOC_PATH);

  assertIncludesAll(doc, [
    'target must be a disposable local/test DB only',
    'no production DB',
    'no staging DB',
    'no shared DB',
    'no Zeabur or shared runtime',
    'any future command must be PM-authorized in a separate exact task',
    'future task must define stop conditions',
    'future task must define rollback/drop policy for the disposable DB',
    'future task must define expected verification output',
  ], 'Task2338 future dry-run requirements');
});

test('Task2338 packet forbids env Zeabur and secrets inspection', () => {
  const doc = read(TASK2338_DOC_PATH);

  assertIncludesAll(doc, [
    'env, Zeabur, or secrets inspection',
    'No `DATABASE_URL`, env, Zeabur, or secrets values were inspected.',
    'no secrets printed',
    'no database URL printed',
  ], 'Task2338 secret boundary');
});

test('Task2338 packet records current fake and synthetic readiness only', () => {
  const doc = read(TASK2338_DOC_PATH);

  assertIncludesAll(doc, [
    'DB-backed draft reader seam exists behind injected fake/query clients.',
    'DB-backed idempotency seam exists behind injected fake/query clients.',
    'DB-backed case creator transaction skeleton exists behind injected fake transaction clients.',
    'Runtime ports factory composes the accepted DB-backed seams through explicit injected dependencies.',
    'Audit persistence fake-client path is aligned to `repair_intake_audit_events`.',
    'The full fake/synthetic chain with audit has passed',
  ], 'Task2338 current readiness');
});

test('Task2338 packet does not include executable real DB commands or credentials', () => {
  const doc = read(TASK2338_DOC_PATH);

  assertExcludesAll(doc, REAL_DB_COMMAND_PATTERNS, 'Task2338 doc executable command boundary');
  assertExcludesAll(doc, REAL_LOOKING_SECRET_PATTERNS, 'Task2338 doc credential boundary');
});

test('Task2338 recommended Task2339 remains non-authorized', () => {
  const doc = read(TASK2338_DOC_PATH);

  assertIncludesAll(doc, [
    'Recommended next exact task, non-authorized by this packet:',
    'Task2339 - Repair Intake Migration 026 Disposable Local/Test DB Dry-Run / Explicit DB Authorization Required',
    'Task2339 must not start unless PM explicitly authorizes DB execution and the disposable DB target.',
    'This Task2338 packet is only preparation and does not itself authorize Task2339.',
  ], 'Task2339 non-authorization boundary');
});
