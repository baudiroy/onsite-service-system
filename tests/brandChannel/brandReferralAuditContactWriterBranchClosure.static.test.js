'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  BRAND_REFERRAL_AUDIT_CONTACT_COLUMNS,
  BRAND_REFERRAL_AUDIT_CONTACT_TABLE,
} = require('../../src/brandChannel/brandReferralAuditContactRepository');

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

function requireStatements(source) {
  return source
    .split('\n')
    .filter((line) => line.includes('require('))
    .join('\n');
}

test('Task769 through Task771 evidence exists before writer branch closure', () => {
  [
    'src/brandChannel/brandReferralAuditContactRepository.js',
    'src/brandChannel/brandReferralAuditContactWriter.js',
    'src/brandChannel/brandReferralRouteAdapter.js',
    'src/routes/public.routes.js',
    'tests/brandChannel/brandReferralAuditContactWriter.unit.test.js',
    'tests/brandChannel/brandReferralRouteInjectedAuditWriter.unit.test.js',
    'tests/brandChannel/brandReferralInjectedWriterPathClosure.static.test.js',
    'docs/task-769-brand-referral-audit-contact-writer-injected-db-unit-test-no-real-db-no-route-wiring.md',
    'docs/task-770-brand-referral-public-route-injected-audit-writer-path-no-real-db-no-response-shape-change.md',
    'docs/task-771-brand-referral-injected-audit-writer-path-closure-guard-no-real-db-no-response-shape-change.md',
    'docs/task-772-brand-referral-audit-contact-writer-branch-closure-guard-no-real-db.md',
  ].forEach(assertFileExists);
});

test('closure document summarizes Task769-771 accepted branch boundary', () => {
  const source = read('docs/task-772-brand-referral-audit-contact-writer-branch-closure-guard-no-real-db.md');

  assertContainsAll(
    source,
    [
      /Status: completed/,
      /Task769-771 audit\/contact writer runtime-adjacent branch/,
      /Injected-only repository\/writer/,
      /Fake DB unit tests only/,
      /Optional injected route writer path/,
      /Public response body unchanged/,
      /No default writer configured/,
      /Connect to a real DB/,
      /Dry-run or apply Migration 024/,
      /Change public API response body/,
      /Verify identity/,
      /Bind Cases/,
      /Call AI\/RAG runtime/,
    ],
    'Task772 closure document',
  );
});

