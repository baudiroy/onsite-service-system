'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const ADAPTER_FILE = 'src/repositories/DepotIntakeSqlRepositoryAdapter.js';
const UNIT_TEST_FILE = 'tests/depotWorkshop/depotIntakeSqlRepositoryAdapter.unit.test.js';
const BOUNDARY_TEST_FILE = 'tests/depotWorkshop/depotIntakeSqlRepositoryAdapterBoundary.static.test.js';
const TASK_DOC = 'docs/task-1909-depot-intake-repository-adapter-injected-db-client.md';
const READINESS_DOC = 'docs/task-1908-depot-workshop-repair-readiness-inspection.md';

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

test('Task1909 allowed files exist', () => {
  for (const file of [ADAPTER_FILE, UNIT_TEST_FILE, BOUNDARY_TEST_FILE, TASK_DOC, READINESS_DOC]) {
    assert.equal(fs.existsSync(absolutePath(file)), true, `${file} should exist`);
  }
});

test('depot intake SQL adapter has no runtime imports or global DB construction', () => {
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

test('depot intake SQL adapter is parameterized and organization scoped', () => {
  const source = read(ADAPTER_FILE);

  for (const phrase of [
    'FROM repair_intake_drafts',
    'id = $1::uuid',
    'organization_id = $2::uuid',
    '($3::uuid IS NULL OR tenant_id = $3::uuid)',
    'safe_summary',
    'safe_metadata',
    'validation_errors_safe',
    'depotWorkshopReadDepotIntakeByDraft',
  ]) {
    assert.equal(source.includes(phrase), true, `missing expected token ${phrase}`);
  }

  assert.doesNotMatch(source, /\$\{/);
  assert.doesNotMatch(source, /text\s*:\s*.*\+/);
  assert.doesNotMatch(source, /values\s*:\s*\[\s*\]/);
});

test('depot intake adapter is read-only for Task1909 and does not invent depot schema', () => {
  const source = read(ADAPTER_FILE);

  for (const forbidden of [
    /\bINSERT\s+INTO\b/i,
    /\bUPDATE\s+\w+\b/i,
    /\bDELETE\s+FROM\b/i,
    /\bALTER\s+TABLE\b/i,
    /\bCREATE\s+TABLE\b/i,
    /repair_items/,
    /repair_receipts/,
    /repair_diagnoses/,
    /repair_quotes/,
    /repair_work_orders/,
    /repair_qc_checks/,
    /repair_returns/,
  ]) {
    assert.doesNotMatch(source, forbidden, `unexpected write/schema token ${forbidden}`);
  }

  assert.match(source, /depot_intake_write_scope_not_approved/);
});

test('depot intake adapter cannot touch completion report customer publication provider AI or billing effects', () => {
  const source = read(ADAPTER_FILE);

  for (const forbidden of [
    /field_service_reports/,
    /completion_reports/,
    /customer_visible_publication/,
    /OPENAI/,
    /LINE_CHANNEL/,
    /R2_/,
    /billing/,
    /stripe/,
    /send(Line|Sms|SMS|Email|Webhook)/,
    /publish\s*\(/,
    /revoke\s*\(/,
  ]) {
    assert.doesNotMatch(source, forbidden, `unexpected boundary token ${forbidden}`);
  }

  for (const forbiddenSanitizerToken of [
    'final_appointment_id',
    'line_user_id',
    'provider_payload',
  ]) {
    assert.equal(source.includes(forbiddenSanitizerToken), true, `sanitizer should reject ${forbiddenSanitizerToken}`);
  }
});

test('Task1909 tests cover synthetic dbClient and sanitized boundaries', () => {
  const unitTest = read(UNIT_TEST_FILE);

  for (const phrase of [
    'createSyntheticDbClient',
    'assertParameterized',
    'read by draft id uses organization-scoped parameterized query and sanitized envelope',
    'subcontractor scope fails closed',
    'write intent is explicitly not approved',
    'client failures and invalid inputs are sanitized',
  ]) {
    assert.match(unitTest, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('Task1909 documentation records no-execution and safety boundaries', () => {
  const doc = read(TASK_DOC);

  for (const phrase of [
    'Task1909',
    'injected dbClient only',
    'Synthetic dbClient unit tests only',
    'No real DB connection',
    'No DATABASE_URL usage',
    'No global pool construction',
    'No app/server import',
    'No migration execution',
    'No runtime start',
    'No smoke',
    'No provider sending',
    'No customer-visible publication behavior',
    'No finalAppointmentId mutation',
    'No Completion Report / Field Service Report creation',
    ADAPTER_FILE,
    UNIT_TEST_FILE,
    BOUNDARY_TEST_FILE,
  ]) {
    assert.equal(doc.includes(phrase), true, `doc should include ${phrase}`);
  }
});
