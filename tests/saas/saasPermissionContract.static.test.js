'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const SOURCE_FILE = 'src/saas/saasPermissionContract.js';
const UNIT_TEST_FILE = 'tests/saas/saasPermissionContract.unit.test.js';
const STATIC_TEST_FILE = 'tests/saas/saasPermissionContract.static.test.js';
const TASK_DOC = 'docs/task-1924-saas-permission-contract-hardening.md';

function absolutePath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(absolutePath(relativePath), 'utf8');
}

test('Task1924 expected source, tests, and documentation exist', () => {
  for (const file of [SOURCE_FILE, UNIT_TEST_FILE, STATIC_TEST_FILE, TASK_DOC]) {
    assert.equal(fs.existsSync(absolutePath(file)), true, `${file} should exist`);
  }
});

test('SaaS permission contract has no DB route runtime migration provider billing provider or secret imports', () => {
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

test('SaaS permission contract exposes fail-closed reason codes and non-billing markers', () => {
  const source = read(SOURCE_FILE);

  for (const phrase of [
    'saas_permission_contract_allowed',
    'saas_permission_organization_required',
    'saas_permission_organization_isolation_required',
    'saas_permission_organization_mismatch',
    'saas_permission_organization_inactive',
    'saas_permission_context_required',
    'saas_permission_missing',
    'saas_entitlement_context_required',
    'saas_entitlement_missing',
    'saas_entitlement_frontend_only_denied',
    'saas_permission_billing_contact_actor_denied',
    'saas_permission_customer_reporter_billing_authority_denied',
    'saas_permission_usage_meter_cannot_authorize',
    'requiredBeforeEntitlement: true',
    "source: 'server_policy'",
    'usageMeterCannotAuthorize: true',
    'invoiceCreated: false',
    'paymentCreated: false',
    'billingProviderCalled: false',
  ]) {
    assert.equal(source.includes(phrase), true, `source should include ${phrase}`);
  }
});

test('unit tests cover permission entitlement frontend org billing actor and usage-only boundaries', () => {
  const unitTest = read(UNIT_TEST_FILE);

  for (const phrase of [
    'permission and entitlement are both required after organization isolation',
    'entitlement alone is denied when permission is missing',
    'permission alone is denied when entitlement is missing',
    'frontend-only entitlement is denied',
    'billing contact cannot act as admin permission actor',
    'customer and reporter cannot act as billing authority',
    'organization mismatch and missing isolation fail before entitlement or usage checks',
    'usage meter cannot authorize features by itself',
    'suspended and disabled organization statuses fail closed',
  ]) {
    assert.equal(unitTest.includes(phrase), true, `unit test should include ${phrase}`);
  }
});

test('Task1924 documentation records no DB provider billing AI route smoke deployment or publication scope', () => {
  const doc = read(TASK_DOC);

  for (const phrase of [
    'Task1924',
    'SaaS Permission Contract Hardening',
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
