'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  ENGINEER_MOBILE_READ_REPOSITORY_METHODS,
  ENGINEER_MOBILE_READ_REPOSITORY_NAME,
  createEngineerMobileReadRepository,
} = require('../../src/engineerMobile/engineerMobileReadRepository');

const repoRoot = path.resolve(__dirname, '../..');
const repositoryFile = path.join(repoRoot, 'src/engineerMobile/engineerMobileReadRepository.js');

function listInput(overrides = {}) {
  return {
    organizationId: 'org_engineer_mobile_composite_repo_001',
    engineerId: 'eng_engineer_mobile_composite_repo_001',
    dateRange: {
      from: '2026-05-21',
      to: '2026-05-28',
    },
    ...overrides,
  };
}

function detailInput(overrides = {}) {
  return {
    appointmentId: 'apt_engineer_mobile_composite_repo_001',
    engineerId: 'eng_engineer_mobile_composite_repo_001',
    organizationId: 'org_engineer_mobile_composite_repo_001',
    ...overrides,
  };
}

function listRow(overrides = {}) {
  return {
    case_id: 'case_engineer_mobile_composite_list_001',
    appointment_id: 'apt_engineer_mobile_composite_repo_001',
    organization_id: 'org_engineer_mobile_composite_repo_001',
    assigned_engineer_id: 'eng_engineer_mobile_composite_repo_001',
    scheduled_start: '2026-05-21T09:00:00+08:00',
    scheduled_end: '2026-05-21T10:00:00+08:00',
    appointment_status: 'confirmed',
    customer_name_masked: '王○○',
    customer_phone_masked: '09xx-xxx-123',
    address_summary: '台北市大安區',
    product_summary: '冷氣',
    issue_summary: '不冷',
    service_type: 'repair',
    internal_note: 'internal_note_should_not_leak',
    audit_log: 'audit_log_should_not_leak',
    ai_raw_payload: 'ai_raw_payload_should_not_leak',
    billing_internal: 'billing_internal_should_not_leak',
    settlement_internal: 'settlement_internal_should_not_leak',
    raw_phone: 'raw_phone_should_not_leak',
    raw_address: 'raw_address_should_not_leak',
    raw_line_user_id: 'line_user_should_not_leak',
    token: 'token_should_not_leak',
    secret: 'secret_should_not_leak',
    DATABASE_URL: 'DATABASE_URL_should_not_leak',
    final_appointment_id: 'final_appointment_should_not_leak',
    finalAppointmentId: 'final_appointment_should_not_leak',
    ...overrides,
  };
}

function detailRow(overrides = {}) {
  return {
    organization_id: 'org_engineer_mobile_composite_repo_001',
    case_id: 'case_engineer_mobile_composite_detail_001',
    appointment_id: 'apt_engineer_mobile_composite_repo_001',
    assigned_engineer_id: 'eng_engineer_mobile_composite_repo_001',
    scheduled_start: '2026-05-21T09:00:00+08:00',
    scheduled_end: '2026-05-21T10:00:00+08:00',
    status: 'confirmed',
    customer_name_masked: '林○○',
    customer_phone_masked: '09xx-xxx-456',
    address_summary: '新北市板橋區',
    product_summary: '冷氣',
    issue_summary: '異音',
    service_type: 'repair',
    site_note_safe: '請先聯絡管理室',
    checklist_summary: ['confirm_power', 'take_photo'],
    evidence_refs: [
      {
        id: 'safe_composite_ref_001',
        type: 'photo',
        label: '故障照片',
      },
      {
        id: 'unsafe_signed_url',
        type: 'photo',
        url: 'https://example.invalid/signed-url',
      },
      'safe_composite_ref_002',
      'https://example.invalid/raw-photo',
    ],
    internal_note: 'internal_note_should_not_leak',
    audit_log: 'audit_log_should_not_leak',
    ai_raw_payload: 'ai_raw_payload_should_not_leak',
    billing_internal: 'billing_internal_should_not_leak',
    settlement_internal: 'settlement_internal_should_not_leak',
    raw_phone: 'raw_phone_should_not_leak',
    raw_address: 'raw_address_should_not_leak',
    raw_line_user_id: 'line_user_should_not_leak',
    token: 'token_should_not_leak',
    secret: 'secret_should_not_leak',
    DATABASE_URL: 'DATABASE_URL_should_not_leak',
    final_appointment_id: 'final_appointment_should_not_leak',
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
    'executor failure should not leak',
    'final_appointment_should_not_leak',
    'signed-url',
    'raw-photo',
  ]) {
    assert.equal(serialized.includes(forbiddenValue), false, `leaked ${forbiddenValue}`);
  }

  assert.equal(serialized.includes('"rawPhone"'), false);
  assert.equal(serialized.includes('"rawAddress"'), false);
  assert.equal(serialized.includes('"rawLineUserId"'), false);
  assert.equal(serialized.includes('"raw_line_user_id"'), false);
  assert.equal(serialized.includes('"finalAppointmentId"'), false);
  assert.equal(serialized.includes('"final_appointment_id"'), false);
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

