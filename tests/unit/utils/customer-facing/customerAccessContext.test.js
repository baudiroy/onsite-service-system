const test = require('node:test');
const assert = require('node:assert/strict');

const {
  CUSTOMER_ACCESS_VERIFICATION_STATE,
  CUSTOMER_ACCESS_SURFACE_TYPE,
  CUSTOMER_ACCESS_PROJECTION_SCOPE,
  buildCustomerAccessContext,
  isVerifiedCustomerAccessContext
} = require('../../../../src/utils/customerAccessContext');

test('exported constants are present and frozen', () => {
  assert.equal(Object.isFrozen(CUSTOMER_ACCESS_VERIFICATION_STATE), true);
  assert.equal(Object.isFrozen(CUSTOMER_ACCESS_SURFACE_TYPE), true);
  assert.equal(Object.isFrozen(CUSTOMER_ACCESS_PROJECTION_SCOPE), true);
  assert.equal(CUSTOMER_ACCESS_VERIFICATION_STATE.VERIFIED, 'verified');
  assert.equal(CUSTOMER_ACCESS_SURFACE_TYPE.TIMELINE, 'timeline');
  assert.equal(CUSTOMER_ACCESS_PROJECTION_SCOPE.TIMELINE, 'timeline');
});

test('verified timeline context with timeline scope is verified', () => {
  const context = buildCustomerAccessContext({
    verificationState: CUSTOMER_ACCESS_VERIFICATION_STATE.VERIFIED,
    surfaceType: CUSTOMER_ACCESS_SURFACE_TYPE.TIMELINE,
    allowedProjectionScope: CUSTOMER_ACCESS_PROJECTION_SCOPE.TIMELINE,
    requestReference: 'reqref_fake_789',
    organizationScopeRef: 'scope_fake_org',
    channelScopeRef: 'scope_fake_channel'
  });

  assert.equal(isVerifiedCustomerAccessContext(context), true);
  assert.equal(context.requestReference, 'reqref_fake_789');
  assert.equal(context.organizationScopeRef, 'scope_fake_org');
  assert.equal(context.channelScopeRef, 'scope_fake_channel');
});

test('verified service report context with service report scope is verified', () => {
  const context = buildCustomerAccessContext({
    verificationState: CUSTOMER_ACCESS_VERIFICATION_STATE.VERIFIED,
    surfaceType: CUSTOMER_ACCESS_SURFACE_TYPE.SERVICE_REPORT,
    allowedProjectionScope: CUSTOMER_ACCESS_PROJECTION_SCOPE.SERVICE_REPORT
  });

  assert.equal(isVerifiedCustomerAccessContext(context), true);
});

test('verified combined scope can be used as a verified context for allowed surfaces', () => {
  const timelineContext = buildCustomerAccessContext({
    verificationState: CUSTOMER_ACCESS_VERIFICATION_STATE.VERIFIED,
    surfaceType: CUSTOMER_ACCESS_SURFACE_TYPE.TIMELINE,
    allowedProjectionScope: CUSTOMER_ACCESS_PROJECTION_SCOPE.TIMELINE_AND_SERVICE_REPORT
  });
  const reportContext = buildCustomerAccessContext({
    verificationState: CUSTOMER_ACCESS_VERIFICATION_STATE.VERIFIED,
    surfaceType: CUSTOMER_ACCESS_SURFACE_TYPE.SERVICE_REPORT,
    allowedProjectionScope: CUSTOMER_ACCESS_PROJECTION_SCOPE.TIMELINE_AND_SERVICE_REPORT
  });

  assert.equal(isVerifiedCustomerAccessContext(timelineContext), true);
  assert.equal(isVerifiedCustomerAccessContext(reportContext), true);
});

