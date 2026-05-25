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

function requireStatements(source) {
  return source
    .split('\n')
    .filter((line) => line.includes('require('))
    .join('\n');
}

test('Task760 through Task780 migration writer and public route evidence exists before Task781 closure', () => {
  [
    'docs/task-760-brand-referral-audit-contact-persistence-readiness-packet-docs-only-no-runtime.md',
    'docs/task-761-brand-referral-audit-contact-persistence-schema-proposal-no-migration-no-db.md',
    'docs/task-762-brand-referral-audit-contact-persistence-migration-authorization-packet-no-migration-no-db.md',
    'docs/task-763-brand-referral-audit-contact-migration-draft-plan-no-migration-no-db.md',
    'docs/task-764-brand-referral-audit-contact-migration-file-creation-preflight-gate-no-migration-no-db.md',
    'docs/task-765-brand-referral-audit-contact-events-migration-file-no-apply-no-db.md',
    'docs/task-766-brand-referral-audit-contact-events-migration-024-disposable-db-dry-run-authorization-packet-no-db-execution.md',
    'docs/task-767-brand-referral-migration-024-disposable-db-dry-run-result-template-no-db-execution.md',
    'docs/task-769-brand-referral-audit-contact-writer-injected-db-unit-test-no-real-db-no-route-wiring.md',
    'docs/task-770-brand-referral-public-route-injected-audit-writer-path-no-real-db-no-response-shape-change.md',
    'docs/task-771-brand-referral-injected-audit-writer-path-closure-guard-no-real-db-no-response-shape-change.md',
    'docs/task-772-brand-referral-audit-contact-writer-branch-closure-guard-no-real-db.md',
    'docs/task-779-brand-referral-public-route-http-behavior-unit-test-no-listen-no-db.md',
    'docs/task-780-brand-referral-public-route-http-behavior-closure-guard-no-listen-no-db.md',
    'migrations/024_create_brand_referral_contact_events.sql',
    'src/brandChannel/brandReferralAuditContactRepository.js',
    'src/brandChannel/brandReferralAuditContactWriter.js',
    'src/brandChannel/brandReferralRouteAdapter.js',
    'src/routes/public.routes.js',
    'tests/brandChannel/brandReferralAuditContactWriterBranchClosure.static.test.js',
    'tests/brandChannel/brandReferralPublicRouteHttpBehavior.unit.test.js',
    'tests/brandChannel/brandReferralPublicRouteHttpBehaviorClosure.static.test.js',
  ].forEach(assertFileExists);
});

test('Task781 closure document records no-DB checkpoint status without promoting runtime', () => {
  const source = read('docs/task-781-brand-referral-migration-024-no-db-closure-checkpoint-no-runtime.md');

  assertContainsAll(
    source,
    [
      /Status: completed/,
      /Task760-767/,
      /readiness packet/,
      /schema proposal/,
      /authorization packet/,
      /draft plan/,
      /preflight gate/,
      /Migration 024 file/,
      /dry-run authorization packet/,
      /result template/,
      /Task769-772/,
      /injected writer/,
      /Task779-780/,
      /public route HTTP behavior/,
      /No DB connection/,
      /No psql/,
      /No db:migrate/,
      /No DDL/,
      /No dry-run/,
      /No apply/,
      /No runtime behavior changed/,
      /No migration modification/,
    ],
    'Task781 closure document',
  );
});

