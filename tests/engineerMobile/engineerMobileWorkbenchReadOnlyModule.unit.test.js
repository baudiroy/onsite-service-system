'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  createEngineerMobileWorkbenchReadOnlyModule,
} = require('../../src/engineerMobile/engineerMobileWorkbenchReadOnlyModule');

const MODULE_SOURCE = path.join(
  __dirname,
  '../../src/engineerMobile/engineerMobileWorkbenchReadOnlyModule.js',
);

function engineerContext(overrides = {}) {
  return {
    organizationId: 'org_engineer_mobile_1742',
    engineerUserId: 'eng_user_1742',
    permissions: ['engineer_mobile.assigned_appointments.read'],
    ...overrides,
  };
}

function resolverBackedRequest(overrides = {}) {
  return {
    context: {
      organizationId: 'org_engineer_mobile_1746',
      engineerUserId: 'eng_user_1746',
      assignedAppointmentsReadAllowed: true,
      requestId: 'req_1746',
    },
    headers: {
      'x-request-id': 'header_req_1746',
      authorization: 'authorization_header_should_not_leak',
      cookie: 'cookie_should_not_leak',
    },
    auth: {
      token: 'token_should_not_leak',
      password: 'password_should_not_leak',
      secret: 'secret_should_not_leak',
    },
    session: {
      raw: 'raw_session_should_not_leak',
    },
    user: {
      raw: 'raw_user_should_not_leak',
    },
    ...overrides,
  };
}

function syntheticApp() {
  const calls = {
    get: [],
    post: [],
    put: [],
    patch: [],
    delete: [],
    listen: [],
  };

  return {
    calls,
    get(routePath, handler) {
      calls.get.push({ path: routePath, handler });
      return this;
    },
    post() {
      calls.post.push('post');
      throw new Error('post should not be called');
    },
    put() {
      calls.put.push('put');
      throw new Error('put should not be called');
    },
    patch() {
      calls.patch.push('patch');
      throw new Error('patch should not be called');
    },
    delete() {
      calls.delete.push('delete');
      throw new Error('delete should not be called');
    },
    listen() {
      calls.listen.push('listen');
      throw new Error('listen should not be called');
    },
  };
}

function createResponseRecorder() {
  const response = {
    statusCode: undefined,
    body: undefined,
    status(statusCode) {
      response.statusCode = statusCode;
      return response;
    },
    json(body) {
      response.body = body;
      return response;
    },
  };

  return response;
}

function createRepository(options = {}) {
  const calls = {
    list: [],
    detail: [],
    mutate: [],
  };
  const repository = {
    calls,
    async findAssignedAppointments(query) {
      calls.list.push(query);

      if (options.throwList) {
        throw new Error('raw sql stack_trace_should_not_leak token_should_not_leak');
      }

      return [
        {
          organizationId: query.organizationId,
          engineerUserId: query.engineerUserId,
          appointmentId: 'apt_1742_list_001',
          caseReference: 'CASE-1742-001',
          scheduledStart: '2026-06-01T01:00:00.000Z',
          scheduledEnd: '2026-06-01T03:00:00.000Z',
          appointmentWindow: '2026-06-01 09:00-11:00',
          serviceType: 'onsite',
          customerDisplayName: 'Customer masked',
          locationLabel: 'Taipei Zhongshan',
          status: 'confirmed',
          priorityLabel: 'normal',
          finalAppointmentId: 'finalAppointmentId_should_not_leak',
          internalNotes: 'internal_note_should_not_leak',
          rawSql: 'raw sql should_not_leak',
          rawDbRow: 'raw DB rows should_not_leak',
          providerDebug: 'provider_debug_should_not_leak',
        },
      ];
    },
    async findAssignedAppointmentDetail(query) {
      calls.detail.push(query);

      if (options.throwDetail) {
        throw new Error('detail raw sql stack_trace_should_not_leak token_should_not_leak');
      }

      return {
        organizationId: query.organizationId,
        engineerUserId: query.engineerUserId,
        appointmentId: query.appointmentId,
        caseReference: 'CASE-1742-DETAIL',
        scheduledStart: '2026-06-01T05:00:00.000Z',
        scheduledEnd: '2026-06-01T07:00:00.000Z',
        appointmentWindow: '2026-06-01 13:00-15:00',
        serviceType: 'onsite',
        customerDisplayName: 'Detail customer masked',
        locationLabel: 'Taipei Da-an',
        status: 'confirmed',
        priorityLabel: 'high',
        serviceSummary: 'Read-only visit summary',
        publicCustomerNotes: 'Customer-visible note',
        checklistPreview: [{ label: 'Confirm model', status: 'pending' }],
        finalAppointmentId: 'finalAppointmentId_should_not_leak',
        rawSql: 'raw sql should_not_leak',
        rawDbRow: 'raw DB rows should_not_leak',
        stack: 'stack_trace_should_not_leak',
        internalNotes: 'internal_note_should_not_leak',
        providerPayload: 'provider_debug_should_not_leak',
      };
    },
    async create() {
      calls.mutate.push('create');
      throw new Error('create should not be called');
    },
    async update() {
      calls.mutate.push('update');
      throw new Error('update should not be called');
    },
    async delete() {
      calls.mutate.push('delete');
      throw new Error('delete should not be called');
    },
    async completeAppointment() {
      calls.mutate.push('completeAppointment');
      throw new Error('complete should not be called');
    },
    async submitFieldServiceReport() {
      calls.mutate.push('submitFieldServiceReport');
      throw new Error('FSR should not be called');
    },
  };

  return repository;
}

