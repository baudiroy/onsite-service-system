'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const HANDLER_FILE = 'src/engineerMobile/engineerAssignedAppointmentDetailProjectionHandler.js';
const SERVICE_FILE = 'src/engineerMobile/engineerAssignedAppointmentDetailProjectionService.js';
const HTTP_TEST_FILE = 'tests/engineerMobile/engineerAssignedAppointmentDetailProjectionHandler.http-behavior.unit.test.js';
const CLOSURE_TEST_FILE = 'tests/engineerMobile/engineerAssignedAppointmentDetailProjectionHandlerClosure.static.test.js';
const TASK_DOC = 'docs/task-926-engineer-mobile-assigned-appointment-detail-http-handler-injected-db-client-no-route-no-workflow.md';

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(path.join(repoRoot, relativePath));
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

test('Task926 source test and doc files exist', () => {
  for (const file of [HANDLER_FILE, SERVICE_FILE, HTTP_TEST_FILE, CLOSURE_TEST_FILE, TASK_DOC]) {
    assert.equal(exists(file), true, `${file} should exist`);
  }
});

test('handler delegates to Task925 service and imports no forbidden runtime dependencies', () => {
  const source = read(HANDLER_FILE);

  assert.deepEqual(requireSpecifiers(source), ['./engineerAssignedAppointmentDetailProjectionService']);
  assert.match(source, /getEngineerAssignedAppointmentDetailProjection/);
  assert.match(source, /dbClient:\s*options\.dbClient/);
  assert.match(source, /appointmentId/);
  assert.doesNotMatch(source, /process\.env|console\.|fetch\(|axios|http\.request|https\.request|new Pool|createPool/i);
  assert.doesNotMatch(source, /require\(['"].*(?:routes?|controllers?|server|app|listen|bootstrap|db|pool|repositories?|transaction|baseRepository|auth|session|jwt|provider|line|sms|email|push|webhook|openai|ai|rag|vector|search|billing|settlement|env|config|credential|logger|network|smoke|migration|admin)['"]\)/i);
});

test('handler has no route registration listen server or mutation execution paths', () => {
  const source = read(HANDLER_FILE);

  assert.doesNotMatch(source, /\.listen\s*\(|express\s*\(|Router\s*\(|createServer\(/i);
  assert.doesNotMatch(source, /jwt|session|passport|login|logout|authorization|bearer/i);
  assert.doesNotMatch(source, /new\s+\w*Repository|create.*Repository|baseRepository|transaction|BEGIN|COMMIT|ROLLBACK/i);
  assert.doesNotMatch(source, /\binsert\s+into\b|\bupdate\s+\w+\s+set\b|\bdelete\s+from\b/i);
  assert.doesNotMatch(source, /markArrived|markStarted|submitCompletion|createReport|updateReport|approveReport|publishReport/i);
  assert.doesNotMatch(source, /createFieldServiceReport|createCompletionReport|startTravel\s*\(|arrival\s*\(|completeAppointment/i);
  assert.doesNotMatch(source, /finalAppointmentId\s*=|caseStatus\s*=|appointmentStatus\s*=|fieldServiceReport\s*=/);
});

test('HTTP behavior coverage locks injected DB safe-deny allowlist and error boundaries', () => {
  const source = read(HTTP_TEST_FILE);

  assert.match(source, /missing injected dbClient fails closed/);
  assert.match(source, /missing or invalid engineerContext fails closed/);
  assert.match(source, /missing or invalid appointment id fails closed/);
  assert.match(source, /query throw returns generic safe-deny/);
  assert.match(source, /valid authorized synthetic request returns Task925 allowlist detail projection/);
  assert.match(source, /wrong scope and not found return generic safe-deny/);
  assert.match(source, /handler factory writes synthetic res status and json without listen or route registration/);
  assert.match(source, /request context and DB row are not mutated/);
  assert.match(source, /assertNoSensitiveLeak/);
  assert.doesNotMatch(source, /\.listen\(|createServer\(|DATABASE_URL|npm run db:migrate|psql|OpenAI|LINE_CHANNEL_ACCESS_TOKEN/i);
});

test('Task926 evidence doc records no route no workflow and forbidden scope', () => {
  const doc = read(TASK_DOC);

  for (const file of [HANDLER_FILE, HTTP_TEST_FILE, CLOSURE_TEST_FILE]) {
    assert.match(doc, new RegExp(file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.match(doc, /HTTP-like handler/);
  assert.match(doc, /No Route/);
  assert.match(doc, /No Workflow/);
  assert.match(doc, /No production route/);
  assert.match(doc, /No real DB/);
  assert.match(doc, /No auth\/session\/JWT runtime/);
  assert.match(doc, /No provider sending/);
  assert.match(doc, /No AI\/RAG/);
  assert.match(doc, /No billing\/settlement/);
  assert.match(doc, /No migration/);
  assert.match(doc, /No smoke\/shared runtime/);
  assert.match(doc, /No check-in\/start travel\/arrival\/completion\/report creation\/report publish/);
  assert.match(doc, /finalAppointmentId/);
});
