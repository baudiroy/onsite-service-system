'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const HELPER_FILE = 'src/depotWorkshop/depotWorkshopRepairOrderCustomerProjection.js';
const EXISTING_FILTER_FILE = 'src/depotWorkshop/depotRepairCustomerVisibleDataFilter.js';
const ACCEPTED_SERVICE_FILE = 'src/services/WorkshopAssignmentService.js';
const UNIT_TEST_FILE = 'tests/depotWorkshop/depotWorkshopRepairOrderCustomerProjection.unit.test.js';
const STATIC_TEST_FILE = 'tests/depotWorkshop/depotWorkshopRepairOrderCustomerProjectionBoundary.static.test.js';
const TASK2377_DOC = 'docs/task-2377-depot-workshop-repair-order-customer-visible-projection-pure-helper-no-route-no-db-no-provider-no-package.md';
const TASK2373_DOC = 'docs/task-2373-depot-workshop-repair-order-state-model-pure-constants-helper-no-route-no-db-no-provider-no-package.md';
const TASK2374_DOC = 'docs/task-2374-depot-workshop-repair-order-contract-pure-helper-no-route-no-db-no-provider-no-package.md';
const TASK2375_DOC = 'docs/task-2375-depot-workshop-repair-order-transition-policy-pure-helper-no-route-no-db-no-provider-no-package.md';
const TASK2376_DOC = 'docs/task-2376-depot-workshop-repair-order-audit-event-pure-helper-no-route-no-db-no-provider-no-package.md';

function projectPath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(projectPath(relativePath), 'utf8');
}

function requireSpecifiers(source) {
  return Array.from(source.matchAll(/require\(\s*['"]([^'"]+)['"]\s*\)/g), (match) => match[1]);
}

function stripConstBlock(source, constName) {
  const marker = `const ${constName} = `;
  const start = source.indexOf(marker);

  if (start === -1) {
    return source;
  }

  const arrayEnd = source.indexOf(']);', start);
  const objectEnd = source.indexOf('});', start);
  const finalEnd = [arrayEnd, objectEnd].filter((value) => value !== -1).sort((a, b) => a - b)[0];

  assert.notEqual(finalEnd, undefined, `unterminated ${constName}`);

  return `${source.slice(0, start)}${source.slice(finalEnd + 4)}`;
}

