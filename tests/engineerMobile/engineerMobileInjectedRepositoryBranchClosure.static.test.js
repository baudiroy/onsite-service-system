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

function requireSpecifiers(source) {
  const specifiers = [];
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
  let match;

  while ((match = requireRegex.exec(source)) !== null) {
    specifiers.push(match[1]);
  }

  return specifiers;
}

test('Task783 through Task788 evidence exists before Task789 branch closure', () => {
  [
    'src/engineerMobile/engineerMobileReadModelRepository.js',
    'src/engineerMobile/engineerMobileReadProviderOptionsComposer.js',
    'tests/engineerMobile/engineerMobileReadModelRepository.unit.test.js',
    'tests/engineerMobile/engineerMobileReadModelRepositoryClosure.static.test.js',
    'tests/engineerMobile/engineerMobileAppFactoryInjectedRepositoryProvider.unit.test.js',
    'tests/engineerMobile/engineerMobileInjectedRepositoryProviderClosure.static.test.js',
    'tests/engineerMobile/engineerMobileInjectedRepositoryProviderHttpBehavior.unit.test.js',
    'tests/engineerMobile/engineerMobileInjectedRepositoryHttpBehaviorClosure.static.test.js',
    'docs/task-783-engineer-mobile-read-model-repository-injected-db-unit-test-no-real-db-no-api.md',
    'docs/task-784-engineer-mobile-read-model-repository-closure-guard-no-real-db-no-api.md',
    'docs/task-785-engineer-mobile-app-factory-injected-repository-provider-path-no-real-db-no-api-shape-change.md',
    'docs/task-786-engineer-mobile-injected-repository-provider-path-closure-guard-no-real-db-no-api-shape-change.md',
    'docs/task-787-engineer-mobile-injected-repository-provider-http-behavior-unit-test-no-listen-no-real-db.md',
    'docs/task-788-engineer-mobile-injected-repository-http-behavior-closure-guard-no-listen-no-real-db.md',
  ].forEach(assertFileExists);
});

test('Task789 closure document summarizes Task783 through Task788 accepted boundaries', () => {
  const source = read('docs/task-789-engineer-mobile-injected-repository-branch-closure-checkpoint-no-real-db-no-api-change.md');

  assertContainsAll(
    source,
    [
      /Status: completed/,
      /Task783/,
      /Task784/,
      /Task785/,
      /Task786/,
      /Task787/,
      /Task788/,
      /injected-only/i,
      /fake-DB/i,
      /no listen/i,
      /no real DB/i,
      /no API shape change/i,
      /no completion writes/i,
      /no finalAppointmentId/i,
      /one Case = one formal completion report/i,
      /multiple appointments/i,
    ],
    'Task789 closure document',
  );
});

