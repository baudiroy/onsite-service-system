'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const UNIT_TEST_PATH = 'tests/repairIntake/repairIntakeDraftToCaseAdminRouteAuthFailureSynthetic.unit.test.js';
const DOC_PATH = 'docs/task-2365-repair-intake-draft-to-case-admin-route-auth-failure-synthetic-matrix-no-source-change-no-db-no-smoke-no-provider-no-package.md';

const SOURCE_PATHS = Object.freeze({
  route: 'src/routes/repairIntakeDraftToCase.routes.js',
  apiModule: 'src/repairIntake/repairIntakeDraftToCaseApiModule.js',
  requireAuth: 'src/middlewares/requireAuth.js',
  requirePermission: 'src/middlewares/requirePermission.js',
  packageJson: 'package.json',
  packageLock: 'package-lock.json',
});

const FORBIDDEN_TEST_MARKERS = Object.freeze([
  "require('../../src/app",
  "require('../../src/server",
  "require('http')",
  "require('https')",
  'createServer(',
  'app.listen(',
  'server.listen(',
  'listen(',
  'fetch(',
  'supertest',
  'http.request',
  'https.request',
  'process.env.DATA' + 'BASE_URL',
  'Zeabur',
  'sendProvider',
  'sendLine',
  'sendSms',
  'sendEmail',
  'webhook',
  'createOpenAI',
  'vectorStore',
  'admin/src',
  'billing/',
]);

const PACKAGE_EXPANSION_MARKERS = Object.freeze([
  'body-parser',
  'express-rate-limit',
  'express-session',
  'firebase-admin',
  'passport',
  'rate-limiter-flexible',
  'supabase',
  'supertest',
]);

const PUBLIC_OPEN_ROUTE_MARKERS = Object.freeze([
  '/public',
  '/open',
  '/customer',
  '/intake/open',
  '/repair-intake/open',
  'openRepairIntake',
  'customerAccess',
  'customer-access',
]);

