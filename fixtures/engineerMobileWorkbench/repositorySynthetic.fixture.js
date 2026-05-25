const repositorySyntheticFixtureInvariantNotes = Object.freeze([
  'source-data-only',
  'not-formal-field-service-report',
  'not-case-completed',
  'multiple-submissions-do-not-create-multiple-formal-reports',
  'no-survey-provider-billing-settlement-ai-approval-trigger',
  'final-appointment-id-is-system-owned',
  'line-identity-is-not-global-identity'
]);

const repositorySyntheticFixtureForbiddenKeys = Object.freeze([
  'organizationId',
  'engineerProfileId',
  'finalAppointmentId',
  'caseCompleted',
  'formalFieldServiceReportApproved',
  'rawFileBinary',
  'rawPhotoBinary',
  'rawSignatureBinary',
  'providerPayload',
  'aiRawPayload',
  'internalNote',
  'auditLog',
  'billingInternalData',
  'settlementInternalData'
]);

const customerVisibleAllowedKeys = Object.freeze([
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
]);

const customerVisibleForbiddenKeys = Object.freeze([
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
]);

const customerReportPublicationStates = Object.freeze([
  Object.freeze({
    state: 'draft_internal',
    visibility: 'internal_only',
    note: 'proposal-only-no-enum-no-db-field-no-runtime-transition'
  }),
  Object.freeze({
    state: 'source_data_submitted',
    visibility: 'internal_only',
    note: 'completion-submission-source-data-is-not-customer-visible'
  }),
  Object.freeze({
    state: 'needs_review',
    visibility: 'internal_only',
    note: 'review-needed-before-any-customer-facing-view'
  }),
  Object.freeze({
    state: 'approved_internal_fsr',
    visibility: 'internal_only-by-default',
    note: 'approved-internal-fsr-is-not-automatically-customer-visible'
  }),
  Object.freeze({
    state: 'customer_report_published',
    visibility: 'customer_visible_after-explicit-future-workflow',
    note: 'publication-must-be-explicit-future-workflow'
  }),
  Object.freeze({
    state: 'customer_report_withheld',
    visibility: 'withheld',
    note: 'withheld-report-remains-internal-until-human-follow-up'
  }),
  Object.freeze({
    state: 'customer_follow_up_required',
    visibility: 'customer-safe-status-only',
    note: 'follow-up-required-marker-does-not-publish-internal-details'
  }),
  Object.freeze({
    state: 'disputed',
    visibility: 'customer-safe-status-only',
    note: 'dispute-marker-requires-human-follow-up'
  })
]);

const customerVisibleFilteringInvariantNotes = Object.freeze([
  'customer-facing-service-report-is-filtered-view-not-second-formal-fsr',
  'completion-submission-source-data-is-internal-source-material',
  'formal-field-service-report-remains-case-level-formal-report',
  'one-case-ultimately-has-one-formal-field-service-report',
  'multiple-completion-submissions-do-not-create-multiple-formal-fsrs',
  'customer-facing-report-cannot-include-unapproved-draft-or-internal-only-data',
  'ai-normalized-draft-cannot-be-customer-visible-unless-human-confirmed-and-approved-through-future-workflow',
  'customer-identity-must-be-verified-before-customer-facing-report-access',
  'customer-must-be-linked-to-case',
  'cross-organization-customer-access-must-safe-deny',
  'complaint-dispute-low-rating-requires-follow-up-marker-not-auto-close',
  'allowed-keys-are-proposal-only-and-not-a-customer-facing-dto',
  'allowed-key-still-requires-future-formal-workflow-permission-and-publication-approval'
]);

const customerIdentityVerificationScenarios = Object.freeze([
  Object.freeze({
    id: 'customer_identity_verified_case_linked',
    organizationId: 'org_alpha_service',
    caseId: 'case_alpha_primary',
    verificationState: 'verified',
    caseLinkState: 'linked_to_case',
    expectedAccessBoundary: 'may_view_published_customer_report_only',
    piiPolicy: 'no-raw-phone-email-line-id'
  }),
  Object.freeze({
    id: 'customer_identity_unverified',
    organizationId: 'org_alpha_service',
    caseId: 'case_alpha_primary',
    verificationState: 'unverified',
    caseLinkState: 'not_evaluated',
    expectedAccessBoundary: 'safe_deny',
    piiPolicy: 'no-existence-leak'
  }),
  Object.freeze({
    id: 'customer_identity_verified_not_linked',
    organizationId: 'org_alpha_service',
    caseId: 'case_alpha_primary',
    verificationState: 'verified',
    caseLinkState: 'not_linked_to_case',
    expectedAccessBoundary: 'safe_deny',
    piiPolicy: 'no-case-linkage-leak'
  }),
  Object.freeze({
    id: 'customer_identity_cross_org',
    organizationId: 'org_beta_service',
    caseId: 'case_alpha_primary',
    verificationState: 'verified',
    caseLinkState: 'cross_organization_mismatch',
    expectedAccessBoundary: 'safe_deny',
    piiPolicy: 'no-cross-organization-data'
  })
]);

const customerFacingDtoAllowedFields = Object.freeze([
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
]);

const customerFacingDtoForbiddenFields = Object.freeze([
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
]);

const customerFacingPublishedDtoProposal = Object.freeze({
  marker: 'customer-facing-published-dto-proposal',
  status: 'published',
  reportVersion: 'proposal-only-version',
  caseDisplayId: 'synthetic-case-display-id',
  serviceDateSummary: 'synthetic-customer-safe-service-date-summary',
  appointmentWindowSummary: 'synthetic-customer-safe-appointment-window-summary',
  productSummary: 'synthetic-customer-safe-product-summary',
  reportedIssueSummary: 'synthetic-customer-safe-reported-issue-summary',
  reviewedWorkPerformedSummary: 'synthetic-human-reviewed-work-performed-summary',
  reviewedResolutionSummary: 'synthetic-human-reviewed-resolution-summary',
  customerVisiblePartsSummary: 'synthetic-customer-safe-parts-summary',
  signatureStatusSummary: 'synthetic-customer-safe-signature-status-summary',
  signatureExceptionCustomerSafeSummary: 'synthetic-customer-safe-signature-exception-summary',
  approvedPhotoEvidenceRefs: Object.freeze(['synthetic-approved-photo-ref-only']),
  publishedServiceStatus: 'synthetic-customer-safe-published-status',
  customerFollowUpStatus: 'synthetic-customer-safe-follow-up-status',
  supportAction: 'synthetic-customer-safe-support-action',
  proposalNotes: Object.freeze([
    'published-dto-proposal-is-synthetic-only',
    'not-runtime-dto',
    'not-api-response-implementation',
    'not-raw-fsr-dump',
    'not-raw-completion-submission-source-data',
    'allowed-fields-require-future-publication-permission-identity-checks',
    'approved-photo-evidence-refs-are-refs-only-not-raw-binary',
    'support-action-must-not-expose-private-internal-staff-contact'
  ])
});

const customerFacingUnavailableDtoProposal = Object.freeze({
  marker: 'customer-facing-unavailable-dto-proposal',
  status: 'not_available',
  reasonCode: 'generic_customer_safe_reason',
  messageKey: 'customer_report_not_available',
  canContactSupport: true,
  nextAction: 'synthetic-customer-safe-next-action',
  followUpStatus: 'synthetic-customer-safe-follow-up-status',
  proposalNotes: Object.freeze([
    'unavailable-response-does-not-reveal-internal-workflow-reason',
    'does-not-reveal-unpublished-draft-exists-if-unsafe',
    'does-not-reveal-internal-approval-status',
    'does-not-reveal-another-customer-organization-case-report-exists',
    'complaint-dispute-low-rating-can-route-to-customer-safe-follow-up'
  ])
});

const customerFacingSafeDenyDtoProposal = Object.freeze({
  marker: 'customer-facing-safe-deny-dto-proposal',
  status: 'not_available',
  messageKey: 'resource_not_available',
  safeDenyReasonClass: 'generic-safe-deny',
  canRetry: false,
  supportAction: 'synthetic-customer-safe-support-action',
  proposalNotes: Object.freeze([
    'generic-safe-deny',
    'no-resource-enumeration',
    'no-organization-existence-leak',
    'no-case-existence-leak',
    'no-report-existence-leak',
    'no-internal-reason-in-customer-facing-output',
    'internal-audit-log-can-record-reason-in-future-but-not-dto'
  ])
});

