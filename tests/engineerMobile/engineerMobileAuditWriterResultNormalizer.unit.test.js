'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  ENGINEER_MOBILE_AUDIT_WRITER_REASON_CODES,
  ENGINEER_MOBILE_AUDIT_WRITER_RESULT_KEYS,
  ENGINEER_MOBILE_AUDIT_WRITER_STATUSES,
  normalizeEngineerMobileAuditWriterResult,
} = require('../../src/engineerMobile/engineerMobileAuditWriterResultNormalizer');

const RECORDED = Object.freeze({
  ok: true,
  status: 'recorded',
  auditWritten: true,
  persisted: true,
});
const SKIPPED = Object.freeze({
  ok: true,
  status: 'skipped',
  auditWritten: false,
  persisted: false,
  reasonCode: 'audit_skipped',
});
const FAILED = Object.freeze({
  ok: false,
  status: 'failed',
  auditWritten: false,
  persisted: false,
  reasonCode: 'invalid_writer_result',
});

const forbiddenValues = [
  'raw_writer_result_should_not_leak',
  'raw_error_message_should_not_leak',
  'raw_stack_should_not_leak',
  'select secret_should_not_leak',
  'raw_db_row_should_not_leak',
  'authorization_header_should_not_leak',
  'Bearer token_should_not_leak',
  'raw_request_should_not_leak',
  'raw_response_should_not_leak',
  'raw_provider_payload_should_not_leak',
  'raw_ai_prompt_should_not_leak',
  'private_note_should_not_leak',
  'customer_phone_should_not_leak',
  'DATABASE_URL_should_not_leak',
  'billing_payload_should_not_leak',
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertOnlyResultKeys(result) {
  assert.deepEqual(Object.keys(result).sort(), ENGINEER_MOBILE_AUDIT_WRITER_RESULT_KEYS.filter((key) => (
    result[key] !== undefined
  )).sort());
}

function assertNoLeak(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of forbiddenValues) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }

  for (const key of [
    'rawWriterResult',
    'error',
    'message',
    'stack',
    'cause',
    'dbRows',
    'queryMetadata',
    'sql',
    'headers',
    'authorization',
    'cookies',
    'token',
    'rawRequest',
    'rawResponse',
    'rawUser',
    'rawSession',
    'customerPhone',
    'providerPayload',
    'pushPayload',
    'aiPrompt',
    'env',
    'billing',
    'privateNote',
    'unknownField',
  ]) {
    assert.equal(serialized.includes(`"${key}"`), false, `leaked key ${key}`);
  }
}

test('exports Engineer Mobile writer result constants and normalizer', () => {
  assert.equal(typeof normalizeEngineerMobileAuditWriterResult, 'function');
  assert.deepEqual(ENGINEER_MOBILE_AUDIT_WRITER_RESULT_KEYS, [
    'ok',
    'status',
    'auditWritten',
    'persisted',
    'reasonCode',
  ]);
  assert.deepEqual(ENGINEER_MOBILE_AUDIT_WRITER_STATUSES, [
    'recorded',
    'skipped',
    'failed',
  ]);
  assert.deepEqual(ENGINEER_MOBILE_AUDIT_WRITER_REASON_CODES, [
    'audit_writer_unavailable',
    'audit_event_invalid',
    'audit_persistence_failed',
    'audit_skipped',
    'audit_not_configured',
    'invalid_writer_result',
  ]);
});

test('valid recorded result normalizes exactly and omits reasonCode', () => {
  const result = normalizeEngineerMobileAuditWriterResult({
    ok: true,
    status: 'recorded',
    auditWritten: true,
    persisted: true,
    reasonCode: 'audit_persistence_failed',
    rawWriterResult: 'raw_writer_result_should_not_leak',
  });

  assert.deepEqual(result, RECORDED);
  assertOnlyResultKeys(result);
  assertNoLeak(result);
});

test('valid skipped result accepts only skipped reason codes', () => {
  for (const reasonCode of [
    'audit_skipped',
    'audit_not_configured',
    'audit_writer_unavailable',
  ]) {
    const result = normalizeEngineerMobileAuditWriterResult({
      ok: true,
      status: 'skipped',
      auditWritten: false,
      persisted: false,
      reasonCode,
    });

    assert.deepEqual(result, {
      ...SKIPPED,
      reasonCode,
    });
    assertOnlyResultKeys(result);
  }
});

test('valid failed result accepts only failed reason codes', () => {
  for (const reasonCode of [
    'audit_event_invalid',
    'audit_persistence_failed',
    'audit_writer_unavailable',
    'invalid_writer_result',
  ]) {
    const result = normalizeEngineerMobileAuditWriterResult({
      ok: false,
      status: 'failed',
      auditWritten: false,
      persisted: false,
      reasonCode,
    });

    assert.deepEqual(result, {
      ...FAILED,
      reasonCode,
    });
    assertOnlyResultKeys(result);
  }
});

