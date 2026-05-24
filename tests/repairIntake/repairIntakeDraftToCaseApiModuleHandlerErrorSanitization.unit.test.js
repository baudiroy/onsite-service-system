'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createRepairIntakeDraftToCaseApiModule,
} = require('../../src/repairIntake/repairIntakeDraftToCaseApiModule');

const UNSAFE_ERROR_MESSAGE = [
  'SQL select * from unsafe_table',
  'DATABASE_URL=postgres://unsafe',
  'phone +886900000000',
  'address unsafe full address',
  'customer unsafe name',
  'lineUserId unsafe_line',
  'LINE access token unsafe_line_token',
  'finalAppointmentId unsafe_final',
  'stack trace at unsafe',
].join(' ');

function throwingController() {
  return {
    planDraftToCase: async () => {
      throw new Error(UNSAFE_ERROR_MESSAGE);
    },
    submitDraftToCase: async () => {
      throw new Error(UNSAFE_ERROR_MESSAGE);
    },
  };
}

function throwingApplicationService() {
  return {
    planDraftToCase: async () => {
      throw new Error(UNSAFE_ERROR_MESSAGE);
    },
    submitDraftToCase: async () => {
      throw new Error(UNSAFE_ERROR_MESSAGE);
    },
  };
}

function requestLike() {
  return {
    params: {
      draftId: 'draft_task1002',
    },
    body: {
      organizationId: 'org_task1002',
      phone: '+886900000000',
      fullAddress: 'unsafe address',
      rawCustomerPayload: { name: 'unsafe customer' },
      lineUserId: 'unsafe_line',
      finalAppointmentId: 'unsafe_final',
    },
    context: {
      organizationId: 'org_task1002',
      actorId: 'actor_task1002',
      requestId: 'req_task1002',
    },
  };
}

function assertNoUnsafeText(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'select *',
    'unsafe_table',
    'DATABASE_URL',
    'postgres://',
    '+886900000000',
    'unsafe full address',
    'unsafe address',
    'unsafe name',
    'unsafe customer',
    'lineUserId',
    'unsafe_line',
    'LINE access token',
    'unsafe_line_token',
    'finalAppointmentId',
    'unsafe_final',
    'stack trace',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

function assertRouteEnvelopeSanitized(moduleEnvelope) {
  assert.equal(moduleEnvelope.ok, true);
  assert.equal(moduleEnvelope.registration, null);
  assert.deepEqual(moduleEnvelope.routes.map(({ method, path }) => ({ method, path })), [
    {
      method: 'POST',
      path: '/repair-intake/drafts/:draftId/case/plan',
    },
    {
      method: 'POST',
      path: '/repair-intake/drafts/:draftId/case/submit',
    },
  ]);
  assertNoUnsafeText({
    ok: moduleEnvelope.ok,
    registration: moduleEnvelope.registration,
    routes: moduleEnvelope.routes.map(({ method, path }) => ({ method, path })),
    reasonCode: moduleEnvelope.reasonCode,
    requiredActions: moduleEnvelope.requiredActions,
  });
}

test('controller-thrown unsafe errors are not captured in module metadata or route summaries', async () => {
  const moduleEnvelope = createRepairIntakeDraftToCaseApiModule({
    controller: throwingController(),
  });

  assertRouteEnvelopeSanitized(moduleEnvelope);

  const planResult = await moduleEnvelope.routes[0].handler(requestLike());
  const submitResult = await moduleEnvelope.routes[1].handler(requestLike());

  assert.equal(planResult.ok, false);
  assert.equal(planResult.statusCode, 500);
  assert.equal(planResult.body.reasonCode, 'REPAIR_INTAKE_DRAFT_CASE_ROUTE_HANDLER_FAILED');
  assert.deepEqual(planResult.body.requiredActions, ['retry_or_manual_review']);
  assertNoUnsafeText(planResult);

  assert.equal(submitResult.ok, false);
  assert.equal(submitResult.statusCode, 500);
  assert.equal(submitResult.body.reasonCode, 'REPAIR_INTAKE_DRAFT_CASE_ROUTE_HANDLER_FAILED');
  assert.deepEqual(submitResult.body.requiredActions, ['retry_or_manual_review']);
  assertNoUnsafeText(submitResult);
});

test('applicationService-thrown unsafe errors return sanitized controller failure envelopes', async () => {
  const moduleEnvelope = createRepairIntakeDraftToCaseApiModule({
    applicationService: throwingApplicationService(),
  });

  assertRouteEnvelopeSanitized(moduleEnvelope);

  const planResult = await moduleEnvelope.routes[0].handler(requestLike());
  const submitResult = await moduleEnvelope.routes[1].handler(requestLike());

  assert.equal(planResult.ok, false);
  assert.equal(planResult.statusCode, 500);
  assert.equal(planResult.body.reasonCode, 'CONTROLLER_APPLICATION_SERVICE_FAILED');
  assert.deepEqual(planResult.body.requiredActions, ['retry_or_manual_review']);
  assertNoUnsafeText(planResult);

  assert.equal(submitResult.ok, false);
  assert.equal(submitResult.statusCode, 500);
  assert.equal(submitResult.body.reasonCode, 'CONTROLLER_APPLICATION_SERVICE_FAILED');
  assert.deepEqual(submitResult.body.requiredActions, ['retry_or_manual_review']);
  assertNoUnsafeText(submitResult);
});
