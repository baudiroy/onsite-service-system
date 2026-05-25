'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  createBrandReferralApp,
  normalizeBrandReferralApiRequest,
} = require('../../src/brandChannel/brandReferralApp');
const {
  evaluateBrandReferralAccess,
} = require('../../src/brandChannel/brandReferralAccessGuard');

const appPath = path.resolve(__dirname, '../../src/brandChannel/brandReferralApp.js');

function baseRequest(overrides = {}) {
  return {
    body: {
      organization_id: 'org-1',
      brand_id: 'brand-a',
      source_channel: 'brand_line',
      line_channel_id: 'line-channel-1',
      line_user_id: 'line-user-secret-1',
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

function assertNoRuntimeReferralGrant(response) {
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
  assert.doesNotMatch(serialized, /0912/);
  assert.doesNotMatch(serialized, /credential-placeholder/);
  assert.doesNotMatch(serialized, /raw-provider-payload/);
  assert.doesNotMatch(serialized, /raw-ai-payload/i);
  assert.doesNotMatch(serialized, /full customer payload/i);
  assert.doesNotMatch(serialized, /full address/i);
  assert.doesNotMatch(serialized, /DATABASE_URL/);
}

test('brandReferralApp remains synthetic and does not import runtime services', () => {
  const source = fs.readFileSync(appPath, 'utf8');
  const requireTargets = Array.from(source.matchAll(/require\('([^']+)'\)/g))
    .map((match) => match[1]);

  assert.deepEqual(requireTargets, ['./brandReferralRequestNormalizer']);
  assert.doesNotMatch(source, /process\.env/);
  assert.doesNotMatch(source, /fetch\(/);
  assert.doesNotMatch(source, /app\.listen|server\.listen|router\.|express\(/);
  assert.doesNotMatch(source, /axios|pg|pool|repository|provider|webhook|openai|rag|billing/i);
  assert.doesNotMatch(source, /verifyIdentity|createCase|createRepairIntake|writeAudit|writeContact/i);
});

test('missing injected access guard denies before normalized envelope is returned', () => {
  const response = normalizeBrandReferralApiRequest(baseRequest(), {
    requireAccessGuard: true,
  });

  assert.equal(response.statusCode, 403);
  assert.equal(response.body.ok, false);
  assert.equal(response.body.reasonKey, 'brand_referral_access_guard_missing');
  assert.equal(Object.prototype.hasOwnProperty.call(response.body, 'referral'), false);
  assertNoSensitiveEcho(response);
});

test('permission denial returns safe deny envelope before normalizer output is trusted', () => {
  const app = createBrandReferralApp({
    requireAccessGuard: true,
    accessGuard: evaluateBrandReferralAccess,
    accessContext: accessContext({ can_normalize_brand_referral: false }),
  });
  const response = app.normalizeReferralRequest(baseRequest({
    token: 'credential-placeholder',
    customer_phone: '0912-345-678',
  }));

  assert.equal(response.statusCode, 403);
  assert.equal(response.body.messageKey, 'brand_referral.access_denied');
  assert.equal(response.body.reasonKey, 'brand_referral_permission_denied');
  assert.equal(Object.prototype.hasOwnProperty.call(response.body, 'referral'), false);
  assertNoSensitiveEcho(response);
});

test('entitlement denial and organization mismatch deny safely', () => {
  const entitlementDenied = normalizeBrandReferralApiRequest(baseRequest(), {
    requireAccessGuard: true,
    accessGuard: evaluateBrandReferralAccess,
    accessContext: accessContext({ brand_referral_entitled: false }),
  });
  const scopeMismatch = normalizeBrandReferralApiRequest(baseRequest({ organization_id: 'org-2' }), {
    requireAccessGuard: true,
    accessGuard: evaluateBrandReferralAccess,
    accessContext: accessContext({ organization_id: 'org-1' }),
  });

  assert.equal(entitlementDenied.statusCode, 403);
  assert.equal(entitlementDenied.body.reasonKey, 'brand_referral_entitlement_denied');
  assert.equal(scopeMismatch.statusCode, 403);
  assert.equal(scopeMismatch.body.reasonKey, 'organization_scope_mismatch');
  assertNoSensitiveEcho(entitlementDenied);
  assertNoSensitiveEcho(scopeMismatch);
});

test('allowed guarded path still returns normalization-only envelope with no identity or case grants', () => {
  const response = normalizeBrandReferralApiRequest(baseRequest({
    raw_provider_payload: 'raw-provider-payload',
    raw_ai_payload: 'raw-ai-payload',
    full_customer_payload: 'full customer payload',
  }), {
    requireAccessGuard: true,
    accessGuard: evaluateBrandReferralAccess,
    accessContext: accessContext(),
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.messageKey, 'brand_referral.normalized');
  assert.equal(response.body.referral.metadata.source_channel, 'brand_line');
  assert.equal(response.body.referral.metadata.has_scoped_line_context, true);
  assertNoRuntimeReferralGrant(response);
  assertNoSensitiveEcho(response);
});
