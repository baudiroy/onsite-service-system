const assert = require('node:assert/strict');
const test = require('node:test');

const {
  engineerMobileWorkbenchRepositorySyntheticFixture,
  repositorySyntheticFixtureForbiddenKeys,
  repositorySyntheticFixtureInvariantNotes
} = require('../../fixtures/engineerMobileWorkbench/repositorySynthetic.fixture');

const findById = (items, id) => items.find((item) => item.id === id);

const safeDenyScenarioById = (id) =>
  findById(engineerMobileWorkbenchRepositorySyntheticFixture.safeDenyScenarios, id);

const appointmentById = (id) =>
  findById(engineerMobileWorkbenchRepositorySyntheticFixture.appointments, id);

const assignmentById = (id) =>
  findById(engineerMobileWorkbenchRepositorySyntheticFixture.dispatchAssignments, id);

const assertScenarioHasSafeDenialContract = (scenario, expectedStylePattern) => {
  assert.ok(scenario, 'safe-deny scenario must exist');
  assert.equal(typeof scenario.id, 'string');
  assert.match(scenario.expectedStyle, expectedStylePattern);
  assert.match(scenario.assertionFocus, /no-|denied|safe|leak|mutation|formal-report/i);
};

test('static contract covers required safe-deny and operation-denied scenarios', () => {
  const requiredScenarios = [
    ['safe_deny_cross_org_appointment', /safe-deny/],
    ['safe_deny_assignment_owned_by_other_engineer', /safe-deny/],
    ['safe_deny_hidden_unconfirmed_appointment', /safe-deny/],
    ['operation_denied_cancelled_appointment', /operation-denied/],
    ['operation_denied_existing_formal_report', /operation-denied/]
  ];

  for (const [id, expectedStylePattern] of requiredScenarios) {
    assertScenarioHasSafeDenialContract(safeDenyScenarioById(id), expectedStylePattern);
  }

  const scenarioText = JSON.stringify(
    engineerMobileWorkbenchRepositorySyntheticFixture.safeDenyScenarios
  );

  assert.match(scenarioText, /cross_org|cross-org|org/i);
  assert.match(scenarioText, /other_engineer|engineer-assignment/i);
  assert.match(scenarioText, /hidden_unconfirmed|hidden-appointment/i);
  assert.match(scenarioText, /cancelled|state-mutation/i);
  assert.match(scenarioText, /existing_formal_report|second-formal-report/i);
});

test('static contract keeps cross-organization and engineer assignment boundaries explicit', () => {
  const orgAlpha = findById(
    engineerMobileWorkbenchRepositorySyntheticFixture.organizations,
    'org_alpha_service'
  );
  const orgBeta = findById(
    engineerMobileWorkbenchRepositorySyntheticFixture.organizations,
    'org_beta_service'
  );
  const alphaEngineer = findById(
    engineerMobileWorkbenchRepositorySyntheticFixture.engineerProfiles,
    'engineer_profile_alpha_active'
  );
  const betaEngineer = findById(
    engineerMobileWorkbenchRepositorySyntheticFixture.engineerProfiles,
    'engineer_profile_beta_active'
  );
  const betaAppointment = appointmentById('appointment_beta_other_org');
  const betaAssignment = assignmentById('dispatch_assignment_beta_visible');
  const otherEngineerAppointment = appointmentById('appointment_alpha_assigned_to_other_engineer');
  const otherEngineerAssignment = assignmentById(
    otherEngineerAppointment.dispatchAssignmentId
  );

  assert.ok(orgAlpha);
  assert.ok(orgBeta);
  assert.notEqual(orgAlpha.id, orgBeta.id);
  assert.ok(alphaEngineer);
  assert.ok(betaEngineer);
  assert.notEqual(alphaEngineer.id, betaEngineer.id);
  assert.equal(alphaEngineer.organizationId, orgAlpha.id);
  assert.equal(betaEngineer.organizationId, orgBeta.id);

  assert.ok(betaAppointment);
  assert.ok(betaAssignment);
  assert.equal(betaAppointment.organizationId, orgBeta.id);
  assert.equal(betaAssignment.organizationId, orgBeta.id);
  assert.equal(betaAssignment.engineerProfileId, betaEngineer.id);
  assert.notEqual(betaAppointment.organizationId, alphaEngineer.organizationId);

  assert.ok(otherEngineerAppointment);
  assert.ok(otherEngineerAssignment);
  assert.equal(otherEngineerAppointment.organizationId, orgAlpha.id);
  assert.notEqual(otherEngineerAssignment.engineerProfileId, alphaEngineer.id);

  assert.ok(safeDenyScenarioById('safe_deny_cross_org_appointment'));
  assert.equal(
    repositorySyntheticFixtureForbiddenKeys.includes('organizationId'),
    true,
    'client-selected organizationId must remain forbidden authority'
  );
});

