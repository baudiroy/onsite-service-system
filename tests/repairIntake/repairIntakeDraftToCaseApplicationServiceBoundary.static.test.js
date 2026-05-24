'use strict';

const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const sourcePath = path.join(
  __dirname,
  '../../src/repairIntake/repairIntakeDraftToCaseApplicationService.js',
);

function readSource() {
  return readFileSync(sourcePath, 'utf8');
}

test('applicationService source keeps factory export and sanitized configuration error', () => {
  const source = readSource();

  assert.match(source, /class RepairIntakeDraftToCaseApplicationServiceError extends Error/);
  assert.match(source, /function createRepairIntakeDraftToCaseApplicationService/);
  assert.match(source, /createRepairIntakeDraftToCaseApplicationService,/);
  assert.match(source, /RepairIntakeDraftToCaseApplicationServiceError,/);
  assert.match(source, /REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_PORTS_REQUIRED/);
});

test('Task1212 injected-consumer application service source keeps factory export and safe envelope markers', () => {
  const source = readSource();

  assert.match(source, /function createRepairIntakeDraftToCaseInjectedConsumerApplicationService/);
  assert.match(source, /createRepairIntakeDraftToCaseInjectedConsumerApplicationService,/);
  assert.match(source, /caseRepositoryConsumer/);
  assert.match(source, /caseRepositoryConsumer\.createCaseFromDraft/);
  assert.match(source, /validateConsumerApplicationRequest/);
  assert.match(source, /createConsumerInput/);
  assert.match(source, /consumerApplicationEnvelope/);
  assert.match(source, /REPAIR_INTAKE_DRAFT_TO_CASE_CONSUMER_APPLICATION_SERVICE_CONSUMER_REQUIRED/);
  assert.match(source, /REPAIR_INTAKE_DRAFT_TO_CASE_CONSUMER_APPLICATION_SERVICE_CONSUMER_METHOD_REQUIRED/);
  assert.match(source, /REPAIR_INTAKE_DRAFT_TO_CASE_CONSUMER_APPLICATION_SERVICE_ORGANIZATION_REQUIRED/);
  assert.match(source, /REPAIR_INTAKE_DRAFT_TO_CASE_CONSUMER_APPLICATION_SERVICE_ACTOR_REQUIRED/);
  assert.match(source, /REPAIR_INTAKE_DRAFT_TO_CASE_CONSUMER_APPLICATION_SERVICE_DRAFT_REQUIRED/);
  assert.match(source, /REPAIR_INTAKE_DRAFT_TO_CASE_CONSUMER_APPLICATION_SERVICE_CONSUMER_FAILED/);
});

test('applicationService source keeps required injected port concepts', () => {
  const source = readSource();

  assert.match(source, /draftReader\.getDraftForConversion/);
  assert.match(source, /casePlanner\.planCaseFromDraft/);
  assert.match(source, /caseCreator\.createCaseFromDraft/);
  assert.match(source, /auditWriter\.recordDraftToCaseDecision/);
  assert.match(source, /portMethodIsValid/);
  assert.match(source, /portsAreValid/);
});

test('applicationService source keeps plan and submit flow boundaries', () => {
  const source = readSource();

  assert.match(source, /async function planDraftToCase/);
  assert.match(source, /async function submitDraftToCase/);
  assert.match(source, /const draft = sanitizeValue\(await draftReader\.getDraftForConversion/);
  assert.match(source, /const plan = sanitizeValue\(await casePlanner\.planCaseFromDraft/);
  assert.match(source, /const caseRef = sanitizeValue\(await caseCreator\.createCaseFromDraft/);
  assert.match(source, /const auditEvent = sanitizeValue\(/);
  assert.match(source, /await auditWriter\.recordDraftToCaseDecision/);
});

test('applicationService source keeps input validation and sanitization concepts', () => {
  const source = readSource();

  assert.match(source, /if \(!isObject\(input\)\)/);
  assert.match(source, /const safeInput = sanitizeValue\(input\)/);
  assert.match(source, /UNSAFE_FIELD_NAMES/);
  assert.match(source, /function fieldIsUnsafe/);
  assert.match(source, /function sanitizeValue/);

  for (const unsafeField of [
    "'sql'",
    "'db'",
    "'databaseurl'",
    "'authorization'",
    "'lineuserid'",
    "'lineaccesstoken'",
    "'phone'",
    "'address'",
    "'customername'",
    "'finalappointmentid'",
    "'rawrows'",
    "'stack'",
    "'error'",
    "'token'",
    "'secret'",
  ]) {
    assert.equal(source.includes(unsafeField), true, `missing unsafe field ${unsafeField}`);
  }
});

test('applicationService source keeps output sanitization and sanitized reasonCodes', () => {
  const source = readSource();

  assert.match(source, /function planEnvelope/);
  assert.match(source, /function submitEnvelope/);
  assert.match(source, /return sanitizeValue\(\{/);
  assert.match(source, /function safeFailure/);
  assert.match(source, /REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_PLAN_INPUT_INVALID/);
  assert.match(source, /REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_SUBMIT_INPUT_INVALID/);
  assert.match(source, /REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_PLAN_FAILED/);
  assert.match(source, /REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_SUBMIT_FAILED/);
});

test('applicationService source keeps thrown and rejected error sanitization without raw forwarding', () => {
  const source = readSource();

  assert.match(source, /catch \(error\)/);
  assert.match(source, /return safeFailure\('REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_PLAN_FAILED'\)/);
  assert.match(source, /return safeFailure\('REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_SUBMIT_FAILED'\)/);
  assert.equal(source.includes('error.message'), false);
  assert.equal(source.includes('error.stack'), false);
  assert.equal(source.includes('throw error'), false);
});

test('applicationService source avoids forbidden runtime and repository coupling markers', () => {
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

test('Task1212 application service unit and boundary tests avoid forbidden runtime coupling markers', () => {
  const unitTestSource = readFileSync(
    path.join(__dirname, './repairIntakeDraftToCaseApplicationService.unit.test.js'),
    'utf8',
  );
  const forbiddenMarkers = [
    'process.env.DATA' + 'BASE_URL',
    'ps' + 'ql',
    'd' + 'b:migrate',
    'listen(',
    'app.listen',
    'server.listen',
    'sendLine',
    'sendSms',
    'sendEmail',
    'webhook',
    'openai',
    'rag',
    'vector',
    'billing',
    'settlement',
    'SELECT ',
    'INSERT ',
    'UPDATE ',
    'DELETE ',
    'CREATE TABLE',
    'ALTER TABLE',
    'DROP TABLE',
  ];

  for (const [label, source] of [
    ['unit test', unitTestSource],
  ]) {
    for (const marker of forbiddenMarkers) {
      assert.equal(source.includes(marker), false, `${label} contains forbidden marker ${marker}`);
    }
  }
});
