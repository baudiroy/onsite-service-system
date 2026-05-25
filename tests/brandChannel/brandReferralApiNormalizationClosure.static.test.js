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

test('Task748 evidence files exist before closure', () => {
  [
    'src/brandChannel/brandReferralApp.js',
    'tests/brandChannel/brandReferralApiNormalization.unit.test.js',
    'docs/task-748-basic-brand-referral-api-normalization-slice-no-db-no-case-creation.md',
  ].forEach(assertFileExists);
});

test('closure note summarizes Task748-749 normalization-only boundary', () => {
  const source = read('docs/design/brand-official-line-channel-integration.md');

  assertContainsAll(
    source,
    [
      /Task748-749 close the Basic Brand Referral API normalization-only slice/,
      /safe normalized referral envelope/,
      /does not mount a route/,
      /does not implement DB, Case creation, repair intake draft creation, identity verification, Case Binding, audit \/ contact persistence, provider, webhook, entitlement, usage tracking, reports, admin UI, or AI\/RAG runtime/,
    ],
    'Task748-749 closure note',
  );
});

test('brandReferralApp imports only safe local normalizer and no runtime dependencies', () => {
  const source = read('src/brandChannel/brandReferralApp.js');
  const requireTargets = Array.from(source.matchAll(/require\('([^']+)'\)/g))
    .map((match) => match[1]);

  assert.deepEqual(requireTargets, ['./brandReferralRequestNormalizer']);
  assert.doesNotMatch(source, /process\.env/);
  assert.doesNotMatch(source, /fetch\(/);
  assert.doesNotMatch(source, /app\.listen|server\.listen|router\.|express\(/);
  assert.doesNotMatch(source, /axios|pg|pool|repository|provider|webhook|openai|rag|entitlement/i);
  assert.doesNotMatch(source, /verifyIdentity|caseBinding|createCase|createRepairIntake|writeAudit|writeContact/i);
  assert.doesNotMatch(source, /require\('node:(fs|http|https|net|child_process)'\)/);
});

test('response envelope exposes safe normalized referral only and no customer case data', () => {
  const source = read('src/brandChannel/brandReferralApp.js') +
    '\n' +
    read('tests/brandChannel/brandReferralApiNormalization.unit.test.js');

  assertContainsAll(
    source,
    [
      /statusCode: 200/,
      /messageKey: 'brand_referral\.normalized'/,
      /referral: envelope/,
      /no customer case data/i,
      /caseId\|case_id\|customerId\|customer_id\|appointment\|completedAt\|report/,
    ],
    'safe response envelope closure',
  );
});

test('normalization response keeps no identity case intake or audit grants', () => {
  const source = read('tests/brandChannel/brandReferralApiNormalization.unit.test.js');

  assertContainsAll(
    source,
    [
      /identityVerified: false/,
      /caseBinding: false/,
      /caseDataAccess: false/,
      /intakeCreated: false/,
      /auditWritten: false/,
      /assertNoRuntimeGrant/,
    ],
    'no-grant response closure',
  );
});

test('sensitive values are not returned by normalization response', () => {
  const source = read('tests/brandChannel/brandReferralApiNormalization.unit.test.js');

  assertContainsAll(
    source,
    [
      /Object\.prototype\.hasOwnProperty\.call\(response\.body\.referral\.metadata, 'line_user_id'\), false/,
      /token: 'credential-placeholder'/,
      /secret: 'credential-placeholder'/,
      /line_access_token: 'credential-placeholder'/,
      /channel_secret: 'credential-placeholder'/,
      /raw_provider_payload: 'raw-provider-payload'/,
      /raw_ai_payload: 'raw-ai-payload'/,
      /full_customer_payload: 'full customer payload'/,
      /DATABASE_URL/,
      /assertNoSensitiveEcho/,
    ],
    'sensitive redaction closure',
  );
});

test('Task749 closure document keeps no route mount and no DB decision explicit', () => {
  const source = read('docs/task-749-basic-brand-referral-api-normalization-closure-guard-no-db-no-route-mount.md');

  assertContainsAll(
    source,
    [
      /Status: completed/,
      /Scope: static closure guard \/ no DB \/ no route mount/,
      /No public route was mounted/,
      /No API route, DB, migration, provider, LINE, webhook, identity verification, Case Binding, repair intake creation, audit\/contact persistence, AI\/RAG, entitlement, billing, admin, package, or smoke behavior was changed/,
    ],
    'Task749 closure doc',
  );
});
