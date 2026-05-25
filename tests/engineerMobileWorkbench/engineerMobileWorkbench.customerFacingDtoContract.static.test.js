const assert = require('node:assert/strict');
const test = require('node:test');

const {
  customerFacingDtoAllowedFields,
  customerFacingDtoForbiddenFields,
  customerFacingDtoInvariantNotes,
  customerFacingPublishedDtoProposal,
  customerFacingPublicationStateDtoMapping,
  customerFacingSafeDenyDtoProposal,
  customerFacingUnavailableDtoProposal,
  customerVisibleAllowedKeys,
  customerVisibleForbiddenKeys,
  customerAccessScenarios,
  customerReportPublicationStates,
  customerVisibleFilteringInvariantNotes,
  engineerMobileWorkbenchRepositorySyntheticFixture
} = require('../../fixtures/engineerMobileWorkbench/repositorySynthetic.fixture');

const requiredPublishedFields = [
  'status',
  'reportVersion',
  'caseDisplayId',
  'serviceDateSummary',
  'appointmentWindowSummary',
  'productSummary',
  'reportedIssueSummary',
  'reviewedWorkPerformedSummary',
  'reviewedResolutionSummary',
  'customerVisiblePartsSummary',
  'signatureStatusSummary',
  'signatureExceptionCustomerSafeSummary',
  'approvedPhotoEvidenceRefs',
  'publishedServiceStatus',
  'customerFollowUpStatus',
  'supportAction'
];

const requiredForbiddenFields = [
  'internalNote',
  'auditLog',
  'aiRawPayload',
  'aiConfidenceScore',
  'providerRawPayload',
  'billingInternalData',
  'settlementInternalData',
  'vendorSettlementRules',
  'internalEngineerComment',
  'supervisorReviewNote',
  'unconfirmedDispatchSuggestion',
  'unapprovedFsrDraft',
  'rawCompletionSubmissionPayload',
  'rawEngineerInputSnapshot',
  'validationResultSnapshot',
  'rejectedClientAuthorityFieldsSnapshot',
  'rawPhotoBinary',
  'rawSignatureBinary',
  'token',
  'secret',
  'databaseConnectionConfigMarker',
  'customerChannelIdentityInternals',
  'crossOrganizationData',
  'engineerPrivateContactDetails',
  'internalCostMarginData',
  'providerReconciliationData',
  'internalDisputeNotes',
  'internalFollowUpNotes'
];

const requiredFixtureGroups = [
  'customerFacingPublishedDtoProposal',
  'customerFacingUnavailableDtoProposal',
  'customerFacingSafeDenyDtoProposal',
  'customerFacingDtoAllowedFields',
  'customerFacingDtoForbiddenFields',
  'customerFacingPublicationStateDtoMapping',
  'customerFacingDtoInvariantNotes',
  'customerVisibleReportFixtures',
  'customerAccessScenarios',
  'customerReportPublicationStates',
  'customerVisibleFilteringInvariantNotes'
];

const assertIncludesAll = (actual, expected, label) => {
  for (const item of expected) {
    assert.equal(actual.includes(item), true, `${label} must include ${item}`);
  }
};

const mappingByState = (state) =>
  customerFacingPublicationStateDtoMapping.find((mapping) => mapping.state === state);

test('customer-facing DTO fixture extension exposes required marker groups', () => {
  for (const group of requiredFixtureGroups) {
    assert.equal(
      Object.prototype.hasOwnProperty.call(engineerMobileWorkbenchRepositorySyntheticFixture, group),
      true,
      `fixture must expose ${group}`
    );
  }

  assert.equal(Array.isArray(customerFacingDtoAllowedFields), true);
  assert.equal(Array.isArray(customerFacingDtoForbiddenFields), true);
  assert.equal(Array.isArray(customerFacingPublicationStateDtoMapping), true);
  assert.equal(Array.isArray(customerFacingDtoInvariantNotes), true);
  assert.equal(Array.isArray(customerVisibleAllowedKeys), true);
  assert.equal(Array.isArray(customerVisibleForbiddenKeys), true);
});

test('published DTO proposal covers allowed fields and remains proposal-only', () => {
  assertIncludesAll(
    Object.keys(customerFacingPublishedDtoProposal),
    requiredPublishedFields,
    'customerFacingPublishedDtoProposal'
  );
  assertIncludesAll(
    customerFacingDtoAllowedFields,
    requiredPublishedFields,
    'customerFacingDtoAllowedFields'
  );

  const notes = customerFacingPublishedDtoProposal.proposalNotes.join(' ');

  assert.match(notes, /synthetic-only/);
  assert.match(notes, /not-runtime-dto/);
  assert.match(notes, /not-api-response-implementation/);
  assert.match(notes, /not-raw-fsr-dump/);
  assert.match(notes, /not-raw-completion-submission-source-data/);
  assert.match(notes, /future-publication-permission-identity-checks/);
  assert.match(notes, /refs-only-not-raw-binary/);
  assert.match(notes, /must-not-expose-private-internal-staff-contact/);
  assert.equal(Array.isArray(customerFacingPublishedDtoProposal.approvedPhotoEvidenceRefs), true);
});

