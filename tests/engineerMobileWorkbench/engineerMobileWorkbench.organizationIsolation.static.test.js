const assert = require('node:assert/strict');
const test = require('node:test');

const {
  engineerMobileWorkbenchRepositorySyntheticFixture,
  repositorySyntheticFixtureForbiddenKeys,
  repositorySyntheticFixtureInvariantNotes
} = require('../../fixtures/engineerMobileWorkbench/repositorySynthetic.fixture');

const findById = (items, id) => items.find((item) => item.id === id);

const organizations = engineerMobileWorkbenchRepositorySyntheticFixture.organizations;
const engineerProfiles = engineerMobileWorkbenchRepositorySyntheticFixture.engineerProfiles;
const platformUsers = engineerMobileWorkbenchRepositorySyntheticFixture.platformUsers;
const userOrganizations = engineerMobileWorkbenchRepositorySyntheticFixture.userOrganizations;
const appointments = engineerMobileWorkbenchRepositorySyntheticFixture.appointments;
const dispatchAssignments = engineerMobileWorkbenchRepositorySyntheticFixture.dispatchAssignments;
const safeDenyScenarios = engineerMobileWorkbenchRepositorySyntheticFixture.safeDenyScenarios;

const appointmentById = (id) => findById(appointments, id);
const assignmentById = (id) => findById(dispatchAssignments, id);
const engineerById = (id) => findById(engineerProfiles, id);

test('organization fixture contract distinguishes active suspended and deleted tenants', () => {
  const orgAlpha = findById(organizations, 'org_alpha_service');
  const orgBeta = findById(organizations, 'org_beta_service');
  const orgSuspended = findById(organizations, 'org_suspended');
  const orgDeleted = findById(organizations, 'org_deleted');

  assert.ok(orgAlpha);
  assert.ok(orgBeta);
  assert.ok(orgSuspended);
  assert.ok(orgDeleted);
  assert.notEqual(orgAlpha.id, orgBeta.id);
  assert.equal(orgAlpha.status, 'active');
  assert.equal(orgBeta.status, 'active');
  assert.equal(orgSuspended.status, 'suspended');
  assert.equal(orgDeleted.status, 'deleted');
  assert.match(`${orgAlpha.isolationNote} ${orgBeta.isolationNote}`, /org|organization|isolation/i);

  for (const organization of organizations) {
    assert.match(organization.id, /^org_(alpha|beta|suspended|deleted)/);
    assert.doesNotMatch(organization.id, /real|customer|company|corp|inc/i);
    assert.doesNotMatch(organization.purpose, /real customer|production/i);
  }
});

test('engineer identity remains scoped by user organization and engineer profile mapping', () => {
  const alphaUser = findById(platformUsers, 'user_alpha_engineer_active');
  const betaUser = findById(platformUsers, 'user_beta_engineer_active');
  const inactiveUser = findById(platformUsers, 'user_inactive_engineer');
  const userWithoutEngineerProfile = findById(platformUsers, 'user_without_engineer_profile');
  const alphaEngineer = engineerById('engineer_profile_alpha_active');
  const betaEngineer = engineerById('engineer_profile_beta_active');
  const inactiveEngineer = engineerById('engineer_profile_inactive');

  assert.ok(alphaUser);
  assert.ok(betaUser);
  assert.ok(inactiveUser);
  assert.ok(userWithoutEngineerProfile);
  assert.ok(alphaEngineer);
  assert.ok(betaEngineer);
  assert.ok(inactiveEngineer);
  assert.notEqual(alphaEngineer.id, betaEngineer.id);
  assert.equal(alphaEngineer.platformUserId, alphaUser.id);
  assert.equal(betaEngineer.platformUserId, betaUser.id);
  assert.equal(alphaEngineer.organizationId, 'org_alpha_service');
  assert.equal(betaEngineer.organizationId, 'org_beta_service');
  assert.equal(inactiveEngineer.status, 'inactive');

  assert.ok(
    userOrganizations.some(
      (membership) =>
        membership.userId === alphaUser.id &&
        membership.organizationId === alphaEngineer.organizationId &&
        membership.status === 'active'
    )
  );
  assert.ok(
    userOrganizations.some(
      (membership) =>
        membership.userId === betaUser.id &&
        membership.organizationId === betaEngineer.organizationId &&
        membership.status === 'active'
    )
  );

  const serialized = JSON.stringify({
    engineerMobileWorkbenchRepositorySyntheticFixture,
    repositorySyntheticFixtureInvariantNotes
  });

  assert.equal(serialized.includes('line_user_id'), false);
  assert.match(repositorySyntheticFixtureInvariantNotes.join(' '), /line-identity-is-not-global-identity/);
});

