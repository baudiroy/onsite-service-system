const test = require('node:test');
const assert = require('node:assert/strict');

const {
  CUSTOMER_FACING_SAFE_DENY_CATEGORIES,
  buildCustomerFacingSafeDenyResponse
} = require('../../../../src/utils/customerFacingSafeDenyResponse');

const FORBIDDEN_MESSAGE_KEY_PARTS = [
  'case_not_found',
  'report_not_found',
  'customer_not_bound',
  'organization_disabled',
  'token_expired_exact',
  'line_user_mismatch'
];

function assertSafeMessageKey(messageKey) {
  assert.equal(typeof messageKey, 'string');
  FORBIDDEN_MESSAGE_KEY_PARTS.forEach((forbiddenPart) => {
    assert.equal(messageKey.includes(forbiddenPart), false);
  });
}

function assertChannelAgnosticNextActions(nextActions) {
  assert.equal(Array.isArray(nextActions), true);
  nextActions.forEach((action) => {
    assert.equal(String(action.type).toLowerCase().includes('line'), false);
  });
}

test('known categories return safe customer-facing response shapes', () => {
  const cases = [
    {
      category: CUSTOMER_FACING_SAFE_DENY_CATEGORIES.GENERIC_UNAVAILABLE,
      status: 'unavailable',
      messageKey: 'customerAccess.genericUnavailable'
    },
    {
      category: CUSTOMER_FACING_SAFE_DENY_CATEGORIES.VERIFICATION_REQUIRED,
      status: 'verification_required',
      messageKey: 'customerAccess.verificationRequired'
    },
    {
      category: CUSTOMER_FACING_SAFE_DENY_CATEGORIES.VERIFICATION_FAILED,
      status: 'unavailable',
      messageKey: 'customerAccess.verificationFailed'
    },
    {
      category: CUSTOMER_FACING_SAFE_DENY_CATEGORIES.LINK_UNAVAILABLE,
      status: 'unavailable',
      messageKey: 'customerAccess.linkUnavailable'
    },
    {
      category: CUSTOMER_FACING_SAFE_DENY_CATEGORIES.RATE_LIMITED,
      status: 'rate_limited',
      messageKey: 'customerAccess.rateLimited'
    },
    {
      category: CUSTOMER_FACING_SAFE_DENY_CATEGORIES.TRY_AGAIN_LATER,
      status: 'unavailable',
      messageKey: 'customerAccess.tryAgainLater'
    },
    {
      category: CUSTOMER_FACING_SAFE_DENY_CATEGORIES.CONTACT_SUPPORT,
      status: 'unavailable',
      messageKey: 'customerAccess.genericUnavailable'
    }
  ];

  cases.forEach(({ category, status, messageKey }) => {
    const response = buildCustomerFacingSafeDenyResponse(category);

    assert.equal(response.status, status);
    assert.equal(response.messageKey, messageKey);
    assert.equal(typeof response.customerMessage, 'string');
    assert.equal(response.customerMessage.length > 0, true);
    assertChannelAgnosticNextActions(response.nextActions);
    assertSafeMessageKey(response.messageKey);
  });
});

test('unknown category falls back to generic unavailable', () => {
  const response = buildCustomerFacingSafeDenyResponse('unknown_fake_category');

  assert.equal(response.status, 'unavailable');
  assert.equal(response.messageKey, 'customerAccess.genericUnavailable');
  assertSafeMessageKey(response.messageKey);
});

test('requestReference preserves only the fake safe reference shape', () => {
  const validResponse = buildCustomerFacingSafeDenyResponse(
    CUSTOMER_FACING_SAFE_DENY_CATEGORIES.GENERIC_UNAVAILABLE,
    { requestReference: 'reqref_fake_123' }
  );
  const invalidResponse = buildCustomerFacingSafeDenyResponse(
    CUSTOMER_FACING_SAFE_DENY_CATEGORIES.GENERIC_UNAVAILABLE,
    { requestReference: 'case_fake_123' }
  );

  assert.equal(validResponse.requestReference, 'reqref_fake_123');
  assert.equal(Object.prototype.hasOwnProperty.call(invalidResponse, 'requestReference'), false);
});

test('retryAfterSeconds is only included for rate limited responses', () => {
  const rateLimitedResponse = buildCustomerFacingSafeDenyResponse(
    CUSTOMER_FACING_SAFE_DENY_CATEGORIES.RATE_LIMITED,
    { retryAfterSeconds: 60 }
  );
  const genericResponse = buildCustomerFacingSafeDenyResponse(
    CUSTOMER_FACING_SAFE_DENY_CATEGORIES.GENERIC_UNAVAILABLE,
    { retryAfterSeconds: 60 }
  );

  assert.equal(rateLimitedResponse.retryAfterSeconds, 60);
  assert.equal(Object.prototype.hasOwnProperty.call(genericResponse, 'retryAfterSeconds'), false);
});

test('forbidden fake details are not passed through to output', () => {
  const response = buildCustomerFacingSafeDenyResponse(
    CUSTOMER_FACING_SAFE_DENY_CATEGORIES.GENERIC_UNAVAILABLE,
    {
      rawToken: 'fake_token_value',
      rawLineId: 'fake_channel_value',
      caseId: 'case_fake_123',
      fullPhone: 'fake_phone_value',
      internalReason: 'fake_internal_reason',
      auditReason: 'fake_audit_reason',
      aiRawPayload: 'fake_ai_payload'
    }
  );
  const serializedResponse = JSON.stringify(response);

  [
    'fake_token_value',
    'fake_channel_value',
    'case_fake_123',
    'fake_phone_value',
    'fake_internal_reason',
    'fake_audit_reason',
    'fake_ai_payload'
  ].forEach((forbiddenValue) => {
    assert.equal(serializedResponse.includes(forbiddenValue), false);
  });
});

test('nextActions are not channel-specific', () => {
  const response = buildCustomerFacingSafeDenyResponse(
    CUSTOMER_FACING_SAFE_DENY_CATEGORIES.LINK_UNAVAILABLE
  );

  assertChannelAgnosticNextActions(response.nextActions);
});
