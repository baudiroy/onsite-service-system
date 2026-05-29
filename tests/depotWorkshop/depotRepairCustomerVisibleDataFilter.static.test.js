'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const FILTER_FILE = 'src/depotWorkshop/depotRepairCustomerVisibleDataFilter.js';
const UNIT_TEST_FILE = 'tests/depotWorkshop/depotRepairCustomerVisibleDataFilter.unit.test.js';
const STATIC_TEST_FILE = 'tests/depotWorkshop/depotRepairCustomerVisibleDataFilter.static.test.js';
const TASK_DOC = 'docs/task-1914-depot-repair-customer-visible-data-filter.md';

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

test('Task1914 allowed files exist', () => {
  for (const file of [FILTER_FILE, UNIT_TEST_FILE, STATIC_TEST_FILE, TASK_DOC]) {
    assert.equal(fs.existsSync(absolutePath(file)), true, `${file} should exist`);
  }
});

test('depot customer-visible filter is pure and imports no runtime dependencies', () => {
  const source = read(FILTER_FILE);

  assert.deepEqual(requireSpecifiers(source), []);

  for (const forbidden of [
    /require\(/,
    /import\s+/,
    /process\.env/,
    /src\/app/,
    /src\/server/,
    /routes\/index/,
    /\bexpress\b/i,
    /\.listen\s*\(/,
    /require\(['"]pg['"]\)/,
    /require\(['"]postgres['"]\)/,
    /\bnew\s+Pool\b/,
    /\bpsql\b/i,
    /db:migrate/i,
    /migrations\//i,
    /\bseed\b/i,
    /\bfetch\s*\(/,
    /axios|got|superagent/i,
  ]) {
    assert.doesNotMatch(source, forbidden, `filter contains forbidden runtime pattern ${forbidden}`);
  }
});

test('depot customer-visible filter defines explicit safe DTO fields only', () => {
  const source = read(FILTER_FILE);

  for (const phrase of [
    'depot_workshop.customer_visible_data_filter',
    'depot_repair_customer_visible',
    'customerRepairReference',
    'workflowType',
    'displayStatus',
    'statusSummary',
    'issueSummary',
    'workSummary',
    'nextCustomerAction',
    'estimatedReadyAt',
    'readyForReturnAt',
    'returnedAt',
    'lastCustomerUpdateAt',
    'supportContactHint',
  ]) {
    assert.equal(source.includes(phrase), true, `missing safe DTO field ${phrase}`);
  }
});

test('depot customer-visible filter cannot publish mutate FSR provider AI billing or DB behavior', () => {
  const source = read(FILTER_FILE);

  for (const forbidden of [
    /send(Line|Sms|SMS|Email|Webhook)/,
    /OPENAI|LINE_CHANNEL|R2_/,
    /createSettlement|runSettlement|stripe/i,
    /createFieldServiceReport|approveFieldServiceReport|publishFieldServiceReport|revokeFieldServiceReport/i,
    /completeAppointment|finalizeAppointment|mutateAppointment/i,
    /createCustomerVisiblePublication|publishCustomerVisible|revokeCustomerVisible/i,
    /publish\s*\(/,
    /revoke\s*\(/,
    /\bINSERT\s+INTO\b/i,
    /\bUPDATE\s+\w+\b/i,
    /\bDELETE\s+FROM\b/i,
    /\bALTER\s+TABLE\b/i,
    /\bCREATE\s+TABLE\b/i,
  ]) {
    assert.doesNotMatch(source, forbidden, `unexpected execution token ${forbidden}`);
  }
});

test('Task1914 tests cover safe DTO forbidden fields and no publication mutation', () => {
  const unitTest = read(UNIT_TEST_FILE);

  for (const phrase of [
    'allowed safe customer-visible DTO shape includes only explicit fields',
    'forbidden fields and nested raw structures are excluded',
    'subcontractor-sensitive fields and raw phone or address values are excluded',
    'filter does not create publication mutation or FSR/finalAppointment behavior',
    'unsafe provider AI billing and secret text in allowed fields is rejected',
  ]) {
    assert.match(unitTest, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('Task1914 documentation records no-execution and safety boundaries', () => {
  const doc = read(TASK_DOC);

  for (const phrase of [
    'Task1914',
    'pure filter',
    'No real DB connection',
    'No migration',
    'No runtime start',
    'No route mount changes',
    'No provider sending',
    'No billing/AI/RAG execution',
    'No appointment lifecycle mutation',
    'No finalAppointmentId mutation',
    'No Completion Report / Field Service Report behavior',
    'No customer-visible depot/workshop publication behavior beyond filtered DTO policy',
    'No subcontractor customer-sensitive data exposure',
    FILTER_FILE,
    UNIT_TEST_FILE,
    STATIC_TEST_FILE,
  ]) {
    assert.equal(doc.includes(phrase), true, `doc should include ${phrase}`);
  }
});
