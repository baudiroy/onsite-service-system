'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  CUSTOMER_ACCESS_AUDIT_EVENT_KEYS,
  CUSTOMER_ACCESS_AUDIT_METADATA_KEYS,
  SUPPORTED_CUSTOMER_ACCESS_AUDIT_EVENT_TYPES,
  buildCustomerAccessAuditEvent,
} = require('../../src/customerAccess/customerAccessAuditEventBuilder');

const forbiddenValues = [
  'raw_request_should_not_leak',
  'raw_response_should_not_leak',
  'raw_headers_should_not_leak',
  'Bearer token_should_not_leak',
  'raw_cookie_should_not_leak',
  'raw_body_should_not_leak',
  'raw_query_should_not_leak',
  'raw_params_should_not_leak',
  'raw_user_should_not_leak',
  'raw_session_should_not_leak',
  'raw_auth_should_not_leak',
  'raw_channel_should_not_leak',
  'raw_access_should_not_leak',
  '0912-345-678',
  'No. 1 Secret Road',
  'customer@example.com',
  'U1234567890abcdef',
  'secret_should_not_leak',
  'db_row_should_not_leak',
  'query_metadata_should_not_leak',
  'provider_payload_should_not_leak',
  'ai_prompt_should_not_leak',
  'ai_response_should_not_leak',
  'internal_note_should_not_leak',
  'engineer_note_should_not_leak',
  'diagnosis_should_not_leak',
  'completion_note_should_not_leak',
  'private_report_body_should_not_leak',
  'debug_should_not_leak',
  'stack_should_not_leak',
  'select secret_should_not_leak',
  'zeabur_should_not_leak',
  'payment_should_not_leak',
  'billing_should_not_leak',
  'unknown_field_should_not_leak',
  'nested_metadata_should_not_leak',
];

function baseInput(overrides = {}) {
  return {
    eventType: 'customer_access.service_report.allow',
    occurredAt: '2026-05-30T10:20:30.000Z',
    requestId: 'request_audit_builder_001',
    actorType: 'customer',
    organizationId: 'org_audit_builder_001',
    customerId: 'customer_audit_builder_001',
    caseId: 'case_audit_builder_001',
    reportId: 'report_audit_builder_001',
    route: '/customer-access/:caseId/service-report/:reportId',
    method: 'get',
    source: 'customer_access_route',
    metadata: {
      routeMatched: true,
      contextPresent: true,
      identifierValid: true,
      dependencyValid: true,
      registrationResult: 'success',
    },
    ...overrides,
  };
}

function assertAllowedAuditEventKeys(auditEvent) {
  assert.deepEqual(
    Object.keys(auditEvent).sort(),
    Object.keys(auditEvent)
      .filter((key) => CUSTOMER_ACCESS_AUDIT_EVENT_KEYS.includes(key))
      .sort(),
  );
}

function assertNoLeak(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of forbiddenValues) {
    assert.equal(serialized.includes(forbidden), false, `audit event leaked ${forbidden}`);
  }
}

test('exports exact supported event key and metadata allowlists', () => {
  assert.deepEqual(SUPPORTED_CUSTOMER_ACCESS_AUDIT_EVENT_TYPES, [
    'customer_access.case_overview.allow',
    'customer_access.case_overview.deny',
    'customer_access.service_report.allow',
    'customer_access.service_report.deny',
    'customer_access.route_registration.success',
    'customer_access.route_registration.failure',
  ]);
  assert.deepEqual(CUSTOMER_ACCESS_AUDIT_EVENT_KEYS, [
    'eventType',
    'occurredAt',
    'requestId',
    'actorType',
    'organizationId',
    'customerId',
    'caseId',
    'reportId',
    'decision',
    'reasonCode',
    'route',
    'method',
    'source',
    'metadata',
  ]);
  assert.deepEqual(CUSTOMER_ACCESS_AUDIT_METADATA_KEYS, [
    'routeMatched',
    'contextPresent',
    'identifierValid',
    'dependencyValid',
    'registrationResult',
  ]);
});

test('builds each supported event type with sanitized output keys and inferred decision', () => {
  const expectedDecisions = {
    'customer_access.case_overview.allow': 'allow',
    'customer_access.case_overview.deny': 'deny',
    'customer_access.service_report.allow': 'allow',
    'customer_access.service_report.deny': 'deny',
    'customer_access.route_registration.success': 'success',
    'customer_access.route_registration.failure': 'failure',
  };

  for (const eventType of SUPPORTED_CUSTOMER_ACCESS_AUDIT_EVENT_TYPES) {
    const result = buildCustomerAccessAuditEvent(baseInput({
      eventType,
      route: eventType.includes('case_overview')
        ? '/customer-access/:caseId'
        : '/customer-access/:caseId/service-report/:reportId',
      reasonCode: eventType.endsWith('.failure') || eventType.endsWith('.deny')
        ? 'customer_access_unavailable'
        : undefined,
    }));

    assert.equal(result.ok, true);
    assert.equal(result.auditEvent.eventType, eventType);
    assert.equal(result.auditEvent.decision, expectedDecisions[eventType]);
    assert.equal(result.auditEvent.method, 'GET');
    assertAllowedAuditEventKeys(result.auditEvent);
    assertNoLeak(result);
  }
});

