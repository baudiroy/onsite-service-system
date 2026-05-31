'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createEngineerMobileVisitActionHttpHandlerAdapter,
} = require('../../src/engineerMobile/engineerMobileVisitActionHttpHandlerAdapter');

const NOW = '2026-05-31T11:00:00.000Z';
const REQUEST_ID = 'req_task_2295';

const FORBIDDEN_MARKERS = Object.freeze([
  'raw_service_should_not_leak',
  'raw_transition_should_not_leak',
  'raw_audit_should_not_leak',
  'raw_case_should_not_leak',
  'raw_appointment_should_not_leak',
  'raw_completion_report_should_not_leak',
  'raw_field_service_report_should_not_leak',
  'raw_db_row_should_not_leak',
  'raw_repository_row_should_not_leak',
  'raw_provider_payload_should_not_leak',
  'raw_ai_should_not_leak',
  'raw_rag_should_not_leak',
  'raw_openai_should_not_leak',
  'raw_vector_should_not_leak',
  'raw_billing_should_not_leak',
  'raw_settlement_should_not_leak',
  'raw_payment_should_not_leak',
  'raw_invoice_should_not_leak',
  'raw_debug_should_not_leak',
  'raw_internal_should_not_leak',
  'raw_sql_should_not_leak',
  'raw_token_should_not_leak',
  'raw_password_should_not_leak',
  'raw_secret_should_not_leak',
  'raw_full_address_should_not_leak',
  'raw_phone_should_not_leak',
  'raw_signature_should_not_leak',
  'raw_photo_should_not_leak',
  'raw_private_should_not_leak',
  'raw_final_appointment_should_not_leak',
  'raw_publish_report_should_not_leak',
  'raw_approve_report_should_not_leak',
  'raw_formalize_report_should_not_leak',
  'raw_create_report_should_not_leak',
  'raw thrown service failure',
  'stack',
]);

function actor(overrides = {}) {
  return {
    id: 'eng_task_2295',
    organizationId: 'org_task_2295',
    permissions: ['engineer_mobile.visit.start_travel'],
    token: 'raw_token_should_not_leak',
    ...overrides,
  };
}

function appointment(overrides = {}) {
  return {
    appointmentId: 'apt_task_2295',
    caseId: 'case_task_2295',
    organizationId: 'org_task_2295',
    assignedEngineerId: 'eng_task_2295',
    status: 'scheduled',
    customerPhone: 'raw_phone_should_not_leak',
    fullAddress: 'raw_full_address_should_not_leak',
    signature: 'raw_signature_should_not_leak',
    photo: 'raw_photo_should_not_leak',
    privateNote: 'raw_private_should_not_leak',
    ...overrides,
  };
}

function request(overrides = {}) {
  return {
    requestId: REQUEST_ID,
    actor: actor(),
    now: NOW,
    params: {
      appointmentId: 'apt_task_2295',
      action: 'engineer_mobile.start_travel',
    },
    body: {
      appointment: appointment(),
    },
    headers: {
      authorization: 'raw_token_should_not_leak',
      'x-request-id': REQUEST_ID,
    },
    ...overrides,
  };
}

