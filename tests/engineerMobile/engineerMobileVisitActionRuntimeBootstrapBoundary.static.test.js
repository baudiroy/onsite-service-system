'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const BOOTSTRAP_FILE = 'src/engineerMobile/engineerMobileVisitActionRuntimeBootstrap.js';
const UNIT_TEST_FILE = 'tests/engineerMobile/engineerMobileVisitActionRuntimeBootstrap.unit.test.js';
const BOUNDARY_TEST_FILE = 'tests/engineerMobile/engineerMobileVisitActionRuntimeBootstrapBoundary.static.test.js';
const TASK_DOC = 'docs/task-1848-engineer-mobile-runtime-bootstrap-repository-bridge-wiring-injected-repository-no-db.md';

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

test('Task1848 allowed files exist', () => {
  for (const file of [BOOTSTRAP_FILE, UNIT_TEST_FILE, BOUNDARY_TEST_FILE, TASK_DOC]) {
    assert.equal(fs.existsSync(absolutePath(file)), true, `${file} should exist`);
  }
});

test('visit action runtime bootstrap imports only accepted injected composition modules', () => {
  const source = read(BOOTSTRAP_FILE);

  assert.deepEqual(requireSpecifiers(source), [
    './engineerMobileVisitActionApplicationService',
    './engineerMobileVisitActionInjectedMountAdapter',
    './engineerMobileVisitActionTransitionWriterAdapter',
    './engineerMobileVisitActionAuditWriterAdapter',
    './engineerMobileVisitActionIntegratedPersistenceWriter',
    './engineerMobileVisitActionRepositoryPersistencePortBridge',
  ]);
});

test('visit action runtime bootstrap stays isolated from forbidden runtimes', () => {
  const source = read(BOOTSTRAP_FILE);

  for (const pattern of [
    /require\(['"].*express['"]\)/i,
    /\bexpress\b/i,
    /\bRouter\b/,
    /\bapp\.js\b/,
    /\bserver\.js\b/,
    /routes\/index/i,
    /\bapp\./,
    /\.listen\s*\(/,
    /\blisten\b/,
    /\bpg\b/i,
    /\bpool\b/i,
    /DATABASE_URL/,
    /process\.env/,
    /\bfs\b/,
    /require\(['"].*node:path['"]\)/,
    /require\(['"].*path['"]\)/,
    /\brepository\.query\b/i,
    /\bdb\.query\b/i,
    /\bclient\.query\b/i,
    /\bpool\.query\b/i,
    /db:migrate/i,
    /\bpsql\b/i,
    /\bSELECT\b/,
    /\bUPDATE\b/,
    /\bINSERT\b/,
    /\bDELETE\b/,
    /CREATE\s+TABLE/i,
    /ALTER\s+TABLE/i,
    /DROP\s+TABLE/i,
    /\bline\b/i,
    /\bsms\b/i,
    /\bemail\b/i,
    /\bwebhook\b/i,
    /\bpush\b/i,
    /\bai\b/i,
    /\brag\b/i,
    /\bbilling\b/i,
    /\bsettlement\b/i,
    /createCompletionReport/i,
    /completionReportRepository/i,
    /completionReport/i,
    /fieldServiceReport/i,
    /publish/i,
    /approve/i,
    /finalAppointmentId\s*=/,
    /finalAppointmentId:/,
    /Date\.now\s*\(/,
    /new Date\s*\(/,
    /setTimeout\s*\(/,
    /setInterval\s*\(/,
    /\bfetch\b/,
    /\baxios\b/,
  ]) {
    assert.doesNotMatch(source, pattern, `bootstrap contains forbidden pattern ${pattern}`);
  }
});

test('visit action runtime bootstrap does not execute persistence provider or completion workflow calls', () => {
  const source = read(BOOTSTRAP_FILE);

  for (const pattern of [
    /\.query\s*\(/,
    /\.save\s*\(/,
    /\.update\s*\(/,
    /\bsend[A-Z]\w*\s*\(/,
    /\bcreateFieldServiceReport\s*\(/,
    /\bapproveFieldServiceReport\s*\(/,
    /\bpublishFieldServiceReport\s*\(/,
    /\bcompleteAppointment\s*\(/,
    /\bupdateAppointment\s*\(/,
    /\bcreateAppointment\s*\(/,
  ]) {
    assert.doesNotMatch(source, pattern, `bootstrap contains forbidden behavior ${pattern}`);
  }
});

test('Task1848 doc records required runtime bootstrap repository bridge boundaries', () => {
  const doc = read(TASK_DOC);

  for (const phrase of [
    'No DB execution',
    'No SQL execution',
    'No raw SQL',
    'No migration',
    'No global mount',
    'No route registration',
    'No Express import',
    'Injected repository adapter only',
    'Injected repository bridge only',
    'No DB client creation',
    'No real persistence implementation',
    'No audit log persistence implementation',
    'No provider sending',
    'Injected dependencies only',
    'Injected writers only',
    'No separate audit event writer on repository bridge path',
    'No completion report creation',
    'No completion report approval',
    'No completion report publication',
    'No finalAppointmentId mutation',
    'No customer-visible publication',
  ]) {
    assert.match(doc, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  for (const file of [BOOTSTRAP_FILE, UNIT_TEST_FILE, BOUNDARY_TEST_FILE]) {
    assert.match(doc, new RegExp(file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});