test('Migration 024 remains authoring-only safe metadata with no active data mutation', () => {
  const source = read('migrations/024_create_brand_referral_contact_events.sql');

  assertContainsAll(
    source,
    [
      /MIGRATION FILE AUTHORING ONLY/,
      /NOT APPLIED/,
      /APPLY OR DRY-RUN REQUIRES A SEPARATE TASK/,
      /NO DB CONNECTION, PSQL, OR SQL EXECUTION IS AUTHORIZED/,
      /CREATE TABLE IF NOT EXISTS brand_referral_contact_events/,
      /organization_id uuid NOT NULL/,
      /brand_id uuid/,
      /source_channel text/,
      /referral_source text/,
      /entry_context text/,
      /line_channel_id text/,
      /event_type text NOT NULL/,
      /reason_key text/,
      /result_status text NOT NULL/,
      /request_id text/,
      /retention_until timestamptz/,
      /deleted_at timestamptz/,
    ],
    'Migration 024 artifact',
  );

  const activeSql = source
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('--'))
    .join('\n');
  assert.doesNotMatch(activeSql, /\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bCOPY\b|\bDROP\b|\bTRUNCATE\b/i);
  assert.doesNotMatch(
    source,
    /line_user_id|customer_phone|customer_address|customer_name|provider_payload|ai_payload|full_customer_payload|credential|database_url|customer_case_data|internal_note|billing|settlement/i,
  );
});

test('Migration 024 no-DB status remains consistent across authorization docs and Task781', () => {
  const source = [
    'docs/task-765-brand-referral-audit-contact-events-migration-file-no-apply-no-db.md',
    'docs/task-766-brand-referral-audit-contact-events-migration-024-disposable-db-dry-run-authorization-packet-no-db-execution.md',
    'docs/task-767-brand-referral-migration-024-disposable-db-dry-run-result-template-no-db-execution.md',
    'docs/task-781-brand-referral-migration-024-no-db-closure-checkpoint-no-runtime.md',
  ].map(read).join('\n');

  assertContainsAll(
    source,
    [
      /no DB/i,
      /no psql/i,
      /no `?db:migrate`?/i,
      /no DDL/i,
      /no dry-run/i,
      /no apply/i,
      /disposable local\/test DB/i,
      /explicit/i,
    ],
    'Migration 024 no-DB status',
  );
  assert.doesNotMatch(source, /db:migrate.*PASS|psql.*PASS|DDL.*executed|dry-run completed|apply completed/i);
});

