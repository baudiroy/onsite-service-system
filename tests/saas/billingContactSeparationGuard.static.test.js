'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const SOURCE_FILE = 'src/saas/billingContactSeparationGuard.js';
const UNIT_TEST_FILE = 'tests/saas/billingContactSeparationGuard.unit.test.js';
const STATIC_TEST_FILE = 'tests/saas/billingContactSeparationGuard.static.test.js';
const TASK_DOC = 'docs/task-1923-billing-contact-separation-guard.md';

function absolutePath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(absolutePath(relativePath), 'utf8');
}

test('Task1923 expected source, tests, and documentation exist', () => {
  for (const file of [SOURCE_FILE, UNIT_TEST_FILE, STATIC_TEST_FILE, TASK_DOC]) {
    assert.equal(fs.existsSync(absolutePath(file)), true, `${file} should exist`);
  }
});

test('billing contact separation guard has no DB route runtime migration provider billing provider or secret imports', () => {
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

test('billing contact separation guard exposes fail-closed reason codes and non-billing markers', () => {
  const source = read(SOURCE_FILE);

  for (const phrase of [
    'billing_contact_separation_allowed',
    'billing_contact_organization_required',
    'billing_contact_context_required',
    'billing_contact_type_unsupported',
    'billing_contact_frontend_only_claim_denied',
    'billing_contact_role_conflation_denied',
    'billing_contact_raw_unverified_payload_denied',
    'billing_contact_consent_required',
    'billing_contact_verification_required',
    'billing_metadata_only',
    'paymentAuthority: false',
    'loginIdentityCreated: false',
    'customerIdentityAssigned: false',
    'reporterIdentityAssigned: false',
    'entitlementOwnerAssigned: false',
    'invoiceCreated: false',
    'paymentCreated: false',
    'billingProviderCalled: false',
  ]) {
    assert.equal(source.includes(phrase), true, `source should include ${phrase}`);
  }
});

test('unit tests cover role separation role conflation raw payload and non-billing boundaries', () => {
  const unitTest = read(UNIT_TEST_FILE);

  for (const phrase of [
    'billing contact remains distinct from customer reporter on-site admin and owner roles',
    'same person represented in multiple roles is allowed without role conflation',
    'missing and unsupported billing contact context fail closed',
    'frontend-only billing contact claim and role conflation are denied',
    'raw phone address and provider payload are excluded',
    'raw unverified contact payload and missing consent or verification fail closed',
  ]) {
    assert.equal(unitTest.includes(phrase), true, `unit test should include ${phrase}`);
  }
});

test('Task1923 documentation records no DB provider billing AI route smoke deployment or publication scope', () => {
  const doc = read(TASK_DOC);

  for (const phrase of [
    'Task1923',
    'Billing Contact Separation Guard',
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
