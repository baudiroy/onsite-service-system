'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const EVIDENCE_DOCS = Object.freeze([
  'docs/task-869-data-correction-decision-audit-intent-builder-no-audit-write-no-db.md',
  'docs/task-870-data-correction-decision-audit-intent-side-channel-no-audit-write-no-api-shape-change.md',
  'docs/task-871-data-correction-decision-audit-intent-side-channel-closure-guard-no-audit-write-no-api-shape-change.md',
  'docs/task-872-data-correction-decision-audit-persistence-readiness-packet-docs-only-no-runtime.md',
  'docs/task-873-data-correction-decision-audit-persistence-schema-proposal-no-migration-no-db.md',
  'docs/task-874-data-correction-decision-audit-persistence-migration-authorization-packet-no-migration-no-db.md',
  'docs/task-875-data-correction-decision-audit-migration-draft-plan-no-migration-no-db.md',
  'docs/task-876-data-correction-decision-audit-migration-file-creation-preflight-gate-no-migration-no-db.md',
  'docs/task-877-data-correction-decision-audit-events-migration-file-no-apply-no-db.md',
  'docs/task-878-data-correction-decision-audit-migration-025-disposable-db-dry-run-authorization-packet-no-db-execution.md',
  'docs/task-879-data-correction-decision-audit-migration-025-disposable-db-dry-run-result-template-no-db-execution.md',
  'docs/task-880-data-correction-decision-audit-persistence-no-db-branch-closure-checkpoint-no-runtime.md',
  'docs/task-881-pm-continuation-handoff-after-data-correction-decision-audit-no-db-closure-docs-only-no-runtime.md',
  'docs/task-882-data-correction-decision-audit-handoff-static-guard-docs-only-no-runtime.md',
  'docs/task-883-data-correction-decision-audit-branch-status-dashboard-docs-only-no-runtime.md',
  'docs/task-884-data-correction-decision-audit-repository-writer-implementation-preflight-no-runtime-no-db.md',
  'docs/task-885-data-correction-decision-audit-repository-writer-injected-db-unit-test-no-real-db-no-service-wiring.md',
  'docs/task-886-data-correction-decision-audit-repository-writer-closure-guard-no-service-wiring-no-real-db.md',
  'docs/task-887-data-correction-decision-audit-service-injected-writer-path-no-real-db-no-api-shape-change.md',
  'docs/task-888-data-correction-decision-audit-injected-writer-path-closure-guard-no-real-db-no-api-shape-change.md',
  'docs/task-889-data-correction-decision-audit-runtime-adjacent-writer-branch-closure-checkpoint-no-real-db-no-api-change.md',
  'docs/task-890-pm-continuation-handoff-after-data-correction-decision-audit-runtime-adjacent-closure-docs-only-no-runtime.md',
  'docs/task-891-data-correction-decision-audit-runtime-adjacent-handoff-static-guard-docs-only-no-runtime.md',
  'docs/task-892-pm-branch-dashboard-update-after-data-correction-decision-audit-handoff-guard-docs-only-no-runtime.md',
  'docs/task-893-data-correction-decision-audit-injected-writer-app-server-options-path-no-real-db-no-api-shape-change.md',
  'docs/task-894-data-correction-decision-audit-app-server-injected-writer-shortcut-closure-guard-no-real-db-no-api-shape-change.md',
]);

