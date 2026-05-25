'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  createApp,
} = require('../../src/app');
const {
  engineerMobileReadModelRows,
} = require('./fixtures/engineerMobileReadModelRows.fixture');
const {
  mapEngineerMobileTaskListRows,
} = require('../../src/engineerMobile/engineerMobileTaskListReadModelMapper');

const repoRoot = path.resolve(__dirname, '../..');
const testFile = path.join(repoRoot, 'tests/engineerMobile/engineerMobileAppFactoryInjectedReadModelProvider.unit.test.js');

function auth(overrides = {}) {
  return {
    organizationId: 'org_fixture_engineer_mobile',
    engineerId: 'eng_fixture_primary',
    userId: 'user_fixture_engineer_mobile',
    role: 'engineer',
    permissions: ['engineer_mobile.tasks.read'],
    ...overrides,
  };
}

function createResponse() {
  return {
    statusCalls: [],
    jsonCalls: [],
    status(statusCode) {
      this.statusCalls.push(statusCode);
      return this;
    },
    json(body) {
      this.jsonCalls.push(body);
      return this;
    },
  };
}

function appRouter(appInstance) {
  const routerLayer = appInstance._router.stack.find((layer) => (
    layer.handle
    && Array.isArray(layer.handle.stack)
    && layer.name === 'router'
  ));

  assert.ok(routerLayer, 'app router layer missing');
  return routerLayer.handle;
}

function findRoute(appInstance, method, pathname) {
  return appRouter(appInstance).stack.find((layer) => (
    layer.route
    && layer.route.path === pathname
    && layer.route.methods[method.toLowerCase()]
  ));
}

function callMountedEngineerRoute(appInstance, req) {
  const route = findRoute(appInstance, 'get', '/engineer-mobile/tasks');
  const res = createResponse();
  let index = 0;

  assert.ok(route, 'engineer mobile task list route should be mounted');

  function next() {
    index += 1;
    const layer = route.route.stack[index];

    if (layer) {
      return layer.handle(req, res, next);
    }

    return undefined;
  }

  route.route.stack[0].handle(req, res, next);

  return res;
}

function request(overrides = {}) {
  return {
    auth: auth(),
    query: {},
    ...overrides,
  };
}

function requireSpecifiers(source) {
  const specifiers = [];
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
  let match;

  while ((match = requireRegex.exec(source)) !== null) {
    specifiers.push(match[1]);
  }

  return specifiers;
}

function assertNoForbiddenOutput(value) {
  const serialized = JSON.stringify(value);
  const lower = serialized.toLowerCase();

  for (const forbidden of [
    'postgres://',
    'postgresql://',
    'mysql://',
    'mongodb://',
    'database_url',
    'bearer ',
    'raw_line_user_id',
    'line_user_id',
    'full_customer_payload',
    'full_payload',
    'field_service_report_id',
    'fieldServiceReportId',
    'completion_report_id',
    'completionReportId',
    'finalAppointmentId',
    'final_appointment_id',
    'internal_note',
    'internalNote',
    'audit_log',
    'auditLog',
    'ai_raw_payload',
    'aiRawPayload',
    'billing_internal',
    'billingInternal',
    'settlement_internal',
    'settlementInternal',
    'token',
    'secret',
    'password',
    'credential',
  ]) {
    assert.equal(lower.includes(forbidden.toLowerCase()), false, `leaked ${forbidden}`);
  }

  assert.equal(/09\d{2}[-\s]?\d{3}[-\s]?\d{3}/.test(serialized), false);
  assert.equal(/台北市.+\d+號/.test(serialized), false);
}

function mappedFixtureTasksFor(input) {
  return mapEngineerMobileTaskListRows(engineerMobileReadModelRows, {
    engineerId: input.engineerId,
    organizationId: input.organizationId,
  }).map((task) => ({
    ...task,
    internalNote: 'internal_note_should_not_leak',
    auditLog: 'audit_log_should_not_leak',
    aiRawPayload: 'ai_raw_payload_should_not_leak',
    billingInternal: 'billing_internal_should_not_leak',
    settlementInternal: 'settlement_internal_should_not_leak',
    rawLineUserId: 'raw_line_user_id_should_not_leak',
    rawPhone: '0912-345-678',
    rawAddress: '台北市測試區測試路一段88號',
    fullCustomerPayload: 'full_customer_payload_should_not_leak',
    fullPayload: 'full_payload_should_not_leak',
    fieldServiceReportId: 'fsr_should_not_leak',
    completionReportId: 'completion_report_should_not_leak',
    finalAppointmentId: 'final_appointment_should_not_leak',
    token: 'token_should_not_leak',
    secret: 'secret_should_not_leak',
    DATABASE_URL: 'postgres://user:pass@example.invalid/db',
  }));
}

