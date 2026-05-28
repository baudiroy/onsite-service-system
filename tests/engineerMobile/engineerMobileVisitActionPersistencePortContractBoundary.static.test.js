'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const CONTRACT_FILE = 'src/engineerMobile/engineerMobileVisitActionPersistencePortContract.js';
const UNIT_TEST_FILE = 'tests/engineerMobile/engineerMobileVisitActionPersistencePortContract.unit.test.js';
const BOUNDARY_TEST_FILE = 'tests/engineerMobile/engineerMobileVisitActionPersistencePortContractBoundary.static.test.js';
const TASK_DOC = 'docs/task-1828-engineer-mobile-visit-action-persistence-port-contract-no-db-no-migration.md';

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

test('Task1828 allowed files exist', () => {
  for (const file of [CONTRACT_FILE, UNIT_TEST_FILE, BOUNDARY_TEST_FILE, TASK_DOC]) {
    assert.equal(fs.existsSync(absolutePath(file)), true, `${file} should exist`);
  }
});

test('persistence port contract has no imports', () => {
  const source = read(CONTRACT_FILE);

  assert.deepEqual(requireSpecifiers(source), []);
});

test('persistence port contract stays isolated from forbidden runtimes', () => {
  const source = read(CONTRACT_FILE);

  for (const pattern of [
    /\bpg\b/i,
    /\bpool\b/i,
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
    /\brepository\b/i,
    /\bRepository\b/,
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
    /completionReport/i,
    /fieldServiceReport/i,
    /finalAppointmentId/,
    /Date\.now\s*\(/,
    /new Date\s*\(/,
    /setTimeout\s*\(/,
    /setInterval\s*\(/,
  ]) {
    assert.doesNotMatch(source, pattern, `contract contains forbidden pattern ${pattern}`);
  }
});

test('persistence port contract does not execute persistence route provider or completion calls', () => {
  const source = read(CONTRACT_FILE);

  for (const pattern of [
    /\bINSERT\b/i,
    /\bUPDATE\b/i,
    /\bDELETE\b/i,
    /\bALTER\b/i,
    /\bCREATE\b/i,
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
    assert.doesNotMatch(source, pattern, `contract contains forbidden behavior ${pattern}`);
  }
});

test('persistence port contract remains pure and synchronous', () => {
  const source = read(CONTRACT_FILE);

  assert.doesNotMatch(source, /async\s+function/);
  assert.doesNotMatch(source, /Promise\./);
  assert.doesNotMatch(source, /await\s+/);
  assert.doesNotMatch(source, /throw\s+/);
});

test('Task1828 doc records required persistence port contract boundaries', () => {
  const doc = read(TASK_DOC);

  for (const phrase of [
    'No DB',
    'No SQL',
    'No migration',
    'No global mount',
    'No route registration',
    'No Express import',
    'No repository import',
    'No real persistence',
    'No audit log persistence',
    'No provider sending',
    'No completion report creation',
    'No completion report approval',
    'No completion report publication',
    'No finalAppointmentId mutation',
    'No customer-visible publication',
    'Pure persistence port contract only',
  ]) {
    assert.equal(doc.includes(phrase), true, `doc should include ${phrase}`);
  }

  for (const file of [CONTRACT_FILE, UNIT_TEST_FILE, BOUNDARY_TEST_FILE]) {
    assert.equal(doc.includes(file), true, `doc should include ${file}`);
  }
});
