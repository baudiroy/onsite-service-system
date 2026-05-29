'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  CUSTOMER_ACCESS_AUDIT_WRITER_REASON_CODES,
  CUSTOMER_ACCESS_AUDIT_WRITER_RESULT_KEYS,
  CUSTOMER_ACCESS_AUDIT_WRITER_STATUSES,
  normalizeCustomerAccessAuditWriterResult,
} = require('../../src/customerAccess/customerAccessAuditWriterResultNormalizer');

const forbiddenValues = [
  'raw_writer_result_should_not_leak',
  'writer_error_message_should_not_leak',
  'writer_stack_should_not_leak',
  'writer_cause_should_not_leak',
  'db_row_should_not_leak',
  'query_metadata_should_not_leak',
  'select secret_should_not_leak',
  'raw_headers_should_not_leak',
  'Bearer token_should_not_leak',
  'raw_cookie_should_not_leak',
  'raw_request_should_not_leak',
  'raw_response_should_not_leak',
  'raw_user_should_not_leak',
  'raw_session_should_not_leak',
  'raw_auth_should_not_leak',
  'raw_channel_should_not_leak',
  'raw_access_should_not_leak',
  '0912-345-678',
  'No. 1 Secret Road',
  'customer@example.com',
  'U1234567890abcdef',
  'provider_payload_should_not_leak',
  'ai_prompt_should_not_leak',
  'ai_response_should_not_leak',
  'internal_private_should_not_leak',
  'zeabur_should_not_leak',
  'payment_should_not_leak',
  'billing_should_not_leak',
  'unknown_field_should_not_leak',
];

function assertAllowedResultKeys(result) {
  assert.deepEqual(
    Object.keys(result).sort(),
    Object.keys(result)
      .filter((key) => CUSTOMER_ACCESS_AUDIT_WRITER_RESULT_KEYS.includes(key))
      .sort(),
  );
}

function assertNoLeak(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of forbiddenValues) {
    assert.equal(serialized.includes(forbidden), false, `writer result leaked ${forbidden}`);
  }
}

function jsonClone(value) {
  return JSON.parse(JSON.stringify(value));
}

test('exports exact writer result contract constants', () => {
  assert.deepEqual(CUSTOMER_ACCESS_AUDIT_WRITER_RESULT_KEYS, [
    'ok',
    'status',
    'auditWritten',
    'persisted',
    'reasonCode',
  ]);
  assert.deepEqual(CUSTOMER_ACCESS_AUDIT_WRITER_STATUSES, [
    'recorded',
    'skipped',
    'failed',
  ]);
  assert.deepEqual(CUSTOMER_ACCESS_AUDIT_WRITER_REASON_CODES, [
    'audit_writer_unavailable',
    'audit_event_invalid',
    'audit_persistence_failed',
    'audit_skipped',
    'audit_not_configured',
    'invalid_writer_result',
  ]);
});

test('valid recorded writer result normalizes to recorded status', () => {
  const result = normalizeCustomerAccessAuditWriterResult({
    ok: true,
    status: 'recorded',
    auditWritten: true,
    persisted: true,
    reasonCode: 'audit_persistence_failed',
    rawResult: 'raw_writer_result_should_not_leak',
  });

  assert.deepEqual(result, {
    ok: true,
    status: 'recorded',
    auditWritten: true,
    persisted: true,
  });
  assertAllowedResultKeys(result);
  assertNoLeak(result);
});

test('valid skipped writer result normalizes with safe reasonCode', () => {
  const result = normalizeCustomerAccessAuditWriterResult({
    ok: true,
    status: 'skipped',
    auditWritten: false,
    persisted: false,
    reasonCode: 'audit_not_configured',
  });

  assert.deepEqual(result, {
    ok: true,
    status: 'skipped',
    auditWritten: false,
    persisted: false,
    reasonCode: 'audit_not_configured',
  });
  assertAllowedResultKeys(result);
  assertNoLeak(result);
});

test('valid failed writer result normalizes with safe reasonCode', () => {
  const result = normalizeCustomerAccessAuditWriterResult({
    ok: false,
    status: 'failed',
    auditWritten: false,
    persisted: false,
    reasonCode: 'audit_persistence_failed',
  });

  assert.deepEqual(result, {
    ok: false,
    status: 'failed',
    auditWritten: false,
    persisted: false,
    reasonCode: 'audit_persistence_failed',
  });
  assertAllowedResultKeys(result);
  assertNoLeak(result);
});

