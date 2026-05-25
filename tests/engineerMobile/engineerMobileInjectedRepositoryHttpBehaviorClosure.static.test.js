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
  assert.equal(fs.existsSync(path.join(repoRoot, relativePath)), true, `${relativePath} should exist`);
}

function assertContainsAll(source, patterns, label) {
  for (const pattern of patterns) {
    assert.match(source, pattern, `${label} is missing ${pattern}`);
  }
}

test('Task787 HTTP behavior evidence exists before Task788 closure', () => {
  [
    'tests/engineerMobile/engineerMobileInjectedRepositoryProviderHttpBehavior.unit.test.js',
    'docs/task-787-engineer-mobile-injected-repository-provider-http-behavior-unit-test-no-listen-no-real-db.md',
  ].forEach(assertFileExists);
});

test('Task788 closure document records the accepted no-listen no-real-DB boundary', () => {
  const source = read('docs/task-788-engineer-mobile-injected-repository-http-behavior-closure-guard-no-listen-no-real-db.md');

  assertContainsAll(
    source,
    [
      /Status: completed/,
      /Task787/,
      /HTTP-style/i,
      /app-like/i,
      /no listen/i,
      /no real DB/i,
      /no API shape change/i,
      /no completion writes/i,
      /no finalAppointmentId/i,
      /fake dbClient/,
      /fake transaction/,
      /one Case = one formal completion report/i,
      /multiple appointments/i,
    ],
    'Task788 closure document',
  );
});

test('Task787 test uses app-like handler and does not start a server', () => {
  const source = read('tests/engineerMobile/engineerMobileInjectedRepositoryProviderHttpBehavior.unit.test.js');

  assertContainsAll(
    source,
    [
      /createApp/,
      /app\.handle\(req, res\)/,
      /Readable/,
      /Writable/,
      /createResponse/,
      /requestApp/,
    ],
    'Task787 app-like handler coverage',
  );

  [
    /\.listen\(/,
    /server\.listen/,
    /createServer\(/,
    /startServer/,
    /http\.createServer/,
  ].forEach((pattern) => {
    assert.doesNotMatch(source, pattern);
  });
});

test('Task787 test uses injected fake dbClient or fake transaction only', () => {
  const source = read('tests/engineerMobile/engineerMobileInjectedRepositoryProviderHttpBehavior.unit.test.js');

  assertContainsAll(
    source,
    [
      /useRequestAwareProvider: true/,
      /dbClient: createFakeQueryClient/,
      /transaction: createFakeQueryClient/,
      /function createFakeQueryClient/,
      /LIST_SQL/,
      /DETAIL_SQL/,
      /engineerMobileReadModelRows/,
    ],
    'Task787 injected fake DB boundary',
  );
});

test('Task787 locks existing list and detail API response shapes', () => {
  const source = read('tests/engineerMobile/engineerMobileInjectedRepositoryProviderHttpBehavior.unit.test.js');

  assertContainsAll(
    source,
    [
      /Object\.keys\(response\.body\)\.sort\(\), \['status', 'tasks'\]/,
      /Object\.keys\(response\.body\)\.sort\(\), \['detail', 'status'\]/,
      /response\.body\.status, 'allow'/,
      /response\.body\.tasks/,
      /response\.body\.detail/,
    ],
    'Task787 API shape assertions',
  );
});

test('Task787 covers wrong scope empty thrown DB and malformed rows fail-closed cases', () => {
  const source = read('tests/engineerMobile/engineerMobileInjectedRepositoryProviderHttpBehavior.unit.test.js');

  assertContainsAll(
    source,
    [
      /wrong scope empty result thrown DB and malformed rows fail closed safely/,
      /wrongScopeApp/,
      /emptyApp/,
      /malformedApp/,
      /throwingApp/,
      /statusCode, 404/,
      /statusCode, 200/,
      /body\.tasks, \[\]/,
      /body\.detail, null/,
      /assertNoForbiddenOutput/,
    ],
    'Task787 fail-closed coverage',
  );
});

test('Task787 response deny-list excludes sensitive internal provider AI report and SQL data', () => {
  const source = read('tests/engineerMobile/engineerMobileInjectedRepositoryProviderHttpBehavior.unit.test.js');

  assertContainsAll(
    source,
    [
      /DATABASE_URL/,
      /token/,
      /secret/,
      /raw_line_user_id/,
      /line_access_token/,
      /line_channel_secret/,
      /full_phone/,
      /full_address/,
      /provider_payload/,
      /ai_raw_payload/,
      /full_customer_payload/,
      /credential/,
      /customer_case_data/,
      /internal_note/,
      /audit_raw_payload/,
      /billing_internal/,
      /settlement_internal/,
      /full_payload/,
      /field_service_report_id/,
      /finalAppointmentId/,
      /stack/,
      /select /,
    ],
    'Task787 sensitive output deny-list',
  );
});

test('Task787 imports and source avoid global DB provider AI completion migration env package and smoke paths', () => {
  const source = read('tests/engineerMobile/engineerMobileInjectedRepositoryProviderHttpBehavior.unit.test.js');

  [
    /require\(['"].*(?:pg|database|pool|repositories?|provider|webhook|sms|line|push|openai|rag|vector|completion|FieldServiceReport|migration|admin|package|smoke|config|logger)['"]\)/i,
    /process\.env/,
    /fetch\(|axios|http\.request|https\.request/,
    /submitCompletion|createReport|updateReport|approveReport|publishReport/i,
    /mutateFinalAppointmentId|finalAppointmentId\s*=|final_appointment_id\s*=/i,
    /sendProviderMessage|dispatchPush|sendLine|sendSms|webhook/i,
    /psql|db:migrate|DDL|dry-run|apply/i,
  ].forEach((pattern) => {
    assert.doesNotMatch(source, pattern);
  });
});

test('Engineer Mobile design records Task787-788 closure and case/report invariants', () => {
  const source = read('docs/design/engineer-mobile-workbench.md');

  assertContainsAll(
    source,
    [
      /Task787-788 Injected Repository HTTP Behavior Closure/,
      /HTTP-style/,
      /app-like/,
      /no listen/,
      /no real DB/,
      /no API shape change/,
      /one Case has one formal completion report/i,
      /one Case may have many appointments/i,
      /finalAppointmentId remains backend\/system-owned/,
    ],
    'Engineer Mobile Workbench Task787-788 closure note',
  );
});
