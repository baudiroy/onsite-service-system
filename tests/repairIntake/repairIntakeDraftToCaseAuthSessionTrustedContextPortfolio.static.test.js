'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const SOURCE_PATHS = Object.freeze({
  route: 'src/routes/repairIntakeDraftToCase.routes.js',
  apiModule: 'src/repairIntake/repairIntakeDraftToCaseApiModule.js',
  helper: 'src/repairIntake/repairIntakeDraftToCaseTrustedContextNormalizer.js',
  controllerAdapter: 'src/repairIntake/repairIntakeDraftCaseControllerAdapter.js',
  applicationService: 'src/repairIntake/repairIntakeDraftToCaseApplicationService.js',
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
});

const TEST_PATHS = Object.freeze([
  'tests/repairIntake/repairIntakeDraftToCaseAuthSessionContextBoundary.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseTrustedContextNormalizer.unit.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseTrustedContextNormalizerContract.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseTrustedContextNormalizerHelperBoundary.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseTrustedContextNormalizerRouteWiringDesign.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseTrustedContextNormalizerRouteWiringDecisionGate.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseTrustedContextNormalizerRouteWiring.unit.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseTrustedContextNormalizerRouteWiringBoundary.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseProductionAuthSessionReadinessDecisionGate.static.test.js',
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
  'fetch(',
  'app.listen(',
  'server.listen(',
  'createServer(',
  'sendProvider',
  'sendToProvider',
  'createOpenAI',
  'vectorStore',
  'admin/src/',
  'billing/',
  'customerAccess',
  'engineerMobile',
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

function helperInvocationBlock(source) {
  const start = source.indexOf('normalizeRepairIntakeDraftToCaseTrustedContext({');

  assert.notEqual(start, -1, 'missing trusted context normalizer invocation');

  const end = source.indexOf('});', start);

  assert.notEqual(end, -1, 'unterminated trusted context normalizer invocation');

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

test('Task2352 portfolio guard reads accepted auth session trusted context artifacts only', () => {
  for (const relativePath of [
    ...Object.values(SOURCE_PATHS),
    ...Object.values(DOC_PATHS),
    ...TEST_PATHS,
  ]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }

  const guardSource = read('tests/repairIntake/repairIntakeDraftToCaseAuthSessionTrustedContextPortfolio.static.test.js');
  const topLevelImports = guardSource.split('\n').slice(0, 8).join('\n');

  assert.deepEqual(requireSpecifiers(topLevelImports).sort(), [
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:test',
  ]);
});

test('accepted Task2344 through Task2351 readiness artifacts remain visible', () => {
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
  ], 'accepted readiness docs');

  assertIncludesAll(tests, [
    'repairIntakeDraftToCaseAuthSessionContextBoundary',
    'repairIntakeDraftToCaseTrustedContextNormalizerContract',
    'repairIntakeDraftToCaseTrustedContextNormalizerRouteWiring',
    'repairIntakeDraftToCaseProductionAuthSessionReadinessDecisionGate',
  ], 'accepted readiness tests');
});

test('current portfolio boundary keeps helper wired only at route request-like construction', () => {
  const routeSource = read(SOURCE_PATHS.route);
  const helperSource = read(SOURCE_PATHS.helper);
  const apiModule = read(SOURCE_PATHS.apiModule);
  const buildAdminRequestLike = functionBlock(routeSource, 'buildAdminRequestLike');
  const callSafeController = functionBlock(apiModule, 'callSafeController');
  const downstreamSource = [
    SOURCE_PATHS.apiModule,
    SOURCE_PATHS.controllerAdapter,
    SOURCE_PATHS.applicationService,
  ].map(read).join('\n');

  assertIncludesAll(helperSource, [
    'function normalizeRepairIntakeDraftToCaseTrustedContext(input = {})',
    'trusted_context_ready',
    'trusted_context_organization_required',
    'trusted_context_draft_required',
    'trusted_context_actor_required',
    'module.exports = {',
    'normalizeRepairIntakeDraftToCaseTrustedContext',
  ], 'trusted context normalizer helper');

  assertIncludesAll(routeSource, [
    "require('../repairIntake/repairIntakeDraftToCaseTrustedContextNormalizer')",
    "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH = '/api/v1/admin/repair-intake/drafts/:draftId/case/submit'",
    "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION = 'cases.create'",
    'requirePermission(REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION)',
    'createRepairIntakeDraftToCaseInjectedRouteComposition',
  ], 'route portfolio boundary');

  assertIncludesAll(buildAdminRequestLike, [
    'const requestBody = bodyWithoutServerOwnedContext(body)',
    'const trustedContextResult = normalizeRepairIntakeDraftToCaseTrustedContext({',
    'const trustedContext = trustedContextResult.ok === true ? trustedContextResult.context : {}',
    'params: normalizedParams',
    'context: {',
    'actor: {',
    'organizationId: resolvedOrganizationId',
    'repairIntakeDraftId: resolvedDraftId',
  ], 'route request-like construction boundary');

  assert.ok(
    buildAdminRequestLike.indexOf('bodyWithoutServerOwnedContext(body)')
      < buildAdminRequestLike.indexOf('normalizeRepairIntakeDraftToCaseTrustedContext({'),
    'body/server-owned context stripping must remain before trusted context normalization',
  );

  assert.ok(
    callSafeController.indexOf('guardRepairIntakeDraftToCaseRequest(requestLike)')
      < callSafeController.indexOf('method.call('),
    'request abuse guard must remain before controller invocation',
  );

  assertExcludesAll(downstreamSource, [
    'repairIntakeDraftToCaseTrustedContextNormalizer',
    'normalizeRepairIntakeDraftToCaseTrustedContext',
  ], 'downstream helper wiring');
});

test('safety portfolio prevents body client fields from overriding trusted context', () => {
  const routeSource = read(SOURCE_PATHS.route);
  const helperSource = read(SOURCE_PATHS.helper);
  const unitTest = read('tests/repairIntake/repairIntakeDraftToCaseTrustedContextNormalizer.unit.test.js');
  const routeWiringTest = read('tests/repairIntake/repairIntakeDraftToCaseTrustedContextNormalizerRouteWiring.unit.test.js');
  const bodyWithoutServerOwnedContext = functionBlock(routeSource, 'bodyWithoutServerOwnedContext');
  const buildAdminRequestLike = functionBlock(routeSource, 'buildAdminRequestLike');
  const helperInvocation = helperInvocationBlock(buildAdminRequestLike);

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

  assertIncludesAll(helperInvocation, [
    'params,',
    'user,',
    'context,',
    'sessionContext: context',
    'permissionContext: adminPermissionContext',
    'tenantId: tenantId(req, body, user)',
    'requestId: requestId(req)',
    'idempotencyKey: idempotencyKey(req)',
  ], 'trusted helper invocation inputs');

  assertExcludesAll(helperInvocation, [
    'requestBody',
    'draftInput',
    'headers',
    'query',
    'cookies',
    'provider',
    'process.env',
  ], 'trusted helper invocation forbidden inputs');

  assertIncludesAll(helperSource, [
    'return fail(\'trusted_context_organization_required\')',
    'return fail(\'trusted_context_draft_required\')',
    'return fail(\'trusted_context_actor_required\')',
    'context: compactObject({',
  ], 'safe failure and allowlisted output');

  assertIncludesAll(`${unitTest}\n${routeWiringTest}`, [
    'cannot override trusted user or context tenant',
    'fails closed',
    'does not mutate',
    'without raw leakage',
  ], 'trusted context safety coverage');
});

test('forbidden runtime coupling remains absent from executable boundaries', () => {
  const sourceText = Object.values(SOURCE_PATHS).map(read).join('\n');
  const packageJson = readJson('package.json');
  const packageLock = readJson('package-lock.json');
  const dependencyNames = Object.keys({
    ...(packageJson.dependencies || {}),
    ...(packageJson.devDependencies || {}),
    ...(packageLock.packages && packageLock.packages[''] && packageLock.packages[''].dependencies),
    ...(packageLock.packages && packageLock.packages[''] && packageLock.packages[''].devDependencies),
  });

  assertExcludesAll(sourceText, PUBLIC_OPEN_ROUTE_MARKERS, 'public/open/customer route markers');
  assertExcludesAll(sourceText, EXECUTABLE_COUPLING_MARKERS, 'executable forbidden coupling markers');

  for (const dependencyName of dependencyNames) {
    assert.equal(
      PACKAGE_EXPANSION_MARKERS.includes(dependencyName),
      false,
      `package dependency expansion should not include ${dependencyName}`,
    );
  }

  assert.equal(fs.existsSync(projectPath('src/openRepairIntake')), false, 'src/openRepairIntake should remain absent');
  assert.equal(fs.existsSync(projectPath('tests/openRepairIntake')), false, 'tests/openRepairIntake should remain absent');
});
