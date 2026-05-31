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
  task2342: 'docs/task-2342-repair-intake-draft-to-case-request-abuse-guard-runtime-boundary-no-db-no-smoke-no-provider-no-package.md',
  task2343: 'docs/task-2343-repair-intake-draft-to-case-request-abuse-guard-runtime-boundary-checkpoint-no-runtime-change-no-db-no-smoke-no-provider-no-package.md',
  task2344: 'docs/task-2344-repair-intake-draft-to-case-auth-session-context-boundary-inventory-no-runtime-change-no-db-no-smoke-no-provider-no-package.md',
});

const TEST_PATHS = Object.freeze([
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
  'jsonwebtoken',
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

test('Task2344 static guard reads current source test and doc context artifacts only', () => {
  for (const relativePath of [
    ...Object.values(SOURCE_PATHS),
    ...Object.values(DOC_PATHS),
    ...TEST_PATHS,
  ]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }

  const guardSource = read('tests/repairIntake/repairIntakeDraftToCaseAuthSessionContextBoundary.static.test.js');
  const topLevelImports = guardSource.split('\n').slice(0, 8).join('\n');

  assert.deepEqual(requireSpecifiers(topLevelImports).sort(), [
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:test',
  ]);
});

test('admin route path permission and injected-only markers remain visible', () => {
  const routeSource = read(SOURCE_PATHS.route);

  assertIncludesAll(routeSource, [
    "const { requirePermission } = require('../middlewares/requirePermission')",
    "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION = 'cases.create'",
    "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_BASE_PATH = '/api/v1/admin'",
    "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH = '/api/v1/admin/repair-intake/drafts/:draftId/case/submit'",
    'createRepairIntakeDraftToCaseInjectedRouteComposition',
    'getRepairIntakeDraftToCaseRuntimePorts',
    'requirePermission(REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION)',
  ], 'admin route auth/session context boundary');

  assertExcludesAll(routeSource, PUBLIC_OPEN_ROUTE_MARKERS, 'admin route auth/session context boundary');
});

test('admin route builds trusted context from user request context and route params instead of body overrides', () => {
  const routeSource = read(SOURCE_PATHS.route);
  const organizationId = functionBlock(routeSource, 'organizationId');
  const tenantId = functionBlock(routeSource, 'tenantId');
  const requestId = functionBlock(routeSource, 'requestId');
  const draftId = functionBlock(routeSource, 'draftId');
  const bodyWithoutServerOwnedContext = functionBlock(routeSource, 'bodyWithoutServerOwnedContext');
  const buildAdminRequestLike = functionBlock(routeSource, 'buildAdminRequestLike');

  assertIncludesAll(organizationId, [
    'user.organizationId',
    'req.context && req.context.organizationId',
  ], 'route organization source');
  assert.equal(organizationId.includes('body.organizationId'), false);

  assertIncludesAll(tenantId, [
    'user.tenantId',
    'req.context && req.context.tenantId',
    'body.tenantId',
  ], 'route tenant source');

  assertIncludesAll(requestId, [
    'req.requestId',
    'req.context && req.context.requestId',
  ], 'route request id source');

  assertIncludesAll(draftId, [
    'params.draftId',
  ], 'route draft id source');
  assert.equal(draftId.includes('body.draftId'), false);

  assertIncludesAll(bodyWithoutServerOwnedContext, [
    'actorId',
    'actorRole',
    'organizationId: bodyOrganizationId',
    'requestId: bodyRequestId',
    'idempotencyKey',
    'repairIntakeDraftId',
    '...safeBody',
    'stripBodyContextFields(safeBody)',
  ], 'route body context scrubber');

  assertIncludesAll(buildAdminRequestLike, [
    'const resolvedOrganizationId = organizationId(req, body, user)',
    'const resolvedActorId = userId(user)',
    'const resolvedRequestId = requestId(req)',
    'const resolvedDraftId = draftId(params, body)',
    'canCreateCaseFromRepairIntakeDraft: true',
    'permission: REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION',
    'organizationId: resolvedOrganizationId',
    'actorId: resolvedActorId',
    'requestId: resolvedRequestId',
  ], 'route admin request builder');

  assert.equal(/resolvedOrganizationId\s*=.*body\.organizationId/.test(buildAdminRequestLike), false);
});

test('request context resolver and permission gate keep server-owned context separate from raw body fields', () => {
  const resolver = read(SOURCE_PATHS.requestContextResolver);
  const permissionGate = read(SOURCE_PATHS.permissionGate);
  const authorizationGate = read(SOURCE_PATHS.authorizationGate);
  const resolverFunction = functionBlock(resolver, 'resolveRepairIntakeDraftToCaseRequestContext');
  const trustedContext = functionBlock(permissionGate, 'trustedContext');
  const createSafeContext = functionBlock(authorizationGate, 'createSafeContext');

  assertIncludesAll(resolverFunction, [
    'const sessionContext = safeObject(safeInput.sessionContext)',
    'const requestBody = isPlainObject(safeInput.requestBody) ? safeInput.requestBody : {}',
    'const organizationId = safeString(sessionContext.organizationId)',
    'const actorId = safeString(sessionContext.actorId)',
    'const repairIntakeDraftId = safeString(safeInput.repairIntakeDraftId)',
    'actorRole: safeString(sessionContext.actorRole)',
    'sanitizeRepairIntakePublicOpenRequestDto(requestBody.draftInput || {})',
  ], 'request context resolver');
  assert.equal(/requestBody\.organizationId\b/.test(resolverFunction), false);
  assert.equal(/requestBody\.actorId\b/.test(resolverFunction), false);

  assertIncludesAll(trustedContext, [
    'organizationId: safeString(safeInput.organizationId)',
    'actorId: safeString(safeInput.actorId)',
    'actorRole: normalizedValue(safeInput.actorRole)',
    'repairIntakeDraftId: safeString(safeInput.repairIntakeDraftId)',
    'source: normalizedValue(safeInput.source)',
  ], 'permission gate trusted context');
  assert.equal(/requestBody\./.test(trustedContext), false);
  assert.equal(/draftInput\./.test(trustedContext), false);

  assertIncludesAll(createSafeContext, [
    'organizationId: safeString(safeContext.organizationId)',
    'actorId: safeString(safeContext.actorId)',
    'repairIntakeDraftId: safeString(safeContext.repairIntakeDraftId)',
    'requestId: safeString(safeContext.requestId)',
    'tenantId: safeString(safeContext.tenantId)',
  ], 'authorization gate safe context');
});

test('request abuse guard remains in API module safe-controller path before controller invocation', () => {
  const apiModule = read(SOURCE_PATHS.apiModule);
  const callSafeController = functionBlock(apiModule, 'callSafeController');

  assertIncludesAll(apiModule, [
    "require('./repairIntakeDraftToCaseRequestAbuseGuard')",
    'guardRepairIntakeDraftToCaseRequest',
  ], 'API module abuse guard import');

  assertIncludesAll(callSafeController, [
    'const abuseGuardResult = guardRepairIntakeDraftToCaseRequest(requestLike)',
    'if (!abuseGuardResult.ok)',
    'safeControllerFailure(',
    'method.call(',
    'sanitizeRequestInput(requestLike)',
  ], 'API module safe controller abuse guard');

  assert.ok(
    callSafeController.indexOf('guardRepairIntakeDraftToCaseRequest(requestLike)')
      < callSafeController.indexOf('method.call('),
    'request abuse guard must run before controller method invocation',
  );
});

test('auth session middleware packages and runtime integrations remain non-authorized', () => {
  const sourceText = Object.values(SOURCE_PATHS).map(read).join('\n');
  const task2222 = read(DOC_PATHS.task2222);
  const task2344 = read(DOC_PATHS.task2344);

  assertExcludesAll(sourceText, AUTH_SESSION_MIDDLEWARE_MARKERS, 'auth/session source inventory');
  assertIncludesAll(task2222, [
    'No auth/session runtime integration is authorized by this task',
    'No permission model change is authorized by this task',
    'No role expansion is authorized by this task',
    'No organization isolation source change is authorized by this task',
    'Future production auth/session integration requires a separate exact PM-authorized task',
  ], 'Task2222 auth/session decision gate');
  assertIncludesAll(task2344, [
    'Production auth/session middleware implementation remains non-authorized',
    'Task2345 - Repair Intake Draft-to-Case Trusted Context Normalizer Contract Static Guard',
    'PM must still authorize one exact task at a time.',
  ], 'Task2344 inventory doc');
});
