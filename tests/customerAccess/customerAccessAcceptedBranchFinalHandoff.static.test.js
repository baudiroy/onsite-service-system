'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const TASK920_DOC = 'docs/task-920-customer-access-accepted-branch-final-handoff-summary-no-runtime-change.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function exists(file) {
  return fs.existsSync(path.join(repoRoot, file));
}

function escaped(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test('Task920 handoff doc exists and is docs-only', () => {
  assert.equal(exists(TASK920_DOC), true, `${TASK920_DOC} should exist`);

  const doc = read(TASK920_DOC);

  assert.match(doc, /docs-only/);
  assert.match(doc, /No production runtime source is modified/);
  assert.match(doc, /No `src\/\*\*`/);
  assert.match(doc, /No `admin\/src\/\*\*`/);
  assert.match(doc, /No migrations/);
  assert.match(doc, /No route\/controller\/bootstrap\/server\/listen files/);
  assert.match(doc, /No auth\/session\/JWT runtime files/);
  assert.match(doc, /No real DB\/repository\/transaction files/);
});

test('Task920 summarizes accepted Task908 through Task919 branch surface', () => {
  const doc = read(TASK920_DOC);

  for (const phrase of [
    'Customer Access branch is closed / paused at internal synthetic route mount boundary',
    'synthetic/pre-resolved context -> projection service -> HTTP-like handler -> synthetic app/router adapter -> internal test-only route mount',
    'Task908 projection service',
    'Task909 HTTP-like handler',
    'Task910 projection closure',
    'Task911 synthetic context resolver',
    'Task912 context/projection closure',
    'Task914 synthetic app adapter',
    'Task915 app adapter closure',
    'Task916 master patch inclusion checkpoint',
    'Task917 production route authorization packet',
    'Task918 internal test route mount',
    'Task919 internal test route closure',
  ]) {
    assert.match(doc, new RegExp(escaped(phrase), 'i'));
  }
});

test('Task920 records explicit non-goals and forbidden runtime areas', () => {
  const doc = read(TASK920_DOC);

  for (const phrase of [
    'No production route',
    'No public API rollout',
    'No public route',
    'No route registration',
    'No app/server/bootstrap/listen',
    'No real DB/repository',
    'No transaction',
    'No auth/session/JWT',
    'No migration',
    'No psql',
    'No `npm run db:migrate`',
    'No DDL/SQL apply or dry-run',
    'No provider sending',
    'No LINE/SMS/email/App/webhook runtime',
    'No AI/RAG runtime',
    'No vector/search runtime',
    'No billing/settlement',
    'No smoke/shared runtime',
    'No staging/commit',
  ]) {
    assert.match(doc, new RegExp(escaped(phrase), 'i'));
  }
});

test('Task920 records future production route authorization requirements', () => {
  const doc = read(TASK920_DOC);

  for (const phrase of [
    'exact route mode',
    'exact route files',
    'identity/auth source',
    'Task911 synthetic context',
    'customer-visible response shape',
    'safe-deny/status policy',
    'rate-limit and enumeration protection',
    'audit/logging redaction',
    'rollback plan',
    'verification plan',
    'Production route implementation remains forbidden',
    'separate explicit PM task',
  ]) {
    assert.match(doc, new RegExp(escaped(phrase), 'i'));
  }
});

test('Task920 records patch inclusion warning and next safe candidate tasks', () => {
  const doc = read(TASK920_DOC);

  for (const phrase of [
    'Task908-Task919 files are local / uncommitted / untracked',
    'must be included in final patch/commit before merge or handoff',
    'No staging/commit is authorized by Task920',
    'unrelated dirty files are not claimed',
    'production route implementation authorization review, no implementation',
    'Engineer Mobile read-only assigned appointments projection',
    'Repair Intake draft validator / no DB',
    'Data Correction next runtime-safe branch',
    'switch to a new PM conversation before starting the next runtime branch',
  ]) {
    assert.match(doc, new RegExp(escaped(phrase), 'i'));
  }
});
