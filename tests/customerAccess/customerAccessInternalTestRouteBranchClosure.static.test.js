'use strict';

const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const TASK908_FILES = [
  'src/customerAccess/customerServiceReportProjectionService.js',
  'tests/customerAccess/customerServiceReportProjectionService.unit.test.js',
  'tests/customerAccess/customerServiceReportProjectionServiceClosure.static.test.js',
  'docs/task-908-customer-access-read-only-service-report-projection-injected-db-client-no-route-no-migration.md',
];

const TASK909_FILES = [
  'src/customerAccess/customerServiceReportProjectionHandler.js',
  'tests/customerAccess/customerServiceReportProjectionHandler.http-behavior.unit.test.js',
  'tests/customerAccess/customerServiceReportProjectionHandlerClosure.static.test.js',
  'docs/task-909-customer-access-service-report-projection-http-handler-injected-db-client-no-listen-no-real-db.md',
];

const TASK910_FILES = [
  'tests/customerAccess/customerServiceReportProjectionBranchClosure.static.test.js',
  'docs/task-910-customer-access-service-report-projection-branch-closure-patch-inclusion-no-runtime-change.md',
];

const TASK911_FILES = [
  'src/customerAccess/customerAccessRequestContextResolver.js',
  'tests/customerAccess/customerAccessRequestContextResolver.unit.test.js',
  'tests/customerAccess/customerAccessRequestContextResolverClosure.static.test.js',
  'docs/task-911-customer-access-request-context-resolver-synthetic-token-context-no-auth-runtime-no-route.md',
];

const TASK912_FILES = [
  'tests/customerAccess/customerAccessProjectionContextBranchClosure.static.test.js',
  'docs/task-912-customer-access-context-resolver-projection-branch-closure-patch-inclusion-no-runtime-change.md',
];

const TASK913_FILES = [
  'docs/task-913-runtime-branch-patch-inclusion-master-checkpoint-no-runtime-change.md',
  'tests/project/runtimeBranchPatchInclusionMasterCheckpoint.static.test.js',
];

const TASK914_FILES = [
  'src/customerAccess/customerServiceReportProjectionAppAdapter.js',
  'tests/customerAccess/customerServiceReportProjectionAppAdapter.unit.test.js',
  'tests/customerAccess/customerServiceReportProjectionAppAdapterClosure.static.test.js',
  'docs/task-914-customer-access-projection-handler-app-adapter-no-public-route-no-listen.md',
];

const TASK915_FILES = [
  'tests/customerAccess/customerServiceReportProjectionAppAdapterBranchClosure.static.test.js',
  'docs/task-915-customer-access-app-adapter-branch-closure-patch-inclusion-no-runtime-change.md',
];

const TASK916_FILES = [
  'docs/task-916-customer-access-app-adapter-master-patch-inclusion-checkpoint-no-runtime-change.md',
  'tests/customerAccess/customerAccessAppAdapterMasterPatchInclusion.static.test.js',
];

const TASK917_FILES = [
  'docs/task-917-customer-access-production-route-authorization-packet-no-route-implementation.md',
  'tests/customerAccess/customerAccessProductionRouteAuthorizationPacket.static.test.js',
];

const TASK918_FILES = [
  'src/customerAccess/customerAccessInternalTestRouteMount.js',
  'tests/customerAccess/customerAccessInternalTestRouteMount.unit.test.js',
  'tests/customerAccess/customerAccessInternalTestRouteMountClosure.static.test.js',
  'docs/task-918-customer-access-internal-test-route-mount-synthetic-app-only-no-public-route-no-real-db.md',
];

const TASK919_FILES = [
  'tests/customerAccess/customerAccessInternalTestRouteBranchClosure.static.test.js',
  'docs/task-919-customer-access-internal-test-route-branch-closure-patch-inclusion-no-runtime-change.md',
];

const ALL_PATCH_FILES = [
  ...TASK908_FILES,
  ...TASK909_FILES,
  ...TASK910_FILES,
  ...TASK911_FILES,
  ...TASK912_FILES,
  ...TASK913_FILES,
  ...TASK914_FILES,
  ...TASK915_FILES,
  ...TASK916_FILES,
  ...TASK917_FILES,
  ...TASK918_FILES,
  ...TASK919_FILES,
];

const MOUNT_FILE = TASK918_FILES[0];
const MOUNT_UNIT_TEST = TASK918_FILES[1];
const TASK919_DOC = TASK919_FILES[1];
const ALLOWED_ADAPTER_SPECIFIER = './customerServiceReportProjectionAppAdapter';

