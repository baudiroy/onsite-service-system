'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const AUDIT_FILE = 'src/customerAccess/customerServiceReportAuditBoundary.js';
const UNIT_TEST_FILE = 'tests/customerAccess/customerServiceReportAuditBoundary.unit.test.js';
const ROUTE_TEST_FILE = 'tests/customerAccess/customerAccessRoutes.unit.test.js';
const TASK_DOC = 'docs/task-1884-customer-facing-report-audit-log-boundary.md';

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(path.join(repoRoot, relativePath));
}

test('Task1884 audit boundary source tests and doc exist', () => {
  for (const file of [AUDIT_FILE, UNIT_TEST_FILE, ROUTE_TEST_FILE, TASK_DOC]) {
    assert.equal(exists(file), true, `${file} should exist`);
  }
});

test('audit boundary has no DB provider AI billing route or runtime side-effect imports', () => {
  const source = read(AUDIT_FILE);

  assert.doesNotMatch(source, /require\(/);
  assert.doesNotMatch(source, /process\.env|console\.|fetch\(|axios|http\.request|https\.request|new Pool|createPool/i);
  assert.doesNotMatch(source, /app\.listen|listen\(|express\s*\(|Router\s*\(|router\.(get|post|use)/i);
  assert.doesNotMatch(source, /psql|npm run db|migration|provider sending|send(Line|Sms|SMS|Email|Webhook)|OpenAI|RAG|billing/i);
});

test('audit boundary does not assign forbidden customer-facing or internal fields to event output', () => {
  const source = read(AUDIT_FILE);

  for (const forbidden of [
    'rawPhone',
    'rawAddress',
    'providerRawPayload',
    'providerPayload',
    'token',
    'secret',
    'finalAppointmentId',
    'internalNote',
    'serviceSummary',
    'billingInternalData',
    'rawCasePayload',
    'rawAppointmentRow',
    'rawCompletionReport',
  ]) {
    assert.doesNotMatch(source, new RegExp(`event\\.${forbidden}\\b`));
  }
});

test('unit and route coverage lock sanitized audit writer boundaries', () => {
  const unitSource = read(UNIT_TEST_FILE);
  const routeSource = read(ROUTE_TEST_FILE);

  assert.match(unitSource, /minimal sanitized allow audit event/);
  assert.match(unitSource, /sanitized deny audit event/);
  assert.match(unitSource, /writer failure is swallowed/);
  assert.match(routeSource, /writes sanitized allow audit event/);
  assert.match(routeSource, /writes sanitized deny audit event/);
  assert.match(routeSource, /audit writer failure remains sanitized/);
});
