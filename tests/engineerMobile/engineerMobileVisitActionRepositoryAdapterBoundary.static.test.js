'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const ADAPTER_FILE = 'src/engineerMobile/engineerMobileVisitActionRepositoryAdapter.js';
const CONTRACT_FILE = './engineerMobileVisitActionRepositoryContract';
const UNIT_TEST_FILE = 'tests/engineerMobile/engineerMobileVisitActionRepositoryAdapter.unit.test.js';
const BOUNDARY_TEST_FILE = 'tests/engineerMobile/engineerMobileVisitActionRepositoryAdapterBoundary.static.test.js';
const TASK_DOC = 'docs/task-1844-engineer-mobile-visit-action-repository-adapter-injected-db-client-no-db-execution.md';

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

test('Task1844 allowed files exist', () => {
  for (const file of [ADAPTER_FILE, UNIT_TEST_FILE, BOUNDARY_TEST_FILE, TASK_DOC]) {
    assert.equal(fs.existsSync(absolutePath(file)), true, `${file} should exist`);
  }
});

test('repository adapter imports only the repository contract module', () => {
  const source = read(ADAPTER_FILE);

  assert.deepEqual(requireSpecifiers(source), [CONTRACT_FILE]);
});

test('repository adapter stays isolated from DB SQL route provider and package surfaces', () => {
  const source = read(ADAPTER_FILE);

  for (const pattern of [
    /\bpg\b/i,
    /\bpool\b/i,
    /\bknex\b/i,
    /\bsequelize\b/i,
    /DATABASE_URL/,
    /process\.env/,
    /\bfs\b/,
    /\bpath\b/,
    /\bhttp\b/i,
    /\bhttps\b/i,
    /\bfetch\b/,
    /\bexpress\b/i,
    /\bRouter\b/,
    /\bapp\./,
    /\.listen\s*\(/,
    /db:migrate/i,
    /\bpsql\b/i,
    /\bline\b/i,
    /\bsms\b/i,
    /\bemail\b/i,
    /\bwebhook\b/i,
    /\bpush\b/i,
    /\bai\b/i,
    /\brag\b/i,
    /\bbilling\b/i,
    /\bsettlement\b/i,
    /package\.json/i,
    /package-lock\.json/i,
    /Date\.now\s*\(/,
    /new Date\s*\(/,
    /setTimeout\s*\(/,
    /setInterval\s*\(/,
  ]) {
    assert.doesNotMatch(source, pattern, `adapter contains forbidden pattern ${pattern}`);
  }
});

test('repository adapter does not contain raw query keywords or persistence route behavior', () => {
  const source = read(ADAPTER_FILE);

  for (const pattern of [
    /\bSELECT\b/i,
    /\bINSERT\b/i,
    /\bUPDATE\b/i,
    /\bDELETE\b/i,
    /\bALTER\b/i,
    /\bCREATE\b/i,
    /\bDROP\b/i,
    /\.query\s*\(/,
    /\.save\s*\(/,
    /\.create\s*\(/,
    /\.update\s*\(/,
    /\.delete\s*\(/,
    /\brecordAudit/i,
    /\bwriteAudit/i,
    /\bauditLog/i,
    /\bsend[A-Z]\w*\s*\(/,
    /\bcreateFieldServiceReport\s*\(/,
    /\bapproveFieldServiceReport\s*\(/,
    /\bpublishFieldServiceReport\s*\(/,
    /\bcompleteAppointment\s*\(/,
    /\bupdateAppointment\s*\(/,
    /\bcreateAppointment\s*\(/,
  ]) {
    assert.doesNotMatch(source, pattern, `adapter contains forbidden behavior ${pattern}`);
  }
});

test('repository adapter remains synchronous and does not read global state', () => {
  const source = read(ADAPTER_FILE);

  assert.doesNotMatch(source, /async\s+function/);
  assert.doesNotMatch(source, /Promise\./);
  assert.doesNotMatch(source, /await\s+/);
  assert.doesNotMatch(source, /globalThis/);
  assert.doesNotMatch(source, /window\./);
});

test('repository adapter keeps injected execute as the only write-like call', () => {
  const source = read(ADAPTER_FILE);

  assert.match(source, /dbClient\.execute\(operationIntent\)/);
  assert.equal((source.match(/\.execute\s*\(/g) || []).length, 1);
});

test('Task1844 doc records required injected-client boundary phrases', () => {
  const doc = read(TASK_DOC);

  for (const phrase of [
    'No DB execution',
    'No SQL execution',
    'No raw SQL strings',
    'No SQL statement builder',
    'No migration',
    'No global mount',
    'No route registration',
    'No Express import',
    'No DB client import',
    'Injected DB client only',
    'Synthetic DB client tests only',
    'No real persistence',
    'No audit log persistence',
    'No provider sending',
    'No completion report creation',
    'No completion report approval',
    'No completion report publication',
    'No finalAppointmentId mutation',
    'No customer-visible publication',
  ]) {
    assert.equal(doc.includes(phrase), true, `doc should include ${phrase}`);
  }
});

test('Task1844 doc references allowed files and future sequence', () => {
  const doc = read(TASK_DOC);

  for (const phrase of [
    ADAPTER_FILE,
    UNIT_TEST_FILE,
    BOUNDARY_TEST_FILE,
    'disposable DB dry-run only after Task1840-style approval',
    'real repository SQL implementation only after migration 023 dry-run acceptance',
    'runtime bootstrap wiring with injected repository port',
    'global route/mount only after separate approval',
  ]) {
    assert.equal(doc.includes(phrase), true, `doc should include ${phrase}`);
  }
});
