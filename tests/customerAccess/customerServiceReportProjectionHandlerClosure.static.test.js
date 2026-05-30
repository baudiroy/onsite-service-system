'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const HANDLER_FILE = 'src/customerAccess/customerServiceReportProjectionHandler.js';
const HTTP_TEST_FILE = 'tests/customerAccess/customerServiceReportProjectionHandler.http-behavior.unit.test.js';
const TASK_DOC = 'docs/task-909-customer-access-service-report-projection-http-handler-injected-db-client-no-listen-no-real-db.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
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

test('Task909 source test and doc files exist', () => {
  for (const file of [HANDLER_FILE, HTTP_TEST_FILE, TASK_DOC]) {
    assert.equal(fs.existsSync(path.join(repoRoot, file)), true, `${file} should exist`);
  }
});

test('handler delegates to Task908 service and imports no forbidden runtime dependencies', () => {
  const source = read(HANDLER_FILE);

  assert.deepEqual(requireSpecifiers(source), [
    './customerServiceReportProjectionService',
    './customerAccessAuditEventBuilder',
    './customerAccessAuditWriterAdapter',
  ]);
  assert.match(source, /getCustomerServiceReportProjection/);
  assert.match(source, /buildCustomerAccessAuditEvent/);
  assert.match(source, /writeCustomerAccessAuditEvent/);
  assert.doesNotMatch(source, /require\(['"][^'"]*(routes|controllers|app|server|Repository|transaction|provider|OpenAI|RAG|billing|settlement|migration|smoke|config|env|logger)/i);
  assert.doesNotMatch(source, /process\.env|console\.|fetch\(|axios|http\.request|https\.request|new Pool|createPool/i);
});

test('handler has no route registration listen server or mutation execution paths', () => {
  const source = read(HANDLER_FILE);

  assert.doesNotMatch(source, /app\.listen|listen\(|express\s*\(|Router\s*\(|router\.(get|post|use)|register.*Route/i);
  assert.doesNotMatch(source, /\binsert\s*\(|\bupdate\s*\(|\bdelete\s*\(|\bcreate\s*\(|\bapprove\s*\(|\bpublish\s*\(/i);
  assert.doesNotMatch(source, /finalAppointmentId\s*=|caseStatus\s*=|appointmentStatus\s*=|fieldServiceReport\s*=/);
});

test('HTTP behavior coverage locks injected DB safe-deny allowlist and error boundaries', () => {
  const source = read(HTTP_TEST_FILE);

  assert.match(source, /missing injected dbClient returns generic safe-deny/);
  assert.match(source, /missing or invalid customerAccessContext returns generic safe-deny/);
  assert.match(source, /unauthorized org mismatch and not found return generic safe-deny/);
  assert.match(source, /valid authorized request returns HTTP 200/);
  assert.match(source, /query throw returns generic safe-deny/);
  assert.match(source, /handler factory writes synthetic res status and json/);
  assert.match(source, /request context and DB row are not mutated/);
  assert.doesNotMatch(source, /app\.listen|npm run db:migrate|psql/i);
});

test('Task909 evidence doc records no listen no route no migration and no provider AI billing scope', () => {
  const doc = read(TASK_DOC);

  assert.match(doc, /No listen/);
  assert.match(doc, /No route/);
  assert.match(doc, /No migration/);
  assert.match(doc, /No real DB/);
  assert.match(doc, /No provider sending/);
  assert.match(doc, /No AI\/RAG/);
  assert.match(doc, /No billing\/settlement/);
  assert.match(doc, /No smoke\/shared runtime/);
});
