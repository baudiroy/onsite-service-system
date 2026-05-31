'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const NORMALIZER_FILE = 'src/engineerMobile/engineerMobileVisitActionWriterResultNormalizer.js';
const SERVICE_FILE = 'src/engineerMobile/engineerMobileVisitActionApplicationService.js';
const NORMALIZER_UNIT_TEST_FILE = 'tests/engineerMobile/engineerMobileVisitActionWriterResultNormalizer.unit.test.js';
const SERVICE_UNIT_TEST_FILE = 'tests/engineerMobile/engineerMobileVisitActionApplicationService.unit.test.js';
const BOUNDARY_TEST_FILE = 'tests/engineerMobile/engineerMobileVisitActionWriterResultNormalizerBoundary.static.test.js';
const TASK_DOC = 'docs/task-1816-engineer-mobile-visit-action-writer-result-normalizer-no-behavior-change.md';

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

test('Task1816 allowed files exist', () => {
  for (const file of [
    NORMALIZER_FILE,
    SERVICE_FILE,
    NORMALIZER_UNIT_TEST_FILE,
    SERVICE_UNIT_TEST_FILE,
    BOUNDARY_TEST_FILE,
    TASK_DOC,
  ]) {
    assert.equal(fs.existsSync(absolutePath(file)), true, `${file} should exist`);
  }
});

test('writer result normalizer has no runtime imports', () => {
  const source = read(NORMALIZER_FILE);

  assert.deepEqual(requireSpecifiers(source), []);
});

test('application service imports only command planner and writer result normalizer', () => {
  const source = read(SERVICE_FILE);

  assert.deepEqual(requireSpecifiers(source), [
    './engineerMobileVisitActionCommandPlanner',
    './engineerMobileVisitActionWriterResultNormalizer',
  ]);
});

test('writer result normalizer and application service stay isolated from forbidden runtimes', () => {
  const source = `${read(NORMALIZER_FILE)}
${read(SERVICE_FILE)}`;

  for (const pattern of [
    /pg/i,
    /pool/i,
    /DATABASE_URL/,
    /process\.env/,
    /fs/,
    /path/,
    /http/i,
    /https/i,
    /fetch/,
    /express/i,
    /Router/,
    /app\./,
    /\.listen\s*\(/,
    /repository/i,
    /Repository/,
    /db:migrate/i,
    /psql/i,
    /line/i,
    /sms/i,
    /email/i,
    /webhook/i,
    /push/i,
    /ai/i,
    /rag/i,
    /billing/i,
    /settlement/i,
    /completionReport/i,
    /fieldServiceReport/i,
    /finalAppointmentId/,
    /Date\.now\s*\(/,
    /new Date\s*\(/,
    /setTimeout\s*\(/,
    /setInterval\s*\(/,
  ]) {
    assert.doesNotMatch(source, pattern, `source contains forbidden pattern ${pattern}`);
  }
});

test('application service normalizes both transition and audit writer results', () => {
  const source = read(SERVICE_FILE);

  assert.match(source, /function normalizeWriterResultForService\(writerKind, result\)/);
  assert.match(source, /normalizeEngineerMobileVisitActionWriterResult\(\{\s*writerKind,\s*result,/s);
  assert.match(source, /normalizeWriterResultForService\('transition', transitionResult\)/);
  assert.match(source, /normalizeWriterResultForService\('audit', auditResult\)/);
  assert.match(source, /function writerResultSucceeded\(normalizedWriterResult, writerKind\)/);
  assert.match(source, /transition_write_failed/);
  assert.match(source, /audit_write_failed/);
});

test('writer result normalizer output remains sanitized and synchronous', () => {
  const source = read(NORMALIZER_FILE);

  assert.doesNotMatch(source, /async\s+function/);
  assert.doesNotMatch(source, /Promise\./);
  assert.doesNotMatch(source, /await\s+/);
  assert.doesNotMatch(source, /stack/);
  assert.doesNotMatch(source, /sql/i);
  assert.doesNotMatch(source, /credential/i);
  assert.doesNotMatch(source, /providerPayload/);
  assert.doesNotMatch(source, /customerPhone/);
  assert.doesNotMatch(source, /reportDraft/);
});

test('Task1816 doc records required pure normalizer boundaries', () => {
  const doc = read(TASK_DOC);

  for (const phrase of [
    'No DB',
    'No migration',
    'No global mount',
    'No route registration',
    'No Express import',
    'Injected writers only',
    'No real persistence',
    'No repository import',
    'No provider sending',
    'No completion report creation',
    'No completion report approval',
    'No completion report publication',
    'No finalAppointmentId mutation',
    'No customer-visible publication',
    'No external behavior change',
  ]) {
    assert.equal(doc.includes(phrase), true, `doc should include ${phrase}`);
  }

  for (const file of [
    NORMALIZER_FILE,
    SERVICE_FILE,
    NORMALIZER_UNIT_TEST_FILE,
    SERVICE_UNIT_TEST_FILE,
    BOUNDARY_TEST_FILE,
  ]) {
    assert.equal(doc.includes(file), true, `doc should include ${file}`);
  }
});
