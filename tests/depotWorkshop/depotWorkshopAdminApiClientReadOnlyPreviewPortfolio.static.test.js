'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const CLIENT_FILE = 'admin/src/api/depotWorkshop.ts';
const TASK2422_DOC = 'docs/task-2422-depot-workshop-admin-ui-boundary-inventory-no-runtime-change-no-db-no-provider-no-package.md';
const TASK2423_DOC = 'docs/task-2423-depot-workshop-admin-ui-read-only-preview-design-packet-no-runtime-change-no-db-no-provider-no-package.md';
const TASK2424_DOC = 'docs/task-2424-depot-workshop-admin-ui-read-only-preview-design-portfolio-guard-no-runtime-change-no-db-no-provider-no-package.md';
const TASK2425_DOC = 'docs/task-2425-depot-workshop-admin-ui-read-only-preview-design-branch-closure-no-runtime-change-no-db-no-provider-no-package.md';
const TASK2426_DOC = 'docs/task-2426-depot-workshop-admin-api-client-read-only-preview-function-no-ui-page-no-route-write-no-db-no-provider-no-package.md';
const TASK2427_DOC = 'docs/task-2427-depot-workshop-admin-api-client-stale-design-guard-alignment-no-runtime-change-no-ui-no-db-no-provider-no-package.md';
const TASK2428_DOC = 'docs/task-2428-depot-workshop-admin-api-client-read-only-preview-portfolio-guard-no-runtime-change-no-ui-no-db-no-provider-no-package.md';
const TASK2426_GUARD = 'tests/depotWorkshop/depotWorkshopAdminApiClientReadOnlyPreviewBoundary.static.test.js';
const TASK2427_GUARDS = [
  'tests/depotWorkshop/depotWorkshopAdminUiReadOnlyPreviewDesignPortfolio.static.test.js',
  'tests/depotWorkshop/depotWorkshopAdminUiReadOnlyPreviewDesign.static.test.js',
  'tests/depotWorkshop/depotWorkshopAdminUiBoundaryInventory.static.test.js',
];
const ROUTE_FILE = 'src/routes/depotRepair.routes.js';
const SERVICE_FILE = 'src/services/WorkshopAssignmentService.js';
const ADMIN_APP_FILE = 'admin/src/App.tsx';
const ADMIN_MENU_FILE = 'admin/src/config/menu.ts';
const ADMIN_PACKAGE_FILE = 'admin/package.json';
const ROOT_PACKAGE_FILE = 'package.json';

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

test('Task2426 through Task2428 API client portfolio artifacts exist', () => {
  for (const relativePath of [
    CLIENT_FILE,
    TASK2422_DOC,
    TASK2423_DOC,
    TASK2424_DOC,
    TASK2425_DOC,
    TASK2426_DOC,
    TASK2427_DOC,
    TASK2428_DOC,
    TASK2426_GUARD,
    ...TASK2427_GUARDS,
    ROUTE_FILE,
    SERVICE_FILE,
    ADMIN_APP_FILE,
    ADMIN_MENU_FILE,
    ADMIN_PACKAGE_FILE,
    ROOT_PACKAGE_FILE,
  ]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }
});

test('accepted admin API client stays read-only preview and targets the prepare-only route', () => {
  const client = read(CLIENT_FILE);

  assertIncludesAll(client, [
    "import { apiRequest } from '../lib/apiClient'",
    'export function previewDepotWorkshopAssignmentIntent(',
    'depotIntakePathSegment(depotIntakeId)',
    'encodeURIComponent(normalized)',
    'previewPayloadFrom(payload)',
    'Depot Workshop preview payload must be a plain object.',
    'return { ...payload }',
    '/api/v1/depot/repairs/${depotIntakePath}/assignment-intent',
    "method: 'POST'",
    'body: previewPayloadFrom(payload)',
  ], 'Task2428 API client preview boundary');

  assert.equal(
    (client.match(/apiRequest</g) || []).length,
    1,
    'Task2428 client should expose one bounded apiRequest call',
  );
});

test('accepted admin API client response contract remains admin-safe and preview-only', () => {
  const clientAndDocs = [
    read(CLIENT_FILE),
    read(TASK2426_DOC),
    read(TASK2427_DOC),
    read(TASK2428_DOC),
  ].join('\n');

  assertIncludesAll(clientAndDocs, [
    'data?: {',
    'depotRepair?: {',
    'repairOrderDraftSummary',
    'repairOrderTransitionPlanSummary',
    'repairOrderAuditIntentSummary',
    'repairOrderCustomerProjectionPreview',
    'writeRequired?: false',
    'written?: false',
    'requestId?: string | null',
    '`data.depotRepair`',
    '`meta.written: false`',
    '`writeRequired: false`',
    'safe `requestId`',
  ], 'Task2428 API client response contract');
});

