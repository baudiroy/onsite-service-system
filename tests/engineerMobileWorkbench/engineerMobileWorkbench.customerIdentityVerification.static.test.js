const assert = require('node:assert/strict');
const test = require('node:test');

const {
  customerAccessScenarios,
  customerCaseLinkageFixtures,
  customerChannelIdentityScopeFixtures,
  customerFacingDtoInvariantNotes,
  customerFacingSafeDenyDtoProposal,
  customerFacingUnavailableDtoProposal,
  customerIdentityAccessFixtures,
  customerIdentityInvariantNotes,
  customerIdentityPublicationAccessFixtures,
  customerIdentityRoleBoundaryFixtures,
  customerIdentitySafeDenyFixtures,
  customerIdentityVerificationScenarios,
  customerVisibleFilteringInvariantNotes,
  engineerMobileWorkbenchRepositorySyntheticFixture
} = require('../../fixtures/engineerMobileWorkbench/repositorySynthetic.fixture');

const fixture = engineerMobileWorkbenchRepositorySyntheticFixture;

const assertIncludesAll = (actual, expected, label) => {
  for (const item of expected) {
    assert.equal(actual.includes(item), true, `${label} must include ${item}`);
  }
};

const byId = (items, id) => items.find((item) => item.id === id);
const serializedMatch = (items, pattern, label) => assert.match(JSON.stringify(items), pattern, label);

test('customer identity fixture exposes required marker groups and related baselines', () => {
  const requiredFixtureGroups = [
    'customerIdentityAccessFixtures',
    'customerIdentityRoleBoundaryFixtures',
    'customerChannelIdentityScopeFixtures',
    'customerCaseLinkageFixtures',
    'customerIdentitySafeDenyFixtures',
    'customerIdentityPublicationAccessFixtures',
    'customerIdentityInvariantNotes',
    'customerIdentityVerificationScenarios',
    'customerAccessScenarios',
    'customerFacingSafeDenyDtoProposal',
    'customerFacingUnavailableDtoProposal',
    'customerFacingDtoInvariantNotes',
    'customerVisibleFilteringInvariantNotes',
    'safeDenyScenarios',
    'organizations',
    'cases',
    'customerVisibleReportFixtures'
  ];

  for (const group of requiredFixtureGroups) {
    assert.equal(
      Object.prototype.hasOwnProperty.call(fixture, group),
      true,
      `fixture must expose ${group}`
    );
  }

  for (const group of [
    customerIdentityAccessFixtures,
    customerIdentityRoleBoundaryFixtures,
    customerChannelIdentityScopeFixtures,
    customerCaseLinkageFixtures,
    customerIdentitySafeDenyFixtures,
    customerIdentityPublicationAccessFixtures,
    customerIdentityInvariantNotes,
    customerIdentityVerificationScenarios,
    customerAccessScenarios,
    customerFacingDtoInvariantNotes,
    customerVisibleFilteringInvariantNotes,
    fixture.safeDenyScenarios,
    fixture.organizations,
    fixture.cases,
    fixture.customerVisibleReportFixtures
  ]) {
    assert.equal(Array.isArray(group), true);
    assert.equal(group.length > 0, true);
  }

  assert.equal(typeof customerFacingSafeDenyDtoProposal, 'object');
  assert.equal(typeof customerFacingUnavailableDtoProposal, 'object');
});

