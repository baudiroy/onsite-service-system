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

test('Task735 through Task772 checkpoint evidence exists before branch closure', () => {
  [
    'docs/task-735-brand-referral-source-recognition-policy-baseline-no-api-no-db.md',
    'docs/task-736-brand-channel-triage-policy-baseline-no-ai-no-db.md',
    'docs/task-737-brand-referral-triage-policy-integration-guard-no-api-no-db.md',
    'docs/task-738-brand-channel-basic-policy-branch-closure-guard-no-api-no-db.md',
    'docs/task-739-multi-official-line-channels-per-brand-design-baseline-docs-only-no-runtime.md',
    'docs/task-740-multi-official-line-channel-identity-scope-static-guard-docs-only-no-runtime.md',
    'docs/task-741-multi-official-line-channel-config-allowed-flow-policy-no-api-no-db.md',
    'docs/task-742-brand-multi-channel-referral-triage-allowed-flow-integration-guard-no-api-no-db.md',
    'docs/task-743-multi-official-line-channel-branch-closure-guard-no-runtime.md',
    'docs/task-744-brand-referral-intake-request-normalizer-no-api-no-db.md',
    'docs/task-745-brand-referral-normalizer-channel-flow-integration-guard-no-api-no-db.md',
    'docs/task-746-basic-brand-referral-policy-branch-closure-guard-no-runtime.md',
    'docs/task-747-brand-referral-runtime-adoption-readiness-packet-docs-only-no-runtime.md',
    'docs/task-748-basic-brand-referral-api-normalization-slice-no-db-no-case-creation.md',
    'docs/task-749-basic-brand-referral-api-normalization-closure-guard-no-db-no-route-mount.md',
    'docs/task-750-brand-referral-api-permission-entitlement-guard-no-db-no-public-route.md',
    'docs/task-751-brand-referral-guarded-normalization-closure-guard-no-db-no-public-route.md',
    'docs/task-752-basic-brand-referral-route-adapter-contract-no-global-mount-no-db.md',
    'docs/task-753-brand-referral-route-adapter-closure-guard-no-public-mount-no-db.md',
    'docs/task-754-brand-referral-public-route-mount-readiness-packet-no-mount-no-db.md',
    'docs/task-755-brand-referral-public-route-mount-guarded-normalization-only-no-db-no-case-creation.md',
    'docs/task-756-brand-referral-public-route-mount-closure-guard-no-db-no-side-effects.md',
    'docs/task-757-brand-referral-audit-contact-intent-builder-no-audit-write-no-db.md',
    'docs/task-758-brand-referral-route-audit-intent-side-channel-no-audit-write-no-db.md',
    'docs/task-759-brand-referral-audit-intent-side-channel-closure-guard-no-audit-write-no-db.md',
    'docs/task-760-brand-referral-audit-contact-persistence-readiness-packet-docs-only-no-runtime.md',
    'docs/task-761-brand-referral-audit-contact-persistence-schema-proposal-no-migration-no-db.md',
    'docs/task-762-brand-referral-audit-contact-persistence-migration-authorization-packet-no-migration-no-db.md',
    'docs/task-763-brand-referral-audit-contact-migration-draft-plan-no-migration-no-db.md',
    'docs/task-764-brand-referral-audit-contact-migration-file-creation-preflight-gate-no-migration-no-db.md',
    'docs/task-765-brand-referral-audit-contact-events-migration-file-no-apply-no-db.md',
    'docs/task-766-brand-referral-audit-contact-events-migration-024-disposable-db-dry-run-authorization-packet-no-db-execution.md',
    'docs/task-767-brand-referral-migration-024-disposable-db-dry-run-result-template-no-db-execution.md',
    'docs/task-768-brand-referral-audit-contact-repository-writer-runtime-readiness-no-runtime-no-db.md',
    'docs/task-769-brand-referral-audit-contact-writer-injected-db-unit-test-no-real-db-no-route-wiring.md',
    'docs/task-770-brand-referral-public-route-injected-audit-writer-path-no-real-db-no-response-shape-change.md',
    'docs/task-771-brand-referral-injected-audit-writer-path-closure-guard-no-real-db-no-response-shape-change.md',
    'docs/task-772-brand-referral-audit-contact-writer-branch-closure-guard-no-real-db.md',
    'docs/task-773-brand-referral-normalization-audit-contact-branch-closure-checkpoint-no-runtime-no-db.md',
    'migrations/024_create_brand_referral_contact_events.sql',
    'src/brandChannel/brandReferralAuditContactRepository.js',
    'src/brandChannel/brandReferralAuditContactWriter.js',
    'src/brandChannel/brandReferralRouteAdapter.js',
    'src/routes/public.routes.js',
    'tests/brandChannel/brandReferralAuditContactWriter.unit.test.js',
    'tests/brandChannel/brandReferralRouteInjectedAuditWriter.unit.test.js',
    'tests/brandChannel/brandReferralInjectedWriterPathClosure.static.test.js',
    'tests/brandChannel/brandReferralAuditContactWriterBranchClosure.static.test.js',
  ].forEach(assertFileExists);
});

