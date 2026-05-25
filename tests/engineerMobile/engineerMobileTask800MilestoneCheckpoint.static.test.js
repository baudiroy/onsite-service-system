'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const task800DocPath =
  'docs/task-800-engineer-mobile-runtime-adjacent-milestone-checkpoint-after-permission-guard-closure-docs-only-no-runtime.md';
const task801DocPath =
  'docs/task-801-engineer-mobile-task800-milestone-checkpoint-static-guard-docs-only-no-runtime.md';

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

test('Task800 milestone checkpoint and Task801 static guard docs exist', () => {
  assertFileExists(task800DocPath);
  assertFileExists(task801DocPath);
});

test('Task800 records the Task783-789 injected repository branch as fake-DB unit-test only', () => {
  const doc = read(task800DocPath);

  assertContainsAll(
    doc,
    [
      /Task783-789 Injected Repository Branch/,
      /Tasks783-789 closed the injected read-model repository branch/,
      /injected repository only/,
      /fake DB \/ unit-test only/,
      /explicit injected `dbClient` or `transaction` boundary only/,
      /request-aware provider path explicit opt-in only/,
      /no real DB connection/,
      /Repository promotion to a real DB read path still requires separate explicit approval/,
    ],
    'Task800 injected repository branch',
  );
});

test('Task800 records the Task793-799 permission assignment guard branch as explicit opt-in read path only', () => {
  const doc = read(task800DocPath);

  assertContainsAll(
    doc,
    [
      /Task793-799 Permission \/ Assignment Guard Branch/,
      /Tasks793-799 closed the Engineer Mobile permission \/ assignment runtime-adjacent branch/,
      /pure permission \/ assignment decision helper/,
      /supports only `task_list` and `task_detail`/,
      /optional/,
      /injected/,
      /synthetic-context only/,
      /read-path only/,
      /explicit opt-in only/,
      /default guard-disabled behavior remains backward compatible/,
      /no real permission service/,
      /no real assignment resolver/,
      /permissionAssignmentGuardEnabled/,
      /usePermissionAssignmentGuard/,
    ],
    'Task800 permission assignment guard branch',
  );
});

test('Task800 locks app-like HTTP behavior and response shapes', () => {
  const doc = read(task800DocPath);

  assertContainsAll(
    doc,
    [
      /HTTP Behavior Boundary/,
      /createApp/,
      /app\.handle\(req, res\)/,
      /no listen/,
      /no server start/,
      /app-like unit tests only/,
      /list response shape remains `status` \/ `tasks`/,
      /detail response shape remains `status` \/ `detail`/,
      /denied paths fail closed safely/,
      /no API shape expansion/,
    ],
    'Task800 HTTP behavior boundary',
  );
});

test('Task800 keeps Migration 022 paused with no execution path', () => {
  const doc = read(task800DocPath);

  assertContainsAll(
    doc,
    [
      /Migration 022 Status/,
      /Migration 022 remains paused/,
      /SQL file exists as an authored artifact/,
      /no DB connection/,
      /no psql/,
      /no db:migrate/,
      /no DDL/,
      /no local dry-run/,
      /no shared apply/,
      /no runtime writes/,
      /Any Migration 022 dry-run, local apply, shared apply, or runtime adoption requires separate explicit approval/,
    ],
    'Task800 Migration 022 boundary',
  );
});

test('Task800 preserves completion report and finalAppointmentId product invariants', () => {
  const doc = read(task800DocPath);

  assertContainsAll(
    doc,
    [
      /Product Invariants/,
      /one Case = one formal completion report/,
      /one Case may have multiple appointments \/ dispatch visits/,
      /Engineer Mobile read behavior does not create, mutate, or infer Field Service Report ownership/,
      /`finalAppointmentId` remains backend\/system-owned/,
      /Engineer Mobile should not expose `finalAppointmentId` to engineers as a normal workflow choice/,
      /no sensitive data output/,
    ],
    'Task800 product invariants',
  );
});

test('Task800 lists next candidates as requiring separate explicit approval', () => {
  const doc = read(task800DocPath);

  assertContainsAll(
    doc,
    [
      /Next Candidate Tasks Requiring Explicit Approval/,
      /The following are not approved by Task800 and require separate bounded tasks/,
      /real DB read adoption/,
      /Migration 022 dry-run or apply/,
      /real permission service integration/,
      /real assignment resolver integration/,
      /audit writer integration/,
      /task-read evidence logging/,
      /completion submission design/,
      /Field Service Report write flow/,
      /`finalAppointmentId` write\/inference changes/,
      /provider sending/,
      /LINE \/ SMS \/ App push \/ webhook runtime/,
      /AI\/RAG helper/,
      /admin \/ mobile UI behavior/,
      /smoke \/ integration coverage/,
    ],
    'Task800 explicit approval candidate list',
  );
});

test('Task800 remains non-authorizing for deeper runtime DB API provider AI and UI work', () => {
  const doc = read(task800DocPath);

  assertContainsAll(
    doc,
    [
      /does not authorize real DB adoption/,
      /requires separate explicit approval/,
      /not approved by Task800/,
      /must not be interpreted as approval for deeper runtime integration/,
    ],
    'Task800 non-authorizing language',
  );

  [
    /authorizes real DB/i,
    /approved for real DB/i,
    /ready to apply/i,
    /can run db:migrate/i,
    /may run db:migrate/i,
    /authorized to run psql/i,
    /approved Migration 022 dry-run/i,
    /approved Migration 022 apply/i,
    /authorizes API shape expansion/i,
    /authorizes completion writes/i,
    /authorizes finalAppointmentId mutation/i,
    /authorizes provider sending/i,
    /authorizes AI\/RAG/i,
    /authorizes admin UI/i,
    /authorizes package changes/i,
    /authorizes smoke tests/i,
  ].forEach((pattern) => {
    assert.doesNotMatch(doc, pattern, `Task800 should not contain ${pattern}`);
  });
});

test('Task801 guard document records docs-only no-runtime scope', () => {
  const doc = read(task801DocPath);

  assertContainsAll(
    doc,
    [
      /Task801/,
      /Static Guard/,
      /docs only/i,
      /no runtime/i,
      /No source file was changed/,
      /No API shape change/,
      /No DB connection/,
      /No Migration 022 execution/,
      /No provider sending/,
      /No AI\/RAG runtime/,
      /No completion write/,
      /No `finalAppointmentId` exposure, inference, or mutation/,
    ],
    'Task801 guard document',
  );
});
