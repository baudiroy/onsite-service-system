'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const SOURCE_FILE = 'src/saas/organizationEntitlementModel.js';
const UNIT_TEST_FILE = 'tests/saas/organizationEntitlementModel.unit.test.js';
const STATIC_TEST_FILE = 'tests/saas/organizationEntitlementModel.static.test.js';
const TASK_DOC = 'docs/task-1920-organization-plan-entitlement-runtime-model.md';

function absolutePath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(absolutePath(relativePath), 'utf8');
}

test('Task1920 expected source, tests, and documentation exist', () => {
  for (const file of [SOURCE_FILE, UNIT_TEST_FILE, STATIC_TEST_FILE, TASK_DOC]) {
    assert.equal(fs.existsSync(absolutePath(file)), true, `${file} should exist`);
  }
});

test('organization entitlement model has no DB route runtime migration provider or secret imports', () => {
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

test('organization entitlement model exposes fail-closed reason codes and server policy source', () => {
  const source = read(SOURCE_FILE);

  for (const phrase of [
    'organization_id_required',
    'organization_plan_unknown',
    'organization_plan_inactive',
    'organization_trial_ambiguous',
    'organization_trial_expired',
    'organization_entitlement_frontend_only_denied',
    'organization_entitlement_missing',
    'server_policy',
    'billing_contact_ref',
    'invoiceCreated: false',
    'paymentCreated: false',
  ]) {
    assert.equal(source.includes(phrase), true, `source should include ${phrase}`);
  }
});

test('unit tests cover allowed denied billing-contact usage-meter and frontend-only boundaries', () => {
  const unitTest = read(UNIT_TEST_FILE);

  for (const phrase of [
    'allowed paid plan entitlement',
    'trial path allows active trial and denies expired trial',
    'ambiguous trial state fails closed',
    'disabled and suspended status fail closed',
    'missing organization and unknown plan fail closed',
    'missing required entitlement is denied',
    'frontend-only entitlement signal is denied',
    'billingContactRef remains metadata',
    'usage meter metadata does not become invoice or payment behavior',
  ]) {
    assert.equal(unitTest.includes(phrase), true, `unit test should include ${phrase}`);
  }
});

test('Task1920 documentation records no DB provider billing AI route smoke deployment or publication scope', () => {
  const doc = read(TASK_DOC);

  for (const phrase of [
    'Task1920',
    'pure organization entitlement runtime model',
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
