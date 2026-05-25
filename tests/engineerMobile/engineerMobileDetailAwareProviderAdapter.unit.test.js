'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  createEngineerMobileTaskDetailReadProvider,
  createEngineerMobileTaskListReadProvider,
  mapEngineerMobileTaskDetailRequest,
} = require('../../src/engineerMobile/engineerMobileTaskListReadProviderAdapter');
const {
  buildEngineerMobileTaskDetail,
} = require('../../src/engineerMobile/engineerMobileTaskDetailService');

const repoRoot = path.resolve(__dirname, '../..');
const adapterFile = path.join(repoRoot, 'src/engineerMobile/engineerMobileTaskListReadProviderAdapter.js');
const detailServiceFile = path.join(repoRoot, 'src/engineerMobile/engineerMobileTaskDetailService.js');

function auth(overrides = {}) {
  return {
    organizationId: 'org_engineer_mobile_detail_adapter_001',
    engineerId: 'eng_engineer_mobile_detail_adapter_001',
    ...overrides,
  };
}

function request(overrides = {}) {
  return {
    auth: auth(),
    body: {
      organizationId: 'body_org_should_be_ignored',
      engineerId: 'body_engineer_should_be_ignored',
      appointmentId: 'body_appointment_should_be_ignored',
      rawPhone: 'raw_phone_should_not_leak',
      rawAddress: 'raw_address_should_not_leak',
      rawLineUserId: 'line_user_should_not_leak',
      token: 'token_should_not_leak',
      secret: 'secret_should_not_leak',
      DATABASE_URL: 'DATABASE_URL_should_not_leak',
    },
    params: {
      appointmentId: 'apt_engineer_mobile_detail_adapter_001',
    },
    query: {
      from: '2026-05-21',
      to: '2026-05-28',
    },
    ...overrides,
  };
}

function detailInput(overrides = {}) {
  return {
    appointmentId: 'apt_engineer_mobile_detail_adapter_001',
    dateRange: {
      from: '2026-05-21',
      to: '2026-05-28',
    },
    engineerId: 'eng_engineer_mobile_detail_adapter_001',
    organizationId: 'org_engineer_mobile_detail_adapter_001',
    ...overrides,
  };
}

