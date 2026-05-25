'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Readable, Writable } = require('node:stream');
const test = require('node:test');

const {
  createServerBootstrap,
  resolveServerApp,
  startServer,
} = require('../../src/server');

const repoRoot = path.resolve(__dirname, '../..');
const serverFile = path.join(repoRoot, 'src/server.js');

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

function requestApp(app, authOverrides, pathname = '/engineer-mobile/tasks') {
  return new Promise((resolve, reject) => {
    const req = createRequest(pathname, authOverrides);
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

function auth(overrides = {}) {
  return {
    organizationId: 'org_engineer_mobile_server_001',
    engineerId: 'eng_engineer_mobile_server_001',
    userId: 'user_engineer_mobile_server_001',
    role: 'engineer',
    permissions: ['engineer_mobile.tasks.read'],
    ...overrides,
  };
}

function task(overrides = {}) {
  return {
    caseId: 'case_engineer_mobile_server_001',
    appointmentId: 'apt_engineer_mobile_server_001',
    organizationId: 'org_engineer_mobile_server_001',
    assignedEngineerId: 'eng_engineer_mobile_server_001',
    scheduledStart: '2026-05-21T09:00:00+08:00',
    scheduledEnd: '2026-05-21T10:00:00+08:00',
    status: 'confirmed',
    customerNameMasked: '王○○',
    customerPhoneMasked: '09xx-xxx-123',
    addressSummary: '桃園市桃園區',
    productSummary: '冰箱',
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

function dataCorrectionOptions() {
  return {
    correctionWriter() {},
  };
}

function customerAccessBootstrap() {
  return {
    enabled: true,
    customerAccess: {
      dbAdapter: {},
    },
  };
}

function createLogger(calls) {
  const safeCalls = Array.isArray(calls) ? calls : [];

  return {
    log(...args) {
      safeCalls.push(['log', ...args]);
    },
    error(...args) {
      safeCalls.push(['error', ...args]);
    },
  };
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

test('server module exports existing helpers', () => {
  assert.equal(typeof createServerBootstrap, 'function');
  assert.equal(typeof resolveServerApp, 'function');
  assert.equal(typeof startServer, 'function');
});

test('options.app priority wins over engineerMobile options', () => {
  const listenCalls = [];
  const injectedApp = createSyntheticApp(listenCalls);
  const providerCalls = [];
  const app = resolveServerApp({
    app: injectedApp,
    engineerMobile: {
      taskProvider: {
        listTasks(query) {
          providerCalls.push(query);
          return [task()];
        },
      },
    },
  });

  assert.equal(app, injectedApp);
  assert.deepEqual(providerCalls, []);
  assert.deepEqual(listenCalls, []);
});

test('createServerBootstrap({ engineerMobile }) creates app with route active and does not call taskProvider during bootstrap', async () => {
  const providerCalls = [];
  const bootstrap = createServerBootstrap({
    engineerMobile: {
      taskProvider: {
        listTasks(query) {
          providerCalls.push(query);
          return [
            task({ caseId: 'case_server_allowed' }),
            task({ caseId: 'case_server_wrong_org', organizationId: 'org_other' }),
            task({ caseId: 'case_server_wrong_engineer', assignedEngineerId: 'eng_other' }),
          ];
        },
      },
    },
  });

  assert.deepEqual(providerCalls, []);

  const response = await requestApp(bootstrap.app, {});

  assert.equal(providerCalls.length, 1);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'allow');
  assert.deepEqual(response.body.tasks.map((entry) => entry.caseId), ['case_server_allowed']);
  assertNoForbiddenOutput(response.body);
});

test('createServerBootstrap can compose Engineer Mobile list read source from server executor option', async () => {
  const executorCalls = [];
  const bootstrap = createServerBootstrap({
    engineerMobileAllowNonExecutableForTest: true,
    async engineerMobileReadExecutor(querySpec) {
      executorCalls.push(querySpec);
      return {
        rows: [
          {
            appointment_id: 'apt_server_executor_001',
            assigned_engineer_id: 'eng_engineer_mobile_server_001',
            case_id: 'case_server_executor_allowed',
            organization_id: 'org_engineer_mobile_server_001',
            scheduled_start: '2026-05-21T09:00:00+08:00',
            appointment_status: 'confirmed',
            customer_name_masked: '王○○',
            customer_phone_masked: '09xx-xxx-123',
            address_summary: '桃園市桃園區',
            product_summary: '冰箱',
            issue_summary: '不冷',
            service_type: 'repair',
            internal_note: 'internal_note_should_not_leak',
            raw_phone: 'raw_phone_should_not_leak',
            final_appointment_id: 'final_appointment_should_not_leak',
          },
        ],
      };
    },
  });

  assert.deepEqual(executorCalls, []);

  const response = await requestApp(bootstrap.app, {});

  assert.equal(executorCalls.length, 1);
  assert.equal(executorCalls[0].name, 'engineerMobileTaskListReadModel');
  assert.deepEqual(executorCalls[0].params.organizationId, 'org_engineer_mobile_server_001');
  assert.deepEqual(executorCalls[0].params.engineerId, 'eng_engineer_mobile_server_001');
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body.tasks.map((entry) => entry.caseId), ['case_server_executor_allowed']);
  assertNoForbiddenOutput([response.body, executorCalls]);
});

test('server list-specific executor shortcut has priority over shared executor shortcut', async () => {
  const sharedExecutorCalls = [];
  const listExecutorCalls = [];
  const bootstrap = createServerBootstrap({
    engineerMobileAllowNonExecutableForTest: true,
    async engineerMobileReadExecutor(querySpec) {
      sharedExecutorCalls.push(querySpec);
      return { rows: [] };
    },
    async engineerMobileListExecutor(querySpec) {
      listExecutorCalls.push(querySpec);
      return {
        rows: [
          {
            appointment_id: 'apt_server_list_specific_executor_001',
            assigned_engineer_id: 'eng_engineer_mobile_server_001',
            case_id: 'case_server_list_specific_executor_allowed',
            organization_id: 'org_engineer_mobile_server_001',
            scheduled_start: '2026-05-21T09:00:00+08:00',
            appointment_status: 'confirmed',
            customer_name_masked: '王○○',
            customer_phone_masked: '09xx-xxx-123',
            address_summary: '桃園市桃園區',
            product_summary: '冰箱',
            issue_summary: '不冷',
            service_type: 'repair',
            internal_note: 'internal_note_should_not_leak',
            raw_phone: 'raw_phone_should_not_leak',
            final_appointment_id: 'final_appointment_should_not_leak',
          },
        ],
      };
    },
  });

  const response = await requestApp(bootstrap.app, {});

  assert.deepEqual(sharedExecutorCalls, []);
  assert.equal(listExecutorCalls.length, 1);
  assert.equal(listExecutorCalls[0].name, 'engineerMobileTaskListReadModel');
  assert.equal(listExecutorCalls[0].params.organizationId, 'org_engineer_mobile_server_001');
  assert.equal(listExecutorCalls[0].params.engineerId, 'eng_engineer_mobile_server_001');
  assert.equal(response.statusCode, 200);
  assert.deepEqual(
    response.body.tasks.map((entry) => entry.caseId),
    ['case_server_list_specific_executor_allowed'],
  );
  assertNoForbiddenOutput([response.body, sharedExecutorCalls, listExecutorCalls]);
});

test('createServerBootstrap can compose Engineer Mobile detail read source from server detail executor option', async () => {
  const executorCalls = [];
  const bootstrap = createServerBootstrap({
    engineerMobileAllowNonExecutableForTest: true,
    async engineerMobileReadDetailExecutor(querySpec) {
      executorCalls.push(querySpec);
      return {
        rows: [
          {
            appointment_id: 'apt_server_detail_executor_001',
            assigned_engineer_id: 'eng_engineer_mobile_server_001',
            case_id: 'case_server_detail_executor_allowed',
            organization_id: 'org_engineer_mobile_server_001',
            scheduled_start: '2026-05-21T09:00:00+08:00',
            appointment_status: 'confirmed',
            customer_name_masked: '王○○',
            customer_phone_masked: '09xx-xxx-123',
            address_summary: '桃園市桃園區',
            product_summary: '冰箱',
            issue_summary: '不冷',
            site_note_safe: '請先聯絡管理室',
            internal_note: 'internal_note_should_not_leak',
            raw_phone: 'raw_phone_should_not_leak',
            final_appointment_id: 'final_appointment_should_not_leak',
          },
        ],
      };
    },
  });
  const response = await requestApp(
    bootstrap.app,
    {},
    '/engineer-mobile/tasks/apt_server_detail_executor_001',
  );

  assert.equal(executorCalls.length, 1);
  assert.equal(executorCalls[0].name, 'engineerMobileTaskDetailReadModel');
  assert.deepEqual(executorCalls[0].params, {
    appointmentId: 'apt_server_detail_executor_001',
    engineerId: 'eng_engineer_mobile_server_001',
    organizationId: 'org_engineer_mobile_server_001',
  });
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.detail.caseId, 'case_server_detail_executor_allowed');
  assertNoForbiddenOutput([response.body, executorCalls]);
});

test('server detail-specific executor shortcut has priority over shared executor shortcut', async () => {
  const sharedExecutorCalls = [];
  const detailExecutorCalls = [];
  const bootstrap = createServerBootstrap({
    engineerMobileAllowNonExecutableForTest: true,
    async engineerMobileReadExecutor(querySpec) {
      sharedExecutorCalls.push(querySpec);
      return { rows: [] };
    },
    async engineerMobileDetailExecutor(querySpec) {
      detailExecutorCalls.push(querySpec);
      return {
        rows: [
          {
            appointment_id: 'apt_server_detail_specific_executor_001',
            assigned_engineer_id: 'eng_engineer_mobile_server_001',
            case_id: 'case_server_detail_specific_executor_allowed',
            organization_id: 'org_engineer_mobile_server_001',
            scheduled_start: '2026-05-21T09:00:00+08:00',
            appointment_status: 'confirmed',
            customer_name_masked: '王○○',
            customer_phone_masked: '09xx-xxx-123',
            address_summary: '桃園市桃園區',
            product_summary: '冰箱',
            issue_summary: '不冷',
            service_type: 'repair',
            site_note_safe: '請先聯絡管理室',
            internal_note: 'internal_note_should_not_leak',
            raw_phone: 'raw_phone_should_not_leak',
            final_appointment_id: 'final_appointment_should_not_leak',
          },
        ],
      };
    },
  });
  const response = await requestApp(
    bootstrap.app,
    {},
    '/engineer-mobile/tasks/apt_server_detail_specific_executor_001',
  );

  assert.deepEqual(sharedExecutorCalls, []);
  assert.equal(detailExecutorCalls.length, 1);
  assert.equal(detailExecutorCalls[0].name, 'engineerMobileTaskDetailReadModel');
  assert.deepEqual(detailExecutorCalls[0].params, {
    appointmentId: 'apt_server_detail_specific_executor_001',
    engineerId: 'eng_engineer_mobile_server_001',
    organizationId: 'org_engineer_mobile_server_001',
  });
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.detail.caseId, 'case_server_detail_specific_executor_allowed');
  assertNoForbiddenOutput([response.body, sharedExecutorCalls, detailExecutorCalls]);
});

test('createServerBootstrap supports engineerMobileReadRepository shortcut option', async () => {
  const repositoryCalls = [];
  const bootstrap = createServerBootstrap({
    engineerMobileReadRepository: {
      getTaskList(input) {
        repositoryCalls.push(input);
        return [
          task({ caseId: 'case_server_repository_allowed' }),
          task({ caseId: 'case_server_repository_wrong_org', organizationId: 'org_other' }),
          task({ caseId: 'case_server_repository_wrong_engineer', assignedEngineerId: 'eng_other' }),
        ];
      },
    },
  });

  assert.deepEqual(repositoryCalls, []);

  const response = await requestApp(bootstrap.app, {});

  assert.deepEqual(repositoryCalls, [{
    engineerId: 'eng_engineer_mobile_server_001',
    organizationId: 'org_engineer_mobile_server_001',
  }]);
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body.tasks.map((entry) => entry.caseId), ['case_server_repository_allowed']);
  assertNoForbiddenOutput([response.body, repositoryCalls]);
});

test('createServerBootstrap supports async engineerMobileReadRepository shortcut option', async () => {
  const repositoryCalls = [];
  const syncRepositoryCalls = [];
  const bootstrap = createServerBootstrap({
    engineerMobileReadRepository: {
      async getReadModelAsync(input) {
        repositoryCalls.push(input);
        return {
          tasks: [
            task({ caseId: 'case_server_repository_async_allowed' }),
            task({ caseId: 'case_server_repository_async_wrong_org', organizationId: 'org_other' }),
            task({ caseId: 'case_server_repository_async_wrong_engineer', assignedEngineerId: 'eng_other' }),
          ],
        };
      },
      getTaskList(input) {
        syncRepositoryCalls.push(input);
        return [task({ caseId: 'case_server_repository_sync_should_not_run' })];
      },
    },
  });

  assert.deepEqual(repositoryCalls, []);
  assert.deepEqual(syncRepositoryCalls, []);

  const response = await requestApp(bootstrap.app, {});

  assert.deepEqual(syncRepositoryCalls, []);
  assert.deepEqual(repositoryCalls, [{
    engineerId: 'eng_engineer_mobile_server_001',
    organizationId: 'org_engineer_mobile_server_001',
  }]);
  assert.equal(response.statusCode, 200);
  assert.deepEqual(
    response.body.tasks.map((entry) => entry.caseId),
    ['case_server_repository_async_allowed'],
  );
  assertNoForbiddenOutput([response.body, repositoryCalls, syncRepositoryCalls]);
});

test('explicit engineerMobile option owns server wiring over executor shortcut options', async () => {
  const executorCalls = [];
  const bootstrap = createServerBootstrap({
    engineerMobile: {
      readModel: {
        tasks: [task({ caseId: 'case_explicit_engineer_mobile' })],
      },
    },
    engineerMobileAllowNonExecutableForTest: true,
    async engineerMobileReadExecutor(querySpec) {
      executorCalls.push(querySpec);
      return { rows: [] };
    },
  });
  const response = await requestApp(bootstrap.app, {});

  assert.deepEqual(executorCalls, []);
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body.tasks.map((entry) => entry.caseId), ['case_explicit_engineer_mobile']);
  assertNoForbiddenOutput([response.body, executorCalls]);
});

