'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const FILES = Object.freeze({
  task898Doc: 'docs/task-898-data-correction-decision-audit-injected-writer-http-behavior-unit-test-no-real-db-no-api-shape-change.md',
  task898Test: 'tests/dataCorrection/dataCorrectionDecisionAuditInjectedWriter.http-behavior.unit.test.js',
  task899Doc: 'docs/task-899-data-correction-decision-audit-injected-writer-http-behavior-closure-guard-no-real-db-no-api-shape-change.md',
  guard: 'tests/dataCorrection/dataCorrectionDecisionAuditInjectedWriterHttpBehaviorClosure.static.test.js',
  app: 'src/app.js',
  server: 'src/server.js',
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

function assertExcludesAll(source, phrases) {
  for (const phrase of phrases) {
    assert.equal(source.includes(phrase), false, `unexpected phrase: ${phrase}`);
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

test('Task898 evidence doc, Task898 HTTP behavior unit test, and Task899 closure doc exist', () => {
  assert.equal(exists(FILES.task898Doc), true, `${FILES.task898Doc} is missing`);
  assert.equal(exists(FILES.task898Test), true, `${FILES.task898Test} is missing`);
  assert.equal(exists(FILES.task899Doc), true, `${FILES.task899Doc} is missing`);
});

test('Task898 document records accepted injected-writer boundaries', () => {
  const doc = read(FILES.task898Doc);

  assertIncludesAll(doc, [
    'explicit injected `decisionAuditWriter` app/server option',
    'without changing the public response body',
    'fake injected writers only',
    'no real DB',
    'no audit sink',
    'no migration execution',
    'no public API shape change',
    'no server listen behavior',
    'no default writer is configured',
    'no real DB/global repository/env/config/provider/AI/RAG/billing/settlement/audit sink',
  ]);
});

test('Task898 test remains app-like and avoids real HTTP servers or smoke/integration runtime', () => {
  const source = read(FILES.task898Test);
  const specifiers = requireSpecifiers(source);

  assert.equal(specifiers.includes('supertest'), false);
  assert.equal(specifiers.includes('node:http'), false);
  assert.equal(specifiers.includes('node:https'), false);
  assert.equal(specifiers.includes('node:net'), false);
  assert.equal(/\b(?:app|server|bootstrap\.app)\.listen\s*\(/.test(source), false);
  assert.equal(/createServer\s*\(/.test(source), false);
  assert.equal(/smoke|integration/i.test(source), false);
  assert.equal(specifiers.some((specifier) => /smoke|integration|supertest|node:http|node:https|node:net/i.test(specifier)), false);
});

test('Task898 test proves default app path has no writer and no public side-channel body', () => {
  const source = read(FILES.task898Test);

  assertIncludesAll(source, [
    'default app-like HTTP path has no decision audit writer and no public side-channel body',
    'assert.equal(response.statusCode, 200)',
    "assert.equal(response.body.status, 'ok')",
    'assertSafePublicBody(response.body)',
    "'\"auditIntent\"'",
    "'\"decisionAuditWriterResult\"'",
  ]);
});

test('Task898 test proves explicit injected writer receives only safe request/apply audit intent metadata', () => {
  const source = read(FILES.task898Test);

  assertIncludesAll(source, [
    'explicit createApp decisionAuditWriter records safe request intent without public response expansion',
    'explicit createApp decisionAuditWriter records safe apply intent without changing apply outcome',
    'explicit createServerBootstrap decisionAuditWriter remains app-like and does not start listen',
    'assertSafeAuditIntent',
    'DATA_CORRECTION_AUDIT_ACTIONS.REQUEST',
    'DATA_CORRECTION_AUDIT_ACTIONS.APPLY',
    'data_correction_request_accepted',
    'data_correction_apply_allowed',
    'DATA_CORRECTION_AUDIT_RESULTS.ALLOWED',
    'auditWritten, false',
  ]);

  assertIncludesAll(source, [
    "Object.prototype.hasOwnProperty.call(intent, key), false",
    "'fromValue'",
    "'toValue'",
    "'rawPhone'",
    "'rawAddress'",
    "'rawLineUserId'",
    "'finalAppointmentId'",
    "'fieldServiceReportId'",
    "'reportId'",
  ]);
});

test('Task898 test keeps public response body redaction broad and explicit', () => {
  const source = read(FILES.task898Test);

  assertIncludesAll(source, [
    'assertSafePublicBody',
    'from_value_should_not_leak',
    'raw_phone_should_not_leak',
    'raw_address_should_not_leak',
    'raw_line_user_should_not_leak',
    'token_should_not_leak',
    'secret_should_not_leak',
    'internal_note_should_not_leak',
    'audit_raw_should_not_leak',
    'ai_raw_should_not_leak',
    'billing_internal_should_not_leak',
    'settlement_internal_should_not_leak',
    'final_appointment_should_not_leak',
    'field_service_report_should_not_leak',
    'report_should_not_leak',
    'writer_failure_marker_should_not_leak',
    'unsafe_sql_marker_should_not_leak',
    'unsafe_db_url_marker_should_not_leak',
    "'\"writerResult\"'",
    "'\"rawWriterResult\"'",
    "'\"finalAppointmentId\"'",
    "'\"fieldServiceReportId\"'",
    "'\"reportId\"'",
  ]);
});

test('Task898 test proves writer success and failure do not change request or apply outcome', () => {
  const source = read(FILES.task898Test);

  assertIncludesAll(source, [
    'response.body.result.correctionApplicationReady, true',
    'response.body.result.correctionApplied, true',
    'decisionAuditWriter failure is redacted and does not change apply outcome',
    'writer_failure_marker_should_not_leak',
    'assert.equal(correctionCalls.length, 1)',
    'assertSafePublicBody([response.body, correctionCalls])',
  ]);
});

test('Task898 document preserves request/apply boundary and no correction behavior changes', () => {
  const doc = read(FILES.task898Doc);

  assertIncludesAll(doc, [
    '`data_correction_request` remains manual-handling',
    'official correction application remains limited to valid `pre_departure_apply`',
    'writer success/failure remains side-effect bounded',
    'no Case / Appointment / Field Service Report / `finalAppointmentId` behavior changes',
  ]);
});

test('app and server do not import decision audit repository/writer or real DB/provider runtimes directly', () => {
  const combined = [
    read(FILES.app),
    read(FILES.server),
  ].join('\n');
  const specifiers = requireSpecifiers(combined);
  const forbiddenSpecifierPattern = /dataCorrectionDecisionAudit(?:Repository|Writer)|^pg$|postgres|sequelize|knex|webhook|openai|rag|auditSink/i;

  assert.equal(specifiers.some((specifier) => forbiddenSpecifierPattern.test(specifier)), false);
  assert.equal(/require\(['"][^'"]*dataCorrectionDecisionAuditRepository['"]\)/.test(combined), false);
  assert.equal(/require\(['"][^'"]*dataCorrectionDecisionAuditWriter['"]\)/.test(combined), false);
  assert.equal(/decisionAuditWriter\s*:\s*(?:create|new|require|process\.env)/.test(combined), false);
  assert.equal(/dataCorrectionDecisionAuditWriter\s*:\s*(?:create|new|require|process\.env)/.test(combined), false);
  assert.equal(/process\.env\.[A-Z0-9_]*(DATABASE|DB|LINE|TOKEN|SECRET|OPENAI|AI|PROVIDER)/i.test(combined), false);
  assert.equal(/npm\s+run\s+db:migrate|psql|CREATE\s+TABLE|ALTER\s+TABLE|DROP\s+TABLE/i.test(combined), false);
});

test('Task899 guard itself is static and imports no src, migration, provider, DB, or env runtime', () => {
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
  assertExcludesAll(source, [
    'DATABASE' + '_URL=',
    'LINE_CHANNEL' + '_SECRET=',
    'LINE_CHANNEL' + '_ACCESS_TOKEN=',
    'OPENAI' + '_API_KEY=',
  ]);
});
