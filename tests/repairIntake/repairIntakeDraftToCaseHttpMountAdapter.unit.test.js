'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  mountRepairIntakeDraftToCaseApiModule,
} = require('../../src/repairIntake/repairIntakeDraftToCaseHttpMountAdapter');

const SOURCE_PATH = path.join(
  __dirname,
  '../../src/repairIntake/repairIntakeDraftToCaseHttpMountAdapter.js',
);

function routeHandler() {
  return { ok: true };
}

function providedRoutes(overrides = {}) {
  return [
    {
      method: overrides.planMethod || 'POST',
      path: overrides.planPath || '/repair-intake/drafts/:draftId/case/plan',
      handler: overrides.planHandler || routeHandler,
      phone: '+886900000000',
      address: 'unsafe address',
      customerPayload: { name: 'unsafe customer' },
      finalAppointmentId: 'unsafe_final',
    },
    {
      method: overrides.submitMethod || 'POST',
      path: overrides.submitPath || '/repair-intake/drafts/:draftId/case/submit',
      handler: overrides.submitHandler || routeHandler,
    },
  ];
}

function apiModule(overrides = {}) {
  return {
    ok: overrides.ok !== undefined ? overrides.ok : true,
    routes: overrides.routes !== undefined ? overrides.routes : providedRoutes(overrides),
    registration: overrides.registration || null,
    reasonCode: overrides.reasonCode || 'REPAIR_INTAKE_DRAFT_TO_CASE_API_MODULE_READY',
    requiredActions: overrides.requiredActions || [],
  };
}

function postMountTarget(overrides = {}) {
  const registrations = [];

  return {
    registrations,
    post(pathValue, handler) {
      if (overrides.throwOnPost) {
        throw new Error('raw SQL select * stack trace provider token secret LINE access token finalAppointmentId');
      }

      registrations.push({
        method: 'POST',
        path: pathValue,
        handler,
      });
    },
  };
}

