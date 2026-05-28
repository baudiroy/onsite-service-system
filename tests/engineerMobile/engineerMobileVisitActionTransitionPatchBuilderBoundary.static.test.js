'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const BUILDER_FILE = 'src/engineerMobile/engineerMobileVisitActionTransitionPatchBuilder.js';
const UNIT_TEST_FILE = 'tests/engineerMobile/engineerMobileVisitActionTransitionPatchBuilder.unit.test.js';
const BOUNDARY_TEST_FILE = 'tests/engineerMobile/engineerMobileVisitActionTransitionPatchBuilderBoundary.static.test.js';
const TASK_DOC = 'docs/task-1818-engineer-mobile-visit-action-transition-patch-builder-no-db-write.md';

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

test('Task1818 allowed files exist', () => {
  for (const file of [BUILDER_FILE, UNIT_TEST_FILE, BOUNDARY_TEST_FILE, TASK_DOC]) {
    assert.equal(fs.existsSync(absolutePath(file)), true, `${file} should exist`);
  }
});

test('transition patch builder has no runtime imports', () => {
  const source = read(BUILDER_FILE);

  assert.deepEqual(requireSpecifiers(source), []);
});

test('transition patch builder stays isolated from forbidden runtimes', () => {
  const source = read(BUILDER_FILE);

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
    assert.doesNotMatch(source, pattern, `builder contains forbidden pattern ${pattern}`);
  }
});

test('transition patch builder does not execute write provider route or completion workflow calls', () => {
  const source = read(BUILDER_FILE);

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
    /\bsend[A-Z]\w*\s*\(/,
    /\bcreateFieldServiceReport\s*\(/,
    /\bapproveFieldServiceReport\s*\(/,
    /\bpublishFieldServiceReport\s*\(/,
    /\bcompleteAppointment\s*\(/,
    /\bupdateAppointment\s*\(/,
    /\bcreateAppointment\s*\(/,
  ]) {
    assert.doesNotMatch(source, pattern, `builder contains forbidden behavior ${pattern}`);
  }
});

test('transition patch builder remains pure and synchronous', () => {
  const source = read(BUILDER_FILE);

  assert.doesNotMatch(source, /async\s+function/);
  assert.doesNotMatch(source, /Promise\./);
  assert.doesNotMatch(source, /await\s+/);
  assert.doesNotMatch(source, /throw\s+/);
});

test('Task1818 doc records required pure patch builder boundaries', () => {
  const doc = read(TASK_DOC);

  for (const phrase of [
    'No DB',
    'No migration',
    'No global mount',
    'No route registration',
    'No Express import',
    'No repository import',
    'No real persistence',
    'No provider sending',
    'No completion report creation',
    'No completion report approval',
    'No completion report publication',
    'No finalAppointmentId mutation',
    'No customer-visible publication',
    'Pure patch builder only',
  ]) {
    assert.equal(doc.includes(phrase), true, `doc should include ${phrase}`);
  }

  for (const file of [BUILDER_FILE, UNIT_TEST_FILE, BOUNDARY_TEST_FILE]) {
    assert.equal(doc.includes(file), true, `doc should include ${file}`);
  }
});
