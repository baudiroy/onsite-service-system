const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildTimelineProjection,
  buildServiceReportProjection,
  buildAccessUnavailableProjection,
  buildVerificationRequiredProjection
} = require('../../../../src/utils/customerFacingProjectionService');
const {
  CUSTOMER_ACCESS_VERIFICATION_STATE,
  CUSTOMER_ACCESS_SURFACE_TYPE,
  CUSTOMER_ACCESS_PROJECTION_SCOPE,
  buildCustomerAccessContext
} = require('../../../../src/utils/customerAccessContext');

function buildVerifiedContext(surfaceType, allowedProjectionScope) {
  return buildCustomerAccessContext({
    verificationState: CUSTOMER_ACCESS_VERIFICATION_STATE.VERIFIED,
    surfaceType,
    allowedProjectionScope,
    requestReference: 'reqref_fake_projection',
    organizationScopeRef: 'scope_fake_org',
    channelScopeRef: 'scope_fake_channel'
  });
}

function buildNonVerifiedContext(surfaceType, allowedProjectionScope) {
  return buildCustomerAccessContext({
    verificationState: CUSTOMER_ACCESS_VERIFICATION_STATE.VERIFICATION_REQUIRED,
    surfaceType,
    allowedProjectionScope
  });
}

test('exports projection service builders', () => {
  assert.equal(typeof buildTimelineProjection, 'function');
  assert.equal(typeof buildServiceReportProjection, 'function');
  assert.equal(typeof buildAccessUnavailableProjection, 'function');
  assert.equal(typeof buildVerificationRequiredProjection, 'function');
});

test('timeline projection allows verified timeline scope and omits unknown or forbidden source fields', () => {
  const dto = buildTimelineProjection({
    accessContext: buildVerifiedContext(
      CUSTOMER_ACCESS_SURFACE_TYPE.TIMELINE,
      CUSTOMER_ACCESS_PROJECTION_SCOPE.TIMELINE
    ),
    timelineSource: {
      serviceDisplayTitle: 'Fake Service',
      customerCaseReference: 'FAKE-CASE-REF',
      appointmentStatusDisplay: 'Fake appointment status',
      appointmentWindow: 'Fake appointment window',
      visitOutcomeSummary: 'Fake visit outcome',
      nextCustomerAction: {
        type: 'contactSupport',
        rawProviderPayload: 'fake_provider_payload'
      },
      supportContactHint: 'Fake support hint',
      unknownExtra: 'fake_unknown_extra',
      internalNotes: 'fake_internal_note',
      auditReason: 'fake_audit_reason',
      rawToken: 'fake_token_value',
      rawLineId: 'fake_channel_value',
      caseId: 'case_fake_projection',
      fullPhone: 'fake_phone_value',
      fullAddress: 'fake_address_value',
      status: 'ok',
      messageKey: 'customerAccess.available',
      metadata: { debug: true }
    }
  });
  const serializedDto = JSON.stringify(dto);

  assert.equal(dto.dtoType, 'timeline');
  assert.equal(dto.serviceDisplayTitle, 'Fake Service');
  assert.equal(dto.customerCaseReference, 'FAKE-CASE-REF');
  assert.equal(dto.nextCustomerAction.type, 'contactSupport');
  assert.equal(dto.nextCustomerAction.rawProviderPayload, undefined);
  assert.equal(dto.unknownExtra, undefined);
  assert.equal(dto.internalNotes, undefined);
  assert.equal(dto.auditReason, undefined);
  assert.equal(dto.rawToken, undefined);
  assert.equal(dto.rawLineId, undefined);
  assert.equal(dto.caseId, undefined);
  assert.equal(dto.fullPhone, undefined);
  assert.equal(dto.fullAddress, undefined);
  assert.equal(dto.status, undefined);
  assert.equal(dto.messageKey, undefined);
  assert.equal(dto.metadata, undefined);

  [
    'fake_unknown_extra',
    'fake_internal_note',
    'fake_audit_reason',
    'fake_provider_payload',
    'fake_token_value',
    'fake_channel_value',
    'case_fake_projection',
    'fake_phone_value',
    'fake_address_value'
  ].forEach((forbiddenValue) => {
    assert.equal(serializedDto.includes(forbiddenValue), false);
  });
});

