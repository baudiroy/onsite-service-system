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

function routeIndex(expressRouter, method, pathname) {
  return expressRouter.stack.findIndex((layer) => (
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
    organizationId: 'org_engineer_mobile_mount_detail_001',
    userId: 'user_engineer_mobile_mount_detail_001',
    engineerId: 'eng_engineer_mobile_mount_detail_001',
    role: 'engineer',
    permissions: ['engineer_mobile.tasks.read'],
    ...overrides,
  };
}

function task(overrides = {}) {
  return {
    appointmentId: 'apt_engineer_mobile_mount_detail_001',
    caseId: 'case_engineer_mobile_mount_detail_001',
    organizationId: 'org_engineer_mobile_mount_detail_001',
    assignedEngineerId: 'eng_engineer_mobile_mount_detail_001',
    scheduledStart: '2026-05-21T09:00:00+08:00',
    scheduledEnd: '2026-05-21T10:00:00+08:00',
    status: 'confirmed',
    customerNameMasked: '陳○○',
    customerPhoneMasked: '09xx-xxx-321',
    addressSummary: '台北市信義區',
    productSummary: '冷氣',
    issueSummary: '不冷',
    serviceType: 'repair',
    siteNoteSafe: '請先聯絡櫃台',
    checklistSummary: {
      requiredPhotoCount: 1,
    },
    evidenceRefs: [
      {
        id: 'safe_evidence_ref_001',
        type: 'photo',
        label: '故障照片',
        token: 'evidence_token_should_not_leak',
      },
    ],
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
    DATABASE_URL: 'DATABASE_URL_should_not_leak',
    finalAppointmentId: 'final_appointment_should_not_leak',
    ...overrides,
  };
}

function request(overrides = {}) {
  return {
    auth: auth(),
    params: {
      appointmentId: 'apt_engineer_mobile_mount_detail_001',
    },
    query: {},
    ...overrides,
  };
}

function invokeRoute(route, req) {
  const res = createResponse();
  let index = 0;

  function next() {
    index += 1;
    const layer = route.route.stack[index];

    if (layer && typeof layer.handle === 'function') {
      return layer.handle(req, res, next);
    }

    return undefined;
  }

  route.route.stack[0].handle(req, res, next);

  return {
    req,
    res,
  };
}

function invokeMountedRoute(expressRouter, method, pathname, req) {
  const route = findRoute(expressRouter, method, pathname);

  assert.ok(route, `missing route ${method} ${pathname}`);

  return invokeRoute(route, req);
}

function assertNoForbiddenOutput(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
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
    'DATABASE_URL_should_not_leak',
    'final_appointment_should_not_leak',
    'evidence_token_should_not_leak',
    'rawPhone',
    'rawAddress',
    'rawLineUserId',
    'finalAppointmentId',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
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

test('central router mounts list and detail engineer mobile routes in safe order', () => {
  const appRouter = createAppRouter();
  const listRoute = findRoute(appRouter, 'get', '/engineer-mobile/tasks');
  const detailRoute = findRoute(appRouter, 'get', '/engineer-mobile/tasks/:appointmentId');

  assert.ok(listRoute);
  assert.ok(detailRoute);
  assert.equal(routeIndex(appRouter, 'get', '/engineer-mobile/tasks') < routeIndex(appRouter, 'get', '/engineer-mobile/tasks/:appointmentId'), true);
});

test('detail route stack has permission middleware before controller handler', () => {
  const appRouter = createAppRouter();
  const detailRoute = findRoute(appRouter, 'get', '/engineer-mobile/tasks/:appointmentId');

  assert.ok(detailRoute);
  assert.equal(detailRoute.route.stack.length, 2);
  assert.match(detailRoute.route.stack[0].handle.name, /engineerMobilePermissionMiddleware/);
  assert.match(detailRoute.route.stack[1].handle.name, /engineerMobileTaskDetailHandler/);
});

test('missing auth is denied before detail read model', () => {
  const readModelCalls = [];
  const appRouter = createAppRouter({
    engineerMobile: {
      readModel(input) {
        readModelCalls.push(input);
        return { tasks: [task()] };
      },
    },
  });
  const { res } = invokeMountedRoute(appRouter, 'get', '/engineer-mobile/tasks/:appointmentId', {
    params: {
      appointmentId: 'apt_engineer_mobile_mount_detail_001',
    },
  });

  assert.deepEqual(readModelCalls, []);
  assert.deepEqual(res.statusCalls, [403]);
  assert.deepEqual(res.jsonCalls[0], {
    status: 'deny',
    messageKey: 'engineerMobile.unavailable',
    data: null,
  });
  assertNoForbiddenOutput(res.jsonCalls[0]);
});

test('missing permission is denied before detail read model', () => {
  const readModelCalls = [];
  const appRouter = createAppRouter({
    engineerMobile: {
      readModel(input) {
        readModelCalls.push(input);
        return { tasks: [task()] };
      },
    },
  });
  const { res } = invokeMountedRoute(appRouter, 'get', '/engineer-mobile/tasks/:appointmentId', request({
    auth: auth({
      permissions: [],
    }),
  }));

  assert.deepEqual(readModelCalls, []);
  assert.deepEqual(res.statusCalls, [403]);
  assert.deepEqual(res.jsonCalls[0], {
    status: 'deny',
    messageKey: 'engineerMobile.unavailable',
    data: null,
  });
  assertNoForbiddenOutput(res.jsonCalls[0]);
});

test('valid engineer auth with matching appointment returns mounted detail', () => {
  const appRouter = createAppRouter({
    engineerMobile: {
      readModel(input) {
        assert.deepEqual(input, {
          appointmentId: 'apt_engineer_mobile_mount_detail_001',
          engineerId: 'eng_engineer_mobile_mount_detail_001',
          organizationId: 'org_engineer_mobile_mount_detail_001',
        });

        return { tasks: [task()] };
      },
    },
  });
  const { res } = invokeMountedRoute(appRouter, 'get', '/engineer-mobile/tasks/:appointmentId', request());

  assert.deepEqual(res.statusCalls, [200]);
  assert.equal(res.jsonCalls[0].status, 'allow');
  assert.equal(res.jsonCalls[0].detail.appointmentId, 'apt_engineer_mobile_mount_detail_001');
  assert.equal(res.jsonCalls[0].detail.caseId, 'case_engineer_mobile_mount_detail_001');
  assertNoForbiddenOutput(res.jsonCalls[0]);
});

test('wrong org engineer or appointment returns generic safe unavailable', () => {
  for (const sourceTask of [
    task({ organizationId: 'org_other' }),
    task({ assignedEngineerId: 'eng_other' }),
    task({ appointmentId: 'apt_other' }),
  ]) {
    const appRouter = createAppRouter({
      engineerMobile: {
        readModel() {
          return { tasks: [sourceTask] };
        },
      },
    });
    const { res } = invokeMountedRoute(appRouter, 'get', '/engineer-mobile/tasks/:appointmentId', request());

    assert.deepEqual(res.statusCalls, [404]);
    assert.deepEqual(res.jsonCalls[0], {
      detail: null,
      messageKey: 'engineerMobile.taskDetailUnavailable',
      status: 'deny',
    });
    assertNoForbiddenOutput(res.jsonCalls[0]);
  }
});

test('list route still returns assigned tasks with same injected options', () => {
  const appRouter = createAppRouter({
    engineerMobile: {
      readModel(input) {
        assert.equal(input.organizationId, 'org_engineer_mobile_mount_detail_001');
        assert.equal(input.engineerId, 'eng_engineer_mobile_mount_detail_001');

        return {
          tasks: [
            task({ caseId: 'case_allowed' }),
            task({ caseId: 'case_wrong_org', organizationId: 'org_other' }),
            task({ caseId: 'case_wrong_engineer', assignedEngineerId: 'eng_other' }),
          ],
        };
      },
    },
  });
  const { res } = invokeMountedRoute(appRouter, 'get', '/engineer-mobile/tasks', request({
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

test('customer access and data correction routes remain mounted', () => {
  const appRouter = createAppRouter();

  assert.ok(findRoute(appRouter, 'get', '/customer-access/:caseId'));
  assert.ok(findRoute(appRouter, 'post', '/data-correction/governance'));
});

test('route index imports mounted detail route without DB, provider, or server bootstrap', () => {
  const source = fs.readFileSync(routeIndexFile, 'utf8');
  const specifiers = requireSpecifiers(source);

  assert.ok(specifiers.includes('./engineerMobileRoutes'));
  assert.ok(specifiers.includes('./engineerMobileTaskDetailRoutes'));
  assert.ok(specifiers.includes('./customerAccessRoutes'));
  assert.ok(specifiers.includes('./dataCorrectionRoutes'));
  assert.equal(specifiers.some((specifier) => /\/db|pool|repositories?|transaction|provider|lineProvider|sms|email|push|rag|vector/i.test(specifier)), false);
  assert.doesNotMatch(source, /app\.listen|server\.listen|createServer/);
});
