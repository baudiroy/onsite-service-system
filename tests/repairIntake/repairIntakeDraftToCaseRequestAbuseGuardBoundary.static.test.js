'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const SOURCE_PATHS = Object.freeze({
  apiModule: 'src/repairIntake/repairIntakeDraftToCaseApiModule.js',
  controllerAdapter: 'src/repairIntake/repairIntakeDraftCaseControllerAdapter.js',
  abuseGuard: 'src/repairIntake/repairIntakeDraftToCaseRequestAbuseGuard.js',
  route: 'src/routes/repairIntakeDraftToCase.routes.js',
  packageJson: 'package.json',
  packageLock: 'package-lock.json',
});

const TEST_PATH = 'tests/repairIntake/repairIntakeDraftToCaseRequestAbuseGuard.unit.test.js';
const DOC_PATH = 'docs/task-2342-repair-intake-draft-to-case-request-abuse-guard-runtime-boundary-no-db-no-smoke-no-provider-no-package.md';

const FORBIDDEN_ROUTE_MARKERS = Object.freeze([
  '/public',
  '/open',
  '/customer',
  '/intake/open',
  '/repair-intake/open',
  'openRepairIntake',
  'customerAccess',
  'customer-access',
]);

const FORBIDDEN_PACKAGE_NAMES = Object.freeze([
  'express-rate-limit',
  'rate-limiter-flexible',
  'raw-body',
  'body-parser',
  'bytes',
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

test('Task2342 static guard reads selected source test doc and package files as text only', () => {
  for (const relativePath of [
    ...Object.values(SOURCE_PATHS),
    TEST_PATH,
    DOC_PATH,
  ]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }

  const guardSource = read('tests/repairIntake/repairIntakeDraftToCaseRequestAbuseGuardBoundary.static.test.js');
  const topLevelImports = guardSource.split('\n').slice(0, 8).join('\n');

  assert.deepEqual(requireSpecifiers(topLevelImports).sort(), [
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:test',
  ]);
});

test('API module invokes pure request abuse guard before controller handler flow', () => {
  const apiModule = read(SOURCE_PATHS.apiModule);
  const abuseGuard = read(SOURCE_PATHS.abuseGuard);

  assertIncludesAll(apiModule, [
    "require('./repairIntakeDraftToCaseRequestAbuseGuard')",
    'guardRepairIntakeDraftToCaseRequest(requestLike)',
    'safeControllerFailure(',
    'sanitizeRequestInput(requestLike)',
  ], 'API module abuse guard wiring');

  assertIncludesAll(abuseGuard, [
    'function guardRepairIntakeDraftToCaseRequest(requestLike, options = {})',
    'maxSafeSerializedLength: 8192',
    'maxStringLength: 1024',
    'maxArrayItems: 32',
    'maxObjectKeys: 64',
    'maxDepth: 6',
    'JSON.stringify(inspected.value)',
    'REPAIR_INTAKE_DRAFT_TO_CASE_REQUEST_ABUSE_REJECTED',
    'submit_safe_request',
  ], 'request abuse guard helper');
});

test('request abuse guard denies unsafe fields and text without adding route or middleware coupling', () => {
  const abuseGuard = read(SOURCE_PATHS.abuseGuard);

  assertIncludesAll(abuseGuard, [
    'rawbody',
    'rawdraftinput',
    'sql',
    'stack',
    'token',
    'password',
    'secret',
    'providerpayload',
    'openai',
    'rag',
    'vector',
    'billing',
    'settlement',
    'payment',
    'invoice',
    'customerprivate',
    'customercontact',
    'customeraddress',
    'fulladdress',
    'signature',
    'photo',
  ], 'request abuse unsafe markers');

  assertExcludesAll(abuseGuard, [
    'express-rate-limit',
    'rate-limiter-flexible',
    'bodyParser',
    'app.listen',
    'server.listen',
    'DATABASE_URL',
    'process.env',
    'Zeabur',
  ], 'request abuse guard forbidden coupling');
});

test('route remains admin injected only with no public open customer expansion', () => {
  const routeSource = read(SOURCE_PATHS.route);

  assertIncludesAll(routeSource, [
    "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_BASE_PATH = '/api/v1/admin'",
    "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH = '/api/v1/admin/repair-intake/drafts/:draftId/case/submit'",
    "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION = 'cases.create'",
    'getRepairIntakeDraftToCaseRuntimePorts',
    'createRepairIntakeDraftToCaseInjectedRouteComposition',
    'requirePermission(REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION)',
  ], 'admin injected route');

  assertExcludesAll(routeSource, FORBIDDEN_ROUTE_MARKERS, 'admin injected route');
});

test('package files do not include new rate limit payload or middleware dependencies', () => {
  const packageText = read(SOURCE_PATHS.packageJson);

  assertExcludesAll(packageText, FORBIDDEN_PACKAGE_NAMES, 'package direct dependencies');
});

test('focused unit tests cover success fail-closed leakage trusted context and no mutation', () => {
  const unitTest = read(TEST_PATH);

  assertIncludesAll(unitTest, [
    'normal valid request still succeeds through API module safe controller boundary',
    'oversized safe serialized payload fails closed before controller invocation',
    'oversized string field fails closed before controller invocation',
    'oversized array and object fields fail closed before controller invocation',
    'null malformed non-object circular and bigint request inputs fail closed safely',
    'unsafe raw fields are stripped and never leak while normal safe request still succeeds',
    'body client-controlled values cannot override trusted context through application service adapter',
    'assertNoUnsafeText',
    'assert.deepEqual(request, before)',
    'REPAIR_INTAKE_DRAFT_TO_CASE_REQUEST_ABUSE_REJECTED',
  ], 'Task2342 focused unit tests');
});

test('Task2342 doc records no DB no smoke no provider no package boundary', () => {
  const doc = read(DOC_PATH);

  assertIncludesAll(doc, [
    'No DB commands were run.',
    'No SQL was executed against any database.',
    'No migration was created, dry-run, modified, or applied.',
    'No server/listener was started.',
    'No smoke test or endpoint probe was run.',
    'No provider sending occurred.',
    'No package or package-lock changes occurred.',
    'No public/open/customer route expansion occurred.',
  ], 'Task2342 doc boundary');
});