test('exports composite repository factory and constants', () => {
  assert.equal(typeof createEngineerMobileReadRepository, 'function');
  assert.equal(ENGINEER_MOBILE_READ_REPOSITORY_NAME, 'engineerMobileReadRepository');
  assert.deepEqual(ENGINEER_MOBILE_READ_REPOSITORY_METHODS, [
    'getTaskList',
    'getTaskListAsync',
    'getReadModel',
    'getReadModelAsync',
    'getTaskDetail',
    'getTaskDetailAsync',
  ]);
});

test('repository exposes getTaskList getReadModel and getTaskDetail', () => {
  const repository = createEngineerMobileReadRepository();

  assert.equal(repository.name, 'engineerMobileReadRepository');
  assert.equal(typeof repository.getTaskList, 'function');
  assert.equal(typeof repository.getTaskListAsync, 'function');
  assert.equal(typeof repository.getReadModel, 'function');
  assert.equal(typeof repository.getReadModelAsync, 'function');
  assert.equal(typeof repository.getTaskDetail, 'function');
  assert.equal(typeof repository.getTaskDetailAsync, 'function');
  assert.deepEqual(repository.methods, [
    'getTaskList',
    'getTaskListAsync',
    'getReadModel',
    'getReadModelAsync',
    'getTaskDetail',
    'getTaskDetailAsync',
  ]);
});

test('missing input list and detail fail-close', () => {
  const repository = createEngineerMobileReadRepository({
    allowNonExecutableForTest: true,
    executor() {
      return { rows: [listRow(), detailRow()] };
    },
  });

  assert.deepEqual(repository.getTaskList(), { tasks: [] });
  assert.deepEqual(repository.getTaskDetail(), { task: null });
  assert.deepEqual(repository.getReadModel(), { tasks: [] });
});

test('default mode does not call executor', () => {
  const calls = [];
  const repository = createEngineerMobileReadRepository({
    executor(querySpec) {
      calls.push(querySpec);
      return { rows: [listRow(), detailRow()] };
    },
  });

  assert.deepEqual(repository.getTaskList(listInput()), { tasks: [] });
  assert.deepEqual(repository.getTaskDetail(detailInput()), { task: null });
  assert.deepEqual(calls, []);
});

test('single shared executor is used for list and detail when no specific executors provided', () => {
  const calls = [];
  const repository = createEngineerMobileReadRepository({
    executor(querySpec) {
      calls.push(querySpec.name);

      if (querySpec.name === 'engineerMobileTaskDetailReadModel') {
        return { rows: [detailRow({ case_id: 'case_shared_detail' })] };
      }

      return { rows: [listRow({ case_id: 'case_shared_list' })] };
    },
    allowNonExecutableForTest: true,
  });

  assert.equal(repository.getTaskList(listInput()).tasks[0].caseId, 'case_shared_list');
  assert.equal(repository.getTaskDetail(detailInput()).task.caseId, 'case_shared_detail');
  assert.deepEqual(calls, [
    'engineerMobileTaskListReadModel',
    'engineerMobileTaskDetailReadModel',
  ]);
});

