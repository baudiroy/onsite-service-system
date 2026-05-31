'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const SOURCE_PATHS = Object.freeze({
  route: 'src/routes/repairIntakeDraftToCase.routes.js',
  apiModule: 'src/repairIntake/repairIntakeDraftToCaseApiModule.js',
  authAdapter: 'src/repairIntake/repairIntakeDraftToCaseAuthSessionContextAdapter.js',
  trustedNormalizer: 'src/repairIntake/repairIntakeDraftToCaseTrustedContextNormalizer.js',
  requireAuth: 'src/middlewares/requireAuth.js',
  requirePermission: 'src/middlewares/requirePermission.js',
  packageJson: 'package.json',
  packageLock: 'package-lock.json',
});

const DOC_PATHS = Object.freeze({
  task2342: 'docs/task-2342-repair-intake-draft-to-case-request-abuse-guard-runtime-boundary-no-db-no-smoke-no-provider-no-package.md',
  task2343: 'docs/task-2343-repair-intake-draft-to-case-request-abuse-guard-runtime-boundary-checkpoint-no-runtime-change-no-db-no-smoke-no-provider-no-package.md',
  task2344: 'docs/task-2344-repair-intake-draft-to-case-auth-session-context-boundary-inventory-no-runtime-change-no-db-no-smoke-no-provider-no-package.md',
  task2345: 'docs/task-2345-repair-intake-draft-to-case-trusted-context-normalizer-contract-static-guard-no-runtime-change-no-db-no-smoke-no-provider-no-package.md',
  task2346: 'docs/task-2346-repair-intake-draft-to-case-trusted-context-normalizer-pure-helper-preflight-design-packet-no-runtime-change-no-db-no-smoke-no-provider-no-package.md',
  task2347: 'docs/task-2347-repair-intake-draft-to-case-trusted-context-normalizer-pure-helper-implementation-no-route-wiring-no-db-no-smoke-no-provider-no-package.md',
  task2348: 'docs/task-2348-repair-intake-draft-to-case-trusted-context-normalizer-route-wiring-decision-gate-no-runtime-change-no-db-no-smoke-no-provider-no-package.md',
  task2349: 'docs/task-2349-repair-intake-draft-to-case-trusted-context-normalizer-route-boundary-wiring-design-packet-no-runtime-change-no-db-no-smoke-no-provider-no-package.md',
  task2350: 'docs/task-2350-repair-intake-draft-to-case-trusted-context-normalizer-route-boundary-wiring-implementation-no-route-path-change-no-db-no-smoke-no-provider-no-package.md',
  task2351: 'docs/task-2351-repair-intake-draft-to-case-trusted-context-normalizer-route-wiring-checkpoint-no-runtime-change-no-db-no-smoke-no-provider-no-package.md',
  task2352: 'docs/task-2352-repair-intake-draft-to-case-auth-session-trusted-context-portfolio-static-guard-no-runtime-change-no-db-no-smoke-no-provider-no-package.md',
  task2353: 'docs/task-2353-repair-intake-draft-to-case-auth-session-trusted-context-readiness-branch-closure-no-runtime-change-no-db-no-smoke-no-provider-no-package.md',
  task2354: 'docs/task-2354-repair-intake-draft-to-case-production-auth-session-implementation-authorization-packet-no-runtime-change-no-db-no-smoke-no-provider-no-package.md',
  task2355: 'docs/task-2355-repair-intake-draft-to-case-production-auth-session-context-adapter-helper-no-route-wiring-no-db-no-smoke-no-provider-no-package.md',
  task2356: 'docs/task-2356-repair-intake-draft-to-case-auth-session-context-adapter-route-wiring-decision-gate-no-runtime-change-no-db-no-smoke-no-provider-no-package.md',
  task2357: 'docs/task-2357-repair-intake-draft-to-case-auth-session-context-adapter-route-boundary-wiring-implementation-no-route-path-change-no-db-no-smoke-no-provider-no-package.md',
  task2358: 'docs/task-2358-repair-intake-draft-to-case-auth-session-context-adapter-route-wiring-checkpoint-no-runtime-change-no-db-no-smoke-no-provider-no-package.md',
  task2359: 'docs/task-2359-repair-intake-draft-to-case-auth-session-route-wiring-portfolio-static-guard-no-runtime-change-no-db-no-smoke-no-provider-no-package.md',
  task2360: 'docs/task-2360-repair-intake-draft-to-case-auth-session-route-wiring-branch-closure-no-runtime-change-no-db-no-smoke-no-provider-no-package.md',
  task2361: 'docs/task-2361-repair-intake-draft-to-case-admin-route-composition-synthetic-test-no-server-no-db-no-smoke-no-provider-no-package.md',
  task2362: 'docs/task-2362-repair-intake-draft-to-case-admin-route-composition-synthetic-checkpoint-no-runtime-change-no-db-no-smoke-no-provider-no-package.md',
});

