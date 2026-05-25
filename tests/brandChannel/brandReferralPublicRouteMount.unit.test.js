'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createPublicRouter,
  publicRouter,
} = require('../../src/routes/public.routes');
const {
  evaluateBrandReferralAccess,
} = require('../../src/brandChannel/brandReferralAccessGuard');

function findRoute(router, routePath) {
  return router.stack.find((layer) => layer.route && layer.route.path === routePath);
}

function createResponse() {
  return {
    statusCode: null,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };
}

function runRoute(router, request) {
  const route = findRoute(router, '/brand-referral/normalize');
  assert.ok(route, 'brand referral normalize route should be mounted');
  const postLayer = route.route.stack.find((layer) => layer.method === 'post');
  assert.ok(postLayer, 'brand referral normalize route should support POST');
  const response = createResponse();

  postLayer.handle(request, response, (error) => {
    throw error;
  });

  return response;
}

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

test('public router mounts brand referral normalize route once', () => {
  const routes = publicRouter.stack
    .filter((layer) => layer.route && layer.route.path === '/brand-referral/normalize');

  assert.equal(routes.length, 1);
  assert.equal(Boolean(routes[0].route.methods.post), true);
});

test('default public route fails closed when no access guard is injected', () => {
  const response = runRoute(publicRouter, request());

  assert.equal(response.statusCode, 403);
  assert.equal(response.payload.ok, false);
  assert.equal(response.payload.reasonKey, 'brand_referral_access_guard_missing');
  assert.equal(Object.prototype.hasOwnProperty.call(response.payload, 'referral'), false);
});

test('injected permission denial returns safe deny before referral output', () => {
  const router = createPublicRouter({
    brandReferral: {
      accessGuard: evaluateBrandReferralAccess,
      accessContext: accessContext({ can_normalize_brand_referral: false }),
    },
  });
  const response = runRoute(router, request({
    customer_phone: 'full-phone-placeholder',
    token: 'credential-placeholder',
    raw_provider_payload: 'raw-provider-payload',
    raw_ai_payload: 'raw-ai-payload',
    full_customer_payload: 'full customer payload',
  }));

  assert.equal(response.statusCode, 403);
  assert.equal(response.payload.ok, false);
  assert.equal(response.payload.reasonKey, 'brand_referral_permission_denied');
  assert.equal(Object.prototype.hasOwnProperty.call(response.payload, 'referral'), false);
  assertNoSensitiveEcho(response.payload);
});

test('injected allowed route remains normalization-only with no runtime grants', () => {
  const router = createPublicRouter({
    brandReferral: {
      accessGuard: evaluateBrandReferralAccess,
      accessContext: accessContext(),
    },
  });
  const response = runRoute(router, request({
    raw_provider_payload: 'raw-provider-payload',
    raw_ai_payload: 'raw-ai-payload',
    full_customer_payload: 'full customer payload',
  }));

  assert.equal(response.statusCode, 200);
  assert.equal(response.payload.ok, true);
  assert.equal(response.payload.messageKey, 'brand_referral.normalized');
  assert.equal(response.payload.referral.metadata.source_channel, 'brand_line');
  assert.equal(response.payload.referral.metadata.has_scoped_line_context, true);
  assert.equal(Object.prototype.hasOwnProperty.call(response.payload.referral.metadata, 'line_user_id'), false);
  assert.deepEqual(response.payload.referral.grants, {
    identityVerified: false,
    caseBinding: false,
    caseDataAccess: false,
    intakeCreated: false,
    auditWritten: false,
  });
  assertNoSensitiveEcho(response.payload);
});
