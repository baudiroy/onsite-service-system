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

function route(method, routePath) {
  return {
    method,
    path: routePath,
    handler,
    rawCustomerPayload: { name: 'unsafe customer' },
    phoneNumber: '+886900000000',
    finalAppointmentId: 'unsafe_final',
  };
}

function postMountTarget() {
  const registrations = [];

  return {
    registrations,
    post(pathValue, routeHandler) {
      registrations.push({
        method: 'POST',
        path: pathValue,
        handler: routeHandler,
      });
    },
  };
}

function registerMountTarget() {
  const registrations = [];

  return {
    registrations,
    register(method, pathValue, routeHandler) {
      registrations.push({
        method,
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

test('duplicate normalized method and path fails closed before registration', () => {
  const mountTarget = postMountTarget();
  const result = mountRepairIntakeDraftToCaseApiModule({
    mountTarget,
    apiModule: apiModule([
      route('POST', '/draft-to-case/plan'),
      route('POST', 'draft-to-case//plan//'),
    ]),
    basePath: '/repair-intake',
  });

  assert.equal(result.ok, false);
  assert.equal(result.mounted, 0);
  assert.deepEqual(result.routes, []);
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_HTTP_MOUNT_ADAPTER_DUPLICATE_ROUTE');
  assert.deepEqual(result.requiredActions, ['configure_unique_route_definitions']);
  assert.deepEqual(mountTarget.registrations, []);
  assertNoForbiddenFields(result);
});

test('duplicate detection normalizes method case and basePath before registration', () => {
  const mountTarget = postMountTarget();
  const result = mountRepairIntakeDraftToCaseApiModule({
    mountTarget,
    apiModule: apiModule([
      route('post', '/draft-to-case/submit'),
      route('POST', '/draft-to-case/submit/'),
    ]),
    basePath: '/repair-intake//',
  });

  assert.equal(result.ok, false);
  assert.equal(result.mounted, 0);
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_HTTP_MOUNT_ADAPTER_DUPLICATE_ROUTE');
  assert.deepEqual(mountTarget.registrations, []);
  assertNoForbiddenFields(result);
});

test('valid non-duplicate plan and submit routes still mount on post target', () => {
  const mountTarget = postMountTarget();
  const result = mountRepairIntakeDraftToCaseApiModule({
    mountTarget,
    apiModule: apiModule([
      route('POST', '/draft-to-case/plan'),
      route('POST', '/draft-to-case/submit'),
    ]),
    basePath: '/repair-intake',
  });

  assert.equal(result.ok, true);
  assert.equal(result.mounted, 2);
  assert.deepEqual(result.routes.map((mountedRoute) => mountedRoute.path), [
    '/repair-intake/draft-to-case/plan',
    '/repair-intake/draft-to-case/submit',
  ]);
  assert.deepEqual(mountTarget.registrations.map((registration) => registration.path), [
    '/repair-intake/draft-to-case/plan',
    '/repair-intake/draft-to-case/submit',
  ]);
  assertNoForbiddenFields(result);
});

test('valid non-duplicate routes still mount on register-style target', () => {
  const mountTarget = registerMountTarget();
  const result = mountRepairIntakeDraftToCaseApiModule({
    mountTarget,
    apiModule: apiModule([
      route('POST', 'draft-to-case/plan'),
      route('POST', 'draft-to-case/submit/'),
    ]),
    basePath: 'repair-intake',
  });

  assert.equal(result.ok, true);
  assert.equal(result.mounted, 2);
  assert.deepEqual(mountTarget.registrations.map(({ method, path: routePath }) => ({ method, path: routePath })), [
    {
      method: 'POST',
      path: '/repair-intake/draft-to-case/plan',
    },
    {
      method: 'POST',
      path: '/repair-intake/draft-to-case/submit',
    },
  ]);
  assertNoForbiddenFields(result);
});
