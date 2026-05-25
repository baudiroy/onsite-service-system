'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

function absolute(relativePath) {
  return path.join(repoRoot, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(absolute(relativePath), 'utf8');
}

function assertFileExists(relativePath) {
  assert.equal(fs.existsSync(absolute(relativePath)), true, `${relativePath} should exist`);
}

function assertContainsAll(source, patterns, label) {
  for (const pattern of patterns) {
    assert.match(source, pattern, `${label} missing ${pattern}`);
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

function permissionBranchSource() {
  return [
    read('src/engineerMobile/engineerMobilePermissionAssignmentGuard.js'),
    read('src/engineerMobile/engineerMobileTaskListService.js'),
    read('src/engineerMobile/engineerMobileTaskDetailService.js'),
    read('src/engineerMobile/engineerMobileTaskListReadProviderAdapter.js'),
  ].join('\n');
}

test('Task793 through Task799 evidence files exist', () => {
  [
    'src/engineerMobile/engineerMobilePermissionAssignmentGuard.js',
    'tests/engineerMobile/engineerMobilePermissionAssignmentGuard.unit.test.js',
    'tests/engineerMobile/engineerMobilePermissionAssignmentGuardClosure.static.test.js',
    'tests/engineerMobile/engineerMobilePermissionGuardAppProvider.unit.test.js',
    'tests/engineerMobile/engineerMobilePermissionGuardAppIntegrationClosure.static.test.js',
    'tests/engineerMobile/engineerMobilePermissionGuardHttpBehavior.unit.test.js',
    'tests/engineerMobile/engineerMobilePermissionGuardHttpBehaviorClosure.static.test.js',
    'tests/engineerMobile/engineerMobilePermissionRuntimeAdjacentBranchClosure.static.test.js',
    'docs/task-793-engineer-mobile-permission-assignment-guard-pure-runtime-module-no-api-no-db.md',
    'docs/task-794-engineer-mobile-permission-assignment-guard-closure-no-api-no-db.md',
    'docs/task-795-engineer-mobile-permission-guard-app-provider-integration-no-db-no-api-shape-change.md',
    'docs/task-796-engineer-mobile-permission-guard-app-integration-closure-no-db-no-api-shape-change.md',
    'docs/task-797-engineer-mobile-permission-guard-http-behavior-unit-test-no-listen-no-db.md',
    'docs/task-798-engineer-mobile-permission-guard-http-behavior-closure-no-listen-no-db.md',
    'docs/task-799-engineer-mobile-permission-runtime-adjacent-branch-closure-checkpoint-no-db-no-api-change.md',
    'docs/design/engineer-mobile-workbench.md',
  ].forEach(assertFileExists);
});

test('Task793 pure guard remains task-list task-detail only and safe metadata only', () => {
  const guardSource = read('src/engineerMobile/engineerMobilePermissionAssignmentGuard.js');
  const guardTest = read('tests/engineerMobile/engineerMobilePermissionAssignmentGuard.unit.test.js');
  const guardClosure = read('tests/engineerMobile/engineerMobilePermissionAssignmentGuardClosure.static.test.js');

  assert.deepEqual(requireSpecifiers(guardSource), []);
  assertContainsAll(
    guardSource,
    [
      /TASK_DETAIL:\s*'task_detail'/,
      /TASK_LIST:\s*'task_list'/,
      /engineer_mobile\.permission_assignment_decision/,
      /evaluateEngineerMobilePermissionAssignment/,
      /auditIntent/,
    ],
    'Task793 guard source',
  );
  assertContainsAll(
    guardTest,
    [
      /allows task list for assigned engineer in same organization/,
      /allows task detail for assigned engineer in same organization/,
      /unsupported/,
      /missing assignment fails closed/,
      /cross-organization assignment fails closed/,
      /decision output contains safe audit intent only and no raw task payload/,
    ],
    'Task793 unit coverage',
  );
  assertContainsAll(
    guardClosure,
    [
      /guard source remains pure and imports no runtime sinks/,
      /guard supports only task_list and task_detail decisions/,
      /decision result shape remains safe metadata only/,
    ],
    'Task794 closure coverage',
  );
});

test('Task795 through Task798 integration remains explicit opt-in synthetic read path only', () => {
  const combined = permissionBranchSource();
  const task795Test = read('tests/engineerMobile/engineerMobilePermissionGuardAppProvider.unit.test.js');
  const task796Test = read('tests/engineerMobile/engineerMobilePermissionGuardAppIntegrationClosure.static.test.js');
  const task797Test = read('tests/engineerMobile/engineerMobilePermissionGuardHttpBehavior.unit.test.js');
  const task798Test = read('tests/engineerMobile/engineerMobilePermissionGuardHttpBehaviorClosure.static.test.js');

  assertContainsAll(
    combined,
    [
      /permissionAssignmentGuardEnabled === true/,
      /source\.usePermissionAssignmentGuard === true/,
      /typeof source\.permissionAssignmentGuard === 'function'/,
      /permissionAssignmentContext/,
      /resolvePermissionAssignmentServiceOptions/,
      /isPermissionAssignmentAllowed/,
    ],
    'explicit opt-in source',
  );
  assert.doesNotMatch(combined, /\|\| Boolean\(guard\)/);
  assert.doesNotMatch(combined, /permissionAssignmentGuardEnabled\s*=\s*true/);

  assertContainsAll(
    task795Test,
    [
      /permissionAssignmentGuardEnabled: true/,
      /permissionAssignmentContext: auth\(\)/,
      /default behavior remains unchanged when guard is disabled/,
    ],
    'Task795 unit evidence',
  );
  assertContainsAll(
    task796Test,
    [
      /explicit opt-in synthetic context only/,
      /default behavior and existing API shapes are locked/,
    ],
    'Task796 static evidence',
  );
  assertContainsAll(
    task797Test,
    [
      /createApp/,
      /app\.handle\(req, res\)/,
      /guard disabled HTTP-style behavior remains backward compatible/,
    ],
    'Task797 HTTP evidence',
  );
  assertContainsAll(
    task798Test,
    [
      /Task797 app-like HTTP behavior uses createApp and app\.handle without listen/,
      /Task797 covers explicit opt-in guard and default-disabled behavior/,
    ],
    'Task798 static evidence',
  );
});

test('HTTP and app/provider evidence locks response shapes and safe deny paths', () => {
  const task795Test = read('tests/engineerMobile/engineerMobilePermissionGuardAppProvider.unit.test.js');
  const task797Test = read('tests/engineerMobile/engineerMobilePermissionGuardHttpBehavior.unit.test.js');

  for (const source of [task795Test, task797Test]) {
    assert.match(source, /\['status', 'tasks'\]/);
    assert.match(source, /\['detail', 'status'\]/);
    assert.match(source, /denies unassigned|denies unassigned synthetic|unassigned synthetic/);
    assert.match(source, /cross-organization/);
    assert.match(source, /assertNoForbiddenOutput/);
  }

  assert.match(task795Test, /lacks role permission and user/);
  assert.match(task797Test, /missing auth unknown role and missing permission fail closed/);
  assert.match(task797Test, /permissions:\s*\['cases\.read'\]/);
});

test('permission branch output redaction evidence covers sensitive and internal fields', () => {
  const evidence = [
    read('tests/engineerMobile/engineerMobilePermissionGuardAppProvider.unit.test.js'),
    read('tests/engineerMobile/engineerMobilePermissionGuardHttpBehavior.unit.test.js'),
    read('docs/task-797-engineer-mobile-permission-guard-http-behavior-unit-test-no-listen-no-db.md'),
    read('docs/task-798-engineer-mobile-permission-guard-http-behavior-closure-no-listen-no-db.md'),
  ].join('\n');

  for (const value of [
    'DATABASE_URL_should_not_leak',
    'token_should_not_leak',
    'secret_should_not_leak',
    'line_user_should_not_leak',
    'raw_phone_should_not_leak',
    'full_address_should_not_leak',
    'internal_note_should_not_leak',
    'audit_raw_payload_should_not_leak',
    'ai_raw_payload_should_not_leak',
    'billing_internal_should_not_leak',
    'settlement_internal_should_not_leak',
    'full_payload_should_not_leak',
    'fsr_should_not_leak',
    'report_should_not_leak',
    'final_appointment_should_not_leak',
    'stack_should_not_leak',
    'SQL_should_not_leak',
  ]) {
    assert.match(evidence, new RegExp(value));
  }
});

test('source import boundaries avoid global permission DB provider AI completion route app and server sinks', () => {
  const guardSource = read('src/engineerMobile/engineerMobilePermissionAssignmentGuard.js');
  const listSource = read('src/engineerMobile/engineerMobileTaskListService.js');
  const detailSource = read('src/engineerMobile/engineerMobileTaskDetailService.js');
  const adapterSource = read('src/engineerMobile/engineerMobileTaskListReadProviderAdapter.js');

  assert.deepEqual(requireSpecifiers(guardSource), []);
  assert.deepEqual(requireSpecifiers(listSource), []);
  assert.deepEqual(requireSpecifiers(detailSource), []);
  assert.deepEqual(requireSpecifiers(adapterSource), [
    './engineerMobileTaskListService',
    './engineerMobileTaskDetailService',
  ]);

  for (const [label, source] of [
    ['guard', guardSource],
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

test('permission branch source does not introduce forbidden runtime behavior', () => {
  const source = permissionBranchSource();

  [
    /completeServiceReport|submitCompletion|createFieldServiceReport|updateFieldServiceReport/i,
    /createReport|updateReport|approveReport|publishReport|reportWriter/i,
    /finalAppointmentId\s*=|final_appointment_id\s*=|inferFinalAppointment|resolveFinalAppointment/i,
    /dbClient\.query|transaction\.query|pool\.query|executeSql|psql|db:migrate/i,
    /sendLine|sendSms|sendEmail|sendPush|webhook|provider\.send/i,
    /openai|embedding|vector|rag|prompt|aiModel/i,
    /migrations\/|admin\/src|package\.json|smoke:/i,
  ].forEach((pattern) => {
    assert.doesNotMatch(source, pattern);
  });
});

test('Task799 closure doc and design note record branch checkpoint boundaries', () => {
  const doc = read('docs/task-799-engineer-mobile-permission-runtime-adjacent-branch-closure-checkpoint-no-db-no-api-change.md');
  const design = read('docs/design/engineer-mobile-workbench.md');

  assertContainsAll(
    doc,
    [
      /Task793-798/,
      /optional/i,
      /injected/i,
      /synthetic-context/i,
      /read-path only/i,
      /no DB/i,
      /no API shape change/i,
      /no completion write/i,
      /no `finalAppointmentId` exposure, inference, or mutation/i,
      /one Case = one formal completion report/i,
      /multiple appointments/i,
    ],
    'Task799 closure doc',
  );
  assert.match(design, /Task793-799 Permission Runtime-adjacent Branch Closure/);
});
