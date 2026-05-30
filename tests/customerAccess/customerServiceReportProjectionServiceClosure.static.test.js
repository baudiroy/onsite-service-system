'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const SERVICE_FILE = 'src/customerAccess/customerServiceReportProjectionService.js';
const UNIT_TEST_FILE = 'tests/customerAccess/customerServiceReportProjectionService.unit.test.js';
const TASK_DOC = 'docs/task-908-customer-access-read-only-service-report-projection-injected-db-client-no-route-no-migration.md';

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(path.join(repoRoot, relativePath));
}

test('Task908 source test and doc files exist', () => {
  assert.equal(exists(SERVICE_FILE), true);
  assert.equal(exists(UNIT_TEST_FILE), true);
  assert.equal(exists(TASK_DOC), true);
});

test('projection service has no runtime side-effect imports or forbidden dependencies', () => {
  const source = read(SERVICE_FILE);

  assert.doesNotMatch(source, /require\(/);
  assert.doesNotMatch(source, /process\.env|console\.|fetch\(|axios|http\.request|https\.request/);
  assert.doesNotMatch(source, /require\(['"][^'"]*(routes|controllers|app|server|Repository|transaction|provider|OpenAI|RAG|billing|settlement|smoke|migration)/i);
});

test('projection service remains read-only and does not define mutation execution paths', () => {
  const source = read(SERVICE_FILE);

  assert.match(source, /readOnly: true/);
  assert.match(source, /select organization_id, customer_id, case_id, public_report_id/);
  assert.match(source, /publication_allowed, customer_visible_policy_passed, publication_state, customer_visible/);
  assert.doesNotMatch(source, /\binsert\s+into\b|\bupdate\s+\w+\s+set\b|\bdelete\s+from\b|\bdrop\s+table\b|\balter\s+table\b/i);
  assert.doesNotMatch(source, /finalAppointmentId\s*=|caseStatus\s*=|appointmentStatus\s*=|fieldServiceReport\s*=/);
});

test('unit coverage locks safe deny allowlist and synthetic db boundaries', () => {
  const source = read(UNIT_TEST_FILE);

  assert.match(source, /missing dbClient fails closed/);
  assert.match(source, /missing or invalid customerAccessContext fails closed/);
  assert.match(source, /organization mismatch fails closed/);
  assert.match(source, /unauthorized customer context/);
  assert.match(source, /not found fails closed/);
  assert.match(source, /allowlisted customer-visible projection/);
  assert.match(source, /read-only through injected synthetic dbClient query only/);
  assert.match(source, /dbClient query throws fail closed without raw error leak/);
  assert.match(source, /dbClient query rejects fail closed without rejection reason leak/);
  assert.match(source, /input context and row objects are not mutated/);
});

test('Task908 evidence doc records no route no migration and no provider AI billing scope', () => {
  const doc = read(TASK_DOC);

  assert.match(doc, /No route/);
  assert.match(doc, /No migration/);
  assert.match(doc, /No public API shape change/);
  assert.match(doc, /No real DB connection/);
  assert.match(doc, /No provider sending/);
  assert.match(doc, /No AI\/RAG/);
  assert.match(doc, /No billing\/settlement/);
  assert.match(doc, /No smoke\/shared runtime/);
});