function sourceWithoutPolicyLists(source) {
  return [
    'DEPOT_WORKSHOP_REPAIR_ORDER_CUSTOMER_PROJECTION_FIELDS',
    'CUSTOMER_PROJECTION_FIELD_SOURCES',
    'UNSAFE_CUSTOMER_PROJECTION_TEXT_PATTERNS',
  ].reduce((result, constName) => stripConstBlock(result, constName), source);
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

test('Task2377 allowed files exist and prior pure helpers remain visible', () => {
  for (const relativePath of [
    HELPER_FILE,
    EXISTING_FILTER_FILE,
    UNIT_TEST_FILE,
    STATIC_TEST_FILE,
    TASK2377_DOC,
    TASK2373_DOC,
    TASK2374_DOC,
    TASK2375_DOC,
    TASK2376_DOC,
  ]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }

  assertIncludesAll(`${read(TASK2373_DOC)}\n${read(TASK2374_DOC)}\n${read(TASK2375_DOC)}\n${read(TASK2376_DOC)}`, [
    'DEPOT_WORKSHOP_REPAIR_ORDER_STATUSES',
    'buildDepotWorkshopRepairOrderDraft(input)',
    'planDepotWorkshopRepairOrderStatusTransition(input)',
    'buildDepotWorkshopRepairOrderAuditEvent(input)',
    'No `finalAppointmentId` mutation path.',
  ], 'prior Depot Workshop docs');
});

test('customer projection helper imports no DB repository provider route app server env or package modules', () => {
  const source = read(HELPER_FILE);

  assert.deepEqual(requireSpecifiers(source), []);
  assertDoesNotMatchAny(source, [
    /import\s+/,
    /process\.env/,
    /DATABASE_URL\s*=/,
    /\bZeabur\b/,
    /require\(/,
    /src\/routes|routes\/depotRepair/i,
    /src\/repositories|DepotIntakeSqlRepositoryAdapter/,
    /src\/app|src\/server|express/i,
    /\bapp\.listen\s*\(|\bserver\.listen\s*\(|\blisten\s*\(/,
    /\bfetch\s*\(|axios|got|superagent/i,
    /send(Line|Sms|SMS|Email|Webhook)/,
    /\bINSERT\s+INTO\b|\bUPDATE\s+\w+\b|\bDELETE\s+FROM\b|\bALTER\s+TABLE\b|\bCREATE\s+TABLE\b/i,
    /\bnew\s+Pool\b|require\(['"]pg['"]\)|require\(['"]postgres['"]\)/,
    /\bpsql\b|db:migrate|migrations\//i,
  ], 'Task2377 helper');
});

test('customer projection helper exports pure allowlist constants and functions', () => {
  const source = read(HELPER_FILE);

  assertIncludesAll(source, [
    'DEPOT_WORKSHOP_REPAIR_ORDER_CUSTOMER_PROJECTION_FIELDS',
    'buildDepotWorkshopRepairOrderCustomerProjection',
    'sanitizeDepotWorkshopRepairOrderCustomerProjection',
    'repairOrderReference',
    'caseReference',
    'depotStatus',
    'statusLabelKey',
    'lastUpdatedAt',
    'customerMessageKey',
    'estimatedReadyAt',
    'returnMethod',
    'publicNotes',
  ], 'Task2377 helper source');
});

test('customer projection helper is wired only into accepted WorkshopAssignmentService boundary', () => {
  const scannedFiles = [
    ...collectJsFiles('src/routes'),
    ...collectJsFiles('src/controllers'),
    ...collectJsFiles('src/repositories'),
    ...collectJsFiles('src/guards'),
  ];

  for (const relativePath of scannedFiles) {
    const source = read(relativePath);

    assert.equal(source.includes('depotWorkshopRepairOrderCustomerProjection'), false, `${relativePath} should not import Task2377 helper`);
    assert.equal(source.includes('buildDepotWorkshopRepairOrderCustomerProjection'), false, `${relativePath} should not call Task2377 helper`);
  }

  const serviceSource = read(ACCEPTED_SERVICE_FILE);

  assertIncludesAll(serviceSource, [
    "require('../depotWorkshop/depotWorkshopRepairOrderCustomerProjection')",
    'buildDepotWorkshopRepairOrderCustomerProjection',
    'buildRepairOrderCustomerProjection',
    'repairOrderCustomerProjection',
    'prepareAssignmentIntent',
    'writeRequired: false',
    'written: false',
  ], 'accepted Task2381 service-level customer projection integration');

  assertDoesNotMatchAny(serviceSource, [
    /require\(['"].*routes/i,
    /require\(['"].*controllers/i,
    /require\(['"].*repositories/i,
    /require\(['"].*providers/i,
    /require\(['"].*package/i,
    /process\.env/,
    /DATABASE_URL\s*=/,
    /\bnew\s+Pool\b|require\(['"]pg['"]\)|require\(['"]postgres['"]\)/,
    /\bpsql\b|db:migrate|migrations\//i,
    /send(Line|Sms|SMS|Email|Webhook)/,
    /createFieldServiceReport|approveFieldServiceReport|publishFieldServiceReport|finalizeFieldServiceReport/i,
    /createCompletionReport|approveCompletionReport|publishCompletionReport|finalizeCompletionReport/i,
    /finalAppointmentId\s*[:=]/,
  ], 'accepted Task2381 service-level customer projection integration');
});

test('existing customer visible filter remains allowlist projection only', () => {
  const source = read(EXISTING_FILTER_FILE);

  assertIncludesAll(source, [
    'DEPOT_REPAIR_CUSTOMER_VISIBLE_ALLOWED_FIELDS',
    'buildDepotRepairCustomerVisibleDto',
    'customerRepairReference',
    'statusSummary',
    'supportContactHint',
    'safeValue',
  ], 'existing depot customer-visible filter');
  assertDoesNotMatchAny(source, [
    /publish\s*\(|revoke\s*\(|approve\s*\(|finalize\s*\(/,
    /createFieldServiceReport|completionReport\s*=/i,
    /finalAppointmentId\s*=/,
  ], 'existing depot customer-visible filter');
});

test('customer projection helper does not approve publish formalize FSR Completion Report or expose finalAppointmentId', () => {
  const source = sourceWithoutPolicyLists(read(HELPER_FILE));

  assertDoesNotMatchAny(source, [
    /createFieldServiceReport|approveFieldServiceReport|publishFieldServiceReport|revokeFieldServiceReport/i,
    /createCompletionReport|approveCompletionReport|publishCompletionReport|finalizeCompletionReport/i,
    /completeAppointment|finalizeAppointment|mutateAppointment|setFinalAppointment/i,
    /finalAppointmentId\s*=/,
    /fieldServiceReport\s*=/,
    /completionReport\s*=/,
    /customerVisiblePublication\s*=/,
    /\bpublish\s*\(|\brevoke\s*\(|\bapprove\s*\(|\bfinalize\s*\(/,
  ], 'Task2377 helper executable body');
});

test('Task2377 doc records pure projection helper and non-authorized scopes', () => {
  const doc = read(TASK2377_DOC);

  assertIncludesAll(doc, [
    'Task2377 Depot Workshop Repair Order Customer Visible Projection Pure Helper',
    HELPER_FILE,
    UNIT_TEST_FILE,
    STATIC_TEST_FILE,
    'Existing runtime behavior is not changed.',
    'customer-visible projection helper contract',
    'allowlist',
    'No route wiring',
    'No DB commands, SQL execution, real DB connection, migration creation, migration dry-run, or migration apply.',
    'No provider sending.',
    'No package or package-lock changes.',
    'No formal Field Service Report / Completion Report creation, approval, publication, or finalization behavior.',
    'No `finalAppointmentId` mutation path.',
    'forbidden field exclusion',
    'input mutation protection',
    'The 7 held historical docs remain outside Task2377 scope',
  ], 'Task2377 doc');
});

test('Task2377 docs and tests do not introduce executable authorization or real credentials', () => {
  const combined = [
    read(TASK2377_DOC),
    read(UNIT_TEST_FILE),
    read(STATIC_TEST_FILE),
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
  ], 'Task2377 docs/tests');
});
