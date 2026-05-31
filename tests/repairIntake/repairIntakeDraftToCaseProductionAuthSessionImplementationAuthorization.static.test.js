'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const SOURCE_PATHS = Object.freeze({
  route: 'src/routes/repairIntakeDraftToCase.routes.js',
  apiModule: 'src/repairIntake/repairIntakeDraftToCaseApiModule.js',
  requireAuth: 'src/middlewares/requireAuth.js',
  requirePermission: 'src/middlewares/requirePermission.js',
  requireOrganizationAccess: 'src/middlewares/requireOrganizationAccess.js',
  authRoutes: 'src/routes/auth.routes.js',
  routesIndex: 'src/routes/index.js',
  requestId: 'src/middlewares/requestId.js',
});

const DOC_PATHS = Object.freeze({
  task2222: 'docs/task-2222-repair-intake-draft-to-case-production-auth-session-readiness-decision-gate-no-runtime-change-no-db-no-smoke-no-provider.md',
  task2344: 'docs/task-2344-repair-intake-draft-to-case-auth-session-context-boundary-inventory-no-runtime-change-no-db-no-smoke-no-provider-no-package.md',
  task2353: 'docs/task-2353-repair-intake-draft-to-case-auth-session-trusted-context-readiness-branch-closure-no-runtime-change-no-db-no-smoke-no-provider-no-package.md',
  task2354: 'docs/task-2354-repair-intake-draft-to-case-production-auth-session-implementation-authorization-packet-no-runtime-change-no-db-no-smoke-no-provider-no-package.md',
});

