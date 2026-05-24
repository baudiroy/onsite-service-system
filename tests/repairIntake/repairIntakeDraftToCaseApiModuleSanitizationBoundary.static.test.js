'use strict';

const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const sourcePath = path.join(
  __dirname,
  '../../src/repairIntake/repairIntakeDraftToCaseApiModule.js',
);

function readSource() {
  return readFileSync(sourcePath, 'utf8');
}

test('API module source keeps controller and applicationService validation guards', () => {
  const source = readSource();

  assert.match(source, /function controllerWasProvided/);
  assert.match(source, /function controllerIsValid/);
  assert.match(source, /typeof controller\.planDraftToCase === 'function'/);
  assert.match(source, /typeof controller\.submitDraftToCase === 'function'/);
  assert.match(source, /function applicationServiceIsValid/);
  assert.match(source, /typeof applicationService\.planDraftToCase === 'function'/);
  assert.match(source, /typeof applicationService\.submitDraftToCase === 'function'/);
  assert.match(source, /REPAIR_INTAKE_DRAFT_TO_CASE_API_MODULE_CONTROLLER_REQUIRED/);
  assert.match(source, /REPAIR_INTAKE_DRAFT_TO_CASE_API_MODULE_APPLICATION_SERVICE_REQUIRED/);
});

test('API module source keeps safe route handler wrapper and request input allowlist', () => {
  const source = readSource();

  assert.match(source, /function createSafeController/);
  assert.match(source, /sanitizeRequestInput\(requestLike\)/);
  assert.match(source, /SAFE_REQUEST_INPUT_FIELDS/);

  for (const safeField of [
    "'actor'",
    "'body'",
    "'context'",
    "'organizationId'",
    "'params'",
    "'query'",
    "'requestId'",
    "'tenantId'",
  ]) {
    assert.equal(source.includes(safeField), true, `missing safe request field ${safeField}`);
  }
});

test('API module source keeps unsafe request/raw runtime field exclusion', () => {
  const source = readSource();

  assert.match(source, /UNSAFE_REQUEST_FIELD_NAMES/);
  assert.match(source, /function requestFieldIsUnsafe/);
  assert.match(source, /requestFieldIsUnsafe\(key\)/);

  for (const unsafeField of [
    "'req'",
    "'res'",
    "'response'",
    "'next'",
    "'socket'",
    "'connection'",
    "'headers'",
    "'rawheaders'",
    "'cookies'",
    "'signedcookies'",
    "'session'",
    "'rawbody'",
    "'authorization'",
    "'cookie'",
    "'lineuserid'",
    "'lineaccesstoken'",
    "'phone'",
    "'address'",
    "'customerphone'",
    "'finalappointmentid'",
    "'sql'",
  ]) {
    assert.equal(source.includes(unsafeField), true, `missing unsafe request field ${unsafeField}`);
  }
});

test('API module source keeps handler output sanitizer and async promise path', () => {
  const source = readSource();

  assert.match(source, /UNSAFE_OUTPUT_FIELD_NAMES/);
  assert.match(source, /function outputFieldIsUnsafe/);
  assert.match(source, /function sanitizeHandlerOutputValue/);
  assert.match(source, /async function sanitizeHandlerOutput/);
  assert.match(source, /await outputPromise/);
  assert.match(source, /sanitizeHandlerOutput\(/);

  for (const unsafeField of [
    "'rawrows'",
    "'databaseurl'",
    "'authorization'",
    "'lineuserid'",
    "'lineaccesstoken'",
    "'phone'",
    "'address'",
    "'customerphone'",
    "'customername'",
    "'finalappointmentid'",
    "'stack'",
    "'error'",
    "'handler'",
    "'controller'",
    "'applicationservice'",
  ]) {
    assert.equal(source.includes(unsafeField), true, `missing unsafe output field ${unsafeField}`);
  }
});

test('API module source preserves sanitized failure reasonCode usage without raw error forwarding', () => {
  const source = readSource();

  assert.match(source, /function failure\(reasonCode/);
  assert.match(source, /reasonCode,/);
  assert.match(source, /requiredActions,/);
  assert.match(source, /catch \(error\)/);
  assert.equal(source.includes('error.message'), false);
  assert.equal(source.includes('error.stack'), false);
  assert.equal(source.includes('throw error'), false);
});

test('API module source avoids forbidden runtime coupling markers', () => {
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
    'lineAccessToken',
    'DATABASE_URL',
    'process.env.DATABASE_URL',
    'finalAppointmentId',
  ]) {
    assert.equal(source.includes(marker), false, `forbidden marker found: ${marker}`);
  }
});
