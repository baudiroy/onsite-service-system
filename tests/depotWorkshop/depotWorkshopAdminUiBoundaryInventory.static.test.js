'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const TASK2422_DOC = 'docs/task-2422-depot-workshop-admin-ui-boundary-inventory-no-runtime-change-no-db-no-provider-no-package.md';
const ROUTE_FILE = 'src/routes/depotRepair.routes.js';
const SERVICE_FILE = 'src/services/WorkshopAssignmentService.js';
const PRESENTER_FILE = 'src/depotWorkshop/depotWorkshopAssignmentIntentResponsePresenter.js';
const TASK2414_DOC = 'docs/task-2414-depot-workshop-migration-028-disposable-db-dry-run-authorization-branch-closure-no-runtime-change-no-db-execution-no-migration-apply-no-provider-no-package.md';
const TASK2421_DOC = 'docs/task-2421-depot-workshop-runtime-write-readiness-final-checkpoint-no-runtime-change-no-real-db-no-migration-apply-no-provider-no-package.md';

function projectPath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(projectPath(relativePath), 'utf8');
}

function listFiles(relativeDir) {
  const absoluteDir = projectPath(relativeDir);
  const results = [];

  function walk(currentDir) {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const absolutePath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(absolutePath);
        continue;
      }

      results.push(path.relative(repoRoot, absolutePath));
    }
  }

  walk(absoluteDir);
  return results.sort();
}

function readAll(relativeFiles) {
  return relativeFiles.map((relativePath) => read(relativePath)).join('\n');
}

function assertIncludesAll(source, markers, label) {
  for (const marker of markers) {
    assert.equal(source.includes(marker), true, `${label} missing ${marker}`);
  }
}

function assertDoesNotMatchAny(source, patterns, label) {
  for (const pattern of patterns) {
    assert.doesNotMatch(source, pattern, `${label} should not match ${pattern}`);
  }
}

test('Task2422 inventory doc admin source and context artifacts exist', () => {
  for (const relativePath of [
    TASK2422_DOC,
    ROUTE_FILE,
    SERVICE_FILE,
    PRESENTER_FILE,
    TASK2414_DOC,
    TASK2421_DOC,
    'admin/src/App.tsx',
    'admin/src/config/menu.ts',
    'admin/src/lib/apiClient.ts',
  ]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }

  assert.equal(fs.existsSync(projectPath('admin')), true, 'admin should exist');
  assert.equal(fs.existsSync(projectPath('admin/src')), true, 'admin/src should exist');
});

