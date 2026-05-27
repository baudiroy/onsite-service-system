'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  DEFAULT_WORKBENCH_ASSIGNED_APPOINTMENTS_PATH,
  DEFAULT_WORKBENCH_ASSIGNED_APPOINTMENT_DETAIL_PATH,
  INTERNAL_WORKBENCH_ASSIGNED_APPOINTMENTS_ALIAS_PATH,
  INTERNAL_WORKBENCH_ASSIGNED_APPOINTMENT_DETAIL_ALIAS_PATH,
  createEngineerMobileWorkbenchReadOnlyHttpAdapter,
  mountEngineerMobileWorkbenchReadOnlyRoutes,
} = require('../../src/engineerMobile/engineerMobileWorkbenchReadOnlyHttpAdapter');

const ADAPTER_SOURCE = path.join(
  __dirname,
  '../../src/engineerMobile/engineerMobileWorkbenchReadOnlyHttpAdapter.js',
);

function engineerContext(overrides = {}) {
  return {
    organizationId: 'org_engineer_mobile_1739',
    engineerUserId: 'eng_user_1739',
    permissions: ['engineer_mobile.assigned_appointments.read'],
    ...overrides,
  };
}

function syntheticApp(options = {}) {
  const calls = {
    get: [],
    listen: [],
    post: [],
    put: [],
    patch: [],
    delete: [],
  };

  return {
    calls,
    get(routePath, handler) {
      calls.get.push({ path: routePath, handler });

      if (options.throwOnGet) {
        throw new Error('route raw sql token_should_not_leak');
      }

      return this;
    },
    listen() {
      calls.listen.push('listen');
      throw new Error('listen should not be called');
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
  };
}

function listAllowEnvelope() {
  return {
    status: 'allow',
    messageKey: 'engineerMobile.assignedAppointments.available',
    engineerMobileVisible: true,
    data: {
      appointments: [
        {
          appointmentId: 'apt_1739_001',
          caseReference: 'CASE-1739-001',
          appointmentWindow: '2026-05-30 09:00-11:00',
          scheduledStart: '2026-05-30T01:00:00.000Z',
          scheduledEnd: '2026-05-30T03:00:00.000Z',
          serviceType: 'onsite',
          customerDisplayName: 'Lin masked',
          locationLabel: 'Taipei Songshan',
          status: 'confirmed',
          priorityLabel: 'normal',
          canOpenDetails: true,
        },
      ],
    },
  };
}

function detailAllowEnvelope() {
  return {
    status: 'allow',
    messageKey: 'engineerMobile.assignedAppointmentDetail.available',
    engineerMobileVisible: true,
    data: {
      appointment: {
        appointmentId: 'apt_1739_001',
        canOpenDetails: true,
        caseReference: 'CASE-1739-001',
        appointmentWindow: '2026-05-30 09:00-11:00',
        scheduledStart: '2026-05-30T01:00:00.000Z',
        scheduledEnd: '2026-05-30T03:00:00.000Z',
        serviceType: 'onsite',
        customerDisplayName: 'Lin masked',
        locationLabel: 'Taipei Songshan',
        status: 'confirmed',
        priorityLabel: 'normal',
        serviceSummary: 'Inspection summary',
        publicCustomerNotes: 'Customer-visible note',
        checklistPreview: [{ label: 'Confirm model', status: 'pending' }],
      },
    },
  };
}

function makeHandlers(options = {}) {
  const calls = {
    list: [],
    detail: [],
  };

  return {
    calls,
    assignedAppointmentsHandler: async (request) => {
      calls.list.push(request);

      if (options.throwList) {
        throw new Error('list raw sql token_should_not_leak stack_trace_should_not_leak');
      }

      return listAllowEnvelope();
    },
    assignedAppointmentDetailHandler: async (request) => {
      calls.detail.push(request);

      if (options.throwDetail) {
        throw new Error('detail raw sql token_should_not_leak stack_trace_should_not_leak');
      }

      return detailAllowEnvelope();
    },
  };
}

function getContextRecorder(context) {
  const contextResult = arguments.length === 0 ? engineerContext() : context;
  const calls = [];
  const getContext = async (request) => {
    calls.push(request);
    return contextResult;
  };

  getContext.calls = calls;

  return getContext;
}

function safeNotRegisteredEnvelope() {
  return {
    registered: false,
    messageKey: 'engineerMobile.workbenchReadOnly.unavailable',
    engineerMobileVisible: false,
  };
}

function assertNoForbiddenLeak(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'raw_phone_should_not_leak',
    'raw_address_should_not_leak',
    'line_user_should_not_leak',
    'provider_payload_should_not_leak',
    'token_should_not_leak',
    'secret_should_not_leak',
    'internal_note_should_not_leak',
    'dispatcher_note_should_not_leak',
    'raw sql',
    'raw db',
    'stack_trace_should_not_leak',
    'billing_internal_should_not_leak',
    'settlement_internal_should_not_leak',
    'ai_raw_payload_should_not_leak',
    'final_appointment_should_not_leak',
    'field_service_report_should_not_leak',
    'provider_debug_should_not_leak',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `adapter output leaked ${forbidden}`);
  }
}

