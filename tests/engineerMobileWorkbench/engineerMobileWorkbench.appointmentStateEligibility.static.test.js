const assert = require('node:assert/strict');
const test = require('node:test');

const {
  engineerMobileWorkbenchRepositorySyntheticFixture,
  repositorySyntheticFixtureForbiddenKeys,
  repositorySyntheticFixtureInvariantNotes
} = require('../../fixtures/engineerMobileWorkbench/repositorySynthetic.fixture');

const fixture = engineerMobileWorkbenchRepositorySyntheticFixture;

const findById = (items, id) => items.find((item) => item.id === id);

const appointmentById = (id) => findById(fixture.appointments, id);
const assignmentById = (id) => findById(fixture.dispatchAssignments, id);
const safeDenyById = (id) => findById(fixture.safeDenyScenarios, id);

const expectedAppointmentScenarios = [
  ['appointment_alpha_visible_confirmed', 'confirmed', 'visible_to_assigned_engineer', /arrived_allowed/],
  [
    'appointment_alpha_already_arrived',
    'arrived',
    'visible_to_assigned_engineer',
    /duplicate_arrived_denied_started_may_be_allowed/
  ],
  [
    'appointment_alpha_in_progress',
    'in_progress',
    'visible_to_assigned_engineer',
    /completion_source_data_may_be_allowed/
  ],
  ['appointment_alpha_waiting_parts', 'waiting_parts', 'visible_summary', /normal_completion_denied/],
  [
    'appointment_alpha_quote_needed',
    'quote_needed',
    'visible_summary',
    /completion_denied_quote_workflow_needed/
  ],
  [
    'appointment_alpha_customer_not_available',
    'customer_not_available',
    'visible_summary',
    /completion_denied_reschedule_needed/
  ],
  ['appointment_alpha_cancelled', 'cancelled', 'not_actionable', /safe_deny_or_operation_denied/],
  ['appointment_alpha_reassigned', 'reassigned', 'not_visible_to_old_engineer', /safe_deny/],
  ['appointment_alpha_hidden_unconfirmed', 'hidden_unconfirmed', 'hidden', /safe_deny/],
  [
    'appointment_alpha_assigned_to_other_engineer',
    'confirmed',
    'not_visible_to_unassigned_engineer',
    /safe_deny_no_assignment_leak/
  ],
  ['appointment_beta_other_org', 'confirmed', 'not_visible_to_org_alpha_engineer', /safe_deny_no_org_leak/],
  [
    'appointment_alpha_case_with_formal_report',
    'completion_submitted_source',
    'visible_summary',
    /source_submission_requires_review_no_second_formal_report/
  ]
];

test('appointment state fixture covers required visibility and eligibility scenarios', () => {
  for (const [id, operationState, expectedVisibility, eligibilityPattern] of expectedAppointmentScenarios) {
    const appointment = appointmentById(id);

    assert.ok(appointment, `${id} must exist`);
    assert.equal(appointment.operationState, operationState);
    assert.equal(appointment.expectedVisibility, expectedVisibility);
    assert.match(appointment.eligibilityImplication, eligibilityPattern);
    assert.ok(appointment.dispatchAssignmentId);
    assert.ok(assignmentById(appointment.dispatchAssignmentId));
  }
});

test('appointment state fixture encodes arrived started and completion source-data boundaries', () => {
  const visibleConfirmed = appointmentById('appointment_alpha_visible_confirmed');
  const alreadyArrived = appointmentById('appointment_alpha_already_arrived');
  const inProgress = appointmentById('appointment_alpha_in_progress');
  const waitingParts = appointmentById('appointment_alpha_waiting_parts');
  const quoteNeeded = appointmentById('appointment_alpha_quote_needed');
  const customerNotAvailable = appointmentById('appointment_alpha_customer_not_available');

  assert.match(visibleConfirmed.eligibilityImplication, /arrived_allowed/);
  assert.match(alreadyArrived.eligibilityImplication, /duplicate_arrived_denied/);
  assert.match(alreadyArrived.eligibilityImplication, /started_may_be_allowed/);
  assert.match(inProgress.eligibilityImplication, /completion_source_data_may_be_allowed/);

  assert.equal(waitingParts.visitResult, 'pending_parts');
  assert.match(waitingParts.eligibilityImplication, /completion_denied/);
  assert.equal(quoteNeeded.visitResult, 'pending_quote');
  assert.match(quoteNeeded.eligibilityImplication, /quote_workflow_needed/);
  assert.equal(customerNotAvailable.visitResult, 'customer_not_home');
  assert.match(customerNotAvailable.eligibilityImplication, /reschedule_needed/);
});

