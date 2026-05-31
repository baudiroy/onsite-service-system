'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const HELPER_PATH = 'src/repairIntake/repairIntakeDraftToCaseTrustedContextNormalizer.js';
const DOC_PATH = 'docs/task-2347-repair-intake-draft-to-case-trusted-context-normalizer-pure-helper-implementation-no-route-wiring-no-db-no-smoke-no-provider-no-package.md';

const RUNTIME_SOURCE_PATHS = Object.freeze([
  'src/routes/repairIntakeDraftToCase.routes.js',
  'src/repairIntake/repairIntakeDraftToCaseApiModule.js',
  'src/repairIntake/repairIntakeDraftToCaseApplicationService.js',
  'src/repairIntake/repairIntakeDraftCaseControllerAdapter.js',
  'src/repairIntake/repairIntakeDraftToCaseRequestContextResolver.js',
  'src/repairIntake/repairIntakeDraftToCaseAuthorizationGate.js',
  'src/repairIntake/repairIntakeDraftToCasePermissionGate.js',
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

test('Task2347 helper boundary artifacts are scoped to pure helper and tests', () => {
  for (const relativePath of [
    HELPER_PATH,
    DOC_PATH,
    'tests/repairIntake/repairIntakeDraftToCaseTrustedContextNormalizer.unit.test.js',
    'tests/repairIntake/repairIntakeDraftToCaseTrustedContextNormalizerHelperBoundary.static.test.js',
  ]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }

  const helperSource = read(HELPER_PATH);
  const topLevelImports = helperSource.split('\n').slice(0, 10).join('\n');

  assert.deepEqual(requireSpecifiers(topLevelImports), []);
  assertIncludesAll(helperSource, [
    'function normalizeRepairIntakeDraftToCaseTrustedContext(input = {})',
    'function trustedPermissionContext(...values)',
    'function fail(reasonCode)',
    'module.exports = {',
    'normalizeRepairIntakeDraftToCaseTrustedContext',
  ], 'pure helper source');
});

test('pure helper is not wired into existing runtime route API controller or application paths', () => {
  const runtimeSource = RUNTIME_SOURCE_PATHS.map(read).join('\n');

  assertExcludesAll(runtimeSource, [
    'repairIntakeDraftToCaseTrustedContextNormalizer',
    'normalizeRepairIntakeDraftToCaseTrustedContext',
  ], 'runtime source wiring');
});

test('helper boundary keeps no public route package DB smoke or provider coupling', () => {
  const helperSource = read(HELPER_PATH);
  const runtimeSource = RUNTIME_SOURCE_PATHS.map(read).join('\n');
  const packageJson = readJson('package.json');
  const topLevelPackageNames = Object.keys({
    ...(packageJson.dependencies || {}),
    ...(packageJson.devDependencies || {}),
  }).map((name) => `"${name}"`).join('\n');

  assertExcludesAll(`${helperSource}\n${runtimeSource}`, PUBLIC_OPEN_ROUTE_MARKERS, 'route exposure markers');
  assertExcludesAll(topLevelPackageNames, PACKAGE_EXPANSION_MARKERS, 'package dependency expansion markers');
  assert.equal(fs.existsSync(projectPath('src/openRepairIntake')), false, 'src/openRepairIntake should remain absent');
  assert.equal(fs.existsSync(projectPath('tests/openRepairIntake')), false, 'tests/openRepairIntake should remain absent');

  assertExcludesAll(helperSource, [
    'process.env',
    'DATABASE_URL',
    "require('pg')",
    "require(\"pg\")",
    'fetch(',
    "require('http')",
    "require(\"http\")",
    "require('express')",
    "require(\"express\")",
    'provider.send',
  ], 'helper runtime coupling');
});

test('Task2347 doc records no route wiring and future wiring remains non-authorized', () => {
  const doc = read(DOC_PATH);

  assertIncludesAll(doc, [
    'No runtime route/API/controller/application wiring was added.',
    'Existing runtime behavior is unchanged because no existing runtime module imports the helper.',
    'Pure Helper Contract And Output Shape',
    'Task2348 - Repair Intake Draft-to-Case Trusted Context Normalizer Route Wiring Decision Gate',
    'PM must still authorize one exact task at a time.',
  ], 'Task2347 doc');
});
