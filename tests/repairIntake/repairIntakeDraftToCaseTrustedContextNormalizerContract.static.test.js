'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const SOURCE_PATHS = Object.freeze({
  route: 'src/routes/repairIntakeDraftToCase.routes.js',
  apiModule: 'src/repairIntake/repairIntakeDraftToCaseApiModule.js',
  requestAbuseGuard: 'src/repairIntake/repairIntakeDraftToCaseRequestAbuseGuard.js',
  requestContextResolver: 'src/repairIntake/repairIntakeDraftToCaseRequestContextResolver.js',
  authorizationGate: 'src/repairIntake/repairIntakeDraftToCaseAuthorizationGate.js',
  permissionGate: 'src/repairIntake/repairIntakeDraftToCasePermissionGate.js',
});

const DOC_PATHS = Object.freeze({
  task2222: 'docs/task-2222-repair-intake-draft-to-case-production-auth-session-readiness-decision-gate-no-runtime-change-no-db-no-smoke-no-provider.md',
  task2344: 'docs/task-2344-repair-intake-draft-to-case-auth-session-context-boundary-inventory-no-runtime-change-no-db-no-smoke-no-provider-no-package.md',
  task2345: 'docs/task-2345-repair-intake-draft-to-case-trusted-context-normalizer-contract-static-guard-no-runtime-change-no-db-no-smoke-no-provider-no-package.md',
});

const PACKAGE_PATHS = Object.freeze([
  'package.json',
  'package-lock.json',
]);