const TEST_PATHS = Object.freeze([
  'tests/repairIntake/repairIntakeDraftToCaseRequestAbuseGuardBoundary.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseAuthSessionContextBoundary.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseTrustedContextNormalizerContract.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseTrustedContextNormalizerPreflight.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseTrustedContextNormalizer.unit.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseTrustedContextNormalizerHelperBoundary.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseTrustedContextNormalizerRouteWiringDecisionGate.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseTrustedContextNormalizerRouteWiringDesign.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseTrustedContextNormalizerRouteWiring.unit.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseTrustedContextNormalizerRouteWiringBoundary.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseAuthSessionTrustedContextPortfolio.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseProductionAuthSessionImplementationAuthorization.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseAuthSessionContextAdapter.unit.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseAuthSessionContextAdapterBoundary.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseAuthSessionContextAdapterRouteWiringDecisionGate.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseAuthSessionContextAdapterRouteWiring.unit.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseAuthSessionContextAdapterRouteWiringBoundary.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseAuthSessionRouteWiringPortfolio.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseProductionRouteExposureDecisionGate.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseProductionAuthSessionReadinessDecisionGate.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseAdminRouteCompositionSynthetic.unit.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseAdminRouteCompositionSyntheticBoundary.static.test.js',
]);

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

test('Task2363 portfolio guard reads accepted artifacts as text only', () => {
  for (const relativePath of [
    ...Object.values(SOURCE_PATHS),
    ...Object.values(DOC_PATHS),
    ...TEST_PATHS,
  ]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }

  const guardSource = read('tests/repairIntake/repairIntakeDraftToCaseAdminRouteCompositionPortfolio.static.test.js');
  const topLevelImports = guardSource.split('\n').slice(0, 8).join('\n');

  assert.deepEqual(requireSpecifiers(topLevelImports).sort(), [
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:test',
  ]);
});

test('accepted Task2342 through Task2362 portfolio docs and tests remain visible', () => {
  const docs = Object.values(DOC_PATHS).map(read).join('\n');
  const tests = TEST_PATHS.map(read).join('\n');

  assertIncludesAll(docs, [
    'Task2342 Repair Intake Draft-to-Case Request Abuse Guard Runtime Boundary',
    'Task2343 Repair Intake Draft-to-Case Request Abuse Guard Runtime Boundary Checkpoint',
    'Task2344 Repair Intake Draft-to-Case Auth Session Context Boundary Inventory',
    'Task2345 Repair Intake Draft-to-Case Trusted Context Normalizer Contract Static Guard',
    'Task2346 Repair Intake Draft-to-Case Trusted Context Normalizer Pure Helper Preflight Design Packet',
    'Task2347 Repair Intake Draft-to-Case Trusted Context Normalizer Pure Helper Implementation',
    'Task2348 Repair Intake Draft-to-Case Trusted Context Normalizer Route Wiring Decision Gate',
    'Task2349 Repair Intake Draft-to-Case Trusted Context Normalizer Route Boundary Wiring Design Packet',
    'Task2350 Repair Intake Draft-to-Case Trusted Context Normalizer Route Boundary Wiring Implementation',
    'Task2351 Repair Intake Draft-to-Case Trusted Context Normalizer Route Wiring Checkpoint',
    'Task2352 Repair Intake Draft-to-Case Auth Session Trusted Context Portfolio Static Guard',
    'Task2353 Repair Intake Draft-to-Case Auth Session Trusted Context Readiness Branch Closure',
    'Task2354 Repair Intake Draft-to-Case Production Auth Session Implementation Authorization Packet',
    'Task2355 Repair Intake Draft-to-Case Production Auth Session Context Adapter Helper',
    'Task2356 Repair Intake Draft-to-Case Auth Session Context Adapter Route Wiring Decision Gate',
    'Task2357 Repair Intake Draft-to-Case Auth Session Context Adapter Route Boundary Wiring Implementation',
    'Task2358 Repair Intake Draft-to-Case Auth Session Context Adapter Route Wiring Checkpoint',
    'Task2359 Repair Intake Draft-to-Case Auth Session Route Wiring Portfolio Static Guard',
    'Task2360 Repair Intake Draft-to-Case Auth Session Route Wiring Branch Closure',
    'Task2361 Repair Intake Draft-to-Case Admin Route Composition Synthetic Test',
    'Task2362 Repair Intake Draft-to-Case Admin Route Composition Synthetic Checkpoint',
  ], 'accepted portfolio docs');

  assertIncludesAll(tests, [
    'repairIntakeDraftToCaseRequestAbuseGuardBoundary',
    'repairIntakeDraftToCaseTrustedContextNormalizerRouteWiring',
    'repairIntakeDraftToCaseAuthSessionTrustedContextPortfolio',
    'repairIntakeDraftToCaseAuthSessionContextAdapterRouteWiring',
    'repairIntakeDraftToCaseAuthSessionRouteWiringPortfolio',
    'repairIntakeDraftToCaseAdminRouteCompositionSynthetic',
  ], 'accepted portfolio tests');
});

