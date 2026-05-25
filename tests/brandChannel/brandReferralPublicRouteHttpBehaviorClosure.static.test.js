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

test('Task779 HTTP behavior evidence exists before closure', () => {
  [
    'tests/brandChannel/brandReferralPublicRouteHttpBehavior.unit.test.js',
    'docs/task-779-brand-referral-public-route-http-behavior-unit-test-no-listen-no-db.md',
    'src/routes/public.routes.js',
  ].forEach(assertFileExists);
});

test('HTTP behavior test exercises app-like public route without listen or server start', () => {
  const source = read('tests/brandChannel/brandReferralPublicRouteHttpBehavior.unit.test.js');

  assertContainsAll(
    source,
    [
      /createMountedApp/,
      /app\.use\('\/api\/v1\/public', router\)/,
      /app\.handle\(req, response/,
      /POST|req\.method = 'POST'/,
      /\/api\/v1\/public\/brand-referral\/normalize/,
    ],
    'Task779 HTTP behavior test',
  );
  assert.doesNotMatch(source, /app\.listen|server\.listen|\.listen\(/);
  assert.doesNotMatch(source, /createServer|node:http|node:https|node:net|supertest/i);
});

test('HTTP behavior test covers fail-closed allow deny and malformed envelopes', () => {
  const source = read('tests/brandChannel/brandReferralPublicRouteHttpBehavior.unit.test.js');

  assertContainsAll(
    source,
    [
      /default mounted public router fails closed when no access guard is injected/,
      /brand_referral_access_guard_missing/,
      /injected allow guard returns normalization-only body through app-like handler/,
      /identityVerified: false/,
      /caseBinding: false/,
      /caseDataAccess: false/,
      /intakeCreated: false/,
      /auditWritten: false/,
      /injected deny guard returns safe deny before referral output is trusted/,
      /brand_referral_permission_denied/,
      /malformed HTTP-style body returns a safe non-sensitive envelope/,
      /assertNoForbiddenPublicFields/,
    ],
    'Task779 HTTP behavior cases',
  );
});

test('HTTP behavior public response deny-list remains explicit', () => {
  const source = read('tests/brandChannel/brandReferralPublicRouteHttpBehavior.unit.test.js');

  assertContainsAll(
    source,
    [
      /auditIntent/,
      /contactWriterResult/,
      /writerInternals/,
      /line-user-/,
      /token-placeholder/,
      /secret-placeholder/,
      /channel-secret-placeholder/,
      /full-phone-placeholder/,
      /full address/i,
      /raw-provider-payload/,
      /raw-ai-payload/i,
      /full customer payload/i,
      /DATABASE_URL/,
      /stack/i,
      /SQL syntax|SELECT \\*/,
    ],
    'Task779 HTTP behavior deny-list',
  );
});

test('public route source remains mounted normalization-only without side-effect runtimes', () => {
  const source = read('src/routes/public.routes.js');

  assertContainsAll(
    source,
    [
      /router\.post\(\s*'\/brand-referral\/normalize'/,
      /createBrandReferralNormalizeHandler/,
      /handleBrandReferralRouteRequest/,
      /requireAccessGuard: true/,
      /sendBrandReferralResponse\(res, response\)/,
    ],
    'public route source',
  );

  [
    /app\.listen|server\.listen/,
    /process\.env/,
    /fetch\(/,
    /axios|pg|Pool|DATABASE_URL|repository|provider|webhook|openai|rag|billing|entitlement/i,
    /lineProvider|lineWebhook|lineSignature|lineAccessToken|lineChannelSecret/i,
    /\b(?:verifyIdentity|verifyCustomer|caseBinding|bindCase|createCase|createRepairIntake)\s*\(/i,
    /\b(?:writeAudit|auditWriter|writeContact|contactLog|dispatchNote)\s*\(/i,
    /require\('node:(fs|http|https|net|child_process)'\)/,
  ].forEach((pattern) => {
    assert.doesNotMatch(source, pattern);
  });
});

test('closure doc and design note preserve no-runtime decision', () => {
  const taskDoc = read('docs/task-780-brand-referral-public-route-http-behavior-closure-guard-no-listen-no-db.md');
  const designDoc = read('docs/design/brand-official-line-channel-integration.md');

  assertContainsAll(
    taskDoc,
    [
      /Status: completed/,
      /Task779 accepted HTTP behavior boundary/i,
      /No `app\.listen` or server start/,
      /No DB connection, psql, db:migrate, DDL, dry-run, or apply/,
      /No route response body\/status shape expansion/,
      /No provider \/ LINE \/ SMS \/ App push \/ webhook/,
      /No identity verification, Case Binding, repair intake, Case creation/,
      /No AI\/RAG runtime/,
    ],
    'Task780 closure doc',
  );

  assertContainsAll(
    designDoc,
    [
      /Task779-780 close the public route HTTP behavior slice/,
      /app-like handler/,
      /no `app\.listen`/,
      /no DB/,
      /normalization-only/,
      /public response body remains closed/,
    ],
    'Task780 design note',
  );
});
