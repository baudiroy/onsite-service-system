const assert = require('node:assert/strict');
const test = require('node:test');

const {
  engineerMobileWorkbenchRepositorySyntheticFixture,
  repositorySyntheticFixtureForbiddenKeys,
  repositorySyntheticFixtureInvariantNotes
} = require('../../fixtures/engineerMobileWorkbench/repositorySynthetic.fixture');

const fixture = engineerMobileWorkbenchRepositorySyntheticFixture;
const forbiddenKeys = new Set(repositorySyntheticFixtureForbiddenKeys);

const findById = (items, id) => items.find((item) => item.id === id);
const appointmentById = (id) => findById(fixture.appointments, id);
const assignmentById = (id) => findById(fixture.dispatchAssignments, id);
const organizationById = (id) => findById(fixture.organizations, id);
const userById = (id) => findById(fixture.platformUsers, id);
const engineerProfileById = (id) => findById(fixture.engineerProfiles, id);
const safeDenyById = (id) => findById(fixture.safeDenyScenarios, id);

test('safe-deny matrix covers identity organization assignment and appointment denial sources', () => {
  assert.ok(userById('user_without_engineer_profile'));
  assert.ok(userById('user_inactive_engineer'));
  assert.ok(engineerProfileById('engineer_profile_inactive'));
  assert.equal(organizationById('org_suspended').status, 'suspended');
  assert.equal(organizationById('org_deleted').status, 'deleted');

  const expectedScenarios = [
    'safe_deny_cross_org_appointment',
    'safe_deny_assignment_owned_by_other_engineer',
    'safe_deny_hidden_unconfirmed_appointment',
    'operation_denied_cancelled_appointment',
    'operation_denied_existing_formal_report'
  ];

  for (const id of expectedScenarios) {
    const scenario = safeDenyById(id);

    assert.ok(scenario, `${id} must exist`);
    assert.match(scenario.expectedStyle, /safe-deny|operation-denied/);
    assert.match(scenario.assertionFocus, /no-|denied|safe|leak|mutation|formal-report/);
  }

  assert.match(appointmentById('appointment_alpha_reassigned').eligibilityImplication, /safe_deny/);
  assert.match(appointmentById('appointment_alpha_assigned_to_other_engineer').eligibilityImplication, /safe_deny/);
  assert.match(appointmentById('appointment_beta_other_org').eligibilityImplication, /safe_deny/);
});

test('safe-deny matrix keeps non-enumeration and no-leakage markers explicit', () => {
  const crossOrg = safeDenyById('safe_deny_cross_org_appointment');
  const otherEngineer = safeDenyById('safe_deny_assignment_owned_by_other_engineer');
  const hidden = safeDenyById('safe_deny_hidden_unconfirmed_appointment');
  const cancelled = safeDenyById('operation_denied_cancelled_appointment');
  const existingFormalReport = safeDenyById('operation_denied_existing_formal_report');

  assert.match(crossOrg.assertionFocus, /no-appointment-existence-or-org-leak/);
  assert.match(otherEngineer.assertionFocus, /no-engineer-assignment-ownership-leak/);
  assert.match(hidden.assertionFocus, /no-hidden-appointment-leak/);
  assert.match(cancelled.assertionFocus, /no-state-mutation/);
  assert.match(existingFormalReport.assertionFocus, /no-second-formal-report/);

  const outputForbiddenKeys = [
    'internalNote',
    'auditLog',
    'billingInternalData',
    'settlementInternalData',
    'providerPayload',
    'aiRawPayload',
    'rawFileBinary',
    'rawPhotoBinary',
    'rawSignatureBinary'
  ];

  for (const key of outputForbiddenKeys) {
    assert.equal(forbiddenKeys.has(key), true, `${key} must remain forbidden in safe-deny output`);
  }
});

