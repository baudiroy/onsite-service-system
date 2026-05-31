'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const ADAPTER_PATH = 'src/repairIntake/repairIntakeDraftReaderPortAdapter.js';
const REPOSITORY_PATH = 'src/repairIntake/repairIntakeDraftRepository.js';
const UNIT_TEST_PATH = 'tests/repairIntake/repairIntakeDraftReaderPortAdapterDbBacked.unit.test.js';
const TASK2315_DOC_PATH = 'docs/task-2315-repair-intake-draft-to-case-db-backed-draft-reader-port-adapter-no-db-execution-no-migration-no-smoke-no-provider.md';
const TASK2316_DOC_PATH = 'docs/task-2316-repair-intake-draft-to-case-db-backed-draft-reader-static-boundary-guard-no-runtime-change-no-db-execution-no-migration-no-smoke-no-provider.md';

const SOURCE_FORBIDDEN_RUNTIME_PATTERNS = Object.freeze([
  /\bDATABASE_URL\b/,
  /\bprocess\.env\b/,
  /\bnew\s+Pool\b/,
  /\bpg\.Pool\b/,
  /require\([^)]*(?:app|server|routes|controllers|providers|billing|ai|rag|migrations)/i,
  /\bdb:migrate\b/i,
  /\bmigrat(?:e|ion)\b.*\b(?:apply|run|dry|latest|deploy)\b/i,
  /\bpsql\b/i,
  /\bcurl\s+/i,
  /\bfetch\s*\(/,
  /\baxios\./,
  /\bsupertest\s*\(/,
  /\blisten\s*\(/,
  /\/healthz/i,
  /\bZeabur\b/i,
  /\bsend(?:Line|Sms|Email|Notification|Webhook)\b/,
  /\bwebhookClient\./,
]);

function projectPath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(projectPath(relativePath), 'utf8');
}

function stripConstSetBlock(source, constName) {
  const marker = `const ${constName} = new Set([`;
  const start = source.indexOf(marker);

  if (start === -1) {
    return source;
  }

  const end = source.indexOf(']);', start);

  assert.notEqual(end, -1, `unterminated set ${constName}`);

  return `${source.slice(0, start)}${source.slice(end + 3)}`;
}

function sourceWithoutDenyLists(source) {
  return ['UNSAFE_FIELD_NAMES'].reduce(
    (result, constName) => stripConstSetBlock(result, constName),
    source,
  );
}

function assertIncludesAll(source, markers, label) {
  for (const marker of markers) {
    assert.equal(source.includes(marker), true, `${label} missing marker ${marker}`);
  }
}

function assertDoesNotMatchAny(source, patterns, label) {
  for (const pattern of patterns) {
    assert.doesNotMatch(source, pattern, `${label} should not contain ${pattern}`);
  }
}

test('Task2316 static guard reads source test and doc files only', () => {
  for (const relativePath of [
    ADAPTER_PATH,
    REPOSITORY_PATH,
    UNIT_TEST_PATH,
    TASK2315_DOC_PATH,
    TASK2316_DOC_PATH,
  ]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }
});

test('draft reader adapter freezes trusted draft id organization and fail-closed scope boundary', () => {
  const source = read(ADAPTER_PATH);
  const repairDraftIndex = source.indexOf('input.repairIntakeDraftId');
  const draftIdIndex = source.indexOf('input.draftId');

  assert.notEqual(repairDraftIndex, -1, 'missing trusted repairIntakeDraftId marker');
  assert.notEqual(draftIdIndex, -1, 'missing draftId fallback marker');
  assert.equal(repairDraftIndex < draftIdIndex, true, 'repairIntakeDraftId must be prioritized');

  assertIncludesAll(source, [
    'if (!isObject(input)) {',
    'provide_valid_lookup_input',
    'input.params && input.params.repairIntakeDraftId',
    'input.params && input.params.draftId',
    'input.context && input.context.organizationId',
    'provide_organization_id',
    'if (draft.ok === false) {',
    'function draftReadFailureEnvelope',
    'if (!isObject(draft)) {',
    'function draftMatchesLookup',
    'draftId !== lookup.draftId || organizationId !== lookup.organizationId',
    'return !lookup.tenantId || tenantId === lookup.tenantId',
    'REPAIR_INTAKE_DRAFT_READER_PORT_ADAPTER_SCOPE_MISMATCH',
    'verify_draft_organization_scope',
  ], 'draft reader adapter DB-backed boundary');

  for (const forbiddenClientContext of [
    'input.body',
    'requestBody',
    'draftInput',
    'input.headers',
    'input.query && input.query.organizationId',
    'input.query && input.query.draftId',
  ]) {
    assert.equal(source.includes(forbiddenClientContext), false, `adapter trusts ${forbiddenClientContext}`);
  }
});

test('DB-backed draft repository freezes injected parameterized organization scoped read boundary', () => {
  const source = read(REPOSITORY_PATH);

  assertIncludesAll(source, [
    'const organizationId = safeString(input.organizationId)',
    'provide_organization_id',
    "const clauses = ['id = $1', 'organization_id = $2']",
    'const params = [lookup.draftId, lookup.organizationId]',
    'params.push(lookup.tenantId)',
    'dbClient.query(statement.text, statement.params)',
    'const draft = mapDraftRow(row)',
    'if (!draft) {',
    'draft.draftId !== lookup.draftId || draft.organizationId !== lookup.organizationId',
    'if (lookup.tenantId && draft.tenantId !== lookup.tenantId)',
    'return null',
    'catch (error)',
    'REPAIR_INTAKE_DRAFT_REPOSITORY_QUERY_FAILED',
  ], 'DB-backed draft repository boundary');

  for (const forbiddenReturn of [
    'return row',
    'return rows',
    'error.message',
    'error.stack',
    'throw error',
  ]) {
    assert.equal(source.includes(forbiddenReturn), false, `repository leaks ${forbiddenReturn}`);
  }
});

test('Task2315 focused unit test preserves success fail-closed no-leak and no-mutation coverage', () => {
  const source = read(UNIT_TEST_PATH);

  assertIncludesAll(source, [
    'DB-backed draft reader reads by trusted organization and draft id with sanitized output',
    'client-controlled body draftInput params cannot override trusted context',
    'cross-organization and wrong-tenant rows fail closed',
    'missing draft and malformed rows fail closed',
    'malformed trusted input fails closed before query',
    'query thrown or rejected errors fail closed without raw leakage',
    'input and DB row objects are not mutated',
    "assert.match(calls[0].sql, /id = \\$1/)",
    "assert.match(calls[0].sql, /organization_id = \\$2/)",
    "assert.match(calls[0].sql, /tenant_id = \\$3/)",
    "assert.deepEqual(calls[0].params, ['draft_db_2315', 'org_db_2315', 'tenant_db_2315'])",
  ], 'Task2315 DB-backed unit coverage');
});

test('unsafe leakage coverage remains visible in focused unit test fixtures', () => {
  const source = read(UNIT_TEST_PATH);

  assertIncludesAll(source, [
    'DATABASE_URL=postgres://unsafe',
    'select * from unsafe',
    'unsafe stack trace',
    'unsafe line token',
    'unsafe provider payload',
    'unsafe audit internal',
    'unsafe billing payload',
    'unsafe rag payload',
    'unsafe summary token',
    'unsafe billing token',
    'unsafe customer name',
    'unsafe customer address',
    'case_should_not_escape',
    'token',
    'phone',
    'customerName',
    'address',
  ], 'unsafe leakage fixture coverage');
});

test('adapter and repository source have no direct runtime env provider migration or server behavior', () => {
  const source = [
    sourceWithoutDenyLists(read(ADAPTER_PATH)),
    sourceWithoutDenyLists(read(REPOSITORY_PATH)),
  ].join('\n');

  assertDoesNotMatchAny(source, SOURCE_FORBIDDEN_RUNTIME_PATTERNS, 'adapter/repository source');
});

test('Task2315 and Task2316 docs keep DB runtime work bounded and non-authorized', () => {
  const task2315 = read(TASK2315_DOC_PATH);
  const task2316 = read(TASK2316_DOC_PATH);

  assertIncludesAll(task2315, [
    'Task2315 hardens the smallest DB-backed Repair Intake draft reader seam',
    'does not authorize or perform DB execution against a real database',
    'The same 7 held historical untracked docs remain outside Task2315 scope',
  ], 'Task2315 doc');

  assertIncludesAll(task2316, [
    'no-runtime-change static guard',
    'reads source, test, and doc files as text only',
    'does not import or execute DB, runtime, provider, server, migration, smoke, endpoint, env, Zeabur, or secrets code',
    'PM must still authorize one exact task at a time',
  ], 'Task2316 doc');
});
