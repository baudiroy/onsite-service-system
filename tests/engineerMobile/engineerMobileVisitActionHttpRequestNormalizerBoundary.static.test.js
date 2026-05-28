'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const NORMALIZER_FILE = 'src/engineerMobile/engineerMobileVisitActionHttpRequestNormalizer.js';
const ADAPTER_FILE = 'src/engineerMobile/engineerMobileVisitActionHttpHandlerAdapter.js';
const NORMALIZER_UNIT_TEST_FILE = 'tests/engineerMobile/engineerMobileVisitActionHttpRequestNormalizer.unit.test.js';
const NORMALIZER_BOUNDARY_TEST_FILE = 'tests/engineerMobile/engineerMobileVisitActionHttpRequestNormalizerBoundary.static.test.js';
const HANDLER_UNIT_TEST_FILE = 'tests/engineerMobile/engineerMobileVisitActionHttpHandlerAdapter.unit.test.js';
const TASK_DOC = 'docs/task-1854-engineer-mobile-visit-action-http-request-normalizer-no-route.md';

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

function escaped(phrase) {
  return new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
}

test('Task1854 allowed files exist', () => {
  for (const file of [
    NORMALIZER_FILE,
    ADAPTER_FILE,
    NORMALIZER_UNIT_TEST_FILE,
    NORMALIZER_BOUNDARY_TEST_FILE,
    HANDLER_UNIT_TEST_FILE,
    TASK_DOC,
  ]) {
    assert.equal(fs.existsSync(absolutePath(file)), true, `${file} should exist`);
  }
});

test('HTTP request normalizer has no imports', () => {
  const source = read(NORMALIZER_FILE);

  assert.deepEqual(requireSpecifiers(source), []);
});

test('HTTP handler adapter imports only the accepted request normalizer module', () => {
  const source = read(ADAPTER_FILE);

  assert.deepEqual(requireSpecifiers(source), []);
  assert.match(
    source,
    /const HTTP_REQUEST_NORMALIZER_MODULE = '\.\/engineerMobileVisitActionHttpRequestNormalizer';/,
  );
  assert.match(source, /require\(HTTP_REQUEST_NORMALIZER_MODULE\)/);

  for (const pattern of [
    /require\(['"].*VisitActionApplicationService['"]\)/,
    /engineerMobileVisitActionApplicationService/,
    /createEngineerMobileVisitActionApplicationService/,
  ]) {
    assert.doesNotMatch(source, pattern, `adapter contains forbidden service construction ${pattern}`);
  }
});

test('normalizer and handler stay isolated from forbidden runtimes', () => {
  const source = `${read(NORMALIZER_FILE)}\n${read(ADAPTER_FILE)}`;

  for (const pattern of [
    /\bpg\b/i,
    /\bpool\b/i,
    /DATABASE_URL/,
    /process\.env/,
    /\bexpress\b/i,
    /\bRouter\b/,
    /\bapp\./,
    /\blisten\b/,
    /\brepository\b/i,
    /\bRepository\b/,
    /db:migrate/i,
    /\bpsql\b/i,
    /\bSELECT\b/,
    /\bUPDATE\s+/,
    /\bINSERT\s+/,
    /\bDELETE\s+/,
    /\bCREATE\s+TABLE\b/i,
    /\bALTER\s+TABLE\b/i,
    /\bDROP\s+TABLE\b/i,
    /\bline\b/i,
    /\bsms\b/i,
    /\bemail\b/i,
    /\bwebhook\b/i,
    /\bai\b/i,
    /\brag\b/i,
    /\bbilling\b/i,
    /\bsettlement\b/i,
    /createCompletionReport/,
    /completionReportRepository/,
    /fieldServiceReport/,
    /\bpublish\b/i,
    /\bapprove\b/i,
    /finalAppointmentId\s*=/,
    /finalAppointmentId\s*:/,
    /Date\.now/,
    /new Date/,
    /\bfs\b/,
    /\baxios\b/,
    /\bfetch\b/,
    /src\/app/,
    /src\/server/,
    /routes\/index/,
  ]) {
    assert.doesNotMatch(source, pattern, `source contains forbidden pattern ${pattern}`);
  }
});

test('normalizer and handler do not execute route provider persistence or provider calls', () => {
  const source = `${read(NORMALIZER_FILE)}\n${read(ADAPTER_FILE)}`;

  for (const pattern of [
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
    assert.doesNotMatch(source, pattern, `source contains forbidden behavior ${pattern}`);
  }
});

test('Task1854 doc records required request normalizer boundaries and future sequence', () => {
  const doc = read(TASK_DOC);

  for (const phrase of [
    'Purpose',
    'HTTP request normalizer',
    'injected HTTP handler adapter',
    'Synthetic request only',
    'No route registration',
    'No global mount',
    'No Express import',
    'Sanitized request field allowlist',
    'Appointment ID mismatch',
    'No DB',
    'No SQL',
    'No migration',
    'No repository import',
    'No DB client import',
    'No real persistence',
    'No provider sending',
    'No completion report creation',
    'No completion report approval',
    'No completion report publication',
    'No finalAppointmentId mutation',
    'No customer-visible publication',
    'keep handler/normalizer tests green',
    'real route/controller only after separate approval',
    'global route/mount only after separate approval',
    'real DB persistence only after approved DB dry-run and repository implementation',
  ]) {
    assert.match(doc, escaped(phrase));
  }

  for (const file of [
    NORMALIZER_FILE,
    ADAPTER_FILE,
    NORMALIZER_UNIT_TEST_FILE,
    NORMALIZER_BOUNDARY_TEST_FILE,
    HANDLER_UNIT_TEST_FILE,
  ]) {
    assert.match(doc, escaped(file));
  }
});