const customerFacingPublicationStateDtoMapping = Object.freeze([
  Object.freeze({
    state: 'draft_internal',
    dtoBehavior: 'not_customer_visible',
    note: 'mapping-proposal-only-no-enum-no-db-field-no-runtime-transition-no-api-behavior-change'
  }),
  Object.freeze({
    state: 'source_data_submitted',
    dtoBehavior: 'not_customer_visible',
    note: 'source-data-is-not-customer-facing-dto'
  }),
  Object.freeze({
    state: 'needs_review',
    dtoBehavior: 'unavailable_or_optional_follow_up',
    note: 'review-needed-before-customer-facing-publication'
  }),
  Object.freeze({
    state: 'approved_internal_fsr',
    dtoBehavior: 'not_automatically_customer_visible',
    note: 'internal-approval-does-not-publish-customer-dto'
  }),
  Object.freeze({
    state: 'customer_report_published',
    dtoBehavior: 'published_dto_allowed',
    note: 'explicit-publication-state-required'
  }),
  Object.freeze({
    state: 'customer_report_withheld',
    dtoBehavior: 'unavailable_or_follow_up',
    note: 'withheld-report-remains-customer-safe'
  }),
  Object.freeze({
    state: 'customer_follow_up_required',
    dtoBehavior: 'limited_follow_up_dto',
    note: 'follow-up-dto-must-be-customer-safe'
  }),
  Object.freeze({
    state: 'disputed',
    dtoBehavior: 'follow_up_or_human_handling',
    note: 'dispute-state-must-not-expose-internal-dispute-notes'
  })
]);

const customerFacingDtoInvariantNotes = Object.freeze([
  'customer-facing-dto-is-filtered-publication-view',
  'customer-facing-dto-is-not-a-second-formal-fsr',
  'completion-submission-source-data-is-not-dto-source-directly',
  'formal-fsr-remains-case-level-formal-report',
  'one-case-ultimately-has-one-formal-fsr',
  'multiple-completion-submissions-do-not-create-multiple-customer-facing-reports-unless-future-versioning-rules-define-it',
  'final-appointment-id-remains-system-owned-and-not-customer-selectable',
  'dto-creation-requires-verified-customer-identity',
  'dto-creation-requires-customer-linked-to-case',
  'dto-creation-requires-organization-scope-match',
  'dto-creation-requires-publication-state-allows-customer-view',
  'dto-must-not-expose-internal-only-fields',
  'complaint-dispute-low-rating-requires-follow-up-marker-and-cannot-be-ai-auto-closed'
]);

const customerFacingApiContractProposal = Object.freeze({
  preferredEndpoint: 'GET /customer/cases/:caseId/service-report',
  alternativeEndpoint: 'GET /customer/service-reports/:caseId',
  proposalOnly: true,
  routeRuntimeImplemented: false,
  controllerRuntimeImplemented: false,
  dtoRuntimeImplemented: false,
  repositoryRuntimeImplemented: false,
  dbQueryImplemented: false,
  providerSendingImplemented: false,
  markerNotes: Object.freeze([
    'endpoint-proposal-only',
    'case-level-customer-facing-read-proposal',
    'not-route-runtime',
    'not-controller-runtime',
    'not-dto-runtime',
    'not-db-query',
    'not-provider-sending'
  ])
});

const customerFacingApiRequestFlowMarkers = Object.freeze({
  orderedSteps: Object.freeze([
    'request',
    'auth-session-or-customer-channel-identity-context',
    'organization-scope-resolution',
    'customer-identity-verification',
    'customer-to-case-linkage-check',
    'publication-state-check',
    'customer-visible-projection-policy',
    'dto-or-response-envelope',
    'generic-unavailable-or-safe-deny-when-not-allowed'
  ]),
  bypassProhibitions: Object.freeze([
    'controller-cannot-bypass-resolver',
    'resolver-cannot-bypass-organization-scope',
    'publication-state-cannot-bypass-identity-or-linkage',
    'projection-cannot-bypass-customer-visible-policy',
    'unavailable-denied-cannot-leak-case-report-organization-existence'
  ]),
  markerNotes: Object.freeze([
    'static-request-flow-marker-only',
    'no-runtime-resolver',
    'no-controller',
    'no-route',
    'no-db'
  ])
});

const customerFacingApiSuccessEnvelopeProposal = Object.freeze({
  marker: 'customer-facing-api-success-envelope-proposal',
  ok: true,
  dataShape: Object.freeze({
    caseId: 'customer-visible-case-reference',
    serviceReport: Object.freeze({
      publicationState: 'customer_report_published',
      serviceSummary: 'customer-visible-service-summary',
      serviceResult: 'customer-visible-service-result',
      completedAt: 'customer-visible-completed-at',
      appointmentWindow: 'customer-visible-appointment-window',
      productSummary: 'customer-visible-product-summary',
      technicianDisplayName: 'customer-visible-technician-display-name',
      customerSafeSignatureStatus: 'customer-visible-signature-status',
      followUp: Object.freeze({
        required: false,
        customerVisibleReason: null
      })
    })
  }),
  allowedFields: Object.freeze([
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
  ]),
  boundaryMarkers: Object.freeze([
    'customer-visible-only',
    'filtered-projection-only',
    'not-raw-db-row',
    'not-formal-fsr-raw-row',
    'not-second-formal-fsr'
  ])
});

const customerFacingApiSafeDenyEnvelopeProposal = Object.freeze({
  marker: 'customer-facing-api-safe-deny-envelope-proposal',
  ok: false,
  code: 'SERVICE_REPORT_UNAVAILABLE',
  message: 'The service report is not available.',
  appliesToScenarioMarkers: Object.freeze([
    'cross-org',
    'wrong-customer',
    'unverified-identity',
    'unlinked-case',
    'unpublished-report',
    'internal-only-source-data',
    'withheld-or-disputed-not-customer-visible',
    'deleted-hidden-unavailable-report',
    'ambiguous-identity'
  ]),
  forbiddenLeakageMarkers: Object.freeze([
    'no-case-existence-leak',
    'no-report-existence-leak',
    'no-organization-existence-leak',
    'no-internal-approval-status-leak',
    'no-internal-publication-reason-leak',
    'no-internal-dispute-reason-leak'
  ])
});

const customerFacingApiForbiddenOutputFields = Object.freeze([
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
]);

const customerFacingApiFsrInvariantMarkers = Object.freeze([
  'future-api-read-cannot-create-formal-fsr',
  'future-api-read-cannot-approve-formal-fsr',
  'future-api-read-cannot-publish-formal-fsr',
  'future-api-read-cannot-create-second-formal-fsr',
  'future-api-read-cannot-modify-completion-source-data',
  'future-api-read-cannot-modify-final-appointment-id',
  'future-api-read-cannot-treat-completion-submission-as-case-completed',
  'customer-facing-report-is-filtered-publication-view-only'
]);

const customerFacingApiIdentityChannelContractMarker = Object.freeze({
  lineIsNotGlobalIdentity: true,
  organizationLineChannelLineUserAloneIsInsufficient: true,
  phoneAloneIsInsufficient: true,
  addressAloneIsInsufficient: true,
  rawLineIdAloneIsInsufficient: true,
  requiredAccessConditions: Object.freeze([
    'organization-scope',
    'verified-customer-identity',
    'linked-case',
    'publication-allowed',
    'customer-visible-policy-filtered'
  ]),
  markerNotes: Object.freeze([
    'identity-channel-contract-marker-only',
    'not-runtime-identity-check',
    'not-customer-facing-api-runtime'
  ])
});

const customerAccessResolverContractProposal = Object.freeze({
  proposalOnly: true,
  resolverRuntimeImplemented: false,
  apiRuntimeImplemented: false,
  dtoRuntimeImplemented: false,
  repositoryRuntimeImplemented: false,
  dbQueryImplemented: false,
  providerSendingImplemented: false,
  aiRagImplemented: false,
  markerNotes: Object.freeze([
    'resolver-contract-proposal-only',
    'not-resolver-runtime',
    'not-api-runtime',
    'not-dto-runtime',
    'not-db-query',
    'not-provider-sending',
    'not-ai-rag'
  ])
});

const customerAccessResolverInputContractMarkers = Object.freeze({
  inputConcepts: Object.freeze([
    'requestContext',
    'organizationContext',
    'customerIdentityContext',
    'caseReference',
    'channelContext',
    'publicationContext'
  ]),
  boundaryMarkers: Object.freeze([
    'request-session-metadata-must-not-include-token-or-secret',
    'organization-context-must-be-organization-scoped',
    'customer-identity-context-must-be-verified',
    'case-reference-cannot-directly-authorize',
    'line-sms-web-app-are-entry-channels-not-global-identity',
    'publication-context-only-checks-customer-visible-not-formal-fsr-approval'
  ])
});

const customerAccessResolverOutputContractMarkers = Object.freeze({
  decisions: Object.freeze(['allow', 'unavailable']),
  customerVisible: 'boolean-marker',
  safeDenyCode: 'SERVICE_REPORT_UNAVAILABLE',
  projectionAllowed: 'boolean-marker',
  auditReadyMetadata: 'future-internal-concept-only',
  boundaryMarkers: Object.freeze([
    'customer-facing-response-only-gets-generic-unavailable',
    'internal-denial-reason-not-customer-facing',
    'allow-only-enters-customer-visible-projection-not-raw-fsr',
    'unavailable-does-not-reveal-case-report-organization-existence',
    'audit-ready-metadata-is-not-audit-runtime'
  ])
});