test('timeline projection allows verified combined scope', () => {
  const dto = buildTimelineProjection({
    accessContext: buildVerifiedContext(
      CUSTOMER_ACCESS_SURFACE_TYPE.TIMELINE,
      CUSTOMER_ACCESS_PROJECTION_SCOPE.TIMELINE_AND_SERVICE_REPORT
    ),
    timelineSource: {
      serviceDisplayTitle: 'Fake Combined Scope Service'
    }
  });

  assert.equal(dto.dtoType, 'timeline');
  assert.equal(dto.serviceDisplayTitle, 'Fake Combined Scope Service');
});

test('timeline projection denies service-report-only missing malformed or non-verified context', () => {
  const serviceReportOnlyDto = buildTimelineProjection({
    accessContext: buildVerifiedContext(
      CUSTOMER_ACCESS_SURFACE_TYPE.SERVICE_REPORT,
      CUSTOMER_ACCESS_PROJECTION_SCOPE.SERVICE_REPORT
    ),
    supportContactHint: 'Fake support hint',
    timelineSource: {
      serviceDisplayTitle: 'Fake denied service'
    }
  });
  const missingContextDto = buildTimelineProjection({
    timelineSource: {
      serviceDisplayTitle: 'Fake missing context service'
    }
  });
  const malformedContextDto = buildTimelineProjection({
    accessContext: 'fake_malformed_context',
    timelineSource: {
      serviceDisplayTitle: 'Fake malformed context service'
    }
  });
  const nonVerifiedDto = buildTimelineProjection({
    accessContext: buildNonVerifiedContext(
      CUSTOMER_ACCESS_SURFACE_TYPE.TIMELINE,
      CUSTOMER_ACCESS_PROJECTION_SCOPE.TIMELINE
    ),
    timelineSource: {
      serviceDisplayTitle: 'Fake non verified service'
    }
  });

  assert.equal(serviceReportOnlyDto.dtoType, 'unavailable');
  assert.equal(serviceReportOnlyDto.supportContactHint, 'Fake support hint');
  assert.equal(missingContextDto.dtoType, 'unavailable');
  assert.equal(malformedContextDto.dtoType, 'unavailable');
  assert.equal(nonVerifiedDto.dtoType, 'unavailable');
});

test('service report projection allows verified service-report scope and omits unknown or forbidden source fields', () => {
  const dto = buildServiceReportProjection({
    accessContext: buildVerifiedContext(
      CUSTOMER_ACCESS_SURFACE_TYPE.SERVICE_REPORT,
      CUSTOMER_ACCESS_PROJECTION_SCOPE.SERVICE_REPORT
    ),
    serviceReportSource: {
      customerReportReference: 'FAKE-REPORT-REF',
      serviceDate: '2026-01-01',
      servicedItemSummary: 'Fake item',
      issueSummary: 'Fake issue',
      workPerformedSummary: 'Fake work',
      partsSummary: [{ name: 'Fake part', rawToken: 'fake_token_value' }],
      chargesSummary: {
        totalDisplay: 'Fake already projected charge summary',
        billingSettlementRules: 'fake_internal_rules'
      },
      warrantyOrFollowUpHint: 'Fake warranty hint',
      supportContactHint: 'Fake support hint',
      unknownExtra: 'fake_unknown_extra',
      internalNotes: 'fake_internal_note',
      rawProviderPayload: 'fake_provider_payload',
      reportId: 'report_fake_projection',
      fullPhone: 'fake_phone_value',
      status: 'ok',
      customerMessage: 'Fake customer message',
      rawSource: { fake: true }
    }
  });
  const serializedDto = JSON.stringify(dto);

  assert.equal(dto.dtoType, 'service_report');
  assert.equal(dto.customerReportReference, 'FAKE-REPORT-REF');
  assert.equal(dto.chargesSummary.totalDisplay, 'Fake already projected charge summary');
  assert.equal(dto.chargesSummary.billingSettlementRules, undefined);
  assert.equal(dto.partsSummary[0].name, 'Fake part');
  assert.equal(dto.partsSummary[0].rawToken, undefined);
  assert.equal(dto.unknownExtra, undefined);
  assert.equal(dto.internalNotes, undefined);
  assert.equal(dto.rawProviderPayload, undefined);
  assert.equal(dto.reportId, undefined);
  assert.equal(dto.fullPhone, undefined);
  assert.equal(dto.status, undefined);
  assert.equal(dto.customerMessage, undefined);
  assert.equal(dto.rawSource, undefined);

  [
    'fake_unknown_extra',
    'fake_internal_note',
    'fake_provider_payload',
    'fake_token_value',
    'fake_internal_rules',
    'report_fake_projection',
    'fake_phone_value'
  ].forEach((forbiddenValue) => {
    assert.equal(serializedDto.includes(forbiddenValue), false);
  });
});

