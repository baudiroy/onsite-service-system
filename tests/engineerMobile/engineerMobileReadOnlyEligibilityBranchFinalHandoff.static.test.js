'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const TASK933_DOC = 'docs/task-933-engineer-mobile-read-only-eligibility-branch-final-handoff-summary-no-runtime-change.md';

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('Task933 handoff doc exists and records branch closed paused status', () => {
  const doc = read(TASK933_DOC);

  assert.match(doc, /Engineer Mobile read-only \+ eligibility branch is closed \/ paused/);
  assert.match(doc, /docs-only/);
  assert.match(doc, /does not authorize workflow\/action runtime implementation/);
});

test('Task933 handoff summarizes accepted Task921 through Task932 scope', () => {
  const doc = read(TASK933_DOC);

  for (let taskNumber = 921; taskNumber <= 932; taskNumber += 1) {
    assert.match(doc, new RegExp(`Task${taskNumber}:`));
  }

  assert.match(doc, /read-only assigned appointments list projection service/);
  assert.match(doc, /assigned appointment detail projection service/);
  assert.match(doc, /pure pre-departure eligibility evaluator/);
  assert.match(doc, /projection delegation to the eligibility helper/);
});

test('Task933 handoff records implemented surface and safe eligibility hints', () => {
  const doc = read(TASK933_DOC);

  assert.match(doc, /read-only assigned appointments list/);
  assert.match(doc, /read-only assigned appointment detail/);
  assert.match(doc, /synthetic handlers and adapters/);
  assert.match(doc, /canStartTravel/);
  assert.match(doc, /canRecordArrival/);
  assert.match(doc, /canPrepareCompletionDraft/);
  assert.match(doc, /no helper reason exposure/);
  assert.match(doc, /no `finalAppointmentId` exposure or mutation/);
});

test('Task933 handoff records explicit non-goals and no runtime expansion', () => {
  const doc = read(TASK933_DOC);

  for (const phrase of [
    'no production mobile route',
    'no public API rollout',
    'no real DB/repository',
    'no auth/session/JWT runtime',
    'no migration',
    'no provider sending',
    'no AI/RAG runtime',
    'no billing/settlement',
    'no workflow action',
    'no start travel / arrival / completion / report creation / report publish',
    'no staging/commit',
  ]) {
    assert.match(doc, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('Task933 handoff warns accepted files are local uncommitted untracked', () => {
  const doc = read(TASK933_DOC);

  assert.match(doc, /Task921-Task932 accepted files are local \/ uncommitted \/ untracked/);
  assert.match(doc, /must be included in the final patch\/commit before merge or handoff/);
  assert.match(doc, /git status --short/);
});

test('Task933 handoff requires future authorization before workflow runtime', () => {
  const doc = read(TASK933_DOC);

  for (const phrase of [
    'exact action selected',
    'state transition policy',
    'DB/repository boundary',
    'audit log boundary',
    'permission/auth source',
    'concurrency/idempotency policy',
    'rollback/recovery policy',
    'proof that `finalAppointmentId` remains backend/system-owned',
  ]) {
    assert.match(doc, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.match(doc, /Without that authorization, do not implement/);
});

test('Task933 handoff lists next safe candidate tasks and branch stop point', () => {
  const doc = read(TASK933_DOC);

  assert.match(doc, /Engineer Mobile production route authorization packet, no implementation/);
  assert.match(doc, /Engineer Mobile start-travel authorization packet, no implementation/);
  assert.match(doc, /Repair Intake draft validator \/ no DB/);
  assert.match(doc, /Data Correction next runtime-safe branch/);
  assert.match(doc, /After Task933 acceptance, stop this Engineer Mobile read-only \+ eligibility branch/);
  assert.match(doc, /Start a new PM conversation before opening the next runtime branch/);
});
