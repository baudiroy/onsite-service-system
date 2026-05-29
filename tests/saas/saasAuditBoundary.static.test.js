'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const SOURCE_FILE = 'src/saas/saasAuditBoundary.js';
const UNIT_TEST_FILE = 'tests/saas/saasAuditBoundary.unit.test.js';
const STATIC_TEST_FILE = 'tests/saas/saasAuditBoundary.static.test.js';
const TASK_DOC = 'docs/task-1925-saas-audit-log-boundary.md';

function absolutePath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(absolutePath(relativePath), 'utf8');
}

test('Task1925 expected source, tests, and documentation exist', () => {
  for (const file of [SOURCE_FILE, UNIT_TEST_FILE, STATIC_TEST_FILE, TASK_DOC]) {
    assert.equal(fs.existsSync(absolutePath(file)), true, `${file} should exist`);
  }
});

test('SaaS audit boundary has no DB route runtime migration provider billing provider or secret imports', () => {
  const source = read(SOURCE_FILE);

  for (const forbidden of [
    /require\(/,
    /^import\s/m,
    /process\.env/,
    /DATABASE_URL/,
    /JWT_SECRET/,
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

test('SaaS audit boundary exposes internal-only and non-execution markers', () => {
  const source = read(SOURCE_FILE);

  for (const phrase of [
    'saas_audit_event_built',
    'saas_audit_event_written',
    'saas_audit_writer_required',
    'saas_audit_writer_failed',
    'internal_only',
    'customerVisible: false',
    'invoiceCreated: false',
    'paymentCreated: false',
    'paymentMethodCollected: false',
    'billingProviderCalled: false',
    'organizationBillingStateMutated: false',
    'providerSendTriggered: false',
    'writerFailureSanitized',
  ]) {
    assert.equal(source.includes(phrase), true, `source should include ${phrase}`);
  }
});

test('unit tests cover build write failure forbidden-fields and non-customer-visible boundaries', () => {
  const unitTest = read(UNIT_TEST_FILE);

  for (const phrase of [
    'builds entitlement allow audit event with sanitized internal-only metadata',
    'writes denied suspended and limit-exceeded audit metadata with synthetic writer',
    'audit writer failure is sanitized',
    'forbidden fields are excluded from audit event output',
    'customerVisible',
    'organizationBillingStateMutated',
    'providerSendTriggered',
  ]) {
    assert.equal(unitTest.includes(phrase), true, `unit test should include ${phrase}`);
  }
});

test('Task1925 documentation records no DB provider billing AI route smoke deployment or publication scope', () => {
  const doc = read(TASK_DOC);

  for (const phrase of [
    'Task1925',
    'SaaS Audit Log Boundary',
    'No DB connection',
    'No migration',
    'No route mount',
    'No runtime server start',
    'No billing provider',
    'No invoice',
    'No payment',
    'No SaaS/admin/billing smoke',
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