test('service report projection allows verified combined scope', () => {
  const dto = buildServiceReportProjection({
    accessContext: buildVerifiedContext(
      CUSTOMER_ACCESS_SURFACE_TYPE.SERVICE_REPORT,
      CUSTOMER_ACCESS_PROJECTION_SCOPE.TIMELINE_AND_SERVICE_REPORT
    ),
    serviceReportSource: {
      customerReportReference: 'FAKE-COMBINED-REPORT-REF'
    }
  });

  assert.equal(dto.dtoType, 'service_report');
  assert.equal(dto.customerReportReference, 'FAKE-COMBINED-REPORT-REF');
});

test('service report projection denies timeline-only missing malformed or non-verified context', () => {
  const timelineOnlyDto = buildServiceReportProjection({
    accessContext: buildVerifiedContext(
      CUSTOMER_ACCESS_SURFACE_TYPE.TIMELINE,
      CUSTOMER_ACCESS_PROJECTION_SCOPE.TIMELINE
    ),
    supportContactHint: 'Fake support hint',
    serviceReportSource: {
      customerReportReference: 'FAKE-DENIED-REPORT-REF'
    }
  });
  const missingContextDto = buildServiceReportProjection({
    serviceReportSource: {
      customerReportReference: 'FAKE-MISSING-CONTEXT-REPORT-REF'
    }
  });
  const malformedContextDto = buildServiceReportProjection({
    accessContext: 'fake_malformed_context',
    serviceReportSource: {
      customerReportReference: 'FAKE-MALFORMED-CONTEXT-REPORT-REF'
    }
  });
  const nonVerifiedDto = buildServiceReportProjection({
    accessContext: buildNonVerifiedContext(
      CUSTOMER_ACCESS_SURFACE_TYPE.SERVICE_REPORT,
      CUSTOMER_ACCESS_PROJECTION_SCOPE.SERVICE_REPORT
    ),
    serviceReportSource: {
      customerReportReference: 'FAKE-NON-VERIFIED-REPORT-REF'
    }
  });

  assert.equal(timelineOnlyDto.dtoType, 'unavailable');
  assert.equal(timelineOnlyDto.supportContactHint, 'Fake support hint');
  assert.equal(missingContextDto.dtoType, 'unavailable');
  assert.equal(malformedContextDto.dtoType, 'unavailable');
  assert.equal(nonVerifiedDto.dtoType, 'unavailable');
});

