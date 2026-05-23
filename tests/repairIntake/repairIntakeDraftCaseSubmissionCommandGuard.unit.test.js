'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  validateRepairIntakeDraftCaseSubmissionCommand,
} = require('../../src/repairIntake/repairIntakeDraftCaseSubmissionCommandGuard');

function command(overrides = {}) {
  return {
    draftId: 'draft_task940_001',
    organizationId: 'org_task940',
    actorId: 'actor_task940',
    requestId: 'request_task940',
    idempotencyKey: 'idem_task940',
    approvalContext: {
      accepted: true,
      approvalId: 'approval_task940',
      acceptedByActorId: 'actor_task940',
    },
    permissionContext: {
      canCreateCaseFromRepairIntakeDraft: true,
      permissionSource: 'injected_test_context',
    },
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

test('valid command passes and returns sanitized command', () => {
  const result = validateRepairIntakeDraftCaseSubmissionCommand(command());

  assert.deepEqual(result, {
    ok: true,
    reasonCode: 'SUBMISSION_COMMAND_ACCEPTED',
    requiredActions: [],
    sanitizedCommand: {
      draftId: 'draft_task940_001',
      organizationId: 'org_task940',
      actorId: 'actor_task940',
      requestId: 'request_task940',
      idempotencyKey: 'idem_task940',
      approvalContext: {
        accepted: true,
        approvalId: 'approval_task940',
        acceptedByActorId: 'actor_task940',
      },
      permissionContext: {
        canCreateCaseFromRepairIntakeDraft: true,
        permissionSource: 'injected_test_context',
      },
    },
  });
});

test('missing draftId blocks', () => {
  assert.equal(validateRepairIntakeDraftCaseSubmissionCommand(command({ draftId: '' })).reasonCode, 'SUBMISSION_COMMAND_DRAFT_ID_MISSING');
});

test('missing organizationId blocks', () => {
  assert.equal(validateRepairIntakeDraftCaseSubmissionCommand(command({ organizationId: '' })).reasonCode, 'SUBMISSION_COMMAND_ORGANIZATION_MISSING');
});

test('missing actorId blocks', () => {
  assert.equal(validateRepairIntakeDraftCaseSubmissionCommand(command({ actorId: '' })).reasonCode, 'SUBMISSION_COMMAND_ACTOR_MISSING');
});

test('missing idempotencyKey blocks', () => {
  assert.equal(validateRepairIntakeDraftCaseSubmissionCommand(command({ idempotencyKey: '' })).reasonCode, 'SUBMISSION_COMMAND_IDEMPOTENCY_KEY_MISSING');
});

test('missing approval marker blocks', () => {
  assert.equal(validateRepairIntakeDraftCaseSubmissionCommand(command({
    approvalContext: { accepted: false },
    humanApproved: false,
    platformAccepted: false,
  })).reasonCode, 'SUBMISSION_COMMAND_APPROVAL_MISSING');
});

test('missing permission marker blocks', () => {
  assert.equal(validateRepairIntakeDraftCaseSubmissionCommand(command({
    permissionContext: { canCreateCaseFromRepairIntakeDraft: false },
  })).reasonCode, 'SUBMISSION_COMMAND_PERMISSION_MISSING');
});

test('unsafe raw fields are stripped and never returned', () => {
  const result = validateRepairIntakeDraftCaseSubmissionCommand(command({
    phone: 'phone',
    address: 'address',
    customerPayload: 'customerPayload',
    rawPayload: 'rawPayload',
    providerPayload: 'providerPayload',
    token: 'token',
    secret: 'secret',
    caseId: 'case_should_not_copy',
    finalAppointmentId: 'final_should_not_copy',
  }));

  assert.equal(result.ok, true);
  assertNoForbiddenFields(result);
});

test('SQL stack provider token secret fields are never returned when blocked', () => {
  const result = validateRepairIntakeDraftCaseSubmissionCommand(command({
    actorId: '',
    sql: 'select *',
    stack: 'stack trace',
    providerPayload: 'providerPayload',
    token: 'token',
    secret: 'secret',
  }));

  assert.equal(result.ok, false);
  assertNoForbiddenFields(result);
});

test('input is not mutated', () => {
  const input = command();
  const before = clone(input);

  validateRepairIntakeDraftCaseSubmissionCommand(input);

  assert.deepEqual(input, before);
});
