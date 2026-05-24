'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createRepairIntakeDraftToCaseApiModule,
} = require('../../src/repairIntake/repairIntakeDraftToCaseApiModule');

const UNSAFE_REJECTION_MESSAGE = [
  'SQL select * from unsafe_async_table',
  'DATABASE_URL=postgres://unsafe-async',
  'phone +886911111111',
  'address unsafe async full address',
  'customer unsafe async name',
  'lineUserId unsafe_async_line',
  'LINE access token unsafe_async_line_token',
  'finalAppointmentId unsafe_async_final',
  'stack trace at unsafe async',
].join(' ');

function rejectedUnsafeError() {
  return Promise.reject(new Error(UNSAFE_REJECTION_MESSAGE));
}

function rejectingController() {
  return {
    planDraftToCase: () => rejectedUnsafeError(),
    submitDraftToCase: () => rejectedUnsafeError(),
  };
}

function rejectingApplicationService() {
  return {
    planDraftToCase: () => rejectedUnsafeError(),
    submitDraftToCase: () => rejectedUnsafeError(),
  };
}

function requestLike() {
  return {
    params: {
      draftId: 'draft_task1003',
    },
    body: {
      organizationId: 'org_task1003',
      phone: '+886911111111',
      fullAddress: 'unsafe async address',
      rawCustomerPayload: { name: 'unsafe async customer' },
      lineUserId: 'unsafe_async_line',
      finalAppointmentId: 'unsafe_async_final',
    },
    context: {
      organizationId: 'org_task1003',
      actorId: 'actor_task1003',
      requestId: 'req_task1003',
    },
  };
}

function assertNoUnsafeText(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'select *',
    'unsafe_async_table',
    'DATABASE_URL',
    'postgres://',
    '+886911111111',
    'unsafe async full address',
    'unsafe async address',
    'unsafe async name',
    'unsafe async customer',
    'lineUserId',
    'unsafe_async_line',
    'LINE access token',
    'unsafe_async_line_token',
    'finalAppointmentId',
    'unsafe_async_final',
    'stack trace',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

function assertModuleEnvelopeSanitized(moduleEnvelope) {
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

test('controller async rejected promises return sanitized route-handler failure envelopes', async () => {
  const moduleEnvelope = createRepairIntakeDraftToCaseApiModule({
    controller: rejectingController(),
  });

  assertModuleEnvelopeSanitized(moduleEnvelope);

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

test('applicationService async rejected promises return sanitized controller failure envelopes', async () => {
  const moduleEnvelope = createRepairIntakeDraftToCaseApiModule({
    applicationService: rejectingApplicationService(),
  });

  assertModuleEnvelopeSanitized(moduleEnvelope);

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
