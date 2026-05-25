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

function requireSpecifiers(source) {
  const specifiers = [];
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
  let match;

  while ((match = requireRegex.exec(source)) !== null) {
    specifiers.push(match[1]);
  }

  return specifiers;
}

test('Task783 evidence exists before Task784 repository closure', () => {
  [
    'src/engineerMobile/engineerMobileReadModelRepository.js',
    'tests/engineerMobile/engineerMobileReadModelRepository.unit.test.js',
    'docs/task-783-engineer-mobile-read-model-repository-injected-db-unit-test-no-real-db-no-api.md',
  ].forEach(assertFileExists);
});

test('Task784 closure document records injected repository boundary without runtime promotion', () => {
  const source = read('docs/task-784-engineer-mobile-read-model-repository-closure-guard-no-real-db-no-api.md');

  assertContainsAll(
    source,
    [
      /Status: completed/,
      /Task783/,
      /injected/i,
      /dbClient/,
      /transaction/,
      /No real DB/,
      /No API/,
      /No completion writes/,
      /No finalAppointmentId/,
      /No provider/,
      /No AI\/RAG/,
      /No migration/,
      /No smoke/,
      /one Case = one formal completion report/i,
      /multiple appointments/i,
    ],
    'Task784 closure document',
  );
});

test('repository imports only safe Engineer Mobile read-model mappers and no runtime sinks', () => {
  const source = read('src/engineerMobile/engineerMobileReadModelRepository.js');

  assert.deepEqual(requireSpecifiers(source), [
    './engineerMobileTaskListReadModelMapper',
    './engineerMobileTaskDetailReadModelMapper',
  ]);

  [
    /process\.env/,
    /require\(['"].*(?:db|database|pool|config|server|app|router|controller|service|provider|webhook|sms|line|openai|rag|billing|entitlement|admin|package)['"]\)/i,
    /app\.listen|server\.listen/,
    /fetch\(|axios/,
    /new Pool|Pool\(|createPool|getPool/i,
    /submitCompletion|createReport|updateReport|approveReport|publishReport/i,
    /mutateFinalAppointmentId|finalAppointmentId\s*=/i,
    /sendProviderMessage|dispatchPush|writeCorrection|brandChannelWebhook/i,
  ].forEach((pattern) => {
    assert.doesNotMatch(source, pattern);
  });
});

test('repository remains injected-only and fails closed on missing injected query boundary', () => {
  const repositorySource = read('src/engineerMobile/engineerMobileReadModelRepository.js');
  const unitTestSource = read('tests/engineerMobile/engineerMobileReadModelRepository.unit.test.js');

  assertContainsAll(
    repositorySource,
    [
      /function resolveQueryClient\(options\)/,
      /const dbClient = options\.dbClient \|\| options\.transaction/,
      /typeof dbClient === 'function'/,
      /typeof dbClient\.query === 'function'/,
      /if \(!values \|\| typeof query !== 'function'\)/,
      /return emptyTaskList\(\)/,
      /return emptyTaskDetail\(\)/,
      /catch \(_error\)/,
    ],
    'injected repository fail-closed source',
  );

  assertContainsAll(
    unitTestSource,
    [
      /missing injected db client fails safely without querying/,
      /missing required scope fails safely before query call/,
      /empty malformed and thrown DB results fail safely without sensitive leak/,
      /db timeout token secret raw_phone should not leak/,
    ],
    'Task783 injected repository tests',
  );
});

test('repository queries only the Migration 022 read-model table with safe read-model columns', () => {
  const source = read('src/engineerMobile/engineerMobileReadModelRepository.js');

  assertContainsAll(
    source,
    [
      /const ENGINEER_MOBILE_READ_MODEL_TABLE = 'engineer_mobile_task_read_models'/,
      /organization_id/,
      /case_id/,
      /appointment_id/,
      /assigned_engineer_id/,
      /scheduled_start/,
      /scheduled_end/,
      /status/,
      /customer_name_masked/,
      /customer_phone_masked/,
      /address_summary/,
      /product_summary/,
      /issue_summary/,
      /service_summary/,
      /service_type/,
      /site_note_safe/,
      /checklist_summary/,
      /evidence_refs/,
      /from \$\{ENGINEER_MOBILE_READ_MODEL_TABLE\}/,
      /where organization_id = \$1/,
      /and assigned_engineer_id = \$2/,
    ],
    'Migration 022 read-model query boundary',
  );

  assert.doesNotMatch(source, /field_service_report_id|service_report_id|formal_report_id|final_appointment_id|finalAppointmentId/);
});

test('repository output boundary remains mapper-approved and excludes sensitive or internal data', () => {
  const repositorySource = read('src/engineerMobile/engineerMobileReadModelRepository.js');
  const unitTestSource = read('tests/engineerMobile/engineerMobileReadModelRepository.unit.test.js');
  const task783Source = read('docs/task-783-engineer-mobile-read-model-repository-injected-db-unit-test-no-real-db-no-api.md');

  assertContainsAll(
    repositorySource,
    [
      /mapEngineerMobileTaskListRows/,
      /mapEngineerMobileTaskDetailRowsToReadModel/,
      /function rowsFromQueryResult/,
      /return \[\]/,
    ],
    'mapper-approved repository output',
  );

  assertContainsAll(
    `${unitTestSource}\n${task783Source}`,
    [
      /assertNoForbiddenOutput/,
      /DATABASE_URL/,
      /token/,
      /secret/,
      /raw_line_user_id/,
      /raw_phone/,
      /raw_address/,
      /internal_note/,
      /audit_log|audit raw payload/i,
      /ai_raw_payload|AI raw payload/i,
      /billing_internal|billing\/settlement internals/i,
      /settlement_internal/,
      /full_payload/,
      /Field Service Report id/,
      /formal report id/,
      /finalAppointmentId/,
    ],
    'Task783 output safety evidence',
  );
});

test('Engineer Mobile design note records Task783-784 closure and preserves completion invariants', () => {
  const source = read('docs/design/engineer-mobile-workbench.md');

  assertContainsAll(
    source,
    [
      /Task783-784 Read Model Repository Closure/,
      /injected DB boundary/,
      /no real DB/,
      /no API/,
      /no completion writes/,
      /finalAppointmentId remains backend\/system-owned/,
      /one Case has one formal completion report/,
      /many appointments \/ dispatch visits/,
    ],
    'Engineer Mobile design closure note',
  );
});