test('unit test imports only app factory, fixture, and existing mapper modules', () => {
  const specifiers = requireSpecifiers(fs.readFileSync(testFile, 'utf8'));
  const allowed = [
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:test',
    '../../src/app',
    './fixtures/engineerMobileReadModelRows.fixture',
    '../../src/engineerMobile/engineerMobileTaskListReadModelMapper',
  ];

  assert.deepEqual(specifiers.sort(), allowed.sort());
  assert.equal(
    specifiers.some((specifier) => /db|pool|repositories?|transaction|provider|server|migration|psql|openai|rag|vector|smoke|browser/i.test(specifier)),
    false,
  );
});

test('app factory creation does not call injected read-model provider', () => {
  const providerCalls = [];
  const app = createApp({
    engineerMobile: {
      readModel(input) {
        providerCalls.push(input);
        return mappedFixtureTasksFor(input);
      },
    },
  });

  assert.equal(typeof app.handle, 'function');
  assert.deepEqual(providerCalls, []);
});

test('synthetic request path reaches injected read-model provider and returns safe mapped output', () => {
  const providerCalls = [];
  const app = createApp({
    engineerMobile: {
      readModel(input) {
        providerCalls.push(input);
        return mappedFixtureTasksFor(input);
      },
    },
  });
  const res = callMountedEngineerRoute(app, request());

  assert.deepEqual(res.statusCalls, [200]);
  assert.equal(providerCalls.length, 1);
  assert.deepEqual(providerCalls[0], {
    dateRange: undefined,
    engineerId: 'eng_fixture_primary',
    organizationId: 'org_fixture_engineer_mobile',
  });
  assert.equal(res.jsonCalls[0].status, 'allow');
  assert.deepEqual(res.jsonCalls[0].tasks.map((entry) => entry.appointmentId), [
    'apt_fixture_multi_visit_001',
    'apt_fixture_multi_visit_002',
    'apt_fixture_note_exclusion_001',
  ]);
  assertNoForbiddenOutput(res.jsonCalls[0]);
});

test('wrong organization and engineer requests are filtered without leaking provider rows', () => {
  const app = createApp({
    engineerMobile: {
      readModel() {
        return mappedFixtureTasksFor({
          engineerId: 'eng_fixture_primary',
          organizationId: 'org_fixture_engineer_mobile',
        });
      },
    },
  });
  const wrongOrg = callMountedEngineerRoute(app, request({
    auth: auth({ organizationId: 'org_other' }),
  }));
  const wrongEngineer = callMountedEngineerRoute(app, request({
    auth: auth({ engineerId: 'eng_other' }),
  }));

  assert.deepEqual(wrongOrg.statusCalls, [200]);
  assert.deepEqual(wrongEngineer.statusCalls, [200]);
  assert.deepEqual(wrongOrg.jsonCalls[0].tasks, []);
  assert.deepEqual(wrongEngineer.jsonCalls[0].tasks, []);
  assertNoForbiddenOutput({ wrongOrg: wrongOrg.jsonCalls[0], wrongEngineer: wrongEngineer.jsonCalls[0] });
});

test('provider error and empty result return safe non-sensitive envelopes', () => {
  const throwingApp = createApp({
    engineerMobile: {
      readModel() {
        throw new Error('raw provider secret should not leak');
      },
    },
  });
  const emptyApp = createApp({
    engineerMobile: {
      readModel() {
        return { tasks: [] };
      },
    },
  });
  const throwing = callMountedEngineerRoute(throwingApp, request());
  const empty = callMountedEngineerRoute(emptyApp, request());

  assert.deepEqual(throwing.statusCalls, [403]);
  assert.deepEqual(throwing.jsonCalls[0], {
    status: 'deny',
    messageKey: 'engineerMobile.forbidden',
    tasks: [],
  });
  assert.deepEqual(empty.statusCalls, [200]);
  assert.deepEqual(empty.jsonCalls[0], {
    status: 'allow',
    tasks: [],
  });
  assertNoForbiddenOutput({ throwing: throwing.jsonCalls[0], empty: empty.jsonCalls[0] });
});

test('task-list app path does not expose formal report ownership fields', () => {
  const app = createApp({
    engineerMobile: {
      readModel(input) {
        return mappedFixtureTasksFor(input);
      },
    },
  });
  const res = callMountedEngineerRoute(app, request());
  const serialized = JSON.stringify(res.jsonCalls[0]);

  assert.equal(serialized.includes('fieldServiceReportId'), false);
  assert.equal(serialized.includes('completionReportId'), false);
  assert.equal(serialized.includes('finalAppointmentId'), false);
  assert.equal(serialized.includes('final_appointment_id'), false);
  assert.equal(
    res.jsonCalls[0].tasks.filter((entry) => entry.caseId === 'case_fixture_multi_visit_001').length,
    2,
  );
  assertNoForbiddenOutput(res.jsonCalls[0]);
});
