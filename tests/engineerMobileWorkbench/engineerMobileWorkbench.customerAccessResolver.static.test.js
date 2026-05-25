const assert = require('node:assert/strict');
const test = require('node:test');

const {
  customerAccessResolverAuditMetadataBoundaryMarker,
  customerAccessResolverContractProposal,
  customerAccessResolverDecisionMatrixMarkers,
  customerAccessResolverDecisionOrderMarkers,
  customerAccessResolverForbiddenAuthorizationFields,
  customerAccessResolverFsrInvariantMarkers,
  customerAccessResolverInputContractMarkers,
  customerAccessResolverOutputContractMarkers,
  customerAccessResolverSafeDenyContractMarker
} = require('../../fixtures/engineerMobileWorkbench/repositorySynthetic.fixture');

const assertIncludesAll = (actual, expected, label) => {
  for (const item of expected) {
    assert.equal(actual.includes(item), true, `${label} must include ${item}`);
  }
};

const byScenario = (scenario) =>
  customerAccessResolverDecisionMatrixMarkers.find((marker) => marker.scenario === scenario);

test('resolver contract proposal marker remains proposal-only with no runtime flags', () => {
  assert.equal(customerAccessResolverContractProposal.proposalOnly, true);

  for (const flag of [
    'resolverRuntimeImplemented',
    'apiRuntimeImplemented',
    'dtoRuntimeImplemented',
    'repositoryRuntimeImplemented',
    'dbQueryImplemented',
    'providerSendingImplemented',
    'aiRagImplemented'
  ]) {
    assert.equal(customerAccessResolverContractProposal[flag], false, `${flag} must remain false`);
  }

  assertIncludesAll(
    customerAccessResolverContractProposal.markerNotes,
    [
      'resolver-contract-proposal-only',
      'not-resolver-runtime',
      'not-api-runtime',
      'not-dto-runtime',
      'not-db-query',
      'not-provider-sending',
      'not-ai-rag'
    ],
    'customerAccessResolverContractProposal.markerNotes'
  );
});

test('resolver input contract markers preserve context boundaries', () => {
  assertIncludesAll(
    customerAccessResolverInputContractMarkers.inputConcepts,
    [
      'requestContext',
      'organizationContext',
      'customerIdentityContext',
      'caseReference',
      'channelContext',
      'publicationContext'
    ],
    'customerAccessResolverInputContractMarkers.inputConcepts'
  );

  assertIncludesAll(
    customerAccessResolverInputContractMarkers.boundaryMarkers,
    [
      'request-session-metadata-must-not-include-token-or-secret',
      'organization-context-must-be-organization-scoped',
      'customer-identity-context-must-be-verified',
      'case-reference-cannot-directly-authorize',
      'line-sms-web-app-are-entry-channels-not-global-identity',
      'publication-context-only-checks-customer-visible-not-formal-fsr-approval'
    ],
    'customerAccessResolverInputContractMarkers.boundaryMarkers'
  );
});

test('resolver output contract markers preserve safe-deny and audit-ready boundaries', () => {
  assertIncludesAll(
    customerAccessResolverOutputContractMarkers.decisions,
    ['allow', 'unavailable'],
    'customerAccessResolverOutputContractMarkers.decisions'
  );
  assert.equal(customerAccessResolverOutputContractMarkers.customerVisible, 'boolean-marker');
  assert.equal(customerAccessResolverOutputContractMarkers.safeDenyCode, 'SERVICE_REPORT_UNAVAILABLE');
  assert.equal(customerAccessResolverOutputContractMarkers.projectionAllowed, 'boolean-marker');
  assert.equal(
    customerAccessResolverOutputContractMarkers.auditReadyMetadata,
    'future-internal-concept-only'
  );

  assertIncludesAll(
    customerAccessResolverOutputContractMarkers.boundaryMarkers,
    [
      'customer-facing-response-only-gets-generic-unavailable',
      'internal-denial-reason-not-customer-facing',
      'allow-only-enters-customer-visible-projection-not-raw-fsr',
      'unavailable-does-not-reveal-case-report-organization-existence',
      'audit-ready-metadata-is-not-audit-runtime'
    ],
    'customerAccessResolverOutputContractMarkers.boundaryMarkers'
  );
});

test('resolver decision order markers keep organization identity linkage and publication checks ordered', () => {
  assert.deepEqual(customerAccessResolverDecisionOrderMarkers.orderedSteps, [
    'request-context',
    'organization-scope-check',
    'customer-identity-verification-check',
    'customer-to-case-linkage-check',
    'publication-state-check',
    'customer-visible-policy-gate',
    'allow-customer-facing-projection-or-generic-unavailable-safe-deny'
  ]);

  assertIncludesAll(
    customerAccessResolverDecisionOrderMarkers.boundaryMarkers,
    [
      'organization-scope-before-linkage',
      'identity-verification-cannot-rely-on-phone-address-raw-line-id',
      'publication-state-cannot-bypass-identity-linkage',
      'denied-unavailable-cannot-leak-case-report-organization-existence',
      'resolver-output-cannot-send-internal-denial-reason-to-customer-facing-response'
    ],
    'customerAccessResolverDecisionOrderMarkers.boundaryMarkers'
  );
});

