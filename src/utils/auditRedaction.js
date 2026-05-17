const REDACTED = '[REDACTED]';

const EXACT_SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'password_hash',
  'token',
  'accesstoken',
  'access_token',
  'refreshtoken',
  'refresh_token',
  'channelsecret',
  'channel_secret',
  'channelaccesstoken',
  'channel_access_token',
  'authorization',
  'apikey',
  'api_key',
  'database_url',
  'jwt_secret',
  'openai_api_key',
  'r2_secret_access_key'
]);

function normalizeKey(key) {
  return String(key || '').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
}

function isSensitiveKey(key) {
  const normalized = normalizeKey(key);
  return (
    EXACT_SENSITIVE_KEYS.has(normalized)
    || normalized.includes('secret')
    || normalized.endsWith('token')
    || normalized.endsWith('apikey')
    || normalized.endsWith('api_key')
  );
}

function sanitizeAuditPayload(value) {
  if (value === null || value === undefined) return value;

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeAuditPayload(item));
  }

  if (typeof value === 'object') {
    return Object.entries(value).reduce((acc, [key, nestedValue]) => {
      acc[key] = isSensitiveKey(key) ? REDACTED : sanitizeAuditPayload(nestedValue);
      return acc;
    }, {});
  }

  return value;
}

module.exports = {
  REDACTED,
  sanitizeAuditPayload
};
