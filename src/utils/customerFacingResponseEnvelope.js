const { isCustomerFacingForbiddenFieldName } = require('./customerFacingForbiddenFields');

const CUSTOMER_FACING_RESPONSE_STATUS = Object.freeze({
  OK: 'ok',
  UNAVAILABLE: 'unavailable',
  VERIFICATION_REQUIRED: 'verification_required',
  RATE_LIMITED: 'rate_limited'
});

const CUSTOMER_FACING_MESSAGE_KEYS = Object.freeze({
  SUCCESS: 'customerAccess.available',
  GENERIC_UNAVAILABLE: 'customerAccess.genericUnavailable',
  VERIFICATION_REQUIRED: 'customerAccess.verificationRequired',
  VERIFICATION_FAILED: 'customerAccess.verificationFailed',
  LINK_UNAVAILABLE: 'customerAccess.linkUnavailable',
  RATE_LIMITED: 'customerAccess.rateLimited'
});

const CUSTOMER_SAFE_MESSAGES_BY_KEY = Object.freeze({
  [CUSTOMER_FACING_MESSAGE_KEYS.GENERIC_UNAVAILABLE]:
    'The requested content is currently unavailable. Please verify your link or contact support.',
  [CUSTOMER_FACING_MESSAGE_KEYS.VERIFICATION_REQUIRED]: 'Please complete verification before continuing.',
  [CUSTOMER_FACING_MESSAGE_KEYS.VERIFICATION_FAILED]:
    'Verification could not be completed. Please try again or contact support.',
  [CUSTOMER_FACING_MESSAGE_KEYS.LINK_UNAVAILABLE]:
    'This link cannot currently be used. Please request a new link or contact support.',
  [CUSTOMER_FACING_MESSAGE_KEYS.RATE_LIMITED]: 'This request cannot be processed right now. Please try again later.',
  'customerAccess.tryAgainLater': 'This request cannot be processed right now. Please try again later.'
});

const CUSTOMER_SAFE_REQUEST_REFERENCE_PATTERN = /^reqref_[A-Za-z0-9][A-Za-z0-9_-]{2,63}$/;

const FORBIDDEN_MESSAGE_KEY_PARTS = Object.freeze([
  'case_not_found',
  'report_not_found',
  'customer_not_bound',
  'organization_disabled',
  'token_expired_exact',
  'line_user_mismatch',
  'not_found',
  'mismatch',
  'disabled',
  'expired_exact'
]);

const ALLOWED_NEXT_ACTION_KEYS = Object.freeze(['type', 'labelKey', 'available']);
const ALLOWED_DISPLAY_HINT_KEYS = Object.freeze(['refreshRecommended']);

function hasForbiddenMessageKey(value) {
  const normalizedValue = String(value).toLowerCase();

  return FORBIDDEN_MESSAGE_KEY_PARTS.some((part) => normalizedValue.includes(part));
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isCustomerSafeRequestReference(value) {
  return typeof value === 'string' && CUSTOMER_SAFE_REQUEST_REFERENCE_PATTERN.test(value);
}

function isValidRetryAfterSeconds(value) {
  return Number.isInteger(value) && value > 0;
}

function sanitizeCustomerSafeValue(value) {
  if (Array.isArray(value)) {
    return value.map(sanitizeCustomerSafeValue);
  }

  if (!isPlainObject(value)) {
    return value;
  }

  return Object.entries(value).reduce((sanitized, [key, entryValue]) => {
    if (isCustomerFacingForbiddenFieldName(key)) {
      return sanitized;
    }

    sanitized[key] = sanitizeCustomerSafeValue(entryValue);
    return sanitized;
  }, {});
}

function sanitizeNextActions(nextActions) {
  if (!Array.isArray(nextActions)) {
    return [];
  }

  return nextActions
    .filter((action) => isPlainObject(action))
    .map((action) =>
      ALLOWED_NEXT_ACTION_KEYS.reduce((sanitized, key) => {
        if (Object.prototype.hasOwnProperty.call(action, key)) {
          sanitized[key] = action[key];
        }

        return sanitized;
      }, {})
    )
    .filter((action) => typeof action.type === 'string' && typeof action.labelKey === 'string')
    .filter((action) => !String(action.type).toLowerCase().includes('line'));
}

function sanitizeDisplayHints(displayHints) {
  if (!isPlainObject(displayHints)) {
    return {};
  }

  return ALLOWED_DISPLAY_HINT_KEYS.reduce((sanitized, key) => {
    if (Object.prototype.hasOwnProperty.call(displayHints, key)) {
      sanitized[key] = Boolean(displayHints[key]);
    }

    return sanitized;
  }, {});
}

function normalizeMessageKey(value, fallbackKey) {
  if (typeof value !== 'string' || value.length === 0 || hasForbiddenMessageKey(value)) {
    return fallbackKey;
  }

  return value;
}

function buildCustomerFacingSuccessEnvelope(options = {}) {
  const envelope = {
    status: CUSTOMER_FACING_RESPONSE_STATUS.OK,
    messageKey: normalizeMessageKey(options.messageKey, CUSTOMER_FACING_MESSAGE_KEYS.SUCCESS),
    data: sanitizeCustomerSafeValue(isPlainObject(options.data) ? options.data : {}),
    nextActions: sanitizeNextActions(options.nextActions),
    displayHints: sanitizeDisplayHints(options.displayHints)
  };

  if (isCustomerSafeRequestReference(options.requestReference)) {
    envelope.requestReference = options.requestReference;
  }

  return envelope;
}

function buildCustomerFacingUnavailableEnvelope(options = {}) {
  const allowedUnavailableStatuses = new Set([
    CUSTOMER_FACING_RESPONSE_STATUS.UNAVAILABLE,
    CUSTOMER_FACING_RESPONSE_STATUS.VERIFICATION_REQUIRED,
    CUSTOMER_FACING_RESPONSE_STATUS.RATE_LIMITED
  ]);
  const status = allowedUnavailableStatuses.has(options.status)
    ? options.status
    : CUSTOMER_FACING_RESPONSE_STATUS.UNAVAILABLE;

  const fallbackMessageKey =
    status === CUSTOMER_FACING_RESPONSE_STATUS.RATE_LIMITED
      ? CUSTOMER_FACING_MESSAGE_KEYS.RATE_LIMITED
      : CUSTOMER_FACING_MESSAGE_KEYS.GENERIC_UNAVAILABLE;

  const envelope = {
    status,
    messageKey: normalizeMessageKey(options.messageKey, fallbackMessageKey),
    nextActions: sanitizeNextActions(options.nextActions)
  };
  envelope.customerMessage =
    CUSTOMER_SAFE_MESSAGES_BY_KEY[envelope.messageKey] ||
    CUSTOMER_SAFE_MESSAGES_BY_KEY[CUSTOMER_FACING_MESSAGE_KEYS.GENERIC_UNAVAILABLE];

  if (isCustomerSafeRequestReference(options.requestReference)) {
    envelope.requestReference = options.requestReference;
  }

  if (status === CUSTOMER_FACING_RESPONSE_STATUS.RATE_LIMITED && isValidRetryAfterSeconds(options.retryAfterSeconds)) {
    envelope.retryAfterSeconds = options.retryAfterSeconds;
  }

  return envelope;
}

module.exports = {
  CUSTOMER_FACING_RESPONSE_STATUS,
  buildCustomerFacingSuccessEnvelope,
  buildCustomerFacingUnavailableEnvelope,
  isCustomerSafeRequestReference
};
