const test = require('node:test');
const assert = require('node:assert/strict');

const {
  CUSTOMER_FACING_RESPONSE_STATUS,
  buildCustomerFacingSuccessEnvelope,
  buildCustomerFacingUnavailableEnvelope,
  isCustomerSafeRequestReference
} = require('../../../../src/utils/customerFacingResponseEnvelope');

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

test('success envelope includes safe fields and valid requestReference', () => {
  const response = buildCustomerFacingSuccessEnvelope({
    messageKey: 'customerAccess.available',
    data: {
      serviceDisplayTitle: 'Fake Service',
      internalNotes: 'fake_internal_notes',
      caseId: 'case_fake_456',
      nested: {
        statusText: 'Fake status',
        rawToken: 'fake_token_value'
      }
    },
    nextActions: [
      {
        type: 'contactSupport',
        labelKey: 'customerCommon.contactSupport',
        available: true,
        debugOnly: 'fake_debug_value'
      }
    ],
    displayHints: {
      refreshRecommended: true,
      debugMetadata: 'fake_debug_value'
    },
    requestReference: 'reqref_fake_456'
  });

  assert.equal(response.status, CUSTOMER_FACING_RESPONSE_STATUS.OK);
  assert.equal(response.messageKey, 'customerAccess.available');
  assert.equal(response.requestReference, 'reqref_fake_456');
  assert.equal(response.data.serviceDisplayTitle, 'Fake Service');
  assert.equal(response.data.internalNotes, undefined);
  assert.equal(response.data.caseId, undefined);
  assert.equal(response.data.nested.statusText, 'Fake status');
  assert.equal(response.data.nested.rawToken, undefined);
  assert.deepEqual(response.nextActions, [
    {
      type: 'contactSupport',
      labelKey: 'customerCommon.contactSupport',
      available: true
    }
  ]);
  assert.deepEqual(response.displayHints, { refreshRecommended: true });
  assertSafeMessageKey(response.messageKey);
});

test('success envelope omits invalid requestReference and falls back from unsafe messageKey', () => {
  const response = buildCustomerFacingSuccessEnvelope({
    messageKey: 'case_not_found',
    requestReference: 'case_fake_456'
  });

  assert.equal(response.messageKey, 'customerAccess.available');
  assert.equal(Object.prototype.hasOwnProperty.call(response, 'requestReference'), false);
  assertSafeMessageKey(response.messageKey);
});

test('unavailable envelope includes safe fallback message and valid requestReference', () => {
  const response = buildCustomerFacingUnavailableEnvelope({
    messageKey: 'customerAccess.genericUnavailable',
    customerMessage: 'fake unsafe caller text should not be echoed',
    nextActions: [
      {
        type: 'contactSupport',
        labelKey: 'customerCommon.contactSupport',
        available: true
      }
    ],
    requestReference: 'reqref_fake_456'
  });

  assert.equal(response.status, CUSTOMER_FACING_RESPONSE_STATUS.UNAVAILABLE);
  assert.equal(response.messageKey, 'customerAccess.genericUnavailable');
  assert.equal(response.customerMessage.includes('fake unsafe caller text'), false);
  assert.equal(response.requestReference, 'reqref_fake_456');
  assertSafeMessageKey(response.messageKey);
});

test('unavailable envelope falls back from unsafe messageKey and omits invalid requestReference', () => {
  const response = buildCustomerFacingUnavailableEnvelope({
    messageKey: 'line_user_mismatch',
    requestReference: 'report_fake_456'
  });

  assert.equal(response.status, CUSTOMER_FACING_RESPONSE_STATUS.UNAVAILABLE);
  assert.equal(response.messageKey, 'customerAccess.genericUnavailable');
  assert.equal(Object.prototype.hasOwnProperty.call(response, 'requestReference'), false);
  assertSafeMessageKey(response.messageKey);
});

test('retryAfterSeconds is only included for valid rate-limited unavailable envelopes', () => {
  const rateLimitedResponse = buildCustomerFacingUnavailableEnvelope({
    status: CUSTOMER_FACING_RESPONSE_STATUS.RATE_LIMITED,
    retryAfterSeconds: 120
  });
  const invalidRateLimitedResponse = buildCustomerFacingUnavailableEnvelope({
    status: CUSTOMER_FACING_RESPONSE_STATUS.RATE_LIMITED,
    retryAfterSeconds: -1
  });
  const genericResponse = buildCustomerFacingUnavailableEnvelope({
    retryAfterSeconds: 120
  });

  assert.equal(rateLimitedResponse.status, CUSTOMER_FACING_RESPONSE_STATUS.RATE_LIMITED);
  assert.equal(rateLimitedResponse.retryAfterSeconds, 120);
  assert.equal(Object.prototype.hasOwnProperty.call(invalidRateLimitedResponse, 'retryAfterSeconds'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(genericResponse, 'retryAfterSeconds'), false);
});

test('data displayHints and nextActions do not pass through unsafe detail', () => {
  const response = buildCustomerFacingSuccessEnvelope({
    data: {
      safeSummary: 'Fake summary',
      rawProviderPayload: 'fake_payload_value',
      fullPhone: 'fake_phone_value',
      aiRawPayload: 'fake_ai_payload'
    },
    displayHints: {
      refreshRecommended: false,
      internalDebug: 'fake_debug_value'
    },
    nextActions: [
      {
        type: 'lineOnlyAction',
        labelKey: 'customerCommon.lineOnly',
        available: true
      },
      {
        type: 'tryAgainLater',
        labelKey: 'customerCommon.tryAgainLater',
        available: true,
        internalReason: 'fake_internal_reason'
      }
    ]
  });
  const serializedResponse = JSON.stringify(response);

  assert.equal(response.data.safeSummary, 'Fake summary');
  assert.equal(response.data.rawProviderPayload, undefined);
  assert.equal(response.data.fullPhone, undefined);
  assert.equal(response.data.aiRawPayload, undefined);
  assert.deepEqual(response.displayHints, { refreshRecommended: false });
  assert.deepEqual(response.nextActions, [
    {
      type: 'tryAgainLater',
      labelKey: 'customerCommon.tryAgainLater',
      available: true
    }
  ]);
  ['fake_payload_value', 'fake_phone_value', 'fake_ai_payload', 'fake_debug_value', 'fake_internal_reason'].forEach(
    (forbiddenValue) => {
      assert.equal(serializedResponse.includes(forbiddenValue), false);
    }
  );
});

test('requestReference validator accepts only fake safe skeleton reference', () => {
  assert.equal(isCustomerSafeRequestReference('reqref_fake_456'), true);
  assert.equal(isCustomerSafeRequestReference('case_fake_456'), false);
  assert.equal(isCustomerSafeRequestReference(''), false);
  assert.equal(isCustomerSafeRequestReference(null), false);
});
