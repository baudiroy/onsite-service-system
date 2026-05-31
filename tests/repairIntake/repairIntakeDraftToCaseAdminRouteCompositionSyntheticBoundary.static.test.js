'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const UNIT_TEST_PATH = 'tests/repairIntake/repairIntakeDraftToCaseAdminRouteCompositionSynthetic.unit.test.js';
const DOC_PATH = 'docs/task-2361-repair-intake-draft-to-case-admin-route-composition-synthetic-test-no-server-no-db-no-smoke-no-provider-no-package.md';

const SOURCE_PATHS = Object.freeze({
  route: 'src/routes/repairIntakeDraftToCase.routes.js',
  apiModule: 'src/repairIntake/repairIntakeDraftToCaseApiModule.js',
  authAdapter: 'src/repairIntake/repairIntakeDraftToCaseAuthSessionContextAdapter.js',
  trustedNormalizer: 'src/repairIntake/repairIntakeDraftToCaseTrustedContextNormalizer.js',
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
  'openai',
  'vector',
  'admin/src',
  'billing',
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

test('Task2361 synthetic tests and doc exist and stay test/doc only', () => {
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

test('synthetic route composition test uses fake router and no server endpoint smoke DB or provider execution', () => {
  const combinedSource = sourceWithoutAllowedLists(`${read(UNIT_TEST_PATH)}\n${read(__filename.replace(`${repoRoot}/`, ''))}`);

  assertIncludesAll(combinedSource, [
    'function createFakeRouter()',
    'registerRepairIntakeDraftToCaseAdminRoutes(router, {',
    'repairIntakeDraftToCaseRuntimePorts: createRuntimePorts(runtimeCalls)',
    'invokeAdminRoute(routeCall, req)',
    'REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH',
    'REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION',
  ], 'synthetic fake route composition markers');

  assertExcludesAll(combinedSource, FORBIDDEN_TEST_MARKERS, 'synthetic test source');
});

test('route path permission auth adapter normalizer and request abuse order remain visible', () => {
  const routeSource = read(SOURCE_PATHS.route);
  const apiModule = read(SOURCE_PATHS.apiModule);
  const buildAdminRequestLike = functionBlock(routeSource, 'buildAdminRequestLike');
  const callSafeController = functionBlock(apiModule, 'callSafeController');

  assertIncludesAll(routeSource, [
    "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH = '/api/v1/admin/repair-intake/drafts/:draftId/case/submit'",
    "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION = 'cases.create'",
    'requirePermission(REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION)',
    'createRepairIntakeDraftToCaseInjectedRouteComposition',
    'registerRepairIntakeDraftToCaseAdminRoutes',
  ], 'route path permission markers');

  assertIncludesAll(buildAdminRequestLike, [
    'const requestBody = bodyWithoutServerOwnedContext(body)',
    'const authSessionContextResult = buildRepairIntakeDraftToCaseAuthSessionContext({',
    'context: authSessionContext',
    'sessionContext: authSessionContext',
    'normalizeRepairIntakeDraftToCaseTrustedContext({',
  ], 'route auth/trusted context wiring');

  assert.ok(
    buildAdminRequestLike.indexOf('bodyWithoutServerOwnedContext(body)')
      < buildAdminRequestLike.indexOf('buildRepairIntakeDraftToCaseAuthSessionContext({'),
    'body stripping must remain before auth adapter invocation',
  );
  assert.ok(
    buildAdminRequestLike.indexOf('buildRepairIntakeDraftToCaseAuthSessionContext({')
      < buildAdminRequestLike.indexOf('normalizeRepairIntakeDraftToCaseTrustedContext({'),
    'auth adapter must remain before trusted normalizer',
  );
  assert.ok(
    callSafeController.indexOf('guardRepairIntakeDraftToCaseRequest(requestLike)')
      < callSafeController.indexOf('method.call('),
    'request abuse guard must remain before controller invocation',
  );
});

test('synthetic unit coverage proves trusted context body override rejection safe failure no mutation and no leak', () => {
  const unitSource = read(UNIT_TEST_PATH);

  assertIncludesAll(unitSource, [
    'trusted route auth session context reaches downstream synthetic runtime safely',
    'context fallback remains trusted when authenticated user lacks organization tenant fields',
    'missing trusted organization fails closed without case creation or unsafe leakage',
    'request abuse guard rejects unsafe deep request before downstream controller ports',
    'requestBody:',
    'draftInput:',
    'query:',
    'headers:',
    'clientPayload:',
    'assert.deepEqual(req, before)',
    'assertNoRawLeak',
  ], 'synthetic unit coverage markers');
});

test('forbidden public route and package expansion remain absent', () => {
  const routeSource = read(SOURCE_PATHS.route);
  const packageJson = readJson('package.json');
  const packageLock = readJson('package-lock.json');
  const dependencyNames = Object.keys({
    ...(packageJson.dependencies || {}),
    ...(packageJson.devDependencies || {}),
    ...(packageLock.packages && packageLock.packages[''] && packageLock.packages[''].dependencies),
    ...(packageLock.packages && packageLock.packages[''] && packageLock.packages[''].devDependencies),
  });
  const doc = read(DOC_PATH);

  assertExcludesAll(routeSource, PUBLIC_OPEN_ROUTE_MARKERS, 'admin route public/open markers');
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
    'No server/listener startup.',
    'No smoke test execution.',
    'No endpoint probes.',
    'No DB commands, SQL execution, real DB connection, migration creation, migration dry-run, or migration apply.',
    'No provider sending.',
    'No package or package-lock changes.',
  ], 'Task2361 non-authorization doc');
});
