'use strict';

const assert = require('node:assert/strict');
const { Readable, Writable } = require('node:stream');
const test = require('node:test');

const { createApp } = require('../../src/app');
const {
  createServerBootstrap,
} = require('../../src/server');
const {
  createEngineerMobileReadRepository,
} = require('../../src/engineerMobile/engineerMobileReadRepository');

function auth(overrides = {}) {
  return {
    engineerId: 'eng_engineer_mobile_composite_e2e_001',
    organizationId: 'org_engineer_mobile_composite_e2e_001',
    permissions: ['engineer_mobile.tasks.read'],
    role: 'engineer',
    userId: 'user_engineer_mobile_composite_e2e_001',
    ...overrides,
  };
}

function listRow(overrides = {}) {
  return {
    appointment_id: 'apt_engineer_mobile_composite_e2e_001',
    assigned_engineer_id: 'eng_engineer_mobile_composite_e2e_001',
    case_id: 'case_engineer_mobile_composite_list_e2e_001',
    organization_id: 'org_engineer_mobile_composite_e2e_001',
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
    organization_id: 'org_engineer_mobile_composite_e2e_001',
    case_id: 'case_engineer_mobile_composite_detail_e2e_001',
    appointment_id: 'apt_engineer_mobile_composite_e2e_001',
    assigned_engineer_id: 'eng_engineer_mobile_composite_e2e_001',
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
        id: 'safe_composite_e2e_ref_001',
        type: 'photo',
        label: '故障照片',
      },
      {
        id: 'unsafe_signed_url',
        type: 'photo',
        url: 'https://example.invalid/signed-url',
      },
      'safe_composite_e2e_ref_002',
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

function createCompositeRepositoryWithSharedExecutor(executorCalls = []) {
  return createEngineerMobileReadRepository({
    executor(querySpec) {
      executorCalls.push(querySpec);

      if (querySpec.name === 'engineerMobileTaskDetailReadModel') {
        return {
          rows: [
            detailRow({ case_id: 'case_detail_shared_allowed' }),
            detailRow({ case_id: 'case_detail_wrong_org', organization_id: 'org_other' }),
            detailRow({ case_id: 'case_detail_wrong_engineer', assigned_engineer_id: 'eng_other' }),
            detailRow({ case_id: 'case_detail_wrong_appointment', appointment_id: 'apt_other' }),
          ],
        };
      }

      return {
        rows: [
          listRow({ case_id: 'case_list_shared_allowed' }),
          listRow({ case_id: 'case_list_wrong_org', organization_id: 'org_other' }),
          listRow({ case_id: 'case_list_wrong_engineer', assigned_engineer_id: 'eng_other' }),
        ],
      };
    },
    allowNonExecutableForTest: true,
  });
}

test('composite repository default mode fail-closes and does not call executor', () => {
  const executorCalls = [];
  const repository = createEngineerMobileReadRepository({
    executor(querySpec) {
      executorCalls.push(querySpec);
      return { rows: [listRow(), detailRow()] };
    },
  });

  assert.deepEqual(repository.getTaskList({
    engineerId: 'eng_engineer_mobile_composite_e2e_001',
    organizationId: 'org_engineer_mobile_composite_e2e_001',
  }), { tasks: [] });
  assert.deepEqual(repository.getTaskDetail({
    appointmentId: 'apt_engineer_mobile_composite_e2e_001',
    engineerId: 'eng_engineer_mobile_composite_e2e_001',
    organizationId: 'org_engineer_mobile_composite_e2e_001',
  }), { task: null });
  assert.deepEqual(executorCalls, []);
});

test('composite repository synthetic mode calls shared executor for list route', async () => {
  const executorCalls = [];
  const app = createApp({
    engineerMobile: {
      repository: createCompositeRepositoryWithSharedExecutor(executorCalls),
      useRequestAwareProvider: true,
    },
  });
  const response = await requestApp(
    app,
    '/engineer-mobile/tasks?from=2026-05-21&to=2026-05-28',
    {},
  );

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body.tasks.map((task) => task.caseId), ['case_list_shared_allowed']);
  assert.equal(executorCalls.length, 1);
  assert.equal(executorCalls[0].name, 'engineerMobileTaskListReadModel');
  assert.equal(Object.isFrozen(executorCalls[0]), true);
  assert.equal(Object.isFrozen(executorCalls[0].params), true);
  assert.deepEqual(executorCalls[0].params, {
    organizationId: 'org_engineer_mobile_composite_e2e_001',
    engineerId: 'eng_engineer_mobile_composite_e2e_001',
    from: '2026-05-21',
    to: '2026-05-28',
  });
  assertNoForbiddenOutput([response.body, executorCalls]);
});

