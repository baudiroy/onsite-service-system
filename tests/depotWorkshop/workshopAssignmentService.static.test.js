'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const SERVICE_FILE = 'src/services/WorkshopAssignmentService.js';
const UNIT_TEST_FILE = 'tests/depotWorkshop/workshopAssignmentService.unit.test.js';
const STATIC_TEST_FILE = 'tests/depotWorkshop/workshopAssignmentService.static.test.js';
const TASK_DOC = 'docs/task-1911-workshop-assignment-service.md';

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

test('Task1911 allowed files exist', () => {
  for (const file of [SERVICE_FILE, UNIT_TEST_FILE, STATIC_TEST_FILE, TASK_DOC]) {
    assert.equal(fs.existsSync(absolutePath(file)), true, `${file} should exist`);
  }
});

test('workshop assignment service uses injected dependencies only', () => {
  const source = read(SERVICE_FILE);

  assert.deepEqual(requireSpecifiers(source), []);

  for (const pattern of [
    /require\(['"]pg['"]\)/,
    /require\(['"]postgres['"]\)/,
    /\bnew\s+Pool\b/,
    /\bPool\s*\(/,
    /process\.env\.DATABASE_URL/,
    /DATABASE_URL\s*[=+]/,
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
    assert.doesNotMatch(source, pattern, `service contains forbidden runtime pattern ${pattern}`);
  }

  assert.match(source, /depotIntakeRepository/);
  assert.match(source, /findDepotIntakeState/);
});

test('workshop assignment service is prepare-only and does not invent write schema', () => {
  const source = read(SERVICE_FILE);

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

  assert.match(source, /workshop_assignment_write_scope_not_approved/);
  assert.match(source, /written:\s*false/);
});

test('workshop assignment service guards org provider subcontractor and data minimization boundaries', () => {
  const source = read(SERVICE_FILE);

  for (const phrase of [
    'organizationId',
    'tenantId',
    'brandId',
    'serviceProviderId',
    'subcontractorOrganizationId',
    'workshop_assignment_subcontractor_scope_required',
    'workshop_assignment_depot_status_ineligible',
    'depot_intake_not_found_or_denied',
    'workshop_assignment_payload_forbidden_fields',
  ]) {
    assert.equal(source.includes(phrase), true, `missing expected boundary phrase ${phrase}`);
  }

  for (const deniedToken of [
    'customerPhone',
    'customerName',
    'address',
    'providerPayload',
    'token',
    'secret',
    'completionReport',
    'fieldServiceReport',
    'finalAppointmentId',
    'customerVisiblePublication',
    'billingInternals',
    'aiOutput',
  ]) {
    assert.equal(source.includes(deniedToken), true, `missing denied token ${deniedToken}`);
  }
});

test('workshop assignment service has no provider AI billing publication or FSR execution calls', () => {
  const source = read(SERVICE_FILE);

  for (const forbidden of [
    /send(Line|Sms|SMS|Email|Webhook)/,
    /OPENAI|LINE_CHANNEL|R2_/,
    /createSettlement|runSettlement|stripe/i,
    /createFieldServiceReport|approveFieldServiceReport|publishFieldServiceReport|revokeFieldServiceReport/i,
    /completeAppointment|finalizeAppointment/i,
    /publish\s*\(/,
    /revoke\s*\(/,
  ]) {
    assert.doesNotMatch(source, forbidden, `unexpected execution token ${forbidden}`);
  }
});

test('Task1911 tests cover assignment allow/deny and sanitized boundaries', () => {
  const unitTest = read(UNIT_TEST_FILE);

  for (const phrase of [
    'synthetic assignment intent allow path returns sanitized prepared envelope',
    'missing dependency and missing depot intake fail safely',
    'organization brand and service-provider mismatch fail closed',
    'invalid depot status and workflow are denied before assignment intent',
    'subcontractor scope denied unless explicit assignment relationship exists',
    'invalid command and forbidden write or unsafe payload fail before repository read',
    'repository failure is sanitized',
  ]) {
    assert.match(unitTest, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('Task1911 documentation records no-execution and safety boundaries', () => {
  const doc = read(TASK_DOC);

  for (const phrase of [
    'Task1911',
    'injected dependencies only',
    'No real DB connection',
    'No route mount',
    'No migration',
    'No smoke',
    'No provider sending',
    'No billing/AI/RAG execution',
    'No finalAppointmentId mutation',
    'No Completion Report / Field Service Report creation',
    'No customer-visible depot/workshop publication behavior',
    'No subcontractor customer-sensitive data exposure',
    SERVICE_FILE,
    UNIT_TEST_FILE,
    STATIC_TEST_FILE,
  ]) {
    assert.equal(doc.includes(phrase), true, `doc should include ${phrase}`);
  }
});
