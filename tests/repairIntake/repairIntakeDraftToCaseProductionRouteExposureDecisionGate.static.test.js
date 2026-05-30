'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROUTE_SOURCE_PATH = path.resolve(
  __dirname,
  '../../src/routes/repairIntakeDraftToCase.routes.js',
);
const OPEN_REPAIR_INTAKE_SOURCE_DIR = path.resolve(__dirname, '../../src/openRepairIntake');
const OPEN_REPAIR_INTAKE_TEST_DIR = path.resolve(__dirname, '../../tests/openRepairIntake');
const CONTROLLERS_DIR = path.resolve(__dirname, '../../src/controllers');
const TASK2211_DOC_PATH = path.resolve(
  __dirname,
  '../../docs/task-2211-repair-intake-draft-to-case-route-mount-readiness-inventory-no-runtime-change-no-db-no-smoke-no-provider.md',
);

const PUBLIC_OPEN_ROUTE_PATTERNS = [
  '/public',
  '/open',
  '/customer',
  '/intake/open',
  '/repair-intake/open',
  'public.routes',
  'openRepairIntake',
  'customerAccess',
  'customer-access',
];

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function repairIntakeControllerFiles() {
  if (!fs.existsSync(CONTROLLERS_DIR)) {
    return [];
  }

  return fs.readdirSync(CONTROLLERS_DIR)
    .filter((entry) => /repair|intake/i.test(entry));
}

test('Task2212 production route exposure decision gate reads current inventory inputs', () => {
  assert.equal(fs.existsSync(ROUTE_SOURCE_PATH), true, 'missing draft-to-case route file');
  assert.equal(fs.existsSync(TASK2211_DOC_PATH), true, 'missing Task2211 readiness inventory doc');
});

test('open Repair Intake source and test directories remain absent', () => {
  assert.equal(fs.existsSync(OPEN_REPAIR_INTAKE_SOURCE_DIR), false, 'unexpected src/openRepairIntake directory');
  assert.equal(fs.existsSync(OPEN_REPAIR_INTAKE_TEST_DIR), false, 'unexpected tests/openRepairIntake directory');
});

test('no Repair Intake controller exists under src/controllers', () => {
  assert.deepEqual(repairIntakeControllerFiles(), []);
});

test('draft-to-case route remains admin scoped and permission gated', () => {
  const routeSource = readFile(ROUTE_SOURCE_PATH);

  assert.equal(routeSource.includes("REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_BASE_PATH = '/api/v1/admin'"), true);
  assert.equal(
    routeSource.includes(
      "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH = '/api/v1/admin/repair-intake/drafts/:draftId/case/submit'",
    ),
    true,
  );
  assert.equal(routeSource.includes("REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION = 'cases.create'"), true);
  assert.equal(routeSource.includes('requirePermission(REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION)'), true);
  assert.equal(routeSource.includes('registerRepairIntakeDraftToCaseAdminRoutes'), true);
});

test('draft-to-case route file has no public open customer route exposure markers', () => {
  const routeSource = readFile(ROUTE_SOURCE_PATH);

  for (const marker of PUBLIC_OPEN_ROUTE_PATTERNS) {
    assert.equal(routeSource.includes(marker), false, `unexpected public/open route marker ${marker}`);
  }
});

test('Task2211 inventory keeps future route exposure behind explicit PM decision', () => {
  const inventoryDoc = readFile(TASK2211_DOC_PATH);

  for (const marker of [
    'current mounted path remains admin/injected-only',
    'There is no `src/openRepairIntake/`',
    'There is no `tests/openRepairIntake/`',
    'There is no Repair Intake controller under `src/controllers/`',
    'No public/open route expansion has been performed',
    'PM must explicitly decide',
    'separate explicit authorization',
  ]) {
    assert.equal(inventoryDoc.includes(marker), true, `Task2211 inventory missing marker ${marker}`);
  }
});
