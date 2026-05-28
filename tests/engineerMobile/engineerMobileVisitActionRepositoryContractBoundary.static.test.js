'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const CONTRACT_FILE = 'src/engineerMobile/engineerMobileVisitActionRepositoryContract.js';
const UNIT_TEST_FILE = 'tests/engineerMobile/engineerMobileVisitActionRepositoryContract.unit.test.js';
const BOUNDARY_TEST_FILE = 'tests/engineerMobile/engineerMobileVisitActionRepositoryContractBoundary.static.test.js';
const TASK_DOC = 'docs/task-1842-engineer-mobile-visit-action-repository-contract-no-db-no-sql.md';

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

test('Task1842 allowed files exist', () => {
  for (const file of [CONTRACT_FILE, UNIT_TEST_FILE, BOUNDARY_TEST_FILE, TASK_DOC]) {
    assert.equal(fs.existsSync(absolutePath(file)), true, `${file} should exist`);
  }
});

test('repository contract module has no imports', () => {
  const source = read(CONTRACT_FILE);

  assert.deepEqual(requireSpecifiers(source), []);
});

test('repository contract module stays isolated from DB SQL route provider and package surfaces', () => {
  const source = read(CONTRACT_FILE);

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
    assert.doesNotMatch(source, pattern, `contract contains forbidden pattern ${pattern}`);
  }
});

test('repository contract module does not implement persistence route provider or completion behavior', () => {
  const source = read(CONTRACT_FILE);

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
    assert.doesNotMatch(source, pattern, `contract contains forbidden behavior ${pattern}`);
  }
});

test('repository contract module remains pure and synchronous', () => {
  const source = read(CONTRACT_FILE);

  assert.doesNotMatch(source, /async\s+function/);
  assert.doesNotMatch(source, /Promise\./);
  assert.doesNotMatch(source, /await\s+/);
  assert.doesNotMatch(source, /throw\s+/);
});

test('repository contract keeps completion and final appointment boundaries as deny-only terms', () => {
  const source = read(CONTRACT_FILE);

  for (const phrase of [
    'completion_report_boundary',
    'final_appointment_boundary',
    'fieldservicereport',
    'finalappointmentid',
  ]) {
    assert.equal(source.includes(phrase), true, `contract should include deny-only phrase ${phrase}`);
  }

  for (const unsafePhrase of [
    'completionReportId',
    'fieldServiceReportId',
    'finalAppointmentId',
  ]) {
    assert.equal(source.includes(unsafePhrase), false, `contract should not expose ${unsafePhrase}`);
  }
});

test('Task1842 doc records required no-runtime boundary phrases', () => {
  const doc = read(TASK_DOC);

  for (const phrase of [
    'No DB',
    'No SQL',
    'No migration',
    'No repository implementation',
    'No repository imports',
    'No controller changes',
    'No global route registration',
    'No Express import',
    'No listen call',
    'No smoke test',
    'No real persistence/write execution',
    'No audit log persistence',
    'No provider sending',
    'No AI / RAG',
    'No billing / settlement',
    'No admin UI',
    'No package.json or lockfile changes',
    'No seed changes',
    'No permission table migration',
    'No completion report creation',
    'No Field Service Report creation',
    'No finalAppointmentId creation or mutation',
    'No customer-visible publication',
  ]) {
    assert.equal(doc.includes(phrase), true, `doc should include ${phrase}`);
  }
});

test('Task1842 doc references the allowed files and future sequence', () => {
  const doc = read(TASK_DOC);

  for (const phrase of [
    CONTRACT_FILE,
    UNIT_TEST_FILE,
    BOUNDARY_TEST_FILE,
    'synthetic DB-client repository adapter test',
    'repository implementation with injected DB client',
    'disposable DB dry-run only after Task1840-style approval',
    'runtime bootstrap wiring only after repository contract is stable',
    'global route/mount only after separate approval',
  ]) {
    assert.equal(doc.includes(phrase), true, `doc should include ${phrase}`);
  }
});
