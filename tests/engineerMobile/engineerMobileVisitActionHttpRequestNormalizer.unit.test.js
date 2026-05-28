'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  ENGINEER_MOBILE_VISIT_ACTION_HTTP_REQUEST_NORMALIZER_KIND,
  normalizeEngineerMobileVisitActionHttpRequest,
} = require('../../src/engineerMobile/engineerMobileVisitActionHttpRequestNormalizer');

const NOW = '2026-05-28T15:00:00.000Z';

function actor(overrides = {}) {
  return {
    id: 'eng_task_1854',
    organizationId: 'org_task_1854',
    permissions: ['engineer_mobile.visit.start_travel', 'invalid-permission-object', 42],
    token: 'raw_token_should_not_leak',
    authorization: 'raw_authorization_should_not_leak',
    privateNote: 'raw_actor_private_note_should_not_leak',
    ...overrides,
  };
}

function appointment(overrides = {}) {
  return {
    appointmentId: 'apt_task_1854',
    caseId: 'case_task_1854',
    organizationId: 'org_task_1854',
    assignedEngineerId: 'eng_task_1854',
    mobileVisitStatus: 'scheduled',
    customerPhone: 'raw_phone_should_not_leak',
    address: 'raw_address_should_not_leak',
    lineUserId: 'raw_line_should_not_leak',
    customerName: 'raw_customer_should_not_leak',
    privateNote: 'raw_private_note_should_not_leak',
    reportDraftBody: 'raw_report_draft_should_not_leak',
    providerPayload: 'raw_provider_payload_should_not_leak',
    dbMetadata: 'raw_db_metadata_should_not_leak',
    repositoryName: 'raw_repository_should_not_leak',
    publicationTarget: 'raw_publication_should_not_leak',
    completionReportId: 'raw_completion_report_should_not_leak',
    fieldServiceReportId: 'raw_field_service_report_should_not_leak',
    finalAppointmentId: 'raw_final_appointment_should_not_leak',
    ...overrides,
  };
}

function request(overrides = {}) {
  return {
    actor: actor(),
    params: {
      appointmentId: 'apt_task_1854',
      action: 'engineer_mobile.start_travel',
      unsafeParam: 'raw_param_should_not_leak',
    },
    body: {
      appointment: appointment(),
      visitResult: 'resolved',
      unsafeBody: 'raw_body_should_not_leak',
    },
    now: NOW,
    requestId: 'req_task_1854',
    headers: {
      authorization: 'raw_header_authorization_should_not_leak',
      'user-agent': 'raw_user_agent_should_not_leak',
    },
    cookies: {
      session: 'raw_cookie_should_not_leak',
    },
    session: {
      id: 'raw_session_should_not_leak',
    },
    ip: 'raw_ip_should_not_leak',
    userAgent: 'raw_root_user_agent_should_not_leak',
    ...overrides,
  };
}

