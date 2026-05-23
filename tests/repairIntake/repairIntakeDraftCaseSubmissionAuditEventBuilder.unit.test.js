'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  buildRepairIntakeDraftCaseSubmissionAuditEvent,
} = require('../../src/repairIntake/repairIntakeDraftCaseSubmissionAuditEventBuilder');

function sanitizedCommand(overrides = {}) {
  return {
    draftId: 'draft_task942_001',
    organizationId: 'org_task942',
    actorId: 'actor_task942',
    requestId: 'request_task942',
    idempotencyKey: 'idem_task942',
    ...overrides,
  };
}

function caseRef(overrides = {}) {
  return {
    id: 'case_ref_task942',
    organizationId: 'org_task942',
    sourceDraftId: 'draft_task942_001',
    status: 'created',
    ...overrides,
  };
}

function submissionResult(overrides = {}) {
  return {
    ok: true,
    reasonCode: 'CASE_REF_NORMALIZED',
    requiredActions: [],
    caseRef: caseRef(),
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
    'rawCustomerPayload',
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

test('submitted outcome builds sanitized audit event with caseRef', () => {
  const result = buildRepairIntakeDraftCaseSubmissionAuditEvent({
    sanitizedCommand: sanitizedCommand(),
    submissionResult: submissionResult(),
    outcome: 'submitted',
  });

  assert.deepEqual(result, {
    ok: true,
    reasonCode: 'AUDIT_EVENT_CANDIDATE_BUILT',
    requiredActions: [],
    auditEvent: {
      eventType: 'repair_intake_draft_to_case_submission',
      outcome: 'submitted',
      draftId: 'draft_task942_001',
      organizationId: 'org_task942',
      actorId: 'actor_task942',
      requestId: 'request_task942',
      idempotencyKey: 'idem_task942',
      caseRef: caseRef(),
      reasonCode: 'CASE_REF_NORMALIZED',
      requiredActions: [],
    },
  });
});

test('blocked outcome builds sanitized audit event without caseRef', () => {
  const result = buildRepairIntakeDraftCaseSubmissionAuditEvent({
    sanitizedCommand: sanitizedCommand(),
    planResult: {
      reasonCode: 'duplicate_unresolved',
      requiredActions: ['resolve_duplicate_review'],
    },
    submissionResult: {
      ok: false,
      reasonCode: 'CREATOR_INPUT_PLAN_NOT_ALLOWED',
      requiredActions: ['resolve_plan_result'],
    },
    outcome: 'blocked',
  });

  assert.equal(result.ok, true);
  assert.equal(result.auditEvent.outcome, 'blocked');
  assert.equal(result.auditEvent.caseRef, null);
  assert.equal(result.auditEvent.reasonCode, 'CREATOR_INPUT_PLAN_NOT_ALLOWED');
  assert.deepEqual(result.auditEvent.requiredActions, ['resolve_plan_result']);
});

test('failed outcome builds sanitized audit event without raw error leakage', () => {
  const result = buildRepairIntakeDraftCaseSubmissionAuditEvent({
    sanitizedCommand: sanitizedCommand(),
    submissionResult: {
      ok: false,
      reasonCode: 'CASE_CREATOR_FAILED',
      requiredActions: ['manual_review'],
      error: {
        message: 'select *',
        stack: 'stack trace',
      },
      providerPayload: 'providerPayload',
      token: 'token',
      secret: 'secret',
    },
    outcome: 'failed',
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.auditEvent, {
    eventType: 'repair_intake_draft_to_case_submission',
    outcome: 'failed',
    draftId: 'draft_task942_001',
    organizationId: 'org_task942',
    actorId: 'actor_task942',
    requestId: 'request_task942',
    idempotencyKey: 'idem_task942',
    caseRef: null,
    reasonCode: 'CASE_CREATOR_FAILED',
    requiredActions: ['manual_review'],
  });
  assertNoForbiddenFields(result);
});

test('missing sanitized command blocks safely', () => {
  assert.deepEqual(buildRepairIntakeDraftCaseSubmissionAuditEvent({
    outcome: 'submitted',
    submissionResult: submissionResult(),
  }), {
    ok: false,
    reasonCode: 'AUDIT_EVENT_COMMAND_MISSING',
    requiredActions: ['provide_sanitized_command'],
    auditEvent: null,
  });
});

test('missing organizationId blocks safely', () => {
  assert.equal(buildRepairIntakeDraftCaseSubmissionAuditEvent({
    sanitizedCommand: sanitizedCommand({ organizationId: '' }),
    outcome: 'submitted',
    submissionResult: submissionResult(),
  }).reasonCode, 'AUDIT_EVENT_ORGANIZATION_MISSING');
});

test('missing actorId blocks safely', () => {
  assert.equal(buildRepairIntakeDraftCaseSubmissionAuditEvent({
    sanitizedCommand: sanitizedCommand({ actorId: '' }),
    outcome: 'submitted',
    submissionResult: submissionResult(),
  }).reasonCode, 'AUDIT_EVENT_ACTOR_MISSING');
});

test('caseRef organization mismatch blocks safely', () => {
  assert.deepEqual(buildRepairIntakeDraftCaseSubmissionAuditEvent({
    sanitizedCommand: sanitizedCommand(),
    submissionResult: submissionResult({
      caseRef: caseRef({ organizationId: 'org_other' }),
    }),
    outcome: 'submitted',
  }), {
    ok: false,
    reasonCode: 'AUDIT_EVENT_CASE_REF_ORGANIZATION_MISMATCH',
    requiredActions: ['manual_review'],
    auditEvent: null,
  });
});

test('caseRef sourceDraftId mismatch blocks safely', () => {
  assert.deepEqual(buildRepairIntakeDraftCaseSubmissionAuditEvent({
    sanitizedCommand: sanitizedCommand(),
    submissionResult: submissionResult({
      caseRef: caseRef({ sourceDraftId: 'draft_other' }),
    }),
    outcome: 'submitted',
  }), {
    ok: false,
    reasonCode: 'AUDIT_EVENT_CASE_REF_SOURCE_DRAFT_MISMATCH',
    requiredActions: ['manual_review'],
    auditEvent: null,
  });
});

test('submitted outcome without caseRef blocks and does not generate Case ID', () => {
  const result = buildRepairIntakeDraftCaseSubmissionAuditEvent({
    sanitizedCommand: sanitizedCommand(),
    submissionResult: { ok: true, reasonCode: 'CASE_REF_NORMALIZED', requiredActions: [] },
    outcome: 'submitted',
  });

  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'AUDIT_EVENT_CASE_REF_MISSING');
  assert.equal(result.auditEvent, null);
  assertNoForbiddenFields(result);
});

test('unsafe fields are stripped from all inputs', () => {
  const result = buildRepairIntakeDraftCaseSubmissionAuditEvent({
    sanitizedCommand: sanitizedCommand({
      phone: 'phone',
      address: 'address',
      customerPayload: 'customerPayload',
      rawCustomerPayload: 'rawCustomerPayload',
      rawImportedRowPayload: 'rawImportedRowPayload',
      rawPayload: 'rawPayload',
      caseId: 'case_should_not_copy',
      finalAppointmentId: 'final_should_not_copy',
    }),
    planResult: {
      sql: 'select *',
      providerPayload: 'providerPayload',
    },
    creatorInput: {
      phone: 'phone',
      fullAddress: 'address',
      customerPayload: 'customerPayload',
    },
    submissionResult: submissionResult({
      caseRef: caseRef({
        phone: 'phone',
        address: 'address',
        customerPayload: 'customerPayload',
        rawImportedRowPayload: 'rawImportedRowPayload',
        finalAppointmentId: 'final_should_not_copy',
      }),
    }),
    outcome: 'submitted',
  });

  assert.equal(result.ok, true);
  assertNoForbiddenFields(result);
});

test('raw phone address and customer payload are never returned', () => {
  const result = buildRepairIntakeDraftCaseSubmissionAuditEvent({
    sanitizedCommand: sanitizedCommand({ phone: 'phone', address: 'address' }),
    creatorInput: { customerPayload: 'customerPayload' },
    submissionResult: submissionResult(),
    outcome: 'submitted',
  });

  assertNoForbiddenFields(result);
});

test('SQL stack provider token secret and LINE token fields are never returned', () => {
  const result = buildRepairIntakeDraftCaseSubmissionAuditEvent({
    sanitizedCommand: sanitizedCommand({
      sql: 'select *',
      stack: 'stack trace',
      providerPayload: 'providerPayload',
      token: 'token',
      secret: 'secret',
      lineAccessToken: 'lineAccessToken',
    }),
    planResult: {
      stack: 'stack trace',
    },
    submissionResult: submissionResult({
      providerPayload: 'providerPayload',
      token: 'token',
      secret: 'secret',
      lineAccessToken: 'LINE access token',
    }),
    outcome: 'submitted',
  });

  assertNoForbiddenFields(result);
});

test('finalAppointmentId is never returned', () => {
  const result = buildRepairIntakeDraftCaseSubmissionAuditEvent({
    sanitizedCommand: sanitizedCommand({ finalAppointmentId: 'final_should_not_copy' }),
    submissionResult: submissionResult({
      caseRef: caseRef({ finalAppointmentId: 'final_should_not_copy' }),
    }),
    outcome: 'submitted',
  });

  assertNoForbiddenFields(result);
});

test('input is not mutated', () => {
  const input = {
    sanitizedCommand: sanitizedCommand(),
    planResult: { reasonCode: 'candidate_ready', requiredActions: [] },
    creatorInput: { ignoredUnsafePayload: { phone: 'phone' } },
    submissionResult: submissionResult(),
    outcome: 'submitted',
  };
  const before = clone(input);

  buildRepairIntakeDraftCaseSubmissionAuditEvent(input);

  assert.deepEqual(input, before);
});

test('source has no DB repository provider or audit writer dependencies', () => {
  const sourcePath = path.resolve(__dirname, '../../src/repairIntake/repairIntakeDraftCaseSubmissionAuditEventBuilder.js');
  const source = fs.readFileSync(sourcePath, 'utf8');

  assert.equal(source.includes('require('), false);
  assert.equal(/db|database|sql|query|repository|writer|provider/i.test(source), false);
});
