'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const ADAPTER_FILE = 'src/engineerMobile/engineerMobileVisitActionSqlRepositoryAdapter.js';
const UNIT_TEST_FILE = 'tests/engineerMobile/engineerMobileVisitActionSqlRepositoryAdapter.unit.test.js';
const BOUNDARY_TEST_FILE = 'tests/engineerMobile/engineerMobileVisitActionSqlRepositoryAdapterBoundary.static.test.js';
const TASK_DOC = 'docs/task-1865-engineer-mobile-visit-action-sql-repository-injected-db-client-no-db-execution.md';

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

test('Task1865 allowed files exist', () => {
  for (const file of [ADAPTER_FILE, UNIT_TEST_FILE, BOUNDARY_TEST_FILE, TASK_DOC]) {
    assert.equal(fs.existsSync(absolutePath(file)), true, `${file} should exist`);
  }
});

test('SQL repository adapter imports only the repository contract module', () => {
  const source = read(ADAPTER_FILE);

  assert.deepEqual(requireSpecifiers(source), ['./engineerMobileVisitActionRepositoryContract']);
});

test('SQL repository adapter stays injected-client-only and avoids global runtime surfaces', () => {
  const source = read(ADAPTER_FILE);

  for (const pattern of [
    /require\(['"]pg['"]\)/,
    /require\(['"]postgres['"]\)/,
    /\bnew\s+Pool\b/,
    /\bPool\s*\(/,
    /DATABASE_URL/,
    /process\.env/,
    /src\/app/,
    /src\/server/,
    /routes\/index/,
    /\bexpress\b/i,
    /\.listen\s*\(/,
    /db:migrate/i,
    /\bpsql\b/i,
    /migrations\//i,
    /\bseed\b/i,
    /\bfetch\b/,
    /\baxios\b/,
    /\bLINE_CHANNEL/i,
    /\bOPENAI/i,
    /\bR2_/,
  ]) {
    assert.doesNotMatch(source, pattern, `adapter contains forbidden runtime pattern ${pattern}`);
  }
});

test('SQL repository adapter is limited to migration-023 appointment fields and audit index target', () => {
  const source = read(ADAPTER_FILE);

  for (const phrase of [
    'UPDATE appointments AS a',
    'mobile_visit_status',
    'visit_result',
    'mobile_visit_status_updated_at',
    'mobile_visit_status_updated_by',
    'travel_started_at',
    'arrived_at',
    'work_started_at',
    'work_finished_at',
    'INSERT INTO audit_logs',
    'entity_id',
    'action',
  ]) {
    assert.equal(source.includes(phrase), true, `missing expected SQL token ${phrase}`);
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
  ]) {
    assert.equal(source.includes(forbidden), false, `unexpected SQL boundary token ${forbidden}`);
  }
});

test('SQL repository adapter uses parameterized placeholders without string interpolation', () => {
  const source = read(ADAPTER_FILE);

  for (const placeholder of ['$1', '$2', '$3', '$4', '$5', '$6']) {
    assert.equal(source.includes(placeholder), true, `missing placeholder ${placeholder}`);
  }

  assert.doesNotMatch(source, /\$\{/);
  assert.doesNotMatch(source, /text\s*:\s*.*\+/);
  assert.doesNotMatch(source, /values\s*:\s*\[\s*\]/);
});

test('SQL repository adapter does not expose raw rows in result construction', () => {
  const source = read(ADAPTER_FILE);

  for (const pattern of [
    /rows\s*:/,
    /row\s*:/,
    /return\s+.*\[0\]/,
    /raw/i,
  ]) {
    assert.doesNotMatch(source, pattern, `adapter may expose raw DB data ${pattern}`);
  }
});

test('Task1865 doc records no-execution and boundary requirements', () => {
  const doc = read(TASK_DOC);

  for (const phrase of [
    'Task1865',
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
    'Task1864 migration 023 disposable dry-run PASS',
    ADAPTER_FILE,
    UNIT_TEST_FILE,
    BOUNDARY_TEST_FILE,
  ]) {
    assert.equal(doc.includes(phrase), true, `doc should include ${phrase}`);
  }
});