test('admin route composition path permission request-like adapter and guard order remain fixed', () => {
  const routeSource = read(SOURCE_PATHS.route);
  const apiModule = read(SOURCE_PATHS.apiModule);
  const buildAdminRequestLike = functionBlock(routeSource, 'buildAdminRequestLike');
  const bodyWithoutServerOwnedContext = functionBlock(routeSource, 'bodyWithoutServerOwnedContext');
  const createAdminMountTarget = functionBlock(routeSource, 'createAdminMountTarget');
  const registerAdminRoutes = functionBlock(routeSource, 'registerRepairIntakeDraftToCaseAdminRoutes');
  const callSafeController = functionBlock(apiModule, 'callSafeController');

  assertIncludesAll(routeSource, [
    "const REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION = 'cases.create'",
    "const REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_BASE_PATH = '/api/v1/admin'",
    "const REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH = '/api/v1/admin/repair-intake/drafts/:draftId/case/submit'",
    "require('../repairIntake/repairIntakeDraftToCaseAuthSessionContextAdapter')",
    "require('../repairIntake/repairIntakeDraftToCaseTrustedContextNormalizer')",
    'function buildAdminRequestLike(req = {})',
    'function registerRepairIntakeDraftToCaseAdminRoutes(router, options = {})',
  ], 'route composition markers');

  assertIncludesAll(createAdminMountTarget, [
    'router.post(',
    'REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH',
    'requirePermission(REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION)',
    'createExpressSubmitHandler(routeHandler)',
  ], 'admin router post composition');

  assertIncludesAll(registerAdminRoutes, [
    'getRepairIntakeDraftToCaseRuntimePorts(options)',
    'createAdminMountTarget(router)',
    'createRepairIntakeDraftToCaseInjectedRouteComposition({',
    'basePath: REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_BASE_PATH',
    'mountTarget,',
  ], 'admin injected-only registration');

  assertIncludesAll(bodyWithoutServerOwnedContext, [
    'actorId',
    'actorRole',
    'draftId: bodyDraftId',
    'idempotencyKey',
    'organizationId: bodyOrganizationId',
    'repairIntakeDraftId',
    'requestId: bodyRequestId',
    'stripBodyContextFields(safeBody)',
  ], 'server-owned body context stripping');

  assertIncludesAll(buildAdminRequestLike, [
    'const requestBody = bodyWithoutServerOwnedContext(body)',
    'const adminPermissionContext = {',
    'buildRepairIntakeDraftToCaseAuthSessionContext({',
    'permissionContext: adminPermissionContext',
    'normalizeRepairIntakeDraftToCaseTrustedContext({',
    'context: authSessionContext',
    'sessionContext: authSessionContext',
    'body: {',
    'permissionContext: {',
  ], 'request-like auth/trusted context handoff');

  assert.ok(
    buildAdminRequestLike.indexOf('bodyWithoutServerOwnedContext(body)')
      < buildAdminRequestLike.indexOf('buildRepairIntakeDraftToCaseAuthSessionContext({'),
    'body/server-owned context stripping must remain before auth adapter',
  );
  assert.ok(
    buildAdminRequestLike.indexOf('buildRepairIntakeDraftToCaseAuthSessionContext({')
      < buildAdminRequestLike.indexOf('normalizeRepairIntakeDraftToCaseTrustedContext({'),
    'auth adapter must remain before trusted context normalizer',
  );
  assert.ok(
    callSafeController.indexOf('guardRepairIntakeDraftToCaseRequest(requestLike)')
      < callSafeController.indexOf('method.call('),
    'request abuse guard must remain before controller invocation',
  );
});

