'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

const {
  createRepairIntakeDraftRepositoryContract,
} = require('../../src/repairIntake/repairIntakeDraftRepositoryContract');
const {
  createRepairIntakeDraftReaderPortAdapter,
} = require('../../src/repairIntake/repairIntakeDraftReaderPortAdapter');
const {
  createRepairIntakeCasePlannerPortAdapter,
} = require('../../src/repairIntake/repairIntakeCasePlannerPortAdapter');
const {
  createRepairIntakeCaseCreatorPortAdapter,
} = require('../../src/repairIntake/repairIntakeCaseCreatorPortAdapter');
const {
  createRepairIntakeAuditWriterPortAdapter,
} = require('../../src/repairIntake/repairIntakeAuditWriterPortAdapter');
const {
  createRepairIntakeIdempotencyPortAdapter,
} = require('../../src/repairIntake/repairIntakeIdempotencyPortAdapter');
const {
  createRepairIntakeDraftToCaseApplicationService,
} = require('../../src/repairIntake/repairIntakeDraftToCaseApplicationService');
const {
  createRepairIntakeDraftToCaseController,
} = require('../../src/repairIntake/repairIntakeDraftToCaseController');
const {
  createRepairIntakeDraftToCaseApiModule,
} = require('../../src/repairIntake/repairIntakeDraftToCaseApiModule');
const {
  mountRepairIntakeDraftToCaseApiModule,
} = require('../../src/repairIntake/repairIntakeDraftToCaseHttpMountAdapter');

const UNSAFE_ERROR_MESSAGE = [
  'SQL SELECT * FROM unsafe_task1076_table',
  'DATABASE_URL=postgres://unsafe-task1076',
  'phone +886900001076',
  'address unsafe task1076 address',
  'customerName unsafe task1076 customer',
  'lineUserId unsafe_task1076_line',
  'lineAccessToken unsafe_task1076_line_token',
  'finalAppointmentId unsafe_task1076_final',
  'stack trace unsafe task1076',
].join(' ');

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
      draftId: 'draft_task1076',
      phone: '+886900001076',
    },
    query: {
      preview: 'true',
      sql: 'SELECT * FROM unsafe_query_task1076',
    },
    body: {
      organizationId: 'org_task1076',
      tenantId: 'tenant_task1076',
      idempotencyKey: 'idem_task1076',
      permissionContext: {
        canCreateCaseFromRepairIntakeDraft: true,
      },
      approvalContext: {
        accepted: true,
      },
      phone: '+886900001076',
      address: 'unsafe task1076 address',
      customerName: 'unsafe task1076 customer',
      lineUserId: 'unsafe_task1076_line',
      lineAccessToken: 'unsafe_task1076_line_token',
      finalAppointmentId: 'unsafe_task1076_final',
      DATABASE_URL: 'postgres://unsafe-task1076',
    },
    context: {
      organizationId: 'org_task1076',
      actorId: 'actor_task1076',
      requestId: 'req_task1076',
      tenantId: 'tenant_task1076',
      lineUserId: 'unsafe_context_line_task1076',
    },
    organizationId: 'org_task1076',
    tenantId: 'tenant_task1076',
    requestId: 'req_task1076',
    actorId: 'actor_task1076',
    rawBody: 'unsafe raw body task1076',
    headers: {
      authorization: 'Bearer unsafe_task1076',
      cookie: 'unsafe_cookie_task1076=1',
    },
  };
}

