'use strict';

const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const sourcePath = path.join(
  __dirname,
  '../../src/repairIntake/repairIntakeDraftToCaseController.js',
);

function readSource() {
  return readFileSync(sourcePath, 'utf8');
}

test('controller source keeps factory export and custom sanitized configuration error', () => {
  const source = readSource();

  assert.match(source, /class RepairIntakeDraftToCaseControllerError extends Error/);
  assert.match(source, /function createRepairIntakeDraftToCaseController/);
  assert.match(source, /createRepairIntakeDraftToCaseController,/);
  assert.match(source, /RepairIntakeDraftToCaseControllerError,/);
  assert.match(source, /REPAIR_INTAKE_DRAFT_TO_CASE_CONTROLLER_APPLICATION_SERVICE_REQUIRED/);
  assert.match(source, /configure_application_service/);
});

test('controller source keeps applicationService dependency validation and plan submit handlers', () => {
  const source = readSource();

  assert.match(source, /function applicationServiceIsValid/);
  assert.match(source, /typeof applicationService\.planDraftToCase === 'function'/);
  assert.match(source, /typeof applicationService\.submitDraftToCase === 'function'/);
  assert.match(source, /planDraftToCase: \(input = \{\}\) => callApplicationService/);
  assert.match(source, /submitDraftToCase: \(input = \{\}\) => callApplicationService/);
  assert.match(source, /applicationService\.planDraftToCase/);
  assert.match(source, /applicationService\.submitDraftToCase/);
});

test('controller source keeps output sanitization and failure reason codes', () => {
  const source = readSource();

  assert.match(source, /UNSAFE_OUTPUT_FIELD_NAMES/);
  assert.match(source, /function outputFieldIsUnsafe/);
  assert.match(source, /function sanitizeOutputValue/);
  assert.match(source, /function safeFailure/);
  assert.match(source, /REPAIR_INTAKE_DRAFT_TO_CASE_CONTROLLER_PLAN_FAILED/);
  assert.match(source, /REPAIR_INTAKE_DRAFT_TO_CASE_CONTROLLER_SUBMIT_FAILED/);

  for (const unsafeField of [
    "'sql'",
    "'databaseurl'",
    "'authorization'",
    "'lineuserid'",
    "'lineaccesstoken'",
    "'phone'",
    "'address'",
    "'customername'",
    "'finalappointmentid'",
    "'stack'",
    "'error'",
    "'handler'",
    "'applicationservice'",
  ]) {
    assert.equal(source.includes(unsafeField), true, `missing unsafe output field ${unsafeField}`);
  }
});

test('controller source keeps sync thrown and async rejection sanitization path', () => {
  const source = readSource();

  assert.match(source, /async function callApplicationService/);
  assert.match(source, /await method\(input\)/);
  assert.match(source, /catch \(error\)/);
  assert.match(source, /return safeFailure\(failureReasonCode\)/);
  assert.equal(source.includes('error.message'), false);
  assert.equal(source.includes('error.stack'), false);
  assert.equal(source.includes('throw error'), false);
});

test('controller source avoids forbidden runtime coupling markers', () => {
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
  ]) {
    assert.equal(source.includes(marker), false, `forbidden marker found: ${marker}`);
  }
});
