'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  createRepairIntakeDraftToCaseApiModule,
} = require('../../src/repairIntake/repairIntakeDraftToCaseApiModule');

const SOURCE_PATH = path.join(__dirname, '../../src/repairIntake/repairIntakeDraftToCaseApiModule.js');

function applicationService() {
  return {
    planDraftToCase: async () => ({
      ok: true,
      action: 'repair_intake_draft_to_case_plan',
      draftId: 'draft_task967',
      organizationId: 'org_task967',
      reasonCode: 'candidate_ready',
      requiredActions: [],
    }),
    submitDraftToCase: async () => ({
      ok: true,
      action: 'repair_intake_draft_to_case_submit',
      draftId: 'draft_task967',
      organizationId: 'org_task967',
      reasonCode: 'CASE_SUBMITTED',
      requiredActions: [],
      finalAppointmentId: 'unsafe_final',
      phone: '+886900000000',
    }),
  };
}

function providedController() {
  return {
    planDraftToCase: async () => ({ ok: true, statusCode: 200, body: { ok: true } }),
    submitDraftToCase: async () => ({ ok: true, statusCode: 200, body: { ok: true } }),
  };
}

function providedRoutes(overrides = {}) {
  const planHandler = overrides.planHandler || (async () => ({ ok: true }));
  const submitHandler = overrides.submitHandler || (async () => ({ ok: true }));

  return [
    {
      method: 'POST',
      path: '/repair-intake/drafts/:draftId/case/plan',
      handler: planHandler,
    },
    {
      method: 'POST',
      path: '/repair-intake/drafts/:draftId/case/submit',
      handler: submitHandler,
    },
  ];
}

function syntheticRouter(overrides = {}) {
  const registrations = [];

  return {
    registrations,
    post(pathValue, handler) {
      if (overrides.throwOnPost) {
        throw new Error('raw SQL select * stack trace token secret finalAppointmentId');
      }

      registrations.push({
        method: 'POST',
        path: pathValue,
        handler,
      });
    },
  };
}

