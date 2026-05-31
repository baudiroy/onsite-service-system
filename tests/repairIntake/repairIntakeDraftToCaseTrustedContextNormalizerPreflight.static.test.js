'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const SOURCE_PATHS = Object.freeze({
  route: 'src/routes/repairIntakeDraftToCase.routes.js',
  apiModule: 'src/repairIntake/repairIntakeDraftToCaseApiModule.js',
  requestContextResolver: 'src/repairIntake/repairIntakeDraftToCaseRequestContextResolver.js',
  authorizationGate: 'src/repairIntake/repairIntakeDraftToCaseAuthorizationGate.js',
  permissionGate: 'src/repairIntake/repairIntakeDraftToCasePermissionGate.js',
});

const DOC_PATHS = Object.freeze({
  task2344: 'docs/task-2344-repair-intake-draft-to-case-auth-session-context-boundary-inventory-no-runtime-change-no-db-no-smoke-no-provider-no-package.md',
  task2345: 'docs/task-2345-repair-intake-draft-to-case-trusted-context-normalizer-contract-static-guard-no-runtime-change-no-db-no-smoke-no-provider-no-package.md',
  task2346: 'docs/task-2346-repair-intake-draft-to-case-trusted-context-normalizer-pure-helper-preflight-design-packet-no-runtime-change-no-db-no-smoke-no-provider-no-package.md',
});