test('unknown verification state surface and projection scope fail closed', () => {
  const context = buildCustomerAccessContext({
    verificationState: 'verified_but_fake',
    surfaceType: 'timeline_but_fake',
    allowedProjectionScope: 'service_report_but_fake'
  });

  assert.equal(context.verificationState, CUSTOMER_ACCESS_VERIFICATION_STATE.UNAVAILABLE);
  assert.equal(context.surfaceType, CUSTOMER_ACCESS_SURFACE_TYPE.UNAVAILABLE);
  assert.equal(context.allowedProjectionScope, CUSTOMER_ACCESS_PROJECTION_SCOPE.NONE);
  assert.equal(isVerifiedCustomerAccessContext(context), false);
});

test('non-verified state forces projection scope to none', () => {
  const context = buildCustomerAccessContext({
    verificationState: CUSTOMER_ACCESS_VERIFICATION_STATE.VERIFICATION_REQUIRED,
    surfaceType: CUSTOMER_ACCESS_SURFACE_TYPE.TIMELINE,
    allowedProjectionScope: CUSTOMER_ACCESS_PROJECTION_SCOPE.TIMELINE
  });

  assert.equal(context.allowedProjectionScope, CUSTOMER_ACCESS_PROJECTION_SCOPE.NONE);
  assert.equal(isVerifiedCustomerAccessContext(context), false);
});

test('missing options do not produce verified context', () => {
  const context = buildCustomerAccessContext();

  assert.equal(context.verificationState, CUSTOMER_ACCESS_VERIFICATION_STATE.UNAVAILABLE);
  assert.equal(context.surfaceType, CUSTOMER_ACCESS_SURFACE_TYPE.UNAVAILABLE);
  assert.equal(context.allowedProjectionScope, CUSTOMER_ACCESS_PROJECTION_SCOPE.NONE);
  assert.equal(isVerifiedCustomerAccessContext(context), false);
});

test('invalid request and scope references are omitted', () => {
  const context = buildCustomerAccessContext({
    verificationState: CUSTOMER_ACCESS_VERIFICATION_STATE.VERIFIED,
    surfaceType: CUSTOMER_ACCESS_SURFACE_TYPE.TIMELINE,
    allowedProjectionScope: CUSTOMER_ACCESS_PROJECTION_SCOPE.TIMELINE,
    requestReference: 'case_fake_789',
    organizationScopeRef: 'org_fake_789',
    channelScopeRef: 'channel_fake_789'
  });

  assert.equal(Object.prototype.hasOwnProperty.call(context, 'requestReference'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(context, 'organizationScopeRef'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(context, 'channelScopeRef'), false);
});

test('forbidden fake details and DTO fields are not passed through', () => {
  const context = buildCustomerAccessContext({
    verificationState: CUSTOMER_ACCESS_VERIFICATION_STATE.VERIFIED,
    surfaceType: CUSTOMER_ACCESS_SURFACE_TYPE.TIMELINE,
    allowedProjectionScope: CUSTOMER_ACCESS_PROJECTION_SCOPE.TIMELINE,
    rawToken: 'fake_token_value',
    rawLineId: 'fake_channel_value',
    rawProviderPayload: 'fake_payload_value',
    caseId: 'case_fake_789',
    fullPhone: 'fake_phone_value',
    fullAddress: 'fake_address_value',
    internalReason: 'fake_internal_reason',
    auditReason: 'fake_audit_reason',
    aiRawPayload: 'fake_ai_payload',
    data: { fake: true },
    customerMessage: 'fake customer message',
    nextActions: [{ type: 'fakeAction' }],
    displayHints: { refreshRecommended: true }
  });
  const serializedContext = JSON.stringify(context);

  [
    'fake_token_value',
    'fake_channel_value',
    'fake_payload_value',
    'case_fake_789',
    'fake_phone_value',
    'fake_address_value',
    'fake_internal_reason',
    'fake_audit_reason',
    'fake_ai_payload',
    'fake customer message',
    'fakeAction',
    'refreshRecommended'
  ].forEach((forbiddenValue) => {
    assert.equal(serializedContext.includes(forbiddenValue), false);
  });
});
