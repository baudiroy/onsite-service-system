'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  createRepairIntakeDraftToCaseInjectedRuntimeComposition,
} = require('../../src/repairIntake/repairIntakeDraftToCaseInjectedRuntimeComposer');

const SOURCE_PATH = path.resolve(
  __dirname,
  '../../src/repairIntake/repairIntakeDraftToCaseInjectedRuntimeComposer.js',
);

function createSyntheticMountTarget() {
  const routeHandlers = new Map();
  const registrations = [];

  function add(method, routePath, handler) {
    registrations.push({ method, path: routePath, handler });
    routeHandlers.set(`${method.toUpperCase()} ${routePath}`, handler);
  }

  return {
    registrations,
    post: (routePath, handler) => {
      add('POST', routePath, handler);
    },
    async dispatch(method, routePath, requestLike) {
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

      const response = await handler(requestLike);

      return {
        ok: response && response.ok === true,
        statusCode: response && response.statusCode,
        body: response && (response.body || response),
      };
    },
  };
}

function unsafeRequestLike() {
  return {
    params: {
      draftId: 'draft_task1051',
      phone: '+886900001051',
      lineUserId: 'unsafe_param_line_task1051',
    },
    query: {
      preview: 'true',
      sql: 'select * from unsafe_query_task1051',
    },
    body: {
      organizationId: 'org_task1051',
      tenantId: 'tenant_task1051',
      idempotencyKey: 'idem_task1051',
      permissionContext: {
        canCreateCaseFromRepairIntakeDraft: true,
      },
      approvalContext: {
        accepted: true,
      },
      phone: '+886900001051',
      address: 'unsafe address task1051',
      customerName: 'unsafe customer task1051',
      lineUserId: 'unsafe_line_task1051',
      lineAccessToken: 'unsafe_line_token_task1051',
      finalAppointmentId: 'unsafe_final_task1051',
      DATABASE_URL: 'postgres://unsafe_task1051',
    },
    context: {
      organizationId: 'org_task1051',
      actorId: 'actor_task1051',
      requestId: 'req_task1051',
      tenantId: 'tenant_task1051',
      lineUserId: 'unsafe_context_line_task1051',
    },
    organizationId: 'org_task1051',
    tenantId: 'tenant_task1051',
    requestId: 'req_task1051',
    actorId: 'actor_task1051',
    rawBody: 'unsafe raw body task1051',
    req: { unsafe: true },
    res: { unsafe: true },
    headers: {
      authorization: 'Bearer unsafe_task1051',
      cookie: 'unsafe_cookie_task1051=1',
    },
  };
}

