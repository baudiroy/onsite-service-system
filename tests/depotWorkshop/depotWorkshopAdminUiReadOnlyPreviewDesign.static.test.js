'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const TASK2422_DOC = 'docs/task-2422-depot-workshop-admin-ui-boundary-inventory-no-runtime-change-no-db-no-provider-no-package.md';
const TASK2423_DOC = 'docs/task-2423-depot-workshop-admin-ui-read-only-preview-design-packet-no-runtime-change-no-db-no-provider-no-package.md';
const ROUTE_FILE = 'src/routes/depotRepair.routes.js';
const SERVICE_FILE = 'src/services/WorkshopAssignmentService.js';
const PRESENTER_FILE = 'src/depotWorkshop/depotWorkshopAssignmentIntentResponsePresenter.js';

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

test('Task2422 inventory and Task2423 design packet exist', () => {
  for (const relativePath of [
    TASK2422_DOC,
    TASK2423_DOC,
    ROUTE_FILE,
    SERVICE_FILE,
    PRESENTER_FILE,
    'admin/src/App.tsx',
    'admin/src/config/menu.ts',
    'admin/src/lib/apiClient.ts',
  ]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }
});

test('Task2423 adds no admin UI or API client implementation files', () => {
  const adminSourceFiles = listFiles('admin/src');
  const adminSource = readAll(adminSourceFiles);

  assertDoesNotMatchAny(adminSourceFiles.join('\n'), [
    /DepotWorkshopAssignmentIntentPreviewPage/,
    /DepotWorkshopAssignmentIntentPreviewPanel/,
    /depotWorkshop\.ts$/,
    /depot-workshop/i,
    /depotWorkshop/i,
  ], 'Task2423 admin implementation files');

  assertDoesNotMatchAny(adminSource, [
    /DepotWorkshopAssignmentIntentPreviewPage/,
    /DepotWorkshopAssignmentIntentPreviewPanel/,
    /previewDepotWorkshopAssignmentIntent/,
    /\/depot-workshop\/assignment-intent-preview/,
    /\/api\/v1\/depot\/repairs\/[^`'"]*assignment-intent/i,
    /writePreparedAssignmentIntent/,
    /depotWorkshop/i,
  ], 'Task2423 admin implementation source');
});

test('route remains prepare-only and writePreparedAssignmentIntent is not route-wired', () => {
  const route = read(ROUTE_FILE);
  const service = read(SERVICE_FILE);

  assertIncludesAll(route, [
    "const DEPOT_REPAIR_ROUTE_PATH = '/api/v1/depot/repairs/:depotIntakeId/assignment-intent'",
    "const DEPOT_REPAIR_ROUTE_PERMISSION = 'depot.repair.prepare'",
    'typeof service.prepareAssignmentIntent',
    'return service.prepareAssignmentIntent.bind(service)',
    'writeRequested(req)',
    "failure('depot_repair_route_write_scope_not_approved', req)",
  ], 'Task2423 route source');

  assertIncludesAll(service, [
    'async prepareAssignmentIntent(input = {})',
    'written: false',
    'writeRequired: false',
    'async writePreparedAssignmentIntent(input = {})',
  ], 'Task2423 service source');

  assert.equal(route.includes('writePreparedAssignmentIntent'), false, 'route should not wire writePreparedAssignmentIntent');
});

test('presenter admin-safe response boundary remains visible', () => {
  const presenter = read(PRESENTER_FILE);

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
  ], 'Task2423 presenter boundary');
});

test('design packet records read-only UI boundary allowed fields and future prerequisites', () => {
  const doc = read(TASK2423_DOC);

  assertIncludesAll(doc, [
    'DepotWorkshopAssignmentIntentPreviewPage',
    'DepotWorkshopAssignmentIntentPreviewPanel',
    '/depot-workshop/assignment-intent-preview',
    'previewDepotWorkshopAssignmentIntent(depotIntakeId, payload)',
    'POST /api/v1/depot/repairs/:depotIntakeId/assignment-intent',
    'the route is prepare-only',
    'route write scope remains blocked by `depot_repair_route_write_scope_not_approved`',
    '`writePreparedAssignmentIntent` remains not route-wired',
    '`data.depotRepair`',
    '`repairOrderDraftSummary`',
    '`repairOrderTransitionPlanSummary`',
    '`repairOrderAuditIntentSummary`',
    '`repairOrderCustomerProjectionPreview`',
    '`meta.written: false`',
    '`writeRequired: false`',
    'safe `requestId`',
    'API client route usage for read-only preview only',
    'route write scope and DB readiness remain blockers for any write UI',
  ], 'Task2423 design packet boundary');
});

test('forbidden UI fields and behaviors are documented', () => {
  const doc = read(TASK2423_DOC);

  assertIncludesAll(doc, [
    'full internal helper-derived service objects',
    'enabled route write action button',
    'provider sending',
    'DB/admin migration status control',
    'billing/payment/invoice controls',
    'formal Field Service Report / Completion Report creation',
    'formal Field Service Report / Completion Report approval',
    'formal Field Service Report / Completion Report publication',
    'formal Field Service Report / Completion Report finalization',
    '`finalAppointmentId` display',
    '`finalAppointmentId` mutation',
    'raw customer private/contact/address/signature/photo fields',
    'SQL/stack/token/password/secret/debug payload display',
    'provider payload display',
    'billing payload display',
    'AI/RAG payload display',
  ], 'Task2423 forbidden UI boundary');
});

test('Task2423 recommends exactly one next bounded task without implementation authorization', () => {
  const doc = read(TASK2423_DOC);

  assertIncludesAll(doc, [
    'Recommended next bounded task: admin UI read-only preview static guard / design portfolio.',
    'Do not recommend implementation until the design boundary is complete, safe, and separately authorized.',
  ], 'Task2423 recommendation');

  assert.equal(
    (doc.match(/Recommended next bounded task:/g) || []).length,
    1,
    'Task2423 should recommend exactly one next bounded UI task',
  );
});

test('Task2423 introduces no package runtime DB provider billing AI report or final appointment authorization', () => {
  const docAndGuard = [
    read(TASK2423_DOC),
    read('tests/depotWorkshop/depotWorkshopAdminUiReadOnlyPreviewDesign.static.test.js'),
  ].join('\n');

  assertIncludesAll(docAndGuard, [
    'Task2423 does not authorize:',
    'admin UI implementation',
    'frontend source implementation',
    'API client implementation',
    'package or package-lock changes',
    'route write-scope behavior',
    'DB commands',
    'SQL execution against any DB',
    'real DB connection',
    'migration dry-run/apply',
    '`DATABASE_URL`, Zeabur, env, or secrets inspection',
    'provider sending',
    'billing/settlement/payment/invoice behavior',
    'formal Field Service Report / Completion Report creation, approval, publication, or finalization behavior',
    '`finalAppointmentId` mutation path',
    'The 7 held historical docs remain outside Task2423 scope',
  ], 'Task2423 non-authorization');

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
  ], 'Task2423 executable authorization');
});