test('unavailable and safe-deny DTO proposals are generic customer-safe envelopes', () => {
  assertIncludesAll(
    Object.keys(customerFacingUnavailableDtoProposal),
    ['status', 'reasonCode', 'messageKey', 'canContactSupport', 'nextAction', 'followUpStatus'],
    'customerFacingUnavailableDtoProposal'
  );
  assert.equal(customerFacingUnavailableDtoProposal.status, 'not_available');

  const unavailableNotes = customerFacingUnavailableDtoProposal.proposalNotes.join(' ');

  assert.match(unavailableNotes, /does-not-reveal-internal-workflow-reason/);
  assert.match(unavailableNotes, /does-not-reveal-unpublished-draft-exists-if-unsafe/);
  assert.match(unavailableNotes, /does-not-reveal-internal-approval-status/);
  assert.match(unavailableNotes, /does-not-reveal-another-customer-organization-case-report-exists/);
  assert.match(unavailableNotes, /complaint-dispute-low-rating-can-route-to-customer-safe-follow-up/);

  assertIncludesAll(
    Object.keys(customerFacingSafeDenyDtoProposal),
    ['status', 'messageKey', 'safeDenyReasonClass', 'canRetry', 'supportAction'],
    'customerFacingSafeDenyDtoProposal'
  );
  assert.equal(customerFacingSafeDenyDtoProposal.status, 'not_available');

  const safeDenyNotes = customerFacingSafeDenyDtoProposal.proposalNotes.join(' ');

  assert.match(safeDenyNotes, /generic-safe-deny/);
  assert.match(safeDenyNotes, /no-resource-enumeration/);
  assert.match(safeDenyNotes, /no-organization-existence-leak/);
  assert.match(safeDenyNotes, /no-case-existence-leak/);
  assert.match(safeDenyNotes, /no-report-existence-leak/);
  assert.match(safeDenyNotes, /no-internal-reason-in-customer-facing-output/);
  assert.match(safeDenyNotes, /internal-audit-log-can-record-reason-in-future-but-not-dto/);
});

test('DTO allowed and forbidden field markers are explicit disjoint and marker-only', () => {
  assertIncludesAll(
    customerFacingDtoAllowedFields,
    requiredPublishedFields,
    'customerFacingDtoAllowedFields'
  );
  assertIncludesAll(
    customerFacingDtoForbiddenFields,
    requiredForbiddenFields,
    'customerFacingDtoForbiddenFields'
  );

  const allowedSet = new Set(customerFacingDtoAllowedFields);

  for (const forbiddenField of customerFacingDtoForbiddenFields) {
    assert.equal(allowedSet.has(forbiddenField), false, `${forbiddenField} must not be allowed`);
  }

  assert.equal(customerFacingDtoForbiddenFields.includes('databaseConnectionConfigMarker'), true);
  assert.equal(customerFacingDtoForbiddenFields.includes('token'), true);
  assert.equal(customerFacingDtoForbiddenFields.includes('secret'), true);
});

test('publication state mapping covers DTO behaviors without adding runtime semantics', () => {
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

  for (const [state, behaviorPattern] of expectedMappings) {
    const mapping = mappingByState(state);

    assert.ok(mapping, `${state} mapping must exist`);
    assert.match(mapping.dtoBehavior, behaviorPattern);
  }

  const serialized = JSON.stringify(customerFacingPublicationStateDtoMapping);

  assert.match(serialized, /proposal-only|mapping-proposal-only/);
  assert.match(serialized, /no-enum/);
  assert.match(serialized, /no-db-field/);
  assert.match(serialized, /no-runtime-transition/);
  assert.match(serialized, /no-api-behavior-change/);
});

test('DTO invariant notes preserve formal FSR source-data and customer-facing boundaries', () => {
  const notes = customerFacingDtoInvariantNotes.join(' ');

  assert.match(notes, /customer-facing-dto-is-filtered-publication-view/);
  assert.match(notes, /customer-facing-dto-is-not-a-second-formal-fsr/);
  assert.match(notes, /completion-submission-source-data-is-not-dto-source-directly/);
  assert.match(notes, /formal-fsr-remains-case-level-formal-report/);
  assert.match(notes, /one-case-ultimately-has-one-formal-fsr/);
  assert.match(
    notes,
    /multiple-completion-submissions-do-not-create-multiple-customer-facing-reports/
  );
  assert.match(notes, /final-appointment-id-remains-system-owned-and-not-customer-selectable/);
  assert.match(notes, /dto-creation-requires-verified-customer-identity/);
  assert.match(notes, /dto-creation-requires-customer-linked-to-case/);
  assert.match(notes, /dto-creation-requires-organization-scope-match/);
  assert.match(notes, /dto-creation-requires-publication-state-allows-customer-view/);
  assert.match(notes, /dto-must-not-expose-internal-only-fields/);
  assert.match(
    notes,
    /complaint-dispute-low-rating-requires-follow-up-marker-and-cannot-be-ai-auto-closed/
  );
});

test('customer-facing DTO fixture bundle has no obvious secret or real personal data values', () => {
  const serialized = JSON.stringify({
    customerFacingDtoAllowedFields,
    customerFacingDtoForbiddenFields,
    customerFacingDtoInvariantNotes,
    customerFacingPublishedDtoProposal,
    customerFacingPublicationStateDtoMapping,
    customerFacingSafeDenyDtoProposal,
    customerFacingUnavailableDtoProposal,
    customerVisibleAllowedKeys,
    customerVisibleForbiddenKeys,
    customerAccessScenarios,
    customerReportPublicationStates,
    customerVisibleFilteringInvariantNotes
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
