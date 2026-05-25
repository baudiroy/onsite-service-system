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

test('applicationService source keeps submit precondition concepts and reason codes', () => {
  const source = readSource();

  for (const marker of [
    'function submitPreconditionFailure',
    'idempotencyKey',
    'permissionContext',
    'canCreateCaseFromRepairIntakeDraft',
    'approvalContext',
    'accepted',
    'REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_IDEMPOTENCY_REQUIRED',
    'REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_PERMISSION_REQUIRED',
    'REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_APPROVAL_REQUIRED',
  ]) {
    assert.equal(source.includes(marker), true, `missing submit precondition marker ${marker}`);
  }
});

test('submitDraftToCase validates preconditions before any submit port call', () => {
  const source = readSource();
  const submitSource = functionSlice(source, 'submitDraftToCase');
  const preconditionIndex = submitSource.indexOf('submitPreconditionFailure(input)');

  assert.notEqual(preconditionIndex, -1, 'missing submit precondition invocation');

  for (const portCall of [
    'draftReader.getDraftForConversion',
    'casePlanner.planCaseFromDraft',
    'caseCreator.createCaseFromDraft',
    'auditWriter.recordDraftToCaseDecision',
  ]) {
    const portCallIndex = submitSource.indexOf(portCall);

    assert.notEqual(portCallIndex, -1, `missing submit port call ${portCall}`);
    assert.equal(
      preconditionIndex < portCallIndex,
      true,
      `submit precondition must run before ${portCall}`,
    );
  }
});

test('planDraftToCase is not gated by submit-only preconditions', () => {
  const source = readSource();
  const planSource = functionSlice(source, 'planDraftToCase', 'submitDraftToCase');

  for (const submitOnlyMarker of [
    'submitPreconditionFailure',
    'REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_IDEMPOTENCY_REQUIRED',
    'REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_PERMISSION_REQUIRED',
    'REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_APPROVAL_REQUIRED',
  ]) {
    assert.equal(
      planSource.includes(submitOnlyMarker),
      false,
      `plan flow must not be gated by ${submitOnlyMarker}`,
    );
  }

  assert.match(planSource, /draftReader\.getDraftForConversion/);
  assert.match(planSource, /casePlanner\.planCaseFromDraft/);
  assert.equal(planSource.includes('caseCreator.createCaseFromDraft'), false);
  assert.equal(planSource.includes('auditWriter.recordDraftToCaseDecision'), false);
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
