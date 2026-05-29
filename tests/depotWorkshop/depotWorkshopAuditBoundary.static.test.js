'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const AUDIT_FILE = 'src/depotWorkshop/depotWorkshopAuditBoundary.js';
const UNIT_TEST_FILE = 'tests/depotWorkshop/depotWorkshopAuditBoundary.unit.test.js';
const STATIC_TEST_FILE = 'tests/depotWorkshop/depotWorkshopAuditBoundary.static.test.js';
const TASK_DOC = 'docs/task-1915-depot-workshop-audit-log-boundary.md';

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

test('Task1915 allowed files exist', () => {
  for (const file of [AUDIT_FILE, UNIT_TEST_FILE, STATIC_TEST_FILE, TASK_DOC]) {
    assert.equal(fs.existsSync(absolutePath(file)), true, `${file} should exist`);
  }
});

test('depot workshop audit boundary is injected and imports no runtime dependencies', () => {
  const source = read(AUDIT_FILE);

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
    assert.doesNotMatch(source, forbidden, `audit boundary contains forbidden runtime pattern ${forbidden}`);
  }
});

test('depot workshop audit boundary defines safe internal-only metadata', () => {
  const source = read(AUDIT_FILE);

  for (const phrase of [
    'depot_workshop.audit_boundary',
    'depot_workshop.audit_event',
    'internalOnly',
    'customerVisible',
    'actionType',
    'organizationId',
    'depotIntakeId',
    'depotRepairId',
    'brandId',
    'serviceProviderId',
    'subcontractorId',
    'actorId',
    'requestId',
    'accessDecision',
    'permissionDecision',
    'routeDecision',
    'occurredAt',
    'depot_workshop_audit_writer_failed',
  ]) {
    assert.equal(source.includes(phrase), true, `missing audit phrase ${phrase}`);
  }
});

test('depot workshop audit boundary denies forbidden payload fields', () => {
  const source = read(AUDIT_FILE);

  for (const deniedToken of [
    'rawDbRow',
    'rawCustomerData',
    'customerPhone',
    'rawPhone',
    'rawAddress',
    'providerPayload',
    'DATABASE_URL',
    'JWT_SECRET',
    'billingInternals',
    'aiOutput',
    'completionReport',
    'fieldServiceReport',
    'finalAppointmentId',
    'customerVisibleReportBody',
  ]) {
    assert.equal(source.includes(deniedToken), true, `missing denied token ${deniedToken}`);
  }
});

test('depot workshop audit boundary cannot execute DB provider AI billing publication or FSR behavior', () => {
  const source = read(AUDIT_FILE);

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

test('Task1915 tests cover writer allow failure forbidden and internal-only audit behavior', () => {
  const unitTest = read(UNIT_TEST_FILE);

  for (const phrase of [
    'builds sanitized internal-only depot workshop audit event',
    'records audit event through injected synthetic writer',
    'denied access audit metadata is supported and remains internal-only',
    'audit writer failure is sanitized',
    'forbidden fields fail closed before writer and are never customer-visible',
    'missing writer and required metadata fail safely',
  ]) {
    assert.match(unitTest, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('Task1915 documentation records no-execution and safety boundaries', () => {
  const doc = read(TASK_DOC);

  for (const phrase of [
    'Task1915',
    'injected audit writer',
    'internal-only',
    'No real DB connection',
    'No migration',
    'No runtime start',
    'No depot/workshop smoke',
    'No provider sending',
    'No billing/AI/RAG execution',
    'No depot/workshop record mutation',
    'No appointment lifecycle mutation',
    'No finalAppointmentId mutation',
    'No Completion Report / Field Service Report behavior',
    'No customer-visible depot/workshop publication behavior beyond filtered DTO policy',
    'No subcontractor customer-sensitive data exposure',
    AUDIT_FILE,
    UNIT_TEST_FILE,
    STATIC_TEST_FILE,
  ]) {
    assert.equal(doc.includes(phrase), true, `doc should include ${phrase}`);
  }
});
