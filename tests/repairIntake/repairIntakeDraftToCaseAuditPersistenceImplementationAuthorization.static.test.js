'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const SOURCE_PATHS = Object.freeze({
  auditWriterPortAdapter: 'src/repairIntake/repairIntakeAuditWriterPortAdapter.js',
  draftCaseAuditWriterAdapter: 'src/repairIntake/repairIntakeDraftCaseAuditWriterAdapter.js',
  applicationService: 'src/repairIntake/repairIntakeDraftToCaseApplicationService.js',
  runtimePortsFactory: 'src/repairIntake/repairIntakeDraftToCaseRuntimePortsFactory.js',
  apiModule: 'src/repairIntake/repairIntakeDraftToCaseApiModule.js',
});

const DOC_PATHS = Object.freeze({
  task2217: 'docs/task-2217-repair-intake-draft-to-case-audit-persistence-decision-gate-no-runtime-change-no-db-no-smoke-no-provider.md',
  task2329: 'docs/task-2329-repair-intake-draft-to-case-db-backed-fake-synthetic-persistence-branch-closure-no-runtime-change-no-db-execution-no-migration-no-smoke-no-provider.md',
  task2330: 'docs/task-2330-repair-intake-draft-to-case-audit-persistence-implementation-authorization-packet-no-db-execution-no-migration-no-smoke-no-provider.md',
});

const TEST_PATHS = Object.freeze({
  decisionGate: 'tests/repairIntake/repairIntakeDraftToCaseAuditPersistenceDecisionGate.static.test.js',
  safeAuditContext: 'tests/repairIntake/repairIntakeDraftToCaseSafeAuditContextPropagation.static.test.js',
  permissionDenied: 'tests/repairIntake/repairIntakeDraftToCasePermissionDeniedAuditIntent.static.test.js',
  auditWriterPortUnit: 'tests/repairIntake/repairIntakeAuditWriterPortAdapter.unit.test.js',
});

const MIGRATION_PATH = 'migrations/026_create_repair_intake_persistence_tables.sql';

function projectPath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(projectPath(relativePath), 'utf8');
}

