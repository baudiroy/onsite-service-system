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
  task2348: 'docs/task-2348-repair-intake-draft-to-case-trusted-context-normalizer-route-wiring-decision-gate-no-runtime-change-no-db-no-smoke-no-provider-no-package.md',
  task2349: 'docs/task-2349-repair-intake-draft-to-case-trusted-context-normalizer-route-boundary-wiring-design-packet-no-runtime-change-no-db-no-smoke-no-provider-no-package.md',
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

test('Task2349 static guard reads current source and decision docs only', () => {
  for (const relativePath of [
    ...Object.values(SOURCE_PATHS),
    ...Object.values(DOC_PATHS),
  ]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }

  const guardSource = read('tests/repairIntake/repairIntakeDraftToCaseTrustedContextNormalizerRouteWiringDesign.static.test.js');
  const topLevelImports = guardSource.split('\n').slice(0, 8).join('\n');

  assert.deepEqual(requireSpecifiers(topLevelImports).sort(), [
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:test',
  ]);
});

test('Task2348 decision gate exists and recommends route request-like construction boundary', () => {
  const task2348 = read(DOC_PATHS.task2348);

  assertIncludesAll(task2348, [
    'Task2348 Repair Intake Draft-to-Case Trusted Context Normalizer Route Wiring Decision Gate',
    'Route request-like construction boundary in `src/routes/repairIntakeDraftToCase.routes.js`',
    'inside or immediately adjacent to `buildAdminRequestLike(req)`',
    'after trusted route/session/user/context inputs are available',
    'before the request-like payload enters controller/application flow',
  ], 'Task2348 selected boundary');
});

test('route file contains buildAdminRequestLike and body context stripping markers', () => {
  const routeSource = read(SOURCE_PATHS.route);
  const buildAdminRequestLike = functionBlock(routeSource, 'buildAdminRequestLike');
  const bodyWithoutServerOwnedContext = functionBlock(routeSource, 'bodyWithoutServerOwnedContext');

  assertIncludesAll(routeSource, [
    "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION = 'cases.create'",
    "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH = '/api/v1/admin/repair-intake/drafts/:draftId/case/submit'",
    'requirePermission(REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION)',
    'createRepairIntakeDraftToCaseInjectedRouteComposition',
    'getRepairIntakeDraftToCaseRuntimePorts',
  ], 'route admin injected markers');

  assertIncludesAll(buildAdminRequestLike, [
    'const requestBody = bodyWithoutServerOwnedContext(body)',
    'const resolvedOrganizationId = organizationId(req, body, user)',
    'const resolvedTenantId = tenantId(req, body, user)',
    'const resolvedRequestId = requestId(req)',
    'const resolvedIdempotencyKey = idempotencyKey(req)',
    'const resolvedActorId = userId(user)',
    'const resolvedDraftId = draftId(params, body)',
  ], 'route request-like builder markers');

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
  ], 'route body stripping markers');
});

test('pure helper exists but remains unwired into route API controller and application modules', () => {
  const helperSource = read(SOURCE_PATHS.helper);
  const runtimeSource = [
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
  ], 'pure helper');

  assertExcludesAll(runtimeSource, [
    'repairIntakeDraftToCaseTrustedContextNormalizer',
    'normalizeRepairIntakeDraftToCaseTrustedContext',
  ], 'runtime helper wiring');
});

test('Task2349 design names exactly one future wiring file boundary and adapter shape', () => {
  const task2349 = read(DOC_PATHS.task2349);
  const futureFileMatches = task2349.match(/Future wiring file:/g) || [];
  const futureBoundaryMatches = task2349.match(/Future wiring boundary:/g) || [];

  assert.equal(futureFileMatches.length, 1);
  assert.equal(futureBoundaryMatches.length, 1);

  assertIncludesAll(task2349, [
    '`src/routes/repairIntakeDraftToCase.routes.js`',
    'Inside or immediately adjacent to `buildAdminRequestLike(req)`.',
    '`normalizeRepairIntakeDraftToCaseTrustedContext(input)`',
    'Adapt helper `context` output into the existing request-like shape.',
    '`context.organizationId`',
    '`context.tenantId`',
    '`context.actorId`',
    '`context.requestId`',
    '`actor.id`',
    'top-level `organizationId`',
    'top-level `idempotencyKey`',
    '`params.draftId`',
    '`params.repairIntakeDraftId`',
  ], 'Task2349 adapter shape');
});

test('Task2349 does not authorize middleware public route package DB smoke provider or env coupling', () => {
  const sourceText = [
    SOURCE_PATHS.route,
    SOURCE_PATHS.apiModule,
    SOURCE_PATHS.controllerAdapter,
    SOURCE_PATHS.applicationService,
    SOURCE_PATHS.helper,
  ].map(read).join('\n');
  const task2349 = read(DOC_PATHS.task2349);

  assertExcludesAll(sourceText, PUBLIC_OPEN_ROUTE_MARKERS, 'public/open/customer route markers');
  assertExcludesAll(sourceText, AUTH_SESSION_MIDDLEWARE_MARKERS, 'auth/session middleware markers');
  assert.equal(fs.existsSync(projectPath('src/openRepairIntake')), false, 'src/openRepairIntake should remain absent');
  assert.equal(fs.existsSync(projectPath('tests/openRepairIntake')), false, 'tests/openRepairIntake should remain absent');

  assertIncludesAll(task2349, [
    'Task2349 does not authorize:',
    'helper wiring',
    'runtime/source behavior changes',
    'auth/session middleware implementation',
    'route path or mount changes',
    'public/open/customer route expansion',
    'package or package-lock changes',
    'DB, migration, smoke, endpoint probe, server/listener, provider, env, Zeabur, secrets, deploy, or shared runtime work',
    'PM must still authorize one exact task at a time.',
  ], 'Task2349 non-authorization boundary');
});
