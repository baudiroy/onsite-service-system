'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const PRESENTER_SOURCE_PATH = path.resolve(
  __dirname,
  '../../src/repairIntake/repairIntakeDraftToCasePublicResultPresenter.js',
);
const UNIT_TEST_PATH = path.resolve(
  __dirname,
  './repairIntakeDraftToCasePublicResultPresenter.unit.test.js',
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
  'reply.',
  'res.',
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
  return stripConstArrayBlock(source, 'FORBIDDEN_MARKERS');
}

function requireSpecifiers(source) {
  return Array.from(source.matchAll(/require\((['"])([^'"]+)\1\)/g))
    .map((match) => match[2]);
}

test('Task1216 static boundary reads expected source and test files', () => {
  for (const filePath of [PRESENTER_SOURCE_PATH, UNIT_TEST_PATH, STATIC_TEST_PATH]) {
    assert.equal(fs.existsSync(filePath), true, `missing ${filePath}`);
  }
});

test('presenter source is dependency-free and exports only pure mapper', () => {
  const source = readFile(PRESENTER_SOURCE_PATH);

  assert.deepEqual(requireSpecifiers(source), []);
  assert.equal(source.includes('presentRepairIntakeDraftToCaseResult'), true);
  assert.equal(source.includes('module.exports'), true);
});

test('presenter source keeps public-safe shape and generic message keys', () => {
  const source = readFile(PRESENTER_SOURCE_PATH);

  for (const marker of [
    'repair_intake_draft_to_case.created',
    'repair_intake_draft_to_case.denied',
    'repair_intake_draft_to_case.invalid_request',
    'repair_intake_draft_to_case.not_created',
    'repair_intake_draft_to_case.unavailable',
    'REPAIR_INTAKE_DRAFT_TO_CASE_PUBLIC_CREATED',
    'REPAIR_INTAKE_DRAFT_TO_CASE_PUBLIC_DENIED',
    'REPAIR_INTAKE_DRAFT_TO_CASE_PUBLIC_INVALID_REQUEST',
    'REPAIR_INTAKE_DRAFT_TO_CASE_PUBLIC_NOT_CREATED',
    'REPAIR_INTAKE_DRAFT_TO_CASE_PUBLIC_UNAVAILABLE',
    'caseId',
    'repairIntakeDraftId',
  ]) {
    assert.equal(source.includes(marker), true, `missing presenter marker ${marker}`);
  }
});

test('presenter source and tests avoid forbidden runtime persistence provider and route coupling', () => {
  for (const [label, filePath] of [
    ['source', PRESENTER_SOURCE_PATH],
    ['unit test', UNIT_TEST_PATH],
  ]) {
    const source = sourceWithoutAllowedLists(readFile(filePath));

    for (const marker of FORBIDDEN_MARKERS) {
      assert.equal(source.includes(marker), false, `${label} contains forbidden marker ${marker}`);
    }
  }
});

test('presenter source does not define raw persistence statements or global route/app registration', () => {
  const source = sourceWithoutAllowedLists(readFile(PRESENTER_SOURCE_PATH));

  assert.doesNotMatch(source, /\b(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\b/i);
  assert.doesNotMatch(source, /\bapp\.(use|get|post|put|patch|delete)\b/);
  assert.doesNotMatch(source, /\brouter\.(use|get|post|put|patch|delete)\b/);
  assert.doesNotMatch(source, /(^|[^'"])listen\(/);
});

test('presenter source introduces no route controller or response-object contract', () => {
  const source = sourceWithoutAllowedLists(readFile(PRESENTER_SOURCE_PATH));

  for (const marker of [
    'statusCode',
    'body:',
    'req.',
    'res.',
    'reply.',
    'response.',
    'controller',
    'route',
  ]) {
    assert.equal(source.includes(marker), false, `unexpected response contract marker ${marker}`);
  }
});
