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

test('Task785 evidence exists before Task786 injected provider closure', () => {
  [
    'src/engineerMobile/engineerMobileReadProviderOptionsComposer.js',
    'src/engineerMobile/engineerMobileReadModelRepository.js',
    'tests/engineerMobile/engineerMobileAppFactoryInjectedRepositoryProvider.unit.test.js',
    'docs/task-785-engineer-mobile-app-factory-injected-repository-provider-path-no-real-db-no-api-shape-change.md',
  ].forEach(assertFileExists);
});

test('Task786 closure document records accepted app-factory injected repository boundary', () => {
  const source = read('docs/task-786-engineer-mobile-injected-repository-provider-path-closure-guard-no-real-db-no-api-shape-change.md');

  assertContainsAll(
    source,
    [
      /Status: completed/,
      /Task785/,
      /explicit opt-in/i,
      /useRequestAwareProvider/,
      /dbClient/,
      /transaction/,
      /no real DB/i,
      /no API shape change/i,
      /no completion writes/i,
      /no finalAppointmentId/i,
      /no migration/i,
      /no provider/i,
      /no AI\/RAG/i,
      /one Case = one formal completion report/i,
      /multiple appointments/i,
    ],
    'Task786 closure document',
  );
});

test('composer creates injected repository only from explicit request-aware fake DB boundary', () => {
  const source = read('src/engineerMobile/engineerMobileReadProviderOptionsComposer.js');

  assert.deepEqual(requireSpecifiers(source), ['./engineerMobileReadRepository']);
  assertContainsAll(
    source,
    [
      /options\.useRequestAwareProvider !== true/,
      /function hasInjectedQueryBoundary\(options\)/,
      /hasOwnOption\(options, 'dbClient'\)/,
      /hasOwnOption\(options, 'transaction'\)/,
      /function createInjectedReadModelRepository\(options = \{\}\)/,
      /module\['require'\]\('\.\/engineerMobileReadModelRepository'\)/,
      /createEngineerMobileReadModelRepository\(\{/,
      /dbClient: options\.dbClient/,
      /transaction: options\.transaction/,
      /!hasExplicitReadSource\(options\) && hasInjectedQueryBoundary\(options\)/,
      /repository: createInjectedReadModelRepository\(options\)/,
    ],
    'injected repository provider composition',
  );
});

test('composer preserves explicit read sources and executor sources before injected repository creation', () => {
  const source = read('src/engineerMobile/engineerMobileReadProviderOptionsComposer.js');

  assertContainsAll(
    source,
    [
      /function hasExplicitReadSource\(options\)/,
      /hasOwnOption\(options, 'repository'\)/,
      /hasOwnOption\(options, 'readModel'\)/,
      /hasOwnOption\(options, 'readModelAsync'\)/,
      /hasOwnOption\(options, 'taskProvider'\)/,
      /hasOwnOption\(options, 'taskProviderAsync'\)/,
      /function hasExecutorSource\(options\)/,
      /hasOwnOption\(options, 'executor'\)/,
      /hasOwnOption\(options, 'queryExecutor'\)/,
      /hasOwnOption\(options, 'listExecutor'\)/,
      /hasOwnOption\(options, 'detailExecutor'\)/,
      /if \(hasExplicitReadSource\(options\) \|\| !hasExecutorSource\(options\)\)/,
      /createEngineerMobileReadRepository\(\{/,
    ],
    'explicit source and executor priority',
  );
});

test('Task785 app-factory unit coverage locks default no-query path and injected fake DB paths', () => {
  const source = read('tests/engineerMobile/engineerMobileAppFactoryInjectedRepositoryProvider.unit.test.js');

  assertContainsAll(
    source,
    [
      /default request-aware app factory without injected DB remains unchanged and does not query/,
      /nested dbClient option reaches injected repository for task list/,
      /nested dbClient option reaches injected repository for task detail/,
      /nested transaction option can provide read-model rows without real DB/,
      /injected repository path fails closed for DB throw malformed and wrong scope without raw leak/,
      /composer source creates injected repository only from explicit dbClient or transaction boundary/,
      /assertNoForbiddenOutput/,
      /Object\.keys\(response\.body\)\.sort\(\), \['status', 'tasks'\]/,
      /Object\.keys\(response\.body\)\.sort\(\), \['detail', 'status'\]/,
    ],
    'Task785 app-factory unit test coverage',
  );

  assert.doesNotMatch(source, /\.listen\(/);
});

test('composer imports no global DB provider AI completion writer server admin package or smoke modules', () => {
  const source = read('src/engineerMobile/engineerMobileReadProviderOptionsComposer.js');

  [
    /process\.env/,
    /app\.listen|server\.listen|createServer/,
    /require\(['"].*(?:pg|database|pool|config|routes?|controllers?|server|provider|webhook|sms|line|openai|rag|vector|billing|entitlement|admin|package|smoke)['"]\)/i,
    /submitCompletion|createReport|updateReport|approveReport|publishReport/i,
    /mutateFinalAppointmentId|finalAppointmentId\s*=|final_appointment_id\s*=/i,
    /sendProviderMessage|dispatchPush|sendLine|sendSms|webhook/i,
  ].forEach((pattern) => {
    assert.doesNotMatch(source, pattern);
  });
});

test('output boundary remains mapper-approved and excludes sensitive or internal data', () => {
  const combined = [
    read('tests/engineerMobile/engineerMobileAppFactoryInjectedRepositoryProvider.unit.test.js'),
    read('docs/task-785-engineer-mobile-app-factory-injected-repository-provider-path-no-real-db-no-api-shape-change.md'),
    read('docs/task-786-engineer-mobile-injected-repository-provider-path-closure-guard-no-real-db-no-api-shape-change.md'),
  ].join('\n');

  assertContainsAll(
    combined,
    [
      /DB URL/,
      /token/,
      /secret/,
      /raw LINE id/i,
      /full phone/i,
      /full address/i,
      /internal note/i,
      /audit raw payload/i,
      /AI raw payload/i,
      /billing\/settlement internals/i,
      /full payload/i,
      /Field Service Report id/i,
      /formal report id/i,
      /finalAppointmentId/,
    ],
    'safe output and redaction boundary',
  );
});

test('Engineer Mobile design records Task785-786 closure and core case/report invariants', () => {
  const source = read('docs/design/engineer-mobile-workbench.md');

  assertContainsAll(
    source,
    [
      /Task785-786 Injected Repository Provider Path Closure/,
      /explicit opt-in/,
      /useRequestAwareProvider/,
      /dbClient/,
      /transaction/,
      /no real DB/,
      /no API shape change/,
      /one Case has one formal completion report/i,
      /one Case may have many appointments/i,
      /finalAppointmentId remains backend\/system-owned/,
    ],
    'Engineer Mobile Workbench Task785-786 closure note',
  );
});
