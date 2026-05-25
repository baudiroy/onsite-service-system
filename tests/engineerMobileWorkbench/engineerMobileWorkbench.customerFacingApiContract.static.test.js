const assert = require('node:assert/strict');
const test = require('node:test');

const {
  customerFacingApiContractProposal,
  customerFacingApiForbiddenOutputFields,
  customerFacingApiFsrInvariantMarkers,
  customerFacingApiIdentityChannelContractMarker,
  customerFacingApiRequestFlowMarkers,
  customerFacingApiSafeDenyEnvelopeProposal,
  customerFacingApiSuccessEnvelopeProposal
} = require('../../fixtures/engineerMobileWorkbench/repositorySynthetic.fixture');

const assertIncludesAll = (actual, expected, label) => {
  for (const item of expected) {
    assert.equal(actual.includes(item), true, `${label} must include ${item}`);
  }
};

test('customer-facing API contract proposal marker remains proposal-only with no runtime flags', () => {
  assert.equal(
    customerFacingApiContractProposal.preferredEndpoint,
    'GET /customer/cases/:caseId/service-report'
  );
  assert.equal(
    customerFacingApiContractProposal.alternativeEndpoint,
    'GET /customer/service-reports/:caseId'
  );
  assert.equal(customerFacingApiContractProposal.proposalOnly, true);

  for (const flag of [
    'routeRuntimeImplemented',
    'controllerRuntimeImplemented',
    'dtoRuntimeImplemented',
    'repositoryRuntimeImplemented',
    'dbQueryImplemented',
    'providerSendingImplemented'
  ]) {
    assert.equal(customerFacingApiContractProposal[flag], false, `${flag} must remain false`);
  }

  assertIncludesAll(
    customerFacingApiContractProposal.markerNotes,
    [
      'endpoint-proposal-only',
      'not-route-runtime',
      'not-controller-runtime',
      'not-dto-runtime',
      'not-db-query',
      'not-provider-sending'
    ],
    'customerFacingApiContractProposal.markerNotes'
  );
});

test('mandatory customer-facing API request flow preserves ordered checks and bypass prohibitions', () => {
  assert.deepEqual(customerFacingApiRequestFlowMarkers.orderedSteps, [
    'request',
    'auth-session-or-customer-channel-identity-context',
    'organization-scope-resolution',
    'customer-identity-verification',
    'customer-to-case-linkage-check',
    'publication-state-check',
    'customer-visible-projection-policy',
    'dto-or-response-envelope',
    'generic-unavailable-or-safe-deny-when-not-allowed'
  ]);

  assertIncludesAll(
    customerFacingApiRequestFlowMarkers.bypassProhibitions,
    [
      'controller-cannot-bypass-resolver',
      'resolver-cannot-bypass-organization-scope',
      'publication-state-cannot-bypass-identity-or-linkage',
      'projection-cannot-bypass-customer-visible-policy',
      'unavailable-denied-cannot-leak-case-report-organization-existence'
    ],
    'customerFacingApiRequestFlowMarkers.bypassProhibitions'
  );

  assertIncludesAll(
    customerFacingApiRequestFlowMarkers.markerNotes,
    ['static-request-flow-marker-only', 'no-runtime-resolver', 'no-controller', 'no-route', 'no-db'],
    'customerFacingApiRequestFlowMarkers.markerNotes'
  );
});

test('success envelope marker uses customer-facing allow-list and filtered projection boundaries', () => {
  assert.equal(customerFacingApiSuccessEnvelopeProposal.ok, true);
  assert.equal(
    customerFacingApiSuccessEnvelopeProposal.dataShape.serviceReport.publicationState,
    'customer_report_published'
  );
  assert.equal(
    customerFacingApiSuccessEnvelopeProposal.dataShape.serviceReport.followUp.required,
    false
  );
  assert.equal(
    customerFacingApiSuccessEnvelopeProposal.dataShape.serviceReport.followUp.customerVisibleReason,
    null
  );

  assertIncludesAll(
    customerFacingApiSuccessEnvelopeProposal.allowedFields,
    [
      'ok',
      'data',
      'caseId',
      'serviceReport',
      'publicationState',
      'serviceSummary',
      'serviceResult',
      'completedAt',
      'appointmentWindow',
      'productSummary',
      'technicianDisplayName',
      'customerSafeSignatureStatus',
      'followUp.required',
      'followUp.customerVisibleReason'
    ],
    'customerFacingApiSuccessEnvelopeProposal.allowedFields'
  );

  assertIncludesAll(
    customerFacingApiSuccessEnvelopeProposal.boundaryMarkers,
    [
      'customer-visible-only',
      'filtered-projection-only',
      'not-raw-db-row',
      'not-formal-fsr-raw-row',
      'not-second-formal-fsr'
    ],
    'customerFacingApiSuccessEnvelopeProposal.boundaryMarkers'
  );
});

