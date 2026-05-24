'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const SOURCE_PATH = path.resolve(
  __dirname,
  '../../src/repairIntake/repairIntakeDraftToCaseRouteAdapterContract.js',
);
const UNIT_TEST_PATH = path.resolve(
  __dirname,
  './repairIntakeDraftToCaseRouteAdapterContract.unit.test.js',
);
const DOC_PATH = path.resolve(
  __dirname,
  '../../docs/task-1257-repair-intake-draft-to-case-injected-route-adapter-contract-no-app-mount-no-server.md',
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
  /\bAI\b/,
  /\bRAG\b/,
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
  'audit' + 'Repository',
  'audit' + 'Writer',
];

const FORBIDDEN_ROUTE_PATHS = [
  '/repair-intake',
  '/cases',
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
  return stripConstArrayBlock(
    stripConstArrayBlock(source, 'FORBIDDEN_MARKERS'),
    'FORBIDDEN_ROUTE_PATHS',
  );
}

function importSpecifiers(source) {
  return Array.from(source.matchAll(/require\((['"])([^'"]+)\1\)/g))
    .map((match) => match[2]);
}

test('Task1257 static boundary reads expected allowlist files', () => {
  for (const filePath of [SOURCE_PATH, UNIT_TEST_PATH, DOC_PATH, STATIC_TEST_PATH]) {
    assert.equal(fs.existsSync(filePath), true, `missing ${filePath}`);
  }
});

test('route adapter contract source has no imports', () => {
  assert.deepEqual(importSpecifiers(readFile(SOURCE_PATH)), []);
});

test('route adapter contract keeps injected route-like contract markers', () => {
  const source = readFile(SOURCE_PATH);

  for (const marker of [
    'createRepairIntakeDraftToCaseRouteAdapterContract',
    'handleRouteLikeRequest',
    'preRouteHandler',
    'handleDraftToCasePreRoute',
    'routeLikeToPreRouteInput',
    'safeHeaderValue',
    'idempotency-key',
    'requestBody',
    'requestSource',
  ]) {
    assert.equal(source.includes(marker), true, `missing marker ${marker}`);
  }
});

test('Task1257 files avoid forbidden route persistence external markers', () => {
  for (const [label, filePath] of [
    ['contract source', SOURCE_PATH],
    ['unit test', UNIT_TEST_PATH],
    ['static test', STATIC_TEST_PATH],
    ['doc', DOC_PATH],
  ]) {
    const source = sourceWithoutForbiddenLists(readFile(filePath));

    for (const marker of FORBIDDEN_MARKERS) {
      if (marker instanceof RegExp) {
        assert.equal(marker.test(source), false, `${label} contains forbidden marker ${marker}`);
      } else {
        assert.equal(source.includes(marker), false, `${label} contains forbidden marker ${marker}`);
      }
    }
  }
});

test('Task1257 files do not introduce real route paths', () => {
  for (const [label, filePath] of [
    ['contract source', SOURCE_PATH],
    ['unit test', UNIT_TEST_PATH],
    ['static test', STATIC_TEST_PATH],
    ['doc', DOC_PATH],
  ]) {
    const source = sourceWithoutForbiddenLists(readFile(filePath));

    for (const routePath of FORBIDDEN_ROUTE_PATHS) {
      assert.equal(source.includes(routePath), false, `${label} contains route path ${routePath}`);
    }
  }
});

test('route adapter contract does not define framework route registration or persistence statements', () => {
  const source = sourceWithoutForbiddenLists(readFile(SOURCE_PATH));

  assert.doesNotMatch(source, /\b(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\b/i);
  assert.doesNotMatch(source, /\bapp\.(use|get|post|put|patch|delete)\b/);
  assert.doesNotMatch(source, /\brouter\.(use|get|post|put|patch|delete)\b/);
  assert.doesNotMatch(source, /(^|[^'"])listen\(/);
  assert.doesNotMatch(source, /\b(req|res|next)\b/);
});
