'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const SOURCE_PATHS = Object.freeze({
  route: 'src/routes/repairIntakeDraftToCase.routes.js',
  apiModule: 'src/repairIntake/repairIntakeDraftToCaseApiModule.js',
  controllerAdapter: 'src/repairIntake/repairIntakeDraftCaseControllerAdapter.js',
  applicationService: 'src/repairIntake/repairIntakeDraftToCaseApplicationService.js',
  helper: 'src/repairIntake/repairIntakeDraftToCaseTrustedContextNormalizer.js',
});

const DOC_PATHS = Object.freeze({
  task2344: 'docs/task-2344-repair-intake-draft-to-case-auth-session-context-boundary-inventory-no-runtime-change-no-db-no-smoke-no-provider-no-package.md',
  task2345: 'docs/task-2345-repair-intake-draft-to-case-trusted-context-normalizer-contract-static-guard-no-runtime-change-no-db-no-smoke-no-provider-no-package.md',
  task2346: 'docs/task-2346-repair-intake-draft-to-case-trusted-context-normalizer-pure-helper-preflight-design-packet-no-runtime-change-no-db-no-smoke-no-provider-no-package.md',
  task2347: 'docs/task-2347-repair-intake-draft-to-case-trusted-context-normalizer-pure-helper-implementation-no-route-wiring-no-db-no-smoke-no-provider-no-package.md',
  task2348: 'docs/task-2348-repair-intake-draft-to-case-trusted-context-normalizer-route-wiring-decision-gate-no-runtime-change-no-db-no-smoke-no-provider-no-package.md',
});

