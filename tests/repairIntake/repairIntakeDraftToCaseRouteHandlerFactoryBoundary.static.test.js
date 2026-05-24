'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const SOURCE_PATH = path.resolve(
  __dirname,
  '../../src/repairIntake/repairIntakeDraftToCaseRouteHandlerFactory.js',
);
const UNIT_TEST_PATH = path.resolve(
  __dirname,
  './repairIntakeDraftToCaseRouteHandlerFactory.unit.test.js',
);
const DOC_PATH = path.resolve(
  __dirname,
  '../../docs/task-1263-repair-intake-draft-to-case-route-handler-factory-injected-route-adapter-no-app-mount.md',
);
const STATIC_TEST_PATH = __filename;
const PROPOSED_ROUTE = '/internal/repair-intake/drafts/:repairIntakeDraftId/submit-to-case';

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

function importSpecifiers(source) {
  return Array.from(source.matchAll(/require\((['"])([^'"]+)\1\)/g))
    .map((match) => match[2]);
}

test('Task1263 static boundary reads expected allowlist files', () => {
  for (const filePath of [SOURCE_PATH, UNIT_TEST_PATH, DOC_PATH, STATIC_TEST_PATH]) {
    assert.equal(fs.existsSync(filePath), true, `missing ${filePath}`);
  }
});

test('route handler factory source has no imports', () => {
  assert.deepEqual(importSpecifiers(readFile(SOURCE_PATH)), []);
});

test('route handler factory keeps injected handler contract markers', () => {
  const source = readFile(SOURCE_PATH);

  for (const marker of [
    'createRepairIntakeDraftToCaseRouteHandler',
    'handle',
    'routeAdapter',
    'handleRouteLikeRequest',
    'repairIntakeDraftId',
    'routeLikeInputFromFutureRouterInput',
    'safeHeaders',
  ]) {
    assert.equal(source.includes(marker), true, `missing marker ${marker}`);
  }
});

test('Task1263 source and tests avoid forbidden runtime markers', () => {
  for (const [label, filePath] of [
    ['factory source', SOURCE_PATH],
    ['unit test', UNIT_TEST_PATH],
    ['static test', STATIC_TEST_PATH],
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

test('route handler factory source does not implement actual route path', () => {
  const source = readFile(SOURCE_PATH);

  assert.equal(source.includes(PROPOSED_ROUTE), false);
});

test('route handler factory source does not define framework route registration or persistence statements', () => {
  const source = sourceWithoutForbiddenLists(readFile(SOURCE_PATH));

  assert.doesNotMatch(source, /\b(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\b/i);
  assert.doesNotMatch(source, /\bapp\.(use|get|post|put|patch|delete)\b/);
  assert.doesNotMatch(source, /\brouter\.(use|get|post|put|patch|delete)\b/);
  assert.doesNotMatch(source, /(^|[^'"])listen\(/);
  assert.doesNotMatch(source, /\b(req|res|next)\b/);
});

test('Task1263 doc records framework-neutral no-mount boundary and path conflict policy', () => {
  const doc = readFile(DOC_PATH);

  for (const marker of [
    'route handler factory only',
    'framework-neutral',
    'does not register a real route',
    'does not import or use Express/Fastify/Koa request/response objects',
    'params.repairIntakeDraftId',
    'Task1257 route adapter contract',
    'Path repairIntakeDraftId wins over body repairIntakeDraftId',
    'future real route mount still requires explicit PM approval',
  ]) {
    assert.equal(doc.includes(marker), true, `missing ${marker}`);
  }
});