test('appointment and assignment scenarios preserve organization and engineer boundaries', () => {
  const alphaAppointment = appointmentById('appointment_alpha_visible_confirmed');
  const alphaAssignment = assignmentById(alphaAppointment.dispatchAssignmentId);
  const betaAppointment = appointmentById('appointment_beta_other_org');
  const betaAssignment = assignmentById(betaAppointment.dispatchAssignmentId);
  const otherEngineerAppointment = appointmentById('appointment_alpha_assigned_to_other_engineer');
  const otherEngineerAssignment = assignmentById(otherEngineerAppointment.dispatchAssignmentId);

  assert.equal(alphaAppointment.organizationId, 'org_alpha_service');
  assert.equal(alphaAssignment.organizationId, alphaAppointment.organizationId);
  assert.equal(alphaAssignment.engineerProfileId, 'engineer_profile_alpha_active');
  assert.equal(alphaAppointment.expectedVisibility, 'visible_to_assigned_engineer');

  assert.equal(betaAppointment.organizationId, 'org_beta_service');
  assert.equal(betaAssignment.organizationId, betaAppointment.organizationId);
  assert.equal(betaAssignment.engineerProfileId, 'engineer_profile_beta_active');
  assert.equal(betaAppointment.expectedVisibility, 'not_visible_to_org_alpha_engineer');
  assert.notEqual(betaAppointment.organizationId, alphaAppointment.organizationId);

  assert.equal(otherEngineerAppointment.organizationId, 'org_alpha_service');
  assert.equal(otherEngineerAssignment.organizationId, otherEngineerAppointment.organizationId);
  assert.notEqual(otherEngineerAssignment.engineerProfileId, 'engineer_profile_alpha_active');
  assert.equal(otherEngineerAppointment.expectedVisibility, 'not_visible_to_unassigned_engineer');

  assert.ok(
    safeDenyScenarios.some(
      (scenario) =>
        scenario.id === 'safe_deny_cross_org_appointment' &&
        scenario.appointmentId === betaAppointment.id &&
        /safe-deny/.test(scenario.expectedStyle) &&
        /no-appointment-existence-or-org-leak/.test(scenario.assertionFocus)
    )
  );
  assert.ok(
    safeDenyScenarios.some(
      (scenario) =>
        scenario.id === 'safe_deny_assignment_owned_by_other_engineer' &&
        scenario.appointmentId === otherEngineerAppointment.id &&
        /safe-deny/.test(scenario.expectedStyle) &&
        /no-engineer-assignment-ownership-leak/.test(scenario.assertionFocus)
    )
  );
});

test('fixture metadata keeps cross-org safe-deny explicit without trusting client overrides', () => {
  const serialized = JSON.stringify({
    engineerMobileWorkbenchRepositorySyntheticFixture,
    repositorySyntheticFixtureForbiddenKeys,
    repositorySyntheticFixtureInvariantNotes
  });

  assert.equal(repositorySyntheticFixtureForbiddenKeys.includes('organizationId'), true);
  assert.equal(repositorySyntheticFixtureForbiddenKeys.includes('engineerProfileId'), true);
  assert.match(serialized, /same fake shape across orgs must not collapse identity/);
  assert.match(serialized, /no-appointment-existence-or-org-leak/);
  assert.match(serialized, /no-engineer-assignment-ownership-leak/);
  assert.doesNotMatch(serialized, /global appointment lookup/i);
  assert.doesNotMatch(serialized, /taskId alone/i);
  assert.doesNotMatch(serialized, /customer phone.*authority/i);
  assert.doesNotMatch(serialized, /first matching appointment/i);
  assert.doesNotMatch(serialized, /global LINE identity lookup/i);
});

test('organization isolation fixture has no obvious secret or real personal data values', () => {
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

  assert.match(repositorySyntheticFixtureInvariantNotes.join(' '), /line-identity-is-not-global-identity/);
});
