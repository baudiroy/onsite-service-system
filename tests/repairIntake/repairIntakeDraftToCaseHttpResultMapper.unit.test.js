'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  PUBLIC_FIELD_NAMES,
  mapRepairIntakeDraftToCasePublicResultToHttpResponse,
} = require('../../src/repairIntake/repairIntakeDraftToCaseHttpResultMapper');

function publicResult(overrides = {}) {
  return {
    ok: true,
    status: 'created',
    messageKey: 'repair_intake_draft_to_case.created',
    reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_PUBLIC_CREATED',
    caseId: 'case-1223',
    repairIntakeDraftId: 'draft-1223',
    ...overrides,
  };
}

function assertPublicBodyShape(body) {
  assert.deepEqual(Object.keys(body).sort(), [...PUBLIC_FIELD_NAMES].sort());
}

function assertNoUnsafeText(value) {
  const serialized = JSON.stringify(value);

  for (const marker of [
    'hidden',
    'rawRows',
    'rawError',
    'dbRow',
    'permissionTrace',
    'providerPayload',
    'auditRecord',
    'organizationId',
    'actorId',
    'phone',
    'address',
    'email',
    'query',
    'stack',
    'token',
    'secret',
    'select',
  ]) {
    assert.equal(serialized.includes(marker), false, `leaked unsafe marker ${marker}`);
  }
}

test('safe public success maps to 201 and safe body', () => {
  const result = mapRepairIntakeDraftToCasePublicResultToHttpResponse(publicResult());

  assert.equal(result.statusCode, 201);
  assertPublicBodyShape(result.body);
  assert.deepEqual(result.body, publicResult());
  assertNoUnsafeText(result);
});

test('safe public denied maps to 403', () => {
  const result = mapRepairIntakeDraftToCasePublicResultToHttpResponse(publicResult({
    ok: false,
    status: 'denied',
    messageKey: 'repair_intake_draft_to_case.denied',
    reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_PUBLIC_DENIED',
    caseId: null,
  }));

  assert.equal(result.statusCode, 403);
  assert.equal(result.body.ok, false);
  assert.equal(result.body.status, 'denied');
  assert.equal(result.body.messageKey, 'repair_intake_draft_to_case.denied');
  assertPublicBodyShape(result.body);
  assertNoUnsafeText(result);
});

test('safe invalid input and context map to 400', () => {
  for (const status of ['invalid_input', 'invalid_context', 'invalid_request']) {
    const result = mapRepairIntakeDraftToCasePublicResultToHttpResponse(publicResult({
      ok: false,
      status,
      messageKey: 'repair_intake_draft_to_case.invalid_request',
      reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_PUBLIC_INVALID_REQUEST',
      caseId: null,
    }));

    assert.equal(result.statusCode, 400);
    assert.equal(result.body.status, status);
    assert.equal(result.body.ok, false);
    assertPublicBodyShape(result.body);
  }
});

test('safe skipped not-created maps to documented 202', () => {
  for (const status of ['not_created', 'skipped']) {
    const result = mapRepairIntakeDraftToCasePublicResultToHttpResponse(publicResult({
      ok: false,
      status,
      messageKey: 'repair_intake_draft_to_case.not_created',
      reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_PUBLIC_NOT_CREATED',
      caseId: null,
    }));

    assert.equal(result.statusCode, 202);
    assert.equal(result.body.ok, false);
    assert.equal(result.body.status, status);
    assertPublicBodyShape(result.body);
    assertNoUnsafeText(result);
  }
});

test('safe unavailable failed and dependency results map to 503', () => {
  for (const status of ['unavailable', 'failed', 'invalid_dependency']) {
    const result = mapRepairIntakeDraftToCasePublicResultToHttpResponse(publicResult({
      ok: false,
      status,
      messageKey: 'repair_intake_draft_to_case.unavailable',
      reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_PUBLIC_UNAVAILABLE',
      caseId: null,
    }));

    assert.equal(result.statusCode, 503);
    assert.equal(result.body.ok, false);
    assert.equal(result.body.status, status);
    assertPublicBodyShape(result.body);
    assertNoUnsafeText(result);
  }
});

test('malformed and null input map safely to generic unavailable', () => {
  for (const input of [null, undefined, 'not an object', ['not object'], { ok: true, status: 'unknown_status' }]) {
    const result = mapRepairIntakeDraftToCasePublicResultToHttpResponse(input);

    assert.equal(result.statusCode, 503);
    assert.deepEqual(result.body, {
      ok: false,
      status: 'unavailable',
      messageKey: 'repair_intake_draft_to_case.unavailable',
      reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_HTTP_RESULT_MAPPER_INVALID_RESULT',
      caseId: null,
      repairIntakeDraftId: null,
    });
    assertNoUnsafeText(result);
  }
});

test('unsafe fields and unsafe public string values are stripped from body', () => {
  const result = mapRepairIntakeDraftToCasePublicResultToHttpResponse(publicResult({
    caseId: 'case-1223',
    repairIntakeDraftId: 'draft-1223',
    sql: 'hidden select detail',
    query: { hidden: true },
    stack: 'hidden stack',
    rawError: 'hidden raw error',
    dbRow: { hidden: true },
    permissionTrace: { hidden: true },
    providerPayload: { hidden: true },
    auditRecord: { hidden: true },
    phone: 'hidden phone',
    address: 'hidden address',
    email: 'hidden email',
    organizationId: 'org-hidden',
    actorId: 'actor-hidden',
  }));

  assert.equal(result.statusCode, 201);
  assertPublicBodyShape(result.body);
  assertNoUnsafeText(result);
});

test('input object is not mutated', () => {
  const input = publicResult({
    organizationId: 'org-hidden',
    actorId: 'actor-hidden',
    rawError: 'hidden raw error',
  });
  const before = JSON.parse(JSON.stringify(input));

  mapRepairIntakeDraftToCasePublicResultToHttpResponse(input);

  assert.deepEqual(input, before);
});

test('returned body is detached from input', () => {
  const input = publicResult();
  const result = mapRepairIntakeDraftToCasePublicResultToHttpResponse(input);

  result.body.caseId = 'changed-case';

  assert.equal(input.caseId, 'case-1223');
});
