'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  ACTION,
  evaluateRepairIntakeDuplicateCandidateGuard,
} = require('../../src/repairIntake/repairIntakeDuplicateCandidateGuard');

function draft(overrides = {}) {
  return {
    draftId: 'draft_task1890',
    organizationId: 'org_task1890',
    duplicateStatus: 'cleared',
    ...overrides,
  };
}

function assertNoUnsafeFields(value) {
  const serialized = JSON.stringify(value);

  for (const marker of [
    'caseId',
    'case_id',
    'caseNo',
    'case_no',
    'confirmedDuplicate',
    'confirmed_duplicate',
    'phone',
    'address',
    'rawRows',
    'rawPayload',
    'providerPayload',
    'token',
    'secret',
    'stack',
    'sql',
  ]) {
    assert.equal(serialized.includes(marker), false, `leaked ${marker}`);
  }
}

test('clear no-duplicate path returns a stable clear envelope', () => {
  const result = evaluateRepairIntakeDuplicateCandidateGuard({
    draft: draft({ duplicateStatus: 'cleared' }),
  });

  assert.deepEqual(result, {
    ok: true,
    action: ACTION,
    status: 'clear',
    reasonCode: 'duplicate_clear',
    requiredActions: [],
    duplicateCandidate: null,
  });
});

test('duplicate candidate remains advisory and requires review', () => {
  const result = evaluateRepairIntakeDuplicateCandidateGuard({
    draft: draft({
      duplicateStatus: 'possible_duplicate',
      duplicateCandidate: {
        candidateRef: 'draft_candidate_task1890',
        matchScore: 0.82,
        reasonCode: 'same_reporter_and_device',
        source: 'repair_intake_draft',
        phone: 'phone',
        address: 'address',
        caseId: 'case_should_not_copy',
      },
    }),
  });

  assert.equal(result.ok, false);
  assert.equal(result.status, 'review_required');
  assert.equal(result.reasonCode, 'duplicate_unresolved');
  assert.deepEqual(result.requiredActions, ['resolve_duplicate_review']);
  assert.deepEqual(result.duplicateCandidate, {
    candidateRef: 'draft_candidate_task1890',
    matchScore: 0.82,
    reasonCode: 'same_reporter_and_device',
    source: 'repair_intake_draft',
  });
  assertNoUnsafeFields(result);
});

test('confirmed duplicate marker on candidate is not automatically inferred as confirmed duplicate', () => {
  const result = evaluateRepairIntakeDuplicateCandidateGuard({
    draft: draft({
      duplicateStatus: 'possible_duplicate',
      duplicateCandidate: {
        candidateRef: 'draft_candidate_task1890',
        confirmedDuplicate: true,
        caseId: 'case_should_not_copy',
      },
    }),
  });

  assert.equal(result.status, 'review_required');
  assert.equal(result.reasonCode, 'duplicate_unresolved');
  assert.deepEqual(result.requiredActions, ['resolve_duplicate_review']);
  assert.deepEqual(result.duplicateCandidate, {
    candidateRef: 'draft_candidate_task1890',
  });
  assertNoUnsafeFields(result);
});

test('explicit confirmed duplicate status blocks without creating or linking Case', () => {
  const result = evaluateRepairIntakeDuplicateCandidateGuard({
    draft: draft({
      duplicateStatus: 'confirmed_duplicate',
      duplicateCandidate: {
        candidateRef: 'draft_candidate_task1890',
        caseId: 'case_should_not_copy',
      },
    }),
  });

  assert.equal(result.ok, false);
  assert.equal(result.status, 'blocked');
  assert.equal(result.reasonCode, 'duplicate_confirmed');
  assert.deepEqual(result.requiredActions, ['link_or_close_duplicate_draft']);
  assert.deepEqual(result.duplicateCandidate, {
    candidateRef: 'draft_candidate_task1890',
  });
  assertNoUnsafeFields(result);
});

test('missing duplicate signal fails closed as review-required', () => {
  const result = evaluateRepairIntakeDuplicateCandidateGuard({
    draft: draft({ duplicateStatus: undefined }),
  });

  assert.equal(result.ok, false);
  assert.equal(result.status, 'review_required');
  assert.equal(result.reasonCode, 'duplicate_signal_missing');
  assert.deepEqual(result.requiredActions, ['review_duplicate_candidate_status']);
  assert.equal(result.duplicateCandidate, null);
});

test('candidate with clear status is treated as ambiguous review-required signal', () => {
  const result = evaluateRepairIntakeDuplicateCandidateGuard({
    draft: draft({
      duplicateStatus: 'cleared',
      duplicateCandidate: {
        candidateRef: 'draft_candidate_task1890',
      },
    }),
  });

  assert.equal(result.status, 'review_required');
  assert.equal(result.reasonCode, 'duplicate_candidate_review_required');
  assert.deepEqual(result.requiredActions, ['review_duplicate_candidate']);
  assert.deepEqual(result.duplicateCandidate, {
    candidateRef: 'draft_candidate_task1890',
  });
});

test('organization mismatch blocks safely', () => {
  const result = evaluateRepairIntakeDuplicateCandidateGuard({
    organizationId: 'org_task1890',
    draft: draft({ organizationId: 'other_org_task1890' }),
  });

  assert.equal(result.status, 'blocked');
  assert.equal(result.reasonCode, 'organization_scope_mismatch');
  assert.deepEqual(result.requiredActions, ['retry_with_matching_organization_scope']);
  assert.equal(result.duplicateCandidate, null);
});
