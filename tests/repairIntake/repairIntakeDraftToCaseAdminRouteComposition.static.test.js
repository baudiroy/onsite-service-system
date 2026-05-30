'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROUTE_SOURCE_PATH = path.resolve(
  __dirname,
  '../../src/routes/repairIntakeDraftToCase.routes.js',
);
const ADMIN_ROUTE_MOUNT_TEST_PATH = path.resolve(
  __dirname,
  './repairIntakeDraftToCaseAdminRouteMount.unit.test.js',
);
const TASK2212_STATIC_TEST_PATH = path.resolve(
  __dirname,
  './repairIntakeDraftToCaseProductionRouteExposureDecisionGate.static.test.js',
);

const PUBLIC_OPEN_ROUTE_MARKERS = [
  '/public',
  '/open',
  '/customer',
  '/intake/open',
  '/repair-intake/open',
  'openRepairIntake',
  'public.routes',
  'customerAccess',
  'customer-access',
];

const FORBIDDEN_ROUTE_SOURCE_MARKERS = [
  "require('../db",
  "require('../../src/db",
  "require('../repositories",
  "require('../../src/repositories",
  "require('../providers",
  "require('../../src/providers",
  "require('../server",
  "require('../../src/server",
  "require('../app",
  "require('../../src/app",
  'DATABASE_URL',
  'process.env',
  'app.listen',
  'server.listen',
  'listen(',
  'sendLine',
  'sendSms',
  'sendEmail',
  'webhook',
  'openai',
  'vector',
  'rag',
  'billing',
  'settlement',
  'payment',
  'invoice',
  'admin/src',
];

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function requireSpecifiers(source) {
  return Array.from(source.matchAll(/require\((['"])([^'"]+)\1\)/g))
    .map((match) => match[2]);
}

function functionBlock(source, functionName) {
  const marker = `function ${functionName}`;
  const start = source.indexOf(marker);

  assert.notEqual(start, -1, `missing function ${functionName}`);

  const signatureEnd = source.indexOf(') {', start);

  assert.notEqual(signatureEnd, -1, `missing function body ${functionName}`);

  const openBrace = signatureEnd + 2;
  let depth = 0;

  for (let index = openBrace; index < source.length; index += 1) {
    const char = source[index];

    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
    }

    if (depth === 0) {
      return source.slice(start, index + 1);
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
    assert.equal(source.includes(marker), false, `${label} contains marker ${marker}`);
  }
}

test('Task2213 admin route composition guard reads current route and adjacent guards', () => {
  for (const filePath of [
    ROUTE_SOURCE_PATH,
    ADMIN_ROUTE_MOUNT_TEST_PATH,
    TASK2212_STATIC_TEST_PATH,
  ]) {
    assert.equal(fs.existsSync(filePath), true, `missing ${filePath}`);
  }
});

test('admin route stays explicit admin scoped method and path with no public open markers', () => {
  const routeSource = readFile(ROUTE_SOURCE_PATH);
  const mountSummary = functionBlock(routeSource, 'mountSummary');

  assertIncludesAll(routeSource, [
    "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_BASE_PATH = '/api/v1/admin'",
    "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH = '/api/v1/admin/repair-intake/drafts/:draftId/case/submit'",
    "method: 'POST'",
    'path: REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH',
  ], 'admin route source');
  assertIncludesAll(mountSummary, [
    "method: 'POST'",
    'path: REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH',
  ], 'mount summary');
  assertExcludesAll(routeSource, PUBLIC_OPEN_ROUTE_MARKERS, 'admin route source');
});

test('admin route permission gate remains requirePermission with cases.create', () => {
  const routeSource = readFile(ROUTE_SOURCE_PATH);

  assertIncludesAll(routeSource, [
    "const { requirePermission } = require('../middlewares/requirePermission')",
    "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION = 'cases.create'",
    'requirePermission(REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION)',
    'permission: REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION',
  ], 'permission gate source');
});

test('registration remains gated by explicit enablement and injected runtime ports', () => {
  const routeSource = readFile(ROUTE_SOURCE_PATH);
  const adminRoutesEnabled = functionBlock(routeSource, 'adminRoutesEnabled');
  const getRuntimePorts = functionBlock(routeSource, 'getRepairIntakeDraftToCaseRuntimePorts');
  const registerRoutes = functionBlock(routeSource, 'registerRepairIntakeDraftToCaseAdminRoutes');

  assertIncludesAll(adminRoutesEnabled, [
    'repairIntakeDraftToCaseRoutesEnabled === true',
    'options.routesEnabled === true',
    'options.repairIntakeDraftToCase.routesEnabled === true',
  ], 'admin route enablement gate');
  assertIncludesAll(getRuntimePorts, [
    'options.repairIntakeDraftToCaseRuntimePorts',
    'options.repairIntakeDraftToCase.runtimePorts',
  ], 'runtime port resolver');
  assert.match(registerRoutes, /if \(!adminRoutesEnabled\(options\)\) \{[\s\S]*?return mountSummary\(false, null\);[\s\S]*?\}/);
  assert.match(registerRoutes, /if \(!runtimePorts\) \{[\s\S]*?return mountSummary\(false, null\);[\s\S]*?\}/);
  assertIncludesAll(registerRoutes, [
    'createRepairIntakeDraftToCaseInjectedRouteComposition({',
    'runtimePorts,',
    'basePath: REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_BASE_PATH',
    'mountTarget,',
  ], 'admin route registration');
});

test('admin route depends on injected composition only and avoids direct runtime dependencies', () => {
  const routeSource = readFile(ROUTE_SOURCE_PATH);

  assert.deepEqual(requireSpecifiers(routeSource), [
    '../middlewares/requirePermission',
    '../repairIntake/repairIntakeDraftToCaseInjectedRouteComposition',
  ]);
  assertExcludesAll(routeSource, FORBIDDEN_ROUTE_SOURCE_MARKERS, 'admin route source');
});

test('trusted draftId comes from route params and body context fields are scrubbed', () => {
  const routeSource = readFile(ROUTE_SOURCE_PATH);
  const draftId = functionBlock(routeSource, 'draftId');
  const bodyWithoutServerOwnedContext = functionBlock(routeSource, 'bodyWithoutServerOwnedContext');
  const stripBodyContextFields = functionBlock(routeSource, 'stripBodyContextFields');
  const buildAdminRequestLike = functionBlock(routeSource, 'buildAdminRequestLike');

  assertIncludesAll(draftId, [
    'params.draftId',
  ], 'draft id helper');
  assert.equal(draftId.includes('body.draftId'), false);
  assertIncludesAll(bodyWithoutServerOwnedContext, [
    'actorId',
    'actorRole',
    'caseId',
    'correlationId',
    'debugId',
    'dedupeKey',
    'draftId: bodyDraftId',
    'idempotencyKey',
    'organizationId: bodyOrganizationId',
    'repairIntakeDraftId',
    'requestId: bodyRequestId',
    'source',
    'traceId',
    'return stripBodyContextFields(safeBody)',
  ], 'body context scrubber');
  assertIncludesAll(stripBodyContextFields, [
    'Array.isArray(value)',
    'BODY_CONTEXT_FIELD_NAMES.has(normalizedFieldName(key))',
    'continue',
    'result[key] = stripBodyContextFields(fieldValue)',
  ], 'recursive body context scrubber');
  assertIncludesAll(buildAdminRequestLike, [
    'const requestBody = bodyWithoutServerOwnedContext(body)',
    'const resolvedDraftId = draftId(params, body)',
    'repairIntakeDraftId: resolvedDraftId',
    'draftId: resolvedDraftId',
    'body: {',
    '...requestBody',
  ], 'admin request builder');
});

test('existing behavior tests still cover protected admin mount and body draft id refusal', () => {
  const adminRouteMountTest = readFile(ADMIN_ROUTE_MOUNT_TEST_PATH);

  assertIncludesAll(adminRouteMountTest, [
    'feature flag without runtime ports keeps protected admin route unmounted',
    'feature flag and injected runtime ports mount only protected admin submit route',
    'protected admin route requires cases.create permission before submit handler',
    'admin request builder ignores body actor and grants permission from route middleware',
    'admin request builder does not trust body draft id as route context',
    'publicRepairIntakeRouteLayers(appRouter).length, 0',
  ], 'admin route mount behavior tests');
});
