'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const SERVICE_FILE = 'src/services/DispatchAppointmentAssignmentService.js';
const UNIT_TEST_FILE = 'tests/adminDispatch/dispatchAppointmentAssignmentService.unit.test.js';
const BOUNDARY_TEST_FILE = 'tests/adminDispatch/dispatchAppointmentAssignmentServiceBoundary.static.test.js';
const TASK_DOC = 'docs/task-1900-dispatch-appointment-assignment-service.md';

function absolutePath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(absolutePath(relativePath), 'utf8');
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

test('Task1900 allowed files exist', () => {
  for (const file of [SERVICE_FILE, UNIT_TEST_FILE, BOUNDARY_TEST_FILE, TASK_DOC]) {
    assert.equal(fs.existsSync(absolutePath(file)), true, `${file} should exist`);
  }
});

test('assignment service has no concrete runtime imports', () => {
  const source = read(SERVICE_FILE);

  assert.deepEqual(requireSpecifiers(source), []);

  for (const pattern of [
    /require\(['"]pg['"]\)/,
    /require\(['"]postgres['"]\)/,
    /\bnew\s+Pool\b/,
    /\bPool\s*\(/,
    /BaseRepository/,
    /DATABASE_URL/,
    /process\.env/,
    /src\/app/,
    /src\/server/,
    /routes\/index/,
    /DispatchController/,
    /\bexpress\b/i,
    /\.listen\s*\(/,
    /withTransaction/,
    /db:migrate/i,
    /\bpsql\b/i,
    /migrations\//i,
    /\bseed\b/i,
  ]) {
    assert.doesNotMatch(source, pattern, `service contains forbidden runtime pattern ${pattern}`);
  }
});

test('assignment service preserves injected repository and permission expectations', () => {
  const source = read(SERVICE_FILE);

  for (const phrase of [
    'assignmentRepository',
    'findAssignmentState',
    'recordAssignmentIntent',
    'dispatch.manage',
    'canManageDispatch',
    'organizationId',
    'actorId',
    'auditContext',
    'dispatch_assignment_not_found_or_denied',
    'dispatch_assignment_write_denied',
  ]) {
    assert.equal(source.includes(phrase), true, `missing expected service token ${phrase}`);
  }
});

test('assignment service avoids forbidden business side effects', () => {
  const source = read(SERVICE_FILE);

  for (const forbidden of [
    'field_service_reports',
    'completion_reports',
    'final_appointment_id',
    'finalAppointmentId',
    'customer_visible_publication',
    'customer_phone',
    'customer_address',
    'line_user_id',
    'provider_payload',
    'report_draft',
    'publish',
    'OPENAI',
    'LINE_CHANNEL',
    'R2_',
    'billing',
    'stripe',
  ]) {
    assert.equal(source.includes(forbidden), false, `unexpected service boundary token ${forbidden}`);
  }
});

test('Task1900 doc records no-execution and safety boundaries', () => {
  const doc = read(TASK_DOC);

  for (const phrase of [
    'Task1900',
    'Injected repository only',
    'Synthetic tests only',
    'No real DB connection',
    'No DATABASE_URL usage',
    'No global pool construction',
    'No route wiring',
    'No app/server import',
    'No migration execution',
    'No runtime start',
    'No provider sending',
    'No Completion Report / Field Service Report creation',
    'No finalAppointmentId mutation',
    'No customer-visible publication behavior',
    'Organization isolation',
    SERVICE_FILE,
    UNIT_TEST_FILE,
    BOUNDARY_TEST_FILE,
  ]) {
    assert.equal(doc.includes(phrase), true, `doc should include ${phrase}`);
  }
});
