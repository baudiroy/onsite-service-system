'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  buildCustomerAccessAuditEvent,
} = require('../../src/customerAccess/customerAccessAuditEventBuilder');
const {
  CUSTOMER_ACCESS_AUDIT_REPOSITORY_RECORD_KEYS,
} = require('../../src/customerAccess/customerAccessAuditRepositoryContract');
const {
  createCustomerAccessAuditPersistenceWriter,
  writeCustomerAccessAuditEvent,
} = require('../../src/customerAccess/customerAccessAuditPersistenceWriterAdapter');

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
  'repository_error_message_should_not_leak',
  'stack_should_not_leak',
  'customer@example.com',
  '+886912345678',
  'U1234567890abcdef',
];

function baseAuditEvent(overrides = {}) {
  const result = buildCustomerAccessAuditEvent({
    eventType: 'customer_access.service_report.allow',
    occurredAt: '2026-05-30T11:20:30.000Z',
    requestId: 'request_persistence_writer_001',
    actorType: 'customer',
    organizationId: 'org_persistence_writer_001',
    customerId: 'customer_persistence_writer_001',
    caseId: 'case_persistence_writer_001',
    reportId: 'report_persistence_writer_001',
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

function assertNoLeak(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of forbiddenValues) {
    assert.equal(serialized.includes(forbidden), false, `leaked forbidden value: ${forbidden}`);
  }
}

function assertRepositoryRecordKeys(record) {
  assert.deepEqual(
    Object.keys(record).sort(),
    Object.keys(record)
      .filter((key) => CUSTOMER_ACCESS_AUDIT_REPOSITORY_RECORD_KEYS.includes(key))
      .sort(),
  );
}

test('valid audit event invokes injected repository once with sanitized record', async () => {
  const auditEvent = baseAuditEvent();
  const original = jsonClone(auditEvent);
  let called = 0;
  let receivedRecord;

  const result = await writeCustomerAccessAuditEvent({
    auditEvent,
    auditRepository: {
      recordCustomerAccessAuditEvent(record) {
        called += 1;
        receivedRecord = record;

        return {
          ok: true,
          status: 'recorded',
          auditWritten: true,
          persisted: true,
          rawDbResult: 'driver_metadata_should_not_leak',
        };
      },
    },
  });

  assert.equal(called, 1);
  assert.notEqual(receivedRecord, auditEvent);
  assert.deepEqual(receivedRecord, auditEvent);
  assert.notEqual(receivedRecord.metadata, auditEvent.metadata);
  assertRepositoryRecordKeys(receivedRecord);
  assert.deepEqual(auditEvent, original);
  assert.deepEqual(result, {
    ok: true,
    status: 'recorded',
    auditWritten: true,
    persisted: true,
  });
  assertNoLeak({ result, receivedRecord });
});

test('factory exposes Task2109-compatible function writer(auditEvent)', async () => {
  const auditEvent = baseAuditEvent();
  let called = 0;
  const writer = createCustomerAccessAuditPersistenceWriter({
    auditRepository: {
      recordCustomerAccessAuditEvent(record) {
        called += 1;
        assertRepositoryRecordKeys(record);

        return {
          ok: true,
          status: 'recorded',
          auditWritten: true,
          persisted: true,
        };
      },
    },
  });

  assert.equal(typeof writer, 'function');
  assert.deepEqual(await writer(auditEvent), {
    ok: true,
    status: 'recorded',
    auditWritten: true,
    persisted: true,
  });
  assert.equal(called, 1);
});

test('missing or malformed repository returns unavailable without calling repository', async () => {
  class RepositoryClass {
    recordCustomerAccessAuditEvent() {}
  }
  const auditEvent = baseAuditEvent();
  const malformedRepositories = [
    undefined,
    null,
    {},
    { recordCustomerAccessAuditEvent: 'not a function' },
    [],
    new Date('2026-05-30T00:00:00.000Z'),
    new Error('repository_error_message_should_not_leak'),
    Buffer.from('token_should_not_leak'),
    { then() {} },
    new RepositoryClass(),
    {
      get recordCustomerAccessAuditEvent() {
        throw new Error('repository_error_message_should_not_leak');
      },
    },
    'repository',
    123,
  ];

  for (const auditRepository of malformedRepositories) {
    const result = await writeCustomerAccessAuditEvent({
      auditEvent,
      auditRepository,
    });

    assert.deepEqual(result, {
      ok: false,
      status: 'failed',
      auditWritten: false,
      persisted: false,
      reasonCode: 'audit_writer_unavailable',
    });
    assertNoLeak(result);
  }
});

test('invalid or raw-sensitive audit event rejects before repository invocation', async () => {
  class AuditEventClass {}
  const invalidAuditEvents = [
    undefined,
    null,
    'event',
    123,
    true,
    [],
    new Date('2026-05-30T00:00:00.000Z'),
    new Error('repository_error_message_should_not_leak'),
    Buffer.from('raw_request_should_not_leak'),
    { then() {} },
    () => {},
    new AuditEventClass(),
    { ...baseAuditEvent(), unknownField: 'private_should_not_leak' },
    { ...baseAuditEvent(), rawRequest: 'raw_request_should_not_leak' },
    { ...baseAuditEvent(), request: { raw: 'raw_request_should_not_leak' } },
    { ...baseAuditEvent(), response: { raw: 'raw_response_should_not_leak' } },
    { ...baseAuditEvent(), headers: { authorization: 'authorization_should_not_leak' } },
    { ...baseAuditEvent(), authorization: 'authorization_should_not_leak' },
    { ...baseAuditEvent(), token: 'token_should_not_leak' },
    { ...baseAuditEvent(), sql: 'select secret_should_not_leak' },
    { ...baseAuditEvent(), providerPayload: 'provider_payload_should_not_leak' },
    { ...baseAuditEvent(), debug: 'debug_should_not_leak' },
    { ...baseAuditEvent(), privateNote: 'private_should_not_leak' },
    { ...baseAuditEvent(), metadata: { routeMatched: true, rawSql: 'select secret_should_not_leak' } },
  ];

  for (const auditEvent of invalidAuditEvents) {
    let called = 0;
    const result = await writeCustomerAccessAuditEvent({
      auditEvent,
      auditRepository: {
        recordCustomerAccessAuditEvent() {
          called += 1;

          return {
            ok: true,
            status: 'recorded',
            auditWritten: true,
            persisted: true,
          };
        },
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
    assertNoLeak(result);
  }
});

test('repository results normalize safely and raw fields do not leak', async () => {
  const repositoryResults = [
    [
      {
        ok: true,
        status: 'recorded',
        auditWritten: true,
        persisted: true,
        rows: [{ token: 'token_should_not_leak' }],
      },
      {
        ok: true,
        status: 'recorded',
        auditWritten: true,
        persisted: true,
      },
    ],
    [
      {
        ok: true,
        status: 'skipped',
        auditWritten: false,
        persisted: false,
        reasonCode: 'audit_not_configured',
        sql: 'select secret_should_not_leak',
      },
      {
        ok: true,
        status: 'skipped',
        auditWritten: false,
        persisted: false,
        reasonCode: 'audit_not_configured',
      },
    ],
    [
      {
        ok: false,
        status: 'failed',
        auditWritten: false,
        persisted: false,
        reasonCode: 'audit_persistence_failed',
        stack: 'stack_should_not_leak',
      },
      {
        ok: false,
        status: 'failed',
        auditWritten: false,
        persisted: false,
        reasonCode: 'audit_persistence_failed',
      },
    ],
    [
      {
        ok: true,
        status: 'recorded',
        auditWritten: false,
        persisted: true,
        rawDbResult: 'driver_metadata_should_not_leak',
      },
      {
        ok: false,
        status: 'failed',
        auditWritten: false,
        persisted: false,
        reasonCode: 'invalid_writer_result',
      },
    ],
  ];

  for (const [repositoryResult, expected] of repositoryResults) {
    const result = await writeCustomerAccessAuditEvent({
      auditEvent: baseAuditEvent(),
      auditRepository: {
        recordCustomerAccessAuditEvent() {
          return repositoryResult;
        },
      },
    });

    assert.deepEqual(result, expected);
    assertNoLeak(result);
  }
});

test('repository throw or reject normalizes to safe persistence failure', async () => {
  for (const recordCustomerAccessAuditEvent of [
    () => {
      throw new Error('repository_error_message_should_not_leak');
    },
    async () => {
      throw new Error('repository_error_message_should_not_leak');
    },
  ]) {
    await assert.doesNotReject(() => writeCustomerAccessAuditEvent({
      auditEvent: baseAuditEvent(),
      auditRepository: {
        recordCustomerAccessAuditEvent,
      },
    }));

    const result = await writeCustomerAccessAuditEvent({
      auditEvent: baseAuditEvent(),
      auditRepository: {
        recordCustomerAccessAuditEvent,
      },
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

test('record isolation preserves caller input when repository mutates received record', async () => {
  const auditEvent = baseAuditEvent();
  const original = jsonClone(auditEvent);
  let firstRecord;

  const first = await writeCustomerAccessAuditEvent({
    auditEvent,
    auditRepository: {
      recordCustomerAccessAuditEvent(record) {
        firstRecord = record;
        record.eventType = 'mutated_event_type_should_not_leak';
        record.metadata.routeMatched = false;

        return {
          ok: true,
          status: 'recorded',
          auditWritten: true,
          persisted: true,
        };
      },
    },
  });
  const second = await writeCustomerAccessAuditEvent({
    auditEvent,
    auditRepository: {
      recordCustomerAccessAuditEvent(record) {
        assert.deepEqual(record, original);

        return {
          ok: true,
          status: 'recorded',
          auditWritten: true,
          persisted: true,
        };
      },
    },
  });

  assert.notEqual(firstRecord, auditEvent);
  assert.deepEqual(auditEvent, original);
  assert.deepEqual(first, second);
  assert.deepEqual(first, {
    ok: true,
    status: 'recorded',
    auditWritten: true,
    persisted: true,
  });
  assertNoLeak({ first, second, auditEvent });
});
