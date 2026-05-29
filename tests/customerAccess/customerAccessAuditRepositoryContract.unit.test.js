'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  CUSTOMER_ACCESS_AUDIT_REPOSITORY_RECORD_KEYS,
  buildCustomerAccessAuditRepositoryRecord,
  normalizeCustomerAccessAuditRepositoryResult,
} = require('../../src/customerAccess/customerAccessAuditRepositoryContract');

const forbiddenValues = [
  'raw_request_should_not_leak',
  'raw_response_should_not_leak',
  'authorization_should_not_leak',
  'token_should_not_leak',
  'select secret_should_not_leak',
  'provider_payload_should_not_leak',
  'debug_should_not_leak',
  'private_should_not_leak',
  'driver_metadata_should_not_leak',
  'customer@example.com',
  '+886912345678',
  'U1234567890abcdef',
];

function validAuditEvent(overrides = {}) {
  return {
    eventType: 'customer_access.service_report.allow',
    occurredAt: '2026-05-30T08:00:00.000Z',
    requestId: 'request_repo_001',
    actorType: 'customer',
    organizationId: 'org_repo_001',
    customerId: 'customer_repo_001',
    caseId: 'case_repo_001',
    reportId: 'report_repo_001',
    decision: 'allow',
    route: '/customer-access/:caseId/service-report/:reportId',
    method: 'GET',
    source: 'customer_access_projection_service',
    metadata: {
      routeMatched: true,
      contextPresent: true,
      identifierValid: true,
    },
    ...overrides,
  };
}

function assertNoForbiddenValues(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of forbiddenValues) {
    assert.equal(serialized.includes(forbidden), false, `leaked forbidden value: ${forbidden}`);
  }
}

