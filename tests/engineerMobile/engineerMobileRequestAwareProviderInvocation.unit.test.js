'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  buildEngineerMobileTaskListResponseAsync,
  buildEngineerMobileTaskListResponse,
} = require('../../src/controllers/engineerMobileController');
const {
  buildEngineerMobileTaskListAsync,
  buildEngineerMobileTaskList,
} = require('../../src/engineerMobile/engineerMobileTaskListService');

const repoRoot = path.resolve(__dirname, '../..');
const serviceFile = path.join(repoRoot, 'src/engineerMobile/engineerMobileTaskListService.js');
const controllerFile = path.join(repoRoot, 'src/controllers/engineerMobileController.js');

function input(overrides = {}) {
  return {
    organizationId: 'org_engineer_mobile_invocation_001',
    engineerId: 'eng_engineer_mobile_invocation_001',
    dateRange: {
      from: '2026-05-21',
      to: '2026-05-28',
    },
    ...overrides,
  };
}

function task(overrides = {}) {
  return {
    caseId: 'case_engineer_mobile_invocation_001',
    appointmentId: 'apt_engineer_mobile_invocation_001',
    organizationId: 'org_engineer_mobile_invocation_001',
    assignedEngineerId: 'eng_engineer_mobile_invocation_001',
    scheduledStart: '2026-05-21T09:00:00+08:00',
    scheduledEnd: '2026-05-21T10:00:00+08:00',
    status: 'confirmed',
    customerNameMasked: '王○○',
    customerPhoneMasked: '09xx-xxx-123',
    addressSummary: '台北市大安區',
    productSummary: '冷氣',
    issueSummary: '不冷',
    serviceType: 'repair',
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

function request(overrides = {}) {
  return {
    auth: {
      organizationId: 'org_engineer_mobile_invocation_001',
      engineerId: 'eng_engineer_mobile_invocation_001',
      role: 'engineer',
    },
    query: {
      from: '2026-05-22',
      to: '2026-05-23',
    },
    body: {
      organizationId: 'body_org_should_be_ignored',
      engineerId: 'body_engineer_should_be_ignored',
      rawPhone: 'raw_phone_should_not_leak',
      rawAddress: 'raw_address_should_not_leak',
      rawLineUserId: 'line_user_should_not_leak',
      token: 'token_should_not_leak',
      secret: 'secret_should_not_leak',
      DATABASE_URL: 'DATABASE_URL_should_not_leak',
    },
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

test('service passes sanitized input to function readModel(input)', () => {
  const calls = [];
  const result = buildEngineerMobileTaskList(input(), {
    readModel(providerInput) {
      calls.push(providerInput);
      return [task({ caseId: 'case_function_read_model' })];
    },
  });

  assert.deepEqual(calls, [input()]);
  assert.deepEqual(result.tasks.map((entry) => entry.caseId), ['case_function_read_model']);
  assertNoForbiddenOutput(result);
});

test('service passes sanitized input to object readModel.listTasks(input)', () => {
  const calls = [];
  const result = buildEngineerMobileTaskList(input(), {
    readModel: {
      listTasks(providerInput) {
        calls.push(providerInput);
        return { tasks: [task({ caseId: 'case_object_read_model' })] };
      },
    },
  });

  assert.deepEqual(calls, [input()]);
  assert.deepEqual(result.tasks.map((entry) => entry.caseId), ['case_object_read_model']);
  assertNoForbiddenOutput(result);
});

test('async service passes sanitized input to readModelAsync(input)', async () => {
  const calls = [];
  const result = await buildEngineerMobileTaskListAsync(input(), {
    async readModelAsync(providerInput) {
      calls.push(providerInput);
      return { tasks: [task({ caseId: 'case_async_read_model' })] };
    },
  });

  assert.deepEqual(calls, [input()]);
  assert.deepEqual(result.tasks.map((entry) => entry.caseId), ['case_async_read_model']);
  assertNoForbiddenOutput(result);
});

test('async service fail-closes without leaking async provider errors', async () => {
  const result = await buildEngineerMobileTaskListAsync(input(), {
    async readModelAsync() {
      throw new Error('provider failure should not leak');
    },
  });

  assert.deepEqual(result, { status: 'deny', tasks: [] });
  assertNoForbiddenOutput(result);
});

test('service passes sanitized input to function taskProvider(input)', () => {
  const calls = [];
  const result = buildEngineerMobileTaskList(input(), {
    taskProvider(providerInput) {
      calls.push(providerInput);
      return [task({ caseId: 'case_function_task_provider' })];
    },
  });

  assert.deepEqual(calls, [input()]);
  assert.deepEqual(result.tasks.map((entry) => entry.caseId), ['case_function_task_provider']);
  assertNoForbiddenOutput(result);
});

test('service passes sanitized input to object taskProvider.listTasks(input)', () => {
  const calls = [];
  const result = buildEngineerMobileTaskList(input(), {
    taskProvider: {
      listTasks(providerInput) {
        calls.push(providerInput);
        return { tasks: [task({ caseId: 'case_object_task_provider' })] };
      },
    },
  });

  assert.deepEqual(calls, [input()]);
  assert.deepEqual(result.tasks.map((entry) => entry.caseId), ['case_object_task_provider']);
  assertNoForbiddenOutput(result);
});

test('backward compatibility: static readModel.tasks still works', () => {
  const result = buildEngineerMobileTaskList(input(), {
    readModel: {
      tasks: [task({ caseId: 'case_static_read_model' })],
    },
  });

  assert.deepEqual(result.tasks.map((entry) => entry.caseId), ['case_static_read_model']);
  assertNoForbiddenOutput(result);
});

test('provider receiving input can return mixed tasks and service still filters by organization and engineer', () => {
  const result = buildEngineerMobileTaskList(input(), {
    readModel(providerInput) {
      assert.equal(providerInput.organizationId, 'org_engineer_mobile_invocation_001');
      assert.equal(providerInput.engineerId, 'eng_engineer_mobile_invocation_001');
      return {
        tasks: [
          task({ caseId: 'case_allowed' }),
          task({ caseId: 'case_wrong_org', organizationId: 'org_other' }),
          task({ caseId: 'case_wrong_engineer', assignedEngineerId: 'eng_other' }),
        ],
      };
    },
  });

  assert.deepEqual(result.tasks.map((entry) => entry.caseId), ['case_allowed']);
  assertNoForbiddenOutput(result);
});

test('provider throw returns empty safe result', () => {
  const result = buildEngineerMobileTaskList(input(), {
    readModel() {
      throw new Error('provider failure should not leak');
    },
  });

  assert.deepEqual(result, { status: 'deny', tasks: [] });
  assertNoForbiddenOutput(result);
});

test('malformed provider result returns empty safe result', () => {
  const result = buildEngineerMobileTaskList(input(), {
    readModel() {
      return { notTasks: [task()] };
    },
  });

  assert.deepEqual(result, { status: 'deny', tasks: [] });
});

test('controller builds input from req.auth and req.query while ignoring body org and engineer', () => {
  const calls = [];
  const req = request();
  const before = clone(req);
  const response = buildEngineerMobileTaskListResponse(req, {
    readModel(providerInput) {
      calls.push(providerInput);
      return [task({
        caseId: 'case_controller',
        scheduledStart: '2026-05-22T09:00:00+08:00',
      })];
    },
  });

  assert.deepEqual(calls, [{
    organizationId: 'org_engineer_mobile_invocation_001',
    engineerId: 'eng_engineer_mobile_invocation_001',
    dateRange: {
      from: '2026-05-22',
      to: '2026-05-23',
    },
  }]);
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body.tasks.map((entry) => entry.caseId), ['case_controller']);
  assert.deepEqual(req, before);
  assertNoForbiddenOutput([response.body, calls]);
});

test('async controller builds input from req.auth and req.query while ignoring body org and engineer', async () => {
  const calls = [];
  const req = request();
  const before = clone(req);
  const response = await buildEngineerMobileTaskListResponseAsync(req, {
    async readModelAsync(providerInput) {
      calls.push(providerInput);
      return [task({
        caseId: 'case_async_controller',
        scheduledStart: '2026-05-22T09:00:00+08:00',
      })];
    },
  });

  assert.deepEqual(calls, [{
    organizationId: 'org_engineer_mobile_invocation_001',
    engineerId: 'eng_engineer_mobile_invocation_001',
    dateRange: {
      from: '2026-05-22',
      to: '2026-05-23',
    },
  }]);
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body.tasks.map((entry) => entry.caseId), ['case_async_controller']);
  assert.deepEqual(req, before);
  assertNoForbiddenOutput([response.body, calls]);
});

test('controller missing auth still returns safe forbidden response without calling provider', () => {
  const calls = [];
  const response = buildEngineerMobileTaskListResponse({}, {
    readModel(providerInput) {
      calls.push(providerInput);
      return [task()];
    },
  });

  assert.deepEqual(calls, []);
  assert.equal(response.statusCode, 403);
  assert.deepEqual(response.body, {
    status: 'deny',
    messageKey: 'engineerMobile.forbidden',
    tasks: [],
  });
  assertNoForbiddenOutput(response.body);
});

test('service and controller import boundaries remain safe', () => {
  const serviceSource = fs.readFileSync(serviceFile, 'utf8');
  const controllerSource = fs.readFileSync(controllerFile, 'utf8');
  const serviceSpecifiers = requireSpecifiers(serviceSource);
  const controllerSpecifiers = requireSpecifiers(controllerSource);

  assert.deepEqual(serviceSpecifiers, []);
  assert.deepEqual(controllerSpecifiers, ['../engineerMobile/engineerMobileTaskListService']);
  assert.equal([...serviceSpecifiers, ...controllerSpecifiers].some((specifier) => /db|pool|repositories?|transaction|provider|line|sms|email|push|ai|rag|vector|routes?|app|server/i.test(specifier)), false);
});
