'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ADAPTER_SOURCE_PATH = path.resolve(
  __dirname,
  '../../src/repairIntake/repairIntakeDraftToCaseControllerAdapter.js',
);
const UNIT_TEST_PATH = path.resolve(
  __dirname,
  './repairIntakeDraftToCaseControllerAdapter.unit.test.js',
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
  'fastify',
  'koa',
  'next(',
  'req.',
  'res.',
  'reply.',
  'response.',
  'router.',
  'sendLine',
  'sendSms',
  'sendEmail',
  'webhook',
  'openai',
  'RAG',
  'vector',
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

test('Task1217 static boundary reads expected source and test files', () => {
  for (const filePath of [ADAPTER_SOURCE_PATH, UNIT_TEST_PATH, STATIC_TEST_PATH]) {
    assert.equal(fs.existsSync(filePath), true, `missing ${filePath}`);
  }
});

test('controller adapter source has no runtime imports', () => {
  const source = readFile(ADAPTER_SOURCE_PATH);

  assert.deepEqual(requireSpecifiers(source), []);
});

test('controller adapter source keeps explicit injected orchestrator and presenter markers', () => {
  const source = readFile(ADAPTER_SOURCE_PATH);

  for (const marker of [
    'createRepairIntakeDraftToCaseControllerAdapter',
    'orchestrator.submitDraftToCase',
    'publicResultPresenter',
    'presentRepairIntakeDraftToCaseResult',
    'createSafeInternalInput',
    'minimalUnavailable',
    'REPAIR_INTAKE_DRAFT_TO_CASE_CONTROLLER_ADAPTER_ORCHESTRATOR_REQUIRED',
    'REPAIR_INTAKE_DRAFT_TO_CASE_CONTROLLER_ADAPTER_PRESENTER_REQUIRED',
    'REPAIR_INTAKE_DRAFT_TO_CASE_CONTROLLER_ADAPTER_ORCHESTRATOR_FAILED',
    'REPAIR_INTAKE_DRAFT_TO_CASE_CONTROLLER_ADAPTER_PRESENTER_FAILED',
  ]) {
    assert.equal(source.includes(marker), true, `missing adapter marker ${marker}`);
  }
});

test('controller adapter source and unit test avoid forbidden runtime persistence provider and route coupling', () => {
  for (const [label, filePath] of [
    ['source', ADAPTER_SOURCE_PATH],
    ['unit test', UNIT_TEST_PATH],
  ]) {
    const source = sourceWithoutAllowedLists(readFile(filePath));

    for (const marker of FORBIDDEN_MARKERS) {
      assert.equal(source.includes(marker), false, `${label} contains forbidden marker ${marker}`);
    }
  }
});

test('controller adapter source has no route app registration or response object contract', () => {
  const source = sourceWithoutAllowedLists(readFile(ADAPTER_SOURCE_PATH));

  assert.doesNotMatch(source, /\b(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\b/i);
  assert.doesNotMatch(source, /\bapp\.(use|get|post|put|patch|delete)\b/);
  assert.doesNotMatch(source, /\brouter\.(use|get|post|put|patch|delete)\b/);
  assert.doesNotMatch(source, /(^|[^'"])listen\(/);

  for (const marker of [
    'statusCode',
    'body:',
    'req.',
    'res.',
    'next(',
    'reply.',
    'response.',
    'GET ',
    'POST ',
    'PATCH ',
  ]) {
    assert.equal(source.includes(marker), false, `unexpected route/response marker ${marker}`);
  }
});

test('controller adapter source has no policy bypass language', () => {
  const source = sourceWithoutAllowedLists(readFile(ADAPTER_SOURCE_PATH)).toLowerCase();

  for (const marker of FORBIDDEN_POLICY_BYPASS_MARKERS) {
    assert.equal(source.includes(marker), false, `forbidden policy bypass marker ${marker}`);
  }
});