const TEST_PATHS = Object.freeze([
  'tests/repairIntake/repairIntakeDraftToCaseProductionAuthSessionReadinessDecisionGate.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseAuthSessionTrustedContextPortfolio.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseTrustedContextNormalizerRouteWiringBoundary.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseRequestAbuseGuardBoundary.static.test.js',
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

const PACKAGE_EXPANSION_MARKERS = Object.freeze([
  'express-session',
  'cookie-session',
  'passport',
  'firebase-admin',
  '@supabase/supabase-js',
  'express-rate-limit',
  'rate-limiter-flexible',
]);

const FORBIDDEN_REPAIR_INTAKE_EXECUTABLE_MARKERS = Object.freeze([
  'process.env.DATABASE_URL',
  "require('pg')",
  'require("pg")',
  'fetch(',
  'app.listen(',
  'server.listen(',
  'createServer(',
  'sendProvider',
  'sendToProvider',
  'createOpenAI',
  'vectorStore',
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

test('Task2354 static guard reads current source test and packet artifacts only', () => {
  for (const relativePath of [
    ...Object.values(SOURCE_PATHS),
    ...Object.values(DOC_PATHS),
    ...TEST_PATHS,
    'package.json',
    'package-lock.json',
  ]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }

  const guardSource = read('tests/repairIntake/repairIntakeDraftToCaseProductionAuthSessionImplementationAuthorization.static.test.js');
  const topLevelImports = guardSource.split('\n').slice(0, 8).join('\n');

  assert.deepEqual(requireSpecifiers(topLevelImports).sort(), [
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:test',
  ]);
});

test('authorization packet exists and recommends exactly one next bounded runtime task', () => {
  const packet = read(DOC_PATHS.task2354);
  const recommendedMatches = packet.match(/Recommended next bounded runtime task:/g) || [];

  assert.equal(recommendedMatches.length, 1);
  assertIncludesAll(packet, [
    'Task2354 Repair Intake Draft-to-Case Production Auth Session Implementation Authorization Packet',
    'Production Auth Session Implementation Inventory',
    'Future Implementation Boundary Decision',
    'Recommended next bounded runtime task:',
    'Task2355 - Repair Intake Draft-to-Case Production Auth Session Context Adapter Helper',
    'pure auth/session context adapter helper first',
  ], 'Task2354 packet recommendation');
});

test('current route remains admin injected permission gated and trusted-context normalized', () => {
  const routeSource = read(SOURCE_PATHS.route);
  const buildAdminRequestLike = functionBlock(routeSource, 'buildAdminRequestLike');

  assertIncludesAll(routeSource, [
    "const { requirePermission } = require('../middlewares/requirePermission')",
    "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH = '/api/v1/admin/repair-intake/drafts/:draftId/case/submit'",
    "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION = 'cases.create'",
    'requirePermission(REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION)',
    'createRepairIntakeDraftToCaseInjectedRouteComposition',
    'registerRepairIntakeDraftToCaseAdminRoutes',
  ], 'admin route markers');

  assertIncludesAll(buildAdminRequestLike, [
    'const requestBody = bodyWithoutServerOwnedContext(body)',
    'const trustedContextResult = normalizeRepairIntakeDraftToCaseTrustedContext({',
    'params,',
    'user,',
    'context,',
    'sessionContext: context',
    'permissionContext: adminPermissionContext',
    'requestId: requestId(req)',
    'idempotencyKey: idempotencyKey(req)',
    'const resolvedOrganizationId = trustedContext.organizationId',
    'const resolvedActorId = trustedContext.actorId',
    'const resolvedDraftId = trustedContext.repairIntakeDraftId',
  ], 'trusted context normalizer route wiring');

  assertExcludesAll(routeSource, PUBLIC_OPEN_ROUTE_MARKERS, 'Repair Intake draft-to-case route exposure');
});

test('current middleware candidates and handoff sources remain inventoried but not newly wired', () => {
  const requireAuth = read(SOURCE_PATHS.requireAuth);
  const requirePermission = read(SOURCE_PATHS.requirePermission);
  const requireOrganizationAccess = read(SOURCE_PATHS.requireOrganizationAccess);
  const authRoutes = read(SOURCE_PATHS.authRoutes);
  const requestId = read(SOURCE_PATHS.requestId);
  const routeSource = read(SOURCE_PATHS.route);

  assertIncludesAll(requireAuth, [
    'function extractBearerToken(req)',
    "req.get('authorization')",
    "scheme !== 'Bearer'",
    'req.user = await authService.getCurrentUserFromToken(token)',
  ], 'existing requireAuth candidate');

  assertIncludesAll(requirePermission, [
    "const { requireAuth } = require('./requireAuth')",
    'function requirePermission(permissionKey)',
    'requireAuth(req, res, (authError) => {',
    'hasPermission(req.user, permissionKey)',
  ], 'existing requirePermission candidate');

  assertIncludesAll(requireOrganizationAccess, [
    'req.params.organizationId',
    'req.body?.organizationId',
    'req.query?.organizationId',
  ], 'organization access candidate inventory');

  assertIncludesAll(authRoutes, [
    "router.get('/me', requireAuth",
    "router.post('/logout', requireAuth",
  ], 'auth route requireAuth usage');

  assertIncludesAll(requestId, [
    "req.get('X-Request-Id')",
    'req.requestId = currentRequestId',
    "res.setHeader('X-Request-Id', currentRequestId)",
  ], 'request id middleware inventory');

  assertExcludesAll(routeSource, [
    'ProductionAuthSessionContextAdapter',
    'repairIntakeDraftToCaseAuthSessionContextAdapter',
  ], 'Task2354 must not introduce future adapter wiring');
});

test('request abuse guard remains downstream and no forbidden coupling is introduced', () => {
  const apiModule = read(SOURCE_PATHS.apiModule);
  const callSafeController = functionBlock(apiModule, 'callSafeController');
  const repairIntakeExecutableSource = [
    SOURCE_PATHS.route,
    SOURCE_PATHS.apiModule,
  ].map(read).join('\n');
  const packageJson = readJson('package.json');
  const packageLock = readJson('package-lock.json');
  const packageNames = Object.keys({
    ...(packageJson.dependencies || {}),
    ...(packageJson.devDependencies || {}),
    ...(packageLock.packages && packageLock.packages[''] && packageLock.packages[''].dependencies),
    ...(packageLock.packages && packageLock.packages[''] && packageLock.packages[''].devDependencies),
  });

  assertIncludesAll(callSafeController, [
    'const abuseGuardResult = guardRepairIntakeDraftToCaseRequest(requestLike)',
    'if (!abuseGuardResult.ok)',
    'safeControllerFailure(',
    'sanitizeRequestInput(requestLike)',
    'method.call(',
  ], 'API module request abuse guard');

  assert.ok(
    callSafeController.indexOf('guardRepairIntakeDraftToCaseRequest(requestLike)')
      < callSafeController.indexOf('method.call('),
    'request abuse guard must remain before controller invocation',
  );

  assertExcludesAll(repairIntakeExecutableSource, FORBIDDEN_REPAIR_INTAKE_EXECUTABLE_MARKERS, 'forbidden executable coupling');

  for (const packageName of packageNames) {
    assert.equal(
      PACKAGE_EXPANSION_MARKERS.includes(packageName),
      false,
      `package dependency expansion should not include ${packageName}`,
    );
  }

  assert.equal(fs.existsSync(projectPath('src/openRepairIntake')), false, 'src/openRepairIntake should remain absent');
  assert.equal(fs.existsSync(projectPath('tests/openRepairIntake')), false, 'tests/openRepairIntake should remain absent');
});