function mountDefaultAdapter(app, handlers, getContext = getContextRecorder()) {
  return mountEngineerMobileWorkbenchReadOnlyRoutes({
    app,
    assignedAppointmentsHandler: handlers.assignedAppointmentsHandler,
    assignedAppointmentDetailHandler: handlers.assignedAppointmentDetailHandler,
    getContext,
  });
}

test('adapter can be created with injected synthetic app and registers canonical plus internal alias routes', () => {
  const app = syntheticApp();
  const handlers = makeHandlers();
  const adapter = createEngineerMobileWorkbenchReadOnlyHttpAdapter({
    app,
    assignedAppointmentsHandler: handlers.assignedAppointmentsHandler,
    assignedAppointmentDetailHandler: handlers.assignedAppointmentDetailHandler,
    getContext: getContextRecorder(),
  });

  const result = adapter.register();

  assert.equal(result.registered, true);
  assert.equal(result.method, 'GET');
  assert.deepEqual(result.paths, {
    assignedAppointments: DEFAULT_WORKBENCH_ASSIGNED_APPOINTMENTS_PATH,
    assignedAppointmentDetail: DEFAULT_WORKBENCH_ASSIGNED_APPOINTMENT_DETAIL_PATH,
    internalAssignedAppointmentsAlias: INTERNAL_WORKBENCH_ASSIGNED_APPOINTMENTS_ALIAS_PATH,
    internalAssignedAppointmentDetailAlias: INTERNAL_WORKBENCH_ASSIGNED_APPOINTMENT_DETAIL_ALIAS_PATH,
  });
  assert.deepEqual(app.calls.get.map((call) => call.path), [
    '/engineer-mobile/appointments',
    '/engineer-mobile/appointments/:appointmentId',
    '/__internal/engineer-mobile/workbench/assigned-appointments',
    '/__internal/engineer-mobile/workbench/assigned-appointments/:appointmentId',
  ]);
  assert.equal(app.calls.listen.length, 0);
  assert.deepEqual(app.calls.post, []);
  assert.deepEqual(app.calls.put, []);
  assert.deepEqual(app.calls.patch, []);
  assert.deepEqual(app.calls.delete, []);
});

test('canonical list route delegates to assigned appointments handler with injected context and safe filters', async () => {
  const app = syntheticApp();
  const handlers = makeHandlers();
  const getContext = getContextRecorder();
  const request = {
    query: {
      from: '2026-05-30T00:00:00.000Z',
      to: '2026-05-30T23:59:59.999Z',
      status: 'confirmed',
      finalAppointmentId: 'final_appointment_should_not_leak',
      token: 'token_should_not_leak',
    },
    body: {
      rawPhone: 'raw_phone_should_not_leak',
    },
  };

  mountDefaultAdapter(app, handlers, getContext);

  const response = await app.calls.get[0].handler(request);

  assert.equal(app.calls.get[0].path, '/engineer-mobile/appointments');
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, listAllowEnvelope());
  assert.equal(getContext.calls[0], request);
  assert.deepEqual(handlers.calls.list, [
    {
      context: engineerContext(),
      filters: request.query,
    },
  ]);
  assert.deepEqual(handlers.calls.detail, []);
  assertNoForbiddenLeak(response);
});

test('canonical detail route delegates to assigned appointment detail handler with safe appointment id', async () => {
  const app = syntheticApp();
  const handlers = makeHandlers();
  const getContext = getContextRecorder();
  const request = {
    params: {
      appointmentId: 'apt_1739_001',
    },
    query: {
      finalAppointmentId: 'final_appointment_should_not_leak',
      token: 'token_should_not_leak',
    },
    body: {
      rawAddress: 'raw_address_should_not_leak',
    },
  };

  mountDefaultAdapter(app, handlers, getContext);

  const response = await app.calls.get[1].handler(request);

  assert.equal(app.calls.get[1].path, '/engineer-mobile/appointments/:appointmentId');
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, detailAllowEnvelope());
  assert.equal(getContext.calls[0], request);
  assert.deepEqual(handlers.calls.list, []);
  assert.deepEqual(handlers.calls.detail, [
    {
      context: engineerContext(),
      input: {
        appointmentId: 'apt_1739_001',
        params: {
          appointmentId: 'apt_1739_001',
        },
      },
    },
  ]);
  assertNoForbiddenLeak(response);
});

