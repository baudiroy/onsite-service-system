'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  normalizeBrandReferralApiRequest,
} = require('../../src/brandChannel/brandReferralApp');
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

test('Task748 through Task750 evidence docs and tests exist before guarded closure', () => {
  [
    'src/brandChannel/brandReferralApp.js',
    'src/brandChannel/brandReferralAccessGuard.js',
    'tests/brandChannel/brandReferralApiNormalization.unit.test.js',
    'tests/brandChannel/brandReferralApiNormalizationClosure.static.test.js',
    'tests/brandChannel/brandReferralAccessGuard.unit.test.js',
    'tests/brandChannel/brandReferralApiPermissionGuard.unit.test.js',
    'docs/task-748-basic-brand-referral-api-normalization-slice-no-db-no-case-creation.md',
    'docs/task-749-basic-brand-referral-api-normalization-closure-guard-no-db-no-route-mount.md',
    'docs/task-750-brand-referral-api-permission-entitlement-guard-no-db-no-public-route.md',
  ].forEach(assertFileExists);
});

test('closure note summarizes Task748-751 guarded normalization boundary', () => {
  const source = read('docs/design/brand-official-line-channel-integration.md');

  assertContainsAll(
    source,
    [
      /Task748-751 close the Basic Brand Referral guarded API normalization slice/,
      /synthetic app\/API adapter/,
      /injected access guard/,
      /normalization-only envelope/,
      /does not mount a public route/,
      /does not implement DB, Case creation, repair intake draft creation, identity verification, Case Binding, audit \/ contact persistence, provider, webhook, entitlement service, usage tracking, reports, admin UI, or AI\/RAG runtime/,
    ],
    'Task748-751 closure note',
  );
});

test('brandReferralApp imports only the pure request normalizer and no runtime dependencies', () => {
  const source = read('src/brandChannel/brandReferralApp.js');
  const requireTargets = Array.from(source.matchAll(/require\('([^']+)'\)/g))
    .map((match) => match[1]);

  assert.deepEqual(requireTargets, ['./brandReferralRequestNormalizer']);
  assert.doesNotMatch(source, /process\.env/);
  assert.doesNotMatch(source, /fetch\(/);
  assert.doesNotMatch(source, /app\.listen|server\.listen|router\.|express\(/);
  assert.doesNotMatch(source, /axios|pg|pool|repository|provider|webhook|openai|rag|billing/i);
  assert.doesNotMatch(source, /verifyIdentity|createCase|createRepairIntake|writeAudit|writeContact/i);
  assert.doesNotMatch(source, /require\('node:(fs|http|https|net|child_process)'\)/);
});

test('guarded app denies before normalized referral output is trusted', () => {
  const response = normalizeBrandReferralApiRequest({
    body: {
      organization_id: 'org-1',
      brand_id: 'brand-a',
      source_channel: 'brand_line',
      line_channel_id: 'line-channel-1',
      line_user_id: 'line-user-placeholder-1',
      customer_phone: 'full-phone-placeholder',
      token: 'credential-placeholder',
      raw_provider_payload: 'raw-provider-payload',
      raw_ai_payload: 'raw-ai-payload',
      full_customer_payload: 'full customer payload',
    },
  }, {
    requireAccessGuard: true,
    accessGuard: evaluateBrandReferralAccess,
    accessContext: {
      organization_id: 'org-1',
      can_normalize_brand_referral: false,
      brand_referral_entitled: true,
    },
  });

  assert.equal(response.statusCode, 403);
  assert.equal(response.body.ok, false);
  assert.equal(response.body.messageKey, 'brand_referral.access_denied');
  assert.equal(response.body.reasonKey, 'brand_referral_permission_denied');
  assert.equal(Object.prototype.hasOwnProperty.call(response.body, 'referral'), false);
  assertNoSensitiveEcho(response);
});

test('guarded app allowed path remains normalization-only with no runtime grants', () => {
  const response = normalizeBrandReferralApiRequest({
    body: {
      organization_id: 'org-1',
      brand_id: 'brand-a',
      source_channel: 'brand_line',
      line_channel_id: 'line-channel-1',
      line_user_id: 'line-user-placeholder-1',
      raw_provider_payload: 'raw-provider-payload',
      raw_ai_payload: 'raw-ai-payload',
      full_customer_payload: 'full customer payload',
    },
  }, {
    requireAccessGuard: true,
    accessGuard: evaluateBrandReferralAccess,
    accessContext: {
      organization_id: 'org-1',
      can_normalize_brand_referral: true,
      brand_referral_entitled: true,
    },
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
  assert.equal(response.body.referral.metadata.source_channel, 'brand_line');
  assert.equal(response.body.referral.metadata.has_scoped_line_context, true);
  assert.equal(Object.prototype.hasOwnProperty.call(response.body.referral.metadata, 'line_user_id'), false);
  assertNoSensitiveEcho(response);
});

test('Task751 closure document keeps no public route and no DB decision explicit', () => {
  const source = read('docs/task-751-brand-referral-guarded-normalization-closure-guard-no-db-no-public-route.md');

  assertContainsAll(
    source,
    [
      /Status: completed/,
      /Scope: static closure guard \/ no DB \/ no public route/,
      /No public route was mounted/,
      /No DB, migration, provider, LINE, webhook, identity verification, Case Binding, repair intake creation, audit\/contact persistence, entitlement service, AI\/RAG, admin, package, or smoke behavior was changed/,
    ],
    'Task751 closure doc',
  );
});