const customerAccessResolverDecisionOrderMarkers = Object.freeze({
  orderedSteps: Object.freeze([
    'request-context',
    'organization-scope-check',
    'customer-identity-verification-check',
    'customer-to-case-linkage-check',
    'publication-state-check',
    'customer-visible-policy-gate',
    'allow-customer-facing-projection-or-generic-unavailable-safe-deny'
  ]),
  boundaryMarkers: Object.freeze([
    'organization-scope-before-linkage',
    'identity-verification-cannot-rely-on-phone-address-raw-line-id',
    'publication-state-cannot-bypass-identity-linkage',
    'denied-unavailable-cannot-leak-case-report-organization-existence',
    'resolver-output-cannot-send-internal-denial-reason-to-customer-facing-response'
  ])
});

const customerAccessResolverDecisionMatrixMarkers = Object.freeze([
  Object.freeze({
    scenario: 'same-org-verified-identity-linked-case-published-report',
    decision: 'allow',
    customerFacingResponse: 'success-projection-allowed'
  }),
  Object.freeze({
    scenario: 'same-org-verified-identity-linked-case-unpublished-report',
    decision: 'unavailable',
    customerFacingResponse: 'generic-unavailable'
  }),
  Object.freeze({
    scenario: 'same-org-unverified-identity-linked-case-published-report',
    decision: 'unavailable',
    customerFacingResponse: 'generic-unavailable'
  }),
  Object.freeze({
    scenario: 'same-org-verified-identity-unlinked-case-published-report',
    decision: 'unavailable',
    customerFacingResponse: 'generic-unavailable'
  }),
  Object.freeze({
    scenario: 'cross-org-verified-identity-linked-looking-case',
    decision: 'unavailable',
    customerFacingResponse: 'generic-unavailable'
  }),
  Object.freeze({
    scenario: 'phone-only-match',
    decision: 'unavailable',
    customerFacingResponse: 'generic-unavailable'
  }),
  Object.freeze({
    scenario: 'address-only-match',
    decision: 'unavailable',
    customerFacingResponse: 'generic-unavailable'
  }),
  Object.freeze({
    scenario: 'raw-line-id-only',
    decision: 'unavailable',
    customerFacingResponse: 'generic-unavailable'
  }),
  Object.freeze({
    scenario: 'disputed-or-withheld-not-customer-visible',
    decision: 'unavailable',
    customerFacingResponse: 'generic-unavailable'
  }),
  Object.freeze({
    scenario: 'follow-up-required-customer-visible-publication-allowed',
    decision: 'allow',
    customerFacingResponse: 'success-projection-with-customer-visible-follow-up-summary'
  })
]);

const customerAccessResolverSafeDenyContractMarker = Object.freeze({
  ok: false,
  code: 'SERVICE_REPORT_UNAVAILABLE',
  message: 'The service report is not available.',
  forbiddenLeakageMarkers: Object.freeze([
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
  ])
});

const customerAccessResolverAuditMetadataBoundaryMarker = Object.freeze({
  internalOnlyMetadataConcepts: Object.freeze([
    'decision-category',
    'evaluated-checks',
    'fail-closed-reason-category',
    'organization-scope-check-result',
    'identity-verification-check-result',
    'linkage-check-result',
    'publication-state-check-result'
  ]),
  boundaryMarkers: Object.freeze([
    'not-customer-facing-api-output',
    'no-token-secret-raw-provider-payload',
    'no-full-raw-phone-address-line-id',
    'no-cross-org-data',
    'no-ai-raw-payload',
    'no-internal-note-full-text'
  ])
});

const customerAccessResolverFsrInvariantMarkers = Object.freeze([
  'resolver-cannot-create-formal-fsr',
  'resolver-cannot-approve-formal-fsr',
  'resolver-cannot-publish-formal-fsr',
  'resolver-cannot-create-second-formal-fsr',
  'resolver-cannot-modify-completion-source-data',
  'resolver-cannot-modify-final-appointment-id',
  'resolver-cannot-treat-completion-submission-as-case-completed',
  'publication-allowed-does-not-equal-formal-fsr-approval',
  'customer-facing-service-report-is-filtered-publication-view-only'
]);

const customerAccessResolverForbiddenAuthorizationFields = Object.freeze([
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
]);

const customerIdentityAccessFixtures = Object.freeze([
  Object.freeze({
    id: 'identity_access_verified_customer_linked_published',
    organizationScopeMarker: 'same-organization',
    customerIdentityVerificationMarker: 'verified-customer',
    caseLinkageMarker: 'linked-to-case',
    publicationStateMarker: 'customer_report_published',
    expectedAccessResult: 'customer-facing-dto-visible',
    accessResponseMarker: 'published-dto-allowed',
    forbiddenLeakageMarker: 'no-internal-identity-or-channel-data'
  }),
  Object.freeze({
    id: 'identity_access_unverified_customer',
    organizationScopeMarker: 'organization-unresolved-until-verified',
    customerIdentityVerificationMarker: 'unverified-customer',
    caseLinkageMarker: 'not-evaluated',
    publicationStateMarker: 'not-evaluated',
    expectedAccessResult: 'safe-deny',
    accessResponseMarker: 'generic-safe-deny',
    forbiddenLeakageMarker: 'no-case-existence-leak'
  }),
  Object.freeze({
    id: 'identity_access_suspicious_ambiguous_identity',
    organizationScopeMarker: 'scope-ambiguous-fail-closed',
    customerIdentityVerificationMarker: 'suspicious-or-ambiguous',
    caseLinkageMarker: 'not-evaluated',
    publicationStateMarker: 'not-evaluated',
    expectedAccessResult: 'safe-deny',
    accessResponseMarker: 'generic-safe-deny',
    forbiddenLeakageMarker: 'no-matching-candidate-leak'
  }),
  Object.freeze({
    id: 'identity_access_unbound_customer_channel_identity',
    organizationScopeMarker: 'same-organization-marker-only',
    customerIdentityVerificationMarker: 'channel-identity-unbound',
    caseLinkageMarker: 'not-linked-to-case',
    publicationStateMarker: 'not-evaluated',
    expectedAccessResult: 'safe-deny',
    accessResponseMarker: 'binding-needed-if-customer-safe-otherwise-generic',
    forbiddenLeakageMarker: 'no-channel-identity-internals'
  }),
  Object.freeze({
    id: 'identity_access_verified_customer_unpublished_report',
    organizationScopeMarker: 'same-organization',
    customerIdentityVerificationMarker: 'verified-customer',
    caseLinkageMarker: 'linked-to-case',
    publicationStateMarker: 'draft_internal',
    expectedAccessResult: 'not-visible',
    accessResponseMarker: 'unavailable-or-safe-deny',
    forbiddenLeakageMarker: 'no-unpublished-draft-leak'
  }),
  Object.freeze({
    id: 'identity_access_verified_customer_report_withheld',
    organizationScopeMarker: 'same-organization',
    customerIdentityVerificationMarker: 'verified-customer',
    caseLinkageMarker: 'linked-to-case',
    publicationStateMarker: 'customer_report_withheld',
    expectedAccessResult: 'unavailable-follow-up',
    accessResponseMarker: 'customer-safe-follow-up',
    forbiddenLeakageMarker: 'no-internal-withholding-reason'
  }),
  Object.freeze({
    id: 'identity_access_verified_disputed_report_follow_up',
    organizationScopeMarker: 'same-organization',
    customerIdentityVerificationMarker: 'verified-customer',
    caseLinkageMarker: 'linked-to-case',
    publicationStateMarker: 'disputed',
    expectedAccessResult: 'limited-follow-up',
    accessResponseMarker: 'human-follow-up-required',
    forbiddenLeakageMarker: 'no-internal-dispute-notes'
  }),
  Object.freeze({
    id: 'identity_access_cross_organization_attempt',
    organizationScopeMarker: 'organization-mismatch',
    customerIdentityVerificationMarker: 'verified-customer-in-other-organization',
    caseLinkageMarker: 'cross-organization-case',
    publicationStateMarker: 'not-revealed',
    expectedAccessResult: 'safe-deny',
    accessResponseMarker: 'generic-safe-deny',
    forbiddenLeakageMarker: 'no-cross-organization-data'
  }),
  Object.freeze({
    id: 'identity_access_linked_to_different_case',
    organizationScopeMarker: 'same-organization',
    customerIdentityVerificationMarker: 'verified-customer',
    caseLinkageMarker: 'linked-to-different-case',
    publicationStateMarker: 'not-revealed',
    expectedAccessResult: 'safe-deny',
    accessResponseMarker: 'generic-safe-deny',
    forbiddenLeakageMarker: 'no-other-case-existence-leak'
  }),
  Object.freeze({
    id: 'identity_access_no_case_linkage',
    organizationScopeMarker: 'same-organization',
    customerIdentityVerificationMarker: 'verified-customer',
    caseLinkageMarker: 'no-case-linkage',
    publicationStateMarker: 'not-revealed',
    expectedAccessResult: 'safe-deny',
    accessResponseMarker: 'generic-safe-deny',
    forbiddenLeakageMarker: 'no-case-linkage-leak'
  })
]);

