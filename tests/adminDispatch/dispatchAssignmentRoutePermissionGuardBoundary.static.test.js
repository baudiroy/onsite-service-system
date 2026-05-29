'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const ROUTE_FILE = 'src/routes/dispatchAssignment.routes.js';
const ROUTE_INDEX_FILE = 'src/routes/index.js';
const UNIT_TEST_FILE = 'tests/adminDispatch/dispatchAssignmentRoutePermissionGuard.unit.test.js';
const BOUNDARY_TEST_FILE = 'tests/adminDispatch/dispatchAssignmentRoutePermissionGuardBoundary.static.test.js';
const TASK_DOC = 'docs/task-1901-dispatch-route-wiring-admin-permission-guard.md';

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

test('Task1901 allowed files exist', () => {
  for (const file of [ROUTE_FILE, ROUTE_INDEX_FILE, UNIT_TEST_FILE, BOUNDARY_TEST_FILE, TASK_DOC]) {
    assert.equal(fs.existsSync(absolutePath(file)), true, `${file} should exist`);
  }
});

test('dispatch assignment route imports only permission middleware', () => {
  const source = read(ROUTE_FILE);

  assert.deepEqual(requireSpecifiers(source), ['../middlewares/requirePermission']);
});

test('dispatch assignment route stays injected-service-only and avoids concrete runtime dependencies', () => {
  const source = read(ROUTE_FILE);

  for (const pattern of [
    /require\(['"]pg['"]\)/,
    /require\(['"]postgres['"]\)/,
    /repositories?\//i,
    /BaseRepository/,
    /DATABASE_URL/,
    /process\.env/,
    /src\/app/,
    /src\/server/,
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
    assert.doesNotMatch(source, pattern, `route contains forbidden runtime pattern ${pattern}`);
  }
});

test('dispatch assignment route uses admin permission guard and injected service boundary', () => {
  const source = read(ROUTE_FILE);

  for (const phrase of [
    'dispatch.manage',
    'requirePermission',
    'assignmentService',
    'assignAppointment',
    'createDispatchAssignmentRouteHandler',
    'registerDispatchAssignmentRoutes',
    'assignment_route_dependency_required',
    'DISPATCH_ASSIGNMENT_UNAVAILABLE',
  ]) {
    assert.equal(source.includes(phrase), true, `missing expected route token ${phrase}`);
  }
});

test('createAppRouter wires optional dispatch assignment route registry without default DB dependency', () => {
  const source = read(ROUTE_INDEX_FILE);

  assert.equal(source.includes("const { registerDispatchAssignmentRoutes } = require('./dispatchAssignment.routes');"), true);
  assert.equal(source.includes('registerDispatchAssignmentRoutes(appRouter, options.dispatchAssignment || options.adminDispatch || {});'), true);
});

test('dispatch assignment route avoids forbidden business side effects', () => {
  const source = read(ROUTE_FILE);

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
    assert.equal(source.includes(forbidden), false, `unexpected route boundary token ${forbidden}`);
  }
});

test('Task1901 doc records route guard and safety boundaries', () => {
  const doc = read(TASK_DOC);

  for (const phrase of [
    'Task1901',
    'Injected assignment service only',
    'Permission guard',
    'dispatch.manage',
    'No direct DB client',
    'No real DB connection',
    'No DATABASE_URL usage',
    'No migration execution',
    'No runtime start',
    'No provider sending',
    'No Completion Report / Field Service Report creation',
    'No finalAppointmentId mutation',
    'No customer-visible publication behavior',
    ROUTE_FILE,
    ROUTE_INDEX_FILE,
    UNIT_TEST_FILE,
    BOUNDARY_TEST_FILE,
  ]) {
    assert.equal(doc.includes(phrase), true, `doc should include ${phrase}`);
  }
});
