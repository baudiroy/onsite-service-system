'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  ENGINEER_MOBILE_AUDIT_EVENT_KEYS,
  ENGINEER_MOBILE_AUDIT_METADATA_KEYS,
  SUPPORTED_ENGINEER_MOBILE_AUDIT_EVENT_TYPES,
  buildEngineerMobileAuditEvent,
} = require('../../src/engineerMobile/engineerMobileAuditEventBuilder');

const ROUTES = Object.freeze({
  TASK_LIST: '/engineer-mobile/tasks',
  TASK_DETAIL: '/engineer-mobile/tasks/:appointmentId',
  VISIT_ACTION: '/engineer-mobile/appointments/:appointmentId/actions/:action',
});

const EVENT_INPUTS = Object.freeze({
  'engineer_mobile.task_list.allow': Object.freeze({
    decision: 'allow',
    method: 'GET',
    route: ROUTES.TASK_LIST,
    source: 'engineer_mobile_task_list_handler',
  }),
  'engineer_mobile.task_list.deny': Object.freeze({
    decision: 'deny',
    method: 'GET',
    reasonCode: 'permission_denied',
    route: ROUTES.TASK_LIST,
    source: 'engineer_mobile_task_list_handler',
  }),
  'engineer_mobile.task_detail.allow': Object.freeze({
    appointmentId: 'apt_task_2167',
    decision: 'allow',
    method: 'GET',
    route: ROUTES.TASK_DETAIL,
    source: 'engineer_mobile_task_detail_handler',
  }),
  'engineer_mobile.task_detail.deny': Object.freeze({
    appointmentId: 'apt_task_2167',
    decision: 'deny',
    method: 'GET',
    reasonCode: 'assignment_not_found',
    route: ROUTES.TASK_DETAIL,
    source: 'engineer_mobile_task_detail_handler',
  }),
  'engineer_mobile.visit_action.allow': Object.freeze({
    action: 'engineer_mobile.start_travel',
    appointmentId: 'apt_task_2167',
    decision: 'allow',
    method: 'POST',
    route: ROUTES.VISIT_ACTION,
    source: 'engineer_mobile_visit_action_handler',
  }),
  'engineer_mobile.visit_action.deny': Object.freeze({
    action: 'engineer_mobile.finish_work',
    appointmentId: 'apt_task_2167',
    decision: 'deny',
    method: 'POST',
    reasonCode: 'action_not_allowed',
    route: ROUTES.VISIT_ACTION,
    source: 'engineer_mobile_visit_action_handler',
  }),
  'engineer_mobile.route_registration.success': Object.freeze({
    decision: 'success',
    method: 'GET',
    route: ROUTES.TASK_LIST,
    source: 'engineer_mobile_route_registration',
    metadata: Object.freeze({
      dependencyValid: true,
      registrationResult: 'success',
    }),
  }),
  'engineer_mobile.route_registration.failure': Object.freeze({
    decision: 'failure',
    method: 'POST',
    reasonCode: 'route_registration_failed',
    route: ROUTES.VISIT_ACTION,
    source: 'engineer_mobile_route_registration',
    metadata: Object.freeze({
      dependencyValid: false,
      registrationResult: 'failure',
    }),
  }),
});