test('auth and trusted context helpers stay wired only at route request-like boundary', () => {
  const routeSource = read(SOURCE_PATHS.route);
  const apiModule = read(SOURCE_PATHS.apiModule);
  const authAdapter = read(SOURCE_PATHS.authAdapter);
  const trustedNormalizer = read(SOURCE_PATHS.trustedNormalizer);
  const middlewareSource = [
    SOURCE_PATHS.requireAuth,
    SOURCE_PATHS.requirePermission,
  ].map(read).join('\n');

  assertIncludesAll(authAdapter, [
    'function buildRepairIntakeDraftToCaseAuthSessionContext(input = {})',
    'auth_session_context_ready',
    'auth_session_context_organization_required',
    'auth_session_context_actor_required',
  ], 'auth session context adapter');

  assertIncludesAll(trustedNormalizer, [
    'function normalizeRepairIntakeDraftToCaseTrustedContext(input = {})',
    'trusted_context_ready',
    'trusted_context_organization_required',
    'trusted_context_draft_required',
    'trusted_context_actor_required',
  ], 'trusted context normalizer');

  assertExcludesAll(apiModule, [
    'repairIntakeDraftToCaseAuthSessionContextAdapter',
    'buildRepairIntakeDraftToCaseAuthSessionContext',
    'repairIntakeDraftToCaseTrustedContextNormalizer',
    'normalizeRepairIntakeDraftToCaseTrustedContext',
  ], 'API module route boundary helper coupling');

  assertExcludesAll(middlewareSource, [
    'repairIntakeDraftToCaseAuthSessionContextAdapter',
    'buildRepairIntakeDraftToCaseAuthSessionContext',
    'repairIntakeDraftToCaseTrustedContextNormalizer',
    'normalizeRepairIntakeDraftToCaseTrustedContext',
  ], 'auth/permission middleware helper coupling');

  assertIncludesAll(routeSource, [
    'buildRepairIntakeDraftToCaseAuthSessionContext({',
    'normalizeRepairIntakeDraftToCaseTrustedContext({',
    'buildAdminRequestLike',
  ], 'route request-like helper coupling');
});

test('synthetic proof remains fake-router injected-ports only and covers safe trust boundaries', () => {
  const unitSource = read('tests/repairIntake/repairIntakeDraftToCaseAdminRouteCompositionSynthetic.unit.test.js');
  const boundarySource = read('tests/repairIntake/repairIntakeDraftToCaseAdminRouteCompositionSyntheticBoundary.static.test.js');
  const combinedSource = sourceWithoutAllowedLists(`${unitSource}\n${boundarySource}`);

  assertIncludesAll(combinedSource, [
    'function createFakeRouter()',
    'function createRuntimePorts(calls = [])',
    'registerRepairIntakeDraftToCaseAdminRoutes(router, {',
    'repairIntakeDraftToCaseRuntimePorts: createRuntimePorts(runtimeCalls)',
    'invokeAdminRoute(routeCall, req)',
    'mounting route must not execute runtime ports',
    'trusted route auth session context reaches downstream synthetic runtime safely',
    'context fallback remains trusted when authenticated user lacks organization tenant fields',
    'missing trusted organization fails closed without case creation or unsafe leakage',
    'request abuse guard rejects unsafe deep request before downstream controller ports',
    'query:',
    'headers:',
    'clientPayload:',
    'requestBody:',
    'draftInput:',
    'assert.deepEqual(req, before)',
    'assertNoRawLeak',
  ], 'synthetic proof coverage');

  assertExcludesAll(combinedSource, FORBIDDEN_TEST_MARKERS, 'synthetic proof forbidden coupling');
});

test('forbidden server DB smoke provider route expansion and package coupling remain absent', () => {
  const routeSource = read(SOURCE_PATHS.route);
  const packageJson = readJson(SOURCE_PATHS.packageJson);
  const packageLock = readJson(SOURCE_PATHS.packageLock);
  const dependencyNames = Object.keys({
    ...(packageJson.dependencies || {}),
    ...(packageJson.devDependencies || {}),
    ...(packageLock.packages && packageLock.packages[''] && packageLock.packages[''].dependencies),
    ...(packageLock.packages && packageLock.packages[''] && packageLock.packages[''].devDependencies),
  });

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
});
