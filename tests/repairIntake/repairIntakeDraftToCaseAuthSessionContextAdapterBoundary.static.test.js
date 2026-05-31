'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const HELPER_PATH = 'src/repairIntake/repairIntakeDraftToCaseAuthSessionContextAdapter.js';
const UNIT_TEST_PATH = 'tests/repairIntake/repairIntakeDraftToCaseAuthSessionContextAdapter.unit.test.js';
const DOC_PATH = 'docs/task-2355-repair-intake-draft-to-case-production-auth-session-context-adapter-helper-no-route-wiring-no-db-no-smoke-no-provider-no-package.md';

const RUNTIME_SOURCE_PATHS = Object.freeze([
  'src/routes/repairIntakeDraftToCase.routes.js',
  'src/repairIntake/repairIntakeDraftToCaseApiModule.js',
  'src/repairIntake/repairIntakeDraftCaseControllerAdapter.js',
  'src/repairIntake/repairIntakeDraftToCaseApplicationService.js',
  'src/middlewares/requireAuth.js',
  'src/middlewares/requirePermission.js',
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

const PACKAGE_EXPANSION_MARKERS = Object.freeze([
  '"express-session"',
  '"cookie-session"',
  '"passport"',
  '"firebase-admin"',
  '"@supabase/supabase-js"',
  '"express-rate-limit"',
  '"rate-limiter-flexible"',
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

test('Task2355 adapter artifacts exist and helper remains pure', () => {
  for (const relativePath of [HELPER_PATH, UNIT_TEST_PATH, DOC_PATH]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }

  const helperSource = read(HELPER_PATH);
  const topLevelImports = helperSource.split('\n').slice(0, 20).join('\n');

  assert.deepEqual(requireSpecifiers(topLevelImports), []);
  assertIncludesAll(helperSource, [
    'function buildRepairIntakeDraftToCaseAuthSessionContext(input = {})',
    'function trustedPermissionContext(...values)',
    'function fail(reasonCode)',
    'auth_session_context_ready',
    'auth_session_context_organization_required',
    'auth_session_context_actor_required',
    'module.exports = {',
    'buildRepairIntakeDraftToCaseAuthSessionContext',
  ], 'pure auth session adapter helper');
  assertExcludesAll(helperSource, [
    "require('http')",
    "require(\"http\")",
    "require('pg')",
    "require(\"pg\")",
    'process.env',
    'fetch(',
    'listen(',
    'AuthService',
    'UserRepository',
    'PermissionService',
  ], 'pure helper runtime coupling');
});

test('adapter helper is not wired into route API controller application or middleware runtime paths', () => {
  const runtimeSource = RUNTIME_SOURCE_PATHS.map(read).join('\n');

  assertExcludesAll(runtimeSource, [
    'repairIntakeDraftToCaseAuthSessionContextAdapter',
    'buildRepairIntakeDraftToCaseAuthSessionContext',
  ], 'runtime adapter wiring');
});

test('unit coverage proves trusted forbidden fail-closed no-leak and no-mutation behavior', () => {
  const unitTest = read(UNIT_TEST_PATH);

  assertIncludesAll(unitTest, [
    'valid authenticated user and context returns detached allowlisted ready envelope',
    'trusted source precedence falls back through context and session fields only',
    'raw body query headers cookies and draft input cannot override trusted context',
    'missing required organization or actor identity fails closed',
    'malformed input fails closed without exposing raw auth session payload',
    'unsafe strings are dropped or fail closed without raw leakage',
    'does not mutate input objects and returns detached output objects',
  ], 'adapter unit coverage');
});

test('Task2355 doc records no route wiring package public route DB smoke or provider authorization', () => {
  const helperSource = read(HELPER_PATH);
  const runtimeSource = RUNTIME_SOURCE_PATHS.map(read).join('\n');
  const doc = read(DOC_PATH);
  const packageJson = readJson('package.json');
  const packageNames = Object.keys({
    ...(packageJson.dependencies || {}),
    ...(packageJson.devDependencies || {}),
  }).map((name) => `"${name}"`).join('\n');

  assertExcludesAll(`${helperSource}\n${runtimeSource}`, PUBLIC_OPEN_ROUTE_MARKERS, 'public/open/customer route markers');
  assertExcludesAll(packageNames, PACKAGE_EXPANSION_MARKERS, 'package dependency expansion markers');
  assert.equal(fs.existsSync(projectPath('src/openRepairIntake')), false, 'src/openRepairIntake should remain absent');
  assert.equal(fs.existsSync(projectPath('tests/openRepairIntake')), false, 'tests/openRepairIntake should remain absent');

  assertIncludesAll(doc, [
    'No route/runtime wiring was added.',
    'Production auth/session middleware implementation remains non-authorized.',
    'Future route-boundary wiring remains non-authorized by Task2355.',
    'No package or package-lock changes were made.',
    'No DB, migration, smoke, provider, env, Zeabur, secrets, endpoint, server/listener, deploy, or shared runtime work was performed.',
  ], 'Task2355 non-authorization doc');
});
