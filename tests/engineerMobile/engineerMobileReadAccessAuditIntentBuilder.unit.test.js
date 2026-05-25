'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  ENGINEER_MOBILE_READ_ACCESS_AUDIT_ACTIONS,
  ENGINEER_MOBILE_READ_ACCESS_AUDIT_EVENT_TYPES,
  ENGINEER_MOBILE_READ_ACCESS_AUDIT_RESULTS,
  buildEngineerMobileReadAccessAuditIntent,
} = require('../../src/engineerMobile/engineerMobileReadAccessAuditIntentBuilder');

const repoRoot = path.resolve(__dirname, '../..');
const sourceFile = path.join(
  repoRoot,
  'src/engineerMobile/engineerMobileReadAccessAuditIntentBuilder.js',
);

function baseInput(overrides = {}) {
  return {
    action: ENGINEER_MOBILE_READ_ACCESS_AUDIT_ACTIONS.TASK_LIST,
    actor: {
      engineerId: 'eng_audit_001',
      organizationId: 'org_audit_001',
      role: 'engineer',
      userId: 'user_audit_001',
    },
    allowed: true,
    reasonKey: 'engineer_mobile.assignment.allowed',
    safeIdentifiers: {
      appointmentId: 'apt_audit_001',
      caseId: 'case_audit_001',
      taskId: 'task_audit_001',
    },
    timestamp: '2026-05-22T10:00:00.000Z',
    ...unsafeExtras(),
    ...overrides,
  };
}

function unsafeExtras() {
  return {
    DATABASE_URL: 'DATABASE_URL_should_not_leak',
    aiRawPayload: 'ai_raw_payload_should_not_leak',
    auditRawPayload: 'audit_raw_payload_should_not_leak',
    billingInternalData: 'billing_internal_should_not_leak',
    finalAppointmentId: 'final_appointment_should_not_leak',
    fullAddress: 'full_address_should_not_leak',
    fullPayload: 'full_payload_should_not_leak',
    internalNote: 'internal_note_should_not_leak',
    lineAccessToken: 'line_access_token_should_not_leak',
    rawLineUserId: 'raw_line_user_should_not_leak',
    rawPhone: 'raw_phone_should_not_leak',
    reportId: 'report_should_not_leak',
    secret: 'secret_should_not_leak',
    sql: 'SQL_should_not_leak',
    stack: 'stack_should_not_leak',
    token: 'token_should_not_leak',
  };
}

