'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const CONSUMER_SOURCE_PATH = path.resolve(
  __dirname,
  '../../src/repairIntake/repairIntakeCaseRepositoryConsumer.js',
);
const UNIT_TEST_PATH = path.resolve(
  __dirname,
  './repairIntakeCaseRepositoryConsumer.unit.test.js',
);
const STATIC_TEST_PATH = __filename;

const ALLOWED_SOURCE_MARKERS = new Set([
  "require('./repairIntakeCaseRepositoryContract')",
]);

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
  "require('../providers')",
  "require('../admin')",
  "require('../../src/app')",
  "require('../../src/server')",
  "require('../../src/routes')",
  "require('../../src/controllers')",
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

test('Task1211 static boundary reads expected source and test files', () => {
  for (const filePath of [CONSUMER_SOURCE_PATH, UNIT_TEST_PATH, STATIC_TEST_PATH]) {
    assert.equal(fs.existsSync(filePath), true, `missing ${filePath}`);
  }
});

test('consumer source imports only the existing repository contract helper', () => {
  const source = readFile(CONSUMER_SOURCE_PATH);

  assert.deepEqual(
    requireSpecifiers(source),
    ['./repairIntakeCaseRepositoryContract'],
  );

  for (const marker of ALLOWED_SOURCE_MARKERS) {
    assert.equal(source.includes(marker), true, `missing allowed marker ${marker}`);
  }
});

test('consumer source keeps injected-only dependency validation and safe result markers', () => {
  const source = readFile(CONSUMER_SOURCE_PATH);

  for (const marker of [
    'createRepairIntakeCaseRepositoryConsumer',
    'resolveInjectedRepository',
    'typeof repository.createCaseFromDraft',
    'createRepairIntakeCaseRepositoryContract({ caseRepository: repository })',
    'invalidDependencyEnvelope',
    'nonSuccessEnvelope',
    'successEnvelope',
    'REPAIR_INTAKE_CASE_REPOSITORY_CONSUMER_REPOSITORY_REQUIRED',
    'REPAIR_INTAKE_CASE_REPOSITORY_CONSUMER_CREATE_METHOD_REQUIRED',
    'REPAIR_INTAKE_CASE_REPOSITORY_CONSUMER_CASE_READY',
    'REPAIR_INTAKE_CASE_REPOSITORY_CONSUMER_NOT_FOUND_OR_SKIPPED',
    'REPAIR_INTAKE_CASE_REPOSITORY_CONSUMER_REPOSITORY_FAILED',
  ]) {
    assert.equal(source.includes(marker), true, `missing consumer marker ${marker}`);
  }
});

test('consumer source and tests avoid forbidden runtime, persistence, provider, and route coupling', () => {
  for (const [label, filePath] of [
    ['source', CONSUMER_SOURCE_PATH],
    ['unit test', UNIT_TEST_PATH],
    ['static test', STATIC_TEST_PATH],
  ]) {
    const source = sourceWithoutAllowedLists(readFile(filePath));

    for (const marker of FORBIDDEN_MARKERS) {
      assert.equal(source.includes(marker), false, `${label} contains forbidden marker ${marker}`);
    }
  }
});

test('consumer source does not define raw persistence statements or global route/app registration', () => {
  const source = sourceWithoutAllowedLists(readFile(CONSUMER_SOURCE_PATH));

  assert.doesNotMatch(source, /\b(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\b/i);
  assert.doesNotMatch(source, /\bapp\.(use|get|post|put|patch|delete)\b/);
  assert.doesNotMatch(source, /\brouter\.(use|get|post|put|patch|delete)\b/);
  assert.doesNotMatch(source, /(^|[^'"])listen\(/);
});
