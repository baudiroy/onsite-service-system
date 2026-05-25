'use strict';

const PROVIDER_SECRET_DECISIONS = Object.freeze({
  ALLOW: 'allow',
  DENY: 'deny',
});

const PROVIDER_SECRET_REASON_KEYS = Object.freeze({
  ALLOWED: 'providerSecret.allowed',
  UNSAFE_SECRET_DETECTED: 'providerSecret.denied.unsafeSecretDetected',
  UNKNOWN_CONFIG_FIELD: 'providerSecret.denied.unknownConfigField',
});

const PROVIDER_SECRET_PLACEHOLDERS = Object.freeze({
  SECRET: '[REDACTED_SECRET]',
  UNKNOWN: '[REDACTED_UNAPPROVED_CONFIG]',
});

const UNSAFE_KEY_PATTERNS = Object.freeze([
  /token/,
  /secret/,
  /credential/,
  /password/,
  /api[_-]?key/,
  /access[_-]?token/,
  /refresh[_-]?token/,
  /private[_-]?key/,
  /channel[_-]?secret/,
  /webhook[_-]?secret/,
  /database[_-]?url/,
  /db[_-]?url/,
  /ai[_-]?provider[_-]?key/,
  /line[_-]?access[_-]?token/,
]);

const UNSAFE_VALUE_PATTERNS = Object.freeze([
  /^bearer\s+[a-z0-9._~+/-]+=*$/i,
  /^sk-[a-z0-9_-]{12,}$/i,
  /^sk-proj-[a-z0-9_-]{12,}$/i,
  /^xox[baprs]-[a-z0-9-]{12,}$/i,
  /^eyj[a-z0-9_-]+\.[a-z0-9_-]+\.[a-z0-9_-]+$/i,
  /postgres(?:ql)?:\/\/[^\\s]+/i,
  /mysql:\/\/[^\\s]+/i,
  /mongodb(?:\\+srv)?:\/\/[^\\s]+/i,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /^[A-Za-z0-9+/]{40,}={0,2}$/,
]);

function normalizeKey(key) {
  if (typeof key !== 'string') {
    return '';
  }

  return key
    .trim()
    .replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`)
    .replace(/[^a-z0-9]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isUnsafeSecretKey(key) {
  const normalizedKey = normalizeKey(key);

  return Boolean(normalizedKey && UNSAFE_KEY_PATTERNS.some((pattern) => pattern.test(normalizedKey)));
}

function isUnsafeSecretValue(value) {
  if (typeof value !== 'string') {
    return false;
  }

  const trimmedValue = value.trim();

  return Boolean(trimmedValue && UNSAFE_VALUE_PATTERNS.some((pattern) => pattern.test(trimmedValue)));
}

function createAllowedKeySet(allowedPublicKeys) {
  return new Set(
    Array.isArray(allowedPublicKeys)
      ? allowedPublicKeys.map(normalizeKey).filter(Boolean)
      : [],
  );
}

function redactNode(value, state, parentKey) {
  if (isUnsafeSecretKey(parentKey) || isUnsafeSecretValue(value)) {
    state.unsafeSecretCount += 1;
    return PROVIDER_SECRET_PLACEHOLDERS.SECRET;
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactNode(item, state, parentKey));
  }

  if (isPlainObject(value)) {
    return Object.freeze(Object.entries(value).reduce((accumulator, [key, childValue]) => {
      const normalizedKey = normalizeKey(key);

      if (isUnsafeSecretKey(key) || isUnsafeSecretValue(childValue)) {
        state.unsafeSecretCount += 1;
        accumulator[normalizedKey || key] = PROVIDER_SECRET_PLACEHOLDERS.SECRET;
        return accumulator;
      }

      if (isPlainObject(childValue) || Array.isArray(childValue)) {
        accumulator[normalizedKey || key] = redactNode(childValue, state, key);
        return accumulator;
      }

      if (state.allowedKeys.has(normalizedKey)) {
        accumulator[normalizedKey] = childValue;
        return accumulator;
      }

      state.unknownFieldCount += 1;
      accumulator[normalizedKey || key] = PROVIDER_SECRET_PLACEHOLDERS.UNKNOWN;
      return accumulator;
    }, {}));
  }

  if (parentKey && state.allowedKeys.has(normalizeKey(parentKey))) {
    return value;
  }

  state.unknownFieldCount += 1;
  return PROVIDER_SECRET_PLACEHOLDERS.UNKNOWN;
}

function redactProviderSecrets(configLikeValue, options = {}) {
  const state = {
    allowedKeys: createAllowedKeySet(options.allowedPublicKeys),
    unsafeSecretCount: 0,
    unknownFieldCount: 0,
  };
  const redactedValue = redactNode(configLikeValue, state, undefined);

  return Object.freeze({
    redactedValue,
    unsafeSecretCount: state.unsafeSecretCount,
    unknownFieldCount: state.unknownFieldCount,
  });
}

function evaluateProviderSecretGuard(configLikeValue, options = {}) {
  const result = redactProviderSecrets(configLikeValue, options);
  const allowed = result.unsafeSecretCount === 0 && result.unknownFieldCount === 0;
  const reasonKey = allowed
    ? PROVIDER_SECRET_REASON_KEYS.ALLOWED
    : (
      result.unsafeSecretCount > 0
        ? PROVIDER_SECRET_REASON_KEYS.UNSAFE_SECRET_DETECTED
        : PROVIDER_SECRET_REASON_KEYS.UNKNOWN_CONFIG_FIELD
    );

  return Object.freeze({
    allowed,
    decision: allowed ? PROVIDER_SECRET_DECISIONS.ALLOW : PROVIDER_SECRET_DECISIONS.DENY,
    reasonKey,
    redactedValue: result.redactedValue,
    summary: Object.freeze({
      unsafeSecretCount: result.unsafeSecretCount,
      unknownFieldCount: result.unknownFieldCount,
    }),
    auditIntent: Object.freeze({
      required: true,
      eventType: 'provider_secret_guard_evaluated',
      safeSummary: Object.freeze({
        unsafeSecretCount: result.unsafeSecretCount,
        unknownFieldCount: result.unknownFieldCount,
      }),
    }),
  });
}

module.exports = Object.freeze({
  PROVIDER_SECRET_DECISIONS,
  PROVIDER_SECRET_REASON_KEYS,
  PROVIDER_SECRET_PLACEHOLDERS,
  isUnsafeSecretKey,
  isUnsafeSecretValue,
  redactProviderSecrets,
  evaluateProviderSecretGuard,
});