test('listExecutor is used for list path', () => {
  const listCalls = [];
  const detailCalls = [];
  const repository = createEngineerMobileReadRepository({
    listExecutor(querySpec) {
      listCalls.push(querySpec.name);
      return { rows: [listRow({ case_id: 'case_list_executor' })] };
    },
    detailExecutor(querySpec) {
      detailCalls.push(querySpec.name);
      return { rows: [detailRow({ case_id: 'case_detail_executor' })] };
    },
    allowNonExecutableForTest: true,
  });

  assert.equal(repository.getTaskList(listInput()).tasks[0].caseId, 'case_list_executor');
  assert.deepEqual(listCalls, ['engineerMobileTaskListReadModel']);
  assert.deepEqual(detailCalls, []);
});

test('detailExecutor is used for detail path', () => {
  const listCalls = [];
  const detailCalls = [];
  const repository = createEngineerMobileReadRepository({
    listExecutor(querySpec) {
      listCalls.push(querySpec.name);
      return { rows: [listRow({ case_id: 'case_list_executor' })] };
    },
    detailExecutor(querySpec) {
      detailCalls.push(querySpec.name);
      return { rows: [detailRow({ case_id: 'case_detail_executor' })] };
    },
    allowNonExecutableForTest: true,
  });

  assert.equal(repository.getTaskDetail(detailInput()).task.caseId, 'case_detail_executor');
  assert.deepEqual(listCalls, []);
  assert.deepEqual(detailCalls, ['engineerMobileTaskDetailReadModel']);
});

test('getTaskList returns list tasks in synthetic mode', () => {
  const repository = createEngineerMobileReadRepository({
    listExecutor() {
      return {
        rows: [
          listRow({ case_id: 'case_list_allowed' }),
          listRow({ case_id: 'case_list_wrong_org', organization_id: 'org_other' }),
          listRow({ case_id: 'case_list_wrong_engineer', assigned_engineer_id: 'eng_other' }),
        ],
      };
    },
    allowNonExecutableForTest: true,
  });
  const result = repository.getTaskList(listInput());

  assert.deepEqual(result.tasks.map((task) => task.caseId), ['case_list_allowed']);
  assertNoForbiddenOutput(result);
});

test('getTaskDetail returns detail task in synthetic mode', () => {
  const repository = createEngineerMobileReadRepository({
    detailExecutor() {
      return {
        rows: [
          detailRow({ case_id: 'case_detail_allowed' }),
          detailRow({ case_id: 'case_detail_wrong_org', organization_id: 'org_other' }),
          detailRow({ case_id: 'case_detail_wrong_engineer', assigned_engineer_id: 'eng_other' }),
          detailRow({ case_id: 'case_detail_wrong_appointment', appointment_id: 'apt_other' }),
        ],
      };
    },
    allowNonExecutableForTest: true,
  });
  const result = repository.getTaskDetail(detailInput());

  assert.equal(result.task.caseId, 'case_detail_allowed');
  assertNoForbiddenOutput(result);
});

test('getReadModel without appointmentId uses list path', () => {
  const listCalls = [];
  const detailCalls = [];
  const repository = createEngineerMobileReadRepository({
    listExecutor(querySpec) {
      listCalls.push(querySpec.name);
      return { rows: [listRow({ case_id: 'case_read_model_list' })] };
    },
    detailExecutor(querySpec) {
      detailCalls.push(querySpec.name);
      return { rows: [detailRow({ case_id: 'case_read_model_detail' })] };
    },
    allowNonExecutableForTest: true,
  });
  const result = repository.getReadModel(listInput());

  assert.deepEqual(result.tasks.map((task) => task.caseId), ['case_read_model_list']);
  assert.deepEqual(listCalls, ['engineerMobileTaskListReadModel']);
  assert.deepEqual(detailCalls, []);
});