function task(overrides = {}) {
  return {
    appointmentId: 'apt_engineer_mobile_detail_adapter_001',
    caseId: 'case_engineer_mobile_detail_adapter_001',
    organizationId: 'org_engineer_mobile_detail_adapter_001',
    assignedEngineerId: 'eng_engineer_mobile_detail_adapter_001',
    scheduledStart: '2026-05-21T09:00:00+08:00',
    scheduledEnd: '2026-05-21T10:00:00+08:00',
    status: 'confirmed',
    customerNameMasked: '吳○○',
    customerPhoneMasked: '09xx-xxx-888',
    addressSummary: '台北市內湖區',
    productSummary: '冷氣',
    issueSummary: '漏水',
    serviceType: 'repair',
    evidenceRefs: [
      {
        id: 'safe_ref_001',
        type: 'photo',
        label: '故障照片',
        token: 'evidence_token_should_not_leak',
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
    ...overrides,
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertNoForbiddenOutput(value) {
  const serialized = JSON.stringify(value);

  for (const forbiddenValue of [
    'body_org_should_be_ignored',
    'body_engineer_should_be_ignored',
    'body_appointment_should_be_ignored',
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
    'provider failure should not leak',
    'final_appointment_should_not_leak',
    'evidence_token_should_not_leak',
  ]) {
    assert.equal(serialized.includes(forbiddenValue), false, `leaked ${forbiddenValue}`);
  }

  assert.equal(serialized.includes('"rawPhone"'), false);
  assert.equal(serialized.includes('"rawAddress"'), false);
  assert.equal(serialized.includes('"rawLineUserId"'), false);
  assert.equal(serialized.includes('"finalAppointmentId"'), false);
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

test('exports detail-aware provider and keeps list provider export', () => {
  assert.equal(typeof createEngineerMobileTaskDetailReadProvider, 'function');
  assert.equal(typeof createEngineerMobileTaskListReadProvider, 'function');
  assert.equal(typeof mapEngineerMobileTaskDetailRequest, 'function');
});

test('detail mapper uses auth org engineer params appointment and query date range', () => {
  const req = request();
  const before = clone(req);
  const mapped = mapEngineerMobileTaskDetailRequest(req);

  assert.deepEqual(mapped, detailInput());
  assert.deepEqual(req, before);
  assertNoForbiddenOutput(mapped);
});

test('detail mapper ignores body org engineer and appointment', () => {
  const mapped = mapEngineerMobileTaskDetailRequest(request({
    body: {
      organizationId: 'body_org_should_be_ignored',
      engineerId: 'body_engineer_should_be_ignored',
      appointmentId: 'body_appointment_should_be_ignored',
    },
  }));

  assert.deepEqual(mapped, detailInput());
  assertNoForbiddenOutput(mapped);
});

test('detail mapper fail-closes when auth org engineer or appointment is missing', () => {
  for (const req of [
    {},
    request({ auth: auth({ organizationId: undefined }) }),
    request({ auth: auth({ engineerId: undefined }) }),
    request({ params: {} }),
  ]) {
    assert.equal(mapEngineerMobileTaskDetailRequest(req), null);
  }
});

test('provider creation does not call repository readModel or taskProvider', () => {
  const calls = [];

  createEngineerMobileTaskDetailReadProvider({
    repository: {
      getTaskDetail(input) {
        calls.push(input);
        return { task: task() };
      },
    },
  });

  assert.deepEqual(calls, []);
});

test('repository.getTaskDetail receives mapped detail input and task result works through detail service', () => {
  const calls = [];
  const provider = createEngineerMobileTaskDetailReadProvider({
    repository: {
      getTaskDetail(input) {
        calls.push(input);
        return { task: task({ caseId: 'case_get_task_detail' }) };
      },
    },
  });
  const providerResult = provider.readModel(request());
  const detail = buildEngineerMobileTaskDetail(detailInput(), {
    readModel: providerResult,
  });

  assert.deepEqual(calls, [detailInput()]);
  assert.equal(detail.status, 'allow');
  assert.equal(detail.detail.caseId, 'case_get_task_detail');
  assertNoForbiddenOutput([providerResult, detail]);
});

test('repository.getTaskDetailAsync receives mapped detail input and task result works through detail service', async () => {
  const calls = [];
  const provider = createEngineerMobileTaskDetailReadProvider({
    repository: {
      async getTaskDetailAsync(input) {
        calls.push(input);
        return { task: task({ caseId: 'case_async_get_task_detail' }) };
      },
    },
  });
  const providerResult = await provider.readModelAsync(request());
  const detail = await buildEngineerMobileTaskDetail(detailInput(), {
    readModel: providerResult,
  });

  assert.deepEqual(calls, [detailInput()]);
  assert.equal(detail.status, 'allow');
  assert.equal(detail.detail.caseId, 'case_async_get_task_detail');
  assertNoForbiddenOutput([providerResult, detail]);
});

test('repository.getReadModel fallback receives mapped detail input', () => {
  const calls = [];
  const provider = createEngineerMobileTaskDetailReadProvider({
    repository: {
      getReadModel(input) {
        calls.push(input);
        return { tasks: [task({ caseId: 'case_get_read_model' })] };
      },
    },
  });
  const detail = buildEngineerMobileTaskDetail(detailInput(), {
    readModel: provider.readModel(request()),
  });

  assert.deepEqual(calls, [detailInput()]);
  assert.equal(detail.detail.caseId, 'case_get_read_model');
  assertNoForbiddenOutput(detail);
});

test('repository.getTaskList fallback receives mapped detail input', () => {
  const calls = [];
  const provider = createEngineerMobileTaskDetailReadProvider({
    repository: {
      getTaskList(input) {
        calls.push(input);
        return [task({ caseId: 'case_get_task_list' })];
      },
    },
  });
  const detail = buildEngineerMobileTaskDetail(detailInput(), {
    readModel: provider.readModel(request()),
  });

  assert.deepEqual(calls, [detailInput()]);
  assert.equal(detail.detail.caseId, 'case_get_task_list');
  assertNoForbiddenOutput(detail);
});

test('readModel and taskProvider detail methods receive mapped input', () => {
  for (const sourceName of ['readModel', 'taskProvider']) {
    const calls = [];
    const provider = createEngineerMobileTaskDetailReadProvider({
      [sourceName]: {
        getTaskDetail(input) {
          calls.push(input);
          return { task: task({ caseId: `case_${sourceName}` }) };
        },
      },
    });
    const detail = buildEngineerMobileTaskDetail(detailInput(), {
      readModel: provider.taskProvider(request()),
    });

    assert.deepEqual(calls, [detailInput()]);
    assert.equal(detail.detail.caseId, `case_${sourceName}`);
    assertNoForbiddenOutput(detail);
  }
});

test('direct function readModel and taskProvider receive mapped detail input', () => {
  for (const sourceName of ['readModel', 'taskProvider']) {
    const calls = [];
    const provider = createEngineerMobileTaskDetailReadProvider({
      [sourceName](input) {
        calls.push(input);
        return { task: task({ caseId: `case_function_${sourceName}` }) };
      },
    });
    const detail = buildEngineerMobileTaskDetail(detailInput(), {
      readModel: provider.readModel(request()),
    });

    assert.deepEqual(calls, [detailInput()]);
    assert.equal(detail.detail.caseId, `case_function_${sourceName}`);
    assertNoForbiddenOutput(detail);
  }
});

test('provider returning tasks result works through detail service', () => {
  const provider = createEngineerMobileTaskDetailReadProvider({
    repository: {
      getTaskDetail() {
        return {
          tasks: [
            task({ appointmentId: 'apt_other', caseId: 'case_other' }),
            task({ caseId: 'case_tasks_result' }),
          ],
        };
      },
    },
  });
  const detail = buildEngineerMobileTaskDetail(detailInput(), {
    readModel: provider.readModel(request()),
  });

  assert.equal(detail.status, 'allow');
  assert.equal(detail.detail.caseId, 'case_tasks_result');
  assertNoForbiddenOutput(detail);
});

test('wrong org engineer or appointment is still filtered by detail service', () => {
  for (const sourceTask of [
    task({ organizationId: 'org_other' }),
    task({ assignedEngineerId: 'eng_other' }),
    task({ appointmentId: 'apt_other' }),
  ]) {
    const provider = createEngineerMobileTaskDetailReadProvider({
      repository: {
        getTaskDetail() {
          return { task: sourceTask };
        },
      },
    });
    const detail = buildEngineerMobileTaskDetail(detailInput(), {
      readModel: provider.readModel(request()),
    });

    assert.deepEqual(detail, { detail: null, status: 'deny' });
  }
});

test('provider throw malformed result and missing mapped input fail closed', () => {
  for (const provider of [
    createEngineerMobileTaskDetailReadProvider({
      repository: {
        getTaskDetail() {
          throw new Error('provider failure should not leak');
        },
      },
    }),
    createEngineerMobileTaskDetailReadProvider({
      repository: {
        getTaskDetail() {
          return { malformed: [task()] };
        },
      },
    }),
  ]) {
    const detail = buildEngineerMobileTaskDetail(detailInput(), {
      readModel: provider.readModel(request()),
    });

    assert.deepEqual(detail, { detail: null, status: 'deny' });
    assertNoForbiddenOutput(detail);
  }

  const provider = createEngineerMobileTaskDetailReadProvider({
    repository: {
      getTaskDetail() {
        return { task: task() };
      },
    },
  });

  assert.deepEqual(provider.readModel({}), { tasks: [] });
});

test('module import boundaries stay away from DB route app server provider sending and AI', () => {
  const adapterSource = fs.readFileSync(adapterFile, 'utf8');
  const detailServiceSource = fs.readFileSync(detailServiceFile, 'utf8');

  assert.deepEqual(requireSpecifiers(adapterSource), [
    './engineerMobileTaskListService',
    './engineerMobileTaskDetailService',
  ]);
  assert.deepEqual(requireSpecifiers(detailServiceSource), []);

  for (const [label, source] of [
    ['adapter', adapterSource],
    ['detailService', detailServiceSource],
  ]) {
    assert.equal(/db|pool|transaction|repositories?/i.test(source), false, `${label} imports DB`);
    assert.equal(/lineProvider|sms|email|push|rag|vector|openai/i.test(source), false, `${label} imports provider or AI`);
    assert.equal(/require\(['"].*(routes?|controllers?|app|server)['"]\)/i.test(source), false, `${label} imports route/app/server`);
  }
});
