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
  DATA_CORRECTION_DECISION_AUDIT_EVENT_TABLE,
  createDataCorrectionDecisionAuditRepository,
} = require('../../src/dataCorrection/dataCorrectionDecisionAuditRepository');
const {
  createDataCorrectionDecisionAuditWriter,
  normalizeDecisionAuditIntent,
} = require('../../src/dataCorrection/dataCorrectionDecisionAuditWriter');

const repoRoot = path.resolve(__dirname, '../..');

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

const UNSAFE_VALUES = Object.freeze([
  'before value should not leak',
  'after value should not leak',
  'raw payload should not leak',
  'phone value should not leak',
  'address value should not leak',
  'LINE-RAW-USER-ID',
  'token-value',
  'secret-value',
  'db url should not leak',
  'Error: unsafe stack',
  'SELECT * FROM unsafe',
  'apt_final_unsafe_001',
  'fsr_unsafe_001',
  'internal note should not leak',
  'audit raw payload should not leak',
  'ai raw payload should not leak',
  'billing internal should not leak',
  'settlement internal should not leak',
  'full payload should not leak',
  'provider payload should not leak',
  'customer-visible report should not leak',
  'file content should not leak',
]);

const UNSAFE_KEYS = Object.freeze([
  'beforeValue',
  'afterValue',
  'rawCorrectionPayload',
  'rawPhone',
  'rawAddress',
  'rawLineUserId',
  'token',
  'secret',
  'dbUrl',
  'stack',
  'rawSql',
  'finalAppointmentId',
  'fieldServiceReportId',
  'reportId',
  'internalNote',
  'auditRawPayload',
  'aiRawPayload',
  'billingInternalData',
  'settlementInternalData',
  'fullPayload',
  'providerPayload',
  'customerVisibleReportBody',
  'photoContents',
  'signatureContents',
  'fileContents',
]);

function baseIntent(overrides = {}) {
  return {
    action: DATA_CORRECTION_AUDIT_ACTIONS.APPLY,
    auditWritten: false,
    organizationId: 'org_decision_audit_writer_001',
    caseId: 'case_decision_audit_writer_001',
    appointmentId: 'appt_decision_audit_writer_001',
    actorId: 'user_decision_audit_writer_001',
    actorRole: 'dispatch_assistant',
    fieldKey: 'issueSummary',
    fieldGroup: 'dispatch_operational',
    eventType: DATA_CORRECTION_AUDIT_EVENT_TYPES.APPLY_ALLOWED,
    decision: 'allowed',
    reasonCode: 'PRE_DEPARTURE_CORRECTION_ALLOWED',
    resultStatus: DATA_CORRECTION_AUDIT_RESULTS.ALLOWED,
    requestId: 'req_decision_audit_writer_001',
    safeMessageKey: 'dataCorrection.ok',
    timestamp: '2026-05-22T12:00:00.000Z',
    retentionUntil: '2026-08-22T12:00:00.000Z',
    ...overrides,
  };
}

function unsafeExtras() {
  return {
    beforeValue: 'before value should not leak',
    afterValue: 'after value should not leak',
    rawCorrectionPayload: 'raw payload should not leak',
    rawPhone: 'phone value should not leak',
    rawAddress: 'address value should not leak',
    rawLineUserId: 'LINE-RAW-USER-ID',
    token: 'token-value',
    secret: 'secret-value',
    dbUrl: 'db url should not leak',
    stack: 'Error: unsafe stack',
    rawSql: 'SELECT * FROM unsafe',
    finalAppointmentId: 'apt_final_unsafe_001',
    fieldServiceReportId: 'fsr_unsafe_001',
    reportId: 'fsr_unsafe_001',
    internalNote: 'internal note should not leak',
    auditRawPayload: 'audit raw payload should not leak',
    aiRawPayload: 'ai raw payload should not leak',
    billingInternalData: 'billing internal should not leak',
    settlementInternalData: 'settlement internal should not leak',
    fullPayload: 'full payload should not leak',
    providerPayload: 'provider payload should not leak',
    customerVisibleReportBody: 'customer-visible report should not leak',
    photoContents: 'file content should not leak',
    signatureContents: 'file content should not leak',
    fileContents: 'file content should not leak',
  };
}

