const test = require('node:test');
const assert = require('node:assert/strict');

const {
  CUSTOMER_FACING_DTO_TYPE,
  buildCustomerTimelineProjectionDto,
  buildCustomerServiceReportProjectionDto,
  buildCustomerUnavailableProjectionDto
} = require('../../../../src/utils/customerFacingProjectionDto');
const {
  CUSTOMER_ACCESS_VERIFICATION_STATE,
  CUSTOMER_ACCESS_SURFACE_TYPE,
  CUSTOMER_ACCESS_PROJECTION_SCOPE,
  buildCustomerAccessContext
} = require('../../../../src/utils/customerAccessContext');

function buildVerifiedTimelineContext() {
  return buildCustomerAccessContext({
    verificationState: CUSTOMER_ACCESS_VERIFICATION_STATE.VERIFIED,
    surfaceType: CUSTOMER_ACCESS_SURFACE_TYPE.TIMELINE,
    allowedProjectionScope: CUSTOMER_ACCESS_PROJECTION_SCOPE.TIMELINE,
    requestReference: 'reqref_fake_dto',
    organizationScopeRef: 'scope_fake_org',
    channelScopeRef: 'scope_fake_channel'
  });
}

function buildVerifiedReportContext() {
  return buildCustomerAccessContext({
    verificationState: CUSTOMER_ACCESS_VERIFICATION_STATE.VERIFIED,
    surfaceType: CUSTOMER_ACCESS_SURFACE_TYPE.SERVICE_REPORT,
    allowedProjectionScope: CUSTOMER_ACCESS_PROJECTION_SCOPE.SERVICE_REPORT
  });
}

test('exported DTO constants are present and frozen', () => {
  assert.equal(Object.isFrozen(CUSTOMER_FACING_DTO_TYPE), true);
  assert.equal(CUSTOMER_FACING_DTO_TYPE.TIMELINE, 'timeline');
  assert.equal(CUSTOMER_FACING_DTO_TYPE.SERVICE_REPORT, 'service_report');
  assert.equal(CUSTOMER_FACING_DTO_TYPE.UNAVAILABLE, 'unavailable');
});

test('timeline DTO includes allowlisted fields and omits unknown or forbidden fields', () => {
  const dto = buildCustomerTimelineProjectionDto({
    accessContext: buildVerifiedTimelineContext(),
    serviceDisplayTitle: 'Fake Service',
    customerCaseReference: 'FAKE-CASE-REF',
    appointmentStatusDisplay: 'Fake appointment status',
    appointmentWindow: 'Fake appointment window',
    visitOutcomeSummary: 'Fake visit outcome',
    nextCustomerAction: { type: 'contactSupport', internalReason: 'fake_internal_reason' },
    supportContactHint: 'Fake support hint',
    unknownExtra: 'fake_unknown_extra',
    internalNotes: 'fake_internal_note',
    auditReason: 'fake_audit_reason',
    rawToken: 'fake_token_value',
    rawLineId: 'fake_channel_value',
    caseId: 'case_fake_dto',
    fullPhone: 'fake_phone_value',
    fullAddress: 'fake_address_value'
  });
  const serializedDto = JSON.stringify(dto);

  assert.equal(dto.dtoType, CUSTOMER_FACING_DTO_TYPE.TIMELINE);
  assert.equal(dto.serviceDisplayTitle, 'Fake Service');
  assert.equal(dto.customerCaseReference, 'FAKE-CASE-REF');
  assert.equal(dto.unknownExtra, undefined);
  assert.equal(dto.internalNotes, undefined);
  assert.equal(dto.auditReason, undefined);
  assert.equal(dto.rawToken, undefined);
  assert.equal(dto.rawLineId, undefined);
  assert.equal(dto.caseId, undefined);
  assert.equal(dto.fullPhone, undefined);
  assert.equal(dto.fullAddress, undefined);
  assert.equal(dto.nextCustomerAction.type, 'contactSupport');
  assert.equal(dto.nextCustomerAction.internalReason, undefined);

  [
    'fake_unknown_extra',
    'fake_internal_note',
    'fake_audit_reason',
    'fake_token_value',
    'fake_channel_value',
    'case_fake_dto',
    'fake_phone_value',
    'fake_address_value',
    'fake_internal_reason'
  ].forEach((forbiddenValue) => {
    assert.equal(serializedDto.includes(forbiddenValue), false);
  });
});

test('timeline DTO fails closed for missing malformed or non-verified access context', () => {
  const missingOptionsDto = buildCustomerTimelineProjectionDto();
  const malformedContextDto = buildCustomerTimelineProjectionDto({
    accessContext: 'fake_malformed_context',
    serviceDisplayTitle: 'Fake Service'
  });
  const nonVerifiedContextDto = buildCustomerTimelineProjectionDto({
    accessContext: buildCustomerAccessContext({
      verificationState: CUSTOMER_ACCESS_VERIFICATION_STATE.VERIFICATION_REQUIRED,
      surfaceType: CUSTOMER_ACCESS_SURFACE_TYPE.TIMELINE,
      allowedProjectionScope: CUSTOMER_ACCESS_PROJECTION_SCOPE.TIMELINE
    }),
    serviceDisplayTitle: 'Fake Service'
  });

  assert.equal(missingOptionsDto.dtoType, CUSTOMER_FACING_DTO_TYPE.UNAVAILABLE);
  assert.equal(malformedContextDto.dtoType, CUSTOMER_FACING_DTO_TYPE.UNAVAILABLE);
  assert.equal(nonVerifiedContextDto.dtoType, CUSTOMER_FACING_DTO_TYPE.UNAVAILABLE);
});

