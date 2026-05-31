'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const adapterPath = path.join(repoRoot, 'src/repairIntake/repairIntakeIdempotencyPortAdapter.js');
const repositoryPath = path.join(repoRoot, 'src/repairIntake/repairIntakeIdempotencyRepository.js');
const unitPath = path.join(repoRoot, 'tests/repairIntake/repairIntakeIdempotencyPortAdapterDbBacked.unit.test.js');
const task2317DocPath = path.join(
  repoRoot,
  'docs/task-2317-repair-intake-draft-to-case-db-backed-idempotency-port-adapter-no-db-execution-no-migration-no-smoke-no-provider.md',
);
const task2318DocPath = path.join(
  repoRoot,
  'docs/task-2318-repair-intake-draft-to-case-db-backed-idempotency-port-static-boundary-guard-no-runtime-change-no-db-execution-no-migration-no-smoke-no-provider.md',
);

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function sourceSet() {
  return {
    adapter: read(adapterPath),
    repository: read(repositoryPath),
    unit: read(unitPath),
    task2317Doc: read(task2317DocPath),
    task2318Doc: read(task2318DocPath),
  };
}

test('Task2318 static guard reads source test and docs as text only', () => {
  const currentSource = read(__filename);

  assert.match(currentSource, /fs\.readFileSync/);
  assert.match(currentSource, /repairIntakeIdempotencyPortAdapter\.js/);
  assert.match(currentSource, /repairIntakeIdempotencyRepository\.js/);
  assert.match(currentSource, /repairIntakeIdempotencyPortAdapterDbBacked\.unit\.test\.js/);
  assert.match(currentSource, /task-2317-repair-intake-draft-to-case-db-backed-idempotency-port-adapter/);
  assert.match(currentSource, /task-2318-repair-intake-draft-to-case-db-backed-idempotency-port-static-boundary-guard/);

  assert.doesNotMatch(currentSource, /require\('\.\.\/\.\.\/src\/repairIntake\/repairIntakeIdempotency/);
  assert.doesNotMatch(currentSource, /const\s+\{\s*createRepairIntakeIdempotency/);
  assert.doesNotMatch(currentSource, /await\s+.*dbClient\.query/);
});

test('adapter keeps trusted idempotency context and ignores client-controlled scope', () => {
  const { adapter, unit } = sourceSet();

  assert.match(adapter, /function createLookupInput\(input\)/);
  assert.match(adapter, /function createRecordInput\(input\)/);
  assert.match(adapter, /idempotencyKey: firstSafeString\(input\.idempotencyKey\)/);
  assert.match(adapter, /draftId: firstSafeString\(input\.repairIntakeDraftId, input\.draftId\)/);
  assert.match(adapter, /organizationId: firstSafeString\(input\.organizationId\)/);
  assert.match(adapter, /tenantId: firstSafeString\(input\.tenantId\)/);
  assert.match(adapter, /safeRequestFingerprint: firstSafeString\(input\.safeRequestFingerprint, input\.requestFingerprint\)/);
  assert.match(adapter, /for \(const key of \['idempotencyKey', 'draftId', 'organizationId'\]\)/);
  assert.match(adapter, /safeString\(context\.tenantId\)/);

  for (const forbiddenTrustedSource of [
    /input\.body\s*&&\s*input\.body\.organizationId/,
    /input\.body\s*&&\s*input\.body\.draftId/,
    /input\.body\s*&&\s*input\.body\.idempotencyKey/,
    /input\.draftInput\s*&&\s*input\.draftInput\.organizationId/,
    /input\.draftInput\s*&&\s*input\.draftInput\.draftId/,
    /input\.draftInput\s*&&\s*input\.draftInput\.idempotencyKey/,
    /input\.query\s*&&\s*input\.query\.idempotencyKey/,
    /input\.headers\s*&&\s*input\.headers/,
    /input\.client\s*&&\s*input\.client/,
  ]) {
    assert.doesNotMatch(adapter, forbiddenTrustedSource);
  }

  assert.match(unit, /body draftInput and client-controlled fields cannot override trusted top-level scope/);
  assert.match(unit, /org_attacker/);
  assert.match(unit, /draft_attacker/);
  assert.match(unit, /idem_attacker/);
  assert.match(unit, /assert\.deepEqual\(calls\[0\]\.params/);
});

test('repository lookup and record paths keep organization operation key draft and tenant scoping', () => {
  const { repository, unit } = sourceSet();

  assert.match(repository, /const draftId = firstSafeString\(input\.draftId, input\.repairIntakeDraftId\)/);
  assert.match(repository, /'organization_id = \$1'/);
  assert.match(repository, /'operation_type = \$2'/);
  assert.match(repository, /'idempotency_key = \$3'/);
  assert.match(repository, /'draft_id = \$4'/);
  assert.match(repository, /params\.push\(lookup\.tenantId\)/);
  assert.equal(repository.includes('clauses.push(`tenant_id = $${params.length}`);'), true);
  assert.match(repository, /record\.organizationId/);
  assert.match(repository, /record\.tenantId/);
  assert.match(repository, /record\.idempotencyKey/);
  assert.match(repository, /record\.operationType/);
  assert.match(repository, /record\.draftId/);
  assert.match(repository, /record\.safeRequestFingerprint/);

  assert.match(unit, /organization_id = \\\$1/);
  assert.match(unit, /operation_type = \\\$2/);
  assert.match(unit, /idempotency_key = \\\$3/);
  assert.match(unit, /draft_id = \\\$4/);
  assert.match(unit, /tenant_id = \\\$5/);
  assert.match(unit, /'org_2317',\s*'draft_to_case',\s*'idem_2317',\s*'draft_2317',\s*'tenant_2317'/);
});

test('repository row mapping fails closed instead of backfilling malformed scoped fields', () => {
  const { repository } = sourceSet();

  assert.match(repository, /function rowMatchesScope\(row, scope\)/);
  assert.match(repository, /safeString\(row\.organization_id\) === safeString\(scope\.organizationId\)/);
  assert.match(repository, /safeString\(row\.operation_type\) === safeString\(scope\.operationType\)/);
  assert.match(repository, /safeString\(row\.idempotency_key\) === safeString\(scope\.idempotencyKey\)/);
  assert.match(repository, /safeString\(row\.draft_id\) === safeString\(scope\.draftId\)/);
  assert.match(repository, /!safeString\(scope\.tenantId\) \|\| safeString\(row\.tenant_id\) === safeString\(scope\.tenantId\)/);
  assert.match(repository, /if \(!rowMatchesScope\(row, lookup\)\) \{\s*return null;\s*\}/);
  assert.match(repository, /if \(!isPlainObject\(row\) \|\| !rowMatchesScope\(row, record\)\) \{\s*return null;\s*\}/);

  for (const forbiddenBackfill of [
    /safeString\(row\.organization_id\) \|\| lookup\.organizationId/,
    /safeString\(row\.draft_id\) \|\| lookup\.draftId/,
    /safeString\(row\.idempotency_key\) \|\| lookup\.idempotencyKey/,
    /firstSafeString\(source\.organization_id, record\.organizationId\)/,
    /firstSafeString\(source\.draft_id, replayResult\.draftId, record\.draftId\)/,
    /firstSafeString\(source\.idempotency_key, record\.idempotencyKey\)/,
  ]) {
    assert.doesNotMatch(repository, forbiddenBackfill);
  }
});

test('malformed lookup and write results fail closed without invented success', () => {
  const { adapter, repository, unit, task2317Doc } = sourceSet();

  assert.match(adapter, /REPAIR_INTAKE_IDEMPOTENCY_PORT_ADAPTER_SCOPE_MISMATCH/);
  assert.match(adapter, /verify_idempotency_scope/);
  assert.match(adapter, /if \(!ensureStoreResult\(storedResult\)\)/);
  assert.match(adapter, /REPAIR_INTAKE_IDEMPOTENCY_PORT_ADAPTER_RECORD_FAILED/);
  assert.match(adapter, /if \(!scopedResultMatchesContext\(storedResult, recordInput\)\)/);
  assert.doesNotMatch(adapter, /storedResult \|\| \{ ok: true/);

  assert.match(repository, /if \(!row\) \{\s*return null;\s*\}/);
  assert.match(repository, /throw new Error\('malformed_idempotency_replay_row'\)/);
  assert.match(repository, /throw new Error\('malformed_idempotency_record_row'\)/);
  assert.match(repository, /REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_QUERY_FAILED/);
  assert.match(repository, /REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_RECORD_FAILED/);

  assert.match(unit, /fails closed on cross-org and wrong-tenant rows/);
  assert.match(unit, /malformed row and write result fail closed without raw leakage/);
  assert.match(unit, /query thrown or rejected fails closed without stack or secret leakage/);
  assert.equal(
    task2317Doc.includes('Missing/malformed context, malformed replay/write rows, cross-org/wrong-tenant rows, repository/query failures, and missing write rows fail closed'),
    true,
  );
});

test('raw leakage and mutation regression coverage remains present', () => {
  const { adapter, repository, unit, task2318Doc } = sourceSet();

  for (const marker of [
    'rawRows',
    'rawRow',
    'rawResult',
    'rawRequestBody',
    'rawSql',
    'SELECT *',
    'unsafe stack',
    'unsafe token',
    'unsafe password',
    'unsafe secret',
    'unsafe provider',
    'unsafe ai',
    'unsafe rag',
    'unsafe billing',
    'unsafe audit',
    'unsafe customer',
    'unsafe phone',
    'unsafe address',
  ]) {
    assert.equal(unit.includes(marker), true, `unit fixture must include ${marker}`);
  }

  for (const denyMarker of [
    "'password'",
    "'secret'",
    "'token'",
    "'rawrequestbody'",
    "'rawrow'",
    "'rawrows'",
    "'auditinternals'",
    "'customeraddress'",
    "'customerphone'",
    "'rag'",
  ]) {
    assert.equal(adapter.includes(denyMarker) || repository.includes(denyMarker), true, `missing deny marker ${denyMarker}`);
  }

  assert.match(unit, /const before = clone\(input\)/);
  assert.match(unit, /assert\.deepEqual\(input, before\)/);
  assert.equal(task2318Doc.includes('inputs and raw row/result objects are not mutated'), true);
});

test('adapter and repository sources avoid forbidden runtime env provider and deployment behavior', () => {
  const { adapter, repository } = sourceSet();
  const combinedSource = `${adapter}\n${repository}`;

  for (const forbidden of [
    'DATABASE_URL',
    'process.env',
    'new Pool',
    'Pool(',
    'pg.Pool',
    "require('pg')",
    'createServer',
    'app.listen',
    'server.listen',
    'migrate',
    'migration',
    'smoke',
    'endpoint',
    'deploy',
    'Zeabur',
    'zeabur',
    'sendLine',
    'sendSms',
    'sendEmail',
    'webhook',
    'openai',
    'vector',
    'invoice',
    'payment',
    'settlement',
  ]) {
    assert.equal(combinedSource.includes(forbidden), false, `forbidden runtime marker found: ${forbidden}`);
  }

  assert.match(combinedSource, /dbClient\.query\(statement\.text, statement\.params\)/);
  assert.doesNotMatch(combinedSource, /require\([^)]*app/);
  assert.doesNotMatch(combinedSource, /require\([^)]*server/);
  assert.doesNotMatch(combinedSource, /require\([^)]*routes/);
  assert.doesNotMatch(combinedSource, /require\([^)]*controllers/);
});
