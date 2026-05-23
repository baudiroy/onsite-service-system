'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  normalizeRepairIntakeDraftCaseSubmissionIdempotencyResult,
} = require('../../src/repairIntake/repairIntakeDraftCaseSubmissionIdempotencyResultNormalizer');

function sanitizedCommand(overrides = {}) {
  return {
    draftId: 'draft_task944_001',
    organizationId: 'org_task944',
    actorId: 'actor_task944',
    requestId: 'request_task944',
    idempotencyKey: 'idem_task944',
    ...overrides,
  };
}

function caseRef(overrides = {}) {
  return {
    id: 'case_ref_task944',
    organizationId: 'org_task944',
    sourceDraftId: 'draft_task944_001',
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
    'rawImportedRowPayload',
    'rawPayload',
    'select *',
    'stack trace',
    'providerPayload',
    'token',
    'secret',
    'lineAccessToken',
    'LINE access token',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('available idempotency result passes', () => {
  assert.deepEqual(normalizeRepairIntakeDraftCaseSubmissionIdempotencyResult({
    sanitizedCommand: sanitizedCommand(),
    checkerResult: { decision: 'available' },
  }), {
    ok: true,
    decision: 'available',
    reasonCode: 'IDEMPOTENCY_AVAILABLE',
    requiredActions: [],
    caseRef: null,
  });
});

test('missing sanitizedCommand blocks safely', () => {
  assert.equal(normalizeRepairIntakeDraftCaseSubmissionIdempotencyResult({
    checkerResult: { decision: 'available' },
  }).reasonCode, 'IDEMPOTENCY_COMMAND_MISSING');
});

test('missing checker result blocks safely', () => {
  assert.deepEqual(normalizeRepairIntakeDraftCaseSubmissionIdempotencyResult({
    sanitizedCommand: sanitizedCommand(),
  }), {
    ok: false,
    decision: 'failed',
    reasonCode: 'IDEMPOTENCY_RESULT_MISSING',
    requiredActions: ['retry_or_manual_review'],
    caseRef: null,
  });
});

test('conflict result blocks with sanitized existing caseRef', () => {
  const result = normalizeRepairIntakeDraftCaseSubmissionIdempotencyResult({
    sanitizedCommand: sanitizedCommand(),
    checkerResult: {
      decision: 'conflict',
      reasonCode: 'IDEMPOTENCY_CONFLICT',
      requiredActions: ['REVIEW_EXISTING_DRAFT_TO_CASE_SUBMISSION'],
      caseRef: caseRef(),
    },
  });

  assert.deepEqual(result, {
    ok: false,
    decision: 'conflict',
    reasonCode: 'IDEMPOTENCY_CONFLICT',
    requiredActions: ['REVIEW_EXISTING_DRAFT_TO_CASE_SUBMISSION'],
    caseRef: caseRef(),
  });
});

test('conflict result may omit existing caseRef', () => {
  const result = normalizeRepairIntakeDraftCaseSubmissionIdempotencyResult({
    sanitizedCommand: sanitizedCommand(),
    checkerResult: { decision: 'duplicate' },
  });

  assert.equal(result.ok, false);
  assert.equal(result.decision, 'conflict');
  assert.equal(result.reasonCode, 'IDEMPOTENCY_CONFLICT');
  assert.deepEqual(result.requiredActions, ['REVIEW_EXISTING_DRAFT_TO_CASE_SUBMISSION']);
  assert.equal(result.caseRef, null);
});

test('failed checker result blocks safely', () => {
  assert.deepEqual(normalizeRepairIntakeDraftCaseSubmissionIdempotencyResult({
    sanitizedCommand: sanitizedCommand(),
    checkerResult: {
      decision: 'failed',
      reasonCode: 'IDEMPOTENCY_BACKEND_UNAVAILABLE',
      requiredActions: ['retry_or_manual_review'],
    },
  }), {
    ok: false,
    decision: 'failed',
    reasonCode: 'IDEMPOTENCY_BACKEND_UNAVAILABLE',
    requiredActions: ['retry_or_manual_review'],
    caseRef: null,
  });
});

test('unknown checker result blocks safely', () => {
  assert.equal(normalizeRepairIntakeDraftCaseSubmissionIdempotencyResult({
    sanitizedCommand: sanitizedCommand(),
    checkerResult: { decision: 'maybe' },
  }).reasonCode, 'IDEMPOTENCY_RESULT_UNRECOGNIZED');
});

test('organization mismatch in caseRef blocks safely', () => {
  assert.deepEqual(normalizeRepairIntakeDraftCaseSubmissionIdempotencyResult({
    sanitizedCommand: sanitizedCommand(),
    checkerResult: {
      decision: 'conflict',
      caseRef: caseRef({ organizationId: 'org_other' }),
    },
  }), {
    ok: false,
    decision: 'failed',
    reasonCode: 'IDEMPOTENCY_CASE_REF_ORGANIZATION_MISMATCH',
    requiredActions: ['manual_review'],
    caseRef: null,
  });
});

test('source draft mismatch in caseRef blocks safely', () => {
  assert.deepEqual(normalizeRepairIntakeDraftCaseSubmissionIdempotencyResult({
    sanitizedCommand: sanitizedCommand(),
    checkerResult: {
      decision: 'conflict',
      caseRef: caseRef({ sourceDraftId: 'draft_other' }),
    },
  }), {
    ok: false,
    decision: 'failed',
    reasonCode: 'IDEMPOTENCY_CASE_REF_SOURCE_DRAFT_MISMATCH',
    requiredActions: ['manual_review'],
    caseRef: null,
  });
});

test('unsafe fields are stripped from command and checker result', () => {
  const result = normalizeRepairIntakeDraftCaseSubmissionIdempotencyResult({
    sanitizedCommand: sanitizedCommand({
      phone: 'phone',
      address: 'address',
      customerPayload: 'customerPayload',
      rawImportedRowPayload: 'rawImportedRowPayload',
      rawPayload: 'rawPayload',
      caseId: 'unsafe_case_id',
      finalAppointmentId: 'final_should_not_copy',
    }),
    checkerResult: {
      decision: 'conflict',
      caseId: 'unsafe_case_id',
      phone: 'phone',
      address: 'address',
      customerPayload: 'customerPayload',
      rawImportedRowPayload: 'rawImportedRowPayload',
      rawPayload: 'rawPayload',
      sql: 'select *',
      stack: 'stack trace',
      providerPayload: 'providerPayload',
      token: 'token',
      secret: 'secret',
      lineAccessToken: 'LINE access token',
      finalAppointmentId: 'final_should_not_copy',
      caseRef: caseRef({
        phone: 'phone',
        address: 'address',
        customerPayload: 'customerPayload',
        rawImportedRowPayload: 'rawImportedRowPayload',
        finalAppointmentId: 'final_should_not_copy',
      }),
    },
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.caseRef, caseRef());
  assertNoForbiddenFields(result);
});

test('no Case ID is generated by the normalizer', () => {
  const result = normalizeRepairIntakeDraftCaseSubmissionIdempotencyResult({
    sanitizedCommand: sanitizedCommand(),
    checkerResult: { decision: 'conflict' },
  });

  assert.equal(result.caseRef, null);
  assertNoForbiddenFields(result);
});

test('input is not mutated', () => {
  const input = {
    sanitizedCommand: sanitizedCommand(),
    checkerResult: {
      decision: 'conflict',
      caseRef: caseRef(),
    },
  };
  const before = clone(input);

  normalizeRepairIntakeDraftCaseSubmissionIdempotencyResult(input);

  assert.deepEqual(input, before);
});

test('source has no DB repository store provider audit writer default checker dependencies', () => {
  const sourcePath = path.resolve(__dirname, '../../src/repairIntake/repairIntakeDraftCaseSubmissionIdempotencyResultNormalizer.js');
  const source = fs.readFileSync(sourcePath, 'utf8');

  assert.equal(source.includes('require('), false);

  for (const forbidden of [
    'Repository',
    'query(',
    'execute(',
    'store.',
    'defaultChecker',
    'defaultWriter',
    'auditWriter',
    'axios',
    'fetch(',
  ]) {
    assert.equal(source.includes(forbidden), false, `source should not include ${forbidden}`);
  }
});