function createRawRepository(calls, options = {}) {
  return {
    findDraftForConversion: async (lookup) => {
      calls.push({ name: 'rawRepository', payload: lookup });

      if (options.throwRead) {
        throw new Error(UNSAFE_ERROR_MESSAGE);
      }

      if (options.rejectRead) {
        return Promise.reject(new Error(UNSAFE_ERROR_MESSAGE));
      }

      return {
        draftId: 'draft_task1076',
        organizationId: 'org_task1076',
        tenantId: 'tenant_task1076',
        status: 'ready',
        source: 'repair_intake',
        sourceRef: 'source_task1076',
        intakeSource: 'manual',
        summary: {
          title: 'safe draft summary task1076',
          phone: '+886900001076',
        },
        metadata: {
          safeKey: 'safe draft metadata task1076',
          rawRows: [{ phone: '+886900001076' }],
        },
        warnings: ['safe draft warning task1076'],
        rawRows: [{ phone: '+886900001076' }],
        rawRow: { address: 'unsafe task1076 raw address' },
        sql: 'SELECT * FROM unsafe_draft_task1076',
        query: 'SELECT unsafe query task1076',
        paramsSql: ['unsafe param task1076'],
        db: 'unsafe db task1076',
        databaseUrl: 'postgres://unsafe-task1076',
        authorization: 'Bearer unsafe_task1076',
        phone: '+886900001076',
        address: 'unsafe task1076 address',
        customerName: 'unsafe task1076 customer',
        lineUserId: 'unsafe_task1076_line',
        lineAccessToken: 'unsafe_task1076_line_token',
        finalAppointmentId: 'unsafe_task1076_final',
        stack: 'unsafe task1076 draft stack',
        error: new Error(UNSAFE_ERROR_MESSAGE),
        repository: { unsafe: true },
        connection: { unsafe: true },
      };
    },
  };
}

function createIdempotencyStore(calls, options = {}) {
  return {
    findExistingDraftToCaseResult: async (lookup) => {
      calls.push({ name: 'idempotencyStore.find', payload: lookup });
      return options.existingResult || null;
    },
    recordDraftToCaseResult: async (input) => {
      calls.push({ name: 'idempotencyStore.record', payload: input });
      return {
        ok: true,
        draftId: 'draft_task1076',
        organizationId: 'org_task1076',
        tenantId: 'tenant_task1076',
        status: 'recorded',
        submitted: true,
        reasonCode: 'IDEMPOTENCY_RECORDED_TASK1076',
        requiredActions: ['stored'],
        recordId: 'record_task1076',
        result: input.result,
        rawRows: [{ phone: '+886900001076' }],
        finalAppointmentId: 'unsafe_task1076_final',
        stack: 'unsafe task1076 idempotency stack',
      };
    },
  };
}

function createPorts(calls, options = {}) {
  const repositoryContract = createRepairIntakeDraftRepositoryContract({
    draftRepository: createRawRepository(calls, options.rawRepositoryOptions),
  });

  return {
    idempotencyStore: createIdempotencyStore(calls, options.idempotencyStoreOptions),
    draftRepository: repositoryContract,
    planningPolicy: {
      planCaseFromDraft: async (payload) => {
        calls.push({ name: 'planningPolicy', payload });

        if (payload.draft && payload.draft.status === 'failed') {
          return {
            ok: false,
            status: 'failed',
            reasonCode: payload.draft.reasonCode,
            requiredActions: ['manual_review'],
            candidate: null,
            rawRows: [{ phone: '+886900001076' }],
            stack: 'unsafe task1076 planner stack',
          };
        }

        return {
          status: 'planned',
          reasonCode: 'PLAN_READY_TASK1076',
          requiredActions: ['prepare'],
          candidate: {
            sourceDraftId: 'draft_task1076',
            organizationId: 'org_task1076',
            tenantId: 'tenant_task1076',
            customerPhone: '+886900001076',
          },
          summary: {
            title: 'safe plan summary task1076',
            phone: '+886900001076',
          },
          rawRows: [{ phone: '+886900001076' }],
          finalAppointmentId: 'unsafe_task1076_final',
          lineUserId: 'unsafe_plan_line_task1076',
          token: 'unsafe_plan_token_task1076',
          stack: 'unsafe task1076 planner stack',
        };
      },
    },
    caseCreationPort: {
      createCaseFromDraft: async (payload) => {
        calls.push({ name: 'caseCreationPort', payload });
        return {
          id: 'case_task1076',
          organizationId: 'org_task1076',
          tenantId: 'tenant_task1076',
          sourceDraftId: 'draft_task1076',
          status: 'created',
          reasonCode: 'CASE_CREATED_TASK1076',
          requiredActions: ['created'],
          summary: {
            title: 'safe case summary task1076',
            phone: '+886900001076',
          },
          finalAppointmentId: 'unsafe_task1076_final',
          databaseUrl: 'postgres://unsafe-task1076',
          rawRows: [{ phone: '+886900001076' }],
          stack: 'unsafe task1076 case stack',
        };
      },
    },
    auditPort: {
      recordDraftToCaseDecision: async (payload) => {
        calls.push({ name: 'auditPort', payload });
        return {
          eventType: 'repair_intake_draft_to_case_decision',
          outcome: 'submitted',
          draftId: 'draft_task1076',
          organizationId: 'org_task1076',
          tenantId: 'tenant_task1076',
          caseId: 'case_task1076',
          reasonCode: 'AUDIT_RECORDED_TASK1076',
          requiredActions: [],
          metadata: {
            lineUserId: 'unsafe_audit_line_task1076',
            phone: '+886900001076',
            sql: 'SELECT * FROM unsafe_audit_task1076',
          },
          finalAppointmentId: 'unsafe_task1076_final',
          token: 'unsafe_audit_token_task1076',
          stack: 'unsafe task1076 audit stack',
        };
      },
    },
  };
}

