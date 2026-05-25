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

const fixture = engineerMobileWorkbenchRepositorySyntheticFixture;

const requiredGroups = [
  'customerVisibleReportFixtures',
  'customerVisibleAllowedKeys',
  'customerVisibleForbiddenKeys',
  'customerAccessScenarios',
  'customerReportPublicationStates',
  'customerIdentityVerificationScenarios',
  'customerVisibleFilteringInvariantNotes',
  'fieldServiceReports',
  'completionSubmissions',
  'safeDenyScenarios'
];

const requiredForbiddenInternalKeys = [
  'internalNote',
  'auditLog',
  'aiRawPayload',
  'providerRawPayload',
  'billingInternalData',
  'settlementInternalData',
  'rawPhotoBinary',
  'rawSignatureBinary',
  'token',
  'secret',
  'databaseConnectionConfigMarker'
];

const scenarioById = (id) => customerAccessScenarios.find((scenario) => scenario.id === id);

const stateByName = (stateName) =>
  customerReportPublicationStates.find((state) => state.state === stateName);

test('customer-facing visibility boundary fixture exposes required static groups', () => {
  for (const group of requiredGroups) {
    if (group === 'customerVisibleAllowedKeys' || group === 'customerVisibleForbiddenKeys') {
      continue;
    }

    assert.equal(
      Object.prototype.hasOwnProperty.call(fixture, group),
      true,
      `fixture must expose ${group}`
    );
  }

  assert.equal(Array.isArray(customerVisibleAllowedKeys), true);
  assert.equal(Array.isArray(customerVisibleForbiddenKeys), true);
  assert.equal(customerVisibleAllowedKeys.length > 0, true);
  assert.equal(customerVisibleForbiddenKeys.length > 0, true);
  assert.equal(fixture.fieldServiceReports.length > 0, true);
  assert.equal(fixture.completionSubmissions.length > 0, true);
  assert.equal(fixture.safeDenyScenarios.length > 0, true);
});

test('customer-facing allowed and forbidden key lists are explicit and disjoint', () => {
  const allowedSet = new Set(customerVisibleAllowedKeys);

  for (const forbiddenKey of customerVisibleForbiddenKeys) {
    assert.equal(allowedSet.has(forbiddenKey), false, `${forbiddenKey} must not be allowed`);
  }

  for (const key of requiredForbiddenInternalKeys) {
    assert.equal(
      customerVisibleForbiddenKeys.includes(key),
      true,
      `${key} must remain forbidden for customer-visible output`
    );
  }

  assert.equal(customerVisibleAllowedKeys.includes('reviewedResolutionSummary'), true);
  assert.equal(customerVisibleAllowedKeys.includes('customerFollowUpStatus'), true);
  assert.equal(customerVisibleAllowedKeys.includes('rawCompletionSubmissionPayload'), false);
  assert.equal(customerVisibleAllowedKeys.includes('unapprovedFsrDraft'), false);
});

test('published and unpublished customer-facing fixtures preserve publication boundary', () => {
  const published = customerVisibleReportFixtures.find(
    (report) => report.id === 'customer_visible_report_alpha_published_projection'
  );
  const unpublishedDraft = customerVisibleReportFixtures.find(
    (report) => report.id === 'customer_visible_report_alpha_internal_draft_withheld'
  );

  assert.ok(published);
  assert.equal(published.publicationState, 'customer_report_published');
  assert.deepEqual(published.allowedProjectionKeys, customerVisibleAllowedKeys);
  assert.match(published.projectionNote, /filtered-view-only/);
  assert.match(published.projectionNote, /not-second-formal-fsr/);
  assert.match(published.approvalNote, /future-formal-workflow-permission-and-publication-approval/);

  for (const key of published.allowedProjectionKeys) {
    assert.equal(customerVisibleForbiddenKeys.includes(key), false, `${key} cannot be forbidden`);
  }

  assert.ok(unpublishedDraft);
  assert.equal(unpublishedDraft.publicationState, 'needs_review');
  assert.equal(unpublishedDraft.expectedVisibility, 'internal_only');
  assert.match(unpublishedDraft.withholdingReason, /unapproved-fsr-draft/);
});

