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

test('Task757 and Task758 evidence exists before side-channel closure', () => {
  [
    'src/brandChannel/brandReferralAuditIntentBuilder.js',
    'src/brandChannel/brandReferralRouteAdapter.js',
    'tests/brandChannel/brandReferralAuditIntentBuilder.unit.test.js',
    'tests/brandChannel/brandReferralRouteAuditIntent.unit.test.js',
    'docs/task-757-brand-referral-audit-contact-intent-builder-no-audit-write-no-db.md',
    'docs/task-758-brand-referral-route-audit-intent-side-channel-no-audit-write-no-db.md',
    'docs/task-759-brand-referral-audit-intent-side-channel-closure-guard-no-audit-write-no-db.md',
  ].forEach(assertFileExists);
});

test('route adapter exposes audit intent only as optional top-level side-channel', () => {
  const source = read('src/brandChannel/brandReferralRouteAdapter.js');
  const publicRouteSource = read('src/routes/public.routes.js');
  const unitTestSource = read('tests/brandChannel/brandReferralRouteAuditIntent.unit.test.js');

  assertContainsAll(
    source,
    [
      /includeAuditIntent !== true/,
      /auditIntent: buildBrandReferralAuditIntent\(response, auditOptions\)/,
      /withOptionalAuditIntent/,
    ],
    'route adapter audit side-channel',
  );
  assertContainsAll(
    unitTestSource,
    [
      /Public response body remains unchanged|public response shape is unchanged/,
      /assertNoPublicAuditIntent/,
      /Object\.prototype\.hasOwnProperty\.call\(response\.body, 'auditIntent'\), false/,
      /includeAuditIntent: true/,
    ],
    'route audit intent unit coverage',
  );
  assert.match(publicRouteSource, /return res\.status\(response\.statusCode\)\.json\(response\.body\)/);
});

test('audit intent remains safe metadata only with no writer or side-effect runtime imports', () => {
  const routeSource = read('src/brandChannel/brandReferralRouteAdapter.js');
  const builderSource = read('src/brandChannel/brandReferralAuditIntentBuilder.js');
  const combined = `${routeSource}\n${builderSource}`;

  assertContainsAll(
    combined,
    [
      /auditWritten: false/,
      /contactWritten: false/,
      /brand_referral_normalized/,
      /brand_referral_denied/,
      /brand_referral_malformed/,
      /brand_referral_unknown_source/,
    ],
    'audit intent safe contract',
  );

  [
    /process\.env/,
    /fetch\(/,
    /axios|pg|pool|repository|provider|webhook|sms|openai|rag|billing|entitlement/i,
    /lineProvider|lineWebhook|lineSignature|lineAccessToken|lineChannelSecret/i,
    /verifyIdentity|verifyCustomer|caseBinding|bindCase|createCase|createRepairIntake/i,
    /writeAudit|auditWriter|writeContact|contactLog|dispatchNote/i,
    /require\('node:(fs|http|https|net|child_process)'\)/,
  ].forEach((pattern) => {
    assert.doesNotMatch(combined, pattern);
  });
});

test('side-channel tests cover denied malformed unknown and allowed redaction', () => {
  const source = read('tests/brandChannel/brandReferralRouteAuditIntent.unit.test.js');

  assertContainsAll(
    source,
    [
      /allowed route can return internal audit intent/,
      /denied guard result can return redacted internal audit intent/,
      /malformed route request can return safe internal audit intent/,
      /unknown-source normalization can return unknown-source audit intent/,
      /assertNoSensitiveEcho/,
      /line-user-/,
      /full-phone-placeholder/,
      /raw-provider-payload/,
      /raw-ai-payload/,
      /full customer payload/,
      /DATABASE_URL/,
    ],
    'side-channel safety tests',
  );
});

test('Task759 document closes the side-channel branch without persistence', () => {
  const source = read('docs/task-759-brand-referral-audit-intent-side-channel-closure-guard-no-audit-write-no-db.md');

  assertContainsAll(
    source,
    [
      /Status: completed/,
      /Task757-758/,
      /intent-only/,
      /public response body remains unchanged/,
      /No audit\/contact writer, DB, migration, repository, provider, LINE, SMS, App, webhook, identity verification, Case Binding, repair intake creation, entitlement service, AI\/RAG, admin, package, or smoke behavior was changed/,
    ],
    'Task759 doc',
  );
});
