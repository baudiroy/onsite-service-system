'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  mountRepairIntakeDraftToCaseApiModule,
} = require('../../src/repairIntake/repairIntakeDraftToCaseHttpMountAdapter');

const ADAPTER_SOURCE_PATH = path.join(
  __dirname,
  '../../src/repairIntake/repairIntakeDraftToCaseHttpMountAdapter.js',
);

const FORBIDDEN_GLOBAL_ROUTE_PATHS = [
  '../../src/app.js',
  '../../src/server.js',
  '../../src/routes/index.js',
  '../../src/routes/public.routes.js',
];

function safePlanHandler(request = {}) {
  return {
    ok: true,
    statusCode: 200,
    body: {
      ok: true,
      action: 'repair_intake_draft_to_case_plan',
      draftId: request.params && request.params.draftId,
      organizationId: request.context && request.context.organizationId,
      reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_PLAN_READY',
      requiredActions: [],
    },
  };
}

function safeSubmitHandler(request = {}) {
  return {
    ok: true,
    statusCode: 200,
    body: {
      ok: true,
      action: 'repair_intake_draft_to_case_submit',
      draftId: request.params && request.params.draftId,
      organizationId: request.context && request.context.organizationId,
      caseRef: {
        id: 'case_task992',
        organizationId: request.context && request.context.organizationId,
        sourceDraftId: request.params && request.params.draftId,
        status: 'created',
      },
      reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_SUBMITTED',
      requiredActions: [],
    },
  };
}

function task967ApiModule(overrides = {}) {
  return {
    ok: overrides.ok !== undefined ? overrides.ok : true,
    routes: overrides.routes || [
      {
        method: 'POST',
        path: '/repair-intake/drafts/:draftId/case/plan',
        handler: overrides.planHandler || safePlanHandler,
        rawCustomerPayload: { name: 'unsafe customer' },
        phoneNumber: '+886900000000',
        fullAddress: 'unsafe address',
        finalAppointmentId: 'unsafe_final',
      },
      {
        method: 'POST',
        path: '/repair-intake/drafts/:draftId/case/submit',
        handler: overrides.submitHandler || safeSubmitHandler,
      },
    ],
    registration: null,
    reasonCode: overrides.reasonCode || 'REPAIR_INTAKE_DRAFT_TO_CASE_API_MODULE_READY',
    requiredActions: overrides.requiredActions || [],
  };
}

function createSyntheticHttpTarget(options = {}) {
  const routeHandlers = new Map();
  const registrations = [];

  function add(method, routePath, handler) {
    registrations.push({ method, path: routePath, handler });
    routeHandlers.set(`${method.toUpperCase()} ${routePath}`, handler);
  }

  return {
    registrations,
    post: options.withPost === false ? undefined : (routePath, handler) => {
      add('POST', routePath, handler);
    },
    register: options.withRegister ? (method, routePath, handler) => {
      add(method, routePath, handler);
    } : undefined,
    async dispatch(method, routePath, request) {
      const handler = routeHandlers.get(`${method.toUpperCase()} ${routePath}`);

      if (!handler) {
        return {
          ok: false,
          statusCode: 404,
          body: {
            ok: false,
            reasonCode: 'SYNTHETIC_ROUTE_NOT_FOUND',
            requiredActions: ['configure_route'],
          },
        };
      }

      try {
        const result = await handler(request);

        return {
          ok: result && result.ok === true,
          statusCode: result && result.statusCode ? result.statusCode : 200,
          body: result && result.body ? result.body : result,
        };
      } catch (error) {
        return {
          ok: false,
          statusCode: 500,
          body: {
            ok: false,
            reasonCode: 'SYNTHETIC_HANDLER_FAILED',
            requiredActions: ['retry_or_manual_review'],
          },
        };
      }
    },
  };
}

function requestLike() {
  return {
    params: {
      draftId: 'draft_task992',
    },
    body: {
      organizationId: 'org_task992',
      phoneNumber: '+886900000000',
      fullAddress: 'unsafe address',
      rawCustomerPayload: { name: 'unsafe customer' },
      tokenSecret: 'unsafe_secret',
    },
    context: {
      organizationId: 'org_task992',
      actorId: 'actor_task992',
      requestId: 'req_task992',
    },
  };
}

function assertNoForbiddenFields(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'finalAppointmentId',
    'final_appointment_id',
    'phoneNumber',
    'fullAddress',
    'rawAddress',
    'address',
    'rawCustomerPayload',
    'rawImportedRow',
    'customerPayload',
    'select *',
    'stack trace',
    'sql',
    'SQL',
    'rows',
    'credential',
    'authorization',
    'token',
    'secret',
    'lineAccessToken',
    'LINE access token',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('synthetic POST request reaches mounted Task967-style plan handler without global mount', async () => {
  const mountTarget = createSyntheticHttpTarget();
  const summary = mountRepairIntakeDraftToCaseApiModule({
    mountTarget,
    apiModule: task967ApiModule(),
  });

  assert.equal(summary.ok, true);
  assert.equal(summary.mounted, 2);
  assert.deepEqual(summary.routes, [
    {
      method: 'POST',
      path: '/repair-intake/drafts/:draftId/case/plan',
    },
    {
      method: 'POST',
      path: '/repair-intake/drafts/:draftId/case/submit',
    },
  ]);
  assertNoForbiddenFields(summary);

  const response = await mountTarget.dispatch(
    'POST',
    '/repair-intake/drafts/:draftId/case/plan',
    requestLike(),
  );

  assert.equal(response.ok, true);
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, {
    ok: true,
    action: 'repair_intake_draft_to_case_plan',
    draftId: 'draft_task992',
    organizationId: 'org_task992',
    reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_PLAN_READY',
    requiredActions: [],
  });
  assertNoForbiddenFields(response);
});

