const assert = require('node:assert/strict');
const test = require('node:test');

const {
  customerAccessScenarios,
  customerIdentityVerificationScenarios,
  customerReportPublicationStates,
  customerVisibleAllowedKeys,
  customerVisibleFilteringInvariantNotes,
  customerVisibleForbiddenKeys,
  customerVisibleReportFixtures,
  engineerMobileWorkbenchRepositorySyntheticFixture
} = require('../../fixtures/engineerMobileWorkbench/repositorySynthetic.fixture');

const requiredFixtureObjectGroups = [
  'customerVisibleReportFixtures',
  'customerAccessScenarios',
  'customerReportPublicationStates',
  'customerIdentityVerificationScenarios',
  'customerVisibleFilteringInvariantNotes',
  'completionSubmissions',
  'fieldServiceReports',
  'safeDenyScenarios',
  'organizations',
  'cases',
  'appointments'
];

const requiredAllowedKeys = [
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
  'customerFollowUpStatus'
];

const requiredForbiddenKeys = [
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
  'crossOrganizationData'
];

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

const requiredAccessScenarioIds = [
  'verified_customer_view_published_report',
  'verified_customer_cannot_view_unpublished_fsr_draft',
  'unverified_customer_safe_deny',
  'customer_not_linked_to_case_safe_deny',
  'customer_from_other_organization_safe_deny',
  'complaint_or_low_rating_requires_follow_up_marker',
  'disputed_service_result_requires_human_follow_up',
  'fee_dispute_requires_human_follow_up',
  'ai_generated_summary_not_human_confirmed_internal_only',
  'signature_exception_customer_safe_summary_only'
];

const assertIncludesAll = (actualItems, expectedItems, label) => {
  for (const item of expectedItems) {
    assert.equal(actualItems.includes(item), true, `${label} must include ${item}`);
  }
};

test('customer-visible fixture extension exposes required groups without removing existing fixture groups', () => {
  for (const group of requiredFixtureObjectGroups) {
    assert.equal(
      Object.prototype.hasOwnProperty.call(engineerMobileWorkbenchRepositorySyntheticFixture, group),
      true,
      `fixture must expose ${group}`
    );
  }

  assert.ok(Array.isArray(customerVisibleAllowedKeys));
  assert.ok(Array.isArray(customerVisibleForbiddenKeys));
  assert.equal(customerVisibleReportFixtures.length >= 3, true);
  assert.equal(customerAccessScenarios.length >= requiredAccessScenarioIds.length, true);
  assert.equal(customerReportPublicationStates.length, requiredPublicationStates.length);
  assert.equal(customerIdentityVerificationScenarios.length >= 4, true);
  assert.equal(customerVisibleFilteringInvariantNotes.length >= 10, true);
});

test('customer-visible allowed keys are explicit proposal-only projection markers', () => {
  assertIncludesAll(customerVisibleAllowedKeys, requiredAllowedKeys, 'customerVisibleAllowedKeys');

  const serialized = JSON.stringify({
    customerVisibleReportFixtures,
    customerVisibleFilteringInvariantNotes
  });

  assert.match(serialized, /proposal-only/);
  assert.match(serialized, /source-data-is-internal-source-material/);
  assert.match(serialized, /future-formal-workflow-permission-and-publication-approval/);
  assert.match(serialized, /not-runtime-dto|not-a-customer-facing-dto/i);
});

test('customer-visible forbidden keys cover internal raw provider billing and secret markers', () => {
  assertIncludesAll(customerVisibleForbiddenKeys, requiredForbiddenKeys, 'customerVisibleForbiddenKeys');

  for (const marker of ['databaseConnectionConfigMarker', 'token', 'secret']) {
    assert.equal(customerVisibleForbiddenKeys.includes(marker), true);
  }

  const publishedFixture = customerVisibleReportFixtures.find(
    (fixture) => fixture.id === 'customer_visible_report_alpha_published_projection'
  );

  assert.ok(publishedFixture);
  assert.deepEqual(publishedFixture.allowedProjectionKeys, customerVisibleAllowedKeys);
  assert.deepEqual(publishedFixture.forbiddenProjectionKeys, customerVisibleForbiddenKeys);
});

