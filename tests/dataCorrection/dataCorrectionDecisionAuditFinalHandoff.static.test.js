'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const FILES = Object.freeze({
  task896Doc: 'docs/task-896-pm-continuation-handoff-after-data-correction-decision-audit-final-closure-docs-only-no-runtime.md',
  task897Doc: 'docs/task-897-data-correction-decision-audit-final-handoff-static-guard-docs-only-no-runtime.md',
  guard: 'tests/dataCorrection/dataCorrectionDecisionAuditFinalHandoff.static.test.js',
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

test('Task896 handoff and Task897 guard documents exist', () => {
  assert.equal(exists(FILES.task896Doc), true, `${FILES.task896Doc} is missing`);
  assert.equal(exists(FILES.task897Doc), true, `${FILES.task897Doc} is missing`);
});

test('Task896 handoff summarizes Task869 through Task895 by phase', () => {
  const doc = read(FILES.task896Doc);

  assertIncludesAll(doc, [
    'Task869-871 - Audit Intent and Internal Side-channel',
    'Task872-880 - Persistence Readiness and Migration 025 No-DB Branch',
    'Task881-883 - PM Handoff and Dashboard',
    'Task884-886 - Injected Repository / Writer Unit Slice',
    'Task887-888 - Service-level Injected Writer Path',
    'Task889-895 - Runtime-adjacent Handoff, App/Server Shortcut, and Final Closure',
    'Task895 created the final branch checkpoint and static guard',
  ]);
});

test('Task896 keeps Migration 025 explicitly no DB no dry-run no apply', () => {
  const doc = read(FILES.task896Doc);

  assertIncludesAll(doc, [
    'Migration 025 exists only as an authoring artifact',
    'no DB connection',
    'no `psql`',
    'no `npm run db:migrate`',
    'no DDL execution',
    'no SQL execution',
    'no dry-run',
    'no apply',
    'no shared runtime / staging / production apply',
  ]);
});

test('Task896 keeps repository writer and app server paths injected-only', () => {
  const doc = read(FILES.task896Doc);

  assertIncludesAll(doc, [
    'The repository/writer remain injected-only',
    'no global DB import',
    'no default writer',
    'no real audit sink',
    'no route/controller/API default wiring',
    'explicit-option only',
    'no repository runtime promotion',
    'no public/default response shape change',
    'no public `auditIntent`',
    'no public `decisionAuditWriterResult`',
  ]);
});

test('Task896 preserves request apply separation', () => {
  const doc = read(FILES.task896Doc);

  assertIncludesAll(doc, [
    '`data_correction_request` remains a manual-handling request path',
    'request handling does not call the correction application writer',
    'official correction application remains limited to valid `pre_departure_apply`',
    'phone/channel identity changes still require re-verification',
    'post-departure corrections remain manual-handling',
  ]);
});

test('Task896 lists hard no-go runtime and public contract boundaries', () => {
  const doc = read(FILES.task896Doc);

  assertIncludesAll(doc, [
    'DB execution',
    'Migration 025 dry-run or apply',
    '`psql`',
    '`npm run db:migrate`',
    'DDL execution',
    'SQL execution',
    'default audit writer configuration',
    'repository runtime promotion',
    'service/app/API persistence promotion',
    'public API response shape change',
    'route/controller/DTO public body expansion',
    'permission runtime expansion',
    'provider / webhook / email / LINE / SMS / App push runtime',
    'AI / RAG runtime',
    'billing / settlement runtime',
    'admin frontend',
    'package changes',
    'smoke / integration changes',
    'token / secret / LINE access token / channel secret / AI provider setting changes',
    'credential/provider config changes',
  ]);
});

test('Task896 keeps future candidates explicit-approval only', () => {
  const doc = read(FILES.task896Doc);

  assertIncludesAll(doc, [
    'each requires explicit PM/user scoping and approval',
    'Migration 025 disposable local/test DB dry-run',
    'Migration 025 apply',
    'real DB adapter for the decision audit repository',
    'default audit writer configuration',
    'service/app/API persistence promotion',
    'audit event read API',
    'audit viewer or reporting UI',
    'permission expansion for audit event access',
    'smoke/integration coverage after DB approval',
  ]);
});

test('Task896 rejects generic continuation language as authorization', () => {
  const doc = read(FILES.task896Doc);

  assertIncludesAll(doc, [
    'Generic phrases such as "continue", "go ahead", "approved", "I authorize", or "keep developing" are not authorization',
    'DB execution',
    'Migration 025 dry-run/apply',
    'repository runtime promotion',
    'audit writer runtime promotion',
    'public API shape changes',
    'provider/AI work',
    'billing/settlement work',
    'package changes',
    'secrets/config changes',
  ]);
});

test('Task896 and Task897 docs preserve forbidden data exclusions', () => {
  const combinedDocs = [
    FILES.task896Doc,
    FILES.task897Doc,
  ].map(read).join('\n');

  assertIncludesAll(combinedDocs, [
    'before / after values',
    'raw correction payload',
    'raw phone / mobile',
    'raw address',
    'raw LINE user id',
    'token / secret / DB URL',
    'stack / SQL',
    '`finalAppointmentId`',
    'Field Service Report id / report id',
    'internal note',
    'audit raw payload',
    'AI raw payload',
    'billing / settlement internals',
    'full payload',
    'provider payload',
    'files / photos / signatures / raw bytes',
  ]);
});

test('Task896 and Task897 docs/tests avoid real-looking credential or contact examples', () => {
  const combined = [
    FILES.task896Doc,
    FILES.task897Doc,
    FILES.guard,
  ].map(read).join('\n');

  [
    /postgres(?:ql)?:\/\/[^\s"')]+/i,
    /DATABASE_URL\s*=/i,
    /LINE_CHANNEL_SECRET\s*=/i,
    /LINE_CHANNEL_ACCESS_TOKEN\s*=/i,
    /OPENAI_API_KEY\s*=/i,
    /AIza[0-9A-Za-z_-]{20,}/,
    /\b09\d{2}[-\s]?\d{3}[-\s]?\d{3}\b/,
  ].forEach((pattern) => {
    assert.equal(pattern.test(combined), false, `unsafe example-like pattern found: ${pattern}`);
  });
});

test('Task897 guard stays static and imports no src migration provider or env runtime', () => {
  const source = read(FILES.guard);
  const specifiers = requireSpecifiers(source);

  assert.deepEqual(specifiers, [
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:test',
  ]);
  assert.equal(specifiers.some((specifier) => specifier.includes('/src/')), false);
  assert.equal(specifiers.some((specifier) => specifier.includes('/migrations/')), false);
  assert.equal(/process\.env/.test(source), false);
});
