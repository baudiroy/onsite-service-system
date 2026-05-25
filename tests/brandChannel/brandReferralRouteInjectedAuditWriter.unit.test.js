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
  createPublicRouter,
} = require('../../src/routes/public.routes');

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

function createFakeWriter({ result = { ok: true, reasonKey: 'inserted' }, throwError = false } = {}) {
  const calls = [];

  return {
    calls,
    write: async (auditIntent) => {
      calls.push(auditIntent);

      if (throwError) {
        throw new Error('credential-placeholder DATABASE_URL SELECT * FROM hidden');
      }

      return result;
    },
  };
}

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

async function runRoute(router, routeRequest) {
  const route = findRoute(router, '/brand-referral/normalize');
  assert.ok(route, 'brand referral normalize route should be mounted');
  const postLayer = route.route.stack.find((layer) => layer.method === 'post');
  assert.ok(postLayer, 'brand referral normalize route should support POST');
  const response = createResponse();
  const returned = postLayer.handle(routeRequest, response, (error) => {
    throw error;
  });

  if (returned && typeof returned.then === 'function') {
    await returned;
  }

  return response;
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
  assert.doesNotMatch(serialized, /SELECT \*/);
}

function assertNoPublicWriterFields(body) {
  assert.equal(Object.prototype.hasOwnProperty.call(body, 'auditIntent'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(body, 'contactWriterResult'), false);
}

test('allowed guarded route calls injected fake writer once with safe intent and unchanged public body', async () => {
  const contactWriter = createFakeWriter();
  const response = await handleBrandReferralRouteRequest(request({
    customer_phone: 'full-phone-placeholder',
    raw_provider_payload: 'raw-provider-payload',
    raw_ai_payload: 'raw-ai-payload',
    full_customer_payload: 'full customer payload',
  }), {
    accessGuard: evaluateBrandReferralAccess,
    accessContext: accessContext(),
    contactWriter,
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.ok, true);
  assertNoPublicWriterFields(response.body);
  assert.equal(contactWriter.calls.length, 1);
  assert.deepEqual(contactWriter.calls[0], {
    eventType: 'brand_referral_normalized',
    organization_id: 'org-1',
    brand_id: 'brand-a',
    source_channel: 'brand_line',
    referral_source: 'official_line',
    entry_context: undefined,
    line_channel_id: 'line-channel-1',
    reasonKey: 'brand_line_metadata_only',
    resultStatus: 'normalized',
    timestamp: undefined,
    auditWritten: false,
    contactWritten: false,
  });
  assertNoSensitiveEcho(response);
  assertNoSensitiveEcho(contactWriter.calls[0]);
});

test('denied malformed and unknown-source outcomes can call injected fake writer with safe metadata', async () => {
  const deniedWriter = createFakeWriter();
  const denied = await handleBrandReferralRouteRequest(request({
    customer_phone: 'full-phone-placeholder',
    token: 'credential-placeholder',
  }), {
    accessGuard: evaluateBrandReferralAccess,
    accessContext: accessContext({ can_normalize_brand_referral: false }),
    contactWriter: deniedWriter,
  });

  assert.equal(denied.statusCode, 403);
  assert.equal(deniedWriter.calls.length, 1);
  assert.equal(deniedWriter.calls[0].eventType, 'brand_referral_denied');
  assert.equal(deniedWriter.calls[0].reasonKey, 'brand_referral_permission_denied');

  const malformedWriter = createFakeWriter();
  const malformed = await handleBrandReferralRouteRequest(null, {
    accessGuard: evaluateBrandReferralAccess,
    accessContext: accessContext(),
    contactWriter: malformedWriter,
  });

  assert.equal(malformed.statusCode, 400);
  assert.equal(malformedWriter.calls.length, 1);
  assert.equal(malformedWriter.calls[0].eventType, 'brand_referral_malformed');
  assert.equal(malformedWriter.calls[0].resultStatus, 'malformed');

  const unknownWriter = createFakeWriter();
  const unknown = await handleBrandReferralRouteRequest(request({
    source_channel: 'unknown',
    referral_source: 'unknown',
  }), {
    accessGuard: evaluateBrandReferralAccess,
    accessContext: accessContext(),
    contactWriter: unknownWriter,
  });

  assert.equal(unknown.statusCode, 200);
  assert.equal(unknownWriter.calls.length, 1);
  assert.equal(unknownWriter.calls[0].eventType, 'brand_referral_unknown_source');
  assert.equal(unknownWriter.calls[0].reasonKey, 'unknown_source_fails_safe');
  assertNoSensitiveEcho(denied);
  assertNoSensitiveEcho(malformed);
  assertNoSensitiveEcho(unknown);
});

test('writer failure is captured as safe internal metadata without changing public body', async () => {
  const contactWriter = createFakeWriter({ throwError: true });
  const response = await handleBrandReferralRouteRequest(request(), {
    accessGuard: evaluateBrandReferralAccess,
    accessContext: accessContext(),
    contactWriter,
    includeContactWriterResult: true,
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.ok, true);
  assertNoPublicWriterFields(response.body);
  assert.deepEqual(response.contactWriterResult, {
    ok: false,
    reasonKey: 'brand_referral_contact_writer_failed',
  });
  assertNoSensitiveEcho(response);
});

test('public router can pass optional injected fake writer while preserving response shape', async () => {
  const contactWriter = createFakeWriter();
  const router = createPublicRouter({
    brandReferral: {
      accessGuard: evaluateBrandReferralAccess,
      accessContext: accessContext(),
      contactWriter,
    },
  });
  const response = await runRoute(router, request({
    raw_provider_payload: 'raw-provider-payload',
    raw_ai_payload: 'raw-ai-payload',
  }));

  assert.equal(response.statusCode, 200);
  assert.equal(response.payload.ok, true);
  assert.equal(response.payload.messageKey, 'brand_referral.normalized');
  assertNoPublicWriterFields(response.payload);
  assert.equal(contactWriter.calls.length, 1);
  assert.equal(contactWriter.calls[0].eventType, 'brand_referral_normalized');
  assertNoSensitiveEcho(response.payload);
  assertNoSensitiveEcho(contactWriter.calls[0]);
});
