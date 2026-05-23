'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  normalizeRepairIntakeDraftCaseSubmissionResult,
} = require('../../src/repairIntake/repairIntakeDraftCaseSubmissionResultNormalizer');

function context(overrides = {}) {
  return {
    draftId: 'draft_task939_001',
    organizationId: 'org_task939',
    sourceDraftId: 'draft_task939_001',
    ...overrides,
  };
}

function creatorResult(overrides = {}) {
  return {
    id: 'case_ref_task939',
    organizationId: 'org_task939',
    sourceDraftId: 'draft_task939_001',
    status: 'created',
    ...overrides,
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertNoForbiddenFields(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'caseId',
    'case_id',
    'finalAppointmentId',
    'final_appointment_id',
    'phone',
    'address',
    'customerPayload',
    'rawPayload',
    'select *',
    'stack trace',
    'providerPayload',
    'token',
    'secret',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('valid creator result returns sanitized caseRef', () => {
  assert.deepEqual(normalizeRepairIntakeDraftCaseSubmissionResult({
    ...context(),
    creatorResult: creatorResult(),
  }), {
    ok: true,
    reasonCode: 'CASE_REF_NORMALIZED',
    requiredActions: [],
    caseRef: {
      id: 'case_ref_task939',
      organizationId: 'org_task939',
      sourceDraftId: 'draft_task939_001',
      status: 'created',
    },
  });
});

test('creator result nested caseRef is supported and unsafe fields are stripped', () => {
  const result = normalizeRepairIntakeDraftCaseSubmissionResult({
    ...context(),
    creatorResult: {
      caseRef: creatorResult({
        phone: 'phone',
        address: 'address',
        customerPayload: 'customerPayload',
        rawPayload: 'rawPayload',
        finalAppointmentId: 'final_should_not_copy',
        token: 'token',
        secret: 'secret',
      }),
    },
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.caseRef, {
    id: 'case_ref_task939',
    organizationId: 'org_task939',
    sourceDraftId: 'draft_task939_001',
    status: 'created',
  });
  assertNoForbiddenFields(result);
});

test('missing creator result is blocked', () => {
  assert.deepEqual(normalizeRepairIntakeDraftCaseSubmissionResult(context()), {
    ok: false,
    reasonCode: 'CASE_CREATOR_RESULT_MISSING',
    requiredActions: ['manual_review'],
    caseRef: null,
  });
});

test('missing case id is blocked and no case id is generated', () => {
  assert.deepEqual(normalizeRepairIntakeDraftCaseSubmissionResult({
    ...context(),
    creatorResult: creatorResult({ id: undefined }),
  }), {
    ok: false,
    reasonCode: 'CASE_REF_ID_MISSING',
    requiredActions: ['manual_review'],
    caseRef: null,
  });
});

test('missing organization is blocked', () => {
  assert.deepEqual(normalizeRepairIntakeDraftCaseSubmissionResult({
    ...context(),
    creatorResult: creatorResult({ organizationId: undefined }),
  }), {
    ok: false,
    reasonCode: 'CASE_REF_ORGANIZATION_MISSING',
    requiredActions: ['manual_review'],
    caseRef: null,
  });
});

test('organization mismatch is blocked', () => {
  assert.deepEqual(normalizeRepairIntakeDraftCaseSubmissionResult({
    ...context(),
    creatorResult: creatorResult({ organizationId: 'org_other' }),
  }), {
    ok: false,
    reasonCode: 'CASE_REF_ORGANIZATION_MISMATCH',
    requiredActions: ['manual_review'],
    caseRef: null,
  });
});

test('source draft mismatch is blocked', () => {
  assert.deepEqual(normalizeRepairIntakeDraftCaseSubmissionResult({
    ...context(),
    creatorResult: creatorResult({ sourceDraftId: 'draft_other' }),
  }), {
    ok: false,
    reasonCode: 'CASE_REF_SOURCE_DRAFT_MISMATCH',
    requiredActions: ['manual_review'],
    caseRef: null,
  });
});

test('missing source draft uses sanitized context source draft id', () => {
  const result = normalizeRepairIntakeDraftCaseSubmissionResult({
    ...context(),
    creatorResult: creatorResult({ sourceDraftId: undefined }),
  });

  assert.equal(result.ok, true);
  assert.equal(result.caseRef.sourceDraftId, 'draft_task939_001');
});

test('missing status is blocked', () => {
  assert.deepEqual(normalizeRepairIntakeDraftCaseSubmissionResult({
    ...context(),
    creatorResult: creatorResult({ status: undefined }),
  }), {
    ok: false,
    reasonCode: 'CASE_REF_STATUS_MISSING',
    requiredActions: ['manual_review'],
    caseRef: null,
  });
});

test('SQL stack provider token secret raw payload fields are never returned', () => {
  const result = normalizeRepairIntakeDraftCaseSubmissionResult({
    ...context(),
    creatorResult: creatorResult({
      sql: 'select *',
      stack: 'stack trace',
      providerPayload: 'providerPayload',
      phone: 'phone',
      address: 'address',
      customerPayload: 'customerPayload',
      rawPayload: 'rawPayload',
      token: 'token',
      secret: 'secret',
    }),
  });

  assert.equal(result.ok, true);
  assertNoForbiddenFields(result);
});

test('input is not mutated', () => {
  const input = {
    ...context(),
    creatorResult: creatorResult(),
  };
  const before = clone(input);

  normalizeRepairIntakeDraftCaseSubmissionResult(input);

  assert.deepEqual(input, before);
});
