'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  registerRepairIntakeDraftToCaseRoutes,
} = require('../../src/repairIntake/repairIntakeDraftToCaseRouteRegistrar');

const SOURCE_PATH = path.join(__dirname, '../../src/repairIntake/repairIntakeDraftToCaseRouteRegistrar.js');

function task960StyleRoutes(overrides = {}) {
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
    'sql',
    'handler',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('happy path registers the two Task960-style POST routes onto a synthetic router', () => {
  const router = syntheticRouter();
  const routes = task960StyleRoutes();

  const result = registerRepairIntakeDraftToCaseRoutes({ router, routes });

  assert.equal(result.ok, true);
  assert.equal(result.registered, 2);
  assert.deepEqual(result.routes, [
    {
      method: 'POST',
      path: '/repair-intake/drafts/:draftId/case/plan',
    },
    {
      method: 'POST',
      path: '/repair-intake/drafts/:draftId/case/submit',
    },
  ]);
  assert.deepEqual(router.registrations.map(({ method, path: routePath }) => ({ method, path: routePath })), result.routes);
  assert.equal(router.registrations[0].handler, routes[0].handler);
  assert.equal(router.registrations[1].handler, routes[1].handler);
  assertNoForbiddenFields(result);
});

test('registration does not execute route handlers', () => {
  let handlerCalls = 0;
  const router = syntheticRouter();
  const routes = task960StyleRoutes({
    planHandler: () => {
      handlerCalls += 1;
      return { ok: true };
    },
    submitHandler: () => {
      handlerCalls += 1;
      return { ok: true };
    },
  });

  const result = registerRepairIntakeDraftToCaseRoutes({ router, routes });

  assert.equal(result.ok, true);
  assert.equal(handlerCalls, 0);
});

test('missing router fails safely', () => {
  const result = registerRepairIntakeDraftToCaseRoutes({
    routes: task960StyleRoutes(),
  });

  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_REGISTRAR_ROUTER_REQUIRED');
  assert.deepEqual(result.requiredActions, ['configure_router']);
  assertNoForbiddenFields(result);
});

test('missing routes fails safely', () => {
  const result = registerRepairIntakeDraftToCaseRoutes({
    router: syntheticRouter(),
  });

  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_REGISTRAR_ROUTES_REQUIRED');
  assert.deepEqual(result.requiredActions, ['configure_routes']);
  assertNoForbiddenFields(result);
});

test('invalid route method fails safely', () => {
  const result = registerRepairIntakeDraftToCaseRoutes({
    router: syntheticRouter(),
    routes: [
      {
        method: 'TRACE',
        path: '/repair-intake/drafts/:draftId/case/plan',
        handler: async () => ({ ok: true }),
      },
    ],
  });

  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_REGISTRAR_ROUTE_INVALID');
  assertNoForbiddenFields(result);
});

test('invalid route path fails safely', () => {
  const result = registerRepairIntakeDraftToCaseRoutes({
    router: syntheticRouter(),
    routes: [
      {
        method: 'POST',
        path: '/repair-intake/drafts/:draftId/case/submit?phone=+886900000000',
        handler: async () => ({ ok: true }),
      },
    ],
  });

  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_REGISTRAR_ROUTE_INVALID');
  assertNoForbiddenFields(result);
});

test('invalid handler fails safely', () => {
  const result = registerRepairIntakeDraftToCaseRoutes({
    router: syntheticRouter(),
    routes: [
      {
        method: 'POST',
        path: '/repair-intake/drafts/:draftId/case/submit',
        handler: null,
      },
    ],
  });

  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_REGISTRAR_ROUTE_INVALID');
  assertNoForbiddenFields(result);
});

test('safe basePath prefix works', () => {
  const router = syntheticRouter();

  const result = registerRepairIntakeDraftToCaseRoutes({
    router,
    routes: task960StyleRoutes(),
    basePath: '/internal/v1',
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.routes.map((route) => route.path), [
    '/internal/v1/repair-intake/drafts/:draftId/case/plan',
    '/internal/v1/repair-intake/drafts/:draftId/case/submit',
  ]);
  assert.deepEqual(router.registrations.map((route) => route.path), result.routes.map((route) => route.path));
});

test('unsafe basePath fails safely', () => {
  const result = registerRepairIntakeDraftToCaseRoutes({
    router: syntheticRouter(),
    routes: task960StyleRoutes(),
    basePath: '/internal?token=unsafe_secret',
  });

  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_REGISTRAR_BASE_PATH_INVALID');
  assert.deepEqual(result.requiredActions, ['configure_safe_base_path']);
  assertNoForbiddenFields(result);
});

test('returned summary contains only method and path metadata', () => {
  const result = registerRepairIntakeDraftToCaseRoutes({
    router: syntheticRouter(),
    routes: task960StyleRoutes(),
  });

  assert.equal(result.ok, true);
  assert.deepEqual(Object.keys(result.routes[0]).sort(), ['method', 'path']);
  assertNoForbiddenFields(result);
});

test('router method errors return safe failure without raw error leakage', () => {
  const result = registerRepairIntakeDraftToCaseRoutes({
    router: syntheticRouter({ throwOnPost: true }),
    routes: task960StyleRoutes(),
  });

  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_REGISTRAR_FAILED');
  assert.deepEqual(result.requiredActions, ['retry_or_manual_review']);
  assertNoForbiddenFields(result);
});

test('missing router method fails safely without registration', () => {
  const result = registerRepairIntakeDraftToCaseRoutes({
    router: {},
    routes: task960StyleRoutes(),
  });

  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_REGISTRAR_ROUTER_METHOD_REQUIRED');
  assert.deepEqual(result.requiredActions, ['configure_router_method']);
  assertNoForbiddenFields(result);
});

test('source has no app bootstrap router index OpenAPI DB provider AI admin billing or smoke imports', () => {
  const source = fs.readFileSync(SOURCE_PATH, 'utf8');

  assert.equal(source.includes('require('), false);

  for (const forbidden of [
    '../app',
    '../server',
    '../routes',
    '../controllers',
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
    'pg',
    'knex',
    'sequelize',
    'createRepairIntakeDraftCaseRoutes',
    'applicationService',
    'runtimeDependencyFactory',
  ]) {
    assert.equal(source.includes(forbidden), false, `source imports forbidden runtime ${forbidden}`);
  }
});
