'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const FILES = Object.freeze({
  handoffDoc: 'docs/task-890-pm-continuation-handoff-after-data-correction-decision-audit-runtime-adjacent-closure-docs-only-no-runtime.md',
  task891Doc: 'docs/task-891-data-correction-decision-audit-runtime-adjacent-handoff-static-guard-docs-only-no-runtime.md',
});

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(path.join(repoRoot, relativePath));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function assertIncludesAll(source, phrases) {
  for (const phrase of phrases) {
    assert.match(source, new RegExp(escapeRegExp(phrase), 'i'), `missing phrase: ${phrase}`);
  }
}

function requireSpecifiers(source) {
  const specifiers = [];
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
  let match;

  while ((match = requireRegex.exec(source)) !== null) {
    specifiers.push(match[1]);
  }

  return specifiers.sort();
}

test('Task890 handoff and Task891 guard documents exist', () => {
  assert.equal(exists(FILES.handoffDoc), true, `${FILES.handoffDoc} is missing`);
  assert.equal(exists(FILES.task891Doc), true, `${FILES.task891Doc} is missing`);
});

test('Task890 handoff covers every runtime-adjacent branch phase', () => {
  const doc = read(FILES.handoffDoc);

  assertIncludesAll(doc, [
    'Task869-871 - auditIntent Builder and Side-channel',
    'Task872-880 - Persistence Readiness and Migration 025 No-DB Branch',
    'Task881-883 - Handoff and Status Dashboard',
    'Task884-889 - Runtime-adjacent Injected Writer Path',
    'Task869 added a pure Data Correction decision `auditIntent` builder',
    'Task877 created `migrations/025_create_data_correction_decision_audit_events.sql` only',
    'Task887 added the optional service-level injected `decisionAuditWriter` path',
    'Task889 closed the full Task869-888 runtime-adjacent writer branch',
  ]);
});

test('Task890 handoff keeps Migration 025 at no-DB / no-execution boundary', () => {
  const doc = read(FILES.handoffDoc);

  assertIncludesAll(doc, [
    'Migration 025 exists as an authoring-only file',
    'Migration 025 has not been applied',
    'Migration 025 has not been locally dry-run',
    'No DB connection was opened',
    'No `psql` was run',
    'No `npm run db:migrate` was run',
    'No DDL was executed',
    'No SQL execution occurred',
    'No shared runtime / production / staging apply was performed',
  ]);
});

test('Task890 handoff keeps repository and writer injected-only with no defaults', () => {
  const doc = read(FILES.handoffDoc);

  assertIncludesAll(doc, [
    'The repository / writer remains injected-only',
    'There is no global DB import',
    'There is no default writer configuration',
    'There is no real audit sink',
    'injected fake/unit writer only',
    'no global DB / pool / pg import',
    'no default writer',
    'no app/server default configuration',
  ]);
});

test('Task890 handoff keeps service injected writer path opt-in and public shape unchanged', () => {
  const doc = read(FILES.handoffDoc);

  assertIncludesAll(doc, [
    'The service-level `decisionAuditWriter` path is opt-in only',
    'Public/default response shape remains unchanged',
    'Safe `decisionAuditWriterResult` appears only through the internal audit side-channel when explicitly requested',
    'Writer success/failure does not change official correction outcome',
    'Writer failure is redacted to safe metadata',
  ]);
});

test('Task890 handoff keeps auditIntent internal opt-in with auditWritten false', () => {
  const doc = read(FILES.handoffDoc);

  assertIncludesAll(doc, [
    '`auditIntent` is internal opt-in only',
    'Default request/apply output does not include `auditIntent`',
    '`auditIntent.auditWritten` remains `false`',
    'Route/controller/orchestrator/public API bodies do not expose `auditIntent`',
    'No audit write, DB work, provider sending, AI/RAG, billing/settlement, or public API shape change was introduced',
  ]);
});

test('Task890 handoff keeps request/manual-handling separated from official apply path', () => {
  const doc = read(FILES.handoffDoc);

  assertIncludesAll(doc, [
    '`data_correction_request` remains a request/manual-handling decision path',
    'Official correction application is limited to valid `pre_departure_apply`',
    'Phone/channel identity changes still require re-verification',
    'Post-departure changes remain manual-handling',
    'The branch does not change Case, Appointment, Field Service Report, `finalAppointmentId`, customer identity, provider, AI/RAG, billing, or settlement behavior',
  ]);
});

test('Task890 handoff lists hard no-go boundaries for future work', () => {
  const doc = read(FILES.handoffDoc);

  assertIncludesAll(doc, [
    'DB connection',
    '`psql`',
    '`npm run db:migrate`',
    'DDL / SQL execution',
    'Migration 025 dry-run',
    'Migration 025 apply',
    'shared runtime / production / staging apply',
    'default audit writer / sink',
    'repository runtime promotion',
    'service/app/API persistence promotion',
    'route/controller/DTO/public API body changes',
    'permission runtime expansion',
    'audit viewer / reporting UI',
    'provider / LINE / SMS / App push / webhook / email runtime',
    'AI / RAG runtime',
    'billing / settlement runtime',
    'admin frontend changes',
    'package changes',
    'smoke/integration tests',
    'token / secret / LINE access token / channel secret / AI provider setting changes',
  ]);
});

test('Task890 handoff rejects generic continuation language as authorization', () => {
  const doc = read(FILES.handoffDoc);

  assertIncludesAll(doc, [
    'Generic phrases such as "continue", "go ahead", "approved", "keep developing", or "next task" are not authorization',
    'DB execution',
    'migration apply',
    'repository runtime',
    'audit writer runtime',
    'public API shape changes',
    'provider work',
    'AI/RAG',
    'billing/settlement',
    'secrets/config work',
  ]);
});

test('Task891 static guard stays docs-only and avoids source/runtime imports', () => {
  const source = read('tests/dataCorrection/dataCorrectionDecisionAuditRuntimeAdjacentHandoff.static.test.js');
  const specifiers = requireSpecifiers(source);

  assert.deepEqual(specifiers, [
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:test',
  ]);

  assert.equal(specifiers.some((specifier) => specifier.includes('/src/')), false, 'static guard must not import src runtime modules');
  assert.equal(specifiers.some((specifier) => specifier.includes('/migrations/')), false, 'static guard must not import migration files');
  assert.equal(new RegExp(['process', 'env'].join('\\.')).test(source), false, 'static guard must not read environment secrets/config');
});
