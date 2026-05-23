'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

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

const DOCS = Object.freeze([
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
]);

const TESTS = Object.freeze([
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
]);

const FILES = Object.freeze({
  migration025: 'migrations/025_create_data_correction_decision_audit_events.sql',
  requestService: 'src/dataCorrection/dataCorrectionRequestService.js',
  applyService: 'src/dataCorrection/preDepartureCorrectionApplicationService.js',
  route: 'src/routes/dataCorrectionRoutes.js',
  controller: 'src/controllers/dataCorrectionController.js',
  orchestrator: 'src/dataCorrection/dataCorrectionGovernanceOrchestrator.js',
  closureDoc: 'docs/task-880-data-correction-decision-audit-persistence-no-db-branch-closure-checkpoint-no-runtime.md',
});

const UNSAFE_NEEDLES = Object.freeze([
  'from value should not leak',
  'phone value should not leak',
  'address value should not leak',
  'LINE-RAW-USER-ID',
  'token-value',
  'secret-value',
  'db url should not leak',
  'Error: unsafe stack',
  'SELECT * FROM unsafe',
  'full payload should not leak',
  'internal note should not leak',
  'audit raw payload should not leak',
  'ai raw payload should not leak',
  'billing internal should not leak',
  'settlement internal should not leak',
  'apt_final_unsafe_001',
  'fromValue',
  'toValue',
  'rawPhone',
  'rawAddress',
  'finalAppointmentId',
]);

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(path.join(repoRoot, relativePath));
}

function assertIncludesAll(source, phrases) {
  for (const phrase of phrases) {
    assert.match(source, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), `missing phrase: ${phrase}`);
  }
}

function baseInput(overrides = {}) {
  return {
    organizationId: 'org_dc_no_db_branch_closure_001',
    timestamp: '2026-05-22T12:00:00.000Z',
    actor: {
      userId: 'user_dc_no_db_branch_closure_001',
      role: 'dispatch_assistant',
      permissions: ['data_correction.request', 'data_correction.apply'],
    },
    caseContext: {
      caseId: 'case_dc_no_db_branch_closure_001',
      organizationId: 'org_dc_no_db_branch_closure_001',
    },
    appointmentContext: {
      appointmentId: 'appt_dc_no_db_branch_closure_001',
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
      rawPhone: 'phone value should not leak',
      rawAddress: 'address value should not leak',
      rawLineUserId: 'LINE-RAW-USER-ID',
      internalNote: 'internal note should not leak',
      auditRawPayload: 'audit raw payload should not leak',
      aiRawPayload: 'ai raw payload should not leak',
      billingInternalData: 'billing internal should not leak',
      settlementInternalData: 'settlement internal should not leak',
      finalAppointmentId: 'apt_final_unsafe_001',
    },
    fullPayload: 'full payload should not leak',
    token: 'token-value',
    secret: 'secret-value',
    dbUrl: 'db url should not leak',
    stack: 'Error: unsafe stack',
    rawSql: 'SELECT * FROM unsafe',
    ...overrides,
  };
}

function assertNoUnsafeOutput(value) {
  const serialized = JSON.stringify(value);

  for (const needle of UNSAFE_NEEDLES) {
    assert.equal(serialized.includes(needle), false, `unexpected unsafe output: ${needle}`);
  }
}

test('Task869 through Task879 evidence docs and tests exist', () => {
  [...DOCS, ...TESTS, FILES.migration025, FILES.closureDoc].forEach((relativePath) => {
    assert.equal(exists(relativePath), true, `${relativePath} is missing`);
  });
});

test('closure doc summarizes audit intent side-channel and persistence no-DB branch', () => {
  const doc = read(FILES.closureDoc);

  assertIncludesAll(doc, [
    'Task869 added a pure Data Correction decision `auditIntent` builder',
    'Task870 added an internal opt-in side-channel',
    'Task871 closed the side-channel branch',
    'Task872 created the persistence readiness packet',
    'Task873 proposed the future safe schema',
    'Task874 created the migration authorization packet',
    'Task875 created the non-executable migration draft plan',
    'Task876 created the migration file creation preflight gate',
    'Task877 created `migrations/025_create_data_correction_decision_audit_events.sql` only',
    'Task878 created the disposable DB dry-run authorization packet',
    'Task879 created the redacted future dry-run result template',
  ]);
});

test('Migration 025 exists but remains explicitly no DB no dry-run no apply', () => {
  const migration = read(FILES.migration025);
  const branchDocs = [
    read('docs/task-877-data-correction-decision-audit-events-migration-file-no-apply-no-db.md'),
    read('docs/task-878-data-correction-decision-audit-migration-025-disposable-db-dry-run-authorization-packet-no-db-execution.md'),
    read('docs/task-879-data-correction-decision-audit-migration-025-disposable-db-dry-run-result-template-no-db-execution.md'),
    read(FILES.closureDoc),
  ].join('\n');

  assertIncludesAll(migration, [
    'NOT APPLIED IN TASK 877',
    'APPLY OR DRY-RUN REQUIRES A SEPARATE TASK',
    'NO DB CONNECTION, PSQL, OR SQL EXECUTION IS AUTHORIZED BY THIS FILE',
  ]);
  assertIncludesAll(branchDocs, [
    'no DB connection',
    'no `psql`',
    'no `npm run db:migrate`',
    'no DDL',
    'no SQL execution',
    'no dry-run',
    'no apply',
    'no migration 025 modification',
  ]);
});

