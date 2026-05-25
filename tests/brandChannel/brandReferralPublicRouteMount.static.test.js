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

test('Task754 readiness and Task755 route mount evidence exists', () => {
  [
    'docs/task-754-brand-referral-public-route-mount-readiness-packet-no-mount-no-db.md',
    'src/routes/public.routes.js',
    'tests/brandChannel/brandReferralPublicRouteMount.unit.test.js',
    'docs/task-755-brand-referral-public-route-mount-guarded-normalization-only-no-db-no-case-creation.md',
  ].forEach(assertFileExists);
});

test('public route file mounts only the guarded normalization adapter', () => {
  const source = read('src/routes/public.routes.js');

  assertContainsAll(
    source,
    [
      /handleBrandReferralRouteRequest/,
      /router\.post\(\s*'\/brand-referral\/normalize'/,
      /createBrandReferralNormalizeHandler/,
      /requireAccessGuard: true/,
      /accessGuard: options\.accessGuard/,
      /accessContext: options\.accessContext/,
    ],
    'public route mount',
  );

  assert.doesNotMatch(source, /process\.env/);
  assert.doesNotMatch(source, /fetch\(/);
  assert.doesNotMatch(source, /app\.listen|server\.listen/);
  assert.doesNotMatch(source, /axios|pg|pool|repository|provider|webhook|openai|rag|billing/i);
  assert.doesNotMatch(
    source,
    /\b(?:verifyIdentity|createCase|createRepairIntake|writeAudit|writeContact)\s*\(/i,
  );
  assert.doesNotMatch(source, /require\('node:(fs|http|https|net|child_process)'\)/);
});

test('route mount unit coverage preserves safe deny and normalization-only allow paths', () => {
  const source = read('tests/brandChannel/brandReferralPublicRouteMount.unit.test.js');

  assertContainsAll(
    source,
    [
      /brand_referral_access_guard_missing/,
      /brand_referral_permission_denied/,
      /identityVerified: false/,
      /caseBinding: false/,
      /caseDataAccess: false/,
      /intakeCreated: false/,
      /auditWritten: false/,
      /assertNoSensitiveEcho/,
      /line_user_id'\), false/,
    ],
    'public route mount tests',
  );
});

test('Task755 document records no DB no Case creation decision', () => {
  const source = read('docs/task-755-brand-referral-public-route-mount-guarded-normalization-only-no-db-no-case-creation.md');

  assertContainsAll(
    source,
    [
      /Status: completed/,
      /Scope: public route mount \/ guarded normalization only \/ no DB \/ no Case creation/,
      /POST \/api\/v1\/public\/brand-referral\/normalize/,
      /No DB, migration, provider, LINE, webhook, identity verification, Case Binding, repair intake creation, audit\/contact persistence, entitlement service, AI\/RAG, admin, package, or smoke behavior was changed/,
    ],
    'Task755 doc',
  );
});