const customerIdentityRoleBoundaryFixtures = Object.freeze([
  Object.freeze({
    id: 'reporter_not_automatically_customer',
    roleBoundaryMarker: 'reporter-can-differ-from-customer',
    expectedAccessResult: 'requires-customer-case-linkage',
    note: 'role-boundary-proposal-only-no-runtime'
  }),
  Object.freeze({
    id: 'billing_contact_not_automatically_customer',
    roleBoundaryMarker: 'billing-contact-can-differ-from-customer',
    expectedAccessResult: 'requires-customer-case-linkage',
    note: 'billing-contact-alone-cannot-view-report'
  }),
  Object.freeze({
    id: 'on_site_contact_override_not_automatically_customer_identity',
    roleBoundaryMarker: 'on-site-contact-override-can-differ-from-customer',
    expectedAccessResult: 'requires-customer-case-linkage',
    note: 'on-site-contact-text-alone-cannot-grant-access'
  }),
  Object.freeze({
    id: 'phone_number_alone_cannot_grant_report_access',
    roleBoundaryMarker: 'contact-text-is-not-identity-proof',
    expectedAccessResult: 'safe-deny-without-verified-identity',
    note: 'no-real-phone-value'
  }),
  Object.freeze({
    id: 'address_alone_cannot_grant_report_access',
    roleBoundaryMarker: 'address-text-is-not-identity-proof',
    expectedAccessResult: 'safe-deny-without-verified-identity',
    note: 'no-real-address-value'
  }),
  Object.freeze({
    id: 'customer_identity_must_be_linked_to_case',
    roleBoundaryMarker: 'customer-case-linkage-required',
    expectedAccessResult: 'safe-deny-if-unlinked',
    note: 'case-linkage-is-organization-scoped'
  }),
  Object.freeze({
    id: 'cross_customer_case_access_must_safe_deny',
    roleBoundaryMarker: 'cross-customer-access-denied',
    expectedAccessResult: 'generic-safe-deny',
    note: 'no-cross-customer-case-leak'
  })
]);

const customerChannelIdentityScopeFixtures = Object.freeze([
  Object.freeze({
    id: 'line_identity_scoped_by_org_channel_user_marker',
    channelType: 'line',
    scopeRule: 'organization-plus-line-channel-plus-line-user-marker',
    accessRule: 'raw-line-user-marker-is-not-global-identity',
    valuePolicy: 'no-real-line-id-or-credential-value'
  }),
  Object.freeze({
    id: 'web_identity_scoped_and_verified_marker',
    channelType: 'web',
    scopeRule: 'organization-plus-web-session-or-verified-link-marker',
    accessRule: 'raw-web-token-alone-cannot-grant-report-access',
    valuePolicy: 'no-real-verifier-value'
  }),
  Object.freeze({
    id: 'sms_identity_scoped_and_verified_marker',
    channelType: 'sms',
    scopeRule: 'organization-plus-verified-sms-link-marker',
    accessRule: 'raw-phone-text-alone-cannot-grant-report-access',
    valuePolicy: 'no-real-phone-value'
  }),
  Object.freeze({
    id: 'app_identity_scoped_and_verified_marker',
    channelType: 'app',
    scopeRule: 'organization-plus-app-account-marker',
    accessRule: 'raw-app-device-id-alone-cannot-grant-report-access',
    valuePolicy: 'no-real-device-or-credential-value'
  }),
  Object.freeze({
    id: 'channel_credential_never_customer_visible',
    channelType: 'all',
    scopeRule: 'credential-is-server-side-only',
    accessRule: 'channel-credential-provider-key-never-customer-visible',
    valuePolicy: 'no-credential-value'
  }),
  Object.freeze({
    id: 'channel_identity_internals_forbidden_in_dto',
    channelType: 'all',
    scopeRule: 'identity-internals-are-internal-only',
    accessRule: 'customer-facing-dto-must-not-include-channel-internals',
    valuePolicy: 'marker-only'
  })
]);

const customerCaseLinkageFixtures = Object.freeze([
  Object.freeze({
    id: 'verified_customer_linked_to_case_same_org',
    verificationState: 'verified',
    caseLinkageState: 'linked-to-case',
    organizationScope: 'same-organization',
    expectedAccessResult: 'eligible-if-published'
  }),
  Object.freeze({
    id: 'verified_customer_not_linked_to_case',
    verificationState: 'verified',
    caseLinkageState: 'not-linked-to-case',
    organizationScope: 'same-organization',
    expectedAccessResult: 'safe-deny'
  }),
  Object.freeze({
    id: 'verified_customer_linked_to_another_case',
    verificationState: 'verified',
    caseLinkageState: 'linked-to-another-case',
    organizationScope: 'same-organization',
    expectedAccessResult: 'safe-deny'
  }),
  Object.freeze({
    id: 'verified_customer_in_another_organization',
    verificationState: 'verified',
    caseLinkageState: 'cross-organization-case',
    organizationScope: 'organization-mismatch',
    expectedAccessResult: 'safe-deny'
  }),
  Object.freeze({
    id: 'unverified_customer_attempting_case_access',
    verificationState: 'unverified',
    caseLinkageState: 'not-evaluated',
    organizationScope: 'not-revealed',
    expectedAccessResult: 'safe-deny'
  }),
  Object.freeze({
    id: 'case_not_found_or_inaccessible_safe_deny',
    verificationState: 'not-revealed',
    caseLinkageState: 'not-found-or-inaccessible',
    organizationScope: 'not-revealed',
    expectedAccessResult: 'safe-deny-no-resource-enumeration'
  }),
  Object.freeze({
    id: 'case_linkage_must_be_organization_scoped',
    verificationState: 'verified',
    caseLinkageState: 'linked-with-org-scope-required',
    organizationScope: 'required',
    expectedAccessResult: 'fail-closed-if-scope-missing'
  }),
  Object.freeze({
    id: 'no_global_case_lookup',
    verificationState: 'not-applicable',
    caseLinkageState: 'global-case-lookup-forbidden',
    organizationScope: 'required',
    expectedAccessResult: 'forbidden-pattern'
  }),
  Object.freeze({
    id: 'no_first_matching_case_lookup',
    verificationState: 'not-applicable',
    caseLinkageState: 'first-matching-case-lookup-forbidden',
    organizationScope: 'required',
    expectedAccessResult: 'forbidden-pattern'
  })
]);

const customerIdentitySafeDenyFixtures = Object.freeze([
  Object.freeze({
    id: 'unverified_customer_safe_deny',
    expectedResponseStyle: 'generic-safe-deny',
    forbiddenLeakageMarker: 'no-case-existence-leak'
  }),
  Object.freeze({
    id: 'unlinked_customer_safe_deny',
    expectedResponseStyle: 'generic-safe-deny',
    forbiddenLeakageMarker: 'no-case-linkage-leak'
  }),
  Object.freeze({
    id: 'cross_organization_safe_deny',
    expectedResponseStyle: 'generic-safe-deny',
    forbiddenLeakageMarker: 'no-organization-existence-leak'
  }),
  Object.freeze({
    id: 'unbound_channel_identity_safe_deny',
    expectedResponseStyle: 'generic-safe-deny-or-safe-binding-needed',
    forbiddenLeakageMarker: 'no-channel-identity-internals'
  }),
  Object.freeze({
    id: 'suspicious_ambiguous_identity_safe_deny',
    expectedResponseStyle: 'generic-safe-deny',
    forbiddenLeakageMarker: 'no-matching-candidate-leak'
  }),
  Object.freeze({
    id: 'unpublished_report_unavailable_or_safe_deny',
    expectedResponseStyle: 'unavailable-or-safe-deny',
    forbiddenLeakageMarker: 'no-unpublished-draft-detail-leak'
  }),
  Object.freeze({
    id: 'withheld_report_unavailable_follow_up',
    expectedResponseStyle: 'unavailable-or-follow-up',
    forbiddenLeakageMarker: 'no-internal-withholding-reason'
  }),
  Object.freeze({
    id: 'inaccessible_case_safe_deny',
    expectedResponseStyle: 'generic-safe-deny',
    forbiddenLeakageMarker: 'no-resource-enumeration'
  }),
  Object.freeze({
    id: 'report_in_another_organization_safe_deny',
    expectedResponseStyle: 'generic-safe-deny',
    forbiddenLeakageMarker: 'no-report-existence-leak'
  }),
  Object.freeze({
    id: 'no_resource_enumeration_marker',
    expectedResponseStyle: 'generic-safe-deny',
    forbiddenLeakageMarker: 'no-resource-enumeration'
  }),
  Object.freeze({
    id: 'no_organization_existence_leak_marker',
    expectedResponseStyle: 'generic-safe-deny',
    forbiddenLeakageMarker: 'no-organization-existence-leak'
  }),
  Object.freeze({
    id: 'no_case_existence_leak_marker',
    expectedResponseStyle: 'generic-safe-deny',
    forbiddenLeakageMarker: 'no-case-existence-leak'
  }),
  Object.freeze({
    id: 'no_report_existence_leak_marker',
    expectedResponseStyle: 'generic-safe-deny',
    forbiddenLeakageMarker: 'no-report-existence-leak'
  })
]);