test('service report DTO includes allowlisted fields and omits unknown or forbidden fields', () => {
  const dto = buildCustomerServiceReportProjectionDto({
    accessContext: buildVerifiedReportContext(),
    customerReportReference: 'FAKE-REPORT-REF',
    serviceDate: '2026-01-01',
    servicedItemSummary: 'Fake item',
    issueSummary: 'Fake issue',
    workPerformedSummary: 'Fake work',
    partsSummary: [{ name: 'Fake part', rawToken: 'fake_token_value' }],
    chargesSummary: {
      totalDisplay: 'Fake confirmed charge summary',
      billingSettlementRules: 'fake_internal_rules'
    },
    warrantyOrFollowUpHint: 'Fake warranty hint',
    supportContactHint: 'Fake support hint',
    supervisorNotes: 'fake_supervisor_note',
    inventoryInternals: 'fake_inventory_internal'
  });
  const serializedDto = JSON.stringify(dto);

  assert.equal(dto.dtoType, CUSTOMER_FACING_DTO_TYPE.SERVICE_REPORT);
  assert.equal(dto.customerReportReference, 'FAKE-REPORT-REF');
  assert.equal(dto.chargesSummary.totalDisplay, 'Fake confirmed charge summary');
  assert.equal(dto.chargesSummary.billingSettlementRules, undefined);
  assert.equal(dto.partsSummary[0].name, 'Fake part');
  assert.equal(dto.partsSummary[0].rawToken, undefined);
  assert.equal(dto.supervisorNotes, undefined);
  assert.equal(dto.inventoryInternals, undefined);

  [
    'fake_token_value',
    'fake_internal_rules',
    'fake_supervisor_note',
    'fake_inventory_internal'
  ].forEach((forbiddenValue) => {
    assert.equal(serializedDto.includes(forbiddenValue), false);
  });
});

test('service report DTO fails closed for missing malformed or non-verified access context', () => {
  const missingOptionsDto = buildCustomerServiceReportProjectionDto();
  const malformedContextDto = buildCustomerServiceReportProjectionDto({
    accessContext: 'fake_malformed_context',
    customerReportReference: 'FAKE-REPORT-REF'
  });
  const nonVerifiedContextDto = buildCustomerServiceReportProjectionDto({
    accessContext: buildCustomerAccessContext({
      verificationState: CUSTOMER_ACCESS_VERIFICATION_STATE.VERIFICATION_FAILED,
      surfaceType: CUSTOMER_ACCESS_SURFACE_TYPE.SERVICE_REPORT,
      allowedProjectionScope: CUSTOMER_ACCESS_PROJECTION_SCOPE.SERVICE_REPORT
    }),
    customerReportReference: 'FAKE-REPORT-REF'
  });

  assert.equal(missingOptionsDto.dtoType, CUSTOMER_FACING_DTO_TYPE.UNAVAILABLE);
  assert.equal(malformedContextDto.dtoType, CUSTOMER_FACING_DTO_TYPE.UNAVAILABLE);
  assert.equal(nonVerifiedContextDto.dtoType, CUSTOMER_FACING_DTO_TYPE.UNAVAILABLE);
});

test('unavailable DTO is minimal and does not include internal reason or ids', () => {
  const dto = buildCustomerUnavailableProjectionDto({
    supportContactHint: 'Fake support hint',
    internalReason: 'fake_internal_reason',
    caseId: 'case_fake_dto',
    reportId: 'report_fake_dto'
  });
  const serializedDto = JSON.stringify(dto);

  assert.equal(dto.dtoType, CUSTOMER_FACING_DTO_TYPE.UNAVAILABLE);
  assert.equal(dto.supportContactHint, 'Fake support hint');
  assert.equal(dto.internalReason, undefined);
  assert.equal(dto.caseId, undefined);
  assert.equal(dto.reportId, undefined);
  ['fake_internal_reason', 'case_fake_dto', 'report_fake_dto'].forEach((forbiddenValue) => {
    assert.equal(serializedDto.includes(forbiddenValue), false);
  });
});

test('DTO utility does not build response envelope fields', () => {
  const dto = buildCustomerServiceReportProjectionDto({
    accessContext: buildVerifiedReportContext(),
    customerReportReference: 'FAKE-REPORT-REF',
    status: 'ok',
    messageKey: 'customerAccess.available',
    customerMessage: 'Fake customer message',
    nextActions: [{ type: 'fakeAction' }],
    displayHints: { refreshRecommended: true },
    metadata: { debug: true },
    rawSource: { fake: true }
  });

  assert.equal(dto.status, undefined);
  assert.equal(dto.messageKey, undefined);
  assert.equal(dto.customerMessage, undefined);
  assert.equal(dto.nextActions, undefined);
  assert.equal(dto.displayHints, undefined);
  assert.equal(dto.metadata, undefined);
  assert.equal(dto.rawSource, undefined);
});
