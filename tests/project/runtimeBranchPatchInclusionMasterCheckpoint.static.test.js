'use strict';

const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const DATA_CORRECTION_FILES = [
  'src/dataCorrection/dataCorrectionDecisionAuditWriterInputBuilder.js',
  'src/dataCorrection/dataCorrectionDecisionAuditWriterInvocation.js',
  'tests/dataCorrection/dataCorrectionDecisionAuditWriterInputBuilder.unit.test.js',
  'tests/dataCorrection/dataCorrectionDecisionAuditWriterInputBuilderClosure.static.test.js',
  'tests/dataCorrection/dataCorrectionDecisionAuditWriterInvocation.unit.test.js',
  'tests/dataCorrection/dataCorrectionDecisionAuditWriterInvocationClosure.static.test.js',
  'tests/dataCorrection/dataCorrectionDecisionAuditSanitizedInvocationMatrix.unit.test.js',
  'tests/dataCorrection/dataCorrectionDecisionAuditSanitizedInvocationMatrixClosure.static.test.js',
  'tests/dataCorrection/dataCorrectionDecisionAuditWriterBranchClosure.static.test.js',
  'tests/dataCorrection/dataCorrectionDecisionAuditWriterFinalPatchInclusion.static.test.js',
  'docs/task-903-data-correction-decision-audit-writer-input-builder-sensitive-field-exclusion-no-db-no-api-shape-change.md',
  'docs/task-904-data-correction-decision-audit-writer-sanitized-invocation-matrix-no-db-no-api-shape-change.md',
  'docs/task-905-data-correction-decision-audit-writer-branch-closure-guard-no-db-no-api-shape-change.md',
  'docs/task-906-data-correction-decision-audit-writer-final-patch-inclusion-closure-no-runtime-change.md',
];

const AI_PROVIDER_ABSTRACTION_FILES = [
  'docs/PROJECT_GUARDRAILS.md',
  'docs/design/ai-assistance-layer.md',
  'tests/ai/aiProviderAbstractionGuardrail.static.test.js',
  'docs/task-907-ai-provider-abstraction-guardrail-sync-no-runtime-change.md',
];

const CUSTOMER_ACCESS_FILES = [
  'src/customerAccess/customerServiceReportProjectionService.js',
  'src/customerAccess/customerServiceReportProjectionHandler.js',
  'src/customerAccess/customerAccessRequestContextResolver.js',
  'tests/customerAccess/customerServiceReportProjectionService.unit.test.js',
  'tests/customerAccess/customerServiceReportProjectionServiceClosure.static.test.js',
  'tests/customerAccess/customerServiceReportProjectionHandler.http-behavior.unit.test.js',
  'tests/customerAccess/customerServiceReportProjectionHandlerClosure.static.test.js',
  'tests/customerAccess/customerServiceReportProjectionBranchClosure.static.test.js',
  'tests/customerAccess/customerAccessRequestContextResolver.unit.test.js',
  'tests/customerAccess/customerAccessRequestContextResolverClosure.static.test.js',
  'tests/customerAccess/customerAccessProjectionContextBranchClosure.static.test.js',
  'docs/task-908-customer-access-read-only-service-report-projection-injected-db-client-no-route-no-migration.md',
  'docs/task-909-customer-access-service-report-projection-http-handler-injected-db-client-no-listen-no-real-db.md',
  'docs/task-910-customer-access-service-report-projection-branch-closure-patch-inclusion-no-runtime-change.md',
  'docs/task-911-customer-access-request-context-resolver-synthetic-token-context-no-auth-runtime-no-route.md',
  'docs/task-912-customer-access-context-resolver-projection-branch-closure-patch-inclusion-no-runtime-change.md',
];

const TASK913_FILES = [
  'docs/task-913-runtime-branch-patch-inclusion-master-checkpoint-no-runtime-change.md',
  'tests/project/runtimeBranchPatchInclusionMasterCheckpoint.static.test.js',
];

const PATCH_CANDIDATE_FILES = [
  ...DATA_CORRECTION_FILES,
  ...AI_PROVIDER_ABSTRACTION_FILES,
  ...CUSTOMER_ACCESS_FILES,
];

const ACTIVE_PATCH_CANDIDATE_FILES = [
  ...AI_PROVIDER_ABSTRACTION_FILES,
];

const PREVIOUSLY_COMMITTED_PATCH_CANDIDATE_FILES = [
  ...DATA_CORRECTION_FILES,
  ...CUSTOMER_ACCESS_FILES,
];

const ALL_LISTED_FILES = [
  ...PATCH_CANDIDATE_FILES,
  ...TASK913_FILES,
];

const TASK913_DOC = TASK913_FILES[0];

function absolutePath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(absolutePath(relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(absolutePath(relativePath));
}

function escaped(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function gitStatusFor(files) {
  const output = execFileSync('git', ['status', '--short', '--', ...files], {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  return output
    .split('\n')
    .map((line) => line.trimEnd())
    .filter(Boolean);
}

function pathFromStatusLine(line) {
  return line.slice(3);
}

test('Task903 through Task913 checkpoint files are present', () => {
  for (const file of ALL_LISTED_FILES) {
    assert.equal(exists(file), true, `${file} should exist`);
  }
});

test('Task913 document lists all final patch candidates', () => {
  const doc = read(TASK913_DOC);

  for (const file of PATCH_CANDIDATE_FILES) {
    assert.match(doc, new RegExp(escaped(file)), `${file} should be listed in Task913 doc`);
  }

  for (const heading of [
    'Data Correction Task903-Task906',
    'AI Provider Abstraction Task907',
    'Customer Access Task908-Task912',
  ]) {
    assert.match(doc, new RegExp(escaped(heading)));
  }
});

test('Task913 document records current git status for every checkpoint target', () => {
  const doc = read(TASK913_DOC);
  const statusLines = gitStatusFor(ACTIVE_PATCH_CANDIDATE_FILES);
  const statusPaths = statusLines.map(pathFromStatusLine);

  assert.ok(statusPaths.length > 0, 'at least one active checkpoint target should remain');

  for (const file of statusPaths) {
    assert.ok(
      ACTIVE_PATCH_CANDIDATE_FILES.includes(file),
      `${file} should be an active checkpoint target`,
    );
    assert.match(doc, new RegExp(escaped(file)), `Task913 doc should record ${file}`);
  }

  assert.equal(
    gitStatusFor(PREVIOUSLY_COMMITTED_PATCH_CANDIDATE_FILES).length,
    0,
    'previously committed checkpoint candidates should no longer appear as active status lines',
  );

  assert.match(doc, /local \/ uncommitted \/ untracked/);
  assert.match(doc, /unrelated dirty work is not claimed/i);
  assert.match(doc, /does not authorize staging or commit/i);
});

test('Task913 remains no-runtime and does not authorize expansion', () => {
  const doc = read(TASK913_DOC);

  for (const phrase of [
    'No production runtime files are modified',
    'No DB',
    'No migration',
    'No route',
    'No listen',
    'No public API rollout',
    'No auth/session/JWT runtime',
    'No provider',
    'No AI/RAG runtime',
    'No billing/settlement',
    'No smoke/shared runtime',
  ]) {
    assert.match(doc, new RegExp(escaped(phrase), 'i'));
  }
});