const TEST_PATHS = Object.freeze([
  'tests/repairIntake/repairIntakeDraftToCaseTrustedContextNormalizer.unit.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseTrustedContextNormalizerHelperBoundary.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseTrustedContextNormalizerPreflight.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseTrustedContextNormalizerContract.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseAuthSessionContextBoundary.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseRequestAbuseGuardBoundary.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseProductionRouteExposureDecisionGate.static.test.js',
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

const AUTH_SESSION_MIDDLEWARE_MARKERS = Object.freeze([
  'passport',
  'express-session',
  'cookie-session',
  'firebase-admin',
  'supabase',
  'oauth',
]);

function projectPath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(projectPath(relativePath), 'utf8');
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

test('Task2348 static guard reads current source test and doc artifacts only', () => {
  for (const relativePath of [
    ...Object.values(SOURCE_PATHS),
    ...Object.values(DOC_PATHS),
    ...TEST_PATHS,
  ]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }

  const guardSource = read('tests/repairIntake/repairIntakeDraftToCaseTrustedContextNormalizerRouteWiringDecisionGate.static.test.js');
  const topLevelImports = guardSource.split('\n').slice(0, 8).join('\n');

  assert.deepEqual(requireSpecifiers(topLevelImports).sort(), [
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:test',
  ]);
});

test('pure helper exists and remains unwired from route API controller and application modules', () => {
  const helperSource = read(SOURCE_PATHS.helper);
  const runtimeSources = [
    SOURCE_PATHS.route,
    SOURCE_PATHS.apiModule,
    SOURCE_PATHS.controllerAdapter,
    SOURCE_PATHS.applicationService,
  ].map(read).join('\n');

  assertIncludesAll(helperSource, [
    'function normalizeRepairIntakeDraftToCaseTrustedContext(input = {})',
    'trusted_context_ready',
    'trusted_context_invalid',
    'module.exports = {',
    'normalizeRepairIntakeDraftToCaseTrustedContext',
  ], 'pure helper source');

  assertExcludesAll(runtimeSources, [
    'repairIntakeDraftToCaseTrustedContextNormalizer',
    'normalizeRepairIntakeDraftToCaseTrustedContext',
  ], 'runtime helper wiring');
});

test('decision gate recommends exactly the route request-like construction boundary', () => {
  const task2348 = read(DOC_PATHS.task2348);
  const recommendedMarker = 'Recommended exact future boundary:';
  const recommendedIndex = task2348.indexOf(recommendedMarker);
  const notAuthorizedIndex = task2348.indexOf('## Future Work Not Authorized');
  const recommendedSection = task2348.slice(recommendedIndex, notAuthorizedIndex);

  assert.notEqual(recommendedIndex, -1, 'Task2348 should include recommended boundary section');
  assertIncludesAll(task2348, [
    'Route Request-Like Construction Boundary',
    'API Module Safe Controller Boundary',
    'Controller Adapter Boundary',
    'Request DTO / Command Builder Boundary',
    'Authorization Gate / Permission Context Boundary',
    'Decision: recommended future wiring boundary.',
    'Decision: not recommended for first wiring.',
  ], 'Task2348 boundary comparison');

  assertIncludesAll(recommendedSection, [
    'Route request-like construction boundary in `src/routes/repairIntakeDraftToCase.routes.js`',
    'inside or immediately adjacent to `buildAdminRequestLike(req)`',
    'after trusted route/session/user/context inputs are available',
    'before the request-like payload enters controller/application flow',
  ], 'Task2348 exact recommended boundary');

  assert.equal(
    (recommendedSection.match(/Recommended exact future boundary:/g) || []).length,
    1,
    'Task2348 should recommend exactly one future boundary',
  );
});

test('route remains admin injected permission gated and strips body context at recommended boundary', () => {
  const routeSource = read(SOURCE_PATHS.route);
  const buildAdminRequestLike = functionBlock(routeSource, 'buildAdminRequestLike');
  const bodyWithoutServerOwnedContext = functionBlock(routeSource, 'bodyWithoutServerOwnedContext');

  assertIncludesAll(routeSource, [
    "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION = 'cases.create'",
    "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH = '/api/v1/admin/repair-intake/drafts/:draftId/case/submit'",
    'createRepairIntakeDraftToCaseInjectedRouteComposition',
    'getRepairIntakeDraftToCaseRuntimePorts',
    'requirePermission(REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION)',
  ], 'admin injected route markers');

  assertIncludesAll(buildAdminRequestLike, [
    'const requestBody = bodyWithoutServerOwnedContext(body)',
    'const resolvedOrganizationId = organizationId(req, body, user)',
    'const resolvedTenantId = tenantId(req, body, user)',
    'const resolvedRequestId = requestId(req)',
    'const resolvedIdempotencyKey = idempotencyKey(req)',
    'const resolvedActorId = userId(user)',
    'const resolvedDraftId = draftId(params, body)',
    'permission: REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION',
  ], 'route request-like construction markers');

  assertIncludesAll(bodyWithoutServerOwnedContext, [
    'actorId',
    'actorRole',
    'draftId: bodyDraftId',
    'idempotencyKey',
    'organizationId: bodyOrganizationId',
    'repairIntakeDraftId',
    'requestId: bodyRequestId',
    'source',
    'stripBodyContextFields(safeBody)',
  ], 'body context stripping markers');
});

test('request abuse guard remains before controller invocation', () => {
  const apiModule = read(SOURCE_PATHS.apiModule);
  const callSafeController = functionBlock(apiModule, 'callSafeController');

  assertIncludesAll(callSafeController, [
    'const abuseGuardResult = guardRepairIntakeDraftToCaseRequest(requestLike)',
    'if (!abuseGuardResult.ok)',
    'safeControllerFailure(',
    'method.call(',
    'sanitizeRequestInput(requestLike)',
  ], 'API module request abuse guard flow');

  assert.ok(
    callSafeController.indexOf('guardRepairIntakeDraftToCaseRequest(requestLike)')
      < callSafeController.indexOf('method.call('),
    'request abuse guard must remain before controller invocation',
  );
});

test('Task2348 does not authorize auth session middleware route expansion package DB smoke provider or env coupling', () => {
  const sourceText = [
    SOURCE_PATHS.route,
    SOURCE_PATHS.apiModule,
    SOURCE_PATHS.controllerAdapter,
    SOURCE_PATHS.applicationService,
    SOURCE_PATHS.helper,
  ].map(read).join('\n');
  const task2348 = read(DOC_PATHS.task2348);

  assertExcludesAll(sourceText, PUBLIC_OPEN_ROUTE_MARKERS, 'public/open/customer route markers');
  assertExcludesAll(sourceText, AUTH_SESSION_MIDDLEWARE_MARKERS, 'auth/session middleware implementation markers');
  assert.equal(fs.existsSync(projectPath('src/openRepairIntake')), false, 'src/openRepairIntake should remain absent');
  assert.equal(fs.existsSync(projectPath('tests/openRepairIntake')), false, 'tests/openRepairIntake should remain absent');

  assertIncludesAll(task2348, [
    'Task2348 does not authorize:',
    'helper wiring',
    'runtime/source behavior changes',
    'auth/session middleware implementation',
    'route path or mount changes',
    'public/open/customer route expansion',
    'package or package-lock changes',
    'DB, migration, smoke, endpoint probe, server/listener, provider, env, Zeabur, secrets, deploy, or shared runtime work',
    'PM must still authorize one exact task at a time.',
  ], 'Task2348 non-authorization boundary');
});
