const assert = require('node:assert/strict');
const test = require('node:test');

const {
  engineerMobileWorkbenchRepositorySyntheticFixture,
  repositorySyntheticFixtureForbiddenKeys,
  repositorySyntheticFixtureInvariantNotes
} = require('../../fixtures/engineerMobileWorkbench/repositorySynthetic.fixture');

const fixture = engineerMobileWorkbenchRepositorySyntheticFixture;
const submissions = fixture.completionSubmissions;

const findById = (items, id) => items.find((item) => item.id === id);
const submissionById = (id) => findById(submissions, id);
const submissionByScenario = (scenario) =>
  submissions.find((submission) => submission.scenario === scenario);

const notesText = () => repositorySyntheticFixtureInvariantNotes.join(' ');

test('completion submission fixture covers idempotency source-data scenarios', () => {
  const requiredScenarios = [
    'valid_minimal_source_data',
    'valid_photo_metadata_refs',
    'valid_signature_exception_reason',
    'submission_needing_review',
    'rejected_source_data_proposal',
    'superseded_source_data_proposal',
    'duplicate_client_request_id',
    'weak_network_retry'
  ];

  for (const scenario of requiredScenarios) {
    assert.ok(submissionByScenario(scenario), `${scenario} must exist`);
  }

  assert.equal(submissionByScenario('valid_minimal_source_data').status, 'submitted');
  assert.equal(submissionByScenario('submission_needing_review').status, 'needs_review');
  assert.equal(submissionByScenario('rejected_source_data_proposal').status, 'rejected');
  assert.equal(submissionByScenario('superseded_source_data_proposal').status, 'superseded');
});

test('duplicate clientRequestId scenario keeps explicit original relationship marker', () => {
  const original = submissionById('completion_submission_valid_minimal');
  const duplicate = submissionByScenario('duplicate_client_request_id');

  assert.ok(original);
  assert.ok(duplicate);
  assert.equal(duplicate.clientRequestId, original.clientRequestId);
  assert.equal(duplicate.duplicateOfSubmissionId, original.id);
  assert.equal(duplicate.organizationId, original.organizationId);
  assert.equal(duplicate.caseId, original.caseId);
  assert.equal(duplicate.appointmentId, original.appointmentId);
  assert.equal(duplicate.engineerProfileId, original.engineerProfileId);
  assert.equal(duplicate.status, 'submitted');
});

test('weak network retry and superseded scenarios preserve safe retry and traceability markers', () => {
  const retry = submissionByScenario('weak_network_retry');
  const superseded = submissionByScenario('superseded_source_data_proposal');
  const original = submissionById('completion_submission_valid_minimal');

  assert.ok(retry);
  assert.equal(retry.idempotencyResult, 'same_safe_result_expected');
  assert.equal(retry.organizationId, original.organizationId);
  assert.equal(retry.caseId, original.caseId);
  assert.equal(retry.appointmentId, original.appointmentId);
  assert.equal(retry.engineerProfileId, original.engineerProfileId);

  assert.ok(superseded);
  assert.equal(superseded.supersededBySubmissionId, original.id);
  assert.equal(superseded.status, 'superseded');
  assert.equal(superseded.organizationId, original.organizationId);
  assert.equal(superseded.caseId, original.caseId);
  assert.equal(superseded.appointmentId, original.appointmentId);
});

test('idempotency scenarios remain scoped and source-data only', () => {
  const idempotencyRelatedScenarios = [
    'valid_minimal_source_data',
    'duplicate_client_request_id',
    'weak_network_retry',
    'superseded_source_data_proposal',
    'rejected_source_data_proposal',
    'submission_needing_review'
  ];

  for (const scenario of idempotencyRelatedScenarios) {
    const submission = submissionByScenario(scenario);

    assert.ok(submission.organizationId, `${scenario} must be organization-scoped`);
    assert.ok(submission.caseId, `${scenario} must be case-scoped`);
    assert.ok(submission.appointmentId, `${scenario} must be appointment-scoped`);
    assert.ok(submission.engineerProfileId, `${scenario} must be engineer-scoped`);
    assert.equal(Object.prototype.hasOwnProperty.call(submission, 'finalAppointmentId'), false);
    assert.equal(Object.prototype.hasOwnProperty.call(submission, 'caseCompleted'), false);
    assert.equal(
      Object.prototype.hasOwnProperty.call(submission, 'formalFieldServiceReportApproved'),
      false
    );
    assert.equal(Object.prototype.hasOwnProperty.call(submission, 'appointmentCompleted'), false);
    assert.equal(Object.prototype.hasOwnProperty.call(submission, 'caseStatus'), false);
  }

  assert.match(notesText(), /source-data-only/);
  assert.match(notesText(), /not-formal-field-service-report/);
});

