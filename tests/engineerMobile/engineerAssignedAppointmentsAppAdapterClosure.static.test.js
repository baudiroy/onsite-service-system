'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const ADAPTER_FILE = 'src/engineerMobile/engineerAssignedAppointmentsAppAdapter.js';
const HANDLER_FILE = 'src/engineerMobile/engineerAssignedAppointmentsProjectionHandler.js';
const UNIT_TEST_FILE = 'tests/engineerMobile/engineerAssignedAppointmentsAppAdapter.unit.test.js';
const CLOSURE_TEST_FILE = 'tests/engineerMobile/engineerAssignedAppointmentsAppAdapterClosure.static.test.js';
const TASK_DOC = 'docs/task-923-engineer-mobile-assigned-appointments-app-adapter-synthetic-app-only-no-public-route-no-listen.md';

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

test('Task923 source test and doc files exist', () => {
  for (const file of [ADAPTER_FILE, HANDLER_FILE, UNIT_TEST_FILE, CLOSURE_TEST_FILE, TASK_DOC]) {
    assert.equal(exists(file), true, `${file} should exist`);
  }
});

test('adapter delegates only to Task922 handler factory', () => {
  const source = read(ADAPTER_FILE);

  assert.deepEqual(requireSpecifiers(source), ['./engineerAssignedAppointmentsProjectionHandler']);
  assert.match(source, /createEngineerAssignedAppointmentsProjectionHandler/);
  assert.match(source, /dbClient:\s*options\.dbClient/);
});

test('adapter imports no forbidden runtime dependencies', () => {
  const source = read(ADAPTER_FILE);
  const specifiers = requireSpecifiers(source);

  for (const specifier of specifiers.filter((entry) => entry !== './engineerAssignedAppointmentsProjectionHandler')) {
    assert.equal(
      /(routes?|controllers?|app|server|bootstrap|listen|express|router|db|pool|repositories?|transaction|baseRepository|auth|session|jwt|provider|line|sms|email|push|webhook|ai|rag|vector|search|billing|settlement|env|config|credential|logger|network|smoke|migration)/i.test(specifier),
      false,
      `${ADAPTER_FILE} imports forbidden dependency ${specifier}`,
    );
  }

  assert.doesNotMatch(source, /process\.env|console\.|fetch\(|axios|http\.request|https\.request|new Pool|createPool/i);
});

test('adapter has no production route listen server auth DB or mutation execution paths', () => {
  const source = read(ADAPTER_FILE);
  const specifiers = requireSpecifiers(source);

  assert.doesNotMatch(source, /\.listen\s*\(|express\s*\(|Router\s*\(/i);
  for (const specifier of specifiers.filter((entry) => entry !== './engineerAssignedAppointmentsProjectionHandler')) {
    assert.doesNotMatch(specifier, /(routes|app|server|bootstrap)/i);
  }
  assert.doesNotMatch(source, /jwt|session|passport|login|logout|authorization|bearer/i);
  assert.doesNotMatch(source, /new\s+\w*Repository|create.*Repository|baseRepository|transaction|BEGIN|COMMIT|ROLLBACK/i);
  assert.doesNotMatch(source, /\binsert\s*\(|\bupdate\s*\(|\bdelete\s*\(|\bcreate\s*\(|\bapprove\s*\(|\bpublish\s*\(/i);
  assert.doesNotMatch(source, /finalAppointmentId\s*=|caseStatus\s*=|appointmentStatus\s*=|fieldServiceReport\s*=/);
});

test('unit coverage locks synthetic app adapter behavior and safe failures', () => {
  const source = read(UNIT_TEST_FILE);

  assert.match(source, /registers exactly one GET-like handler/);
  assert.match(source, /registered handler preserves Task922 and Task921 safe allow behavior/);
  assert.match(source, /missing synthetic app or router fails closed/);
  assert.match(source, /missing injected dbClient fails closed/);
  assert.match(source, /registration failure fails closed/);
  assert.match(source, /router option is supported/);
  assert.match(source, /listen should not be called/);
  assert.doesNotMatch(source, /DATABASE_URL|npm run db:migrate|psql|OpenAI|LINE_CHANNEL_ACCESS_TOKEN/i);
});

test('Task923 evidence doc records synthetic-only no public route rollout and forbidden scope', () => {
  const doc = read(TASK_DOC);

  for (const file of [ADAPTER_FILE, UNIT_TEST_FILE, CLOSURE_TEST_FILE]) {
    assert.match(doc, new RegExp(file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.match(doc, /Synthetic App Only/);
  assert.match(doc, /No Public Route|No public route/);
  assert.match(doc, /No production route/);
  assert.match(doc, /No listen/);
  assert.match(doc, /No real DB/);
  assert.match(doc, /No auth\/session\/JWT runtime/);
  assert.match(doc, /No provider sending/);
  assert.match(doc, /No AI\/RAG/);
  assert.match(doc, /No billing\/settlement/);
  assert.match(doc, /No smoke\/shared runtime/);
});
