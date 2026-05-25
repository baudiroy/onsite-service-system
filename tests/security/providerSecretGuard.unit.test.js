'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  PROVIDER_SECRET_DECISIONS,
  PROVIDER_SECRET_PLACEHOLDERS,
  PROVIDER_SECRET_REASON_KEYS,
  evaluateProviderSecretGuard,
  isUnsafeSecretKey,
  isUnsafeSecretValue,
  redactProviderSecrets,
} = require('../../src/security/providerSecretGuard');

test('detects unsafe provider secret key patterns', () => {
  for (const key of [
    'token',
    'secret',
    'credential',
    'password',
    'apiKey',
    'accessToken',
    'refreshToken',
    'privateKey',
    'channelSecret',
    'webhookSecret',
    'databaseUrl',
    'aiProviderKey',
    'lineAccessToken',
  ]) {
    assert.equal(isUnsafeSecretKey(key), true, key);
  }

  assert.equal(isUnsafeSecretKey('publicRegion'), false);
});

test('detects unsafe value patterns without returning original values', () => {
  for (const value of [
    'Bearer abcdefghijklmnopqrstuvwxyz123456',
    'sk-proj-abcdefghijklmnopqrstuvwxyz123456',
    'xoxb-1234567890-secret-token',
    'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.signature',
    'postgres://user:pass@example.test/db',
    '-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----',
  ]) {
    assert.equal(isUnsafeSecretValue(value), true, value);
  }

  assert.equal(isUnsafeSecretValue('public-region-a'), false);
});

test('redacts LINE token, AI provider key, DB URL, webhook secret, and private key', () => {
  const unsafeConfig = {
    lineAccessToken: 'Bearer abcdefghijklmnopqrstuvwxyz123456',
    aiProviderKey: 'sk-proj-abcdefghijklmnopqrstuvwxyz123456',
    databaseUrl: 'postgres://user:pass@example.test/db',
    webhookSecret: 'whsec_abcdefghijklmnopqrstuvwxyz123456',
    privateKey: '-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----',
  };
  const result = evaluateProviderSecretGuard(unsafeConfig);
  const serialized = JSON.stringify(result);

  assert.equal(result.allowed, false);
  assert.equal(result.decision, PROVIDER_SECRET_DECISIONS.DENY);
  assert.equal(result.reasonKey, PROVIDER_SECRET_REASON_KEYS.UNSAFE_SECRET_DETECTED);
  assert.equal(result.summary.unsafeSecretCount, 5);
  assert.equal(serialized.includes('Bearer abcdefghijklmnopqrstuvwxyz123456'), false);
  assert.equal(serialized.includes('sk-proj-abcdefghijklmnopqrstuvwxyz123456'), false);
  assert.equal(serialized.includes('postgres://user:pass@example.test/db'), false);
  assert.equal(serialized.includes('whsec_abcdefghijklmnopqrstuvwxyz123456'), false);
  assert.equal(serialized.includes('BEGIN PRIVATE KEY'), false);
  assert.equal(
    Object.values(result.redactedValue).every((value) => value === PROVIDER_SECRET_PLACEHOLDERS.SECRET),
    true,
  );
});

test('benign public config is allowed only when keys are explicitly allowed', () => {
  const publicConfig = {
    publicName: 'Primary service channel',
    region: 'ap-northeast-1',
    enabled: true,
  };
  const allowed = evaluateProviderSecretGuard(publicConfig, {
    allowedPublicKeys: ['publicName', 'region', 'enabled'],
  });
  const denied = evaluateProviderSecretGuard(publicConfig, {
    allowedPublicKeys: ['publicName'],
  });

  assert.equal(allowed.allowed, true);
  assert.deepEqual(allowed.redactedValue, {
    public_name: 'Primary service channel',
    region: 'ap-northeast-1',
    enabled: true,
  });
  assert.equal(denied.allowed, false);
  assert.equal(denied.reasonKey, PROVIDER_SECRET_REASON_KEYS.UNKNOWN_CONFIG_FIELD);
  assert.equal(denied.redactedValue.region, PROVIDER_SECRET_PLACEHOLDERS.UNKNOWN);
});

test('nested object cases are redacted recursively', () => {
  const result = evaluateProviderSecretGuard({
    provider: {
      publicName: 'LINE channel',
      credentials: {
        accessToken: 'Bearer abcdefghijklmnopqrstuvwxyz123456',
      },
      metadata: {
        region: 'taiwan',
      },
    },
  }, {
    allowedPublicKeys: ['publicName', 'region'],
  });
  const serialized = JSON.stringify(result);

  assert.equal(result.allowed, false);
  assert.equal(result.redactedValue.provider.public_name, 'LINE channel');
  assert.equal(result.redactedValue.provider.credentials, PROVIDER_SECRET_PLACEHOLDERS.SECRET);
  assert.equal(result.redactedValue.provider.metadata.region, 'taiwan');
  assert.equal(serialized.includes('Bearer abcdefghijklmnopqrstuvwxyz123456'), false);
});

test('redaction helper returns stable placeholders only', () => {
  const result = redactProviderSecrets({
    token: 'Bearer abcdefghijklmnopqrstuvwxyz123456',
    unknownSetting: 'do-not-log',
  });

  assert.deepEqual(result.redactedValue, {
    token: PROVIDER_SECRET_PLACEHOLDERS.SECRET,
    unknown_setting: PROVIDER_SECRET_PLACEHOLDERS.UNKNOWN,
  });
  assert.equal(result.unsafeSecretCount, 1);
  assert.equal(result.unknownFieldCount, 1);
});

test('decision and audit intent do not expose raw secret values or partial substrings', () => {
  const result = evaluateProviderSecretGuard({
    lineAccessToken: 'Bearer abcdefghijklmnopqrstuvwxyz123456',
    prompt: 'prompt should not leak',
    payload: {
      credential: 'sk-proj-abcdefghijklmnopqrstuvwxyz123456',
    },
  });
  const serialized = JSON.stringify(result);

  assert.equal(serialized.includes('Bearer'), false);
  assert.equal(serialized.includes('abcdefghijklmnopqrstuvwxyz123456'), false);
  assert.equal(serialized.includes('prompt should not leak'), false);
  assert.equal(serialized.includes('sk-proj'), false);
  assert.deepEqual(Object.keys(result.auditIntent).sort(), ['eventType', 'required', 'safeSummary']);
  assert.deepEqual(Object.keys(result.auditIntent.safeSummary).sort(), [
    'unknownFieldCount',
    'unsafeSecretCount',
  ]);
});
