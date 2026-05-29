'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  CUSTOMER_ACCESS_AUDIT_EVENT_KEYS,
  CUSTOMER_ACCESS_AUDIT_METADATA_KEYS,
  buildCustomerAccessAuditEvent,
} = require('../../src/customerAccess/customerAccessAuditEventBuilder');
const {
  CUSTOMER_ACCESS_AUDIT_WRITER_RESULT_KEYS,
} = require('../../src/customerAccess/customerAccessAuditWriterResultNormalizer');
const {
  writeCustomerAccessAuditEvent,
} = require('../../src/customerAccess/customerAccessAuditWriterAdapter');

const forbiddenValues = [
  'raw_request_should_not_leak',
  'raw_headers_should_not_leak',
  'Bearer token_should_not_leak',
  'select secret_should_not_leak',
  'raw_writer_result_should_not_leak',
  'writer_error_message_should_not_leak',
  'provider_payload_should_not_leak',
  'debug_should_not_leak',
  'private_should_not_leak',
  'unknown_field_should_not_leak',
];

function baseAuditEvent(overrides = {}) {
  const result = buildCustomerAccessAuditEvent({
    eventType: 'customer_access.service_report.allow',
    occurredAt: '2026-05-30T10:20:30.000Z',
    requestId: 'request_audit_adapter_001',
    actorType: 'customer',
    organizationId: 'org_audit_adapter_001',
    customerId: 'customer_audit_adapter_001',
    caseId: 'case_audit_adapter_001',
    reportId: 'report_audit_adapter_001',
    route: '/customer-access/:caseId/service-report/:reportId',
    method: 'GET',
    source: 'customer_access_projection_service',
    metadata: {
      routeMatched: true,
      contextPresent: true,
      identifierValid: true,
    },
    ...overrides,
  });

  assert.equal(result.ok, true);

  return result.auditEvent;
}

function jsonClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertAllowedResultKeys(result) {
  assert.deepEqual(
    Object.keys(result).sort(),
    Object.keys(result)
      .filter((key) => CUSTOMER_ACCESS_AUDIT_WRITER_RESULT_KEYS.includes(key))
      .sort(),
  );
}

function assertAllowedAuditEventKeys(auditEvent) {
  assert.deepEqual(
    Object.keys(auditEvent).sort(),
    Object.keys(auditEvent)
      .filter((key) => CUSTOMER_ACCESS_AUDIT_EVENT_KEYS.includes(key))
      .sort(),
  );

  if (auditEvent.metadata) {
    assert.deepEqual(
      Object.keys(auditEvent.metadata).sort(),
      Object.keys(auditEvent.metadata)
        .filter((key) => CUSTOMER_ACCESS_AUDIT_METADATA_KEYS.includes(key))
        .sort(),
    );
  }
}

function assertNoLeak(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of forbiddenValues) {
    assert.equal(serialized.includes(forbidden), false, `adapter leaked ${forbidden}`);
  }
}

test('valid audit event invokes injected function writer once with sanitized copy', async () => {
  const auditEvent = baseAuditEvent();
  const original = jsonClone(auditEvent);
  let called = 0;
  let received;

  const result = await writeCustomerAccessAuditEvent({
    auditEvent,
    writer: (event) => {
      called += 1;
      received = event;

      return {
        ok: true,
        status: 'recorded',
        auditWritten: true,
        persisted: true,
        rawResult: 'raw_writer_result_should_not_leak',
      };
    },
  });

  assert.equal(called, 1);
  assert.notEqual(received, auditEvent);
  assert.deepEqual(received, auditEvent);
  assertAllowedAuditEventKeys(received);
  assert.deepEqual(auditEvent, original);
  assert.deepEqual(result, {
    ok: true,
    status: 'recorded',
    auditWritten: true,
    persisted: true,
  });
  assertAllowedResultKeys(result);
  assertNoLeak({ result, received });
});

test('missing or malformed writer returns unavailable without throwing', async () => {
  class WriterClass {}
  const auditEvent = baseAuditEvent();

  for (const writer of [
    undefined,
    null,
    {},
    { write() {} },
    [],
    new Date('2026-05-30T00:00:00.000Z'),
    new Error('writer_error_message_should_not_leak'),
    Buffer.from('raw_writer_result_should_not_leak'),
    { then() {} },
    new WriterClass(),
    'writer',
    123,
  ]) {
    const result = await writeCustomerAccessAuditEvent({
      auditEvent,
      writer,
    });

    assert.deepEqual(result, {
      ok: false,
      status: 'failed',
      auditWritten: false,
      persisted: false,
      reasonCode: 'audit_writer_unavailable',
    });
    assertAllowedResultKeys(result);
    assertNoLeak(result);
  }
});

