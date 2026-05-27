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

const TEST_SOURCE = path.join(__filename);

function createSyntheticApp() {
  const calls = {
    delete: [],
    get: [],
    listen: [],
    patch: [],
    post: [],
    put: [],
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
    body: undefined,
    statusCode: undefined,
    json(body) {
      response.body = body;
      return response;
    },
    status(statusCode) {
      response.statusCode = statusCode;
      return response;
    },
  };

  return response;
}

function registeredRoutes(app) {
  return Object.fromEntries(app.calls.get.map((call) => [call.path, call.handler]));
}

function syntheticWorkbenchRequest(overrides = {}) {
  return {
    auth: {
      password: 'password_should_not_leak',
      secret: 'secret_should_not_leak',
      token: 'token_should_not_leak',
    },
    body: {
      finalAppointmentId: 'finalAppointmentId_should_not_leak',
      organizationId: 'body_org_should_not_be_trusted',
      rawSql: 'raw sql should_not_leak',
    },
    context: {
      assignedAppointmentsReadAllowed: true,
      engineerUserId: 'eng_user_1764',
      organizationId: 'org_engineer_mobile_1764',
      requestId: 'req_1764',
    },
    headers: {
      authorization: 'authorization_header_should_not_leak',
      cookie: 'cookie_should_not_leak',
      'x-request-id': 'header_req_1764',
    },
    query: {},
    session: {
      raw: 'raw_session_should_not_leak',
    },
    user: {
      raw: 'raw_user_should_not_leak',
    },
    ...overrides,
  };
}

function createSyntheticQueryExecutor(options = {}) {
  const calls = [];
  const mutationCalls = [];
  const executor = {
    calls,
    mutationCalls,
    async execute(querySpec) {
      calls.push(querySpec);

      if (options.throwExecutor) {
        throw new Error('executor raw sql stack_trace_should_not_leak token_should_not_leak');
      }

      if (querySpec.name === ASSIGNED_APPOINTMENT_LIST_QUERY_NAME) {
        return {
          rows: [
            {
              appointment_id: 'apt_1764_list_001',
              appointment_status: 'confirmed',
              appointment_window: '2026-06-04 09:00-11:00',
              assigned_engineer_id: querySpec.params.engineerUserId,
              authorization: 'authorization_header_should_not_leak',
              case_reference: 'CASE-1764-LIST',
              cookie: 'cookie_should_not_leak',
              customer_display_name: 'Workbench DB adapter customer',
              finalAppointmentId: 'finalAppointmentId_should_not_leak',
              internal_notes: 'internal_note_should_not_leak',
              location_label: 'Taipei safe district label',
              organization_id: querySpec.params.organizationId,
              password: 'password_should_not_leak',
              priority_label: 'normal',
              providerDebug: 'provider_debug_should_not_leak',
              raw_address: 'raw address should_not_leak',
              raw_phone: 'raw phone should_not_leak',
              rawDbRow: 'raw DB rows should_not_leak',
              rawSql: 'raw sql should_not_leak',
              scheduled_end: '2026-06-04T03:00:00.000Z',
              scheduled_start: '2026-06-04T01:00:00.000Z',
              secret: 'secret_should_not_leak',
              service_summary: 'Safe list summary',
              service_type: 'onsite',
              stack: 'stack_trace_should_not_leak',
              token: 'token_should_not_leak',
            },
          ],
        };
      }

      if (querySpec.name === ASSIGNED_APPOINTMENT_DETAIL_QUERY_NAME) {
        return {
          rows: [
            {
              appointment_id: querySpec.params.appointmentId,
              appointment_status: 'confirmed',
              appointment_window: '2026-06-04 13:00-15:00',
              assigned_engineer_id: querySpec.params.engineerUserId,
              authorization: 'authorization_header_should_not_leak',
              case_reference: 'CASE-1764-DETAIL',
              checklist_preview: [{ label: 'Confirm model', status: 'pending' }],
              cookie: 'cookie_should_not_leak',
              customer_display_name: 'Workbench DB adapter detail customer',
              finalAppointmentId: 'finalAppointmentId_should_not_leak',
              internal_notes: 'internal_note_should_not_leak',
              location_label: 'Taipei safe detail label',
              organization_id: querySpec.params.organizationId,
              password: 'password_should_not_leak',
              priority_label: 'high',
              providerPayload: 'provider_debug_should_not_leak',
              public_customer_notes: 'Customer-visible note',
              raw_address: 'raw address should_not_leak',
              raw_phone: 'raw phone should_not_leak',
              rawDbRow: 'raw DB rows should_not_leak',
              rawSql: 'raw sql should_not_leak',
              scheduled_end: '2026-06-04T07:00:00.000Z',
              scheduled_start: '2026-06-04T05:00:00.000Z',
              secret: 'secret_should_not_leak',
              service_summary: 'Safe detail summary',
              service_type: 'onsite',
              stack: 'stack_trace_should_not_leak',
              token: 'token_should_not_leak',
            },
          ],
        };
      }

      return { rows: [] };
    },
    async create() {
      mutationCalls.push('create');
      throw new Error('create should not be called');
    },
    async update() {
      mutationCalls.push('update');
      throw new Error('update should not be called');
    },
    async delete() {
      mutationCalls.push('delete');
      throw new Error('delete should not be called');
    },
    async completeAppointment() {
      mutationCalls.push('completeAppointment');
      throw new Error('completeAppointment should not be called');
    },
    async submitFieldServiceReport() {
      mutationCalls.push('submitFieldServiceReport');
      throw new Error('submitFieldServiceReport should not be called');
    },
  };

  return executor;
}

