const assert = require('node:assert/strict');
const test = require('node:test');

const {
  customerAccessScenarios,
  customerFacingDtoAllowedFields,
  customerFacingDtoForbiddenFields,
  customerFacingDtoInvariantNotes,
  customerFacingPublishedDtoProposal,
  customerFacingPublicationStateDtoMapping,
  customerFacingSafeDenyDtoProposal,
  customerFacingUnavailableDtoProposal,
  customerIdentityAccessFixtures,
  customerIdentityPublicationAccessFixtures,
  customerIdentityRoleBoundaryFixtures,
  customerReportPublicationStates,
  customerVisibleFilteringInvariantNotes,
  customerVisibleReportFixtures,
  engineerMobileWorkbenchRepositorySyntheticFixture
} = require('../../fixtures/engineerMobileWorkbench/repositorySynthetic.fixture');

const assertIncludesAll = (actual, expected, label) => {
  for (const item of expected) {
    assert.equal(actual.includes(item), true, `${label} must include ${item}`);
  }
};

const byId = (items, id) => items.find((item) => item.id === id);
const byState = (items, state) => items.find((item) => item.state === state);
const serializedMatch = (value, pattern, label) => assert.match(JSON.stringify(value), pattern, label);

const requiredPublicationStates = [
  'draft_internal',
  'source_data_submitted',
  'needs_review',
  'approved_internal_fsr',
  'customer_report_published',
  'customer_report_withheld',
  'customer_follow_up_required',
  'disputed'
];

const forbiddenCustomerFacingFields = [
  'internalNote',
  'auditLog',
  'aiRawPayload',
  'billingInternalData',
  'settlementInternalData',
  'internalEngineerComment',
  'supervisorReviewNote',
  'providerRawPayload',
  'token',
  'secret',
  'databaseConnectionConfigMarker',
  'customerChannelIdentityInternals',
  'crossOrganizationData'
];

test('publication state baseline distinguishes internal unavailable published follow-up and disputed states', () => {
  assertIncludesAll(
    customerReportPublicationStates.map((state) => state.state),
    requiredPublicationStates,
    'customerReportPublicationStates'
  );

  assert.equal(byState(customerReportPublicationStates, 'draft_internal').visibility, 'internal_only');
  assert.equal(
    byState(customerReportPublicationStates, 'source_data_submitted').visibility,
    'internal_only'
  );
  assert.equal(byState(customerReportPublicationStates, 'needs_review').visibility, 'internal_only');
  assert.equal(
    byState(customerReportPublicationStates, 'approved_internal_fsr').visibility,
    'internal_only-by-default'
  );
  assert.match(
    byState(customerReportPublicationStates, 'customer_report_published').visibility,
    /customer_visible/
  );
  assert.equal(byState(customerReportPublicationStates, 'customer_report_withheld').visibility, 'withheld');
  assert.equal(
    byState(customerReportPublicationStates, 'customer_follow_up_required').visibility,
    'customer-safe-status-only'
  );
  assert.equal(byState(customerReportPublicationStates, 'disputed').visibility, 'customer-safe-status-only');

  const invariantNotes = [
    ...customerVisibleFilteringInvariantNotes,
    ...customerFacingDtoInvariantNotes
  ].join(' ');

  assert.match(invariantNotes, /customer-facing.*filtered.*not-second-formal-fsr/);
  assert.match(invariantNotes, /formal.*report-remains-case-level-formal-report|formal-fsr-remains-case-level-formal-report/);
  assert.match(invariantNotes, /one-case-ultimately-has-one-formal/);
});

test('publication state to DTO mapping keeps internal FSR and completion source data unavailable', () => {
  const expectedMappings = new Map([
    ['draft_internal', /not_customer_visible/],
    ['source_data_submitted', /not_customer_visible/],
    ['needs_review', /unavailable_or_optional_follow_up/],
    ['approved_internal_fsr', /not_automatically_customer_visible/],
    ['customer_report_published', /published_dto_allowed/],
    ['customer_report_withheld', /unavailable_or_follow_up/],
    ['customer_follow_up_required', /limited_follow_up_dto/],
    ['disputed', /follow_up_or_human_handling/]
  ]);

  for (const [state, expectedBehavior] of expectedMappings) {
    const mapping = byState(customerFacingPublicationStateDtoMapping, state);

    assert.ok(mapping, `${state} DTO mapping must exist`);
    assert.match(mapping.dtoBehavior, expectedBehavior);
  }

  serializedMatch(
    customerFacingPublicationStateDtoMapping,
    /proposal-only|no-runtime-transition|no-api-behavior-change/,
    'mapping remains static proposal only'
  );
});