test('exports exact repository record keys', () => {
  assert.deepEqual(CUSTOMER_ACCESS_AUDIT_REPOSITORY_RECORD_KEYS, [
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
});

test('valid sanitized audit event maps to safe repository record without mutating input', () => {
  const input = validAuditEvent({
    rawRequest: 'raw_request_should_not_leak',
    headers: {
      authorization: 'authorization_should_not_leak',
    },
    sql: 'select secret_should_not_leak',
    providerPayload: 'provider_payload_should_not_leak',
  });
  const before = JSON.stringify(input);
  const result = buildCustomerAccessAuditRepositoryRecord(input);

  assert.equal(result.ok, true);
  assert.deepEqual(Object.keys(result.record), [
    'eventType',
    'occurredAt',
    'requestId',
    'actorType',
    'organizationId',
    'customerId',
    'caseId',
    'reportId',
    'decision',
    'route',
    'method',
    'source',
    'metadata',
  ]);
  assert.deepEqual(result.record, {
    eventType: 'customer_access.service_report.allow',
    occurredAt: '2026-05-30T08:00:00.000Z',
    requestId: 'request_repo_001',
    actorType: 'customer',
    organizationId: 'org_repo_001',
    customerId: 'customer_repo_001',
    caseId: 'case_repo_001',
    reportId: 'report_repo_001',
    decision: 'allow',
    route: '/customer-access/:caseId/service-report/:reportId',
    method: 'GET',
    source: 'customer_access_projection_service',
    metadata: {
      routeMatched: true,
      contextPresent: true,
      identifierValid: true,
    },
  });
  assert.equal(JSON.stringify(input), before);
  assert.notEqual(result.record.metadata, input.metadata);
  assertNoForbiddenValues(result);
});

test('invalid audit inputs normalize to safe failed result without raw leak', () => {
  class NonPlainAuditEvent {
    constructor() {
      this.eventType = 'customer_access.service_report.allow';
    }
  }

  const invalidInputs = [
    null,
    undefined,
    '',
    1,
    true,
    [],
    new Date('2026-05-30T08:00:00.000Z'),
    new Error('debug_should_not_leak'),
    Buffer.from('token_should_not_leak'),
    Promise.resolve(validAuditEvent()),
    () => validAuditEvent(),
    new NonPlainAuditEvent(),
    {
      eventType: 'customer_access.service_report.allow',
      byteLength: 1,
      slice() {
        return 'token_should_not_leak';
      },
    },
    {
      eventType: 'unknown.event',
      rawRequest: 'raw_request_should_not_leak',
    },
  ];

  for (const input of invalidInputs) {
    const result = buildCustomerAccessAuditRepositoryRecord(input);

    assert.deepEqual(result, {
      ok: false,
      status: 'failed',
      auditWritten: false,
      persisted: false,
      reasonCode: 'audit_event_invalid',
    });
    assertNoForbiddenValues(result);
  }
});

test('unknown fields and sensitive values are omitted through builder contract', () => {
  const result = buildCustomerAccessAuditRepositoryRecord(validAuditEvent({
    request: {
      raw: 'raw_request_should_not_leak',
    },
    response: {
      raw: 'raw_response_should_not_leak',
    },
    rawHeaders: ['authorization_should_not_leak'],
    token: 'token_should_not_leak',
    email: 'customer@example.com',
    phone: '+886912345678',
    lineUserId: 'U1234567890abcdef',
    metadata: {
      routeMatched: true,
      rawSql: 'select secret_should_not_leak',
    },
  }));

  assert.equal(result.ok, true);
  assert.deepEqual(Object.keys(result.record).sort(), [
    'actorType',
    'caseId',
    'customerId',
    'decision',
    'eventType',
    'metadata',
    'method',
    'occurredAt',
    'organizationId',
    'reportId',
    'requestId',
    'route',
    'source',
  ].sort());
  assert.deepEqual(result.record.metadata, {
    routeMatched: true,
  });
  assertNoForbiddenValues(result);
});

test('repository result normalization delegates to safe writer result matrix', () => {
  assert.deepEqual(normalizeCustomerAccessAuditRepositoryResult({
    ok: true,
    status: 'recorded',
    auditWritten: true,
    persisted: true,
    rawDbResult: 'driver_metadata_should_not_leak',
  }), {
    ok: true,
    status: 'recorded',
    auditWritten: true,
    persisted: true,
  });
  assert.deepEqual(normalizeCustomerAccessAuditRepositoryResult({
    ok: true,
    status: 'skipped',
    auditWritten: false,
    persisted: false,
    reasonCode: 'audit_not_configured',
    sql: 'select secret_should_not_leak',
  }), {
    ok: true,
    status: 'skipped',
    auditWritten: false,
    persisted: false,
    reasonCode: 'audit_not_configured',
  });
  assert.deepEqual(normalizeCustomerAccessAuditRepositoryResult({
    ok: false,
    status: 'failed',
    auditWritten: false,
    persisted: false,
    reasonCode: 'audit_persistence_failed',
    stack: 'debug_should_not_leak',
  }), {
    ok: false,
    status: 'failed',
    auditWritten: false,
    persisted: false,
    reasonCode: 'audit_persistence_failed',
  });
  assert.deepEqual(normalizeCustomerAccessAuditRepositoryResult({
    ok: true,
    status: 'recorded',
    auditWritten: false,
    persisted: false,
    sql: 'select secret_should_not_leak',
  }), {
    ok: false,
    status: 'failed',
    auditWritten: false,
    persisted: false,
    reasonCode: 'invalid_writer_result',
  });
});

test('contract helpers are deterministic and output-isolated', () => {
  const input = validAuditEvent();
  const first = buildCustomerAccessAuditRepositoryRecord(input);
  const second = buildCustomerAccessAuditRepositoryRecord(input);

  assert.deepEqual(first, second);
  assert.notEqual(first.record, second.record);
  assert.notEqual(first.record.metadata, second.record.metadata);

  first.record.metadata.routeMatched = false;

  assert.equal(second.record.metadata.routeMatched, true);
  assert.equal(input.metadata.routeMatched, true);
});