function allowedServiceResult(overrides = {}) {
  return {
    ok: true,
    allowed: true,
    action: 'engineer_mobile.start_travel',
    reasonCode: 'applied',
    appointmentId: 'apt_task_2295',
    caseId: 'case_task_2295',
    organizationId: 'org_task_2295',
    transitionApplied: true,
    auditRecorded: true,
    transitionIntent: {
      mobileVisitStatus: 'traveling',
      rawTransition: 'raw_transition_should_not_leak',
      finalAppointmentId: 'raw_final_appointment_should_not_leak',
      publishReport: 'raw_publish_report_should_not_leak',
      approveReport: 'raw_approve_report_should_not_leak',
      formalizeReport: 'raw_formalize_report_should_not_leak',
      createReport: 'raw_create_report_should_not_leak',
    },
    auditIntent: {
      rawAudit: 'raw_audit_should_not_leak',
    },
    rawService: 'raw_service_should_not_leak',
    rawCase: 'raw_case_should_not_leak',
    rawAppointment: 'raw_appointment_should_not_leak',
    completionReport: 'raw_completion_report_should_not_leak',
    fieldServiceReport: 'raw_field_service_report_should_not_leak',
    dbRow: 'raw_db_row_should_not_leak',
    repositoryRow: 'raw_repository_row_should_not_leak',
    providerPayload: 'raw_provider_payload_should_not_leak',
    ai: 'raw_ai_should_not_leak',
    rag: 'raw_rag_should_not_leak',
    openai: 'raw_openai_should_not_leak',
    vector: 'raw_vector_should_not_leak',
    billing: 'raw_billing_should_not_leak',
    settlement: 'raw_settlement_should_not_leak',
    payment: 'raw_payment_should_not_leak',
    invoice: 'raw_invoice_should_not_leak',
    debug: 'raw_debug_should_not_leak',
    internal: 'raw_internal_should_not_leak',
    rawSql: 'raw_sql_should_not_leak',
    token: 'raw_token_should_not_leak',
    password: 'raw_password_should_not_leak',
    secret: 'raw_secret_should_not_leak',
    ...overrides,
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertNoForbiddenLeak(value) {
  const serialized = JSON.stringify(value);

  for (const marker of FORBIDDEN_MARKERS) {
    assert.equal(serialized.includes(marker), false, `leaked ${marker}`);
  }
}

function adapterWithService(result, options = {}) {
  const calls = [];
  const adapter = createEngineerMobileVisitActionHttpHandlerAdapter({
    visitActionService: {
      async handleEngineerMobileVisitAction(payload) {
        calls.push(payload);

        if (options.throw) {
          throw new Error('raw thrown service failure raw_secret_should_not_leak');
        }

        return typeof result === 'function' ? result(payload) : result;
      },
    },
  });

  return { adapter, calls };
}

test('allowed success response is explicitly shaped and strips raw service fields', async () => {
  const { adapter, calls } = adapterWithService(allowedServiceResult());
  const response = await adapter.handleEngineerMobileVisitActionRequest(request());

  assert.equal(response.statusCode, 202);
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
  assert.equal(response.body.ok, true);
  assert.equal(response.body.accepted, true);
  assert.equal(response.body.allowed, true);
  assert.equal(response.body.action, 'engineer_mobile.start_travel');
  assert.equal(response.body.reasonCode, 'applied');
  assert.equal(response.body.transition.applied, true);
  assert.equal(response.body.transition.mobileVisitStatus, 'traveling');
  assert.equal(response.body.audit.recorded, true);
  assert.equal(calls.length, 1);
  assertNoForbiddenLeak(response);
});

test('generic denied ineligible and unavailable responses remain safe', async () => {
  const denied = await adapterWithService({
    ok: false,
    allowed: false,
    action: 'engineer_mobile.finish_work',
    reasonCode: 'permission_required',
    appointmentId: 'apt_task_2295',
    rawService: 'raw_service_should_not_leak',
  }).adapter.handleEngineerMobileVisitActionRequest(request({
    params: {
      appointmentId: 'apt_task_2295',
      action: 'engineer_mobile.finish_work',
    },
  }));
  const unavailable = await createEngineerMobileVisitActionHttpHandlerAdapter()
    .handleEngineerMobileVisitActionRequest(request());

  assert.equal(denied.statusCode, 403);
  assert.equal(denied.body.allowed, false);
  assert.equal(denied.body.reasonCode, 'permission_required');
  assert.equal(unavailable.statusCode, 500);
  assert.equal(unavailable.body.reasonCode, 'VISIT_ACTION_SERVICE_REQUIRED');
  assert.equal(unavailable.body.error.code, 'VISIT_ACTION_SERVICE_REQUIRED');
  assertNoForbiddenLeak([denied, unavailable]);
});

test('malformed service result fails safely without raw leakage', async () => {
  const response = await adapterWithService('raw_service_should_not_leak')
    .adapter.handleEngineerMobileVisitActionRequest(request());

  assert.equal(response.statusCode, 500);
  assert.equal(response.body.ok, false);
  assert.equal(response.body.accepted, false);
  assert.equal(response.body.allowed, false);
  assert.equal(response.body.reasonCode, 'service_invocation_failed');
  assert.equal(response.body.error.code, 'service_invocation_failed');
  assertNoForbiddenLeak(response);
});

test('malformed response fields are stripped from service result response', async () => {
  const response = await adapterWithService(allowedServiceResult({
    action: 'engineer_mobile.unsafe',
    reasonCode: 'raw_secret_should_not_leak',
    transitionIntent: {
      mobileVisitStatus: 'raw_transition_should_not_leak',
      visitResult: 'raw_private_should_not_leak',
    },
    auditRecorded: 'raw_audit_should_not_leak',
  })).adapter.handleEngineerMobileVisitActionRequest(request());

  assert.equal(response.statusCode, 202);
  assert.equal('action' in response.body, false);
  assert.equal(response.body.reasonCode, 'service_invocation_failed');
  assert.equal(response.body.transition.applied, true);
  assert.equal('mobileVisitStatus' in response.body.transition, false);
  assert.equal(response.body.audit.recorded, false);
  assertNoForbiddenLeak(response);
});

test('thrown service errors return generic response without raw error details', async () => {
  const response = await adapterWithService(undefined, { throw: true })
    .adapter.handleEngineerMobileVisitActionRequest(request());

  assert.equal(response.statusCode, 500);
  assert.equal(response.body.reasonCode, 'service_invocation_failed');
  assert.equal(response.body.error.code, 'service_invocation_failed');
  assertNoForbiddenLeak(response);
});

test('request and service result inputs are not mutated', async () => {
  const req = request();
  const serviceResult = allowedServiceResult();
  const beforeRequest = clone(req);
  const beforeServiceResult = clone(serviceResult);
  const { adapter } = adapterWithService(serviceResult);

  await adapter.handleEngineerMobileVisitActionRequest(req);

  assert.deepEqual(req, beforeRequest);
  assert.deepEqual(serviceResult, beforeServiceResult);
});