test('customer-facing DTO proposal is allow-listed and excludes internal report fields', () => {
  assertIncludesAll(
    Object.keys(customerFacingPublishedDtoProposal),
    [
      'status',
      'reportVersion',
      'caseDisplayId',
      'serviceDateSummary',
      'appointmentWindowSummary',
      'reviewedWorkPerformedSummary',
      'reviewedResolutionSummary',
      'approvedPhotoEvidenceRefs',
      'publishedServiceStatus',
      'customerFollowUpStatus',
      'supportAction'
    ],
    'customerFacingPublishedDtoProposal'
  );

  assertIncludesAll(
    customerFacingDtoForbiddenFields,
    forbiddenCustomerFacingFields,
    'customerFacingDtoForbiddenFields'
  );

  const allowedSet = new Set(customerFacingDtoAllowedFields);

  for (const forbiddenField of customerFacingDtoForbiddenFields) {
    assert.equal(allowedSet.has(forbiddenField), false, `${forbiddenField} must not be customer-facing`);
  }

  const publishedProposal = JSON.stringify(customerFacingPublishedDtoProposal);

  assert.doesNotMatch(publishedProposal, /internalNote|auditLog|aiRawPayload|billingInternalData|settlementInternalData/);
  assert.doesNotMatch(publishedProposal, /internalEngineerComment|supervisorReviewNote|providerRawPayload/);
  assert.match(publishedProposal, /not-raw-fsr-dump/);
  assert.match(publishedProposal, /not-raw-completion-submission-source-data/);
  assert.match(publishedProposal, /refs-only-not-raw-binary/);
});

test('identity access boundary requires organization verified identity case linkage and publication', () => {
  const verifiedPublished = byId(
    customerIdentityAccessFixtures,
    'identity_access_verified_customer_linked_published'
  );
  const unpublished = byId(
    customerIdentityAccessFixtures,
    'identity_access_verified_customer_unpublished_report'
  );
  const crossOrganization = byId(
    customerIdentityAccessFixtures,
    'identity_access_cross_organization_attempt'
  );
  const unlinkedCase = byId(customerIdentityAccessFixtures, 'identity_access_no_case_linkage');

  assert.match(verifiedPublished.organizationScopeMarker, /same-organization/);
  assert.match(verifiedPublished.customerIdentityVerificationMarker, /verified-customer/);
  assert.match(verifiedPublished.caseLinkageMarker, /linked-to-case/);
  assert.match(verifiedPublished.publicationStateMarker, /customer_report_published/);
  assert.match(verifiedPublished.expectedAccessResult, /customer-facing-dto-visible/);

  assert.match(unpublished.expectedAccessResult, /not-visible/);
  assert.match(crossOrganization.expectedAccessResult, /safe-deny/);
  assert.match(unlinkedCase.expectedAccessResult, /safe-deny/);

  serializedMatch(
    customerIdentityRoleBoundaryFixtures,
    /phone_number_alone_cannot_grant_report_access|phone.*alone-cannot-grant-access/,
    'phone alone cannot grant access'
  );
  serializedMatch(
    customerIdentityRoleBoundaryFixtures,
    /address_alone_cannot_grant_report_access|address.*alone-cannot-grant-access/,
    'address alone cannot grant access'
  );

  const identityNotes = [
    ...customerVisibleFilteringInvariantNotes,
    ...customerFacingDtoInvariantNotes
  ].join(' ');

  assert.match(identityNotes, /dto-creation-requires-verified-customer-identity|customer-identity-must-be-verified/);
  assert.match(identityNotes, /dto-creation-requires-customer-linked-to-case|customer-must-be-linked-to-case/);
  assert.match(identityNotes, /dto-creation-requires-organization-scope-match|cross-organization-customer-access-must-safe-deny/);
  assert.match(identityNotes, /dto-creation-requires-publication-state-allows-customer-view/);
});

test('unavailable and safe-deny states avoid internal reason and resource enumeration leaks', () => {
  assert.equal(customerFacingUnavailableDtoProposal.status, 'not_available');
  assert.equal(customerFacingSafeDenyDtoProposal.status, 'not_available');

  serializedMatch(
    customerFacingUnavailableDtoProposal,
    /does-not-reveal-internal-workflow-reason/,
    'unavailable response hides workflow reason'
  );
  serializedMatch(
    customerFacingUnavailableDtoProposal,
    /does-not-reveal-internal-approval-status/,
    'unavailable response hides approval status'
  );
  serializedMatch(
    customerFacingSafeDenyDtoProposal,
    /no-resource-enumeration/,
    'safe deny avoids resource enumeration'
  );
  serializedMatch(
    customerFacingSafeDenyDtoProposal,
    /no-organization-existence-leak|no-case-existence-leak|no-report-existence-leak/,
    'safe deny avoids existence leaks'
  );

  const requiredAccessScenarios = [
    'verified_customer_cannot_view_unpublished_fsr_draft',
    'unverified_customer_safe_deny',
    'customer_not_linked_to_case_safe_deny',
    'customer_from_other_organization_safe_deny',
    'ai_generated_summary_not_human_confirmed_internal_only'
  ];

  assertIncludesAll(
    customerAccessScenarios.map((scenario) => scenario.id),
    requiredAccessScenarios,
    'customerAccessScenarios'
  );

  const unconfirmedSourceData = byId(
    customerAccessScenarios,
    'ai_generated_summary_not_human_confirmed_internal_only'
  );

  assert.match(unconfirmedSourceData.expectedVisibility, /internal_only/);
  assert.match(unconfirmedSourceData.safeDenyOrEscalationBehavior, /withhold-unconfirmed-ai-summary/);
});

