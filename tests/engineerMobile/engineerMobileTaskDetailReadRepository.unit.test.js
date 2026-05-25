'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  ENGINEER_MOBILE_TASK_DETAIL_READ_REPOSITORY_NAME,
  ENGINEER_MOBILE_TASK_DETAIL_REPOSITORY_METHODS,
  createEngineerMobileTaskDetailReadRepository,
} = require('../../src/engineerMobile/engineerMobileTaskDetailReadRepository');

const repoRoot = path.resolve(__dirname, '../..');
const repositoryFile = path.join(repoRoot, 'src/engineerMobile/engineerMobileTaskDetailReadRepository.js');

function input(overrides = {}) {
  return {
    appointmentId: 'apt_engineer_mobile_detail_repo_001',
    engineerId: 'eng_engineer_mobile_detail_repo_001',
    organizationId: 'org_engineer_mobile_detail_repo_001',
    ...overrides,
  };
}

function row(overrides = {}) {
  return {
    organization_id: 'org_engineer_mobile_detail_repo_001',
    case_id: 'case_engineer_mobile_detail_repo_001',
    appointment_id: 'apt_engineer_mobile_detail_repo_001',
    assigned_engineer_id: 'eng_engineer_mobile_detail_repo_001',
    scheduled_start: '2026-05-21T09:00:00+08:00',
    scheduled_end: '2026-05-21T10:00:00+08:00',
    status: 'confirmed',
    customer_name_masked: '王○○',
    customer_phone_masked: '09xx-xxx-123',
    address_summary: '台北市大安區',
    product_summary: '冷氣',
    issue_summary: '不冷',
    service_type: 'repair',
    site_note_safe: '請從側門進入',
    checklist_summary: ['confirm_power', 'take_photo'],
    evidence_refs: [
      {
        id: 'photo_ref_detail_repo_001',
        type: 'photo',
        label: '故障照片',
      },
      {
        id: 'unsafe_signed_url',
        type: 'photo',
        url: 'https://example.invalid/signed-url',
      },
      'photo_ref_detail_repo_002',
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

  assert.equal(serialized.includes('internal_note'), false);
  assert.equal(serialized.includes('audit_log'), false);
  assert.equal(serialized.includes('ai_raw_payload'), false);
  assert.equal(serialized.includes('billing_internal'), false);
  assert.equal(serialized.includes('settlement_internal'), false);
  assert.equal(serialized.includes('raw_phone'), false);
  assert.equal(serialized.includes('raw_address'), false);
  assert.equal(serialized.includes('raw_line_user_id'), false);
  assert.equal(serialized.includes('final_appointment_id'), false);
  assert.equal(serialized.includes('finalAppointmentId'), false);
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

test('exports repository factory and constants', () => {
  assert.equal(typeof createEngineerMobileTaskDetailReadRepository, 'function');
  assert.equal(
    ENGINEER_MOBILE_TASK_DETAIL_READ_REPOSITORY_NAME,
    'engineerMobileTaskDetailReadRepository',
  );
  assert.deepEqual(ENGINEER_MOBILE_TASK_DETAIL_REPOSITORY_METHODS, [
    'getTaskDetail',
    'getTaskDetailAsync',
    'getReadModel',
    'getReadModelAsync',
  ]);
});

test('repository exposes getTaskDetail and getReadModel', () => {
  const repository = createEngineerMobileTaskDetailReadRepository();

  assert.equal(repository.name, 'engineerMobileTaskDetailReadRepository');
  assert.equal(typeof repository.getTaskDetail, 'function');
  assert.equal(typeof repository.getTaskDetailAsync, 'function');
  assert.equal(typeof repository.getReadModel, 'function');
  assert.equal(typeof repository.getReadModelAsync, 'function');
  assert.deepEqual(repository.methods, [
    'getTaskDetail',
    'getTaskDetailAsync',
    'getReadModel',
    'getReadModelAsync',
  ]);
});

test('missing input returns null and executor not called', () => {
  const calls = [];
  const repository = createEngineerMobileTaskDetailReadRepository({
    executor(querySpec) {
      calls.push(querySpec);
      return { rows: [row()] };
    },
    allowNonExecutableForTest: true,
  });

  assert.deepEqual(repository.getTaskDetail(), { task: null });
  assert.deepEqual(calls, []);
});

test('missing organizationId returns null and executor not called', () => {
  const calls = [];
  const repository = createEngineerMobileTaskDetailReadRepository({
    executor(querySpec) {
      calls.push(querySpec);
      return { rows: [row()] };
    },
    allowNonExecutableForTest: true,
  });

  assert.deepEqual(repository.getTaskDetail(input({ organizationId: '' })), { task: null });
  assert.deepEqual(calls, []);
});

test('missing engineerId returns null and executor not called', () => {
  const calls = [];
  const repository = createEngineerMobileTaskDetailReadRepository({
    executor(querySpec) {
      calls.push(querySpec);
      return { rows: [row()] };
    },
    allowNonExecutableForTest: true,
  });

  assert.deepEqual(repository.getTaskDetail(input({ engineerId: '' })), { task: null });
  assert.deepEqual(calls, []);
});

test('missing appointmentId returns null and executor not called', () => {
  const calls = [];
  const repository = createEngineerMobileTaskDetailReadRepository({
    executor(querySpec) {
      calls.push(querySpec);
      return { rows: [row()] };
    },
    allowNonExecutableForTest: true,
  });

  assert.deepEqual(repository.getTaskDetail(input({ appointmentId: '' })), { task: null });
  assert.deepEqual(calls, []);
});

test('default non-executable mode does not call executor', () => {
  const calls = [];
  const repository = createEngineerMobileTaskDetailReadRepository({
    executor(querySpec) {
      calls.push(querySpec);
      return { rows: [row()] };
    },
  });

  assert.deepEqual(repository.getTaskDetail(input()), { task: null });
  assert.deepEqual(calls, []);
});

test('allowNonExecutableForTest calls sync function executor', () => {
  const calls = [];
  const repository = createEngineerMobileTaskDetailReadRepository({
    executor(querySpec) {
      calls.push(querySpec);
      return {
        rows: [row({ case_id: 'case_allowed' })],
      };
    },
    allowNonExecutableForTest: true,
  });
  const result = repository.getTaskDetail(input());

  assert.equal(calls.length, 1);
  assert.equal(result.task.caseId, 'case_allowed');
  assertNoForbiddenOutput(result);
});

test('object executor .execute() is supported', () => {
  const executor = {
    calls: [],
    execute(querySpec) {
      this.calls.push(querySpec);
      return [row({ case_id: 'case_object_executor_allowed' })];
    },
  };
  const beforeExecutor = clone({ calls: executor.calls });
  const repository = createEngineerMobileTaskDetailReadRepository({
    executor,
    allowNonExecutableForTest: true,
  });
  const result = repository.getReadModel(input());

  assert.deepEqual(beforeExecutor, { calls: [] });
  assert.equal(executor.calls.length, 1);
  assert.equal(result.task.caseId, 'case_object_executor_allowed');
  assertNoForbiddenOutput(result);
});

test('async function executor is supported through async read methods', async () => {
  const calls = [];
  const repository = createEngineerMobileTaskDetailReadRepository({
    async executor(querySpec) {
      calls.push(querySpec.name);
      return {
        rows: [row({ case_id: 'case_async_executor_allowed' })],
      };
    },
    allowNonExecutableForTest: true,
  });
  const result = await repository.getTaskDetailAsync(input());

  assert.deepEqual(calls, ['engineerMobileTaskDetailReadModel']);
  assert.equal(result.task.caseId, 'case_async_executor_allowed');
  assertNoForbiddenOutput(result);
});

test('async object executor .execute() is supported through async read methods', async () => {
  const executor = {
    calls: [],
    async execute(querySpec) {
      this.calls.push(querySpec.name);
      return {
        rows: [row({ case_id: 'case_async_object_executor_allowed' })],
      };
    },
  };
  const repository = createEngineerMobileTaskDetailReadRepository({
    executor,
    allowNonExecutableForTest: true,
  });
  const result = await repository.getReadModelAsync(input());

  assert.deepEqual(executor.calls, ['engineerMobileTaskDetailReadModel']);
  assert.equal(result.task.caseId, 'case_async_object_executor_allowed');
  assertNoForbiddenOutput(result);
});

test('async executor rejection fail-closes without raw error leak', async () => {
  const repository = createEngineerMobileTaskDetailReadRepository({
    async executor() {
      throw new Error('executor failure should not leak');
    },
    allowNonExecutableForTest: true,
  });
  const result = await repository.getTaskDetailAsync(input());

  assert.deepEqual(result, { task: null });
  assertNoForbiddenOutput(result);
});

test('executor throw returns null without raw error leak', () => {
  const repository = createEngineerMobileTaskDetailReadRepository({
    executor() {
      throw new Error('executor failure should not leak');
    },
    allowNonExecutableForTest: true,
  });
  const result = repository.getTaskDetail(input());

  assert.deepEqual(result, { task: null });
  assertNoForbiddenOutput(result);
});

test('executor malformed result returns null', () => {
  const repository = createEngineerMobileTaskDetailReadRepository({
    executor() {
      return { notRows: [row()] };
    },
    allowNonExecutableForTest: true,
  });

  assert.deepEqual(repository.getTaskDetail(input()), { task: null });
});

test('valid rows mapped to safe detail readModel', () => {
  const repository = createEngineerMobileTaskDetailReadRepository({
    executor() {
      return {
        rows: [row({ case_id: 'case_allowed' })],
      };
    },
    allowNonExecutableForTest: true,
  });
  const result = repository.getTaskDetail(input());

  assert.equal(result.task.caseId, 'case_allowed');
  assert.equal(result.task.organizationId, 'org_engineer_mobile_detail_repo_001');
  assert.equal(result.task.appointmentId, 'apt_engineer_mobile_detail_repo_001');
  assert.equal(result.task.assignedEngineerId, 'eng_engineer_mobile_detail_repo_001');
  assert.equal(result.task.customerNameMasked, '王○○');
  assert.equal(result.task.customerPhoneMasked, '09xx-xxx-123');
  assertNoForbiddenOutput(result);
});

test('wrong organization engineer and appointment rows are excluded', () => {
  const repository = createEngineerMobileTaskDetailReadRepository({
    executor() {
      return {
        rows: [
          row({ case_id: 'case_wrong_org', organization_id: 'org_other' }),
          row({ case_id: 'case_wrong_engineer', assigned_engineer_id: 'eng_other' }),
          row({ case_id: 'case_wrong_appointment', appointment_id: 'apt_other' }),
          row({ case_id: 'case_allowed' }),
        ],
      };
    },
    allowNonExecutableForTest: true,
  });
  const result = repository.getTaskDetail(input());

  assert.equal(result.task.caseId, 'case_allowed');
  assertNoForbiddenOutput(result);
});

test('internal sensitive and finalAppointmentId fields are stripped', () => {
  const repository = createEngineerMobileTaskDetailReadRepository({
    executor() {
      return {
        rows: [row()],
      };
    },
    allowNonExecutableForTest: true,
  });
  const result = repository.getTaskDetail(input());

  assert.equal(result.task.caseId, 'case_engineer_mobile_detail_repo_001');
  assertNoForbiddenOutput(result);
});

test('safe evidence refs are preserved and unsafe refs stripped', () => {
  const repository = createEngineerMobileTaskDetailReadRepository({
    executor() {
      return {
        rows: [row({
          evidence_refs: [
            {
              id: 'safe_ref',
              type: 'photo',
              label: '安全照片',
              storage_path: 'storage_path_should_not_leak',
            },
            {
              id: 'safe_ref_2',
              type: 'photo',
              label: '安全照片二',
            },
            'safe_ref_3',
            'https://example.invalid/signed-url',
          ],
        })],
      };
    },
    allowNonExecutableForTest: true,
  });
  const result = repository.getTaskDetail(input());

  assert.deepEqual(result.task.evidenceRefs, [
    {
      id: 'safe_ref_2',
      type: 'photo',
      label: '安全照片二',
    },
    {
      id: 'safe_ref_3',
      type: 'reference',
    },
  ]);
  assertNoForbiddenOutput(result);
});

test('executor receives safe frozen querySpec with placeholders and no raw interpolation', () => {
  const calls = [];
  const repository = createEngineerMobileTaskDetailReadRepository({
    executor(querySpec) {
      calls.push(querySpec);
      assert.equal(Object.isFrozen(querySpec), true);
      assert.equal(Object.isFrozen(querySpec.params), true);
      return { rows: [] };
    },
    allowNonExecutableForTest: true,
  });

  repository.getTaskDetail(input());

  assert.equal(calls.length, 1);
  assert.equal(calls[0].executable, false);
  assert.equal(calls[0].sql.includes('$1'), true);
  assert.equal(calls[0].sql.includes('$2'), true);
  assert.equal(calls[0].sql.includes('$3'), true);
  assert.equal(calls[0].sql.includes('org_engineer_mobile_detail_repo_001'), false);
  assert.equal(calls[0].sql.includes('eng_engineer_mobile_detail_repo_001'), false);
  assert.equal(calls[0].sql.includes('apt_engineer_mobile_detail_repo_001'), false);
  assertNoForbiddenOutput(calls);
});

test('input object is not mutated', () => {
  const request = input();
  const before = clone(request);
  const repository = createEngineerMobileTaskDetailReadRepository({
    executor() {
      return { rows: [row()] };
    },
    allowNonExecutableForTest: true,
  });

  repository.getTaskDetail(request);

  assert.deepEqual(request, before);
});

test('executor object is not mutated beyond its own call tracking', () => {
  const executor = {
    marker: 'keep',
    calls: [],
    execute(querySpec) {
      this.calls.push(querySpec.name);
      return { rows: [] };
    },
  };
  const repository = createEngineerMobileTaskDetailReadRepository({
    executor,
    allowNonExecutableForTest: true,
  });

  repository.getTaskDetail(input());

  assert.equal(executor.marker, 'keep');
  assert.deepEqual(executor.calls, ['engineerMobileTaskDetailReadModel']);
});

test('no logging side effects on executor failure', () => {
  const originalLog = console.log;
  const originalError = console.error;
  const logCalls = [];
  const repository = createEngineerMobileTaskDetailReadRepository({
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
    assert.deepEqual(repository.getTaskDetail(input()), { task: null });
  } finally {
    console.log = originalLog;
    console.error = originalError;
  }

  assert.deepEqual(logCalls, []);
});

test('module import boundary has no DB, repository, provider, AI, route, app, or server imports', () => {
  const source = fs.readFileSync(repositoryFile, 'utf8');
  const specifiers = requireSpecifiers(source);

  assert.deepEqual(specifiers, ['./engineerMobileTaskDetailReadModelMapper']);
  assert.equal(specifiers.some((specifier) => /db|pool|repositories?|transaction|provider|line|sms|email|push|openai|aiProvider|ai_|rag|vector|routes?/i.test(specifier)), false);
  assert.equal(specifiers.some((specifier) => /(^|\/|\.)app($|\.|\/)|(^|\/|\.)server($|\.|\/)/i.test(specifier)), false);
});
