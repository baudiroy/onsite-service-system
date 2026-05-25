'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  buildEngineerMobileTaskDetailReadWithAuditIntent,
  buildEngineerMobileTaskDetailReadWithAuditIntentAsync,
  buildEngineerMobileTaskListReadWithAuditIntent,
  buildEngineerMobileTaskListReadWithAuditIntentAsync,
} = require('../../src/engineerMobile/engineerMobileReadAccessAuditIntentSideChannel');

const repoRoot = path.resolve(__dirname, '../..');
const sourceFile = path.join(
  repoRoot,
  'src/engineerMobile/engineerMobileReadAccessAuditIntentSideChannel.js',
);

function auth(overrides = {}) {
  return {
    engineerId: 'eng_side_channel_001',
    organizationId: 'org_side_channel_001',
    role: 'engineer',
    userId: 'user_side_channel_001',
    ...overrides,
  };
}

function task(overrides = {}) {
  return {
    appointmentId: 'apt_side_channel_001',
    assignedEngineerId: 'eng_side_channel_001',
    caseId: 'case_side_channel_001',
    customerNameMasked: '王○○',
    customerPhoneMasked: '09xx-xxx-123',
    finalAppointmentId: 'final_appointment_should_not_leak',
    fullAddress: 'full_address_should_not_leak',
    internalNote: 'internal_note_should_not_leak',
    organizationId: 'org_side_channel_001',
    rawLineUserId: 'raw_line_user_should_not_leak',
    rawPhone: 'raw_phone_should_not_leak',
    reportId: 'report_should_not_leak',
    scheduledStart: '2026-05-22T09:00:00.000Z',
    status: 'scheduled',
    ...overrides,
  };
}

function listInput(overrides = {}) {
  return {
    auth: auth(),
    engineerId: 'eng_side_channel_001',
    organizationId: 'org_side_channel_001',
    timestamp: '2026-05-22T11:00:00.000Z',
    ...unsafeExtras(),
    ...overrides,
  };
}

function detailInput(overrides = {}) {
  return {
    ...listInput(),
    appointmentId: 'apt_side_channel_001',
    ...overrides,
  };
}

function unsafeExtras() {
  return {
    DATABASE_URL: 'DATABASE_URL_should_not_leak',
    aiRawPayload: 'ai_raw_payload_should_not_leak',
    auditRawPayload: 'audit_raw_payload_should_not_leak',
    billingInternalData: 'billing_internal_should_not_leak',
    fullPayload: 'full_payload_should_not_leak',
    lineAccessToken: 'line_access_token_should_not_leak',
    secret: 'secret_should_not_leak',
    sql: 'SQL_should_not_leak',
    stack: 'stack_should_not_leak',
    token: 'token_should_not_leak',
  };
}

function assertPublicListShape(response) {
  assert.deepEqual(Object.keys(response).sort(), ['status', 'tasks']);
}

