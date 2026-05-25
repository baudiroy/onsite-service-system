'use strict';

const assert = require('node:assert/strict');
const express = require('express');
const fs = require('node:fs');
const path = require('node:path');
const { PassThrough } = require('node:stream');
const test = require('node:test');

const {
  createPublicRouter,
  publicRouter,
} = require('../../src/routes/public.routes');
const {
  evaluateBrandReferralAccess,
} = require('../../src/brandChannel/brandReferralAccessGuard');

const publicRoutesPath = path.resolve(__dirname, '../../src/routes/public.routes.js');

function accessContext(overrides = {}) {
  return {
    organization_id: 'org-1',
    can_normalize_brand_referral: true,
    brand_referral_entitled: true,
    ...overrides,
  };
}

function requestBody(overrides = {}) {
  return {
    organization_id: 'org-1',
    brand_id: 'brand-a',
    source_channel: 'brand_line',
    line_channel_id: 'line-channel-1',
    line_user_id: 'line-user-placeholder-1',
    ...overrides,
  };
}

function createMountedApp(router) {
  const app = express();
  app.use('/api/v1/public', router);
  return app;
}

function dispatch(app, body, { url = '/api/v1/public/brand-referral/normalize' } = {}) {
  return new Promise((resolve, reject) => {
    const req = new PassThrough();
    req.method = 'POST';
    req.url = url;
    req.originalUrl = url;
    req.headers = {
      'content-type': 'application/json',
    };
    req.body = body;

    const response = {
      statusCode: 200,
      headers: {},
      payload: undefined,
      setHeader(name, value) {
        this.headers[name.toLowerCase()] = value;
      },
      getHeader(name) {
        return this.headers[name.toLowerCase()];
      },
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.payload = payload;
        resolve(this);
        return this;
      },
      end(payload) {
        this.payload = payload;
        resolve(this);
        return this;
      },
    };

    app.handle(req, response, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(response);
    });
  });
}

function assertNoRuntimeGrant(payload) {
  assert.deepEqual(payload.referral.grants, {
    identityVerified: false,
    caseBinding: false,
    caseDataAccess: false,
    intakeCreated: false,
    auditWritten: false,
  });
}

function assertNoForbiddenPublicFields(payload) {
  const serialized = JSON.stringify(payload);

  for (const key of [
    'auditIntent',
    'contactWriterResult',
    'writer',
    'writerInternals',
  ]) {
    assert.equal(serialized.includes(key), false, `public response should not include ${key}`);
  }

  assert.doesNotMatch(serialized, /line-user-/);
  assert.doesNotMatch(serialized, /credential-placeholder/);
  assert.doesNotMatch(serialized, /token-placeholder/);
  assert.doesNotMatch(serialized, /secret-placeholder/);
  assert.doesNotMatch(serialized, /channel-secret-placeholder/);
  assert.doesNotMatch(serialized, /full-phone-placeholder/);
  assert.doesNotMatch(serialized, /full address/i);
  assert.doesNotMatch(serialized, /raw-provider-payload/);
  assert.doesNotMatch(serialized, /raw-ai-payload/i);
  assert.doesNotMatch(serialized, /full customer payload/i);
  assert.doesNotMatch(serialized, /DATABASE_URL/);
  assert.doesNotMatch(serialized, /stack/i);
  assert.doesNotMatch(serialized, /SQL syntax|SELECT \*/i);
}

test('public route module exposes mounted router without starting a server or real sinks', () => {
  const source = fs.readFileSync(publicRoutesPath, 'utf8');

  assert.doesNotMatch(source, /app\.listen|server\.listen|\.listen\(/);
  assert.doesNotMatch(source, /pg|Pool|DATABASE_URL|process\.env|fetch\(|axios|webhook|openai|rag/i);
  assert.doesNotMatch(
    source,
    /\b(?:verifyIdentity|bindCase|createRepairIntake|createCase|writeAudit|writeContact)\s*\(/i,
  );
});

test('default mounted public router fails closed when no access guard is injected', async () => {
  const response = await dispatch(createMountedApp(publicRouter), requestBody());

  assert.equal(response.statusCode, 403);
  assert.equal(response.payload.ok, false);
  assert.equal(response.payload.reasonKey, 'brand_referral_access_guard_missing');
  assert.equal(Object.prototype.hasOwnProperty.call(response.payload, 'referral'), false);
  assertNoForbiddenPublicFields(response.payload);
});

test('injected allow guard returns normalization-only body through app-like handler', async () => {
  const app = createMountedApp(createPublicRouter({
    brandReferral: {
      accessGuard: evaluateBrandReferralAccess,
      accessContext: accessContext(),
    },
  }));
  const response = await dispatch(app, requestBody({
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
  assertNoRuntimeGrant(response.payload);
  assertNoForbiddenPublicFields(response.payload);
});

test('injected deny guard returns safe deny before referral output is trusted', async () => {
  const app = createMountedApp(createPublicRouter({
    brandReferral: {
      accessGuard: evaluateBrandReferralAccess,
      accessContext: accessContext({ can_normalize_brand_referral: false }),
    },
  }));
  const response = await dispatch(app, requestBody({
    customer_phone: 'full-phone-placeholder',
    token: 'token-placeholder',
    secret: 'secret-placeholder',
    line_channel_secret: 'channel-secret-placeholder',
    raw_provider_payload: 'raw-provider-payload',
    raw_ai_payload: 'raw-ai-payload',
    full_customer_payload: 'full customer payload',
  }));

  assert.equal(response.statusCode, 403);
  assert.equal(response.payload.ok, false);
  assert.equal(response.payload.reasonKey, 'brand_referral_permission_denied');
  assert.equal(Object.prototype.hasOwnProperty.call(response.payload, 'referral'), false);
  assertNoForbiddenPublicFields(response.payload);
});

test('malformed HTTP-style body returns a safe non-sensitive envelope', async () => {
  const app = createMountedApp(createPublicRouter({
    brandReferral: {
      accessGuard: evaluateBrandReferralAccess,
      accessContext: accessContext(),
    },
  }));
  const response = await dispatch(app, [
    'raw-provider-payload',
    'token-placeholder',
    'full-phone-placeholder',
  ]);

  assert.equal(response.statusCode, 403);
  assert.equal(response.payload.ok, false);
  assert.match(response.payload.reasonKey, /missing_organization_scope|brand_referral_route_invalid_request/);
  assert.equal(Object.prototype.hasOwnProperty.call(response.payload, 'referral'), false);
  assertNoForbiddenPublicFields(response.payload);
});
