'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const task790Path = 'docs/task-790-pm-continuation-handoff-after-brand-referral-and-engineer-mobile-runtime-adjacent-closures-docs-only-no-runtime.md';
const task791Path = 'docs/task-791-pm-continuation-handoff-static-guard-after-runtime-adjacent-closures-docs-only-no-runtime.md';

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

test('Task790 handoff and Task791 guard document exist', () => {
  [
    task790Path,
    task791Path,
  ].forEach(assertFileExists);
});

test('Task790 covers Task777-778, Brand Referral Task779-781, and Engineer Mobile Task782-789', () => {
  const source = read(task790Path);

  assertContainsAll(
    source,
    [
      /Task777-778 Guardrail and Dashboard Status/,
      /Brand Referral Task779-781 Status/,
      /Engineer Mobile Task782-789 Status/,
      /Task777-778/,
      /Task779-781/,
      /Task782-789/,
      /Task789/,
    ],
    'Task790 branch coverage',
  );
});

test('Task790 keeps Migration 022 and Migration 024 no-DB no-execution boundaries', () => {
  const source = read(task790Path);

  assertContainsAll(
    source,
    [
      /Migration 022 remains no DB, no psql, no db:migrate, no DDL, no dry-run, and no apply/,
      /Migration 024 remains no DB, no psql, no db:migrate, no DDL, no dry-run, and no apply/,
      /Migration 022 must not be executed or modified without a separately approved task/,
      /Migration 024 must not be executed or modified without a separately approved task/,
    ],
    'migration no-execution boundary',
  );
});

test('Task790 locks Brand Referral normalization-only and injected audit/contact writer boundaries', () => {
  const source = read(task790Path);

  assertContainsAll(
    source,
    [
      /Public route remains normalization-only/,
      /audit\/contact writer path remains injected-only/i,
      /Public body remains safe/,
      /auditIntent/,
      /contactWriterResult/,
      /injected writer details/,
      /not Case creation/,
      /not Case Binding/,
      /not identity verification/,
      /not provider\/webhook\/LINE\/SMS\/App push sending/,
      /not AI\/RAG runtime/,
    ],
    'Brand Referral boundary',
  );
});

test('Task790 locks Engineer Mobile fake-DB injected repository and no API completion boundary', () => {
  const source = read(task790Path);

  assertContainsAll(
    source,
    [
      /injected repository path implemented with fake DB\/unit tests only/i,
      /HTTP behavior covered with app-like handler only/i,
      /no real DB/i,
      /no API shape change/i,
      /no completion writes/i,
      /no Field Service Report creation\/update/i,
      /no `finalAppointmentId` exposure, inference, or mutation/i,
      /no server listen/i,
    ],
    'Engineer Mobile boundary',
  );
});

test('Task790 hard no-go boundaries remain explicit and broad enough', () => {
  const source = read(task790Path);

  assertContainsAll(
    source,
    [
      /real DB connection/,
      /psql/,
      /db:migrate/,
      /DDL/,
      /migration dry-run/,
      /migration apply/,
      /provider sending/,
      /webhook runtime/,
      /AI\/RAG runtime/,
      /admin UI implementation/,
      /smoke\/integration expansion/,
      /package or dependency changes/,
      /token\/secret\/provider config changes/,
      /identity verification runtime/,
      /Case Binding runtime/,
      /repair intake runtime/,
      /completion writes/,
      /`finalAppointmentId` mutation or inference changes/,
    ],
    'hard no-go boundaries',
  );
});

test('Task790 preserves core product and identity invariants', () => {
  const source = read(task790Path);

  assertContainsAll(
    source,
    [
      /one Case = one formal completion report/,
      /one Case may have multiple appointments \/ dispatch visits/,
      /`finalAppointmentId` remains backend\/system-owned/,
      /LINE identity is scoped by `organization_id \+ line_channel_id \+ line_user_id`/,
      /`line_user_id` is not a global identity/,
      /unverified users cannot query case data/,
      /no cross-organization or cross-tenant data access/,
      /no silent overwrite of formal data/,
    ],
    'core invariants',
  );
});

test('Task790 does not imply approval for future runtime or DB work', () => {
  const source = read(task790Path);

  assertContainsAll(
    source,
    [
      /This document does not authorize DB work/,
      /does not approve any future runtime branch/,
      /These are candidates only and require explicit approval before implementation/,
      /Any future task that touches one of these areas must explicitly say so/,
      /separately approved task/,
    ],
    'non-authorizing wording',
  );

  assert.doesNotMatch(source, /approved for immediate (?:runtime|DB|migration|provider|AI|completion)/i);
  assert.doesNotMatch(source, /you may now (?:run|apply|execute|connect|send|write)/i);
});

test('Task791 guard document records docs-only no-runtime status', () => {
  const source = read(task791Path);

  assertContainsAll(
    source,
    [
      /Status: completed/,
      /Task790/,
      /static guard/i,
      /docs-only/i,
      /no runtime/i,
      /no DB/i,
      /no migration execution/i,
      /no provider\/webhook/i,
      /no AI\/RAG/i,
      /no completion write/i,
      /no finalAppointmentId mutation/i,
    ],
    'Task791 guard document',
  );
});
