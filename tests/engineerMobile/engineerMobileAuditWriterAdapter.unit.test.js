'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  buildEngineerMobileAuditEvent,
} = require('../../src/engineerMobile/engineerMobileAuditEventBuilder');
const {
  sanitizeEngineerMobileAuditEventForWriter,
  writeEngineerMobileAuditEvent,
} = require('../../src/engineerMobile/engineerMobileAuditWriterAdapter');

const RECORDED = Object.freeze({
  ok: true,
  status: 'recorded',
  auditWritten: true,
  persisted: true,
});
const FAILED_WRITER_UNAVAILABLE = Object.freeze({
  ok: false,
  status: 'failed',
  auditWritten: false,
  persisted: false,
  reasonCode: 'audit_writer_unavailable',
});
const FAILED_EVENT_INVALID = Object.freeze({
  ok: false,
  status: 'failed',
  auditWritten: false,
  persisted: false,
  reasonCode: 'audit_event_invalid',
});
const FAILED_PERSISTENCE = Object.freeze({
  ok: false,
  status: 'failed',
  auditWritten: false,
  persisted: false,
  reasonCode: 'audit_persistence_failed',
});

const forbiddenValues = [
  'raw_request_should_not_leak',
  'authorization_header_should_not_leak',
  'Bearer token_should_not_leak',
  'select secret_should_not_leak',
  'raw_provider_payload_should_not_leak',
  'raw_db_row_should_not_leak',
  'raw_error_message_should_not_leak',
  'raw_stack_should_not_leak',
  'customer_phone_should_not_leak',
  'private_note_should_not_leak',
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function auditEvent(overrides = {}) {
  const result = buildEngineerMobileAuditEvent({
    eventType: 'engineer_mobile.visit_action.allow',
    occurredAt: '2026-05-30T02:30:00.000Z',
    requestId: 'req_task_2170',
    actorType: 'engineer',
    organizationId: 'org_task_2170',
    engineerId: 'eng_task_2170',
    caseId: 'case_task_2170',
    appointmentId: 'apt_task_2170',
    action: 'engineer_mobile.start_travel',
    decision: 'allow',
    route: '/engineer-mobile/appointments/:appointmentId/actions/:action',
    method: 'POST',
    source: 'engineer_mobile_visit_action_handler',
    metadata: {
      routeMatched: true,
      contextPresent: true,
      identifierValid: true,
      permissionPassed: true,
      actionAllowed: true,
    },
    ...overrides,
  });

  assert.equal(result.ok, true);
  return result.auditEvent;
}

function assertNoLeak(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of forbiddenValues) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('exports adapter functions', () => {
  assert.equal(typeof sanitizeEngineerMobileAuditEventForWriter, 'function');
  assert.equal(typeof writeEngineerMobileAuditEvent, 'function');
});

test('valid auditEvent and injected writer calls writer once and normalizes recorded result', async () => {
  const calls = [];
  const input = auditEvent();
  const original = clone(input);

  const result = await writeEngineerMobileAuditEvent({
    auditEvent: input,
    auditWriter(event) {
      calls.push(event);
      event.metadata.routeMatched = false;

      return {
        ok: true,
        status: 'recorded',
        auditWritten: true,
        persisted: true,
        rawWriterResult: 'raw_request_should_not_leak',
      };
    },
  });

  assert.deepEqual(result, RECORDED);
  assert.equal(calls.length, 1);
  assert.notEqual(calls[0], input);
  assert.notEqual(calls[0].metadata, input.metadata);
  assert.deepEqual(input, original);
  assert.deepEqual(Object.keys(calls[0]).sort(), Object.keys(input).sort());
  assertNoLeak(result);
});

test('sanitizer returns a safe copy with only accepted event keys', () => {
  const input = auditEvent();
  const sanitized = sanitizeEngineerMobileAuditEventForWriter(input);

  assert.deepEqual(sanitized, input);
  assert.notEqual(sanitized, input);
  assert.notEqual(sanitized.metadata, input.metadata);
});

test('missing or malformed writer returns audit_writer_unavailable and does not call writer', async () => {
  for (const auditWriter of [
    undefined,
    null,
    true,
    'writer',
    [],
    new Date('2026-05-30T00:00:00.000Z'),
    new Error('raw_error_message_should_not_leak'),
    Buffer.from('raw_request_should_not_leak'),
    { then() {} },
    { write() {} },
  ]) {
    assert.deepEqual(await writeEngineerMobileAuditEvent({
      auditEvent: auditEvent(),
      auditWriter,
    }), FAILED_WRITER_UNAVAILABLE);
  }
});

test('invalid auditEvent returns audit_event_invalid and writer is not called', async () => {
  let called = false;
  const invalidEvents = [
    undefined,
    null,
    true,
    'event',
    [],
    new Date('2026-05-30T00:00:00.000Z'),
    new Error('raw_error_message_should_not_leak'),
    Buffer.from('raw_request_should_not_leak'),
    { then() {} },
    function event() {},
    { ...auditEvent(), rawRequest: 'raw_request_should_not_leak' },
    { ...auditEvent(), eventType: 'engineer_mobile.unknown' },
    { ...auditEvent(), metadata: { routeMatched: true, rawToken: 'Bearer token_should_not_leak' } },
  ];

  for (const invalidEvent of invalidEvents) {
    called = false;
    const result = await writeEngineerMobileAuditEvent({
      auditEvent: invalidEvent,
      auditWriter() {
        called = true;
      },
    });

    assert.deepEqual(result, FAILED_EVENT_INVALID);
    assert.equal(called, false);
    assertNoLeak(result);
  }
});

test('writer skipped failed and malformed results normalize through Task2169 normalizer', async () => {
  assert.deepEqual(await writeEngineerMobileAuditEvent({
    auditEvent: auditEvent(),
    auditWriter() {
      return {
        ok: true,
        status: 'skipped',
        auditWritten: false,
        persisted: false,
        reasonCode: 'audit_not_configured',
      };
    },
  }), {
    ok: true,
    status: 'skipped',
    auditWritten: false,
    persisted: false,
    reasonCode: 'audit_not_configured',
  });
  assert.deepEqual(await writeEngineerMobileAuditEvent({
    auditEvent: auditEvent(),
    auditWriter() {
      return {
        ok: false,
        status: 'failed',
        auditWritten: false,
        persisted: false,
        reasonCode: 'audit_event_invalid',
      };
    },
  }), {
    ok: false,
    status: 'failed',
    auditWritten: false,
    persisted: false,
    reasonCode: 'audit_event_invalid',
  });
  assert.deepEqual(await writeEngineerMobileAuditEvent({
    auditEvent: auditEvent(),
    auditWriter() {
      return {
        ok: true,
        status: 'recorded',
        auditWritten: 'true',
        persisted: true,
        token: 'Bearer token_should_not_leak',
      };
    },
  }), {
    ok: false,
    status: 'failed',
    auditWritten: false,
    persisted: false,
    reasonCode: 'invalid_writer_result',
  });
});

test('writer throw or reject returns safe audit_persistence_failed without leaking error', async () => {
  const throwing = await writeEngineerMobileAuditEvent({
    auditEvent: auditEvent(),
    auditWriter() {
      throw new Error('raw_error_message_should_not_leak select secret_should_not_leak');
    },
  });
  const rejecting = await writeEngineerMobileAuditEvent({
    auditEvent: auditEvent(),
    auditWriter() {
      return Promise.reject(new Error('raw_stack_should_not_leak Bearer token_should_not_leak'));
    },
  });

  assert.deepEqual(throwing, FAILED_PERSISTENCE);
  assert.deepEqual(rejecting, FAILED_PERSISTENCE);
  assertNoLeak(throwing);
  assertNoLeak(rejecting);
});

test('raw sensitive fields are not passed to writer or result', async () => {
  const input = {
    ...auditEvent(),
    rawRequest: 'raw_request_should_not_leak',
    headers: { authorization: 'authorization_header_should_not_leak' },
    providerPayload: 'raw_provider_payload_should_not_leak',
    sql: 'select secret_should_not_leak',
    dbRows: ['raw_db_row_should_not_leak'],
    customerPhone: 'customer_phone_should_not_leak',
    privateNote: 'private_note_should_not_leak',
  };
  let writerCalled = false;
  const result = await writeEngineerMobileAuditEvent({
    auditEvent: input,
    auditWriter() {
      writerCalled = true;
    },
  });

  assert.deepEqual(result, FAILED_EVENT_INVALID);
  assert.equal(writerCalled, false);
  assertNoLeak(result);
});
