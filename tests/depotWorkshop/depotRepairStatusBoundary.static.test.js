'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const BOUNDARY_FILE = 'src/guards/DepotRepairStatusBoundary.js';
const UNIT_TEST_FILE = 'tests/depotWorkshop/depotRepairStatusBoundary.unit.test.js';
const STATIC_TEST_FILE = 'tests/depotWorkshop/depotRepairStatusBoundary.static.test.js';
const TASK_DOC = 'docs/task-1910-depot-repair-status-model-runtime-boundary.md';

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

test('Task1910 allowed files exist', () => {
  for (const file of [BOUNDARY_FILE, UNIT_TEST_FILE, STATIC_TEST_FILE, TASK_DOC]) {
    assert.equal(fs.existsSync(absolutePath(file)), true, `${file} should exist`);
  }
});

test('depot repair status boundary is pure and has no runtime imports', () => {
  const source = read(BOUNDARY_FILE);

  assert.deepEqual(requireSpecifiers(source), []);

  for (const pattern of [
    /require\(['"]pg['"]\)/,
    /require\(['"]postgres['"]\)/,
    /\bnew\s+Pool\b/,
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
    /\bfetch\s*\(/,
    /axios|got|superagent/i,
  ]) {
    assert.doesNotMatch(source, pattern, `boundary contains forbidden runtime pattern ${pattern}`);
  }
});

test('depot repair status boundary defines explicit lifecycle without onsite completion mapping', () => {
  const source = read(BOUNDARY_FILE);

  for (const status of [
    'intake_received',
    'diagnosis_pending',
    'diagnosis_completed',
    'quote_pending',
    'quote_approved',
    'repair_in_progress',
    'quality_check',
    'ready_for_return',
    'returned',
    'cancelled',
    'closed',
  ]) {
    assert.equal(source.includes(status), true, `missing depot status ${status}`);
  }

  for (const forbidden of [
    /appointmentStatus\s*=/,
    /appointment_status\s*=/,
    /caseStatus\s*=/,
    /case_status\s*=/,
    /completeAppointment/i,
    /createFieldServiceReport/i,
    /publish\s*\(/,
    /revoke\s*\(/,
  ]) {
    assert.doesNotMatch(source, forbidden, `unexpected completion/publication token ${forbidden}`);
  }
});

test('forbidden FSR finalAppointment provider AI billing tokens are used only as denial keys', () => {
  const source = read(BOUNDARY_FILE);

  for (const deniedToken of [
    'finalAppointmentId',
    'final_appointment_id',
    'fieldServiceReport',
    'field_service_report',
    'completionReport',
    'completion_report',
    'customerVisiblePublication',
    'customer_visible_publication',
    'providerPayload',
    'provider_payload',
    'billingInternals',
    'aiProviderOutput',
  ]) {
    assert.equal(source.includes(deniedToken), true, `missing denied token ${deniedToken}`);
  }

  assert.match(source, /FORBIDDEN_MUTATION_KEYS/);
  assert.doesNotMatch(source, /send(Line|Sms|SMS|Email|Webhook)/);
  assert.doesNotMatch(source, /OPENAI|LINE_CHANNEL|R2_|stripe|createSettlement|runSettlement/);
});

test('Task1910 tests cover valid invalid closed missing context and forbidden mutation behavior', () => {
  const unitTest = read(UNIT_TEST_FILE);

  for (const phrase of [
    'valid synthetic depot status transition returns bounded transition intent',
    'unknown and unsupported statuses fail closed',
    'invalid transition and closed/finalized state fail closed',
    'missing actor organization and mismatched workflow or organization fail closed',
    'forbidden mutation intent cannot map depot state into FSR completion provider AI billing or publication fields',
  ]) {
    assert.match(unitTest, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('Task1910 documentation records no-execution and safety boundaries', () => {
  const doc = read(TASK_DOC);

  for (const phrase of [
    'Task1910',
    'pure status boundary',
    'No real DB connection',
    'No migration',
    'No runtime start',
    'No route mount',
    'No customer-visible publication behavior',
    'No provider sending',
    'No billing/AI/RAG execution',
    'No finalAppointmentId mutation',
    'No Completion Report / Field Service Report creation',
    BOUNDARY_FILE,
    UNIT_TEST_FILE,
    STATIC_TEST_FILE,
  ]) {
    assert.equal(doc.includes(phrase), true, `doc should include ${phrase}`);
  }
});
