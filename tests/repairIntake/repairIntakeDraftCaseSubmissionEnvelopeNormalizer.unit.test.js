'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  ACTION,
  normalizeRepairIntakeDraftCaseSubmissionEnvelope,
} = require('../../src/repairIntake/repairIntakeDraftCaseSubmissionEnvelopeNormalizer');

function caseRef(overrides = {}) {
  return {
    id: 'case_ref_task945',
    organizationId: 'org_task945',
    sourceDraftId: 'draft_task945_001',
    status: 'created',
    ...overrides,
  };
}

function auditEvent(overrides = {}) {
  return {
    eventType: 'repair_intake_draft_to_case_submission',
    outcome: 'submitted',
    draftId: 'draft_task945_001',
    organizationId: 'org_task945',
    actorId: 'actor_task945',
    requestId: 'request_task945',
    idempotencyKey: 'idem_task945',
    caseRef: caseRef(),
    reasonCode: 'CASE_REF_NORMALIZED',
    requiredActions: [],
    ...overrides,
  };
}

function envelope(overrides = {}) {
  return {
    ok: true,
    draftId: 'draft_task945_001',
    organizationId: 'org_task945',
    submitted: true,
    caseCreationAllowed: true,
    candidateReady: true,
    reasonCode: 'CASE_SUBMITTED',
    requiredActions: [],
    caseRef: caseRef(),
    auditEvent: auditEvent(),
    ...overrides,
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function stableKeys() {
  return [
    'ok',
    'action',
    'draftId',
    'organizationId',
    'submitted',
    'caseCreationAllowed',
    'candidateReady',
    'reasonCode',
    'requiredActions',
    'caseRef',
    'auditEvent',
  ];
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

test('normalizer returns exact stable envelope keys', () => {
  const result = normalizeRepairIntakeDraftCaseSubmissionEnvelope(envelope({
    extraField: 'ignored',
  }));

  assert.deepEqual(Object.keys(result), stableKeys());
});

test('missing optional fields normalize to safe defaults', () => {
  assert.deepEqual(normalizeRepairIntakeDraftCaseSubmissionEnvelope(), {
    ok: false,
    action: ACTION,
    draftId: null,
    organizationId: null,
    submitted: false,
    caseCreationAllowed: false,
    candidateReady: false,
    reasonCode: 'SUBMISSION_RESULT_UNSPECIFIED',
    requiredActions: [],
    caseRef: null,
    auditEvent: null,
  });
});

test('valid successful envelope preserves submitted state and sanitized caseRef', () => {
  const result = normalizeRepairIntakeDraftCaseSubmissionEnvelope(envelope());

  assert.equal(result.ok, true);
  assert.equal(result.action, ACTION);
  assert.equal(result.submitted, true);
  assert.equal(result.caseCreationAllowed, true);
  assert.equal(result.candidateReady, true);
  assert.deepEqual(result.caseRef, caseRef());
});

test('blocked envelope preserves blocked state and auditEvent', () => {
  const result = normalizeRepairIntakeDraftCaseSubmissionEnvelope(envelope({
    ok: false,
    submitted: false,
    caseCreationAllowed: false,
    candidateReady: false,
    reasonCode: 'IDEMPOTENCY_CONFLICT',
    requiredActions: ['REVIEW_EXISTING_DRAFT_TO_CASE_SUBMISSION'],
    auditEvent: auditEvent({
      outcome: 'blocked',
      reasonCode: 'IDEMPOTENCY_CONFLICT',
      requiredActions: ['REVIEW_EXISTING_DRAFT_TO_CASE_SUBMISSION'],
    }),
  }));

  assert.equal(result.ok, false);
  assert.equal(result.submitted, false);
  assert.equal(result.auditEvent.outcome, 'blocked');
  assert.equal(result.auditEvent.reasonCode, 'IDEMPOTENCY_CONFLICT');
});

test('failed envelope preserves failed state and auditEvent', () => {
  const result = normalizeRepairIntakeDraftCaseSubmissionEnvelope(envelope({
    ok: false,
    submitted: false,
    reasonCode: 'CASE_CREATOR_FAILED',
    requiredActions: ['retry_or_manual_review'],
    caseRef: null,
    auditEvent: auditEvent({
      outcome: 'failed',
      caseRef: null,
      reasonCode: 'CASE_CREATOR_FAILED',
      requiredActions: ['retry_or_manual_review'],
    }),
  }));

  assert.equal(result.ok, false);
  assert.equal(result.caseRef, null);
  assert.equal(result.auditEvent.outcome, 'failed');
  assert.equal(result.auditEvent.caseRef, null);
});

test('unsafe top-level fields are stripped', () => {
  const result = normalizeRepairIntakeDraftCaseSubmissionEnvelope(envelope({
    caseId: 'unsafe_case_id',
    finalAppointmentId: 'final_should_not_copy',
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
  }));

  assertNoForbiddenFields(result);
});

test('unsafe caseRef fields are stripped', () => {
  const result = normalizeRepairIntakeDraftCaseSubmissionEnvelope(envelope({
    caseRef: caseRef({
      phone: 'phone',
      address: 'address',
      customerPayload: 'customerPayload',
      rawImportedRowPayload: 'rawImportedRowPayload',
      finalAppointmentId: 'final_should_not_copy',
      token: 'token',
      secret: 'secret',
    }),
  }));

  assert.deepEqual(result.caseRef, caseRef());
  assertNoForbiddenFields(result);
});

test('unsafe auditEvent fields are stripped', () => {
  const result = normalizeRepairIntakeDraftCaseSubmissionEnvelope(envelope({
    auditEvent: auditEvent({
      caseId: 'unsafe_case_id',
      finalAppointmentId: 'final_should_not_copy',
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
      caseRef: caseRef({
        phone: 'phone',
        address: 'address',
        finalAppointmentId: 'final_should_not_copy',
      }),
    }),
  }));

  assert.deepEqual(result.auditEvent.caseRef, caseRef());
  assertNoForbiddenFields(result);
});

test('unsafe caseId is not exposed except sanitized caseRef.id', () => {
  const result = normalizeRepairIntakeDraftCaseSubmissionEnvelope(envelope({
    caseId: 'unsafe_case_id',
    caseRef: caseRef({ id: 'case_ref_task945' }),
  }));

  assert.equal(result.caseRef.id, 'case_ref_task945');
  assertNoForbiddenFields(result);
});

test('invalid audit event shape is removed', () => {
  const result = normalizeRepairIntakeDraftCaseSubmissionEnvelope(envelope({
    auditEvent: auditEvent({ eventType: 'wrong_event_type' }),
  }));

  assert.equal(result.auditEvent, null);
});

test('input is not mutated', () => {
  const input = envelope({
    extra: { phone: 'phone' },
  });
  const before = clone(input);

  normalizeRepairIntakeDraftCaseSubmissionEnvelope(input);

  assert.deepEqual(input, before);
});

test('source has no DB repository store provider audit writer default checker dependencies', () => {
  const sourcePath = path.resolve(__dirname, '../../src/repairIntake/repairIntakeDraftCaseSubmissionEnvelopeNormalizer.js');
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
