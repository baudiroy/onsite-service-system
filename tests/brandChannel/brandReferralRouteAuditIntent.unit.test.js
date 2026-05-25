'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  handleBrandReferralRouteRequest,
} = require('../../src/brandChannel/brandReferralRouteAdapter');
const {
  evaluateBrandReferralAccess,
} = require('../../src/brandChannel/brandReferralAccessGuard');
const {
  BRAND_REFERRAL_AUDIT_EVENT_TYPES,
} = require('../../src/brandChannel/brandReferralAuditIntentBuilder');

function request(overrides = {}) {
  return {
    body: {
      organization_id: 'org-1',
      brand_id: 'brand-a',
      source_channel: 'brand_line',
      referral_source: 'official_line',
      entry_context: 'repair_entry',
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

function assertNoSensitiveEcho(value) {
  const serialized = JSON.stringify(value);
  assert.doesNotMatch(serialized, /line-user-/);
  assert.doesNotMatch(serialized, /full-phone-placeholder/);
  assert.doesNotMatch(serialized, /full-address-placeholder/);
  assert.doesNotMatch(serialized, /credential-placeholder/);
  assert.doesNotMatch(serialized, /raw-provider-payload/);
  assert.doesNotMatch(serialized, /raw-ai-payload/i);
  assert.doesNotMatch(serialized, /full customer payload/i);
  assert.doesNotMatch(serialized, /DATABASE_URL/);
}

function assertNoPublicAuditIntent(response) {
  assert.equal(Object.prototype.hasOwnProperty.call(response.body, 'auditIntent'), false);
}

test('allowed route can return internal audit intent without changing public body', () => {
  const response = handleBrandReferralRouteRequest(request({
    raw_provider_payload: 'raw-provider-payload',
    raw_ai_payload: 'raw-ai-payload',
    full_customer_payload: 'full customer payload',
  }), {
    includeAuditIntent: true,
    accessGuard: evaluateBrandReferralAccess,
    accessContext: accessContext(),
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.ok, true);
  assertNoPublicAuditIntent(response);
  assert.deepEqual(response.body.referral.grants, {
    identityVerified: false,
    caseBinding: false,
    caseDataAccess: false,
    intakeCreated: false,
    auditWritten: false,
  });
  assert.equal(response.auditIntent.eventType, BRAND_REFERRAL_AUDIT_EVENT_TYPES.normalized);
  assert.equal(response.auditIntent.organization_id, 'org-1');
  assert.equal(response.auditIntent.brand_id, 'brand-a');
  assert.equal(response.auditIntent.source_channel, 'brand_line');
  assert.equal(response.auditIntent.line_channel_id, 'line-channel-1');
  assert.equal(response.auditIntent.auditWritten, false);
  assert.equal(response.auditIntent.contactWritten, false);
  assertNoSensitiveEcho(response.auditIntent);
});

test('public response shape is unchanged when audit intent is not requested', () => {
  const response = handleBrandReferralRouteRequest(request(), {
    accessGuard: evaluateBrandReferralAccess,
    accessContext: accessContext(),
  });

  assert.equal(Object.prototype.hasOwnProperty.call(response, 'auditIntent'), false);
  assertNoPublicAuditIntent(response);
});

test('denied guard result can return redacted internal audit intent', () => {
  const response = handleBrandReferralRouteRequest(request({
    customer_phone: 'full-phone-placeholder',
    token: 'credential-placeholder',
    raw_provider_payload: 'raw-provider-payload',
    raw_ai_payload: 'raw-ai-payload',
    full_customer_payload: 'full customer payload',
  }), {
    includeAuditIntent: true,
    accessGuard: evaluateBrandReferralAccess,
    accessContext: accessContext({ can_normalize_brand_referral: false }),
  });

  assert.equal(response.statusCode, 403);
  assert.equal(response.body.reasonKey, 'brand_referral_permission_denied');
  assert.equal(Object.prototype.hasOwnProperty.call(response.body, 'referral'), false);
  assertNoPublicAuditIntent(response);
  assert.equal(response.auditIntent.eventType, BRAND_REFERRAL_AUDIT_EVENT_TYPES.denied);
  assert.equal(response.auditIntent.reasonKey, 'brand_referral_permission_denied');
  assert.equal(response.auditIntent.auditWritten, false);
  assert.equal(response.auditIntent.contactWritten, false);
  assertNoSensitiveEcho(response);
});

test('malformed route request can return safe internal audit intent', () => {
  const response = handleBrandReferralRouteRequest(null, {
    includeAuditIntent: true,
    accessGuard: evaluateBrandReferralAccess,
    accessContext: accessContext(),
  });

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.reasonKey, 'brand_referral_route_invalid_request');
  assertNoPublicAuditIntent(response);
  assert.equal(response.auditIntent.eventType, BRAND_REFERRAL_AUDIT_EVENT_TYPES.malformed);
  assert.equal(response.auditIntent.resultStatus, 'malformed');
  assert.equal(response.auditIntent.auditWritten, false);
  assert.equal(response.auditIntent.contactWritten, false);
  assertNoSensitiveEcho(response);
});

test('unknown-source normalization can return unknown-source audit intent', () => {
  const response = handleBrandReferralRouteRequest(request({
    source_channel: 'unknown',
    referral_source: 'unknown',
  }), {
    includeAuditIntent: true,
    accessGuard: evaluateBrandReferralAccess,
    accessContext: accessContext(),
  });

  assert.equal(response.statusCode, 200);
  assertNoPublicAuditIntent(response);
  assert.equal(response.body.referral.reasonKey, 'unknown_source_fails_safe');
  assert.equal(response.auditIntent.eventType, BRAND_REFERRAL_AUDIT_EVENT_TYPES.unknownSource);
  assert.equal(response.auditIntent.reasonKey, 'unknown_source_fails_safe');
  assertNoSensitiveEcho(response);
});
