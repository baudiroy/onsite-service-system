'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createRepairIntakeDraftToCaseController,
} = require('../../src/repairIntake/repairIntakeDraftToCaseController');

function createController(calls) {
  return createRepairIntakeDraftToCaseController({
    applicationService: {
      planDraftToCase: async (input) => {
        calls.push({ method: 'plan', input });
        return {
          ok: true,
          statusCode: 200,
          body: {
            ok: true,
            reasonCode: 'PLAN_READY',
            draftId: input.draftId,
          },
        };
      },
      submitDraftToCase: async (input) => {
        calls.push({ method: 'submit', input });
        return {
          ok: true,
          statusCode: 200,
          body: {
            ok: true,
            reasonCode: 'SUBMIT_READY',
            draftId: input.draftId,
          },
        };
      },
    },
  });
}

function assertNoUnsafeText(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'select *',
    'DATABASE_URL',
    'postgres://',
    '+886900000000',
    'unsafe address',
    'unsafe customer',
    'lineUserId',
    'unsafe_line',
    'LINE access token',
    'unsafe_line_token',
    'finalAppointmentId',
    'unsafe_final',
    'stack trace',
    'applicationService',
    'handler',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

function invalidInputs() {
  return [
    undefined,
    null,
    'input',
    42,
    true,
    [],
    () => ({
      DATABASE_URL: 'postgres://unsafe',
      phone: '+886900000000',
      address: 'unsafe address',
      customerName: 'unsafe customer',
      lineUserId: 'unsafe_line',
      lineAccessToken: 'unsafe_line_token',
      finalAppointmentId: 'unsafe_final',
      stack: 'stack trace',
    }),
  ];
}

test('valid plan and submit inputs are forwarded to matching applicationService methods', async () => {
  const calls = [];
  const controller = createController(calls);
  const validInput = {
    draftId: 'draft_task1011',
    organizationId: 'org_task1011',
  };

  const planResult = await controller.planDraftToCase(validInput);
  const submitResult = await controller.submitDraftToCase(validInput);

  assert.deepEqual(calls, [
    { method: 'plan', input: validInput },
    { method: 'submit', input: validInput },
  ]);
  assert.equal(planResult.body.reasonCode, 'PLAN_READY');
  assert.equal(submitResult.body.reasonCode, 'SUBMIT_READY');
  assertNoUnsafeText(planResult);
  assertNoUnsafeText(submitResult);
});

test('invalid plan inputs fail closed before calling applicationService', async () => {
  const calls = [];
  const controller = createController(calls);

  for (const invalidInput of invalidInputs()) {
    const result = await controller.planDraftToCase(invalidInput);

    assert.equal(result.ok, false);
    assert.equal(result.statusCode, 500);
    assert.equal(
      result.body.reasonCode,
      'REPAIR_INTAKE_DRAFT_TO_CASE_CONTROLLER_PLAN_INPUT_INVALID',
    );
    assert.deepEqual(result.body.requiredActions, ['provide_valid_input']);
    assertNoUnsafeText(result);
  }

  assert.deepEqual(calls, []);
});

test('invalid submit inputs fail closed before calling applicationService', async () => {
  const calls = [];
  const controller = createController(calls);

  for (const invalidInput of invalidInputs()) {
    const result = await controller.submitDraftToCase(invalidInput);

    assert.equal(result.ok, false);
    assert.equal(result.statusCode, 500);
    assert.equal(
      result.body.reasonCode,
      'REPAIR_INTAKE_DRAFT_TO_CASE_CONTROLLER_SUBMIT_INPUT_INVALID',
    );
    assert.deepEqual(result.body.requiredActions, ['provide_valid_input']);
    assertNoUnsafeText(result);
  }

  assert.deepEqual(calls, []);
});
