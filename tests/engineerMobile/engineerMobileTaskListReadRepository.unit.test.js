'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  ENGINEER_MOBILE_TASK_LIST_READ_REPOSITORY_NAME,
  createEngineerMobileTaskListReadRepository,
} = require('../../src/engineerMobile/engineerMobileTaskListReadRepository');

const repoRoot = path.resolve(__dirname, '../..');
const repositoryFile = path.join(repoRoot, 'src/engineerMobile/engineerMobileTaskListReadRepository.js');

function input(overrides = {}) {
  return {
    organizationId: 'org_engineer_mobile_repo_001',
    engineerId: 'eng_engineer_mobile_repo_001',
    dateRange: {
      from: '2026-05-21',
      to: '2026-05-28',
    },
    ...overrides,
  };
}

function row(overrides = {}) {
  return {
    case_id: 'case_engineer_mobile_repo_001',
    appointment_id: 'apt_engineer_mobile_repo_001',
    organization_id: 'org_engineer_mobile_repo_001',
    assigned_engineer_id: 'eng_engineer_mobile_repo_001',
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
  ]) {
    assert.equal(serialized.includes(forbiddenValue), false, `leaked ${forbiddenValue}`);
  }

  assert.equal(serialized.includes('"rawPhone"'), false);
  assert.equal(serialized.includes('"rawAddress"'), false);
  assert.equal(serialized.includes('"rawLineUserId"'), false);
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

test('exports repository factory and constants', () => {
  assert.equal(typeof createEngineerMobileTaskListReadRepository, 'function');
  assert.equal(
    ENGINEER_MOBILE_TASK_LIST_READ_REPOSITORY_NAME,
    'engineerMobileTaskListReadRepository',
  );
});

test('repository exposes getTaskList and getReadModel', () => {
  const repository = createEngineerMobileTaskListReadRepository();

  assert.equal(repository.name, 'engineerMobileTaskListReadRepository');
  assert.equal(typeof repository.getTaskList, 'function');
  assert.equal(typeof repository.getTaskListAsync, 'function');
  assert.equal(typeof repository.getReadModel, 'function');
  assert.equal(typeof repository.getReadModelAsync, 'function');
});

test('missing input returns empty and executor not called', () => {
  const calls = [];
  const repository = createEngineerMobileTaskListReadRepository({
    executor(querySpec) {
      calls.push(querySpec);
      return { rows: [row()] };
    },
    allowNonExecutableForTest: true,
  });

  assert.deepEqual(repository.getTaskList(), { tasks: [] });
  assert.deepEqual(calls, []);
});

test('missing organizationId returns empty and executor not called', () => {
  const calls = [];
  const repository = createEngineerMobileTaskListReadRepository({
    executor(querySpec) {
      calls.push(querySpec);
      return { rows: [row()] };
    },
    allowNonExecutableForTest: true,
  });

  assert.deepEqual(repository.getTaskList(input({ organizationId: '' })), { tasks: [] });
  assert.deepEqual(calls, []);
});

test('missing engineerId returns empty and executor not called', () => {
  const calls = [];
  const repository = createEngineerMobileTaskListReadRepository({
    executor(querySpec) {
      calls.push(querySpec);
      return { rows: [row()] };
    },
    allowNonExecutableForTest: true,
  });

  assert.deepEqual(repository.getTaskList(input({ engineerId: '' })), { tasks: [] });
  assert.deepEqual(calls, []);
});

test('default non-executable mode does not call executor', () => {
  const calls = [];
  const repository = createEngineerMobileTaskListReadRepository({
    executor(querySpec) {
      calls.push(querySpec);
      return { rows: [row()] };
    },
  });

  assert.deepEqual(repository.getTaskList(input()), { tasks: [] });
  assert.deepEqual(calls, []);
});

test('allowNonExecutableForTest calls sync function executor', () => {
  const calls = [];
  const repository = createEngineerMobileTaskListReadRepository({
    executor(querySpec) {
      calls.push(querySpec);
      return {
        rows: [row({ case_id: 'case_allowed' })],
      };
    },
    allowNonExecutableForTest: true,
  });
  const result = repository.getTaskList(input());

  assert.equal(calls.length, 1);
  assert.deepEqual(result.tasks.map((task) => task.caseId), ['case_allowed']);
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
  const repository = createEngineerMobileTaskListReadRepository({
    executor,
    allowNonExecutableForTest: true,
  });
  const result = repository.getReadModel(input());

  assert.deepEqual(beforeExecutor, { calls: [] });
  assert.equal(executor.calls.length, 1);
  assert.deepEqual(result.tasks.map((task) => task.caseId), ['case_object_executor_allowed']);
  assertNoForbiddenOutput(result);
});

