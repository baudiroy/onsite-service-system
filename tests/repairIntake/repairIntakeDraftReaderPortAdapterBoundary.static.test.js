'use strict';

const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const sourcePath = path.join(
  __dirname,
  '../../src/repairIntake/repairIntakeDraftReaderPortAdapter.js',
);

function readSource() {
  return readFileSync(sourcePath, 'utf8');
}

test('draftReader adapter source keeps factory, custom error, and injected port shape', () => {
  const source = readSource();

  assert.match(source, /class RepairIntakeDraftReaderPortAdapterError extends Error/);
  assert.match(source, /function createRepairIntakeDraftReaderPortAdapter/);
  assert.match(source, /createRepairIntakeDraftReaderPortAdapter,/);
  assert.match(source, /RepairIntakeDraftReaderPortAdapterError,/);
  assert.match(source, /draftRepository\.findDraftForConversion/);
  assert.match(source, /async function getDraftForConversion/);
});

test('draftReader adapter source keeps input validation and safe lookup extraction', () => {
  const source = readSource();

  assert.match(source, /function isObject/);
  assert.match(source, /if \(!isObject\(input\)\)/);
  assert.match(source, /function createLookup/);
  assert.match(source, /sanitizeValue\(input\)/);
  assert.match(source, /draftId: firstSafeString\(input\.draftId, input\.params && input\.params\.draftId\)/);
  assert.match(source, /organizationId: firstSafeString/);
  assert.match(source, /tenantId: firstSafeString/);
  assert.match(source, /requestId: firstSafeString/);
  assert.match(source, /actorId: firstSafeString/);
  assert.match(source, /input\.actor && input\.actor\.actorId/);
  assert.match(source, /input\.context && input\.context\.actorId/);
});

test('draftReader adapter source keeps sanitized success and not-found envelopes', () => {
  const source = readSource();

  assert.match(source, /function sanitizeValue/);
  assert.match(source, /function failureEnvelope/);
  assert.match(source, /function draftEnvelope/);
  assert.match(source, /return sanitizeValue\(\{/);
  assert.match(source, /REPAIR_INTAKE_DRAFT_READER_PORT_ADAPTER_DRAFT_READY/);
  assert.match(source, /REPAIR_INTAKE_DRAFT_READER_PORT_ADAPTER_DRAFT_NOT_FOUND/);
  assert.match(source, /verify_draft_exists/);
});

test('draftReader adapter source keeps sync thrown and async rejected read sanitization', () => {
  const source = readSource();

  assert.match(source, /try \{/);
  assert.match(source, /await draftRepository\.findDraftForConversion\(lookup\)/);
  assert.match(source, /catch \(error\)/);
  assert.match(source, /return failureEnvelope\('REPAIR_INTAKE_DRAFT_READER_PORT_ADAPTER_READ_FAILED'\)/);
  assert.equal(source.includes('error.message'), false);
  assert.equal(source.includes('error.stack'), false);
  assert.equal(source.includes('throw error'), false);
});

test('draftReader adapter source keeps expected sanitized reason codes', () => {
  const source = readSource();

  for (const reasonCode of [
    'REPAIR_INTAKE_DRAFT_READER_PORT_ADAPTER_REPOSITORY_REQUIRED',
    'REPAIR_INTAKE_DRAFT_READER_PORT_ADAPTER_INPUT_INVALID',
    'REPAIR_INTAKE_DRAFT_READER_PORT_ADAPTER_DRAFT_NOT_FOUND',
    'REPAIR_INTAKE_DRAFT_READER_PORT_ADAPTER_READ_FAILED',
  ]) {
    assert.equal(source.includes(reasonCode), true, `missing reasonCode ${reasonCode}`);
  }
});

test('draftReader adapter source avoids forbidden runtime and repository coupling markers', () => {
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
    'finalAppointmentId',
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
  ]) {
    assert.equal(source.includes(marker), false, `forbidden marker found: ${marker}`);
  }
});