test('explicit engineerMobile option owns server wiring over repository shortcut options', async () => {
  const repositoryCalls = [];
  const bootstrap = createServerBootstrap({
    engineerMobile: {
      readModel: {
        tasks: [task({ caseId: 'case_explicit_over_repository' })],
      },
    },
    engineerMobileReadRepository: {
      getTaskList(input) {
        repositoryCalls.push(input);
        return [task({ caseId: 'case_repository_should_not_run' })];
      },
    },
  });
  const response = await requestApp(bootstrap.app, {});

  assert.deepEqual(repositoryCalls, []);
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body.tasks.map((entry) => entry.caseId), ['case_explicit_over_repository']);
  assertNoForbiddenOutput([response.body, repositoryCalls]);
});

test('server repository shortcut takes priority over executor shortcut options', async () => {
  const repositoryCalls = [];
  const executorCalls = [];
  const bootstrap = createServerBootstrap({
    engineerMobileAllowNonExecutableForTest: true,
    engineerMobileReadRepository: {
      getTaskList(input) {
        repositoryCalls.push(input);
        return [task({ caseId: 'case_repository_over_executor' })];
      },
    },
    async engineerMobileReadExecutor(querySpec) {
      executorCalls.push(querySpec);
      return { rows: [task({ caseId: 'case_executor_should_not_run' })] };
    },
  });
  const response = await requestApp(bootstrap.app, {});

  assert.deepEqual(executorCalls, []);
  assert.deepEqual(repositoryCalls, [{
    engineerId: 'eng_engineer_mobile_server_001',
    organizationId: 'org_engineer_mobile_server_001',
  }]);
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body.tasks.map((entry) => entry.caseId), ['case_repository_over_executor']);
  assertNoForbiddenOutput([response.body, repositoryCalls, executorCalls]);
});