function assertNoSensitive(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'DATABASE_URL_should_not_leak',
    'ai_raw_payload_should_not_leak',
    'audit_raw_payload_should_not_leak',
    'billing_internal_should_not_leak',
    'final_appointment_should_not_leak',
    'full_address_should_not_leak',
    'full_payload_should_not_leak',
    'internal_note_should_not_leak',
    'line_access_token_should_not_leak',
    'raw_line_user_should_not_leak',
    'raw_phone_should_not_leak',
    'report_should_not_leak',
    'secret_should_not_leak',
    'SQL_should_not_leak',
    'stack_should_not_leak',
    'token_should_not_leak',
    'DATABASE_URL',
    'aiRawPayload',
    'auditRawPayload',
    'billingInternalData',
    'finalAppointmentId',
    'fullAddress',
    'fullPayload',
    'internalNote',
    'lineAccessToken',
    'rawLineUserId',
    'rawPhone',
    'reportId',
    'secret',
    'token',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

function assertBaseShape(intent) {
  assert.equal(intent.auditWritten, false);
  assertNoSensitive(intent);
}

function requireSpecifiers(source) {
  const specifiers = [];
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
  let match;

  while ((match = requireRegex.exec(source)) !== null) {
    specifiers.push(match[1]);
  }

  return specifiers;
}

test('exports actions event types results and builder', () => {
  assert.equal(typeof buildEngineerMobileReadAccessAuditIntent, 'function');
  assert.deepEqual(ENGINEER_MOBILE_READ_ACCESS_AUDIT_ACTIONS, {
    TASK_DETAIL: 'task_detail',
    TASK_LIST: 'task_list',
  });
  assert.deepEqual(ENGINEER_MOBILE_READ_ACCESS_AUDIT_EVENT_TYPES, {
    TASK_DETAIL_READ_ALLOWED: 'engineer_mobile_task_detail_read_allowed',
    TASK_DETAIL_READ_DENIED: 'engineer_mobile_task_detail_read_denied',
    TASK_LIST_READ_ALLOWED: 'engineer_mobile_task_list_read_allowed',
    TASK_LIST_READ_DENIED: 'engineer_mobile_task_list_read_denied',
    TASK_READ_DENIED_MALFORMED: 'engineer_mobile_task_read_denied_malformed',
  });
});

test('builds safe task list allowed intent with injected timestamp and identifiers', () => {
  const intent = buildEngineerMobileReadAccessAuditIntent(baseInput());

  assert.deepEqual(intent, {
    action: 'task_list',
    actorId: 'user_audit_001',
    actorRole: 'engineer',
    appointmentId: 'apt_audit_001',
    auditWritten: false,
    caseId: 'case_audit_001',
    engineerId: 'eng_audit_001',
    eventType: 'engineer_mobile_task_list_read_allowed',
    organization_id: 'org_audit_001',
    reasonKey: 'engineer_mobile.assignment.allowed',
    resultStatus: 'allowed',
    taskId: 'task_audit_001',
    timestamp: '2026-05-22T10:00:00.000Z',
  });
  assertBaseShape(intent);
});

test('builds safe task detail allowed intent', () => {
  const intent = buildEngineerMobileReadAccessAuditIntent(baseInput({
    action: ENGINEER_MOBILE_READ_ACCESS_AUDIT_ACTIONS.TASK_DETAIL,
  }));

  assert.equal(intent.eventType, ENGINEER_MOBILE_READ_ACCESS_AUDIT_EVENT_TYPES.TASK_DETAIL_READ_ALLOWED);
  assert.equal(intent.resultStatus, ENGINEER_MOBILE_READ_ACCESS_AUDIT_RESULTS.ALLOWED);
  assert.equal(intent.action, 'task_detail');
  assertBaseShape(intent);
});

test('builds safe task list denied intent from guard decision metadata', () => {
  const intent = buildEngineerMobileReadAccessAuditIntent({
    guardDecision: {
      action: 'task_list',
      allowed: false,
      auditIntent: {
        action: 'task_list',
        engineerId: 'eng_audit_002',
        organizationId: 'org_audit_002',
        reasonKey: 'engineer_mobile.assignment.not_allowed',
        result: 'deny',
        role: 'engineer',
        userId: 'user_audit_002',
        ...unsafeExtras(),
      },
      reasonKey: 'engineer_mobile.assignment.not_allowed',
    },
    safeIdentifiers: {
      appointmentId: 'apt_audit_002',
    },
  });

  assert.deepEqual(intent, {
    action: 'task_list',
    actorId: 'user_audit_002',
    actorRole: 'engineer',
    appointmentId: 'apt_audit_002',
    auditWritten: false,
    engineerId: 'eng_audit_002',
    eventType: 'engineer_mobile_task_list_read_denied',
    organization_id: 'org_audit_002',
    reasonKey: 'engineer_mobile.assignment.not_allowed',
    resultStatus: 'denied',
  });
  assertBaseShape(intent);
});

test('builds safe task detail denied intent', () => {
  const intent = buildEngineerMobileReadAccessAuditIntent(baseInput({
    action: 'task_detail',
    allowed: false,
    reasonKey: 'engineer_mobile.assignment.cross_organization',
  }));

  assert.equal(intent.eventType, ENGINEER_MOBILE_READ_ACCESS_AUDIT_EVENT_TYPES.TASK_DETAIL_READ_DENIED);
  assert.equal(intent.resultStatus, ENGINEER_MOBILE_READ_ACCESS_AUDIT_RESULTS.DENIED);
  assert.equal(intent.reasonKey, 'engineer_mobile.assignment.cross_organization');
  assertBaseShape(intent);
});

test('missing scope or unsupported input returns safe malformed denied intent without throwing', () => {
  for (const input of [
    undefined,
    null,
    'not an object',
    baseInput({ actor: { userId: 'user_only' } }),
    baseInput({ action: 'delete_task' }),
    baseInput({ allowed: undefined, resultStatus: undefined }),
  ]) {
    assert.doesNotThrow(() => buildEngineerMobileReadAccessAuditIntent(input));
    const intent = buildEngineerMobileReadAccessAuditIntent(input);

    assert.deepEqual(Object.keys(intent).sort(), [
      'auditWritten',
      'eventType',
      'reasonKey',
      'resultStatus',
      ...(input && typeof input === 'object' && input.timestamp ? ['timestamp'] : []),
    ].sort());
    assert.equal(intent.auditWritten, false);
    assert.equal(intent.eventType, ENGINEER_MOBILE_READ_ACCESS_AUDIT_EVENT_TYPES.TASK_READ_DENIED_MALFORMED);
    assert.equal(intent.resultStatus, ENGINEER_MOBILE_READ_ACCESS_AUDIT_RESULTS.MALFORMED);
    assertBaseShape(intent);
  }
});

test('ignores unsafe raw target rows and copies only safeIdentifiers target fields', () => {
  const intent = buildEngineerMobileReadAccessAuditIntent(baseInput({
    safeIdentifiers: {
      appointmentId: 'apt_safe',
      caseId: 'case_safe',
      taskId: 'task_safe',
    },
    target: {
      appointmentId: 'apt_target_should_not_win',
      caseId: 'case_target_should_not_win',
      fullAddress: 'full_address_should_not_leak',
      internalNote: 'internal_note_should_not_leak',
      rawPhone: 'raw_phone_should_not_leak',
      taskId: 'task_target_should_not_win',
    },
  }));

  assert.equal(intent.appointmentId, 'apt_safe');
  assert.equal(intent.caseId, 'case_safe');
  assert.equal(intent.taskId, 'task_safe');
  assertBaseShape(intent);
});

test('source remains pure and imports no runtime sinks', () => {
  const source = fs.readFileSync(sourceFile, 'utf8');

  assert.deepEqual(requireSpecifiers(source), []);

  [
    /process\.env|console\.|fetch\s*\(|axios|XMLHttpRequest|node:http|node:https/i,
    /require\(['"].*(?:db|pool|database|transaction|repository|repositories|queryExecutor)['"]\)/i,
    /require\(['"].*(?:routes?|controllers?|server|app|admin|package|smoke)['"]\)/i,
    /require\(['"].*(?:line|sms|email|push|provider|webhook)['"]\)/i,
    /require\(['"].*(?:ai|rag|vector|openai|embedding|prompt)['"]\)/i,
    /require\(['"].*(?:audit|logger|logWriter|sink)['"]\)/i,
    /require\(['"].*(?:completion|fieldServiceReport|reportWriter|finalAppointment)['"]\)/i,
    /completeServiceReport|submitCompletion|createFieldServiceReport|updateFieldServiceReport/i,
    /finalAppointmentId\s*=|final_appointment_id\s*=|inferFinalAppointment|resolveFinalAppointment/i,
    /dbClient\.query|transaction\.query|pool\.query|executeSql|psql|db:migrate/i,
    /sendLine|sendSms|sendEmail|sendPush|webhook|provider\.send/i,
    /openai|embedding|vector|rag|prompt|aiModel/i,
    /migrations\/|admin\/src|package\.json|smoke:/i,
  ].forEach((pattern) => {
    assert.doesNotMatch(source, pattern);
  });
});
