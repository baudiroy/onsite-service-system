'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const SOURCE_FILE = 'src/saas/usageMeteringBoundary.js';
const UNIT_TEST_FILE = 'tests/saas/usageMeteringBoundary.unit.test.js';
const STATIC_TEST_FILE = 'tests/saas/usageMeteringBoundary.static.test.js';
const TASK_DOC = 'docs/task-1921-usage-metering-boundary-no-billing-provider.md';

function absolutePath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(absolutePath(relativePath), 'utf8');
}

test('Task1921 expected source, tests, and documentation exist', () => {
  for (const file of [SOURCE_FILE, UNIT_TEST_FILE, STATIC_TEST_FILE, TASK_DOC]) {
    assert.equal(fs.existsSync(absolutePath(file)), true, `${file} should exist`);
  }
});

test('usage metering boundary has no DB route runtime migration provider billing provider or secret imports', () => {
  const source = read(SOURCE_FILE);

  for (const forbidden of [
    /require\(/,
    /^import\s/m,
    /process\.env/,
    /DATABASE_URL/,
    /require\(['"]pg['"]\)/,
    /\bnew\s+Pool\b/,
    /\bPool\s*\(/,
    /\bpsql\b/i,
    /db:migrate/i,
    /migrations?\//i,
    /\bseed\b/i,
    /\bexpress\b/i,
    /\bRouter\b/,
    /\blisten\s*\(/,
    /src\/server|src\/app/,
    /\bfetch\s*\(/,
    /axios|got|superagent/i,
    /OPENAI|RAG|LINE_CHANNEL|R2_/,
    /stripe|checkout|payment_method|collectPaymentMethod/i,
    /createInvoice|createPayment|chargeCustomer|subscriptionProvider/i,
    /createFieldServiceReport|approveFieldServiceReport|publishFieldServiceReport|revokeFieldServiceReport/i,
    /finalAppointmentId/,
    /customerVisiblePublication/i,
    /send(Line|Sms|SMS|Email|Webhook)/,
  ]) {
    assert.doesNotMatch(source, forbidden, `source contains forbidden runtime pattern ${forbidden}`);
  }
});

test('usage metering boundary exposes fail-closed reason codes and non-billing markers', () => {
  const source = read(SOURCE_FILE);

  for (const phrase of [
    'usage_metering_event_accepted',
    'usage_metering_organization_required',
    'usage_metering_metric_unknown',
    'usage_metering_quantity_invalid',
    'usage_metering_frontend_only_claim_denied',
    'usage_metering_entitlement_context_required',
    'usage_metering_entitlement_missing',
    'usage_metering_limit_exceeded',
    'internalAccountingOnly: true',
    'invoiceCreated: false',
    'paymentCreated: false',
    'paymentMethodCollected: false',
    'billingProviderCalled: false',
    'server_policy',
  ]) {
    assert.equal(source.includes(phrase), true, `source should include ${phrase}`);
  }
});

test('unit tests cover accepted denied limit and non-billing boundaries', () => {
  const unitTest = read(UNIT_TEST_FILE);

  for (const phrase of [
    'accepted synthetic usage event',
    'unknown metric fails closed',
    'negative and non-integer usage quantities fail closed',
    'frontend-only usage claim is denied',
    'missing entitlement context and missing required entitlement fail closed',
    'usage above server-side entitlement limit is denied',
    'usage meter remains separate from billing contact',
  ]) {
    assert.equal(unitTest.includes(phrase), true, `unit test should include ${phrase}`);
  }
});

test('Task1921 documentation records no DB provider billing AI route smoke deployment or publication scope', () => {
  const doc = read(TASK_DOC);

  for (const phrase of [
    'Task1921',
    'usage metering boundary',
    'No DB connection',
    'No migration',
    'No route mount',
    'No runtime server start',
    'No billing provider',
    'No invoice',
    'No payment',
    'No SaaS/billing smoke',
    'No Zeabur',
    'No provider sending',
    'No AI/RAG provider execution',
    'No Completion Report / Field Service Report behavior',
    'No finalAppointmentId mutation',
    'No customer-visible publication behavior',
    SOURCE_FILE,
    UNIT_TEST_FILE,
    STATIC_TEST_FILE,
  ]) {
    assert.equal(doc.includes(phrase), true, `doc should include ${phrase}`);
  }
});
