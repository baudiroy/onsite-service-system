'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const TASK2378_DOC = 'docs/task-2378-depot-workshop-repair-order-pure-helper-portfolio-static-guard-no-runtime-change-no-db-no-provider-no-package.md';

const HELPERS = Object.freeze([
  {
    name: 'Task2373 state model helper',
    source: 'src/depotWorkshop/depotWorkshopRepairOrderStateModel.js',
    unitTest: 'tests/depotWorkshop/depotWorkshopRepairOrderStateModel.unit.test.js',
    staticTest: 'tests/depotWorkshop/depotWorkshopRepairOrderStateModelBoundary.static.test.js',
    doc: 'docs/task-2373-depot-workshop-repair-order-state-model-pure-constants-helper-no-route-no-db-no-provider-no-package.md',
    allowedImports: Object.freeze([]),
    markers: Object.freeze([
      'DEPOT_WORKSHOP_REPAIR_ORDER_STATUSES',
      'isDepotWorkshopRepairOrderStatus',
      'sanitizeDepotWorkshopRepairOrderPublicProjection',
    ]),
  },
  {
    name: 'Task2374 repair order contract helper',
    source: 'src/depotWorkshop/depotWorkshopRepairOrderContract.js',
    unitTest: 'tests/depotWorkshop/depotWorkshopRepairOrderContract.unit.test.js',
    staticTest: 'tests/depotWorkshop/depotWorkshopRepairOrderContractBoundary.static.test.js',
    doc: 'docs/task-2374-depot-workshop-repair-order-contract-pure-helper-no-route-no-db-no-provider-no-package.md',
    allowedImports: Object.freeze(['./depotWorkshopRepairOrderStateModel']),
    markers: Object.freeze([
      'buildDepotWorkshopRepairOrderDraft',
      'validateDepotWorkshopRepairOrderDraft',
      'sanitizeDepotWorkshopRepairOrderInternalDraft',
    ]),
  },
  {
    name: 'Task2375 transition policy helper',
    source: 'src/depotWorkshop/depotWorkshopRepairOrderTransitionPolicy.js',
    unitTest: 'tests/depotWorkshop/depotWorkshopRepairOrderTransitionPolicy.unit.test.js',
    staticTest: 'tests/depotWorkshop/depotWorkshopRepairOrderTransitionPolicyBoundary.static.test.js',
    doc: 'docs/task-2375-depot-workshop-repair-order-transition-policy-pure-helper-no-route-no-db-no-provider-no-package.md',
    allowedImports: Object.freeze([
      './depotWorkshopRepairOrderContract',
      './depotWorkshopRepairOrderStateModel',
    ]),
    markers: Object.freeze([
      'DEPOT_WORKSHOP_REPAIR_ORDER_ALLOWED_TRANSITIONS',
      'canTransitionDepotWorkshopRepairOrderStatus',
      'planDepotWorkshopRepairOrderStatusTransition',
    ]),
  },
  {
    name: 'Task2376 audit event helper',
    source: 'src/depotWorkshop/depotWorkshopRepairOrderAuditEvent.js',
    unitTest: 'tests/depotWorkshop/depotWorkshopRepairOrderAuditEvent.unit.test.js',
    staticTest: 'tests/depotWorkshop/depotWorkshopRepairOrderAuditEventBoundary.static.test.js',
    doc: 'docs/task-2376-depot-workshop-repair-order-audit-event-pure-helper-no-route-no-db-no-provider-no-package.md',
    allowedImports: Object.freeze([]),
    markers: Object.freeze([
      'DEPOT_WORKSHOP_REPAIR_ORDER_AUDIT_EVENT_TYPES',
      'buildDepotWorkshopRepairOrderAuditEvent',
      'sanitizeDepotWorkshopRepairOrderAuditMetadata',
      'internalOnly: true',
      'customerVisible: false',
    ]),
  },
  {
    name: 'Task2377 customer-visible projection helper',
    source: 'src/depotWorkshop/depotWorkshopRepairOrderCustomerProjection.js',
    unitTest: 'tests/depotWorkshop/depotWorkshopRepairOrderCustomerProjection.unit.test.js',
    staticTest: 'tests/depotWorkshop/depotWorkshopRepairOrderCustomerProjectionBoundary.static.test.js',
    doc: 'docs/task-2377-depot-workshop-repair-order-customer-visible-projection-pure-helper-no-route-no-db-no-provider-no-package.md',
    allowedImports: Object.freeze([]),
    markers: Object.freeze([
      'DEPOT_WORKSHOP_REPAIR_ORDER_CUSTOMER_PROJECTION_FIELDS',
      'buildDepotWorkshopRepairOrderCustomerProjection',
      'sanitizeDepotWorkshopRepairOrderCustomerProjection',
    ]),
  },
]);