test('skipped and failed unknown raw reason codes fall back safely', () => {
  assert.deepEqual(normalizeEngineerMobileAuditWriterResult({
    ok: true,
    status: 'skipped',
    auditWritten: false,
    persisted: false,
    reasonCode: 'select secret_should_not_leak',
  }), SKIPPED);
  assert.deepEqual(normalizeEngineerMobileAuditWriterResult({
    ok: false,
    status: 'failed',
    auditWritten: false,
    persisted: false,
    reasonCode: 'Bearer token_should_not_leak',
  }), FAILED);
});

test('malformed inputs normalize to safe failed result without throwing', () => {
  class WriterResult {}
  const malformedInputs = [
    undefined,
    null,
    true,
    false,
    'recorded',
    123,
    [],
    new Date('2026-05-30T00:00:00.000Z'),
    new Error('raw_error_message_should_not_leak'),
    Buffer.from('raw_writer_result_should_not_leak'),
    { then() {} },
    function writerResult() {},
    new WriterResult(),
  ];

  for (const input of malformedInputs) {
    assert.doesNotThrow(() => normalizeEngineerMobileAuditWriterResult(input));
    assert.deepEqual(normalizeEngineerMobileAuditWriterResult(input), FAILED);
  }
});

test('invalid status and contradictory flags normalize to safe failed result', () => {
  const invalidInputs = [
    { ok: true, status: 'recorded', auditWritten: true, persisted: false },
    { ok: false, status: 'recorded', auditWritten: true, persisted: true },
    { ok: true, status: 'skipped', auditWritten: true, persisted: false },
    { ok: true, status: 'failed', auditWritten: false, persisted: false },
    { ok: 'true', status: 'recorded', auditWritten: 'true', persisted: 'true' },
    { ok: 1, status: 'recorded', auditWritten: 1, persisted: 1 },
    { ok: true, status: 'unknown', auditWritten: true, persisted: true },
  ];

  for (const input of invalidInputs) {
    assert.deepEqual(normalizeEngineerMobileAuditWriterResult(input), FAILED);
  }
});

test('sensitive and unknown input fields never appear in normalized output', () => {
  const result = normalizeEngineerMobileAuditWriterResult({
    ok: false,
    status: 'failed',
    auditWritten: false,
    persisted: false,
    reasonCode: 'audit_persistence_failed',
    rawWriterResult: 'raw_writer_result_should_not_leak',
    error: new Error('raw_error_message_should_not_leak'),
    message: 'raw_error_message_should_not_leak',
    stack: 'raw_stack_should_not_leak',
    cause: 'raw_error_message_should_not_leak',
    dbRows: ['raw_db_row_should_not_leak'],
    queryMetadata: 'select secret_should_not_leak',
    sql: 'select secret_should_not_leak',
    headers: { authorization: 'authorization_header_should_not_leak' },
    authorization: 'authorization_header_should_not_leak',
    cookies: 'cookie_should_not_leak',
    token: 'Bearer token_should_not_leak',
    rawRequest: 'raw_request_should_not_leak',
    rawResponse: 'raw_response_should_not_leak',
    rawUser: 'raw_user_should_not_leak',
    rawSession: 'raw_session_should_not_leak',
    customerPhone: 'customer_phone_should_not_leak',
    providerPayload: 'raw_provider_payload_should_not_leak',
    pushPayload: 'raw_provider_payload_should_not_leak',
    aiPrompt: 'raw_ai_prompt_should_not_leak',
    env: 'DATABASE_URL_should_not_leak',
    billing: 'billing_payload_should_not_leak',
    privateNote: 'private_note_should_not_leak',
    unknownField: 'raw_writer_result_should_not_leak',
  });

  assert.deepEqual(result, {
    ...FAILED,
    reasonCode: 'audit_persistence_failed',
  });
  assertNoLeak(result);
});

test('normalizer is deterministic, non-mutating, and returns newly built objects', () => {
  const input = {
    ok: true,
    status: 'skipped',
    auditWritten: false,
    persisted: false,
    reasonCode: 'audit_not_configured',
    nested: {
      raw: 'raw_writer_result_should_not_leak',
    },
  };
  const original = clone(input);
  const first = normalizeEngineerMobileAuditWriterResult(input);
  const second = normalizeEngineerMobileAuditWriterResult(input);

  assert.deepEqual(input, original);
  assert.deepEqual(first, second);
  assert.notEqual(first, input);
  assertNoLeak(first);
});