test('multiple appointment fixture keeps visit-level outcomes under one case', () => {
  const multiVisitAppointments = fixture.appointments
    .filter((appointment) => appointment.caseId === 'case_alpha_multi_visit')
    .sort((left, right) => left.visitSequence - right.visitSequence);

  assert.equal(multiVisitAppointments.length, 2);
  assert.deepEqual(
    multiVisitAppointments.map((appointment) => appointment.id),
    ['appointment_alpha_multi_visit_first', 'appointment_alpha_multi_visit_second']
  );
  assert.equal(multiVisitAppointments[0].visitResult, 'pending_parts');
  assert.match(multiVisitAppointments[0].eligibilityImplication, /not_final_completion/);
  assert.match(
    multiVisitAppointments[1].eligibilityImplication,
    /arrived_allowed_final_appointment_system_owned/
  );

  const notes = repositorySyntheticFixtureInvariantNotes.join(' ');

  assert.match(notes, /not-formal-field-service-report/);
  assert.match(notes, /multiple-submissions-do-not-create-multiple-formal-reports/);
  assert.match(notes, /final-appointment-id-is-system-owned/);
});

test('safe-deny and operation-denied categories cover ineligible appointment states', () => {
  assert.match(appointmentById('appointment_alpha_reassigned').eligibilityImplication, /safe_deny/);
  assert.match(appointmentById('appointment_alpha_cancelled').eligibilityImplication, /safe_deny/);
  assert.match(appointmentById('appointment_alpha_hidden_unconfirmed').eligibilityImplication, /safe_deny/);
  assert.match(
    appointmentById('appointment_alpha_assigned_to_other_engineer').eligibilityImplication,
    /assignment_leak/
  );
  assert.match(appointmentById('appointment_beta_other_org').eligibilityImplication, /org_leak/);

  assert.equal(safeDenyById('safe_deny_cross_org_appointment').expectedStyle, 'generic-safe-deny');
  assert.equal(
    safeDenyById('safe_deny_assignment_owned_by_other_engineer').expectedStyle,
    'generic-safe-deny'
  );
  assert.equal(
    safeDenyById('safe_deny_hidden_unconfirmed_appointment').expectedStyle,
    'generic-safe-deny'
  );
  assert.equal(
    safeDenyById('operation_denied_cancelled_appointment').expectedStyle,
    'operation-denied'
  );
  assert.match(
    safeDenyById('operation_denied_existing_formal_report').assertionFocus,
    /no-second-formal-report/
  );
});

test('eligibility fixture preserves read-only boundary and forbids client authority fields', () => {
  const notes = repositorySyntheticFixtureInvariantNotes.join(' ');

  assert.match(safeDenyById('operation_denied_cancelled_appointment').assertionFocus, /no-state-mutation/);
  assert.match(notes, /source-data-only/);
  assert.match(notes, /not-formal-field-service-report/);
  assert.match(notes, /not-case-completed/);
  assert.match(notes, /multiple-submissions-do-not-create-multiple-formal-reports/);
  assert.match(notes, /final-appointment-id-is-system-owned/);
  assert.match(notes, /no-survey-provider-billing-settlement-ai-approval-trigger/);

  assert.equal(repositorySyntheticFixtureForbiddenKeys.includes('finalAppointmentId'), true);
  assert.equal(repositorySyntheticFixtureForbiddenKeys.includes('caseCompleted'), true);
  assert.equal(
    repositorySyntheticFixtureForbiddenKeys.includes('formalFieldServiceReportApproved'),
    true
  );

  for (const submission of fixture.completionSubmissions) {
    assert.equal(Object.prototype.hasOwnProperty.call(submission, 'finalAppointmentId'), false);
    assert.equal(Object.prototype.hasOwnProperty.call(submission, 'caseCompleted'), false);
    assert.equal(
      Object.prototype.hasOwnProperty.call(submission, 'formalFieldServiceReportApproved'),
      false
    );
  }
});

test('appointment eligibility fixture has no obvious secret or real personal data values', () => {
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
