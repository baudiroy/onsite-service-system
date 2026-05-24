'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const FACTORY_SOURCE_PATH = path.resolve(
  __dirname,
  '../../src/repairIntake/repairIntakeDraftToCasePreRouteHandlerFactory.js',
);
const UNIT_TEST_PATH = path.resolve(
  __dirname,
  './repairIntakeDraftToCasePreRouteHandlerFactory.unit.test.js',
);
const DOC_PATH = path.resolve(
  __dirname,
  '../../docs/task-1255-repair-intake-draft-to-case-pre-route-handler-factory-injected-components-no-route-no-db.md',
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
  'cache.set',
  'redis',
  'auditRepository',
  'auditWriter',
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

test('Task1255 static boundary reads expected allowlist files', () => {
  for (const filePath of [FACTORY_SOURCE_PATH, UNIT_TEST_PATH, DOC_PATH, STATIC_TEST_PATH]) {
    assert.equal(fs.existsSync(filePath), true, `missing ${filePath}`);
  }
});

test('pre-route handler factory source has no imports', () => {
  const source = readFile(FACTORY_SOURCE_PATH);

  assert.deepEqual(requireSpecifiers(source), []);
});

test('pre-route handler factory keeps injected component composition markers', () => {
  const source = readFile(FACTORY_SOURCE_PATH);

  for (const marker of [
    'createRepairIntakeDraftToCasePreRouteHandler',
    'handleDraftToCasePreRoute',
    'requestContextResolver',
    'idempotencyPolicyBuilder',
    'auditIntentBuilder',
    'syntheticHandler',
    'httpResultMapper',
    'policyInputFromContext',
    'auditInputFromContext',
    'completionPhase',
  ]) {
    assert.equal(source.includes(marker), true, `missing marker ${marker}`);
  }
});

test('Task1255 source and tests avoid forbidden route persistence external markers', () => {
  for (const [label, filePath] of [
    ['factory source', FACTORY_SOURCE_PATH],
    ['unit test', UNIT_TEST_PATH],
    ['static test', STATIC_TEST_PATH],
  ]) {
    const source = sourceWithoutForbiddenLists(readFile(filePath));

    for (const marker of FORBIDDEN_MARKERS) {
      assert.equal(source.includes(marker), false, `${label} contains forbidden marker ${marker}`);
    }
  }
});

test('pre-route handler factory source does not define persistence statements or route registration', () => {
  const source = sourceWithoutForbiddenLists(readFile(FACTORY_SOURCE_PATH));

  assert.doesNotMatch(source, /\b(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\b/i);
  assert.doesNotMatch(source, /\bapp\.(use|get|post|put|patch|delete)\b/);
  assert.doesNotMatch(source, /\brouter\.(use|get|post|put|patch|delete)\b/);
  assert.doesNotMatch(source, /(^|[^'"])listen\(/);
});
