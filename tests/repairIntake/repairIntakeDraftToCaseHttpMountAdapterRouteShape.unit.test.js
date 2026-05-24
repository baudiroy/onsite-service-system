'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  mountRepairIntakeDraftToCaseApiModule,
} = require('../../src/repairIntake/repairIntakeDraftToCaseHttpMountAdapter');

function handler() {
  return { ok: true };
}

function apiModule(routes) {
  return {
    ok: true,
    routes,
    registration: null,
    reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_API_MODULE_READY',
    requiredActions: [],
  };
}

function validRoute(overrides = {}) {
  return {
    method: overrides.method || 'POST',
    path: overrides.path || '/draft-to-case/plan',
    handler: overrides.handler || handler,
  };
}

function postMountTarget() {
  const registrations = [];

  return {
    registrations,
    post(pathValue, routeHandler) {
      registrations.push({
        methodKey: 'post',
        path: pathValue,
        handler: routeHandler,
      });
    },
  };
}

function assertNoForbiddenFields(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'finalAppointmentId',
    'phoneNumber',
    'fullAddress',
    'rawAddress',
    'rawCustomerPayload',
    'rawImportedRow',
    'select *',
    'stack trace',
    'sql',
    'SQL',
    'token',
    'secret',
    'lineAccessToken',
    'LINE access token',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

function assertFailure(result, mountTarget, expectedReasonCodes) {
  assert.equal(result.ok, false);
  assert.equal(result.mounted, 0);
  assert.deepEqual(result.routes, []);
  assert.equal(expectedReasonCodes.includes(result.reasonCode), true, `unexpected ${result.reasonCode}`);
  assert.deepEqual(mountTarget.registrations, []);
  assertNoForbiddenFields(result);
}

test('valid minimal route definition mounts successfully', () => {
  const mountTarget = postMountTarget();
  const result = mountRepairIntakeDraftToCaseApiModule({
    mountTarget,
    apiModule: apiModule([
      {
        method: 'Post',
        path: 'draft-to-case/plan/',
        handler,
      },
    ]),
    basePath: 'repair-intake',
  });

  assert.equal(result.ok, true);
  assert.equal(result.mounted, 1);
  assert.deepEqual(result.routes, [
    {
      method: 'POST',
      path: '/repair-intake/draft-to-case/plan',
    },
  ]);
  assert.deepEqual(mountTarget.registrations.map(({ methodKey, path }) => ({ methodKey, path })), [
    {
      methodKey: 'post',
      path: '/repair-intake/draft-to-case/plan',
    },
  ]);
  assertNoForbiddenFields(result);
});

test('missing non-array or empty route collection fails closed', () => {
  const routeCollections = [
    undefined,
    null,
    {},
    'routes',
    [],
  ];

  for (const routes of routeCollections) {
    const mountTarget = postMountTarget();
    const result = mountRepairIntakeDraftToCaseApiModule({
      mountTarget,
      apiModule: routes === undefined ? {
        ok: true,
        registration: null,
        reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_API_MODULE_READY',
        requiredActions: [],
      } : apiModule(routes),
      basePath: '/repair-intake',
    });

    assertFailure(result, mountTarget, [
      'REPAIR_INTAKE_DRAFT_TO_CASE_HTTP_MOUNT_ADAPTER_ROUTES_REQUIRED',
    ]);
  }
});

test('invalid route item shapes fail closed before registration', () => {
  const invalidRoutes = [
    null,
    'route',
    42,
    {},
    { path: '/draft-to-case/plan', handler },
    { method: 'POST', handler },
    { method: 'POST', path: '/draft-to-case/plan' },
    { method: 'POST', path: '/draft-to-case/plan', handler: 'not-a-function' },
  ];

  for (const invalidRoute of invalidRoutes) {
    const mountTarget = postMountTarget();
    const result = mountRepairIntakeDraftToCaseApiModule({
      mountTarget,
      apiModule: apiModule([invalidRoute]),
      basePath: '/repair-intake',
    });

    assertFailure(result, mountTarget, [
      'REPAIR_INTAKE_DRAFT_TO_CASE_HTTP_MOUNT_ADAPTER_ROUTE_INVALID',
      'REPAIR_INTAKE_DRAFT_TO_CASE_HTTP_MOUNT_ADAPTER_UNSUPPORTED_METHOD',
    ]);
  }
});

test('extra malformed route mixed with valid route fails closed with no partial registration', () => {
  const mountTarget = postMountTarget();
  const result = mountRepairIntakeDraftToCaseApiModule({
    mountTarget,
    apiModule: apiModule([
      validRoute(),
      { method: 'POST', path: '/draft-to-case/submit', handler: null },
    ]),
    basePath: '/repair-intake',
  });

  assertFailure(result, mountTarget, [
    'REPAIR_INTAKE_DRAFT_TO_CASE_HTTP_MOUNT_ADAPTER_ROUTE_INVALID',
  ]);
});
