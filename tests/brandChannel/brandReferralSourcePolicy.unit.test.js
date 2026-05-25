'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  SOURCE_CHANNELS,
  normalizeSourceChannel,
  normalizeBrandReferralSource,
  validateScopedLineMetadata,
} = require('../../src/brandChannel/brandReferralSourcePolicy');

const modulePath = path.resolve(__dirname, '../../src/brandChannel/brandReferralSourcePolicy.js');

function assertNoAccessGrants(result) {
  assert.deepEqual(result.grants, {
    identityVerified: false,
    caseBinding: false,
    caseDataAccess: false,
  });
}

function assertNoSensitiveEcho(result) {
  const serialized = JSON.stringify(result);
  assert.doesNotMatch(serialized, /line-user-/);
  assert.doesNotMatch(serialized, /0912/);
  assert.doesNotMatch(serialized, /credential-placeholder/);
  assert.doesNotMatch(serialized, /raw-provider-payload/);
  assert.doesNotMatch(serialized, /full customer payload/i);
}

test('module remains pure and does not import runtime, DB, provider, env, fs, network, logger, or config code', () => {
  const source = fs.readFileSync(modulePath, 'utf8');

  assert.doesNotMatch(source, /require\(/);
  assert.doesNotMatch(source, /import\s+/);
  assert.doesNotMatch(source, /process\.env/);
  assert.doesNotMatch(source, /fetch\(/);
  assert.doesNotMatch(source, /axios|pg|pool|repository|router|express|logger|config|openai|rag/i);
});

test('exports supported source channels and source channel normalizer', () => {
  assert.deepEqual(SOURCE_CHANNELS, [
    'brand_line',
    'brand_website',
    'platform_line',
    'platform_web',
    'sms',
    'manual',
    'unknown',
  ]);

  assert.equal(normalizeSourceChannel(' BRAND_LINE '), 'brand_line');
  assert.equal(normalizeSourceChannel('not-real'), 'unknown');
  assert.equal(normalizeSourceChannel(''), 'unknown');
});

test('normalizes brand LINE scoped metadata without granting identity or case access', () => {
  const result = normalizeBrandReferralSource({
    organization_id: 'org-1',
    brand_id: 'brand-a',
    source_channel: 'brand_line',
    referral_source: 'official-rich-menu',
    line_channel_id: 'line-channel-1',
    line_user_id: 'line-user-secret-1',
    entry_context: {
      entry_link_id: 'repair-button',
      entry_point: 'rich-menu',
      campaign: 'summer-service',
      ['token']: 'credential-placeholder',
    },
  });

  assert.equal(result.metadata.organizationId, 'org-1');
  assert.equal(result.metadata.brandId, 'brand-a');
  assert.equal(result.metadata.sourceChannel, 'brand_line');
  assert.equal(result.metadata.referralSource, 'official-rich-menu');
  assert.equal(result.metadata.lineChannelId, 'line-channel-1');
  assert.equal(result.metadata.hasScopedLineContext, true);
  assert.equal(result.metadata.hasRawLineUserId, true);
  assert.deepEqual(result.metadata.entryContext, {
    entry_link_id: 'repair-button',
    entry_point: 'rich-menu',
    campaign: 'summer-service',
  });
  assert.equal(result.reasonKey, 'brand_line_metadata_only');
  assertNoAccessGrants(result);
  assertNoSensitiveEcho(result);
});

test('normalizes brand website referral metadata as Basic referral only', () => {
  const result = normalizeBrandReferralSource({
    organization_id: 'org-1',
    brand_id: 'brand-a',
    source_channel: 'brand_website',
    referral_source: 'brand-support-page',
    entry_context: {
      entry_link_id: 'web-repair-link',
      utm_source: 'brand-site',
      utm_medium: 'support',
    },
  });

  assert.equal(result.metadata.sourceChannel, 'brand_website');
  assert.equal(result.metadata.hasScopedLineContext, false);
  assert.equal(result.reasonKey, 'brand_website_metadata_only');
  assert.deepEqual(result.metadata.entryContext, {
    entry_link_id: 'web-repair-link',
    utm_source: 'brand-site',
    utm_medium: 'support',
  });
  assertNoAccessGrants(result);
});

test('normalizes platform LINE only as scoped metadata and never as global identity', () => {
  const result = normalizeBrandReferralSource({
    organization_id: 'org-1',
    source_channel: 'platform_line',
    line_channel_id: 'platform-line-channel',
    line_user_id: 'line-user-secret-2',
  });

  assert.equal(result.metadata.sourceChannel, 'platform_line');
  assert.equal(result.metadata.lineChannelId, 'platform-line-channel');
  assert.equal(result.metadata.hasScopedLineContext, true);
  assert.equal(result.reasonKey, 'platform_line_metadata_only');
  assertNoAccessGrants(result);
  assertNoSensitiveEcho(result);
});

test('normalizes manual source without LINE scope or case access grants', () => {
  const result = normalizeBrandReferralSource({
    organization_id: 'org-1',
    source_channel: 'manual',
    referral_source: 'service-desk',
  });

  assert.equal(result.metadata.sourceChannel, 'manual');
  assert.equal(result.metadata.hasScopedLineContext, false);
  assert.equal(result.reasonKey, 'manual_metadata_only');
  assertNoAccessGrants(result);
});

test('unknown or blank source fails safe to unknown without identity verification or Case Binding', () => {
  const blank = normalizeBrandReferralSource({
    organization_id: 'org-1',
    source_channel: '',
  });
  const unknown = normalizeBrandReferralSource({
    organization_id: 'org-1',
    source_channel: 'partner-chat-room',
  });

  assert.equal(blank.metadata.sourceChannel, 'unknown');
  assert.equal(blank.reasonKey, 'unknown_source_fails_safe');
  assertNoAccessGrants(blank);

  assert.equal(unknown.metadata.sourceChannel, 'unknown');
  assert.equal(unknown.reasonKey, 'unknown_source_fails_safe');
  assertNoAccessGrants(unknown);
});

test('unsafe payload extras are discarded and never echoed into normalized metadata', () => {
  const result = normalizeBrandReferralSource({
    organization_id: 'org-1',
    source_channel: 'brand_line',
    line_channel_id: 'line-channel-1',
    line_user_id: 'line-user-secret-3',
    customer_phone: '0912-345-678',
    full_address: 'full address should not echo',
    ['token']: 'credential-placeholder',
    raw_provider_payload: 'raw-provider-payload',
    full_customer_payload: 'full customer payload',
    entry_context: {
      entry_link_id: 'safe-link',
      full_address: 'full address should not echo',
      raw_provider_payload: 'raw-provider-payload',
    },
  });

  assert.deepEqual(result.metadata.entryContext, {
    entry_link_id: 'safe-link',
  });
  assertNoSensitiveEcho(result);
});

test('cross-organization-like LINE input fails safe as unscoped metadata', () => {
  const result = normalizeBrandReferralSource({
    organization_id: 'org-1',
    line_context_organization_id: 'org-2',
    source_channel: 'brand_line',
    line_channel_id: 'line-channel-1',
    line_user_id: 'line-user-secret-4',
  });

  assert.equal(result.metadata.sourceChannel, 'brand_line');
  assert.equal(result.metadata.hasScopedLineContext, false);
  assert.equal(result.reasonKey, 'line_context_cross_scope_fails_safe');
  assertNoAccessGrants(result);
  assertNoSensitiveEcho(result);
});

test('validateScopedLineMetadata requires organization id, line channel id, and line user id', () => {
  assert.equal(
    validateScopedLineMetadata({
      organization_id: 'org-1',
      line_channel_id: 'line-channel-1',
      line_user_id: 'line-user-secret-5',
    }),
    true,
  );

  assert.equal(validateScopedLineMetadata({ line_channel_id: 'line-channel-1', line_user_id: 'line-user-secret-5' }), false);
  assert.equal(validateScopedLineMetadata({ organization_id: 'org-1', line_user_id: 'line-user-secret-5' }), false);
  assert.equal(validateScopedLineMetadata({ organization_id: 'org-1', line_channel_id: 'line-channel-1' }), false);
});