function registerMountTarget(overrides = {}) {
  const registrations = [];

  return {
    registrations,
    register(method, pathValue, handler) {
      if (overrides.throwOnRegister) {
        throw new Error('raw SQL select * stack trace provider token secret LINE access token finalAppointmentId');
      }

      registrations.push({
        method,
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
    'provider token',
    'token',
    'secret',
    'lineAccessToken',
    'LINE access token',
    'authorization',
    'rows',
    'sql',
    'SQL',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('mounts Task967-style routes onto a synthetic post mount target', () => {
  const mountTarget = postMountTarget();
  const result = mountRepairIntakeDraftToCaseApiModule({
    mountTarget,
    apiModule: apiModule(),
  });

  assert.equal(result.ok, true);
  assert.equal(result.mounted, 2);
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
  assert.deepEqual(mountTarget.registrations.map(({ method, path: routePath }) => ({ method, path: routePath })), result.routes);
  assertNoForbiddenFields(result);
});

test('mount does not execute handlers', () => {
  let handlerCalls = 0;
  const mountTarget = postMountTarget();

  const result = mountRepairIntakeDraftToCaseApiModule({
    mountTarget,
    apiModule: apiModule({
      planHandler: () => {
        handlerCalls += 1;
        return { ok: true };
      },
      submitHandler: () => {
        handlerCalls += 1;
        return { ok: true };
      },
    }),
  });

  assert.equal(result.ok, true);
  assert.equal(handlerCalls, 0);
});

test('missing mountTarget fails safely', () => {
  const result = mountRepairIntakeDraftToCaseApiModule({
    apiModule: apiModule(),
  });

  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_HTTP_MOUNT_ADAPTER_TARGET_REQUIRED');
  assert.deepEqual(result.requiredActions, ['configure_mount_target']);
  assertNoForbiddenFields(result);
});

test('missing apiModule fails safely', () => {
  const result = mountRepairIntakeDraftToCaseApiModule({
    mountTarget: postMountTarget(),
  });

  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_HTTP_MOUNT_ADAPTER_API_MODULE_REQUIRED');
  assert.deepEqual(result.requiredActions, ['configure_api_module']);
  assertNoForbiddenFields(result);
});

test('apiModule ok false fails safely with sanitized envelope metadata', () => {
  const result = mountRepairIntakeDraftToCaseApiModule({
    mountTarget: postMountTarget(),
    apiModule: apiModule({
      ok: false,
      reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_API_MODULE_ROUTES_INVALID',
      requiredActions: [
        'configure_valid_routes',
        'raw SQL select * stack trace provider token secret LINE access token finalAppointmentId',
      ],
    }),
  });

  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_API_MODULE_ROUTES_INVALID');
  assert.deepEqual(result.requiredActions, ['configure_valid_routes']);
  assertNoForbiddenFields(result);
});

test('missing routes fails safely', () => {
  const missingRoutesModules = [
    {
      ok: true,
      registration: null,
      reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_API_MODULE_READY',
      requiredActions: [],
    },
    apiModule({ routes: null }),
    apiModule({ routes: [] }),
  ];

  for (const moduleWithoutRoutes of missingRoutesModules) {
    const result = mountRepairIntakeDraftToCaseApiModule({
      mountTarget: postMountTarget(),
      apiModule: moduleWithoutRoutes,
    });

    assert.equal(result.ok, false);
    assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_HTTP_MOUNT_ADAPTER_ROUTES_REQUIRED');
    assertNoForbiddenFields(result);
  }
});

test('invalid route method path or handler fails safely', () => {
  const invalidMethodRoutes = [[
    { method: 'TRACE', path: '/repair-intake/drafts/:draftId/case/plan', handler: routeHandler },
  ]];
  const invalidPathOrHandlerRoutes = [
    [{ method: 'POST', path: '../unsafe', handler: routeHandler }],
    [{ method: 'POST', path: '/repair-intake/drafts/:draftId/case/plan', handler: null }],
  ];

  for (const routes of invalidMethodRoutes) {
    const result = mountRepairIntakeDraftToCaseApiModule({
      mountTarget: postMountTarget(),
      apiModule: apiModule({ routes }),
    });

    assert.equal(result.ok, false);
    assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_HTTP_MOUNT_ADAPTER_UNSUPPORTED_METHOD');
    assertNoForbiddenFields(result);
  }

  for (const routes of invalidPathOrHandlerRoutes) {
    const result = mountRepairIntakeDraftToCaseApiModule({
      mountTarget: postMountTarget(),
      apiModule: apiModule({ routes }),
    });

    assert.equal(result.ok, false);
    assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_HTTP_MOUNT_ADAPTER_ROUTE_INVALID');
    assertNoForbiddenFields(result);
  }
});

test('safe basePath prefixes mounted route paths', () => {
  const mountTarget = postMountTarget();
  const result = mountRepairIntakeDraftToCaseApiModule({
    mountTarget,
    apiModule: apiModule(),
    basePath: '/internal/v1',
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.routes.map((route) => route.path), [
    '/internal/v1/repair-intake/drafts/:draftId/case/plan',
    '/internal/v1/repair-intake/drafts/:draftId/case/submit',
  ]);
  assert.deepEqual(mountTarget.registrations.map((route) => route.path), result.routes.map((route) => route.path));
});

test('unsafe basePath fails safely', () => {
  for (const basePath of ['/internal/../v1', '/internal v1', '/internal?x=1']) {
    const result = mountRepairIntakeDraftToCaseApiModule({
      mountTarget: postMountTarget(),
      apiModule: apiModule(),
      basePath,
    });

    assert.equal(result.ok, false);
    assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_HTTP_MOUNT_ADAPTER_BASE_PATH_INVALID');
    assertNoForbiddenFields(result);
  }
});

test('supports register style mount target', () => {
  const mountTarget = registerMountTarget();
  const result = mountRepairIntakeDraftToCaseApiModule({
    mountTarget,
    apiModule: apiModule(),
  });

  assert.equal(result.ok, true);
  assert.deepEqual(mountTarget.registrations.map(({ method, path: routePath }) => ({ method, path: routePath })), result.routes);
});

test('unsupported mount target method fails before mounting', () => {
  const result = mountRepairIntakeDraftToCaseApiModule({
    mountTarget: {},
    apiModule: apiModule(),
  });

  assert.equal(result.ok, false);
  assert.equal(result.mounted, 0);
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_HTTP_MOUNT_ADAPTER_TARGET_METHOD_REQUIRED');
  assertNoForbiddenFields(result);
});

test('mount target throw returns safe failure without raw error leakage', () => {
  const result = mountRepairIntakeDraftToCaseApiModule({
    mountTarget: postMountTarget({ throwOnPost: true }),
    apiModule: apiModule(),
  });

  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_HTTP_MOUNT_ADAPTER_MOUNT_FAILED');
  assertNoForbiddenFields(result);
});

test('summary includes only method and path route metadata', () => {
  const result = mountRepairIntakeDraftToCaseApiModule({
    mountTarget: postMountTarget(),
    apiModule: apiModule(),
  });

  assert.equal(result.ok, true);
  assert.deepEqual(Object.keys(result.routes[0]).sort(), ['method', 'path']);
  assert.equal(Object.hasOwn(result.routes[0], 'handler'), false);
  assertNoForbiddenFields(result);
});

test('source does not import forbidden runtime modules', () => {
  const source = fs.readFileSync(SOURCE_PATH, 'utf8');
  const importPatterns = [
    /\brequire\(\s*['"][^'"]+['"]\s*\)/,
    /\bfrom\s+['"][^'"]+['"]/,
  ];
  const forbiddenPatterns = [
    /(?:^|\/)(?:app|server)(?:\.js|\/|$)/i,
    /(?:^|\/)(?:bootstrap|routes\/index|public\.routes)(?:\.js|\/|$)/i,
    /(?:^|\/)(?:dto|openapi|swagger)(?:\.js|\/|$)/i,
    /(?:^|\/)(?:db|database|sql|migrations?)(?:\.js|\/|$)/i,
    /(?:^|\/)repositories?(?:\.js|\/|$)/i,
    /(?:^|\/)(?:providers?|line|sms|email|webhooks?)(?:\.js|\/|$)/i,
    /(?:^|\/)(?:ai|rag|vector)(?:\.js|\/|$)/i,
    /(?:^|\/)(?:billing|settlement|payment|invoice)(?:\.js|\/|$)/i,
    /(?:^|\/)admin(?:\.js|\/|$)/i,
    /(?:^|\/)(?:smoke|shared)(?:\.js|\/|$)/i,
    /\b(?:express|Router)\s*\(/,
    /\b(?:defaultRouter|globalRouter|appRouter|serverRouter)\b/,
    /\b(?:dbClient|databaseClient|databasePool|queryExecutor|transactionRunner)\b/,
    /\b(?:providerClient|lineClient|smsClient|emailClient|webhookClient)\b/,
    /\b(?:aiProvider|rag|vectorStore|embeddingProvider)\b/i,
    /\b(?:billing|settlement|payment|invoice)\b/i,
    /\b(?:openapi|swagger|dto)\b/i,
    /\b(?:app\.js|server\.js|routes\/index|public\.routes)\b/,
    /\bprocess\.env\b/,
    /\b(?:pg|knex|sequelize)\b/,
    /\bpackage\.json\b/,
  ];

  for (const pattern of importPatterns) {
    assert.equal(pattern.test(source), false, `source contains import pattern ${pattern}`);
  }

  for (const pattern of forbiddenPatterns) {
    assert.equal(pattern.test(source), false, `source contains forbidden runtime pattern ${pattern}`);
  }
});