const EVIDENCE_TESTS = Object.freeze([
  'tests/dataCorrection/dataCorrectionDecisionAuditIntentBuilder.unit.test.js',
  'tests/dataCorrection/dataCorrectionDecisionAuditIntentSideChannel.unit.test.js',
  'tests/dataCorrection/dataCorrectionDecisionAuditIntentSideChannelClosure.static.test.js',
  'tests/dataCorrection/dataCorrectionDecisionAuditPersistenceSchemaProposal.static.test.js',
  'tests/dataCorrection/dataCorrectionDecisionAuditMigrationAuthorization.static.test.js',
  'tests/dataCorrection/dataCorrectionDecisionAuditMigrationDraftPlan.static.test.js',
  'tests/dataCorrection/dataCorrectionDecisionAuditMigrationFileCreationPreflight.static.test.js',
  'tests/dataCorrection/dataCorrectionDecisionAuditEventsMigration.static.test.js',
  'tests/dataCorrection/dataCorrectionDecisionAuditMigration025DryRunAuthorization.static.test.js',
  'tests/dataCorrection/dataCorrectionDecisionAuditMigration025DryRunResultTemplate.static.test.js',
  'tests/dataCorrection/dataCorrectionDecisionAuditPersistenceNoDbBranchClosure.static.test.js',
  'tests/dataCorrection/dataCorrectionDecisionAuditHandoff.static.test.js',
  'tests/dataCorrection/dataCorrectionDecisionAuditRuntimeAdjacentHandoff.static.test.js',
  'tests/dataCorrection/dataCorrectionDecisionAuditWriterImplementationPreflight.static.test.js',
  'tests/dataCorrection/dataCorrectionDecisionAuditWriter.unit.test.js',
  'tests/dataCorrection/dataCorrectionDecisionAuditWriterClosure.static.test.js',
  'tests/dataCorrection/dataCorrectionDecisionAuditInjectedWriter.unit.test.js',
  'tests/dataCorrection/dataCorrectionDecisionAuditInjectedWriterClosure.static.test.js',
  'tests/dataCorrection/dataCorrectionDecisionAuditRuntimeAdjacentWriterBranchClosure.static.test.js',
  'tests/dataCorrection/dataCorrectionDecisionAuditInjectedWriterAppServerOptions.unit.test.js',
  'tests/dataCorrection/dataCorrectionDecisionAuditAppServerShortcutClosure.static.test.js',
]);

const FILES = Object.freeze({
  checkpointDoc: 'docs/task-895-data-correction-decision-audit-runtime-adjacent-final-branch-checkpoint-no-runtime-no-db.md',
  migration025: 'migrations/025_create_data_correction_decision_audit_events.sql',
  repository: 'src/dataCorrection/dataCorrectionDecisionAuditRepository.js',
  writer: 'src/dataCorrection/dataCorrectionDecisionAuditWriter.js',
  requestService: 'src/dataCorrection/dataCorrectionRequestService.js',
  applyService: 'src/dataCorrection/preDepartureCorrectionApplicationService.js',
  route: 'src/routes/dataCorrectionRoutes.js',
  controller: 'src/controllers/dataCorrectionController.js',
  orchestrator: 'src/dataCorrection/dataCorrectionGovernanceOrchestrator.js',
  app: 'src/app.js',
  server: 'src/server.js',
});