test('access unavailable and verification required projections are minimal unavailable DTOs', () => {
  const unavailableDto = buildAccessUnavailableProjection({
    supportContactHint: 'Fake support hint',
    internalReason: 'fake_internal_reason',
    rawToken: 'fake_token_value',
    rawProviderPayload: 'fake_provider_payload',
    rawLineId: 'fake_channel_value',
    caseId: 'case_fake_projection'
  });
  const verificationRequiredDto = buildVerificationRequiredProjection({
    supportContactHint: 'Fake verification support hint',
    internalReason: 'fake_verification_internal_reason',
    rawToken: 'fake_verification_token_value',
    rawProviderPayload: 'fake_verification_provider_payload',
    rawLineId: 'fake_verification_channel_value',
    caseId: 'case_fake_verification_projection'
  });
  const serializedDtos = JSON.stringify([unavailableDto, verificationRequiredDto]);

  assert.equal(unavailableDto.dtoType, 'unavailable');
  assert.equal(unavailableDto.supportContactHint, 'Fake support hint');
  assert.equal(verificationRequiredDto.dtoType, 'unavailable');
  assert.equal(verificationRequiredDto.supportContactHint, 'Fake verification support hint');

  [
    'fake_internal_reason',
    'fake_token_value',
    'fake_provider_payload',
    'fake_channel_value',
    'case_fake_projection',
    'fake_verification_internal_reason',
    'fake_verification_token_value',
    'fake_verification_provider_payload',
    'fake_verification_channel_value',
    'case_fake_verification_projection'
  ].forEach((forbiddenValue) => {
    assert.equal(serializedDtos.includes(forbiddenValue), false);
  });
});

test('projection service output does not include response envelope fields or raw source pass-through', () => {
  const timelineDto = buildTimelineProjection({
    accessContext: buildVerifiedContext(
      CUSTOMER_ACCESS_SURFACE_TYPE.TIMELINE,
      CUSTOMER_ACCESS_PROJECTION_SCOPE.TIMELINE
    ),
    timelineSource: {
      serviceDisplayTitle: 'Fake Service',
      nextCustomerAction: { type: 'contactSupport' },
      status: 'ok',
      messageKey: 'customerAccess.available',
      customerMessage: 'Fake customer message',
      nextActions: [{ type: 'fakeAction' }],
      displayHints: { refreshRecommended: true },
      metadata: { debug: true },
      raw: 'fake_raw_value',
      source: 'fake_source_value'
    }
  });
  const serviceReportDto = buildServiceReportProjection({
    accessContext: buildVerifiedContext(
      CUSTOMER_ACCESS_SURFACE_TYPE.SERVICE_REPORT,
      CUSTOMER_ACCESS_PROJECTION_SCOPE.SERVICE_REPORT
    ),
    serviceReportSource: {
      customerReportReference: 'FAKE-REPORT-REF',
      status: 'ok',
      messageKey: 'customerAccess.available',
      customerMessage: 'Fake customer message',
      nextActions: [{ type: 'fakeAction' }],
      displayHints: { refreshRecommended: true },
      metadata: { debug: true },
      raw: 'fake_raw_value',
      source: 'fake_source_value'
    }
  });
  const serializedDtos = JSON.stringify([timelineDto, serviceReportDto]);

  assert.equal(timelineDto.nextCustomerAction.type, 'contactSupport');
  assert.equal(timelineDto.status, undefined);
  assert.equal(timelineDto.messageKey, undefined);
  assert.equal(timelineDto.customerMessage, undefined);
  assert.equal(timelineDto.nextActions, undefined);
  assert.equal(timelineDto.displayHints, undefined);
  assert.equal(timelineDto.metadata, undefined);
  assert.equal(timelineDto.raw, undefined);
  assert.equal(timelineDto.source, undefined);
  assert.equal(serviceReportDto.status, undefined);
  assert.equal(serviceReportDto.messageKey, undefined);
  assert.equal(serviceReportDto.customerMessage, undefined);
  assert.equal(serviceReportDto.nextActions, undefined);
  assert.equal(serviceReportDto.displayHints, undefined);
  assert.equal(serviceReportDto.metadata, undefined);
  assert.equal(serviceReportDto.raw, undefined);
  assert.equal(serviceReportDto.source, undefined);
  assert.equal(serializedDtos.includes('fake_raw_value'), false);
  assert.equal(serializedDtos.includes('fake_source_value'), false);
});
