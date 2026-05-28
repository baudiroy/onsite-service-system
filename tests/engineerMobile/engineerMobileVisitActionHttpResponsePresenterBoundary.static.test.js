'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const PRESENTER_FILE = 'src/engineerMobile/engineerMobileVisitActionHttpResponsePresenter.js';
const HANDLER_FILE = 'src/engineerMobile/engineerMobileVisitActionHttpHandlerAdapter.js';
const PRESENTER_UNIT_TEST_FILE = 'tests/engineerMobile/engineerMobileVisitActionHttpResponsePresenter.unit.test.js';
const PRESENTER_BOUNDARY_TEST_FILE = 'tests/engineerMobile/engineerMobileVisitActionHttpResponsePresenterBoundary.static.test.js';
const HANDLER_UNIT_TEST_FILE = 'tests/engineerMobile/engineerMobileVisitActionHttpHandlerAdapter.unit.test.js';
const TASK_DOC = 'docs/task-1856-engineer-mobile-visit-action-http-response-presenter-no-route.md';
const TASK1858_DOC = 'docs/task-1858-engineer-mobile-http-handler-service-failure-guard-no-route.md';

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

test('Task1856 allowed files exist', () => {
  for (const file of [
    PRESENTER_FILE,
    HANDLER_FILE,
    PRESENTER_UNIT_TEST_FILE,
    PRESENTER_BOUNDARY_TEST_FILE,
    HANDLER_UNIT_TEST_FILE,
    TASK_DOC,
    TASK1858_DOC,
  ]) {
    assert.equal(fs.existsSync(absolutePath(file)), true, `${file} should exist`);
  }
});

test('HTTP response presenter has no imports', () => {
  const source = read(PRESENTER_FILE);

  assert.deepEqual(requireSpecifiers(source), []);
});

test('HTTP handler adapter imports only accepted normalizer and presenter modules', () => {
  const source = read(HANDLER_FILE);

  assert.deepEqual(requireSpecifiers(source), []);
  assert.match(
    source,
    /const HTTP_REQUEST_NORMALIZER_MODULE = '\.\/engineerMobileVisitActionHttpRequestNormalizer';/,
  );
  assert.match(source, /require\(HTTP_REQUEST_NORMALIZER_MODULE\)/);
  assert.match(
    source,
    /const HTTP_RESPONSE_PRESENTER_MODULE = '\.\/engineerMobileVisitActionHttpResponsePresenter';/,
  );
  assert.match(source, /require\(HTTP_RESPONSE_PRESENTER_MODULE\)/);

  for (const pattern of [
    /require\(['"].*VisitActionApplicationService['"]\)/,
    /engineerMobileVisitActionApplicationService/,
    /createEngineerMobileVisitActionApplicationService/,
  ]) {
    assert.doesNotMatch(source, pattern, `adapter contains forbidden service construction ${pattern}`);
  }
});

test('presenter and handler stay isolated from forbidden runtimes', () => {
  const source = `${read(PRESENTER_FILE)}\n${read(HANDLER_FILE)}`;

  for (const pattern of [
    /\bpg\b/i,
    /\bpool\b/i,
    /DATABASE_URL/,
    /process\.env/,
    /\bexpress\b/i,
    /\bRouter\b/,
    /\bapp\./,
    /\blisten\b/,
    /repository\.query/,
    /db\.query/,
    /client\.query/,
    /pool\.query/,
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

test('presenter and handler do not execute route provider persistence or provider calls', () => {
  const source = `${read(PRESENTER_FILE)}\n${read(HANDLER_FILE)}`;

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
    /\bres\.status\s*\(/,
    /\bres\.json\s*\(/,
    /\bwriteHead\s*\(/,
  ]) {
    assert.doesNotMatch(source, pattern, `source contains forbidden behavior ${pattern}`);
  }
});

test('Task1856 doc records required response presenter boundaries and future sequence', () => {
  const doc = read(TASK_DOC);

  for (const phrase of [
    'Purpose',
    'HTTP response presenter',
    'request normalizer',
    'injected HTTP handler adapter',
    'Synthetic HTTP-style response only',
    'No route registration',
    'No global mount',
    'No Express import',
    'Status-code mapping',
    'Sanitized response field allowlist',
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
    'keep handler normalizer/presenter tests green',
    'create real route/controller only after separate approval',
    'global route/mount only after separate approval',
    'real DB persistence only after approved DB dry-run and repository implementation',
  ]) {
    assert.match(doc, escaped(phrase));
  }

  for (const file of [
    PRESENTER_FILE,
    HANDLER_FILE,
    PRESENTER_UNIT_TEST_FILE,
    PRESENTER_BOUNDARY_TEST_FILE,
    HANDLER_UNIT_TEST_FILE,
  ]) {
    assert.match(doc, escaped(file));
  }
});

test('Task1858 doc records service failure guard boundaries', () => {
  const doc = read(TASK1858_DOC);

  for (const phrase of [
    'Purpose',
    'service failure guard',
    'request normalizer',
    'response presenter',
    'injected HTTP handler adapter',
    'Synthetic HTTP-style failure handling only',
    'service_invocation_failed',
    'HTTP 500',
    'Raw service errors and stacks must never be exposed',
    'No DB',
    'No SQL',
    'No migration',
    'No route registration',
    'No global mount',
    'No Express import',
    'No repository import',
    'No DB client import',
    'No real persistence',
    'No provider sending',
    'No completion report creation',
    'No completion report approval',
    'No completion report publication',
    'No finalAppointmentId mutation',
    'No customer-visible publication',
    'Future real route/controller/global mount still requires separate approval',
  ]) {
    assert.match(doc, escaped(phrase));
  }
});