const customerIdentityPublicationAccessFixtures = Object.freeze([
  Object.freeze({ state: 'draft_internal', accessBehavior: 'not-visible' }),
  Object.freeze({ state: 'source_data_submitted', accessBehavior: 'not-visible' }),
  Object.freeze({ state: 'needs_review', accessBehavior: 'not-visible-or-customer-safe-follow-up' }),
  Object.freeze({ state: 'approved_internal_fsr', accessBehavior: 'not-automatically-customer-visible' }),
  Object.freeze({ state: 'customer_report_published', accessBehavior: 'visible-only-after-identity-case-org-checks' }),
  Object.freeze({ state: 'customer_report_withheld', accessBehavior: 'unavailable-or-follow-up' }),
  Object.freeze({ state: 'customer_follow_up_required', accessBehavior: 'limited-customer-safe-follow-up' }),
  Object.freeze({ state: 'disputed', accessBehavior: 'follow-up-or-human-handling' })
]);

const customerIdentityInvariantNotes = Object.freeze([
  'customer-identity-is-not-global',
  'line-is-not-global-identity',
  'raw-line-user-marker-cannot-grant-access',
  'customer-channel-identity-must-be-organization-channel-scoped',
  'customer-must-be-verified-before-customer-facing-report-access',
  'customer-must-be-linked-to-case',
  'case-linkage-must-be-organization-scoped',
  'phone-address-alone-cannot-grant-access',
  'reporter-billing-contact-on-site-contact-override-are-not-automatically-report-viewer-identity',
  'cross-organization-access-must-safe-deny',
  'customer-facing-dto-must-not-expose-channel-identity-internals',
  'internal-identity-matching-reason-must-not-be-customer-visible',
  'no-runtime-identity-verification-is-implemented-by-fixture'
]);

