'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const ADAPTER_FILE = 'src/engineerMobile/engineerMobileVisitActionHttpHandlerAdapter.js';
const UNIT_TEST_FILE = 'tests/engineerMobile/engineerMobileVisitActionHttpHandlerAdapter.unit.test.js';
const BOUNDARY_TEST_FILE = 'tests/engineerMobile/engineerMobileVisitActionHttpHandlerAdapterBoundary.static.test.js';
const TASK_DOC = 'docs/task-1810-engineer-mobile-visit-action-http-handler-adapter-injected-service-no-global-mount.md';

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

test('Task1810 allowed files exist', () => {
  for (const file of [ADAPTER_FILE, UNIT_TEST_FILE, BOUNDARY_TEST_FILE, TASK_DOC]) {
    assert.equal(fs.existsSync(absolutePath(file)), true, `${file} should exist`);
  }
});

test('visit action HTTP handler adapter has no module imports', () => {
  const source = read(ADAPTER_FILE);

  assert.deepEqual(requireSpecifiers(source), []);
});

test('visit action HTTP handler adapter does not import or construct application service', () => {
  const source = read(ADAPTER_FILE);

  for (const pattern of [
    /require\(['"].*VisitActionApplicationService['"]\)/,
    /engineerMobileVisitActionApplicationService/,
    /createEngineerMobileVisitActionApplicationService/,
  ]) {
    assert.doesNotMatch(source, pattern, `adapter contains forbidden service construction ${pattern}`);
  }
});

test('visit action HTTP handler adapter stays isolated from forbidden runtimes', () => {
  const source = read(ADAPTER_FILE);

  for (const pattern of [
    /\bpg\b/i,
    /\bpool\b/i,
    /DATABASE_URL/,
    /process\.env/,
    /\bfs\b/,
    /\bpath\b/,
    /\bfetch\b/,
    /\bexpress\b/i,
    /\bRouter\b/,
    /\bapp\./,
    /\.listen\s*\(/,
    /\.get\s*\(/,
    /\.post\s*\(/,
    /\.put\s*\(/,
    /\.patch\s*\(/,
    /\.delete\s*\(/,
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

test('visit action HTTP handler adapter does not execute route provider or persistence calls', () => {
  const source = read(ADAPTER_FILE);

  for (const pattern of [
    /\bINSERT\b/i,
    /\bUPDATE\b/i,
    /\bDELETE\b/i,
    /\bALTER\b/i,
    /\bCREATE\s+TABLE\b/i,
    /\.query\s*\(/,
    /\.save\s*\(/,
    /\.create\s*\(/,
    /\.update\s*\(/,
    /\bregister\s*\(/,
    /\bmount\s*\(/,
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

test('Task1810 doc records required injected-service boundaries', () => {
  const doc = read(TASK_DOC);

  for (const phrase of [
    'No DB',
    'No migration',
    'No global mount',
    'No Express import',
    'No route registration',
    'No controller registration',
    'Injected service only',
    'No real persistence',
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

  for (const file of [ADAPTER_FILE, UNIT_TEST_FILE, BOUNDARY_TEST_FILE]) {
    assert.match(doc, new RegExp(file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});
