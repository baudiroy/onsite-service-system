'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  buildEngineerMobileTaskList,
} = require('../../src/engineerMobile/engineerMobileTaskListService');

const repoRoot = path.resolve(__dirname, '../..');
const serviceFile = path.join(repoRoot, 'src/engineerMobile/engineerMobileTaskListService.js');

function validInput(overrides = {}) {
  return {
    organizationId: 'org_engineer_mobile_001',
    engineerId: 'eng_engineer_mobile_001',
    dateRange: {
      from: '2026-05-21',
      to: '2026-05-28',
    },
    ...overrides,
  };
}

function task(overrides = {}) {
  return {
    caseId: 'case_engineer_mobile_001',
    appointmentId: 'apt_engineer_mobile_001',
    organizationId: 'org_engineer_mobile_001',
    assignedEngineerId: 'eng_engineer_mobile_001',
    scheduledStart: '2026-05-21T09:00:00+08:00',
    scheduledEnd: '2026-05-21T10:00:00+08:00',
    status: 'confirmed',
    customerNameMasked: '王○○',
    customerPhoneMasked: '09xx-xxx-123',
    addressSummary: '台北市大安區',
    productSummary: '冷氣',
    issueSummary: '不冷',
    serviceType: 'onsite',
    internalNote: 'internal_note_should_not_leak',
    auditLog: 'audit_log_should_not_leak',
    aiRawPayload: 'ai_raw_payload_should_not_leak',
    billingInternal: 'billing_internal_should_not_leak',
    settlementInternal: 'settlement_internal_should_not_leak',
    rawPhone: 'raw_phone_should_not_leak',
    rawAddress: 'raw_address_should_not_leak',
    rawLineUserId: 'line_user_should_not_leak',
    lineUserId: 'line_user_should_not_leak',
    token: 'token_should_not_leak',
    secret: 'secret_should_not_leak',
    finalAppointmentId: 'final_appointment_should_not_leak',
    ...overrides,
  };
}