test('photo metadata and signature exception submissions avoid raw binary persistence', () => {
  const photoSubmission = submissionByScenario('valid_photo_metadata_refs');
  const signatureException = submissionByScenario('valid_signature_exception_reason');
  const photoRef = findById(fixture.objectRefs, 'object_ref_completion_photo_meta');

  assert.ok(photoSubmission);
  assert.deepEqual(photoSubmission.objectRefIds, ['object_ref_completion_photo_meta']);
  assert.ok(photoRef);
  assert.equal(photoRef.containsBinary, false);
  assert.match(photoRef.objectType, /metadata/);

  assert.ok(signatureException);
  assert.equal(signatureException.status, 'needs_review');
  assert.equal(signatureException.signatureExceptionReason, 'synthetic_customer_unavailable');
  assert.equal(Object.prototype.hasOwnProperty.call(signatureException, 'rawSignatureBinary'), false);
});

test('idempotency fixture preserves forbidden bypass contract and side-effect boundaries', () => {
  const forbiddenKeys = new Set(repositorySyntheticFixtureForbiddenKeys);
  const requiredForbiddenKeys = [
    'finalAppointmentId',
    'caseCompleted',
    'formalFieldServiceReportApproved',
    'rawFileBinary',
    'rawPhotoBinary',
    'rawSignatureBinary',
    'providerPayload',
    'aiRawPayload',
    'billingInternalData',
    'settlementInternalData'
  ];

  for (const key of requiredForbiddenKeys) {
    assert.equal(forbiddenKeys.has(key), true, `${key} must remain forbidden`);
  }

  assert.match(notesText(), /not-case-completed/);
  assert.match(notesText(), /multiple-submissions-do-not-create-multiple-formal-reports/);
  assert.match(notesText(), /final-appointment-id-is-system-owned/);
  assert.match(notesText(), /no-survey-provider-billing-settlement-ai-approval-trigger/);

  for (const submission of submissions) {
    assert.equal(Object.prototype.hasOwnProperty.call(submission, 'surveyTriggered'), false);
    assert.equal(Object.prototype.hasOwnProperty.call(submission, 'providerSent'), false);
    assert.equal(Object.prototype.hasOwnProperty.call(submission, 'billingTriggered'), false);
    assert.equal(Object.prototype.hasOwnProperty.call(submission, 'settlementTriggered'), false);
    assert.equal(Object.prototype.hasOwnProperty.call(submission, 'aiApproved'), false);
  }
});

test('idempotency fixture has no obvious secret or real personal data values', () => {
  const serialized = JSON.stringify({
    engineerMobileWorkbenchRepositorySyntheticFixture,
    repositorySyntheticFixtureForbiddenKeys,
    repositorySyntheticFixtureInvariantNotes
  });

  const forbiddenValuePatterns = [
    /DATABASE_URL/i,
    /access_token/i,
    /channel_secret/i,
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
    /09\d{8}/,
    /U[a-f0-9]{32}/i,
    /C[a-f0-9]{32}/i,
    /sk-[A-Za-z0-9_-]{20,}/,
    /ghp_[A-Za-z0-9_]{20,}/,
    /xox[baprs]-[A-Za-z0-9-]{20,}/,
    /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/
  ];

  for (const pattern of forbiddenValuePatterns) {
    assert.equal(pattern.test(serialized), false, `${pattern} must not match fixture`);
  }

  assert.equal(serialized.includes('line_user_id'), false);
  assert.match(notesText(), /line-identity-is-not-global-identity/);
});
