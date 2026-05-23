'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  DATA_CORRECTION_DECISION_AUDIT_EVENT_COLUMNS,
} = require('../../src/dataCorrection/dataCorrectionDecisionAuditRepository');
const {
  CORRECTION_FIELD_GROUPS,
} = require('../../src/dataCorrection/dataCorrectionPolicyEngine');
const {
  processDataCorrectionRequest,
} = require('../../src/dataCorrection/dataCorrectionRequestService');
const {
  applyPreDepartureCorrection,
} = require('../../src/dataCorrection/preDepartureCorrectionApplicationService');

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
  'tests/dataCorrection/dataCorrectionDecisionAuditWriterImplementationPreflight.static.test.js',
  'tests/dataCorrection/dataCorrectionDecisionAuditWriter.unit.test.js',
  'tests/dataCorrection/dataCorrectionDecisionAuditWriterClosure.static.test.js',
  'tests/dataCorrection/dataCorrectionDecisionAuditInjectedWriter.unit.test.js',
  'tests/dataCorrection/dataCorrectionDecisionAuditInjectedWriterClosure.static.test.js',
]);

const FILES = Object.freeze({
  closureDoc: 'docs/task-889-data-correction-decision-audit-runtime-adjacent-writer-branch-closure-checkpoint-no-real-db-no-api-change.md',
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

const SAFE_COLUMNS = Object.freeze([
  'organization_id',
  'case_id',
  'appointment_id',
  'actor_id',
  'actor_role',
  'action',
  'field_key',
  'field_group',
  'event_type',
  'decision',
  'reason_code',
  'safe_message_key',
  'result_status',
  'request_id',
  'created_at',
  'retention_until',
  'deleted_at',
]);

const UNSAFE_NEEDLES = Object.freeze([
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
  'customer report should not leak',
  'file bytes should not leak',
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

function requireSpecifiers(source) {
  const specifiers = [];
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
  let match;

  while ((match = requireRegex.exec(source)) !== null) {
    specifiers.push(match[1]);
  }

  return specifiers.sort();
}

function assertIncludesAll(source, phrases) {
  for (const phrase of phrases) {
    assert.match(source, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), `missing phrase: ${phrase}`);
  }
}

function baseInput(overrides = {}) {
  return {
    organizationId: 'org_decision_branch_closure_001',
    timestamp: '2026-05-22T12:00:00.000Z',
    actor: {
      userId: 'user_decision_branch_closure_001',
      role: 'dispatch_assistant',
      permissions: ['data_correction.request', 'data_correction.apply'],
    },
    caseContext: {
      caseId: 'case_decision_branch_closure_001',
      organizationId: 'org_decision_branch_closure_001',
    },
    appointmentContext: {
      appointmentId: 'appt_decision_branch_closure_001',
      arrived: false,
      engineerDeparted: false,
      engineerReceivedTask: false,
      routeStarted: false,
    },
    correction: {
      fieldGroup: CORRECTION_FIELD_GROUPS.DISPATCH_OPERATIONAL,
      fieldKey: 'issueSummary',
      fromValue: 'from value should not leak',
      toValue: 'safe issue summary',
      beforeValue: 'from value should not leak',
      afterValue: 'after value should not leak',
      rawCorrectionPayload: 'raw correction payload should not leak',
      rawPhone: '0912-345-678',
      rawAddress: 'raw address should not leak',
      rawLineUserId: 'LINE-RAW-USER-ID',
      internalNote: 'internal note should not leak',
      auditRawPayload: 'audit raw payload should not leak',
      aiRawPayload: 'ai raw payload should not leak',
      billingInternalData: 'billing internal should not leak',
      settlementInternalData: 'settlement internal should not leak',
      finalAppointmentId: 'apt_final_unsafe_001',
      fieldServiceReportId: 'fsr_unsafe_001',
      reportId: 'report_unsafe_001',
    },
    fullPayload: 'full payload should not leak',
    providerPayload: 'provider payload should not leak',
    customerVisibleReportBody: 'customer report should not leak',
    token: 'token-value',
    secret: 'secret-value',
    dbUrl: 'postgres://unsafe',
    stack: 'Error: unsafe stack',
    rawSql: 'SELECT * FROM unsafe',
    ...overrides,
  };
}

function assertSafe(value) {
  const serialized = JSON.stringify(value);

  for (const needle of UNSAFE_NEEDLES) {
    assert.equal(serialized.includes(needle), false, `unexpected unsafe output: ${needle}`);
  }

  [
    /postgres(?:ql)?:\/\/[^\s"')]+/i,
    /Bearer\s+[A-Za-z0-9._-]+/i,
    /09\d{2}[-\s]?\d{3}[-\s]?\d{3}/,
    /SELECT\s+\*\s+FROM/i,
  ].forEach((pattern) => {
    assert.equal(pattern.test(serialized), false, `unsafe pattern leaked: ${pattern}`);
  });
}

test('Task869 through Task888 evidence docs and tests exist before branch closure', () => {
  [
    ...EVIDENCE_DOCS,
    ...EVIDENCE_TESTS,
    FILES.closureDoc,
    FILES.migration025,
  ].forEach((relativePath) => {
    assert.equal(exists(relativePath), true, `${relativePath} is missing`);
  });
});

test('Task889 closure doc summarizes Task869 through Task888 phases', () => {
  const doc = read(FILES.closureDoc);

  assertIncludesAll(doc, [
    'Task869 added a pure Data Correction decision `auditIntent` builder',
    'Task870 added an internal opt-in side-channel',
    'Task871 closed the auditIntent side-channel branch',
    'Task872 created the persistence readiness packet',
    'Task873 proposed a future safe persistence schema',
    'Task874 created the migration authorization packet',
    'Task875 created a non-executable migration draft plan',
    'Task876 created the migration file creation preflight gate',
    'Task877 created `migrations/025_create_data_correction_decision_audit_events.sql` only',
    'Task878 created the disposable DB dry-run authorization packet',
    'Task879 created the redacted future dry-run result template',
    'Task880 closed the no-DB persistence branch checkpoint',
    'Task881 created a PM continuation handoff',
    'Task882 added a handoff static guard',
    'Task883 added a branch status dashboard',
    'Task884 created the repository / writer implementation preflight',
    'Task885 added the injected-only repository / writer unit slice',
    'Task886 closed the repository / writer slice',
    'Task887 added the optional injected service writer path',
    'Task888 closed the injected service writer path',
  ]);
});

test('Migration 025 exists but remains no DB no psql no migrate no dry-run no apply', () => {
  const migration = read(FILES.migration025);
  const doc = read(FILES.closureDoc);

  assertIncludesAll(migration, [
    'MIGRATION FILE AUTHORING ONLY',
    'NOT APPLIED IN TASK 877',
    'APPLY OR DRY-RUN REQUIRES A SEPARATE TASK',
    'NO DB CONNECTION, PSQL, OR SQL EXECUTION IS AUTHORIZED BY THIS FILE',
  ]);
  assertIncludesAll(doc, [
    'no DB connection',
    'no `psql`',
    'no `npm run db:migrate`',
    'no DDL execution',
    'no SQL execution',
    'no dry-run',
    'no apply',
    'no migration modification in this task',
  ]);
});

test('Migration 025 safe columns remain metadata-only and exclude forbidden fields', () => {
  const migration = read(FILES.migration025);
  const tableBody = migration.match(/CREATE TABLE IF NOT EXISTS data_correction_decision_audit_events\s*\(([\s\S]*?)\n\);/i)[1].toLowerCase();

  assert.deepEqual(DATA_CORRECTION_DECISION_AUDIT_EVENT_COLUMNS, SAFE_COLUMNS);

  for (const column of SAFE_COLUMNS) {
    assert.match(tableBody, new RegExp(`\\b${column}\\b`), `missing safe column ${column}`);
  }

  [
    'before',
    'after',
    'raw_correction_payload',
    'raw_phone',
    'raw_address',
    'raw_line_user_id',
    'token',
    'secret',
    'db_url',
    'stack',
    'sql_input',
    'final_appointment_id',
    'field_service_report_id',
    'report_id',
    'internal_note',
    'audit_raw_payload',
    'ai_raw_payload',
    'billing_internal',
    'settlement_internal',
    'full_payload',
    'provider_payload',
    'customer_visible_report_body',
    'file_content',
    'photo',
    'signature',
  ].forEach((forbidden) => {
    assert.equal(tableBody.includes(forbidden), false, `forbidden migration table token: ${forbidden}`);
  });
});

test('repository and writer remain injected-only with no global DB or default writer promotion', () => {
  assert.deepEqual(requireSpecifiers(read(FILES.repository)), []);
  assert.deepEqual(requireSpecifiers(read(FILES.writer)), [
    './dataCorrectionDecisionAuditIntentBuilder',
    './dataCorrectionDecisionAuditRepository',
  ]);

  for (const file of [FILES.repository, FILES.writer]) {
    const source = read(file);

    [
      /process\.env.*DECISION/i,
      /new\s+Pool/,
      /pool\.query/,
      /client\.query/,
      /psql/i,
    ].forEach((pattern) => {
      assert.equal(pattern.test(source), false, `${file} matched forbidden pattern ${pattern}`);
    });
  }

  for (const file of [FILES.app, FILES.server]) {
    const source = read(file);

    [
      /createDataCorrectionDecisionAuditWriter\(/,
      /createDataCorrectionDecisionAuditRepository\(/,
      /dataCorrectionDecisionAuditRepository/,
      /process\.env.*DECISION/i,
      /new\s+Pool/,
      /pool\.query/,
      /client\.query/,
      /psql/i,
    ].forEach((pattern) => {
      assert.equal(pattern.test(source), false, `${file} matched forbidden pattern ${pattern}`);
    });
  }
});

test('service injected writer path remains opt-in and public/default response shape stays unchanged', () => {
  const requestDefault = processDataCorrectionRequest(baseInput());
  const requestOptIn = processDataCorrectionRequest(baseInput(), {
    includeDecisionAuditIntent: true,
  });
  const requestWithWriter = processDataCorrectionRequest(baseInput(), {
    decisionAuditWriter() {
      return { ok: true };
    },
  });
  const applyDefault = applyPreDepartureCorrection(baseInput(), {
    correctionWriter() {},
  });
  const applyOptIn = applyPreDepartureCorrection(baseInput(), {
    correctionWriter() {},
    includeDecisionAuditIntent: true,
  });

  assert.equal(requestDefault.auditIntent, undefined);
  assert.equal(requestDefault.response, undefined);
  assert.equal(requestDefault.decisionAuditWriterResult, undefined);
  assert.equal(requestWithWriter.auditIntent, undefined);
  assert.equal(requestWithWriter.response, undefined);
  assert.equal(requestWithWriter.decisionAuditWriterResult, undefined);
  assert.equal(applyDefault.auditIntent, undefined);
  assert.equal(applyDefault.response, undefined);
  assert.equal(applyDefault.decisionAuditWriterResult, undefined);

  assert.equal(requestOptIn.auditIntent.auditWritten, false);
  assert.equal(applyOptIn.auditIntent.auditWritten, false);
  assertSafe([requestDefault, requestOptIn, requestWithWriter, applyDefault, applyOptIn]);
});

test('public route controller and orchestrator do not expose auditIntent or decision writer side-channel', () => {
  for (const relativePath of [FILES.route, FILES.controller, FILES.orchestrator]) {
    const source = read(relativePath);

    [
      /auditIntent/,
      /includeDecisionAuditIntent/,
      /includeAuditIntent/,
      /decisionAuditWriter/,
      /dataCorrectionDecisionAuditIntentBuilder/,
      /dataCorrectionDecisionAuditWriter/,
      /dataCorrectionDecisionAuditRepository/,
    ].forEach((pattern) => {
      assert.equal(pattern.test(source), false, `${relativePath} matched forbidden pattern ${pattern}`);
    });
  }
});

test('request and apply separation remains unchanged after decision audit writer branch', () => {
  const postDepartureInput = baseInput({
    appointmentContext: {
      appointmentId: 'appt_decision_branch_closure_001',
      arrived: false,
      engineerDeparted: true,
      engineerReceivedTask: true,
      routeStarted: true,
    },
  });
  const request = processDataCorrectionRequest(postDepartureInput);
  const apply = applyPreDepartureCorrection(postDepartureInput, {
    correctionWriter() {
      throw new Error('correction writer should not be called');
    },
  });

  assert.equal(request.allowed, false);
  assert.equal(request.manualHandlingRequired, true);
  assert.equal(apply.status, 'blocked');
  assert.equal(apply.correctionApplied, false);
  assert.equal(apply.manualHandlingRequired, true);
  assertSafe([request, apply]);
});

test('closure doc keeps runtime API permission provider AI billing admin package and smoke boundaries closed', () => {
  const doc = read(FILES.closureDoc);

  assertIncludesAll(doc, [
    'real DB / repository runtime promotion',
    'Migration 025 dry-run or apply',
    'global DB connection',
    'default audit writer / sink',
    'route/controller/API body changes',
    'permission runtime expansion',
    'provider / LINE / SMS / App push / webhook / email runtime',
    'AI / RAG runtime',
    'billing / settlement runtime',
    'admin frontend',
    'package changes',
    'smoke / integration tests',
  ]);
});

test('closure doc lists forbidden data and future approval gates', () => {
  const doc = read(FILES.closureDoc);

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
    'customer-visible report body',
    'photos / signatures / files / file contents',
    'disposable local/test DB dry-run for Migration 025',
    'Migration 025 apply',
    'real repository DB adapter',
    'default audit writer configuration',
  ]);
});

test('Task889 static guard imports only test dependencies and existing safe modules', () => {
  assert.deepEqual(requireSpecifiers(fs.readFileSync(__filename, 'utf8')), [
    '../../src/dataCorrection/dataCorrectionDecisionAuditRepository',
    '../../src/dataCorrection/dataCorrectionPolicyEngine',
    '../../src/dataCorrection/dataCorrectionRequestService',
    '../../src/dataCorrection/preDepartureCorrectionApplicationService',
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:test',
  ].sort());
});
