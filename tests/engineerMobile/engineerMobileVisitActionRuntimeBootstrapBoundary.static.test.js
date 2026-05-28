'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const BOOTSTRAP_FILE = 'src/engineerMobile/engineerMobileVisitActionRuntimeBootstrap.js';
const UNIT_TEST_FILE = 'tests/engineerMobile/engineerMobileVisitActionRuntimeBootstrap.unit.test.js';
const BOUNDARY_TEST_FILE = 'tests/engineerMobile/engineerMobileVisitActionRuntimeBootstrapBoundary.static.test.js';
const TASK_DOC = 'docs/task-1826-engineer-mobile-visit-action-runtime-bootstrap-writer-adapters-injected-only-no-db.md';

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

test('Task1826 allowed files exist', () => {
  for (const file of [BOOTSTRAP_FILE, UNIT_TEST_FILE, BOUNDARY_TEST_FILE, TASK_DOC]) {
    assert.equal(fs.existsSync(absolutePath(file)), true, `${file} should exist`);
  }
});

test('visit action runtime bootstrap imports only accepted service injected mount and writer adapters', () => {
  const source = read(BOOTSTRAP_FILE);

  assert.deepEqual(requireSpecifiers(source), [
    './engineerMobileVisitActionApplicationService',
    './engineerMobileVisitActionInjectedMountAdapter',
    './engineerMobileVisitActionTransitionWriterAdapter',
    './engineerMobileVisitActionAuditWriterAdapter',
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
    /\bpg\b/i,
    /\bpool\b/i,
    /DATABASE_URL/,
    /process\.env/,
    /\bfs\b/,
    /require\(['"].*node:path['"]\)/,
    /require\(['"].*path['"]\)/,
    /\bfetch\b/,
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
    assert.doesNotMatch(source, pattern, `bootstrap contains forbidden pattern ${pattern}`);
  }
});

test('visit action runtime bootstrap does not execute persistence provider or completion workflow calls', () => {
  const source = read(BOOTSTRAP_FILE);

  for (const pattern of [
    /\bINSERT\b/i,
    /\bUPDATE\b/i,
    /\bDELETE\b/i,
    /\bALTER\b/i,
    /\bCREATE\s+TABLE\b/i,
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

test('Task1826 doc records required runtime bootstrap boundaries', () => {
  const doc = read(TASK_DOC);

  for (const phrase of [
    'No DB',
    'No migration',
    'No global mount',
    'No Express import',
    'No route index change',
    'No app/server change',
    'Injected dependencies only',
    'Injected writers only',
    'Injected patch writer only',
    'Injected audit event writer only',
    'No real persistence',
    'No real audit persistence',
    'No repository import',
    'No provider sending',
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
