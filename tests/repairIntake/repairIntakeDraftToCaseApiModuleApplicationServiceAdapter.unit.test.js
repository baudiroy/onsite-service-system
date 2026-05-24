'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createRepairIntakeDraftToCaseApiModule,
} = require('../../src/repairIntake/repairIntakeDraftToCaseApiModule');

function validApplicationService() {
  return {
    planDraftToCase: async () => ({
      ok: true,
      action: 'repair_intake_draft_to_case_plan',
      draftId: 'draft_task1001',
      organizationId: 'org_task1001',
      reasonCode: 'PLAN_READY',
      requiredActions: [],
      phone: '+886900000000',
      fullAddress: 'unsafe address',
      finalAppointmentId: 'unsafe_final',
    }),
    submitDraftToCase: async () => ({
      ok: true,
      action: 'repair_intake_draft_to_case_submit',
      draftId: 'draft_task1001',
      organizationId: 'org_task1001',
      submitted: true,
      reasonCode: 'SUBMIT_READY',
      requiredActions: [],
      caseRef: {
        id: 'case_task1001',
        organizationId: 'org_task1001',
        sourceDraftId: 'draft_task1001',
        status: 'created',
      },
      token: 'unsafe_token',
      lineAccessToken: 'unsafe_line_token',
    }),
  };
}

function validController() {
  return {
    planDraftToCase: async () => ({ ok: true, statusCode: 200, body: { ok: true } }),
    submitDraftToCase: async () => ({ ok: true, statusCode: 200, body: { ok: true } }),
  };
}

function requestLike() {
  return {
    params: {
      draftId: 'draft_task1001',
    },
    body: {
      organizationId: 'org_task1001',
      idempotencyKey: 'idem_task1001',
      phone: '+886900000000',
      fullAddress: 'unsafe address',
      rawCustomerPayload: { name: 'unsafe customer' },
      finalAppointmentId: 'unsafe_final',
    },
    context: {
      organizationId: 'org_task1001',
      actorId: 'actor_task1001',
      requestId: 'req_task1001',
    },
  };
}

function assertNoForbiddenFields(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'applicationServiceSecret',
    'raw error',
    'stack trace',
    'select *',
    'sql',
    'SQL',
    'token',
    'secret',
    '+886900000000',
    'phone',
    'fullAddress',
    'unsafe address',
    'rawCustomerPayload',
    'unsafe customer',
    'lineAccessToken',
    'LINE access token',
    'finalAppointmentId',
    'unsafe_final',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('valid injected applicationService builds safe controller route envelope', async () => {
  const result = createRepairIntakeDraftToCaseApiModule({
    applicationService: validApplicationService(),
  });

  assert.equal(result.ok, true);
  assert.equal(typeof result.controller.planDraftToCase, 'function');
  assert.equal(typeof result.controller.submitDraftToCase, 'function');
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

  const response = await result.routes[0].handler(requestLike());

  assert.equal(response.ok, true);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.draftId, 'draft_task1001');
  assert.equal(response.body.organizationId, 'org_task1001');
  assertNoForbiddenFields(response);
});

test('invalid injected applicationService shapes fail closed before route creation', () => {
  const invalidApplicationServices = [
    null,
    'service',
    42,
    {},
    { planDraftToCase: validApplicationService().planDraftToCase },
    { submitDraftToCase: validApplicationService().submitDraftToCase },
    {
      planDraftToCase: 'not-a-function',
      submitDraftToCase: validApplicationService().submitDraftToCase,
    },
    {
      planDraftToCase: validApplicationService().planDraftToCase,
      submitDraftToCase: 'not-a-function',
    },
    {
      planDraftToCase: validApplicationService().planDraftToCase,
      submitDraftToCase: null,
      applicationServiceSecret: 'token secret phone address customer finalAppointmentId',
    },
  ];

  for (const applicationService of invalidApplicationServices) {
    const result = createRepairIntakeDraftToCaseApiModule({ applicationService });

    assert.equal(result.ok, false, `applicationService should fail: ${String(applicationService)}`);
    assert.equal(result.controller, null);
    assert.deepEqual(result.routes, []);
    assert.equal(result.registration, null);
    assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_API_MODULE_APPLICATION_SERVICE_REQUIRED');
    assert.deepEqual(result.requiredActions, ['configure_application_service_or_controller']);
    assertNoForbiddenFields(result);
  }
});

test('valid injected controller still bypasses applicationService path safely', () => {
  const result = createRepairIntakeDraftToCaseApiModule({
    controller: validController(),
    applicationService: {
      applicationServiceSecret: 'token secret phone address customer finalAppointmentId',
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.routes.length, 2);
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_API_MODULE_READY');
});
