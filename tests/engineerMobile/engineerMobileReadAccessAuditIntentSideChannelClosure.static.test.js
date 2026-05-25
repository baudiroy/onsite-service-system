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

test('Task802 through Task804 evidence files exist', () => {
  [
    'src/engineerMobile/engineerMobileReadAccessAuditIntentBuilder.js',
    'src/engineerMobile/engineerMobileReadAccessAuditIntentSideChannel.js',
    'tests/engineerMobile/engineerMobileReadAccessAuditIntentBuilder.unit.test.js',
    'tests/engineerMobile/engineerMobileReadAccessAuditIntentSideChannel.unit.test.js',
    'tests/engineerMobile/engineerMobileReadAccessAuditIntentSideChannelClosure.static.test.js',
    'docs/task-802-engineer-mobile-read-access-audit-intent-builder-no-audit-write-no-db.md',
    'docs/task-803-engineer-mobile-read-access-audit-intent-side-channel-no-audit-write-no-api-shape-change.md',
    'docs/task-804-engineer-mobile-read-access-audit-intent-side-channel-closure-no-audit-write-no-api-shape-change.md',
    'docs/design/engineer-mobile-workbench.md',
  ].forEach(assertFileExists);
});

test('Task804 closure doc records accepted intent-only no-runtime boundary', () => {
  const doc = read('docs/task-804-engineer-mobile-read-access-audit-intent-side-channel-closure-no-audit-write-no-api-shape-change.md');

  assertContainsAll(
    doc,
    [
      /Task802-803/,
      /intent-only/i,
      /internal side-channel/i,
      /no audit write/i,
      /no API shape change/i,
      /no DB/i,
      /no provider sending/i,
      /no AI\/RAG runtime/i,
      /no completion write/i,
      /no `finalAppointmentId` exposure, inference, or mutation/i,
    ],
    'Task804 closure doc',
  );
});

test('side-channel source returns internal envelope and keeps response body separate', () => {
  const source = read('src/engineerMobile/engineerMobileReadAccessAuditIntentSideChannel.js');
  const unitTest = read('tests/engineerMobile/engineerMobileReadAccessAuditIntentSideChannel.unit.test.js');

  assertContainsAll(
    source,
    [
      /function withReadAccessAuditIntent/,
      /auditIntent: buildReadAccessAuditIntent/,
      /response,/,
      /buildEngineerMobileTaskListReadWithAuditIntent/,
      /buildEngineerMobileTaskDetailReadWithAuditIntent/,
      /buildEngineerMobileTaskListReadWithAuditIntentAsync/,
      /buildEngineerMobileTaskDetailReadWithAuditIntentAsync/,
    ],
    'side-channel source',
  );

  assertContainsAll(
    unitTest,
    [
      /Object\.keys\(result\)\.sort\(\), \['auditIntent', 'response'\]/,
      /assertPublicListShape\(result\.response\)/,
      /assertPublicDetailShape\(result\.response\)/,
      /result\.response\.auditIntent, undefined/,
    ],
    'side-channel unit public response evidence',
  );
});

test('public response body shapes remain status tasks and status detail only', () => {
  const unitTest = read('tests/engineerMobile/engineerMobileReadAccessAuditIntentSideChannel.unit.test.js');
  const task803Doc = read('docs/task-803-engineer-mobile-read-access-audit-intent-side-channel-no-audit-write-no-api-shape-change.md');

  assertContainsAll(
    unitTest,
    [
      /assert\.deepEqual\(Object\.keys\(response\)\.sort\(\), \['status', 'tasks'\]\)/,
      /assert\.deepEqual\(Object\.keys\(response\)\.sort\(\), \['detail', 'status'\]\)/,
      /assert\.deepEqual\(result\.response,\s*\{\s*status: 'deny',\s*tasks: \[\],\s*\}\)/s,
      /assert\.deepEqual\(result\.response,\s*\{\s*detail: null,\s*status: 'deny',\s*\}\)/s,
    ],
    'side-channel unit response shape evidence',
  );

  assertContainsAll(
    task803Doc,
    [
      /No `auditIntent` is added to the public response body/,
      /task list: `status` \/ `tasks`/,
      /task detail: `status` \/ `detail`/,
    ],
    'Task803 public response shape doc',
  );
});