test('internal alias routes remain safe and delegate to the same handlers', async () => {
  const app = syntheticApp();
  const handlers = makeHandlers();

  mountDefaultAdapter(app, handlers);

  const listResponse = await app.calls.get[2].handler({ query: { status: 'confirmed' } });
  const detailResponse = await app.calls.get[3].handler({ params: { appointmentId: 'apt_1739_001' } });

  assert.equal(app.calls.get[2].path, INTERNAL_WORKBENCH_ASSIGNED_APPOINTMENTS_ALIAS_PATH);
  assert.equal(app.calls.get[3].path, INTERNAL_WORKBENCH_ASSIGNED_APPOINTMENT_DETAIL_ALIAS_PATH);
  assert.equal(listResponse.statusCode, 200);
  assert.equal(detailResponse.statusCode, 200);
  assert.equal(handlers.calls.list.length, 1);
  assert.equal(handlers.calls.detail.length, 1);
  assertNoForbiddenLeak(listResponse);
  assertNoForbiddenLeak(detailResponse);
});

test('missing context fails closed without delegating to handlers', async () => {
  const app = syntheticApp();
  const handlers = makeHandlers();

  mountDefaultAdapter(app, handlers, getContextRecorder(undefined));

  assert.deepEqual(await app.calls.get[0].handler({ query: {} }), {
    statusCode: 404,
    body: {
      status: 'deny',
      messageKey: 'engineerMobile.assignedAppointments.unavailable',
      engineerMobileVisible: false,
      data: {
        appointments: [],
      },
      error: {
        messageKey: 'engineerMobile.assignedAppointments.unavailable',
      },
    },
  });
  assert.deepEqual(await app.calls.get[1].handler({ params: { appointmentId: 'apt_1739_001' } }), {
    statusCode: 404,
    body: {
      status: 'deny',
      messageKey: 'engineerMobile.assignedAppointmentDetail.unavailable',
      engineerMobileVisible: false,
      data: {
        appointment: null,
      },
      error: {
        messageKey: 'engineerMobile.assignedAppointmentDetail.unavailable',
      },
    },
  });
  assert.deepEqual(handlers.calls.list, []);
  assert.deepEqual(handlers.calls.detail, []);
});

test('missing list handler fails closed without route registration', () => {
  const app = syntheticApp();
  const handlers = makeHandlers();

  const result = mountEngineerMobileWorkbenchReadOnlyRoutes({
    app,
    assignedAppointmentDetailHandler: handlers.assignedAppointmentDetailHandler,
    getContext: getContextRecorder(),
  });

  assert.deepEqual(result, safeNotRegisteredEnvelope());
  assert.equal(app.calls.get.length, 0);
  assert.equal(app.calls.listen.length, 0);
});

test('missing detail handler fails closed without route registration', () => {
  const app = syntheticApp();
  const handlers = makeHandlers();

  const result = mountEngineerMobileWorkbenchReadOnlyRoutes({
    app,
    assignedAppointmentsHandler: handlers.assignedAppointmentsHandler,
    getContext: getContextRecorder(),
  });

  assert.deepEqual(result, safeNotRegisteredEnvelope());
  assert.equal(app.calls.get.length, 0);
  assert.equal(app.calls.listen.length, 0);
});

test('handler throw fails closed without leaking raw errors', async () => {
  const app = syntheticApp();
  const handlers = makeHandlers({ throwList: true, throwDetail: true });

  mountDefaultAdapter(app, handlers);

  const listResponse = await app.calls.get[0].handler({ query: {} });
  const detailResponse = await app.calls.get[1].handler({ params: { appointmentId: 'apt_1739_001' } });

  assert.equal(listResponse.statusCode, 404);
  assert.equal(listResponse.body.messageKey, 'engineerMobile.assignedAppointments.unavailable');
  assert.equal(detailResponse.statusCode, 404);
  assert.equal(detailResponse.body.messageKey, 'engineerMobile.assignedAppointmentDetail.unavailable');
  assertNoForbiddenLeak(listResponse);
  assertNoForbiddenLeak(detailResponse);
});

