'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  mountRepairIntakeDraftToCaseApiModule,
} = require('../../src/repairIntake/repairIntakeDraftToCaseHttpMountAdapter');

const SUMMARY_KEYS = ['mounted', 'ok', 'reasonCode', 'requiredActions', 'routes'];
const ROUTE_SUMMARY_KEYS = ['method', 'path'];

function handler() {
  return { ok: true };
}

function apiModule(overrides = {}) {
  return {
    ok: overrides.ok !== undefined ? overrides.ok : true,
    routes: overrides.routes || [
      {
        method: 'POST',
        path: '/draft-to-case/plan',
        handler,
        rawRoute: { unsafe: true },
        rawCustomerPayload: { customerName: 'unsafe customer' },
        phone: '+886900000000',
        address: 'unsafe address',
        lineUserId: 'unsafe_line',
      },
    ],
    registration: null,
    reasonCode: overrides.reasonCode || 'REPAIR_INTAKE_DRAFT_TO_CASE_API_MODULE_READY',
    requiredActions: overrides.requiredActions || [],
    rawRoutes: [{ handler }],
    module: { apiModule: true },
    databaseUrl: 'postgres://unsafe',
    DATABASE_URL: 'postgres://unsafe',
  };
}

function postMountTarget(options = {}) {
  const registrations = [];

  return {
    registrations,
    mountTarget: 'unsafe target',
    post(pathValue, routeHandler) {
      if (options.throwOnPost) {
        throw new Error('raw error stack select * from users token secret phone address customerName lineUserId');
      }

      registrations.push({
        method: 'POST',
        path: pathValue,
        handler: routeHandler,
        req: { unsafe: true },
        res: { unsafe: true },
        next: () => {},
      });
    },
  };
}

function assertSummaryKeys(result) {
  assert.deepEqual(Object.keys(result).sort(), SUMMARY_KEYS);
}

function assertRouteSummaryKeys(result) {
  for (const route of result.routes) {
    assert.deepEqual(Object.keys(route).sort(), ROUTE_SUMMARY_KEYS);
  }
}

function assertNoForbiddenKeys(value) {
  const forbiddenKeys = new Set([
    'handler',
    'rawRoute',
    'rawRoutes',
    'module',
    'apiModule',
    'target',
    'mountTarget',
    'request',
    'response',
    'req',
    'res',
    'next',
    'stack',
    'sql',
    'query',
    'params',
    'db',
    'databaseUrl',
    'DATABASE_URL',
    'phone',
    'address',
    'customer',
    'customerName',
    'customerPhone',
    'lineUserId',
  ]);
  const visit = (current) => {
    if (!current || typeof current !== 'object') {
      return;
    }

    for (const key of Object.keys(current)) {
      assert.equal(forbiddenKeys.has(key), false, `leaked forbidden key ${key}`);
      visit(current[key]);
    }
  };

  visit(value);
}

function assertNoForbiddenText(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'raw error',
    'select *',
    'from users',
    'postgres://',
    'token',
    'secret',
    'unsafe target',
    'unsafe customer',
    '+886900000000',
    'unsafe address',
    'unsafe_line',
    'lineAccessToken',
    'LINE access token',
    'finalAppointmentId',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

function assertSanitizedSummary(result) {
  assertSummaryKeys(result);
  assertRouteSummaryKeys(result);
  assertNoForbiddenKeys(result);
  assertNoForbiddenText(result);
}

test('successful mount summary exposes only sanitized metadata', () => {
  const mountTarget = postMountTarget();
  const result = mountRepairIntakeDraftToCaseApiModule({
    mountTarget,
    apiModule: apiModule(),
    basePath: '/repair-intake',
  });

  assert.equal(result.ok, true);
  assert.equal(result.mounted, 1);
  assert.deepEqual(result.routes, [
    {
      method: 'POST',
      path: '/repair-intake/draft-to-case/plan',
    },
  ]);
  assert.deepEqual(result.requiredActions, []);
  assertSanitizedSummary(result);
});

test('mount target thrown error returns sanitized failure summary only', () => {
  const result = mountRepairIntakeDraftToCaseApiModule({
    mountTarget: postMountTarget({ throwOnPost: true }),
    apiModule: apiModule(),
    basePath: '/repair-intake',
  });

  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_HTTP_MOUNT_ADAPTER_MOUNT_FAILED');
  assert.deepEqual(result.requiredActions, ['retry_or_manual_review']);
  assertSanitizedSummary(result);
});

test('apiModule failure sanitizes reasonCode and requiredActions', () => {
  const result = mountRepairIntakeDraftToCaseApiModule({
    mountTarget: postMountTarget(),
    apiModule: apiModule({
      ok: false,
      reasonCode: 'unsafe reason with token',
      requiredActions: [
        'configure_routes',
        'raw error stack select * token secret phone address customerName lineUserId',
      ],
    }),
    basePath: '/repair-intake',
  });

  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_HTTP_MOUNT_ADAPTER_API_MODULE_NOT_READY');
  assert.deepEqual(result.requiredActions, ['configure_routes']);
  assertSanitizedSummary(result);
});

test('invalid route failure exposes no raw route or handler data', () => {
  const result = mountRepairIntakeDraftToCaseApiModule({
    mountTarget: postMountTarget(),
    apiModule: apiModule({
      routes: [
        {
          method: 'POST',
          path: '/draft-to-case/plan',
          handler: null,
          rawRoute: { sql: 'select * from users' },
          phone: '+886900000000',
          address: 'unsafe address',
          customerName: 'unsafe customer',
        },
      ],
    }),
    basePath: '/repair-intake',
  });

  assert.equal(result.ok, false);
  assert.equal(result.mounted, 0);
  assert.deepEqual(result.routes, []);
  assertSanitizedSummary(result);
});