const engineerMobileWorkbenchRepositorySyntheticFixture = Object.freeze({
  organizations: Object.freeze([
    Object.freeze({
      id: 'org_alpha_service',
      status: 'active',
      purpose: 'primary happy-path tenant for assigned engineer fixtures',
      isolationNote: 'org A engineer cannot see org B task'
    }),
    Object.freeze({
      id: 'org_beta_service',
      status: 'active',
      purpose: 'cross-organization isolation tenant with mirrored fake task shape',
      isolationNote: 'same fake shape across orgs must not collapse identity'
    }),
    Object.freeze({
      id: 'org_suspended',
      status: 'suspended',
      purpose: 'inactive organization safe-deny scenario',
      isolationNote: 'inactive organization triggers safe-deny'
    }),
    Object.freeze({
      id: 'org_deleted',
      status: 'deleted',
      purpose: 'deleted organization safe-deny scenario',
      isolationNote: 'deleted organization triggers safe-deny'
    })
  ]),

  platformUsers: Object.freeze([
    Object.freeze({
      id: 'user_alpha_engineer_active',
      userType: 'engineer',
      status: 'active',
      displayLabel: 'synthetic-alpha-engineer'
    }),
    Object.freeze({
      id: 'user_beta_engineer_active',
      userType: 'engineer',
      status: 'active',
      displayLabel: 'synthetic-beta-engineer'
    }),
    Object.freeze({
      id: 'user_without_engineer_profile',
      userType: 'support',
      status: 'active',
      displayLabel: 'synthetic-user-no-engineer-profile'
    }),
    Object.freeze({
      id: 'user_inactive_engineer',
      userType: 'engineer',
      status: 'inactive',
      displayLabel: 'synthetic-inactive-engineer'
    }),
    Object.freeze({
      id: 'user_admin_support_proposal',
      userType: 'admin',
      status: 'active',
      displayLabel: 'synthetic-admin-support-proposal'
    })
  ]),

  engineerProfiles: Object.freeze([
    Object.freeze({
      id: 'engineer_profile_alpha_active',
      platformUserId: 'user_alpha_engineer_active',
      organizationId: 'org_alpha_service',
      status: 'active',
      mappingType: 'engineer-as-user-compatible'
    }),
    Object.freeze({
      id: 'engineer_profile_beta_active',
      platformUserId: 'user_beta_engineer_active',
      organizationId: 'org_beta_service',
      status: 'active',
      mappingType: 'engineer-as-user-compatible'
    }),
    Object.freeze({
      id: 'engineer_profile_inactive',
      platformUserId: 'user_inactive_engineer',
      organizationId: 'org_alpha_service',
      status: 'inactive',
      mappingType: 'safe-deny'
    })
  ]),

  userOrganizations: Object.freeze([
    Object.freeze({
      id: 'membership_alpha_engineer',
      userId: 'user_alpha_engineer_active',
      organizationId: 'org_alpha_service',
      status: 'active'
    }),
    Object.freeze({
      id: 'membership_beta_engineer',
      userId: 'user_beta_engineer_active',
      organizationId: 'org_beta_service',
      status: 'active'
    }),
    Object.freeze({
      id: 'membership_user_without_engineer_profile',
      userId: 'user_without_engineer_profile',
      organizationId: 'org_alpha_service',
      status: 'active'
    })
  ]),

  cases: Object.freeze([
    Object.freeze({
      id: 'case_alpha_primary',
      organizationId: 'org_alpha_service',
      status: 'on_site',
      productSummary: 'synthetic product category',
      issueSummary: 'synthetic service issue'
    }),
    Object.freeze({
      id: 'case_alpha_multi_visit',
      organizationId: 'org_alpha_service',
      status: 'on_site',
      productSummary: 'synthetic product category',
      issueSummary: 'synthetic repeat visit issue'
    }),
    Object.freeze({
      id: 'case_alpha_existing_formal_report',
      organizationId: 'org_alpha_service',
      status: 'completed',
      productSummary: 'synthetic product category',
      issueSummary: 'synthetic completed case'
    }),
    Object.freeze({
      id: 'case_beta_mirrored_shape',
      organizationId: 'org_beta_service',
      status: 'on_site',
      productSummary: 'synthetic product category',
      issueSummary: 'synthetic service issue'
    })
  ]),

  appointments: Object.freeze([
    Object.freeze({
      id: 'appointment_alpha_visible_confirmed',
      caseId: 'case_alpha_primary',
      organizationId: 'org_alpha_service',
      dispatchAssignmentId: 'dispatch_assignment_alpha_visible',
      appointmentStatus: 'confirmed',
      operationState: 'confirmed',
      expectedVisibility: 'visible_to_assigned_engineer',
      eligibilityImplication: 'arrived_allowed'
    }),
    Object.freeze({
      id: 'appointment_alpha_already_arrived',
      caseId: 'case_alpha_primary',
      organizationId: 'org_alpha_service',
      dispatchAssignmentId: 'dispatch_assignment_alpha_arrived',
      appointmentStatus: 'confirmed',
      operationState: 'arrived',
      expectedVisibility: 'visible_to_assigned_engineer',
      eligibilityImplication: 'duplicate_arrived_denied_started_may_be_allowed'
    }),
    Object.freeze({
      id: 'appointment_alpha_in_progress',
      caseId: 'case_alpha_primary',
      organizationId: 'org_alpha_service',
      dispatchAssignmentId: 'dispatch_assignment_alpha_in_progress',
      appointmentStatus: 'confirmed',
      operationState: 'in_progress',
      expectedVisibility: 'visible_to_assigned_engineer',
      eligibilityImplication: 'completion_source_data_may_be_allowed'
    }),
    Object.freeze({
      id: 'appointment_alpha_waiting_parts',
      caseId: 'case_alpha_primary',
      organizationId: 'org_alpha_service',
      dispatchAssignmentId: 'dispatch_assignment_alpha_waiting_parts',
      appointmentStatus: 'completed',
      visitResult: 'pending_parts',
      operationState: 'waiting_parts',
      expectedVisibility: 'visible_summary',
      eligibilityImplication: 'normal_completion_denied'
    }),
    Object.freeze({
      id: 'appointment_alpha_quote_needed',
      caseId: 'case_alpha_primary',
      organizationId: 'org_alpha_service',
      dispatchAssignmentId: 'dispatch_assignment_alpha_quote_needed',
      appointmentStatus: 'completed',
      visitResult: 'pending_quote',
      operationState: 'quote_needed',
      expectedVisibility: 'visible_summary',
      eligibilityImplication: 'completion_denied_quote_workflow_needed'
    }),
    Object.freeze({
      id: 'appointment_alpha_customer_not_available',
      caseId: 'case_alpha_primary',
      organizationId: 'org_alpha_service',
      dispatchAssignmentId: 'dispatch_assignment_alpha_customer_not_available',
      appointmentStatus: 'no_show',
      visitResult: 'customer_not_home',
      operationState: 'customer_not_available',
      expectedVisibility: 'visible_summary',
      eligibilityImplication: 'completion_denied_reschedule_needed'
    }),
    Object.freeze({
      id: 'appointment_alpha_cancelled',
      caseId: 'case_alpha_primary',
      organizationId: 'org_alpha_service',
      dispatchAssignmentId: 'dispatch_assignment_alpha_cancelled',
      appointmentStatus: 'cancelled',
      operationState: 'cancelled',
      expectedVisibility: 'not_actionable',
      eligibilityImplication: 'safe_deny_or_operation_denied'
    }),
    Object.freeze({
      id: 'appointment_alpha_reassigned',
      caseId: 'case_alpha_primary',
      organizationId: 'org_alpha_service',
      dispatchAssignmentId: 'dispatch_assignment_alpha_reassigned',
      appointmentStatus: 'confirmed',
      operationState: 'reassigned',
      expectedVisibility: 'not_visible_to_old_engineer',
      eligibilityImplication: 'safe_deny'
    }),
    Object.freeze({
      id: 'appointment_alpha_hidden_unconfirmed',
      caseId: 'case_alpha_primary',
      organizationId: 'org_alpha_service',
      dispatchAssignmentId: 'dispatch_assignment_alpha_hidden',
      appointmentStatus: 'scheduled',
      operationState: 'hidden_unconfirmed',
      expectedVisibility: 'hidden',
      eligibilityImplication: 'safe_deny'
    }),
    Object.freeze({
      id: 'appointment_alpha_assigned_to_other_engineer',
      caseId: 'case_alpha_primary',
      organizationId: 'org_alpha_service',
      dispatchAssignmentId: 'dispatch_assignment_alpha_other_engineer',
      appointmentStatus: 'confirmed',
      operationState: 'confirmed',
      expectedVisibility: 'not_visible_to_unassigned_engineer',
      eligibilityImplication: 'safe_deny_no_assignment_leak'
    }),
    Object.freeze({
      id: 'appointment_beta_other_org',
      caseId: 'case_beta_mirrored_shape',
      organizationId: 'org_beta_service',
      dispatchAssignmentId: 'dispatch_assignment_beta_visible',
      appointmentStatus: 'confirmed',
      operationState: 'confirmed',
      expectedVisibility: 'not_visible_to_org_alpha_engineer',
      eligibilityImplication: 'safe_deny_no_org_leak'
    }),
    Object.freeze({
      id: 'appointment_alpha_case_with_formal_report',
      caseId: 'case_alpha_existing_formal_report',
      organizationId: 'org_alpha_service',
      dispatchAssignmentId: 'dispatch_assignment_alpha_formal_report_case',
      appointmentStatus: 'completed',
      visitResult: 'completed',
      operationState: 'completion_submitted_source',
      expectedVisibility: 'visible_summary',
      eligibilityImplication: 'source_submission_requires_review_no_second_formal_report'
    }),
    Object.freeze({
      id: 'appointment_alpha_multi_visit_first',
      caseId: 'case_alpha_multi_visit',
      organizationId: 'org_alpha_service',
      dispatchAssignmentId: 'dispatch_assignment_alpha_multi_visit',
      appointmentStatus: 'completed',
      visitResult: 'pending_parts',
      visitSequence: 1,
      operationState: 'waiting_parts',
      expectedVisibility: 'visible_summary',
      eligibilityImplication: 'not_final_completion'
    }),
    Object.freeze({
      id: 'appointment_alpha_multi_visit_second',
      caseId: 'case_alpha_multi_visit',
      organizationId: 'org_alpha_service',
      dispatchAssignmentId: 'dispatch_assignment_alpha_multi_visit',
      appointmentStatus: 'confirmed',
      visitSequence: 2,
      operationState: 'confirmed',
      expectedVisibility: 'visible_to_assigned_engineer',
      eligibilityImplication: 'arrived_allowed_final_appointment_system_owned'
    })
  ]),

  dispatchAssignments: Object.freeze([
    Object.freeze({
      id: 'dispatch_assignment_alpha_visible',
      caseId: 'case_alpha_primary',
      organizationId: 'org_alpha_service',
      engineerProfileId: 'engineer_profile_alpha_active',
      status: 'assigned'
    }),
    Object.freeze({
      id: 'dispatch_assignment_alpha_arrived',
      caseId: 'case_alpha_primary',
      organizationId: 'org_alpha_service',
      engineerProfileId: 'engineer_profile_alpha_active',
      status: 'accepted'
    }),
    Object.freeze({
      id: 'dispatch_assignment_alpha_in_progress',
      caseId: 'case_alpha_primary',
      organizationId: 'org_alpha_service',
      engineerProfileId: 'engineer_profile_alpha_active',
      status: 'accepted'
    }),
    Object.freeze({
      id: 'dispatch_assignment_alpha_waiting_parts',
      caseId: 'case_alpha_primary',
      organizationId: 'org_alpha_service',
      engineerProfileId: 'engineer_profile_alpha_active',
      status: 'completed'
    }),
    Object.freeze({
      id: 'dispatch_assignment_alpha_quote_needed',
      caseId: 'case_alpha_primary',
      organizationId: 'org_alpha_service',
      engineerProfileId: 'engineer_profile_alpha_active',
      status: 'completed'
    }),
    Object.freeze({
      id: 'dispatch_assignment_alpha_customer_not_available',
      caseId: 'case_alpha_primary',
      organizationId: 'org_alpha_service',
      engineerProfileId: 'engineer_profile_alpha_active',
      status: 'completed'
    }),
    Object.freeze({
      id: 'dispatch_assignment_alpha_cancelled',
      caseId: 'case_alpha_primary',
      organizationId: 'org_alpha_service',
      engineerProfileId: 'engineer_profile_alpha_active',
      status: 'cancelled'
    }),
    Object.freeze({
      id: 'dispatch_assignment_alpha_reassigned',
      caseId: 'case_alpha_primary',
      organizationId: 'org_alpha_service',
      engineerProfileId: 'engineer_profile_beta_active',
      previousEngineerProfileId: 'engineer_profile_alpha_active',
      status: 'assigned'
    }),
    Object.freeze({
      id: 'dispatch_assignment_alpha_hidden',
      caseId: 'case_alpha_primary',
      organizationId: 'org_alpha_service',
      engineerProfileId: 'engineer_profile_alpha_active',
      status: 'pending'
    }),
    Object.freeze({
      id: 'dispatch_assignment_alpha_other_engineer',
      caseId: 'case_alpha_primary',
      organizationId: 'org_alpha_service',
      engineerProfileId: 'engineer_profile_inactive',
      status: 'assigned'
    }),
    Object.freeze({
      id: 'dispatch_assignment_beta_visible',
      caseId: 'case_beta_mirrored_shape',
      organizationId: 'org_beta_service',
      engineerProfileId: 'engineer_profile_beta_active',
      status: 'assigned'
    }),
    Object.freeze({
      id: 'dispatch_assignment_alpha_formal_report_case',
      caseId: 'case_alpha_existing_formal_report',
      organizationId: 'org_alpha_service',
      engineerProfileId: 'engineer_profile_alpha_active',
      status: 'completed'
    }),
    Object.freeze({
      id: 'dispatch_assignment_alpha_multi_visit',
      caseId: 'case_alpha_multi_visit',
      organizationId: 'org_alpha_service',
      engineerProfileId: 'engineer_profile_alpha_active',
      status: 'assigned'
    })
  ]),

  fieldServiceReports: Object.freeze([
    Object.freeze({
      id: 'field_service_report_alpha_existing_formal',
      caseId: 'case_alpha_existing_formal_report',
      organizationId: 'org_alpha_service',
      serviceStatus: 'completed',
      finalAppointmentId: 'appointment_alpha_case_with_formal_report',
      invariant: 'one_case_one_formal_report'
    })
  ]),

  customerVisibleReportFixtures: Object.freeze([
    Object.freeze({
      id: 'customer_visible_report_alpha_published_projection',
      organizationId: 'org_alpha_service',
      caseId: 'case_alpha_primary',
      appointmentId: 'appointment_alpha_in_progress',
      fieldServiceReportId: 'field_service_report_alpha_future_formal_marker',
      publicationState: 'customer_report_published',
      allowedProjectionKeys: customerVisibleAllowedKeys,
      forbiddenProjectionKeys: customerVisibleForbiddenKeys,
      projectionNote: 'synthetic-filtered-view-only-not-second-formal-fsr-not-runtime-dto',
      approvalNote: 'allowed-keys-still-require-future-formal-workflow-permission-and-publication-approval'
    }),
    Object.freeze({
      id: 'customer_visible_report_alpha_internal_draft_withheld',
      organizationId: 'org_alpha_service',
      caseId: 'case_alpha_primary',
      appointmentId: 'appointment_alpha_in_progress',
      completionSubmissionId: 'completion_submission_needs_review',
      publicationState: 'needs_review',
      expectedVisibility: 'internal_only',
      withholdingReason: 'unapproved-fsr-draft-and-ai-normalized-content-not-customer-visible'
    }),
    Object.freeze({
      id: 'customer_visible_report_alpha_signature_exception_summary',
      organizationId: 'org_alpha_service',
      caseId: 'case_alpha_primary',
      appointmentId: 'appointment_alpha_in_progress',
      completionSubmissionId: 'completion_submission_signature_exception',
      publicationState: 'customer_follow_up_required',
      allowedCustomerSafeSummaryKey: 'signatureExceptionCustomerSafeSummary',
      forbiddenDetailPolicy: 'no-raw-signature-binary-no-internal-engineer-comment'
    })
  ]),

  customerReportPublicationStates,

  customerIdentityVerificationScenarios,

  customerAccessScenarios: Object.freeze([
    Object.freeze({
      id: 'verified_customer_view_published_report',
      organizationId: 'org_alpha_service',
      caseId: 'case_alpha_primary',
      reportFixtureId: 'customer_visible_report_alpha_published_projection',
      expectedVisibility: 'customer_visible_filtered_projection',
      safeDenyOrEscalationBehavior: 'not_applicable',
      forbiddenLeakageMarker: 'no-internal-only-fields',
      organizationScopeMarker: 'same-organization-and-linked-case',
      piiPolicy: 'no-raw-pii-no-credential-value'
    }),
    Object.freeze({
      id: 'verified_customer_cannot_view_unpublished_fsr_draft',
      organizationId: 'org_alpha_service',
      caseId: 'case_alpha_primary',
      reportFixtureId: 'customer_visible_report_alpha_internal_draft_withheld',
      expectedVisibility: 'safe_deny_or_customer_safe_pending_status',
      safeDenyOrEscalationBehavior: 'withhold-unpublished-draft',
      forbiddenLeakageMarker: 'no-unapproved-fsr-draft',
      organizationScopeMarker: 'same-organization-still-requires-publication',
      piiPolicy: 'no-raw-pii-no-credential-value'
    }),
    Object.freeze({
      id: 'unverified_customer_safe_deny',
      organizationId: 'org_alpha_service',
      caseId: 'case_alpha_primary',
      identityScenarioId: 'customer_identity_unverified',
      expectedVisibility: 'safe_deny',
      safeDenyOrEscalationBehavior: 'generic-safe-deny-no-existence-leak',
      forbiddenLeakageMarker: 'no-case-existence-or-status-leak',
      organizationScopeMarker: 'verification-required-before-scope-details',
      piiPolicy: 'no-raw-pii-no-credential-value'
    }),
    Object.freeze({
      id: 'customer_not_linked_to_case_safe_deny',
      organizationId: 'org_alpha_service',
      caseId: 'case_alpha_primary',
      identityScenarioId: 'customer_identity_verified_not_linked',
      expectedVisibility: 'safe_deny',
      safeDenyOrEscalationBehavior: 'generic-safe-deny-no-linkage-leak',
      forbiddenLeakageMarker: 'no-case-linkage-leak',
      organizationScopeMarker: 'same-organization-but-not-linked-to-case',
      piiPolicy: 'no-raw-pii-no-credential-value'
    }),
    Object.freeze({
      id: 'customer_from_other_organization_safe_deny',
      organizationId: 'org_beta_service',
      caseId: 'case_alpha_primary',
      identityScenarioId: 'customer_identity_cross_org',
      expectedVisibility: 'safe_deny',
      safeDenyOrEscalationBehavior: 'generic-safe-deny-no-cross-org-leak',
      forbiddenLeakageMarker: 'no-cross-organization-data',
      organizationScopeMarker: 'organization-mismatch',
      piiPolicy: 'no-raw-pii-no-credential-value'
    }),
    Object.freeze({
      id: 'complaint_or_low_rating_requires_follow_up_marker',
      organizationId: 'org_alpha_service',
      caseId: 'case_alpha_primary',
      expectedVisibility: 'customer_safe_follow_up_status_only',
      safeDenyOrEscalationBehavior: 'follow-up-marker-not-auto-close',
      forbiddenLeakageMarker: 'no-internal-riskindicator-or-ai-raw-payload',
      organizationScopeMarker: 'same-organization-and-linked-case',
      piiPolicy: 'no-raw-pii-no-credential-value'
    }),
    Object.freeze({
      id: 'disputed_service_result_requires_human_follow_up',
      organizationId: 'org_alpha_service',
      caseId: 'case_alpha_primary',
      expectedVisibility: 'customer_safe_dispute_status_only',
      safeDenyOrEscalationBehavior: 'human-follow-up-required',
      forbiddenLeakageMarker: 'no-supervisor-review-note-or-internal-comment',
      organizationScopeMarker: 'same-organization-and-linked-case',
      piiPolicy: 'no-raw-pii-no-credential-value'
    }),
    Object.freeze({
      id: 'fee_dispute_requires_human_follow_up',
      organizationId: 'org_alpha_service',
      caseId: 'case_alpha_primary',
      expectedVisibility: 'customer_safe_fee-follow-up-status-only',
      safeDenyOrEscalationBehavior: 'human-follow-up-required',
      forbiddenLeakageMarker: 'no-billing-internal-or-settlement-internal-data',
      organizationScopeMarker: 'same-organization-and-linked-case',
      piiPolicy: 'no-raw-pii-no-credential-value'
    }),
    Object.freeze({
      id: 'ai_generated_summary_not_human_confirmed_internal_only',
      organizationId: 'org_alpha_service',
      caseId: 'case_alpha_primary',
      expectedVisibility: 'internal_only',
      safeDenyOrEscalationBehavior: 'withhold-unconfirmed-ai-summary',
      forbiddenLeakageMarker: 'no-ai-raw-payload-no-ai-confidence-score',
      organizationScopeMarker: 'same-organization-still-requires-human-confirmation',
      piiPolicy: 'no-raw-pii-no-credential-value'
    }),
    Object.freeze({
      id: 'signature_exception_customer_safe_summary_only',
      organizationId: 'org_alpha_service',
      caseId: 'case_alpha_primary',
      reportFixtureId: 'customer_visible_report_alpha_signature_exception_summary',
      expectedVisibility: 'customer_safe_signature_status_summary',
      safeDenyOrEscalationBehavior: 'show-safe-summary-or-follow-up-marker',
      forbiddenLeakageMarker: 'no-raw-signature-binary-no-internal-engineer-comment',
      organizationScopeMarker: 'same-organization-and-linked-case',
      piiPolicy: 'no-raw-pii-no-credential-value'
    })
  ]),

  customerVisibleFilteringInvariantNotes,

  customerFacingPublishedDtoProposal,

  customerFacingUnavailableDtoProposal,

  customerFacingSafeDenyDtoProposal,

  customerFacingDtoAllowedFields,

  customerFacingDtoForbiddenFields,

  customerFacingPublicationStateDtoMapping,

  customerFacingDtoInvariantNotes,

  customerFacingApiContractProposal,

  customerFacingApiRequestFlowMarkers,

  customerFacingApiSuccessEnvelopeProposal,

  customerFacingApiSafeDenyEnvelopeProposal,

  customerFacingApiForbiddenOutputFields,

  customerFacingApiFsrInvariantMarkers,

  customerFacingApiIdentityChannelContractMarker,

  customerAccessResolverContractProposal,

  customerAccessResolverInputContractMarkers,

  customerAccessResolverOutputContractMarkers,

  customerAccessResolverDecisionOrderMarkers,

  customerAccessResolverDecisionMatrixMarkers,

  customerAccessResolverSafeDenyContractMarker,

  customerAccessResolverAuditMetadataBoundaryMarker,

  customerAccessResolverFsrInvariantMarkers,

  customerAccessResolverForbiddenAuthorizationFields,

  customerIdentityAccessFixtures,

  customerIdentityRoleBoundaryFixtures,

  customerChannelIdentityScopeFixtures,

  customerCaseLinkageFixtures,

  customerIdentitySafeDenyFixtures,

  customerIdentityPublicationAccessFixtures,

  customerIdentityInvariantNotes,

  completionSubmissions: Object.freeze([
    Object.freeze({
      id: 'completion_submission_valid_minimal',
      organizationId: 'org_alpha_service',
      caseId: 'case_alpha_primary',
      appointmentId: 'appointment_alpha_in_progress',
      engineerProfileId: 'engineer_profile_alpha_active',
      status: 'submitted',
      clientRequestId: 'client_request_valid_minimal',
      scenario: 'valid_minimal_source_data',
      invariant: 'source-data-only'
    }),
    Object.freeze({
      id: 'completion_submission_photo_refs',
      organizationId: 'org_alpha_service',
      caseId: 'case_alpha_primary',
      appointmentId: 'appointment_alpha_in_progress',
      engineerProfileId: 'engineer_profile_alpha_active',
      status: 'submitted',
      objectRefIds: Object.freeze(['object_ref_completion_photo_meta']),
      scenario: 'valid_photo_metadata_refs'
    }),
    Object.freeze({
      id: 'completion_submission_signature_exception',
      organizationId: 'org_alpha_service',
      caseId: 'case_alpha_primary',
      appointmentId: 'appointment_alpha_in_progress',
      engineerProfileId: 'engineer_profile_alpha_active',
      status: 'needs_review',
      signatureExceptionReason: 'synthetic_customer_unavailable',
      scenario: 'valid_signature_exception_reason'
    }),
    Object.freeze({
      id: 'completion_submission_needs_review',
      organizationId: 'org_alpha_service',
      caseId: 'case_alpha_primary',
      appointmentId: 'appointment_alpha_in_progress',
      engineerProfileId: 'engineer_profile_alpha_active',
      status: 'needs_review',
      scenario: 'submission_needing_review'
    }),
    Object.freeze({
      id: 'completion_submission_rejected',
      organizationId: 'org_alpha_service',
      caseId: 'case_alpha_primary',
      appointmentId: 'appointment_alpha_in_progress',
      engineerProfileId: 'engineer_profile_alpha_active',
      status: 'rejected',
      scenario: 'rejected_source_data_proposal'
    }),
    Object.freeze({
      id: 'completion_submission_superseded',
      organizationId: 'org_alpha_service',
      caseId: 'case_alpha_primary',
      appointmentId: 'appointment_alpha_in_progress',
      engineerProfileId: 'engineer_profile_alpha_active',
      status: 'superseded',
      supersededBySubmissionId: 'completion_submission_valid_minimal',
      scenario: 'superseded_source_data_proposal'
    }),
    Object.freeze({
      id: 'completion_submission_duplicate_client_request',
      organizationId: 'org_alpha_service',
      caseId: 'case_alpha_primary',
      appointmentId: 'appointment_alpha_in_progress',
      engineerProfileId: 'engineer_profile_alpha_active',
      status: 'submitted',
      clientRequestId: 'client_request_valid_minimal',
      duplicateOfSubmissionId: 'completion_submission_valid_minimal',
      scenario: 'duplicate_client_request_id'
    }),
    Object.freeze({
      id: 'completion_submission_weak_network_retry',
      organizationId: 'org_alpha_service',
      caseId: 'case_alpha_primary',
      appointmentId: 'appointment_alpha_in_progress',
      engineerProfileId: 'engineer_profile_alpha_active',
      status: 'submitted',
      clientRequestId: 'client_request_retry',
      idempotencyResult: 'same_safe_result_expected',
      scenario: 'weak_network_retry'
    })
  ]),

  objectRefs: Object.freeze([
    Object.freeze({
      id: 'object_ref_completion_photo_meta',
      organizationId: 'org_alpha_service',
      caseId: 'case_alpha_primary',
      appointmentId: 'appointment_alpha_in_progress',
      objectType: 'completion_photo_metadata',
      storageRef: 'synthetic-object-ref-photo-meta',
      checksumRef: 'synthetic-checksum-photo-meta',
      containsBinary: false
    }),
    Object.freeze({
      id: 'object_ref_signature_meta',
      organizationId: 'org_alpha_service',
      caseId: 'case_alpha_primary',
      appointmentId: 'appointment_alpha_in_progress',
      objectType: 'signature_metadata',
      storageRef: 'synthetic-object-ref-signature-meta',
      checksumRef: 'synthetic-checksum-signature-meta',
      containsBinary: false
    })
  ]),

  forbiddenPayloadExamples: Object.freeze([
    Object.freeze({
      id: 'forbidden_final_appointment_id',
      payloadShape: Object.freeze({ finalAppointmentId: 'client-selected-final-appointment' }),
      expectedRejection: 'server-owned-final-appointment-id'
    }),
    Object.freeze({
      id: 'forbidden_case_completed',
      payloadShape: Object.freeze({ caseCompleted: true }),
      expectedRejection: 'client-cannot-complete-case'
    }),
    Object.freeze({
      id: 'forbidden_formal_fsr_approval',
      payloadShape: Object.freeze({ formalFieldServiceReportApproved: true }),
      expectedRejection: 'client-cannot-approve-formal-report'
    }),
    Object.freeze({
      id: 'forbidden_raw_binary',
      payloadShape: Object.freeze({ rawFileBinary: 'forbidden-raw-binary-marker' }),
      expectedRejection: 'metadata-refs-only'
    }),
    Object.freeze({
      id: 'forbidden_provider_payload',
      payloadShape: Object.freeze({ providerPayload: 'forbidden-provider-payload-marker' }),
      expectedRejection: 'provider-payload-not-accepted'
    }),
    Object.freeze({
      id: 'forbidden_ai_raw_payload',
      payloadShape: Object.freeze({ aiRawPayload: 'forbidden-ai-raw-payload-marker' }),
      expectedRejection: 'ai-raw-payload-not-accepted'
    })
  ]),

  safeDenyScenarios: Object.freeze([
    Object.freeze({
      id: 'safe_deny_cross_org_appointment',
      actorEngineerProfileId: 'engineer_profile_alpha_active',
      appointmentId: 'appointment_beta_other_org',
      expectedStyle: 'generic-safe-deny',
      assertionFocus: 'no-appointment-existence-or-org-leak'
    }),
    Object.freeze({
      id: 'safe_deny_assignment_owned_by_other_engineer',
      actorEngineerProfileId: 'engineer_profile_alpha_active',
      appointmentId: 'appointment_alpha_assigned_to_other_engineer',
      expectedStyle: 'generic-safe-deny',
      assertionFocus: 'no-engineer-assignment-ownership-leak'
    }),
    Object.freeze({
      id: 'operation_denied_cancelled_appointment',
      actorEngineerProfileId: 'engineer_profile_alpha_active',
      appointmentId: 'appointment_alpha_cancelled',
      expectedStyle: 'operation-denied',
      assertionFocus: 'no-state-mutation'
    }),
    Object.freeze({
      id: 'safe_deny_hidden_unconfirmed_appointment',
      actorEngineerProfileId: 'engineer_profile_alpha_active',
      appointmentId: 'appointment_alpha_hidden_unconfirmed',
      expectedStyle: 'generic-safe-deny',
      assertionFocus: 'no-hidden-appointment-leak'
    }),
    Object.freeze({
      id: 'operation_denied_existing_formal_report',
      actorEngineerProfileId: 'engineer_profile_alpha_active',
      appointmentId: 'appointment_alpha_case_with_formal_report',
      expectedStyle: 'operation-denied',
      assertionFocus: 'no-second-formal-report'
    })
  ])
});

