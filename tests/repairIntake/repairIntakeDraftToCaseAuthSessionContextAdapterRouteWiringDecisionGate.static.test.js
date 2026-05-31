'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const SOURCE_PATHS = Object.freeze({
  route: 'src/routes/repairIntakeDraftToCase.routes.js',
  apiModule: 'src/repairIntake/repairIntakeDraftToCaseApiModule.js',
  applicationService: 'src/repairIntake/repairIntakeDraftToCaseApplicationService.js',
  controllerAdapter: 'src/repairIntake/repairIntakeDraftCaseControllerAdapter.js',
  authAdapter: 'src/repairIntake/repairIntakeDraftToCaseAuthSessionContextAdapter.js',
  trustedNormalizer: 'src/repairIntake/repairIntakeDraftToCaseTrustedContextNormalizer.js',
  requireAuth: 'src/middlewares/requireAuth.js',
  requirePermission: 'src/middlewares/requirePermission.js',
});

const DOC_PATHS = Object.freeze({
  task2354: 'docs/task-2354-repair-intake-draft-to-case-production-auth-session-implementation-authorization-packet-no-runtime-change-no-db-no-smoke-no-provider-no-package.md',
  task2355: 'docs/task-2355-repair-intake-draft-to-case-production-auth-session-context-adapter-helper-no-route-wiring-no-db-no-smoke-no-provider-no-package.md',
  task2356: 'docs/task-2356-repair-intake-draft-to-case-auth-session-context-adapter-route-wiring-decision-gate-no-runtime-change-no-db-no-smoke-no-provider-no-package.md',
});

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

test('Task2356 decision gate reads current source docs and test artifacts only', () => {
  for (const relativePath of [
    ...Object.values(SOURCE_PATHS),
    ...Object.values(DOC_PATHS),
    'tests/repairIntake/repairIntakeDraftToCaseAuthSessionContextAdapter.unit.test.js',
    'tests/repairIntake/repairIntakeDraftToCaseAuthSessionContextAdapterBoundary.static.test.js',
    'package.json',
    'package-lock.json',
  ]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }

  const guardSource = read('tests/repairIntake/repairIntakeDraftToCaseAuthSessionContextAdapterRouteWiringDecisionGate.static.test.js');
  const topLevelImports = guardSource.split('\n').slice(0, 8).join('\n');

  assert.deepEqual(requireSpecifiers(topLevelImports).sort(), [
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:test',
  ]);
});

test('auth adapter helper exists but remains unwired from runtime modules', () => {
  const helperSource = read(SOURCE_PATHS.authAdapter);
  const runtimeSource = [
    SOURCE_PATHS.route,
    SOURCE_PATHS.apiModule,
    SOURCE_PATHS.applicationService,
    SOURCE_PATHS.controllerAdapter,
    SOURCE_PATHS.requireAuth,
    SOURCE_PATHS.requirePermission,
  ].map(read).join('\n');

  assertIncludesAll(helperSource, [
    'function buildRepairIntakeDraftToCaseAuthSessionContext(input = {})',
    'auth_session_context_ready',
    'auth_session_context_organization_required',
    'auth_session_context_actor_required',
    'module.exports = {',
    'buildRepairIntakeDraftToCaseAuthSessionContext',
  ], 'auth session context adapter helper');

  assertExcludesAll(runtimeSource, [
    'repairIntakeDraftToCaseAuthSessionContextAdapter',
    'buildRepairIntakeDraftToCaseAuthSessionContext',
  ], 'runtime auth adapter wiring');
});

test('decision gate recommends exactly one future boundary and keeps route markers visible', () => {
  const decisionDoc = read(DOC_PATHS.task2356);
  const routeSource = read(SOURCE_PATHS.route);
  const buildAdminRequestLike = functionBlock(routeSource, 'buildAdminRequestLike');

  assert.equal(
    (decisionDoc.match(/Recommended exact future boundary:/g) || []).length,
    1,
    'Task2356 should recommend exactly one future boundary',
  );
  assertIncludesAll(decisionDoc, [
    'Route request-like construction boundary in `src/routes/repairIntakeDraftToCase.routes.js`',
    '`buildAdminRequestLike(req)`',
    'Do not modify `requireAuth` or `requirePermission` for the first adapter wiring task.',
    'requireAuth / requirePermission remain as-is',
    'buildRepairIntakeDraftToCaseAuthSessionContext(input) runs with server-owned user/context/request metadata only',
    'normalizeRepairIntakeDraftToCaseTrustedContext(input) receives auth adapter output',
  ], 'Task2356 decision gate recommendation');

  assertIncludesAll(routeSource, [
    "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH = '/api/v1/admin/repair-intake/drafts/:draftId/case/submit'",
    "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION = 'cases.create'",
    'requirePermission(REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION)',
    'createRepairIntakeDraftToCaseInjectedRouteComposition',
    'registerRepairIntakeDraftToCaseAdminRoutes',
  ], 'route admin/injected markers');

  assertIncludesAll(buildAdminRequestLike, [
    'const requestBody = bodyWithoutServerOwnedContext(body)',
    'const trustedContextResult = normalizeRepairIntakeDraftToCaseTrustedContext({',
    'params,',
    'user,',
    'context,',
    'sessionContext: context',
    'permissionContext: adminPermissionContext',
  ], 'trusted context normalizer route wiring');
});

test('request abuse guard remains downstream before controller invocation', () => {
  const apiModule = read(SOURCE_PATHS.apiModule);
  const callSafeController = functionBlock(apiModule, 'callSafeController');

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
});

test('Task2356 does not authorize public route middleware package DB smoke provider or env coupling', () => {
  const decisionDoc = read(DOC_PATHS.task2356);
  const sourceText = Object.values(SOURCE_PATHS).map(read).join('\n');
  const packageJson = readJson('package.json');
  const packageNames = Object.keys({
    ...(packageJson.dependencies || {}),
    ...(packageJson.devDependencies || {}),
  });

  assertExcludesAll(sourceText, PUBLIC_OPEN_ROUTE_MARKERS, 'public/open/customer route markers');
  assertIncludesAll(decisionDoc, [
    'No runtime/source behavior changes.',
    'No helper wiring.',
    'No auth/session middleware implementation.',
    'No package or package-lock changes.',
    'No public/open/customer route expansion.',
    'Production auth/session middleware implementation remains non-authorized.',
  ], 'Task2356 non-authorization boundary');

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