test('malformed writer result input never throws and normalizes to safe failed result', () => {
  class ClassInstance {}
  const malformedValues = [
    null,
    undefined,
    'string',
    123,
    true,
    [],
    new Date('2026-05-30T00:00:00.000Z'),
    new Error('writer_stack_should_not_leak'),
    Buffer.from('raw_writer_result_should_not_leak'),
    { then() {} },
    () => {},
    new ClassInstance(),
  ];

  for (const value of malformedValues) {
    assert.doesNotThrow(() => normalizeCustomerAccessAuditWriterResult(value));
    const result = normalizeCustomerAccessAuditWriterResult(value);

    assert.deepEqual(result, {
      ok: false,
      status: 'failed',
      auditWritten: false,
      persisted: false,
      reasonCode: 'invalid_writer_result',
    });
    assertAllowedResultKeys(result);
    assertNoLeak(result);
  }
});

test('invalid status flags and reasonCode normalize safely without leaking raw values', () => {
  for (const input of [
    {
      ok: true,
      status: 'recorded',
      auditWritten: false,
      persisted: true,
      reasonCode: 'select secret_should_not_leak',
    },
    {
      ok: true,
      status: 'skipped',
      auditWritten: true,
      persisted: false,
      reasonCode: 'Bearer token_should_not_leak',
    },
    {
      ok: false,
      status: 'failed',
      auditWritten: false,
      persisted: false,
      reasonCode: 'raw_headers_should_not_leak',
    },
    {
      ok: true,
      status: 'provider_should_not_leak',
      auditWritten: true,
      persisted: true,
    },
  ]) {
    const result = normalizeCustomerAccessAuditWriterResult(input);

    assert.deepEqual(result, {
      ok: false,
      status: 'failed',
      auditWritten: false,
      persisted: false,
      reasonCode: 'invalid_writer_result',
    });
    assertAllowedResultKeys(result);
    assertNoLeak(result);
  }
});

test('sensitive input fields never appear in normalized output', () => {
  const result = normalizeCustomerAccessAuditWriterResult({
    ok: false,
    status: 'failed',
    auditWritten: false,
    persisted: false,
    reasonCode: 'audit_writer_unavailable',
    rawWriterResult: 'raw_writer_result_should_not_leak',
    error: {
      message: 'writer_error_message_should_not_leak',
      stack: 'writer_stack_should_not_leak',
      cause: 'writer_cause_should_not_leak',
    },
    dbRows: ['db_row_should_not_leak'],
    queryMetadata: 'query_metadata_should_not_leak',
    sql: 'select secret_should_not_leak',
    headers: 'raw_headers_should_not_leak',
    authorization: 'Bearer token_should_not_leak',
    cookies: 'raw_cookie_should_not_leak',
    request: 'raw_request_should_not_leak',
    response: 'raw_response_should_not_leak',
    user: 'raw_user_should_not_leak',
    session: 'raw_session_should_not_leak',
    auth: 'raw_auth_should_not_leak',
    channel: 'raw_channel_should_not_leak',
    access: 'raw_access_should_not_leak',
    phone: '0912-345-678',
    address: 'No. 1 Secret Road',
    email: 'customer@example.com',
    lineUserId: 'U1234567890abcdef',
    providerPayload: 'provider_payload_should_not_leak',
    aiPrompt: 'ai_prompt_should_not_leak',
    aiResponse: 'ai_response_should_not_leak',
    internal: 'internal_private_should_not_leak',
    zeaburEnv: 'zeabur_should_not_leak',
    payment: 'payment_should_not_leak',
    billing: 'billing_should_not_leak',
    unknown: 'unknown_field_should_not_leak',
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
});

test('normalizer is deterministic input-immutable and output-isolated', () => {
  const input = {
    ok: true,
    status: 'skipped',
    auditWritten: false,
    persisted: false,
    reasonCode: 'audit_skipped',
    nested: {
      raw: 'raw_writer_result_should_not_leak',
    },
  };
  const before = jsonClone(input);
  const first = normalizeCustomerAccessAuditWriterResult(input);
  const second = normalizeCustomerAccessAuditWriterResult(input);

  assert.deepEqual(input, before);
  assert.deepEqual(first, second);
  assert.notEqual(first, second);

  first.status = 'mutated_status_should_not_leak';
  first.reasonCode = 'mutated_reason_should_not_leak';

  const third = normalizeCustomerAccessAuditWriterResult(input);

  assert.deepEqual(second, {
    ok: true,
    status: 'skipped',
    auditWritten: false,
    persisted: false,
    reasonCode: 'audit_skipped',
  });
  assert.deepEqual(third, second);
  assertNoLeak(second);
  assertNoLeak(third);
});
