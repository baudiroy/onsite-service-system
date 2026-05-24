'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  presentRepairIntakeDraftToCaseResult,
} = require('../../src/repairIntake/repairIntakeDraftToCasePublicResultPresenter');

function unsafeSuccessResult(overrides = {}) {
  return {
    ok: true,
    status: 'created',
    reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_ORCHESTRATOR_SUBMITTED',
    caseId: 'case-1216',
    repairIntakeDraftId: 'draft-1216',
    organizationId: 'org-internal-1216',
    actorId: 'actor-internal-1216',
    query: { unsafe: true },
    sql: 'hidden',
    stack: 'hidden',
    rawError: 'hidden',
    dbRow: { phone: 'hidden' },
    permissionTrace: { role: 'hidden' },
    providerPayload: { token: 'hidden' },
    auditRecord: { internal: 'hidden' },
    phone: 'hidden',
    address: 'hidden',
    email: 'hidden',
    ...overrides,
  };
}

function assertPublicShape(value) {
  assert.deepEqual(Object.keys(value).sort(), [
    'caseId',
    'messageKey',
    'ok',
    'reasonCode',
    'repairIntakeDraftId',
    'status',
  ]);
}

function assertNoUnsafeText(value) {
  const serialized = JSON.stringify(value);

  for (const marker of [
    'org-internal',
    'actor-internal',
    'hidden',
    'sql',
    'query',
    'stack',
    'rawError',
    'dbRow',
    'permissionTrace',
    'providerPayload',
    'auditRecord',
    'phone',
    'address',
    'email',
    'repository',
    'permission',
    'provider',
    'audit',
  ]) {
    assert.equal(serialized.includes(marker), false, `leaked unsafe marker ${marker}`);
  }
}

test('success orchestrator result maps to safe public success with scalar caseId', () => {
  const result = presentRepairIntakeDraftToCaseResult(unsafeSuccessResult());

  assertPublicShape(result);
  assert.equal(result.ok, true);
  assert.equal(result.status, 'created');
  assert.equal(result.messageKey, 'repair_intake_draft_to_case.created');
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_PUBLIC_CREATED');
  assert.equal(result.caseId, 'case-1216');
  assert.equal(result.repairIntakeDraftId, 'draft-1216');
  assertNoUnsafeText(result);
});

test('success with unsafe nested case object does not leak nested fields', () => {
  const result = presentRepairIntakeDraftToCaseResult(unsafeSuccessResult({
    caseId: { id: 'case-nested-1216', phone: 'hidden' },
    caseRef: {
      caseId: 'case-ref-1216',
      phone: 'hidden',
      address: 'hidden',
    },
  }));

  assertPublicShape(result);
  assert.equal(result.ok, true);
  assert.equal(result.caseId, null);
  assert.equal(result.repairIntakeDraftId, 'draft-1216');
  assertNoUnsafeText(result);
});

test('denied auth maps to generic safe denied public message', () => {
  const result = presentRepairIntakeDraftToCaseResult({
    ok: false,
    status: 'denied',
    reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_AUTHORIZATION_GATE_DENIED',
    repairIntakeDraftId: 'draft-1216',
    permissionTrace: { role: 'hidden' },
  });

  assertPublicShape(result);
  assert.equal(result.ok, false);
  assert.equal(result.status, 'denied');
  assert.equal(result.messageKey, 'repair_intake_draft_to_case.denied');
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_PUBLIC_DENIED');
  assert.equal(result.caseId, null);
  assert.equal(result.repairIntakeDraftId, 'draft-1216');
  assertNoUnsafeText(result);
});

test('invalid input maps to generic safe invalid request public message', () => {
  const result = presentRepairIntakeDraftToCaseResult({
    ok: false,
    status: 'invalid_input',
    reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_AUTHORIZATION_GATE_ORGANIZATION_REQUIRED',
    repairIntakeDraftId: 'draft-1216',
    rawError: 'hidden',
  });

  assertPublicShape(result);
  assert.equal(result.ok, false);
  assert.equal(result.status, 'invalid_request');
  assert.equal(result.messageKey, 'repair_intake_draft_to_case.invalid_request');
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_PUBLIC_INVALID_REQUEST');
  assert.equal(result.repairIntakeDraftId, 'draft-1216');
  assertNoUnsafeText(result);
});

test('dependency failure maps to generic safe unavailable public message', () => {
  const result = presentRepairIntakeDraftToCaseResult({
    ok: false,
    status: 'invalid_dependency',
    reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_ORCHESTRATOR_APPLICATION_SERVICE_REQUIRED',
    repairIntakeDraftId: 'draft-1216',
    stack: 'hidden',
  });

  assertPublicShape(result);
  assert.equal(result.ok, false);
  assert.equal(result.status, 'unavailable');
  assert.equal(result.messageKey, 'repair_intake_draft_to_case.unavailable');
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_PUBLIC_UNAVAILABLE');
  assert.equal(result.repairIntakeDraftId, 'draft-1216');
  assertNoUnsafeText(result);
});

test('repository or app failure with raw sensitive error message does not leak raw message', () => {
  const result = presentRepairIntakeDraftToCaseResult({
    ok: false,
    status: 'failed',
    reasonCode: 'REPAIR_INTAKE_CASE_REPOSITORY_CONSUMER_REPOSITORY_FAILED',
    repairIntakeDraftId: 'draft-1216',
    rawError: 'hidden raw dependency message',
    stack: 'hidden stack',
    dbRow: { phone: 'hidden' },
  });

  assertPublicShape(result);
  assert.equal(result.ok, false);
  assert.equal(result.status, 'unavailable');
  assert.equal(result.messageKey, 'repair_intake_draft_to_case.unavailable');
  assertNoUnsafeText(result);
});

test('malformed and null input map safely', () => {
  for (const input of [undefined, null, 'result', 42, true, [], () => {}]) {
    const result = presentRepairIntakeDraftToCaseResult(input);

    assertPublicShape(result);
    assert.equal(result.ok, false);
    assert.equal(result.status, 'invalid_request');
    assert.equal(result.messageKey, 'repair_intake_draft_to_case.invalid_request');
    assert.equal(result.caseId, null);
    assert.equal(result.repairIntakeDraftId, null);
    assertNoUnsafeText(result);
  }
});

test('input object is not mutated', () => {
  const input = unsafeSuccessResult();
  const before = JSON.parse(JSON.stringify(input));

  presentRepairIntakeDraftToCaseResult(input);

  assert.deepEqual(input, before);
});

test('unsafe fields are removed from public presenter result', () => {
  const result = presentRepairIntakeDraftToCaseResult(unsafeSuccessResult({
    sql: 'hidden',
    query: 'hidden',
    stack: 'hidden',
    rawError: 'hidden',
    dbRow: 'hidden',
    permissionTrace: 'hidden',
    providerPayload: 'hidden',
    auditRecord: 'hidden',
    phone: 'hidden',
    address: 'hidden',
    email: 'hidden',
  }));

  assertPublicShape(result);
  assertNoUnsafeText(result);
});