test('async function executor is supported through async read methods', async () => {
  const calls = [];
  const repository = createEngineerMobileTaskListReadRepository({
    async executor(querySpec) {
      calls.push(querySpec.name);
      return {
        rows: [row({ case_id: 'case_async_executor_allowed' })],
      };
    },
    allowNonExecutableForTest: true,
  });
  const result = await repository.getTaskListAsync(input());

  assert.deepEqual(calls, ['engineerMobileTaskListReadModel']);
  assert.deepEqual(result.tasks.map((task) => task.caseId), ['case_async_executor_allowed']);
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
  const repository = createEngineerMobileTaskListReadRepository({
    executor,
    allowNonExecutableForTest: true,
  });
  const result = await repository.getReadModelAsync(input());

  assert.deepEqual(executor.calls, ['engineerMobileTaskListReadModel']);
  assert.deepEqual(result.tasks.map((task) => task.caseId), ['case_async_object_executor_allowed']);
  assertNoForbiddenOutput(result);
});

test('async executor rejection fail-closes without raw error leak', async () => {
  const repository = createEngineerMobileTaskListReadRepository({
    async executor() {
      throw new Error('executor failure should not leak');
    },
    allowNonExecutableForTest: true,
  });
  const result = await repository.getTaskListAsync(input());

  assert.deepEqual(result, { tasks: [] });
  assertNoForbiddenOutput(result);
});

test('executor throw returns empty without raw error leak', () => {
  const repository = createEngineerMobileTaskListReadRepository({
    executor() {
      throw new Error('executor failure should not leak');
    },
    allowNonExecutableForTest: true,
  });
  const result = repository.getTaskList(input());

  assert.deepEqual(result, { tasks: [] });
  assertNoForbiddenOutput(result);
});

test('executor malformed result returns empty', () => {
  const repository = createEngineerMobileTaskListReadRepository({
    executor() {
      return { notRows: [row()] };
    },
    allowNonExecutableForTest: true,
  });

  assert.deepEqual(repository.getTaskList(input()), { tasks: [] });
});

test('valid rows mapped to safe readModel and wrong org / wrong engineer excluded', () => {
  const repository = createEngineerMobileTaskListReadRepository({
    executor() {
      return {
        rows: [
          row({ case_id: 'case_allowed' }),
          row({ case_id: 'case_wrong_org', organization_id: 'org_other' }),
          row({ case_id: 'case_wrong_engineer', assigned_engineer_id: 'eng_other' }),
        ],
      };
    },
    allowNonExecutableForTest: true,
  });
  const result = repository.getTaskList(input());

  assert.deepEqual(result.tasks.map((task) => task.caseId), ['case_allowed']);
  assertNoForbiddenOutput(result);
});

test('executor receives safe frozen querySpec with placeholders and no raw interpolation', () => {
  const calls = [];
  const repository = createEngineerMobileTaskListReadRepository({
    executor(querySpec) {
      calls.push(querySpec);
      assert.equal(Object.isFrozen(querySpec), true);
      assert.equal(Object.isFrozen(querySpec.params), true);
      return { rows: [] };
    },
    allowNonExecutableForTest: true,
  });

  repository.getTaskList(input());

  assert.equal(calls.length, 1);
  assert.equal(calls[0].executable, false);
  assert.equal(calls[0].sql.includes('$1'), true);
  assert.equal(calls[0].sql.includes('$2'), true);
  assert.equal(calls[0].sql.includes('org_engineer_mobile_repo_001'), false);
  assert.equal(calls[0].sql.includes('eng_engineer_mobile_repo_001'), false);
  assertNoForbiddenOutput(calls);
});

test('input object is not mutated', () => {
  const request = input();
  const before = clone(request);
  const repository = createEngineerMobileTaskListReadRepository({
    executor() {
      return { rows: [row()] };
    },
    allowNonExecutableForTest: true,
  });

  repository.getTaskList(request);

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
  const repository = createEngineerMobileTaskListReadRepository({
    executor,
    allowNonExecutableForTest: true,
  });

  repository.getTaskList(input());

  assert.equal(executor.marker, 'keep');
  assert.deepEqual(executor.calls, ['engineerMobileTaskListReadModel']);
});

test('no logging side effects on executor failure', () => {
  const originalLog = console.log;
  const originalError = console.error;
  const logCalls = [];
  const repository = createEngineerMobileTaskListReadRepository({
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
    assert.deepEqual(repository.getTaskList(input()), { tasks: [] });
  } finally {
    console.log = originalLog;
    console.error = originalError;
  }

  assert.deepEqual(logCalls, []);
});

test('module import boundary has no DB, repository, provider, AI, route, app, or server imports', () => {
  const source = fs.readFileSync(repositoryFile, 'utf8');
  const specifiers = requireSpecifiers(source);

  assert.deepEqual(specifiers, ['./engineerMobileTaskListReadModelMapper']);
  assert.equal(specifiers.some((specifier) => /db|pool|repositories?|transaction|provider|line|sms|email|push|ai|rag|vector|routes?/i.test(specifier)), false);
  assert.equal(specifiers.some((specifier) => /(^|\/|\.)app($|\.|\/)|(^|\/|\.)server($|\.|\/)/i.test(specifier)), false);
});