test('static contract treats client-supplied organization and engineer identifiers as forbidden authority', () => {
  const requiredForbiddenKeys = [
    'organizationId',
    'engineerProfileId',
    'finalAppointmentId',
    'caseCompleted',
    'formalFieldServiceReportApproved',
    'rawFileBinary',
    'rawPhotoBinary',
    'rawSignatureBinary',
    'providerPayload',
    'aiRawPayload'
  ];

  for (const key of requiredForbiddenKeys) {
    assert.equal(
      repositorySyntheticFixtureForbiddenKeys.includes(key),
      true,
      `${key} must be listed as forbidden client authority or unsafe payload`
    );
  }

  const examples = engineerMobileWorkbenchRepositorySyntheticFixture.forbiddenPayloadExamples;
  const exampleKeySets = examples.map((example) => Object.keys(example.payloadShape));
  const flattenedExampleKeys = new Set(exampleKeySets.flat());

  assert.equal(flattenedExampleKeys.has('finalAppointmentId'), true);
  assert.equal(flattenedExampleKeys.has('caseCompleted'), true);
  assert.equal(flattenedExampleKeys.has('formalFieldServiceReportApproved'), true);
  assert.equal(flattenedExampleKeys.has('rawFileBinary'), true);
  assert.equal(flattenedExampleKeys.has('providerPayload'), true);
  assert.equal(flattenedExampleKeys.has('aiRawPayload'), true);

  for (const example of examples) {
    assert.equal(Object.keys(example.payloadShape).length, 1);
    assert.match(example.expectedRejection, /server-owned|cannot|not-accepted|metadata/);
  }
});

test('static contract preserves completion submission as source data only', () => {
  const notes = repositorySyntheticFixtureInvariantNotes.join(' ');
  const existingFormalReportAppointment = appointmentById(
    'appointment_alpha_case_with_formal_report'
  );
  const existingFormalReport = findById(
    engineerMobileWorkbenchRepositorySyntheticFixture.fieldServiceReports,
    'field_service_report_alpha_existing_formal'
  );
  const duplicateSubmission = findById(
    engineerMobileWorkbenchRepositorySyntheticFixture.completionSubmissions,
    'completion_submission_duplicate_client_request'
  );
  const weakNetworkRetrySubmission = findById(
    engineerMobileWorkbenchRepositorySyntheticFixture.completionSubmissions,
    'completion_submission_weak_network_retry'
  );

  assert.match(notes, /source-data-only/);
  assert.match(notes, /not-formal-field-service-report/);
  assert.match(notes, /not-case-completed/);
  assert.match(notes, /multiple-submissions-do-not-create-multiple-formal-reports/);
  assert.match(notes, /final-appointment-id-is-system-owned/);
  assert.match(notes, /no-survey-provider-billing-settlement-ai-approval-trigger/);

  assert.ok(existingFormalReportAppointment);
  assert.match(
    existingFormalReportAppointment.eligibilityImplication,
    /source_submission_requires_review_no_second_formal_report/
  );
  assert.ok(existingFormalReport);
  assert.equal(existingFormalReport.invariant, 'one_case_one_formal_report');
  assert.equal(existingFormalReport.serviceStatus, 'completed');

  assert.ok(duplicateSubmission);
  assert.equal(duplicateSubmission.duplicateOfSubmissionId, 'completion_submission_valid_minimal');
  assert.ok(weakNetworkRetrySubmission);
  assert.match(weakNetworkRetrySubmission.idempotencyResult, /same_safe_result_expected/);
});

test('static contract does not rely on global LINE identity or raw sensitive payload values', () => {
  const fixtureBundle = {
    engineerMobileWorkbenchRepositorySyntheticFixture,
    repositorySyntheticFixtureForbiddenKeys,
    repositorySyntheticFixtureInvariantNotes
  };
  const serialized = JSON.stringify(fixtureBundle);

  assert.equal(serialized.includes('line_user_id'), false);
  assert.equal(serialized.includes('LINE_USER_ID'), false);
  assert.equal(serialized.includes('DATABASE_URL'), false);
  assert.equal(serialized.includes('access_token'), false);
  assert.equal(serialized.includes('channel_secret'), false);
  assert.equal(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(serialized), false);
  assert.equal(/09\d{8}/.test(serialized), false);

  const allowedForbiddenMarkers = new Set([
    'forbidden-raw-binary-marker',
    'forbidden-provider-payload-marker',
    'forbidden-ai-raw-payload-marker'
  ]);

  for (const example of engineerMobileWorkbenchRepositorySyntheticFixture.forbiddenPayloadExamples) {
    const [[key, value]] = Object.entries(example.payloadShape);

    if (key === 'rawFileBinary' || key === 'providerPayload' || key === 'aiRawPayload') {
      assert.equal(allowedForbiddenMarkers.has(value), true);
    }
  }

  for (const objectRef of engineerMobileWorkbenchRepositorySyntheticFixture.objectRefs) {
    assert.equal(objectRef.containsBinary, false);
    assert.match(objectRef.storageRef, /^synthetic-object-ref-/);
    assert.match(objectRef.checksumRef, /^synthetic-checksum-/);
  }
});
