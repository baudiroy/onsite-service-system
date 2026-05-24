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

function stripLineComments(source) {
  return source.replace(/\/\/.*$/gm, '');
}

test('controller source keeps input shape validation and input sanitization before service call', () => {
  const source = readSource();

  assert.match(source, /INVALID_HANDLER_INPUT/);
  assert.match(source, /if \(!isObject\(input\)\)/);
  assert.match(source, /REPAIR_INTAKE_DRAFT_TO_CASE_CONTROLLER_PLAN_INPUT_INVALID/);
  assert.match(source, /REPAIR_INTAKE_DRAFT_TO_CASE_CONTROLLER_SUBMIT_INPUT_INVALID/);
  assert.match(source, /UNSAFE_INPUT_FIELD_NAMES/);
  assert.match(source, /function inputFieldIsUnsafe/);
  assert.match(source, /function sanitizeInputValue/);
  assert.match(source, /method\(sanitizeInputValue\(input\)\)/);
});

test('controller source keeps unsafe input field exclusion coverage', () => {
  const source = readSource();

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
    "'app'",
    "'route'",
    "'originalurl'",
    "'baseurl'",
    "'ip'",
    "'ips'",
    "'protocol'",
    "'hostname'",
    "'files'",
    "'file'",
    "'rawbody'",
    "'authorization'",
    "'cookie'",
    "'lineuserid'",
    "'lineaccesstoken'",
    "'phone'",
    "'address'",
    "'customerphone'",
    "'customername'",
    "'finalappointmentid'",
    "'sql'",
    "'db'",
    "'rawrows'",
  ]) {
    assert.equal(source.includes(unsafeField), true, `missing unsafe input field ${unsafeField}`);
  }
});

test('controller source keeps output sanitization and controller failure reason codes', () => {
  const source = readSource();

  assert.match(source, /UNSAFE_OUTPUT_FIELD_NAMES/);
  assert.match(source, /function outputFieldIsUnsafe/);
  assert.match(source, /function sanitizeOutputValue/);
  assert.match(source, /sanitizeOutputValue\(await method\(sanitizeInputValue\(input\)\)\)/);
  assert.match(source, /REPAIR_INTAKE_DRAFT_TO_CASE_CONTROLLER_PLAN_FAILED/);
  assert.match(source, /REPAIR_INTAKE_DRAFT_TO_CASE_CONTROLLER_SUBMIT_FAILED/);
});

test('controller source keeps thrown and rejected error sanitization without raw forwarding', () => {
  const source = readSource();
  const code = stripLineComments(source);

  assert.match(source, /async function callApplicationService/);
  assert.match(source, /catch \(error\)/);
  assert.match(source, /return safeFailure\(failureReasonCode\)/);
  assert.equal(source.includes('error.message'), false);
  assert.equal(source.includes('error.stack'), false);
  assert.equal(source.includes('throw error'), false);
  assert.equal(code.includes('applicationService.planDraftToCase(input)'), false);
  assert.equal(code.includes('applicationService.submitDraftToCase(input)'), false);
  assert.equal(code.includes('method(input)'), false);
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
