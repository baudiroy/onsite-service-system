'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const SERVICE_FILE = 'src/engineerMobile/engineerMobileVisitActionApplicationService.js';
const UNIT_TEST_FILE = 'tests/engineerMobile/engineerMobileVisitActionApplicationService.unit.test.js';
const BOUNDARY_TEST_FILE = 'tests/engineerMobile/engineerMobileVisitActionApplicationServiceBoundary.static.test.js';
const TASK_DOC = 'docs/task-1808-engineer-mobile-visit-action-application-service-injected-writers-no-db-no-route.md';
const TASK1852_DOC = 'docs/task-1852-engineer-mobile-application-service-boundary-alignment-accepted-normalizer-import-no-runtime-change.md';

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

test('Task1808 allowed files exist', () => {
  for (const file of [SERVICE_FILE, UNIT_TEST_FILE, BOUNDARY_TEST_FILE, TASK_DOC]) {
    assert.equal(fs.existsSync(absolutePath(file)), true, `${file} should exist`);
  }
});

test('visit action application service imports only accepted planner and writer normalizer modules', () => {
  const source = read(SERVICE_FILE);

  assert.deepEqual(requireSpecifiers(source), [
    './engineerMobileVisitActionCommandPlanner',
    './engineerMobileVisitActionWriterResultNormalizer',
  ]);
});

test('visit action application service stays isolated from forbidden runtimes', () => {
  const source = read(SERVICE_FILE);

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
    assert.doesNotMatch(source, pattern, `service contains forbidden pattern ${pattern}`);
  }
});

test('visit action application service does not execute route provider or completion workflow calls', () => {
  const source = read(SERVICE_FILE);

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
    assert.doesNotMatch(source, pattern, `service contains forbidden behavior ${pattern}`);
  }
});

test('Task1808 doc records required injected-writer boundaries', () => {
  const doc = read(TASK_DOC);

  for (const phrase of [
    'No DB',
    'No migration',
    'No global mount',
    'No route',
    'No controller',
    'No provider sending',
    'Injected writers only',
    'No real persistence',
    'No repository import',
    'No completion report creation',
    'No completion report approval',
    'No completion report publication',
    'No finalAppointmentId mutation',
    'No customer-visible publication',
  ]) {
    assert.match(doc, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  for (const file of [SERVICE_FILE, UNIT_TEST_FILE, BOUNDARY_TEST_FILE]) {
    assert.match(doc, new RegExp(file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('Task1852 doc records no-runtime boundary alignment with accepted normalizer import', () => {
  const doc = read(TASK1852_DOC);

  for (const phrase of [
    'aligns the stale Task1808 application-service static boundary test with the accepted Task1816 writer result normalizer refactor',
    './engineerMobileVisitActionCommandPlanner',
    './engineerMobileVisitActionWriterResultNormalizer',
    'No runtime code change',
    'No src change',
    'No DB',
    'No SQL',
    'No migration',
    'No route/global mount',
    'No Express import',
    'No repository import',
    'No real persistence',
    'No provider sending',
    'No completion report creation',
    'No completion report approval',
    'No completion report publication',
    'No finalAppointmentId mutation',
    'No customer-visible publication',
  ]) {
    assert.match(doc, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});
