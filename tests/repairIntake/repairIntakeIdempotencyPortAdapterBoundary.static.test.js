'use strict';

const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const sourcePath = path.join(
  __dirname,
  '../../src/repairIntake/repairIntakeIdempotencyPortAdapter.js',
);

function readSource() {
  return readFileSync(sourcePath, 'utf8');
}

test('idempotency adapter source keeps seam factory, error, and store dependency shape', () => {
  const source = readSource();

  assert.match(source, /class RepairIntakeIdempotencyPortAdapterError extends Error/);
  assert.match(source, /function createRepairIntakeIdempotencyPortAdapter/);
  assert.match(source, /createRepairIntakeIdempotencyPortAdapter,/);
  assert.match(source, /RepairIntakeIdempotencyPortAdapterError,/);
  assert.match(source, /idempotencyStore\.findExistingDraftToCaseResult/);
  assert.match(source, /idempotencyStore\.recordDraftToCaseResult/);
  assert.match(source, /async function findExistingDraftToCaseResult/);
  assert.match(source, /async function recordDraftToCaseResult/);
});

test('idempotency adapter source keeps plain object validation and sanitized input extraction', () => {
  const source = readSource();

  assert.match(source, /function isObject/);
  assert.match(source, /if \(!isObject\(idempotencyStore\)/);
  assert.match(source, /if \(!isObject\(input\)\)/);
  assert.match(source, /function createLookupInput/);
  assert.match(source, /function createRecordInput/);
  assert.match(source, /firstSafeString\(input\.idempotencyKey\)/);
  assert.match(source, /firstSafeString\(input\.draftId\)/);
  assert.match(source, /firstSafeString\(input\.organizationId\)/);
  assert.match(source, /firstSafeString\(input\.tenantId\)/);
  assert.match(source, /firstSafeString\(input\.requestId\)/);
  assert.match(source, /sanitizeValue\(input\.actor\)/);
  assert.match(source, /sanitizeValue\(input\.metadata\)/);
  assert.match(source, /sanitizeValue\(input\.result\)/);
  assert.match(source, /sanitizeValue\(input\.caseRef\)/);
});

test('idempotency adapter source keeps no existing / replay-ready / recorded envelope behavior', () => {
  const source = readSource();

  assert.match(source, /function compactObject/);
  assert.match(source, /function createFailure/);
  assert.match(source, /function noExistingResultEnvelope/);
  assert.match(source, /function replayResult/);
  assert.match(source, /function recordEnvelope/);
  assert.match(source, /function storedValueCaseRef/);
  assert.match(source, /reasonCode:\s*'REPAIR_INTAKE_IDEMPOTENCY_PORT_ADAPTER_NO_EXISTING_RESULT'/);
  assert.match(source, /reasonCode:\s*safeString\(existingResult\.reasonCode\)/);
  assert.match(source, /reasonCode:\s*safeString\(storedResult\.reasonCode\)/);
});

test('idempotency adapter source keeps async sync/async exception sanitization', () => {
  const source = readSource();

  assert.match(source, /try \{/);
  assert.match(source, /await idempotencyStore\.findExistingDraftToCaseResult\(lookup\)/);
  assert.match(source, /await idempotencyStore\.recordDraftToCaseResult\(recordInput\)/);
  assert.match(source, /catch \(error\)/);
  assert.match(source, /return createFailure\('REPAIR_INTAKE_IDEMPOTENCY_PORT_ADAPTER_FIND_FAILED'\)/);
  assert.match(source, /return createFailure\('REPAIR_INTAKE_IDEMPOTENCY_PORT_ADAPTER_RECORD_FAILED'\)/);
  assert.equal(source.includes('error.message'), false);
  assert.equal(source.includes('error.stack'), false);
  assert.equal(source.includes('throw error'), false);
});

test('idempotency adapter source keeps expected sanitized reason codes', () => {
  const source = readSource();

  for (const reasonCode of [
    'REPAIR_INTAKE_IDEMPOTENCY_PORT_ADAPTER_STORE_REQUIRED',
    'REPAIR_INTAKE_IDEMPOTENCY_PORT_ADAPTER_INPUT_INVALID',
    'REPAIR_INTAKE_IDEMPOTENCY_PORT_ADAPTER_FIND_FAILED',
    'REPAIR_INTAKE_IDEMPOTENCY_PORT_ADAPTER_RECORD_FAILED',
    'REPAIR_INTAKE_IDEMPOTENCY_PORT_ADAPTER_NO_EXISTING_RESULT',
    'REPAIR_INTAKE_IDEMPOTENCY_PORT_ADAPTER_REPLAY_READY',
    'REPAIR_INTAKE_IDEMPOTENCY_PORT_ADAPTER_RECORDED',
  ]) {
    assert.equal(source.includes(reasonCode), true, `missing reasonCode ${reasonCode}`);
  }
});

test('idempotency adapter source avoids forbidden runtime and repository coupling markers', () => {
  const source = readSource();

  for (const marker of [
    "require('../db')",
    "require('../repositories')",
    "require('../routes')",
    "require('../controllers')",
    'express()',
    'app.listen',
    'server.listen',
    'fetch(',
    'axios',
    'process.env',
    'DATABASE_URL',
    'lineAccessToken',
    'lineUserId',
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
    assert.equal(source.includes(marker), false, `forbidden marker found: ${marker}`);
  }

  const finalAppointmentMatches = source.match(/finalAppointmentId/g) || [];
  assert.equal(finalAppointmentMatches.length > 0, true);
  assert.match(source, /UNSAFE_FIELD_NAMES/);
  assert.equal(source.includes('finalAppointmentId'), true);
});
