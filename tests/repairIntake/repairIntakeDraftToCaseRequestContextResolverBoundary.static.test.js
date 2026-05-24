'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const RESOLVER_SOURCE_PATH = path.resolve(
  __dirname,
  '../../src/repairIntake/repairIntakeDraftToCaseRequestContextResolver.js',
);
const UNIT_TEST_PATH = path.resolve(
  __dirname,
  './repairIntakeDraftToCaseRequestContextResolver.unit.test.js',
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
  'req.',
  'res.',
  'next(',
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
  'jsonwebtoken',
  'passport',
  'jwks',
  'jose',
  'auth0',
  'SELECT ',
  'INSERT ',
  'UPDATE ',
  'DELETE ',
  'CREATE TABLE',
  'ALTER TABLE',
  'DROP TABLE',
  '/repair-intake',
  '/cases',
  'GET ',
  'POST ',
  'PATCH ',
  'PUT ',
  'DELETE ',
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

function stripFunction(source, functionName) {
  const marker = `function ${functionName}`;
  const start = source.indexOf(marker);

  if (start === -1) {
    return source;
  }

  const nextTest = source.indexOf("\ntest('", start);

  if (nextTest === -1) {
    return source.slice(0, start);
  }

  return `${source.slice(0, start)}${source.slice(nextTest)}`;
}

function sourceWithoutAllowedLists(source) {
  return [
    'UNSAFE_FIELD_NAMES',
    'BODY_OVERRIDE_FIELD_NAMES',
    'FORBIDDEN_MARKERS',
  ].reduce((current, constName) => stripConstArrayBlock(current, constName), source);
}

function unitTestWithoutUnsafeFixtures(source) {
  return stripFunction(sourceWithoutAllowedLists(source), 'validInput');
}

function requireSpecifiers(source) {
  return Array.from(source.matchAll(/require\((['"])([^'"]+)\1\)/g))
    .map((match) => match[2]);
}

test('Task1220 static boundary reads expected source and test files', () => {
  for (const filePath of [RESOLVER_SOURCE_PATH, UNIT_TEST_PATH, STATIC_TEST_PATH]) {
    assert.equal(fs.existsSync(filePath), true, `missing ${filePath}`);
  }
});

test('request context resolver source is dependency-free and exports pure resolver', () => {
  const source = readFile(RESOLVER_SOURCE_PATH);

  assert.deepEqual(requireSpecifiers(source), []);

  for (const marker of [
    'resolveRepairIntakeDraftToCaseRequestContext',
    'createRepairIntakeDraftToCaseRequestContextResolver',
    'sessionContext',
    'requestBody',
    'requestSource',
    'REPAIR_INTAKE_DRAFT_TO_CASE_REQUEST_CONTEXT_ORGANIZATION_REQUIRED',
    'REPAIR_INTAKE_DRAFT_TO_CASE_REQUEST_CONTEXT_ACTOR_REQUIRED',
    'REPAIR_INTAKE_DRAFT_TO_CASE_REQUEST_CONTEXT_DRAFT_REQUIRED',
    'REPAIR_INTAKE_DRAFT_TO_CASE_REQUEST_CONTEXT_DRAFT_INPUT_INVALID',
  ]) {
    assert.equal(source.includes(marker), true, `missing resolver marker ${marker}`);
  }
});

test('request context resolver source avoids runtime persistence provider route and auth library coupling', () => {
  const source = sourceWithoutAllowedLists(readFile(RESOLVER_SOURCE_PATH));

  for (const marker of FORBIDDEN_MARKERS) {
    assert.equal(source.includes(marker), false, `source contains forbidden marker ${marker}`);
  }
});

test('request context resolver source has no route app registration response object or SQL statements', () => {
  const source = sourceWithoutAllowedLists(readFile(RESOLVER_SOURCE_PATH));

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
    'verify(',
    'decode(',
    'jwt',
  ]) {
    assert.equal(source.includes(marker), false, `unexpected runtime marker ${marker}`);
  }
});

test('request context resolver tests avoid real runtime dependencies and route mounting', () => {
  const source = unitTestWithoutUnsafeFixtures(readFile(UNIT_TEST_PATH));

  for (const marker of FORBIDDEN_MARKERS) {
    assert.equal(source.includes(marker), false, `unit test contains forbidden marker ${marker}`);
  }

  assert.deepEqual(requireSpecifiers(source), [
    'node:assert/strict',
    'node:test',
    '../../src/repairIntake/repairIntakeDraftToCaseRequestContextResolver',
  ]);
});