test('getReadModel with appointmentId uses detail path and returns compatible detail shape', () => {
  const listCalls = [];
  const detailCalls = [];
  const repository = createEngineerMobileReadRepository({
    listExecutor(querySpec) {
      listCalls.push(querySpec.name);
      return { rows: [listRow({ case_id: 'case_read_model_list' })] };
    },
    detailExecutor(querySpec) {
      detailCalls.push(querySpec.name);
      return { rows: [detailRow({ case_id: 'case_read_model_detail' })] };
    },
    allowNonExecutableForTest: true,
  });
  const result = repository.getReadModel(detailInput());

  assert.equal(result.task.caseId, 'case_read_model_detail');
  assert.deepEqual(listCalls, []);
  assert.deepEqual(detailCalls, ['engineerMobileTaskDetailReadModel']);
});

test('async list detail and readModel methods support promise executors', async () => {
  const listCalls = [];
  const detailCalls = [];
  const repository = createEngineerMobileReadRepository({
    async listExecutor(querySpec) {
      listCalls.push(querySpec.name);
      return { rows: [listRow({ case_id: 'case_async_list' })] };
    },
    async detailExecutor(querySpec) {
      detailCalls.push(querySpec.name);
      return { rows: [detailRow({ case_id: 'case_async_detail' })] };
    },
    allowNonExecutableForTest: true,
  });

  const listResult = await repository.getTaskListAsync(listInput());
  const detailResult = await repository.getTaskDetailAsync(detailInput());
  const readListResult = await repository.getReadModelAsync(listInput());
  const readDetailResult = await repository.getReadModelAsync(detailInput());

  assert.deepEqual(listResult.tasks.map((task) => task.caseId), ['case_async_list']);
  assert.equal(detailResult.task.caseId, 'case_async_detail');
  assert.deepEqual(readListResult.tasks.map((task) => task.caseId), ['case_async_list']);
  assert.equal(readDetailResult.task.caseId, 'case_async_detail');
  assert.deepEqual(listCalls, [
    'engineerMobileTaskListReadModel',
    'engineerMobileTaskListReadModel',
  ]);
  assert.deepEqual(detailCalls, [
    'engineerMobileTaskDetailReadModel',
    'engineerMobileTaskDetailReadModel',
  ]);
  assertNoForbiddenOutput({ listResult, detailResult, readListResult, readDetailResult });
});

test('async shared executor rejection fail-closes without raw error leak', async () => {
  const repository = createEngineerMobileReadRepository({
    async executor() {
      throw new Error('executor failure should not leak');
    },
    allowNonExecutableForTest: true,
  });

  const listResult = await repository.getTaskListAsync(listInput());
  const detailResult = await repository.getTaskDetailAsync(detailInput());

  assert.deepEqual(listResult, { tasks: [] });
  assert.deepEqual(detailResult, { task: null });
  assertNoForbiddenOutput({ listResult, detailResult });
});

test('wrong organization engineer and appointment are filtered', () => {
  const repository = createEngineerMobileReadRepository({
    listExecutor() {
      return {
        rows: [
          listRow({ case_id: 'case_wrong_org', organization_id: 'org_other' }),
          listRow({ case_id: 'case_wrong_engineer', assigned_engineer_id: 'eng_other' }),
        ],
      };
    },
    detailExecutor() {
      return {
        rows: [
          detailRow({ case_id: 'case_wrong_org', organization_id: 'org_other' }),
          detailRow({ case_id: 'case_wrong_engineer', assigned_engineer_id: 'eng_other' }),
          detailRow({ case_id: 'case_wrong_appointment', appointment_id: 'apt_other' }),
        ],
      };
    },
    allowNonExecutableForTest: true,
  });

  assert.deepEqual(repository.getTaskList(listInput()), { tasks: [] });
  assert.deepEqual(repository.getTaskDetail(detailInput()), { task: null });
});