function createSyntheticPorts(calls, options = {}) {
  return {
    idempotencyStore: {
      findExistingDraftToCaseResult: async (lookup) => {
        calls.push({ name: 'idempotencyStore.find', payload: lookup });
        return options.existingResult || null;
      },
      recordDraftToCaseResult: async (input) => {
        calls.push({ name: 'idempotencyStore.record', payload: input });
        return {
          ok: true,
          draftId: 'draft_task1051',
          organizationId: 'org_task1051',
          tenantId: 'tenant_task1051',
          status: 'recorded',
          submitted: true,
          reasonCode: 'IDEMPOTENCY_RECORDED_TASK1051',
          requiredActions: ['stored'],
          result: {
            ok: true,
            submitted: true,
            reasonCode: 'CASE_CREATED_TASK1051',
            caseRef: {
              id: 'case_task1051',
              organizationId: 'org_task1051',
              tenantId: 'tenant_task1051',
              status: 'created',
              finalAppointmentId: 'unsafe_final_task1051',
            },
            rawRows: [{ phone: '+886900001051' }],
            stack: 'unsafe_record_stack_task1051',
          },
        };
      },
    },
    draftRepository: {
      findDraftForConversion: async (lookup) => {
        calls.push({ name: 'draftRepository', payload: lookup });
        return {
          id: 'draft_task1051',
          organizationId: 'org_task1051',
          tenantId: 'tenant_task1051',
          status: 'ready',
          source: 'repair_intake',
          sourceRef: 'source_task1051',
          intakeSource: 'manual',
          reasonCode: 'DRAFT_READY_TASK1051',
          requiredActions: ['ready'],
          summary: {
            title: 'safe draft summary task1051',
            phone: '+886900001051',
          },
          phone: '+886900001051',
          address: 'unsafe address task1051',
          lineUserId: 'unsafe_draft_line_task1051',
          finalAppointmentId: 'unsafe_final_task1051',
          sql: 'select * from unsafe_draft_task1051',
          rawRows: [{ phone: '+886900001051' }],
          stack: 'unsafe_draft_stack_task1051',
        };
      },
    },
    planningPolicy: {
      planCaseFromDraft: async (payload) => {
        calls.push({ name: 'planningPolicy', payload });
        return {
          status: 'planned',
          reasonCode: 'PLAN_READY_TASK1051',
          requiredActions: ['prepare'],
          candidate: {
            sourceDraftId: 'draft_task1051',
            organizationId: 'org_task1051',
            tenantId: 'tenant_task1051',
            customerPhone: '+886900001051',
          },
          summary: {
            title: 'safe plan summary task1051',
            phone: '+886900001051',
          },
          rawRows: [{ phone: '+886900001051' }],
          finalAppointmentId: 'unsafe_final_task1051',
          lineUserId: 'unsafe_plan_line_task1051',
          token: 'unsafe_plan_token_task1051',
          stack: 'unsafe_plan_stack_task1051',
        };
      },
    },
    caseCreationPort: {
      createCaseFromDraft: async (payload) => {
        calls.push({ name: 'caseCreationPort', payload });
        return {
          id: 'case_task1051',
          organizationId: 'org_task1051',
          tenantId: 'tenant_task1051',
          sourceDraftId: 'draft_task1051',
          status: 'created',
          reasonCode: 'CASE_CREATED_TASK1051',
          requiredActions: ['created'],
          summary: {
            title: 'safe case summary task1051',
            phone: '+886900001051',
          },
          finalAppointmentId: 'unsafe_final_task1051',
          databaseUrl: 'postgres://unsafe_task1051',
          rawRows: [{ phone: '+886900001051' }],
          stack: 'unsafe_case_stack_task1051',
        };
      },
    },
    auditPort: {
      recordDraftToCaseDecision: async (payload) => {
        calls.push({ name: 'auditPort', payload });
        return {
          eventType: 'repair_intake_draft_to_case_decision',
          outcome: 'submitted',
          draftId: 'draft_task1051',
          organizationId: 'org_task1051',
          tenantId: 'tenant_task1051',
          caseId: 'case_task1051',
          reasonCode: 'AUDIT_RECORDED_TASK1051',
          requiredActions: [],
          metadata: {
            lineUserId: 'unsafe_audit_line_task1051',
            phone: '+886900001051',
            sql: 'select * from unsafe_audit_task1051',
          },
          finalAppointmentId: 'unsafe_final_task1051',
          token: 'unsafe_audit_token_task1051',
          stack: 'unsafe_audit_stack_task1051',
        };
      },
    },
  };
}

function collectKeys(value, keys = new Set()) {
  if (!value || typeof value !== 'object') {
    return keys;
  }

  for (const [key, fieldValue] of Object.entries(value)) {
    keys.add(key);
    collectKeys(fieldValue, keys);
  }

  return keys;
}

function assertNoUnsafeText(value) {
  const keys = collectKeys(value);

  for (const forbiddenKey of [
    'handler',
    'module',
    'port',
    'repository',
    'store',
    'req',
    'res',
    'headers',
    'cookie',
    'rawBody',
    'rawRows',
    'sql',
    'DATABASE_URL',
    'databaseUrl',
    'authorization',
    'phone',
    'address',
    'customerName',
    'lineUserId',
    'lineAccessToken',
    'finalAppointmentId',
    'token',
    'stack',
  ]) {
    assert.equal(keys.has(forbiddenKey), false, `forwarded unsafe key ${forbiddenKey}`);
  }

  const serialized = JSON.stringify(value);
  for (const forbiddenText of [
    '+886900001051',
    'select *',
    'postgres://',
    'unsafe_',
    'unsafe address task1051',
    'unsafe customer task1051',
    'unsafe_final_task1051',
    'unsafe_line_task1051',
    'unsafe raw body task1051',
    'Bearer unsafe_task1051',
    'finalAppointmentId',
    'lineAccessToken',
    'lineUserId',
    'DATABASE_URL',
    'databaseUrl',
    'rawRows',
    'stack',
    'token',
  ]) {
    assert.equal(serialized.includes(forbiddenText), false, `leaked ${forbiddenText}`);
  }
}