function assertNoForbiddenLeak(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'finalAppointmentId_should_not_leak',
    'raw sql',
    'raw DB rows',
    'stack_trace_should_not_leak',
    'internal_note_should_not_leak',
    'provider_debug_should_not_leak',
    'authorization_header_should_not_leak',
    'cookie_should_not_leak',
    'password_should_not_leak',
    'raw_session_should_not_leak',
    'raw_user_should_not_leak',
    'token_should_not_leak',
    'secret_should_not_leak',
    'line_should_not_leak',
    'sms_should_not_leak',
    'billing_should_not_leak',
    'settlement_should_not_leak',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `module output leaked ${forbidden}`);
  }
}

function registeredRoutes(app) {
  return Object.fromEntries(app.calls.get.map((call) => [call.path, call.handler]));
}

test('module can be created with injected repository and getContext, then registers canonical read-only routes', () => {
  const repository = createRepository();
  const app = syntheticApp();
  const module = createEngineerMobileWorkbenchReadOnlyModule({
    assignedAppointmentRepository: repository,
    getContext: async () => engineerContext(),
  });

  const result = module.register({
    app,
    includeInternalAliases: false,
  });

  assert.equal(module.configured, true);
  assert.equal(typeof module.handlers.assignedAppointmentsHandler, 'function');
  assert.equal(typeof module.handlers.assignedAppointmentDetailHandler, 'function');
  assert.equal(result.registered, true);
  assert.deepEqual(app.calls.get.map((call) => call.path), [
    '/engineer-mobile/appointments',
    '/engineer-mobile/appointments/:appointmentId',
  ]);
  assert.deepEqual(app.calls.post, []);
  assert.deepEqual(app.calls.put, []);
  assert.deepEqual(app.calls.patch, []);
  assert.deepEqual(app.calls.delete, []);
  assert.deepEqual(app.calls.listen, []);
});

test('module fails closed when the injected repository is missing', () => {
  const app = syntheticApp();
  const module = createEngineerMobileWorkbenchReadOnlyModule({
    getContext: async () => engineerContext(),
  });

  const result = module.register({ app });

  assert.equal(module.configured, false);
  assert.equal(result.registered, false);
  assert.equal(result.messageKey, 'engineerMobile.workbenchReadOnly.unavailable');
  assert.equal(result.engineerMobileVisible, false);
  assert.deepEqual(app.calls.get, []);
  assert.deepEqual(app.calls.listen, []);
});

test('synthetic HTTP list route flows through adapter, list handler, and injected repository', async () => {
  const repository = createRepository();
  const app = syntheticApp();
  const module = createEngineerMobileWorkbenchReadOnlyModule({
    assignedAppointmentRepository: repository,
    getContext: async () => engineerContext(),
  });
  module.register({ app, includeInternalAliases: false });

  const routes = registeredRoutes(app);
  const response = createResponseRecorder();
  await routes['/engineer-mobile/appointments']({
    query: {
      from: '2026-06-01T00:00:00.000Z',
      to: '2026-06-01T23:59:59.999Z',
      status: 'confirmed',
      finalAppointmentId: 'finalAppointmentId_should_not_leak',
      token: 'token_should_not_leak',
    },
  }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'allow');
  assert.equal(response.body.data.appointments.length, 1);
  assert.deepEqual(repository.calls.list, [
    {
      organizationId: 'org_engineer_mobile_1742',
      engineerUserId: 'eng_user_1742',
      filters: {
        from: '2026-06-01T00:00:00.000Z',
        to: '2026-06-01T23:59:59.999Z',
        status: 'confirmed',
      },
    },
  ]);
  assert.deepEqual(repository.calls.mutate, []);
  assertNoForbiddenLeak(response.body);
});

