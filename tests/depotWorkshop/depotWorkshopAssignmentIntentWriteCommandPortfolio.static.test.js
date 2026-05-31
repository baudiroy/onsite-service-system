'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const HELPER_FILE = 'src/depotWorkshop/depotWorkshopAssignmentIntentWriteCommand.js';
const ROUTE_FILE = 'src/routes/depotRepair.routes.js';
const SERVICE_FILE = 'src/services/WorkshopAssignmentService.js';
const TASK2392_DOC = 'docs/task-2392-depot-workshop-assignment-intent-route-write-scope-authorization-packet-no-runtime-change-no-db-no-provider-no-package.md';
const TASK2393_DOC = 'docs/task-2393-depot-workshop-assignment-intent-write-command-helper-design-packet-no-runtime-change-no-db-no-provider-no-package.md';
const TASK2394_DOC = 'docs/task-2394-depot-workshop-assignment-intent-write-command-pure-helper-no-route-no-db-no-provider-no-package.md';
const TASK2395_DOC = 'docs/task-2395-depot-workshop-assignment-intent-write-command-helper-static-portfolio-guard-no-runtime-change-no-db-no-provider-no-package.md';

const PORTFOLIO_ARTIFACTS = Object.freeze([
  'tests/depotWorkshop/depotWorkshopAssignmentIntentWriteCommand.unit.test.js',
  'tests/depotWorkshop/depotWorkshopAssignmentIntentWriteCommandBoundary.static.test.js',
  'tests/depotWorkshop/depotWorkshopAssignmentIntentWriteCommandHelperDesign.static.test.js',
  'tests/depotWorkshop/depotWorkshopAssignmentIntentRouteWriteScopeAuthorization.static.test.js',
  'tests/depotWorkshop/depotWorkshopAssignmentIntentRouteResponsePresenterWiringPortfolio.static.test.js',
  'tests/depotWorkshop/workshopAssignmentServiceRepairOrderIntegrationPortfolio.static.test.js',
]);

