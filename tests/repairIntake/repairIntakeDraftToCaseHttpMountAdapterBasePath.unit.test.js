'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  mountRepairIntakeDraftToCaseApiModule,
} = require('../../src/repairIntake/repairIntakeDraftToCaseHttpMountAdapter');

function handler() {
  return { ok: true };
}

function routes() {
  return [
    {
      method: 'POST',
      path: '/repair-intake/drafts/:draftId/case/plan',
      handler,
      rawCustomerPayload: { name: 'unsafe customer' },
      fullAddress: 'unsafe address',
      finalAppointmentId: 'unsafe_final',
    },
    {
      method: 'POST',
      path: '/repair-intake/drafts/:draftId/case/submit',
      handler,
    },
  ];
}

function apiModule() {
  return {
    ok: true,
    routes: routes(),
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

function mountedPathsFor(basePath, mountTarget = postMountTarget()) {
  const result = mountRepairIntakeDraftToCaseApiModule({
    mountTarget,
    apiModule: apiModule(),
    basePath,
  });

  return {
    result,
    paths: mountTarget.registrations.map((registration) => registration.path),
  };
}

function assertNoForbiddenFields(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'finalAppointmentId',
    'fullAddress',
    'rawAddress',
    'phoneNumber',
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

test('normalizes safe basePath inputs with leading slash and no route separator duplication', () => {
  const cases = [
    {
      basePath: '/repair-intake',
      expectedPrefix: '/repair-intake',
    },
    {
      basePath: '/api/repair-intake',
      expectedPrefix: '/api/repair-intake',
    },
    {
      basePath: 'repair-intake',
      expectedPrefix: '/repair-intake',
    },
    {
      basePath: '/repair-intake/',
      expectedPrefix: '/repair-intake',
    },
    {
      basePath: '/api//repair-intake//',
      expectedPrefix: '/api/repair-intake',
    },
  ];

  for (const { basePath, expectedPrefix } of cases) {
    const { result, paths } = mountedPathsFor(basePath);

    assert.equal(result.ok, true, `basePath should mount: ${basePath}`);
    assert.deepEqual(paths, [
      `${expectedPrefix}/repair-intake/drafts/:draftId/case/plan`,
      `${expectedPrefix}/repair-intake/drafts/:draftId/case/submit`,
    ]);
    assert.deepEqual(result.routes.map((route) => route.path), paths);
    assertNoForbiddenFields(result);

    for (const routePath of paths) {
      assert.equal(routePath.includes('//'), false, `duplicate slash in ${routePath}`);
    }
  }
});

test('empty or omitted basePath preserves original route suffixes safely', () => {
  for (const basePath of [undefined, '', '/']) {
    const { result, paths } = mountedPathsFor(basePath);

    assert.equal(result.ok, true);
    assert.deepEqual(paths, [
      '/repair-intake/drafts/:draftId/case/plan',
      '/repair-intake/drafts/:draftId/case/submit',
    ]);
    assertNoForbiddenFields(result);
  }
});

test('unsafe basePath values fail closed with sanitized metadata', () => {
  for (const basePath of [
    'https://example.com/x',
    '//example.com/x',
    '/repair-intake/../admin',
    '/repair-intake?next=/admin',
    '/repair intake',
    42,
    null,
    {},
  ]) {
    const mountTarget = postMountTarget();
    const result = mountRepairIntakeDraftToCaseApiModule({
      mountTarget,
      apiModule: apiModule(),
      basePath,
    });

    assert.equal(result.ok, false, `unsafe basePath should fail: ${String(basePath)}`);
    assert.equal(result.mounted, 0);
    assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_HTTP_MOUNT_ADAPTER_BASE_PATH_INVALID');
    assert.deepEqual(mountTarget.registrations, []);
    assertNoForbiddenFields(result);
  }
});

test('register-style target uses normalized safe basePath', () => {
  const mountTarget = registerMountTarget();
  const { result, paths } = mountedPathsFor('api/repair-intake/', mountTarget);

  assert.equal(result.ok, true);
  assert.deepEqual(paths, [
    '/api/repair-intake/repair-intake/drafts/:draftId/case/plan',
    '/api/repair-intake/repair-intake/drafts/:draftId/case/submit',
  ]);
  assert.deepEqual(result.routes.map((route) => route.path), paths);
  assertNoForbiddenFields(result);
});
