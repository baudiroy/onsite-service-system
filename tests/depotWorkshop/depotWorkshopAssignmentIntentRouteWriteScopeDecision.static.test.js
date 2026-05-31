'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const ROUTE_FILE = 'src/routes/depotRepair.routes.js';
const SERVICE_FILE = 'src/services/WorkshopAssignmentService.js';
const TASK2419_DOC = 'docs/task-2419-depot-workshop-assignment-intent-route-write-scope-decision-packet-no-runtime-change-no-real-db-no-migration-apply-no-provider-no-package.md';

const CONTEXT_DOCS = Object.freeze([
  'docs/task-2392-depot-workshop-assignment-intent-route-write-scope-authorization-packet-no-runtime-change-no-db-no-provider-no-package.md',
  'docs/task-2393-depot-workshop-assignment-intent-write-command-helper-design-packet-no-runtime-change-no-db-no-provider-no-package.md',
  'docs/task-2394-depot-workshop-assignment-intent-write-command-pure-helper-no-route-no-db-no-provider-no-package.md',
  'docs/task-2395-depot-workshop-assignment-intent-write-command-helper-static-portfolio-guard-no-runtime-change-no-db-no-provider-no-package.md',
  'docs/task-2396-depot-workshop-assignment-intent-write-command-helper-branch-closure-no-runtime-change-no-db-no-provider-no-package.md',
  'docs/task-2401-depot-workshop-repair-order-migration-schema-design-packet-no-runtime-change-no-db-execution-no-migration-no-provider-no-package.md',
  'docs/task-2409-depot-workshop-repair-order-sql-repository-adapter-branch-closure-no-runtime-change-no-real-db-no-migration-apply-no-provider-no-package.md',
  'docs/task-2412-depot-workshop-repair-order-write-command-repository-adapter-fake-chain-branch-closure-no-runtime-change-no-real-db-no-migration-apply-no-provider-no-package.md',
  'docs/task-2414-depot-workshop-migration-028-disposable-db-dry-run-authorization-branch-closure-no-runtime-change-no-db-execution-no-migration-apply-no-provider-no-package.md',
  'docs/task-2415-depot-workshop-repair-order-runtime-wiring-decision-gate-no-runtime-change-no-real-db-no-migration-apply-no-provider-no-package.md',
  'docs/task-2416-depot-workshop-write-prepared-assignment-intent-service-method-fake-repository-composition-no-route-no-real-db-no-migration-apply-no-provider-no-package.md',
  'docs/task-2417-depot-workshop-write-prepared-assignment-intent-service-method-static-portfolio-guard-no-runtime-change-no-real-db-no-migration-apply-no-provider-no-package.md',
  'docs/task-2418-depot-workshop-write-prepared-assignment-intent-service-method-branch-closure-no-runtime-change-no-real-db-no-migration-apply-no-provider-no-package.md',
]);

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

test('Task2419 decision packet and context artifacts exist', () => {
  for (const relativePath of [ROUTE_FILE, SERVICE_FILE, TASK2419_DOC, ...CONTEXT_DOCS]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }
});

test('current route remains prepare-only and write scope denied', () => {
  const route = read(ROUTE_FILE);

  assertIncludesAll(route, [
    "const DEPOT_REPAIR_ROUTE_PATH = '/api/v1/depot/repairs/:depotIntakeId/assignment-intent'",
    "const DEPOT_REPAIR_ROUTE_PERMISSION = 'depot.repair.prepare'",
    'requirePermission(DEPOT_REPAIR_ROUTE_PERMISSION)',
    'function serviceHandlerFrom(service)',
    'typeof service.prepareAssignmentIntent',
    'return service.prepareAssignmentIntent.bind(service)',
    'function writeRequested(req = {})',
    'body.writeRequested === true',
    'body.writeApproved === true',
    'body.persist === true',
    'body.commit === true',
    "failure('depot_repair_route_write_scope_not_approved', req)",
    'return sendResponse(res, statusCodeFromResult(result), failureBody(result, req))',
  ], 'Task2419 route source');

  assert.equal(
    route.includes('writePreparedAssignmentIntent'),
    false,
    'route should not wire writePreparedAssignmentIntent',
  );
});

