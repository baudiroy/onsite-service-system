'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  mountRepairIntakeDraftToCaseApiModule,
} = require('../../src/repairIntake/repairIntakeDraftToCaseHttpMountAdapter');

function handler() {
  return { ok: true };
}

function apiModule(method) {
  return {
    ok: true,
    routes: [
      {
        method,
        path: '/draft-to-case/plan',
        handler,
        rawCustomerPayload: { name: 'unsafe customer' },
        phoneNumber: '+886900000000',
        finalAppointmentId: 'unsafe_final',
      },
    ],
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
        methodKey: 'post',
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

test('accepts POST method variants and uses post target method key', () => {
  for (const method of ['post', 'POST', 'Post']) {
    const mountTarget = postMountTarget();
    const result = mountRepairIntakeDraftToCaseApiModule({
      mountTarget,
      apiModule: apiModule(method),
      basePath: '/repair-intake',
    });

    assert.equal(result.ok, true, `method should mount: ${method}`);
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
  }
});

test('register-style target still receives sanitized POST metadata', () => {
  const mountTarget = registerMountTarget();
  const result = mountRepairIntakeDraftToCaseApiModule({
    mountTarget,
    apiModule: apiModule('Post'),
    basePath: 'repair-intake',
  });

  assert.equal(result.ok, true);
  assert.deepEqual(mountTarget.registrations.map(({ method, path }) => ({ method, path })), [
    {
      method: 'POST',
      path: '/repair-intake/draft-to-case/plan',
    },
  ]);
  assertNoForbiddenFields(result);
});

test('unsupported or unsafe methods fail closed without registration', () => {
  for (const method of [
    'get',
    'put',
    'patch',
    'delete',
    'options',
    'head',
    'trace',
    'connect',
    '',
    42,
    null,
    {},
  ]) {
    const mountTarget = postMountTarget();
    const result = mountRepairIntakeDraftToCaseApiModule({
      mountTarget,
      apiModule: apiModule(method),
      basePath: '/repair-intake',
    });

    assert.equal(result.ok, false, `method should fail: ${String(method)}`);
    assert.equal(result.mounted, 0);
    assert.deepEqual(result.routes, []);
    assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_HTTP_MOUNT_ADAPTER_UNSUPPORTED_METHOD');
    assert.deepEqual(result.requiredActions, ['configure_supported_route_method']);
    assert.deepEqual(mountTarget.registrations, []);
    assertNoForbiddenFields(result);
  }
});