test('resolver decision matrix markers cover allow and unavailable scenarios', () => {
  const expectedScenarios = new Map([
    ['same-org-verified-identity-linked-case-published-report', ['allow', 'success-projection-allowed']],
    ['same-org-verified-identity-linked-case-unpublished-report', ['unavailable', 'generic-unavailable']],
    ['same-org-unverified-identity-linked-case-published-report', ['unavailable', 'generic-unavailable']],
    ['same-org-verified-identity-unlinked-case-published-report', ['unavailable', 'generic-unavailable']],
    ['cross-org-verified-identity-linked-looking-case', ['unavailable', 'generic-unavailable']],
    ['phone-only-match', ['unavailable', 'generic-unavailable']],
    ['address-only-match', ['unavailable', 'generic-unavailable']],
    ['raw-line-id-only', ['unavailable', 'generic-unavailable']],
    ['disputed-or-withheld-not-customer-visible', ['unavailable', 'generic-unavailable']],
    [
      'follow-up-required-customer-visible-publication-allowed',
      ['allow', 'success-projection-with-customer-visible-follow-up-summary']
    ]
  ]);

  for (const [scenario, [decision, response]] of expectedScenarios) {
    const marker = byScenario(scenario);

    assert.ok(marker, `${scenario} marker must exist`);
    assert.equal(marker.decision, decision);
    assert.equal(marker.customerFacingResponse, response);
  }
});

test('resolver safe-deny contract marker is generic and non-leaking', () => {
  assert.equal(customerAccessResolverSafeDenyContractMarker.ok, false);
  assert.equal(customerAccessResolverSafeDenyContractMarker.code, 'SERVICE_REPORT_UNAVAILABLE');
  assert.equal(
    customerAccessResolverSafeDenyContractMarker.message,
    'The service report is not available.'
  );

  assertIncludesAll(
    customerAccessResolverSafeDenyContractMarker.forbiddenLeakageMarkers,
    [
      'no-case-existence-leak',
      'no-report-existence-leak',
      'no-organization-existence-leak',
      'no-customer-matching-failure-detail',
      'no-internal-approval-status',
      'no-internal-publication-reason',
      'no-internal-dispute-reason',
      'no-internal-audit-reason',
      'no-ai-confidence',
      'no-ai-raw-output'
    ],
    'customerAccessResolverSafeDenyContractMarker.forbiddenLeakageMarkers'
  );
});

test('internal audit-ready metadata marker stays internal and sensitive-data-free', () => {
  assertIncludesAll(
    customerAccessResolverAuditMetadataBoundaryMarker.internalOnlyMetadataConcepts,
    [
      'decision-category',
      'evaluated-checks',
      'fail-closed-reason-category',
      'organization-scope-check-result',
      'identity-verification-check-result',
      'linkage-check-result',
      'publication-state-check-result'
    ],
    'customerAccessResolverAuditMetadataBoundaryMarker.internalOnlyMetadataConcepts'
  );

  assertIncludesAll(
    customerAccessResolverAuditMetadataBoundaryMarker.boundaryMarkers,
    [
      'not-customer-facing-api-output',
      'no-token-secret-raw-provider-payload',
      'no-full-raw-phone-address-line-id',
      'no-cross-org-data',
      'no-ai-raw-payload',
      'no-internal-note-full-text'
    ],
    'customerAccessResolverAuditMetadataBoundaryMarker.boundaryMarkers'
  );
});

test('resolver FSR invariant markers prevent resolver from mutating formal completion state', () => {
  assertIncludesAll(
    customerAccessResolverFsrInvariantMarkers,
    [
      'resolver-cannot-create-formal-fsr',
      'resolver-cannot-approve-formal-fsr',
      'resolver-cannot-publish-formal-fsr',
      'resolver-cannot-create-second-formal-fsr',
      'resolver-cannot-modify-completion-source-data',
      'resolver-cannot-modify-final-appointment-id',
      'resolver-cannot-treat-completion-submission-as-case-completed',
      'publication-allowed-does-not-equal-formal-fsr-approval',
      'customer-facing-service-report-is-filtered-publication-view-only'
    ],
    'customerAccessResolverFsrInvariantMarkers'
  );
});

test('resolver customer-visible data policy marker forbids internal and sensitive authorization fields', () => {
  assertIncludesAll(
    customerAccessResolverForbiddenAuthorizationFields,
    [
      'internalNote',
      'auditLog',
      'aiRawPayload',
      'billingInternalData',
      'settlementInternalData',
      'internalEngineerComment',
      'supervisorReviewApprovalData',
      'providerRawPayload',
      'token',
      'secret',
      'databaseConnectionConfigMarker',
      'rawLineIdentifiers',
      'rawPhoneUnlessMaskedAndCustomerVisible',
      'rawAddressUnlessMaskedAndCustomerVisible',
      'customerChannelIdentityInternals',
      'crossOrganizationData',
      'rawCompletionSubmission',
      'rawEngineerInput',
      'rawPhotosUnlessMediatedByFutureFileAccessPolicy',
      'rawSignaturesUnlessMediatedByFutureFileAccessPolicy',
      'rawFileRefsUnlessMediatedByFutureFileAccessPolicy',
      'vendorRules',
      'internalCost',
      'internalMargin',
      'settlementFormula',
      'internalDisputeNotes',
      'internalFollowUpNotes',
      'unconfirmedDispatchSuggestions',
      'internalRiskFlags'
    ],
    'customerAccessResolverForbiddenAuthorizationFields'
  );
});

test('customer access resolver marker bundle has no obvious secret or real personal data values', () => {
  const serialized = JSON.stringify({
    customerAccessResolverAuditMetadataBoundaryMarker,
    customerAccessResolverContractProposal,
    customerAccessResolverDecisionMatrixMarkers,
    customerAccessResolverDecisionOrderMarkers,
    customerAccessResolverForbiddenAuthorizationFields,
    customerAccessResolverFsrInvariantMarkers,
    customerAccessResolverInputContractMarkers,
    customerAccessResolverOutputContractMarkers,
    customerAccessResolverSafeDenyContractMarker
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
});