test('safe-deny matrix distinguishes generic non-enumeration from visible operation-denied states', () => {
  const genericSafeDenyIds = [
    'safe_deny_cross_org_appointment',
    'safe_deny_assignment_owned_by_other_engineer',
    'safe_deny_hidden_unconfirmed_appointment'
  ];
  const operationDeniedIds = [
    'operation_denied_cancelled_appointment',
    'operation_denied_existing_formal_report'
  ];

  for (const id of genericSafeDenyIds) {
    assert.equal(safeDenyById(id).expectedStyle, 'generic-safe-deny');
  }

  for (const id of operationDeniedIds) {
    assert.equal(safeDenyById(id).expectedStyle, 'operation-denied');
  }

  assert.equal(appointmentById('appointment_alpha_hidden_unconfirmed').expectedVisibility, 'hidden');
  assert.equal(
    appointmentById('appointment_alpha_assigned_to_other_engineer').expectedVisibility,
    'not_visible_to_unassigned_engineer'
  );
  assert.equal(
    appointmentById('appointment_beta_other_org').expectedVisibility,
    'not_visible_to_org_alpha_engineer'
  );
  assert.equal(appointmentById('appointment_alpha_cancelled').expectedVisibility, 'not_actionable');
});

test('safe-deny matrix ties appointment denial scenarios to assignment and organization facts', () => {
  const crossOrgScenario = safeDenyById('safe_deny_cross_org_appointment');
  const crossOrgAppointment = appointmentById(crossOrgScenario.appointmentId);
  const crossOrgAssignment = assignmentById(crossOrgAppointment.dispatchAssignmentId);
  const actorEngineer = engineerProfileById(crossOrgScenario.actorEngineerProfileId);

  assert.notEqual(crossOrgAppointment.organizationId, actorEngineer.organizationId);
  assert.equal(crossOrgAssignment.organizationId, crossOrgAppointment.organizationId);

  const otherEngineerScenario = safeDenyById('safe_deny_assignment_owned_by_other_engineer');
  const otherEngineerAppointment = appointmentById(otherEngineerScenario.appointmentId);
  const otherEngineerAssignment = assignmentById(otherEngineerAppointment.dispatchAssignmentId);

  assert.notEqual(
    otherEngineerAssignment.engineerProfileId,
    otherEngineerScenario.actorEngineerProfileId
  );
  assert.equal(otherEngineerAppointment.organizationId, 'org_alpha_service');

  const hiddenScenario = safeDenyById('safe_deny_hidden_unconfirmed_appointment');
  const hiddenAppointment = appointmentById(hiddenScenario.appointmentId);

  assert.equal(hiddenAppointment.operationState, 'hidden_unconfirmed');
  assert.equal(hiddenAppointment.expectedVisibility, 'hidden');
});

test('safe-deny matrix preserves forbidden client authority and formal-report protections', () => {
  const requiredForbiddenAuthority = [
    'organizationId',
    'engineerProfileId',
    'finalAppointmentId',
    'caseCompleted',
    'formalFieldServiceReportApproved'
  ];

  for (const key of requiredForbiddenAuthority) {
    assert.equal(forbiddenKeys.has(key), true, `${key} must remain forbidden`);
  }

  const forbiddenExampleKeys = new Set(
    fixture.forbiddenPayloadExamples.flatMap((example) => Object.keys(example.payloadShape))
  );

  assert.equal(forbiddenExampleKeys.has('finalAppointmentId'), true);
  assert.equal(forbiddenExampleKeys.has('caseCompleted'), true);
  assert.equal(forbiddenExampleKeys.has('formalFieldServiceReportApproved'), true);

  const notes = repositorySyntheticFixtureInvariantNotes.join(' ');

  assert.match(notes, /source-data-only/);
  assert.match(notes, /not-formal-field-service-report/);
  assert.match(notes, /not-case-completed/);
  assert.match(notes, /multiple-submissions-do-not-create-multiple-formal-reports/);
  assert.match(notes, /final-appointment-id-is-system-owned/);
  assert.match(notes, /no-survey-provider-billing-settlement-ai-approval-trigger/);
});

test('safe-deny fixture has no obvious secret or real personal data values', () => {
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
  assert.match(repositorySyntheticFixtureInvariantNotes.join(' '), /line-identity-is-not-global-identity/);
});
