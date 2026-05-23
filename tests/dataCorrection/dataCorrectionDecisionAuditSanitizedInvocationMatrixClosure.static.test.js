'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const FILES = Object.freeze({
  matrix: 'tests/dataCorrection/dataCorrectionDecisionAuditSanitizedInvocationMatrix.unit.test.js',
  closure: 'tests/dataCorrection/dataCorrectionDecisionAuditSanitizedInvocationMatrixClosure.static.test.js',
  builder: 'src/dataCorrection/dataCorrectionDecisionAuditWriterInputBuilder.js',
  helper: 'src/dataCorrection/dataCorrectionDecisionAuditWriterInvocation.js',
  requestService: 'src/dataCorrection/dataCorrectionRequestService.js',
  applyService: 'src/dataCorrection/preDepartureCorrectionApplicationService.js',
  task903Doc: 'docs/task-903-data-correction-decision-audit-writer-input-builder-sensitive-field-exclusion-no-db-no-api-shape-change.md',
  task904Doc: 'docs/task-904-data-correction-decision-audit-writer-sanitized-invocation-matrix-no-db-no-api-shape-change.md',
});

function filePath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(filePath(relativePath), 'utf8');
}

function requireSpecifiers(source) {
  const specifiers = [];
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
  let match;

  while ((match = requireRegex.exec(source)) !== null) {
    specifiers.push(match[1]);
  }

  return specifiers.sort();
}

test('Task904 evidence and Task903 prerequisite files exist', () => {
  Object.values(FILES).forEach((relativePath) => {
    assert.equal(fs.existsSync(filePath(relativePath)), true, `${relativePath} is missing`);
  });
});

test('sanitized invocation matrix imports only services, safe constants, and node test helpers', () => {
  assert.deepEqual(requireSpecifiers(read(FILES.matrix)), [
    '../../src/dataCorrection/dataCorrectionDecisionAuditIntentBuilder',
    '../../src/dataCorrection/dataCorrectionPolicyEngine',
    '../../src/dataCorrection/dataCorrectionRequestService',
    '../../src/dataCorrection/preDepartureCorrectionApplicationService',
    'node:assert/strict',
    'node:test',
  ].sort());
});

test('sanitized invocation matrix and helper path import no forbidden runtime areas', () => {
  const forbiddenImportPattern = /(?:^|\/)(?:db|database|pool|pg|repositories?|providers?|routes?|controllers?|app|server|ai|rag|vector|billing|settlement|admin|config|logger|permission|migrations?|smoke)(?:\/|$)|transaction|line|sms|email|push|webhook|process\.env/i;

  [
    FILES.matrix,
    FILES.closure,
    FILES.builder,
    FILES.helper,
    FILES.requestService,
    FILES.applyService,
  ].forEach((relativePath) => {
    for (const specifier of requireSpecifiers(read(relativePath))) {
      assert.equal(
        forbiddenImportPattern.test(specifier),
        false,
        `${relativePath} imports forbidden dependency ${specifier}`,
      );
    }
  });
});

test('decision audit helper still depends only on builder and result normalizer', () => {
  assert.deepEqual(requireSpecifiers(read(FILES.helper)), [
    './dataCorrectionDecisionAuditWriterInputBuilder',
    './dataCorrectionDecisionAuditWriterResultNormalizer',
  ]);
});

test('request and apply services still delegate to the invocation helper without repository writer imports', () => {
  assert.deepEqual(requireSpecifiers(read(FILES.requestService)), [
    './dataCorrectionDecisionAuditIntentBuilder',
    './dataCorrectionDecisionAuditWriterInvocation',
    './dataCorrectionPolicyEngine',
  ]);
  assert.deepEqual(requireSpecifiers(read(FILES.applyService)), [
    './dataCorrectionDecisionAuditIntentBuilder',
    './dataCorrectionDecisionAuditWriterInvocation',
    './dataCorrectionPolicyEngine',
    './dataCorrectionRequestService',
  ]);

  [
    read(FILES.requestService),
    read(FILES.applyService),
  ].forEach((source) => {
    assert.match(source, /callInjectedDecisionAuditWriter/);
    assert.match(source, /callInjectedDecisionAuditWriterAsync/);
    assert.doesNotMatch(source, /dataCorrectionDecisionAuditRepository/);
    assert.doesNotMatch(source, /defaultDecisionAuditWriter/);
    assert.doesNotMatch(source, /process\.env|client\.query|pool\.query|INSERT\s+INTO|UPDATE\s+|DELETE\s+/i);
  });
});

test('Task904 documentation records no DB API migration provider AI billing or smoke scope', () => {
  const doc = read(FILES.task904Doc);

  [
    'No DB',
    'No migration',
    'No psql',
    'No DDL/SQL dry-run/apply',
    'No default writer',
    'No repository-backed audit writer',
    'No API shape change',
    'No admin/src',
    'No provider sending',
    'No AI/RAG',
    'No billing/settlement',
    'No smoke/shared runtime',
  ].forEach((needle) => {
    assert.match(doc, new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  });
});
