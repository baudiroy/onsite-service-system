'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  createBrandReferralRouteAdapter,
} = require('../../src/brandChannel/brandReferralRouteAdapter');
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

test('Task752 and Task753 evidence files exist before public mount readiness', () => {
  [
    'src/brandChannel/brandReferralRouteAdapter.js',
    'tests/brandChannel/brandReferralRouteAdapter.unit.test.js',
    'tests/brandChannel/brandReferralRouteAdapterClosure.static.test.js',
    'docs/task-752-basic-brand-referral-route-adapter-contract-no-global-mount-no-db.md',
    'docs/task-753-brand-referral-route-adapter-closure-guard-no-public-mount-no-db.md',
  ].forEach(assertFileExists);
});

test('route adapter still reports no mount state', () => {
  const adapter = createBrandReferralRouteAdapter({
    accessGuard: evaluateBrandReferralAccess,
    accessContext: {
      organization_id: 'org-1',
      can_normalize_brand_referral: true,
      brand_referral_entitled: true,
    },
  });

  assert.equal(adapter.mounted, false);
  assert.equal(adapter.publicRouteMounted, false);
});

test('Task755 mount supersedes readiness without direct app server or index mount', () => {
  assertFileExists('docs/task-755-brand-referral-public-route-mount-guarded-normalization-only-no-db-no-case-creation.md');

  const globalSource = [
    'src/app.js',
    'src/server.js',
    'src/routes/index.js',
  ].map((relativePath) => read(relativePath)).join('\n');
  const source = [
    'src/routes/public.routes.js',
  ].map((relativePath) => read(relativePath)).join('\n');

  assert.doesNotMatch(globalSource, /brandReferralRouteAdapter/);
  assert.doesNotMatch(globalSource, /handleBrandReferralRouteRequest/);
  assert.doesNotMatch(globalSource, /createBrandReferralRouteAdapter/);
  assert.doesNotMatch(globalSource, /brand-referral/i);
  assert.doesNotMatch(globalSource, /brandReferral/i);
  assert.match(source, /handleBrandReferralRouteRequest/);
  assert.match(source, /router\.post\(\s*'\/brand-referral\/normalize'/);
  assert.match(source, /requireAccessGuard: true/);
});

test('readiness packet defines route contract and explicit approval gates', () => {
  const source = read('docs/task-754-brand-referral-public-route-mount-readiness-packet-no-mount-no-db.md');

  assertContainsAll(
    source,
    [
      /Status: completed/,
      /no public route mount \/ no DB/,
      /Task748-753 close the current Brand Referral route-adapter path/,
      /guard-first/,
      /normalization-only/,
      /no customer case-data disclosure/,
      /API route path and HTTP method/,
      /permission guard source/,
      /entitlement guard source/,
      /audit\/contact logging decision/,
      /DB \/ migration decision/,
      /provider \/ LINE \/ webhook \/ SMS \/ App decision/,
      /AI\/RAG decision/,
      /smoke \/ integration coverage/,
      /admin UI impact/,
    ],
    'Task754 readiness packet',
  );
});

test('readiness docs keep unsafe output forbidden', () => {
  const source = read('docs/task-754-brand-referral-public-route-mount-readiness-packet-no-mount-no-db.md');

  assertContainsAll(
    source,
    [
      /token/,
      /secret/,
      /LINE access token/,
      /channel secret/,
      /raw LINE id/,
      /full phone\/address/,
      /provider payload/,
      /AI payload/,
      /full customer payload/,
      /credential/,
      /DB URL-like values/,
    ],
    'unsafe output policy',
  );
});

test('design docs contain route readiness and entitlement cross-reference', () => {
  const brandDoc = read('docs/design/brand-official-line-channel-integration.md');
  const saasDoc = read('docs/design/saas-plan-entitlement-and-add-ons.md');

  assertContainsAll(
    brandDoc,
    [
      /Task754 records the public route mount readiness gate/,
      /future public route mount requires explicit API, permission, entitlement, audit, DB \/ migration, provider \/ LINE \/ webhook, AI\/RAG, smoke, admin, and package approval/,
    ],
    'brand route readiness note',
  );

  assertContainsAll(
    saasDoc,
    [
      /Task754 keeps Brand Referral public route mount paused until explicit API and entitlement approval/,
      /Future route exposure must not bypass entitlement, permission, organization scope, audit\/contact decisions, or usage tracking decisions/,
    ],
    'SaaS route readiness note',
  );
});