test('customer identity access fixtures cover verification linkage publication and safe-deny cases', () => {
  const requiredScenarioIds = [
    'identity_access_verified_customer_linked_published',
    'identity_access_unverified_customer',
    'identity_access_suspicious_ambiguous_identity',
    'identity_access_unbound_customer_channel_identity',
    'identity_access_verified_customer_unpublished_report',
    'identity_access_verified_customer_report_withheld',
    'identity_access_verified_disputed_report_follow_up',
    'identity_access_cross_organization_attempt',
    'identity_access_linked_to_different_case',
    'identity_access_no_case_linkage'
  ];

  assertIncludesAll(
    customerIdentityAccessFixtures.map((scenario) => scenario.id),
    requiredScenarioIds,
    'customerIdentityAccessFixtures'
  );

  for (const scenario of customerIdentityAccessFixtures) {
    for (const key of [
      'id',
      'organizationScopeMarker',
      'customerIdentityVerificationMarker',
      'caseLinkageMarker',
      'publicationStateMarker',
      'expectedAccessResult',
      'accessResponseMarker',
      'forbiddenLeakageMarker'
    ]) {
      assert.equal(typeof scenario[key], 'string', `${scenario.id} must include ${key}`);
      assert.notEqual(scenario[key].length, 0, `${scenario.id} ${key} cannot be empty`);
    }
  }

  const verifiedPublished = byId(
    customerIdentityAccessFixtures,
    'identity_access_verified_customer_linked_published'
  );
  const crossOrg = byId(customerIdentityAccessFixtures, 'identity_access_cross_organization_attempt');
  const disputed = byId(
    customerIdentityAccessFixtures,
    'identity_access_verified_disputed_report_follow_up'
  );

  assert.match(verifiedPublished.expectedAccessResult, /visible/);
  assert.match(verifiedPublished.publicationStateMarker, /customer_report_published/);
  assert.match(crossOrg.expectedAccessResult, /safe-deny/);
  assert.match(crossOrg.forbiddenLeakageMarker, /no-cross-organization-data/);
  assert.match(disputed.expectedAccessResult, /follow-up/);
  assert.match(disputed.accessResponseMarker, /human-follow-up|required/);
});

test('role boundary markers reject reporter billing on-site phone and address shortcuts', () => {
  const requiredRoleBoundaryIds = [
    'reporter_not_automatically_customer',
    'billing_contact_not_automatically_customer',
    'on_site_contact_override_not_automatically_customer_identity',
    'phone_number_alone_cannot_grant_report_access',
    'address_alone_cannot_grant_report_access',
    'customer_identity_must_be_linked_to_case',
    'cross_customer_case_access_must_safe_deny'
  ];

  assertIncludesAll(
    customerIdentityRoleBoundaryFixtures.map((fixtureItem) => fixtureItem.id),
    requiredRoleBoundaryIds,
    'customerIdentityRoleBoundaryFixtures'
  );

  serializedMatch(
    customerIdentityRoleBoundaryFixtures,
    /reporter-can-differ-from-customer/,
    'reporter can differ from customer'
  );
  serializedMatch(
    customerIdentityRoleBoundaryFixtures,
    /billing-contact-can-differ-from-customer/,
    'billing contact can differ from customer'
  );
  serializedMatch(
    customerIdentityRoleBoundaryFixtures,
    /on-site-contact-override-can-differ-from-customer/,
    'on-site contact can differ from customer'
  );
  serializedMatch(
    customerIdentityRoleBoundaryFixtures,
    /contact-text-is-not-identity-proof|text-alone-cannot-grant-access/,
    'shared contact text cannot grant access'
  );
  serializedMatch(
    customerIdentityRoleBoundaryFixtures,
    /proposal-only-no-runtime/,
    'role boundary remains proposal-only no runtime'
  );
});