function assertSafeResult(result) {
  const serialized = JSON.stringify(result);

  for (const forbiddenValue of [
    'internal_note_should_not_leak',
    'audit_log_should_not_leak',
    'ai_raw_payload_should_not_leak',
    'billing_internal_should_not_leak',
    'settlement_internal_should_not_leak',
    'raw_phone_should_not_leak',
    'raw_address_should_not_leak',
    'line_user_should_not_leak',
    'token_should_not_leak',
    'secret_should_not_leak',
    'final_appointment_should_not_leak',
  ]) {
    assert.equal(serialized.includes(forbiddenValue), false, `leaked ${forbiddenValue}`);
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
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

test('missing input returns empty safe result', () => {
  assert.deepEqual(buildEngineerMobileTaskList(), { status: 'deny', tasks: [] });
  assert.deepEqual(buildEngineerMobileTaskList(null), { status: 'deny', tasks: [] });
});

test('missing organizationId returns empty safe result', () => {
  assert.deepEqual(
    buildEngineerMobileTaskList(validInput({ organizationId: '' }), { tasks: [task()] }),
    { status: 'deny', tasks: [] },
  );
});

test('missing engineerId returns empty safe result', () => {
  assert.deepEqual(
    buildEngineerMobileTaskList(validInput({ engineerId: '' }), { tasks: [task()] }),
    { status: 'deny', tasks: [] },
  );
});

test('all matching tasks are returned with safe fields only', () => {
  const result = buildEngineerMobileTaskList(validInput(), {
    readModel: {
      tasks: [
        task({ caseId: 'case_b', appointmentId: 'apt_b', scheduledStart: '2026-05-21T13:00:00+08:00' }),
        task({ caseId: 'case_a', appointmentId: 'apt_a', scheduledStart: '2026-05-21T09:00:00+08:00' }),
      ],
    },
  });

  assert.equal(result.status, 'allow');
  assert.deepEqual(result.tasks.map((entry) => entry.appointmentId), ['apt_a', 'apt_b']);
  assert.deepEqual(Object.keys(result.tasks[0]).sort(), [
    'addressSummary',
    'appointmentId',
    'caseId',
    'customerNameMasked',
    'customerPhoneMasked',
    'issueSummary',
    'productSummary',
    'scheduledEnd',
    'scheduledStart',
    'serviceType',
    'status',
  ]);
  assertSafeResult(result);
});

test('wrong organization tasks are excluded', () => {
  const result = buildEngineerMobileTaskList(validInput(), {
    tasks: [
      task({ caseId: 'case_allowed' }),
      task({ caseId: 'case_wrong_org', organizationId: 'org_other' }),
    ],
  });

  assert.deepEqual(result.tasks.map((entry) => entry.caseId), ['case_allowed']);
});

test('wrong engineer tasks are excluded', () => {
  const result = buildEngineerMobileTaskList(validInput(), {
    tasks: [
      task({ caseId: 'case_allowed' }),
      task({ caseId: 'case_wrong_engineer', assignedEngineerId: 'eng_other' }),
    ],
  });

  assert.deepEqual(result.tasks.map((entry) => entry.caseId), ['case_allowed']);
});

test('mixed tasks only return assigned engineer within organization and date range', () => {
  const result = buildEngineerMobileTaskList(validInput({
    dateRange: {
      from: '2026-05-21',
      to: '2026-05-21',
    },
  }), {
    taskProvider: {
      tasks: [
        task({ caseId: 'case_allowed' }),
        task({ caseId: 'case_wrong_org', organizationId: 'org_other' }),
        task({ caseId: 'case_wrong_engineer', assignedEngineerId: 'eng_other' }),
        task({ caseId: 'case_out_of_range', scheduledStart: '2026-05-22T09:00:00+08:00' }),
      ],
    },
  });

  assert.deepEqual(result.tasks.map((entry) => entry.caseId), ['case_allowed']);
});

test('forbidden internal fields and raw identifiers are stripped', () => {
  const result = buildEngineerMobileTaskList(validInput(), {
    tasks: [task()],
  });

  assert.equal(result.tasks.length, 1);
  assert.equal(Object.prototype.hasOwnProperty.call(result.tasks[0], 'internalNote'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(result.tasks[0], 'auditLog'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(result.tasks[0], 'aiRawPayload'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(result.tasks[0], 'billingInternal'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(result.tasks[0], 'settlementInternal'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(result.tasks[0], 'rawPhone'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(result.tasks[0], 'rawAddress'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(result.tasks[0], 'rawLineUserId'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(result.tasks[0], 'finalAppointmentId'), false);
  assertSafeResult(result);
});

test('input and read model tasks are not mutated', () => {
  const input = validInput();
  const readModel = {
    tasks: [task()],
  };
  const beforeInput = clone(input);
  const beforeReadModel = clone(readModel);

  buildEngineerMobileTaskList(input, { readModel });

  assert.deepEqual(input, beforeInput);
  assert.deepEqual(readModel, beforeReadModel);
});

test('provider throws fail closed', () => {
  const result = buildEngineerMobileTaskList(validInput(), {
    taskProvider: {
      listTasks() {
        throw new Error('provider failure should not leak');
      },
    },
  });

  assert.deepEqual(result, { status: 'deny', tasks: [] });
});

test('service module has no DB, repository, provider, notification, AI, or RAG imports', () => {
  const source = fs.readFileSync(serviceFile, 'utf8');
  const specifiers = requireSpecifiers(source);

  assert.deepEqual(specifiers, []);
  assert.doesNotMatch(source, /require\(/);
  assert.doesNotMatch(source, /from ['"][^'"]*(db|pool|repository|transaction|provider|line|sms|email|push|ai|rag|vector)[^'"]*['"]/i);
});