test('three-layer model keeps source-data formal FSR and customer-facing publication separate', () => {
  const notes = customerVisibleFilteringInvariantNotes.join(' ');
  const internalReport = fixture.fieldServiceReports.find(
    (report) => report.id === 'field_service_report_alpha_existing_formal'
  );

  assert.ok(internalReport);
  assert.equal(internalReport.invariant, 'one_case_one_formal_report');
  assert.match(notes, /completion-submission-source-data-is-internal-source-material/);
  assert.match(notes, /formal-field-service-report-remains-case-level-formal-report/);
  assert.match(notes, /customer-facing-service-report-is-filtered-view-not-second-formal-fsr/);
  assert.match(notes, /one-case-ultimately-has-one-formal-field-service-report/);
  assert.match(notes, /multiple-completion-submissions-do-not-create-multiple-formal-fsrs/);

  const approvedInternalFsr = stateByName('approved_internal_fsr');
  const publishedState = stateByName('customer_report_published');

  assert.ok(approvedInternalFsr);
  assert.match(approvedInternalFsr.note, /not-automatically-customer-visible/);
  assert.ok(publishedState);
  assert.match(publishedState.note, /explicit-future-workflow/);
});

test('customer identity and access scenarios require verified identity case linkage and org scope', () => {
  const verifiedPublished = scenarioById('verified_customer_view_published_report');
  const unverified = scenarioById('unverified_customer_safe_deny');
  const unlinked = scenarioById('customer_not_linked_to_case_safe_deny');
  const crossOrg = scenarioById('customer_from_other_organization_safe_deny');
  const unpublished = scenarioById('verified_customer_cannot_view_unpublished_fsr_draft');

  assert.ok(verifiedPublished);
  assert.match(verifiedPublished.expectedVisibility, /customer_visible_filtered_projection/);
  assert.match(verifiedPublished.organizationScopeMarker, /same-organization-and-linked-case/);

  for (const scenario of [unverified, unlinked, crossOrg, unpublished]) {
    assert.ok(scenario);
    assert.match(scenario.expectedVisibility, /safe_deny|not visible|pending/i);
    assert.match(scenario.safeDenyOrEscalationBehavior, /safe-deny|withhold/i);
    assert.match(scenario.forbiddenLeakageMarker, /no-/);
  }

  assert.equal(customerIdentityVerificationScenarios.length >= 4, true);
  assert.ok(
    customerIdentityVerificationScenarios.some(
      (scenario) =>
        scenario.verificationState === 'verified' &&
        scenario.caseLinkState === 'linked_to_case' &&
        /published_customer_report_only/.test(scenario.expectedAccessBoundary)
    )
  );
  assert.ok(
    customerIdentityVerificationScenarios.some(
      (scenario) =>
        scenario.caseLinkState === 'cross_organization_mismatch' &&
        /safe_deny/.test(scenario.expectedAccessBoundary)
    )
  );
});

test('complaint dispute and fee dispute scenarios require follow-up without exposing internal notes', () => {
  const complaint = scenarioById('complaint_or_low_rating_requires_follow_up_marker');
  const dispute = scenarioById('disputed_service_result_requires_human_follow_up');
  const feeDispute = scenarioById('fee_dispute_requires_human_follow_up');
  const aiDraft = scenarioById('ai_generated_summary_not_human_confirmed_internal_only');
  const notes = customerVisibleFilteringInvariantNotes.join(' ');

  assert.ok(complaint);
  assert.match(complaint.safeDenyOrEscalationBehavior, /follow-up-marker-not-auto-close/);
  assert.match(complaint.forbiddenLeakageMarker, /no-internal-riskindicator-or-ai-raw-payload/);

  assert.ok(dispute);
  assert.match(dispute.safeDenyOrEscalationBehavior, /human-follow-up-required/);
  assert.match(dispute.forbiddenLeakageMarker, /no-supervisor-review-note-or-internal-comment/);

  assert.ok(feeDispute);
  assert.match(feeDispute.safeDenyOrEscalationBehavior, /human-follow-up-required/);
  assert.match(feeDispute.forbiddenLeakageMarker, /no-billing-internal-or-settlement-internal-data/);

  assert.ok(aiDraft);
  assert.match(aiDraft.expectedVisibility, /internal_only/);
  assert.match(aiDraft.forbiddenLeakageMarker, /no-ai-raw-payload-no-ai-confidence-score/);
  assert.match(notes, /complaint-dispute-low-rating-requires-follow-up-marker-not-auto-close/);
});

test('serialized customer-facing visibility fixture has no obvious secret or personal data values', () => {
  const serialized = JSON.stringify({
    customerAccessScenarios,
    customerIdentityVerificationScenarios,
    customerReportPublicationStates,
    customerVisibleAllowedKeys,
    customerVisibleFilteringInvariantNotes,
    customerVisibleForbiddenKeys,
    customerVisibleReportFixtures,
    fieldServiceReports: fixture.fieldServiceReports,
    completionSubmissions: fixture.completionSubmissions,
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

  assert.equal(customerVisibleForbiddenKeys.includes('databaseConnectionConfigMarker'), true);
  assert.equal(customerVisibleForbiddenKeys.includes('token'), true);
  assert.equal(customerVisibleForbiddenKeys.includes('secret'), true);
});