test('read-model repository remains injected-only with no global runtime sinks', () => {
  const source = read('src/engineerMobile/engineerMobileReadModelRepository.js');

  assert.deepEqual(requireSpecifiers(source), [
    './engineerMobileTaskListReadModelMapper',
    './engineerMobileTaskDetailReadModelMapper',
  ]);

  assertContainsAll(
    source,
    [
      /function resolveQueryClient\(options\)/,
      /options\.transaction/,
      /options\.dbClient/,
      /return undefined/,
      /engineer_mobile_task_read_models/,
      /mapEngineerMobileTaskListRows/,
      /mapEngineerMobileTaskDetailRowsToReadModel/,
      /catch \(_error\)/,
    ],
    'injected read-model repository boundary',
  );

  [
    /process\.env/,
    /require\(['"].*(?:pg|database|pool|config|network|logger|provider|webhook|sms|line|push|openai|rag|vector|routes?|controllers?|server|app|completion|FieldServiceReport|billing|entitlement|admin|package|smoke)['"]\)/i,
    /fetch\(|axios|http\.request|https\.request/,
    /submitCompletion|createReport|updateReport|approveReport|publishReport/i,
    /mutateFinalAppointmentId|finalAppointmentId\s*=|final_appointment_id\s*=/i,
    /sendProviderMessage|dispatchPush|sendLine|sendSms|webhook/i,
  ].forEach((pattern) => {
    assert.doesNotMatch(source, pattern);
  });
});

test('app/provider composition activates injected repository only from explicit opt-in boundary', () => {
  const source = read('src/engineerMobile/engineerMobileReadProviderOptionsComposer.js');

  assert.deepEqual(requireSpecifiers(source), ['./engineerMobileReadRepository']);
  assertContainsAll(
    source,
    [
      /options\.useRequestAwareProvider !== true/,
      /function hasInjectedQueryBoundary\(options\)/,
      /hasOwnOption\(options, 'dbClient'\)/,
      /hasOwnOption\(options, 'transaction'\)/,
      /module\['require'\]\('\.\/engineerMobileReadModelRepository'\)/,
      /!hasExplicitReadSource\(options\) && hasInjectedQueryBoundary\(options\)/,
      /repository: createInjectedReadModelRepository\(options\)/,
    ],
    'explicit injected repository provider composition',
  );

  [
    /process\.env/,
    /require\(['"].*(?:pg|database|pool|config|network|logger|provider|webhook|sms|line|push|openai|rag|vector|routes?|controllers?|server|app|completion|FieldServiceReport|billing|entitlement|admin|package|smoke)['"]\)/i,
    /app\.listen|server\.listen|createServer/,
    /submitCompletion|createReport|updateReport|approveReport|publishReport/i,
    /mutateFinalAppointmentId|finalAppointmentId\s*=|final_appointment_id\s*=/i,
  ].forEach((pattern) => {
    assert.doesNotMatch(source, pattern);
  });
});

test('HTTP behavior remains app-like unit-only with existing response shapes', () => {
  const source = read('tests/engineerMobile/engineerMobileInjectedRepositoryProviderHttpBehavior.unit.test.js');

  assertContainsAll(
    source,
    [
      /createApp/,
      /app\.handle\(req, res\)/,
      /useRequestAwareProvider: true/,
      /dbClient: createFakeQueryClient/,
      /transaction: createFakeQueryClient/,
      /Object\.keys\(response\.body\)\.sort\(\), \['status', 'tasks'\]/,
      /Object\.keys\(response\.body\)\.sort\(\), \['detail', 'status'\]/,
      /wrong scope empty result thrown DB and malformed rows fail closed safely/,
    ],
    'Task787 app-like HTTP behavior boundary',
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

test('branch closure keeps sensitive internal provider AI report finalAppointmentId and SQL data out of responses', () => {
  const combined = [
    read('tests/engineerMobile/engineerMobileInjectedRepositoryProviderHttpBehavior.unit.test.js'),
    read('docs/task-787-engineer-mobile-injected-repository-provider-http-behavior-unit-test-no-listen-no-real-db.md'),
    read('docs/task-788-engineer-mobile-injected-repository-http-behavior-closure-guard-no-listen-no-real-db.md'),
    read('docs/task-789-engineer-mobile-injected-repository-branch-closure-checkpoint-no-real-db-no-api-change.md'),
  ].join('\n');

  assertContainsAll(
    combined,
    [
      /DB URL/,
      /token/,
      /secret/,
      /raw LINE id/i,
      /LINE access token/i,
      /LINE channel secret/i,
      /full phone/i,
      /full address/i,
      /provider payload/i,
      /AI payload/i,
      /full customer payload/i,
      /credential/,
      /customer case data/i,
      /internal note/i,
      /audit raw payload/i,
      /AI raw payload/i,
      /billing\/settlement internals/i,
      /full payload/i,
      /Field Service Report id/i,
      /formal report id/i,
      /finalAppointmentId/,
      /stack/,
      /SQL/,
    ],
    'branch sensitive output deny-list',
  );
});

test('branch closure forbids runtime promotion paths and preserves no-real-DB state', () => {
  const source = read('docs/task-789-engineer-mobile-injected-repository-branch-closure-checkpoint-no-real-db-no-api-change.md');

  assertContainsAll(
    source,
    [
      /no real DB/i,
      /no psql/i,
      /no db:migrate/i,
      /no DDL/i,
      /no dry-run/i,
      /no apply/i,
      /no provider/i,
      /no LINE/i,
      /no SMS/i,
      /no App push/i,
      /no webhook/i,
      /no AI\/RAG/i,
      /no admin UI/i,
      /no package/i,
      /no smoke/i,
      /no Migration 022 execution/i,
    ],
    'runtime promotion deny-list',
  );
});

test('Engineer Mobile design records Task783-789 branch closure and core invariants', () => {
  const source = read('docs/design/engineer-mobile-workbench.md');

  assertContainsAll(
    source,
    [
      /Task783-789 Injected Repository Branch Closure/,
      /injected-only/,
      /fake-DB/,
      /no listen/,
      /no real DB/,
      /no API shape change/,
      /no completion writes/,
      /one Case has one formal completion report/i,
      /one Case may have many appointments/i,
      /finalAppointmentId remains backend\/system-owned/,
    ],
    'Engineer Mobile Workbench Task783-789 closure note',
  );
});