test('repository and writer remain injected-only with no global side-effect imports', () => {
  const repositorySource = read('src/brandChannel/brandReferralAuditContactRepository.js');
  const writerSource = read('src/brandChannel/brandReferralAuditContactWriter.js');
  const imports = `${requireStatements(repositorySource)}\n${requireStatements(writerSource)}`;

  assertContainsAll(
    repositorySource,
    [
      /async function insertBrandReferralAuditContactEvent\(dbClient, row\)/,
      /if \(!dbClient \|\| typeof dbClient\.insert !== 'function'\)/,
      /dbClient\.insert\(BRAND_REFERRAL_AUDIT_CONTACT_TABLE, safeRow\)/,
    ],
    'injected repository boundary',
  );
  assertContainsAll(
    writerSource,
    [
      /const dbClient = options\.dbClient \|\| options\.transaction/,
      /if \(!dbClient\)/,
      /const result = await repository\(dbClient, built\.row\)/,
    ],
    'injected writer boundary',
  );

  [
    /process\.env/,
    /require\(['"]pg['"]\)/,
    /require\(['"]dotenv['"]\)/,
    /require\(['"]\.\.\/.*(?:db|database|pool|config|server|app|router)/i,
    /fetch\(/,
    /axios|provider|webhook|sms|openai|rag|billing|entitlement/i,
    /lineProvider|lineWebhook|lineSignature|lineAccessToken|lineChannelSecret/i,
    /verifyIdentity|verifyCustomer|caseBinding|bindCase|createCase|createRepairIntake/i,
    /require\('node:(fs|http|https|net|child_process)'\)/,
  ].forEach((pattern) => {
    assert.doesNotMatch(imports, pattern);
  });

  assert.doesNotMatch(repositorySource, /process\.env|\bfetch\(/);
  assert.doesNotMatch(writerSource, /process\.env|\bfetch\(/);
});

test('persisted fields remain limited to Migration 024 safe fields only', () => {
  assert.equal(BRAND_REFERRAL_AUDIT_CONTACT_TABLE, 'brand_referral_contact_events');
  assert.deepEqual(BRAND_REFERRAL_AUDIT_CONTACT_COLUMNS, [
    'organization_id',
    'brand_id',
    'source_channel',
    'referral_source',
    'entry_context',
    'line_channel_id',
    'event_type',
    'reason_key',
    'result_status',
    'request_id',
    'created_at',
    'retention_until',
    'deleted_at',
  ]);

  const repositorySource = read('src/brandChannel/brandReferralAuditContactRepository.js');
  assert.match(repositorySource, /pickAllowedColumns/);
  assert.doesNotMatch(repositorySource, /line_user_id|customer_phone|customer_address|customer_name|provider_payload|ai_payload|customer_payload|internal_note|settlement/);
});

test('writer rejects unsafe extras and safe failure keys stay redacted', () => {
  const repositorySource = read('src/brandChannel/brandReferralAuditContactRepository.js');
  const writerSource = read('src/brandChannel/brandReferralAuditContactWriter.js');
  const combinedSource = `${repositorySource}\n${writerSource}`;
  const unitSource = read('tests/brandChannel/brandReferralAuditContactWriter.unit.test.js');

  assertContainsAll(
    combinedSource,
    [
      /const UNSAFE_KEYS = new Set/,
      /'line_user_id'/,
      /'token'/,
      /'secret'/,
      /'line_access_token'/,
      /'line_channel_secret'/,
      /'binding_token'/,
      /'verification_code'/,
      /'customer_phone'/,
      /'customer_address'/,
      /'customer_name'/,
      /'provider_payload'/,
      /'ai_payload'/,
      /'full_customer_payload'/,
      /'database_url'/,
      /'stack'/,
      /'sql_input'/,
      /'customer_case_data'/,
      /'internal_note'/,
      /'billing'/,
      /'settlement'/,
      /'cross_organization'/,
      /brand_referral_audit_contact_unsafe_field/,
      /brand_referral_audit_contact_write_failed/,
      /brand_referral_audit_contact_duplicate_request/,
      /brand_referral_audit_contact_timeout/,
    ],
    'unsafe key and safe failure boundary',
  );
  assertContainsAll(
    unitSource,
    [
      /unsafe extras are rejected before persistence/,
      /DB duplicate timeout and generic errors return safe failure results/,
      /assertNoSensitiveEcho/,
      /fake DB/,
    ],
    'writer unit safety coverage',
  );
});

test('route injected writer remains optional and public response shape remains closed', () => {
  const routeSource = read('src/brandChannel/brandReferralRouteAdapter.js');
  const publicRouteSource = read('src/routes/public.routes.js');
  const injectedTestSource = read('tests/brandChannel/brandReferralRouteInjectedAuditWriter.unit.test.js');

  assertContainsAll(
    routeSource,
    [
      /const contactWriter = options\.contactWriter/,
      /if \(!contactWriter \|\| typeof contactWriter\.write !== 'function'\)/,
      /contactWriter\.write\(auditIntent\)/,
      /includeContactWriterResult === true/,
      /reasonKey: 'brand_referral_contact_writer_failed'/,
    ],
    'route optional writer boundary',
  );
  assertContainsAll(
    publicRouteSource,
    [
      /json\(response\.body\)/,
      /contactWriter: options\.contactWriter/,
      /const publicRouter = createPublicRouter\(\)/,
    ],
    'public route response-only boundary',
  );
  assertContainsAll(
    injectedTestSource,
    [
      /assertNoPublicWriterFields/,
      /writer failure is captured as safe internal metadata without changing public body/,
      /public router can pass optional injected fake writer while preserving response shape/,
    ],
    'injected route unit coverage',
  );
  assert.doesNotMatch(publicRouteSource, /includeContactWriterResult|contactWriterResult/);
});

test('design document records Task769-772 branch closure without promoting persistence', () => {
  const source = read('docs/design/brand-official-line-channel-integration.md');

  assertContainsAll(
    source,
    [
      /Task769-772 close the audit\/contact writer runtime-adjacent branch/,
      /injected-only repository\/writer/,
      /fake DB unit tests/,
      /optional injected route plumbing/,
      /does not use a real DB/,
      /configure a default writer/,
      /change public response shape/,
      /run Migration 024/,
      /call providers/,
      /verify identity/,
      /bind Cases/,
      /create repair intake or Case records/,
      /add entitlement runtime/,
      /add admin UI/,
      /add smoke tests/,
      /call AI\/RAG/,
    ],
    'Task769-772 design closure note',
  );
});