const ACCEPTED_HELPER_IMPORTS = Object.freeze([
  './depotWorkshopRepairOrderAuditEvent',
  './depotWorkshopRepairOrderCustomerProjection',
  './depotWorkshopRepairOrderTransitionPolicy',
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

test('Task2392 through Task2395 write command portfolio artifacts exist', () => {
  for (const relativePath of [
    HELPER_FILE,
    ROUTE_FILE,
    SERVICE_FILE,
    TASK2392_DOC,
    TASK2393_DOC,
    TASK2394_DOC,
    TASK2395_DOC,
    ...PORTFOLIO_ARTIFACTS,
  ]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }
});

test('write command helper export action and accepted pure imports remain frozen', () => {
  const helper = read(HELPER_FILE);

  assert.deepEqual(requireSpecifiers(helper).sort(), [...ACCEPTED_HELPER_IMPORTS].sort());
  assertIncludesAll(helper, [
    'function buildDepotWorkshopAssignmentIntentWriteCommand(input = {})',
    'DEPOT_WORKSHOP_ASSIGNMENT_INTENT_WRITE_ACTION',
    "depot_workshop.assignment_intent.write",
    'buildDepotWorkshopRepairOrderAuditEvent',
    'buildDepotWorkshopRepairOrderCustomerProjection',
    'planDepotWorkshopRepairOrderStatusTransition',
    'module.exports',
  ], 'Task2395 helper export and import portfolio');
});

test('helper has no DB repository provider route app server env or package imports', () => {
  const helper = read(HELPER_FILE);

  assertDoesNotMatchAny(helper, [
    /require\(['"].*routes?/i,
    /require\(['"].*controllers?/i,
    /require\(['"].*repositories?/i,
    /require\(['"].*providers?/i,
    /require\(['"].*package/i,
    /process\.env/,
    /DATABASE_URL\s*=/,
    /\bnew\s+Pool\b|require\(['"]pg['"]\)|require\(['"]postgres['"]\)/,
    /\bpsql\b|db:migrate|migrations\//i,
    /supertest\s*\(|fetch\s*\(|axios|got|superagent/i,
    /\bapp\.listen\s*\(|\bserver\.listen\s*\(|\blisten\s*\(/,
  ], 'Task2395 helper forbidden import portfolio');
});

test('helper is not wired into runtime and route write scope remains blocked', () => {
  const route = read(ROUTE_FILE);
  const service = read(SERVICE_FILE);

  assertDoesNotMatchAny(`${route}\n${service}`, [
    /depotWorkshopAssignmentIntentWriteCommand/,
    /buildDepotWorkshopAssignmentIntentWriteCommand/,
  ], 'Task2395 helper runtime wiring portfolio');

  assertIncludesAll(route, [
    'depot_repair_route_write_scope_not_approved',
    'writeRequested(req)',
    'presentDepotWorkshopAssignmentIntentResponse',
    "const DEPOT_REPAIR_ROUTE_PATH = '/api/v1/depot/repairs/:depotIntakeId/assignment-intent'",
    "const DEPOT_REPAIR_ROUTE_PERMISSION = 'depot.repair.prepare'",
  ], 'Task2395 route write scope portfolio');
});

test('command safety is covered by helper source docs and tests', () => {
  const combined = [
    read(HELPER_FILE),
    read(TASK2394_DOC),
    read('tests/depotWorkshop/depotWorkshopAssignmentIntentWriteCommand.unit.test.js'),
    read('tests/depotWorkshop/depotWorkshopAssignmentIntentWriteCommandBoundary.static.test.js'),
  ].join('\n');

  assertIncludesAll(combined, [
    'organizationId',
    'caseId',
    'depotIntakeId',
    'repairOrderId',
    'actorId',
    'permissionAllowed',
    'buildTransitionPlan',
    'buildAuditIntent',
    'customerProjectionPreview',
    'internalOnly',
    'customerVisible',
    'missing trusted scope fails closed',
    'missing write permission/authorization fails closed',
    'invalid transition fails closed',
    'subcontractor mismatch fails closed',
    'no DB/repository/provider result appears',
    'no formal Field Service Report / Completion Report / `finalAppointmentId` mutation appears',
  ], 'Task2395 command safety portfolio');
});

test('write command portfolio keeps forbidden runtime and payload behavior absent', () => {
  const source = `${read(HELPER_FILE)}\n${read(ROUTE_FILE)}\n${read(SERVICE_FILE)}`;

  assertDoesNotMatchAny(source, [
    /\bINSERT\s+INTO\b/i,
    /\bUPDATE\s+\w+\b/i,
    /\bDELETE\s+FROM\b/i,
    /\bALTER\s+TABLE\b/i,
    /\bCREATE\s+TABLE\b/i,
    /\bnew\s+Pool\b|require\(['"]pg['"]\)|require\(['"]postgres['"]\)/,
    /\bpsql\b|db:migrate|migrations\//i,
    /send(Line|Sms|SMS|Email|Webhook)/,
    /createFieldServiceReport|approveFieldServiceReport|publishFieldServiceReport|finalizeFieldServiceReport/i,
    /createCompletionReport|approveCompletionReport|publishCompletionReport|finalizeCompletionReport/i,
    /completeAppointment|finalizeAppointment|mutateAppointment|setFinalAppointment/i,
    /finalAppointmentId\s*[:=]/,
    /createSettlement|runSettlement|stripe/i,
    /providerPayload\s*[:=]/,
    /aiProviderOutput\s*[:=]|openAiTrace\s*[:=]|vectorTrace\s*[:=]/,
    /sql\s*[:=]|stack\s*[:=]|token\s*[:=]|password\s*[:=]|secret\s*[:=]|debugTrace\s*[:=]/,
    /supertest\s*\(|fetch\s*\(|axios|got|superagent/i,
    /\bapp\.listen\s*\(|\bserver\.listen\s*\(|\blisten\s*\(/,
    /\/healthz/i,
  ], 'Task2395 forbidden write command portfolio behavior');
});

test('Task2395 doc records current status and non-authorized next candidates', () => {
  const doc = read(TASK2395_DOC);

  assertIncludesAll(doc, [
    'Task2395 Depot Workshop Assignment Intent Write Command Helper Static Portfolio Guard',
    'current write command helper status',
    'No runtime/source behavior changes',
    'No helper implementation changes',
    'No route write-scope behavior',
    'write command helper branch closure',
    'route write-scope decision gate',
    'repository/migration authorization packet',
    'admin UI design packet',
    'The 7 held historical docs remain outside Task2395 scope',
  ], 'Task2395 doc');
});

test('Task2395 docs and static guard introduce no executable authorization or real credentials', () => {
  const combined = [
    read(TASK2395_DOC),
    read('tests/depotWorkshop/depotWorkshopAssignmentIntentWriteCommandPortfolio.static.test.js'),
  ].join('\n');

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
  ], 'Task2395 docs/static guard executable authorization');
});
