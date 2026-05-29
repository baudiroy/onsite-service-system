'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const ROUTE_FILE = 'src/routes/depotRepair.routes.js';
const UNIT_TEST_FILE = 'tests/depotWorkshop/depotRepairRoutePermissionGuard.unit.test.js';
const STATIC_TEST_FILE = 'tests/depotWorkshop/depotRepairRoutePermissionGuard.static.test.js';
const TASK_DOC = 'docs/task-1913-depot-repair-route-wiring-permission-guard.md';

function absolutePath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(absolutePath(relativePath), 'utf8');
}

function requireSpecifiers(source) {
  const specifiers = [];
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
  let match;

  while ((match = requireRegex.exec(source)) !== null) {
    specifiers.push(match[1]);
  }

  return specifiers;
}

test('Task1913 allowed files exist', () => {
  for (const file of [ROUTE_FILE, UNIT_TEST_FILE, STATIC_TEST_FILE, TASK_DOC]) {
    assert.equal(fs.existsSync(absolutePath(file)), true, `${file} should exist`);
  }
});

test('depot repair route imports only permission middleware and depot access guard', () => {
  const source = read(ROUTE_FILE);

  assert.deepEqual(requireSpecifiers(source), [
    '../middlewares/requirePermission',
    '../guards/DepotAccessScopeGuard',
  ]);

  for (const forbidden of [
    /require\(['"].*db/i,
    /require\(['"].*migration/i,
    /require\(['"].*provider/i,
    /require\(['"].*billing/i,
    /require\(['"].*ai/i,
    /process\.env/,
    /DATABASE_URL/,
    /require\(['"]pg['"]\)/,
    /require\(['"]postgres['"]\)/,
    /\bnew\s+Pool\b/,
    /\bPool\s*\(/,
    /\bpsql\b/i,
    /db:migrate/i,
    /migrations\//i,
    /\bseed\b/i,
    /\bfetch\s*\(/,
    /axios|got|superagent/i,
  ]) {
    assert.doesNotMatch(source, forbidden, `route contains forbidden runtime pattern ${forbidden}`);
  }
});

test('depot repair route registers permission guard before handler', () => {
  const source = read(ROUTE_FILE);

  assert.equal(source.includes("const DEPOT_REPAIR_ROUTE_PERMISSION = 'depot.repair.prepare'"), true);
  assert.equal(source.includes("const DEPOT_REPAIR_ROUTE_PATH = '/api/v1/depot/repairs/:depotIntakeId/assignment-intent'"), true);
  assert.match(source, /router\.post\(\s*DEPOT_REPAIR_ROUTE_PATH,\s*requirePermission\(DEPOT_REPAIR_ROUTE_PERMISSION\),\s*createDepotRepairRouteHandler\(options\),\s*\)/);
  assert.match(source, /accessGuard\(buildAccessGuardInput\(req\)\)/);
  assert.match(source, /depot_repair_route_write_scope_not_approved/);
});

test('depot repair route sanitizes unsafe output instead of exposing internals', () => {
  const source = read(ROUTE_FILE);

  for (const deniedToken of [
    'customerphone',
    'customeraddress',
    'providerpayload',
    'fieldservicereport',
    'finalappointmentid',
    'customervisiblepublication',
    'billinginternals',
    'rawrow',
    'rawrows',
    'sql',
    'stack',
    'secret',
    'token',
  ]) {
    assert.equal(source.includes(deniedToken), true, `missing denied token ${deniedToken}`);
  }

  assert.match(source, /sanitizeValue/);
});

test('depot repair route has no provider AI billing publication or FSR execution calls', () => {
  const source = read(ROUTE_FILE);

  for (const forbidden of [
    /send(Line|Sms|SMS|Email|Webhook)/,
    /OPENAI|LINE_CHANNEL|R2_/,
    /createSettlement|runSettlement|stripe/i,
    /createFieldServiceReport|approveFieldServiceReport|publishFieldServiceReport|revokeFieldServiceReport/i,
    /completeAppointment|finalizeAppointment|mutateAppointment/i,
    /publish\s*\(/,
    /revoke\s*\(/,
    /\bINSERT\s+INTO\b/i,
    /\bUPDATE\s+\w+\b/i,
    /\bDELETE\s+FROM\b/i,
    /\bALTER\s+TABLE\b/i,
    /\bCREATE\s+TABLE\b/i,
  ]) {
    assert.doesNotMatch(source, forbidden, `unexpected execution token ${forbidden}`);
  }
});

test('Task1913 tests cover permission dependency access write and sanitization boundaries', () => {
  const unitTest = read(UNIT_TEST_FILE);

  for (const phrase of [
    'permission guard runs before handler and injected service',
    'injected preflight allow path calls service and returns sanitized response',
    'missing dependency returns safe unavailable response',
    'access guard denied safe failure occurs before service call',
    'subcontractor route response excludes customer-sensitive fields',
    'write scope not approved returns conflict before service call',
    'service failure is sanitized and buildServiceInput uses authenticated organization',
  ]) {
    assert.match(unitTest, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('Task1913 documentation records no-execution and safety boundaries', () => {
  const doc = read(TASK_DOC);

  for (const phrase of [
    'Task1913',
    'permission guard before handler/service',
    'injected services only',
    'No real DB connection',
    'No migration',
    'No runtime start',
    'No depot/workshop smoke',
    'No provider sending',
    'No billing/AI/RAG execution',
    'No appointment lifecycle mutation',
    'No finalAppointmentId mutation',
    'No Completion Report / Field Service Report behavior',
    'No customer-visible depot/workshop publication behavior',
    'No subcontractor customer-sensitive data exposure',
    ROUTE_FILE,
    UNIT_TEST_FILE,
    STATIC_TEST_FILE,
  ]) {
    assert.equal(doc.includes(phrase), true, `doc should include ${phrase}`);
  }
});
