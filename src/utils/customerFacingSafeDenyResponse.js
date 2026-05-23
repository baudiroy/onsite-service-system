const {
  CUSTOMER_FACING_RESPONSE_STATUS,
  buildCustomerFacingUnavailableEnvelope
} = require('./customerFacingResponseEnvelope');

const CUSTOMER_FACING_SAFE_DENY_CATEGORIES = Object.freeze({
  GENERIC_UNAVAILABLE: 'generic_unavailable',
  VERIFICATION_REQUIRED: 'verification_required',
  VERIFICATION_FAILED: 'verification_failed',
  LINK_UNAVAILABLE: 'link_unavailable',
  RATE_LIMITED: 'rate_limited',
  TRY_AGAIN_LATER: 'try_again_later',
  CONTACT_SUPPORT: 'contact_support'
});

const CONTACT_SUPPORT_ACTION = Object.freeze({
  type: 'contactSupport',
  labelKey: 'customerCommon.contactSupport',
  available: true
});

const TRY_AGAIN_LATER_ACTION = Object.freeze({
  type: 'tryAgainLater',
  labelKey: 'customerCommon.tryAgainLater',
  available: true
});

const SAFE_DENY_TEMPLATES = Object.freeze({
  [CUSTOMER_FACING_SAFE_DENY_CATEGORIES.GENERIC_UNAVAILABLE]: Object.freeze({
    status: 'unavailable',
    messageKey: 'customerAccess.genericUnavailable',
    customerMessage:
      'The requested content is currently unavailable. Please verify your link or contact support.',
    nextActions: [CONTACT_SUPPORT_ACTION]
  }),
  [CUSTOMER_FACING_SAFE_DENY_CATEGORIES.VERIFICATION_REQUIRED]: Object.freeze({
    status: 'verification_required',
    messageKey: 'customerAccess.verificationRequired',
    customerMessage: 'Please complete verification before continuing.',
    nextActions: [
      Object.freeze({
        type: 'completeVerification',
        labelKey: 'customerCommon.completeVerification',
        available: true
      }),
      CONTACT_SUPPORT_ACTION
    ]
  }),
  [CUSTOMER_FACING_SAFE_DENY_CATEGORIES.VERIFICATION_FAILED]: Object.freeze({
    status: 'unavailable',
    messageKey: 'customerAccess.verificationFailed',
    customerMessage: 'Verification could not be completed. Please try again or contact support.',
    nextActions: [TRY_AGAIN_LATER_ACTION, CONTACT_SUPPORT_ACTION]
  }),
  [CUSTOMER_FACING_SAFE_DENY_CATEGORIES.LINK_UNAVAILABLE]: Object.freeze({
    status: 'unavailable',
    messageKey: 'customerAccess.linkUnavailable',
    customerMessage: 'This link cannot currently be used. Please request a new link or contact support.',
    nextActions: [
      Object.freeze({
        type: 'requestNewLink',
        labelKey: 'customerCommon.requestNewLink',
        available: true
      }),
      CONTACT_SUPPORT_ACTION
    ]
  }),
  [CUSTOMER_FACING_SAFE_DENY_CATEGORIES.RATE_LIMITED]: Object.freeze({
    status: 'rate_limited',
    messageKey: 'customerAccess.rateLimited',
    customerMessage: 'This request cannot be processed right now. Please try again later.',
    nextActions: [TRY_AGAIN_LATER_ACTION, CONTACT_SUPPORT_ACTION]
  }),
  [CUSTOMER_FACING_SAFE_DENY_CATEGORIES.TRY_AGAIN_LATER]: Object.freeze({
    status: 'unavailable',
    messageKey: 'customerAccess.tryAgainLater',
    customerMessage: 'This request cannot be processed right now. Please try again later.',
    nextActions: [TRY_AGAIN_LATER_ACTION, CONTACT_SUPPORT_ACTION]
  }),
  [CUSTOMER_FACING_SAFE_DENY_CATEGORIES.CONTACT_SUPPORT]: Object.freeze({
    status: 'unavailable',
    messageKey: 'customerAccess.genericUnavailable',
    customerMessage: 'The requested content is currently unavailable. Please contact support.',
    nextActions: [CONTACT_SUPPORT_ACTION]
  })
});

function cloneNextActions(nextActions) {
  return nextActions.map((action) => ({ ...action }));
}

function normalizeCategory(category) {
  if (Object.prototype.hasOwnProperty.call(SAFE_DENY_TEMPLATES, category)) {
    return category;
  }

  return CUSTOMER_FACING_SAFE_DENY_CATEGORIES.GENERIC_UNAVAILABLE;
}

function buildCustomerFacingSafeDenyResponse(category, options = {}) {
  const normalizedCategory = normalizeCategory(category);
  const template = SAFE_DENY_TEMPLATES[normalizedCategory];
  const envelopeOptions = {
    status: template.status,
    messageKey: template.messageKey,
    customerMessage: template.customerMessage,
    nextActions: cloneNextActions(template.nextActions),
    requestReference: options.requestReference
  };

  if (normalizedCategory === CUSTOMER_FACING_SAFE_DENY_CATEGORIES.RATE_LIMITED) {
    envelopeOptions.status = CUSTOMER_FACING_RESPONSE_STATUS.RATE_LIMITED;
    envelopeOptions.retryAfterSeconds = options.retryAfterSeconds;
  }

  return buildCustomerFacingUnavailableEnvelope(envelopeOptions);
}

module.exports = {
  CUSTOMER_FACING_SAFE_DENY_CATEGORIES,
  buildCustomerFacingSafeDenyResponse
};
