'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  RepairIntakeDraftToCaseControllerError,
  createRepairIntakeDraftToCaseController,
} = require('../../src/repairIntake/repairIntakeDraftToCaseController');

const UNSAFE_ERROR_MESSAGE = [
  'SQL select * from unsafe_controller_table',
  'DATABASE_URL=postgres://unsafe-controller',
  'phone +886966666666',
  'address unsafe controller address',
  'customer unsafe controller name',
  'lineUserId unsafe_controller_line',
  'LINE access token unsafe_controller_line_token',
  'finalAppointmentId unsafe_controller_final',
  'stack trace at unsafe controller',
].join(' ');

function input() {
  return {
    draftId: 'draft_task1008',
    organizationId: 'org_task1008',
  };
}

function unsafeResult(routeName) {
  return {
    ok: true,
    statusCode: 200,
    body: {
      ok: true,
      action: `repair_intake_draft_to_case_${routeName}`,
      draftId: 'draft_task1008',
      organizationId: 'org_task1008',
      reasonCode: `${routeName.toUpperCase()}_READY`,
      requiredActions: [],
      caseRef: {
        id: 'case_task1008',
        organizationId: 'org_task1008',
        sourceDraftId: 'draft_task1008',
        status: 'created',
        phone: '+886966666666',
      },
      result: {
        accepted: true,
        sql: 'select * from unsafe_result',
      },
      metadata: {
        source: 'synthetic_task1008',
        headers: {
          authorization: 'Bearer unsafe',
        },
      },
      phone: '+886966666666',
      address: 'unsafe controller address',
      customerName: 'unsafe controller name',
      lineUserId: 'unsafe_controller_line',
      lineAccessToken: 'unsafe_controller_line_token',
      finalAppointmentId: 'unsafe_controller_final',
      stack: 'unsafe stack',
      error: 'unsafe error',
      applicationService: 'unsafe application service',
      handler: 'unsafe handler',
      databaseUrl: 'postgres://unsafe-controller',
      DATABASE_URL: 'postgres://unsafe-controller',
    },
  };
}

function assertNoUnsafeText(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'select *',
    'unsafe_controller_table',
    'unsafe_result',
    'DATABASE_URL',
    'postgres://',
    '+886966666666',
    'unsafe controller address',
    'unsafe controller name',
    'lineUserId',
    'unsafe_controller_line',
    'LINE access token',
    'unsafe_controller_line_token',
    'finalAppointmentId',
    'unsafe_controller_final',
    'stack trace',
    'unsafe stack',
    'unsafe error',
    'unsafe application service',
    'unsafe handler',
    'authorization',
    'Bearer unsafe',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('valid injected applicationService is accepted and each handler calls only its matching method', async () => {
  const calls = [];
  const controller = createRepairIntakeDraftToCaseController({
    applicationService: {
      planDraftToCase: async (serviceInput) => {
        calls.push({ method: 'plan', input: serviceInput });
        return unsafeResult('plan');
      },
      submitDraftToCase: async (serviceInput) => {
        calls.push({ method: 'submit', input: serviceInput });
        return unsafeResult('submit');
      },
    },
  });

  assert.equal(typeof controller.planDraftToCase, 'function');
  assert.equal(typeof controller.submitDraftToCase, 'function');

  const planResult = await controller.planDraftToCase(input());
  const submitResult = await controller.submitDraftToCase(input());

  assert.deepEqual(calls, [
    { method: 'plan', input: input() },
    { method: 'submit', input: input() },
  ]);
  assert.equal(planResult.ok, true);
  assert.equal(planResult.statusCode, 200);
  assert.equal(planResult.body.reasonCode, 'PLAN_READY');
  assert.equal(planResult.body.result.accepted, true);
  assert.deepEqual(planResult.body.metadata, { source: 'synthetic_task1008' });
  assert.equal(submitResult.body.reasonCode, 'SUBMIT_READY');
  assertNoUnsafeText(planResult);
  assertNoUnsafeText(submitResult);
});

test('sync thrown errors return sanitized handler failure envelopes', async () => {
  const controller = createRepairIntakeDraftToCaseController({
    applicationService: {
      planDraftToCase: () => {
        throw new Error(UNSAFE_ERROR_MESSAGE);
      },
      submitDraftToCase: () => {
        throw new Error(UNSAFE_ERROR_MESSAGE);
      },
    },
  });

  const planResult = await controller.planDraftToCase(input());
  const submitResult = await controller.submitDraftToCase(input());

  assert.equal(planResult.ok, false);
  assert.equal(planResult.statusCode, 500);
  assert.equal(planResult.body.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_CONTROLLER_PLAN_FAILED');
  assert.deepEqual(planResult.body.requiredActions, ['retry_or_manual_review']);
  assertNoUnsafeText(planResult);

  assert.equal(submitResult.ok, false);
  assert.equal(submitResult.statusCode, 500);
  assert.equal(submitResult.body.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_CONTROLLER_SUBMIT_FAILED');
  assert.deepEqual(submitResult.body.requiredActions, ['retry_or_manual_review']);
  assertNoUnsafeText(submitResult);
});

test('async rejected errors return sanitized handler failure envelopes', async () => {
  const controller = createRepairIntakeDraftToCaseController({
    applicationService: {
      planDraftToCase: () => Promise.reject(new Error(UNSAFE_ERROR_MESSAGE)),
      submitDraftToCase: () => Promise.reject(new Error(UNSAFE_ERROR_MESSAGE)),
    },
  });

  const planResult = await controller.planDraftToCase(input());
  const submitResult = await controller.submitDraftToCase(input());

  assert.equal(planResult.body.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_CONTROLLER_PLAN_FAILED');
  assert.equal(submitResult.body.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_CONTROLLER_SUBMIT_FAILED');
  assertNoUnsafeText(planResult);
  assertNoUnsafeText(submitResult);
});

test('invalid applicationService fails closed with sanitized configuration error', () => {
  for (const applicationService of [
    null,
    'service',
    42,
    {},
    { planDraftToCase: async () => unsafeResult('plan') },
    { submitDraftToCase: async () => unsafeResult('submit') },
    {
      planDraftToCase: 'not-a-function',
      submitDraftToCase: async () => unsafeResult('submit'),
      applicationServiceSecret: 'DATABASE_URL phone address lineUserId finalAppointmentId',
    },
  ]) {
    assert.throws(
      () => createRepairIntakeDraftToCaseController({ applicationService }),
      (error) => {
        assert.equal(error instanceof RepairIntakeDraftToCaseControllerError, true);
        assert.equal(
          error.reasonCode,
          'REPAIR_INTAKE_DRAFT_TO_CASE_CONTROLLER_APPLICATION_SERVICE_REQUIRED',
        );
        assert.deepEqual(error.requiredActions, ['configure_application_service']);
        assertNoUnsafeText(error);
        return true;
      },
    );
  }
});
