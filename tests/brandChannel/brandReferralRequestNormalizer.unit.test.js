'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  normalizeBrandReferralRequest,
} = require('../../src/brandChannel/brandReferralRequestNormalizer');

const modulePath = path.resolve(__dirname, '../../src/brandChannel/brandReferralRequestNormalizer.js');

function assertNoRuntimeGrant(result) {
  assert.deepEqual(result.grants, {
    identityVerified: false,
    caseBinding: false,
    caseDataAccess: false,
    intakeCreated: false,
    auditWritten: false,
  });
}

function assertNoSensitiveEcho(result) {
  const serialized = JSON.stringify(result);
  assert.doesNotMatch(serialized, /line-user-/);
  assert.doesNotMatch(serialized, /0912/);
  assert.doesNotMatch(serialized, /credential-placeholder/);
  assert.doesNotMatch(serialized, /raw-provider-payload/);
  assert.doesNotMatch(serialized, /raw-ai-payload/i);
  assert.doesNotMatch(serialized, /full customer payload/i);
  assert.doesNotMatch(serialized, /full address/i);
  assert.doesNotMatch(serialized, /DATABASE_URL/);
}

test('module remains pure and imports only the referral source policy', () => {
  const source = fs.readFileSync(modulePath, 'utf8');
  const requireTargets = Array.from(source.matchAll(/require\('([^']+)'\)/g))
    .map((match) => match[1]);

  assert.deepEqual(requireTargets, ['./brandReferralSourcePolicy']);
  assert.doesNotMatch(source, /process\.env/);
  assert.doesNotMatch(source, /fetch\(/);
  assert.doesNotMatch(source, /axios|pg|pool|repository|router|express|logger|openai|rag|entitlement/i);
  assert.doesNotMatch(source, /fs|http|https|net|child_process/);
});

test('normalizes brand LINE request metadata without verifying identity or returning raw line user id', () => {
  const result = normalizeBrandReferralRequest({
    body: {
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
        token: 'credential-placeholder',
      },
    },
  });

  assert.deepEqual(result.metadata, {
    organization_id: 'org-1',
    brand_id: 'brand-a',
    source_channel: 'brand_line',
    referral_source: 'official-rich-menu',
    entry_context: {
      entry_link_id: 'repair-button',
      entry_point: 'rich-menu',
      campaign: 'summer-service',
    },
    line_channel_id: 'line-channel-1',
    has_scoped_line_context: true,
    has_line_context: true,
  });
  assert.equal(result.reasonKey, 'brand_line_metadata_only');
  assert.equal(result.requiredNextStep, 'continue_to_verification_or_intake_draft');
  assertNoRuntimeGrant(result);
  assertNoSensitiveEcho(result);
});

test('normalizes brand website request from query data as Basic referral metadata', () => {
  const result = normalizeBrandReferralRequest({
    query: {
      organization_id: 'org-1',
      brand_id: 'brand-a',
      source_channel: 'brand_website',
      referral_source: 'brand-support-page',
      entry_context: {
        entry_link_id: 'web-repair-link',
        utm_source: 'brand-site',
        utm_medium: 'support',
      },
    },
  });

  assert.equal(result.metadata.organization_id, 'org-1');
  assert.equal(result.metadata.brand_id, 'brand-a');
  assert.equal(result.metadata.source_channel, 'brand_website');
  assert.equal(result.metadata.referral_source, 'brand-support-page');
  assert.deepEqual(result.metadata.entry_context, {
    entry_link_id: 'web-repair-link',
    utm_source: 'brand-site',
    utm_medium: 'support',
  });
  assert.equal(result.metadata.has_scoped_line_context, false);
  assert.equal(result.reasonKey, 'brand_website_metadata_only');
  assertNoRuntimeGrant(result);
});

test('normalizes platform LINE request as scoped metadata only', () => {
  const result = normalizeBrandReferralRequest({
    organizationId: 'org-1',
    sourceChannel: 'platform_line',
    lineChannelId: 'platform-line-channel',
    lineUserId: 'line-user-secret-2',
  });

  assert.equal(result.metadata.organization_id, 'org-1');
  assert.equal(result.metadata.source_channel, 'platform_line');
  assert.equal(result.metadata.line_channel_id, 'platform-line-channel');
  assert.equal(result.metadata.has_scoped_line_context, true);
  assert.equal(result.reasonKey, 'platform_line_metadata_only');
  assertNoRuntimeGrant(result);
  assertNoSensitiveEcho(result);
});

test('normalizes SMS and manual referral requests without LINE scope', () => {
  const sms = normalizeBrandReferralRequest({
    body: {
      organization_id: 'org-1',
      source_channel: 'sms',
      referral_source: 'first-contact',
    },
  });
  const manual = normalizeBrandReferralRequest({
    body: {
      organization_id: 'org-1',
      source_channel: 'manual',
      referral_source: 'service-desk',
    },
  });

  assert.equal(sms.metadata.source_channel, 'sms');
  assert.equal(sms.reasonKey, 'sms_metadata_only');
  assert.equal(manual.metadata.source_channel, 'manual');
  assert.equal(manual.reasonKey, 'manual_metadata_only');
  assertNoRuntimeGrant(sms);
  assertNoRuntimeGrant(manual);
});

test('unknown source fails safe with only next-step guidance', () => {
  const result = normalizeBrandReferralRequest({
    body: {
      organization_id: 'org-1',
      source_channel: 'social-chat',
      referral_source: 'not-trusted',
    },
  });

  assert.equal(result.metadata.source_channel, 'unknown');
  assert.equal(result.reasonKey, 'unknown_source_fails_safe');
  assert.equal(result.requiredNextStep, 'collect_valid_referral_source');
  assertNoRuntimeGrant(result);
});

test('unsafe extras from request-like object are stripped and never echoed', () => {
  const result = normalizeBrandReferralRequest({
    body: {
      organization_id: 'org-1',
      brand_id: 'brand-a',
      source_channel: 'brand_line',
      line_channel_id: 'line-channel-1',
      line_user_id: 'line-user-secret-3',
      token: 'credential-placeholder',
      secret: 'credential-placeholder',
      line_access_token: 'credential-placeholder',
      channel_secret: 'credential-placeholder',
      customer_phone: '0912-345-678',
      full_address: 'full address should not echo',
      raw_provider_payload: 'raw-provider-payload',
      raw_ai_payload: 'raw-ai-payload',
      full_customer_payload: 'full customer payload',
      DATABASE_URL: 'DATABASE_URL=credential-placeholder',
      entry_context: {
        entry_link_id: 'safe-link',
        raw_provider_payload: 'raw-provider-payload',
        token: 'credential-placeholder',
      },
    },
    headers: {
      authorization: 'credential-placeholder',
    },
  });

  assert.deepEqual(result.metadata.entry_context, {
    entry_link_id: 'safe-link',
  });
  assertNoRuntimeGrant(result);
  assertNoSensitiveEcho(result);
});

test('scoped LINE metadata with cross-organization context fails safe without identity or case access', () => {
  const result = normalizeBrandReferralRequest({
    body: {
      organization_id: 'org-1',
      line_context_organization_id: 'org-2',
      source_channel: 'brand_line',
      line_channel_id: 'line-channel-1',
      line_user_id: 'line-user-secret-4',
    },
  });

  assert.equal(result.metadata.source_channel, 'brand_line');
  assert.equal(result.metadata.has_scoped_line_context, false);
  assert.equal(result.reasonKey, 'line_context_cross_scope_fails_safe');
  assert.equal(result.requiredNextStep, 'reverify_channel_scope_before_use');
  assertNoRuntimeGrant(result);
  assertNoSensitiveEcho(result);
});

test('malformed input produces unknown safe envelope', () => {
  for (const value of [null, undefined, 'raw string', 42, ['array']]) {
    const result = normalizeBrandReferralRequest(value);

    assert.equal(result.metadata.source_channel, 'unknown');
    assert.equal(result.reasonKey, 'unknown_source_fails_safe');
    assert.equal(result.requiredNextStep, 'collect_valid_referral_source');
    assertNoRuntimeGrant(result);
  }
});