test('follow-up complaint dispute and negative feedback markers cannot be treated as resolved by publication view or AI', () => {
  const requiredScenarios = [
    'complaint_or_low_rating_requires_follow_up_marker',
    'disputed_service_result_requires_human_follow_up',
    'fee_dispute_requires_human_follow_up'
  ];

  assertIncludesAll(
    customerAccessScenarios.map((scenario) => scenario.id),
    requiredScenarios,
    'customerAccessScenarios'
  );

  for (const scenarioId of requiredScenarios) {
    const scenario = byId(customerAccessScenarios, scenarioId);

    assert.match(scenario.expectedVisibility, /customer_safe|follow_up|dispute|fee-follow-up/);
    assert.match(scenario.safeDenyOrEscalationBehavior, /follow-up|human-follow-up-required|not-auto-close/);
    assert.match(scenario.forbiddenLeakageMarker, /no-/);
  }

  const disputed = byState(customerIdentityPublicationAccessFixtures, 'disputed');
  const followUp = byState(customerIdentityPublicationAccessFixtures, 'customer_follow_up_required');
  const notes = customerFacingDtoInvariantNotes.join(' ');

  assert.match(disputed.accessBehavior, /follow-up-or-human-handling/);
  assert.match(followUp.accessBehavior, /limited-customer-safe-follow-up/);
  assert.match(notes, /complaint-dispute-low-rating-requires-follow-up-marker-and-cannot-be-ai-auto-closed/);
});

test('customer-visible report fixture keeps filtered projection separate from formal report source data', () => {
  const published = byId(
    customerVisibleReportFixtures,
    'customer_visible_report_alpha_published_projection'
  );
  const internalDraft = byId(
    customerVisibleReportFixtures,
    'customer_visible_report_alpha_internal_draft_withheld'
  );
  const signatureException = byId(
    customerVisibleReportFixtures,
    'customer_visible_report_alpha_signature_exception_summary'
  );

  assert.equal(published.publicationState, 'customer_report_published');
  assert.match(published.projectionNote, /filtered-view-only-not-second-formal-fsr-not-runtime-dto/);
  assert.equal(Array.isArray(published.allowedProjectionKeys), true);
  assert.equal(Array.isArray(published.forbiddenProjectionKeys), true);
  assertIncludesAll(
    published.forbiddenProjectionKeys,
    forbiddenCustomerFacingFields,
    'published forbidden projection keys'
  );

  assert.equal(internalDraft.publicationState, 'needs_review');
  assert.equal(internalDraft.expectedVisibility, 'internal_only');
  assert.match(internalDraft.withholdingReason, /unapproved-fsr-draft.*not-customer-visible/);

  assert.equal(signatureException.publicationState, 'customer_follow_up_required');
  assert.match(signatureException.forbiddenDetailPolicy, /no-raw-signature-binary-no-internal-engineer-comment/);
});

test('publication state static bundle has no obvious secret or real personal data values', () => {
  const serialized = JSON.stringify({
    customerAccessScenarios,
    customerFacingDtoAllowedFields,
    customerFacingDtoForbiddenFields,
    customerFacingDtoInvariantNotes,
    customerFacingPublishedDtoProposal,
    customerFacingPublicationStateDtoMapping,
    customerFacingSafeDenyDtoProposal,
    customerFacingUnavailableDtoProposal,
    customerIdentityAccessFixtures,
    customerIdentityPublicationAccessFixtures,
    customerIdentityRoleBoundaryFixtures,
    customerReportPublicationStates,
    customerVisibleFilteringInvariantNotes,
    customerVisibleReportFixtures,
    fixtureMarkerKeys: Object.keys(engineerMobileWorkbenchRepositorySyntheticFixture)
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

  assert.equal(customerFacingDtoForbiddenFields.includes('databaseConnectionConfigMarker'), true);
  assert.equal(customerFacingDtoForbiddenFields.includes('token'), true);
  assert.equal(customerFacingDtoForbiddenFields.includes('secret'), true);
});
