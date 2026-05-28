'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const ADAPTER_FILE = 'src/engineerMobile/engineerMobileVisitActionPersistencePortWriterAdapter.js';
const UNIT_TEST_FILE = 'tests/engineerMobile/engineerMobileVisitActionPersistencePortWriterAdapter.unit.test.js';
const BOUNDARY_TEST_FILE = 'tests/engineerMobile/engineerMobileVisitActionPersistencePortWriterAdapterBoundary.static.test.js';
const TASK_DOC = 'docs/task-1830-engineer-mobile-visit-action-persistence-port-writer-adapter-injected-port-no-db.md';

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

test('Task1830 allowed files exist', () => {
  for (const file of [ADAPTER_FILE, UNIT_TEST_FILE, BOUNDARY_TEST_FILE, TASK_DOC]) {
    assert.equal(fs.existsSync(absolutePath(file)), true, `${file} should exist`);
  }
});

test('persistence port writer adapter imports only the accepted persistence port contract', () => {
  const source = read(ADAPTER_FILE);

  assert.deepEqual(requireSpecifiers(source), ['./engineerMobileVisitActionPersistencePortContract']);
});

test('persistence port writer adapter stays isolated from forbidden runtimes', () => {
  const source = read(ADAPTER_FILE);

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
    assert.doesNotMatch(source, pattern, `adapter contains forbidden pattern ${pattern}`);
  }
});

test('persistence port writer adapter does not execute real persistence route provider or completion calls', () => {
  const source = read(ADAPTER_FILE);

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
    assert.doesNotMatch(source, pattern, `adapter contains forbidden behavior ${pattern}`);
  }
});

test('persistence port writer adapter remains synchronous and injected-only', () => {
  const source = read(ADAPTER_FILE);

  assert.doesNotMatch(source, /async\s+function/);
  assert.doesNotMatch(source, /Promise\./);
  assert.doesNotMatch(source, /await\s+/);
  assert.match(source, /persistencePort\.persist/);
  assert.match(source, /validateEngineerMobileVisitActionPersistencePortInput/);
});

test('Task1830 doc records required injected persistence port boundaries', () => {
  const doc = read(TASK_DOC);

  for (const phrase of [
    'No DB',
    'No SQL',
    'No migration',
    'No global mount',
    'No route registration',
    'No Express import',
    'No repository import',
    'Injected persistence port only',
    'No real persistence implementation',
    'No audit log persistence implementation',
    'No provider sending',
    'No completion report creation',
    'No completion report approval',
    'No completion report publication',
    'No finalAppointmentId mutation',
    'No customer-visible publication',
  ]) {
    assert.equal(doc.includes(phrase), true, `doc should include ${phrase}`);
  }

  for (const file of [ADAPTER_FILE, UNIT_TEST_FILE, BOUNDARY_TEST_FILE]) {
    assert.equal(doc.includes(file), true, `doc should include ${file}`);
  }
});
