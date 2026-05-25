'use strict';

const assert = require('node:assert/strict');
const { Readable, Writable } = require('node:stream');
const test = require('node:test');

const { createApp } = require('../../src/app');
const {
  createServerBootstrap,
} = require('../../src/server');
const {
  createEngineerMobileTaskListReadRepository,
} = require('../../src/engineerMobile/engineerMobileTaskListReadRepository');

function input(overrides = {}) {
  return {
    organizationId: 'org_engineer_mobile_e2e_001',
    engineerId: 'eng_engineer_mobile_e2e_001',
    dateRange: {
      from: '2026-05-21',
      to: '2026-05-28',
    },
    ...overrides,
  };
}

function row(overrides = {}) {
  return {
    case_id: 'case_engineer_mobile_e2e_001',
    appointment_id: 'apt_engineer_mobile_e2e_001',
    organization_id: 'org_engineer_mobile_e2e_001',
    assigned_engineer_id: 'eng_engineer_mobile_e2e_001',
    scheduled_start: '2026-05-21T09:00:00+08:00',
    scheduled_end: '2026-05-21T10:00:00+08:00',
    appointment_status: 'confirmed',
    customer_name_masked: '林○○',
    customer_phone_masked: '09xx-xxx-456',
    address_summary: '新北市板橋區',
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

function auth(overrides = {}) {
  return {
    organizationId: 'org_engineer_mobile_e2e_001',
    engineerId: 'eng_engineer_mobile_e2e_001',
    userId: 'user_engineer_mobile_e2e_001',
    role: 'engineer',
    permissions: ['engineer_mobile.tasks.read'],
    ...overrides,
  };
}

function createRequest(pathname, authOverrides) {
  let sent = false;
  const req = new Readable({
    read() {
      if (sent) {
        this.push(null);
        return;
      }

      sent = true;
      this.push(null);
    },
  });

  req.method = 'GET';
  req.url = pathname;
  req.originalUrl = pathname;
  req.headers = {};
  req.connection = {};

  if (authOverrides !== undefined) {
    req.auth = auth(authOverrides);
  }

  return req;
}

function createResponse() {
  const chunks = [];
  const headers = {};
  const res = new Writable({
    write(chunk, encoding, callback) {
      chunks.push(Buffer.from(chunk));
      callback();
    },
  });

  res.statusCode = 200;
  res.setHeader = (name, value) => {
    headers[name.toLowerCase()] = value;
  };
  res.getHeader = (name) => headers[name.toLowerCase()];
  res.removeHeader = (name) => {
    delete headers[name.toLowerCase()];
  };
  res.writeHead = (statusCode, headerValues) => {
    res.statusCode = statusCode;
    if (headerValues && typeof headerValues === 'object') {
      for (const [name, value] of Object.entries(headerValues)) {
        res.setHeader(name, value);
      }
    }
    return res;
  };
  res.end = (chunk, encoding, callback) => {
    if (chunk) {
      chunks.push(Buffer.from(chunk, encoding));
    }
    Writable.prototype.end.call(res, callback);
    return res;
  };
  res.bodyText = () => Buffer.concat(chunks).toString('utf8');
  res.bodyJson = () => JSON.parse(res.bodyText());

  return res;
}

function requestApp(app, authOverrides) {
  return new Promise((resolve, reject) => {
    const req = createRequest('/engineer-mobile/tasks', authOverrides);
    const res = createResponse();

    res.on('finish', () => {
      try {
        resolve({
          body: res.bodyJson(),
          bodyText: res.bodyText(),
          statusCode: res.statusCode,
        });
      } catch (error) {
        reject(error);
      }
    });
    res.on('error', reject);
    app.handle(req, res);
  });
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

function createSyntheticApp(calls) {
  const safeCalls = Array.isArray(calls) ? calls : [];

  return {
    listen(port, callback) {
      safeCalls.push({ event: 'listen', port });

      if (callback) {
        callback();
      }

      return {
        close(closeCallback) {
          safeCalls.push({ event: 'close' });

          if (closeCallback) {
            closeCallback();
          }
        },
      };
    },
  };
}

test('repository default mode fail-closes and does not call executor', () => {
  const executorCalls = [];
  const repository = createEngineerMobileTaskListReadRepository({
    executor(querySpec) {
      executorCalls.push(querySpec);
      return { rows: [row()] };
    },
  });

  assert.deepEqual(repository.getReadModel(input()), { tasks: [] });
  assert.deepEqual(executorCalls, []);
});

test('repository synthetic mode calls injected executor with safe frozen querySpec', () => {
  const executorCalls = [];
  const repository = createEngineerMobileTaskListReadRepository({
    executor(querySpec) {
      executorCalls.push(querySpec);
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
  const result = repository.getReadModel(input());

  assert.equal(executorCalls.length, 1);
  assert.equal(Object.isFrozen(executorCalls[0]), true);
  assert.equal(Object.isFrozen(executorCalls[0].params), true);
  assert.equal(executorCalls[0].executable, false);
  assert.equal(executorCalls[0].sql.includes('$1'), true);
  assert.equal(executorCalls[0].sql.includes('$2'), true);
  assert.equal(executorCalls[0].sql.includes('org_engineer_mobile_e2e_001'), false);
  assert.equal(executorCalls[0].sql.includes('eng_engineer_mobile_e2e_001'), false);
  assert.deepEqual(result.tasks.map((task) => task.caseId), ['case_allowed']);
  assertNoForbiddenOutput([executorCalls, result]);
});

test('createApp with repository readModel wrapper works for valid engineer auth', async () => {
  const repository = createEngineerMobileTaskListReadRepository({
    executor() {
      return {
        rows: [
          row({ case_id: 'case_app_read_model_allowed' }),
          row({ case_id: 'case_app_read_model_wrong_org', organization_id: 'org_other' }),
          row({ case_id: 'case_app_read_model_wrong_engineer', assigned_engineer_id: 'eng_other' }),
        ],
      };
    },
    allowNonExecutableForTest: true,
  });
  const app = createApp({
    engineerMobile: {
      readModel: {
        listTasks() {
          return repository.getReadModel(input()).tasks;
        },
      },
    },
  });
  const response = await requestApp(app, {});

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'allow');
  assert.deepEqual(response.body.tasks.map((task) => task.caseId), ['case_app_read_model_allowed']);
  assertNoForbiddenOutput(response.body);
});

test('createApp with repository taskProvider wrapper works for valid engineer auth', async () => {
  const repository = createEngineerMobileTaskListReadRepository({
    executor() {
      return [row({ case_id: 'case_app_task_provider_allowed' })];
    },
    allowNonExecutableForTest: true,
  });
  const app = createApp({
    engineerMobile: {
      taskProvider: {
        listTasks() {
          return repository.getTaskList(input()).tasks;
        },
      },
    },
  });
  const response = await requestApp(app, {});

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body.tasks.map((task) => task.caseId), ['case_app_task_provider_allowed']);
  assertNoForbiddenOutput(response.body);
});

test('missing auth through app route returns safe 403', async () => {
  const repository = createEngineerMobileTaskListReadRepository({
    executor() {
      return { rows: [row()] };
    },
    allowNonExecutableForTest: true,
  });
  const app = createApp({
    engineerMobile: {
      readModel: {
        listTasks() {
          return repository.getReadModel(input()).tasks;
        },
      },
    },
  });
  const response = await requestApp(app, undefined);

  assert.equal(response.statusCode, 403);
  assert.deepEqual(response.body, {
    status: 'deny',
    messageKey: 'engineerMobile.unavailable',
    data: null,
  });
  assertNoForbiddenOutput(response.body);
});

test('executor throw returns safe empty task list without raw error leak through app route', async () => {
  const repository = createEngineerMobileTaskListReadRepository({
    executor() {
      throw new Error('executor failure should not leak');
    },
    allowNonExecutableForTest: true,
  });
  const app = createApp({
    engineerMobile: {
      readModel: {
        listTasks() {
          return repository.getReadModel(input()).tasks;
        },
      },
    },
  });
  const response = await requestApp(app, {});

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'allow');
  assert.deepEqual(response.body.tasks, []);
  assertNoForbiddenOutput(response.body);
});

test('createServerBootstrap({ engineerMobile }) path works without listen', async () => {
  const listenCalls = [];
  const repository = createEngineerMobileTaskListReadRepository({
    executor() {
      return { rows: [row({ case_id: 'case_server_allowed' })] };
    },
    allowNonExecutableForTest: true,
  });
  const bootstrap = createServerBootstrap({
    engineerMobile: {
      taskProvider: {
        listTasks() {
          return repository.getTaskList(input()).tasks;
        },
      },
    },
    port: 4063,
  });

  assert.equal(typeof bootstrap.app.handle, 'function');
  assert.deepEqual(listenCalls, []);

  const response = await requestApp(bootstrap.app, {});

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body.tasks.map((task) => task.caseId), ['case_server_allowed']);
  assertNoForbiddenOutput(response.body);
});

test('server options.app priority bypasses engineerMobile provider and executor', () => {
  const listenCalls = [];
  const executorCalls = [];
  const injectedApp = createSyntheticApp(listenCalls);
  const repository = createEngineerMobileTaskListReadRepository({
    executor(querySpec) {
      executorCalls.push(querySpec);
      return { rows: [row()] };
    },
    allowNonExecutableForTest: true,
  });
  const bootstrap = createServerBootstrap({
    app: injectedApp,
    engineerMobile: {
      readModel: {
        listTasks() {
          return repository.getReadModel(input()).tasks;
        },
      },
    },
    port: 4064,
  });

  assert.equal(bootstrap.app, injectedApp);
  assert.deepEqual(executorCalls, []);
  assert.deepEqual(listenCalls, []);
});
