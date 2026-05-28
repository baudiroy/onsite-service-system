'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  ENGINEER_MOBILE_VISIT_ACTION_HTTP_RESPONSE_PRESENTER_KIND,
  presentEngineerMobileVisitActionHttpResponse,
} = require('../../src/engineerMobile/engineerMobileVisitActionHttpResponsePresenter');

function acceptedResult(overrides = {}) {
  return {
    ok: true,
    allowed: true,
    action: 'engineer_mobile.start_travel',
    reasonCode: 'applied',
    appointmentId: 'apt_task_1856',
    caseId: 'case_task_1856',
    organizationId: 'org_task_1856',
    transitionApplied: true,
    auditRecorded: true,
    transitionIntent: {
      mobileVisitStatus: 'traveling',
    },
    ...overrides,
  };
}

function presentService(serviceResult, requestId = 'req_task_1856') {
  return presentEngineerMobileVisitActionHttpResponse({
    responseKind: 'service_result',
    serviceResult,
    requestId,
  });
}

function presentError(reasonCode, statusCode = 500, requestId = 'req_task_1856') {
  return presentEngineerMobileVisitActionHttpResponse({
    responseKind: 'error',
    statusCode,
    reasonCode,
    requestId,
  });
}

function assertNoForbiddenLeak(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'raw_phone_should_not_leak',
    'raw_address_should_not_leak',
    'raw_customer_should_not_leak',
    'raw_private_note_should_not_leak',
    'raw_report_draft_should_not_leak',
    'raw_provider_payload_should_not_leak',
    'raw_publication_should_not_leak',
    'raw_auth_material_should_not_leak',
    'raw_cookie_should_not_leak',
    'raw_session_should_not_leak',
    'raw_request_should_not_leak',
    'raw service failure',
    'stack_should_not_leak',
    'select * from',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('exports response presenter kind', () => {
  assert.equal(
    ENGINEER_MOBILE_VISIT_ACTION_HTTP_RESPONSE_PRESENTER_KIND,
    'engineer_mobile.visit_action_http_response_presenter',
  );
});

test('accepted service result maps to sanitized HTTP 202 response', () => {
  const response = presentService(acceptedResult());

  assert.deepEqual(response, {
    statusCode: 202,
    body: {
      ok: true,
      accepted: true,
      allowed: true,
      action: 'engineer_mobile.start_travel',
      reasonCode: 'applied',
      appointmentId: 'apt_task_1856',
      caseId: 'case_task_1856',
      organizationId: 'org_task_1856',
      transition: {
        applied: true,
        mobileVisitStatus: 'traveling',
      },
      audit: {
        recorded: true,
      },
      requestId: 'req_task_1856',
    },
  });
});

test('accepted visit result response includes only safe transition fields', () => {
  const response = presentService(acceptedResult({
    action: 'engineer_mobile.record_visit_result',
    transitionIntent: {
      mobileVisitStatus: 'visit_result_recorded',
      visitResult: 'parts_required',
      rawReportDraft: 'raw_report_draft_should_not_leak',
    },
    rawCustomerPhone: 'raw_phone_should_not_leak',
    privateNote: 'raw_private_note_should_not_leak',
  }));

  assert.equal(response.statusCode, 202);
  assert.equal(response.body.action, 'engineer_mobile.record_visit_result');
  assert.deepEqual(response.body.transition, {
    applied: true,
    mobileVisitStatus: 'visit_result_recorded',
    visitResult: 'parts_required',
  });
  assertNoForbiddenLeak(response);
});

test('policy denial maps to sanitized HTTP 403 response', () => {
  const response = presentService({
    ok: false,
    allowed: false,
    action: 'engineer_mobile.finish_work',
    reasonCode: 'permission_required',
    appointmentId: 'apt_task_1856',
    caseId: 'case_task_1856',
    organizationId: 'org_task_1856',
    transitionApplied: false,
    auditRecorded: false,
  });

  assert.equal(response.statusCode, 403);
  assert.equal(response.body.accepted, false);
  assert.equal(response.body.allowed, false);
  assert.equal(response.body.reasonCode, 'permission_required');
  assert.equal(response.body.transition.applied, false);
  assert.equal(response.body.audit.recorded, false);
});

test('unsupported action maps to sanitized HTTP 400 response', () => {
  const response = presentService({
    ok: false,
    allowed: false,
    action: 'engineer_mobile.unknown',
    reasonCode: 'unsupported_action',
    appointmentId: 'apt_task_1856',
  });

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.reasonCode, 'unsupported_action');
});