const FORBIDDEN_DATA_NEEDLES = Object.freeze([
  'from value should not leak',
  'after value should not leak',
  '0912-345-678',
  'raw address should not leak',
  'LINE-RAW-USER-ID',
  'token-value',
  'secret-value',
  'postgres://unsafe',
  'Error: unsafe stack',
  'SELECT * FROM unsafe',
  'apt_final_unsafe_001',
  'fsr_unsafe_001',
  'report_unsafe_001',
  'internal note should not leak',
  'audit raw payload should not leak',
  'ai raw payload should not leak',
  'billing internal should not leak',
  'settlement internal should not leak',
  'full payload should not leak',
  'provider payload should not leak',
  'photo bytes should not leak',
  'signature bytes should not leak',
  'file contents should not leak',
  'fromValue',
  'toValue',
  'beforeValue',
  'afterValue',
  'rawCorrectionPayload',
  'rawPhone',
  'rawAddress',
  'rawLineUserId',
  'finalAppointmentId',
  'fieldServiceReportId',
  'reportId',
]);

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(path.join(repoRoot, relativePath));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function assertIncludesAll(source, phrases) {
  for (const phrase of phrases) {
    assert.match(source, new RegExp(escapeRegExp(phrase), 'i'), `missing phrase: ${phrase}`);
  }
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

test('Task869 through Task894 evidence docs tests and Migration 025 exist before final checkpoint', () => {
  [
    ...EVIDENCE_DOCS,
    ...EVIDENCE_TESTS,
    FILES.checkpointDoc,
    FILES.migration025,
  ].forEach((relativePath) => {
    assert.equal(exists(relativePath), true, `${relativePath} is missing`);
  });
});

test('Task895 checkpoint summarizes all decision-audit phases and closure boundaries', () => {
  const doc = read(FILES.checkpointDoc);

  assertIncludesAll(doc, [
    'Task869-871 - Audit Intent and Internal Side-channel',
    'Task872-880 - Persistence Readiness and Migration 025 No-DB Branch',
    'Task881-883 - PM Handoff and Dashboard',
    'Task884-886 - Injected Repository / Writer Unit Slice',
    'Task887-888 - Service-level Injected Writer Path',
    'Task889-894 - Runtime-adjacent Handoff, Dashboard, and App/Server Shortcut',
    'explicit-option only',
    'no default writer',
    'no real DB',
    'no API body change',
    'no correction behavior change',
  ]);
});

test('Migration 025 status remains no DB no dry-run no apply and explicitly not authorized', () => {
  const doc = read(FILES.checkpointDoc);
  const migration = read(FILES.migration025);

  assertIncludesAll(doc, [
    '`migrations/025_create_data_correction_decision_audit_events.sql` exists',
    'no DB connection',
    'no `psql`',
    'no `npm run db:migrate`',
    'no DDL execution',
    'no SQL execution',
    'no dry-run',
    'no apply',
    'no shared runtime / production / staging apply',
    'Generic phrases such as "continue", "go ahead", "approved", "I authorize", or "keep developing" are not enough',
  ]);

  [
    /authoring[- ]only/i,
    /not applied/i,
    /do not run/i,
  ].forEach((pattern) => {
    assert.equal(pattern.test(migration), true, `Migration 025 missing safety marker ${pattern}`);
  });
});

test('repository writer app and server stay injected-only without global DB default writer or direct audit sink', () => {
  const repository = read(FILES.repository);
  const writer = read(FILES.writer);
  const app = read(FILES.app);
  const server = read(FILES.server);
  const repositorySpecifiers = requireSpecifiers(repository);
  const writerSpecifiers = requireSpecifiers(writer);
  const appServerSpecifiers = [
    ...requireSpecifiers(app),
    ...requireSpecifiers(server),
  ].join('\n');

  assert.deepEqual(repositorySpecifiers, []);
  assert.deepEqual(writerSpecifiers, [
    './dataCorrectionDecisionAuditIntentBuilder',
    './dataCorrectionDecisionAuditRepository',
  ]);
  assert.equal(appServerSpecifiers.includes('dataCorrectionDecisionAuditRepository'), false);
  assert.equal(appServerSpecifiers.includes('dataCorrectionDecisionAuditWriter'), false);
  assert.match(app, /decisionAuditWriter:\s*options\[DATA_CORRECTION_APP_SHORTCUT_OPTION_KEY_MAP\.DECISION_AUDIT_WRITER\]/);
  assert.match(server, /decisionAuditWriter:\s*options\[DATA_CORRECTION_SERVER_SHORTCUT_OPTION_KEY_MAP\.DECISION_AUDIT_WRITER\]/);
  assert.deepEqual(app.match(/decisionAuditWriter:/g), ['decisionAuditWriter:']);
  assert.deepEqual(server.match(/decisionAuditWriter:/g), ['decisionAuditWriter:']);

  [
    repository,
    writer,
    app,
    server,
  ].forEach((source) => {
    [
      /new\s+Pool\s*\(/,
      /pool\.query\s*\(/,
      /client\.query\s*\(/,
      /db\.query\s*\(/,
      /process\.env\.[A-Z0-9_]*(?:DECISION|AUDIT|DATABASE|LINE|OPENAI|TOKEN|SECRET)[A-Z0-9_]*/,
      /createDataCorrectionDecisionAuditWriter\s*\(\s*\)/,
      /defaultDecisionAuditWriter/,
      /default\s+audit\s+writer/i,
      /fetch\s*\(/,
      /axios/,
    ].forEach((pattern) => {
      assert.equal(pattern.test(source), false, `unexpected runtime pattern ${pattern}`);
    });
  });
});

test('route controller and orchestrator keep public API body closed to audit side-channel fields', () => {
  [
    FILES.route,
    FILES.controller,
    FILES.orchestrator,
  ].forEach((relativePath) => {
    const source = read(relativePath);

    assert.equal(/auditIntent/.test(source), false, `${relativePath} exposes auditIntent`);
    assert.equal(/decisionAuditWriterResult/.test(source), false, `${relativePath} exposes decisionAuditWriterResult`);
  });
});

test('request and apply separation stays unchanged after final checkpoint', () => {
  const requestService = read(FILES.requestService);
  const applyService = read(FILES.applyService);
  const orchestrator = read(FILES.orchestrator);

  assert.match(requestService, /DATA_CORRECTION_REQUEST|data_correction_request|processDataCorrectionRequest/);
  assert.equal(/correctionWriter\s*\(/.test(requestService), false);
  assert.match(applyService, /PRE_DEPARTURE_APPLY|pre_departure_apply|applyPreDepartureCorrection/);
  assert.match(applyService, /correctionWriter/);
  assert.match(orchestrator, /processDataCorrectionRequest/);
  assert.match(orchestrator, /applyPreDepartureCorrection/);
});

test('final checkpoint doc preserves forbidden data and no-go runtime boundaries', () => {
  const doc = read(FILES.checkpointDoc);

  assertIncludesAll(doc, [
    'before / after values',
    'raw correction payload',
    'raw phone / mobile',
    'raw address',
    'raw LINE user id',
    'token / secret / DB URL',
    'stack / SQL',
    '`finalAppointmentId`',
    'Field Service Report id / report id',
    'internal note',
    'audit raw payload',
    'AI raw payload',
    'billing / settlement internals',
    'full payload',
    'provider payload',
    'files / photos / signatures / raw bytes',
    'DB connection',
    'Migration 025 dry-run or apply',
    'repository runtime promotion',
    'default audit writer configuration',
    'route/controller/DTO/public API body changes',
    'permission runtime expansion',
    'provider / LINE / SMS / App push / webhook / email runtime',
    'AI / RAG runtime',
    'billing / settlement runtime',
    'admin frontend',
    'package changes',
    'smoke / integration tests',
  ]);
});

test('evidence docs do not embed known fake unsafe values as approved persisted data examples', () => {
  const combinedDocs = [
    FILES.checkpointDoc,
    ...EVIDENCE_DOCS,
  ].map(read).join('\n');

  [
    /postgres(?:ql)?:\/\/[^\s"')]+/i,
    /LINE_CHANNEL_SECRET\s*=/i,
    /OPENAI_API_KEY\s*=/i,
  ].forEach((pattern) => {
    assert.equal(pattern.test(combinedDocs), false, `unsafe credential-like pattern found: ${pattern}`);
  });
});

test('Task895 guard itself stays static and imports no src migration provider or env runtime', () => {
  const source = read('tests/dataCorrection/dataCorrectionDecisionAuditFinalBranchCheckpoint.static.test.js');
  const specifiers = requireSpecifiers(source);

  assert.deepEqual(specifiers, [
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:test',
  ]);
  assert.equal(specifiers.some((specifier) => specifier.includes('/src/')), false);
  assert.equal(specifiers.some((specifier) => specifier.includes('/migrations/')), false);
  assert.equal(/process\.env/.test(source), false);
});
