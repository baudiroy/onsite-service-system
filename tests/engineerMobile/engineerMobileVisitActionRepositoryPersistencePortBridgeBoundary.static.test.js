'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const BRIDGE_FILE = 'src/engineerMobile/engineerMobileVisitActionRepositoryPersistencePortBridge.js';
const CONTRACT_FILE = './engineerMobileVisitActionRepositoryContract';
const UNIT_TEST_FILE = 'tests/engineerMobile/engineerMobileVisitActionRepositoryPersistencePortBridge.unit.test.js';
const BOUNDARY_TEST_FILE = 'tests/engineerMobile/engineerMobileVisitActionRepositoryPersistencePortBridgeBoundary.static.test.js';
const TASK_DOC = 'docs/task-1846-engineer-mobile-visit-action-repository-persistence-port-bridge-injected-repository-no-db.md';

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

test('Task1846 allowed files exist', () => {
  for (const file of [BRIDGE_FILE, UNIT_TEST_FILE, BOUNDARY_TEST_FILE, TASK_DOC]) {
    assert.equal(fs.existsSync(absolutePath(file)), true, `${file} should exist`);
  }
});

test('repository persistence port bridge imports only the repository contract module', () => {
  const source = read(BRIDGE_FILE);

  assert.deepEqual(requireSpecifiers(source), [CONTRACT_FILE]);
});

test('repository persistence port bridge stays isolated from DB SQL route provider and package surfaces', () => {
  const source = read(BRIDGE_FILE);

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
    assert.doesNotMatch(source, pattern, `bridge contains forbidden pattern ${pattern}`);
  }
});

test('repository persistence port bridge does not contain raw query keywords or persistence route behavior', () => {
  const source = read(BRIDGE_FILE);

  for (const pattern of [
    /\bSELECT\b/i,
    /\bINSERT\b/i,
    /\bUPDATE\b/i,
    /\bDELETE\b/i,
    /\bALTER\b/i,
    /\bCREATE\b/i,
    /\bDROP\b/i,
    /\.query\s*\(/,
    /\.execute\s*\(/,
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
    assert.doesNotMatch(source, pattern, `bridge contains forbidden behavior ${pattern}`);
  }
});

test('repository persistence port bridge remains synchronous and injected-repository-only', () => {
  const source = read(BRIDGE_FILE);

  assert.doesNotMatch(source, /async\s+function/);
  assert.doesNotMatch(source, /Promise\./);
  assert.doesNotMatch(source, /await\s+/);
  assert.doesNotMatch(source, /globalThis/);
  assert.doesNotMatch(source, /window\./);
  assert.match(source, /repositoryAdapter\.persist\(repositoryPayload\)/);
  assert.equal((source.match(/\.persist\s*\(/g) || []).length, 1);
});

test('Task1846 doc records required injected repository boundary phrases', () => {
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
    'Injected repository adapter only',
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

test('Task1846 doc references allowed files and future sequence', () => {
  const doc = read(TASK_DOC);

  for (const phrase of [
    BRIDGE_FILE,
    UNIT_TEST_FILE,
    BOUNDARY_TEST_FILE,
    'Task1832 integrated persistence writer',
    'Task1830 persistence port writer adapter',
    'Task1842 repository contract',
    'Task1844 repository adapter',
    'optional bootstrap wiring with injected repository bridge',
    'disposable DB dry-run only after Task1840-style approval',
    'real SQL repository implementation only after migration 023 dry-run acceptance',
    'global route/mount only after separate approval',
  ]) {
    assert.equal(doc.includes(phrase), true, `doc should include ${phrase}`);
  }
});
