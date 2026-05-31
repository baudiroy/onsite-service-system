'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const SOURCE_PATH = 'src/repairIntake/repairIntakeDraftCaseAuditWriterAdapter.js';
const PORT_ADAPTER_PATH = 'src/repairIntake/repairIntakeAuditWriterPortAdapter.js';
const RUNTIME_FACTORY_PATH = 'src/repairIntake/repairIntakeDraftToCaseRuntimePortsFactory.js';
const MIGRATION_PATH = 'migrations/026_create_repair_intake_persistence_tables.sql';
const TASK2330_DOC_PATH = 'docs/task-2330-repair-intake-draft-to-case-audit-persistence-implementation-authorization-packet-no-db-execution-no-migration-no-smoke-no-provider.md';
const TASK2331_DOC_PATH = 'docs/task-2331-repair-intake-draft-to-case-audit-event-persistence-contract-guard-table-shape-alignment-no-db-execution-no-migration-no-smoke-no-provider.md';

function projectPath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(projectPath(relativePath), 'utf8');
}

function functionBlock(source, functionName) {
  const marker = `function ${functionName}`;
  const start = source.indexOf(marker);

  assert.notEqual(start, -1, `missing function ${functionName}`);

  const paramsStart = source.indexOf('(', start);
  let paramsDepth = 0;
  let paramsEnd = -1;

  for (let index = paramsStart; index < source.length; index += 1) {
    const char = source[index];

    if (char === '(') {
      paramsDepth += 1;
    } else if (char === ')') {
      paramsDepth -= 1;

      if (paramsDepth === 0) {
        paramsEnd = index;
        break;
      }
    }
  }

  assert.notEqual(paramsEnd, -1, `unterminated params for ${functionName}`);

  const bodyStart = source.indexOf('{', paramsEnd);
  let bodyDepth = 0;

  for (let index = bodyStart; index < source.length; index += 1) {
    const char = source[index];

    if (char === '{') {
      bodyDepth += 1;
    } else if (char === '}') {
      bodyDepth -= 1;

      if (bodyDepth === 0) {
        return source.slice(start, index + 1);
      }
    }
  }

  assert.fail(`unterminated function ${functionName}`);
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

test('Task2331 static guard reads source doc and migration files as text only', () => {
  for (const relativePath of [
    SOURCE_PATH,
    PORT_ADAPTER_PATH,
    RUNTIME_FACTORY_PATH,
    MIGRATION_PATH,
    TASK2330_DOC_PATH,
    TASK2331_DOC_PATH,
  ]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }

  const guardSource = read('tests/repairIntake/repairIntakeDraftToCaseAuditEventPersistenceBoundary.static.test.js');
  const topLevelImports = guardSource.split('\n').slice(0, 8).join('\n');

  assert.deepEqual(requireSpecifiers(topLevelImports).sort(), [
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:test',
  ]);
});

test('adapter default table and query shape align to migration 026 repair_intake_audit_events', () => {
  const source = read(SOURCE_PATH);
  const migration = read(MIGRATION_PATH);
  const queryText = functionBlock(source, 'queryText');
  const payloadFor = functionBlock(source, 'payloadFor');

  assertIncludesAll(migration, [
    'CREATE TABLE IF NOT EXISTS repair_intake_audit_events',
    'organization_id uuid NOT NULL',
    'tenant_id uuid',
    'event_type text NOT NULL',
    'draft_id uuid REFERENCES repair_intake_drafts(id)',
    'case_id uuid',
    'case_ref text',
    'actor_id uuid',
    'actor_type text',
    'request_id text',
    'decision text',
    'outcome text NOT NULL',
    'reason_code text',
    'safe_metadata jsonb NOT NULL DEFAULT',
    'visibility text NOT NULL DEFAULT',
    'occurred_at timestamptz NOT NULL DEFAULT',
    'retention_until timestamptz',
  ], 'migration 026 audit table');

  assertIncludesAll(source, [
    "const DEFAULT_TABLE_NAME = 'repair_intake_audit_events';",
    "'repair_intake_draft_to_case_submission'",
    "'repair_intake_draft_to_case_permission_denied'",
  ], 'adapter contract');

  assertIncludesAll(queryText, [
    'id, organization_id, tenant_id, event_type, draft_id, case_id, case_ref,',
    'actor_id, actor_type, request_id, decision, outcome, reason_code,',
    'safe_metadata, visibility, occurred_at',
    '$14::jsonb',
    '$16',
  ], 'queryText table shape');

  assertIncludesAll(payloadFor, [
    'tenant_id: auditEvent.tenantId',
    'draft_id: auditEvent.draftId',
    'case_id: auditEvent.caseRef ? auditEvent.caseRef.id || null : null',
    'case_ref: auditEvent.caseRef ? auditEvent.caseRef.ref || auditEvent.caseRef.id || null : null',
    'actor_type: auditEvent.actorType',
    'safe_metadata: auditEvent.safeMetadata',
    'visibility: DEFAULT_VISIBILITY',
    'occurred_at: createdAt',
  ], 'payloadFor table shape');

  assertExcludesAll(queryText, [
    /subject_type/,
    /subject_id/,
    /related_case_id/,
    /required_actions/,
    /idempotency_key/,
  ], 'queryText generic audit shape');
});

test('adapter remains injected and does not introduce global runtime DB route provider AI or billing coupling', () => {
  const source = read(SOURCE_PATH);
  const imports = requireSpecifiers(source);

  assert.deepEqual(imports, []);
  assertIncludesAll(source, [
    'function createRepairIntakeDraftCaseAuditWriterAdapter(options = {})',
    'const dbClient = isObject(safeOptions.dbClient) ? safeOptions.dbClient : null;',
    'function dbClientFor(input, baseClient)',
    'input.tx || baseClient',
  ], 'injected adapter contract');

  assertExcludesAll(source, [
    /\bprocess\.env\b/,
    /\bDATABASE_URL\b/,
    /\bnew\s+Pool\b/,
    /require\(\s*['"](?:pg|knex|sequelize|typeorm|prisma|mysql2|sqlite3|mongodb|mongoose|redis)['"]\s*\)/,
    /listen\s*\(/,
    /app\.use\s*\(/,
    /router\./,
    /send(?:Line|Sms|Email|Notification)\s*\(/,
    /webhook\s*\(/i,
    /openai\s*\(/i,
    /billing[A-Z]\w*\s*\(/,
    /settlement[A-Z]\w*\s*\(/,
    /invoice[A-Z]\w*\s*\(/,
    /payment[A-Z]\w*\s*\(/,
  ], 'adapter forbidden coupling');
});

test('unsafe payload filtering and fail-closed markers remain visible', () => {
  const source = read(SOURCE_PATH);

  assertIncludesAll(source, [
    'const FORBIDDEN_INPUT_FIELDS = new Set([',
    'const FORBIDDEN_TEXT_PATTERNS = Object.freeze([',
    'function safeAuditText(value)',
    'function safeMetadata(auditEvent)',
    'REPAIR_INTAKE_DRAFT_CASE_AUDIT_EVENT_TYPE_INVALID',
    'REPAIR_INTAKE_DRAFT_CASE_AUDIT_OUTCOME_INVALID',
    'REPAIR_INTAKE_DRAFT_CASE_AUDIT_ORGANIZATION_MISSING',
    'REPAIR_INTAKE_DRAFT_CASE_AUDIT_ACTOR_MISSING',
    'REPAIR_INTAKE_DRAFT_CASE_AUDIT_WRITE_FAILED',
  ], 'safe filtering and fail closed markers');
});

test('Task2331 doc freezes decisions without authorizing DB migration smoke or runtime rollout', () => {
  const doc = read(TASK2331_DOC_PATH);

  assertIncludesAll(doc, [
    'No DB execution occurred.',
    'No SQL was executed against a real DB.',
    'No migration was created, dry-run, or applied.',
    'Task2331 does not authorize applying migration 026.',
    'Future implementation remains blocked until PM authorizes one exact bounded task.',
  ], 'Task2331 non-authorization');

  assertIncludesAll(doc, [
    'repair_intake_audit_events',
    'organization and tenant isolation',
    'actor/source/request attribution',
    'event taxonomy',
    'payload allowlist',
    'blocking failure mode',
    'transaction coupling',
    'idempotency/replay markers',
  ], 'Task2331 frozen decisions');

  assertExcludesAll(doc, [
    /```/,
    /\bpsql\b/i,
    /\bnpm\s+run\b/i,
    /\bcurl\b/i,
    /\bnode\s+--test\b/i,
    /\bdb:migrate\b/i,
    /\bmigrate\s+(?:up|apply|latest|deploy|run)\b/i,
  ], 'Task2331 executable commands');
});