test('writer and persistence failure reasons map to sanitized HTTP 500 response', () => {
  for (const reasonCode of [
    'transition_writer_required',
    'transition_write_failed',
    'patch_writer_required',
    'patch_write_failed',
    'audit_writer_required',
    'audit_write_failed',
    'audit_event_writer_required',
    'audit_event_write_failed',
    'persistence_port_required',
    'persistence_port_write_failed',
    'repository_adapter_required',
    'repository_adapter_write_failed',
    'repository_write_failed',
  ]) {
    const response = presentService({
      ok: false,
      allowed: true,
      action: 'engineer_mobile.start_travel',
      reasonCode,
      appointmentId: 'apt_task_1856',
      transitionApplied: false,
      auditRecorded: false,
    });

    assert.equal(response.statusCode, 500, reasonCode);
    assert.equal(response.body.reasonCode, reasonCode);
  }
});

test('explicit error response maps status code and sanitized error body', () => {
  const response = presentError('VISIT_ACTION_SERVICE_REQUIRED', 500);

  assert.deepEqual(response, {
    statusCode: 500,
    body: {
      ok: false,
      accepted: false,
      allowed: false,
      reasonCode: 'VISIT_ACTION_SERVICE_REQUIRED',
      requestId: 'req_task_1856',
      error: {
        code: 'VISIT_ACTION_SERVICE_REQUIRED',
      },
    },
  });
});

test('appointment mismatch error maps to HTTP 400', () => {
  const response = presentError('APPOINTMENT_ID_MISMATCH', 400);

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error.code, 'APPOINTMENT_ID_MISMATCH');
});

test('invalid status code falls back safely for explicit errors', () => {
  const response = presentError('VISIT_ACTION_SERVICE_FAILED', 999);

  assert.equal(response.statusCode, 500);
  assert.equal(response.body.error.code, 'VISIT_ACTION_SERVICE_FAILED');
});

test('does not throw for missing null primitive or partial input', () => {
  assert.equal(presentEngineerMobileVisitActionHttpResponse().statusCode, 202);
  assert.equal(presentEngineerMobileVisitActionHttpResponse(null).statusCode, 202);
  assert.equal(presentEngineerMobileVisitActionHttpResponse('raw_request_should_not_leak').statusCode, 202);
  assert.equal(presentService(undefined).statusCode, 202);
});

test('output allowlist excludes raw response and error details', () => {
  const response = presentService({
    ...acceptedResult(),
    rawCustomerPhone: 'raw_phone_should_not_leak',
    address: 'raw_address_should_not_leak',
    customerName: 'raw_customer_should_not_leak',
    privateNote: 'raw_private_note_should_not_leak',
    reportDraftBody: 'raw_report_draft_should_not_leak',
    providerPayload: 'raw_provider_payload_should_not_leak',
    publicationTarget: 'raw_publication_should_not_leak',
    authMaterial: 'raw_auth_material_should_not_leak',
    cookie: 'raw_cookie_should_not_leak',
    session: 'raw_session_should_not_leak',
    error: {
      message: 'raw service failure',
      stack: 'stack_should_not_leak',
      query: 'select * from unsafe_table',
    },
  });

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

test('does not mutate service result input', () => {
  const serviceResult = acceptedResult({
    transitionIntent: {
      mobileVisitStatus: 'traveling',
      visitResult: 'resolved',
    },
  });
  const before = structuredClone(serviceResult);

  presentService(serviceResult);

  assert.deepEqual(serviceResult, before);
});
