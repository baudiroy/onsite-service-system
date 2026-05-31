'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const TASK2422_DOC = 'docs/task-2422-depot-workshop-admin-ui-boundary-inventory-no-runtime-change-no-db-no-provider-no-package.md';
const TASK2423_DOC = 'docs/task-2423-depot-workshop-admin-ui-read-only-preview-design-packet-no-runtime-change-no-db-no-provider-no-package.md';
const TASK2424_DOC = 'docs/task-2424-depot-workshop-admin-ui-read-only-preview-design-portfolio-guard-no-runtime-change-no-db-no-provider-no-package.md';
const ROUTE_FILE = 'src/routes/depotRepair.routes.js';
const SERVICE_FILE = 'src/services/WorkshopAssignmentService.js';
const PRESENTER_FILE = 'src/depotWorkshop/depotWorkshopAssignmentIntentResponsePresenter.js';
const ADMIN_PREVIEW_API_CLIENT_FILE = 'admin/src/api/depotWorkshop.ts';

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

test('Task2422 Task2423 and Task2424 portfolio artifacts exist', () => {
  for (const relativePath of [
    TASK2422_DOC,
    TASK2423_DOC,
    TASK2424_DOC,
    ROUTE_FILE,
    SERVICE_FILE,
    PRESENTER_FILE,
    'admin/src/App.tsx',
    'admin/src/config/menu.ts',
    'admin/src/lib/apiClient.ts',
    ADMIN_PREVIEW_API_CLIENT_FILE,
  ]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }

  assert.equal(fs.existsSync(projectPath('admin')), true, 'admin should exist');
  assert.equal(fs.existsSync(projectPath('admin/src')), true, 'admin/src should exist');
});

