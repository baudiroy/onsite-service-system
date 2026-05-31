'use strict';

const DENY_MESSAGE_KEY = 'customerAccess.unavailable';
const ALLOW_MESSAGE_KEY = 'customerAccess.available';

const CASE_SUMMARY_RESPONSE_KEYS = Object.freeze([
  'caseNo',
  'publicReportId',
  'status',
  'summary',
]);

const UNSAFE_TEXT_PATTERNS = Object.freeze([
  /authorization/i,
  /bearer\s+[a-z0-9._-]+/i,
  /cookie/i,
  /password/i,
  /postgres(?:ql)?:\/\//i,
  /raw[_-]/i,
  /secret/i,
  /select\s+\*/i,
  /should_not_leak/i,
  /token/i,
]);

function isPlainObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}

function safeText(value, maxLength = 512) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const text = typeof value === 'string' ? value.trim() : String(value).trim();

  if (!text || text.length > maxLength) {
    return undefined;
  }

  if (UNSAFE_TEXT_PATTERNS.some((pattern) => pattern.test(text))) {
    return undefined;
  }

  return text;
}

function projectionSource(input) {
  if (!isPlainObject(input) || input.status === 'deny' || input.customerVisible === false) {
    return undefined;
  }

  if (isPlainObject(input.data) && isPlainObject(input.data.caseSummary)) {
    return input.data.caseSummary;
  }

  if (isPlainObject(input.caseSummary)) {
    return input.caseSummary;
  }

  return input;
}

function buildCustomerAccessCaseSummarySafeDenyEnvelope() {
  return {
    status: 'deny',
    messageKey: DENY_MESSAGE_KEY,
    customerVisible: false,
    data: null,
    error: {
      messageKey: DENY_MESSAGE_KEY,
    },
  };
}

function buildCustomerAccessCaseSummarySafeEnvelope(input) {
  const source = projectionSource(input);

  if (!source) {
    return buildCustomerAccessCaseSummarySafeDenyEnvelope();
  }

  const caseSummary = {};

  for (const key of CASE_SUMMARY_RESPONSE_KEYS) {
    const value = safeText(source[key], key === 'summary' ? 1024 : 256);

    if (value) {
      caseSummary[key] = value;
    }
  }

  if (Object.keys(caseSummary).length === 0) {
    return buildCustomerAccessCaseSummarySafeDenyEnvelope();
  }

  return {
    status: 'allow',
    messageKey: ALLOW_MESSAGE_KEY,
    customerVisible: true,
    data: {
      caseSummary,
    },
  };
}

module.exports = {
  buildCustomerAccessCaseSummarySafeDenyEnvelope,
  buildCustomerAccessCaseSummarySafeEnvelope,
};
