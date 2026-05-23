'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  buildDataCorrectionDecisionAuditWriterInput,
} = require('../../src/dataCorrection/dataCorrectionDecisionAuditWriterInputBuilder');

const repoRoot = path.resolve(__dirname, '../..');

const UNSAFE_VALUES = Object.freeze([
  '0912-345-678',
  'raw address should not leak',
  'LINE-RAW-USER-ID',
  'token-value',
  'secret-value',
  'password-value',
  'api-key-value',
  'postgres://unsafe',
  'SELECT * FROM unsafe',
  'Error: unsafe stack',
  'apt_final_unsafe_001',
  'fsr_unsafe_001',
  'report_unsafe_001',
  'internal note should not leak',
  'ai raw payload should not leak',
  'billing internal should not leak',
  'settlement internal should not leak',
  'full payload should not leak',
  'writer raw detail should not leak',
]);

const UNSAFE_KEYS = Object.freeze([
  'phone',
  'mobile',
  'tel',
  'rawPhone',
  'rawAddress',
  'address',
  'line_user_id',
  'lineUserId',
  'token',
  'secret',
  'password',
  'apiKey',
  'dbUrl',
  'connectionString',
  'sql',
  'stack',
  'finalAppointmentId',
  'fieldServiceReportId',
  'reportId',
  'internalNote',
  'aiRawPayload',
  'billingInternalData',
  'settlementInternalData',
  'fullPayload',
  'rawPayload',
  'rawWriterResult',
  'writerInternals',
]);

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
    /09\d{2}[-\s]?\d{3}[-\s]?\d{3}/,
    /SELECT\s+\*\s+FROM/i,
    /Bearer\s+[A-Za-z0-9._-]+/i,
  ].forEach((pattern) => {
    assert.equal(pattern.test(serialized), false, `unsafe pattern leaked: ${pattern}`);
  });
}

