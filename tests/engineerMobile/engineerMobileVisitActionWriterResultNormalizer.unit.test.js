'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  ENGINEER_MOBILE_VISIT_ACTION_WRITER_RESULT_NORMALIZER_KIND,
  normalizeEngineerMobileVisitActionWriterResult,
} = require('../../src/engineerMobile/engineerMobileVisitActionWriterResultNormalizer');

function normalize(writerKind, result) {
  return normalizeEngineerMobileVisitActionWriterResult({ writerKind, result });
}

function assertSuccess(actual, writerKind) {
  assert.deepEqual(actual, {
    ok: true,
    writerKind,
    normalizerKind: ENGINEER_MOBILE_VISIT_ACTION_WRITER_RESULT_NORMALIZER_KIND,
    reasonCode: 'writer_succeeded',
  });
}

function assertFailure(actual, writerKind, reasonCode = 'writer_failed') {
  assert.deepEqual(actual, {
    ok: false,
    writerKind,
    normalizerKind: ENGINEER_MOBILE_VISIT_ACTION_WRITER_RESULT_NORMALIZER_KIND,
    reasonCode,
  });
}

function assertNoRawLeak(actual) {
  const serialized = JSON.stringify(actual);

  for (const forbidden of [
    'raw secret',
    'SELECT * FROM sensitive_table',
    'unsafe auth material should not leak',
    'provider payload should not leak',
    'customer phone should not leak',
    'report draft should not leak',
    'stack should not leak',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('transition success for undefined', () => {
  assertSuccess(normalize('transition', undefined), 'transition');
});

test('transition success for null', () => {
  assertSuccess(normalize('transition', null), 'transition');
});

test('transition success for true', () => {
  assertSuccess(normalize('transition', true), 'transition');
});

test('transition success for ok true', () => {
  assertSuccess(normalize('transition', { ok: true }), 'transition');
});

test('transition success for accepted true', () => {
  assertSuccess(normalize('transition', { accepted: true }), 'transition');
});

test('transition success for written true', () => {
  assertSuccess(normalize('transition', { written: true }), 'transition');
});

test('transition success for persisted true', () => {
  assertSuccess(normalize('transition', { persisted: true }), 'transition');
});

test('transition failure for false', () => {
  assertFailure(normalize('transition', false), 'transition');
});

test('transition failure for ok false', () => {
  assertFailure(normalize('transition', { ok: false }), 'transition');
});

test('transition failure for written false', () => {
  assertFailure(normalize('transition', { written: false }), 'transition');
});

test('transition failure for persisted false', () => {
  assertFailure(normalize('transition', { persisted: false }), 'transition');
});

test('transition failure for raw error object without exposing raw value', () => {
  const result = normalize('transition', {
    error: 'raw secret',
    detail: 'SELECT * FROM sensitive_table',
    unsafeAuthMaterial: 'unsafe auth material should not leak',
  });

  assertFailure(result, 'transition');
  assertNoRawLeak(result);
});

test('audit success for recorded true', () => {
  assertSuccess(normalize('audit', { recorded: true }), 'audit');
});

test('audit failure for recorded false', () => {
  assertFailure(normalize('audit', { recorded: false }), 'audit');
});

test('unknown writerKind is sanitized as unknown', () => {
  assertFailure(normalize('other', { ok: true }), 'unknown', 'unknown_writer_kind');
});

test('unknown object shape fails closed', () => {
  assertFailure(normalize('transition', { message: 'looks fine' }), 'transition', 'writer_result_unrecognized');
});

test('output does not include raw error SQL auth material provider customer or report data', () => {
  const result = normalize('audit', {
    error: 'raw secret',
    sql: 'SELECT * FROM sensitive_table',
    unsafeAuthMaterial: 'unsafe auth material should not leak',
    providerPayload: 'provider payload should not leak',
    customerPhone: 'customer phone should not leak',
    reportDraftBody: 'report draft should not leak',
    stack: 'stack should not leak',
  });

  assertFailure(result, 'audit');
  assertNoRawLeak(result);
});