test('safe-deny envelope marker is generic and non-enumerating', () => {
  assert.equal(customerFacingApiSafeDenyEnvelopeProposal.ok, false);
  assert.equal(customerFacingApiSafeDenyEnvelopeProposal.code, 'SERVICE_REPORT_UNAVAILABLE');
  assert.equal(
    customerFacingApiSafeDenyEnvelopeProposal.message,
    'The service report is not available.'
  );

  assertIncludesAll(
    customerFacingApiSafeDenyEnvelopeProposal.appliesToScenarioMarkers,
    [
      'cross-org',
      'wrong-customer',
      'unverified-identity',
      'unlinked-case',
      'unpublished-report',
      'internal-only-source-data',
      'withheld-or-disputed-not-customer-visible',
      'deleted-hidden-unavailable-report',
      'ambiguous-identity'
    ],
    'customerFacingApiSafeDenyEnvelopeProposal.appliesToScenarioMarkers'
  );

  assertIncludesAll(
    customerFacingApiSafeDenyEnvelopeProposal.forbiddenLeakageMarkers,
    [
      'no-case-existence-leak',
      'no-report-existence-leak',
      'no-organization-existence-leak',
      'no-internal-approval-status-leak',
      'no-internal-publication-reason-leak',
      'no-internal-dispute-reason-leak'
    ],
    'customerFacingApiSafeDenyEnvelopeProposal.forbiddenLeakageMarkers'
  );
});

test('forbidden output marker blocks internal and sensitive fields from customer-facing API output', () => {
  assertIncludesAll(
    customerFacingApiForbiddenOutputFields,
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
      'unconfirmedAiAssumptions',
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
    'customerFacingApiForbiddenOutputFields'
  );
});

test('formal FSR invariant markers prevent read API from mutating completion or formal report state', () => {
  assertIncludesAll(
    customerFacingApiFsrInvariantMarkers,
    [
      'future-api-read-cannot-create-formal-fsr',
      'future-api-read-cannot-approve-formal-fsr',
      'future-api-read-cannot-publish-formal-fsr',
      'future-api-read-cannot-create-second-formal-fsr',
      'future-api-read-cannot-modify-completion-source-data',
      'future-api-read-cannot-modify-final-appointment-id',
      'future-api-read-cannot-treat-completion-submission-as-case-completed',
      'customer-facing-report-is-filtered-publication-view-only'
    ],
    'customerFacingApiFsrInvariantMarkers'
  );
});

test('identity and channel contract marker requires scoped verified linked published access', () => {
  assert.equal(customerFacingApiIdentityChannelContractMarker.lineIsNotGlobalIdentity, true);
  assert.equal(
    customerFacingApiIdentityChannelContractMarker.organizationLineChannelLineUserAloneIsInsufficient,
    true
  );
  assert.equal(customerFacingApiIdentityChannelContractMarker.phoneAloneIsInsufficient, true);
  assert.equal(customerFacingApiIdentityChannelContractMarker.addressAloneIsInsufficient, true);
  assert.equal(customerFacingApiIdentityChannelContractMarker.rawLineIdAloneIsInsufficient, true);

  assertIncludesAll(
    customerFacingApiIdentityChannelContractMarker.requiredAccessConditions,
    [
      'organization-scope',
      'verified-customer-identity',
      'linked-case',
      'publication-allowed',
      'customer-visible-policy-filtered'
    ],
    'customerFacingApiIdentityChannelContractMarker.requiredAccessConditions'
  );

  assertIncludesAll(
    customerFacingApiIdentityChannelContractMarker.markerNotes,
    [
      'identity-channel-contract-marker-only',
      'not-runtime-identity-check',
      'not-customer-facing-api-runtime'
    ],
    'customerFacingApiIdentityChannelContractMarker.markerNotes'
  );
});

test('customer-facing API contract marker bundle has no obvious secret or real personal data values', () => {
  const serialized = JSON.stringify({
    customerFacingApiContractProposal,
    customerFacingApiForbiddenOutputFields,
    customerFacingApiFsrInvariantMarkers,
    customerFacingApiIdentityChannelContractMarker,
    customerFacingApiRequestFlowMarkers,
    customerFacingApiSafeDenyEnvelopeProposal,
    customerFacingApiSuccessEnvelopeProposal
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
