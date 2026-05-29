'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const SOURCE_FILE = 'src/saas/trialLimitGuard.js';
const UNIT_TEST_FILE = 'tests/saas/trialLimitGuard.unit.test.js';
const STATIC_TEST_FILE = 'tests/saas/trialLimitGuard.static.test.js';
const TASK_DOC = 'docs/task-1922-trial-limit-guard.md';

function absolutePath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(absolutePath(relativePath), 'utf8');
}

test('Task1922 expected source, tests, and documentation exist', () => {
  for (const file of [SOURCE_FILE, UNIT_TEST_FILE, STATIC_TEST_FILE, TASK_DOC]) {
    assert.equal(fs.existsSync(absolutePath(file)), true, `${file} should exist`);
  }
});

test('trial limit guard has no DB route runtime migration provider billing provider or secret imports', () => {
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

test('trial limit guard exposes fail-closed reason codes and non-billing markers', () => {
  const source = read(SOURCE_FILE);

  for (const phrase of [
    'trial_limit_allowed',
    'trial_limit_not_applicable_paid_plan',
    'trial_limit_organization_required',
    'trial_limit_trial_state_required',
    'trial_limit_trial_state_ambiguous',
    'trial_limit_expired',
    'trial_limit_organization_inactive',
    'trial_limit_entitlement_missing',
    'trial_limit_usage_input_required',
    'trial_limit_limit_required',
    'trial_limit_exceeded',
    'trial_limit_frontend_only_trial_flag_denied',
    'internalTrialLimitOnly: true',
    'invoiceCreated: false',
    'paymentCreated: false',
    'paymentMethodCollected: false',
    'billingProviderCalled: false',
    'server_policy',
  ]) {
    assert.equal(source.includes(phrase), true, `source should include ${phrase}`);
  }
});

test('unit tests cover trial allowance denial paid-plan and billing-contact boundaries', () => {
  const unitTest = read(UNIT_TEST_FILE);

  for (const phrase of [
    'trial active under server-side limit allows',
    'trial over limit denies',
    'trial expired and ambiguous states deny',
    'disabled and suspended organizations deny',
    'missing usage input fails closed',
    'missing entitlement and frontend-only trial flags fail closed',
    'paid plan is not incorrectly treated as trial',
    'billingContactRef remains metadata',
  ]) {
    assert.equal(unitTest.includes(phrase), true, `unit test should include ${phrase}`);
  }
});

test('Task1922 documentation records no DB provider billing AI route smoke deployment or publication scope', () => {
  const doc = read(TASK_DOC);

  for (const phrase of [
    'Task1922',
    'Trial Limit Guard',
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
