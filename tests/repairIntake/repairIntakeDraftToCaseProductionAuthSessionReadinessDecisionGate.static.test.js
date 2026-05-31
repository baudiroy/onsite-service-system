'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const ROUTE_SOURCE_PATH = 'src/routes/repairIntakeDraftToCase.routes.js';
const PERMISSION_GATE_PATH = 'src/repairIntake/repairIntakeDraftToCasePermissionGate.js';
const REQUEST_CONTEXT_RESOLVER_PATH = 'src/repairIntake/repairIntakeDraftToCaseRequestContextResolver.js';
const TASK2211_DOC_PATH = 'docs/task-2211-repair-intake-draft-to-case-route-mount-readiness-inventory-no-runtime-change-no-db-no-smoke-no-provider.md';
const TASK2212_DOC_PATH = 'docs/task-2212-repair-intake-draft-to-case-production-route-exposure-decision-gate-no-runtime-change-no-db-no-smoke-no-provider.md';
const TASK2221_DOC_PATH = 'docs/task-2221-repair-intake-draft-to-case-persistence-readiness-branch-checkpoint-no-runtime-change-no-db-no-smoke-no-provider.md';
const TASK2222_DOC_PATH = 'docs/task-2222-repair-intake-draft-to-case-production-auth-session-readiness-decision-gate-no-runtime-change-no-db-no-smoke-no-provider.md';

const BOUNDARY_SOURCE_PATHS = Object.freeze([
  ROUTE_SOURCE_PATH,
  'src/repairIntake/repairIntakeDraftToCaseApiModule.js',
  'src/repairIntake/repairIntakeDraftToCaseApplicationService.js',
  'src/repairIntake/repairIntakeDraftToCaseController.js',
  'src/repairIntake/repairIntakeDraftToCaseControllerAdapter.js',
  'src/repairIntake/repairIntakeDraftToCaseHttpMountAdapter.js',
  'src/repairIntake/repairIntakeDraftToCaseHttpResultMapper.js',
  'src/repairIntake/repairIntakeDraftToCaseInjectedRouteComposition.js',
  'src/repairIntake/repairIntakeDraftToCaseInjectedRuntimeComposer.js',
  'src/repairIntake/repairIntakeDraftToCasePermissionGate.js',
  'src/repairIntake/repairIntakeDraftToCasePreRouteHandlerFactory.js',
  'src/repairIntake/repairIntakeDraftToCaseRequestContextResolver.js',
  'src/repairIntake/repairIntakeDraftToCaseRouteHandlerFactory.js',
  'src/repairIntake/repairIntakeDraftToCaseRouteRegistrar.js',
  'src/repairIntake/repairIntakeDraftToCaseSafeRouteBoundary.js',
  'src/repairIntake/repairIntakeDraftToCaseSyntheticHandler.js',
]);

const PUBLIC_ROUTE_MARKERS = Object.freeze([
  '/public',
  '/open',
  '/customer',
  '/intake/open',
  '/repair-intake/open',
  'public.routes',
  'openRepairIntake',
  'customerAccess',
  'customer-access',
]);

