'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  createEngineerMobileTaskListReadProvider,
  mapEngineerMobileTaskListRequest,
} = require('../../src/engineerMobile/engineerMobileTaskListReadProviderAdapter');

const repoRoot = path.resolve(__dirname, '../..');
const adapterFile = path.join(repoRoot, 'src/engineerMobile/engineerMobileTaskListReadProviderAdapter.js');

function request(overrides = {}) {
  return {
    auth: {
      organizationId: 'org_engineer_mobile_adapter_001',
      engineerId: 'eng_engineer_mobile_adapter_001',
      role: 'engineer',
    },
    query: {
      from: '2026-05-21',
      to: '2026-05-28',
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

function task(overrides = {}) {
  return {
    caseId: 'case_engineer_mobile_adapter_001',
    appointmentId: 'apt_engineer_mobile_adapter_001',
    organizationId: 'org_engineer_mobile_adapter_001',
    assignedEngineerId: 'eng_engineer_mobile_adapter_001',
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

test('exports provider factory and request mapper', () => {
  assert.equal(typeof createEngineerMobileTaskListReadProvider, 'function');
  assert.equal(typeof mapEngineerMobileTaskListRequest, 'function');
});

test('request mapping uses auth organizationId and engineerId', () => {
  assert.deepEqual(mapEngineerMobileTaskListRequest(request()), {
    organizationId: 'org_engineer_mobile_adapter_001',
    engineerId: 'eng_engineer_mobile_adapter_001',
    dateRange: {
      from: '2026-05-21',
      to: '2026-05-28',
    },
  });
});

test('body organizationId and engineerId are ignored', () => {
  const mapped = mapEngineerMobileTaskListRequest(request({
    body: {
      organizationId: 'body_org_should_be_ignored',
      engineerId: 'body_engineer_should_be_ignored',
    },
  }));

  assert.equal(mapped.organizationId, 'org_engineer_mobile_adapter_001');
  assert.equal(mapped.engineerId, 'eng_engineer_mobile_adapter_001');
  assertNoForbiddenOutput(mapped);
});

test('query date range is mapped and body date range ignored', () => {
  const mapped = mapEngineerMobileTaskListRequest(request({
    query: {
      from: '2026-05-22',
      to: '2026-05-23',
    },
    body: {
      dateRange: {
        from: '1999-01-01',
        to: '1999-01-02',
      },
    },
  }));

  assert.deepEqual(mapped.dateRange, {
    from: '2026-05-22',
    to: '2026-05-23',
  });
});

test('missing auth fail-closes', () => {
  assert.equal(mapEngineerMobileTaskListRequest({}), null);

  const provider = createEngineerMobileTaskListReadProvider({
    repository: {
      getReadModel() {
        return { tasks: [task()] };
      },
    },
  });

  assert.deepEqual(provider.readModel({}), { tasks: [] });
});

test('missing organizationId fail-closes', () => {
  const provider = createEngineerMobileTaskListReadProvider({
    repository: {
      getReadModel() {
        return { tasks: [task()] };
      },
    },
  });

  assert.deepEqual(provider.readModel(request({
    auth: {
      engineerId: 'eng_engineer_mobile_adapter_001',
    },
  })), { tasks: [] });
});

test('missing engineerId fail-closes', () => {
  const provider = createEngineerMobileTaskListReadProvider({
    repository: {
      getReadModel() {
        return { tasks: [task()] };
      },
    },
  });

  assert.deepEqual(provider.readModel(request({
    auth: {
      organizationId: 'org_engineer_mobile_adapter_001',
    },
  })), { tasks: [] });
});

test('provider creation does not call repository, readModel, or taskProvider', () => {
  const calls = [];

  createEngineerMobileTaskListReadProvider({
    repository: {
      getReadModel(input) {
        calls.push(input);
        return { tasks: [task()] };
      },
    },
  });

  assert.deepEqual(calls, []);
});

test('repository.getReadModel receives mapped input', () => {
  const calls = [];
  const provider = createEngineerMobileTaskListReadProvider({
    repository: {
      getReadModel(input) {
        calls.push(input);
        return { tasks: [task({ caseId: 'case_read_model' })] };
      },
    },
  });
  const result = provider.readModel(request());

  assert.deepEqual(calls, [{
    organizationId: 'org_engineer_mobile_adapter_001',
    engineerId: 'eng_engineer_mobile_adapter_001',
    dateRange: {
      from: '2026-05-21',
      to: '2026-05-28',
    },
  }]);
  assert.deepEqual(result.tasks.map((entry) => entry.caseId), ['case_read_model']);
  assertNoForbiddenOutput(result);
});

test('repository.getTaskList receives mapped input', () => {
  const calls = [];
  const provider = createEngineerMobileTaskListReadProvider({
    repository: {
      getTaskList(input) {
        calls.push(input);
        return { tasks: [task({ caseId: 'case_task_list' })] };
      },
    },
  });
  const result = provider.readModel(request());

  assert.equal(calls.length, 1);
  assert.equal(calls[0].organizationId, 'org_engineer_mobile_adapter_001');
  assert.deepEqual(result.tasks.map((entry) => entry.caseId), ['case_task_list']);
  assertNoForbiddenOutput(result);
});

test('repository.getReadModelAsync receives mapped input through async readModel', async () => {
  const calls = [];
  const provider = createEngineerMobileTaskListReadProvider({
    repository: {
      async getReadModelAsync(input) {
        calls.push(input);
        return { tasks: [task({ caseId: 'case_async_read_model' })] };
      },
    },
  });
  const result = await provider.readModelAsync(request());

  assert.deepEqual(calls, [{
    organizationId: 'org_engineer_mobile_adapter_001',
    engineerId: 'eng_engineer_mobile_adapter_001',
    dateRange: {
      from: '2026-05-21',
      to: '2026-05-28',
    },
  }]);
  assert.deepEqual(result.tasks.map((entry) => entry.caseId), ['case_async_read_model']);
  assertNoForbiddenOutput(result);
});

test('direct readModel wrapper receives mapped input', () => {
  const calls = [];
  const provider = createEngineerMobileTaskListReadProvider({
    readModel(input) {
      calls.push(input);
      return { tasks: [task({ caseId: 'case_direct_read_model' })] };
    },
  });
  const result = provider.readModel(request());

  assert.equal(calls.length, 1);
  assert.deepEqual(result.tasks.map((entry) => entry.caseId), ['case_direct_read_model']);
  assertNoForbiddenOutput(result);
});

test('direct taskProvider wrapper receives mapped input', () => {
  const calls = [];
  const provider = createEngineerMobileTaskListReadProvider({
    taskProvider(input) {
      calls.push(input);
      return [task({ caseId: 'case_direct_task_provider' })];
    },
  });
  const result = provider.taskProvider(request());

  assert.equal(calls.length, 1);
  assert.deepEqual(result.tasks.map((entry) => entry.caseId), ['case_direct_task_provider']);
  assertNoForbiddenOutput(result);
});

test('provider throw returns empty tasks and no raw error leak', () => {
  const provider = createEngineerMobileTaskListReadProvider({
    readModel() {
      throw new Error('provider failure should not leak');
    },
  });
  const result = provider.readModel(request());

  assert.deepEqual(result, { tasks: [] });
  assertNoForbiddenOutput(result);
});

test('malformed provider result fail-closes', () => {
  const provider = createEngineerMobileTaskListReadProvider({
    readModel() {
      return { notTasks: [task()] };
    },
  });

  assert.deepEqual(provider.readModel(request()), { tasks: [] });
});

test('output strips sensitive fields and finalAppointmentId', () => {
  const provider = createEngineerMobileTaskListReadProvider({
    readModel() {
      return {
        tasks: [
          task({ caseId: 'case_allowed' }),
          task({ caseId: 'case_wrong_org', organizationId: 'org_other' }),
          task({ caseId: 'case_wrong_engineer', assignedEngineerId: 'eng_other' }),
        ],
      };
    },
  });
  const result = provider.readModel(request());

  assert.deepEqual(result.tasks.map((entry) => entry.caseId), ['case_allowed']);
  assertNoForbiddenOutput(result);
});

test('input object is not mutated', () => {
  const req = request();
  const before = clone(req);
  const provider = createEngineerMobileTaskListReadProvider({
    readModel() {
      return { tasks: [task()] };
    },
  });

  provider.readModel(req);

  assert.deepEqual(req, before);
});

test('module import boundary has no DB, repository, provider, AI, route, app, or server imports', () => {
  const source = fs.readFileSync(adapterFile, 'utf8');
  const specifiers = requireSpecifiers(source);

  assert.deepEqual(specifiers, [
    './engineerMobileTaskListService',
    './engineerMobileTaskDetailService',
  ]);
  assert.equal(specifiers.some((specifier) => /db|pool|repositories?|transaction|lineProvider|sms|email|push|openai|rag|vector|routes?/i.test(specifier)), false);
  assert.equal(specifiers.some((specifier) => /(^|\/|\.)app($|\.|\/)|(^|\/|\.)server($|\.|\/)/i.test(specifier)), false);
});
