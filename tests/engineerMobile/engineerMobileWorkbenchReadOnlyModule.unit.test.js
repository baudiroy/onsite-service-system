'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  createEngineerMobileWorkbenchReadOnlyModule,
} = require('../../src/engineerMobile/engineerMobileWorkbenchReadOnlyModule');
const {
  ASSIGNED_APPOINTMENT_DETAIL_QUERY_NAME,
  ASSIGNED_APPOINTMENT_LIST_QUERY_NAME,
} = require('../../src/engineerMobile/engineerMobileAssignedAppointmentSqlQueryBuilder');

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

function createSyntheticDbQueryExecutor(options = {}) {
  const calls = [];

  async function queryExecutor(querySpec) {
    calls.push(querySpec);

    if (options.throwExecutor) {
      throw new Error('raw sql stack_trace_should_not_leak token_should_not_leak');
    }

    if (querySpec.name === ASSIGNED_APPOINTMENT_LIST_QUERY_NAME) {
      return {
        rows: [
          {
            organization_id: querySpec.params.organizationId,
            assigned_engineer_id: querySpec.params.engineerUserId,
            appointment_id: 'apt_1762_list_001',
            case_reference: 'CASE-1762-LIST',
            appointment_window: '2026-06-02 09:00-11:00',
            scheduled_start: '2026-06-02T01:00:00.000Z',
            scheduled_end: '2026-06-02T03:00:00.000Z',
            service_type: 'onsite',
            customer_display_name: 'DB adapter customer masked',
            location_label: 'Taipei Xinyi',
            appointment_status: 'confirmed',
            priority_label: 'normal',
            finalAppointmentId: 'finalAppointmentId_should_not_leak',
            rawSql: 'raw sql should_not_leak',
            rawDbRow: 'raw DB rows should_not_leak',
            stack: 'stack_trace_should_not_leak',
            internal_notes: 'internal_note_should_not_leak',
            providerDebug: 'provider_debug_should_not_leak',
            token: 'token_should_not_leak',
            cookie: 'cookie_should_not_leak',
            password: 'password_should_not_leak',
            secret: 'secret_should_not_leak',
            authorization: 'authorization_header_should_not_leak',
          },
        ],
      };
    }

    if (querySpec.name === ASSIGNED_APPOINTMENT_DETAIL_QUERY_NAME) {
      return {
        rows: [
          {
            organization_id: querySpec.params.organizationId,
            assigned_engineer_id: querySpec.params.engineerUserId,
            appointment_id: querySpec.params.appointmentId,
            case_reference: 'CASE-1762-DETAIL',
            appointment_window: '2026-06-02 13:00-15:00',
            scheduled_start: '2026-06-02T05:00:00.000Z',
            scheduled_end: '2026-06-02T07:00:00.000Z',
            service_type: 'onsite',
            customer_display_name: 'DB adapter detail customer masked',
            location_label: 'Taipei Songshan',
            appointment_status: 'confirmed',
            priority_label: 'high',
            service_summary: 'Read-only DB adapter detail',
            public_customer_notes: 'Customer-visible DB note',
            checklist_preview: [{ label: 'Confirm serial', status: 'pending' }],
            finalAppointmentId: 'finalAppointmentId_should_not_leak',
            rawSql: 'raw sql should_not_leak',
            rawDbRow: 'raw DB rows should_not_leak',
            stack: 'stack_trace_should_not_leak',
            internal_notes: 'internal_note_should_not_leak',
            providerPayload: 'provider_debug_should_not_leak',
            token: 'token_should_not_leak',
            cookie: 'cookie_should_not_leak',
            password: 'password_should_not_leak',
            secret: 'secret_should_not_leak',
            authorization: 'authorization_header_should_not_leak',
          },
        ],
      };
    }

    return { rows: [] };
  }

  queryExecutor.calls = calls;

  return queryExecutor;
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

test('module can opt into repository guard with a synthetic delegate repository', async () => {
  const repository = createRepository();
  const guardAuditEvents = [];
  const app = syntheticApp();
  const module = createEngineerMobileWorkbenchReadOnlyModule({
    delegateAssignedAppointmentRepository: repository,
    getContext: async () => engineerContext(),
    repositoryGuardAuditLogger: guardAuditEvents.push.bind(guardAuditEvents),
    useRepositoryGuard: true,
  });
  module.register({ app, includeInternalAliases: false });

  const routes = registeredRoutes(app);
  const listResponse = createResponseRecorder();
  const detailResponse = createResponseRecorder();

  await routes['/engineer-mobile/appointments']({
    query: {
      status: 'confirmed',
      finalAppointmentId: 'finalAppointmentId_should_not_leak',
      rawSql: 'raw sql should_not_leak',
      token: 'token_should_not_leak',
    },
  }, listResponse);
  await routes['/engineer-mobile/appointments/:appointmentId']({
    params: {
      appointmentId: 'apt_1742_detail_001',
      finalAppointmentId: 'finalAppointmentId_should_not_leak',
      token: 'token_should_not_leak',
    },
  }, detailResponse);

  assert.equal(module.configured, true);
  assert.equal(listResponse.statusCode, 200);
  assert.equal(listResponse.body.status, 'allow');
  assert.equal(detailResponse.statusCode, 200);
  assert.equal(detailResponse.body.status, 'allow');
  assert.deepEqual(repository.calls.list, [
    {
      organizationId: 'org_engineer_mobile_1742',
      engineerUserId: 'eng_user_1742',
      filters: {
        status: 'confirmed',
      },
    },
  ]);
  assert.deepEqual(repository.calls.detail, [
    {
      organizationId: 'org_engineer_mobile_1742',
      engineerUserId: 'eng_user_1742',
      appointmentId: 'apt_1742_detail_001',
    },
  ]);
  assert.deepEqual(repository.calls.mutate, []);
  assert.deepEqual(guardAuditEvents, [
    {
      event: 'engineerMobile.assignedAppointmentRepositoryGuard.read',
      method: 'findAssignedAppointments',
      outcome: 'allow',
      organizationId: 'org_engineer_mobile_1742',
      engineerUserId: 'eng_user_1742',
    },
    {
      event: 'engineerMobile.assignedAppointmentRepositoryGuard.read',
      method: 'findAssignedAppointmentDetail',
      outcome: 'allow',
      organizationId: 'org_engineer_mobile_1742',
      engineerUserId: 'eng_user_1742',
      appointmentId: 'apt_1742_detail_001',
    },
  ]);
  assertNoForbiddenLeak(listResponse.body);
  assertNoForbiddenLeak(detailResponse.body);
  assertNoForbiddenLeak(guardAuditEvents);
});

test('module can use DB repository adapter with injected synthetic queryExecutor', async () => {
  const queryExecutor = createSyntheticDbQueryExecutor();
  const app = syntheticApp();
  const module = createEngineerMobileWorkbenchReadOnlyModule({
    assignedAppointmentQueryExecutor: queryExecutor,
    getContext: async () => engineerContext(),
  });
  module.register({ app, includeInternalAliases: false });

  const routes = registeredRoutes(app);
  const listResponse = createResponseRecorder();
  const detailResponse = createResponseRecorder();

  await routes['/engineer-mobile/appointments']({
    query: {
      from: '2026-06-02T00:00:00.000Z',
      to: '2026-06-02T23:59:59.999Z',
      status: 'confirmed',
      finalAppointmentId: 'finalAppointmentId_should_not_leak',
      rawSql: 'raw sql should_not_leak',
      token: 'token_should_not_leak',
      cookie: 'cookie_should_not_leak',
      password: 'password_should_not_leak',
      secret: 'secret_should_not_leak',
    },
  }, listResponse);
  await routes['/engineer-mobile/appointments/:appointmentId']({
    params: {
      appointmentId: 'apt_1762_detail_001',
      finalAppointmentId: 'finalAppointmentId_should_not_leak',
      token: 'token_should_not_leak',
    },
  }, detailResponse);

  assert.equal(module.configured, true);
  assert.equal(listResponse.statusCode, 200);
  assert.equal(listResponse.body.status, 'allow');
  assert.deepEqual(listResponse.body.data.appointments, [
    {
      appointmentId: 'apt_1762_list_001',
      caseReference: 'CASE-1762-LIST',
      appointmentWindow: '2026-06-02 09:00-11:00',
      scheduledStart: '2026-06-02T01:00:00.000Z',
      scheduledEnd: '2026-06-02T03:00:00.000Z',
      serviceType: 'onsite',
      customerDisplayName: 'DB adapter customer masked',
      locationLabel: 'Taipei Xinyi',
      status: 'confirmed',
      priorityLabel: 'normal',
      canOpenDetails: true,
    },
  ]);
  assert.equal(detailResponse.statusCode, 200);
  assert.equal(detailResponse.body.status, 'allow');
  assert.equal(detailResponse.body.data.appointment.appointmentId, 'apt_1762_detail_001');
  assert.equal(detailResponse.body.data.appointment.caseReference, 'CASE-1762-DETAIL');
  assert.equal(detailResponse.body.data.appointment.serviceSummary, 'Read-only DB adapter detail');
  assert.deepEqual(queryExecutor.calls.map((querySpec) => querySpec.name), [
    ASSIGNED_APPOINTMENT_LIST_QUERY_NAME,
    ASSIGNED_APPOINTMENT_DETAIL_QUERY_NAME,
  ]);
  assert.deepEqual(queryExecutor.calls[0].params, {
    engineerUserId: 'eng_user_1742',
    from: '2026-06-02T00:00:00.000Z',
    organizationId: 'org_engineer_mobile_1742',
    status: 'confirmed',
    to: '2026-06-02T23:59:59.999Z',
  });
  assert.deepEqual(queryExecutor.calls[0].values, [
    'org_engineer_mobile_1742',
    'eng_user_1742',
    '2026-06-02T00:00:00.000Z',
    '2026-06-02T23:59:59.999Z',
    'confirmed',
  ]);
  assert.deepEqual(queryExecutor.calls[1].params, {
    appointmentId: 'apt_1762_detail_001',
    engineerUserId: 'eng_user_1742',
    organizationId: 'org_engineer_mobile_1742',
  });
  assert.deepEqual(queryExecutor.calls[1].values, [
    'org_engineer_mobile_1742',
    'eng_user_1742',
    'apt_1762_detail_001',
  ]);
  assert.equal(JSON.stringify(queryExecutor.calls).includes('token_should_not_leak'), false);
  assert.equal(JSON.stringify(queryExecutor.calls).includes('cookie_should_not_leak'), false);
  assert.equal(JSON.stringify(queryExecutor.calls).includes('password_should_not_leak'), false);
  assert.equal(JSON.stringify(queryExecutor.calls).includes('secret_should_not_leak'), false);
  assert.equal(JSON.stringify(queryExecutor.calls).includes('authorization_header_should_not_leak'), false);
  assertNoForbiddenLeak(listResponse.body);
  assertNoForbiddenLeak(detailResponse.body);
});

test('DB repository adapter path can be wrapped by repository guard', async () => {
  const queryExecutor = createSyntheticDbQueryExecutor();
  const guardAuditEvents = [];
  const app = syntheticApp();
  const module = createEngineerMobileWorkbenchReadOnlyModule({
    assignedAppointmentQueryExecutor: queryExecutor,
    getContext: async () => engineerContext(),
    repositoryGuardAuditLogger: guardAuditEvents.push.bind(guardAuditEvents),
    useRepositoryGuard: true,
  });
  module.register({ app, includeInternalAliases: false });

  const routes = registeredRoutes(app);
  const listResponse = createResponseRecorder();
  const detailResponse = createResponseRecorder();

  await routes['/engineer-mobile/appointments']({ query: { status: 'confirmed' } }, listResponse);
  await routes['/engineer-mobile/appointments/:appointmentId']({
    params: {
      appointmentId: 'apt_1762_detail_guard_001',
    },
  }, detailResponse);

  assert.equal(module.configured, true);
  assert.equal(listResponse.statusCode, 200);
  assert.equal(detailResponse.statusCode, 200);
  assert.deepEqual(queryExecutor.calls.map((querySpec) => querySpec.name), [
    ASSIGNED_APPOINTMENT_LIST_QUERY_NAME,
    ASSIGNED_APPOINTMENT_DETAIL_QUERY_NAME,
  ]);
  assert.deepEqual(guardAuditEvents, [
    {
      event: 'engineerMobile.assignedAppointmentRepositoryGuard.read',
      method: 'findAssignedAppointments',
      outcome: 'allow',
      organizationId: 'org_engineer_mobile_1742',
      engineerUserId: 'eng_user_1742',
    },
    {
      event: 'engineerMobile.assignedAppointmentRepositoryGuard.read',
      method: 'findAssignedAppointmentDetail',
      outcome: 'allow',
      organizationId: 'org_engineer_mobile_1742',
      engineerUserId: 'eng_user_1742',
      appointmentId: 'apt_1762_detail_guard_001',
    },
  ]);
  assertNoForbiddenLeak(listResponse.body);
  assertNoForbiddenLeak(detailResponse.body);
  assertNoForbiddenLeak(guardAuditEvents);
});

test('DB repository adapter path can opt into query executor guard with repository guard', async () => {
  const queryExecutor = createSyntheticDbQueryExecutor();
  const queryExecutorGuardAuditEvents = [];
  const repositoryGuardAuditEvents = [];
  const app = syntheticApp();
  const module = createEngineerMobileWorkbenchReadOnlyModule({
    assignedAppointmentQueryExecutor: queryExecutor,
    getContext: async () => engineerContext(),
    queryExecutorGuardAuditLogger: queryExecutorGuardAuditEvents.push.bind(queryExecutorGuardAuditEvents),
    repositoryGuardAuditLogger: repositoryGuardAuditEvents.push.bind(repositoryGuardAuditEvents),
    useQueryExecutorGuard: true,
    useRepositoryGuard: true,
  });
  module.register({ app, includeInternalAliases: false });

  const routes = registeredRoutes(app);
  const listResponse = createResponseRecorder();
  const detailResponse = createResponseRecorder();

  await routes['/engineer-mobile/appointments']({
    query: {
      from: '2026-06-02T00:00:00.000Z',
      status: 'confirmed',
      to: '2026-06-02T23:59:59.999Z',
      token: 'token_should_not_leak',
      rawSql: 'raw sql should_not_leak',
    },
  }, listResponse);
  await routes['/engineer-mobile/appointments/:appointmentId']({
    params: {
      appointmentId: 'apt_1762_detail_guarded_executor_001',
      finalAppointmentId: 'finalAppointmentId_should_not_leak',
      token: 'token_should_not_leak',
    },
  }, detailResponse);

  assert.equal(module.configured, true);
  assert.equal(listResponse.statusCode, 200);
  assert.equal(listResponse.body.status, 'allow');
  assert.equal(detailResponse.statusCode, 200);
  assert.equal(detailResponse.body.status, 'allow');
  assert.deepEqual(queryExecutor.calls.map((querySpec) => querySpec.name), [
    ASSIGNED_APPOINTMENT_LIST_QUERY_NAME,
    ASSIGNED_APPOINTMENT_DETAIL_QUERY_NAME,
  ]);
  assert.deepEqual(queryExecutor.calls.map((querySpec) => querySpec.intent), [
    'engineerMobileAssignedAppointments.readOnlyList',
    'engineerMobileAssignedAppointments.readOnlyDetail',
  ]);
  assert.deepEqual(queryExecutor.calls[0].params, {
    engineerUserId: 'eng_user_1742',
    from: '2026-06-02T00:00:00.000Z',
    organizationId: 'org_engineer_mobile_1742',
    status: 'confirmed',
    to: '2026-06-02T23:59:59.999Z',
  });
  assert.deepEqual(queryExecutor.calls[1].params, {
    appointmentId: 'apt_1762_detail_guarded_executor_001',
    engineerUserId: 'eng_user_1742',
    organizationId: 'org_engineer_mobile_1742',
  });
  assert.equal(JSON.stringify(queryExecutor.calls).includes('token_should_not_leak'), false);
  assert.equal(JSON.stringify(queryExecutor.calls).includes('raw sql should_not_leak'), false);
  assert.deepEqual(queryExecutorGuardAuditEvents, [
    {
      event: 'engineerMobile.assignedAppointmentQueryExecutorGuard.read',
      intent: 'engineerMobileAssignedAppointments.readOnlyList',
      name: ASSIGNED_APPOINTMENT_LIST_QUERY_NAME,
      outcome: 'allow',
      rowCount: 1,
    },
    {
      event: 'engineerMobile.assignedAppointmentQueryExecutorGuard.read',
      intent: 'engineerMobileAssignedAppointments.readOnlyDetail',
      name: ASSIGNED_APPOINTMENT_DETAIL_QUERY_NAME,
      outcome: 'allow',
      rowCount: 1,
    },
  ]);
  assert.deepEqual(repositoryGuardAuditEvents, [
    {
      event: 'engineerMobile.assignedAppointmentRepositoryGuard.read',
      method: 'findAssignedAppointments',
      outcome: 'allow',
      organizationId: 'org_engineer_mobile_1742',
      engineerUserId: 'eng_user_1742',
    },
    {
      event: 'engineerMobile.assignedAppointmentRepositoryGuard.read',
      method: 'findAssignedAppointmentDetail',
      outcome: 'allow',
      organizationId: 'org_engineer_mobile_1742',
      engineerUserId: 'eng_user_1742',
      appointmentId: 'apt_1762_detail_guarded_executor_001',
    },
  ]);
  assertNoForbiddenLeak(queryExecutor.calls);
  assertNoForbiddenLeak(queryExecutorGuardAuditEvents);
  assertNoForbiddenLeak(repositoryGuardAuditEvents);
  assertNoForbiddenLeak(listResponse.body);
  assertNoForbiddenLeak(detailResponse.body);
});

test('missing queryExecutor safe rejects DB repository adapter path', () => {
  const app = syntheticApp();
  const module = createEngineerMobileWorkbenchReadOnlyModule({
    getContext: async () => engineerContext(),
    useAssignedAppointmentDbRepository: true,
  });

  const result = module.register({ app, includeInternalAliases: false });

  assert.equal(module.configured, false);
  assert.equal(result.registered, false);
  assert.equal(result.messageKey, 'engineerMobile.workbenchReadOnly.unavailable');
  assert.equal(result.engineerMobileVisible, false);
  assert.deepEqual(app.calls.get, []);
  assert.deepEqual(app.calls.listen, []);
});

test('query executor guard opt-in safely rejects missing delegate executor', () => {
  const app = syntheticApp();
  const module = createEngineerMobileWorkbenchReadOnlyModule({
    getContext: async () => engineerContext(),
    useQueryExecutorGuard: true,
  });

  const result = module.register({ app, includeInternalAliases: false });

  assert.equal(module.configured, false);
  assert.equal(result.registered, false);
  assert.equal(result.messageKey, 'engineerMobile.workbenchReadOnly.unavailable');
  assert.equal(result.engineerMobileVisible, false);
  assert.deepEqual(app.calls.get, []);
  assert.deepEqual(app.calls.listen, []);
});

test('DB repository adapter executor throw fails closed without raw error leak', async () => {
  const queryExecutor = createSyntheticDbQueryExecutor({ throwExecutor: true });
  const app = syntheticApp();
  const module = createEngineerMobileWorkbenchReadOnlyModule({
    assignedAppointmentQueryExecutor: queryExecutor,
    getContext: async () => engineerContext(),
  });
  module.register({ app, includeInternalAliases: false });

  const routes = registeredRoutes(app);
  const listResponse = createResponseRecorder();
  const detailResponse = createResponseRecorder();

  await routes['/engineer-mobile/appointments']({ query: {} }, listResponse);
  await routes['/engineer-mobile/appointments/:appointmentId']({
    params: {
      appointmentId: 'apt_1762_executor_throw_001',
    },
  }, detailResponse);

  assert.equal(listResponse.statusCode, 404);
  assert.equal(listResponse.body.status, 'deny');
  assert.equal(detailResponse.statusCode, 404);
  assert.equal(detailResponse.body.status, 'deny');
  assert.deepEqual(queryExecutor.calls.map((querySpec) => querySpec.name), [
    ASSIGNED_APPOINTMENT_LIST_QUERY_NAME,
    ASSIGNED_APPOINTMENT_DETAIL_QUERY_NAME,
  ]);
  assertNoForbiddenLeak(listResponse.body);
  assertNoForbiddenLeak(detailResponse.body);
});

test('guarded DB repository adapter delegate throw fails closed without raw error leak', async () => {
  const queryExecutor = createSyntheticDbQueryExecutor({ throwExecutor: true });
  const queryExecutorGuardAuditEvents = [];
  const app = syntheticApp();
  const module = createEngineerMobileWorkbenchReadOnlyModule({
    assignedAppointmentQueryExecutor: queryExecutor,
    getContext: async () => engineerContext(),
    queryExecutorGuardAuditLogger: queryExecutorGuardAuditEvents.push.bind(queryExecutorGuardAuditEvents),
    useQueryExecutorGuard: true,
  });
  module.register({ app, includeInternalAliases: false });

  const routes = registeredRoutes(app);
  const response = createResponseRecorder();

  await routes['/engineer-mobile/appointments/:appointmentId']({
    params: {
      appointmentId: 'apt_1762_guarded_delegate_throw_001',
    },
  }, response);

  assert.equal(response.statusCode, 404);
  assert.equal(response.body.status, 'deny');
  assert.deepEqual(queryExecutor.calls.map((querySpec) => querySpec.name), [
    ASSIGNED_APPOINTMENT_DETAIL_QUERY_NAME,
  ]);
  assert.deepEqual(queryExecutorGuardAuditEvents, [
    {
      event: 'engineerMobile.assignedAppointmentQueryExecutorGuard.read',
      intent: 'engineerMobileAssignedAppointments.readOnlyDetail',
      name: ASSIGNED_APPOINTMENT_DETAIL_QUERY_NAME,
      outcome: 'deny',
      reason: 'delegate_executor_unavailable',
    },
  ]);
  assertNoForbiddenLeak(response.body);
  assertNoForbiddenLeak(queryExecutorGuardAuditEvents);
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
