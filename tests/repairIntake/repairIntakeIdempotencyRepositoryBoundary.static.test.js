'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const sourcePath = path.join(repoRoot, 'src/repairIntake/repairIntakeIdempotencyRepository.js');

function readSource() {
  return fs.readFileSync(sourcePath, 'utf8');
}

function extractFunctionBody(source, functionName) {
  const start = source.indexOf(`async function ${functionName}(`);
  assert.notEqual(start, -1, `${functionName} must exist`);
  const nextFunction = source.indexOf('\n  async function ', start + 1);

  return source.slice(start, nextFunction === -1 ? source.length : nextFunction);
}

test('idempotency repository exposes expected injected read-only shape', () => {
  const source = readSource();

  assert.match(source, /function createRepairIntakeIdempotencyRepository\(/);
  assert.match(source, /createRepairIntakeIdempotencyRepository,/);
  assert.match(source, /const \{ dbClient \} = safeOptions;/);
  assert.match(source, /assertDbClient\(dbClient\)/);
  assert.match(source, /typeof dbClient\.query !== 'function'/);
  assert.match(source, /async function findExistingDraftToCaseResult\(input\)/);
  assert.match(source, /async function recordDraftToCaseResult\(/);
  assert.match(source, /findExistingDraftToCaseResult,/);
  assert.match(source, /recordDraftToCaseResult,/);
});

test('recordDraftToCaseResult is fail-closed and does not call dbClient', () => {
  const source = readSource();
  const body = extractFunctionBody(source, 'recordDraftToCaseResult');

  assert.match(body, /WRITER_NOT_IMPLEMENTED/);
  assert.match(body, /throw new RepairIntakeIdempotencyRepositoryError/);
  assert.doesNotMatch(body, /dbClient\.query/);
  assert.doesNotMatch(body, /createSelectStatement/);
});

test('idempotency repository source remains SELECT-only for repair_intake_idempotency_records', () => {
  const source = readSource();

  assert.match(source, /'SELECT'/);
  assert.match(source, /FROM repair_intake_idempotency_records/);

  for (const forbidden of [
    /\bINSERT\b/,
    /\bUPDATE\b/,
    /\bDELETE\b/,
    /\bUPSERT\b/,
    /\bMERGE\b/,
    /\bDROP\s+TABLE\b/,
    /\bTRUNCATE\b/,
    /\bALTER\s+TABLE\s+DROP\b/,
  ]) {
    assert.doesNotMatch(source, forbidden);
  }
});

test('idempotency repository uses parameterized query values without input interpolation into SQL', () => {
  const source = readSource();

  assert.match(source, /const params = \[/);
  assert.match(source, /organization_id = \$1/);
  assert.match(source, /operation_type = \$2/);
  assert.match(source, /idempotency_key = \$3/);
  assert.match(source, /params\.push\(lookup\.tenantId\)/);
  assert.match(source, /dbClient\.query\(statement\.text, statement\.params\)/);

  for (const forbidden of [
    /\$\{lookup\./,
    /\$\{input\./,
    /\+\s*lookup\./,
    /\+\s*input\./,
    /lookup\.[a-zA-Z0-9_]+\s*\+/,
    /input\.[a-zA-Z0-9_]+\s*\+/,
  ]) {
    assert.doesNotMatch(source, forbidden);
  }
});

test('idempotency repository keeps organization tenant operation and idempotency markers', () => {
  const source = readSource();

  assert.match(source, /organization_id/);
  assert.match(source, /tenant_id/);
  assert.match(source, /operation_type/);
  assert.match(source, /idempotency_key/);
  assert.match(source, /const organizationId = safeString\(input\.organizationId\)/);
  assert.match(source, /organizationId,/);
  assert.match(source, /tenantId: safeString\(input\.tenantId\)/);
  assert.match(source, /idempotencyKey: safeString\(row\.idempotency_key\)/);
});

test('idempotency repository sanitizes unsafe markers and does not return unsafe fields', () => {
  const source = readSource();

  assert.match(source, /UNSAFE_FIELD_NAMES/);
  assert.match(source, /sanitizeNestedValue/);
  assert.match(source, /mapReplayRow/);

  for (const denyMarker of [
    "'phone'",
    "'address'",
    "'customerphone'",
    "'customername'",
    "'lineuserid'",
    "'lineaccesstoken'",
    "'finalappointmentid'",
    "'rawrequestbody'",
    "'stack'",
    "'sql'",
    "'rawrow'",
    "'rawrows'",
  ]) {
    assert.match(source, new RegExp(denyMarker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  for (const forbiddenReturn of [
    /rawRow:/,
    /rawRows:/,
    /rawSql:/,
    /credentials:/,
    /rawRequestBody:/,
    /phone:/,
    /address:/,
    /customerPhone:/,
    /customerName:/,
    /lineUserId:/,
    /lineAccessToken:/,
    /finalAppointmentId:/,
  ]) {
    assert.doesNotMatch(source, forbiddenReturn);
  }
});

test('idempotency repository has no forbidden imports or runtime coupling', () => {
  const source = readSource();

  for (const forbidden of [
    /require\([^)]*src\/db/,
    /require\([^)]*src\/repositories/,
    /require\([^)]*app/,
    /require\([^)]*server/,
    /require\([^)]*routes/,
    /require\([^)]*controllers/,
    /require\([^)]*provider/i,
    /require\([^)]*ai/i,
    /require\([^)]*billing/i,
    /require\([^)]*admin/i,
    /process\.env/,
    /DATABASE_URL/,
    /postgres:\/\//,
  ]) {
    assert.doesNotMatch(source, forbidden);
  }
});