function assertCompositionSummaryOnlyHasSafeMetadata(summary) {
  assert.deepEqual(Object.keys(summary).sort(), [
    'components',
    'mounted',
    'ok',
    'reasonCode',
    'requiredActions',
    'routes',
  ]);

  for (const route of summary.routes) {
    assert.deepEqual(Object.keys(route).sort(), ['method', 'path']);
  }

  assertNoUnsafeText(summary);
}

test('composer fails closed when required injected ports are missing', () => {
  const summary = createRepairIntakeDraftToCaseInjectedRuntimeComposition({
    draftRepository: {
      findDraftForConversion: async () => ({}),
    },
    caseCreationPort: {},
    auditPort: {
      recordDraftToCaseDecision: async () => ({}),
    },
  });

  assert.equal(summary.ok, false);
  assert.equal(
    summary.reasonCode,
    'REPAIR_INTAKE_DRAFT_TO_CASE_RUNTIME_COMPOSER_PORTS_REQUIRED',
  );
  assert.deepEqual(summary.requiredActions, ['configure_injected_ports']);
  assertCompositionSummaryOnlyHasSafeMetadata(summary);
});

test('composer builds unmounted injected runtime summary without leaking raw components', () => {
  const calls = [];
  const ports = createSyntheticPorts(calls);
  const summary = createRepairIntakeDraftToCaseInjectedRuntimeComposition({
    draftRepository: ports.draftRepository,
    caseCreationPort: ports.caseCreationPort,
    auditPort: ports.auditPort,
  });

  assert.equal(summary.ok, true);
  assert.equal(
    summary.reasonCode,
    'REPAIR_INTAKE_DRAFT_TO_CASE_RUNTIME_COMPOSER_READY',
  );
  assert.equal(summary.mounted, 0);
  assert.equal(summary.components.idempotency, false);
  assert.equal(summary.components.draftReader, true);
  assert.equal(summary.components.casePlanner, true);
  assert.equal(summary.components.caseCreator, true);
  assert.equal(summary.components.auditWriter, true);
  assert.equal(summary.components.applicationService, true);
  assert.equal(summary.components.controller, true);
  assert.equal(summary.components.apiModule, true);
  assert.equal(summary.components.httpMount, false);
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
  assert.deepEqual(calls, []);
  assertCompositionSummaryOnlyHasSafeMetadata(summary);
});

