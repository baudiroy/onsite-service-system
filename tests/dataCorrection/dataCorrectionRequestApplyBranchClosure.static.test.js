'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const FILES = Object.freeze({
  closureDoc: 'docs/task-868-data-correction-request-apply-branch-closure-guard-no-new-runtime.md',
  requestService: 'src/dataCorrection/dataCorrectionRequestService.js',
  preDepartureService: 'src/dataCorrection/preDepartureCorrectionApplicationService.js',
  orchestrator: 'src/dataCorrection/dataCorrectionGovernanceOrchestrator.js',
});

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
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

test('Task868 closure doc exists and summarizes Tasks 845 through 867', () => {
  assert.equal(fs.existsSync(path.join(repoRoot, FILES.closureDoc)), true);
  const doc = read(FILES.closureDoc);

  for (let taskNumber = 845; taskNumber <= 867; taskNumber += 1) {
    assert.match(doc, new RegExp(`Task ${taskNumber}|Task${taskNumber}`), `missing Task ${taskNumber}`);
  }
});

test('request service remains writer-only and cannot invoke official correction application', () => {
  const source = read(FILES.requestService);

  assert.match(source, /options\.auditWriter/);
  assert.match(source, /options\.contactLogWriter/);
  assert.match(source, /options\.dispatchNoteWriter/);
  assert.doesNotMatch(source, /correctionWriter/);
  assert.doesNotMatch(source, /buildSafeCorrectionPayload/);
  assert.doesNotMatch(source, /correctionApplied\s*:\s*true/);
  assert.doesNotMatch(source, /writerResults\.correction\s*=/);
});

test('official correction application remains limited to pre-departure apply service', () => {
  const source = read(FILES.preDepartureService);

  assert.match(source, /function applyPreDepartureCorrection\(/);
  assert.match(source, /function applyPreDepartureCorrectionAsync\(/);
  assert.match(source, /isPreDepartureApplicationEligible\(decision, input\)/);
  assert.match(source, /writerResults\.correction\s*=\s*callInjectedWriter/);
  assert.match(source, /correctionApplied:\s*true/);
  assert.match(source, /correctionApplied:\s*false/);
  assert.match(source, /UNSAFE_CORRECTION_VALUE/);
});

test('pre-departure apply consults request policy with audit writer only before correction writer', () => {
  const source = read(FILES.preDepartureService);

  assert.match(source, /processDataCorrectionRequest\(input,\s*\{\s*auditWriter:\s*options\.auditWriter,\s*\}\)/);
  assert.doesNotMatch(source, /processDataCorrectionRequest\(input,\s*\{[\s\S]*contactLogWriter:/);
  assert.doesNotMatch(source, /processDataCorrectionRequest\(input,\s*\{[\s\S]*dispatchNoteWriter:/);
  assert.doesNotMatch(source, /processDataCorrectionRequest\(input,\s*\{[\s\S]*correctionWriter:/);
});

test('orchestrator keeps request and apply actions on separate service paths', () => {
  const source = read(FILES.orchestrator);

  assert.match(source, /DATA_CORRECTION_REQUEST:\s*'data_correction_request'/);
  assert.match(source, /PRE_DEPARTURE_APPLY:\s*'pre_departure_apply'/);
  assert.match(source, /case DATA_CORRECTION_GOVERNANCE_ACTIONS\.DATA_CORRECTION_REQUEST:\s*return processDataCorrectionRequest\(payload, options\);/);
  assert.match(source, /case DATA_CORRECTION_GOVERNANCE_ACTIONS\.PRE_DEPARTURE_APPLY:\s*return applyPreDepartureCorrection\(payload, options\);/);
  assert.match(source, /case DATA_CORRECTION_GOVERNANCE_ACTIONS\.DATA_CORRECTION_REQUEST:\s*return processDataCorrectionRequestAsync\(payload, options\);/);
  assert.match(source, /case DATA_CORRECTION_GOVERNANCE_ACTIONS\.PRE_DEPARTURE_APPLY:\s*return applyPreDepartureCorrectionAsync\(payload, options\);/);
});

test('data correction branch closure did not add forbidden runtime dependencies', () => {
  const checkedFiles = [
    FILES.requestService,
    FILES.preDepartureService,
    FILES.orchestrator,
  ];
  const forbiddenImportPattern = /(?:^|\/)(?:db|pool|repositories?|providers?|ai|rag|vector|billing|settlement|admin)(?:\/|$)|transaction|line|sms|email|push|provider/i;

  for (const relativePath of checkedFiles) {
    for (const specifier of requireSpecifiers(read(relativePath))) {
      assert.equal(
        forbiddenImportPattern.test(specifier),
        false,
        `${relativePath} imports forbidden dependency ${specifier}`,
      );
    }
  }
});

test('closure doc locks accepted non-goals and safety boundaries', () => {
  const doc = read(FILES.closureDoc);
  const requiredPhrases = [
    'no silent overwrite',
    'no finalAppointmentId mutation',
    'no raw sensitive output',
    'no manual fallback from failed apply',
    'no DB, migration, psql, DDL, or schema change',
    'no API shape expansion',
    'no real audit sink',
    'no admin frontend',
    'no provider, AI/RAG, billing, or settlement runtime',
    'request path never calls correctionWriter',
    'official correction application is limited to valid pre_departure_apply',
  ];

  for (const phrase of requiredPhrases) {
    assert.match(doc, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  }
});