const TEST_PATHS = Object.freeze({
  task2344: 'tests/repairIntake/repairIntakeDraftToCaseAuthSessionContextBoundary.static.test.js',
  task2345: 'tests/repairIntake/repairIntakeDraftToCaseTrustedContextNormalizerContract.static.test.js',
  task2346: 'tests/repairIntake/repairIntakeDraftToCaseTrustedContextNormalizerPreflight.static.test.js',
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

const PACKAGE_EXPANSION_MARKERS = Object.freeze([
  '"body-parser"',
  '"express-rate-limit"',
  '"express-session"',
  '"firebase-admin"',
  '"passport"',
  '"rate-limiter-flexible"',
  '"supabase"',
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

test('Task2346 static guard reads current source doc test and package artifacts only', () => {
  for (const relativePath of [
    ...Object.values(SOURCE_PATHS),
    ...Object.values(DOC_PATHS),
    ...Object.values(TEST_PATHS),
    'package.json',
    'package-lock.json',
  ]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }

  const guardSource = read(TEST_PATHS.task2346);
  const topLevelImports = guardSource.split('\n').slice(0, 8).join('\n');

  assert.deepEqual(requireSpecifiers(topLevelImports).sort(), [
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:test',
  ]);
});

test('Task2344 and Task2345 accepted contract artifacts remain present', () => {
  const task2344 = read(DOC_PATHS.task2344);
  const task2345 = read(DOC_PATHS.task2345);
  const task2344Guard = read(TEST_PATHS.task2344);
  const task2345Guard = read(TEST_PATHS.task2345);

  assertIncludesAll(task2344, [
    'Current trusted context sources',
    'Production auth/session middleware implementation remains non-authorized',
    'Task2345 - Repair Intake Draft-to-Case Trusted Context Normalizer Contract Static Guard',
  ], 'Task2344 accepted inventory');

  assertIncludesAll(task2345, [
    'Frozen Trusted Context Contract',
    'Client body fields must not override trusted `organizationId`, actor/admin identity, request id, idempotency key, permission context, source, or draft id.',
    'Task2346 - Repair Intake Draft-to-Case Trusted Context Normalizer Pure Helper Preflight Design Packet',
  ], 'Task2345 frozen contract');

  assertIncludesAll(task2344Guard, [
    'repairIntakeDraftToCaseAuthSessionContextBoundary.static.test.js',
    'request abuse guard must run before controller method invocation',
  ], 'Task2344 guard');

  assertIncludesAll(task2345Guard, [
    'repairIntakeDraftToCaseTrustedContextNormalizerContract.static.test.js',
    'admin route freezes trusted context source order and permission context contract',
  ], 'Task2345 guard');
});

test('current trusted context source markers remain visible before helper implementation', () => {
  const routeSource = read(SOURCE_PATHS.route);
  const resolverSource = read(SOURCE_PATHS.requestContextResolver);
  const permissionSource = read(SOURCE_PATHS.permissionGate);
  const authorizationSource = read(SOURCE_PATHS.authorizationGate);
  const apiModule = read(SOURCE_PATHS.apiModule);
  const buildAdminRequestLike = functionBlock(routeSource, 'buildAdminRequestLike');
  const resolver = functionBlock(resolverSource, 'resolveRepairIntakeDraftToCaseRequestContext');
  const trustedContext = functionBlock(permissionSource, 'trustedContext');
  const createSafeContext = functionBlock(authorizationSource, 'createSafeContext');
  const callSafeController = functionBlock(apiModule, 'callSafeController');

  assertIncludesAll(buildAdminRequestLike, [
    'const resolvedOrganizationId = organizationId(req, body, user)',
    'const resolvedTenantId = tenantId(req, body, user)',
    'const resolvedRequestId = requestId(req)',
    'const resolvedIdempotencyKey = idempotencyKey(req)',
    'const resolvedActorId = userId(user)',
    'const resolvedDraftId = draftId(params, body)',
    'permission: REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION',
  ], 'route trusted context source markers');

  assertIncludesAll(resolver, [
    'const sessionContext = safeObject(safeInput.sessionContext)',
    'const organizationId = safeString(sessionContext.organizationId)',
    'const actorId = safeString(sessionContext.actorId)',
    'const repairIntakeDraftId = safeString(safeInput.repairIntakeDraftId)',
    'actorRole: safeString(sessionContext.actorRole)',
    'delete draftInput.source',
  ], 'resolver trusted context source markers');

  assertIncludesAll(trustedContext, [
    'organizationId: safeString(safeInput.organizationId)',
    'actorId: safeString(safeInput.actorId)',
    'actorRole: normalizedValue(safeInput.actorRole)',
    'repairIntakeDraftId: safeString(safeInput.repairIntakeDraftId)',
    'source: normalizedValue(safeInput.source)',
  ], 'permission trusted context markers');

  assertIncludesAll(createSafeContext, [
    'organizationId: safeString(safeContext.organizationId)',
    'actorId: safeString(safeContext.actorId)',
    'repairIntakeDraftId: safeString(safeContext.repairIntakeDraftId)',
    'requestId: safeString(safeContext.requestId)',
    'tenantId: safeString(safeContext.tenantId)',
  ], 'authorization safe context markers');

  assert.ok(
    callSafeController.indexOf('guardRepairIntakeDraftToCaseRequest(requestLike)')
      < callSafeController.indexOf('method.call('),
    'request abuse guard must remain before controller invocation',
  );
});

test('Task2346 preflight documents helper recommendation and proposed pure helper contract', () => {
  const task2346 = read(DOC_PATHS.task2346);

  assertIncludesAll(task2346, [
    'Helper recommended: yes, but only as a future pure helper implementation task with unit tests and no route wiring.',
    '`normalizeRepairIntakeDraftToCaseTrustedContext(input = {})`',
    '`src/repairIntake/repairIntakeDraftToCaseTrustedContextNormalizer.js`',
    'This location is not created by Task2346.',
    'Allowed trusted inputs:',
    'Forbidden sources:',
    'Suggested normalized output fields:',
    'Suggested fail-closed result shape should align with existing trusted-context or authorization tests',
    'Task2347 - Repair Intake Draft-to-Case Trusted Context Normalizer Pure Helper Implementation With Unit Tests',
  ], 'Task2346 helper preflight contract');

  assertIncludesAll(task2346, [
    'trusted route params or top-level `repairIntakeDraftId`',
    'trusted `req.user`',
    'trusted `req.context`',
    'trusted permission/session context',
    'trusted request id or correlation id',
    'trusted idempotency key source',
    'raw request body',
    '`requestBody`',
    '`draftInput`',
    'provider/debug/env containers',
    '`organizationId`',
    '`tenantId` when present and trusted',
    '`actorId`',
    '`actorRole`',
    '`source`',
    '`repairIntakeDraftId`',
    '`requestId`',
    '`correlationId`',
    '`idempotencyKey`',
  ], 'Task2346 proposed input output contract');
});

test('Task2346 remains docs and static guard only with no helper route package or middleware expansion', () => {
  const sourceText = Object.values(SOURCE_PATHS).map(read).join('\n');
  const packageJson = readJson('package.json');
  const topLevelPackageNames = Object.keys({
    ...(packageJson.dependencies || {}),
    ...(packageJson.devDependencies || {}),
  }).map((name) => `"${name}"`).join('\n');
  const task2346 = read(DOC_PATHS.task2346);

  assert.equal(
    fs.existsSync(projectPath('src/repairIntake/repairIntakeDraftToCaseTrustedContextNormalizer.js')),
    false,
    'Task2346 must not create the future helper source file',
  );
  assert.equal(fs.existsSync(projectPath('src/openRepairIntake')), false, 'src/openRepairIntake should remain absent');
  assert.equal(fs.existsSync(projectPath('tests/openRepairIntake')), false, 'tests/openRepairIntake should remain absent');
  assertExcludesAll(sourceText, PUBLIC_OPEN_ROUTE_MARKERS, 'route exposure markers');
  assertExcludesAll(sourceText, AUTH_SESSION_MIDDLEWARE_MARKERS, 'auth/session middleware source markers');
  assertExcludesAll(topLevelPackageNames, PACKAGE_EXPANSION_MARKERS, 'package dependency expansion markers');

  assertIncludesAll(task2346, [
    'No runtime, source behavior, source helper implementation',
    'This task does not add the helper.',
    'No package or package-lock changes are authorized by this task.',
    'no production auth/session middleware implementation is authorized',
    'no route/public/open/customer expansion is authorized',
    'no package/DB/smoke/provider/env coupling is introduced',
    'PM must still authorize one exact task at a time.',
  ], 'Task2346 non-authorization contract');
});