const TEST_PATHS = Object.freeze([
  'tests/repairIntake/repairIntakeDraftToCaseAuthSessionContextBoundary.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseProductionAuthSessionReadinessDecisionGate.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseTrustedContextBoundary.unit.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseTrustedContextBoundary.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseAuthorizationGate.unit.test.js',
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

function assertBefore(source, first, second, label) {
  const firstIndex = source.indexOf(first);
  const secondIndex = source.indexOf(second);

  assert.notEqual(firstIndex, -1, `${label} missing first marker ${first}`);
  assert.notEqual(secondIndex, -1, `${label} missing second marker ${second}`);
  assert.ok(firstIndex < secondIndex, `${label} should keep ${first} before ${second}`);
}

test('Task2345 static guard reads only current source test package and doc artifacts', () => {
  for (const relativePath of [
    ...Object.values(SOURCE_PATHS),
    ...Object.values(DOC_PATHS),
    ...PACKAGE_PATHS,
    ...TEST_PATHS,
  ]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }

  const guardSource = read('tests/repairIntake/repairIntakeDraftToCaseTrustedContextNormalizerContract.static.test.js');
  const topLevelImports = guardSource.split('\n').slice(0, 8).join('\n');

  assert.deepEqual(requireSpecifiers(topLevelImports).sort(), [
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:test',
  ]);
});

test('admin route freezes trusted context source order and permission context contract', () => {
  const routeSource = read(SOURCE_PATHS.route);
  const organizationId = functionBlock(routeSource, 'organizationId');
  const tenantId = functionBlock(routeSource, 'tenantId');
  const userId = functionBlock(routeSource, 'userId');
  const requestId = functionBlock(routeSource, 'requestId');
  const idempotencyKey = functionBlock(routeSource, 'idempotencyKey');
  const draftId = functionBlock(routeSource, 'draftId');
  const buildAdminRequestLike = functionBlock(routeSource, 'buildAdminRequestLike');

  assertIncludesAll(routeSource, [
    "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH = '/api/v1/admin/repair-intake/drafts/:draftId/case/submit'",
    "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION = 'cases.create'",
    'createRepairIntakeDraftToCaseInjectedRouteComposition',
    'getRepairIntakeDraftToCaseRuntimePorts',
    'requirePermission(REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION)',
  ], 'admin route trusted context normalizer contract');

  assertBefore(organizationId, 'user.organizationId', 'req.context && req.context.organizationId', 'organizationId source order');
  assert.equal(organizationId.includes('body.organizationId'), false);

  assertBefore(tenantId, 'user.tenantId', 'req.context && req.context.tenantId', 'tenantId source order');
  assertBefore(tenantId, 'req.context && req.context.tenantId', 'body.tenantId', 'tenantId body fallback order');

  assertBefore(userId, 'user.id', 'user.userId', 'actor id source order');
  assertBefore(userId, 'user.userId', 'user.sub', 'actor id source order');

  assertBefore(requestId, 'req.requestId', 'req.context && req.context.requestId', 'request id source order');
  assert.equal(requestId.includes('body.requestId'), false);

  assertBefore(idempotencyKey, 'req.idempotencyKey', 'req.context && req.context.idempotencyKey', 'idempotency key source order');
  assert.equal(idempotencyKey.includes('body.idempotencyKey'), false);

  assertIncludesAll(draftId, ['params.draftId'], 'draft id source');
  assert.equal(draftId.includes('body.draftId'), false);
  assert.equal(draftId.includes('body.repairIntakeDraftId'), false);

  assertIncludesAll(buildAdminRequestLike, [
    'const requestBody = bodyWithoutServerOwnedContext(body)',
    'const resolvedOrganizationId = organizationId(req, body, user)',
    'const resolvedTenantId = tenantId(req, body, user)',
    'const resolvedRequestId = requestId(req)',
    'const resolvedIdempotencyKey = idempotencyKey(req)',
    'const resolvedActorId = userId(user)',
    'const resolvedDraftId = draftId(params, body)',
    'canCreateCaseFromRepairIntakeDraft: true',
    'permission: REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION',
  ], 'admin request-like trusted context');

  assert.equal(/resolvedOrganizationId\s*=.*body\.organizationId/.test(buildAdminRequestLike), false);
  assert.equal(/resolvedActorId\s*=.*body\.(actorId|userId)/.test(buildAdminRequestLike), false);
});

test('body and nested draft input context fields remain stripped before downstream handling', () => {
  const routeSource = read(SOURCE_PATHS.route);
  const bodyWithoutServerOwnedContext = functionBlock(routeSource, 'bodyWithoutServerOwnedContext');
  const stripBodyContextFields = functionBlock(routeSource, 'stripBodyContextFields');

  assertIncludesAll(routeSource, [
    'const BODY_CONTEXT_FIELD_NAMES = new Set([',
    "'actorid'",
    "'actorrole'",
    "'caseid'",
    "'correlationid'",
    "'debugid'",
    "'dedupekey'",
    "'draftid'",
    "'duplicate'",
    "'idempotencykey'",
    "'organizationid'",
    "'repairintakedraftid'",
    "'replay'",
    "'requestid'",
    "'source'",
    "'traceid'",
  ], 'route body context field denylist');

  assertIncludesAll(stripBodyContextFields, [
    'stripBodyContextFields(item)',
    'BODY_CONTEXT_FIELD_NAMES.has(normalizedFieldName(key))',
    'continue',
    'result[key] = stripBodyContextFields(fieldValue)',
  ], 'recursive body context stripping');

  assertIncludesAll(bodyWithoutServerOwnedContext, [
    'actorId',
    'actorRole',
    'caseId',
    'correlationId',
    'debugId',
    'dedupeKey',
    'draftId: bodyDraftId',
    'duplicate',
    'idempotencyKey',
    'organizationId: bodyOrganizationId',
    'repairIntakeDraftId',
    'replay',
    'requestId: bodyRequestId',
    'source',
    'traceId',
    '...safeBody',
    'stripBodyContextFields(safeBody)',
  ], 'body server-owned field stripping contract');
});

test('resolver permission and authorization gates keep trusted scalar context isolated from raw containers', () => {
  const resolverSource = read(SOURCE_PATHS.requestContextResolver);
  const permissionSource = read(SOURCE_PATHS.permissionGate);
  const authorizationSource = read(SOURCE_PATHS.authorizationGate);
  const resolver = functionBlock(resolverSource, 'resolveRepairIntakeDraftToCaseRequestContext');
  const trustedContext = functionBlock(permissionSource, 'trustedContext');
  const createSafeContext = functionBlock(authorizationSource, 'createSafeContext');

  assertIncludesAll(resolverSource, [
    'const BODY_OVERRIDE_FIELD_NAMES = new Set([',
    "'actorid'",
    "'actorrole'",
    "'draftid'",
    "'organizationid'",
    "'orgid'",
    "'repairintakedraftid'",
    "'source'",
    "'userid'",
    "'headers'",
    "'providerpayload'",
    "'query'",
    "'rawrequest'",
    "'secret'",
    "'token'",
  ], 'resolver unsafe and body override denylist');

  assertIncludesAll(resolver, [
    'const sessionContext = safeObject(safeInput.sessionContext)',
    'const requestBody = isPlainObject(safeInput.requestBody) ? safeInput.requestBody : {}',
    'const organizationId = safeString(sessionContext.organizationId)',
    'const actorId = safeString(sessionContext.actorId)',
    'const repairIntakeDraftId = safeString(safeInput.repairIntakeDraftId)',
    'source: safeString(safeInput.requestSource)',
    'actorRole: safeString(sessionContext.actorRole)',
    'sanitizeRepairIntakePublicOpenRequestDto(requestBody.draftInput || {})',
    'delete draftInput.source',
  ], 'request context resolver frozen contract');

  assert.equal(/requestBody\.(organizationId|orgId|actorId|actorRole|userId|repairIntakeDraftId|draftId|source)\b/.test(resolver), false);
  assert.equal(/safeInput\.requestBody\.(organizationId|actorId|repairIntakeDraftId|source)\b/.test(resolver), false);

  assertIncludesAll(trustedContext, [
    'organizationId: safeString(safeInput.organizationId)',
    'actorId: safeString(safeInput.actorId)',
    'actorRole: normalizedValue(safeInput.actorRole)',
    'repairIntakeDraftId: safeString(safeInput.repairIntakeDraftId)',
    'source: normalizedValue(safeInput.source)',
  ], 'permission gate trusted scalar context');
  assert.equal(/requestBody\.|draftInput\.|headers\.|query\./.test(trustedContext), false);

  assertIncludesAll(createSafeContext, [
    'organizationId: safeString(safeContext.organizationId)',
    'actorId: safeString(safeContext.actorId)',
    'repairIntakeDraftId: safeString(safeContext.repairIntakeDraftId)',
    'source: safeString(safeContext.source)',
    'actorRole: safeString(safeContext.actorRole)',
    'requestId: safeString(safeContext.requestId)',
    'tenantId: safeString(safeContext.tenantId)',
  ], 'authorization gate safe context');
});

test('request abuse guard stays before controller invocation and no route exposure expands', () => {
  const apiModule = read(SOURCE_PATHS.apiModule);
  const sourceText = Object.values(SOURCE_PATHS).map(read).join('\n');
  const callSafeController = functionBlock(apiModule, 'callSafeController');

  assertIncludesAll(callSafeController, [
    'const abuseGuardResult = guardRepairIntakeDraftToCaseRequest(requestLike)',
    'if (!abuseGuardResult.ok)',
    'safeControllerFailure(',
    'method.call(',
    'sanitizeRequestInput(requestLike)',
  ], 'API module request abuse guard order');

  assert.ok(
    callSafeController.indexOf('guardRepairIntakeDraftToCaseRequest(requestLike)')
      < callSafeController.indexOf('method.call('),
    'request abuse guard must remain before controller invocation',
  );

  assertExcludesAll(sourceText, PUBLIC_OPEN_ROUTE_MARKERS, 'Repair Intake draft-to-case route exposure');
  assert.equal(fs.existsSync(projectPath('src/openRepairIntake')), false, 'src/openRepairIntake should remain absent');
  assert.equal(fs.existsSync(projectPath('tests/openRepairIntake')), false, 'tests/openRepairIntake should remain absent');
});

test('Task2345 contract records non-authorization and no package dependency expansion markers', () => {
  const sourceText = Object.values(SOURCE_PATHS).map(read).join('\n');
  const packageJson = readJson('package.json');
  const topLevelPackageNames = Object.keys({
    ...(packageJson.dependencies || {}),
    ...(packageJson.devDependencies || {}),
  }).map((name) => `"${name}"`).join('\n');
  const task2222 = read(DOC_PATHS.task2222);
  const task2344 = read(DOC_PATHS.task2344);
  const task2345 = read(DOC_PATHS.task2345);

  assertExcludesAll(sourceText, AUTH_SESSION_MIDDLEWARE_MARKERS, 'auth/session middleware source contract');
  assertExcludesAll(topLevelPackageNames, PACKAGE_EXPANSION_MARKERS, 'package dependency expansion contract');

  assertIncludesAll(task2222, [
    'No auth/session runtime integration is authorized by this task',
    'Future production auth/session integration requires a separate exact PM-authorized task',
  ], 'Task2222 non-authorization contract');

  assertIncludesAll(task2344, [
    'Task2345 - Repair Intake Draft-to-Case Trusted Context Normalizer Contract Static Guard',
    'Production auth/session middleware implementation remains non-authorized',
  ], 'Task2344 accepted inventory');

  assertIncludesAll(task2345, [
    'Task2344 established the accepted current inventory',
    'Frozen Trusted Context Contract',
    'Client body fields must not override trusted `organizationId`, actor/admin identity, request id, idempotency key, permission context, source, or draft id.',
    'The current `tenantId` body fallback is accepted only after user/context sources, not as an override of trusted user/context values.',
    'No package or package-lock changes',
    'Task2346 - Repair Intake Draft-to-Case Trusted Context Normalizer Pure Helper Preflight Design Packet',
    'PM must still authorize one exact task at a time.',
  ], 'Task2345 static contract doc');
});
