'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const FACTORY_PATH = 'src/repairIntake/repairIntakeDraftToCaseRuntimePortsFactory.js';
const ADAPTER_PATH = 'src/repairIntake/repairIntakeDraftCaseAuditWriterAdapter.js';
const PORT_ADAPTER_PATH = 'src/repairIntake/repairIntakeAuditWriterPortAdapter.js';
const TASK2334_UNIT_PATH = 'tests/repairIntake/repairIntakeDraftToCaseRuntimePortsFactoryAuditPersistenceFakeClient.unit.test.js';
const TASK2333_GUARD_PATH = 'tests/repairIntake/repairIntakeDraftToCaseAuditPersistenceFakeClientWiringBoundary.static.test.js';
const TASK2334_DOC_PATH = 'docs/task-2334-repair-intake-draft-to-case-runtime-ports-factory-audit-persistence-fake-client-wiring-no-db-execution-no-migration-no-smoke-no-provider.md';

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

function functionBlock(source, functionName) {
  const start = source.indexOf(`function ${functionName}`);

  assert.notEqual(start, -1, `missing function ${functionName}`);

  const signatureEnd = source.indexOf(') {', start);
  const bodyStart = source.indexOf('{', signatureEnd);
  let depth = 0;

  for (let index = bodyStart; index < source.length; index += 1) {
    if (source[index] === '{') {
      depth += 1;
    } else if (source[index] === '}') {
      depth -= 1;

      if (depth === 0) {
        return source.slice(start, index + 1);
      }
    }
  }

  throw new Error(`unterminated function ${functionName}`);
}

test('Task2334 guard reads source test and doc artifacts as text only', () => {
  for (const relativePath of [
    FACTORY_PATH,
    ADAPTER_PATH,
    PORT_ADAPTER_PATH,
    TASK2334_UNIT_PATH,
    TASK2333_GUARD_PATH,
    TASK2334_DOC_PATH,
  ]) {
    assert.equal(fs.existsSync(path.join(repoRoot, relativePath)), true, `missing ${relativePath}`);
  }

  const guardSource = read('tests/repairIntake/repairIntakeDraftToCaseRuntimePortsFactoryAuditPersistenceBoundary.static.test.js');

  assert.deepEqual(requireSpecifiers(guardSource).sort(), [
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:test',
  ]);
});

test('runtime factory audit port delegates to accepted audit writer adapter seam', () => {
  const source = read(FACTORY_PATH);
  const createAuditPort = functionBlock(source, 'createAuditPort');
  const createAuditEvent = functionBlock(source, 'createAuditEvent');

  assertIncludesAll(source, [
    "createRepairIntakeDraftCaseAuditWriterAdapter",
    "const DEFAULT_AUDIT_TABLE_NAME = 'repair_intake_audit_events';",
    'const DEFAULT_AUDIT_EVENT_TYPE = \'repair_intake_draft_to_case_submission\';',
    'const DEFAULT_AUDIT_OUTCOME = \'submitted\';',
    'const DEFAULT_AUDIT_REASON_CODE = \'REPAIR_INTAKE_DRAFT_TO_CASE_RUNTIME_PORTS_AUDIT_RECORDED\';',
    'dbClient: isObject(safeOptions.auditDbClient) ? safeOptions.auditDbClient : dbClient',
  ], 'factory audit seam');

  assertIncludesAll(createAuditPort, [
    'createRepairIntakeDraftCaseAuditWriterAdapter({',
    'dbClient,',
    'tableName: DEFAULT_AUDIT_TABLE_NAME',
    'idGenerator: createAuditIdGenerator(generate)',
    'clock: now',
    'auditWriter.recordRepairIntakeDraftToCaseCreated({ auditEvent })',
  ], 'createAuditPort adapter delegation');

  assertExcludesAll(createAuditPort, [
    /dbClient\.query\s*\(/,
    /INSERT\s+INTO\s+repair_intake_audit_events/i,
    /process\.env/,
    /DATABASE_URL/,
  ], 'createAuditPort direct runtime coupling');

  assertIncludesAll(createAuditEvent, [
    'eventType: DEFAULT_AUDIT_EVENT_TYPE',
    'outcome: DEFAULT_AUDIT_OUTCOME',
    'decision: firstString(input.decision) || DEFAULT_AUDIT_OUTCOME',
    'organizationId',
    'tenantId',
    'actorType',
    'requestId',
    "source: 'repair_intake_draft_to_case_runtime_ports_factory'",
    'reasonCode: DEFAULT_AUDIT_REASON_CODE',
    'requiredActions: []',
  ], 'createAuditEvent safe payload mapping');
});

test('Task2334 fake-client unit freezes composition fail-closed leakage and no-mutation coverage', () => {
  const source = read(TASK2334_UNIT_PATH);

  assertIncludesAll(source, [
    'createRepairIntakeDraftToCaseRuntimePorts',
    'createAuditDbClient(calls, options = {})',
    'auditDbClient',
    'ports.auditWriter.recordDraftToCaseDecision',
    'runtime factory composes fake audit persistence through explicit injected audit DB without composition-time calls',
    'assert.deepEqual(calls.mainDb, [])',
    'assert.deepEqual(calls.auditDb, [])',
    "tableName: 'repair_intake_audit_events'",
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
  ], 'Task2334 unit composition and payload markers');

  assertIncludesAll(source, [
    'runtime factory audit writer requires trusted organization before fake DB write',
    'REPAIR_INTAKE_DRAFT_CASE_AUDIT_ORGANIZATION_MISSING',
    'runtime factory audit writer strips unsafe context before fake persistence payload and preserves inputs',
    'request_id, null',
    'runtime factory audit writer fake DB throw reject and malformed result fail closed without raw leakage',
    'throwInsert',
    'rejectInsert',
    'malformedResult',
    'REPAIR_INTAKE_DRAFT_CASE_AUDIT_WRITE_FAILED',
    'JSON.stringify(input)',
    'JSON.stringify(auditDbClient)',
  ], 'Task2334 unit fail-closed and immutability markers');

  assertIncludesAll(source, [
    'raw request body',
    'raw draft input',
    'raw service payloads',
    'raw DB error',
    'raw rows',
    'select *',
    'stack trace',
    'provider payload',
    'token',
    'password',
    'secret',
    'private customer',
    'phone',
    'contact',
    'address',
    'openai',
    'RAG',
    'vector',
    'billing',
    'settlement',
    'payment',
    'invoice',
  ], 'Task2334 unit unsafe marker coverage');
});

test('runtime factory source and Task2334 tests avoid forbidden runtime coupling', () => {
  const executableText = `${read(FACTORY_PATH)}\n${read(TASK2334_UNIT_PATH)}`;

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
  ], 'Task2334 executable text');

  for (const specifier of requireSpecifiers(read(FACTORY_PATH))) {
    assert.doesNotMatch(specifier, /^pg$|postgres|server|app|routes|migrations?|package/, `forbidden import ${specifier}`);
  }
});

test('Task2334 doc records non-authorization of DB migration smoke runtime and provider work', () => {
  const doc = read(TASK2334_DOC_PATH);

  assertIncludesAll(doc, [
    'No DB execution occurred.',
    'No SQL was executed against a real DB.',
    'No migration was created, dry-run, or applied.',
    'Migration 026 was not applied.',
    'No env, Zeabur, secrets, or `DATABASE_URL` values were inspected.',
    'No server/listener was started.',
    'No smoke or endpoint probe was run.',
    'No provider sending occurred.',
    'Task2334 does not authorize DB, migration, smoke, runtime, deploy, staging, or provider execution.',
  ], 'Task2334 non-authorization doc');
});
