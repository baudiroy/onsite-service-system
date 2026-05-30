'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const HANDLER_SOURCE_PATH = path.resolve(
  __dirname,
  '../../src/repairIntake/repairIntakeDraftToCaseSyntheticHandler.js',
);
const UNIT_TEST_PATH = path.resolve(
  __dirname,
  './repairIntakeDraftToCaseSyntheticHandler.unit.test.js',
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

  const nextFunction = source.indexOf('\nfunction ', start + marker.length);
  const nextTest = source.indexOf("\ntest('", start + marker.length);
  const candidates = [nextFunction, nextTest].filter((index) => index !== -1);
  const end = candidates.length > 0 ? Math.min(...candidates) : -1;

  if (end === -1) {
    return source.slice(0, start);
  }

  return `${source.slice(0, start)}${source.slice(end)}`;
}

function sourceWithoutAllowedLists(source) {
  return stripConstArrayBlock(
    stripConstArrayBlock(source, 'UNSAFE_FIELD_NAMES'),
    'FORBIDDEN_MARKERS',
  );
}

function unitTestWithoutUnsafeFixtures(source) {
  return [
    'syntheticInput',
    'resolvedContext',
    'adapterOutput',
  ].reduce((current, functionName) => stripFunction(current, functionName), sourceWithoutAllowedLists(source));
}

function requireSpecifiers(source) {
  return Array.from(source.matchAll(/require\((['"])([^'"]+)\1\)/g))
    .map((match) => match[2]);
}

test('Task1221 static boundary reads expected source and test files', () => {
  for (const filePath of [HANDLER_SOURCE_PATH, UNIT_TEST_PATH, STATIC_TEST_PATH]) {
    assert.equal(fs.existsSync(filePath), true, `missing ${filePath}`);
  }
});

test('synthetic handler source keeps bounded pure helper imports and exports pure factory', () => {
  const source = readFile(HANDLER_SOURCE_PATH);

  assert.deepEqual(requireSpecifiers(source), [
    './repairIntakePublicOpenRequestDtoSanitizer',
    './repairIntakeDraftToCasePermissionGate',
  ]);

  for (const marker of [
    'createRepairIntakeDraftToCaseSyntheticHandler',
    'requestContextResolver',
    'controllerAdapter',
    'decideRepairIntakeDraftToCasePermission',
    'permissionDeniedEnvelope',
    'resolveRepairIntakeDraftToCaseRequestContext',
    'handleDraftToCase',
    'submitDraftToCase',
    'REPAIR_INTAKE_DRAFT_TO_CASE_SYNTHETIC_HANDLER_CONTEXT_RESOLVER_REQUIRED',
    'REPAIR_INTAKE_DRAFT_TO_CASE_SYNTHETIC_HANDLER_CONTROLLER_ADAPTER_REQUIRED',
    'REPAIR_INTAKE_DRAFT_TO_CASE_SYNTHETIC_HANDLER_CONTEXT_RESOLVER_FAILED',
    'REPAIR_INTAKE_DRAFT_TO_CASE_SYNTHETIC_HANDLER_CONTROLLER_ADAPTER_FAILED',
  ]) {
    assert.equal(source.includes(marker), true, `missing handler marker ${marker}`);
  }
});

test('synthetic handler source avoids runtime persistence provider route and auth library coupling', () => {
  const source = sourceWithoutAllowedLists(readFile(HANDLER_SOURCE_PATH));

  for (const marker of FORBIDDEN_MARKERS) {
    assert.equal(source.includes(marker), false, `source contains forbidden marker ${marker}`);
  }
});

test('synthetic handler source has no route app registration response object or SQL statements', () => {
  const source = sourceWithoutAllowedLists(readFile(HANDLER_SOURCE_PATH));

  assert.doesNotMatch(source, /\b(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\b/);
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

test('synthetic handler tests avoid real runtime dependencies and route mounting', () => {
  const source = unitTestWithoutUnsafeFixtures(readFile(UNIT_TEST_PATH));

  for (const marker of FORBIDDEN_MARKERS) {
    assert.equal(source.includes(marker), false, `unit test contains forbidden marker ${marker}`);
  }

  assert.deepEqual(requireSpecifiers(source), [
    'node:assert/strict',
    'node:test',
    '../../src/repairIntake/repairIntakeDraftToCaseSyntheticHandler',
  ]);
});
