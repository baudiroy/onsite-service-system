const assert = require('node:assert/strict');
const test = require('node:test');

const {
  engineerMobileWorkbenchRepositorySyntheticFixture,
  repositorySyntheticFixtureForbiddenKeys,
  repositorySyntheticFixtureInvariantNotes
} = require('../../fixtures/engineerMobileWorkbench/repositorySynthetic.fixture');

const REQUIRED_GROUPS = [
  'organizations',
  'platformUsers',
  'engineerProfiles',
  'userOrganizations',
  'cases',
  'appointments',
  'dispatchAssignments',
  'fieldServiceReports',
  'completionSubmissions',
  'objectRefs',
  'forbiddenPayloadExamples',
  'safeDenyScenarios'
];

const findById = (items, id) => items.find((item) => item.id === id);

const assertArrayGroup = (fixture, key) => {
  assert.equal(Array.isArray(fixture[key]), true, `${key} must be an array`);
  assert.ok(fixture[key].length > 0, `${key} must not be empty`);
};

test('repository synthetic fixture exposes required groups', () => {
  for (const group of REQUIRED_GROUPS) {
    assertArrayGroup(engineerMobileWorkbenchRepositorySyntheticFixture, group);
  }
});

test('repository synthetic fixture defines required organizations and isolation notes', () => {
  const organizations = engineerMobileWorkbenchRepositorySyntheticFixture.organizations;
  const orgAlpha = findById(organizations, 'org_alpha_service');
  const orgBeta = findById(organizations, 'org_beta_service');
  const orgSuspended = findById(organizations, 'org_suspended');
  const orgDeleted = findById(organizations, 'org_deleted');

  assert.ok(orgAlpha);
  assert.ok(orgBeta);
  assert.ok(orgSuspended);
  assert.ok(orgDeleted);
  assert.notEqual(orgAlpha.id, orgBeta.id);
  assert.equal(orgSuspended.status, 'suspended');
  assert.equal(orgDeleted.status, 'deleted');
  assert.match(`${orgAlpha.isolationNote} ${orgBeta.isolationNote}`, /org|organization|isolation/i);
});

test('repository synthetic fixture covers appointment and assignment state scenarios', () => {
  const appointments = engineerMobileWorkbenchRepositorySyntheticFixture.appointments;
  const scenarioChecks = [
    ['appointment_alpha_visible_confirmed', 'confirmed', 'visible_to_assigned_engineer'],
    ['appointment_alpha_already_arrived', 'arrived', 'visible_to_assigned_engineer'],
    ['appointment_alpha_in_progress', 'in_progress', 'visible_to_assigned_engineer'],
    ['appointment_alpha_waiting_parts', 'waiting_parts', 'visible_summary'],
    ['appointment_alpha_quote_needed', 'quote_needed', 'visible_summary'],
    ['appointment_alpha_customer_not_available', 'customer_not_available', 'visible_summary'],
    ['appointment_alpha_cancelled', 'cancelled', 'not_actionable'],
    ['appointment_alpha_reassigned', 'reassigned', 'not_visible_to_old_engineer'],
    ['appointment_alpha_hidden_unconfirmed', 'hidden_unconfirmed', 'hidden'],
    ['appointment_alpha_assigned_to_other_engineer', 'confirmed', 'not_visible_to_unassigned_engineer'],
    ['appointment_beta_other_org', 'confirmed', 'not_visible_to_org_alpha_engineer'],
    ['appointment_alpha_case_with_formal_report', 'completion_submitted_source', 'visible_summary'],
    ['appointment_alpha_multi_visit_first', 'waiting_parts', 'visible_summary'],
    ['appointment_alpha_multi_visit_second', 'confirmed', 'visible_to_assigned_engineer']
  ];

  for (const [id, operationState, expectedVisibility] of scenarioChecks) {
    const appointment = findById(appointments, id);

    assert.ok(appointment, `${id} must exist`);
    assert.equal(appointment.operationState, operationState);
    assert.equal(appointment.expectedVisibility, expectedVisibility);
    assert.ok(appointment.dispatchAssignmentId);
    assert.ok(appointment.eligibilityImplication);
  }

  const multiVisitAppointments = appointments.filter(
    (appointment) => appointment.caseId === 'case_alpha_multi_visit'
  );

  assert.equal(multiVisitAppointments.length, 2);
  assert.deepEqual(
    multiVisitAppointments.map((appointment) => appointment.visitSequence).sort(),
    [1, 2]
  );
});

