'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const contractSourcePath = path.join(
  repoRoot,
  'src/repairIntake/repairIntakeIdempotencyRepositoryContract.js',
);
const contractIntegrationTestPath = path.join(
  repoRoot,
  'tests/repairIntake/repairIntakeIdempotencyRepositoryContractIntegration.unit.test.js',
);

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function stripConstArrayBlock(source, constName) {
  const marker = `const ${constName} = new Set([`;
  const start = source.indexOf(marker);

  if (start === -1) {
    return source;
  }

  const end = source.indexOf(']);', start);

  if (end === -1) {
    return source;
  }

  return `${source.slice(0, start)}${source.slice(end + 3)}`;
}

test('Task1194 regression guard reads contract source and integration evidence', () => {
  assert.equal(fs.existsSync(contractSourcePath), true);
  assert.equal(fs.existsSync(contractIntegrationTestPath), true);
});

test('Task1194 regression guard keeps safe writer forwarding markers', () => {
  const source = readFile(contractSourcePath);

  for (const marker of [
    'recordDraftToCaseResult',
    'function createWriterRecordInput',
    'idempotencyKey',
    'organizationId',
    'tenantId',
    'requestId',
    'actorId',
    'operationType',
    'draftId',
    'caseId',
    'caseRef',
    'requestFingerprint',
    'safeRequestFingerprint',
    'result',
    'metadata',
    'repository.recordDraftToCaseResult(writerRecordInput)',
  ]) {
    assert.equal(source.includes(marker), true, `missing safe writer forwarding marker ${marker}`);
  }
});

test('Task1194 regression guard keeps writer fail-closed before repository call', () => {
  const source = readFile(contractSourcePath);
  const integration = readFile(contractIntegrationTestPath);

  for (const marker of [
    'if (!safeString(recordInput.idempotencyKey))',
    'if (!safeString(recordInput.organizationId))',
    'if (!firstSafeString(recordInput.safeRequestFingerprint, recordInput.requestFingerprint))',
    'if (!hasUsefulObject(recordInput.result) && !hasUsefulObject(recordInput.caseRef))',
    "['provide_request_fingerprint']",
    "['provide_result_or_case_ref']",
  ]) {
    assert.equal(source.includes(marker), true, `missing fail-closed source marker ${marker}`);
  }

  for (const marker of [
    'contract integration record missing fingerprint fails before synthetic dbClient query',
    'assert.equal(repositoryRecordCalls.length, 0)',
    'assert.equal(calls.length, 0)',
    "requiredActions: ['provide_request_fingerprint']",
  ]) {
    assert.equal(integration.includes(marker), true, `missing fail-closed integration marker ${marker}`);
  }
});

test('Task1194 regression guard blocks unsafe forwarding markers outside deny-list', () => {
  const source = readFile(contractSourcePath);
  const sourceWithoutDenyList = stripConstArrayBlock(source, 'UNSAFE_FIELD_NAMES');

  for (const sensitiveField of [
    'raw',
    'rawRow',
    'rawRows',
    'rawRequestBody',
    'rawSql',
    'sql',
    'query',
    'paramsSql',
    'db',
    'databaseUrl',
    'DATABASE_URL',
    'authorization',
    'cookie',
    'headers',
    'phone',
    'address',
    'customerPhone',
    'customerName',
    'lineUserId',
    'lineAccessToken',
    'finalAppointmentId',
    'stack',
    'error',
    'connection',
    'token',
    'secret',
  ]) {
    assert.equal(source.includes(`'${sensitiveField}'`), true, `missing deny-list field ${sensitiveField}`);
    assert.equal(
      sourceWithoutDenyList.includes(`'${sensitiveField}'`),
      false,
      `sensitive field escaped deny-list ${sensitiveField}`,
    );
  }
});

test('Task1194 regression guard keeps integration evidence for synthetic writer path', () => {
  const integration = readFile(contractIntegrationTestPath);

  for (const marker of [
    'contract integration record success path forwards sanitized writer input to synthetic dbClient',
    'repositoryRecordCalls[0]',
    "safeRequestFingerprint: 'fingerprint_1180'",
    'assert.equal(calls.length, 1)',
    'assert.match(calls[0].sql, /^INSERT INTO repair_intake_idempotency_records/)',
    'assert.match(calls[0].sql, /ON CONFLICT/)',
    'assert.match(calls[0].sql, /DO NOTHING/)',
    "assert.equal(calls[0].sql.includes('fingerprint_1180'), false)",
    'assertNoUnsafeText(result)',
  ]) {
    assert.equal(integration.includes(marker), true, `missing synthetic writer integration marker ${marker}`);
  }
});

test('Task1194 regression guard keeps forbidden coupling out of contract and integration sources', () => {
  const contractWithoutDenyList = stripConstArrayBlock(readFile(contractSourcePath), 'UNSAFE_FIELD_NAMES');
  const integration = readFile(contractIntegrationTestPath);
  const combined = [contractWithoutDenyList, integration].join('\n');

  for (const forbidden of [
    /require\([^)]*src\/db/,
    /require\([^)]*src\/app/,
    /require\([^)]*src\/server/,
    /require\([^)]*src\/routes/,
    /require\([^)]*src\/controllers/,
    /require\([^)]*\/provider(?:\/|['"])/i,
    /require\([^)]*\/admin(?:\/|['"])/i,
    /require\([^)]*\/ai(?:\/|['"])/i,
    /require\([^)]*\/billing(?:\/|['"])/i,
    /process\.env/,
    /app\.listen/,
    /server\.listen/,
    /new\s+Pool\(/,
    /pg\./,
    /knex/,
    /sequelize/,
  ]) {
    assert.doesNotMatch(combined, forbidden);
  }

  for (const forbiddenContractRuntimeMarker of [
    /DATABASE_URL\s*=/,
    /postgres:\/\//,
  ]) {
    assert.doesNotMatch(contractWithoutDenyList, forbiddenContractRuntimeMarker);
  }
});