const forbiddenValues = [
  'raw_request_should_not_leak',
  'raw_response_should_not_leak',
  'authorization_header_should_not_leak',
  'cookie_should_not_leak',
  'Bearer token_should_not_leak',
  'secret_should_not_leak',
  'raw_phone_should_not_leak',
  'raw_address_should_not_leak',
  'raw_email_should_not_leak@example.com',
  'U1234567890abcdef',
  'raw_engineer_context_should_not_leak',
  'raw_service_result_should_not_leak',
  'raw_db_row_should_not_leak',
  'select secret_should_not_leak',
  'raw_provider_payload_should_not_leak',
  'raw_ai_prompt_should_not_leak',
  'raw_stack_should_not_leak',
  'private_note_should_not_leak',
  'completion_report_private_body_should_not_leak',
  'unknown_field_should_not_leak',
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function baseInput(eventType, overrides = {}) {
  return {
    eventType,
    occurredAt: '2026-05-30T02:00:00.000Z',
    requestId: 'req_task_2167',
    actorType: 'engineer',
    organizationId: 'org_task_2167',
    engineerId: 'eng_task_2167',
    caseId: 'case_task_2167',
    metadata: {
      routeMatched: true,
      contextPresent: true,
      identifierValid: true,
      permissionPassed: true,
      actionAllowed: true,
      dependencyValid: true,
      registrationResult: 'success',
    },
    ...EVENT_INPUTS[eventType],
    ...overrides,
  };
}

function assertAllowedKeys(record, allowedKeys) {
  assert.deepEqual(Object.keys(record).sort(), [...allowedKeys].sort());
}

function assertNoLeak(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of forbiddenValues) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }

  for (const forbiddenKey of [
    'rawRequest',
    'rawResponse',
    'headers',
    'rawHeaders',
    'authorization',
    'cookies',
    'token',
    'secret',
    'body',
    'query',
    'params',
    'rawUser',
    'rawSession',
    'rawAuth',
    'customerPhone',
    'customerAddress',
    'customerEmail',
    'lineUserId',
    'rawEngineerContext',
    'rawServiceResult',
    'dbRows',
    'queryMetadata',
    'providerPayload',
    'aiPrompt',
    'stack',
    'sql',
    'privateNote',
    'completionReportPrivateBody',
    'unknownField',
  ]) {
    assert.equal(serialized.includes(`"${forbiddenKey}"`), false, `leaked key ${forbiddenKey}`);
  }
}

test('exports supported event types and explicit output allowlists', () => {
  assert.deepEqual(SUPPORTED_ENGINEER_MOBILE_AUDIT_EVENT_TYPES, Object.keys(EVENT_INPUTS));
  assert.deepEqual(ENGINEER_MOBILE_AUDIT_EVENT_KEYS, [
    'eventType',
    'occurredAt',
    'requestId',
    'actorType',
    'organizationId',
    'engineerId',
    'caseId',
    'appointmentId',
    'action',
    'decision',
    'reasonCode',
    'route',
    'method',
    'source',
    'metadata',
  ]);
  assert.deepEqual(ENGINEER_MOBILE_AUDIT_METADATA_KEYS, [
    'routeMatched',
    'contextPresent',
    'identifierValid',
    'permissionPassed',
    'actionAllowed',
    'dependencyValid',
    'registrationResult',
  ]);
});

test('each supported event type builds a sanitized audit event', () => {
  for (const eventType of SUPPORTED_ENGINEER_MOBILE_AUDIT_EVENT_TYPES) {
    const result = buildEngineerMobileAuditEvent(baseInput(eventType));

    assert.equal(result.ok, true, eventType);
    assert.equal(result.auditEvent.eventType, eventType);
    assertAllowedKeys(result.auditEvent, ENGINEER_MOBILE_AUDIT_EVENT_KEYS.filter((key) => (
      result.auditEvent[key] !== undefined
    )));
    assertNoLeak(result);
  }
});

test('unknown or arbitrary event type fails closed without emitting eventType', () => {
  for (const eventType of [
    undefined,
    '',
    'engineer_mobile.task_list.allow;select secret_should_not_leak',
    'engineer_mobile.unknown.allow',
    'customer_access.case_overview.allow',
  ]) {
    const result = buildEngineerMobileAuditEvent({
      ...baseInput('engineer_mobile.task_list.allow'),
      eventType,
    });

    assert.deepEqual(result, {
      ok: false,
      reasonCode: 'invalid_event_type',
    });
    assertNoLeak(result);
  }
});

test('non-object and promise-like input fails closed', () => {
  for (const input of [
    null,
    undefined,
    [],
    'engineer_mobile.task_list.allow',
    { then() {} },
  ]) {
    assert.deepEqual(buildEngineerMobileAuditEvent(input), {
      ok: false,
      reasonCode: 'invalid_input',
    });
  }
});

