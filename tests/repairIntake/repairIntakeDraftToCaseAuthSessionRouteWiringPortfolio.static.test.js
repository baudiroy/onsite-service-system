'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const SOURCE_PATHS = Object.freeze({
  route: 'src/routes/repairIntakeDraftToCase.routes.js',
  apiModule: 'src/repairIntake/repairIntakeDraftToCaseApiModule.js',
  trustedNormalizer: 'src/repairIntake/repairIntakeDraftToCaseTrustedContextNormalizer.js',
  authAdapter: 'src/repairIntake/repairIntakeDraftToCaseAuthSessionContextAdapter.js',
  controllerAdapter: 'src/repairIntake/repairIntakeDraftCaseControllerAdapter.js',
  applicationService: 'src/repairIntake/repairIntakeDraftToCaseApplicationService.js',
  requireAuth: 'src/middlewares/requireAuth.js',
  requirePermission: 'src/middlewares/requirePermission.js',
});

const DOC_PATHS = Object.freeze({
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
});

const TEST_PATHS = Object.freeze([
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
  'tests/repairIntake/repairIntakeDraftToCaseProductionAuthSessionReadinessDecisionGate.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseProductionAuthSessionImplementationAuthorization.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseAuthSessionContextAdapter.unit.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseAuthSessionContextAdapterBoundary.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseAuthSessionContextAdapterRouteWiringDecisionGate.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseAuthSessionContextAdapterRouteWiring.unit.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseAuthSessionContextAdapterRouteWiringBoundary.static.test.js',
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

const EXECUTABLE_COUPLING_MARKERS = Object.freeze([
  'process.env.DATABASE_URL',
  "require('pg')",
  'require("pg")',
  'pool.query(',
  'client.query(',
  'app.listen(',
  'server.listen(',
  'createServer(',
  'fetch(',
  'sendProvider',
  'sendToProvider',
  'createOpenAI',
  'vectorStore',
  'admin/src/',
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

function walkFiles(relativePath, predicate) {
  const absolutePath = projectPath(relativePath);
  const entries = fs.readdirSync(absolutePath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const childRelativePath = path.join(relativePath, entry.name);

    if (entry.isDirectory()) {
      files.push(...walkFiles(childRelativePath, predicate));
    } else if (!predicate || predicate(childRelativePath)) {
      files.push(childRelativePath);
    }
  }

  return files;
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

function invocationBlock(source, invocationStartMarker) {
  const start = source.indexOf(invocationStartMarker);

  assert.notEqual(start, -1, `missing invocation ${invocationStartMarker}`);

  const end = source.indexOf('});', start);

  assert.notEqual(end, -1, `unterminated invocation ${invocationStartMarker}`);

  return source.slice(start, end + 3);
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

test('Task2359 portfolio guard reads accepted docs tests and source artifacts only', () => {
  for (const relativePath of [
    ...Object.values(SOURCE_PATHS),
    ...Object.values(DOC_PATHS),
    ...TEST_PATHS,
  ]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }

  const guardSource = read('tests/repairIntake/repairIntakeDraftToCaseAuthSessionRouteWiringPortfolio.static.test.js');
  const topLevelImports = guardSource.split('\n').slice(0, 8).join('\n');

  assert.deepEqual(requireSpecifiers(topLevelImports).sort(), [
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:test',
  ]);
});

test('accepted Task2344 through Task2358 portfolio artifacts remain visible', () => {
  const docs = Object.values(DOC_PATHS).map(read).join('\n');
  const tests = TEST_PATHS.map(read).join('\n');

  assertIncludesAll(docs, [
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
  ], 'accepted portfolio docs');

  assertIncludesAll(tests, [
    'repairIntakeDraftToCaseAuthSessionContextBoundary',
    'repairIntakeDraftToCaseTrustedContextNormalizerContract',
    'repairIntakeDraftToCaseTrustedContextNormalizerRouteWiring',
    'repairIntakeDraftToCaseAuthSessionTrustedContextPortfolio',
    'repairIntakeDraftToCaseAuthSessionContextAdapterRouteWiring',
    'repairIntakeDraftToCaseRequestAbuseGuardBoundary',
  ], 'accepted portfolio tests');
});

test('route wires trusted normalizer and auth session adapter only at buildAdminRequestLike boundary', () => {
  const routeSource = read(SOURCE_PATHS.route);
  const apiModule = read(SOURCE_PATHS.apiModule);
  const buildAdminRequestLike = functionBlock(routeSource, 'buildAdminRequestLike');
  const bodyWithoutServerOwnedContext = functionBlock(routeSource, 'bodyWithoutServerOwnedContext');
  const callSafeController = functionBlock(apiModule, 'callSafeController');
  const authAdapterInvocation = invocationBlock(
    buildAdminRequestLike,
    'buildRepairIntakeDraftToCaseAuthSessionContext({',
  );
  const trustedNormalizerInvocation = invocationBlock(
    buildAdminRequestLike,
    'normalizeRepairIntakeDraftToCaseTrustedContext({',
  );

  assertIncludesAll(routeSource, [
    "require('../repairIntake/repairIntakeDraftToCaseTrustedContextNormalizer')",
    "require('../repairIntake/repairIntakeDraftToCaseAuthSessionContextAdapter')",
    "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH = '/api/v1/admin/repair-intake/drafts/:draftId/case/submit'",
    "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION = 'cases.create'",
    'requirePermission(REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION)',
    'createRepairIntakeDraftToCaseInjectedRouteComposition',
    'registerRepairIntakeDraftToCaseAdminRoutes',
  ], 'route wiring markers');

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
  ], 'body/server-owned context stripping');

  assertIncludesAll(authAdapterInvocation, [
    'user,',
    'context,',
    'sessionContext: context',
    'permissionContext: adminPermissionContext',
    'requestId: requestId(req)',
    'idempotencyKey: idempotencyKey(req)',
  ], 'auth adapter invocation');

  assertIncludesAll(trustedNormalizerInvocation, [
    'params,',
    'user: {}',
    'context: authSessionContext',
    'sessionContext: authSessionContext',
    'permissionContext: authSessionContext.permissionContext || adminPermissionContext',
    'tenantId: tenantId(req, body, user)',
    'requestId: authSessionContext.requestId || requestId(req)',
    'idempotencyKey: authSessionContext.idempotencyKey || idempotencyKey(req)',
  ], 'trusted normalizer invocation');

  assertExcludesAll(authAdapterInvocation, [
    'body',
    'requestBody',
    'draftInput',
    'query',
    'header',
    'cookie',
    'client',
    'provider',
    'debug',
    'process.env',
    'DATABASE_URL',
  ], 'auth adapter forbidden raw inputs');

  assert.ok(
    buildAdminRequestLike.indexOf('bodyWithoutServerOwnedContext(body)')
      < buildAdminRequestLike.indexOf('const adminPermissionContext = {'),
    'body context stripping must remain before admin permission context creation',
  );
  assert.ok(
    buildAdminRequestLike.indexOf('const adminPermissionContext = {')
      < buildAdminRequestLike.indexOf('buildRepairIntakeDraftToCaseAuthSessionContext({'),
    'admin permission context must remain before auth adapter invocation',
  );
  assert.ok(
    buildAdminRequestLike.indexOf('buildRepairIntakeDraftToCaseAuthSessionContext({')
      < buildAdminRequestLike.indexOf('normalizeRepairIntakeDraftToCaseTrustedContext({'),
    'auth adapter must run before trusted context normalizer',
  );
  assert.ok(
    callSafeController.indexOf('guardRepairIntakeDraftToCaseRequest(requestLike)')
      < callSafeController.indexOf('method.call('),
    'request abuse guard must remain before controller invocation',
  );
});

test('trusted normalizer and auth session adapter are not wired into downstream modules or middleware', () => {
  const sourceFiles = walkFiles('src', (relativePath) => relativePath.endsWith('.js'));
  const forbiddenTargets = sourceFiles.filter((relativePath) => ![
    SOURCE_PATHS.route,
    SOURCE_PATHS.trustedNormalizer,
    SOURCE_PATHS.authAdapter,
  ].includes(relativePath));

  for (const relativePath of forbiddenTargets) {
    const source = read(relativePath);

    assertExcludesAll(source, [
      'repairIntakeDraftToCaseTrustedContextNormalizer',
      'normalizeRepairIntakeDraftToCaseTrustedContext',
      'repairIntakeDraftToCaseAuthSessionContextAdapter',
      'buildRepairIntakeDraftToCaseAuthSessionContext',
    ], `${relativePath} downstream wiring`);
  }

  const middlewareSource = [
    SOURCE_PATHS.requireAuth,
    SOURCE_PATHS.requirePermission,
  ].map(read).join('\n');

  assertExcludesAll(middlewareSource, [
    'repairIntakeDraftToCaseTrustedContextNormalizer',
    'repairIntakeDraftToCaseAuthSessionContextAdapter',
    'buildRepairIntakeDraftToCaseAuthSessionContext',
    'normalizeRepairIntakeDraftToCaseTrustedContext',
  ], 'auth middleware wiring');
});

test('safety coverage prevents raw client auth session data from becoming trusted context', () => {
  const authAdapterSource = read(SOURCE_PATHS.authAdapter);
  const trustedNormalizerSource = read(SOURCE_PATHS.trustedNormalizer);
  const routeWiringTest = read('tests/repairIntake/repairIntakeDraftToCaseAuthSessionContextAdapterRouteWiring.unit.test.js');
  const adapterUnitTest = read('tests/repairIntake/repairIntakeDraftToCaseAuthSessionContextAdapter.unit.test.js');
  const trustedRouteWiringTest = read('tests/repairIntake/repairIntakeDraftToCaseTrustedContextNormalizerRouteWiring.unit.test.js');

  assertIncludesAll(authAdapterSource, [
    'function buildRepairIntakeDraftToCaseAuthSessionContext(input = {})',
    'auth_session_context_ready',
    'auth_session_context_organization_required',
    'auth_session_context_actor_required',
    'auth_session_context_invalid',
    'sessionContext: compactObject({',
    'module.exports = {',
    'buildRepairIntakeDraftToCaseAuthSessionContext',
  ], 'auth session adapter helper');

  assertIncludesAll(trustedNormalizerSource, [
    'function normalizeRepairIntakeDraftToCaseTrustedContext(input = {})',
    'trusted_context_ready',
    'trusted_context_organization_required',
    'trusted_context_draft_required',
    'trusted_context_actor_required',
    'context: compactObject({',
    'module.exports = {',
    'normalizeRepairIntakeDraftToCaseTrustedContext',
  ], 'trusted context normalizer helper');

  assertIncludesAll(`${routeWiringTest}\n${adapterUnitTest}\n${trustedRouteWiringTest}`, [
    'body requestBody draftInput query header and client fields cannot override trusted auth session context',
    'raw body query headers cookies and draft input cannot override trusted context',
    'missing organization or actor fails closed into compatible request-like shape without raw leakage',
    'missing required organization or actor identity fails closed',
    'does not mutate request or body objects',
    'does not mutate input objects',
    'raw-token-should-not-leak',
    'provider payload',
  ], 'auth/session safety coverage');
});

test('forbidden coupling remains absent from route branch and package dependencies', () => {
  const relevantSource = [
    SOURCE_PATHS.route,
    SOURCE_PATHS.apiModule,
    SOURCE_PATHS.trustedNormalizer,
    SOURCE_PATHS.authAdapter,
    SOURCE_PATHS.requireAuth,
    SOURCE_PATHS.requirePermission,
  ].map(read).join('\n');
  const packageJson = readJson('package.json');
  const packageLock = readJson('package-lock.json');
  const dependencyNames = Object.keys({
    ...(packageJson.dependencies || {}),
    ...(packageJson.devDependencies || {}),
    ...(packageLock.packages && packageLock.packages[''] && packageLock.packages[''].dependencies),
    ...(packageLock.packages && packageLock.packages[''] && packageLock.packages[''].devDependencies),
  });
  const task2359Doc = read(DOC_PATHS.task2359);

  assertExcludesAll(relevantSource, PUBLIC_OPEN_ROUTE_MARKERS, 'public/open/customer route markers');
  assertExcludesAll(relevantSource, EXECUTABLE_COUPLING_MARKERS, 'executable forbidden coupling markers');

  for (const dependencyName of dependencyNames) {
    assert.equal(
      PACKAGE_EXPANSION_MARKERS.includes(dependencyName),
      false,
      `package dependency expansion should not include ${dependencyName}`,
    );
  }

  assert.equal(fs.existsSync(projectPath('src/openRepairIntake')), false, 'src/openRepairIntake should remain absent');
  assert.equal(fs.existsSync(projectPath('tests/openRepairIntake')), false, 'tests/openRepairIntake should remain absent');

  assertIncludesAll(task2359Doc, [
    'No runtime/source behavior changes.',
    'No route path or mount changes.',
    'No helper wiring changes.',
    'No package or package-lock changes.',
    'No auth/session middleware implementation changes.',
    'No `requireAuth` or `requirePermission` middleware behavior changes.',
    'No DB, migration, smoke, provider, env, Zeabur, secrets, endpoint, server/listener, deploy, or shared runtime work was performed.',
  ], 'Task2359 non-authorization doc');
});
