'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const BUILDER_SOURCE_PATH = path.resolve(
  __dirname,
  '../../src/repairIntake/repairIntakeDraftToCaseAuditIntentBuilder.js',
);
const UNIT_TEST_PATH = path.resolve(
  __dirname,
  './repairIntakeDraftToCaseAuditIntentBuilder.unit.test.js',
);
const DOC_PATH = path.resolve(
  __dirname,
  '../../docs/task-1245-repair-intake-draft-to-case-audit-intent-builder-pure-runtime-no-db-no-route.md',
);
const STATIC_TEST_PATH = __filename;

const FORBIDDEN_MARKERS = [
  'src/app',
  'src/server',
  'src/routes',
  'src/controllers',
  'src/d' + 'b',
  'migrations',
  'admin',
  'pro' + 'vider',
  'Open' + 'AI',
  'R' + 'AG',
  'billing',
  'settlement',
  'process.env.DATA' + 'BASE_URL',
  'ps' + 'ql',
  'd' + 'b:migrate',
  'listen(',
  'app.post',
  'router.post',
  'express.Router',
  'req, res',
  'res.json',
  'sendSms',
  'sendLine',
  'JWT verification',
  'token parsing',
];

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function stripConstArrayBlock(source, constName) {
  const marker = `const ${constName} = [`;
  const start = source.indexOf(marker);

  if (start === -1) {
    return source;
  }

  const end = source.indexOf('];', start);

  if (end === -1) {
    return source;
  }

  return `${source.slice(0, start)}${source.slice(end + 2)}`;
}

function sourceWithoutForbiddenLists(source) {
  return stripConstArrayBlock(source, 'FORBIDDEN_MARKERS');
}

function requireSpecifiers(source) {
  return Array.from(source.matchAll(/require\((['"])([^'"]+)\1\)/g))
    .map((match) => match[2]);
}

test('Task1245 static boundary reads expected allowlist files', () => {
  for (const filePath of [BUILDER_SOURCE_PATH, UNIT_TEST_PATH, DOC_PATH, STATIC_TEST_PATH]) {
    assert.equal(fs.existsSync(filePath), true, `missing ${filePath}`);
  }
});

test('audit intent builder source has no imports', () => {
  const source = readFile(BUILDER_SOURCE_PATH);

  assert.deepEqual(requireSpecifiers(source), []);
});

test('audit intent builder keeps pure function and safe envelope markers', () => {
  const source = readFile(BUILDER_SOURCE_PATH);

  for (const marker of [
    'buildRepairIntakeDraftToCaseAuditIntent',
    'SUPPORTED_PHASES',
    'attempt',
    'authorized',
    'denied',
    'submitted',
    'failed',
    'safeScalar',
    'invalidEnvelope',
    'REPAIR_INTAKE_DRAFT_TO_CASE_AUDIT_INTENT_BUILT',
    'REPAIR_INTAKE_DRAFT_TO_CASE_AUDIT_INTENT_ORGANIZATION_REQUIRED',
    'REPAIR_INTAKE_DRAFT_TO_CASE_AUDIT_INTENT_ACTOR_REQUIRED',
    'REPAIR_INTAKE_DRAFT_TO_CASE_AUDIT_INTENT_DRAFT_REQUIRED',
    'REPAIR_INTAKE_DRAFT_TO_CASE_AUDIT_INTENT_PHASE_UNSUPPORTED',
  ]) {
    assert.equal(source.includes(marker), true, `missing marker ${marker}`);
  }
});

test('Task1245 source and tests avoid forbidden runtime route persistence external markers', () => {
  for (const [label, filePath] of [
    ['builder source', BUILDER_SOURCE_PATH],
    ['unit test', UNIT_TEST_PATH],
    ['static test', STATIC_TEST_PATH],
  ]) {
    const source = sourceWithoutForbiddenLists(readFile(filePath));

    for (const marker of FORBIDDEN_MARKERS) {
      assert.equal(source.includes(marker), false, `${label} contains forbidden marker ${marker}`);
    }
  }
});

test('audit intent builder source does not define persistence statements or route registration', () => {
  const source = sourceWithoutForbiddenLists(readFile(BUILDER_SOURCE_PATH));

  assert.doesNotMatch(source, /\b(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\b/i);
  assert.doesNotMatch(source, /\bapp\.(use|get|post|put|patch|delete)\b/);
  assert.doesNotMatch(source, /\brouter\.(use|get|post|put|patch|delete)\b/);
  assert.doesNotMatch(source, /(^|[^'"])listen\(/);
});