function createFullSyntheticApiModule(calls, options = {}) {
  const ports = createPorts(calls, options);
  const idempotencyPort = createRepairIntakeIdempotencyPortAdapter({
    idempotencyStore: ports.idempotencyStore,
  });
  const draftReader = createRepairIntakeDraftReaderPortAdapter({
    draftRepository: ports.draftRepository,
  });
  const casePlanner = createRepairIntakeCasePlannerPortAdapter({
    planningPolicy: ports.planningPolicy,
  });
  const caseCreator = createRepairIntakeCaseCreatorPortAdapter({
    caseCreationPort: ports.caseCreationPort,
  });
  const auditWriter = createRepairIntakeAuditWriterPortAdapter({
    auditPort: ports.auditPort,
  });
  const applicationService = createRepairIntakeDraftToCaseApplicationService({
    draftReader,
    casePlanner,
    caseCreator,
    auditWriter,
    idempotencyPort,
  });
  const controller = createRepairIntakeDraftToCaseController({
    applicationService,
  });

  return createRepairIntakeDraftToCaseApiModule({ controller });
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
    'applicationService',
    'controller',
    'module',
    'port',
    'repository',
    'connection',
    'req',
    'res',
    'headers',
    'cookie',
    'rawBody',
    'rawRows',
    'rawRow',
    'raw',
    'sql',
    'query',
    'paramsSql',
    'db',
    'authorization',
    'customerName',
    'address',
    'phone',
    'lineUserId',
    'lineAccessToken',
    'finalAppointmentId',
    'databaseUrl',
    'DATABASE_URL',
    'stack',
    'token',
    'error',
  ]) {
    assert.equal(keys.has(forbiddenKey), false, `forwarded unsafe key ${forbiddenKey}`);
  }

  const serialized = JSON.stringify(value);

  for (const forbiddenText of [
    'SELECT *',
    'unsafe_task1076',
    'unsafe task1076',
    'unsafe_query_task1076',
    'unsafe_draft_task1076',
    'unsafe_audit_task1076',
    'postgres://unsafe-task1076',
    '+886900001076',
    'Bearer unsafe_task1076',
    'unsafe_cookie_task1076',
  ]) {
    assert.equal(serialized.includes(forbiddenText), false, `leaked ${forbiddenText}`);
  }
}

function assertSanitizedRawLookup(lookup) {
  assert.deepEqual(lookup, {
    draftId: 'draft_task1076',
    organizationId: 'org_task1076',
    tenantId: 'tenant_task1076',
    requestId: 'req_task1076',
    actorId: 'actor_task1076',
  });
}

function assertSanitizedIdempotencyLookup(lookup) {
  assert.equal(lookup.idempotencyKey, 'idem_task1076');
  assert.equal(lookup.draftId, 'draft_task1076');
  assert.equal(lookup.organizationId, 'org_task1076');
  assert.equal(lookup.tenantId, 'tenant_task1076');
  assert.equal(lookup.requestId, 'req_task1076');
  assertNoUnsafeText(lookup);
}