test('mismatched route method decision and source fail closed', () => {
  const cases = [
    [{ decision: 'deny' }, 'invalid_decision'],
    [{ route: '/__internal/engineer-mobile/tasks' }, 'invalid_route'],
    [{ route: ROUTES.TASK_LIST, method: 'POST' }, 'invalid_method'],
    [{ method: 'DELETE' }, 'invalid_method'],
    [{ source: 'raw_provider_send_stack_should_not_pass' }, 'invalid_source'],
  ];

  for (const [overrides, reasonCode] of cases) {
    assert.deepEqual(
      buildEngineerMobileAuditEvent(baseInput('engineer_mobile.task_list.allow', overrides)),
      {
        ok: false,
        reasonCode,
      },
    );
  }
});

test('visit action requires safe allowlisted action and rejects action on non-action events', () => {
  assert.deepEqual(
    buildEngineerMobileAuditEvent(baseInput('engineer_mobile.visit_action.allow', {
      action: undefined,
    })),
    {
      ok: false,
      reasonCode: 'invalid_action',
    },
  );
  assert.deepEqual(
    buildEngineerMobileAuditEvent(baseInput('engineer_mobile.visit_action.allow', {
      action: 'engineer_mobile.finish_report',
    })),
    {
      ok: false,
      reasonCode: 'invalid_action',
    },
  );
  assert.deepEqual(
    buildEngineerMobileAuditEvent(baseInput('engineer_mobile.task_detail.allow', {
      action: 'engineer_mobile.start_travel',
    })),
    {
      ok: false,
      reasonCode: 'invalid_action',
    },
  );
});

test('allow and route-registration success events do not emit reasonCode', () => {
  for (const eventType of [
    'engineer_mobile.task_list.allow',
    'engineer_mobile.task_detail.allow',
    'engineer_mobile.visit_action.allow',
    'engineer_mobile.route_registration.success',
  ]) {
    const withoutReason = buildEngineerMobileAuditEvent(baseInput(eventType));
    const withReason = buildEngineerMobileAuditEvent(baseInput(eventType, {
      reasonCode: 'service_unavailable',
    }));

    assert.equal(withoutReason.ok, true);
    assert.equal(Object.prototype.hasOwnProperty.call(withoutReason.auditEvent, 'reasonCode'), false);
    assert.deepEqual(withReason, {
      ok: false,
      reasonCode: 'invalid_reason_code',
    });
  }
});

test('deny and route-registration failure events accept only safe reasonCodes', () => {
  const safeReason = buildEngineerMobileAuditEvent(baseInput('engineer_mobile.visit_action.deny', {
    reasonCode: 'service_unavailable',
  }));
  const rawReason = buildEngineerMobileAuditEvent(baseInput('engineer_mobile.visit_action.deny', {
    reasonCode: 'select token_should_not_leak from secrets',
  }));

  assert.equal(safeReason.ok, true);
  assert.equal(safeReason.auditEvent.reasonCode, 'service_unavailable');
  assert.deepEqual(rawReason, {
    ok: false,
    reasonCode: 'invalid_reason_code',
  });
  assertNoLeak(rawReason);
});

test('metadata allowlist keeps only permitted primitive values', () => {
  const result = buildEngineerMobileAuditEvent(baseInput('engineer_mobile.visit_action.deny', {
    metadata: {
      routeMatched: false,
      contextPresent: true,
      identifierValid: false,
      permissionPassed: false,
      actionAllowed: false,
      dependencyValid: true,
      registrationResult: 'failure',
      nested: { raw: 'raw_request_should_not_leak' },
      rawPayload: 'raw_provider_payload_should_not_leak',
      stringBoolean: 'true',
    },
  }));

  assert.equal(result.ok, true);
  assert.deepEqual(result.auditEvent.metadata, {
    routeMatched: false,
    contextPresent: true,
    identifierValid: false,
    permissionPassed: false,
    actionAllowed: false,
  });
  assertNoLeak(result);
});

test('metadata requires actual booleans and safe registrationResult labels', () => {
  const success = buildEngineerMobileAuditEvent(baseInput('engineer_mobile.route_registration.success', {
    metadata: {
      dependencyValid: true,
      registrationResult: 'success',
    },
  }));
  const failure = buildEngineerMobileAuditEvent(baseInput('engineer_mobile.route_registration.failure', {
    metadata: {
      dependencyValid: false,
      registrationResult: 'unavailable',
    },
  }));
  const invalid = buildEngineerMobileAuditEvent(baseInput('engineer_mobile.route_registration.failure', {
    metadata: {
      dependencyValid: 'false',
      registrationResult: 'select secret_should_not_leak',
    },
  }));

  assert.deepEqual(success.auditEvent.metadata, {
    dependencyValid: true,
    registrationResult: 'success',
  });
  assert.deepEqual(failure.auditEvent.metadata, {
    dependencyValid: false,
    registrationResult: 'unavailable',
  });
  assert.equal(Object.prototype.hasOwnProperty.call(invalid.auditEvent, 'metadata'), false);
  assertNoLeak(invalid);
});

