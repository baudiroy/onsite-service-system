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

function functionSlice(source, functionName, nextFunctionName) {
  const start = source.indexOf(`async function ${functionName}`);
  assert.notEqual(start, -1, `missing function ${functionName}`);

  if (!nextFunctionName) {
    return source.slice(start);
  }

  const end = source.indexOf(`async function ${nextFunctionName}`, start);
  assert.notEqual(end, -1, `missing next function ${nextFunctionName}`);

  return source.slice(start, end);
}

test('applicationService source keeps optional idempotency seam concepts and reason codes', () => {
  const source = readSource();

  for (const marker of [
    'idempotencyPort',
    'findExistingDraftToCaseResult',
    'recordDraftToCaseResult',
    'idempotencyPortIsValid',
    'callIdempotencyPort',
    'idempotentReplayEnvelope',
    'REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_IDEMPOTENCY_PORT_REQUIRED',
    'REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_IDEMPOTENCY_FAILED',
  ]) {
    assert.equal(source.includes(marker), true, `missing idempotency marker ${marker}`);
  }
});

test('submitDraftToCase keeps preconditions before find and find before core submit ports', () => {
  const source = readSource();
  const submitSource = functionSlice(source, 'submitDraftToCase');
  const preconditionIndex = submitSource.indexOf('submitPreconditionFailure(input)');
  const findIndex = submitSource.indexOf('findExistingDraftToCaseResult');

  assert.notEqual(preconditionIndex, -1, 'missing submit precondition invocation');
  assert.notEqual(findIndex, -1, 'missing idempotency find invocation');
  assert.equal(preconditionIndex < findIndex, true, 'preconditions must run before idempotency find');

  for (const portCall of [
    'draftReader.getDraftForConversion',
    'casePlanner.planCaseFromDraft',
    'caseCreator.createCaseFromDraft',
    'auditWriter.recordDraftToCaseDecision',
  ]) {
    const portCallIndex = submitSource.indexOf(portCall);

    assert.notEqual(portCallIndex, -1, `missing submit port call ${portCall}`);
    assert.equal(findIndex < portCallIndex, true, `idempotency find must run before ${portCall}`);
  }
});

test('submitDraftToCase keeps replay return before core submit ports and record after normal result', () => {
  const source = readSource();
  const submitSource = functionSlice(source, 'submitDraftToCase');
  const replayCheckIndex = submitSource.indexOf('existingResultIsSuccessful(existingResult)');
  const replayReturnIndex = submitSource.indexOf('return idempotentReplayEnvelope');
  const draftReaderIndex = submitSource.indexOf('draftReader.getDraftForConversion');
  const resultIndex = submitSource.indexOf('const result = submitEnvelope');
  const recordIndex = submitSource.indexOf('recordDraftToCaseResult');

  assert.notEqual(replayCheckIndex, -1, 'missing replay success check');
  assert.notEqual(replayReturnIndex, -1, 'missing replay return');
  assert.notEqual(draftReaderIndex, -1, 'missing draftReader call');
  assert.notEqual(resultIndex, -1, 'missing normal submit result');
  assert.notEqual(recordIndex, -1, 'missing idempotency record call');

  assert.equal(replayCheckIndex < draftReaderIndex, true, 'replay check must happen before draftReader');
  assert.equal(replayReturnIndex < draftReaderIndex, true, 'replay return must happen before draftReader');
  assert.equal(resultIndex < recordIndex, true, 'record must happen after normal submit result creation');
});

test('planDraftToCase does not reference idempotency seam', () => {
  const source = readSource();
  const planSource = functionSlice(source, 'planDraftToCase', 'submitDraftToCase');

  for (const marker of [
    'idempotencyPort',
    'findExistingDraftToCaseResult',
    'recordDraftToCaseResult',
    'idempotentReplayEnvelope',
    'REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_IDEMPOTENCY_FAILED',
  ]) {
    assert.equal(planSource.includes(marker), false, `plan flow must not reference ${marker}`);
  }
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
