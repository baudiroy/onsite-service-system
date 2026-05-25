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

function uncommentedSql(source) {
  return source
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('--'))
    .join('\n');
}

test('Task716 through Task724 and Task729 Engineer Mobile readiness evidence exists', () => {
  [
    'docs/task-716-engineer-mobile-read-model-mapper-migration-alignment-static-test-no-db-no-migration-apply.md',
    'docs/task-717-engineer-mobile-read-model-migration-draft-rollback-and-safety-guard-no-db-apply-no-psql.md',
    'docs/task-718-engineer-mobile-migration-disposable-db-dry-run-authorization-packet-no-db-execution.md',
    'docs/task-719-engineer-mobile-migration-022-disposable-db-dry-run-result-template-no-db-execution.md',
    'docs/task-720-engineer-mobile-read-model-sanitized-fixture-contract-no-runtime.md',
    'docs/task-721-engineer-mobile-read-model-fixture-mapper-consumption-unit-test-no-db.md',
    'docs/task-722-engineer-mobile-read-model-fixture-negative-boundary-unit-test-no-db.md',
    'docs/task-723-engineer-mobile-app-factory-injected-read-model-provider-boundary-no-db.md',
    'docs/task-724-engineer-mobile-injected-read-model-provider-redaction-contract-no-db.md',
    'docs/task-725-engineer-mobile-injected-detail-provider-redaction-boundary-no-db.md',
    'docs/task-726-engineer-mobile-action-intent-boundary-no-completion-write-no-db.md',
    'docs/task-729-engineer-mobile-read-model-branch-closure-guard-no-runtime.md',
    'docs/task-775-engineer-mobile-migration-022-no-db-readiness-closure-checkpoint-no-runtime.md',
    'migrations/022_create_engineer_mobile_read_model.sql',
    'tests/engineerMobile/engineerMobileReadModelMapperMigrationAlignment.static.test.js',
    'tests/engineerMobile/engineerMobileReadModelMigrationRollbackSafety.static.test.js',
    'tests/engineerMobile/engineerMobileMigrationDryRunAuthorization.static.test.js',
    'tests/engineerMobile/engineerMobileMigrationDryRunResultTemplate.static.test.js',
    'tests/engineerMobile/engineerMobileReadModelFixtureContract.static.test.js',
    'tests/engineerMobile/engineerMobileReadModelFixtureMapper.unit.test.js',
    'tests/engineerMobile/engineerMobileReadModelFixtureNegativeBoundary.unit.test.js',
    'tests/engineerMobile/engineerMobileInjectedReadModelProviderRedaction.unit.test.js',
    'tests/engineerMobile/engineerMobileInjectedDetailProviderRedaction.unit.test.js',
    'tests/engineerMobile/engineerMobileActionIntentBoundary.unit.test.js',
    'tests/engineerMobile/engineerMobileReadModelBranchClosure.static.test.js',
  ].forEach(assertFileExists);
});

test('Task775 checkpoint document summarizes Migration 022 and read-model readiness phases', () => {
  const source = read('docs/task-775-engineer-mobile-migration-022-no-db-readiness-closure-checkpoint-no-runtime.md');

  assertContainsAll(
    source,
    [
      /Task716/,
      /Task717/,
      /Task718/,
      /Task719/,
      /Tasks720-721/,
      /Task722/,
      /Tasks723-724/,
      /Tasks725-726/,
      /Task729/,
      /mapper\/migration alignment/i,
      /rollback/i,
      /dry-run authorization/i,
      /dry-run result template/i,
      /sanitized fixtures/i,
      /injected provider redaction/i,
      /detail redaction/i,
      /action intent boundary/i,
      /read-model closure/i,
    ],
    'Task775 checkpoint document',
  );
});

test('Migration 022 exists but remains no DB no dry-run no apply', () => {
  const migrationSource = read('migrations/022_create_engineer_mobile_read_model.sql');
  const authorizationDoc = read('docs/task-718-engineer-mobile-migration-disposable-db-dry-run-authorization-packet-no-db-execution.md');
  const resultTemplateDoc = read('docs/task-719-engineer-mobile-migration-022-disposable-db-dry-run-result-template-no-db-execution.md');
  const checkpointDoc = read('docs/task-775-engineer-mobile-migration-022-no-db-readiness-closure-checkpoint-no-runtime.md');

  assertContainsAll(
    migrationSource,
    [
      /MIGRATION FILE AUTHORING ONLY/,
      /NOT APPLIED/,
      /NO DB CONNECTION, PSQL, OR SQL EXECUTION IS AUTHORIZED BY THIS FILE/,
      /CREATE TABLE IF NOT EXISTS engineer_mobile_task_read_models/,
      /organization_id/,
      /assigned_engineer_id/,
      /appointment_id/,
    ],
    'Migration 022 SQL artifact',
  );
  assertContainsAll(
    `${authorizationDoc}\n${resultTemplateDoc}\n${checkpointDoc}`,
    [
      /no DB execution/i,
      /no migration dry-run/i,
      /no migration apply/i,
      /no SQL execution/i,
      /no `psql`|psql/i,
      /no `db:migrate`|db:migrate/i,
      /no DDL/i,
      /disposable local\/test DB/i,
      /shared runtime/i,
      /production/i,
      /staging/i,
      /Zeabur/i,
    ],
    'Migration 022 no-DB authorization boundary',
  );

  const activeSql = uncommentedSql(migrationSource);
  assert.doesNotMatch(activeSql, /\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bCOPY\b|\bDROP\b|\bTRUNCATE\b|\bALTER\b/i);
});

