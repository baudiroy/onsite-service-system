'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  createBrandReferralRouteAdapter,
  handleBrandReferralRouteRequest,
} = require('../../src/brandChannel/brandReferralRouteAdapter');
const {
  evaluateBrandReferralAccess,
} = require('../../src/brandChannel/brandReferralAccessGuard');

const modulePath = path.resolve(__dirname, '../../src/brandChannel/brandReferralRouteAdapter.js');

function request(overrides = {}) {
  return {
    body: {
      organization_id: 'org-1',
      brand_id: 'brand-a',
      source_channel: 'brand_line',
      line_channel_id: 'line-channel-1',
      line_user_id: 'line-user-placeholder-1',
      ...overrides,
    },
  };
}

function accessContext(overrides = {}) {
  return {
    organization_id: 'org-1',
    can_normalize_brand_referral: true,
    brand_referral_entitled: true,
    ...overrides,
  };
}

function assertNoRuntimeGrant(response) {
  assert.deepEqual(response.body.referral.grants, {
    identityVerified: false,
    caseBinding: false,
    caseDataAccess: false,
    intakeCreated: false,
    auditWritten: false,
  });
}

function assertNoSensitiveEcho(value) {
  const serialized = JSON.stringify(value);
  assert.doesNotMatch(serialized, /line-user-/);
  assert.doesNotMatch(serialized, /full-phone-placeholder/);
  assert.doesNotMatch(serialized, /credential-placeholder/);
  assert.doesNotMatch(serialized, /raw-provider-payload/);
  assert.doesNotMatch(serialized, /raw-ai-payload/i);
  assert.doesNotMatch(serialized, /full customer payload/i);
  assert.doesNotMatch(serialized, /full address/i);
  assert.doesNotMatch(serialized, /DATABASE_URL/);
}

test('route adapter remains synthetic and imports no runtime services', () => {
  const source = fs.readFileSync(modulePath, 'utf8');
  const requireTargets = Array.from(source.matchAll(/require\('([^']+)'\)/g))
    .map((match) => match[1]);

  assert.deepEqual(requireTargets, [
    './brandReferralApp',
    './brandReferralAuditIntentBuilder',
  ]);
  assert.doesNotMatch(source, /process\.env/);
  assert.doesNotMatch(source, /fetch\(/);
  assert.doesNotMatch(source, /app\.listen|server\.listen|router\.|express\(/);
  assert.doesNotMatch(source, /axios|pg|pool|repository|provider|webhook|openai|rag|billing/i);
  assert.doesNotMatch(source, /verifyIdentity|createCase|createRepairIntake|writeAudit|writeContact/i);
  assert.doesNotMatch(source, /require\('node:(fs|http|https|net|child_process)'\)/);
});

test('factory exposes an unmounted route-style handle only', () => {
  const adapter = createBrandReferralRouteAdapter({
    accessGuard: evaluateBrandReferralAccess,
    accessContext: accessContext(),
  });

  assert.equal(adapter.mounted, false);
  assert.equal(adapter.publicRouteMounted, false);
  assert.equal(typeof adapter.handle, 'function');
});

test('invalid request is rejected with a safe envelope and no stack internals', () => {
  const response = handleBrandReferralRouteRequest(null, {
    accessGuard: evaluateBrandReferralAccess,
    accessContext: accessContext(),
  });

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.ok, false);
  assert.equal(response.body.reasonKey, 'brand_referral_route_invalid_request');
  assert.equal(Object.prototype.hasOwnProperty.call(response.body, 'stack'), false);
});

test('missing injected guard denies before normalized referral output is returned', () => {
  const response = handleBrandReferralRouteRequest(request());

  assert.equal(response.statusCode, 403);
  assert.equal(response.body.ok, false);
  assert.equal(response.body.reasonKey, 'brand_referral_access_guard_missing');
  assert.equal(Object.prototype.hasOwnProperty.call(response.body, 'referral'), false);
});

test('permission denial happens before normalizer output is trusted', () => {
  const response = handleBrandReferralRouteRequest(request({
    customer_phone: 'full-phone-placeholder',
    token: 'credential-placeholder',
    raw_provider_payload: 'raw-provider-payload',
    raw_ai_payload: 'raw-ai-payload',
    full_customer_payload: 'full customer payload',
  }), {
    accessGuard: evaluateBrandReferralAccess,
    accessContext: accessContext({ can_normalize_brand_referral: false }),
  });

  assert.equal(response.statusCode, 403);
  assert.equal(response.body.ok, false);
  assert.equal(response.body.reasonKey, 'brand_referral_permission_denied');
  assert.equal(Object.prototype.hasOwnProperty.call(response.body, 'referral'), false);
  assertNoSensitiveEcho(response);
});

test('allowed path returns safe normalization-only envelope', () => {
  const response = handleBrandReferralRouteRequest(request({
    raw_provider_payload: 'raw-provider-payload',
    raw_ai_payload: 'raw-ai-payload',
    full_customer_payload: 'full customer payload',
  }), {
    accessGuard: evaluateBrandReferralAccess,
    accessContext: accessContext(),
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.messageKey, 'brand_referral.normalized');
  assert.equal(response.body.referral.metadata.source_channel, 'brand_line');
  assert.equal(response.body.referral.metadata.has_scoped_line_context, true);
  assert.equal(Object.prototype.hasOwnProperty.call(response.body.referral.metadata, 'line_user_id'), false);
  assertNoRuntimeGrant(response);
  assertNoSensitiveEcho(response);
});

test('thrown guard failure returns a safe route error without stack or sensitive echo', () => {
  const response = handleBrandReferralRouteRequest(request({
    token: 'credential-placeholder',
  }), {
    accessGuard: () => {
      throw new Error('credential-placeholder should not echo');
    },
    accessContext: accessContext(),
  });

  assert.equal(response.statusCode, 500);
  assert.equal(response.body.ok, false);
  assert.equal(response.body.reasonKey, 'brand_referral_route_handler_failed');
  assert.equal(Object.prototype.hasOwnProperty.call(response.body, 'stack'), false);
  assertNoSensitiveEcho(response);
});
