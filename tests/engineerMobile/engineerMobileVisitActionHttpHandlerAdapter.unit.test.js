'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  ENGINEER_MOBILE_VISIT_ACTION_HTTP_HANDLER_ADAPTER_KIND,
  createEngineerMobileVisitActionHttpHandlerAdapter,
} = require('../../src/engineerMobile/engineerMobileVisitActionHttpHandlerAdapter');

const NOW = '2026-05-28T14:00:00.000Z';

function actor(overrides = {}) {
  return {
    id: 'eng_task_1810',
    organizationId: 'org_task_1810',
    permissions: ['engineer_mobile.visit.start_travel'],
    token: 'token_should_not_leak',
    privateNote: 'private_actor_note_should_not_leak',
    ...overrides,
  };
}

function appointment(overrides = {}) {
  return {
    appointmentId: 'apt_task_1810',
    caseId: 'case_task_1810',
    organizationId: 'org_task_1810',
    assignedEngineerId: 'eng_task_1810',
    status: 'scheduled',
    customerPhone: 'raw_phone_should_not_leak',
    address: 'raw_address_should_not_leak',
    lineUserId: 'raw_line_should_not_leak',
    customerName: 'raw_customer_should_not_leak',
    privateNote: 'raw_private_note_should_not_leak',
    reportDraftBody: 'raw_report_draft_should_not_leak',
    providerPayload: 'raw_provider_payload_should_not_leak',
    repositoryDebug: 'repository_should_not_leak',
    publicationTarget: 'customer_visible_publication_should_not_leak',
    ...overrides,
  };
}

function request({
  action = 'engineer_mobile.start_travel',
  appointmentOverrides,
  actorOverrides,
  visitResult,
  params = { appointmentId: 'apt_task_1810' },
  requestId = 'req_task_1810',
} = {}) {
  return {
    requestId,
    params,
    body: {
      action,
      actor: actor(actorOverrides),
      appointment: appointment(appointmentOverrides),
      visitResult,
      now: NOW,
      rawRequestField: 'raw_request_should_not_leak',
    },
    headers: {
      authorization: 'secret_header_should_not_leak',
      'x-request-id': requestId,
    },
  };
}

function service(result, options = {}) {
  const calls = [];

  return {
    calls,
    service: {
      async handleEngineerMobileVisitAction(payload) {
        calls.push(payload);

        if (options.throw) {
          throw new Error('raw service failure token_should_not_leak');
        }

        return typeof result === 'function' ? result(payload) : result;
      },
    },
  };
}

function acceptedServiceResult(action, overrides = {}) {
  return {
    ok: true,
    allowed: true,
    action,
    reasonCode: 'applied',
    appointmentId: 'apt_task_1810',
    caseId: 'case_task_1810',
    organizationId: 'org_task_1810',
    transitionApplied: true,
    auditRecorded: true,
    transitionIntent: {
      mobileVisitStatus: 'traveling',
    },
    ...overrides,
  };
}

function assertNoForbiddenLeak(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'raw_phone_should_not_leak',
    'raw_address_should_not_leak',
    'raw_line_should_not_leak',
    'raw_customer_should_not_leak',
    'raw_private_note_should_not_leak',
    'raw_report_draft_should_not_leak',
    'raw_provider_payload_should_not_leak',
    'repository_should_not_leak',
    'customer_visible_publication_should_not_leak',
    'token_should_not_leak',
    'private_actor_note_should_not_leak',
    'secret_header_should_not_leak',
    'raw_request_should_not_leak',
    'raw service failure',
    'stack',
    'select * from',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

function assertSafeServicePayload(payload, expectedAction) {
  assert.equal(payload.action, expectedAction);
  assert.equal(payload.actor.id, 'eng_task_1810');
  assert.deepEqual(payload.actor.permissions, ['engineer_mobile.visit.start_travel']);
  assert.equal(payload.appointment.appointmentId, 'apt_task_1810');
  assert.equal(payload.appointment.caseId, 'case_task_1810');
  assert.equal(payload.appointment.assignedEngineerId, 'eng_task_1810');
  assert.equal(payload.now, NOW);
  assert.equal('body' in payload, false);
  assert.equal('params' in payload, false);
  assert.equal('request' in payload, false);
  assertNoForbiddenLeak(payload);
}

async function handleWith(result, req, options) {
  const fake = service(result, options);
  const adapter = createEngineerMobileVisitActionHttpHandlerAdapter({
    visitActionService: fake.service,
  });
  const response = await adapter.handleEngineerMobileVisitActionRequest(req);

  return {
    response,
    calls: fake.calls,
    adapter,
  };
}

test('missing injected service returns VISIT_ACTION_SERVICE_REQUIRED', async () => {
  const adapter = createEngineerMobileVisitActionHttpHandlerAdapter();
  const response = await adapter.handleEngineerMobileVisitActionRequest(request());

  assert.equal(adapter.kind, ENGINEER_MOBILE_VISIT_ACTION_HTTP_HANDLER_ADAPTER_KIND);
  assert.equal(response.statusCode, 500);
  assert.equal(response.body.reasonCode, 'VISIT_ACTION_SERVICE_REQUIRED');
  assert.equal(response.body.error.code, 'VISIT_ACTION_SERVICE_REQUIRED');
  assertNoForbiddenLeak(response);
});

test('missing service handler returns VISIT_ACTION_SERVICE_REQUIRED', async () => {
  const adapter = createEngineerMobileVisitActionHttpHandlerAdapter({
    visitActionService: {},
  });
  const response = await adapter.handleEngineerMobileVisitActionRequest(request());

  assert.equal(response.statusCode, 500);
  assert.equal(response.body.error.code, 'VISIT_ACTION_SERVICE_REQUIRED');
  assertNoForbiddenLeak(response);
});

test('valid accepted start_travel request maps to HTTP 202', async () => {
  const { response, calls } = await handleWith(
    acceptedServiceResult('engineer_mobile.start_travel'),
    request(),
  );

  assert.equal(response.statusCode, 202);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.accepted, true);
  assert.equal(response.body.allowed, true);
  assert.equal(response.body.action, 'engineer_mobile.start_travel');
  assert.equal(response.body.transition.applied, true);
  assert.equal(response.body.transition.mobileVisitStatus, 'traveling');
  assert.equal(response.body.audit.recorded, true);
  assert.equal(response.body.requestId, 'req_task_1810');
  assert.equal(calls.length, 1);
  assertSafeServicePayload(calls[0], 'engineer_mobile.start_travel');
  assertNoForbiddenLeak(response);
});