test('register-style synthetic target dispatches mounted submit handler', async () => {
  const mountTarget = createSyntheticHttpTarget({
    withPost: false,
    withRegister: true,
  });
  const summary = mountRepairIntakeDraftToCaseApiModule({
    mountTarget,
    apiModule: task967ApiModule(),
    basePath: '/internal/v1',
  });

  assert.equal(summary.ok, true);
  assert.deepEqual(summary.routes.map((route) => route.path), [
    '/internal/v1/repair-intake/drafts/:draftId/case/plan',
    '/internal/v1/repair-intake/drafts/:draftId/case/submit',
  ]);

  const response = await mountTarget.dispatch(
    'POST',
    '/internal/v1/repair-intake/drafts/:draftId/case/submit',
    requestLike(),
  );

  assert.equal(response.ok, true);
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body.caseRef, {
    id: 'case_task992',
    organizationId: 'org_task992',
    sourceDraftId: 'draft_task992',
    status: 'created',
  });
  assertNoForbiddenFields(response);
});

test('mount summary exposes only sanitized route metadata and not handler internals', () => {
  const mountTarget = createSyntheticHttpTarget();
  const summary = mountRepairIntakeDraftToCaseApiModule({
    mountTarget,
    apiModule: task967ApiModule(),
  });

  assert.equal(summary.ok, true);
  assert.deepEqual(Object.keys(summary.routes[0]).sort(), ['method', 'path']);
  assert.equal(Object.hasOwn(summary.routes[0], 'handler'), false);
  assert.equal(JSON.stringify(summary).includes('safePlanHandler'), false);
  assertNoForbiddenFields(summary);
});

test('missing mount target and unsupported target shape fail closed without mounting', () => {
  const missingTargetResult = mountRepairIntakeDraftToCaseApiModule({
    apiModule: task967ApiModule(),
  });

  assert.equal(missingTargetResult.ok, false);
  assert.equal(missingTargetResult.mounted, 0);
  assert.equal(
    missingTargetResult.reasonCode,
    'REPAIR_INTAKE_DRAFT_TO_CASE_HTTP_MOUNT_ADAPTER_TARGET_REQUIRED',
  );
  assertNoForbiddenFields(missingTargetResult);

  const unsupportedResult = mountRepairIntakeDraftToCaseApiModule({
    mountTarget: {},
    apiModule: task967ApiModule(),
  });

  assert.equal(unsupportedResult.ok, false);
  assert.equal(unsupportedResult.mounted, 0);
  assert.equal(
    unsupportedResult.reasonCode,
    'REPAIR_INTAKE_DRAFT_TO_CASE_HTTP_MOUNT_ADAPTER_TARGET_METHOD_REQUIRED',
  );
  assertNoForbiddenFields(unsupportedResult);
});

test('synthetic handler throw is converted to safe synthetic HTTP failure', async () => {
  const mountTarget = createSyntheticHttpTarget();
  const summary = mountRepairIntakeDraftToCaseApiModule({
    mountTarget,
    apiModule: task967ApiModule({
      planHandler: () => {
        throw new Error('raw SQL select * stack trace token secret phoneNumber fullAddress finalAppointmentId');
      },
    }),
  });

  assert.equal(summary.ok, true);
  assertNoForbiddenFields(summary);

  const response = await mountTarget.dispatch(
    'POST',
    '/repair-intake/drafts/:draftId/case/plan',
    requestLike(),
  );

  assert.equal(response.ok, false);
  assert.equal(response.statusCode, 500);
  assert.deepEqual(response.body, {
    ok: false,
    reasonCode: 'SYNTHETIC_HANDLER_FAILED',
    requiredActions: ['retry_or_manual_review'],
  });
  assertNoForbiddenFields(response);
});

test('behavior test does not require global route files or app server listen path', () => {
  const adapterSource = fs.readFileSync(ADAPTER_SOURCE_PATH, 'utf8');

  for (const relativePath of FORBIDDEN_GLOBAL_ROUTE_PATHS) {
    assert.equal(fs.existsSync(path.join(__dirname, relativePath)), true);
  }

  for (const forbidden of [
    'app.listen',
    'server.listen',
    'routes/index',
    'public.routes',
    'src/app',
    'src/server',
    'openapi',
    'swagger',
    'process.env',
    'dbClient',
    'databasePool',
    'lineAccessToken',
  ]) {
    assert.equal(adapterSource.includes(forbidden), false, `adapter source references ${forbidden}`);
  }
});
