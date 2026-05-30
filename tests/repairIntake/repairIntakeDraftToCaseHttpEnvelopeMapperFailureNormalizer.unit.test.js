'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  PUBLIC_FIELD_NAMES,
  mapRepairIntakeDraftToCasePublicResultToHttpResponse,
} = require('../../src/repairIntake/repairIntakeDraftToCaseHttpResultMapper');

const DEFAULT_FAILURE_BODY = {
  ok: false,
  status: 'unavailable',
  messageKey: 'repair_intake_draft_to_case.unavailable',
  reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_HTTP_RESULT_MAPPER_INVALID_RESULT',
  caseId: null,
  repairIntakeDraftId: null,
};

const UNSAFE_TEXT = [
  'select * from http_mapper_task2238',
  'postgres://task2238-db',
  'postgresql://task2238-db',
  'DATABASE_URL',
  'process.env',
  'unsafe token',
  'unsafe password',
  'unsafe secret',
  'unsafe stack trace',
  'unsafe provider payload',
  'unsafe customer phone',
  'unsafe customer address',
  'unsafe raw request',
  'unsafe raw body',
  'unsafe raw draftInput',
  'unsafe audit internal',
  'unsafe debug detail',
  'unsafe billing invoice settlement',
  'unsafe openai vector payload',
  'unsafe rag payload',
].join(' ');

function safeSuccess(overrides = {}) {
  return {
    ok: true,
    status: 'created',
    messageKey: 'repair_intake_draft_to_case.created',
    reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_PUBLIC_CREATED',
    caseId: 'case-task2238',
    repairIntakeDraftId: 'draft-task2238',
    ...overrides,
  };
}

function safeDenied(overrides = {}) {
  return {
    ok: false,
    status: 'denied',
    messageKey: 'repair_intake_draft_to_case.denied',
    reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_PUBLIC_DENIED',
    caseId: null,
    repairIntakeDraftId: 'draft-task2238',
    ...overrides,
  };
}

function safeUnavailable(overrides = {}) {
  return {
    ok: false,
    status: 'unavailable',
    messageKey: 'repair_intake_draft_to_case.unavailable',
    reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_PUBLIC_UNAVAILABLE',
    caseId: null,
    repairIntakeDraftId: 'draft-task2238',
    ...overrides,
  };
}

function assertPublicBodyShape(body) {
  assert.deepEqual(Object.keys(body).sort(), [...PUBLIC_FIELD_NAMES].sort());
}

function assertNoUnsafeText(value) {
  const serialized = JSON.stringify(value);

  for (const marker of [
    'select *',
    'postgres://',
    'postgresql://',
    'DATABASE_URL',
    'process.env',
    'unsafe',
    'token',
    'password',
    'secret',
    'stack trace',
    'providerPayload',
    'provider payload',
    'customer phone',
    'customer address',
    'raw request',
    'raw body',
    'draftInput',
    'raw draftInput',
    'audit internal',
    'debug detail',
    'billing',
    'invoice',
    'settlement',
    'openai',
    'vector',
    'rag',
  ]) {
    assert.equal(serialized.includes(marker), false, `leaked unsafe marker ${marker}`);
  }
}

test('malformed null and non-object route-facing results fail closed', () => {
  for (const input of [null, undefined, 'unsafe token stack', 42, ['unsafe provider payload']]) {
    const result = mapRepairIntakeDraftToCasePublicResultToHttpResponse(input);

    assert.equal(result.statusCode, 503);
    assert.deepEqual(result.body, DEFAULT_FAILURE_BODY);
    assertPublicBodyShape(result.body);
    assertNoUnsafeText(result);
  }
});

test('unsafe success-shaped core strings fail closed instead of producing 201', () => {
  for (const overrides of [
    { messageKey: UNSAFE_TEXT },
    { reasonCode: UNSAFE_TEXT },
    { messageKey: 'repair_intake_draft_to_case.created', reasonCode: 'postgres://task2238-db' },
    { messageKey: 'process.env.SECRET', reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_PUBLIC_CREATED' },
  ]) {
    const input = safeSuccess(overrides);
    const before = structuredClone(input);
    const result = mapRepairIntakeDraftToCasePublicResultToHttpResponse(input);

    assert.equal(result.statusCode, 503);
    assert.deepEqual(result.body, DEFAULT_FAILURE_BODY);
    assertNoUnsafeText(result);
    assert.deepEqual(input, before);
  }
});

test('unsafe public scalar ids are stripped without leaking raw private or system fields', () => {
  const input = safeSuccess({
    caseId: 'case-postgres://task2238-db',
    repairIntakeDraftId: 'draft-process.env-token-task2238',
    rawError: UNSAFE_TEXT,
    stack: UNSAFE_TEXT,
    providerPayload: UNSAFE_TEXT,
    customerPhone: UNSAFE_TEXT,
    auditInternal: UNSAFE_TEXT,
    debug: UNSAFE_TEXT,
    billing: UNSAFE_TEXT,
    rag: UNSAFE_TEXT,
  });
  const before = structuredClone(input);
  const result = mapRepairIntakeDraftToCasePublicResultToHttpResponse(input);

  assert.equal(result.statusCode, 201);
  assert.deepEqual(result.body, {
    ok: true,
    status: 'created',
    messageKey: 'repair_intake_draft_to_case.created',
    reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_PUBLIC_CREATED',
    caseId: null,
    repairIntakeDraftId: null,
  });
  assertPublicBodyShape(result.body);
  assertNoUnsafeText(result);
  assert.deepEqual(input, before);
});

test('sanitized denied and unavailable paths remain unchanged', () => {
  const denied = mapRepairIntakeDraftToCasePublicResultToHttpResponse(safeDenied({
    rawError: UNSAFE_TEXT,
    providerPayload: UNSAFE_TEXT,
  }));
  const unavailable = mapRepairIntakeDraftToCasePublicResultToHttpResponse(safeUnavailable({
    stack: UNSAFE_TEXT,
    debug: UNSAFE_TEXT,
  }));

  assert.equal(denied.statusCode, 403);
  assert.deepEqual(denied.body, safeDenied());
  assertPublicBodyShape(denied.body);
  assertNoUnsafeText(denied);

  assert.equal(unavailable.statusCode, 503);
  assert.deepEqual(unavailable.body, safeUnavailable());
  assertPublicBodyShape(unavailable.body);
  assertNoUnsafeText(unavailable);
});

test('existing allowed success path remains unchanged and detached from input', () => {
  const input = safeSuccess();
  const before = structuredClone(input);
  const result = mapRepairIntakeDraftToCasePublicResultToHttpResponse(input);

  assert.equal(result.statusCode, 201);
  assert.deepEqual(result.body, input);
  assertPublicBodyShape(result.body);
  assertNoUnsafeText(result);
  assert.deepEqual(input, before);

  result.body.caseId = 'mutated-after-return';

  assert.equal(input.caseId, 'case-task2238');
});