const AUTH_SESSION_IMPORT_PATTERNS = Object.freeze([
  /^(?:jsonwebtoken|jose|passport|express-session|cookie-session|firebase-admin)$/i,
  /^@supabase\/supabase-js$/i,
  /(?:^|\/)(?:auth|authentication|session|sessions|jwt|oauth|passport|firebase|supabase)(?:$|\/)/i,
  /(?:Auth|Session|Jwt|JWT|OAuth|Passport|Firebase|Supabase)(?:Middleware|Provider|Strategy)?$/i,
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

  const paramsStart = source.indexOf('(', start);
  let paramsDepth = 0;
  let paramsEnd = -1;

  for (let index = paramsStart; index < source.length; index += 1) {
    const char = source[index];

    if (char === '(') {
      paramsDepth += 1;
    } else if (char === ')') {
      paramsDepth -= 1;

      if (paramsDepth === 0) {
        paramsEnd = index;
        break;
      }
    }
  }

  assert.notEqual(paramsEnd, -1, `unterminated params for ${functionName}`);

  const bodyStart = source.indexOf('{', paramsEnd);
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

function constFrozenArrayBlock(source, constName) {
  const pattern = new RegExp(`const ${constName} = Object\\.freeze\\(\\[([\\s\\S]*?)\\]\\);`);
  const match = source.match(pattern);

  assert.ok(match, `missing frozen array ${constName}`);

  return match[1];
}

function assertIncludesAll(source, markers, label) {
  for (const marker of markers) {
    assert.equal(source.includes(marker), true, `${label} missing marker ${marker}`);
  }
}

function assertExcludesAll(source, markers, label) {
  for (const marker of markers) {
    assert.equal(source.includes(marker), false, `${label} contains marker ${marker}`);
  }
}

test('Task2222 static guard reads current auth-session decision inputs only', () => {
  for (const relativePath of [
    ...BOUNDARY_SOURCE_PATHS,
    TASK2211_DOC_PATH,
    TASK2212_DOC_PATH,
    TASK2221_DOC_PATH,
    TASK2222_DOC_PATH,
  ]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }
});

test('draft-to-case route remains admin scoped and permission gated', () => {
  const routeSource = read(ROUTE_SOURCE_PATH);

  assertIncludesAll(routeSource, [
    "const { requirePermission } = require('../middlewares/requirePermission')",
    "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_BASE_PATH = '/api/v1/admin'",
    "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH = '/api/v1/admin/repair-intake/drafts/:draftId/case/submit'",
    "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION = 'cases.create'",
    'requirePermission(REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION)',
    'permission: REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION',
    "method: 'POST'",
    'registerRepairIntakeDraftToCaseAdminRoutes',
  ], 'admin route auth/session boundary');
});

test('draft-to-case route file has no public open or customer route markers', () => {
  const routeSource = read(ROUTE_SOURCE_PATH);

  assertExcludesAll(routeSource, PUBLIC_ROUTE_MARKERS, 'draft-to-case route source');
});

test('auth session middleware imports are not added to route admin API controller application or synthetic boundaries', () => {
  for (const relativePath of BOUNDARY_SOURCE_PATHS) {
    const source = read(relativePath);

    for (const specifier of requireSpecifiers(source)) {
      for (const pattern of AUTH_SESSION_IMPORT_PATTERNS) {
        assert.doesNotMatch(
          specifier,
          pattern,
          `${relativePath} must not import auth/session middleware ${specifier}`,
        );
      }
    }
  }
});

test('trusted context remains explicit injected and body scrubbed by existing boundaries', () => {
  const routeSource = read(ROUTE_SOURCE_PATH);
  const requestContextResolver = read(REQUEST_CONTEXT_RESOLVER_PATH);
  const organizationId = functionBlock(routeSource, 'organizationId');
  const userId = functionBlock(routeSource, 'userId');
  const draftId = functionBlock(routeSource, 'draftId');
  const bodyWithoutServerOwnedContext = functionBlock(routeSource, 'bodyWithoutServerOwnedContext');
  const buildAdminRequestLike = functionBlock(routeSource, 'buildAdminRequestLike');
  const resolver = functionBlock(requestContextResolver, 'resolveRepairIntakeDraftToCaseRequestContext');

  assertIncludesAll(userId, [
    'user.id',
    'user.userId',
    'user.sub',
  ], 'admin route actor source');
  assertIncludesAll(organizationId, [
    'user.organizationId',
    'req.context && req.context.organizationId',
  ], 'admin route organization source');
  assert.equal(organizationId.includes('body.organizationId'), false);
  assertIncludesAll(draftId, [
    'params.draftId',
  ], 'admin route draft source');
  assert.equal(draftId.includes('body.draftId'), false);
  assert.equal(draftId.includes('body.repairIntakeDraftId'), false);

  assertIncludesAll(bodyWithoutServerOwnedContext, [
    'actorId',
    'actorRole',
    'draftId: bodyDraftId',
    'organizationId: bodyOrganizationId',
    'repairIntakeDraftId',
    'source',
    'return stripBodyContextFields(safeBody)',
  ], 'admin route body scrubber');
  assertIncludesAll(buildAdminRequestLike, [
    'const requestBody = bodyWithoutServerOwnedContext(body)',
    'const trustedContextResult = normalizeRepairIntakeDraftToCaseTrustedContext({',
    'params,',
    'user,',
    'context,',
    'sessionContext: context',
    'tenantId: tenantId(req, body, user)',
    'requestId: requestId(req)',
    'idempotencyKey: idempotencyKey(req)',
    'const resolvedOrganizationId = trustedContext.organizationId',
    'const resolvedActorId = trustedContext.actorId',
    'const resolvedDraftId = trustedContext.repairIntakeDraftId',
    '...requestBody',
    'permission: REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION',
  ], 'admin route request builder');
  assert.doesNotMatch(buildAdminRequestLike, /resolvedOrganizationId\s*=.*body\.organizationId/);
  assert.doesNotMatch(buildAdminRequestLike, /resolvedDraftId\s*=.*body\.(?:draftId|repairIntakeDraftId)/);

  assertIncludesAll(resolver, [
    'const sessionContext = safeObject(safeInput.sessionContext)',
    'const organizationId = safeString(sessionContext.organizationId)',
    'const actorId = safeString(sessionContext.actorId)',
    'const repairIntakeDraftId = safeString(safeInput.repairIntakeDraftId)',
    'actorRole: safeString(sessionContext.actorRole)',
    'sanitizeRepairIntakePublicOpenRequestDto(requestBody.draftInput || {})',
    'delete draftInput.source',
  ], 'request context resolver');
  assert.doesNotMatch(resolver, /requestBody\.organizationId\b/);
  assert.doesNotMatch(resolver, /requestBody\.actorId\b/);
  assert.doesNotMatch(resolver, /requestBody\.actorRole\b/);
  assert.doesNotMatch(resolver, /requestBody\.repairIntakeDraftId\b/);
});

test('permission gate remains conservative and does not allow public customer or self-declared roles', () => {
  const permissionSource = read(PERMISSION_GATE_PATH);
  const rolesBlock = constFrozenArrayBlock(permissionSource, 'ALLOWED_ACTOR_ROLES');
  const sourcesBlock = constFrozenArrayBlock(permissionSource, 'ALLOWED_SOURCES');
  const trustedContext = functionBlock(permissionSource, 'trustedContext');
  const decide = functionBlock(permissionSource, 'decideRepairIntakeDraftToCasePermission');

  assert.match(rolesBlock, /'service_agent'/);
  assert.doesNotMatch(rolesBlock, /'customer'/);
  assert.doesNotMatch(rolesBlock, /'public'/);
  assert.doesNotMatch(rolesBlock, /'admin'/);
  assert.doesNotMatch(rolesBlock, /'self_declared_service_agent'/);

  assert.doesNotMatch(sourcesBlock, /'public_form'/);
  assert.doesNotMatch(sourcesBlock, /'customer_access'/);
  assert.doesNotMatch(sourcesBlock, /'web'/);

  assertIncludesAll(trustedContext, [
    'organizationId: safeString(safeInput.organizationId)',
    'actorId: safeString(safeInput.actorId)',
    'actorRole: normalizedValue(safeInput.actorRole)',
    'repairIntakeDraftId: safeString(safeInput.repairIntakeDraftId)',
    'source: normalizedValue(safeInput.source)',
  ], 'permission gate trusted context');
  assert.doesNotMatch(trustedContext, /requestBody\./);
  assert.doesNotMatch(trustedContext, /draftInput\./);
  assert.doesNotMatch(trustedContext, /rawBody\./);

  assertIncludesAll(decide, [
    'const context = trustedContext(input)',
    'return deny(\'missing_trusted_context\', context)',
    'return deny(\'role_not_allowed\', context)',
    'return deny(\'invalid_source\', context)',
    'return allow(context)',
  ], 'permission decision gate');
});

test('Task2222 doc records auth session integration as future non-authorized work', () => {
  const doc = read(TASK2222_DOC_PATH);

  for (const marker of [
    'Current route remains admin/injected-only',
    'Current route remains permission-gated by `requirePermission` / `cases.create`',
    'Current trusted actor/context is injected/request-context based and is not a full production auth/session implementation',
    'No auth/session runtime integration is authorized by this task',
    'No permission model change is authorized by this task',
    'No role expansion is authorized by this task',
    'No organization isolation source change is authorized by this task',
    'No public/open/customer route exposure is authorized by this task',
    'Future production auth/session integration requires a separate exact PM-authorized task',
    'Session/JWT/token source and validation boundary',
    'Staging/smoke/production rollout authorization',
  ]) {
    assert.equal(doc.includes(marker), true, `Task2222 doc missing marker ${marker}`);
  }
});
