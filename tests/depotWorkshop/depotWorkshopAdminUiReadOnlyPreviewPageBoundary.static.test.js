'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const PAGE_FILE = 'admin/src/pages/DepotWorkshopAssignmentIntentPreviewPage.tsx';
const CLIENT_FILE = 'admin/src/api/depotWorkshop.ts';
const TASK2430_DOC = 'docs/task-2430-depot-workshop-admin-ui-read-only-preview-page-component-no-menu-route-no-write-no-db-no-provider-no-package.md';
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

test('Task2430 page doc client route service and admin boundary artifacts exist', () => {
  for (const relativePath of [
    PAGE_FILE,
    CLIENT_FILE,
    TASK2430_DOC,
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

test('page component uses only accepted read-only API client and safe preview fields', () => {
  const page = read(PAGE_FILE);

  assertIncludesAll(page, [
    'export function DepotWorkshopAssignmentIntentPreviewPage()',
    'DepotWorkshopAssignmentIntentPreviewResponse',
    'previewDepotWorkshopAssignmentIntent',
    'previewDepotWorkshopAssignmentIntent(depotIntakeId, buildPayload(form))',
    'data?.depotRepair',
    'repairOrderDraftSummary',
    'repairOrderTransitionPlanSummary',
    'repairOrderAuditIntentSummary',
    'repairOrderCustomerProjectionPreview',
    'meta?.written',
    'writeRequired',
    'requestId',
    'safeEntries(summary)',
    'fieldIsSafe',
    'formatPreviewValue',
  ], 'Task2430 page read-only preview contract');

  assert.equal(
    (page.match(/previewDepotWorkshopAssignmentIntent/g) || []).length >= 2,
    true,
    'Task2430 page should import and call previewDepotWorkshopAssignmentIntent',
  );
});

test('page component displays blockers and includes no enabled write action surface', () => {
  const page = read(PAGE_FILE);

  assertIncludesAll(page, [
    'Route write scope is blocked by depot_repair_route_write_scope_not_approved.',
    'DB dry-run has not been completed.',
    'Write action is not available from this preview.',
    'Disabled for this read-only preview.',
  ], 'Task2430 page blocker display');

  assertDoesNotMatchAny(page, [
    /writePreparedAssignmentIntent/,
    /writeDepotWorkshop/i,
    /enabledWriteAction/i,
    /type="submit"[^>]*>[^<]*(?:write|commit|persist|approve)/i,
    /providerPayload/i,
    /billingPayload/i,
    /finalAppointmentId/,
    /JSON\.stringify/,
  ], 'Task2430 page forbidden UI behavior');
});

test('page is not mounted in admin router or menu', () => {
  const app = read(ADMIN_APP_FILE);
  const menu = read(ADMIN_MENU_FILE);

  assertDoesNotMatchAny(`${app}\n${menu}`, [
    /DepotWorkshopAssignmentIntentPreviewPage/,
    /\/depot-workshop\/assignment-intent-preview/,
    /depotWorkshop/i,
    /assignment-intent-preview/i,
  ], 'Task2430 admin app menu route boundary');
});

test('accepted API client remains preview-only and no package dependency markers were added', () => {
  const client = read(CLIENT_FILE);
  const packages = `${read(ADMIN_PACKAGE_FILE)}\n${read(ROOT_PACKAGE_FILE)}`;

  assertIncludesAll(client, [
    "import { apiRequest } from '../lib/apiClient'",
    'export function previewDepotWorkshopAssignmentIntent(',
    'depotIntakePathSegment(depotIntakeId)',
    'encodeURIComponent(normalized)',
    'previewPayloadFrom(payload)',
    'return { ...payload }',
    '/api/v1/depot/repairs/${depotIntakePath}/assignment-intent',
    "method: 'POST'",
  ], 'Task2430 accepted API client');

  assertDoesNotMatchAny(client, [
    /writePreparedAssignmentIntent/,
    /export function .*Write/i,
    /writeDepotWorkshop/i,
    /commitDepotWorkshop/i,
    /persistDepotWorkshop/i,
  ], 'Task2430 forbidden API client behavior');

  assertDoesNotMatchAny(packages, [
    /depotWorkshop/i,
    /assignment-intent-preview/i,
  ], 'Task2430 package boundary');
});

test('backend route write scope remains blocked and service write method remains unwired', () => {
  const route = read(ROUTE_FILE);
  const service = read(SERVICE_FILE);

  assertIncludesAll(route, [
    "const DEPOT_REPAIR_ROUTE_PATH = '/api/v1/depot/repairs/:depotIntakeId/assignment-intent'",
    "const DEPOT_REPAIR_ROUTE_PERMISSION = 'depot.repair.prepare'",
    'typeof service.prepareAssignmentIntent',
    'return service.prepareAssignmentIntent.bind(service)',
    'writeRequested(req)',
    "failure('depot_repair_route_write_scope_not_approved', req)",
  ], 'Task2430 route boundary');

  assertIncludesAll(service, [
    'async prepareAssignmentIntent(input = {})',
    'written: false',
    'writeRequired: false',
    'async writePreparedAssignmentIntent(input = {})',
  ], 'Task2430 service boundary');

  assert.equal(route.includes('writePreparedAssignmentIntent'), false, 'route should not wire writePreparedAssignmentIntent');
});

test('Task2430 docs and guard introduce no forbidden authorization or credentials', () => {
  const combined = [
    read(TASK2430_DOC),
    read('tests/depotWorkshop/depotWorkshopAdminUiReadOnlyPreviewPageBoundary.static.test.js'),
  ].join('\n');

  assertIncludesAll(combined, [
    'Task2430 does not implement or authorize:',
    'admin menu/router wiring',
    'write action button',
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
    'The 7 held historical docs remain outside Task2430 scope',
  ], 'Task2430 non-authorization');

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
  ], 'Task2430 executable authorization');
});