test('admin source has no dedicated Depot Workshop UI or API client yet', () => {
  const adminSourceFiles = listFiles('admin/src');
  const adminSource = readAll(adminSourceFiles);

  assertIncludesAll(adminSourceFiles.join('\n'), [
    'admin/src/App.tsx',
    'admin/src/config/menu.ts',
    'admin/src/api/cases.ts',
    'admin/src/api/caseDispatch.ts',
    'admin/src/api/fieldServiceReports.ts',
    'admin/src/pages/CaseManagementPage.tsx',
  ], 'Task2422 admin source inventory');

  assertDoesNotMatchAny(adminSourceFiles.join('\n'), [
    /depot/i,
    /workshop/i,
    /repairOrder/i,
    /assignmentIntent/i,
  ], 'Task2422 admin source filenames');

  assertDoesNotMatchAny(adminSource, [
    /\/api\/v1\/depot\/repairs\/[^`'"]*assignment-intent/i,
    /writePreparedAssignmentIntent/,
    /depotWorkshop/i,
    /depotRepair/i,
    /repairOrder/i,
    /assignmentIntent/i,
    /assignment-intent/i,
  ], 'Task2422 admin source content');
});

test('backend route remains prepare-only and write method not route-wired', () => {
  const route = read(ROUTE_FILE);
  const service = read(SERVICE_FILE);

  assertIncludesAll(route, [
    "const DEPOT_REPAIR_ROUTE_PATH = '/api/v1/depot/repairs/:depotIntakeId/assignment-intent'",
    "const DEPOT_REPAIR_ROUTE_PERMISSION = 'depot.repair.prepare'",
    'typeof service.prepareAssignmentIntent',
    'return service.prepareAssignmentIntent.bind(service)',
    'writeRequested(req)',
    "failure('depot_repair_route_write_scope_not_approved', req)",
    'presentDepotWorkshopAssignmentIntentResponse',
  ], 'Task2422 route boundary');

  assertIncludesAll(service, [
    'async prepareAssignmentIntent(input = {})',
    'written: false',
    'writeRequired: false',
    'async writePreparedAssignmentIntent(input = {})',
  ], 'Task2422 service boundary');

  assert.equal(route.includes('writePreparedAssignmentIntent'), false, 'route should not wire writePreparedAssignmentIntent');
});

test('admin-safe presenter and DB dry-run pause remain visible', () => {
  const presenter = read(PRESENTER_FILE);
  const pauseDoc = read(TASK2414_DOC);
  const checkpointDoc = read(TASK2421_DOC);

  assertIncludesAll(presenter, [
    'DEPOT_WORKSHOP_ASSIGNMENT_INTENT_RESPONSE_FIELDS',
    'presentDepotWorkshopAssignmentIntentResponse',
    'data: {',
    'depotRepair: buildDepotRepairPayload(intent)',
    'written: false',
    'writeRequired: false',
    'repairOrderDraftSummary',
    'repairOrderTransitionPlanSummary',
    'repairOrderAuditIntentSummary',
    'repairOrderCustomerProjectionPreview',
  ], 'Task2422 admin-safe presenter');

  assertIncludesAll(`${pauseDoc}\n${checkpointDoc}`, [
    'No explicitly named disposable DB target was provided.',
    'DB work remains paused',
    'migration 028 has not been dry-run or applied',
    'route write scope remains blocked',
  ], 'Task2422 DB dry-run pause');
});

test('inventory recommends one bounded UI design task without implementation authorization', () => {
  const doc = read(TASK2422_DOC);

  assertIncludesAll(doc, [
    '`admin/` exists.',
    '`admin/src/` exists.',
    'no dedicated Depot / Workshop admin page was found in `admin/src/`',
    'no dedicated Depot / Workshop API client was found in `admin/src/api/`',
    'UI must not imply route write scope while route write scope remains blocked',
    'UI must consume only admin-safe presenter fields if future UI is built',
    'read-only assignment-intent preview panel',
    'admin-safe repair order summary card',
    'write-scope disabled state / blocker display',
    'Recommended next bounded task: admin UI read-only preview design packet.',
    'Do not recommend UI implementation yet.',
  ], 'Task2422 inventory doc');

  assert.equal(
    (doc.match(/Recommended next bounded task:/g) || []).length,
    1,
    'Task2422 should recommend exactly one next bounded UI task',
  );
});

test('Task2422 introduces no implementation package or runtime authorization', () => {
  const docAndGuard = [
    read(TASK2422_DOC),
    read('tests/depotWorkshop/depotWorkshopAdminUiBoundaryInventory.static.test.js'),
  ].join('\n');

  assertIncludesAll(docAndGuard, [
    'Task2422 does not authorize:',
    'admin UI implementation',
    'frontend source implementation',
    'API client implementation',
    'route write-scope behavior',
    'DB commands',
    'SQL execution against any DB',
    'real DB connection',
    'migration dry-run/apply',
    '`DATABASE_URL`, Zeabur, env, or secrets inspection',
    'provider sending',
    'package or package-lock changes',
    'formal Field Service Report / Completion Report creation, approval, publication, or finalization behavior',
    '`finalAppointmentId` mutation path',
    'The 7 held historical docs remain outside Task2422 scope',
  ], 'Task2422 non-authorization');

  assertDoesNotMatchAny(docAndGuard, [
    /postgres(?:ql)?:\/\/[^@\s]+:[^@\s]+@[^/\s]+\/[^\s)]+/i,
    /\b(?:password|passwd|pwd|secret|token|api[_-]?key)\s*[:=]\s*['"]?[A-Za-z0-9._~+/=-]{12,}/i,
    /\bDATABASE_URL\s*=\s*[^'"`\s]+/i,
    /\bcurl\s+/i,
    /\bfet' + 'ch\s*\(/,
    /\bsuper' + 'test\s*\(/,
    /\bapp\.lis' + 'ten\s*\(/,
    /\bserver\.lis' + 'ten\s*\(/,
    /\blis' + 'ten\s*\(/,
    /\/hea' + 'lthz/i,
    /\bps' + 'ql\s+/i,
    /\bdb:mig' + 'rate\b/i,
  ], 'Task2422 executable authorization');
});
