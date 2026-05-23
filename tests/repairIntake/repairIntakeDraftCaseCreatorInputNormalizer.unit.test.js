'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  normalizeRepairIntakeDraftCaseCreatorInput,
} = require('../../src/repairIntake/repairIntakeDraftCaseCreatorInputNormalizer');

function sanitizedCommand(overrides = {}) {
  return {
    draftId: 'draft_task941_001',
    organizationId: 'org_task941',
    actorId: 'actor_task941',
    requestId: 'request_task941',
    idempotencyKey: 'idem_task941',
    ...overrides,
  };
}

function caseCandidate(overrides = {}) {
  return {
    sourceDraftId: 'draft_task941_001',
    organizationId: 'org_task941',
    brandId: 'brand_task941',
    serviceProviderId: 'provider_task941',
    intakeSource: 'web',
    serviceType: 'onsite',
    priority: 'normal',
    reporterRef: { refId: 'reporter_ref_task941', type: 'reporter' },
    customerRef: { refId: 'customer_ref_task941', type: 'customer' },
    billingContactRef: { refId: 'billing_ref_task941', type: 'billing_contact' },
    siteRef: { refId: 'site_ref_task941', type: 'service_site' },
    issueSummaryRef: { refId: 'issue_ref_task941', type: 'issue_summary' },
    createdByActorId: 'actor_task941',
    ...overrides,
  };
}

function allowedPlan(overrides = {}) {
  return {
    caseCreationAllowed: true,
    candidateReady: true,
    reasonCode: 'candidate_ready',
    requiredActions: [],
    caseCandidate: caseCandidate(),
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

test('valid command and allowed plan returns sanitized creator input', () => {
  const result = normalizeRepairIntakeDraftCaseCreatorInput({
    sanitizedCommand: sanitizedCommand(),
    planResult: allowedPlan(),
  });

  assert.equal(result.ok, true);
  assert.equal(result.reasonCode, 'CREATOR_INPUT_NORMALIZED');
  assert.deepEqual(result.requiredActions, []);
  assert.deepEqual(result.creatorInput, {
    command: sanitizedCommand(),
    caseCandidate: caseCandidate(),
  });
});

test('blocked plan does not produce creator input', () => {
  const result = normalizeRepairIntakeDraftCaseCreatorInput({
    sanitizedCommand: sanitizedCommand(),
    planResult: allowedPlan({
      caseCreationAllowed: false,
      candidateReady: false,
      reasonCode: 'duplicate_confirmed',
      requiredActions: ['link_or_close_duplicate_draft'],
    }),
  });

  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'duplicate_confirmed');
  assert.deepEqual(result.requiredActions, ['link_or_close_duplicate_draft']);
  assert.equal(result.creatorInput, null);
});

test('needs-review plan does not produce creator input', () => {
  const result = normalizeRepairIntakeDraftCaseCreatorInput({
    sanitizedCommand: sanitizedCommand(),
    planResult: allowedPlan({
      caseCreationAllowed: false,
      candidateReady: false,
      reasonCode: 'duplicate_unresolved',
      requiredActions: ['resolve_duplicate_review'],
    }),
  });

  assert.equal(result.reasonCode, 'duplicate_unresolved');
  assert.equal(result.creatorInput, null);
});

test('missing sanitizedCommand blocks', () => {
  assert.equal(normalizeRepairIntakeDraftCaseCreatorInput({
    planResult: allowedPlan(),
  }).reasonCode, 'CREATOR_INPUT_COMMAND_MISSING');
});

test('missing planResult blocks', () => {
  assert.equal(normalizeRepairIntakeDraftCaseCreatorInput({
    sanitizedCommand: sanitizedCommand(),
  }).reasonCode, 'CREATOR_INPUT_PLAN_MISSING');
});

test('missing candidate blocks', () => {
  assert.equal(normalizeRepairIntakeDraftCaseCreatorInput({
    sanitizedCommand: sanitizedCommand(),
    planResult: allowedPlan({ caseCandidate: null }),
  }).reasonCode, 'CASE_CANDIDATE_NOT_READY');
});

test('organization mismatch blocks', () => {
  assert.equal(normalizeRepairIntakeDraftCaseCreatorInput({
    sanitizedCommand: sanitizedCommand(),
    planResult: allowedPlan({
      caseCandidate: caseCandidate({ organizationId: 'org_other' }),
    }),
  }).reasonCode, 'CREATOR_INPUT_ORGANIZATION_MISMATCH');
});

test('draft source mismatch blocks', () => {
  assert.equal(normalizeRepairIntakeDraftCaseCreatorInput({
    sanitizedCommand: sanitizedCommand(),
    planResult: allowedPlan({
      caseCandidate: caseCandidate({ sourceDraftId: 'draft_other' }),
    }),
  }).reasonCode, 'CREATOR_INPUT_SOURCE_DRAFT_MISMATCH');
});

test('unsafe command candidate and nested ref fields are stripped', () => {
  const result = normalizeRepairIntakeDraftCaseCreatorInput({
    sanitizedCommand: sanitizedCommand({
      phone: 'phone',
      address: 'address',
      customerPayload: 'customerPayload',
      rawPayload: 'rawPayload',
      token: 'token',
      secret: 'secret',
      caseId: 'case_should_not_copy',
      finalAppointmentId: 'final_should_not_copy',
    }),
    planResult: allowedPlan({
      caseCandidate: caseCandidate({
        phone: 'phone',
        address: 'address',
        providerPayload: 'providerPayload',
        token: 'token',
        secret: 'secret',
        reporterRef: {
          refId: 'reporter_ref_task941',
          type: 'reporter',
          phone: 'phone',
          address: 'address',
        },
      }),
    }),
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.creatorInput.caseCandidate.reporterRef, {
    refId: 'reporter_ref_task941',
    type: 'reporter',
  });
  assertNoForbiddenFields(result);
});

test('SQL stack provider token secret fields are never returned', () => {
  const result = normalizeRepairIntakeDraftCaseCreatorInput({
    sanitizedCommand: sanitizedCommand({
      sql: 'select *',
      stack: 'stack trace',
      providerPayload: 'providerPayload',
      token: 'token',
      secret: 'secret',
    }),
    planResult: allowedPlan(),
  });

  assert.equal(result.ok, true);
  assertNoForbiddenFields(result);
});

test('input is not mutated', () => {
  const input = {
    sanitizedCommand: sanitizedCommand(),
    planResult: allowedPlan(),
  };
  const before = clone(input);

  normalizeRepairIntakeDraftCaseCreatorInput(input);

  assert.deepEqual(input, before);
});