test('normalizes a full valid service report audit event without extra keys', () => {
  const result = buildCustomerAccessAuditEvent(baseInput({
    decision: 'allow',
    reasonCode: 'dependency_invalid',
    unsafeExtra: 'unknown_field_should_not_leak',
  }));

  assert.deepEqual(result, {
    ok: true,
    auditEvent: {
      eventType: 'customer_access.service_report.allow',
      occurredAt: '2026-05-30T10:20:30.000Z',
      requestId: 'request_audit_builder_001',
      actorType: 'customer',
      organizationId: 'org_audit_builder_001',
      customerId: 'customer_audit_builder_001',
      caseId: 'case_audit_builder_001',
      reportId: 'report_audit_builder_001',
      decision: 'allow',
      reasonCode: 'dependency_invalid',
      route: '/customer-access/:caseId/service-report/:reportId',
      method: 'GET',
      source: 'customer_access_route',
      metadata: {
        routeMatched: true,
        contextPresent: true,
        identifierValid: true,
        dependencyValid: true,
        registrationResult: 'success',
      },
    },
  });
  assertAllowedAuditEventKeys(result.auditEvent);
  assertNoLeak(result);
});

test('unknown event type fails closed without emitting arbitrary event type', () => {
  const result = buildCustomerAccessAuditEvent(baseInput({
    eventType: 'customer_access.raw_request.token_should_not_leak',
  }));

  assert.deepEqual(result, {
    ok: false,
    reasonCode: 'invalid_event_type',
  });
  assertNoLeak(result);
});

test('sensitive raw containers and unknown fields are stripped from audit output', () => {
  const result = buildCustomerAccessAuditEvent(baseInput({
    rawRequest: 'raw_request_should_not_leak',
    rawResponse: 'raw_response_should_not_leak',
    headers: 'raw_headers_should_not_leak',
    rawHeaders: ['raw_headers_should_not_leak'],
    authorization: 'Bearer token_should_not_leak',
    cookies: 'raw_cookie_should_not_leak',
    body: 'raw_body_should_not_leak',
    rawBody: 'raw_body_should_not_leak',
    query: 'raw_query_should_not_leak',
    params: 'raw_params_should_not_leak',
    user: 'raw_user_should_not_leak',
    session: 'raw_session_should_not_leak',
    auth: 'raw_auth_should_not_leak',
    channel: 'raw_channel_should_not_leak',
    access: 'raw_access_should_not_leak',
    phone: '0912-345-678',
    address: 'No. 1 Secret Road',
    email: 'customer@example.com',
    lineUserId: 'U1234567890abcdef',
    token: 'secret_should_not_leak',
    dbRows: ['db_row_should_not_leak'],
    queryMetadata: 'query_metadata_should_not_leak',
    providerPayload: 'provider_payload_should_not_leak',
    aiPrompt: 'ai_prompt_should_not_leak',
    aiResponse: 'ai_response_should_not_leak',
    internalNote: 'internal_note_should_not_leak',
    engineerNote: 'engineer_note_should_not_leak',
    diagnosis: 'diagnosis_should_not_leak',
    completionNote: 'completion_note_should_not_leak',
    privateReportBody: 'private_report_body_should_not_leak',
    debug: 'debug_should_not_leak',
    stack: 'stack_should_not_leak',
    sql: 'select secret_should_not_leak',
    zeaburEnv: 'zeabur_should_not_leak',
    payment: 'payment_should_not_leak',
    billing: 'billing_should_not_leak',
  }));

  assert.equal(result.ok, true);
  assertAllowedAuditEventKeys(result.auditEvent);
  assertNoLeak(result);
});

test('metadata allows only safe primitive diagnostic flags and labels', () => {
  const result = buildCustomerAccessAuditEvent(baseInput({
    metadata: {
      routeMatched: false,
      contextPresent: true,
      identifierValid: false,
      dependencyValid: true,
      registrationResult: 'failure',
      rawPayload: 'provider_payload_should_not_leak',
      nested: {
        raw: 'nested_metadata_should_not_leak',
      },
      list: ['nested_metadata_should_not_leak'],
      unsafeRegistrationResult: 'token_should_not_leak',
    },
  }));

  assert.equal(result.ok, true);
  assert.deepEqual(result.auditEvent.metadata, {
    routeMatched: false,
    contextPresent: true,
    identifierValid: false,
    dependencyValid: true,
    registrationResult: 'failure',
  });
  assertAllowedAuditEventKeys(result.auditEvent);
  assertNoLeak(result);
});

test('unsafe allowed fields are omitted instead of leaking raw values', () => {
  const result = buildCustomerAccessAuditEvent(baseInput({
    occurredAt: 'not a timestamp token_should_not_leak',
    requestId: 'Bearer token_should_not_leak',
    actorType: 'admin_token_should_not_leak',
    organizationId: '0912-345-678',
    customerId: 'customer@example.com',
    caseId: 'case_id select secret_should_not_leak',
    reportId: 'U1234567890abcdef',
    decision: 'token_should_not_leak',
    reasonCode: 'token_should_not_leak',
    route: '/customer-access/raw_token_should_not_leak',
    method: 'POST',
    source: 'provider_should_not_leak',
    metadata: {
      registrationResult: 'token_should_not_leak',
    },
  }));

  assert.equal(result.ok, true);
  assert.deepEqual(result.auditEvent, {
    eventType: 'customer_access.service_report.allow',
    decision: 'allow',
  });
  assertNoLeak(result);
});

test('malformed input never throws and returns safe invalid result', () => {
  class ClassInstance {}
  const malformedValues = [
    null,
    undefined,
    [],
    'string',
    123,
    true,
    new Date('2026-05-30T00:00:00.000Z'),
    new Error('stack_should_not_leak'),
    Buffer.from('raw_body_should_not_leak'),
    { then() {} },
    () => {},
    new ClassInstance(),
  ];

  for (const value of malformedValues) {
    assert.doesNotThrow(() => buildCustomerAccessAuditEvent(value));
    const result = buildCustomerAccessAuditEvent(value);

    assert.deepEqual(result, {
      ok: false,
      reasonCode: 'invalid_input',
    });
    assertNoLeak(result);
  }
});