test('sensitive internal and finalAppointmentId fields are stripped in both list and detail results', () => {
  const repository = createEngineerMobileReadRepository({
    listExecutor() {
      return { rows: [listRow()] };
    },
    detailExecutor() {
      return { rows: [detailRow()] };
    },
    allowNonExecutableForTest: true,
  });

  assertNoForbiddenOutput(repository.getTaskList(listInput()));
  assertNoForbiddenOutput(repository.getTaskDetail(detailInput()));
});

test('executor throw fail-closes without raw error leak', () => {
  const repository = createEngineerMobileReadRepository({
    executor() {
      throw new Error('executor failure should not leak');
    },
    allowNonExecutableForTest: true,
  });

  const listResult = repository.getTaskList(listInput());
  const detailResult = repository.getTaskDetail(detailInput());

  assert.deepEqual(listResult, { tasks: [] });
  assert.deepEqual(detailResult, { task: null });
  assertNoForbiddenOutput([listResult, detailResult]);
});

test('input object is not mutated', () => {
  const listRequest = listInput();
  const detailRequest = detailInput();
  const beforeList = clone(listRequest);
  const beforeDetail = clone(detailRequest);
  const repository = createEngineerMobileReadRepository({
    listExecutor() {
      return { rows: [listRow()] };
    },
    detailExecutor() {
      return { rows: [detailRow()] };
    },
    allowNonExecutableForTest: true,
  });

  repository.getTaskList(listRequest);
  repository.getTaskDetail(detailRequest);

  assert.deepEqual(listRequest, beforeList);
  assert.deepEqual(detailRequest, beforeDetail);
});

test('executor objects are not mutated beyond their own call tracking', () => {
  const listExecutor = {
    marker: 'list_keep',
    calls: [],
    execute(querySpec) {
      this.calls.push(querySpec.name);
      return { rows: [listRow()] };
    },
  };
  const detailExecutor = {
    marker: 'detail_keep',
    calls: [],
    execute(querySpec) {
      this.calls.push(querySpec.name);
      return { rows: [detailRow()] };
    },
  };
  const repository = createEngineerMobileReadRepository({
    listExecutor,
    detailExecutor,
    allowNonExecutableForTest: true,
  });

  repository.getTaskList(listInput());
  repository.getTaskDetail(detailInput());

  assert.equal(listExecutor.marker, 'list_keep');
  assert.equal(detailExecutor.marker, 'detail_keep');
  assert.deepEqual(listExecutor.calls, ['engineerMobileTaskListReadModel']);
  assert.deepEqual(detailExecutor.calls, ['engineerMobileTaskDetailReadModel']);
});

test('no logging side effects on executor failure', () => {
  const originalLog = console.log;
  const originalError = console.error;
  const logCalls = [];
  const repository = createEngineerMobileReadRepository({
    executor() {
      throw new Error('executor failure should not leak');
    },
    allowNonExecutableForTest: true,
  });

  console.log = (...args) => {
    logCalls.push(['log', ...args]);
  };
  console.error = (...args) => {
    logCalls.push(['error', ...args]);
  };

  try {
    assert.deepEqual(repository.getTaskList(listInput()), { tasks: [] });
    assert.deepEqual(repository.getTaskDetail(detailInput()), { task: null });
  } finally {
    console.log = originalLog;
    console.error = originalError;
  }

  assert.deepEqual(logCalls, []);
});

test('module import boundary has only list and detail read repository imports', () => {
  const source = fs.readFileSync(repositoryFile, 'utf8');
  const specifiers = requireSpecifiers(source);

  assert.deepEqual(specifiers, [
    './engineerMobileTaskListReadRepository',
    './engineerMobileTaskDetailReadRepository',
  ]);
  assert.equal(specifiers.some((specifier) => /db|pool|transaction|provider|line|sms|email|push|openai|aiProvider|ai_|rag|vector|routes?|controllers?|(^|\/|\.)app($|\.|\/)|(^|\/|\.)server($|\.|\/)/i.test(specifier)), false);
});
