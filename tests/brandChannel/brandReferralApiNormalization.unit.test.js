'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  createBrandReferralApp,
  normalizeBrandReferralApiRequest,
} = require('../../src/brandChannel/brandReferralApp');

const appPath = path.resolve(__dirname, '../../src/brandChannel/brandReferralApp.js');

function assertNoRuntimeGrant(response) {
  assert.deepEqual(response.body.referral.grants, {
    identityVerified: false,
    caseBinding: false,
    caseDataAccess: false,
    intakeCreated: false,
    auditWritten: false,
  });
}

function assertNoSensitiveEcho(response) {
  const serialized = JSON.stringify(response);
  assert.doesNotMatch(serialized, /line-user-/);
  assert.doesNotMatch(serialized, /0912/);
  assert.doesNotMatch(serialized, /credential-placeholder/);
  assert.doesNotMatch(serialized, /raw-provider-payload/);
  assert.doesNotMatch(serialized, /raw-ai-payload/i);
  assert.doesNotMatch(serialized, /full customer payload/i);
  assert.doesNotMatch(serialized, /full address/i);
  assert.doesNotMatch(serialized, /DATABASE_URL/);
  assert.doesNotMatch(serialized, /stack/i);
}

test('app adapter imports only the pure request normalizer and no runtime dependencies', () => {
  const source = fs.readFileSync(appPath, 'utf8');
  const requireTargets = Array.from(source.matchAll(/require\('([^']+)'\)/g))
    .map((match) => match[1]);

  assert.deepEqual(requireTargets, ['./brandReferralRequestNormalizer']);
  assert.doesNotMatch(source, /process\.env/);
  assert.doesNotMatch(source, /fetch\(/);
  assert.doesNotMatch(source, /app\.listen|server\.listen/);
  assert.doesNotMatch(source, /axios|pg|pool|repository|router|express|logger|config|openai|rag|webhook|entitlement|audit|contact/i);
  assert.doesNotMatch(source, /require\('node:(fs|http|https|net|child_process)'\)/);
});

test('normalizes brand LINE request body into safe envelope only', () => {
  const app = createBrandReferralApp();
  const response = app.normalizeReferralRequest({
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
      },
    },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.messageKey, 'brand_referral.normalized');
  assert.equal(response.body.referral.metadata.organization_id, 'org-1');
  assert.equal(response.body.referral.metadata.brand_id, 'brand-a');
  assert.equal(response.body.referral.metadata.source_channel, 'brand_line');
  assert.equal(response.body.referral.metadata.line_channel_id, 'line-channel-1');
  assert.equal(response.body.referral.metadata.has_scoped_line_context, true);
  assert.equal(Object.prototype.hasOwnProperty.call(response.body.referral.metadata, 'line_user_id'), false);
  assertNoRuntimeGrant(response);
  assertNoSensitiveEcho(response);
});

test('normalizes query and params request-like input without creating intake or audit write', () => {
  const response = normalizeBrandReferralApiRequest({
    query: {
      organization_id: 'org-1',
      brand_id: 'brand-a',
      source_channel: 'brand_website',
      referral_source: 'brand-support-page',
    },
    params: {
      source_channel: 'manual',
    },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.referral.metadata.source_channel, 'brand_website');
  assert.equal(response.body.referral.metadata.referral_source, 'brand-support-page');
  assert.equal(response.body.referral.reasonKey, 'brand_website_metadata_only');
  assertNoRuntimeGrant(response);
});

test('malformed or unknown input returns safe unknown envelope without stack or internals', () => {
  for (const request of [null, undefined, 'raw string', 42, ['array'], { body: { source_channel: 'unknown-chat' } }]) {
    const response = normalizeBrandReferralApiRequest(request);

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.ok, true);
    assert.equal(response.body.referral.metadata.source_channel, 'unknown');
    assert.equal(response.body.referral.reasonKey, 'unknown_source_fails_safe');
    assert.equal(response.body.referral.requiredNextStep, 'collect_valid_referral_source');
    assertNoRuntimeGrant(response);
    assertNoSensitiveEcho(response);
  }
});

test('unsafe extras are stripped and never echoed through API normalization response', () => {
  const response = normalizeBrandReferralApiRequest({
    body: {
      organization_id: 'org-1',
      brand_id: 'brand-a',
      source_channel: 'brand_line',
      line_channel_id: 'line-channel-1',
      line_user_id: 'line-user-secret-2',
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
    },
    headers: {
      authorization: 'credential-placeholder',
    },
  });

  assert.equal(response.body.referral.metadata.source_channel, 'brand_line');
  assertNoRuntimeGrant(response);
  assertNoSensitiveEcho(response);
});

test('normalization response has no customer case data or runtime side-effect markers', () => {
  const response = normalizeBrandReferralApiRequest({
    body: {
      organization_id: 'org-1',
      brand_id: 'brand-a',
      source_channel: 'platform_line',
      line_channel_id: 'platform-line-channel',
      line_user_id: 'line-user-secret-3',
    },
  });
  const serialized = JSON.stringify(response);

  assert.equal(response.body.referral.metadata.source_channel, 'platform_line');
  assertNoRuntimeGrant(response);
  assert.doesNotMatch(serialized, /caseId|case_id|customerId|customer_id|appointment|completedAt|report/i);
  assert.doesNotMatch(serialized, /auditId|contactLogId|intakeId|caseBindingId/i);
  assertNoSensitiveEcho(response);
});
