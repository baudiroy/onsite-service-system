'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  createAppRouter,
  router: defaultRouter,
} = require('../../src/routes');

const repoRoot = path.resolve(__dirname, '../..');
const routeIndexFile = path.join(repoRoot, 'src/routes/index.js');

function findRoute(expressRouter, method, pathname) {
  return expressRouter.stack.find((layer) => (
    layer.route
    && layer.route.path === pathname
    && layer.route.methods[method.toLowerCase()]
  ));
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

function auth(overrides = {}) {
  return {
    organizationId: 'org_engineer_mobile_mount_001',
    engineerId: 'eng_engineer_mobile_mount_001',
    userId: 'user_engineer_mobile_mount_001',
    role: 'engineer',
    permissions: ['engineer_mobile.tasks.read'],
    ...overrides,
  };
}

function task(overrides = {}) {
  return {
    caseId: 'case_engineer_mobile_mount_001',
    appointmentId: 'apt_engineer_mobile_mount_001',
    organizationId: 'org_engineer_mobile_mount_001',
    assignedEngineerId: 'eng_engineer_mobile_mount_001',
    scheduledStart: '2026-05-21T09:00:00+08:00',
    scheduledEnd: '2026-05-21T10:00:00+08:00',
    status: 'confirmed',
    customerNameMasked: '林○○',
    customerPhoneMasked: '09xx-xxx-456',
    addressSummary: '新北市板橋區',
    productSummary: '冷氣',
    issueSummary: '不冷',
    serviceType: 'repair',
    internalNote: 'internal_note_should_not_leak',
    auditLog: 'audit_log_should_not_leak',
    aiRawPayload: 'ai_raw_payload_should_not_leak',
    billingInternal: 'billing_internal_should_not_leak',
    settlementInternal: 'settlement_internal_should_not_leak',
    rawPhone: 'raw_phone_should_not_leak',
    rawAddress: 'raw_address_should_not_leak',
    rawLineUserId: 'line_user_should_not_leak',
    token: 'token_should_not_leak',
    secret: 'secret_should_not_leak',
    finalAppointmentId: 'final_appointment_should_not_leak',
    ...overrides,
  };
}

function request(overrides = {}) {
  return {
    auth: auth(),
    query: {},
    ...overrides,
  };
}

function callMountedHandler(expressRouter, req) {
  const route = findRoute(expressRouter, 'get', '/engineer-mobile/tasks');
  const res = createResponse();
  let index = 0;

  assert.ok(route, 'mounted engineer mobile route missing');

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

function assertNoForbiddenOutput(value) {
  const serialized = JSON.stringify(value);

  for (const forbiddenValue of [
    'internal_note_should_not_leak',
    'audit_log_should_not_leak',
    'ai_raw_payload_should_not_leak',
    'billing_internal_should_not_leak',
    'settlement_internal_should_not_leak',
    'raw_phone_should_not_leak',
    'raw_address_should_not_leak',
    'line_user_should_not_leak',
    'token_should_not_leak',
    'secret_should_not_leak',
    'final_appointment_should_not_leak',
  ]) {
    assert.equal(serialized.includes(forbiddenValue), false, `leaked ${forbiddenValue}`);
  }

  assert.equal(serialized.includes('"rawPhone"'), false);
  assert.equal(serialized.includes('"rawAddress"'), false);
  assert.equal(serialized.includes('"rawLineUserId"'), false);
  assert.equal(serialized.includes('"finalAppointmentId"'), false);
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

test('default central router export still works', () => {
  assert.ok(defaultRouter);
  assert.equal(typeof defaultRouter.use, 'function');
});

test('central router mounts GET /engineer-mobile/tasks', () => {
  const appRouter = createAppRouter();
  const route = findRoute(appRouter, 'get', '/engineer-mobile/tasks');

  assert.ok(route);
  assert.equal(route.route.path, '/engineer-mobile/tasks');
  assert.equal(typeof route.route.stack[0].handle, 'function');
});

test('missing auth through mounted engineer mobile route returns safe deny', () => {
  const appRouter = createAppRouter({
    engineerMobile: {
      readModel: {
        tasks: [task()],
      },
    },
  });
  const res = callMountedHandler(appRouter, {});

  assert.deepEqual(res.statusCalls, [403]);
  assert.deepEqual(res.jsonCalls[0], {
    status: 'deny',
    messageKey: 'engineerMobile.unavailable',
    data: null,
  });
  assertNoForbiddenOutput(res.jsonCalls[0]);
});

test('createAppRouter({ engineerMobile }) injects readModel and returns only assigned scoped tasks', () => {
  const appRouter = createAppRouter({
    engineerMobile: {
      readModel: {
        tasks: [
          task({ caseId: 'case_allowed' }),
          task({ caseId: 'case_wrong_org', organizationId: 'org_other' }),
          task({ caseId: 'case_wrong_engineer', assignedEngineerId: 'eng_other' }),
        ],
      },
    },
  });
  const res = callMountedHandler(appRouter, request({
    query: {
      from: '2026-05-21',
      to: '2026-05-22',
    },
  }));

  assert.deepEqual(res.statusCalls, [200]);
  assert.equal(res.jsonCalls[0].status, 'allow');
  assert.deepEqual(res.jsonCalls[0].tasks.map((entry) => entry.caseId), ['case_allowed']);
  assertNoForbiddenOutput(res.jsonCalls[0]);
});

test('createAppRouter({ engineerMobile }) supports injected taskProvider without DB access', () => {
  const providerCalls = [];
  const appRouter = createAppRouter({
    engineerMobile: {
      taskProvider: {
        listTasks(query) {
          providerCalls.push(query);
          return [
            task({ caseId: 'case_provider_allowed' }),
            task({ caseId: 'case_provider_other_engineer', assignedEngineerId: 'eng_other' }),
          ];
        },
      },
    },
  });
  const res = callMountedHandler(appRouter, request());

  assert.equal(providerCalls.length, 1);
  assert.deepEqual(res.statusCalls, [200]);
  assert.deepEqual(res.jsonCalls[0].tasks.map((entry) => entry.caseId), ['case_provider_allowed']);
  assertNoForbiddenOutput(res.jsonCalls[0]);
});

test('customer access and data correction routes remain mounted', () => {
  const appRouter = createAppRouter();

  assert.ok(findRoute(appRouter, 'get', '/customer-access/:caseId'));
  assert.ok(findRoute(appRouter, 'post', '/data-correction/governance'));
});

test('data correction permission middleware remains first handler on mounted route', () => {
  const appRouter = createAppRouter();
  const route = findRoute(appRouter, 'post', '/data-correction/governance');

  assert.ok(route);
  assert.equal(route.route.stack.length >= 2, true);
  assert.match(route.route.stack[0].handle.name, /dataCorrectionPermissionMiddleware|middleware/i);
});

test('route index mounts engineer mobile through production composition adapter only', () => {
  const source = fs.readFileSync(routeIndexFile, 'utf8');
  const specifiers = requireSpecifiers(source);

  assert.ok(specifiers.includes('../engineerMobile/engineerMobileProductionMountCompositionAdapter'));
  assert.equal(specifiers.includes('./engineerMobileRoutes'), false);
  assert.equal(specifiers.includes('./engineerMobileTaskDetailRoutes'), false);
  assert.equal(specifiers.includes('./engineerMobileVisitActionRoutes'), false);
  assert.ok(specifiers.includes('../customerAccess/customerAccessRouteRegistry'));
  assert.ok(specifiers.includes('../customerAccess/customerAccessProductionMountCompositionAdapter'));
  assert.ok(specifiers.includes('./dataCorrectionRoutes'));
  assert.match(source, /createEngineerMobileProductionMountComposition\(\{\s*\.\.\.engineerMobileOptions,\s*router:\s*appRouter,\s*\}\)/);
  assert.equal(specifiers.some((specifier) => /\/db|pool|repositories?|transaction|provider|lineProvider|sms|email|push|rag|vector/i.test(specifier)), false);
  assert.doesNotMatch(source, /app\.listen|server\.listen|createServer/);
});