function mountFullSyntheticChain(calls, options = {}) {
  const mountTarget = createSyntheticMountTarget();
  const summary = mountRepairIntakeDraftToCaseApiModule({
    mountTarget,
    apiModule: createFullSyntheticApiModule(calls, options),
    basePath: options.basePath,
  });

  assert.equal(summary.ok, true);
  assert.equal(summary.mounted, 2);
  assertNoUnsafeText(summary.routes);

  return mountTarget;
}

test('plan route uses repository contract at draft boundary and returns sanitized plan', async () => {
  const calls = [];
  const mountTarget = mountFullSyntheticChain(calls);

  const response = await mountTarget.dispatch(
    'POST',
    '/repair-intake/drafts/:draftId/case/plan',
    unsafeRequestLike(),
  );

  assert.deepEqual(calls.map((call) => call.name), ['rawRepository', 'planningPolicy']);
  assertSanitizedRawLookup(calls[0].payload);
  assert.equal(calls[1].payload.draft.summary.title, 'safe draft summary task1076');
  assert.equal(calls[1].payload.draft.reasonCode, 'REPAIR_INTAKE_DRAFT_REPOSITORY_CONTRACT_DRAFT_READY');
  assertNoUnsafeText(calls.map((call) => call.payload));

  assert.equal(response.ok, true);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.action, 'repair_intake_draft_to_case_plan');
  assert.equal(response.body.reasonCode, 'PLAN_READY_TASK1076');
  assert.equal(response.body.submitted, false);
  assert.equal(response.body.caseRef, null);
  assertNoUnsafeText(response);
});

test('submit route no-existing uses full call order and sanitized inter-port payloads', async () => {
  const calls = [];
  const mountTarget = mountFullSyntheticChain(calls, { basePath: '/internal/v1' });

  const response = await mountTarget.dispatch(
    'POST',
    '/internal/v1/repair-intake/drafts/:draftId/case/submit',
    unsafeRequestLike(),
  );

  assert.deepEqual(calls.map((call) => call.name), [
    'idempotencyStore.find',
    'rawRepository',
    'planningPolicy',
    'caseCreationPort',
    'auditPort',
    'idempotencyStore.record',
  ]);
  assertSanitizedIdempotencyLookup(calls[0].payload);
  assertSanitizedRawLookup(calls[1].payload);
  assert.equal(calls[2].payload.draft.reasonCode, 'REPAIR_INTAKE_DRAFT_REPOSITORY_CONTRACT_DRAFT_READY');
  assert.equal(calls[3].payload.plan.reasonCode, 'PLAN_READY_TASK1076');
  assert.equal(calls[4].payload.decision, 'submitted');
  assert.equal(calls[5].payload.idempotencyKey, 'idem_task1076');
  assert.equal(calls[5].payload.result.reasonCode, 'CASE_CREATED_TASK1076');
  assertNoUnsafeText(calls.map((call) => call.payload));

  assert.equal(response.ok, true);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.action, 'repair_intake_draft_to_case_submit');
  assert.equal(response.body.reasonCode, 'CASE_CREATED_TASK1076');
  assert.equal(response.body.submitted, true);
  assert.equal(response.body.caseRef.id, 'case_task1076');
  assert.equal(response.body.auditEvent.eventType, 'repair_intake_draft_to_case_decision');
  assertNoUnsafeText(response);
});