test('repository synthetic fixture covers completion submission and forbidden payload scenarios', () => {
  const submissions = engineerMobileWorkbenchRepositorySyntheticFixture.completionSubmissions;
  const submissionScenarios = [
    'valid_minimal_source_data',
    'valid_photo_metadata_refs',
    'valid_signature_exception_reason',
    'submission_needing_review',
    'rejected_source_data_proposal',
    'superseded_source_data_proposal',
    'duplicate_client_request_id',
    'weak_network_retry'
  ];

  for (const scenario of submissionScenarios) {
    assert.ok(
      submissions.some((submission) => submission.scenario === scenario),
      `${scenario} must exist`
    );
  }

  assert.ok(
    submissions.some((submission) => submission.status === 'needs_review'),
    'needs_review status must exist'
  );
  assert.ok(
    submissions.some((submission) => submission.status === 'rejected'),
    'rejected status must exist'
  );
  assert.ok(
    submissions.some((submission) => submission.status === 'superseded'),
    'superseded status must exist'
  );

  const forbiddenExamples = engineerMobileWorkbenchRepositorySyntheticFixture.forbiddenPayloadExamples;
  const forbiddenExampleIds = [
    'forbidden_final_appointment_id',
    'forbidden_case_completed',
    'forbidden_formal_fsr_approval',
    'forbidden_raw_binary',
    'forbidden_provider_payload',
    'forbidden_ai_raw_payload'
  ];

  for (const id of forbiddenExampleIds) {
    const example = findById(forbiddenExamples, id);

    assert.ok(example, `${id} must exist`);
    assert.equal(typeof example.expectedRejection, 'string');
    assert.ok(example.expectedRejection.length > 0);
  }
});

test('repository synthetic fixture forbidden examples remain harmless markers only', () => {
  const allowedForbiddenExampleKeys = new Set([
    'finalAppointmentId',
    'caseCompleted',
    'formalFieldServiceReportApproved',
    'rawFileBinary',
    'providerPayload',
    'aiRawPayload'
  ]);

  for (const example of engineerMobileWorkbenchRepositorySyntheticFixture.forbiddenPayloadExamples) {
    const payloadKeys = Object.keys(example.payloadShape);

    assert.equal(payloadKeys.length, 1);
    assert.equal(allowedForbiddenExampleKeys.has(payloadKeys[0]), true);

    const value = example.payloadShape[payloadKeys[0]];
    if (typeof value === 'string') {
      assert.match(value, /^(client-selected-final-appointment|forbidden-.+-marker)$/);
    } else {
      assert.equal(typeof value, 'boolean');
    }
  }

  assert.equal(repositorySyntheticFixtureForbiddenKeys.includes('finalAppointmentId'), true);
  assert.equal(repositorySyntheticFixtureForbiddenKeys.includes('providerPayload'), true);
  assert.equal(repositorySyntheticFixtureForbiddenKeys.includes('aiRawPayload'), true);
});

test('repository synthetic fixture does not contain obvious real secrets or personal data', () => {
  const serialized = JSON.stringify({
    engineerMobileWorkbenchRepositorySyntheticFixture,
    repositorySyntheticFixtureForbiddenKeys,
    repositorySyntheticFixtureInvariantNotes
  });

  const forbiddenPatterns = [
    /DATABASE_URL/i,
    /access_token/i,
    /channel_secret/i,
    /line_user_id/i,
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
    /09\d{8}/
  ];

  for (const pattern of forbiddenPatterns) {
    assert.equal(pattern.test(serialized), false, `${pattern} must not match fixture`);
  }

  assert.equal(serialized.includes('rawBinary'), false);
  assert.equal(serialized.includes('formalFsrApprovedByEngineer'), false);
});

test('repository synthetic fixture invariant notes preserve guardrail language', () => {
  const notes = repositorySyntheticFixtureInvariantNotes.join(' ');

  assert.match(notes, /source-data-only/);
  assert.match(notes, /not-formal-field-service-report/);
  assert.match(notes, /not-case-completed/);
  assert.match(notes, /multiple-submissions-do-not-create-multiple-formal-reports/);
  assert.match(notes, /no-survey-provider-billing-settlement-ai-approval-trigger/);
  assert.match(notes, /final-appointment-id-is-system-owned/);
  assert.match(notes, /line-identity-is-not-global-identity/);
});

test('repository synthetic fixture safe-deny scenarios cover isolation and no-mutation cases', () => {
  const safeDenyScenarioIds = engineerMobileWorkbenchRepositorySyntheticFixture.safeDenyScenarios.map(
    (scenario) => scenario.id
  );

  assert.ok(safeDenyScenarioIds.includes('safe_deny_cross_org_appointment'));
  assert.ok(safeDenyScenarioIds.includes('safe_deny_assignment_owned_by_other_engineer'));
  assert.ok(safeDenyScenarioIds.includes('operation_denied_cancelled_appointment'));
  assert.ok(safeDenyScenarioIds.includes('safe_deny_hidden_unconfirmed_appointment'));
  assert.ok(safeDenyScenarioIds.includes('operation_denied_existing_formal_report'));
});