test('synthetic HTTP detail route flows through adapter, detail handler, and injected repository', async () => {
  const repository = createRepository();
  const app = syntheticApp();
  const module = createEngineerMobileWorkbenchReadOnlyModule({
    assignedAppointmentRepository: repository,
    getContext: async () => engineerContext(),
  });
  module.register({ app, includeInternalAliases: false });

  const routes = registeredRoutes(app);
  const response = createResponseRecorder();
  await routes['/engineer-mobile/appointments/:appointmentId']({
    params: {
      appointmentId: 'apt_1742_detail_001',
    },
  }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'allow');
  assert.equal(response.body.data.appointment.appointmentId, 'apt_1742_detail_001');
  assert.deepEqual(repository.calls.detail, [
    {
      organizationId: 'org_engineer_mobile_1742',
      engineerUserId: 'eng_user_1742',
      appointmentId: 'apt_1742_detail_001',
    },
  ]);
  assert.deepEqual(repository.calls.mutate, []);
  assertNoForbiddenLeak(response.body);
});

test('module can use Task1744 resolver as request-backed context source', async () => {
  const repository = createRepository();
  const app = syntheticApp();
  const module = createEngineerMobileWorkbenchReadOnlyModule({
    assignedAppointmentRepository: repository,
    requestContextResolver: true,
  });
  module.register({ app, includeInternalAliases: false });

  const routes = registeredRoutes(app);
  const response = createResponseRecorder();
  await routes['/engineer-mobile/appointments']({
    ...resolverBackedRequest(),
    query: {
      status: 'confirmed',
      token: 'token_should_not_leak',
    },
  }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'allow');
  assert.deepEqual(repository.calls.list, [
    {
      organizationId: 'org_engineer_mobile_1746',
      engineerUserId: 'eng_user_1746',
      filters: {
        status: 'confirmed',
      },
    },
  ]);
  assert.deepEqual(repository.calls.mutate, []);
  assertNoForbiddenLeak(response.body);
});

test('canonical detail route works through resolver-backed request context', async () => {
  const repository = createRepository();
  const app = syntheticApp();
  const module = createEngineerMobileWorkbenchReadOnlyModule({
    assignedAppointmentRepository: repository,
    requestContextResolver: true,
  });
  module.register({ app, includeInternalAliases: false });

  const routes = registeredRoutes(app);
  const response = createResponseRecorder();
  await routes['/engineer-mobile/appointments/:appointmentId']({
    ...resolverBackedRequest(),
    params: {
      appointmentId: 'apt_1746_detail_001',
    },
    query: {
      finalAppointmentId: 'finalAppointmentId_should_not_leak',
    },
  }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'allow');
  assert.equal(response.body.data.appointment.appointmentId, 'apt_1746_detail_001');
  assert.deepEqual(repository.calls.detail, [
    {
      organizationId: 'org_engineer_mobile_1746',
      engineerUserId: 'eng_user_1746',
      appointmentId: 'apt_1746_detail_001',
    },
  ]);
  assert.deepEqual(repository.calls.mutate, []);
  assertNoForbiddenLeak(response.body);
});

test('missing read permission from resolver-backed path fails closed before repository access', async () => {
  const repository = createRepository();
  const app = syntheticApp();
  const module = createEngineerMobileWorkbenchReadOnlyModule({
    assignedAppointmentRepository: repository,
    requestContextResolver: true,
  });
  module.register({ app, includeInternalAliases: false });

  const routes = registeredRoutes(app);
  const response = createResponseRecorder();
  await routes['/engineer-mobile/appointments']({
    ...resolverBackedRequest({
      context: {
        organizationId: 'org_engineer_mobile_1746',
        engineerUserId: 'eng_user_1746',
      },
    }),
    query: {},
  }, response);

  assert.equal(response.statusCode, 404);
  assert.equal(response.body.status, 'deny');
  assert.deepEqual(repository.calls.list, []);
  assert.deepEqual(repository.calls.detail, []);
  assert.deepEqual(repository.calls.mutate, []);
  assertNoForbiddenLeak(response.body);
});

