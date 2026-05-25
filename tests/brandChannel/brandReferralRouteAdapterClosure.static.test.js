'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const routeAdapter = require('../../src/brandChannel/brandReferralRouteAdapter');
const {
  evaluateBrandReferralAccess,
} = require('../../src/brandChannel/brandReferralAccessGuard');

const repoRoot = path.resolve(__dirname, '../..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function assertFileExists(relativePath) {
  assert.ok(fs.existsSync(path.join(repoRoot, relativePath)), `${relativePath} should exist`);
}

function assertContainsAll(source, patterns, label) {
  for (const pattern of patterns) {
    assert.match(source, pattern, `${label} is missing ${pattern}`);
  }
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

test('Task752 evidence docs and tests exist before closure', () => {
  [
    'src/brandChannel/brandReferralRouteAdapter.js',
    'tests/brandChannel/brandReferralRouteAdapter.unit.test.js',
    'docs/task-752-basic-brand-referral-route-adapter-contract-no-global-mount-no-db.md',
  ].forEach(assertFileExists);
});

test('closure note summarizes Task752-753 route-adapter boundary', () => {
  const source = read('docs/design/brand-official-line-channel-integration.md');

  assertContainsAll(
    source,
    [
      /Task752-753 close the Basic Brand Referral route-adapter slice/,
      /synthetic route-style adapter/,
      /guard-first/,
      /normalization-only/,
      /does not mount a public or global route/,
      /does not implement DB, Case creation, repair intake draft creation, identity verification, Case Binding, audit \/ contact persistence, provider, webhook, entitlement service, usage tracking, reports, admin UI, or AI\/RAG runtime/,
    ],
    'Task752-753 closure note',
  );
});

test('route adapter exports synthetic handler and factory only', () => {
  assert.deepEqual(Object.keys(routeAdapter).sort(), [
    'createBrandReferralRouteAdapter',
    'handleBrandReferralRouteRequest',
  ]);

  const adapter = routeAdapter.createBrandReferralRouteAdapter({
    accessGuard: evaluateBrandReferralAccess,
    accessContext: accessContext(),
  });

  assert.equal(adapter.mounted, false);
  assert.equal(adapter.publicRouteMounted, false);
  assert.equal(typeof adapter.handle, 'function');
});

test('route adapter imports only brandReferralApp and no runtime dependencies', () => {
  const source = read('src/brandChannel/brandReferralRouteAdapter.js');
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

test('guard denial occurs before referral output is returned', () => {
  const response = routeAdapter.handleBrandReferralRouteRequest(request({
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
  assert.equal(response.body.reasonKey, 'brand_referral_permission_denied');
  assert.equal(Object.prototype.hasOwnProperty.call(response.body, 'referral'), false);
  assertNoSensitiveEcho(response);
});

test('allowed route adapter envelope remains normalization-only with no runtime grants', () => {
  const response = routeAdapter.handleBrandReferralRouteRequest(request({
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
  assert.deepEqual(response.body.referral.grants, {
    identityVerified: false,
    caseBinding: false,
    caseDataAccess: false,
    intakeCreated: false,
    auditWritten: false,
  });
  assert.equal(Object.prototype.hasOwnProperty.call(response.body.referral.metadata, 'line_user_id'), false);
  assertNoSensitiveEcho(response);
});

test('Task753 closure document keeps no public mount and no DB decision explicit', () => {
  const source = read('docs/task-753-brand-referral-route-adapter-closure-guard-no-public-mount-no-db.md');

  assertContainsAll(
    source,
    [
      /Status: completed/,
      /Scope: static closure guard \/ no public mount \/ no DB/,
      /No public or global route was mounted/,
      /No DB, migration, provider, LINE, webhook, identity verification, Case Binding, repair intake creation, audit\/contact persistence, entitlement service, AI\/RAG, admin, package, or smoke behavior was changed/,
    ],
    'Task753 closure doc',
  );
});