test('current admin source has accepted read-only Depot Workshop API client only', () => {
  const adminSourceFiles = listFiles('admin/src');
  const adminSourceWithoutAcceptedClient = readAll(
    adminSourceFiles.filter((relativePath) => relativePath !== ADMIN_PREVIEW_API_CLIENT_FILE),
  );
  const apiClient = read(ADMIN_PREVIEW_API_CLIENT_FILE);

  assert.equal(
    adminSourceFiles.includes(ADMIN_PREVIEW_API_CLIENT_FILE),
    true,
    'Task2426 accepted admin preview API client should exist',
  );

  assertIncludesAll(apiClient, [
    'previewDepotWorkshopAssignmentIntent',
    'depotIntakePathSegment(depotIntakeId)',
    'previewPayloadFrom(payload)',
    'POST',
    '/api/v1/depot/repairs/${depotIntakePath}/assignment-intent',
    'writeRequired?: false',
    'written?: false',
  ], 'Task2426 accepted read-only API client');

  assertDoesNotMatchAny(adminSourceFiles.filter((relativePath) => relativePath !== ADMIN_PREVIEW_API_CLIENT_FILE).join('\n'), [
    /DepotWorkshopAssignmentIntentPreviewPage/,
    /DepotWorkshopAssignmentIntentPreviewPanel/,
    /depot-workshop/i,
    /depotWorkshop/i,
  ], 'Task2424 admin implementation files');

  assertDoesNotMatchAny(adminSourceWithoutAcceptedClient, [
    /DepotWorkshopAssignmentIntentPreviewPage/,
    /DepotWorkshopAssignmentIntentPreviewPanel/,
    /previewDepotWorkshopAssignmentIntent/,
    /\/depot-workshop\/assignment-intent-preview/,
    /\/api\/v1\/depot\/repairs\/[^`'"]*assignment-intent/i,
    /writePreparedAssignmentIntent/,
    /depotWorkshop/i,
  ], 'Task2424 admin implementation source');

  assertDoesNotMatchAny(apiClient, [
    /writePreparedAssignmentIntent/,
    /writeDepotWorkshop/i,
    /enabledWriteAction/i,
    /formal Field Service Report/i,
    /finalAppointmentId/i,
  ], 'Task2426 accepted API client forbidden write/report source');
});

test('accepted design-only UI names route API function and backend candidate remain documented', () => {
  const task2423 = read(TASK2423_DOC);
  const task2424 = read(TASK2424_DOC);
  const combined = `${task2423}\n${task2424}`;

  assertIncludesAll(combined, [
    'DepotWorkshopAssignmentIntentPreviewPage',
    'DepotWorkshopAssignmentIntentPreviewPanel',
    '/depot-workshop/assignment-intent-preview',
    'previewDepotWorkshopAssignmentIntent(depotIntakeId, payload)',
    'POST /api/v1/depot/repairs/:depotIntakeId/assignment-intent',
    'read-only preview only',
  ], 'Task2424 design-only UI boundary');
});

test('route write scope remains blocked and writePreparedAssignmentIntent remains not route-wired', () => {
  const route = read(ROUTE_FILE);
  const service = read(SERVICE_FILE);

  assertIncludesAll(route, [
    "const DEPOT_REPAIR_ROUTE_PATH = '/api/v1/depot/repairs/:depotIntakeId/assignment-intent'",
    "const DEPOT_REPAIR_ROUTE_PERMISSION = 'depot.repair.prepare'",
    'typeof service.prepareAssignmentIntent',
    'return service.prepareAssignmentIntent.bind(service)',
    'writeRequested(req)',
    "failure('depot_repair_route_write_scope_not_approved', req)",
  ], 'Task2424 route source');

  assertIncludesAll(service, [
    'async prepareAssignmentIntent(input = {})',
    'written: false',
    'writeRequired: false',
    'async writePreparedAssignmentIntent(input = {})',
  ], 'Task2424 service source');

  assert.equal(route.includes('writePreparedAssignmentIntent'), false, 'route should not wire writePreparedAssignmentIntent');
});

test('presenter admin-safe response and allowed UI fields remain documented', () => {
  const presenter = read(PRESENTER_FILE);
  const docs = `${read(TASK2423_DOC)}\n${read(TASK2424_DOC)}`;

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
  ], 'Task2424 presenter boundary');

  assertIncludesAll(docs, [
    '`data.depotRepair`',
    '`repairOrderDraftSummary`',
    '`repairOrderTransitionPlanSummary`',
    '`repairOrderAuditIntentSummary`',
    '`repairOrderCustomerProjectionPreview`',
    '`meta.written: false`',
    '`writeRequired: false`',
    'safe `requestId`',
  ], 'Task2424 allowed UI fields');
});

test('forbidden UI behaviors remain documented and portfolio doc lists non-authorized next candidates', () => {
  const docs = `${read(TASK2423_DOC)}\n${read(TASK2424_DOC)}`;

  assertIncludesAll(docs, [
    'no full helper-derived service objects',
    'no enabled write action button',
    'no provider sending',
    'no DB/admin migration controls',
    'no billing/payment/invoice controls',
    'no formal FSR / Completion Report creation, approval, publication, or finalization',
    'no `finalAppointmentId` display or mutation',
    'no raw customer private/contact/address/signature/photo fields',
    'no SQL/stack/token/password/secret/debug/provider/billing/AI/RAG payload display',
    'admin API client design packet',
    'admin UI read-only preview implementation packet',
    'admin menu/route design packet',
    'branch closure',
  ], 'Task2424 forbidden UI behavior and next candidates');
});

test('Task2424 introduces no package runtime DB provider billing AI report or final appointment authorization', () => {
  const combined = [
    read(TASK2424_DOC),
    read('tests/depotWorkshop/depotWorkshopAdminUiReadOnlyPreviewDesignPortfolio.static.test.js'),
  ].join('\n');

  assertIncludesAll(combined, [
    'This is docs/static-only.',
    'does not implement UI',
    'add frontend source behavior',
    'add API client code',
    'add packages',
    'run DB commands',
    'execute SQL',
    'connect to a real DB',
    'perform migration dry-run/apply',
    '`DATABASE_URL`, Zeabur, env, or secrets',
    'send providers',
    'change billing behavior',
    'formal Field Service Report / Completion Report behavior',
    '`finalAppointmentId`',
    'The 7 held historical docs remain outside Task2424 scope',
  ], 'Task2424 non-authorization');

  assertDoesNotMatchAny(combined, [
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
  ], 'Task2424 executable authorization');
});