function assertNoForbiddenLeak(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'authorization_header_should_not_leak',
    'body_org_should_not_be_trusted',
    'cookie_should_not_leak',
    'executor raw sql',
    'finalAppointmentId_should_not_leak',
    'internal_note_should_not_leak',
    'password_should_not_leak',
    'provider_debug_should_not_leak',
    'raw address should_not_leak',
    'raw DB rows',
    'raw phone should_not_leak',
    'raw sql',
    'raw_session_should_not_leak',
    'raw_user_should_not_leak',
    'secret_should_not_leak',
    'stack_trace_should_not_leak',
    'token_should_not_leak',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked forbidden value: ${forbidden}`);
  }
}

function assertSafeQuerySpec(querySpec) {
  assert.equal(querySpec.ok, true);
  assert.equal(querySpec.executable, false);
  assert.equal(Object.isFrozen(querySpec), true);
  assert.equal(Object.isFrozen(querySpec.params), true);
  assert.equal(Object.isFrozen(querySpec.values), true);
  assert.deepEqual(querySpec.fields, [
    'appointment_id',
    'case_reference',
    'appointment_window',
    'scheduled_start',
    'scheduled_end',
    'service_type',
    'customer_display_name',
    'location_label',
    'appointment_status',
    'priority_label',
    'service_summary',
    'public_customer_notes',
    'checklist_preview',
  ]);
  assert.equal(querySpec.fields.includes('final_appointment_id'), false);
  assert.equal(querySpec.fields.includes('raw_phone'), false);
  assert.equal(querySpec.fields.includes('raw_address'), false);
  assertNoForbiddenLeak(querySpec);
}

test('synthetic HTTP acceptance covers canonical list and detail DB adapter path', async () => {
  const app = createSyntheticApp();
  const queryExecutor = createSyntheticQueryExecutor();
  const guardAuditEvents = [];
  const module = createEngineerMobileWorkbenchReadOnlyModule({
    assignedAppointmentQueryExecutor: queryExecutor,
    requestContextResolver: true,
    repositoryGuardAuditLogger: guardAuditEvents.push.bind(guardAuditEvents),
    useRepositoryGuard: true,
  });
  const registration = module.register({ app, includeInternalAliases: false });

  assert.equal(module.configured, true);
  assert.equal(registration.registered, true);
  assert.deepEqual(app.calls.get.map((call) => call.path), [
    '/engineer-mobile/appointments',
    '/engineer-mobile/appointments/:appointmentId',
  ]);
  assert.deepEqual(app.calls.post, []);
  assert.deepEqual(app.calls.put, []);
  assert.deepEqual(app.calls.patch, []);
  assert.deepEqual(app.calls.delete, []);
  assert.deepEqual(app.calls.listen, []);

  const routes = registeredRoutes(app);
  const listResponse = createResponseRecorder();
  const detailResponse = createResponseRecorder();

  await routes['/engineer-mobile/appointments'](syntheticWorkbenchRequest({
    query: {
      from: '2026-06-04T00:00:00.000Z',
      status: 'confirmed',
      to: '2026-06-04T23:59:59.999Z',
      token: 'token_should_not_leak',
    },
  }), listResponse);
  await routes['/engineer-mobile/appointments/:appointmentId'](syntheticWorkbenchRequest({
    params: {
      appointmentId: 'apt_1764_detail_001',
      finalAppointmentId: 'finalAppointmentId_should_not_leak',
    },
  }), detailResponse);

  assert.equal(listResponse.statusCode, 200);
  assert.equal(listResponse.body.status, 'allow');
  assert.deepEqual(listResponse.body.data.appointments, [
    {
      appointmentId: 'apt_1764_list_001',
      appointmentWindow: '2026-06-04 09:00-11:00',
      canOpenDetails: true,
      caseReference: 'CASE-1764-LIST',
      customerDisplayName: 'Workbench DB adapter customer',
      locationLabel: 'Taipei safe district label',
      priorityLabel: 'normal',
      scheduledEnd: '2026-06-04T03:00:00.000Z',
      scheduledStart: '2026-06-04T01:00:00.000Z',
      serviceType: 'onsite',
      status: 'confirmed',
    },
  ]);
  assert.equal(detailResponse.statusCode, 200);
  assert.equal(detailResponse.body.status, 'allow');
  assert.equal(detailResponse.body.data.appointment.appointmentId, 'apt_1764_detail_001');
  assert.equal(detailResponse.body.data.appointment.caseReference, 'CASE-1764-DETAIL');
  assert.equal(detailResponse.body.data.appointment.serviceSummary, 'Safe detail summary');
  assert.equal(detailResponse.body.data.appointment.publicCustomerNotes, 'Customer-visible note');

  assert.deepEqual(queryExecutor.calls.map((querySpec) => querySpec.name), [
    ASSIGNED_APPOINTMENT_LIST_QUERY_NAME,
    ASSIGNED_APPOINTMENT_DETAIL_QUERY_NAME,
  ]);
  assert.deepEqual(queryExecutor.calls[0].params, {
    engineerUserId: 'eng_user_1764',
    from: '2026-06-04T00:00:00.000Z',
    organizationId: 'org_engineer_mobile_1764',
    status: 'confirmed',
    to: '2026-06-04T23:59:59.999Z',
  });
  assert.deepEqual(queryExecutor.calls[0].values, [
    'org_engineer_mobile_1764',
    'eng_user_1764',
    '2026-06-04T00:00:00.000Z',
    '2026-06-04T23:59:59.999Z',
    'confirmed',
  ]);
  assert.deepEqual(queryExecutor.calls[1].params, {
    appointmentId: 'apt_1764_detail_001',
    engineerUserId: 'eng_user_1764',
    organizationId: 'org_engineer_mobile_1764',
  });
  assert.deepEqual(queryExecutor.calls[1].values, [
    'org_engineer_mobile_1764',
    'eng_user_1764',
    'apt_1764_detail_001',
  ]);
  queryExecutor.calls.forEach(assertSafeQuerySpec);
  assert.deepEqual(queryExecutor.mutationCalls, []);
  assert.deepEqual(guardAuditEvents, [
    {
      engineerUserId: 'eng_user_1764',
      event: 'engineerMobile.assignedAppointmentRepositoryGuard.read',
      method: 'findAssignedAppointments',
      organizationId: 'org_engineer_mobile_1764',
      outcome: 'allow',
    },
    {
      appointmentId: 'apt_1764_detail_001',
      engineerUserId: 'eng_user_1764',
      event: 'engineerMobile.assignedAppointmentRepositoryGuard.read',
      method: 'findAssignedAppointmentDetail',
      organizationId: 'org_engineer_mobile_1764',
      outcome: 'allow',
    },
  ]);
  assertNoForbiddenLeak(queryExecutor.calls);
  assertNoForbiddenLeak(guardAuditEvents);
  assertNoForbiddenLeak(listResponse.body);
  assertNoForbiddenLeak(detailResponse.body);
});

test('executor throw fails closed without raw error leak', async () => {
  const app = createSyntheticApp();
  const queryExecutor = createSyntheticQueryExecutor({ throwExecutor: true });
  const module = createEngineerMobileWorkbenchReadOnlyModule({
    assignedAppointmentQueryExecutor: queryExecutor,
    requestContextResolver: true,
    useRepositoryGuard: true,
  });
  module.register({ app, includeInternalAliases: false });

  const routes = registeredRoutes(app);
  const listResponse = createResponseRecorder();
  const detailResponse = createResponseRecorder();

  await routes['/engineer-mobile/appointments'](syntheticWorkbenchRequest(), listResponse);
  await routes['/engineer-mobile/appointments/:appointmentId'](syntheticWorkbenchRequest({
    params: {
      appointmentId: 'apt_1764_executor_throw_001',
    },
  }), detailResponse);

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

test('missing or denied request context fails closed before executor access', async () => {
  const app = createSyntheticApp();
  const queryExecutor = createSyntheticQueryExecutor();
  const module = createEngineerMobileWorkbenchReadOnlyModule({
    assignedAppointmentQueryExecutor: queryExecutor,
    requestContextResolver: true,
    useRepositoryGuard: true,
  });
  module.register({ app, includeInternalAliases: false });

  const routes = registeredRoutes(app);
  const response = createResponseRecorder();

  await routes['/engineer-mobile/appointments'](syntheticWorkbenchRequest({
    context: {
      engineerUserId: 'eng_user_1764',
      organizationId: 'org_engineer_mobile_1764',
      requestId: 'req_1764_denied',
    },
  }), response);

  assert.equal(response.statusCode, 404);
  assert.equal(response.body.status, 'deny');
  assert.deepEqual(queryExecutor.calls, []);
  assert.deepEqual(queryExecutor.mutationCalls, []);
  assertNoForbiddenLeak(response.body);
});

test('Task1764 acceptance test does not depend on app server routes or source runtime changes', () => {
  const source = fs.readFileSync(TEST_SOURCE, 'utf8');

  assert.doesNotMatch(source, /require\(['"]\.\.\/\.\.\/src\/app['"]\)/);
  assert.doesNotMatch(source, /require\(['"]\.\.\/\.\.\/src\/server['"]\)/);
  assert.doesNotMatch(source, /require\(['"]\.\.\/\.\.\/src\/routes\//);
  assert.doesNotMatch(source, /\bcreateServer\s*\(/);
  assert.doesNotMatch(source, /\bserver\.listen\s*\(/);
  assert.doesNotMatch(source, /process\.env\.(?:DATABASE|POSTGRES)_URL/);
  assert.doesNotMatch(source, /process\.env\[['"](?:DATABASE|POSTGRES)_URL['"]\]/);
  assert.doesNotMatch(source, /\bchild_process\b/);
  assert.doesNotMatch(source, /\bexec(?:File|Sync)?\s*\(/);
});