test('Task773 checkpoint document summarizes completed phases and explicit pause boundary', () => {
  const source = read('docs/task-773-brand-referral-normalization-audit-contact-branch-closure-checkpoint-no-runtime-no-db.md');

  assertContainsAll(
    source,
    [
      /Status: completed/,
      /Task735 through Task772/,
      /Docs\/static design baseline/,
      /Pure deterministic policies/,
      /Request normalization and guarded API envelope/,
      /Audit\/contact intent side-channel/,
      /Migration 024 no-apply artifact/,
      /Injected audit\/contact writer path/,
      /Still Paused \/ Not Authorized/,
      /Unsafe Data Boundary/,
      /Future Decision Points/,
      /DB connection/,
      /Migration 024 dry-run or apply/,
      /real audit\/contact persistence sink/,
      /public API response body changes/,
      /identity verification/,
      /Case Binding/,
      /provider \/ LINE \/ SMS \/ App push \/ webhook \/ email delivery/,
      /AI\/RAG runtime/,
    ],
    'Task773 checkpoint document',
  );
});

test('public brand referral route remains normalization-only and does not expose writer internals', () => {
  const publicRouteSource = read('src/routes/public.routes.js');
  const routeAdapterSource = read('src/brandChannel/brandReferralRouteAdapter.js');
  const routeClosureSource = read('tests/brandChannel/brandReferralPublicRouteMountClosure.static.test.js');
  const injectedWriterTestSource = read('tests/brandChannel/brandReferralRouteInjectedAuditWriter.unit.test.js');

  assertContainsAll(
    publicRouteSource,
    [
      /router\.post\(\s*['"]\/brand-referral\/normalize['"]/,
      /createBrandReferralNormalizeHandler\(options\.brandReferral \|\| \{\}\)/,
      /requireAccessGuard: true/,
      /json\(response\.body\)/,
      /contactWriter: options\.contactWriter/,
    ],
    'public brand referral route',
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
    'route adapter guarded normalization plus optional internal writer',
  );
  assertContainsAll(
    routeClosureSource,
    [
      /single guarded normalization route/,
      /assert\.equal\(routeMatches\.length, 1\)/,
      /default public route fails closed when no access guard is injected/,
      /unsafe output and side-effect boundaries are documented/,
    ],
    'public route closure guard',
  );
  assertContainsAll(
    injectedWriterTestSource,
    [
      /assertNoPublicWriterFields/,
      /public router can pass optional injected fake writer while preserving response shape/,
      /writer failure is captured as safe internal metadata without changing public body/,
    ],
    'injected writer unit coverage',
  );

  assert.doesNotMatch(publicRouteSource, /json\(response\)/);
  assert.doesNotMatch(publicRouteSource, /includeAuditIntent|auditIntent|includeContactWriterResult|contactWriterResult/);
});

test('Migration 024 exists as no-apply artifact with no DB execution evidence', () => {
  const migrationSource = read('migrations/024_create_brand_referral_contact_events.sql');
  const migrationDoc = read('docs/task-765-brand-referral-audit-contact-events-migration-file-no-apply-no-db.md');
  const dryRunDoc = read('docs/task-766-brand-referral-audit-contact-events-migration-024-disposable-db-dry-run-authorization-packet-no-db-execution.md');
  const templateDoc = read('docs/task-767-brand-referral-migration-024-disposable-db-dry-run-result-template-no-db-execution.md');

  assertContainsAll(
    migrationSource,
    [
      /CREATE TABLE IF NOT EXISTS brand_referral_contact_events/,
      /organization_id/,
      /line_channel_id/,
      /request_id/,
      /retention_until/,
      /deleted_at/,
    ],
    'Migration 024 SQL artifact',
  );
  assertContainsAll(
    `${migrationDoc}\n${dryRunDoc}\n${templateDoc}`,
    [
      /no DB execution/i,
      /does not use psql/i,
      /does not run `db:migrate`/,
      /does not run DDL/i,
      /does not dry-run/i,
      /does not apply/i,
      /disposable local\/test DB/i,
    ],
    'Migration 024 no-apply documentation',
  );
  const activeSql = migrationSource
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('--'))
    .join('\n');
  assert.doesNotMatch(activeSql, /\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bCOPY\b/i);
});

test('audit contact repository and writer remain injected-only with no default real DB configuration', () => {
  const repositorySource = read('src/brandChannel/brandReferralAuditContactRepository.js');
  const writerSource = read('src/brandChannel/brandReferralAuditContactWriter.js');
  const publicRouteSource = read('src/routes/public.routes.js');
  const imports = `${requireStatements(repositorySource)}\n${requireStatements(writerSource)}\n${requireStatements(publicRouteSource)}`;

  assertContainsAll(
    repositorySource,
    [
      /async function insertBrandReferralAuditContactEvent\(dbClient, row\)/,
      /if \(!dbClient \|\| typeof dbClient\.insert !== 'function'\)/,
      /pickAllowedColumns/,
      /dbClient\.insert\(BRAND_REFERRAL_AUDIT_CONTACT_TABLE, safeRow\)/,
    ],
    'injected audit contact repository',
  );
  assertContainsAll(
    writerSource,
    [
      /const dbClient = options\.dbClient \|\| options\.transaction/,
      /if \(!dbClient\)/,
      /const result = await repository\(dbClient, built\.row\)/,
      /brand_referral_audit_contact_db_client_missing/,
    ],
    'injected audit contact writer',
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
    /global(?:This)?\./,
    /new Pool|Pool\(/,
    /createPool|getPool|dbClient = require/i,
  ].forEach((pattern) => {
    assert.doesNotMatch(imports, pattern);
  });
});

test('branch checkpoint continues to forbid runtime side effects and sensitive data', () => {
  const checkpointDoc = read('docs/task-773-brand-referral-normalization-audit-contact-branch-closure-checkpoint-no-runtime-no-db.md');
  const designDoc = read('docs/design/brand-official-line-channel-integration.md');
  const combined = `${checkpointDoc}\n${designDoc}`;

  assertContainsAll(
    combined,
    [
      /Task735-773 close the current Brand Referral normalization and audit-contact checkpoint/,
      /branch remains paused before any DB dry-run\/apply/,
      /real persistence/,
      /identity verification/,
      /Case Binding/,
      /repair intake handoff/,
      /provider\/webhook delivery/,
      /entitlement\/billing integration/,
      /admin UI/,
      /smoke tests/,
      /AI\/RAG runtime/,
      /raw `line_user_id`/,
      /LINE access token/,
      /LINE channel secret/,
      /full phone/,
      /full address/,
      /full customer name/,
      /provider payload/,
      /AI payload/,
      /full customer payload/,
      /database URL/,
      /stack trace/,
      /SQL/,
      /customer case data/,
      /internal note/,
      /billing internal data/,
      /settlement internal data/,
      /cross-organization data/,
    ],
    'branch closure forbidden scope and unsafe data boundary',
  );
});

test('Task773 design cross-reference records checkpoint without promoting runtime', () => {
  const source = read('docs/design/brand-official-line-channel-integration.md');

  assertContainsAll(
    source,
    [
      /Task735-773 close the current Brand Referral normalization and audit-contact checkpoint/,
      /docs\/static design/,
      /pure referral\/channel policies/,
      /request normalization/,
      /guarded public normalization route/,
      /auditIntent side-channel/,
      /Migration 024 authoring-only SQL\/no-apply file/,
      /injected fake-DB writer/,
      /optional injected route writer path/,
      /closure guards/,
      /paused before any DB dry-run\/apply/,
      /real persistence/,
      /identity verification/,
      /Case Binding/,
      /repair intake handoff/,
      /provider\/webhook delivery/,
      /entitlement\/billing integration/,
      /admin UI/,
      /smoke tests/,
      /AI\/RAG runtime/,
    ],
    'Task773 design cross-reference',
  );
});