test('submit route replay uses idempotency find only and returns sanitized replay', async () => {
  const calls = [];
  const mountTarget = mountFullSyntheticChain(calls, {
    idempotencyStoreOptions: {
      existingResult: {
        ok: true,
        submitted: true,
        draftId: 'draft_task1076',
        organizationId: 'org_task1076',
        tenantId: 'tenant_task1076',
        status: 'submitted',
        reasonCode: 'REPLAY_READY_TASK1076',
        plan: {
          status: 'planned',
          reasonCode: 'PLAN_READY_TASK1076',
          finalAppointmentId: 'unsafe_task1076_final',
          rawRows: [{ phone: '+886900001076' }],
          stack: 'unsafe task1076 replay plan stack',
        },
        caseRef: {
          id: 'case_task1076',
          organizationId: 'org_task1076',
          sourceDraftId: 'draft_task1076',
          status: 'created',
          finalAppointmentId: 'unsafe_task1076_final',
          stack: 'unsafe task1076 replay case stack',
        },
        auditEvent: {
          eventType: 'repair_intake_draft_to_case_decision',
          outcome: 'submitted',
          finalAppointmentId: 'unsafe_task1076_final',
          stack: 'unsafe task1076 replay audit stack',
        },
      },
    },
  });

  const response = await mountTarget.dispatch(
    'POST',
    '/repair-intake/drafts/:draftId/case/submit',
    unsafeRequestLike(),
  );

  assert.deepEqual(calls.map((call) => call.name), ['idempotencyStore.find']);
  assertSanitizedIdempotencyLookup(calls[0].payload);
  assert.equal(response.ok, true);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.idempotentReplay, true);
  assert.equal(response.body.reasonCode, 'REPLAY_READY_TASK1076');
  assert.equal(response.body.caseRef.id, 'case_task1076');
  assertNoUnsafeText(response);
});

test('repository contract read failure stays sanitized through mounted plan route', async () => {
  for (const rawRepositoryOptions of [{ throwRead: true }, { rejectRead: true }]) {
    const calls = [];
    const mountTarget = mountFullSyntheticChain(calls, { rawRepositoryOptions });

    const response = await mountTarget.dispatch(
      'POST',
      '/repair-intake/drafts/:draftId/case/plan',
      unsafeRequestLike(),
    );

    assert.deepEqual(calls.map((call) => call.name), ['rawRepository', 'planningPolicy']);
    assertSanitizedRawLookup(calls[0].payload);
    assert.equal(calls[1].payload.draft.status, 'failed');
    assert.equal(
      calls[1].payload.draft.reasonCode,
      'REPAIR_INTAKE_DRAFT_REPOSITORY_CONTRACT_READ_FAILED',
    );
    assert.equal(response.body.status, 'failed');
    assert.equal(response.body.reasonCode, 'REPAIR_INTAKE_DRAFT_REPOSITORY_CONTRACT_READ_FAILED');
    assertNoUnsafeText(calls.map((call) => call.payload));
    assertNoUnsafeText(response);
  }
});

function stripTestBlock(source, testName) {
  const marker = `test('${testName}'`;
  const start = source.indexOf(marker);

  if (start === -1) {
    return source;
  }

  const firstBrace = source.indexOf('{', start);

  if (firstBrace === -1) {
    return source;
  }

  let depth = 0;

  for (let index = firstBrace; index < source.length; index += 1) {
    const char = source[index];

    if (char === '{') {
      depth += 1;
    }

    if (char === '}') {
      depth -= 1;

      if (depth === 0) {
        const blockEnd = source.indexOf(');', index);
        const end = blockEnd === -1 ? index + 1 : blockEnd + 2;

        return `${source.slice(0, start)}${source.slice(end)}`;
      }
    }
  }

  return source;
}

test('full synthetic chain integration test avoids forbidden runtime coupling imports', () => {
  const source = fs.readFileSync(__filename, 'utf8');
  const sourceWithoutSelfCheck = stripTestBlock(
    source,
    'full synthetic chain integration test avoids forbidden runtime coupling imports',
  );

  for (const forbidden of [
    "require('../../src/app')",
    "require('../../src/server')",
    "require('../../src/routes')",
    "require('../../src/repositories')",
    "require('../../src/db')",
    'src/app',
    'src/server',
    'src/routes',
    'src/repositories',
    'src/db',
    'app.listen',
    'server.listen',
    'fetch(',
    'axios',
    'process.env',
    'sendLine',
    'sendSms',
    'sendEmail',
    'openai',
    'vector',
    'billing',
    'invoice',
    'payment',
  ]) {
    assert.equal(
      sourceWithoutSelfCheck.includes(forbidden),
      false,
      `forbidden full synthetic chain source marker ${forbidden}`,
    );
  }
});
