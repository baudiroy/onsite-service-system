'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const MOUNT_FILE = 'src/customerAccess/customerAccessInternalTestRouteMount.js';
const ADAPTER_FILE = 'src/customerAccess/customerServiceReportProjectionAppAdapter.js';
const UNIT_TEST_FILE = 'tests/customerAccess/customerAccessInternalTestRouteMount.unit.test.js';
const CLOSURE_TEST_FILE = 'tests/customerAccess/customerAccessInternalTestRouteMountClosure.static.test.js';
const TASK_DOC = 'docs/task-918-customer-access-internal-test-route-mount-synthetic-app-only-no-public-route-no-real-db.md';
const ALLOWED_ADAPTER_SPECIFIER = './customerServiceReportProjectionAppAdapter';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function exists(file) {
  return fs.existsSync(path.join(repoRoot, file));
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

test('Task918 source test and doc files exist', () => {
  for (const file of [MOUNT_FILE, ADAPTER_FILE, UNIT_TEST_FILE, CLOSURE_TEST_FILE, TASK_DOC]) {
    assert.equal(exists(file), true, `${file} should exist`);
  }
});

test('internal test mount delegates only to Task914 adapter', () => {
  const source = read(MOUNT_FILE);

  assert.deepEqual(requireSpecifiers(source), ['./customerServiceReportProjectionAppAdapter']);
  assert.match(source, /registerCustomerServiceReportProjectionRoute/);
  assert.match(source, /DEFAULT_INTERNAL_PROJECTION_PATH/);
});

test('internal test mount source imports no forbidden runtime dependencies', () => {
  const source = read(MOUNT_FILE);

  for (const specifier of requireSpecifiers(source).filter((specifier) => specifier !== ALLOWED_ADAPTER_SPECIFIER)) {
    assert.equal(
      /(routes?|controllers?|app|server|bootstrap|listen|express|router|db|pool|repositories?|transaction|baseRepository|auth|session|jwt|provider|line|sms|email|push|webhook|ai|rag|vector|search|billing|settlement|env|config|credential|logger|network|smoke)/i.test(specifier),
      false,
      `${MOUNT_FILE} imports forbidden dependency ${specifier}`,
    );
  }

  assert.doesNotMatch(source, /process\.env|console\.|fetch\(|axios|http\.request|https\.request|new Pool|createPool/i);
});

test('internal test mount does not create production route bootstrap auth DB or mutation paths', () => {
  const source = read(MOUNT_FILE);
  const forbiddenSpecifiers = requireSpecifiers(source).filter((specifier) => specifier !== ALLOWED_ADAPTER_SPECIFIER);

  assert.doesNotMatch(source, /\.listen\s*\(|express\s*\(|Router\s*\(/i);
  assert.equal(
    forbiddenSpecifiers.some((specifier) => /(routes|app|server|bootstrap)/i.test(specifier)),
    false,
    'mount helper should not import production route, app, server, or bootstrap files',
  );
  assert.doesNotMatch(source, /jwt|session|passport|login|logout|authorization|bearer/i);
  assert.doesNotMatch(source, /new\s+\w*Repository|create.*Repository|baseRepository|transaction|BEGIN|COMMIT|ROLLBACK/i);
  assert.doesNotMatch(source, /\binsert\s*\(|\bupdate\s*\(|\bdelete\s*\(|\bapprove\s*\(|\bpublish\s*\(/i);
  assert.doesNotMatch(source, /finalAppointmentId\s*=|caseStatus\s*=|appointmentStatus\s*=|fieldServiceReport\s*=/);
});

test('unit coverage locks internal synthetic mount behavior and safe failures', () => {
  const source = read(UNIT_TEST_FILE);

  assert.match(source, /missing injected synthetic app or router fails closed/);
  assert.match(source, /missing injected dbClient fails closed/);
  assert.match(source, /registers exactly one internal test route/);
  assert.match(source, /Registered handler preserves Task909 safe allow behavior/i);
  assert.match(source, /Registration error returns safe not-mounted envelope/i);
  assert.match(source, /non-internal path fails closed/);
  assert.match(source, /listen should not be called/);
  assert.doesNotMatch(source, /DATABASE_URL|npm run db:migrate|psql|OpenAI|LINE_CHANNEL_ACCESS_TOKEN/i);
});

test('Task918 evidence doc records no public route rollout and forbidden scope', () => {
  const doc = read(TASK_DOC);

  for (const file of [MOUNT_FILE, UNIT_TEST_FILE, CLOSURE_TEST_FILE]) {
    assert.match(doc, new RegExp(file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.match(doc, /Internal test-only route mount helper/);
  assert.match(doc, /No production route/);
  assert.match(doc, /No public route/);
  assert.match(doc, /No app\/server\/bootstrap\/listen/);
  assert.match(doc, /No real DB/);
  assert.match(doc, /No repository/);
  assert.match(doc, /No auth\/session\/JWT/);
  assert.match(doc, /No provider sending/);
  assert.match(doc, /No AI\/RAG/);
  assert.match(doc, /No billing\/settlement/);
  assert.match(doc, /No smoke\/shared runtime/);
});