test('customer channel identity scope markers preserve tenant channel boundaries', () => {
  const requiredChannelIds = [
    'line_identity_scoped_by_org_channel_user_marker',
    'web_identity_scoped_and_verified_marker',
    'sms_identity_scoped_and_verified_marker',
    'app_identity_scoped_and_verified_marker',
    'channel_credential_never_customer_visible',
    'channel_identity_internals_forbidden_in_dto'
  ];

  assertIncludesAll(
    customerChannelIdentityScopeFixtures.map((channel) => channel.id),
    requiredChannelIds,
    'customerChannelIdentityScopeFixtures'
  );

  const serialized = JSON.stringify(customerChannelIdentityScopeFixtures);

  assert.match(serialized, /organization-plus-line-channel-plus-line-user-marker/);
  assert.match(serialized, /raw-line-user-marker-is-not-global-identity/);
  assert.match(serialized, /organization-plus-web-session-or-verified-link-marker/);
  assert.match(serialized, /organization-plus-verified-sms-link-marker/);
  assert.match(serialized, /organization-plus-app-account-marker/);
  assert.match(serialized, /raw-web-token-alone-cannot-grant-report-access/);
  assert.match(serialized, /raw-phone-text-alone-cannot-grant-report-access/);
  assert.match(serialized, /raw-app-device-id-alone-cannot-grant-report-access/);
  assert.match(serialized, /channel-credential-provider-key-never-customer-visible/);
  assert.match(serialized, /customer-facing-dto-must-not-include-channel-internals/);
  assert.doesNotMatch(serialized, /line_user_id/);
});

test('case linkage markers reject global lookup first-match lookup and unlinked identities', () => {
  const requiredLinkageIds = [
    'verified_customer_linked_to_case_same_org',
    'verified_customer_not_linked_to_case',
    'verified_customer_linked_to_another_case',
    'verified_customer_in_another_organization',
    'unverified_customer_attempting_case_access',
    'case_not_found_or_inaccessible_safe_deny',
    'case_linkage_must_be_organization_scoped',
    'no_global_case_lookup',
    'no_first_matching_case_lookup'
  ];

  assertIncludesAll(
    customerCaseLinkageFixtures.map((linkage) => linkage.id),
    requiredLinkageIds,
    'customerCaseLinkageFixtures'
  );

  const sameOrg = byId(customerCaseLinkageFixtures, 'verified_customer_linked_to_case_same_org');
  const otherOrg = byId(customerCaseLinkageFixtures, 'verified_customer_in_another_organization');
  const noGlobalLookup = byId(customerCaseLinkageFixtures, 'no_global_case_lookup');
  const noFirstMatch = byId(customerCaseLinkageFixtures, 'no_first_matching_case_lookup');

  assert.equal(sameOrg.organizationScope, 'same-organization');
  assert.match(sameOrg.expectedAccessResult, /eligible-if-published/);
  assert.match(otherOrg.expectedAccessResult, /safe-deny/);
  assert.match(noGlobalLookup.expectedAccessResult, /forbidden-pattern/);
  assert.match(noFirstMatch.expectedAccessResult, /forbidden-pattern/);
});

test('identity safe-deny fixtures avoid resource and existence enumeration', () => {
  const requiredSafeDenyIds = [
    'unverified_customer_safe_deny',
    'unlinked_customer_safe_deny',
    'cross_organization_safe_deny',
    'unbound_channel_identity_safe_deny',
    'suspicious_ambiguous_identity_safe_deny',
    'unpublished_report_unavailable_or_safe_deny',
    'withheld_report_unavailable_follow_up',
    'inaccessible_case_safe_deny',
    'report_in_another_organization_safe_deny',
    'no_resource_enumeration_marker',
    'no_organization_existence_leak_marker',
    'no_case_existence_leak_marker',
    'no_report_existence_leak_marker'
  ];

  assertIncludesAll(
    customerIdentitySafeDenyFixtures.map((scenario) => scenario.id),
    requiredSafeDenyIds,
    'customerIdentitySafeDenyFixtures'
  );

  const serialized = JSON.stringify(customerIdentitySafeDenyFixtures);

  assert.match(serialized, /generic-safe-deny/);
  assert.match(serialized, /no-resource-enumeration/);
  assert.match(serialized, /no-organization-existence-leak/);
  assert.match(serialized, /no-case-existence-leak/);
  assert.match(serialized, /no-report-existence-leak/);
  assert.match(serialized, /unavailable-or-follow-up/);
  assert.match(serialized, /no-channel-identity-internals/);
});