function assertNoForbiddenFields(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'finalAppointmentId',
    'final_appointment_id',
    'phone',
    'address',
    'customerPayload',
    'rawPayload',
    'select *',
    'stack trace',
    'providerPayload',
    'token',
    'secret',
    'lineAccessToken',
    'LINE access token',
    'authorization',
    'rows',
    'sql',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('creates controller from injected applicationService when controller is not provided', () => {
  const result = createRepairIntakeDraftToCaseApiModule({
    applicationService: applicationService(),
  });

  assert.equal(result.ok, true);
  assert.equal(typeof result.controller.planDraftToCase, 'function');
  assert.equal(typeof result.controller.submitDraftToCase, 'function');
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_API_MODULE_READY');
  assertNoForbiddenFields(result);
});

test('uses provided controller when supplied', () => {
  const controller = providedController();
  const result = createRepairIntakeDraftToCaseApiModule({ controller });

  assert.equal(result.ok, true);
  assert.equal(typeof result.controller, 'object');
  assert.equal(typeof result.controller.planDraftToCase, 'function');
  assert.equal(typeof result.controller.submitDraftToCase, 'function');
  assert.notEqual(result.controller, controller);
  assert.equal(result.routes[0].handler instanceof Function, true);
});

test('creates Task960-style routes when routes are not provided', () => {
  const result = createRepairIntakeDraftToCaseApiModule({
    controller: providedController(),
  });

  assert.deepEqual(result.routes.map(({ method, path: routePath }) => ({ method, path: routePath })), [
    {
      method: 'POST',
      path: '/repair-intake/drafts/:draftId/case/plan',
    },
    {
      method: 'POST',
      path: '/repair-intake/drafts/:draftId/case/submit',
    },
  ]);
});

test('uses provided routes when supplied', () => {
  const routes = providedRoutes();

  const result = createRepairIntakeDraftToCaseApiModule({
    controller: providedController(),
    routes,
  });

  assert.equal(result.ok, true);
  assert.equal(result.routes, routes);
});

test('returns routes without registration when no router is provided', () => {
  const result = createRepairIntakeDraftToCaseApiModule({
    controller: providedController(),
    routes: providedRoutes(),
  });

  assert.equal(result.ok, true);
  assert.equal(result.registration, null);
  assert.equal(result.routes.length, 2);
});

test('registers routes onto synthetic injected router when router is provided', () => {
  const router = syntheticRouter();
  const routes = providedRoutes();

  const result = createRepairIntakeDraftToCaseApiModule({
    controller: providedController(),
    routes,
    router,
  });

  assert.equal(result.ok, true);
  assert.equal(result.registration.ok, true);
  assert.equal(result.registration.registered, 2);
  assert.deepEqual(router.registrations.map(({ method, path: routePath }) => ({ method, path: routePath })), [
    {
      method: 'POST',
      path: '/repair-intake/drafts/:draftId/case/plan',
    },
    {
      method: 'POST',
      path: '/repair-intake/drafts/:draftId/case/submit',
    },
  ]);
});

test('safe basePath is passed to registrar', () => {
  const router = syntheticRouter();

  const result = createRepairIntakeDraftToCaseApiModule({
    controller: providedController(),
    routes: providedRoutes(),
    router,
    basePath: '/internal/v1',
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.registration.routes.map((route) => route.path), [
    '/internal/v1/repair-intake/drafts/:draftId/case/plan',
    '/internal/v1/repair-intake/drafts/:draftId/case/submit',
  ]);
});

test('basePath without router fails safely', () => {
  const result = createRepairIntakeDraftToCaseApiModule({
    controller: providedController(),
    routes: providedRoutes(),
    basePath: '/internal/v1',
  });

  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_API_MODULE_BASE_PATH_REQUIRES_ROUTER');
  assertNoForbiddenFields(result);
});

test('invalid or missing application service fails safely when controller is absent', () => {
  const result = createRepairIntakeDraftToCaseApiModule({
    applicationService: null,
  });

  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_API_MODULE_APPLICATION_SERVICE_REQUIRED');
  assert.deepEqual(result.requiredActions, ['configure_application_service_or_controller']);
  assertNoForbiddenFields(result);
});

test('invalid route definitions fail safely', () => {
  const result = createRepairIntakeDraftToCaseApiModule({
    controller: providedController(),
    routes: [{
      method: 'TRACE',
      path: '/repair-intake/drafts/:draftId/case/submit',
      handler: async () => ({ ok: true }),
    }],
  });

  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_API_MODULE_ROUTES_INVALID');
  assertNoForbiddenFields(result);
});

test('router registration failure returns safe failure without raw error leakage', () => {
  const result = createRepairIntakeDraftToCaseApiModule({
    controller: providedController(),
    routes: providedRoutes(),
    router: syntheticRouter({ throwOnPost: true }),
  });

  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_API_MODULE_REGISTRATION_FAILED');
  assert.equal(result.registration.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_REGISTRAR_FAILED');
  assertNoForbiddenFields(result);
});

test('module creation does not execute route handlers', () => {
  let handlerCalls = 0;

  const result = createRepairIntakeDraftToCaseApiModule({
    controller: providedController(),
    routes: providedRoutes({
      planHandler: () => {
        handlerCalls += 1;
        return { ok: true };
      },
      submitHandler: () => {
        handlerCalls += 1;
        return { ok: true };
      },
    }),
  });

  assert.equal(result.ok, true);
  assert.equal(handlerCalls, 0);
});

test('module creation does not call DB query insert update findOne selectOne or transaction', () => {
  const forbiddenCalls = [];
  const dbLike = {};

  for (const method of ['query', 'insert', 'update', 'findOne', 'selectOne', 'transaction']) {
    dbLike[method] = () => {
      forbiddenCalls.push(method);
      throw new Error(`${method} should not be called`);
    };
  }

  const result = createRepairIntakeDraftToCaseApiModule({
    applicationService: applicationService(),
    dbClient: dbLike,
  });

  assert.equal(result.ok, true);
  assert.deepEqual(forbiddenCalls, []);
});

test('source imports only accepted local composition modules', () => {
  const source = fs.readFileSync(SOURCE_PATH, 'utf8');

  assert.match(source, /repairIntakeDraftCaseControllerAdapter/);
  assert.match(source, /repairIntakeDraftCaseRouteFactory/);
  assert.match(source, /repairIntakeDraftToCaseRouteRegistrar/);

  for (const forbidden of [
    '../app',
    '../server',
    '../routes',
    '../repositories',
    '../providers',
    '../ai',
    '../admin',
    '../billing',
    '../smoke',
    '../migrations',
    '../db',
    'openapi',
    'process.env',
    'package.json',
    'pg',
    'knex',
    'sequelize',
    'RuntimeDependencyFactory',
    'ApplicationServiceFactory',
  ]) {
    assert.equal(source.includes(forbidden), false, `source imports forbidden runtime ${forbidden}`);
  }
});
