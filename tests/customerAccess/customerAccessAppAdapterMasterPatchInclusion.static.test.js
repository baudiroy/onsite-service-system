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

const CUSTOMER_ACCESS_PATCH_FILES = [
  ...TASK908_FILES,
  ...TASK909_FILES,
  ...TASK910_FILES,
  ...TASK911_FILES,
  ...TASK912_FILES,
  ...TASK914_FILES,
  ...TASK915_FILES,
];

const ALL_CHECKPOINT_FILES = [
  ...CUSTOMER_ACCESS_PATCH_FILES,
  ...TASK916_FILES,
];

const TASK916_DOC = TASK916_FILES[0];

function absolutePath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(absolutePath(relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(absolutePath(relativePath));
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

test('Task908 through Task916 Customer Access patch files are present', () => {
  for (const file of ALL_CHECKPOINT_FILES) {
    assert.equal(exists(file), true, `${file} should exist`);
  }
});

test('Task916 document lists every Customer Access final patch candidate', () => {
  const doc = read(TASK916_DOC);

  for (const file of ALL_CHECKPOINT_FILES) {
    assert.match(doc, new RegExp(escaped(file)), `${file} should be listed in Task916 doc`);
  }

  for (const heading of [
    'Task908',
    'Task909',
    'Task910',
    'Task911',
    'Task912',
    'Task914',
    'Task915',
    'Task916',
  ]) {
    assert.match(doc, new RegExp(escaped(heading)));
  }
});

test('Task916 document records current git status for every Customer Access target', () => {
  const doc = read(TASK916_DOC);
  const statusLines = gitStatusFor(ALL_CHECKPOINT_FILES);

  assert.equal(statusLines.length <= ALL_CHECKPOINT_FILES.length, true);

  if (statusLines.length === ALL_CHECKPOINT_FILES.length) {
    for (const line of statusLines) {
      assert.match(doc, new RegExp(escaped(line)), `Task916 doc should record ${line}`);
    }

    assert.match(doc, /local \/ uncommitted \/ untracked/);
    assert.match(doc, /unrelated dirty files are not claimed/i);
    assert.match(doc, /No staging\/commit is authorized/);
  }
});

test('Task916 remains no runtime change and forbids expansion', () => {
  const doc = read(TASK916_DOC);

  for (const phrase of [
    'No production runtime source is modified',
    'No runtime behavior change',
    'No public route',
    'No route registration',
    'No listen',
    'No real DB',
    'No auth/session/JWT runtime',
    'No provider',
    'No AI/RAG runtime',
    'No billing/settlement',
    'No migration',
    'No smoke/shared runtime',
  ]) {
    assert.match(doc, new RegExp(escaped(phrase), 'i'));
  }
});
