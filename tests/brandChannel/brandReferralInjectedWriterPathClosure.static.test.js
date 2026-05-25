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

test('Task770 evidence files exist before injected writer path closure', () => {
  [
    'src/brandChannel/brandReferralRouteAdapter.js',
    'src/routes/public.routes.js',
    'tests/brandChannel/brandReferralRouteInjectedAuditWriter.unit.test.js',
    'docs/task-770-brand-referral-public-route-injected-audit-writer-path-no-real-db-no-response-shape-change.md',
    'docs/task-771-brand-referral-injected-audit-writer-path-closure-guard-no-real-db-no-response-shape-change.md',
  ].forEach(assertFileExists);
});

test('closure document summarizes optional injected writer boundary', () => {
  const source = read('docs/task-771-brand-referral-injected-audit-writer-path-closure-guard-no-real-db-no-response-shape-change.md');

  assertContainsAll(
    source,
    [
      /Status: completed/,
      /optional, injected-only/,
      /No default writer configured/,
      /Safe `auditIntent` metadata only/,
      /Public response body remains unchanged/,
      /Writer failure is redacted/,
      /Real DB, global repository wiring, provider calls, LINE\/SMS\/App\/webhook delivery, identity verification, Case Binding, repair intake creation, entitlement runtime, smoke tests, admin UI, package changes, and AI\/RAG runtime remain forbidden/,
    ],
    'Task771 closure document',
  );
});

test('route adapter keeps writer optional injected and public body unchanged', () => {
  const source = read('src/brandChannel/brandReferralRouteAdapter.js');
  const unitSource = read('tests/brandChannel/brandReferralRouteInjectedAuditWriter.unit.test.js');

  assertContainsAll(
    source,
    [
      /const contactWriter = options\.contactWriter/,
      /if \(!contactWriter \|\| typeof contactWriter\.write !== 'function'\)/,
      /contactWriter\.write\(auditIntent\)/,
      /includeContactWriterResult === true/,
      /reasonKey: 'brand_referral_contact_writer_failed'/,
    ],
    'optional injected writer route adapter',
  );

  assertContainsAll(
    unitSource,
    [
      /allowed guarded route calls injected fake writer once with safe intent and unchanged public body/,
      /denied malformed and unknown-source outcomes can call injected fake writer with safe metadata/,
      /writer failure is captured as safe internal metadata without changing public body/,
      /public router can pass optional injected fake writer while preserving response shape/,
      /assertNoPublicWriterFields/,
      /assertNoSensitiveEcho/,
    ],
    'Task770 unit coverage',
  );
});

test('public route sends response body only and has no default writer configuration', () => {
  const source = read('src/routes/public.routes.js');

  assertContainsAll(
    source,
    [
      /function sendBrandReferralResponse\(res, response\)/,
      /json\(response\.body\)/,
      /contactWriter: options\.contactWriter/,
      /const publicRouter = createPublicRouter\(\)/,
    ],
    'public route response contract',
  );

  assert.doesNotMatch(source, /json\(response\)/);
  assert.doesNotMatch(source, /includeContactWriterResult/);
  assert.doesNotMatch(source, /contactWriterResult/);
});

test('adapter and public route import no real DB provider verification entitlement or AI runtime', () => {
  const combined = [
    read('src/brandChannel/brandReferralRouteAdapter.js'),
    read('src/routes/public.routes.js'),
  ].join('\n');

  [
    /process\.env/,
    /fetch\(/,
    /axios|pg|pool|repository|provider|webhook|sms|openai|rag|billing|entitlement/i,
    /lineProvider|lineWebhook|lineSignature|lineAccessToken|lineChannelSecret/i,
    /\b(?:verifyIdentity|verifyCustomer|caseBinding|bindCase|createCase|createRepairIntake)\s*\(/i,
    /\b(?:writeAudit|auditWriter|writeContact|contactLog|dispatchNote)\s*\(/i,
    /require\('node:(fs|http|https|net|child_process)'\)/,
  ].forEach((pattern) => {
    assert.doesNotMatch(combined, pattern);
  });
});

test('design document records Task770-771 closure without promoting real persistence', () => {
  const source = read('docs/design/brand-official-line-channel-integration.md');

  assertContainsAll(
    source,
    [
      /Task770-771 close the injected audit\/contact writer path/,
      /optional injected writer plumbing only/,
      /safe `auditIntent` metadata/,
      /public response body remains unchanged/,
      /no default writer is configured/,
      /real DB, repository wiring, provider \/ LINE \/ webhook, identity verification, Case Binding, repair intake, entitlement, smoke, admin UI, package, and AI\/RAG runtime remain out of scope/,
    ],
    'Task770-771 design closure note',
  );
});