test('invalid audit event rejects before writer invocation', async () => {
  class AuditEventClass {}
  const invalidAuditEvents = [
    undefined,
    null,
    'event',
    123,
    true,
    [],
    new Date('2026-05-30T00:00:00.000Z'),
    new Error('writer_error_message_should_not_leak'),
    Buffer.from('raw_request_should_not_leak'),
    { then() {} },
    () => {},
    new AuditEventClass(),
    { ...baseAuditEvent(), unknownField: 'unknown_field_should_not_leak' },
    { ...baseAuditEvent(), rawRequest: 'raw_request_should_not_leak' },
    { ...baseAuditEvent(), headers: 'raw_headers_should_not_leak' },
    { ...baseAuditEvent(), authorization: 'Bearer token_should_not_leak' },
    { ...baseAuditEvent(), sql: 'select secret_should_not_leak' },
    { ...baseAuditEvent(), providerPayload: 'provider_payload_should_not_leak' },
    { ...baseAuditEvent(), debug: 'debug_should_not_leak' },
    { ...baseAuditEvent(), privateNote: 'private_should_not_leak' },
    { ...baseAuditEvent(), metadata: { routeMatched: true, nested: { raw: 'raw_request_should_not_leak' } } },
  ];

  for (const auditEvent of invalidAuditEvents) {
    let called = 0;
    const result = await writeCustomerAccessAuditEvent({
      auditEvent,
      writer: () => {
        called += 1;

        return {
          ok: true,
          status: 'recorded',
          auditWritten: true,
          persisted: true,
        };
      },
    });

    assert.equal(called, 0);
    assert.deepEqual(result, {
      ok: false,
      status: 'failed',
      auditWritten: false,
      persisted: false,
      reasonCode: 'audit_event_invalid',
    });
    assertAllowedResultKeys(result);
    assertNoLeak(result);
  }
});

test('writer result is normalized and raw fields are not exposed', async () => {
  const skipped = await writeCustomerAccessAuditEvent({
    auditEvent: baseAuditEvent(),
    writer: () => ({
      ok: true,
      status: 'skipped',
      auditWritten: false,
      persisted: false,
      reasonCode: 'audit_not_configured',
      rawResult: 'raw_writer_result_should_not_leak',
    }),
  });
  const failed = await writeCustomerAccessAuditEvent({
    auditEvent: baseAuditEvent(),
    writer: () => ({
      ok: false,
      status: 'failed',
      auditWritten: false,
      persisted: false,
      reasonCode: 'audit_persistence_failed',
      error: 'writer_error_message_should_not_leak',
    }),
  });
  const malformed = await writeCustomerAccessAuditEvent({
    auditEvent: baseAuditEvent(),
    writer: () => ({
      ok: true,
      status: 'recorded',
      auditWritten: false,
      persisted: true,
      rawResult: 'raw_writer_result_should_not_leak',
    }),
  });

  assert.deepEqual(skipped, {
    ok: true,
    status: 'skipped',
    auditWritten: false,
    persisted: false,
    reasonCode: 'audit_not_configured',
  });
  assert.deepEqual(failed, {
    ok: false,
    status: 'failed',
    auditWritten: false,
    persisted: false,
    reasonCode: 'audit_persistence_failed',
  });
  assert.deepEqual(malformed, {
    ok: false,
    status: 'failed',
    auditWritten: false,
    persisted: false,
    reasonCode: 'invalid_writer_result',
  });
  assertNoLeak({ skipped, failed, malformed });
});

test('writer throw or reject normalizes to safe persistence failure', async () => {
  for (const writer of [
    () => {
      throw new Error('writer_error_message_should_not_leak');
    },
    async () => {
      throw new Error('writer_error_message_should_not_leak');
    },
  ]) {
    await assert.doesNotReject(() => writeCustomerAccessAuditEvent({
      auditEvent: baseAuditEvent(),
      writer,
    }));

    const result = await writeCustomerAccessAuditEvent({
      auditEvent: baseAuditEvent(),
      writer,
    });

    assert.deepEqual(result, {
      ok: false,
      status: 'failed',
      auditWritten: false,
      persisted: false,
      reasonCode: 'audit_persistence_failed',
    });
    assertNoLeak(result);
  }
});

test('writer receives isolated copy and adapter is deterministic for same writer behavior', async () => {
  const auditEvent = baseAuditEvent();
  const original = jsonClone(auditEvent);
  let firstReceived;

  const first = await writeCustomerAccessAuditEvent({
    auditEvent,
    writer: (event) => {
      firstReceived = event;
      event.eventType = 'mutated_event_type_should_not_leak';
      event.metadata.routeMatched = false;

      return {
        ok: true,
        status: 'recorded',
        auditWritten: true,
        persisted: true,
      };
    },
  });
  const second = await writeCustomerAccessAuditEvent({
    auditEvent,
    writer: (event) => {
      assert.deepEqual(event, original);

      return {
        ok: true,
        status: 'recorded',
        auditWritten: true,
        persisted: true,
      };
    },
  });

  assert.notEqual(firstReceived, auditEvent);
  assert.deepEqual(auditEvent, original);
  assert.deepEqual(first, second);
  assert.deepEqual(first, {
    ok: true,
    status: 'recorded',
    auditWritten: true,
    persisted: true,
  });
});
