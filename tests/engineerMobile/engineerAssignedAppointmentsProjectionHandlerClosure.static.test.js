'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const HANDLER_FILE = 'src/engineerMobile/engineerAssignedAppointmentsProjectionHandler.js';
const SERVICE_FILE = 'src/engineerMobile/engineerAssignedAppointmentsProjectionService.js';
const HTTP_TEST_FILE = 'tests/engineerMobile/engineerAssignedAppointmentsProjectionHandler.http-behavior.unit.test.js';
const TASK_DOC = 'docs/task-922-engineer-mobile-assigned-appointments-http-handler-injected-db-client-no-route-no-real-db.md';

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

test('Task922 source test and doc files exist', () => {
  for (const file of [HANDLER_FILE, SERVICE_FILE, HTTP_TEST_FILE, TASK_DOC]) {
    assert.equal(exists(file), true, `${file} should exist`);
  }
});

test('handler delegates to Task921 service and imports no forbidden runtime dependencies', () => {
  const source = read(HANDLER_FILE);
  const specifiers = requireSpecifiers(source);

  assert.deepEqual(specifiers, ['./engineerAssignedAppointmentsProjectionService']);
  assert.match(source, /getEngineerAssignedAppointmentsProjection/);
  assert.doesNotMatch(source, /mapAppointmentProjection|ASSIGNED_APPOINTMENTS_QUERY_TEXT|select appointment_id/);
  for (const specifier of specifiers.filter((entry) => entry !== './engineerAssignedAppointmentsProjectionService')) {
    assert.doesNotMatch(specifier, /(db|pool|repositories?|transaction|routes?|controllers?|app|server|listen|bootstrap|auth|session|jwt|provider|line|sms|email|push|webhook|openai|ai|rag|vector|search|billing|settlement|env|config|credential|logger|network|smoke|migration)/i);
  }
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

  assert.match(source, /missing injected dbClient fails closed/);
  assert.match(source, /missing or invalid engineerContext fails closed/);
  assert.match(source, /query throw returns generic safe-deny/);
  assert.match(source, /valid authorized synthetic request returns Task921 allowlist projection/);
  assert.match(source, /invalid date and status filters fail closed/);
  assert.match(source, /handler factory writes synthetic res status and json/);
  assert.match(source, /request context and DB row are not mutated/);
  assert.doesNotMatch(source, /app\.listen|npm run db:migrate|psql/i);
});

test('Task922 evidence doc records no route no real DB and no provider AI billing scope', () => {
  const doc = read(TASK_DOC);

  assert.match(doc, /No Route/);
  assert.match(doc, /No Real DB|No real DB/);
  assert.match(doc, /No migration/);
  assert.match(doc, /No provider sending/);
  assert.match(doc, /No AI\/RAG/);
  assert.match(doc, /No billing\/settlement/);
  assert.match(doc, /No smoke\/shared runtime/);
  assert.match(doc, /No admin\/src|No `admin\/src\/`/);
});
