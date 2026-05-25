'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  buildEngineerMobileTaskDetail,
} = require('../../src/engineerMobile/engineerMobileTaskDetailService');

const repoRoot = path.resolve(__dirname, '../..');
const sourceFile = path.join(repoRoot, 'src/engineerMobile/engineerMobileTaskDetailService.js');

function input(overrides = {}) {
  return {
    appointmentId: 'apt_engineer_mobile_detail_001',
    engineerId: 'eng_engineer_mobile_detail_001',
    organizationId: 'org_engineer_mobile_detail_001',
    ...overrides,
  };
}

function task(overrides = {}) {
  return {
    appointmentId: 'apt_engineer_mobile_detail_001',
    caseId: 'case_engineer_mobile_detail_001',
    organizationId: 'org_engineer_mobile_detail_001',
    assignedEngineerId: 'eng_engineer_mobile_detail_001',
    scheduledStart: '2026-05-21T09:00:00+08:00',
    scheduledEnd: '2026-05-21T10:00:00+08:00',
    status: 'confirmed',
    customerNameMasked: '吳○○',
    customerPhoneMasked: '09xx-xxx-654',
    addressSummary: '台南市東區',
    productSummary: '冷氣',
    issueSummary: '滴水',
    serviceType: 'repair',
    siteNoteSafe: '請從管理室換證',
    checklistSummary: '需拍故障照片',
    evidenceRefs: [
      {
        id: 'att_safe_001',
        type: 'photo',
        label: '故障照片',
        token: 'evidence_token_should_not_leak',
        storagePath: 'storage_path_should_not_leak',
      },
    ],
    internalNote: 'internal_note_should_not_leak',
    auditLog: 'audit_log_should_not_leak',
    aiRawPayload: 'ai_raw_payload_should_not_leak',
    billingInternal: 'billing_internal_should_not_leak',
    settlementInternal: 'settlement_internal_should_not_leak',
    rawPhone: 'raw_phone_should_not_leak',
    rawAddress: 'raw_address_should_not_leak',
    rawLineUserId: 'line_user_should_not_leak',
    token: 'token_should_not_leak',
    secret: 'secret_should_not_leak',
    DATABASE_URL: 'DATABASE_URL_should_not_leak',
    finalAppointmentId: 'final_appointment_should_not_leak',
    fullCustomerPayload: 'full_customer_payload_should_not_leak',
    ...overrides,
  };
}

function assertDenied(result) {
  assert.deepEqual(result, {
    detail: null,
    status: 'deny',
  });
}

function assertNoForbiddenOutput(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
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
    'DATABASE_URL_should_not_leak',
    'final_appointment_should_not_leak',
    'full_customer_payload_should_not_leak',
    'evidence_token_should_not_leak',
    'storage_path_should_not_leak',
    'rawPhone',
    'rawAddress',
    'rawLineUserId',
    'finalAppointmentId',
    'fullCustomerPayload',
    'storagePath',
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

test('missing input and required ids deny safely', () => {
  assertDenied(buildEngineerMobileTaskDetail());
  assertDenied(buildEngineerMobileTaskDetail(input({ organizationId: undefined }), { tasks: [task()] }));
  assertDenied(buildEngineerMobileTaskDetail(input({ engineerId: undefined }), { tasks: [task()] }));
  assertDenied(buildEngineerMobileTaskDetail(input({ appointmentId: undefined }), { tasks: [task()] }));
});

test('matching task returns safe detail only', () => {
  const result = buildEngineerMobileTaskDetail(input(), {
    tasks: [task()],
  });

  assert.equal(result.status, 'allow');
  assert.deepEqual(result.detail, {
    appointmentId: 'apt_engineer_mobile_detail_001',
    caseId: 'case_engineer_mobile_detail_001',
    organizationId: 'org_engineer_mobile_detail_001',
    assignedEngineerId: 'eng_engineer_mobile_detail_001',
    scheduledStart: '2026-05-21T09:00:00+08:00',
    scheduledEnd: '2026-05-21T10:00:00+08:00',
    status: 'confirmed',
    customerNameMasked: '吳○○',
    customerPhoneMasked: '09xx-xxx-654',
    addressSummary: '台南市東區',
    productSummary: '冷氣',
    issueSummary: '滴水',
    serviceType: 'repair',
    siteNoteSafe: '請從管理室換證',
    checklistSummary: '需拍故障照片',
    evidenceRefs: [
      {
        id: 'att_safe_001',
        label: '故障照片',
        type: 'photo',
      },
    ],
  });
  assertNoForbiddenOutput(result);
});

test('wrong organization engineer or appointment deny safely', () => {
  assertDenied(buildEngineerMobileTaskDetail(input(), {
    tasks: [task({ organizationId: 'org_other' })],
  }));
  assertDenied(buildEngineerMobileTaskDetail(input(), {
    tasks: [task({ assignedEngineerId: 'eng_other' })],
  }));
  assertDenied(buildEngineerMobileTaskDetail(input(), {
    tasks: [task({ appointmentId: 'apt_other' })],
  }));
});

test('readModel and taskProvider function results are supported', () => {
  const readModelResult = buildEngineerMobileTaskDetail(input(), {
    readModel(query) {
      assert.deepEqual(query, input());
      return {
        tasks: [task({ caseId: 'case_read_model' })],
      };
    },
  });
  const taskProviderResult = buildEngineerMobileTaskDetail(input(), {
    taskProvider(query) {
      assert.deepEqual(query, input());
      return [task({ caseId: 'case_task_provider' })];
    },
  });

  assert.equal(readModelResult.detail.caseId, 'case_read_model');
  assert.equal(taskProviderResult.detail.caseId, 'case_task_provider');
});

test('provider throw and malformed result fail closed', () => {
  assertDenied(buildEngineerMobileTaskDetail(input(), {
    readModel() {
      throw new Error('provider failure should not leak');
    },
  }));
  assertDenied(buildEngineerMobileTaskDetail(input(), {
    readModel() {
      return { tasks: 'not-an-array' };
    },
  }));
});

test('input and task source are not mutated', () => {
  const sourceInput = input();
  const sourceTask = task();
  const beforeInput = JSON.stringify(sourceInput);
  const beforeTask = JSON.stringify(sourceTask);

  buildEngineerMobileTaskDetail(sourceInput, {
    tasks: [sourceTask],
  });

  assert.equal(JSON.stringify(sourceInput), beforeInput);
  assert.equal(JSON.stringify(sourceTask), beforeTask);
});

test('service source has no DB repository provider AI route app or server imports', () => {
  const source = fs.readFileSync(sourceFile, 'utf8');
  const specifiers = requireSpecifiers(source);

  assert.deepEqual(specifiers, []);

  for (const pattern of [
    /db|pool|transaction|repositories?/i,
    /line|sms|email|push/i,
    /rag|vector|openai/i,
  ]) {
    assert.equal(pattern.test(source), false, `forbidden source pattern ${pattern}`);
  }
});