function assertPublicDetailShape(response) {
  assert.deepEqual(Object.keys(response).sort(), ['detail', 'status']);
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

function requireSpecifiers(source) {
  const specifiers = [];
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
  let match;

  while ((match = requireRegex.exec(source)) !== null) {
    specifiers.push(match[1]);
  }

  return specifiers;
}

test('list read side-channel returns public response separately from safe audit intent', () => {
  const result = buildEngineerMobileTaskListReadWithAuditIntent(listInput(), {
    tasks: [task()],
  });

  assert.deepEqual(Object.keys(result).sort(), ['auditIntent', 'response']);
  assertPublicListShape(result.response);
  assert.equal(result.response.status, 'allow');
  assert.equal(result.auditIntent.eventType, 'engineer_mobile_task_list_read_allowed');
  assert.equal(result.auditIntent.organization_id, 'org_side_channel_001');
  assert.equal(result.auditIntent.actorId, 'user_side_channel_001');
  assert.equal(result.auditIntent.engineerId, 'eng_side_channel_001');
  assert.equal(result.auditIntent.action, 'task_list');
  assert.equal(result.auditIntent.resultStatus, 'allowed');
  assert.equal(result.auditIntent.auditWritten, false);
  assert.equal(result.response.auditIntent, undefined);
  assertNoSensitive(result);
});

test('detail read side-channel returns public response separately from safe audit intent', () => {
  const result = buildEngineerMobileTaskDetailReadWithAuditIntent(detailInput(), {
    tasks: [task()],
  });

  assert.deepEqual(Object.keys(result).sort(), ['auditIntent', 'response']);
  assertPublicDetailShape(result.response);
  assert.equal(result.response.status, 'allow');
  assert.equal(result.auditIntent.eventType, 'engineer_mobile_task_detail_read_allowed');
  assert.equal(result.auditIntent.appointmentId, 'apt_side_channel_001');
  assert.equal(result.auditIntent.caseId, 'case_side_channel_001');
  assert.equal(result.auditIntent.action, 'task_detail');
  assert.equal(result.auditIntent.resultStatus, 'allowed');
  assert.equal(result.auditIntent.auditWritten, false);
  assert.equal(result.response.auditIntent, undefined);
  assertNoSensitive(result);
});

test('denied list path keeps safe empty body and produces denied audit intent', () => {
  const result = buildEngineerMobileTaskListReadWithAuditIntent(listInput(), {
    permissionAssignmentGuard: () => ({
      allowed: false,
      reasonKey: 'engineer_mobile.assignment.not_allowed',
    }),
    permissionAssignmentGuardEnabled: true,
    tasks: [task()],
  });

  assertPublicListShape(result.response);
  assert.deepEqual(result.response, {
    status: 'deny',
    tasks: [],
  });
  assert.equal(result.auditIntent.eventType, 'engineer_mobile_task_list_read_denied');
  assert.equal(result.auditIntent.resultStatus, 'denied');
  assert.equal(result.auditIntent.auditWritten, false);
  assertNoSensitive(result);
});

test('denied detail path keeps safe unavailable body and produces denied audit intent', () => {
  const result = buildEngineerMobileTaskDetailReadWithAuditIntent(detailInput({
    appointmentId: 'apt_side_channel_missing',
  }), {
    tasks: [task()],
  });

  assertPublicDetailShape(result.response);
  assert.deepEqual(result.response, {
    detail: null,
    status: 'deny',
  });
  assert.equal(result.auditIntent.eventType, 'engineer_mobile_task_detail_read_denied');
  assert.equal(result.auditIntent.resultStatus, 'denied');
  assert.equal(result.auditIntent.auditWritten, false);
  assertNoSensitive(result);
});

test('async list and detail side-channel paths preserve shapes and safe audit intents', async () => {
  const readModelAsync = async () => [task()];
  const listResult = await buildEngineerMobileTaskListReadWithAuditIntentAsync(listInput(), {
    readModelAsync,
  });
  const detailResult = await buildEngineerMobileTaskDetailReadWithAuditIntentAsync(detailInput(), {
    readModelAsync,
  });

  assertPublicListShape(listResult.response);
  assertPublicDetailShape(detailResult.response);
  assert.equal(listResult.auditIntent.eventType, 'engineer_mobile_task_list_read_allowed');
  assert.equal(detailResult.auditIntent.eventType, 'engineer_mobile_task_detail_read_allowed');
  assert.equal(listResult.auditIntent.auditWritten, false);
  assert.equal(detailResult.auditIntent.auditWritten, false);
  assertNoSensitive({ listResult, detailResult });
});

test('side-channel can consume safe guard decision metadata without leaking unsafe extras', () => {
  const result = buildEngineerMobileTaskListReadWithAuditIntent(listInput({
    guardDecision: {
      action: 'task_list',
      allowed: false,
      auditIntent: {
        action: 'task_list',
        engineerId: 'eng_side_channel_001',
        organizationId: 'org_side_channel_001',
        reasonKey: 'engineer_mobile.assignment.not_allowed',
        result: 'deny',
        role: 'engineer',
        userId: 'user_side_channel_001',
        ...unsafeExtras(),
      },
      reasonKey: 'engineer_mobile.assignment.not_allowed',
    },
  }), {
    permissionAssignmentGuard: () => ({
      allowed: false,
      reasonKey: 'engineer_mobile.assignment.not_allowed',
    }),
    permissionAssignmentGuardEnabled: true,
    tasks: [task()],
  });

  assert.equal(result.auditIntent.eventType, 'engineer_mobile_task_list_read_denied');
  assert.equal(result.auditIntent.reasonKey, 'engineer_mobile.assignment.not_allowed');
  assert.equal(result.auditIntent.auditWritten, false);
  assertNoSensitive(result);
});

test('source imports only side-channel dependencies and no runtime sinks', () => {
  const source = fs.readFileSync(sourceFile, 'utf8');

  assert.deepEqual(requireSpecifiers(source), [
    './engineerMobileReadAccessAuditIntentBuilder',
    './engineerMobileTaskDetailService',
    './engineerMobileTaskListService',
  ]);

  [
    /process\.env|console\.|fetch\s*\(|axios|XMLHttpRequest|node:http|node:https/i,
    /require\(['"].*(?:db|pool|database|transaction|repository|repositories|queryExecutor)['"]\)/i,
    /require\(['"].*(?:routes?|controllers?|server|app|admin|package|smoke)['"]\)/i,
    /require\(['"].*(?:line|sms|email|push|provider|webhook)['"]\)/i,
    /require\(['"].*(?:ai|rag|vector|openai|embedding|prompt)['"]\)/i,
    /require\(['"].*(?:auditWriter|logger|logWriter|sink)['"]\)/i,
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