test('customer access scenarios cover visibility safe-deny escalation and organization scope markers', () => {
  const scenarioIds = customerAccessScenarios.map((scenario) => scenario.id);

  assertIncludesAll(scenarioIds, requiredAccessScenarioIds, 'customerAccessScenarios');

  for (const scenario of customerAccessScenarios) {
    assert.equal(typeof scenario.id, 'string');
    assert.equal(typeof scenario.expectedVisibility, 'string');
    assert.equal(typeof scenario.safeDenyOrEscalationBehavior, 'string');
    assert.equal(typeof scenario.forbiddenLeakageMarker, 'string');
    assert.equal(typeof scenario.organizationScopeMarker, 'string');
    assert.match(scenario.piiPolicy, /no-raw-pii-no-credential-value/);
  }

  const crossOrgScenario = customerAccessScenarios.find(
    (scenario) => scenario.id === 'customer_from_other_organization_safe_deny'
  );
  const aiDraftScenario = customerAccessScenarios.find(
    (scenario) => scenario.id === 'ai_generated_summary_not_human_confirmed_internal_only'
  );

  assert.ok(crossOrgScenario);
  assert.match(crossOrgScenario.expectedVisibility, /safe_deny/);
  assert.match(crossOrgScenario.forbiddenLeakageMarker, /no-cross-organization-data/);
  assert.ok(aiDraftScenario);
  assert.match(aiDraftScenario.expectedVisibility, /internal_only/);
  assert.match(aiDraftScenario.forbiddenLeakageMarker, /no-ai-raw-payload-no-ai-confidence-score/);
});

test('customer report publication states remain proposal-only and require explicit publication workflow', () => {
  const states = customerReportPublicationStates.map((state) => state.state);
  const serialized = JSON.stringify(customerReportPublicationStates);

  assert.deepEqual(states, requiredPublicationStates);
  assert.match(serialized, /proposal-only-no-enum-no-db-field-no-runtime-transition/);
  assert.match(serialized, /approved-internal-fsr-is-not-automatically-customer-visible/);
  assert.match(serialized, /publication-must-be-explicit-future-workflow/);
});

test('customer-visible filtering invariants preserve formal report and source-data boundaries', () => {
  const notes = customerVisibleFilteringInvariantNotes.join(' ');

  assert.match(notes, /customer-facing-service-report-is-filtered-view-not-second-formal-fsr/);
  assert.match(notes, /completion-submission-source-data-is-internal-source-material/);
  assert.match(notes, /formal-field-service-report-remains-case-level-formal-report/);
  assert.match(notes, /one-case-ultimately-has-one-formal-field-service-report/);
  assert.match(notes, /multiple-completion-submissions-do-not-create-multiple-formal-fsrs/);
  assert.match(notes, /cannot-include-unapproved-draft-or-internal-only-data/);
  assert.match(notes, /ai-normalized-draft-cannot-be-customer-visible-unless-human-confirmed/);
  assert.match(notes, /customer-identity-must-be-verified/);
  assert.match(notes, /customer-must-be-linked-to-case/);
  assert.match(notes, /cross-organization-customer-access-must-safe-deny/);
  assert.match(notes, /complaint-dispute-low-rating-requires-follow-up-marker-not-auto-close/);
});

test('customer-visible fixture bundle has no obvious secret or real personal data values', () => {
  const serialized = JSON.stringify({
    customerAccessScenarios,
    customerIdentityVerificationScenarios,
    customerReportPublicationStates,
    customerVisibleAllowedKeys,
    customerVisibleFilteringInvariantNotes,
    customerVisibleForbiddenKeys,
    customerVisibleReportFixtures,
    engineerMobileWorkbenchRepositorySyntheticFixture
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

  assert.equal(customerVisibleForbiddenKeys.includes('databaseConnectionConfigMarker'), true);
  assert.equal(customerVisibleForbiddenKeys.includes('token'), true);
  assert.equal(customerVisibleForbiddenKeys.includes('secret'), true);
});
