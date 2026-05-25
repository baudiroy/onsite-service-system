'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  buildBrandReferralAccessDeniedResponse,
  evaluateBrandReferralAccess,
} = require('../../src/brandChannel/brandReferralAccessGuard');

const modulePath = path.resolve(__dirname, '../../src/brandChannel/brandReferralAccessGuard.js');

function request(overrides = {}) {
  return {
    body: {
      organization_id: 'org-1',
      source_channel: 'brand_line',
      ...overrides,
    },
  };
}

function context(overrides = {}) {
  return {
    organization_id: 'org-1',
    can_normalize_brand_referral: true,
    brand_referral_entitled: true,
    feature_key: 'brand_referral_normalization',
    ...overrides,
  };
}

function assertNoSensitiveEcho(value) {
  const serialized = JSON.stringify(value);
  assert.doesNotMatch(serialized, /line-user-/);
  assert.doesNotMatch(serialized, /0912/);
  assert.doesNotMatch(serialized, /credential-placeholder/);
  assert.doesNotMatch(serialized, /raw-provider-payload/);
  assert.doesNotMatch(serialized, /raw-ai-payload/i);
  assert.doesNotMatch(serialized, /full customer payload/i);
  assert.doesNotMatch(serialized, /full address/i);
  assert.doesNotMatch(serialized, /DATABASE_URL/);
}

test('access guard remains pure and imports no runtime dependencies', () => {
  const source = fs.readFileSync(modulePath, 'utf8');

  assert.doesNotMatch(source, /require\(/);
  assert.doesNotMatch(source, /import\s+/);
  assert.doesNotMatch(source, /process\.env/);
  assert.doesNotMatch(source, /fetch\(/);
  assert.doesNotMatch(source, /axios|pg|pool|repository|router|express|logger|config|openai|rag|webhook|billing/i);
  assert.doesNotMatch(source, /require\('node:(fs|http|https|net|child_process)'\)/);
});

test('allows only when organization scope permission and entitlement are explicit', () => {
  const decision = evaluateBrandReferralAccess({
    request: request(),
    context: context(),
  });

  assert.equal(decision.allowed, true);
  assert.equal(decision.reasonKey, 'brand_referral_access_allowed');
  assert.equal(decision.requiredNextStep, 'continue_to_normalization');
  assert.deepEqual(decision.grants, {
    permissionGranted: true,
    entitlementGranted: true,
    organizationScopeVerified: true,
  });
  assert.deepEqual(decision.metadata, {
    organization_id: 'org-1',
    feature_key: 'brand_referral_normalization',
  });
});

test('missing organization scope fails closed', () => {
  const decision = evaluateBrandReferralAccess({
    request: { body: { source_channel: 'brand_line' } },
    context: context({ organization_id: undefined }),
  });

  assert.equal(decision.allowed, false);
  assert.equal(decision.reasonKey, 'missing_organization_scope');
  assert.equal(decision.requiredNextStep, 'collect_valid_organization_scope');
});

test('cross-scope mismatch fails closed before normalization is trusted', () => {
  const decision = evaluateBrandReferralAccess({
    request: request({ organization_id: 'org-1' }),
    context: context({ organization_id: 'org-2' }),
  });

  assert.equal(decision.allowed, false);
  assert.equal(decision.reasonKey, 'organization_scope_mismatch');
  assert.equal(decision.requiredNextStep, 'recheck_organization_scope');
});

test('permission denial and entitlement denial return safe deny reasons', () => {
  const permissionDenied = evaluateBrandReferralAccess({
    request: request(),
    context: context({ can_normalize_brand_referral: false }),
  });
  const entitlementDenied = evaluateBrandReferralAccess({
    request: request(),
    context: context({ brand_referral_entitled: false }),
  });

  assert.equal(permissionDenied.allowed, false);
  assert.equal(permissionDenied.reasonKey, 'brand_referral_permission_denied');
  assert.equal(permissionDenied.requiredNextStep, 'request_brand_referral_permission');
  assert.equal(entitlementDenied.allowed, false);
  assert.equal(entitlementDenied.reasonKey, 'brand_referral_entitlement_denied');
  assert.equal(entitlementDenied.requiredNextStep, 'enable_brand_referral_entitlement');
});

test('safe deny response exposes no permission internals or sensitive values', () => {
  const decision = evaluateBrandReferralAccess({
    request: request({
      organization_id: 'org-1',
      line_user_id: 'line-user-secret-1',
      customer_phone: '0912-345-678',
      token: 'credential-placeholder',
      raw_provider_payload: 'raw-provider-payload',
      raw_ai_payload: 'raw-ai-payload',
      full_customer_payload: 'full customer payload',
      full_address: 'full address should not echo',
      DATABASE_URL: 'DATABASE_URL=credential-placeholder',
    }),
    context: context({
      organization_id: 'org-2',
      secret: 'credential-placeholder',
    }),
  });
  const response = buildBrandReferralAccessDeniedResponse(decision);

  assert.equal(response.statusCode, 403);
  assert.equal(response.body.ok, false);
  assert.equal(response.body.messageKey, 'brand_referral.access_denied');
  assert.equal(response.body.access.allowed, false);
  assertNoSensitiveEcho(response);
});
