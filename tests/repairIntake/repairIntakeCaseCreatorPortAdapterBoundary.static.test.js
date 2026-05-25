'use strict';

const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const sourcePath = path.join(
  __dirname,
  '../../src/repairIntake/repairIntakeCaseCreatorPortAdapter.js',
);

function readSource() {
  return readFileSync(sourcePath, 'utf8');
}

test('caseCreator adapter source keeps factory, custom error, and required creation port', () => {
  const source = readSource();

  assert.match(source, /class RepairIntakeCaseCreatorPortAdapterError extends Error/);
  assert.match(source, /function createRepairIntakeCaseCreatorPortAdapter/);
  assert.match(source, /createRepairIntakeCaseCreatorPortAdapter,/);
  assert.match(source, /RepairIntakeCaseCreatorPortAdapterError,/);
  assert.match(source, /caseCreationPort\.createCaseFromDraft/);
  assert.match(source, /async function createCaseFromDraft/);
});

test('caseCreator adapter source keeps plain object, draft, and plan validation', () => {
  const source = readSource();

  assert.match(source, /function isObject/);
  assert.match(source, /if \(!isObject\(input\) \|\| !isObject\(input\.draft\) \|\| !isObject\(input\.plan\)\)/);
  assert.match(source, /!isObject\(creationInput\.draft\) \|\| !isObject\(creationInput\.plan\)/);
  assert.match(source, /provide_valid_creation_input/);
  assert.match(source, /provide_valid_draft_and_plan_summary/);
});

test('caseCreator adapter source keeps safe creation input extraction', () => {
  const source = readSource();

  assert.match(source, /function createCreationInput/);
  assert.match(source, /sanitizeValue\(input\)/);
  assert.match(source, /function draftSummary/);
  assert.match(source, /function planSummary/);
  assert.match(source, /draftId: firstSafeString/);
  assert.match(source, /organizationId: firstSafeString/);
  assert.match(source, /tenantId: firstSafeString/);
  assert.match(source, /requestId: firstSafeString/);
  assert.match(source, /actor: input\.actor/);
  assert.match(source, /metadata: input\.metadata/);
  assert.match(source, /warnings: input\.warnings/);
});

test('caseCreator adapter source keeps sanitized caseRef and failure envelopes', () => {
  const source = readSource();

  assert.match(source, /function sanitizeValue/);
  assert.match(source, /function failureEnvelope/);
  assert.match(source, /function caseRefEnvelope/);
  assert.match(source, /return sanitizeValue\(\{/);
  assert.match(source, /sourceDraftId/);
  assert.match(source, /REPAIR_INTAKE_CASE_CREATOR_PORT_ADAPTER_CASE_CREATED/);
  assert.match(source, /REPAIR_INTAKE_CASE_CREATOR_PORT_ADAPTER_CREATE_FAILED/);
});

test('caseCreator adapter source keeps sync thrown and async rejected creation sanitization', () => {
  const source = readSource();

  assert.match(source, /try \{/);
  assert.match(source, /await caseCreationPort\.createCaseFromDraft\(creationInput\)/);
  assert.match(source, /catch \(error\)/);
  assert.match(source, /return failureEnvelope\('REPAIR_INTAKE_CASE_CREATOR_PORT_ADAPTER_CREATE_FAILED'\)/);
  assert.equal(source.includes('error.message'), false);
  assert.equal(source.includes('error.stack'), false);
  assert.equal(source.includes('throw error'), false);
});

test('caseCreator adapter source keeps expected sanitized reason codes', () => {
  const source = readSource();

  for (const reasonCode of [
    'REPAIR_INTAKE_CASE_CREATOR_PORT_ADAPTER_CREATION_PORT_REQUIRED',
    'REPAIR_INTAKE_CASE_CREATOR_PORT_ADAPTER_INPUT_INVALID',
    'REPAIR_INTAKE_CASE_CREATOR_PORT_ADAPTER_CREATE_FAILED',
    'REPAIR_INTAKE_CASE_CREATOR_PORT_ADAPTER_CASE_CREATED',
  ]) {
    assert.equal(source.includes(reasonCode), true, `missing reasonCode ${reasonCode}`);
  }
});

test('caseCreator adapter source avoids forbidden runtime and repository coupling markers', () => {
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