const RUNTIME_DIRS = Object.freeze([
  'src/routes',
  'src/controllers',
  'src/repositories',
  'src/services',
  'src/guards',
]);

function projectPath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(projectPath(relativePath), 'utf8');
}

function requireSpecifiers(source) {
  return Array.from(source.matchAll(/require\(\s*['"]([^'"]+)['"]\s*\)/g), (match) => match[1]);
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

function collectJsFiles(relativeDir) {
  const absoluteDir = projectPath(relativeDir);

  if (!fs.existsSync(absoluteDir)) {
    return [];
  }

  return fs.readdirSync(absoluteDir, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = path.join(relativeDir, entry.name);

    if (entry.isDirectory()) {
      return collectJsFiles(relativePath);
    }

    return entry.isFile() && entry.name.endsWith('.js') ? [relativePath] : [];
  });
}

test('Task2378 portfolio guard sees all accepted pure helper artifacts', () => {
  assert.equal(fs.existsSync(projectPath(TASK2378_DOC)), true, `${TASK2378_DOC} should exist`);

  for (const helper of HELPERS) {
    for (const relativePath of [helper.source, helper.unitTest, helper.staticTest, helper.doc]) {
      assert.equal(fs.existsSync(projectPath(relativePath)), true, `${helper.name} missing ${relativePath}`);
    }

    assertIncludesAll(read(helper.source), helper.markers, helper.name);
  }
});