test('valid accepted arrive request maps to HTTP 202', async () => {
  const { response, calls } = await handleWith(
    acceptedServiceResult('engineer_mobile.arrive', {
      transitionIntent: { mobileVisitStatus: 'arrived' },
    }),
    request({
      action: 'engineer_mobile.arrive',
      appointmentOverrides: { mobileVisitStatus: 'traveling' },
    }),
  );

  assert.equal(response.statusCode, 202);
  assert.equal(response.body.action, 'engineer_mobile.arrive');
  assert.equal(response.body.transition.mobileVisitStatus, 'arrived');
  assertSafeServicePayload(calls[0], 'engineer_mobile.arrive');
});

test('valid accepted start_work request maps to HTTP 202', async () => {
  const { response, calls } = await handleWith(
    acceptedServiceResult('engineer_mobile.start_work', {
      transitionIntent: { mobileVisitStatus: 'working' },
    }),
    request({
      action: 'engineer_mobile.start_work',
      appointmentOverrides: { mobileVisitStatus: 'arrived' },
    }),
  );

  assert.equal(response.statusCode, 202);
  assert.equal(response.body.action, 'engineer_mobile.start_work');
  assert.equal(response.body.transition.mobileVisitStatus, 'working');
  assertSafeServicePayload(calls[0], 'engineer_mobile.start_work');
});

test('valid accepted finish_work request maps to HTTP 202', async () => {
  const { response, calls } = await handleWith(
    acceptedServiceResult('engineer_mobile.finish_work', {
      transitionIntent: { mobileVisitStatus: 'work_finished' },
    }),
    request({
      action: 'engineer_mobile.finish_work',
      appointmentOverrides: { mobileVisitStatus: 'working' },
    }),
  );

  assert.equal(response.statusCode, 202);
  assert.equal(response.body.action, 'engineer_mobile.finish_work');
  assert.equal(response.body.transition.mobileVisitStatus, 'work_finished');
  assertSafeServicePayload(calls[0], 'engineer_mobile.finish_work');
});

test('valid accepted record_visit_result request forwards visitResult and maps to HTTP 202', async () => {
  const { response, calls } = await handleWith(
    acceptedServiceResult('engineer_mobile.record_visit_result', {
      transitionIntent: {
        mobileVisitStatus: 'visit_result_recorded',
        visitResult: 'parts_required',
      },
    }),
    request({
      action: 'engineer_mobile.record_visit_result',
      actorOverrides: { permissions: ['engineer_mobile.visit.record_result'] },
      appointmentOverrides: { mobileVisitStatus: 'work_finished' },
      visitResult: 'parts_required',
    }),
  );

  assert.equal(response.statusCode, 202);
  assert.equal(response.body.action, 'engineer_mobile.record_visit_result');
  assert.equal(response.body.transition.visitResult, 'parts_required');
  assert.equal(calls[0].visitResult, 'parts_required');
  assertNoForbiddenLeak(response);
});

test('denied policy result maps to HTTP 403', async () => {
  const { response } = await handleWith(
    {
      ok: false,
      allowed: false,
      action: 'engineer_mobile.finish_work',
      reasonCode: 'permission_required',
      appointmentId: 'apt_task_1810',
      caseId: 'case_task_1810',
      organizationId: 'org_task_1810',
      transitionApplied: false,
      auditRecorded: false,
    },
    request({ action: 'engineer_mobile.finish_work' }),
  );

  assert.equal(response.statusCode, 403);
  assert.equal(response.body.reasonCode, 'permission_required');
  assert.equal(response.body.accepted, false);
  assertNoForbiddenLeak(response);
});

