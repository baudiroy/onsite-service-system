'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const sourcePath = path.join(repoRoot, 'src/repairIntake/repairIntakeDraftRepository.js');

function readSource() {
  return fs.readFileSync(sourcePath, 'utf8');
}

test('repository source exposes expected injected read-only shape', () => {
  const source = readSource();

  assert.match(source, /function createRepairIntakeDraftRepository\(/);
  assert.match(source, /createRepairIntakeDraftRepository,/);
  assert.match(source, /const \{ dbClient \} = safeOptions;/);
  assert.match(source, /assertDbClient\(dbClient\)/);
  assert.match(source, /typeof dbClient\.query !== 'function'/);
  assert.match(source, /async function findDraftForConversion\(input\)/);
  assert.match(source, /findDraftForConversion,/);
});

test('repository source remains SELECT-only for repair_intake_drafts', () => {
  const source = readSource();

  assert.match(source, /'SELECT'/);
  assert.match(source, /FROM repair_intake_drafts/);

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

test('repository source uses parameterized query values without input interpolation into SQL', () => {
  const source = readSource();

  assert.match(source, /const params = \[lookup\.draftId\]/);
  assert.match(source, /id = \$1/);
  assert.match(source, /params\.push\(lookup\.organizationId\)/);
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

test('repository source keeps organization and tenant isolation markers', () => {
  const source = readSource();

  assert.match(source, /organization_id/);
  assert.match(source, /tenant_id/);
  assert.match(source, /organizationId: safeString\(input\.organizationId\)/);
  assert.match(source, /tenantId: safeString\(input\.tenantId\)/);
  assert.match(source, /requestId: safeString\(input\.requestId\)/);
  assert.match(source, /actorId: safeString\(input\.actorId\)/);
  assert.doesNotMatch(source, /request_id\s*=/);
  assert.doesNotMatch(source, /actor_id\s*=/);
});

test('repository source sanitizes unsafe markers and does not return unsafe fields', () => {
  const source = readSource();

  assert.match(source, /UNSAFE_FIELD_NAMES/);
  assert.match(source, /sanitizeNestedValue/);
  assert.match(source, /mapDraftRow/);

  for (const denyMarker of [
    "'phone'",
    "'address'",
    "'customerphone'",
    "'customername'",
    "'lineuserid'",
    "'lineaccesstoken'",
    "'finalappointmentid'",
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
    /phone:/,
    /address:/,
    /customerPhone:/,
    /customerName:/,
    /lineUserId:/,
    /lineAccessToken:/,
    /finalAppointmentId:/,
    /stack:/,
  ]) {
    assert.doesNotMatch(source, forbiddenReturn);
  }
});

test('repository source has no forbidden imports or runtime coupling', () => {
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
