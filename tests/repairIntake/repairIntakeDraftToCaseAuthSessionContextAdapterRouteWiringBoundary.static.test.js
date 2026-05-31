'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const SOURCE_PATHS = Object.freeze({
  route: 'src/routes/repairIntakeDraftToCase.routes.js',
  apiModule: 'src/repairIntake/repairIntakeDraftToCaseApiModule.js',
  authAdapter: 'src/repairIntake/repairIntakeDraftToCaseAuthSessionContextAdapter.js',
  trustedNormalizer: 'src/repairIntake/repairIntakeDraftToCaseTrustedContextNormalizer.js',
  applicationService: 'src/repairIntake/repairIntakeDraftToCaseApplicationService.js',
  controllerAdapter: 'src/repairIntake/repairIntakeDraftCaseControllerAdapter.js',
  requireAuth: 'src/middlewares/requireAuth.js',
  requirePermission: 'src/middlewares/requirePermission.js',
});

const DOC_PATH = 'docs/task-2357-repair-intake-draft-to-case-auth-session-context-adapter-route-boundary-wiring-implementation-no-route-path-change-no-db-no-smoke-no-provider-no-package.md';

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

function projectPath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(projectPath(relativePath), 'utf8');
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

test('route imports and invokes auth session context adapter only at request-like boundary', () => {
  const routeSource = read(SOURCE_PATHS.route);
  const buildAdminRequestLike = functionBlock(routeSource, 'buildAdminRequestLike');

  assertIncludesAll(routeSource, [
    "require('../repairIntake/repairIntakeDraftToCaseAuthSessionContextAdapter')",
    'buildRepairIntakeDraftToCaseAuthSessionContext',
  ], 'route auth adapter import');

  assertIncludesAll(buildAdminRequestLike, [
    'const requestBody = bodyWithoutServerOwnedContext(body)',
    'const authSessionContextResult = buildRepairIntakeDraftToCaseAuthSessionContext({',
    'user,',
    'context,',
    'sessionContext: context,',
    'permissionContext: adminPermissionContext,',
    'requestId: requestId(req)',
    'idempotencyKey: idempotencyKey(req)',
    'const authSessionContext = authSessionContextResult.ok === true',
    'context: authSessionContext',
    'sessionContext: authSessionContext',
    'normalizeRepairIntakeDraftToCaseTrustedContext({',
  ], 'route auth adapter request-like wiring');

  assert.ok(
    buildAdminRequestLike.indexOf('bodyWithoutServerOwnedContext(body)')
      < buildAdminRequestLike.indexOf('buildRepairIntakeDraftToCaseAuthSessionContext({'),
    'body context stripping must remain before auth adapter output is used',
  );
  assert.ok(
    buildAdminRequestLike.indexOf('buildRepairIntakeDraftToCaseAuthSessionContext({')
      < buildAdminRequestLike.indexOf('normalizeRepairIntakeDraftToCaseTrustedContext({'),
    'auth adapter must run before trusted context normalizer',
  );
});

test('route path permission middleware and request abuse guard remain unchanged', () => {
  const routeSource = read(SOURCE_PATHS.route);
  const apiModule = read(SOURCE_PATHS.apiModule);
  const callSafeController = functionBlock(apiModule, 'callSafeController');

  assertIncludesAll(routeSource, [
    "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH = '/api/v1/admin/repair-intake/drafts/:draftId/case/submit'",
    "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION = 'cases.create'",
    'requirePermission(REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION)',
    'createRepairIntakeDraftToCaseInjectedRouteComposition',
    'registerRepairIntakeDraftToCaseAdminRoutes',
  ], 'route path permission markers');

  assert.ok(
    callSafeController.indexOf('guardRepairIntakeDraftToCaseRequest(requestLike)')
      < callSafeController.indexOf('method.call('),
    'request abuse guard must remain before controller invocation',
  );
});

test('auth adapter route wiring does not modify middleware API controller or application modules', () => {
  const downstreamSource = [
    SOURCE_PATHS.apiModule,
    SOURCE_PATHS.applicationService,
    SOURCE_PATHS.controllerAdapter,
    SOURCE_PATHS.requireAuth,
    SOURCE_PATHS.requirePermission,
  ].map(read).join('\n');

  assertExcludesAll(downstreamSource, [
    'repairIntakeDraftToCaseAuthSessionContextAdapter',
    'buildRepairIntakeDraftToCaseAuthSessionContext',
  ], 'downstream auth adapter wiring');
});

test('Task2357 doc records no package public route DB smoke provider or middleware behavior expansion', () => {
  const sourceText = Object.values(SOURCE_PATHS).map(read).join('\n');
  const doc = read(DOC_PATH);

  assertExcludesAll(sourceText, PUBLIC_OPEN_ROUTE_MARKERS, 'public/open/customer route markers');
  assert.equal(fs.existsSync(projectPath('src/openRepairIntake')), false, 'src/openRepairIntake should remain absent');
  assert.equal(fs.existsSync(projectPath('tests/openRepairIntake')), false, 'tests/openRepairIntake should remain absent');

  assertIncludesAll(doc, [
    'No route path or mount changed.',
    'No package or package-lock changes were made.',
    'No auth/session middleware implementation changed.',
    'No `requireAuth` or `requirePermission` middleware behavior changed.',
    'No DB, migration, smoke, provider, env, Zeabur, secrets, endpoint, server/listener, deploy, or shared runtime work was performed.',
  ], 'Task2357 non-authorization doc');
});