test('unsupported action maps to HTTP 400', async () => {
  const { response } = await handleWith(
    {
      ok: false,
      allowed: false,
      action: 'engineer_mobile.unknown',
      reasonCode: 'unsupported_action',
      appointmentId: 'apt_task_1810',
    },
    request({ action: 'engineer_mobile.unknown' }),
  );

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.reasonCode, 'unsupported_action');
});

test('appointment ID mismatch maps to HTTP 400 with APPOINTMENT_ID_MISMATCH', async () => {
  const fake = service(acceptedServiceResult('engineer_mobile.start_travel'));
  const adapter = createEngineerMobileVisitActionHttpHandlerAdapter({
    visitActionService: fake.service,
  });
  const response = await adapter.handleEngineerMobileVisitActionRequest(request({
    params: { appointmentId: 'different_appointment' },
  }));

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error.code, 'APPOINTMENT_ID_MISMATCH');
  assert.deepEqual(fake.calls, []);
  assertNoForbiddenLeak(response);
});

test('transition writer required maps to HTTP 500', async () => {
  const { response } = await handleWith(
    {
      ok: false,
      allowed: true,
      action: 'engineer_mobile.start_travel',
      reasonCode: 'transition_writer_required',
      appointmentId: 'apt_task_1810',
      transitionApplied: false,
      auditRecorded: false,
    },
    request(),
  );

  assert.equal(response.statusCode, 500);
  assert.equal(response.body.reasonCode, 'transition_writer_required');
});

test('transition write failed maps to HTTP 500', async () => {
  const { response } = await handleWith(
    {
      ok: false,
      allowed: true,
      action: 'engineer_mobile.start_travel',
      reasonCode: 'transition_write_failed',
      appointmentId: 'apt_task_1810',
      transitionApplied: false,
      auditRecorded: false,
    },
    request(),
  );

  assert.equal(response.statusCode, 500);
  assert.equal(response.body.reasonCode, 'transition_write_failed');
});

test('audit write failed maps to HTTP 500', async () => {
  const { response } = await handleWith(
    {
      ok: false,
      allowed: true,
      action: 'engineer_mobile.start_travel',
      reasonCode: 'audit_write_failed',
      appointmentId: 'apt_task_1810',
      transitionApplied: true,
      auditRecorded: false,
    },
    request(),
  );

  assert.equal(response.statusCode, 500);
  assert.equal(response.body.reasonCode, 'audit_write_failed');
  assert.equal(response.body.transition.applied, true);
});

test('response is sanitized with no raw customer private or report draft fields', async () => {
  const { response } = await handleWith(
    {
      ...acceptedServiceResult('engineer_mobile.start_travel'),
      rawPhone: 'raw_phone_should_not_leak',
      stack: 'stack_should_not_leak',
      transitionIntent: {
        mobileVisitStatus: 'traveling',
        reportDraftBody: 'raw_report_draft_should_not_leak',
      },
    },
    request(),
  );

  assert.deepEqual(Object.keys(response.body).sort(), [
    'accepted',
    'action',
    'allowed',
    'appointmentId',
    'audit',
    'caseId',
    'ok',
    'organizationId',
    'reasonCode',
    'requestId',
    'transition',
  ].sort());
  assertNoForbiddenLeak(response);
});

test('service call payload contains no raw request object or unsafe infrastructure fields', async () => {
  const { calls } = await handleWith(
    acceptedServiceResult('engineer_mobile.start_travel'),
    request(),
  );

  assert.equal(calls.length, 1);
  assert.equal('headers' in calls[0], false);
  assert.equal('rawRequestField' in calls[0], false);
  assertNoForbiddenLeak(calls[0]);
});

test('inputs are not mutated', async () => {
  const req = request({
    appointmentOverrides: { mobileVisitStatus: 'traveling' },
  });
  const before = structuredClone(req);

  await handleWith(
    acceptedServiceResult('engineer_mobile.arrive', {
      transitionIntent: { mobileVisitStatus: 'arrived' },
    }),
    req,
  );

  assert.deepEqual(req, before);
});

test('handler does not throw for missing null or partial request', async () => {
  const fake = service({
    ok: false,
    allowed: false,
    reasonCode: 'appointment_required',
  });
  const adapter = createEngineerMobileVisitActionHttpHandlerAdapter({
    visitActionService: fake.service,
  });

  assert.equal((await adapter.handleEngineerMobileVisitActionRequest()).statusCode, 403);
  assert.equal((await adapter.handleEngineerMobileVisitActionRequest(null)).statusCode, 403);
  assert.equal((await adapter.handleEngineerMobileVisitActionRequest({ body: {} })).statusCode, 403);
});

test('service thrown error returns sanitized HTTP 500 without raw error', async () => {
  const { response } = await handleWith(undefined, request(), { throw: true });

  assert.equal(response.statusCode, 500);
  assert.equal(response.body.error.code, 'VISIT_ACTION_SERVICE_FAILED');
  assertNoForbiddenLeak(response);
});