test('composite repository synthetic mode calls shared executor for detail route', async () => {
  const executorCalls = [];
  const app = createApp({
    engineerMobile: {
      repository: createCompositeRepositoryWithSharedExecutor(executorCalls),
      useRequestAwareProvider: true,
    },
  });
  const response = await requestApp(
    app,
    '/engineer-mobile/tasks/apt_engineer_mobile_composite_e2e_001',
    {},
  );

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.detail.caseId, 'case_detail_shared_allowed');
  assert.equal(executorCalls.length, 1);
  assert.equal(executorCalls[0].name, 'engineerMobileTaskDetailReadModel');
  assert.equal(Object.isFrozen(executorCalls[0]), true);
  assert.equal(Object.isFrozen(executorCalls[0].params), true);
  assert.deepEqual(executorCalls[0].params, {
    appointmentId: 'apt_engineer_mobile_composite_e2e_001',
    engineerId: 'eng_engineer_mobile_composite_e2e_001',
    organizationId: 'org_engineer_mobile_composite_e2e_001',
  });
  assertNoForbiddenOutput([response.body, executorCalls]);
});

test('same app list route returns assigned scoped tasks', async () => {
  const executorCalls = [];
  const app = createApp({
    engineerMobile: {
      repository: createCompositeRepositoryWithSharedExecutor(executorCalls),
      useRequestAwareProvider: true,
    },
  });
  const response = await requestApp(app, '/engineer-mobile/tasks?from=2026-05-21&to=2026-05-28', {});

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'allow');
  assert.deepEqual(response.body.tasks.map((task) => task.caseId), ['case_list_shared_allowed']);
  assertNoForbiddenOutput([response.body, executorCalls]);
});

test('same app detail route returns matching assigned task detail', async () => {
  const executorCalls = [];
  const app = createApp({
    engineerMobile: {
      repository: createCompositeRepositoryWithSharedExecutor(executorCalls),
      useRequestAwareProvider: true,
    },
  });
  const response = await requestApp(app, '/engineer-mobile/tasks/apt_engineer_mobile_composite_e2e_001', {});

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'allow');
  assert.equal(response.body.detail.caseId, 'case_detail_shared_allowed');
  assert.equal(response.body.detail.appointmentId, 'apt_engineer_mobile_composite_e2e_001');
  assert.deepEqual(response.body.detail.evidenceRefs, [
    {
      id: 'safe_composite_e2e_ref_001',
      type: 'photo',
      label: '故障照片',
    },
    {
      id: 'safe_composite_e2e_ref_002',
      type: 'reference',
    },
  ]);
  assertNoForbiddenOutput([response.body, executorCalls]);
});

test('wrong organization rows are excluded from list and detail', async () => {
  const repository = createEngineerMobileReadRepository({
    listExecutor() {
      return { rows: [listRow({ organization_id: 'org_other' })] };
    },
    detailExecutor() {
      return { rows: [detailRow({ organization_id: 'org_other' })] };
    },
    allowNonExecutableForTest: true,
  });
  const app = createApp({
    engineerMobile: {
      repository,
      useRequestAwareProvider: true,
    },
  });
  const listResponse = await requestApp(app, '/engineer-mobile/tasks', {});
  const detailResponse = await requestApp(app, '/engineer-mobile/tasks/apt_engineer_mobile_composite_e2e_001', {});

  assert.deepEqual(listResponse.body.tasks, []);
  assert.equal(detailResponse.statusCode, 404);
  assertNoForbiddenOutput([listResponse.body, detailResponse.body]);
});