test('accepted API client has no write function naming or service write reference', () => {
  const client = read(CLIENT_FILE);

  assert.equal(client.includes('writePreparedAssignmentIntent'), false, 'client should not reference writePreparedAssignmentIntent');

  assertDoesNotMatchAny(client, [
    /export function .*Write/i,
    /writeDepotWorkshop/i,
    /commitDepotWorkshop/i,
    /persistDepotWorkshop/i,
    /approveDepotWorkshop/i,
    /routeWriteScope/i,
    /writeRequested\s*:/,
    /writeApproved\s*:/,
    /enabledWriteAction/i,
    /finalAppointmentId/i,
  ], 'Task2428 forbidden API client write naming');
});

test('admin UI page menu route package and extra Depot Workshop clients remain absent', () => {
  const adminSourceFiles = listFiles('admin/src');
  const nonClientAdminSource = readAll(adminSourceFiles.filter((relativePath) => relativePath !== CLIENT_FILE));
  const appMenuAndPackages = [
    read(ADMIN_APP_FILE),
    read(ADMIN_MENU_FILE),
    read(ADMIN_PACKAGE_FILE),
    read(ROOT_PACKAGE_FILE),
  ].join('\n');

  assert.equal(
    adminSourceFiles.filter((relativePath) => /depotWorkshop\.ts$/.test(relativePath)).length,
    1,
    'Task2428 should allow only the accepted depotWorkshop API client file',
  );

  assertDoesNotMatchAny(nonClientAdminSource, [
    /DepotWorkshopAssignmentIntentPreviewPage/,
    /DepotWorkshopAssignmentIntentPreviewPanel/,
    /\/depot-workshop\/assignment-intent-preview/,
    /previewDepotWorkshopAssignmentIntent/,
    /writePreparedAssignmentIntent/,
    /enabledWriteAction/i,
  ], 'Task2428 admin UI/menu source');

  assertDoesNotMatchAny(appMenuAndPackages, [
    /DepotWorkshopAssignmentIntentPreviewPage/,
    /DepotWorkshopAssignmentIntentPreviewPanel/,
    /\/depot-workshop\/assignment-intent-preview/,
    /depotWorkshop/i,
    /assignment-intent-preview/i,
  ], 'Task2428 app menu package boundary');
});

test('backend route write scope remains blocked and write service remains unwired', () => {
  const route = read(ROUTE_FILE);
  const service = read(SERVICE_FILE);

  assertIncludesAll(route, [
    "const DEPOT_REPAIR_ROUTE_PATH = '/api/v1/depot/repairs/:depotIntakeId/assignment-intent'",
    "const DEPOT_REPAIR_ROUTE_PERMISSION = 'depot.repair.prepare'",
    'typeof service.prepareAssignmentIntent',
    'return service.prepareAssignmentIntent.bind(service)',
    'writeRequested(req)',
    "failure('depot_repair_route_write_scope_not_approved', req)",
  ], 'Task2428 route blocker boundary');

  assertIncludesAll(service, [
    'async prepareAssignmentIntent(input = {})',
    'written: false',
    'writeRequired: false',
    'async writePreparedAssignmentIntent(input = {})',
  ], 'Task2428 service boundary');

  assert.equal(route.includes('writePreparedAssignmentIntent'), false, 'route should not wire writePreparedAssignmentIntent');
});

test('portfolio docs record non-implementation status blockers and non-authorized candidates', () => {
  const docs = [
    read(TASK2422_DOC),
    read(TASK2423_DOC),
    read(TASK2424_DOC),
    read(TASK2425_DOC),
    read(TASK2426_DOC),
    read(TASK2427_DOC),
    read(TASK2428_DOC),
  ].join('\n');

  assertIncludesAll(docs, [
    'read-only preview',
    '`admin/src/api/depotWorkshop.ts`',
    '`previewDepotWorkshopAssignmentIntent(depotIntakeId, payload)`',
    'route write scope remains blocked by `depot_repair_route_write_scope_not_approved`',
    '`writePreparedAssignmentIntent` remains not route-wired',
    'admin UI read-only preview page implementation packet',
    'admin menu/route implementation packet',
    'admin API client branch closure',
    'route write-scope implementation packet only after DB/repository readiness',
  ], 'Task2428 portfolio docs');
});

test('Task2428 docs and guard introduce no executable authorization or credentials', () => {
  const combined = [
    read(TASK2428_DOC),
    read('tests/depotWorkshop/depotWorkshopAdminApiClientReadOnlyPreviewPortfolio.static.test.js'),
  ].join('\n');

  assertIncludesAll(combined, [
    'Task2428 does not authorize or implement:',
    'admin UI implementation',
    'menu or route implementation',
    'additional API client implementation',
    'write API client function',
    'package or package-lock changes',
    'backend runtime/source behavior changes',
    'DB commands',
    'SQL execution',
    'real DB connection',
    'migration changes/dry-run/apply',
    '`DATABASE_URL`, Zeabur, env, or secrets inspection',
    'provider sending',
    'billing behavior',
    'AI/RAG runtime behavior',
    'formal FSR / Completion Report behavior',
    '`finalAppointmentId` display or mutation',
    'The 7 held historical docs remain outside Task2428 scope',
  ], 'Task2428 non-authorization');

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
  ], 'Task2428 executable authorization');
});
