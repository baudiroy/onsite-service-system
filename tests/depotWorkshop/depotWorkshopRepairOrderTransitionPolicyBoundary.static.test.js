'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const HELPER_FILE = 'src/depotWorkshop/depotWorkshopRepairOrderTransitionPolicy.js';
const STATE_MODEL_FILE = 'src/depotWorkshop/depotWorkshopRepairOrderStateModel.js';
const CONTRACT_FILE = 'src/depotWorkshop/depotWorkshopRepairOrderContract.js';
const UNIT_TEST_FILE = 'tests/depotWorkshop/depotWorkshopRepairOrderTransitionPolicy.unit.test.js';
const STATIC_TEST_FILE = 'tests/depotWorkshop/depotWorkshopRepairOrderTransitionPolicyBoundary.static.test.js';
const TASK2375_DOC = 'docs/task-2375-depot-workshop-repair-order-transition-policy-pure-helper-no-route-no-db-no-provider-no-package.md';
const TASK2373_DOC = 'docs/task-2373-depot-workshop-repair-order-state-model-pure-constants-helper-no-route-no-db-no-provider-no-package.md';
const TASK2374_DOC = 'docs/task-2374-depot-workshop-repair-order-contract-pure-helper-no-route-no-db-no-provider-no-package.md';

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
  const setEnd = source.indexOf(']);', start);
  const finalEnd = [arrayEnd, objectEnd, setEnd].filter((value) => value !== -1).sort((a, b) => a - b)[0];

  assert.notEqual(finalEnd, undefined, `unterminated ${constName}`);

  return `${source.slice(0, start)}${source.slice(finalEnd + 4)}`;
}

function sourceWithoutPolicyLists(source) {
  return [
    'DEPOT_WORKSHOP_REPAIR_ORDER_ALLOWED_TRANSITIONS',
    'FORBIDDEN_TRANSITION_INPUT_KEYS',
    'UNSAFE_TRANSITION_TEXT_PATTERNS',
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

test('Task2375 allowed files exist and prior state/contract helpers remain visible', () => {
  for (const relativePath of [
    HELPER_FILE,
    STATE_MODEL_FILE,
    CONTRACT_FILE,
    UNIT_TEST_FILE,
    STATIC_TEST_FILE,
    TASK2375_DOC,
    TASK2373_DOC,
    TASK2374_DOC,
  ]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }

  assertIncludesAll(`${read(TASK2373_DOC)}\n${read(TASK2374_DOC)}`, [
    'DEPOT_WORKSHOP_REPAIR_ORDER_STATUSES',
    'buildDepotWorkshopRepairOrderDraft(input)',
    'validateDepotWorkshopRepairOrderDraft(input)',
    'No `finalAppointmentId` mutation path.',
  ], 'prior Task2373/Task2374 docs');
});

test('transition policy helper imports only safe Task2373 state model and Task2374 contract modules', () => {
  const source = read(HELPER_FILE);

  assert.deepEqual(requireSpecifiers(source).sort(), [
    './depotWorkshopRepairOrderContract',
    './depotWorkshopRepairOrderStateModel',
  ]);
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
  ], 'Task2375 helper');
});

test('transition policy helper exports pure transition constants and functions', () => {
  const source = read(HELPER_FILE);

  assertIncludesAll(source, [
    'DEPOT_WORKSHOP_REPAIR_ORDER_ALLOWED_TRANSITIONS',
    'canTransitionDepotWorkshopRepairOrderStatus',
    'planDepotWorkshopRepairOrderStatusTransition',
    'isDepotWorkshopRepairOrderStatus',
    'validateDepotWorkshopRepairOrderDraft',
    'intake_received',
    'diagnosis_pending',
    'quality_check',
    'ready_for_return',
    'returned',
    'cancelled',
    'closed',
    'depot_workshop_repair_order_transition_not_allowed',
    'depot_workshop_repair_order_terminal_transition_denied',
  ], 'Task2375 helper source');
});

test('transition policy helper is not wired into routes controllers repositories services or guards', () => {
  const scannedFiles = [
    ...collectJsFiles('src/routes'),
    ...collectJsFiles('src/controllers'),
    ...collectJsFiles('src/repositories'),
    ...collectJsFiles('src/services'),
    ...collectJsFiles('src/guards'),
  ];

  for (const relativePath of scannedFiles) {
    const source = read(relativePath);

    assert.equal(source.includes('depotWorkshopRepairOrderTransitionPolicy'), false, `${relativePath} should not import Task2375 helper`);
    assert.equal(source.includes('planDepotWorkshopRepairOrderStatusTransition'), false, `${relativePath} should not call Task2375 helper`);
  }
});

test('transition policy helper does not approve publish formalize FSR Completion Report or finalAppointmentId behavior', () => {
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
  ], 'Task2375 helper executable body');
});

test('Task2375 doc records transition policy and non-authorized scopes', () => {
  const doc = read(TASK2375_DOC);

  assertIncludesAll(doc, [
    'Task2375 Depot Workshop Repair Order Transition Policy Pure Helper',
    HELPER_FILE,
    UNIT_TEST_FILE,
    STATIC_TEST_FILE,
    'Existing runtime behavior is not changed.',
    'allowed transition model',
    'trusted scope validation',
    'No route wiring',
    'No DB commands, SQL execution, real DB connection, migration creation, migration dry-run, or migration apply.',
    'No provider sending.',
    'No package or package-lock changes.',
    'No formal Field Service Report / Completion Report creation, approval, publication, or finalization behavior.',
    'No `finalAppointmentId` mutation path.',
    'forbidden field exclusion',
    'input mutation protection',
    'The 7 held historical docs remain outside Task2375 scope',
  ], 'Task2375 doc');
});

test('Task2375 docs and tests do not introduce executable authorization or real credentials', () => {
  const combined = [
    read(TASK2375_DOC),
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
  ], 'Task2375 docs/tests');
});
