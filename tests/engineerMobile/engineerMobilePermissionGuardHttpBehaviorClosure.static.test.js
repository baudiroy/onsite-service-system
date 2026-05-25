'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const task797TestPath = path.join(
  repoRoot,
  'tests/engineerMobile/engineerMobilePermissionGuardHttpBehavior.unit.test.js',
);
const task797DocPath = path.join(
  repoRoot,
  'docs/task-797-engineer-mobile-permission-guard-http-behavior-unit-test-no-listen-no-db.md',
);
const task798DocPath = path.join(
  repoRoot,
  'docs/task-798-engineer-mobile-permission-guard-http-behavior-closure-no-listen-no-db.md',
);
const designDocPath = path.join(repoRoot, 'docs/design/engineer-mobile-workbench.md');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

test('Task797 HTTP behavior evidence exists with Task798 closure docs', () => {
  assert.equal(fs.existsSync(task797TestPath), true);
  assert.equal(fs.existsSync(task797DocPath), true);
  assert.equal(fs.existsSync(task798DocPath), true);
  assert.equal(fs.existsSync(designDocPath), true);

  const task798Doc = read(task798DocPath);
  const designDoc = read(designDocPath);

  assert.match(task798Doc, /Task797/);
  assert.match(task798Doc, /Task798/);
  assert.match(task798Doc, /no listen/i);
  assert.match(task798Doc, /no DB/i);
  assert.match(task798Doc, /no API response shape change/i);
  assert.match(designDoc, /Task797-798 Permission Guard HTTP Behavior Closure/);
});

test('Task797 app-like HTTP behavior uses createApp and app.handle without listen', () => {
  const source = read(task797TestPath);

  assert.match(source, /createApp/);
  assert.match(source, /app\.handle\(req, res\)/);
  assert.doesNotMatch(source, /\.listen\(/);
  assert.doesNotMatch(source, /createServer\(/);
  assert.doesNotMatch(source, /startServer/);
});

test('Task797 covers explicit opt-in guard and default-disabled behavior', () => {
  const source = read(task797TestPath);
  const doc = read(task797DocPath);

  assert.match(source, /permissionAssignmentGuardEnabled:\s*true/);
  assert.match(source, /evaluateEngineerMobilePermissionAssignment/);
  assert.match(source, /guard disabled HTTP-style behavior remains backward compatible/);
  assert.match(doc, /explicit opt-in guard only/);
  assert.match(doc, /guard disabled behavior remains backward compatible/);
});

test('Task797 covers allow and fail-closed HTTP-style cases', () => {
  const source = read(task797TestPath);

  assert.match(source, /guarded HTTP-style list allows assigned engineer/);
  assert.match(source, /guarded HTTP-style detail allows assigned engineer/);
  assert.match(source, /guarded HTTP-style list denies unassigned synthetic context safely/);
  assert.match(source, /guarded HTTP-style detail denies cross-organization synthetic context safely/);
  assert.match(source, /missing auth unknown role and missing permission fail closed/);
  assert.match(source, /role:\s*'customer_service'/);
  assert.match(source, /permissions:\s*\['cases\.read'\]/);
});

test('Task797 preserves list and detail response shapes', () => {
  const source = read(task797TestPath);
  const doc = read(task797DocPath);

  assert.match(source, /\['status', 'tasks'\]/);
  assert.match(source, /\['detail', 'status'\]/);
  assert.match(doc, new RegExp('`status` / `tasks`'));
  assert.match(doc, new RegExp('`status` / `detail`'));
});

test('Task797 redaction evidence covers sensitive and internal fields', () => {
  const source = read(task797TestPath);
  const doc = read(task797DocPath);

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
    assert.match(source, new RegExp(value));
  }

  assert.match(doc, /DB URL/);
  assert.match(doc, /raw LINE id/);
  assert.match(doc, /full phone/);
  assert.match(doc, /full address/);
  assert.match(doc, /AI raw payload/);
  assert.match(doc, /`finalAppointmentId`/);
});

test('Task797 evidence does not invoke forbidden runtime paths', () => {
  const source = read(task797TestPath);
  const doc = read(task797DocPath);

  assert.doesNotMatch(source, /process\.env/);
  assert.doesNotMatch(source, /app\.listen/);
  assert.doesNotMatch(source, /startServer/);
  assert.doesNotMatch(source, /dbClient|transaction|psql|db:migrate/);
  assert.doesNotMatch(source, /completeServiceReport|createFieldServiceReport|updateFieldServiceReport/);
  assert.doesNotMatch(source, /send(Line|Sms|Push)|webhook|openai|rag|vector/i);
  assert.doesNotMatch(source, /admin\/src|migrations\/|smoke:/);

  assert.match(doc, /No source change was needed/);
  assert.match(doc, /no real DB/i);
  assert.match(doc, /no completion write/i);
  assert.match(doc, /no `finalAppointmentId` exposure, inference, or mutation/i);
  assert.match(doc, new RegExp('no AI / RAG', 'i'));
});
