'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const CONTRACT_FILE = 'src/guards/DispatchOrganizationIsolationContract.js';
const ROUTE_FILE = 'src/routes/dispatchAssignment.routes.js';
const SERVICE_FILE = 'src/services/DispatchAppointmentAssignmentService.js';
const REPOSITORY_FILE = 'src/repositories/DispatchAssignmentSqlRepositoryAdapter.js';
const UNIT_TEST_FILE = 'tests/adminDispatch/dispatchOrganizationIsolationContract.unit.test.js';
const BOUNDARY_TEST_FILE = 'tests/adminDispatch/dispatchOrganizationIsolationContractBoundary.static.test.js';
const TASK_DOC = 'docs/task-1903-organization-isolation-runtime-contract.md';

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

test('Task1903 allowed files exist', () => {
  for (const file of [
    CONTRACT_FILE,
    ROUTE_FILE,
    SERVICE_FILE,
    REPOSITORY_FILE,
    UNIT_TEST_FILE,
    BOUNDARY_TEST_FILE,
    TASK_DOC,
  ]) {
    assert.equal(fs.existsSync(absolutePath(file)), true, `${file} should exist`);
  }
});

test('organization isolation contract helper is pure and has no runtime imports', () => {
  const source = read(CONTRACT_FILE);

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
    assert.doesNotMatch(source, pattern, `contract contains forbidden runtime pattern ${pattern}`);
  }
});

test('route service and repository retain organization isolation boundary tokens', () => {
  const routeSource = read(ROUTE_FILE);
  const serviceSource = read(SERVICE_FILE);
  const repositorySource = read(REPOSITORY_FILE);

  for (const phrase of [
    'requirePermission',
    'dispatch.manage',
    'canManageDispatch',
    'organizationId',
    'assignmentService',
  ]) {
    assert.equal(routeSource.includes(phrase), true, `route should include ${phrase}`);
  }

  for (const phrase of [
    'organization_id_required',
    'dispatch_assignment_not_found_or_denied',
    'recordAssignmentIntent',
    'findAssignmentState',
    'visibleAssignment.organizationId !== validation.organizationId',
  ]) {
    assert.equal(serviceSource.includes(phrase), true, `service should include ${phrase}`);
  }

  for (const phrase of [
    'JOIN cases AS c ON c.id = da.case_id',
    'c.organization_id = $2::uuid',
    'dispatch_assignment_not_found_or_denied',
  ]) {
    assert.equal(repositorySource.includes(phrase), true, `repository should include ${phrase}`);
  }
});

test('organization isolation sources avoid forbidden business side effects', () => {
  for (const file of [CONTRACT_FILE, ROUTE_FILE, SERVICE_FILE, REPOSITORY_FILE]) {
    const source = read(file);

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
      assert.equal(source.includes(forbidden), false, `${file} includes forbidden token ${forbidden}`);
    }
  }
});

test('Task1903 doc records organization isolation and safety boundaries', () => {
  const doc = read(TASK_DOC);

  for (const phrase of [
    'Task1903',
    'Organization isolation runtime contract',
    'No real DB connection',
    'No DATABASE_URL usage',
    'No migration execution',
    'No runtime start',
    'No provider sending',
    'No Completion Report / Field Service Report creation',
    'No finalAppointmentId mutation',
    'No customer-visible publication behavior',
    CONTRACT_FILE,
    ROUTE_FILE,
    SERVICE_FILE,
    REPOSITORY_FILE,
    UNIT_TEST_FILE,
    BOUNDARY_TEST_FILE,
  ]) {
    assert.equal(doc.includes(phrase), true, `doc should include ${phrase}`);
  }
});
