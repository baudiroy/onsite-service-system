const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '../..');

const TASK900_TO_902_FILES = [
  'src/dataCorrection/dataCorrectionDecisionAuditWriterResultNormalizer.js',
  'src/dataCorrection/dataCorrectionDecisionAuditWriterInvocation.js',
  'tests/dataCorrection/dataCorrectionDecisionAuditWriterResultNormalizer.unit.test.js',
  'tests/dataCorrection/dataCorrectionDecisionAuditWriterResultNormalizerClosure.static.test.js',
  'tests/dataCorrection/dataCorrectionDecisionAuditWriterInvocation.unit.test.js',
  'tests/dataCorrection/dataCorrectionDecisionAuditWriterInvocationClosure.static.test.js',
  'docs/task-900-data-correction-decision-audit-writer-result-normalizer-no-db-no-api-shape-change.md',
  'docs/task-901-data-correction-decision-audit-writer-result-normalizer-closure-guard-no-db-no-api-shape-change.md',
  'docs/task-902-data-correction-decision-audit-writer-invocation-boundary-helper-no-db-no-api-shape-change.md',
];

const TASK903_FILES = [
  'src/dataCorrection/dataCorrectionDecisionAuditWriterInputBuilder.js',
  'src/dataCorrection/dataCorrectionDecisionAuditWriterInvocation.js',
  'tests/dataCorrection/dataCorrectionDecisionAuditWriterInputBuilder.unit.test.js',
  'tests/dataCorrection/dataCorrectionDecisionAuditWriterInputBuilderClosure.static.test.js',
  'tests/dataCorrection/dataCorrectionDecisionAuditWriterInvocation.unit.test.js',
  'tests/dataCorrection/dataCorrectionDecisionAuditWriterInvocationClosure.static.test.js',
  'tests/dataCorrection/dataCorrectionSourceBoundary.static.test.js',
  'docs/task-903-data-correction-decision-audit-writer-input-builder-sensitive-field-exclusion-no-db-no-api-shape-change.md',
];

const TASK904_FILES = [
  'tests/dataCorrection/dataCorrectionDecisionAuditSanitizedInvocationMatrix.unit.test.js',
  'tests/dataCorrection/dataCorrectionDecisionAuditSanitizedInvocationMatrixClosure.static.test.js',
  'docs/task-904-data-correction-decision-audit-writer-sanitized-invocation-matrix-no-db-no-api-shape-change.md',
];

const TASK905_FILES = [
  'tests/dataCorrection/dataCorrectionDecisionAuditWriterBranchClosure.static.test.js',
  'docs/task-905-data-correction-decision-audit-writer-branch-closure-guard-no-db-no-api-shape-change.md',
];

const TASK906_FILES = [
  'tests/dataCorrection/dataCorrectionDecisionAuditWriterFinalPatchInclusion.static.test.js',
  'docs/task-906-data-correction-decision-audit-writer-final-patch-inclusion-closure-no-runtime-change.md',
];

const FINAL_PATCH_CANDIDATE_FILES = [
  ...TASK903_FILES,
  ...TASK904_FILES,
  ...TASK905_FILES,
  ...TASK906_FILES,
];

const ALL_BRANCH_ARTIFACTS = [
  ...TASK900_TO_902_FILES,
  ...FINAL_PATCH_CANDIDATE_FILES,
];

const TASK906_DOC =
  'docs/task-906-data-correction-decision-audit-writer-final-patch-inclusion-closure-no-runtime-change.md';

const FORBIDDEN_FINAL_PATCH_PATHS = [
  'admin/src/',
  'migrations/',
  'scripts/smoke/',
  'src/routes/',
  'src/controllers/',
  'src/app.js',
  'src/server.js',
  'package.json',
  '.env',
];

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(path.join(ROOT, relativePath));
}

function unique(values) {
  return Array.from(new Set(values));
}