function projectPath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(projectPath(relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function stripConstArrayBlock(source, constName) {
  const marker = `const ${constName} = Object.freeze([`;
  const start = source.indexOf(marker);

  if (start === -1) {
    return source;
  }

  const end = source.indexOf(']);', start);

  if (end === -1) {
    return source;
  }

  return `${source.slice(0, start)}${source.slice(end + 4)}`;
}

function sourceWithoutAllowedLists(source) {
  return [
    'FORBIDDEN_TEST_MARKERS',
    'PACKAGE_EXPANSION_MARKERS',
    'PUBLIC_OPEN_ROUTE_MARKERS',
  ].reduce((result, constName) => stripConstArrayBlock(result, constName), source);
}

function requireSpecifiers(source) {
  return Array.from(source.matchAll(/require\(\s*['"]([^'"]+)['"]\s*\)/g), (match) => match[1]);
}

function functionBlock(source, functionName) {
  const marker = `function ${functionName}`;
  const start = source.indexOf(marker);

  assert.notEqual(start, -1, `missing function ${functionName}`);

  const signatureEnd = source.indexOf(') {', start);

  assert.notEqual(signatureEnd, -1, `missing function body ${functionName}`);

  const bodyStart = source.indexOf('{', signatureEnd);
  let depth = 0;

  for (let index = bodyStart; index < source.length; index += 1) {
    const char = source[index];

    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;

      if (depth === 0) {
        return source.slice(start, index + 1);
      }
    }
  }

  assert.fail(`unterminated function ${functionName}`);
}

function assertIncludesAll(source, markers, label) {
  for (const marker of markers) {
    assert.equal(source.includes(marker), true, `${label} missing marker ${marker}`);
  }
}

function assertExcludesAll(source, markers, label) {
  for (const marker of markers) {
    assert.equal(source.includes(marker), false, `${label} should not include ${marker}`);
  }
}

test('Task2365 synthetic auth-failure test doc and source inputs exist', () => {
  for (const relativePath of [
    UNIT_TEST_PATH,
    DOC_PATH,
    ...Object.values(SOURCE_PATHS),
  ]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }

  const unitSource = read(UNIT_TEST_PATH);

  assert.deepEqual(requireSpecifiers(unitSource), [
    'node:assert/strict',
    'node:test',
    '../../src/routes/repairIntakeDraftToCase.routes',
  ]);
});

test('synthetic auth-failure matrix uses fake router fake response and injected runtime ports only', () => {
  const combinedSource = sourceWithoutAllowedLists(`${read(UNIT_TEST_PATH)}\n${read(__filename.replace(`${repoRoot}/`, ''))}`);

  assertIncludesAll(combinedSource, [
    'function createFakeRouter()',
    'function createResponse()',
    'function createRuntimePorts(calls = [])',
    'registerRepairIntakeDraftToCaseAdminRoutes(router, {',
    'repairIntakeDraftToCaseRuntimePorts: createRuntimePorts(runtimeCalls)',
    'invokeAdminRoute(routeCall, req)',
    'assertNoDownstreamPorts(runtimeCalls)',
    'assertNoRawLeak',
    'assertRequestNotMutated',
  ], 'fake synthetic auth-failure markers');

  assertExcludesAll(combinedSource, FORBIDDEN_TEST_MARKERS, 'synthetic auth-failure test source');
});

test('auth failure matrix covers safe auth session permission override abuse and mutation cases', () => {
  const unitSource = read(UNIT_TEST_PATH);

  assertIncludesAll(unitSource, [
    'missing authenticated user fails before submit handler without downstream runtime execution',
    'missing or insufficient permission context fails before submit handler despite client injection attempts',
    'missing organization context fails closed without case creation audit write or raw leakage',
    'missing actor identity fails closed without downstream runtime execution or mutation',
    'malformed auth session context fails closed despite body query header role and permission injection',
    'request abuse guard rejection still occurs before downstream controller application ports',
    'org-body-forbidden-task2365',
    'actor-query-forbidden-task2365',
    'x-organization-id',
    'permissionContext',
    'assert.deepEqual(clone(req), before)',
  ], 'auth failure matrix coverage');
});

test('route path permission middleware and request abuse guard remain unchanged', () => {
  const routeSource = read(SOURCE_PATHS.route);
  const apiModule = read(SOURCE_PATHS.apiModule);
  const requirePermissionSource = read(SOURCE_PATHS.requirePermission);
  const requireAuthSource = read(SOURCE_PATHS.requireAuth);
  const callSafeController = functionBlock(apiModule, 'callSafeController');

  assertIncludesAll(routeSource, [
    "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH = '/api/v1/admin/repair-intake/drafts/:draftId/case/submit'",
    "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION = 'cases.create'",
    'requirePermission(REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION)',
    'registerRepairIntakeDraftToCaseAdminRoutes',
  ], 'admin route markers');

  assertIncludesAll(requirePermissionSource, [
    "const { requireAuth } = require('./requireAuth')",
    'function hasPermission(user, permissionKey)',
    'function requirePermission(permissionKey)',
    'new PermissionError',
  ], 'requirePermission markers');

  assertIncludesAll(requireAuthSource, [
    'function requireAuth(req, res, next)',
    'if (req.user)',
    'extractBearerToken(req)',
    'new AuthError',
  ], 'requireAuth markers');

  assert.ok(
    callSafeController.indexOf('guardRepairIntakeDraftToCaseRequest(requestLike)')
      < callSafeController.indexOf('method.call('),
    'request abuse guard must remain before controller invocation',
  );
});

test('forbidden public route package DB smoke provider and route expansion remain absent', () => {
  const routeSource = read(SOURCE_PATHS.route);
  const packageJson = readJson(SOURCE_PATHS.packageJson);
  const packageLock = readJson(SOURCE_PATHS.packageLock);
  const dependencyNames = Object.keys({
    ...(packageJson.dependencies || {}),
    ...(packageJson.devDependencies || {}),
    ...(packageLock.packages && packageLock.packages[''] && packageLock.packages[''].dependencies),
    ...(packageLock.packages && packageLock.packages[''] && packageLock.packages[''].devDependencies),
  });
  const doc = read(DOC_PATH);

  assertExcludesAll(routeSource, PUBLIC_OPEN_ROUTE_MARKERS, 'admin route public/open/customer markers');
  assert.equal(fs.existsSync(projectPath('src/openRepairIntake')), false, 'src/openRepairIntake should remain absent');
  assert.equal(fs.existsSync(projectPath('tests/openRepairIntake')), false, 'tests/openRepairIntake should remain absent');

  for (const dependencyName of dependencyNames) {
    assert.equal(
      PACKAGE_EXPANSION_MARKERS.includes(dependencyName),
      false,
      `package dependency expansion should not include ${dependencyName}`,
    );
  }

  assertIncludesAll(doc, [
    'No runtime/source behavior changes.',
    'No server/listener startup.',
    'No endpoint probes or smoke behavior.',
    'No DB, env, Zea' + 'bur, or secrets usage.',
    'No provider sending.',
    'No package or package-lock changes.',
    'No public/open/customer route expansion.',
  ], 'Task2365 boundary doc');
});
