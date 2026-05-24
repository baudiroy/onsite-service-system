'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const GATE_SOURCE_PATH = path.resolve(
  __dirname,
  '../../src/repairIntake/repairIntakeDraftToCaseAuthorizationGate.js',
);
const UNIT_TEST_PATH = path.resolve(
  __dirname,
  './repairIntakeDraftToCaseAuthorizationGate.unit.test.js',
);
const STATIC_TEST_PATH = __filename;

const FORBIDDEN_MARKERS = [
  "require('../d" + "b",
  "require('../../src/d" + "b",
  'src/d' + 'b',
  '../migrations',
  '../../migrations',
  'migrations/',
  "require('../app')",
  "require('../server')",
  "require('../routes')",
  "require('../controllers')",
  "require('../repositories')",
  "require('../providers')",
  "require('../admin')",
  "require('../../src/app')",
  "require('../../src/server')",
  "require('../../src/routes')",
  "require('../../src/controllers')",
  "require('../../src/repositories')",
  "require('../../src/providers')",
  "require('../../admin')",
  'process.env.DATA' + 'BASE_URL',
  'ps' + 'ql',
  'd' + 'b:migrate',
  'listen(',
  'app.listen',
  'server.listen',
  'express()',
  'router.',
  'sendLine',
  'sendSms',
  'sendEmail',
  'webhook',
  'openai',
  'rag',
  'vector',
  'aiProvider',
  'billing',
  'settlement',
  'invoice',
  'payment',
  'SELECT ',
  'INSERT ',
  'UPDATE ',
  'DELETE ',
  'CREATE TABLE',
  'ALTER TABLE',
  'DROP TABLE',
];

const FORBIDDEN_POLICY_BYPASS_MARKERS = [
  'any org',
  'global allow',
  'skip organization check',
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

function sourceWithoutAllowedLists(source) {
  return stripConstArrayBlock(
    stripConstArrayBlock(source, 'FORBIDDEN_MARKERS'),
    'FORBIDDEN_POLICY_BYPASS_MARKERS',
  );
}

function requireSpecifiers(source) {
  return Array.from(source.matchAll(/require\((['"])([^'"]+)\1\)/g))
    .map((match) => match[2]);
}

test('Task1213 static boundary reads expected source and test files', () => {
  for (const filePath of [GATE_SOURCE_PATH, UNIT_TEST_PATH, STATIC_TEST_PATH]) {
    assert.equal(fs.existsSync(filePath), true, `missing ${filePath}`);
  }
});

test('authorization gate source has no runtime imports', () => {
  const source = readFile(GATE_SOURCE_PATH);

  assert.deepEqual(requireSpecifiers(source), []);
});

test('authorization gate source keeps injected permission resolver and safe envelope markers', () => {
  const source = readFile(GATE_SOURCE_PATH);

  for (const marker of [
    'createRepairIntakeDraftToCaseAuthorizationGate',
    'permissionResolver',
    'permissionResolver.canCreateCaseFromRepairIntakeDraft',
    'validateAuthorizationContext',
    'createSafeContext',
    'normalizeResolverResult',
    'invalidInputEnvelope',
    'invalidDependencyEnvelope',
    'resolverFailureEnvelope',
    'REPAIR_INTAKE_DRAFT_TO_CASE_AUTHORIZATION_GATE_RESOLVER_REQUIRED',
    'REPAIR_INTAKE_DRAFT_TO_CASE_AUTHORIZATION_GATE_RESOLVER_METHOD_REQUIRED',
    'REPAIR_INTAKE_DRAFT_TO_CASE_AUTHORIZATION_GATE_ALLOWED',
    'REPAIR_INTAKE_DRAFT_TO_CASE_AUTHORIZATION_GATE_DENIED',
    'REPAIR_INTAKE_DRAFT_TO_CASE_AUTHORIZATION_GATE_RESOLVER_FAILED',
  ]) {
    assert.equal(source.includes(marker), true, `missing gate marker ${marker}`);
  }
});

test('authorization gate source and tests avoid forbidden runtime persistence provider and route coupling', () => {
  for (const [label, filePath] of [
    ['source', GATE_SOURCE_PATH],
    ['unit test', UNIT_TEST_PATH],
    ['static test', STATIC_TEST_PATH],
  ]) {
    const source = sourceWithoutAllowedLists(readFile(filePath));

    for (const marker of FORBIDDEN_MARKERS) {
      assert.equal(source.includes(marker), false, `${label} contains forbidden marker ${marker}`);
    }
  }
});

test('authorization gate source does not define raw persistence statements or global route/app registration', () => {
  const source = sourceWithoutAllowedLists(readFile(GATE_SOURCE_PATH));

  assert.doesNotMatch(source, /\b(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\b/i);
  assert.doesNotMatch(source, /\bapp\.(use|get|post|put|patch|delete)\b/);
  assert.doesNotMatch(source, /\brouter\.(use|get|post|put|patch|delete)\b/);
  assert.doesNotMatch(source, /(^|[^'"])listen\(/);
});

test('authorization gate source has no policy bypass language or hard-coded role matrix', () => {
  const source = sourceWithoutAllowedLists(readFile(GATE_SOURCE_PATH)).toLowerCase();

  for (const marker of FORBIDDEN_POLICY_BYPASS_MARKERS) {
    assert.equal(source.includes(marker), false, `forbidden policy bypass marker ${marker}`);
  }

  assert.equal(source.includes('switch (actorrole'), false);
  assert.equal(source.includes('case \'admin\''), false);
  assert.equal(source.includes('case \"admin\"'), false);
});