test('publication access fixtures keep internal states hidden until explicit publication', () => {
  const expectedPublicationBehaviors = new Map([
    ['draft_internal', /not-visible/],
    ['source_data_submitted', /not-visible/],
    ['needs_review', /not-visible-or-customer-safe-follow-up/],
    ['approved_internal_fsr', /not-automatically-customer-visible/],
    ['customer_report_published', /visible-only-after-identity-case-org-checks/],
    ['customer_report_withheld', /unavailable-or-follow-up/],
    ['customer_follow_up_required', /limited-customer-safe-follow-up/],
    ['disputed', /follow-up-or-human-handling/]
  ]);

  for (const [state, behaviorPattern] of expectedPublicationBehaviors) {
    const marker = customerIdentityPublicationAccessFixtures.find((item) => item.state === state);

    assert.ok(marker, `${state} publication marker must exist`);
    assert.match(marker.accessBehavior, behaviorPattern);
  }
});

test('identity invariant notes preserve customer identity and DTO safety boundaries', () => {
  const notes = customerIdentityInvariantNotes.join(' ');

  assert.match(notes, /customer-identity-is-not-global/);
  assert.match(notes, /line-is-not-global-identity/);
  assert.match(notes, /raw-line-user-marker-cannot-grant-access/);
  assert.match(notes, /customer-channel-identity-must-be-organization-channel-scoped/);
  assert.match(notes, /customer-must-be-verified-before-customer-facing-report-access/);
  assert.match(notes, /customer-must-be-linked-to-case/);
  assert.match(notes, /case-linkage-must-be-organization-scoped/);
  assert.match(notes, /phone-address-alone-cannot-grant-access/);
  assert.match(
    notes,
    /reporter-billing-contact-on-site-contact-override-are-not-automatically-report-viewer-identity/
  );
  assert.match(notes, /cross-organization-access-must-safe-deny/);
  assert.match(notes, /customer-facing-dto-must-not-expose-channel-identity-internals/);
  assert.match(notes, /internal-identity-matching-reason-must-not-be-customer-visible/);
  assert.match(notes, /no-runtime-identity-verification-is-implemented-by-fixture/);
});

test('serialized customer identity fixture has no obvious secret or real personal data values', () => {
  const serialized = JSON.stringify({
    customerAccessScenarios,
    customerCaseLinkageFixtures,
    customerChannelIdentityScopeFixtures,
    customerFacingDtoInvariantNotes,
    customerFacingSafeDenyDtoProposal,
    customerFacingUnavailableDtoProposal,
    customerIdentityAccessFixtures,
    customerIdentityInvariantNotes,
    customerIdentityPublicationAccessFixtures,
    customerIdentityRoleBoundaryFixtures,
    customerIdentitySafeDenyFixtures,
    customerIdentityVerificationScenarios,
    customerVisibleFilteringInvariantNotes,
    organizations: fixture.organizations,
    cases: fixture.cases,
    customerVisibleReportFixtures: fixture.customerVisibleReportFixtures,
    safeDenyScenarios: fixture.safeDenyScenarios
  });

  const forbiddenValuePatterns = [
    /DATABASE_URL\s*=/i,
    /access_token\s*[:=]/i,
    /channel_secret\s*[:=]/i,
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
    /09\d{8}/,
    /U[a-f0-9]{32}/i,
    /C[a-f0-9]{32}/i,
    /(?:^|["'\s:])sk-[A-Za-z0-9_-]{20,}/,
    /ghp_[A-Za-z0-9_]{20,}/,
    /xox[baprs]-[A-Za-z0-9-]{20,}/,
    /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
    /[A-Za-z0-9+/]{80,}={0,2}/
  ];

  for (const pattern of forbiddenValuePatterns) {
    assert.equal(pattern.test(serialized), false, `${pattern} must not match fixture`);
  }

  assert.match(serialized, /databaseConnectionConfigMarker/);
  assert.match(serialized, /token/);
  assert.match(serialized, /secret/);
  assert.doesNotMatch(serialized, /line_user_id/);
});