test('invalid detail route input fails closed without delegating', async () => {
  const app = syntheticApp();
  const handlers = makeHandlers();

  mountDefaultAdapter(app, handlers);

  for (const params of [
    {},
    { appointmentId: '' },
    { appointmentId: '../apt_1739_001' },
    { appointmentId: 'apt_1739_001?token=secret' },
  ]) {
    const response = await app.calls.get[1].handler({ params });

    assert.equal(response.statusCode, 404);
    assert.equal(response.body.messageKey, 'engineerMobile.assignedAppointmentDetail.unavailable');
    assertNoForbiddenLeak(response);
  }

  assert.deepEqual(handlers.calls.detail, []);
});

test('router option registers canonical routes without depending on global app', () => {
  const router = syntheticApp();
  const handlers = makeHandlers();
  const result = mountEngineerMobileWorkbenchReadOnlyRoutes({
    router,
    handlers: {
      assignedAppointmentsHandler: handlers.assignedAppointmentsHandler,
      assignedAppointmentDetailHandler: handlers.assignedAppointmentDetailHandler,
    },
    getContext: getContextRecorder(),
  });

  assert.equal(result.registered, true);
  assert.equal(result.paths.assignedAppointments, '/engineer-mobile/appointments');
  assert.equal(result.paths.assignedAppointmentDetail, '/engineer-mobile/appointments/:appointmentId');
  assert.deepEqual(router.calls.get.map((call) => call.path).slice(0, 2), [
    '/engineer-mobile/appointments',
    '/engineer-mobile/appointments/:appointmentId',
  ]);
  assert.equal(router.calls.listen.length, 0);
});

test('registration failure fails closed without raw route error leak', () => {
  const app = syntheticApp({ throwOnGet: true });
  const handlers = makeHandlers();
  const result = mountEngineerMobileWorkbenchReadOnlyRoutes({
    app,
    assignedAppointmentsHandler: handlers.assignedAppointmentsHandler,
    assignedAppointmentDetailHandler: handlers.assignedAppointmentDetailHandler,
    getContext: getContextRecorder(),
  });

  assert.deepEqual(result, safeNotRegisteredEnvelope());
  assert.equal(app.calls.get.length, 1);
  assert.equal(app.calls.listen.length, 0);
  assertNoForbiddenLeak(result);
});

test('internal aliases can be disabled while canonical routes remain registered', () => {
  const app = syntheticApp();
  const handlers = makeHandlers();
  const result = mountEngineerMobileWorkbenchReadOnlyRoutes({
    app,
    assignedAppointmentsHandler: handlers.assignedAppointmentsHandler,
    assignedAppointmentDetailHandler: handlers.assignedAppointmentDetailHandler,
    getContext: getContextRecorder(),
    includeInternalAliases: false,
  });

  assert.equal(result.registered, true);
  assert.deepEqual(result.paths, {
    assignedAppointments: '/engineer-mobile/appointments',
    assignedAppointmentDetail: '/engineer-mobile/appointments/:appointmentId',
  });
  assert.deepEqual(app.calls.get.map((call) => call.path), [
    '/engineer-mobile/appointments',
    '/engineer-mobile/appointments/:appointmentId',
  ]);
});

test('source has no DB provider app server route bootstrap or mutation dependency', () => {
  const source = fs.readFileSync(ADAPTER_SOURCE, 'utf8');

  assert.equal(source.includes("require('../app"), false);
  assert.equal(source.includes("require('../../app"), false);
  assert.equal(source.includes("require('../server"), false);
  assert.equal(source.includes("require('../../server"), false);
  assert.equal(source.includes('dbClient'), false);
  assert.equal(source.includes('.query('), false);
  assert.equal(source.includes('.listen('), false);
  assert.equal(source.includes('.post('), false);
  assert.equal(source.includes('.put('), false);
  assert.equal(source.includes('.patch('), false);
  assert.equal(source.includes('.delete('), false);
  assert.equal(source.includes('finalAppointmentId'), false);
  assert.equal(source.includes('providerRawPayload'), false);
});

test('module exports no global route helper names', () => {
  const moduleExports = require('../../src/engineerMobile/engineerMobileWorkbenchReadOnlyHttpAdapter');

  assert.deepEqual(Object.keys(moduleExports).sort(), [
    'DEFAULT_WORKBENCH_ASSIGNED_APPOINTMENTS_PATH',
    'DEFAULT_WORKBENCH_ASSIGNED_APPOINTMENT_DETAIL_PATH',
    'INTERNAL_WORKBENCH_ASSIGNED_APPOINTMENTS_ALIAS_PATH',
    'INTERNAL_WORKBENCH_ASSIGNED_APPOINTMENT_DETAIL_ALIAS_PATH',
    'createEngineerMobileWorkbenchReadOnlyHttpAdapter',
    'mountEngineerMobileWorkbenchReadOnlyRoutes',
  ]);
});