function assertNoForbiddenLeak(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'raw_token_should_not_leak',
    'raw_authorization_should_not_leak',
    'raw_actor_private_note_should_not_leak',
    'raw_phone_should_not_leak',
    'raw_address_should_not_leak',
    'raw_line_should_not_leak',
    'raw_customer_should_not_leak',
    'raw_private_note_should_not_leak',
    'raw_report_draft_should_not_leak',
    'raw_provider_payload_should_not_leak',
    'raw_db_metadata_should_not_leak',
    'raw_repository_should_not_leak',
    'raw_publication_should_not_leak',
    'raw_completion_report_should_not_leak',
    'raw_field_service_report_should_not_leak',
    'raw_final_appointment_should_not_leak',
    'raw_param_should_not_leak',
    'raw_body_should_not_leak',
    'raw_header_authorization_should_not_leak',
    'raw_user_agent_should_not_leak',
    'raw_cookie_should_not_leak',
    'raw_session_should_not_leak',
    'raw_ip_should_not_leak',
    'raw_root_user_agent_should_not_leak',
    'raw_request_object_should_not_leak',
    'stack_should_not_leak',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('normalizes valid synthetic request with safe allowlisted fields', () => {
  const result = normalizeEngineerMobileVisitActionHttpRequest(request());

  assert.equal(result.ok, true);
  assert.equal(result.normalized, true);
  assert.equal(result.normalizerKind, ENGINEER_MOBILE_VISIT_ACTION_HTTP_REQUEST_NORMALIZER_KIND);
  assert.equal(result.action, 'engineer_mobile.start_travel');
  assert.equal(result.appointmentId, 'apt_task_1854');
  assert.equal(result.visitResult, 'resolved');
  assert.equal(result.now, NOW);
  assert.equal(result.requestId, 'req_task_1854');
  assert.deepEqual(result.actor, {
    id: 'eng_task_1854',
    organizationId: 'org_task_1854',
    permissions: ['engineer_mobile.visit.start_travel', 'invalid-permission-object', '42'],
  });
  assert.deepEqual(result.appointment, {
    appointmentId: 'apt_task_1854',
    caseId: 'case_task_1854',
    organizationId: 'org_task_1854',
    assignedEngineerId: 'eng_task_1854',
    mobileVisitStatus: 'scheduled',
  });
  assertNoForbiddenLeak(result);
});

test('extracts action appointmentId appointment visitResult now and requestId from accepted request shape', () => {
  const result = normalizeEngineerMobileVisitActionHttpRequest(request({
    params: {
      appointmentId: 'apt_task_1854_params',
      action: 'engineer_mobile.record_visit_result',
    },
    body: {
      appointment: appointment({ appointmentId: 'apt_task_1854_params' }),
      visitResult: 'parts_required',
    },
    now: '2026-05-28T16:00:00.000Z',
    requestId: 'req_task_1854_params',
  }));

  assert.equal(result.action, 'engineer_mobile.record_visit_result');
  assert.equal(result.appointmentId, 'apt_task_1854_params');
  assert.equal(result.appointment.appointmentId, 'apt_task_1854_params');
  assert.equal(result.visitResult, 'parts_required');
  assert.equal(result.now, '2026-05-28T16:00:00.000Z');
  assert.equal(result.requestId, 'req_task_1854_params');
});

test('supports legacy synthetic body fallbacks without copying raw request objects', () => {
  const result = normalizeEngineerMobileVisitActionHttpRequest({
    body: {
      action: 'engineer_mobile.arrive',
      actor: actor({ engineerId: 'eng_legacy' }),
      appointment: appointment({ appointmentId: 'apt_legacy' }),
      visitResult: 'not_fixed',
      now: NOW,
      request: 'raw_request_object_should_not_leak',
    },
    requestId: 'req_legacy',
  });

  assert.equal(result.ok, true);
  assert.equal(result.action, 'engineer_mobile.arrive');
  assert.equal(result.actor.engineerId, 'eng_legacy');
  assert.equal(result.appointment.appointmentId, 'apt_legacy');
  assert.equal(result.visitResult, 'not_fixed');
  assert.equal(result.now, NOW);
  assert.equal(result.requestId, 'req_legacy');
  assertNoForbiddenLeak(result);
});

test('allows missing and partial request without throwing as safe normalized shape', () => {
  assert.doesNotThrow(() => normalizeEngineerMobileVisitActionHttpRequest());
  assert.doesNotThrow(() => normalizeEngineerMobileVisitActionHttpRequest(null));
  assert.doesNotThrow(() => normalizeEngineerMobileVisitActionHttpRequest({ body: {} }));

  assert.deepEqual(normalizeEngineerMobileVisitActionHttpRequest(), {
    ok: true,
    normalized: true,
    normalizerKind: ENGINEER_MOBILE_VISIT_ACTION_HTTP_REQUEST_NORMALIZER_KIND,
  });
});

test('rejects unsupported request values with sanitized request_required failure', () => {
  const result = normalizeEngineerMobileVisitActionHttpRequest('raw_request_object_should_not_leak');

  assert.deepEqual(result, {
    ok: false,
    normalized: false,
    normalizerKind: ENGINEER_MOBILE_VISIT_ACTION_HTTP_REQUEST_NORMALIZER_KIND,
    reasonCode: 'request_required',
  });
  assertNoForbiddenLeak(result);
});

test('detects appointment ID mismatch against appointment id', () => {
  const result = normalizeEngineerMobileVisitActionHttpRequest(request({
    params: { appointmentId: 'apt_from_params', action: 'engineer_mobile.start_travel' },
    body: {
      appointment: appointment({ appointmentId: undefined, id: 'apt_from_body_id' }),
    },
  }));

  assert.equal(result.ok, false);
  assert.equal(result.normalized, false);
  assert.equal(result.reasonCode, 'appointment_id_mismatch');
  assert.equal(result.requestId, 'req_task_1854');
  assertNoForbiddenLeak(result);
});

test('detects appointment ID mismatch against appointment appointmentId', () => {
  const result = normalizeEngineerMobileVisitActionHttpRequest(request({
    params: { appointmentId: 'apt_from_params', action: 'engineer_mobile.start_travel' },
    body: {
      appointment: appointment({ appointmentId: 'apt_from_body' }),
    },
  }));

  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'appointment_id_mismatch');
  assert.equal(result.requestId, 'req_task_1854');
  assertNoForbiddenLeak(result);
});

test('does not copy headers cookies session authorization ip or user-agent fields', () => {
  const result = normalizeEngineerMobileVisitActionHttpRequest(request());

  for (const key of ['headers', 'cookies', 'authorization', 'session', 'ip', 'user-agent', 'userAgent']) {
    assert.equal(key in result, false);
  }
  assertNoForbiddenLeak(result);
});

test('does not copy phone address LINE customer private notes or report draft fields', () => {
  const result = normalizeEngineerMobileVisitActionHttpRequest(request());

  assertNoForbiddenLeak(result);
});

test('does not copy provider DB repository or customer publication fields', () => {
  const result = normalizeEngineerMobileVisitActionHttpRequest(request());

  assertNoForbiddenLeak(result);
});

test('does not copy completion report field service report or final appointment fields', () => {
  const result = normalizeEngineerMobileVisitActionHttpRequest(request());

  assertNoForbiddenLeak(result);
});

test('does not mutate request body params actor or appointment', () => {
  const req = request();
  const before = structuredClone(req);

  normalizeEngineerMobileVisitActionHttpRequest(req);

  assert.deepEqual(req, before);
});
