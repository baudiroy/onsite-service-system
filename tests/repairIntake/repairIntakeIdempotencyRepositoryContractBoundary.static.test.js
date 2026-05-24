'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const CONTRACT_SOURCE_PATH = path.resolve(
  __dirname,
  '../../src/repairIntake/repairIntakeIdempotencyRepositoryContract.js',
);

function readContractSource() {
  return fs.readFileSync(CONTRACT_SOURCE_PATH, 'utf8');
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

function sourceWithoutAllowedDenyList(source) {
  return stripConstArrayBlock(source, 'UNSAFE_FIELD_NAMES');
}

test('Task1086 static boundary reads the idempotency repository contract source', () => {
  assert.equal(fs.existsSync(CONTRACT_SOURCE_PATH), true);
});

test('Task1085 idempotency contract source keeps expected contract markers and reason codes', () => {
  const source = readContractSource();

  for (const marker of [
    'createRepairIntakeIdempotencyRepositoryContract',
    'findExistingDraftToCaseResult',
    'recordDraftToCaseResult',
    'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_CONTRACT_REQUIRED',
    'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_CONTRACT_INPUT_INVALID',
    'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_CONTRACT_FIND_FAILED',
    'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_CONTRACT_RECORD_FAILED',
    'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_CONTRACT_NO_EXISTING_RESULT',
    'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_CONTRACT_REPLAY_READY',
    'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_CONTRACT_RECORDED',
  ]) {
    assert.equal(source.includes(marker), true, `missing idempotency contract marker ${marker}`);
  }
});

test('Task1085 idempotency contract source keeps fail-closed validation and envelope concepts', () => {
  const source = readContractSource();

  for (const marker of [
    'function isPlainObject',
    'function failureEnvelope',
    'function noExistingEnvelope',
    'function replayEnvelope',
    'function recordedEnvelope',
    'function createWriterRecordInput',
    'if (!isPlainObject(input))',
    'if (!safeString(lookup.idempotencyKey))',
    'if (!safeString(recordInput.idempotencyKey))',
    'if (!safeString(recordInput.organizationId))',
    'if (!firstSafeString(recordInput.safeRequestFingerprint, recordInput.requestFingerprint))',
    'if (!hasUsefulObject(recordInput.result) && !hasUsefulObject(recordInput.caseRef))',
    'repository.findExistingDraftToCaseResult(lookup)',
    'repository.recordDraftToCaseResult(writerRecordInput)',
    'return noExistingEnvelope(lookup)',
    'return replayEnvelope(lookup, existingResult)',
    'return recordedEnvelope(recordInput, storedResult)',
    "REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_CONTRACT_FIND_FAILED",
    "REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_CONTRACT_RECORD_FAILED",
  ]) {
    assert.equal(source.includes(marker), true, `missing fail-closed marker ${marker}`);
  }

  assert.equal((source.match(/catch \(error\)/g) || []).length >= 2, true);
});

test('Task1085 idempotency contract source keeps safe lookup, record, and result field allow-list', () => {
  const source = readContractSource();

  for (const fieldName of [
    'idempotencyKey',
    'draftId',
    'caseId',
    'caseRef',
    'organizationId',
    'tenantId',
    'requestId',
    'actorId',
    'status',
    'submitted',
    'result',
    'metadata',
    'warnings',
    'recordId',
    'requiredActions',
    'reasonCode',
    'operationType',
    'action',
    'requestFingerprint',
    'safeRequestFingerprint',
    'plan',
    'auditEvent',
  ]) {
    assert.match(
      source,
      new RegExp(`'${fieldName}'`),
      `missing safe field allow-list marker ${fieldName}`,
    );
  }

  assert.equal(source.includes('sanitizeContractFields(input)'), true);
  assert.equal(source.includes('sanitizeContractFields(existingResult)'), true);
  assert.equal(source.includes('sanitizeContractFields(storedResult)'), true);
});

test('Task1085 idempotency contract source lists sensitive fields only as deny-list markers where practical', () => {
  const source = readContractSource();
  const sourceWithoutDenyList = sourceWithoutAllowedDenyList(source);

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
    'repository',
    'connection',
    'token',
    'secret',
  ]) {
    assert.equal(source.includes(`'${sensitiveField}'`), true, `missing deny-list marker ${sensitiveField}`);
  }

  for (const forbiddenOutsideDenyList of [
    "'raw'",
    "'rawRow'",
    "'rawRows'",
    "'rawRequestBody'",
    "'rawSql'",
    "'sql'",
    "'query'",
    "'paramsSql'",
    "'db'",
    "'databaseUrl'",
    "'DATABASE_URL'",
    "'authorization'",
    "'cookie'",
    "'headers'",
    "'phone'",
    "'address'",
    "'customerPhone'",
    "'customerName'",
    "'lineUserId'",
    "'lineAccessToken'",
    "'finalAppointmentId'",
    "'stack'",
    "'error'",
    "'connection'",
    "'token'",
    "'secret'",
  ]) {
    assert.equal(
      sourceWithoutDenyList.includes(forbiddenOutsideDenyList),
      false,
      `sensitive field escaped deny-list ${forbiddenOutsideDenyList}`,
    );
  }
});

test('Task1085 idempotency contract source avoids forbidden DB, repository writer, runtime, provider, and API coupling', () => {
  const source = sourceWithoutAllowedDenyList(readContractSource());

  for (const forbidden of [
    "require('../db')",
    "require('../repositories')",
    "require('../routes')",
    "require('../controllers')",
    "require('../app')",
    "require('../server')",
    'src/db',
    'src/repositories',
    'src/routes',
    'src/controllers',
    'src/app',
    'src/server',
    'express()',
    'app.listen',
    'server.listen',
    'fetch(',
    'axios',
    'process.env',
    'DATABASE_URL',
    'INSERT INTO',
    'UPDATE ',
    'DELETE FROM',
    'SELECT ',
    'new DraftRepository',
    'new CaseRepository',
    'Pool(',
    'pg',
    'knex',
    'sequelize',
    'mongoose',
    'sendLine',
    'sendSms',
    'sendEmail',
    'openai',
    'vector',
    'billing',
    'invoice',
    'payment',
  ]) {
    assert.equal(source.includes(forbidden), false, `forbidden idempotency contract marker ${forbidden}`);
  }

  assert.doesNotMatch(source, /(^|[^'"])listen\(/, 'forbidden bare listen call');
});
