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

function combinedSource() {
  return [
    read('src/engineerMobile/engineerMobileTaskListService.js'),
    read('src/engineerMobile/engineerMobileTaskDetailService.js'),
    read('src/engineerMobile/engineerMobileTaskListReadProviderAdapter.js'),
  ].join('\n');
}

test('Task795 evidence and Task796 closure targets exist', () => {
  [
    'src/engineerMobile/engineerMobileTaskListService.js',
    'src/engineerMobile/engineerMobileTaskDetailService.js',
    'src/engineerMobile/engineerMobileTaskListReadProviderAdapter.js',
    'src/engineerMobile/engineerMobilePermissionAssignmentGuard.js',
    'tests/engineerMobile/engineerMobilePermissionGuardAppProvider.unit.test.js',
    'docs/task-795-engineer-mobile-permission-guard-app-provider-integration-no-db-no-api-shape-change.md',
    'docs/design/engineer-mobile-workbench.md',
  ].forEach(assertFileExists);
});

test('permission guard app integration remains explicit opt-in synthetic context only', () => {
  const source = combinedSource();

  assertContainsAll(
    source,
    [
      /permissionAssignmentGuardEnabled === true/,
      /source\.usePermissionAssignmentGuard === true/,
      /typeof source\.permissionAssignmentGuard === 'function'/,
      /permissionAssignmentContext/,
      /resolvePermissionAssignmentServiceOptions/,
      /isPermissionAssignmentAllowed/,
      /guardOptions\.guard/,
    ],
    'Task795 explicit opt-in guard integration',
  );

  assert.doesNotMatch(source, /\|\| Boolean\(guard\)/);
  assert.doesNotMatch(source, /permissionAssignmentGuardEnabled\s*=\s*true/);
});

test('default behavior and existing API shapes are locked by Task795 coverage', () => {
  const testSource = read('tests/engineerMobile/engineerMobilePermissionGuardAppProvider.unit.test.js');

  assertContainsAll(
    testSource,
    [
      /default behavior remains unchanged when guard is disabled/,
      /guarded app list allows assigned engineer/,
      /guarded app detail allows assigned engineer/,
      /Object\.keys\(response\.body\)\.sort\(\), \['status', 'tasks'\]/,
      /Object\.keys\(response\.body\)\.sort\(\), \['detail', 'status'\]/,
      /permissionAssignmentGuardEnabled: true/,
      /permissionAssignmentContext: auth\(\)/,
      /evaluateEngineerMobilePermissionAssignment/,
    ],
    'Task795 app/provider unit coverage',
  );
});

test('denied list and detail paths stay safe and non-leaky', () => {
  const testSource = read('tests/engineerMobile/engineerMobilePermissionGuardAppProvider.unit.test.js');
  const docSource = read('docs/task-795-engineer-mobile-permission-guard-app-provider-integration-no-db-no-api-shape-change.md');

  assertContainsAll(
    testSource,
    [
      /denies unassigned synthetic engineer context without leaking rows/,
      /denies cross-organization synthetic context/,
      /fail-closes when guard is enabled but auth context lacks role permission and user/,
      /assertNoForbiddenOutput/,
      /raw_phone_should_not_leak/,
      /final_appointment_should_not_leak/,
    ],
    'Task795 deny-path coverage',
  );

  assertContainsAll(
    docSource,
    [
      /safe empty list response/i,
      /not-found \/ denied envelope/i,
      /No raw row/i,
      /full phone\/address/i,
      /billing\/settlement internal data/i,
      /finalAppointmentId/,
    ],
    'Task795 safe deny contract',
  );
});

test('source import boundaries avoid global permission DB provider AI completion route app and server sinks', () => {
  const listSource = read('src/engineerMobile/engineerMobileTaskListService.js');
  const detailSource = read('src/engineerMobile/engineerMobileTaskDetailService.js');
  const adapterSource = read('src/engineerMobile/engineerMobileTaskListReadProviderAdapter.js');

  assert.deepEqual(requireSpecifiers(listSource), []);
  assert.deepEqual(requireSpecifiers(detailSource), []);
  assert.deepEqual(requireSpecifiers(adapterSource), [
    './engineerMobileTaskListService',
    './engineerMobileTaskDetailService',
  ]);

  for (const [label, source] of [
    ['list service', listSource],
    ['detail service', detailSource],
    ['provider adapter', adapterSource],
  ]) {
    [
      /require\(['"].*(?:permissions?|rbac|policy|authz|accessControl|acl)['"]\)/i,
      /require\(['"].*(?:db|pool|database|transaction|repository|repositories|queryExecutor)['"]\)/i,
      /require\(['"].*(?:env|config|network|logger)['"]\)/i,
      /require\(['"].*(?:line|sms|email|push|provider|webhook)['"]\)/i,
      /require\(['"].*(?:ai|rag|vector|openai|embedding|prompt)['"]\)/i,
      /require\(['"].*(?:completion|fieldServiceReport|reportWriter|finalAppointment)['"]\)/i,
      /require\(['"].*(?:routes?|controllers?|server|app|admin|package|smoke)['"]\)/i,
      /process\.env|console\.|fetch\s*\(|axios|XMLHttpRequest|node:http|node:https/i,
    ].forEach((pattern) => {
      assert.doesNotMatch(source, pattern, `${label} matched forbidden ${pattern}`);
    });
  }
});

test('source does not introduce completion writes FSR writes finalAppointmentId behavior provider sending AI RAG or DB behavior', () => {
  const source = combinedSource();

  [
    /submitCompletion|completeServiceReport|createFieldServiceReport|updateFieldServiceReport/i,
    /createReport|updateReport|approveReport|publishReport|reportWriter/i,
    /finalAppointmentId\s*=|final_appointment_id\s*=|inferFinalAppointment|resolveFinalAppointment/i,
    /dbClient\.query|transaction\.query|pool\.query|executeSql|psql|db:migrate/i,
    /sendLine|sendSms|sendEmail|sendPush|webhook|provider\.send/i,
    /openai|embedding|vector|rag|prompt|aiModel/i,
  ].forEach((pattern) => {
    assert.doesNotMatch(source, pattern);
  });
});

test('Task796 closure document records accepted boundary without promoting runtime', () => {
  const source = read('docs/task-796-engineer-mobile-permission-guard-app-integration-closure-no-db-no-api-shape-change.md');
  const design = read('docs/design/engineer-mobile-workbench.md');

  assertContainsAll(
    source,
    [
      /Task795/,
      /Status: completed/,
      /opt-in/i,
      /synthetic/i,
      /no API shape change/i,
      /no DB/i,
      /no audit writer/i,
      /no completion write/i,
      /no `?finalAppointmentId/i,
      /no provider sending/i,
      /no AI \/ RAG/i,
      /`status` \/ `tasks`/,
      /`status` \/ `detail`/,
    ],
    'Task796 closure document',
  );

  assert.equal(design.includes('Task795-796 Permission Guard App Integration Closure'), true);
});
