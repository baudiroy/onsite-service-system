'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

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

test('Task756 closure evidence exists', () => {
  [
    'src/routes/public.routes.js',
    'tests/brandChannel/brandReferralPublicRouteMount.unit.test.js',
    'tests/brandChannel/brandReferralPublicRouteMount.static.test.js',
    'tests/brandChannel/brandReferralPublicRouteMountReadiness.static.test.js',
    'docs/task-755-brand-referral-public-route-mount-guarded-normalization-only-no-db-no-case-creation.md',
    'docs/task-756-brand-referral-public-route-mount-closure-guard-no-db-no-side-effects.md',
  ].forEach(assertFileExists);
});

test('public route mount remains single guarded normalization route', () => {
  const source = read('src/routes/public.routes.js');
  const routeMatches = source.match(/router\.post\(\s*'\/brand-referral\/normalize'/g) || [];

  assert.equal(routeMatches.length, 1);
  assertContainsAll(
    source,
    [
      /handleBrandReferralRouteRequest/,
      /createBrandReferralNormalizeHandler/,
      /requireAccessGuard: true/,
      /accessGuard: options\.accessGuard/,
      /accessContext: options\.accessContext/,
      /const publicRouter = createPublicRouter\(\)/,
    ],
    'public route closure',
  );
});

test('public route file stays free of side-effect runtimes', () => {
  const source = read('src/routes/public.routes.js');

  [
    /process\.env/,
    /fetch\(/,
    /app\.listen|server\.listen/,
    /axios|pg|pool|repository|provider|webhook|sms|openai|rag|billing|entitlement/i,
    /lineProvider|lineWebhook|lineSignature|lineAccessToken|lineChannelSecret/i,
    /\b(?:verifyIdentity|verifyCustomer|caseBinding|bindCase|createCase|createRepairIntake)\s*\(/i,
    /\b(?:writeAudit|auditWriter|writeContact|contactLog|dispatchNote)\s*\(/i,
    /require\('node:(fs|http|https|net|child_process)'\)/,
  ].forEach((pattern) => {
    assert.doesNotMatch(source, pattern);
  });
});

test('unit coverage proves fail-closed default and normalization-only grants', () => {
  const source = read('tests/brandChannel/brandReferralPublicRouteMount.unit.test.js');

  assertContainsAll(
    source,
    [
      /default public route fails closed when no access guard is injected/,
      /brand_referral_access_guard_missing/,
      /injected permission denial returns safe deny before referral output/,
      /brand_referral_permission_denied/,
      /injected allowed route remains normalization-only with no runtime grants/,
      /identityVerified: false/,
      /caseBinding: false/,
      /caseDataAccess: false/,
      /intakeCreated: false/,
      /auditWritten: false/,
      /assertNoSensitiveEcho/,
    ],
    'public route closure unit coverage',
  );
});

test('unsafe output and side-effect boundaries are documented', () => {
  const source = read('docs/task-756-brand-referral-public-route-mount-closure-guard-no-db-no-side-effects.md');

  assertContainsAll(
    source,
    [
      /Status: completed/,
      /POST \/api\/v1\/public\/brand-referral\/normalize/,
      /guarded normalization only/,
      /No DB, migration, repository, provider, LINE, SMS, App, webhook, identity verification, Case Binding, repair intake creation, audit\/contact persistence, entitlement service, AI\/RAG, admin, package, or smoke behavior was changed/,
      /token, secret, LINE access token, channel secret, raw LINE id, full phone, full address, provider payload, AI payload, full customer payload, credential, DB URL, stack, SQL/,
    ],
    'Task756 doc',
  );
});