function gitStatusFor(relativePath) {
  try {
    return execFileSync('git', ['status', '--short', '--', relativePath], {
      cwd: ROOT,
      encoding: 'utf8',
    }).trim();
  } catch (error) {
    assert.fail(`git status failed for ${relativePath}: ${error.message}`);
  }
}

test('all Task900 through Task906 decision audit writer branch artifacts exist', () => {
  for (const relativePath of unique(ALL_BRANCH_ARTIFACTS)) {
    assert.equal(exists(relativePath), true, `${relativePath} should exist`);
  }
});

test('Task903 through Task906 final patch candidate files are visible to git status or already tracked', () => {
  for (const relativePath of unique(FINAL_PATCH_CANDIDATE_FILES)) {
    assert.equal(exists(relativePath), true, `${relativePath} should exist`);

    const status = gitStatusFor(relativePath);
    const tracked = execFileSync('git', ['ls-files', '--', relativePath], {
      cwd: ROOT,
      encoding: 'utf8',
    }).trim();

    assert.ok(
      status || tracked,
      `${relativePath} should be either tracked or visible in git status`,
    );
  }
});

test('Task906 final inclusion document lists every Task903 through Task906 candidate file', () => {
  const doc = read(TASK906_DOC);

  for (const relativePath of unique(FINAL_PATCH_CANDIDATE_FILES)) {
    assert.match(doc, new RegExp(relativePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('Task906 final inclusion document explicitly separates unrelated dirty work from this branch', () => {
  const doc = read(TASK906_DOC);

  assert.match(doc, /broadly dirty/i);
  assert.match(doc, /not claimed as Task906/i);
  assert.match(doc, /not staged/i);
  assert.match(doc, /final patch candidate/i);
});

test('Task906 does not add runtime production source or forbidden path claims', () => {
  const doc = read(TASK906_DOC);

  assert.match(doc, /No production source file was modified/i);
  assert.match(doc, /No runtime behavior change/i);
  assert.match(doc, /No DB/i);
  assert.match(doc, /No migration/i);
  assert.match(doc, /No API shape change/i);
  assert.match(doc, /No provider/i);
  assert.match(doc, /No AI\/RAG/i);
  assert.match(doc, /No billing\/settlement/i);
  assert.match(doc, /No smoke\/shared runtime/i);

  for (const forbiddenPath of FORBIDDEN_FINAL_PATCH_PATHS) {
    assert.doesNotMatch(
      TASK906_FILES.join('\n'),
      new RegExp(forbiddenPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    );
  }
});

test('active service path remains injected-only and does not wire repository-backed audit writer', () => {
  const requestService = read('src/dataCorrection/dataCorrectionRequestService.js');
  const applyService = read('src/dataCorrection/preDepartureCorrectionApplicationService.js');
  const activeServiceSource = `${requestService}\n${applyService}`;

  assert.match(activeServiceSource, /decisionAuditWriter/);
  assert.doesNotMatch(activeServiceSource, /createDataCorrectionDecisionAuditWriter/);
  assert.doesNotMatch(activeServiceSource, /dataCorrectionDecisionAuditRepository/);
  assert.doesNotMatch(activeServiceSource, /defaultDecisionAuditWriter/);
  assert.doesNotMatch(activeServiceSource, /\bpool\.query\b|\bclient\.query\b|\bBEGIN\b|\bCOMMIT\b|\bROLLBACK\b/);
});

test('Task906 static test stays administrative and does not inspect secrets or call external systems', () => {
  const source = read('tests/dataCorrection/dataCorrectionDecisionAuditWriterFinalPatchInclusion.static.test.js');
  const requireTargets = Array.from(source.matchAll(/require\('([^']+)'\)/g)).map((match) => match[1]);

  assert.doesNotMatch(source, /process\.env/);
  assert.deepEqual(requireTargets.sort(), [
    'node:assert/strict',
    'node:child_process',
    'node:fs',
    'node:path',
    'node:test',
  ]);
  assert.match(source, /execFileSync\('git'/);
});