test('closure doc keeps runtime API permission provider AI billing and smoke boundaries closed', () => {
  const doc = read(FILES.closureDoc);

  assertIncludesAll(doc, [
    'no repository',
    'no audit writer / sink',
    'no transaction wiring',
    'no route/controller/API change',
    'no public response body change',
    'no permission runtime change',
    'no provider / LINE / SMS / App push / webhook / email traffic',
    'no AI / RAG runtime',
    'no billing / settlement behavior',
    'no smoke/integration test',
    'no package change',
  ]);
});

test('default service response remains unchanged and auditIntent stays internal opt-in with auditWritten false', () => {
  const requestDefault = processDataCorrectionRequest(baseInput());
  const requestOptIn = processDataCorrectionRequest(baseInput(), {
    includeDecisionAuditIntent: true,
  });
  const applyDefault = applyPreDepartureCorrection(baseInput(), {
    correctionWriter() {},
  });
  const applyOptIn = applyPreDepartureCorrection(baseInput(), {
    correctionWriter() {},
    includeAuditIntent: true,
  });

  assert.equal(requestDefault.auditIntent, undefined);
  assert.equal(requestDefault.response, undefined);
  assert.equal(requestDefault.allowed, true);
  assert.equal(applyDefault.auditIntent, undefined);
  assert.equal(applyDefault.response, undefined);
  assert.equal(applyDefault.correctionApplied, true);

  assert.equal(requestOptIn.auditIntent.auditWritten, false);
  assert.equal(applyOptIn.auditIntent.auditWritten, false);
  assertNoUnsafeOutput([requestDefault, requestOptIn, applyDefault, applyOptIn]);
});

test('public route controller and orchestrator do not expose auditIntent side-channel options', () => {
  for (const relativePath of [FILES.route, FILES.controller, FILES.orchestrator]) {
    const source = read(relativePath);

    assert.doesNotMatch(source, /auditIntent/);
    assert.doesNotMatch(source, /includeDecisionAuditIntent/);
    assert.doesNotMatch(source, /includeAuditIntent/);
    assert.doesNotMatch(source, /dataCorrectionDecisionAuditIntentBuilder/);
  }
});

test('forbidden data remains excluded from migration table and branch docs', () => {
  const combined = [
    read(FILES.migration025),
    read(FILES.closureDoc),
  ].join('\n').toLowerCase();
  const migrationTableBody = read(FILES.migration025).match(/CREATE TABLE IF NOT EXISTS data_correction_decision_audit_events\s*\(([\s\S]*?)\n\);/i)[1].toLowerCase();

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
    assert.equal(migrationTableBody.includes(forbidden), false, `forbidden migration table token: ${forbidden}`);
  });

  assertIncludesAll(combined, [
    'before / after values',
    'raw correction payload',
    'raw phone / mobile',
    'raw address',
    'raw LINE user id',
    '`finalAppointmentId`',
    'Field Service Report id / report id',
    'audit raw payload',
    'AI raw payload',
    'billing / settlement internals',
    'full payload',
    'provider payload',
    'customer-visible report body',
    'file contents',
  ]);
});

test('request and apply separation remains documented and implemented', () => {
  const doc = read(FILES.closureDoc);
  const requestService = read(FILES.requestService);
  const applyService = read(FILES.applyService);

  assertIncludesAll(doc, [
    '`data_correction_request` remains a manual-handling / decision path',
    '`data_correction_request` must not create official correction applications',
    'official correction application remains limited to valid `pre_departure_apply`',
    'phone / LINE / App channel identity changes remain re-verification paths',
    'follow-up proposal remains a draft / proposal',
  ]);
  assert.doesNotMatch(requestService, /correctionWriter/);
  assert.match(applyService, /correctionWriter/);
});

test('closure checkpoint avoids real-looking database urls credentials and phone values', () => {
  const combined = [
    read(FILES.closureDoc),
    read(__filename.replace(`${repoRoot}${path.sep}`, '')),
  ].join('\n');

  [
    /postgres(?:ql)?:\/\/[^\s)]+/i,
    /mysql:\/\/[^\s)]+/i,
    /(?:^|[\s"'=])sk-[A-Za-z0-9_-]{20,}/,
    /[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
    /09\d{2}[-\s]?\d{3}[-\s]?\d{3}/,
    /Bearer\s+[A-Za-z0-9._-]+/i,
    /LINE(?:_|-)?ACCESS(?:_|-)?TOKEN\s*[:=]/i,
  ].forEach((pattern) => {
    assert.equal(pattern.test(combined), false, `unexpected sensitive-looking pattern: ${pattern}`);
  });
});

test('static test itself imports no non-local runtime side-effect modules', () => {
  const source = fs.readFileSync(__filename, 'utf8');
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
  const imports = [];
  let match;

  while ((match = requireRegex.exec(source)) !== null) {
    imports.push(match[1]);
  }

  assert.deepEqual(imports.sort(), [
    '../../src/dataCorrection/dataCorrectionPolicyEngine',
    '../../src/dataCorrection/dataCorrectionRequestService',
    '../../src/dataCorrection/preDepartureCorrectionApplicationService',
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:test',
  ]);
});
