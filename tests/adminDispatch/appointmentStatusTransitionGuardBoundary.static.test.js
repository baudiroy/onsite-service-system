'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const GUARD_FILE = 'src/guards/AppointmentStatusTransitionGuard.js';
const UNIT_TEST_FILE = 'tests/adminDispatch/appointmentStatusTransitionGuard.unit.test.js';
const BOUNDARY_TEST_FILE = 'tests/adminDispatch/appointmentStatusTransitionGuardBoundary.static.test.js';
const TASK_DOC = 'docs/task-1902-appointment-status-transition-guard.md';

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

function sourceWithoutForbiddenMutationKeyList(source) {
  return source.replace(
    /const FORBIDDEN_MUTATION_KEYS = new Set\(\[[\s\S]*?\]\);\n\n/,
    'const FORBIDDEN_MUTATION_KEYS = new Set([]);\n\n',
  );
}

test('Task1902 allowed files exist', () => {
  for (const file of [GUARD_FILE, UNIT_TEST_FILE, BOUNDARY_TEST_FILE, TASK_DOC]) {
    assert.equal(fs.existsSync(absolutePath(file)), true, `${file} should exist`);
  }
});

test('appointment status transition guard is pure and has no concrete runtime imports', () => {
  const source = read(GUARD_FILE);

  assert.deepEqual(requireSpecifiers(source), []);

  for (const pattern of [
    /require\(['"]pg['"]\)/,
    /require\(['"]postgres['"]\)/,
    /repositories?\//i,
    /BaseRepository/,
    /DATABASE_URL/,
    /process\.env/,
    /src\/app/,
    /src\/server/,
    /routes?\//i,
    /\bexpress\b/i,
    /\.listen\s*\(/,
    /withTransaction/,
    /db:migrate/i,
    /\bpsql\b/i,
    /migrations\//i,
    /\bseed\b/i,
    /fetch\(/,
    /axios/,
  ]) {
    assert.doesNotMatch(source, pattern, `guard contains forbidden runtime pattern ${pattern}`);
  }
});

test('appointment status transition guard encodes lifecycle closed-state and org expectations', () => {
  const source = read(GUARD_FILE);

  for (const phrase of [
    'scheduled',
    'rescheduled',
    'cancelled',
    'completed',
    'no_show',
    'appointment_status_closed_or_finalized',
    'appointment_organization_mismatch',
    'assignment_organization_mismatch',
    'assignment_not_visible_or_eligible',
    'admin_actor_required',
    'organization_id_required',
    'appointment_status_transition_invalid',
    'mutationIntent',
  ]) {
    assert.equal(source.includes(phrase), true, `missing expected guard token ${phrase}`);
  }
});

test('appointment status transition guard keeps forbidden side-effect tokens only in deny-list', () => {
  const source = sourceWithoutForbiddenMutationKeyList(read(GUARD_FILE));

  for (const forbidden of [
    'field_service_reports',
    'completion_reports',
    'final_appointment_id',
    'finalAppointmentId',
    'customer_visible_publication',
    'customerVisiblePublication',
    'provider_payload',
    'providerPayload',
    'line_user_id',
    'report_draft',
    'publish',
    'OPENAI',
    'LINE_CHANNEL',
    'R2_',
    'billing',
    'stripe',
  ]) {
    assert.equal(source.includes(forbidden), false, `unexpected guard boundary token ${forbidden}`);
  }
});

test('Task1902 doc records guard and safety boundaries', () => {
  const doc = read(TASK_DOC);

  for (const phrase of [
    'Task1902',
    'Pure guard',
    'No real DB connection',
    'No DATABASE_URL usage',
    'No route mount changes',
    'No migration execution',
    'No runtime start',
    'No provider sending',
    'No Completion Report / Field Service Report creation',
    'No finalAppointmentId mutation',
    'No customer-visible publication behavior',
    'Organization isolation',
    GUARD_FILE,
    UNIT_TEST_FILE,
    BOUNDARY_TEST_FILE,
  ]) {
    assert.equal(doc.includes(phrase), true, `doc should include ${phrase}`);
  }
});
