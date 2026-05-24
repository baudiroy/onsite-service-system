'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ORCHESTRATOR_SOURCE_PATH = path.resolve(
  __dirname,
  '../../src/repairIntake/repairIntakeDraftToCaseOrchestrator.js',
);
const UNIT_TEST_PATH = path.resolve(
  __dirname,
  './repairIntakeDraftToCaseOrchestrator.unit.test.js',
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
  'RAG',
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

test('Task1214 static boundary reads expected source and test files', () => {
  for (const filePath of [ORCHESTRATOR_SOURCE_PATH, UNIT_TEST_PATH, STATIC_TEST_PATH]) {
    assert.equal(fs.existsSync(filePath), true, `missing ${filePath}`);
  }
});

test('orchestrator source has no runtime imports', () => {
  const source = readFile(ORCHESTRATOR_SOURCE_PATH);

  assert.deepEqual(requireSpecifiers(source), []);
});

test('orchestrator source keeps explicit injected dependency and safe envelope markers', () => {
  const source = readFile(ORCHESTRATOR_SOURCE_PATH);

  for (const marker of [
    'createRepairIntakeDraftToCaseOrchestrator',
    'authorizationGate',
    'draftToCaseApplicationService',
    'authorizationGate.authorizeDraftToCase',
    'draftToCaseApplicationService.submitDraftToCase',
    'authorizationBlockedEnvelope',
    'applicationResultEnvelope',
    'authorizationFailureEnvelope',
    'applicationFailureEnvelope',
    'REPAIR_INTAKE_DRAFT_TO_CASE_ORCHESTRATOR_AUTHORIZATION_GATE_REQUIRED',
    'REPAIR_INTAKE_DRAFT_TO_CASE_ORCHESTRATOR_APPLICATION_SERVICE_REQUIRED',
    'REPAIR_INTAKE_DRAFT_TO_CASE_ORCHESTRATOR_AUTHORIZATION_FAILED',
    'REPAIR_INTAKE_DRAFT_TO_CASE_ORCHESTRATOR_APPLICATION_FAILED',
  ]) {
    assert.equal(source.includes(marker), true, `missing orchestrator marker ${marker}`);
  }
});

test('authorization is called before application service execution in source and unit coverage', () => {
  const source = readFile(ORCHESTRATOR_SOURCE_PATH);
  const authIndex = source.indexOf('authorizationGate.authorizeDraftToCase');
  const appIndex = source.indexOf('draftToCaseApplicationService.submitDraftToCase');
  const unitSource = readFile(UNIT_TEST_PATH);

  assert.equal(authIndex >= 0, true);
  assert.equal(appIndex >= 0, true);
  assert.equal(authIndex < appIndex, true);
  assert.equal(unitSource.includes("['authorizationGate', 'applicationService']"), true);
  assert.equal(unitSource.includes("['authorizationGate']"), true);
});

test('orchestrator source and tests avoid forbidden runtime persistence provider and route coupling', () => {
  for (const [label, filePath] of [
    ['source', ORCHESTRATOR_SOURCE_PATH],
    ['unit test', UNIT_TEST_PATH],
    ['static test', STATIC_TEST_PATH],
  ]) {
    const source = sourceWithoutAllowedLists(readFile(filePath));

    for (const marker of FORBIDDEN_MARKERS) {
      assert.equal(source.includes(marker), false, `${label} contains forbidden marker ${marker}`);
    }
  }
});

test('orchestrator source does not define raw persistence statements or global route/app registration', () => {
  const source = sourceWithoutAllowedLists(readFile(ORCHESTRATOR_SOURCE_PATH));

  assert.doesNotMatch(source, /\b(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\b/i);
  assert.doesNotMatch(source, /\bapp\.(use|get|post|put|patch|delete)\b/);
  assert.doesNotMatch(source, /\brouter\.(use|get|post|put|patch|delete)\b/);
  assert.doesNotMatch(source, /(^|[^'"])listen\(/);
});

test('orchestrator source has no policy bypass language or hard-coded role matrix', () => {
  const source = sourceWithoutAllowedLists(readFile(ORCHESTRATOR_SOURCE_PATH)).toLowerCase();

  for (const marker of FORBIDDEN_POLICY_BYPASS_MARKERS) {
    assert.equal(source.includes(marker), false, `forbidden policy bypass marker ${marker}`);
  }

  assert.equal(source.includes('switch (actorrole'), false);
  assert.equal(source.includes('case \'admin\''), false);
  assert.equal(source.includes('case \"admin\"'), false);
});
