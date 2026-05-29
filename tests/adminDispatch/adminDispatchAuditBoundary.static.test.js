'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const BOUNDARY_FILE = 'src/guards/AdminDispatchAuditBoundary.js';
const UNIT_TEST_FILE = 'tests/adminDispatch/adminDispatchAuditBoundary.unit.test.js';
const STATIC_TEST_FILE = 'tests/adminDispatch/adminDispatchAuditBoundary.static.test.js';
const TASK_DOC = 'docs/task-1904-admin-operations-audit-log-boundary.md';

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

function sourceWithoutForbiddenAuditInputList(source) {
  return source.replace(
    /const FORBIDDEN_AUDIT_INPUT_KEYS = new Set\(\[[\s\S]*?\]\);\n\n/,
    'const FORBIDDEN_AUDIT_INPUT_KEYS = new Set([]);\n\n',
  );
}

test('Task1904 allowed files exist', () => {
  for (const file of [BOUNDARY_FILE, UNIT_TEST_FILE, STATIC_TEST_FILE, TASK_DOC]) {
    assert.equal(fs.existsSync(absolutePath(file)), true, `${file} should exist`);
  }
});

test('admin dispatch audit boundary is injected-writer-only and has no runtime imports', () => {
  const source = sourceWithoutForbiddenAuditInputList(read(BOUNDARY_FILE));

  assert.deepEqual(requireSpecifiers(read(BOUNDARY_FILE)), []);

  for (const pattern of [
    /require\(['"]pg['"]\)/,
    /require\(['"]postgres['"]\)/,
    /repositories?\//i,
    /BaseRepository/,
    /DATABASE_URL/,
    /process\.env/,
    /src\/app/,
    /src\/server/,
    /routes?\//i,
    /\bexpress\b/i,
    /\.listen\s*\(/,
    /withTransaction/,
    /db:migrate/i,
    /\bpsql\b/i,
    /migrations\//i,
    /\bseed\b/i,
    /fetch\(/,
    /axios/,
  ]) {
    assert.doesNotMatch(source, pattern, `audit boundary contains forbidden runtime pattern ${pattern}`);
  }
});

test('admin dispatch audit boundary includes only safe audit metadata fields', () => {
  const source = read(BOUNDARY_FILE);

  for (const phrase of [
    'eventKind',
    'action',
    'organizationId',
    'assignmentId',
    'appointmentId',
    'caseId',
    'adminActorId',
    'dispatcherActorId',
    'requestId',
    'permissionDecision',
    'assignmentIntentStatus',
    'transitionIntentStatus',
    'occurredAt',
    'internalOnly',
    'customerVisible',
    'auditWriter',
  ]) {
    assert.equal(source.includes(phrase), true, `missing expected audit token ${phrase}`);
  }
});

test('admin dispatch audit boundary keeps forbidden side-effect tokens only in deny-list', () => {
  const source = sourceWithoutForbiddenAuditInputList(read(BOUNDARY_FILE));

  for (const forbidden of [
    'rawDbRow',
    'rawCustomerData',
    'rawPhone',
    'rawAddress',
    'providerPayload',
    'DATABASE_URL',
    'JWT_SECRET',
    'stack',
    'sql',
    'billingInternals',
    'aiProviderOutput',
    'completionReport',
    'fieldServiceReport',
    'finalAppointmentId',
    'customerVisibleReportBody',
    'field_service_reports',
    'completion_reports',
    'provider_payload',
    'OPENAI',
    'LINE_CHANNEL',
    'R2_',
    'stripe',
  ]) {
    assert.equal(source.includes(forbidden), false, `unexpected audit boundary token ${forbidden}`);
  }
});

test('Task1904 doc records audit boundary and safety constraints', () => {
  const doc = read(TASK_DOC);

  for (const phrase of [
    'Task1904',
    'Injected audit writer',
    'internal-only',
    'sanitized',
    'No real DB connection',
    'No DATABASE_URL usage',
    'No migration execution',
    'No runtime start',
    'No provider sending',
    'No Completion Report / Field Service Report creation',
    'No finalAppointmentId mutation',
    'No customer-visible publication behavior',
    BOUNDARY_FILE,
    UNIT_TEST_FILE,
    STATIC_TEST_FILE,
  ]) {
    assert.equal(doc.includes(phrase), true, `doc should include ${phrase}`);
  }
});