function absolutePath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(absolutePath(relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(absolutePath(relativePath));
}

function requireSpecifiers(source) {
  const specifiers = [];
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
  let match;

  while ((match = requireRegex.exec(source)) !== null) {
    specifiers.push(match[1]);
  }

  return specifiers;
}

function escaped(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function gitStatusFor(files) {
  const output = execFileSync('git', ['status', '--short', '--', ...files], {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  return output
    .split('\n')
    .map((line) => line.trimEnd())
    .filter(Boolean);
}

test('Task908 through Task919 patch candidate files are present', () => {
  for (const file of ALL_PATCH_FILES) {
    assert.equal(exists(file), true, `${file} should exist`);
  }
});

test('Task918 internal test route mount remains synthetic and adapter-delegated', () => {
  const source = read(MOUNT_FILE);
  const unitTestSource = read(MOUNT_UNIT_TEST);

  assert.deepEqual(requireSpecifiers(source), [ALLOWED_ADAPTER_SPECIFIER]);
  assert.match(source, /registerCustomerServiceReportProjectionRoute/);
  assert.match(source, /DEFAULT_INTERNAL_PROJECTION_PATH/);
  assert.match(source, /path\.startsWith\('\/__internal\/'\)/);
  assert.match(unitTestSource, /non-internal path fails closed/);
  assert.match(unitTestSource, /registered handler preserves Task909 safe allow behavior/);
  assert.match(unitTestSource, /assert\.equal\(dbClient\.calls\.length, 0\)/);
});

test('Task918 mount source imports no forbidden runtime dependencies', () => {
  const source = read(MOUNT_FILE);
  const specifiers = requireSpecifiers(source).filter((specifier) => specifier !== ALLOWED_ADAPTER_SPECIFIER);

  for (const specifier of specifiers) {
    assert.equal(
      /(routes?|controllers?|app|server|bootstrap|listen|express|router|db|pool|repositories?|transaction|baseRepository|auth|session|jwt|provider|line|sms|email|push|webhook|ai|rag|vector|search|billing|settlement|env|config|credential|logger|network|smoke)/i.test(specifier),
      false,
      `${MOUNT_FILE} imports forbidden dependency ${specifier}`,
    );
  }

  assert.doesNotMatch(source, /process\.env|console\.|fetch\(|axios|http\.request|https\.request|new Pool|createPool/i);
});

test('Task918 mount has no production route listen auth DB provider AI or mutation execution path', () => {
  const source = read(MOUNT_FILE);

  assert.doesNotMatch(source, /\.listen\s*\(|express\s*\(|Router\s*\(/i);
  assert.doesNotMatch(source, /jwt|session|passport|login|logout|authorization|bearer/i);
  assert.doesNotMatch(source, /new\s+\w*Repository|create.*Repository|baseRepository|transaction|BEGIN|COMMIT|ROLLBACK/i);
  assert.doesNotMatch(source, /\binsert\s*\(|\bupdate\s*\(|\bdelete\s*\(|\bapprove\s*\(|\bpublish\s*\(/i);
  assert.doesNotMatch(source, /finalAppointmentId\s*=|caseStatus\s*=|appointmentStatus\s*=|fieldServiceReport\s*=/);
});

test('production route bootstrap files do not import Task918 internal test mount', () => {
  for (const file of [
    'src/routes/index.js',
    'src/routes/customerAccessRoutes.js',
    'src/app.js',
    'src/server.js',
  ]) {
    const source = read(file);

    assert.doesNotMatch(source, /customerAccessInternalTestRouteMount|mountCustomerAccessInternalTestRoutes/);
  }
});

test('Task919 document lists every final patch candidate and current local status', () => {
  const doc = read(TASK919_DOC);
  const statusLines = gitStatusFor(ALL_PATCH_FILES);

  assert.equal(statusLines.length, ALL_PATCH_FILES.length);

  for (const file of ALL_PATCH_FILES) {
    assert.match(doc, new RegExp(escaped(file)), `${file} should be listed in Task919 doc`);
  }

  for (const line of statusLines) {
    assert.match(doc, new RegExp(escaped(line)), `Task919 doc should record ${line}`);
  }

  assert.match(doc, /Task908-Task919 final patch candidates/i);
  assert.match(doc, /local \/ uncommitted \/ untracked/i);
  assert.match(doc, /unrelated dirty files are not claimed/i);
  assert.match(doc, /No staging\/commit is authorized/i);
});

test('Task919 document records no-runtime closure boundary', () => {
  const doc = read(TASK919_DOC);

  for (const phrase of [
    'No production source change',
    'No runtime behavior change',
    'No production route',
    'No public route',
    'No route registration',
    'No app/server/bootstrap/listen',
    'No real DB',
    'No repository',
    'No auth/session/JWT',
    'No provider',
    'No AI/RAG',
    'No billing/settlement',
    'No migration',
    'No smoke/shared runtime',
  ]) {
    assert.match(doc, new RegExp(escaped(phrase), 'i'));
  }
});
