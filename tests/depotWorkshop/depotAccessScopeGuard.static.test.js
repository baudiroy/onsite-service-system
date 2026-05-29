'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const GUARD_FILE = 'src/guards/DepotAccessScopeGuard.js';
const UNIT_TEST_FILE = 'tests/depotWorkshop/depotAccessScopeGuard.unit.test.js';
const STATIC_TEST_FILE = 'tests/depotWorkshop/depotAccessScopeGuard.static.test.js';
const TASK_DOC = 'docs/task-1912-brand-service-provider-subcontractor-access-guard.md';

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

test('Task1912 allowed files exist', () => {
  for (const file of [GUARD_FILE, UNIT_TEST_FILE, STATIC_TEST_FILE, TASK_DOC]) {
    assert.equal(fs.existsSync(absolutePath(file)), true, `${file} should exist`);
  }
});

test('depot access scope guard is pure and imports no runtime dependencies', () => {
  const source = read(GUARD_FILE);

  assert.deepEqual(requireSpecifiers(source), []);

  for (const pattern of [
    /require\(/,
    /import\s+/,
    /process\.env/,
    /DATABASE_URL/,
    /src\/app/,
    /src\/server/,
    /routes\/index/,
    /\bexpress\b/i,
    /\.listen\s*\(/,
    /require\(['"]pg['"]\)/,
    /require\(['"]postgres['"]\)/,
    /\bnew\s+Pool\b/,
    /\bpsql\b/i,
    /db:migrate/i,
    /migrations\//i,
    /\bseed\b/i,
    /\bfetch\s*\(/,
    /axios|got|superagent/i,
  ]) {
    assert.doesNotMatch(source, pattern, `guard contains forbidden runtime pattern ${pattern}`);
  }
});

test('depot access scope guard defines explicit brand provider and subcontractor boundaries', () => {
  const source = read(GUARD_FILE);

  for (const phrase of [
    'depot_workshop.access_scope_guard',
    'brand',
    'service_provider',
    'subcontractor',
    'assigned_executor',
    'depot_access_organization_mismatch',
    'depot_access_brand_scope_mismatch',
    'depot_access_service_provider_scope_mismatch',
    'depot_access_subcontractor_relationship_required',
    'depot_access_revoked_or_disabled',
    'depot_access_unknown_scope',
    'subcontractor_minimized',
  ]) {
    assert.equal(source.includes(phrase), true, `missing expected boundary phrase ${phrase}`);
  }
});

test('depot access scope guard cannot execute provider AI billing publication or FSR behavior', () => {
  const source = read(GUARD_FILE);

  for (const forbidden of [
    /send(Line|Sms|SMS|Email|Webhook)/,
    /OPENAI|LINE_CHANNEL|R2_/,
    /createSettlement|runSettlement|stripe/i,
    /createFieldServiceReport|approveFieldServiceReport|publishFieldServiceReport|revokeFieldServiceReport/i,
    /completeAppointment|finalizeAppointment/i,
    /finalAppointmentId/,
    /fieldServiceReport/,
    /completionReport/,
    /customerVisiblePublication/,
    /publish\s*\(/,
    /revoke\s*\(/,
  ]) {
    assert.doesNotMatch(source, forbidden, `unexpected execution token ${forbidden}`);
  }
});

test('Task1912 tests cover allow deny mismatch and minimization boundaries', () => {
  const unitTest = read(UNIT_TEST_FILE);

  for (const phrase of [
    'brand allowed synthetic scope is organization and brand scoped',
    'service provider allowed synthetic scope requires explicit provider scope',
    'subcontractor allowed only with explicit assignment relationship and minimized fields',
    'subcontractor denied without explicit assignment relationship',
    'organization brand and service-provider mismatch fail closed',
    'missing context unknown role and revoked or disabled access fail closed',
    'subcontractor scope mismatch fails closed even with explicit relationship',
  ]) {
    assert.match(unitTest, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('Task1912 documentation records no-execution and safety boundaries', () => {
  const doc = read(TASK_DOC);

  for (const phrase of [
    'Task1912',
    'pure guard',
    'No real DB connection',
    'No migration',
    'No runtime start',
    'No route mount',
    'No provider sending',
    'No billing/AI/RAG execution',
    'No finalAppointmentId mutation',
    'No Completion Report / Field Service Report behavior',
    'No customer-visible depot/workshop publication behavior',
    'No subcontractor customer-sensitive data exposure',
    GUARD_FILE,
    UNIT_TEST_FILE,
    STATIC_TEST_FILE,
  ]) {
    assert.equal(doc.includes(phrase), true, `doc should include ${phrase}`);
  }
});