function assertSafe(value) {
  const serialized = JSON.stringify(value);

  for (const unsafe of UNSAFE_VALUES) {
    assert.equal(serialized.includes(unsafe), false, `unsafe value leaked: ${unsafe}`);
  }

  for (const key of UNSAFE_KEYS) {
    assert.equal(serialized.includes(`"${key}"`), false, `unsafe key leaked: ${key}`);
  }
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

      return {
        rows: [{ id: 'event_decision_audit_writer_001' }],
      };
    },
  };
}

function queryColumns(sql) {
  const match = sql.match(/INSERT INTO\s+data_correction_decision_audit_events\s*\(([^)]+)\)/i);

  assert.ok(match, 'insert SQL did not include expected table');

  return match[1].split(',').map((part) => part.trim());
}

test('repository and writer exports are present', () => {
  assert.equal(DATA_CORRECTION_DECISION_AUDIT_EVENT_TABLE, 'data_correction_decision_audit_events');
  assert.deepEqual(DATA_CORRECTION_DECISION_AUDIT_EVENT_COLUMNS, SAFE_COLUMNS);
  assert.equal(typeof createDataCorrectionDecisionAuditRepository, 'function');
  assert.equal(typeof createDataCorrectionDecisionAuditWriter, 'function');
  assert.equal(typeof normalizeDecisionAuditIntent, 'function');
});

