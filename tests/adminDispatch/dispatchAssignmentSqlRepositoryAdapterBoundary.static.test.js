'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const ADAPTER_FILE = 'src/repositories/DispatchAssignmentSqlRepositoryAdapter.js';
const UNIT_TEST_FILE = 'tests/adminDispatch/dispatchAssignmentSqlRepositoryAdapter.unit.test.js';
const BOUNDARY_TEST_FILE = 'tests/adminDispatch/dispatchAssignmentSqlRepositoryAdapterBoundary.static.test.js';
const TASK_DOC = 'docs/task-1899-dispatch-assignment-repository-adapter-injected-db-client.md';

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

test('Task1899 allowed files exist', () => {
  for (const file of [ADAPTER_FILE, UNIT_TEST_FILE, BOUNDARY_TEST_FILE, TASK_DOC]) {
    assert.equal(fs.existsSync(absolutePath(file)), true, `${file} should exist`);
  }
});

test('dispatch assignment SQL adapter has no runtime imports', () => {
  const source = read(ADAPTER_FILE);

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
    /\bexpress\b/i,
    /\.listen\s*\(/,
    /withTransaction/,
    /db:migrate/i,
    /\bpsql\b/i,
    /migrations\//i,
    /\bseed\b/i,
  ]) {
    assert.doesNotMatch(source, pattern, `adapter contains forbidden runtime pattern ${pattern}`);
  }
});

test('dispatch assignment SQL adapter preserves organization isolation and parameterization', () => {
  const source = read(ADAPTER_FILE);

  for (const phrase of [
    'dispatch_assignments AS da',
    'JOIN cases AS c ON c.id = da.case_id',
    'c.organization_id = $2::uuid',
    'da.deleted_at IS NULL',
    'c.deleted_at IS NULL',
    'UPDATE dispatch_assignments AS da',
    'RETURNING',
    '$1::uuid',
    '$2::uuid',
    '$3::uuid',
    '$4::uuid',
    '$5::text',
    '$6::text',
    '$7::uuid',
    '$8::timestamptz',
  ]) {
    assert.equal(source.includes(phrase), true, `missing expected SQL token ${phrase}`);
  }

  assert.doesNotMatch(source, /\$\{/);
  assert.doesNotMatch(source, /text\s*:\s*.*\+/);
  assert.doesNotMatch(source, /values\s*:\s*\[\s*\]/);
});

test('dispatch assignment SQL adapter is limited to assignment intent fields', () => {
  const source = read(ADAPTER_FILE);

  for (const expected of [
    'dispatch_unit_id',
    'assigned_engineer_id',
    'dispatch_status',
    'assignment_note',
    'assigned_by_user_id',
    'reassigned_by_user_id',
    'reassigned_at',
    'updated_by',
  ]) {
    assert.equal(source.includes(expected), true, `missing expected dispatch field ${expected}`);
  }

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
    assert.equal(source.includes(forbidden), false, `unexpected boundary token ${forbidden}`);
  }
});

test('Task1899 doc records no-execution and safety boundaries', () => {
  const doc = read(TASK_DOC);

  for (const phrase of [
    'Task1899',
    'Injected DB client only',
    'Synthetic DB client tests only',
    'No real DB connection',
    'No DATABASE_URL usage',
    'No global pool construction',
    'No app/server import',
    'No migration execution',
    'No runtime start',
    'No provider sending',
    'No Completion Report / Field Service Report creation',
    'No finalAppointmentId mutation',
    'No customer-visible publication behavior',
    'Organization isolation',
    ADAPTER_FILE,
    UNIT_TEST_FILE,
    BOUNDARY_TEST_FILE,
  ]) {
    assert.equal(doc.includes(phrase), true, `doc should include ${phrase}`);
  }
});