test('missing auth through server-created app returns generic 403 safe deny', async () => {
  const bootstrap = createServerBootstrap({
    engineerMobile: {
      readModel: {
        tasks: [task()],
      },
    },
  });
  const response = await requestApp(bootstrap.app, undefined);

  assert.equal(response.statusCode, 403);
  assert.deepEqual(response.body, {
    status: 'deny',
    messageKey: 'engineerMobile.unavailable',
    data: null,
  });
  assertNoForbiddenOutput(response.body);
});

test('customer access and data correction server options remain compatible with engineerMobile', async () => {
  const bootstrap = createServerBootstrap({
    customerAccessBootstrap: customerAccessBootstrap(),
    dataCorrection: dataCorrectionOptions(),
    engineerMobile: {
      readModel: {
        tasks: [task({ caseId: 'case_combined_allowed' })],
      },
    },
  });
  const response = await requestApp(bootstrap.app, {});

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body.tasks.map((entry) => entry.caseId), ['case_combined_allowed']);
  assertNoForbiddenOutput(response.body);
});

test('server source does not import engineerMobile route/controller/service, DB, repository, provider, or AI directly', () => {
  const source = fs.readFileSync(serverFile, 'utf8');
  const specifiers = requireSpecifiers(source);

  assert.equal(specifiers.some((specifier) => /engineerMobile/i.test(specifier)), false);
  assert.equal(specifiers.some((specifier) => /repositories?|transaction|provider|line|sms|email|push|ai|rag|vector/i.test(specifier)), false);
  assert.doesNotMatch(source, /require\(['"][^'"]*engineerMobile[^'"]*['"]\)/);
});

test('startServer with synthetic app still listens only when explicitly called', () => {
  const listenCalls = [];
  const injectedApp = createSyntheticApp(listenCalls);
  const bootstrap = createServerBootstrap({
    app: injectedApp,
    engineerMobile: {
      readModel: {
        tasks: [task()],
      },
    },
    port: 4062,
  });

  assert.equal(bootstrap.app, injectedApp);
  assert.deepEqual(listenCalls, []);

  startServer({
    app: bootstrap.app,
    engineerMobile: {
      readModel: {
        tasks: [task()],
      },
    },
    port: bootstrap.port,
    logger: createLogger([]),
    pool: { end: async () => {} },
    registerSignals: false,
  });

  assert.deepEqual(listenCalls, [{ event: 'listen', port: 4062 }]);
});