test('service keeps separate prepare and write methods without route authorization', () => {
  const service = read(SERVICE_FILE);

  assertIncludesAll(service, [
    'async prepareAssignmentIntent(input = {})',
    'written: false',
    'writeRequired: false',
    'async writePreparedAssignmentIntent(input = {})',
    'buildDepotWorkshopAssignmentIntentWriteCommand(input)',
    'repairOrderWriterFrom(repairOrderRepository)',
    'const repositoryResult = await writeRepairOrder({',
    'normalizeDepotWorkshopRepairOrderRepositoryResult({',
    'trustedScope: commandEnvelope.command',
  ], 'Task2419 service source');

  assertDoesNotMatchAny(service, [
    /createDepotWorkshopRepairOrderSqlRepositoryAdapter/,
    /require\(['"].*DepotWorkshopRepairOrderSqlRepositoryAdapter['"]\)/,
    /\bnew\s+Pool\b|require\(['"]pg['"]\)|require\(['"]postgres['"]\)/,
    /process\.env/,
    /DATABASE_URL\s*=/,
    /ZEABUR\s*=/i,
  ], 'Task2419 service forbidden direct runtime wiring');
});

test('decision packet compares route write-scope options and recommends one strategy', () => {
  const doc = read(TASK2419_DOC);

  assertIncludesAll(doc, [
    'Task2419 Depot Workshop Assignment Intent Route Write Scope Decision Packet',
    'Option A: keep current assignment-intent route prepare-only.',
    'Option B: add a separate explicit write route in future.',
    'Option C: add conditional write behavior to existing route.',
    'Option D: defer route write scope until disposable DB dry-run and repository verification are complete.',
    'Recommended future route strategy: keep current assignment-intent route prepare-only until disposable DB dry-run and repository verification are complete.',
    'This packet does not recommend immediate route write-scope implementation.',
  ], 'Task2419 decision packet options');

  assert.equal(
    (doc.match(/Recommended future route strategy:/g) || []).length,
    1,
    'Task2419 should recommend exactly one future route strategy',
  );
});

test('decision packet records blockers and prerequisites', () => {
  const doc = read(TASK2419_DOC);

  assertIncludesAll(doc, [
    'migration 028 exists but has not been dry-run/applied',
    'no disposable DB target/tooling has been provided',
    'SQL repository adapter is fake-client tested only',
    'write command to repository adapter chain is fake-only',
    '`writePreparedAssignmentIntent` exists but is not route-wired',
    'route write scope remains blocked',
    'explicit PM authorization for the exact route write-scope task',
    'DB migration dry-run or equivalent safe verification',
    'repository adapter verification beyond fake-client-only coverage',
    'exact write action name and permission',
    'response presenter behavior and safe allowlisted fields',
    'rollback/stop conditions',
    'no provider sending unless separately authorized',
    'no formal Field Service Report / Completion Report behavior',
    'no `finalAppointmentId` mutation',
  ], 'Task2419 blockers and prerequisites');
});

test('Task2419 introduces no runtime or authorization expansion', () => {
  const doc = read(TASK2419_DOC);
  const combinedSource = `${read(ROUTE_FILE)}\n${read(SERVICE_FILE)}`;

  assertIncludesAll(doc, [
    'Task2419 does not authorize:',
    'runtime/source behavior changes',
    'route write-scope behavior',
    'helper/service write-method wiring into route',
    'DB commands',
    'SQL execution against any DB',
    'real DB connection',
    'migration dry-run/apply',
    '`DATABASE_URL`, Zeabur, env, or secrets inspection',
    'provider sending',
    'package or package-lock changes',
    'formal Field Service Report / Completion Report creation, approval, publication, or finalization behavior',
    '`finalAppointmentId` mutation path',
    'The 7 held historical docs remain outside Task2419 scope',
  ], 'Task2419 non-authorization');

  assertDoesNotMatchAny(combinedSource, [
    /\bINSERT\s+INTO\b/i,
    /\bUPDATE\s+\w+\b/i,
    /\bDELETE\s+FROM\b/i,
    /\bALTER\s+TABLE\b/i,
    /\bCREATE\s+TABLE\b/i,
    /\bnew\s+Pool\b|require\(['"]pg['"]\)|require\(['"]postgres['"]\)/,
    /send(Line|Sms|SMS|Email|Webhook)/,
    /createFieldServiceReport|approveFieldServiceReport|publishFieldServiceReport|finalizeFieldServiceReport/i,
    /createCompletionReport|approveCompletionReport|publishCompletionReport|finalizeCompletionReport/i,
    /completeAppointment|finalizeAppointment|mutateAppointment|setFinalAppointment/i,
    /finalAppointmentId\s*[:=]/,
    /createSettlement|runSettlement|stripe/i,
    /supertest\s*\(|fetch\s*\(|axios|got|superagent/i,
    /\bapp\.listen\s*\(|\bserver\.listen\s*\(|\blisten\s*\(/,
    /\/healthz/i,
  ], 'Task2419 route/service forbidden runtime behavior');
});

test('Task2419 docs and static guard introduce no executable authorization or real credentials', () => {
  const combined = [
    read(TASK2419_DOC),
    read('tests/depotWorkshop/depotWorkshopAssignmentIntentRouteWriteScopeDecision.static.test.js'),
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
  ], 'Task2419 docs/static guard executable authorization');
});
