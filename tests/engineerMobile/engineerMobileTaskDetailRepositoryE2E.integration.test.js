'use strict';

const assert = require('node:assert/strict');
const { Readable, Writable } = require('node:stream');
const test = require('node:test');

const { createApp } = require('../../src/app');
const {
  createServerBootstrap,
} = require('../../src/server');
const {
  createEngineerMobileTaskDetailReadRepository,
} = require('../../src/engineerMobile/engineerMobileTaskDetailReadRepository');

function auth(overrides = {}) {
  return {
    engineerId: 'eng_engineer_mobile_detail_repo_e2e_001',
    organizationId: 'org_engineer_mobile_detail_repo_e2e_001',
    permissions: ['engineer_mobile.tasks.read'],
    role: 'engineer',
    userId: 'user_engineer_mobile_detail_repo_e2e_001',
    ...overrides,
  };
}

function row(overrides = {}) {
  return {
    appointment_id: 'apt_engineer_mobile_detail_repo_e2e_001',
    assigned_engineer_id: 'eng_engineer_mobile_detail_repo_e2e_001',
    case_id: 'case_engineer_mobile_detail_repo_e2e_001',
    organization_id: 'org_engineer_mobile_detail_repo_e2e_001',
    scheduled_start: '2026-05-21T09:00:00+08:00',
    scheduled_end: '2026-05-21T10:00:00+08:00',
    status: 'confirmed',
    customer_name_masked: '林○○',
    customer_phone_masked: '09xx-xxx-456',
    address_summary: '新北市板橋區',
    product_summary: '冷氣',
    issue_summary: '不冷',
    service_type: 'repair',
    site_note_safe: '請先聯絡管理室',
    checklist_summary: ['confirm_power', 'take_photo'],
    evidence_refs: [
      {
        id: 'safe_detail_repo_e2e_ref_001',
        type: 'photo',
        label: '故障照片',
      },
      {
        id: 'unsafe_signed_url',
        type: 'photo',
        url: 'https://example.invalid/signed-url',
      },
      'safe_detail_repo_e2e_ref_002',
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

function input(overrides = {}) {
  return {
    appointmentId: 'apt_engineer_mobile_detail_repo_e2e_001',
    engineerId: 'eng_engineer_mobile_detail_repo_e2e_001',
    organizationId: 'org_engineer_mobile_detail_repo_e2e_001',
    ...overrides,
  };
}

function createRequest(pathname, authOverrides, bodyOverrides = {}) {
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
  req.body = {
    appointmentId: 'body_appointment_should_be_ignored',
    organizationId: 'body_org_should_be_ignored',
    engineerId: 'body_engineer_should_be_ignored',
    rawPhone: 'raw_phone_should_not_leak',
    rawAddress: 'raw_address_should_not_leak',
    rawLineUserId: 'line_user_should_not_leak',
    token: 'token_should_not_leak',
    secret: 'secret_should_not_leak',
    DATABASE_URL: 'DATABASE_URL_should_not_leak',
    ...bodyOverrides,
  };

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

function requestApp(app, pathname, authOverrides) {
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

function assertNoForbiddenOutput(value) {
  const serialized = JSON.stringify(value);

  for (const forbiddenValue of [
    'body_appointment_should_be_ignored',
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

test('repository default mode fail-closes and does not call executor', () => {
  const executorCalls = [];
  const repository = createEngineerMobileTaskDetailReadRepository({
    executor(querySpec) {
      executorCalls.push(querySpec);
      return { rows: [row()] };
    },
  });

  assert.deepEqual(repository.getTaskDetail(input()), { task: null });
  assert.deepEqual(executorCalls, []);
});

test('repository synthetic mode calls injected executor with safe frozen querySpec', () => {
  const executorCalls = [];
  const repository = createEngineerMobileTaskDetailReadRepository({
    executor(querySpec) {
      executorCalls.push(querySpec);
      return {
        rows: [
          row({ case_id: 'case_repo_e2e_allowed' }),
          row({ case_id: 'case_repo_e2e_wrong_org', organization_id: 'org_other' }),
          row({ case_id: 'case_repo_e2e_wrong_engineer', assigned_engineer_id: 'eng_other' }),
          row({ case_id: 'case_repo_e2e_wrong_appointment', appointment_id: 'apt_other' }),
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
  assert.equal(executorCalls[0].sql.includes('$3'), true);
  assert.equal(executorCalls[0].sql.includes('org_engineer_mobile_detail_repo_e2e_001'), false);
  assert.equal(executorCalls[0].sql.includes('eng_engineer_mobile_detail_repo_e2e_001'), false);
  assert.equal(executorCalls[0].sql.includes('apt_engineer_mobile_detail_repo_e2e_001'), false);
  assert.equal(result.task.caseId, 'case_repo_e2e_allowed');
  assertNoForbiddenOutput([executorCalls, result]);
});

test('createApp detail route calls repository detail path with appointmentId', async () => {
  const executorCalls = [];
  const repository = createEngineerMobileTaskDetailReadRepository({
    executor(querySpec) {
      executorCalls.push(querySpec);
      return {
        rows: [
          row({ case_id: 'case_app_detail_repo_e2e_allowed' }),
          row({ case_id: 'case_app_detail_repo_e2e_wrong_org', organization_id: 'org_other' }),
          row({ case_id: 'case_app_detail_repo_e2e_wrong_engineer', assigned_engineer_id: 'eng_other' }),
          row({ case_id: 'case_app_detail_repo_e2e_wrong_appointment', appointment_id: 'apt_other' }),
        ],
      };
    },
    allowNonExecutableForTest: true,
  });
  const app = createApp({
    engineerMobile: {
      repository,
      useRequestAwareProvider: true,
    },
  });
  const response = await requestApp(
    app,
    '/engineer-mobile/tasks/apt_engineer_mobile_detail_repo_e2e_001?from=2026-05-21&to=2026-05-28',
    {},
  );

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'allow');
  assert.equal(response.body.detail.caseId, 'case_app_detail_repo_e2e_allowed');
  assert.equal(response.body.detail.appointmentId, 'apt_engineer_mobile_detail_repo_e2e_001');
  assert.equal(executorCalls.length, 1);
  assert.deepEqual(executorCalls[0].params, {
    appointmentId: 'apt_engineer_mobile_detail_repo_e2e_001',
    engineerId: 'eng_engineer_mobile_detail_repo_e2e_001',
    organizationId: 'org_engineer_mobile_detail_repo_e2e_001',
  });
  assertNoForbiddenOutput([response.body, executorCalls]);
});

test('valid engineer auth matching appointment returns safe detail', async () => {
  const repository = createEngineerMobileTaskDetailReadRepository({
    executor() {
      return { rows: [row({ case_id: 'case_safe_detail_allowed' })] };
    },
    allowNonExecutableForTest: true,
  });
  const app = createApp({
    engineerMobile: {
      repository,
      useRequestAwareProvider: true,
    },
  });
  const response = await requestApp(app, '/engineer-mobile/tasks/apt_engineer_mobile_detail_repo_e2e_001', {});

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.detail.caseId, 'case_safe_detail_allowed');
  assert.equal(response.body.detail.customerNameMasked, '林○○');
  assert.equal(response.body.detail.customerPhoneMasked, '09xx-xxx-456');
  assert.deepEqual(response.body.detail.evidenceRefs, [
    {
      id: 'safe_detail_repo_e2e_ref_001',
      type: 'photo',
      label: '故障照片',
    },
    {
      id: 'safe_detail_repo_e2e_ref_002',
      type: 'reference',
    },
  ]);
  assertNoForbiddenOutput(response.body);
});

test('wrong organization row is excluded through detail route', async () => {
  const repository = createEngineerMobileTaskDetailReadRepository({
    executor() {
      return { rows: [row({ organization_id: 'org_other' })] };
    },
    allowNonExecutableForTest: true,
  });
  const app = createApp({
    engineerMobile: {
      repository,
      useRequestAwareProvider: true,
    },
  });
  const response = await requestApp(app, '/engineer-mobile/tasks/apt_engineer_mobile_detail_repo_e2e_001', {});

  assert.equal(response.statusCode, 404);
  assert.deepEqual(response.body, {
    detail: null,
    messageKey: 'engineerMobile.taskDetailUnavailable',
    status: 'deny',
  });
  assertNoForbiddenOutput(response.body);
});

test('wrong engineer row is excluded through detail route', async () => {
  const repository = createEngineerMobileTaskDetailReadRepository({
    executor() {
      return { rows: [row({ assigned_engineer_id: 'eng_other' })] };
    },
    allowNonExecutableForTest: true,
  });
  const app = createApp({
    engineerMobile: {
      repository,
      useRequestAwareProvider: true,
    },
  });
  const response = await requestApp(app, '/engineer-mobile/tasks/apt_engineer_mobile_detail_repo_e2e_001', {});

  assert.equal(response.statusCode, 404);
  assert.deepEqual(response.body, {
    detail: null,
    messageKey: 'engineerMobile.taskDetailUnavailable',
    status: 'deny',
  });
  assertNoForbiddenOutput(response.body);
});

test('wrong appointment row is excluded through detail route', async () => {
  const repository = createEngineerMobileTaskDetailReadRepository({
    executor() {
      return { rows: [row({ appointment_id: 'apt_other' })] };
    },
    allowNonExecutableForTest: true,
  });
  const app = createApp({
    engineerMobile: {
      repository,
      useRequestAwareProvider: true,
    },
  });
  const response = await requestApp(app, '/engineer-mobile/tasks/apt_engineer_mobile_detail_repo_e2e_001', {});

  assert.equal(response.statusCode, 404);
  assert.deepEqual(response.body, {
    detail: null,
    messageKey: 'engineerMobile.taskDetailUnavailable',
    status: 'deny',
  });
  assertNoForbiddenOutput(response.body);
});

test('missing auth denied before executor', async () => {
  const executorCalls = [];
  const repository = createEngineerMobileTaskDetailReadRepository({
    executor(querySpec) {
      executorCalls.push(querySpec);
      return { rows: [row()] };
    },
    allowNonExecutableForTest: true,
  });
  const app = createApp({
    engineerMobile: {
      repository,
      useRequestAwareProvider: true,
    },
  });
  const response = await requestApp(
    app,
    '/engineer-mobile/tasks/apt_engineer_mobile_detail_repo_e2e_001',
    undefined,
  );

  assert.deepEqual(executorCalls, []);
  assert.equal(response.statusCode, 403);
  assert.deepEqual(response.body, {
    status: 'deny',
    messageKey: 'engineerMobile.unavailable',
    data: null,
  });
  assertNoForbiddenOutput(response.body);
});

test('missing permission denied before executor', async () => {
  const executorCalls = [];
  const repository = createEngineerMobileTaskDetailReadRepository({
    executor(querySpec) {
      executorCalls.push(querySpec);
      return { rows: [row()] };
    },
    allowNonExecutableForTest: true,
  });
  const app = createApp({
    engineerMobile: {
      repository,
      useRequestAwareProvider: true,
    },
  });
  const response = await requestApp(
    app,
    '/engineer-mobile/tasks/apt_engineer_mobile_detail_repo_e2e_001',
    { permissions: [] },
  );

  assert.deepEqual(executorCalls, []);
  assert.equal(response.statusCode, 403);
  assert.deepEqual(response.body, {
    status: 'deny',
    messageKey: 'engineerMobile.unavailable',
    data: null,
  });
  assertNoForbiddenOutput(response.body);
});

test('customer_service denied before executor', async () => {
  const executorCalls = [];
  const repository = createEngineerMobileTaskDetailReadRepository({
    executor(querySpec) {
      executorCalls.push(querySpec);
      return { rows: [row()] };
    },
    allowNonExecutableForTest: true,
  });
  const app = createApp({
    engineerMobile: {
      repository,
      useRequestAwareProvider: true,
    },
  });
  const response = await requestApp(
    app,
    '/engineer-mobile/tasks/apt_engineer_mobile_detail_repo_e2e_001',
    { role: 'customer_service' },
  );

  assert.deepEqual(executorCalls, []);
  assert.equal(response.statusCode, 403);
  assert.deepEqual(response.body, {
    status: 'deny',
    messageKey: 'engineerMobile.unavailable',
    data: null,
  });
  assertNoForbiddenOutput(response.body);
});

test('ai denied before executor', async () => {
  const executorCalls = [];
  const repository = createEngineerMobileTaskDetailReadRepository({
    executor(querySpec) {
      executorCalls.push(querySpec);
      return { rows: [row()] };
    },
    allowNonExecutableForTest: true,
  });
  const app = createApp({
    engineerMobile: {
      repository,
      useRequestAwareProvider: true,
    },
  });
  const response = await requestApp(
    app,
    '/engineer-mobile/tasks/apt_engineer_mobile_detail_repo_e2e_001',
    { role: 'ai' },
  );

  assert.deepEqual(executorCalls, []);
  assert.equal(response.statusCode, 403);
  assert.deepEqual(response.body, {
    status: 'deny',
    messageKey: 'engineerMobile.unavailable',
    data: null,
  });
  assertNoForbiddenOutput(response.body);
});

test('executor throw returns safe unavailable without raw error leak', async () => {
  const repository = createEngineerMobileTaskDetailReadRepository({
    executor() {
      throw new Error('executor failure should not leak');
    },
    allowNonExecutableForTest: true,
  });
  const app = createApp({
    engineerMobile: {
      repository,
      useRequestAwareProvider: true,
    },
  });
  const response = await requestApp(app, '/engineer-mobile/tasks/apt_engineer_mobile_detail_repo_e2e_001', {});

  assert.equal(response.statusCode, 404);
  assert.deepEqual(response.body, {
    detail: null,
    messageKey: 'engineerMobile.taskDetailUnavailable',
    status: 'deny',
  });
  assertNoForbiddenOutput(response.body);
});

test('createServerBootstrap detail path works without listen', async () => {
  const executorCalls = [];
  const repository = createEngineerMobileTaskDetailReadRepository({
    executor(querySpec) {
      executorCalls.push(querySpec);
      return { rows: [row({ case_id: 'case_server_detail_repo_e2e_allowed' })] };
    },
    allowNonExecutableForTest: true,
  });
  const bootstrap = createServerBootstrap({
    engineerMobile: {
      repository,
      useRequestAwareProvider: true,
    },
    port: 4075,
  });
  const response = await requestApp(
    bootstrap.app,
    '/engineer-mobile/tasks/apt_engineer_mobile_detail_repo_e2e_001',
    {},
  );

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.detail.caseId, 'case_server_detail_repo_e2e_allowed');
  assert.equal(executorCalls.length, 1);
  assertNoForbiddenOutput([response.body, executorCalls]);
});

test('server options.app priority bypasses engineerMobile repository and executor', () => {
  const listenCalls = [];
  const executorCalls = [];
  const injectedApp = createSyntheticApp(listenCalls);
  const repository = createEngineerMobileTaskDetailReadRepository({
    executor(querySpec) {
      executorCalls.push(querySpec);
      return { rows: [row()] };
    },
    allowNonExecutableForTest: true,
  });
  const bootstrap = createServerBootstrap({
    app: injectedApp,
    engineerMobile: {
      repository,
      useRequestAwareProvider: true,
    },
    port: 4076,
  });

  assert.equal(bootstrap.app, injectedApp);
  assert.deepEqual(executorCalls, []);
  assert.deepEqual(listenCalls, []);
});

test('list route remains safe empty when only detail repository is provided', async () => {
  const executorCalls = [];
  const repository = createEngineerMobileTaskDetailReadRepository({
    executor(querySpec) {
      executorCalls.push(querySpec);
      return { rows: [row()] };
    },
    allowNonExecutableForTest: true,
  });
  const app = createApp({
    engineerMobile: {
      repository,
      useRequestAwareProvider: true,
    },
  });
  const response = await requestApp(
    app,
    '/engineer-mobile/tasks?from=2026-05-21&to=2026-05-28',
    {},
  );

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'allow');
  assert.deepEqual(response.body.tasks, []);
  assert.deepEqual(executorCalls, []);
  assertNoForbiddenOutput(response.body);
});