module.exports = {
  customerAccessScenarios: engineerMobileWorkbenchRepositorySyntheticFixture.customerAccessScenarios,
  customerAccessResolverAuditMetadataBoundaryMarker,
  customerAccessResolverContractProposal,
  customerAccessResolverDecisionMatrixMarkers,
  customerAccessResolverDecisionOrderMarkers,
  customerAccessResolverForbiddenAuthorizationFields,
  customerAccessResolverFsrInvariantMarkers,
  customerAccessResolverInputContractMarkers,
  customerAccessResolverOutputContractMarkers,
  customerAccessResolverSafeDenyContractMarker,
  customerFacingApiContractProposal,
  customerFacingApiForbiddenOutputFields,
  customerFacingApiFsrInvariantMarkers,
  customerFacingApiIdentityChannelContractMarker,
  customerFacingApiRequestFlowMarkers,
  customerFacingApiSafeDenyEnvelopeProposal,
  customerFacingApiSuccessEnvelopeProposal,
  customerFacingDtoAllowedFields,
  customerFacingDtoForbiddenFields,
  customerFacingDtoInvariantNotes,
  customerFacingPublishedDtoProposal,
  customerFacingPublicationStateDtoMapping,
  customerFacingSafeDenyDtoProposal,
  customerFacingUnavailableDtoProposal,
  customerCaseLinkageFixtures,
  customerChannelIdentityScopeFixtures,
  customerIdentityAccessFixtures,
  customerIdentityVerificationScenarios,
  customerIdentityInvariantNotes,
  customerIdentityPublicationAccessFixtures,
  customerIdentityRoleBoundaryFixtures,
  customerIdentitySafeDenyFixtures,
  customerReportPublicationStates,
  customerVisibleAllowedKeys,
  customerVisibleFilteringInvariantNotes,
  customerVisibleForbiddenKeys,
  customerVisibleReportFixtures: engineerMobileWorkbenchRepositorySyntheticFixture.customerVisibleReportFixtures,
  engineerMobileWorkbenchRepositorySyntheticFixture,
  repositorySyntheticFixtureForbiddenKeys,
  repositorySyntheticFixtureInvariantNotes
};