test('missing injected db client fails safely without writing', () => {
  const repository = createDataCorrectionDecisionAuditRepository();
  const result = repository.writeDecisionAuditEvent({
    organization_id: 'org_decision_audit_writer_001',
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

test('writer inserts only Migration 025 safe columns through injected fake dbClient', () => {
  const fakeDb = createFakeDb();
  const writer = createDataCorrectionDecisionAuditWriter({ dbClient: fakeDb });
  const result = writer(baseIntent(unsafeExtras()));

  assert.deepEqual(result, {
    ok: true,
    persisted: true,
    auditWritten: true,
    eventType: DATA_CORRECTION_AUDIT_EVENT_TYPES.APPLY_ALLOWED,
    resultStatus: DATA_CORRECTION_AUDIT_RESULTS.ALLOWED,
  });
  assert.equal(fakeDb.calls.length, 1);
  assert.deepEqual(queryColumns(fakeDb.calls[0].sql), SAFE_COLUMNS);
  assert.match(fakeDb.calls[0].sql, /^INSERT INTO data_correction_decision_audit_events \(/);
  assert.doesNotMatch(fakeDb.calls[0].sql, /before|after|raw|phone|address|token|secret|final_appointment|field_service_report|internal_note|payload/i);
  assert.equal(fakeDb.calls[0].params.length, SAFE_COLUMNS.length);
  assert.equal(fakeDb.calls[0].params[0], 'org_decision_audit_writer_001');
  assert.equal(fakeDb.calls[0].params[8], DATA_CORRECTION_AUDIT_EVENT_TYPES.APPLY_ALLOWED);
  assertSafe([result, fakeDb.calls]);
});

test('writer supports injected transaction query object without service wiring', () => {
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
});

test('normalizer strips unsafe extras and maps only safe auditIntent metadata', () => {
  const normalized = normalizeDecisionAuditIntent(baseIntent(unsafeExtras()));

  assert.equal(normalized.ok, true);
  assert.deepEqual(Object.keys(normalized.record), SAFE_COLUMNS);
  assert.equal(normalized.record.organization_id, 'org_decision_audit_writer_001');
  assert.equal(normalized.record.deleted_at, null);
  assertSafe(normalized);
});

test('missing organization id event type or result status fails closed', () => {
  [
    ['organizationId', 'ORGANIZATION_ID_REQUIRED'],
    ['eventType', 'EVENT_TYPE_UNSAFE'],
    ['resultStatus', 'RESULT_STATUS_UNSAFE'],
  ].forEach(([key, reasonCode]) => {
    const intent = baseIntent();
    delete intent[key];

    const result = createDataCorrectionDecisionAuditWriter({ dbClient: createFakeDb() })(intent);

    assert.deepEqual(result, {
      ok: false,
      persisted: false,
      auditWritten: false,
      reasonCode,
    });
  });
});

test('unsafe event type and result status fail closed before DB write', () => {
  const fakeDb = createFakeDb();
  const writer = createDataCorrectionDecisionAuditWriter({ dbClient: fakeDb });

  const unsafeEvent = writer(baseIntent({ eventType: 'unsafe event type' }));
  const unsafeStatus = writer(baseIntent({ resultStatus: 'unsafe_status' }));

  assert.equal(unsafeEvent.ok, false);
  assert.equal(unsafeEvent.reasonCode, 'EVENT_TYPE_UNSAFE');
  assert.equal(unsafeStatus.ok, false);
  assert.equal(unsafeStatus.reasonCode, 'RESULT_STATUS_UNSAFE');
  assert.equal(fakeDb.calls.length, 0);
});

test('DB throw timeout duplicate and transaction failures return safe failure without raw details', () => {
  [
    [new Error('unsafe raw stack should not leak'), 'DB_WRITE_FAILED'],
    [Object.assign(new Error('timeout happened'), { code: 'ETIMEDOUT' }), 'DB_TIMEOUT'],
    [Object.assign(new Error('duplicate request_id'), { code: '23505' }), 'DUPLICATE_REQUEST_ID'],
    [new Error('transaction aborted'), 'TRANSACTION_FAILED'],
  ].forEach(([error, reasonCode]) => {
    const writer = createDataCorrectionDecisionAuditWriter({
      dbClient: createFakeDb({
        onQuery() {
          throw error;
        },
      }),
    });
    const result = writer(baseIntent(unsafeExtras()));

    assert.deepEqual(result, {
      ok: false,
      persisted: false,
      auditWritten: false,
      reasonCode,
    });
    assertSafe(result);
    assert.equal(JSON.stringify(result).includes('unsafe raw stack should not leak'), false);
  });
});

test('async injected db failures and success remain safe', async () => {
  const asyncSuccess = createDataCorrectionDecisionAuditWriter({
    dbClient: createFakeDb({
      onQuery() {
        return Promise.resolve({ rows: [{ id: 'event_async_001' }] });
      },
    }),
  });
  const asyncFailure = createDataCorrectionDecisionAuditWriter({
    dbClient: createFakeDb({
      onQuery() {
        return Promise.reject(new Error('async unsafe failure should not leak'));
      },
    }),
  });

  assert.equal((await asyncSuccess(baseIntent())).ok, true);
  const failure = await asyncFailure(baseIntent(unsafeExtras()));

  assert.deepEqual(failure, {
    ok: false,
    persisted: false,
    auditWritten: false,
    reasonCode: 'DB_WRITE_FAILED',
  });
  assertSafe(failure);
});

test('writer does not create correction application case appointment FSR finalAppointmentId provider AI billing or settlement behavior', () => {
  const fakeDb = createFakeDb();
  const writer = createDataCorrectionDecisionAuditWriter({ dbClient: fakeDb });
  const result = writer(baseIntent(unsafeExtras()));
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

test('repository and writer import boundaries avoid global DB env config provider AI API service billing and permission runtime', () => {
  const files = [
    'src/dataCorrection/dataCorrectionDecisionAuditRepository.js',
    'src/dataCorrection/dataCorrectionDecisionAuditWriter.js',
  ];

  for (const file of files) {
    const source = fs.readFileSync(path.join(repoRoot, file), 'utf8');

    [
      /require\(['"][^'"]*(?:db|database|pool|pg|config|env|provider|line|sms|webhook|email|ai|rag|billing|settlement|permission|route|controller|app|server|FieldServiceReport|AppointmentService|CaseService)[^'"]*['"]\)/i,
      /process\.env/,
      /console\./,
      /fetch\(/,
      /axios/,
      /listen\(/,
    ].forEach((pattern) => {
      assert.equal(pattern.test(source), false, `${file} matched forbidden pattern ${pattern}`);
    });
  }
});