test('audit intent remains metadata-only and auditWritten false', () => {
  const builderSource = read('src/engineerMobile/engineerMobileReadAccessAuditIntentBuilder.js');
  const sideChannelTest = read('tests/engineerMobile/engineerMobileReadAccessAuditIntentSideChannel.unit.test.js');
  const task803Doc = read('docs/task-803-engineer-mobile-read-access-audit-intent-side-channel-no-audit-write-no-api-shape-change.md');

  assert.match(builderSource, /auditWritten: false/);
  assertContainsAll(
    sideChannelTest,
    [
      /auditWritten, false/,
      /engineer_mobile_task_list_read_allowed/,
      /engineer_mobile_task_list_read_denied/,
      /engineer_mobile_task_detail_read_allowed/,
      /engineer_mobile_task_detail_read_denied/,
      /Safe Task793-style guard decision metadata can be consumed|side-channel can consume safe guard decision metadata/,
    ],
    'side-channel audit intent unit evidence',
  );
  assert.match(task803Doc, /`auditWritten` remains `false`/);
});

test('side-channel source imports only builder and existing read services', () => {
  const source = read('src/engineerMobile/engineerMobileReadAccessAuditIntentSideChannel.js');

  assert.deepEqual(requireSpecifiers(source), [
    './engineerMobileReadAccessAuditIntentBuilder',
    './engineerMobileTaskDetailService',
    './engineerMobileTaskListService',
  ]);
});

test('side-channel source avoids audit writer DB provider AI completion app server and package sinks', () => {
  const source = read('src/engineerMobile/engineerMobileReadAccessAuditIntentSideChannel.js');

  [
    /process\.env|console\.|fetch\s*\(|axios|XMLHttpRequest|node:http|node:https/i,
    /require\(['"].*(?:db|pool|database|transaction|repository|repositories|queryExecutor)['"]\)/i,
    /require\(['"].*(?:routes?|controllers?|server|app|admin|package|smoke)['"]\)/i,
    /require\(['"].*(?:line|sms|email|push|provider|webhook)['"]\)/i,
    /require\(['"].*(?:ai|rag|vector|openai|embedding|prompt)['"]\)/i,
    /require\(['"].*(?:auditWriter|logger|logWriter|sink)['"]\)/i,
    /require\(['"].*(?:completion|fieldServiceReport|reportWriter|finalAppointment)['"]\)/i,
    /\.listen\(|createServer\(|startServer/i,
    /completeServiceReport|submitCompletion|createFieldServiceReport|updateFieldServiceReport/i,
    /finalAppointmentId\s*=|final_appointment_id\s*=|inferFinalAppointment|resolveFinalAppointment/i,
    /dbClient\.query|transaction\.query|pool\.query|executeSql|psql|db:migrate/i,
    /sendLine|sendSms|sendEmail|sendPush|webhook|provider\.send/i,
    /openai|embedding|vector|rag|prompt|aiModel/i,
    /migrations\/|admin\/src|package\.json|smoke:/i,
  ].forEach((pattern) => {
    assert.doesNotMatch(source, pattern);
  });
});

test('side-channel evidence excludes sensitive internal provider AI report finalAppointmentId and SQL data', () => {
  const evidence = [
    read('tests/engineerMobile/engineerMobileReadAccessAuditIntentBuilder.unit.test.js'),
    read('tests/engineerMobile/engineerMobileReadAccessAuditIntentSideChannel.unit.test.js'),
    read('docs/task-802-engineer-mobile-read-access-audit-intent-builder-no-audit-write-no-db.md'),
    read('docs/task-803-engineer-mobile-read-access-audit-intent-side-channel-no-audit-write-no-api-shape-change.md'),
  ].join('\n');

  for (const value of [
    'DATABASE_URL_should_not_leak',
    'ai_raw_payload_should_not_leak',
    'audit_raw_payload_should_not_leak',
    'billing_internal_should_not_leak',
    'final_appointment_should_not_leak',
    'full_address_should_not_leak',
    'full_payload_should_not_leak',
    'internal_note_should_not_leak',
    'line_access_token_should_not_leak',
    'raw_line_user_should_not_leak',
    'raw_phone_should_not_leak',
    'report_should_not_leak',
    'secret_should_not_leak',
    'SQL_should_not_leak',
    'stack_should_not_leak',
    'token_should_not_leak',
    'raw LINE id',
    'full phone/address',
    'Field Service Report id',
    '`finalAppointmentId`',
  ]) {
    assert.match(evidence, new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('Engineer Mobile design records Task802-804 closure without promoting audit persistence', () => {
  const design = read('docs/design/engineer-mobile-workbench.md');

  assertContainsAll(
    design,
    [
      /Task802-804 Read Access Audit Intent Side-channel Closure/,
      /internal-only/i,
      /auditWritten: false/,
      /no audit writer/i,
      /no DB/i,
      /no API response shape change/i,
      /no completion write/i,
      /no `finalAppointmentId` exposure, inference, or mutation/i,
    ],
    'Engineer Mobile design Task802-804 closure note',
  );
});
