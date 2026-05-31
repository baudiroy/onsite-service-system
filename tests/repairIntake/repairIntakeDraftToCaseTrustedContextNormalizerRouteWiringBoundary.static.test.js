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

test('route imports and invokes pure trusted context normalizer only at request-like boundary', () => {
  const routeSource = read(SOURCE_PATHS.route);
  const buildAdminRequestLike = functionBlock(routeSource, 'buildAdminRequestLike');

  assertIncludesAll(routeSource, [
    "require('../repairIntake/repairIntakeDraftToCaseTrustedContextNormalizer')",
    'normalizeRepairIntakeDraftToCaseTrustedContext',
  ], 'route helper import');

  assertIncludesAll(buildAdminRequestLike, [
    'const requestBody = bodyWithoutServerOwnedContext(body)',
    'const adminPermissionContext = {',
    'const trustedContextResult = normalizeRepairIntakeDraftToCaseTrustedContext({',
    'params,',
    'user,',
    'context,',
    'sessionContext: context,',
    'permissionContext: adminPermissionContext,',
    'tenantId: tenantId(req, body, user)',
    'requestId: requestId(req)',
    'idempotencyKey: idempotencyKey(req)',
    'const trustedContext = trustedContextResult.ok === true ? trustedContextResult.context : {}',
  ], 'route request-like helper wiring');

  assert.ok(
    buildAdminRequestLike.indexOf('bodyWithoutServerOwnedContext(body)')
      < buildAdminRequestLike.indexOf('normalizeRepairIntakeDraftToCaseTrustedContext({'),
    'body context must remain stripped before helper output is adapted',
  );
});

test('route path mount permission and request abuse guard remain unchanged', () => {
  const routeSource = read(SOURCE_PATHS.route);
  const apiModule = read(SOURCE_PATHS.apiModule);
  const callSafeController = functionBlock(apiModule, 'callSafeController');

  assertIncludesAll(routeSource, [
    "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION = 'cases.create'",
    "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH = '/api/v1/admin/repair-intake/drafts/:draftId/case/submit'",
    'requirePermission(REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION)',
    'createRepairIntakeDraftToCaseInjectedRouteComposition',
    'getRepairIntakeDraftToCaseRuntimePorts',
  ], 'route path mount permission markers');

  assert.ok(
    callSafeController.indexOf('guardRepairIntakeDraftToCaseRequest(requestLike)')
      < callSafeController.indexOf('method.call('),
    'request abuse guard must remain before controller invocation',
  );
});

test('route wiring preserves compatible request-like output shape markers', () => {
  const routeSource = read(SOURCE_PATHS.route);
  const buildAdminRequestLike = functionBlock(routeSource, 'buildAdminRequestLike');

  assertIncludesAll(buildAdminRequestLike, [
    'params: normalizedParams',
    'query: isObject(req.query) ? req.query : {}',
    'body: {',
    'context: {',
    'actor: {',
    'organizationId: resolvedOrganizationId',
    'tenantId: resolvedTenantId',
    'requestId: resolvedRequestId',
    'idempotencyKey: resolvedIdempotencyKey',
    'repairIntakeDraftId: resolvedDraftId',
    'draftId: resolvedDraftId',
  ], 'compatible request-like output shape');
});

test('route wiring does not add public route package middleware DB smoke provider or env coupling', () => {
  const sourceText = [
    SOURCE_PATHS.route,
    SOURCE_PATHS.apiModule,
    SOURCE_PATHS.helper,
  ].map(read).join('\n');

  assertExcludesAll(sourceText, PUBLIC_OPEN_ROUTE_MARKERS, 'public/open/customer route markers');
  assert.equal(fs.existsSync(projectPath('src/openRepairIntake')), false, 'src/openRepairIntake should remain absent');
  assert.equal(fs.existsSync(projectPath('tests/openRepairIntake')), false, 'tests/openRepairIntake should remain absent');
  assertExcludesAll(read(SOURCE_PATHS.route), [
    'passport',
    'express-session',
    'cookie-session',
    'firebase-admin',
    'supabase',
    'oauth',
    'process.env.DATABASE_URL',
    'postgres://',
    'postgresql://',
  ], 'route forbidden coupling');
});
