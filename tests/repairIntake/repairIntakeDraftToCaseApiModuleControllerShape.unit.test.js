'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createRepairIntakeDraftToCaseApiModule,
} = require('../../src/repairIntake/repairIntakeDraftToCaseApiModule');

function validController() {
  return {
    planDraftToCase: async () => ({
      ok: true,
      statusCode: 200,
      body: {
        ok: true,
        reasonCode: 'PLAN_READY',
        requiredActions: [],
      },
    }),
    submitDraftToCase: async () => ({
      ok: true,
      statusCode: 200,
      body: {
        ok: true,
        reasonCode: 'SUBMIT_READY',
        requiredActions: [],
      },
    }),
  };
}

function assertNoForbiddenFields(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'handler',
    'controllerSecret',
    'raw error',
    'stack trace',
    'select *',
    'sql',
    'SQL',
    'token',
    'secret',
    'phone',
    'address',
    'customer',
    'lineUserId',
    'lineAccessToken',
    'LINE access token',
    'finalAppointmentId',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('valid injected controller shape returns Task967-style route envelope', () => {
  const result = createRepairIntakeDraftToCaseApiModule({
    controller: validController(),
  });

  assert.equal(result.ok, true);
  assert.equal(result.controller.planDraftToCase instanceof Function, true);
  assert.equal(result.controller.submitDraftToCase instanceof Function, true);
  assert.deepEqual(result.routes.map(({ method, path }) => ({ method, path })), [
    {
      method: 'POST',
      path: '/repair-intake/drafts/:draftId/case/plan',
    },
    {
      method: 'POST',
      path: '/repair-intake/drafts/:draftId/case/submit',
    },
  ]);
  assert.equal(result.registration, null);
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_API_MODULE_READY');
});

test('invalid injected controller shapes fail closed with sanitized metadata', () => {
  const invalidControllers = [
    null,
    'controller',
    42,
    {},
    { planDraftToCase: validController().planDraftToCase },
    { submitDraftToCase: validController().submitDraftToCase },
    {
      planDraftToCase: 'not-a-function',
      submitDraftToCase: validController().submitDraftToCase,
    },
    {
      planDraftToCase: validController().planDraftToCase,
      submitDraftToCase: 'not-a-function',
    },
    {
      planDraftToCase: validController().planDraftToCase,
      submitDraftToCase: null,
      controllerSecret: 'token secret phone address customer finalAppointmentId',
    },
  ];

  for (const controller of invalidControllers) {
    const result = createRepairIntakeDraftToCaseApiModule({ controller });

    assert.equal(result.ok, false, `controller should fail: ${String(controller)}`);
    assert.equal(result.controller, null);
    assert.deepEqual(result.routes, []);
    assert.equal(result.registration, null);
    assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_API_MODULE_CONTROLLER_REQUIRED');
    assert.deepEqual(result.requiredActions, ['configure_controller']);
    assertNoForbiddenFields(result);
  }
});

test('missing controller without applicationService preserves existing dependency failure', () => {
  const result = createRepairIntakeDraftToCaseApiModule({});

  assert.equal(result.ok, false);
  assert.equal(result.controller, null);
  assert.deepEqual(result.routes, []);
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_API_MODULE_APPLICATION_SERVICE_REQUIRED');
  assert.deepEqual(result.requiredActions, ['configure_application_service_or_controller']);
  assertNoForbiddenFields(result);
});