function requireSpecifiers(source) {
  return Array.from(source.matchAll(/require\(\s*['"]([^'"]+)['"]\s*\)/g), (match) => match[1]);
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

function stripConstSetBlock(source, constName) {
  const marker = `const ${constName} = new Set([`;
  const start = source.indexOf(marker);

  if (start === -1) {
    return source;
  }

  const end = source.indexOf(']);', start);

  assert.notEqual(end, -1, `unterminated set ${constName}`);

  return `${source.slice(0, start)}\n${source.slice(end + 3)}`;
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

test('Task2330 inventory guard reads expected source test doc and migration files only', () => {
  for (const relativePath of [
    ...Object.values(SOURCE_PATHS),
    ...Object.values(DOC_PATHS),
    ...Object.values(TEST_PATHS),
    MIGRATION_PATH,
  ]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }

  const guardSource = read('tests/repairIntake/repairIntakeDraftToCaseAuditPersistenceImplementationAuthorization.static.test.js');
  const topLevelImports = guardSource.split('\n').slice(0, 8).join('\n');

  assert.deepEqual(requireSpecifiers(topLevelImports).sort(), [
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:test',
  ]);
});

test('Task2330 packet remains non-authorizing and contains no executable command block', () => {
  const doc = read(DOC_PATHS.task2330);

  assertIncludesAll(doc, [
    'Task2330 does not authorize audit persistence implementation.',
    'Task2330 does not authorize:',
    'DB execution',
    'SQL execution against a real DB',
    'migration creation, dry-run, or apply',
    '`DATABASE_URL`, env, Zeabur, or secrets inspection',
    'server/listener startup',
    'smoke or endpoint probes',
    'provider sending',
    'public/open route expansion',
    'PM must still authorize one exact bounded task at a time.',
  ], 'Task2330 packet');

  assertExcludesAll(doc, [
    /```/,
    /\bpsql\b/i,
    /\bnpm\s+run\b/i,
    /\bcurl\b/i,
    /\bnode\s+--test\b/i,
    /\bdb:migrate\b/i,
    /\bmigrate\s+(?:up|apply|latest|deploy|run)\b/i,
  ], 'Task2330 packet');
});

test('current application audit path remains injected-port based and sanitized', () => {
  const portAdapter = stripConstSetBlock(read(SOURCE_PATHS.auditWriterPortAdapter), 'UNSAFE_FIELD_NAMES');
  const appService = read(SOURCE_PATHS.applicationService);
  const createAuditInput = functionBlock(read(SOURCE_PATHS.auditWriterPortAdapter), 'createAuditInput');
  const submitDraftToCase = functionBlock(appService, 'submitDraftToCase');

  assertIncludesAll(portAdapter, [
    'function createRepairIntakeAuditWriterPortAdapter(options = {})',
    'const { auditPort } = safeOptions;',
    "typeof auditPort.recordDraftToCaseDecision !== 'function'",
    'const auditResult = sanitizeValue(await auditPort.recordDraftToCaseDecision(auditInput));',
    'return failureEnvelope(\'REPAIR_INTAKE_AUDIT_WRITER_PORT_ADAPTER_RECORD_FAILED\');',
  ], 'audit writer port adapter');

  assertIncludesAll(createAuditInput, [
    'organizationId',
    'tenantId',
    'requestId',
    'actorId',
    'actorRole',
    'source',
    'repairIntakeDraftId',
    'return sanitizeValue(compactObject({',
  ], 'createAuditInput');

  assertIncludesAll(submitDraftToCase, [
    'await auditWriter.recordDraftToCaseDecision(createAuditPayload(safeInput, draft, plan, caseRef))',
    'if (portResultFailed(auditEvent))',
    'REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_SUBMIT_FAILED',
  ], 'submitDraftToCase audit path');

  assertExcludesAll(portAdapter, [
    /\.query\s*\(/,
    /\bINSERT\s+INTO\b/i,
    /\bCREATE\s+TABLE\b/i,
    /\bnew\s+Pool\b/,
    /\bDATABASE_URL\b/,
    /\bprocess\.env\b/,
  ], 'audit writer port adapter');
});

test('draft-to-case audit writer adapter DB-capable shape is inventoried but not authorized', () => {
  const adapter = read(SOURCE_PATHS.draftCaseAuditWriterAdapter);
  const doc = read(DOC_PATHS.task2330);

  assertIncludesAll(adapter, [
    "const DEFAULT_TABLE_NAME = 'repair_intake_audit_events';",
    'const AUDIT_EVENT_TYPES = new Set([',
    "'repair_intake_draft_to_case_submission'",
    "'repair_intake_draft_to_case_permission_denied'",
    'function payloadFor({ id, auditEvent, createdAt })',
    'function queryText(tableName)',
    'function dbClientFor(input, baseClient)',
    'createRepairIntakeDraftCaseAuditWriterAdapter',
    "reasonCode: 'REPAIR_INTAKE_DRAFT_CASE_AUDIT_WRITE_FAILED'",
  ], 'draft case audit writer adapter');

  assertIncludesAll(doc, [
    'Current table-name default is `audit_events`, which should be reconciled before any Repair Intake production persistence wiring.',
    'Preferred candidate: `repair_intake_audit_events` from migration 026.',
    'reconcile this target with `repairIntakeDraftCaseAuditWriterAdapter.js`',
    'whose default table name is currently `audit_events`',
  ], 'Task2330 adapter inventory');
});

test('runtime factory audit persistence marker is explicit inventory behind injected dbClient only', () => {
  const factory = read(SOURCE_PATHS.runtimePortsFactory);
  const auditAdapter = read(SOURCE_PATHS.draftCaseAuditWriterAdapter);
  const doc = read(DOC_PATHS.task2330);

  assertIncludesAll(factory, [
    'function createAuditPort({ dbClient, generateId: generate, now })',
    "const DEFAULT_AUDIT_TABLE_NAME = 'repair_intake_audit_events';",
    'createRepairIntakeDraftCaseAuditWriterAdapter({',
    'tableName: DEFAULT_AUDIT_TABLE_NAME',
    'createRepairIntakeAuditWriterPortAdapter({',
    'auditPort,',
    'auditWriter,',
  ], 'runtime ports factory delegated audit inventory');

  assertIncludesAll(auditAdapter, [
    "const DEFAULT_TABLE_NAME = 'repair_intake_audit_events';",
    'function queryText(tableName)',
    '`insert into ${tableName} (`',
    'id, organization_id, tenant_id, event_type, draft_id, case_id, case_ref,',
    'safe_metadata, visibility, occurred_at',
    'function queryValues(payload)',
  ], 'delegated audit adapter insert inventory');

  assertIncludesAll(doc, [
    'Contains a DB-capable `createAuditPort` that targets `repair_intake_audit_events` behind an explicitly injected `dbClient`.',
    'This packet inventories that DB-capable factory marker only',
    'does not authorize real DB execution',
  ], 'Task2330 runtime factory inventory');
});

test('migration audit table candidate is inventoried as authoring-only', () => {
  const migration = read(MIGRATION_PATH);
  const doc = read(DOC_PATHS.task2330);

  assertIncludesAll(migration, [
    'NO DB CONNECTION OR EXECUTION IS AUTHORIZED BY THIS FILE.',
    'CREATE TABLE IF NOT EXISTS repair_intake_audit_events',
    'organization_id uuid NOT NULL',
    'tenant_id uuid',
    'event_type text NOT NULL',
    'draft_id uuid REFERENCES repair_intake_drafts(id)',
    'case_id uuid',
    'actor_id uuid',
    'request_id text',
    'safe_metadata jsonb NOT NULL DEFAULT',
    'retention_until timestamptz',
  ], 'migration audit candidate');

  assertIncludesAll(doc, [
    'Contains an inert authoring-only table proposal for `repair_intake_audit_events`.',
    'apply or dry-run requires a separate task and explicit disposable DB authorization',
    'retention_until',
  ], 'Task2330 migration inventory');
});

test('future audit persistence decisions and recommended next task are explicit', () => {
  const doc = read(DOC_PATHS.task2330);

  assertIncludesAll(doc, [
    'Target Table',
    'Organization And Tenant Isolation',
    'Actor And Source Attribution',
    'Event Type Taxonomy',
    'Payload Minimization',
    'Retention And Deletion',
    'Failure Mode',
    'Transaction Coupling',
    'Idempotency And Replay',
    'Raw Error Handling',
    'Recommended next task: Repair Intake draft-to-case audit event persistence contract guard and table-shape alignment, no DB execution.',
  ], 'Task2330 decisions');
});

test('Task2330 does not introduce provider AI billing package or runtime rollout coupling', () => {
  const doc = read(DOC_PATHS.task2330);

  assertIncludesAll(doc, [
    'provider sending',
    'AI/RAG',
    'billing',
    'package or package-lock changes',
    'staging/prod traffic',
    'deploy',
  ], 'Task2330 explicit non-authorization');

  assertExcludesAll(doc, [
    /send(?:Line|Sms|Email|Notification)\s*\(/,
    /webhook\s*\(/i,
    /openai\s*\(/i,
    /vector(?:Store|Db)?\s*\(/i,
    /billing[A-Z]\w*\s*\(/,
    /settlement[A-Z]\w*\s*\(/,
    /invoice[A-Z]\w*\s*\(/,
    /payment[A-Z]\w*\s*\(/,
    /require\(\s*['"](?:pg|knex|sequelize|typeorm|prisma|mysql2|sqlite3|mongodb|mongoose|redis)['"]\s*\)/,
  ], 'Task2330 doc');
});
