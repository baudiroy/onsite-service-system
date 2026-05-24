'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  mountRepairIntakeDraftToCaseApiModule,
} = require('../../src/repairIntake/repairIntakeDraftToCaseHttpMountAdapter');

function handler() {
  return { ok: true };
}

function apiModule(routePaths) {
  return {
    ok: true,
    routes: routePaths.map((routePath) => ({
      method: 'POST',
      path: routePath,
      handler,
      rawCustomerPayload: { name: 'unsafe customer' },
      phoneNumber: '+886900000000',
      finalAppointmentId: 'unsafe_final',
    })),
    registration: null,
    reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_API_MODULE_READY',
    requiredActions: [],
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

function mountWithPaths(routePaths, options = {}) {
  const mountTarget = options.mountTarget || postMountTarget();
  const result = mountRepairIntakeDraftToCaseApiModule({
    mountTarget,
    apiModule: apiModule(routePaths),
    basePath: options.basePath,
  });

  return {
    result,
    paths: mountTarget.registrations.map((registration) => registration.path),
    registrations: mountTarget.registrations,
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

test('normalizes safe absolute and relative route suffixes', () => {
  const { result, paths } = mountWithPaths([
    '/draft-to-case/plan',
    'draft-to-case/submit/',
  ], {
    basePath: '/api/repair-intake/',
  });

  assert.equal(result.ok, true);
  assert.deepEqual(paths, [
    '/api/repair-intake/draft-to-case/plan',
    '/api/repair-intake/draft-to-case/submit',
  ]);
  assert.deepEqual(result.routes.map((route) => route.path), paths);
  assertNoForbiddenFields(result);
});

test('normalizes duplicate slashes and preserves Task993 basePath behavior', () => {
  const { result, paths } = mountWithPaths([
    'draft-to-case//plan//',
    '/draft-to-case///submit/',
  ], {
    basePath: 'repair-intake',
  });

  assert.equal(result.ok, true);
  assert.deepEqual(paths, [
    '/repair-intake/draft-to-case/plan',
    '/repair-intake/draft-to-case/submit',
  ]);
  assertNoForbiddenFields(result);

  for (const routePath of paths) {
    assert.equal(routePath.includes('//'), false, `duplicate slash in ${routePath}`);
  }
});

test('register-style target uses normalized route suffixes', () => {
  const mountTarget = registerMountTarget();
  const { result, paths } = mountWithPaths([
    '/draft-to-case/plan',
    'draft-to-case/submit/',
  ], {
    mountTarget,
    basePath: '/internal/v1/',
  });

  assert.equal(result.ok, true);
  assert.deepEqual(paths, [
    '/internal/v1/draft-to-case/plan',
    '/internal/v1/draft-to-case/submit',
  ]);
  assert.deepEqual(result.routes.map((route) => route.path), paths);
  assertNoForbiddenFields(result);
});

test('unsafe route suffix values fail closed before mounting', () => {
  for (const routePath of [
    'https://example.com/x',
    '//example.com/x',
    '../admin',
    '/draft-to-case/../admin',
    '/draft-to-case?next=/admin',
    '/draft-to-case#fragment',
    '/draft intake',
    42,
    null,
    {},
    '',
  ]) {
    const { result, registrations } = mountWithPaths([routePath], {
      basePath: '/repair-intake',
    });

    assert.equal(result.ok, false, `unsafe route suffix should fail: ${String(routePath)}`);
    assert.equal(result.mounted, 0);
    assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_HTTP_MOUNT_ADAPTER_ROUTE_INVALID');
    assert.deepEqual(registrations, []);
    assertNoForbiddenFields(result);
  }
});