test('unsafe identifiers and timestamps are omitted rather than leaked', () => {
  const result = buildEngineerMobileAuditEvent(baseInput('engineer_mobile.task_detail.allow', {
    occurredAt: 'Sat May 30 2026 token_should_not_leak',
    requestId: 'Bearer token_should_not_leak',
    organizationId: 'postgres://user:password@localhost/db',
    engineerId: '0912-345-678',
    caseId: 'case@example.com',
    appointmentId: 'apt_safe_2167',
  }));

  assert.equal(result.ok, true);
  assert.equal(Object.prototype.hasOwnProperty.call(result.auditEvent, 'occurredAt'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(result.auditEvent, 'requestId'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(result.auditEvent, 'organizationId'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(result.auditEvent, 'engineerId'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(result.auditEvent, 'caseId'), false);
  assert.equal(result.auditEvent.appointmentId, 'apt_safe_2167');
  assertNoLeak(result);
});

test('raw request response auth customer provider DB AI debug and private fields do not appear', () => {
  const result = buildEngineerMobileAuditEvent(baseInput('engineer_mobile.task_list.deny', {
    rawRequest: 'raw_request_should_not_leak',
    rawResponse: 'raw_response_should_not_leak',
    headers: { authorization: 'authorization_header_should_not_leak' },
    rawHeaders: ['authorization_header_should_not_leak'],
    authorization: 'Bearer token_should_not_leak',
    cookies: 'cookie_should_not_leak',
    token: 'Bearer token_should_not_leak',
    secret: 'secret_should_not_leak',
    body: { raw: 'raw_request_should_not_leak' },
    query: { raw: 'raw_request_should_not_leak' },
    params: { raw: 'raw_request_should_not_leak' },
    customerPhone: 'raw_phone_should_not_leak',
    customerAddress: 'raw_address_should_not_leak',
    customerEmail: 'raw_email_should_not_leak@example.com',
    lineUserId: 'U1234567890abcdef',
    rawEngineerContext: 'raw_engineer_context_should_not_leak',
    rawServiceResult: 'raw_service_result_should_not_leak',
    dbRows: ['raw_db_row_should_not_leak'],
    queryMetadata: 'select secret_should_not_leak',
    providerPayload: 'raw_provider_payload_should_not_leak',
    aiPrompt: 'raw_ai_prompt_should_not_leak',
    stack: 'raw_stack_should_not_leak',
    sql: 'select secret_should_not_leak',
    privateNote: 'private_note_should_not_leak',
    completionReportPrivateBody: 'completion_report_private_body_should_not_leak',
    unknownField: 'unknown_field_should_not_leak',
  }));

  assert.equal(result.ok, true);
  assertNoLeak(result);
});

test('builder is deterministic and does not mutate input or share metadata references', () => {
  const input = baseInput('engineer_mobile.visit_action.allow');
  const original = clone(input);
  const first = buildEngineerMobileAuditEvent(input);
  const second = buildEngineerMobileAuditEvent(input);

  assert.deepEqual(input, original);
  assert.deepEqual(first, second);
  assert.notEqual(first.auditEvent.metadata, input.metadata);

  first.auditEvent.metadata.routeMatched = false;
  assert.equal(input.metadata.routeMatched, true);
});

test('missing occurredAt and requestId remain omitted', () => {
  const result = buildEngineerMobileAuditEvent(baseInput('engineer_mobile.task_list.allow', {
    occurredAt: undefined,
    requestId: undefined,
  }));

  assert.equal(result.ok, true);
  assert.equal(Object.prototype.hasOwnProperty.call(result.auditEvent, 'occurredAt'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(result.auditEvent, 'requestId'), false);
});