test('writer and repository stay injected-only without default real DB writer configuration', () => {
  const repositorySource = read('src/brandChannel/brandReferralAuditContactRepository.js');
  const writerSource = read('src/brandChannel/brandReferralAuditContactWriter.js');
  const publicRouteSource = read('src/routes/public.routes.js');
  const imports = `${requireStatements(repositorySource)}\n${requireStatements(writerSource)}\n${requireStatements(publicRouteSource)}`;

  assertContainsAll(
    repositorySource,
    [
      /const BRAND_REFERRAL_AUDIT_CONTACT_TABLE = 'brand_referral_contact_events'/,
      /async function insertBrandReferralAuditContactEvent\(dbClient, row\)/,
      /if \(!dbClient \|\| typeof dbClient\.insert !== 'function'\)/,
      /pickAllowedColumns/,
      /dbClient\.insert\(BRAND_REFERRAL_AUDIT_CONTACT_TABLE, safeRow\)/,
    ],
    'injected repository',
  );
  assertContainsAll(
    writerSource,
    [
      /const dbClient = options\.dbClient \|\| options\.transaction/,
      /if \(!dbClient\)/,
      /const result = await repository\(dbClient, built\.row\)/,
      /brand_referral_audit_contact_db_client_missing/,
      /brand_referral_audit_contact_unsafe_field/,
    ],
    'injected writer',
  );
  assertContainsAll(
    publicRouteSource,
    [
      /contactWriter: options\.contactWriter/,
      /const publicRouter = createPublicRouter\(\)/,
    ],
    'public route optional writer injection',
  );

  [
    /process\.env/,
    /require\(['"]pg['"]\)/,
    /require\(['"]dotenv['"]\)/,
    /require\(['"].*(?:database|db|pool|connection|config)['"]\)/i,
    /new Pool|Pool\(/,
    /createPool|getPool|dbClient = require/i,
    /fetch\(/,
    /axios|provider|webhook|sms|openai|rag|billing|entitlement/i,
  ].forEach((pattern) => {
    assert.doesNotMatch(imports, pattern);
  });
});

test('public route remains normalization-only and excludes audit writer internals from the public body', () => {
  const publicRouteSource = read('src/routes/public.routes.js');
  const routeAdapterSource = read('src/brandChannel/brandReferralRouteAdapter.js');
  const task779Source = read('tests/brandChannel/brandReferralPublicRouteHttpBehavior.unit.test.js');
  const task780Source = read('tests/brandChannel/brandReferralPublicRouteHttpBehaviorClosure.static.test.js');

  assertContainsAll(
    publicRouteSource,
    [
      /router\.post\(\s*'\/brand-referral\/normalize'/,
      /createBrandReferralNormalizeHandler\(options\.brandReferral \|\| \{\}\)/,
      /requireAccessGuard: true/,
      /sendBrandReferralResponse\(res, response\)/,
      /json\(response\.body\)/,
    ],
    'public route normalization-only handler',
  );
  assertContainsAll(
    routeAdapterSource,
    [
      /normalizeBrandReferralApiRequest/,
      /buildBrandReferralAuditIntent/,
      /const contactWriter = options\.contactWriter/,
      /if \(!contactWriter \|\| typeof contactWriter\.write !== 'function'\)/,
      /includeContactWriterResult === true/,
      /reasonKey: 'brand_referral_contact_writer_failed'/,
    ],
    'route adapter optional internal writer',
  );
  assertContainsAll(
    task779Source,
    [
      /assertNoForbiddenPublicFields/,
      /default mounted public router fails closed when no access guard is injected/,
      /injected allow guard returns normalization-only body through app-like handler/,
      /injected deny guard returns safe deny before referral output is trusted/,
      /malformed HTTP-style body returns a safe non-sensitive envelope/,
    ],
    'Task779 public route behavior coverage',
  );
  assertContainsAll(
    task780Source,
    [
      /public response body remains closed/,
      /No route response body/,
      /No DB connection, psql, db:migrate, DDL, dry-run, or apply/,
    ],
    'Task780 closure guard',
  );

  assert.doesNotMatch(publicRouteSource, /json\(response\)/);
  assert.doesNotMatch(publicRouteSource, /includeAuditIntent|auditIntent|includeContactWriterResult|contactWriterResult/);
});

test('unsafe data and high-risk runtime paths remain forbidden in Task781 closure', () => {
  const source = [
    'docs/task-781-brand-referral-migration-024-no-db-closure-checkpoint-no-runtime.md',
    'docs/design/brand-official-line-channel-integration.md',
  ].map(read).join('\n');

  assertContainsAll(
    source,
    [
      /raw `line_user_id`/,
      /token/,
      /secret/,
      /LINE access token/,
      /channel secret/,
      /full phone/,
      /full address/,
      /full customer name/,
      /provider payload/,
      /AI payload/,
      /full customer payload/,
      /credential/,
      /DB URL/,
      /stack/,
      /SQL/,
      /customer case data/,
      /internal note/,
      /billing\/settlement data/,
      /No Case\/intake creation/,
      /identity verification/,
      /No Case Binding/,
      /No provider\/LINE\/webhook/,
      /No AI\/RAG/,
      /No entitlement\/billing/,
      /No admin/,
      /No package/,
      /No smoke/,
    ],
    'Task781 forbidden data and runtime boundary',
  );
});

test('Task781 design cross-reference records checkpoint without authorizing persistence promotion', () => {
  const source = read('docs/design/brand-official-line-channel-integration.md');

  assertContainsAll(
    source,
    [
      /Task781 closes the Migration 024 no-DB checkpoint/,
      /Task760-767 migration readiness artifacts/,
      /Task769-772 injected writer branch/,
      /Task779-780 public route HTTP behavior coverage/,
      /Migration 024 remains authoring-only/,
      /no DB connection/,
      /no psql/,
      /no `db:migrate`/,
      /no DDL/,
      /no dry-run/,
      /no apply/,
      /no persistence promotion/,
      /public route remains normalization-only/,
      /writer remains injected-only/,
    ],
    'Task781 design note',
  );
});