function unsafeInput(overrides = {}) {
  return {
    action: 'pre_departure_apply',
    auditWritten: false,
    eventType: 'data_correction_apply_allowed',
    organizationId: 'org_decision_audit_writer_input_001',
    resultStatus: 'allowed',
    actorId: 'user_decision_audit_writer_input_001',
    actorRole: 'dispatch_assistant',
    caseId: 'case_decision_audit_writer_input_001',
    appointmentId: 'apt_decision_audit_writer_input_001',
    fieldKey: 'issueSummary',
    fieldGroup: 'dispatch_operational',
    decision: 'allow_pre_departure_correction',
    reasonCode: 'PRE_DEPARTURE_CORRECTION_ALLOWED',
    safeMessageKey: 'dataCorrection.allowed',
    timestamp: '2026-05-22T12:00:00.000Z',
    requestId: 'req_decision_audit_writer_input_001',
    phone: '0912-345-678',
    mobile: '0912-345-678',
    tel: '0912-345-678',
    rawPhone: '0912-345-678',
    rawAddress: 'raw address should not leak',
    address: 'raw address should not leak',
    line_user_id: 'LINE-RAW-USER-ID',
    lineUserId: 'LINE-RAW-USER-ID',
    finalAppointmentId: 'apt_final_unsafe_001',
    fieldServiceReportId: 'fsr_unsafe_001',
    reportId: 'report_unsafe_001',
    sql: 'SELECT * FROM unsafe',
    dbUrl: 'postgres://unsafe',
    connectionString: 'postgres://unsafe',
    stack: 'Error: unsafe stack',
    token: 'token-value',
    secret: 'secret-value',
    password: 'password-value',
    apiKey: 'api-key-value',
    internalNote: 'internal note should not leak',
    aiRawPayload: 'ai raw payload should not leak',
    billingInternalData: 'billing internal should not leak',
    settlementInternalData: 'settlement internal should not leak',
    fullPayload: 'full payload should not leak',
    rawPayload: 'full payload should not leak',
    nested: {
      phone: '0912-345-678',
      address: 'raw address should not leak',
      token: 'token-value',
      fieldServiceReportId: 'fsr_unsafe_001',
    },
    ...overrides,
  };
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

test('builds minimal safe writer input from normal audit intent metadata', () => {
  const result = buildDataCorrectionDecisionAuditWriterInput(unsafeInput());

  assert.deepEqual(result, {
    action: 'pre_departure_apply',
    actorId: 'user_decision_audit_writer_input_001',
    actorRole: 'dispatch_assistant',
    appointmentId: 'apt_decision_audit_writer_input_001',
    caseId: 'case_decision_audit_writer_input_001',
    decision: 'allow_pre_departure_correction',
    eventType: 'data_correction_apply_allowed',
    fieldGroup: 'dispatch_operational',
    fieldKey: 'issueSummary',
    organizationId: 'org_decision_audit_writer_input_001',
    reasonCode: 'PRE_DEPARTURE_CORRECTION_ALLOWED',
    requestId: 'req_decision_audit_writer_input_001',
    resultStatus: 'allowed',
    safeMessageKey: 'dataCorrection.allowed',
    timestamp: '2026-05-22T12:00:00.000Z',
    auditWritten: false,
  });
  assertSafe(result);
});

test('missing non-object or partial input produces safe minimal writer input', () => {
  [
    undefined,
    null,
    'not object',
    [],
    { action: 'data_correction_request' },
    { organizationId: 'org_partial_001', auditWritten: true },
  ].forEach((input) => {
    const result = buildDataCorrectionDecisionAuditWriterInput(input);

    assertSafe(result);
    assert.equal(Object.prototype.hasOwnProperty.call(result, 'rawPayload'), false);
  });

  assert.deepEqual(buildDataCorrectionDecisionAuditWriterInput({ organizationId: 'org_partial_001' }), {
    organizationId: 'org_partial_001',
  });
});

test('excludes sensitive top-level and nested fields through allowlist', () => {
  const result = buildDataCorrectionDecisionAuditWriterInput(unsafeInput());

  [
    'phone',
    'mobile',
    'tel',
    'rawPhone',
    'rawAddress',
    'address',
    'line_user_id',
    'lineUserId',
    'finalAppointmentId',
    'fieldServiceReportId',
    'reportId',
    'sql',
    'dbUrl',
    'connectionString',
    'stack',
    'token',
    'secret',
    'password',
    'apiKey',
    'internalNote',
    'aiRawPayload',
    'billingInternalData',
    'settlementInternalData',
    'fullPayload',
    'rawPayload',
    'nested',
  ].forEach((key) => {
    assert.equal(Object.prototype.hasOwnProperty.call(result, key), false, `${key} leaked`);
  });
  assertSafe(result);
});

test('drops sensitive-looking allowed field values instead of forwarding them to writer', () => {
  const result = buildDataCorrectionDecisionAuditWriterInput(unsafeInput({
    eventType: 'SELECT * FROM unsafe',
    reasonCode: 'postgres://unsafe',
    safeMessageKey: 'Bearer abc.def',
    timestamp: '0912-345-678',
    fieldKey: 'customerPhone',
    requestId: 'raw payload should not leak',
  }));

  assert.equal(result.eventType, undefined);
  assert.equal(result.reasonCode, undefined);
  assert.equal(result.safeMessageKey, undefined);
  assert.equal(result.timestamp, undefined);
  assert.equal(result.fieldKey, undefined);
  assert.equal(result.requestId, undefined);
  assert.equal(result.organizationId, 'org_decision_audit_writer_input_001');
  assertSafe(result);
});

test('builder source has no side-effect runtime imports or output patterns', () => {
  const source = fs.readFileSync(
    path.join(repoRoot, 'src/dataCorrection/dataCorrectionDecisionAuditWriterInputBuilder.js'),
    'utf8',
  );

  assert.deepEqual(requireSpecifiers(source), []);

  [
    /process\.env/,
    /console\./,
    /fetch\(/,
    /axios/,
    /createServer/,
    /listen\s*\(/,
    /client\.query/,
    /pool\.query/,
    /INSERT\s+INTO/i,
    /UPDATE\s+/i,
    /DELETE\s+/i,
  ].forEach((pattern) => {
    assert.equal(pattern.test(source), false, `forbidden builder pattern: ${pattern}`);
  });
});
