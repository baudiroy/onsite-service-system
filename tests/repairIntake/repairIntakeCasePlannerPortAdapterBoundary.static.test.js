'use strict';

const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const sourcePath = path.join(
  __dirname,
  '../../src/repairIntake/repairIntakeCasePlannerPortAdapter.js',
);

function readSource() {
  return readFileSync(sourcePath, 'utf8');
}

test('casePlanner adapter source keeps factory, custom error, and optional policy shape', () => {
  const source = readSource();

  assert.match(source, /class RepairIntakeCasePlannerPortAdapterError extends Error/);
  assert.match(source, /function createRepairIntakeCasePlannerPortAdapter/);
  assert.match(source, /createRepairIntakeCasePlannerPortAdapter,/);
  assert.match(source, /RepairIntakeCasePlannerPortAdapterError,/);
  assert.match(source, /planningPolicy\.planCaseFromDraft/);
  assert.match(source, /async function planCaseFromDraft/);
});

test('casePlanner adapter source keeps plain object and draft object validation', () => {
  const source = readSource();

  assert.match(source, /function isObject/);
  assert.match(source, /if \(!isObject\(input\) \|\| !isObject\(input\.draft\)\)/);
  assert.match(source, /!safeString\(planningInput\.draftId\) \|\| !isObject\(planningInput\.draft\)/);
  assert.match(source, /provide_valid_planning_input/);
  assert.match(source, /provide_valid_draft_summary/);
});

test('casePlanner adapter source keeps safe planning input extraction', () => {
  const source = readSource();

  assert.match(source, /function createPlanningInput/);
  assert.match(source, /sanitizeValue\(input\)/);
  assert.match(source, /function draftSummary/);
  assert.match(source, /draftId: firstSafeString/);
  assert.match(source, /organizationId: firstSafeString/);
  assert.match(source, /tenantId: firstSafeString/);
  assert.match(source, /requestId: firstSafeString/);
  assert.match(source, /actor: input\.actor/);
  assert.match(source, /metadata: input\.metadata/);
  assert.match(source, /warnings: input\.warnings/);
});

test('casePlanner adapter source keeps default and injected planning paths', () => {
  const source = readSource();

  assert.match(source, /function defaultPlanCaseFromDraft/);
  assert.match(source, /return defaultPlanCaseFromDraft\(planningInput\)/);
  assert.match(source, /if \(planningPolicy\)/);
  assert.match(source, /await planningPolicy\.planCaseFromDraft\(planningInput\)/);
});

test('casePlanner adapter source keeps sanitized success and failure envelopes', () => {
  const source = readSource();

  assert.match(source, /function sanitizeValue/);
  assert.match(source, /function failureEnvelope/);
  assert.match(source, /function planEnvelope/);
  assert.match(source, /return sanitizeValue\(\{/);
  assert.match(source, /candidate/);
  assert.match(source, /REPAIR_INTAKE_CASE_PLANNER_PORT_ADAPTER_PLAN_READY/);
  assert.match(source, /REPAIR_INTAKE_CASE_PLANNER_PORT_ADAPTER_PLAN_FAILED/);
});

test('casePlanner adapter source keeps sync thrown and async rejected policy sanitization', () => {
  const source = readSource();

  assert.match(source, /try \{/);
  assert.match(source, /await planningPolicy\.planCaseFromDraft\(planningInput\)/);
  assert.match(source, /catch \(error\)/);
  assert.match(source, /return failureEnvelope\('REPAIR_INTAKE_CASE_PLANNER_PORT_ADAPTER_PLAN_FAILED'\)/);
  assert.equal(source.includes('error.message'), false);
  assert.equal(source.includes('error.stack'), false);
  assert.equal(source.includes('throw error'), false);
});

test('casePlanner adapter source keeps expected sanitized reason codes', () => {
  const source = readSource();

  for (const reasonCode of [
    'REPAIR_INTAKE_CASE_PLANNER_PORT_ADAPTER_POLICY_REQUIRED',
    'REPAIR_INTAKE_CASE_PLANNER_PORT_ADAPTER_INPUT_INVALID',
    'REPAIR_INTAKE_CASE_PLANNER_PORT_ADAPTER_PLAN_FAILED',
    'REPAIR_INTAKE_CASE_PLANNER_PORT_ADAPTER_PLAN_READY',
  ]) {
    assert.equal(source.includes(reasonCode), true, `missing reasonCode ${reasonCode}`);
  }
});

test('casePlanner adapter source avoids forbidden runtime and repository coupling markers', () => {
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