test('pure helpers import only approved pure helper modules', () => {
  for (const helper of HELPERS) {
    const source = read(helper.source);

    assert.deepEqual(requireSpecifiers(source).sort(), [...helper.allowedImports].sort(), `${helper.name} imports`);
    assertDoesNotMatchAny(source, [
      /import\s+/,
      /process\.env/,
      /DATABASE_URL\s*=/,
      /\bZeabur\b/,
      /src\/routes|routes\/depotRepair/i,
      /src\/repositories|DepotIntakeSqlRepositoryAdapter/,
      /src\/app|src\/server|express/i,
      /\bapp\.listen\s*\(|\bserver\.listen\s*\(|\blisten\s*\(/,
      /\bfetch\s*\(|axios|got|superagent/i,
      /send(Line|Sms|SMS|Email|Webhook)/,
      /\bINSERT\s+INTO\b|\bUPDATE\s+\w+\b|\bDELETE\s+FROM\b|\bALTER\s+TABLE\b|\bCREATE\s+TABLE\b/i,
      /\bnew\s+Pool\b|require\(['"]pg['"]\)|require\(['"]postgres['"]\)/,
      /\bpsql\b|db:migrate|migrations\//i,
    ], helper.name);
  }
});

test('pure helper portfolio is not wired into runtime modules', () => {
  const runtimeFiles = RUNTIME_DIRS.flatMap((relativeDir) => collectJsFiles(relativeDir));
  const forbiddenRuntimeMarkers = Object.freeze([
    'depotWorkshopRepairOrderStateModel',
    'depotWorkshopRepairOrderContract',
    'depotWorkshopRepairOrderTransitionPolicy',
    'depotWorkshopRepairOrderAuditEvent',
    'depotWorkshopRepairOrderCustomerProjection',
    'buildDepotWorkshopRepairOrderDraft',
    'planDepotWorkshopRepairOrderStatusTransition',
    'buildDepotWorkshopRepairOrderAuditEvent',
    'buildDepotWorkshopRepairOrderCustomerProjection',
  ]);

  for (const runtimeFile of runtimeFiles) {
    const source = read(runtimeFile);

    for (const marker of forbiddenRuntimeMarkers) {
      assert.equal(source.includes(marker), false, `${runtimeFile} should not include ${marker}`);
    }
  }
});

test('portfolio docs preserve no route DB provider package and runtime authorization boundaries', () => {
  const portfolioDoc = read(TASK2378_DOC);
  const taskDocs = HELPERS.map((helper) => read(helper.doc)).join('\n');
  const combinedDocs = `${portfolioDoc}\n${taskDocs}`;

  assertIncludesAll(portfolioDoc, [
    'Task2378 Depot Workshop Repair Order Pure Helper Portfolio Static Guard',
    'state model helper',
    'repair order contract helper',
    'transition policy helper',
    'audit event helper',
    'customer-visible projection helper',
    'route wiring decision gate',
    'workshop assignment service integration decision gate',
    'repository/migration authorization packet',
    'admin UI design packet',
    'branch closure',
    'non-authorized candidates only',
  ], 'Task2378 doc');

  assertIncludesAll(combinedDocs, [
    'No route wiring',
    'No DB commands, SQL execution, real DB connection, migration creation, migration dry-run, or migration apply.',
    'No provider sending.',
    'No package or package-lock changes.',
    'No formal Field Service Report / Completion Report creation, approval, publication, or finalization behavior.',
    'No `finalAppointmentId` mutation path.',
  ], 'portfolio docs');
});

test('portfolio helpers preserve customer projection audit and internal operational boundaries', () => {
  const auditHelper = read('src/depotWorkshop/depotWorkshopRepairOrderAuditEvent.js');
  const customerProjection = read('src/depotWorkshop/depotWorkshopRepairOrderCustomerProjection.js');
  const stateModel = read('src/depotWorkshop/depotWorkshopRepairOrderStateModel.js');
  const contract = read('src/depotWorkshop/depotWorkshopRepairOrderContract.js');
  const transitionPolicy = read('src/depotWorkshop/depotWorkshopRepairOrderTransitionPolicy.js');

  assertIncludesAll(customerProjection, [
    'DEPOT_WORKSHOP_REPAIR_ORDER_CUSTOMER_PROJECTION_FIELDS',
    'repairOrderReference',
    'caseReference',
    'publicNotes',
  ], 'customer-visible projection allowlist');

  assertIncludesAll(auditHelper, [
    'internalOnly: true',
    'customerVisible: false',
    'sanitizeDepotWorkshopRepairOrderAuditMetadata',
  ], 'internal-only audit helper');

  assertIncludesAll(`${stateModel}\n${contract}\n${transitionPolicy}`, [
    'DEPOT_WORKSHOP_REPAIR_ORDER_STATUSES',
    'buildDepotWorkshopRepairOrderDraft',
    'DEPOT_WORKSHOP_REPAIR_ORDER_ALLOWED_TRANSITIONS',
    'depot_workshop_repair_order_transition_not_allowed',
  ], 'state contract transition helpers');
});

test('portfolio does not introduce executable authorization or real credentials', () => {
  const combined = [
    read(TASK2378_DOC),
    read('tests/depotWorkshop/depotWorkshopRepairOrderPureHelperPortfolio.static.test.js'),
  ].join('\n');

  assertDoesNotMatchAny(combined, [
    /postgres(?:ql)?:\/\/[^@\s]+:[^@\s]+@[^/\s]+\/[^\s)]+/i,
    /\b(?:password|passwd|pwd|secret|token|api[_-]?key)\s*[:=]\s*['"]?[A-Za-z0-9._~+/=-]{12,}/i,
    /\bDATABASE_URL\s*=\s*[^'"`\s]+/i,
    /\bcurl\s+/i,
    /\bfet' \+ 'ch\s*\(/,
    /\bsuper' \+ 'test\s*\(/,
    /\bapp\.lis' \+ 'ten\s*\(/,
    /\bserver\.lis' \+ 'ten\s*\(/,
    /\blis' \+ 'ten\s*\(/,
    /\/hea' \+ 'lthz/i,
    /\bps' \+ 'ql\s+/i,
    /\bdb:mig' \+ 'rate\b/i,
  ], 'Task2378 docs/static guard');
});