test('wrong engineer rows are excluded from list and detail', async () => {
  const repository = createEngineerMobileReadRepository({
    listExecutor() {
      return { rows: [listRow({ assigned_engineer_id: 'eng_other' })] };
    },
    detailExecutor() {
      return { rows: [detailRow({ assigned_engineer_id: 'eng_other' })] };
    },
    allowNonExecutableForTest: true,
  });
  const app = createApp({
    engineerMobile: {
      repository,
      useRequestAwareProvider: true,
    },
  });
  const listResponse = await requestApp(app, '/engineer-mobile/tasks', {});
  const detailResponse = await requestApp(app, '/engineer-mobile/tasks/apt_engineer_mobile_composite_e2e_001', {});

  assert.deepEqual(listResponse.body.tasks, []);
  assert.equal(detailResponse.statusCode, 404);
  assertNoForbiddenOutput([listResponse.body, detailResponse.body]);
});

test('wrong appointmentId is excluded from detail', async () => {
  const repository = createEngineerMobileReadRepository({
    detailExecutor() {
      return { rows: [detailRow({ appointment_id: 'apt_other' })] };
    },
    allowNonExecutableForTest: true,
  });
  const app = createApp({
    engineerMobile: {
      repository,
      useRequestAwareProvider: true,
    },
  });
  const response = await requestApp(app, '/engineer-mobile/tasks/apt_engineer_mobile_composite_e2e_001', {});

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
  const app = createApp({
    engineerMobile: {
      repository: createCompositeRepositoryWithSharedExecutor(executorCalls),
      useRequestAwareProvider: true,
    },
  });
  const response = await requestApp(
    app,
    '/engineer-mobile/tasks/apt_engineer_mobile_composite_e2e_001',
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
  const app = createApp({
    engineerMobile: {
      repository: createCompositeRepositoryWithSharedExecutor(executorCalls),
      useRequestAwareProvider: true,
    },
  });
  const response = await requestApp(
    app,
    '/engineer-mobile/tasks/apt_engineer_mobile_composite_e2e_001',
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
  const app = createApp({
    engineerMobile: {
      repository: createCompositeRepositoryWithSharedExecutor(executorCalls),
      useRequestAwareProvider: true,
    },
  });
  const response = await requestApp(
    app,
    '/engineer-mobile/tasks/apt_engineer_mobile_composite_e2e_001',
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
  const app = createApp({
    engineerMobile: {
      repository: createCompositeRepositoryWithSharedExecutor(executorCalls),
      useRequestAwareProvider: true,
    },
  });
  const response = await requestApp(
    app,
    '/engineer-mobile/tasks/apt_engineer_mobile_composite_e2e_001',
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

test('createServerBootstrap list and detail paths work without listen', async () => {
  const executorCalls = [];
  const bootstrap = createServerBootstrap({
    engineerMobile: {
      repository: createCompositeRepositoryWithSharedExecutor(executorCalls),
      useRequestAwareProvider: true,
    },
    port: 4077,
  });
  const listResponse = await requestApp(bootstrap.app, '/engineer-mobile/tasks?from=2026-05-21&to=2026-05-28', {});
  const detailResponse = await requestApp(bootstrap.app, '/engineer-mobile/tasks/apt_engineer_mobile_composite_e2e_001', {});

  assert.equal(listResponse.statusCode, 200);
  assert.deepEqual(listResponse.body.tasks.map((task) => task.caseId), ['case_list_shared_allowed']);
  assert.equal(detailResponse.statusCode, 200);
  assert.equal(detailResponse.body.detail.caseId, 'case_detail_shared_allowed');
  assert.deepEqual(executorCalls.map((call) => call.name), [
    'engineerMobileTaskListReadModel',
    'engineerMobileTaskDetailReadModel',
  ]);
  assertNoForbiddenOutput([listResponse.body, detailResponse.body, executorCalls]);
});

test('server options.app priority bypasses engineerMobile repository and executor', () => {
  const listenCalls = [];
  const executorCalls = [];
  const injectedApp = createSyntheticApp(listenCalls);
  const bootstrap = createServerBootstrap({
    app: injectedApp,
    engineerMobile: {
      repository: createCompositeRepositoryWithSharedExecutor(executorCalls),
      useRequestAwareProvider: true,
    },
    port: 4078,
  });

  assert.equal(bootstrap.app, injectedApp);
  assert.deepEqual(executorCalls, []);
  assert.deepEqual(listenCalls, []);
});
