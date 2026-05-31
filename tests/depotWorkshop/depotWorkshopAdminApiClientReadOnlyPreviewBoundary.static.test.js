'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const CLIENT_FILE = 'admin/src/api/depotWorkshop.ts';
const TASK2426_DOC = 'docs/task-2426-depot-workshop-admin-api-client-read-only-preview-function-no-ui-page-no-route-write-no-db-no-provider-no-package.md';
const ROUTE_FILE = 'src/routes/depotRepair.routes.js';
const SERVICE_FILE = 'src/services/WorkshopAssignmentService.js';
const PRESENTER_FILE = 'src/depotWorkshop/depotWorkshopAssignmentIntentResponsePresenter.js';
const ADMIN_PAGE_FILE = 'admin/src/pages/DepotWorkshopAssignmentIntentPreviewPage.tsx';
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

test('Task2426 API client doc source route service and presenter artifacts exist', () => {
  for (const relativePath of [
    CLIENT_FILE,
    TASK2426_DOC,
    ROUTE_FILE,
    SERVICE_FILE,
    PRESENTER_FILE,
    ADMIN_PAGE_FILE,
    ADMIN_APP_FILE,
    ADMIN_MENU_FILE,
    ADMIN_PACKAGE_FILE,
    ROOT_PACKAGE_FILE,
  ]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }
});

test('API client exports read-only preview function and targets exact assignment-intent route', () => {
  const client = read(CLIENT_FILE);

  assertIncludesAll(client, [
    "import { apiRequest } from '../lib/apiClient'",
    'export function previewDepotWorkshopAssignmentIntent(',
    'depotIntakePathSegment(depotIntakeId)',
    'encodeURIComponent(normalized)',
    'previewPayloadFrom(payload)',
    'Depot Workshop preview payload must be a plain object.',
    'depotIntakeId is required for Depot Workshop preview.',
    '/api/v1/depot/repairs/${depotIntakePath}/assignment-intent',
    "method: 'POST'",
    'DepotWorkshopAssignmentIntentPreviewResponse',
  ], 'Task2426 API client');
});

test('API client contract stays aligned to admin-safe presenter fields', () => {
  const client = read(CLIENT_FILE);
  const doc = read(TASK2426_DOC);

  assertIncludesAll(`${client}\n${doc}`, [
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
  ], 'Task2426 API client response contract');
});

test('API client introduces no write action naming and does not reference service write method', () => {
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
    /persist\s*:/,
    /commit\s*:/,
  ], 'Task2426 forbidden write naming');
});

test('accepted UI page remains unmounted and package dependencies are not added', () => {
  const page = read(ADMIN_PAGE_FILE);
  const app = read(ADMIN_APP_FILE);
  const menu = read(ADMIN_MENU_FILE);
  const adminPackage = read(ADMIN_PACKAGE_FILE);
  const rootPackage = read(ROOT_PACKAGE_FILE);

  assertIncludesAll(page, [
    'DepotWorkshopAssignmentIntentPreviewPage',
    'previewDepotWorkshopAssignmentIntent',
    'repairOrderDraftSummary',
    'repairOrderTransitionPlanSummary',
    'repairOrderAuditIntentSummary',
    'repairOrderCustomerProjectionPreview',
    'Route write scope is blocked by depot_repair_route_write_scope_not_approved.',
    'DB dry-run has not been completed.',
    'Write action is not available from this preview.',
  ], 'Task2430 accepted unmounted UI page');

  assertDoesNotMatchAny(page, [
    /writePreparedAssignmentIntent/,
    /enabledWriteAction/i,
    /finalAppointmentId/,
    /JSON\.stringify/,
  ], 'Task2430 accepted UI page forbidden behavior');

  assertDoesNotMatchAny(`${app}\n${menu}`, [
    /DepotWorkshopAssignmentIntentPreviewPage/,
    /DepotWorkshopAssignmentIntentPreviewPanel/,
    /\/depot-workshop\/assignment-intent-preview/,
    /depotWorkshop/i,
  ], 'Task2430 admin UI menu route');

  assertDoesNotMatchAny(`${adminPackage}\n${rootPackage}`, [
    /depotWorkshop/i,
    /assignment-intent-preview/i,
  ], 'Task2426 package dependencies');
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
  ], 'Task2426 backend route');

  assertIncludesAll(service, [
    'async prepareAssignmentIntent(input = {})',
    'written: false',
    'writeRequired: false',
    'async writePreparedAssignmentIntent(input = {})',
  ], 'Task2426 service boundary');

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
  ], 'Task2426 presenter boundary');
});

test('Task2426 docs and guard introduce no forbidden authorization or credentials', () => {
  const combined = [
    read(TASK2426_DOC),
    read('tests/depotWorkshop/depotWorkshopAdminApiClientReadOnlyPreviewBoundary.static.test.js'),
  ].join('\n');

  assertIncludesAll(combined, [
    'This task does not add UI pages/components',
    'No backend runtime/source behavior changed',
    'No enabled write action.',
    'No mutation API client.',
    'No provider sending.',
    'No DB/admin migration control.',
    'No billing/payment/invoice control.',
    'No formal FSR / Completion Report creation, approval, publication, or finalization.',
    'No finalAppointmentId display or mutation.',
    'No raw customer private/contact/address/signature/photo fields.',
    'No SQL/stack/token/password/secret/debug/provider/billing/AI/RAG payload handling.',
    'No package dependency expansion.',
    'The 7 held historical docs remain outside Task2426 scope',
  ], 'Task2426 non-authorization');

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
  ], 'Task2426 executable authorization');
});