test('composer mounts only on explicit target and exercises the injected runtime chain', async () => {
  const calls = [];
  const ports = createSyntheticPorts(calls);
  const mountTarget = createSyntheticMountTarget();
  const summary = createRepairIntakeDraftToCaseInjectedRuntimeComposition({
    idempotencyStore: ports.idempotencyStore,
    draftRepository: ports.draftRepository,
    planningPolicy: ports.planningPolicy,
    caseCreationPort: ports.caseCreationPort,
    auditPort: ports.auditPort,
    mountTarget,
    basePath: '/composer-local',
  });

  assert.equal(summary.ok, true);
  assert.equal(
    summary.reasonCode,
    'REPAIR_INTAKE_DRAFT_TO_CASE_RUNTIME_COMPOSER_MOUNTED',
  );
  assert.equal(summary.mounted, 2);
  assert.equal(summary.components.idempotency, true);
  assert.equal(summary.components.httpMount, true);
  assert.deepEqual(summary.routes, [
    {
      method: 'POST',
      path: '/composer-local/repair-intake/drafts/:draftId/case/plan',
    },
    {
      method: 'POST',
      path: '/composer-local/repair-intake/drafts/:draftId/case/submit',
    },
  ]);
  assert.equal(mountTarget.registrations.length, 2);
  assertCompositionSummaryOnlyHasSafeMetadata(summary);

  const planResponse = await mountTarget.dispatch(
    'POST',
    '/composer-local/repair-intake/drafts/:draftId/case/plan',
    unsafeRequestLike(),
  );

  assert.deepEqual(calls.map((call) => call.name), ['draftRepository', 'planningPolicy']);
  assert.equal(planResponse.ok, true);
  assert.equal(planResponse.body.reasonCode, 'PLAN_READY_TASK1051');
  assert.equal(planResponse.body.submitted, false);
  assertNoUnsafeText(planResponse);
  assertNoUnsafeText(calls.map((call) => call.payload));

  const submitStartIndex = calls.length;
  const submitResponse = await mountTarget.dispatch(
    'POST',
    '/composer-local/repair-intake/drafts/:draftId/case/submit',
    unsafeRequestLike(),
  );
  const submitCalls = calls.slice(submitStartIndex);

  assert.deepEqual(submitCalls.map((call) => call.name), [
    'idempotencyStore.find',
    'draftRepository',
    'planningPolicy',
    'caseCreationPort',
    'auditPort',
    'idempotencyStore.record',
  ]);
  assert.equal(submitResponse.ok, true);
  assert.equal(submitResponse.body.ok, true);
  assert.equal(submitResponse.body.reasonCode, 'CASE_CREATED_TASK1051');
  assert.equal(submitResponse.body.submitted, true);
  assert.equal(submitResponse.body.caseRef.id, 'case_task1051');
  assertNoUnsafeText(submitResponse);
  assertNoUnsafeText(submitCalls.map((call) => call.payload));
});

test('composer validates optional idempotency store and planning policy shapes', () => {
  const calls = [];
  const ports = createSyntheticPorts(calls);

  for (const options of [
    {
      idempotencyStore: {
        findExistingDraftToCaseResult: async () => null,
      },
    },
    {
      planningPolicy: {},
    },
  ]) {
    const summary = createRepairIntakeDraftToCaseInjectedRuntimeComposition({
      draftRepository: ports.draftRepository,
      caseCreationPort: ports.caseCreationPort,
      auditPort: ports.auditPort,
      ...options,
    });

    assert.equal(summary.ok, false);
    assert.equal(
      summary.reasonCode,
      'REPAIR_INTAKE_DRAFT_TO_CASE_RUNTIME_COMPOSER_PORTS_REQUIRED',
    );
    assertCompositionSummaryOnlyHasSafeMetadata(summary);
  }
});

test('composer source keeps internal runtime composition boundary', () => {
  const source = fs.readFileSync(SOURCE_PATH, 'utf8');

  for (const marker of [
    'createRepairIntakeIdempotencyPortAdapter',
    'createRepairIntakeDraftReaderPortAdapter',
    'createRepairIntakeCasePlannerPortAdapter',
    'createRepairIntakeCaseCreatorPortAdapter',
    'createRepairIntakeAuditWriterPortAdapter',
    'createRepairIntakeDraftToCaseApplicationService',
    'createRepairIntakeDraftToCaseController',
    'createRepairIntakeDraftToCaseApiModule',
    'mountRepairIntakeDraftToCaseApiModule',
    'createRepairIntakeDraftToCaseInjectedRuntimeComposition',
  ]) {
    assert.match(source, new RegExp(`\\b${marker}\\b`));
  }

  for (const forbidden of [
    "require('../app')",
    "require('../server')",
    "require('../routes')",
    "require('../controllers')",
    "require('../repositories')",
    "require('../db')",
    "require('../providers')",
    'express()',
    'app.listen',
    'server.listen',
    'fetch(',
    'axios',
    'process.env',
    'DATABASE_URL',
    'INSERT INTO',
    'UPDATE ',
    'DELETE FROM',
    'SELECT ',
    'new DraftRepository',
    'new CaseRepository',
    'Pool(',
    'pg',
    'knex',
    'sequelize',
    'mongoose',
    'sendLine',
    'sendSms',
    'sendEmail',
    'openai',
    'vector',
    'billing',
    'invoice',
    'payment',
  ]) {
    assert.equal(source.includes(forbidden), false, `forbidden source marker ${forbidden}`);
  }

  assert.doesNotMatch(source, /(^|[^'"])listen\(/, 'forbidden bare listen call');
});
