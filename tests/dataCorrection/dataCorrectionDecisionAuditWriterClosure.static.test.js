'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  DATA_CORRECTION_AUDIT_ACTIONS,
  DATA_CORRECTION_AUDIT_EVENT_TYPES,
  DATA_CORRECTION_AUDIT_RESULTS,
} = require('../../src/dataCorrection/dataCorrectionDecisionAuditIntentBuilder');
const {
  DATA_CORRECTION_DECISION_AUDIT_EVENT_COLUMNS,
  createDataCorrectionDecisionAuditRepository,
} = require('../../src/dataCorrection/dataCorrectionDecisionAuditRepository');
const {
  createDataCorrectionDecisionAuditWriter,
} = require('../../src/dataCorrection/dataCorrectionDecisionAuditWriter');

const repoRoot = path.resolve(__dirname, '../..');

const FILES = Object.freeze({
  task885Doc: 'docs/task-885-data-correction-decision-audit-repository-writer-injected-db-unit-test-no-real-db-no-service-wiring.md',
  task885UnitTest: 'tests/dataCorrection/dataCorrectionDecisionAuditWriter.unit.test.js',
  repository: 'src/dataCorrection/dataCorrectionDecisionAuditRepository.js',
  writer: 'src/dataCorrection/dataCorrectionDecisionAuditWriter.js',
  app: 'src/app.js',
  routeIndex: 'src/routes/index.js',
  dataCorrectionRoute: 'src/routes/dataCorrectionRoutes.js',
  dataCorrectionController: 'src/controllers/dataCorrectionController.js',
  governanceOrchestrator: 'src/dataCorrection/dataCorrectionGovernanceOrchestrator.js',
  requestService: 'src/dataCorrection/dataCorrectionRequestService.js',
  applyService: 'src/dataCorrection/preDepartureCorrectionApplicationService.js',
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

const UNSAFE_EXTRAS = Object.freeze({
  beforeValue: 'before value should not leak',
  afterValue: 'after value should not leak',
  rawCorrectionPayload: 'raw correction payload should not leak',
  rawPhone: '0912-345-678',
  rawAddress: 'New Taipei raw address should not leak',
  rawLineUserId: 'LINE-RAW-USER-ID',
  token: 'token-value',
  secret: 'secret-value',
  dbUrl: 'postgres://unsafe',
  stack: 'Error: unsafe stack',
  rawSql: 'SELECT * FROM unsafe',
  finalAppointmentId: 'apt_final_unsafe_001',
  fieldServiceReportId: 'fsr_unsafe_001',
  reportId: 'report_unsafe_001',
  internalNote: 'internal note should not leak',
  auditRawPayload: 'audit raw payload should not leak',
  aiRawPayload: 'ai raw payload should not leak',
  billingInternalData: 'billing internal data should not leak',
  settlementInternalData: 'settlement internal data should not leak',
  fullPayload: 'full payload should not leak',
  providerPayload: 'provider payload should not leak',
  customerVisibleReportBody: 'customer visible report body should not leak',
  photoContents: 'photo bytes should not leak',
  signatureContents: 'signature bytes should not leak',
  fileContents: 'file contents should not leak',
});

const UNSAFE_VALUES = Object.freeze(Object.values(UNSAFE_EXTRAS));
const UNSAFE_KEYS = Object.freeze(Object.keys(UNSAFE_EXTRAS));

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

function baseIntent(overrides = {}) {
  return {
    action: DATA_CORRECTION_AUDIT_ACTIONS.APPLY,
    organizationId: 'org_decision_audit_closure_001',
    caseId: 'case_decision_audit_closure_001',
    appointmentId: 'appt_decision_audit_closure_001',
    actorId: 'user_decision_audit_closure_001',
    actorRole: 'dispatch_assistant',
    fieldKey: 'issueSummary',
    fieldGroup: 'dispatch_operational',
    eventType: DATA_CORRECTION_AUDIT_EVENT_TYPES.APPLY_ALLOWED,
    decision: 'allowed',
    reasonCode: 'PRE_DEPARTURE_CORRECTION_ALLOWED',
    safeMessageKey: 'dataCorrection.ok',
    resultStatus: DATA_CORRECTION_AUDIT_RESULTS.ALLOWED,
    requestId: 'req_decision_audit_closure_001',
    timestamp: '2026-05-22T12:00:00.000Z',
    retentionUntil: '2026-08-22T12:00:00.000Z',
    ...overrides,
  };
}

function createFakeDb({ onQuery } = {}) {
  const calls = [];

  return {
    calls,
    query(sql, params) {
      calls.push({ sql, params });

      if (onQuery) {
        return onQuery(sql, params);
      }

      return { rows: [{ id: 'event_decision_audit_closure_001' }] };
    },
  };
}

function queryColumns(sql) {
  const match = sql.match(/INSERT INTO\s+data_correction_decision_audit_events\s*\(([^)]+)\)/i);

  assert.ok(match, 'insert SQL did not include the expected audit event table');

  return match[1].split(',').map((part) => part.trim());
}

function assertSafe(value) {
  const serialized = JSON.stringify(value);

  for (const unsafe of UNSAFE_VALUES) {
    assert.equal(serialized.includes(unsafe), false, `unsafe value leaked: ${unsafe}`);
  }

  for (const key of UNSAFE_KEYS) {
    assert.equal(serialized.includes(`"${key}"`), false, `unsafe key leaked: ${key}`);
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

test('Task885 repository writer evidence files exist before closure', () => {
  [
    FILES.task885Doc,
    FILES.task885UnitTest,
    FILES.repository,
    FILES.writer,
  ].forEach((relativePath) => {
    assert.equal(exists(relativePath), true, `${relativePath} is missing`);
  });
});

test('Task885 evidence records injected-only no-service-wiring boundary', () => {
  const doc = read(FILES.task885Doc);

  assertIncludesAll(doc, [
    'Status: completed',
    'injected `dbClient` / transaction only',
    'no service wiring',
    'no app/server wiring',
    'no route/controller/API body change',
    'no public service response shape change',
    'no real DB connection',
    'no `psql`',
    'no migration execution',
    'no dry-run',
    'no apply',
    'no global DB import',
    'no `process.env` / config / credential reads',
    'no permission runtime expansion',
    'no provider / LINE / SMS / App push / webhook / email traffic',
    'no AI / RAG runtime',
    'no billing / settlement runtime',
    'no smoke / integration test',
    'no package change',
  ]);

  for (const column of SAFE_COLUMNS) {
    assert.match(doc, new RegExp(`- \`${column}\``), `Task885 doc missing safe column ${column}`);
  }
});

test('repository and writer import only local safe dependencies', () => {
  assert.deepEqual(requireSpecifiers(read(FILES.repository)), []);
  assert.deepEqual(requireSpecifiers(read(FILES.writer)), [
    './dataCorrectionDecisionAuditIntentBuilder',
    './dataCorrectionDecisionAuditRepository',
  ]);
  assert.deepEqual(DATA_CORRECTION_DECISION_AUDIT_EVENT_COLUMNS, SAFE_COLUMNS);
});

test('repository and writer avoid global DB env config network provider AI API permission billing and correction service imports', () => {
  for (const file of [FILES.repository, FILES.writer]) {
    const source = read(file);

    [
      /require\(['"][^'"]*(?:db|database|pool|pg|config|env|provider|line|sms|webhook|email|push|ai|rag|billing|settlement|permission|route|controller|app|server|FieldServiceReport|AppointmentService|CaseService|dataCorrectionRequestService|preDepartureCorrectionApplicationService)[^'"]*['"]\)/i,
      /process\.env/,
      /console\./,
      /fetch\(/,
      /axios/,
      /createServer/,
      /app\.listen/,
      /new\s+Pool/,
      /pool\.query/,
      /client\.query/,
      /UPDATE\s+/i,
      /DELETE\s+FROM/i,
    ].forEach((pattern) => {
      assert.equal(pattern.test(source), false, `${file} matched forbidden pattern ${pattern}`);
    });
  }
});

test('repository requires injected dbClient or transaction and missing injection fails safely', () => {
  const repository = createDataCorrectionDecisionAuditRepository();
  const result = repository.writeDecisionAuditEvent({
    organization_id: 'org_decision_audit_closure_001',
    action: DATA_CORRECTION_AUDIT_ACTIONS.APPLY,
    event_type: DATA_CORRECTION_AUDIT_EVENT_TYPES.APPLY_ALLOWED,
    decision: 'allowed',
    result_status: DATA_CORRECTION_AUDIT_RESULTS.ALLOWED,
  });

  assert.deepEqual(result, {
    ok: false,
    persisted: false,
    auditWritten: false,
    reasonCode: 'DB_CLIENT_NOT_CONFIGURED',
  });
  assertSafe(result);
});

test('writer persists only Migration 025 safe columns and strips unsafe extras', () => {
  const fakeDb = createFakeDb();
  const writer = createDataCorrectionDecisionAuditWriter({ dbClient: fakeDb });
  const result = writer(baseIntent(UNSAFE_EXTRAS));

  assert.deepEqual(result, {
    ok: true,
    persisted: true,
    auditWritten: true,
    eventType: DATA_CORRECTION_AUDIT_EVENT_TYPES.APPLY_ALLOWED,
    resultStatus: DATA_CORRECTION_AUDIT_RESULTS.ALLOWED,
  });
  assert.equal(fakeDb.calls.length, 1);
  assert.deepEqual(queryColumns(fakeDb.calls[0].sql), SAFE_COLUMNS);
  assert.equal(fakeDb.calls[0].params.length, SAFE_COLUMNS.length);
  assertSafe([result, fakeDb.calls]);
});

test('writer supports injected transaction object without global DB wiring', () => {
  const transaction = createFakeDb();
  const writer = createDataCorrectionDecisionAuditWriter({ transaction });
  const result = writer(baseIntent({
    action: DATA_CORRECTION_AUDIT_ACTIONS.REQUEST,
    eventType: DATA_CORRECTION_AUDIT_EVENT_TYPES.REQUEST_ACCEPTED,
    resultStatus: DATA_CORRECTION_AUDIT_RESULTS.ALLOWED,
  }));

  assert.equal(result.ok, true);
  assert.equal(transaction.calls.length, 1);
  assert.equal(transaction.calls[0].params[5], DATA_CORRECTION_AUDIT_ACTIONS.REQUEST);
  assertSafe([result, transaction.calls]);
});

test('DB throw timeout duplicate and transaction failures return safe non-leaking failures', () => {
  [
    [new Error('unsafe raw stack should not leak'), 'DB_WRITE_FAILED'],
    [Object.assign(new Error('timeout should not leak'), { code: 'ETIMEDOUT' }), 'DB_TIMEOUT'],
    [Object.assign(new Error('duplicate request should not leak'), { code: '23505' }), 'DUPLICATE_REQUEST_ID'],
    [new Error('transaction failed with details'), 'TRANSACTION_FAILED'],
  ].forEach(([error, reasonCode]) => {
    const writer = createDataCorrectionDecisionAuditWriter({
      dbClient: createFakeDb({
        onQuery() {
          throw error;
        },
      }),
    });
    const result = writer(baseIntent(UNSAFE_EXTRAS));

    assert.deepEqual(result, {
      ok: false,
      persisted: false,
      auditWritten: false,
      reasonCode,
    });
    assertSafe(result);
  });
});

test('async DB failure remains safe and does not leak raw error text', async () => {
  const writer = createDataCorrectionDecisionAuditWriter({
    dbClient: createFakeDb({
      onQuery() {
        return Promise.reject(new Error('async raw payload should not leak'));
      },
    }),
  });

  const result = await writer(baseIntent(UNSAFE_EXTRAS));

  assert.deepEqual(result, {
    ok: false,
    persisted: false,
    auditWritten: false,
    reasonCode: 'DB_WRITE_FAILED',
  });
  assertSafe(result);
});

test('writer output does not create correction case appointment FSR final appointment identity provider AI billing or settlement side effects', () => {
  const fakeDb = createFakeDb();
  const writer = createDataCorrectionDecisionAuditWriter({ dbClient: fakeDb });
  const result = writer(baseIntent(UNSAFE_EXTRAS));
  const serialized = JSON.stringify([result, fakeDb.calls]);

  [
    'correctionApplied',
    'caseUpdated',
    'appointmentUpdated',
    'fieldServiceReportUpdated',
    'finalAppointmentId',
    'customerIdentityUpdated',
    'providerSent',
    'aiInvoked',
    'ragInvoked',
    'billingUpdated',
    'settlementUpdated',
  ].forEach((token) => {
    assert.equal(serialized.includes(token), false, `${token} should not appear`);
  });
});

test('no API route controller or correction application wiring references the audit writer or repository', () => {
  [
    FILES.routeIndex,
    FILES.dataCorrectionRoute,
    FILES.dataCorrectionController,
    FILES.governanceOrchestrator,
  ].forEach((file) => {
    const source = read(file);

    assert.doesNotMatch(source, /dataCorrectionDecisionAuditWriter/);
    assert.doesNotMatch(source, /dataCorrectionDecisionAuditRepository/);
    assert.doesNotMatch(source, /createDataCorrectionDecisionAuditWriter/);
    assert.doesNotMatch(source, /createDataCorrectionDecisionAuditRepository/);
  });

  [
    FILES.requestService,
    FILES.applyService,
  ].forEach((file) => {
    const source = read(file);

    assert.doesNotMatch(source, /dataCorrectionDecisionAuditRepository/);
    assert.doesNotMatch(source, /require\(['"][^'"]*dataCorrectionDecisionAuditWriter['"]\)/);
    assert.doesNotMatch(source, /createDataCorrectionDecisionAuditWriter/);
    assert.doesNotMatch(source, /createDataCorrectionDecisionAuditRepository/);
  });
});

test('closure guard itself imports only test dependencies and the Task885 writer slice', () => {
  const imports = requireSpecifiers(fs.readFileSync(__filename, 'utf8'));

  assert.deepEqual(imports, [
    '../../src/dataCorrection/dataCorrectionDecisionAuditIntentBuilder',
    '../../src/dataCorrection/dataCorrectionDecisionAuditRepository',
    '../../src/dataCorrection/dataCorrectionDecisionAuditWriter',
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:test',
  ].sort());
});
