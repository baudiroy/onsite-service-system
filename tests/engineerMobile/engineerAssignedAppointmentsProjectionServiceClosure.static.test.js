'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const SERVICE_FILE = 'src/engineerMobile/engineerAssignedAppointmentsProjectionService.js';
const UNIT_TEST_FILE = 'tests/engineerMobile/engineerAssignedAppointmentsProjectionService.unit.test.js';
const TASK_DOC = 'docs/task-921-engineer-mobile-read-only-assigned-appointments-projection-injected-db-client-no-route-no-migration.md';

const forbiddenDependencyPattern = /require\(['"][^'"]*(db|pool|repositories?|transaction|routes?|controllers?|app|server|listen|bootstrap|auth|session|jwt|provider|line|sms|email|push|webhook|openai|ai|rag|vector|search|billing|settlement|env|config|credential|logger|network|smoke|migration)[^'"]*['"]\)/i;
const forbiddenMutationPattern = /\binsert\s+into\b|\bupdate\s+\w+\s+set\b|\bdelete\s+from\b|\bdrop\s+table\b|\balter\s+table\b|\.insert\s*\(|\.update\s*\(|\.delete\s*\(|createFieldServiceReport|createAppointment|updateAppointment|updateCase|finalAppointmentId\s*=/i;

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(path.join(repoRoot, relativePath));
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

test('Task921 source test and doc files exist', () => {
  assert.equal(exists(SERVICE_FILE), true);
  assert.equal(exists(UNIT_TEST_FILE), true);
  assert.equal(exists(TASK_DOC), true);
});

test('projection service has no runtime side-effect imports or forbidden dependencies', () => {
  const source = read(SERVICE_FILE);

  assert.deepEqual(requireSpecifiers(source), ['./engineerPreDepartureActionEligibility']);
  assert.doesNotMatch(source, forbiddenDependencyPattern);
  assert.doesNotMatch(source, /process\.env|console\.|fetch\(|axios|http\.request|https\.request/);
});

test('projection service remains read-only and has no mutation execution path', () => {
  const source = read(SERVICE_FILE);

  assert.match(source, /readOnly: true/);
  assert.match(source, /select appointment_id/);
  assert.match(source, /dbClient\.query/);
  assert.doesNotMatch(source, forbiddenMutationPattern);
});

test('projection allowlist excludes forbidden sensitive and internal fields', () => {
  const source = read(SERVICE_FILE);
  const mapperStart = source.indexOf('function mapAppointmentProjection');
  const mapperEnd = source.indexOf('function sortAppointment');
  const mapperSource = source.slice(mapperStart, mapperEnd);
  const forbiddenOutputFields = [
    'phone',
    'mobile',
    'tel',
    'address',
    'line_user_id',
    'lineUserId',
    'providerRawPayload',
    'token',
    'secret',
    'internalNote',
    'dispatcherNote',
    'technicianPrivateNote',
    'billingInternal',
    'settlementInternal',
    'aiRawPayload',
    'finalAppointmentId',
    'fieldServiceReportId',
    'completionReportId',
    'rawCasePayload',
    'rawAppointmentPayload',
    'rawReportPayload',
    'sql',
    'stack',
    'connectionString',
    'dbUrl',
  ];

  for (const field of forbiddenOutputFields) {
    assert.equal(
      mapperSource.includes(field),
      false,
      `mapAppointmentProjection must not expose ${field}`,
    );
  }
});

test('unit coverage locks safe deny, scoping, redaction, and synthetic db boundaries', () => {
  const source = read(UNIT_TEST_FILE);

  assert.match(source, /missing dbClient fails closed/);
  assert.match(source, /missing engineerContext fails closed/);
  assert.match(source, /missing organizationId fails closed/);
  assert.match(source, /missing engineerId fails closed/);
  assert.match(source, /unauthorized engineer context fails closed/);
  assert.match(source, /organization mismatch rows are excluded/);
  assert.match(source, /non-assigned engineer rows are excluded/);
  assert.match(source, /query error returns generic safe deny without raw error leakage/);
  assert.match(source, /valid authorized context returns allowlisted appointment projections/);
  assert.match(source, /read-only through injected synthetic dbClient query only/);
  assert.match(source, /input context and row objects are not mutated/);
  assert.match(source, /nested_phone_should_not_leak/);
  assert.match(source, /insert\(\)/);
  assert.match(source, /update\(\)/);
  assert.match(source, /delete\(\)/);
});

test('Task921 evidence doc records PM boundaries and no route no migration scope', () => {
  const doc = read(TASK_DOC);

  assert.match(doc, /Injected DB Client/);
  assert.match(doc, /No Route/);
  assert.match(doc, /No Migration/);
  assert.match(doc, /No real DB connection/);
  assert.match(doc, /No provider sending/);
  assert.match(doc, /No AI\/RAG/);
  assert.match(doc, /No billing\/settlement/);
  assert.match(doc, /No `admin\/src\/`|No admin\/src/);
  assert.match(doc, /No smoke\/shared runtime/);
});