test('read-model output safety boundaries remain documented and tested', () => {
  const checkpointDoc = read('docs/task-775-engineer-mobile-migration-022-no-db-readiness-closure-checkpoint-no-runtime.md');
  const closureDoc = read('docs/task-729-engineer-mobile-read-model-branch-closure-guard-no-runtime.md');
  const fixtureContract = read('tests/engineerMobile/engineerMobileReadModelFixtureContract.static.test.js');
  const negativeBoundary = read('tests/engineerMobile/engineerMobileReadModelFixtureNegativeBoundary.unit.test.js');
  const providerRedaction = read('tests/engineerMobile/engineerMobileInjectedReadModelProviderRedaction.unit.test.js');
  const detailRedaction = read('tests/engineerMobile/engineerMobileInjectedDetailProviderRedaction.unit.test.js');
  const combined = `${checkpointDoc}\n${closureDoc}\n${fixtureContract}\n${negativeBoundary}\n${providerRedaction}\n${detailRedaction}`;

  assertContainsAll(
    combined,
    [
      /DB URL|database URL/i,
      /token/i,
      /secret/i,
      /raw LINE|raw_line|raw LINE id|line_user_id/i,
      /full phone|customerPhone|customer_phone/i,
      /full address|address/i,
      /internal note|internal_note/i,
      /audit raw|audit/i,
      /AI raw|ai raw|ai_raw/i,
      /billing/i,
      /settlement/i,
      /full payload|full_customer_payload/i,
      /Field Service Report id|field_service_report_id|fieldServiceReportId/i,
      /finalAppointmentId|final_appointment_id/i,
    ],
    'Engineer Mobile read-model sensitive output boundary',
  );
});

test('completion write and finalAppointmentId action intent boundaries remain closed', () => {
  const checkpointDoc = read('docs/task-775-engineer-mobile-migration-022-no-db-readiness-closure-checkpoint-no-runtime.md');
  const actionIntentTest = read('tests/engineerMobile/engineerMobileActionIntentBoundary.unit.test.js');
  const closureTest = read('tests/engineerMobile/engineerMobileReadModelBranchClosure.static.test.js');
  const combined = `${checkpointDoc}\n${actionIntentTest}\n${closureTest}`;

  assertContainsAll(
    combined,
    [
      /submitCompletion/,
      /createReport/,
      /updateReport/,
      /approveReport/,
      /publishReport/,
      /mutateFinalAppointmentId/,
      /sendProviderMessage/,
      /dispatchPush/,
      /writeCorrection/,
      /brandChannelWebhook/,
      /no completion writes/i,
      /finalAppointmentId.*backend\/system-owned|`finalAppointmentId` remains backend\/system-owned/i,
    ],
    'Engineer Mobile action intent closure',
  );
});

test('case report invariants remain preserved across checkpoint docs', () => {
  const checkpointDoc = read('docs/task-775-engineer-mobile-migration-022-no-db-readiness-closure-checkpoint-no-runtime.md');
  const designDoc = read('docs/design/engineer-mobile-workbench.md');
  const closureDoc = read('docs/task-729-engineer-mobile-read-model-branch-closure-guard-no-runtime.md');
  const combined = `${checkpointDoc}\n${designDoc}\n${closureDoc}`;

  assertContainsAll(
    combined,
    [
      /one Case = one formal completion report/i,
      /multiple appointments/i,
      /do not imply multiple formal reports/i,
      /Field Service Report remains the case-level formal completion summary/i,
      /`finalAppointmentId` remains backend\/system-owned/i,
      /not exposed or decided by Engineer Mobile read-model mapping/i,
    ],
    'Engineer Mobile completion report invariants',
  );
});

test('Task775 design cross-reference records no-DB closure without promoting runtime', () => {
  const source = read('docs/design/engineer-mobile-workbench.md');

  assertContainsAll(
    source,
    [
      /Task775 Migration 022 No-DB Readiness Closure/,
      /mapper\/migration alignment/i,
      /rollback plan/i,
      /dry-run authorization/i,
      /sanitized fixtures/i,
      /provider redaction/i,
      /action intent boundary/i,
      /read-model closure/i,
      /no DB connection/i,
      /no psql/i,
      /no db:migrate/i,
      /no dry-run/i,
      /no apply/i,
      /no completion writes/i,
      /no finalAppointmentId mutation/i,
    ],
    'Task775 design cross-reference',
  );
});