test('resolver throw fails closed without leaking raw request or raw error', async () => {
  const repository = createRepository();
  const app = syntheticApp();
  const module = createEngineerMobileWorkbenchReadOnlyModule({
    assignedAppointmentRepository: repository,
    requestContextResolver: async () => {
      throw new Error('raw sql stack_trace_should_not_leak token_should_not_leak');
    },
  });
  module.register({ app, includeInternalAliases: false });

  const routes = registeredRoutes(app);
  const response = createResponseRecorder();
  await routes['/engineer-mobile/appointments'](resolverBackedRequest(), response);

  assert.equal(response.statusCode, 404);
  assert.equal(response.body.status, 'deny');
  assert.deepEqual(repository.calls.list, []);
  assert.deepEqual(repository.calls.detail, []);
  assert.deepEqual(repository.calls.mutate, []);
  assertNoForbiddenLeak(response.body);
});

test('resolver-backed route does not mutate the input request', async () => {
  const repository = createRepository();
  const app = syntheticApp();
  const module = createEngineerMobileWorkbenchReadOnlyModule({
    assignedAppointmentRepository: repository,
    requestContextResolver: true,
  });
  module.register({ app, includeInternalAliases: false });

  const routes = registeredRoutes(app);
  const request = {
    ...resolverBackedRequest(),
    query: {
      status: 'confirmed',
    },
  };
  const before = JSON.stringify(request);
  const response = createResponseRecorder();

  await routes['/engineer-mobile/appointments'](request, response);

  assert.equal(response.statusCode, 200);
  assert.equal(JSON.stringify(request), before);
  assert.deepEqual(repository.calls.mutate, []);
  assertNoForbiddenLeak(response.body);
});

test('missing context fails closed before repository access', async () => {
  const repository = createRepository();
  const app = syntheticApp();
  const module = createEngineerMobileWorkbenchReadOnlyModule({
    assignedAppointmentRepository: repository,
    getContext: async () => undefined,
  });
  module.register({ app, includeInternalAliases: false });

  const routes = registeredRoutes(app);
  const listResponse = createResponseRecorder();
  const detailResponse = createResponseRecorder();

  await routes['/engineer-mobile/appointments']({ query: {} }, listResponse);
  await routes['/engineer-mobile/appointments/:appointmentId']({
    params: {
      appointmentId: 'apt_1742_detail_001',
    },
  }, detailResponse);

  assert.equal(listResponse.statusCode, 404);
  assert.equal(listResponse.body.status, 'deny');
  assert.equal(detailResponse.statusCode, 404);
  assert.equal(detailResponse.body.status, 'deny');
  assert.deepEqual(repository.calls.list, []);
  assert.deepEqual(repository.calls.detail, []);
  assert.deepEqual(repository.calls.mutate, []);
  assertNoForbiddenLeak(listResponse.body);
  assertNoForbiddenLeak(detailResponse.body);
});

test('repository throw fails closed without raw error leak', async () => {
  const repository = createRepository({ throwList: true, throwDetail: true });
  const app = syntheticApp();
  const module = createEngineerMobileWorkbenchReadOnlyModule({
    assignedAppointmentRepository: repository,
    getContext: async () => engineerContext(),
  });
  module.register({ app, includeInternalAliases: false });

  const routes = registeredRoutes(app);
  const listResponse = createResponseRecorder();
  const detailResponse = createResponseRecorder();

  await routes['/engineer-mobile/appointments']({ query: {} }, listResponse);
  await routes['/engineer-mobile/appointments/:appointmentId']({
    params: {
      appointmentId: 'apt_1742_detail_001',
    },
  }, detailResponse);

  assert.equal(listResponse.statusCode, 404);
  assert.equal(listResponse.body.status, 'deny');
  assert.equal(detailResponse.statusCode, 404);
  assert.equal(detailResponse.body.status, 'deny');
  assert.deepEqual(repository.calls.mutate, []);
  assertNoForbiddenLeak(listResponse.body);
  assertNoForbiddenLeak(detailResponse.body);
});

test('module source stays isolated from app server routes DB provider smoke and mutation surfaces', () => {
  const source = fs.readFileSync(MODULE_SOURCE, 'utf8');

  for (const forbidden of [
    "require('../app')",
    "require('../server')",
    "require('../routes",
    'src/app',
    'src/server',
    'src/routes',
    'listen(',
    'postgres',
    'psql',
    'db:migrate',
    'migration',
    'smoke',
    'line',
    'sms',
    'email',
    'webhook',
    'provider',
    'rag',
    'billing',
    'settlement',
    'finalAppointmentId',
    'fieldServiceReport',
    'completeAppointment',
    'submitFieldServiceReport',
  ]) {
    assert.equal(source.includes(forbidden), false, `module source includes forbidden token ${forbidden}`);
  }
});
