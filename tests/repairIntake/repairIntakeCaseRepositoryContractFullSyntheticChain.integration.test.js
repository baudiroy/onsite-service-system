'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

const {
  createRepairIntakeDraftRepositoryContract,
} = require('../../src/repairIntake/repairIntakeDraftRepositoryContract');
const {
  createRepairIntakeCaseRepositoryContract,
} = require('../../src/repairIntake/repairIntakeCaseRepositoryContract');
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

const UNSAFE_DRAFT_ERROR_MESSAGE = [
  'SQL SELECT * FROM unsafe_task1082_draft_table',
  'DATABASE_URL=postgres://unsafe-task1082-draft',
  'phone +886900001082',
  'address unsafe task1082 draft address',
  'lineUserId unsafe_task1082_draft_line',
  'finalAppointmentId unsafe_task1082_final',
  'stack trace unsafe task1082 draft',
].join(' ');

const UNSAFE_CASE_ERROR_MESSAGE = [
  'SQL SELECT * FROM unsafe_task1082_case_table',
  'DATABASE_URL=postgres://unsafe-task1082-case',
  'phone +886900001082',
  'address unsafe task1082 case address',
  'customerName unsafe task1082 customer',
  'lineUserId unsafe_task1082_case_line',
  'lineAccessToken unsafe_task1082_case_line_token',
  'finalAppointmentId unsafe_task1082_final',
  'stack trace unsafe task1082 case',
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
      draftId: 'draft_task1082',
      phone: '+886900001082',
    },
    query: {
      preview: 'true',
      sql: 'SELECT * FROM unsafe_query_task1082',
    },
    body: {
      organizationId: 'org_task1082',
      tenantId: 'tenant_task1082',
      idempotencyKey: 'idem_task1082',
      permissionContext: {
        canCreateCaseFromRepairIntakeDraft: true,
      },
      approvalContext: {
        accepted: true,
      },
      phone: '+886900001082',
      address: 'unsafe task1082 address',
      customerName: 'unsafe task1082 customer',
      lineUserId: 'unsafe_task1082_line',
      lineAccessToken: 'unsafe_task1082_line_token',
      finalAppointmentId: 'unsafe_task1082_final',
      DATABASE_URL: 'postgres://unsafe-task1082',
    },
    context: {
      organizationId: 'org_task1082',
      actorId: 'actor_task1082',
      requestId: 'req_task1082',
      tenantId: 'tenant_task1082',
      lineUserId: 'unsafe_context_line_task1082',
    },
    organizationId: 'org_task1082',
    tenantId: 'tenant_task1082',
    requestId: 'req_task1082',
    actorId: 'actor_task1082',
    rawBody: 'unsafe raw body task1082',
    headers: {
      authorization: 'Bearer unsafe_task1082',
      cookie: 'unsafe_cookie_task1082=1',
    },
  };
}

function createRawDraftRepository(calls, options = {}) {
  return {
    findDraftForConversion: async (lookup) => {
      calls.push({ name: 'rawDraftRepository', payload: lookup });

      if (options.throwRead) {
        throw new Error(UNSAFE_DRAFT_ERROR_MESSAGE);
      }

      return {
        draftId: 'draft_task1082',
        organizationId: 'org_task1082',
        tenantId: 'tenant_task1082',
        status: 'ready',
        source: 'repair_intake',
        sourceRef: 'source_task1082',
        intakeSource: 'manual',
        summary: {
          title: 'safe draft summary task1082',
          phone: '+886900001082',
        },
        metadata: {
          safeKey: 'safe draft metadata task1082',
          rawRows: [{ phone: '+886900001082' }],
        },
        warnings: ['safe draft warning task1082'],
        rawRows: [{ phone: '+886900001082' }],
        sql: 'SELECT * FROM unsafe_draft_task1082',
        databaseUrl: 'postgres://unsafe-task1082-draft',
        authorization: 'Bearer unsafe_task1082',
        phone: '+886900001082',
        address: 'unsafe task1082 draft address',
        lineUserId: 'unsafe_task1082_draft_line',
        lineAccessToken: 'unsafe_task1082_draft_line_token',
        finalAppointmentId: 'unsafe_task1082_final',
        stack: 'unsafe task1082 draft stack',
        error: new Error(UNSAFE_DRAFT_ERROR_MESSAGE),
        repository: { unsafe: true },
      };
    },
  };
}

function createRawCaseRepository(calls, options = {}) {
  return {
    createCaseFromDraft: async (input) => {
      calls.push({ name: 'rawCaseRepository', payload: input });

      if (options.throwCreate) {
        throw new Error(UNSAFE_CASE_ERROR_MESSAGE);
      }

      if (options.rejectCreate) {
        return Promise.reject(new Error(UNSAFE_CASE_ERROR_MESSAGE));
      }

      return {
        caseId: 'case_task1082',
        caseRef: {
          caseId: 'case_task1082_ref',
          organizationId: 'org_task1082',
          finalAppointmentId: 'unsafe_task1082_final',
        },
        organizationId: 'org_task1082',
        tenantId: 'tenant_task1082',
        sourceDraftId: 'draft_task1082',
        status: 'created',
        source: 'repair_intake',
        summary: {
          title: 'safe case summary task1082',
          phone: '+886900001082',
        },
        metadata: {
          safeKey: 'safe case metadata task1082',
          rawRows: [{ phone: '+886900001082' }],
        },
        warnings: ['safe case warning task1082'],
        rawRows: [{ phone: '+886900001082' }],
        sql: 'SELECT * FROM unsafe_case_task1082',
        query: 'SELECT unsafe query task1082',
        paramsSql: ['unsafe param task1082'],
        db: 'unsafe db task1082',
        databaseUrl: 'postgres://unsafe-task1082-case',
        authorization: 'Bearer unsafe_task1082',
        phone: '+886900001082',
        address: 'unsafe task1082 case address',
        customerName: 'unsafe task1082 customer',
        lineUserId: 'unsafe_task1082_case_line',
        lineAccessToken: 'unsafe_task1082_case_line_token',
        finalAppointmentId: 'unsafe_task1082_final',
        stack: 'unsafe task1082 case stack',
        error: new Error(UNSAFE_CASE_ERROR_MESSAGE),
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
        draftId: 'draft_task1082',
        organizationId: 'org_task1082',
        tenantId: 'tenant_task1082',
        status: 'recorded',
        submitted: true,
        reasonCode: 'IDEMPOTENCY_RECORDED_TASK1082',
        requiredActions: ['stored'],
        recordId: 'record_task1082',
        result: input.result,
        rawRows: [{ phone: '+886900001082' }],
        finalAppointmentId: 'unsafe_task1082_final',
        stack: 'unsafe task1082 idempotency stack',
      };
    },
  };
}

function createPorts(calls, options = {}) {
  const draftRepositoryContract = createRepairIntakeDraftRepositoryContract({
    draftRepository: createRawDraftRepository(calls, options.rawDraftRepositoryOptions),
  });
  const caseRepositoryContract = createRepairIntakeCaseRepositoryContract({
    caseRepository: createRawCaseRepository(calls, options.rawCaseRepositoryOptions),
  });

  return {
    idempotencyStore: createIdempotencyStore(calls, options.idempotencyStoreOptions),
    draftRepository: draftRepositoryContract,
    caseRepository: caseRepositoryContract,
    planningPolicy: {
      planCaseFromDraft: async (payload) => {
        calls.push({ name: 'planningPolicy', payload });
        return {
          status: 'planned',
          reasonCode: 'PLAN_READY_TASK1082',
          requiredActions: ['prepare'],
          candidate: {
            sourceDraftId: 'draft_task1082',
            organizationId: 'org_task1082',
            tenantId: 'tenant_task1082',
            customerPhone: '+886900001082',
          },
          summary: {
            title: 'safe plan summary task1082',
            phone: '+886900001082',
          },
          rawRows: [{ phone: '+886900001082' }],
          finalAppointmentId: 'unsafe_task1082_final',
          lineUserId: 'unsafe_plan_line_task1082',
          token: 'unsafe_plan_token_task1082',
          stack: 'unsafe task1082 planner stack',
        };
      },
    },
    auditPort: {
      recordDraftToCaseDecision: async (payload) => {
        calls.push({ name: 'auditPort', payload });
        return {
          eventType: 'repair_intake_draft_to_case_decision',
          outcome: 'submitted',
          draftId: 'draft_task1082',
          organizationId: 'org_task1082',
          tenantId: 'tenant_task1082',
          caseId: 'case_task1082',
          reasonCode: 'AUDIT_RECORDED_TASK1082',
          requiredActions: [],
          metadata: {
            lineUserId: 'unsafe_audit_line_task1082',
            phone: '+886900001082',
            sql: 'SELECT * FROM unsafe_audit_task1082',
          },
          finalAppointmentId: 'unsafe_task1082_final',
          token: 'unsafe_audit_token_task1082',
          stack: 'unsafe task1082 audit stack',
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
    caseCreationPort: ports.caseRepository,
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
    'unsafe_task1082',
    'unsafe task1082',
    'unsafe_query_task1082',
    'unsafe_draft_task1082',
    'unsafe_case_task1082',
    'unsafe_audit_task1082',
    'postgres://unsafe-task1082',
    '+886900001082',
    'Bearer unsafe_task1082',
    'unsafe_cookie_task1082',
  ]) {
    assert.equal(serialized.includes(forbiddenText), false, `leaked ${forbiddenText}`);
  }
}

function assertSanitizedDraftLookup(lookup) {
  assert.deepEqual(lookup, {
    draftId: 'draft_task1082',
    organizationId: 'org_task1082',
    tenantId: 'tenant_task1082',
    requestId: 'req_task1082',
    actorId: 'actor_task1082',
  });
}

function assertSanitizedIdempotencyLookup(lookup) {
  assert.equal(lookup.idempotencyKey, 'idem_task1082');
  assert.equal(lookup.draftId, 'draft_task1082');
  assert.equal(lookup.organizationId, 'org_task1082');
  assert.equal(lookup.tenantId, 'tenant_task1082');
  assert.equal(lookup.requestId, 'req_task1082');
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

test('submit route no-existing uses draft and case contracts with sanitized payloads', async () => {
  const calls = [];
  const mountTarget = mountFullSyntheticChain(calls, { basePath: '/internal/v1' });

  const response = await mountTarget.dispatch(
    'POST',
    '/internal/v1/repair-intake/drafts/:draftId/case/submit',
    unsafeRequestLike(),
  );

  assert.deepEqual(calls.map((call) => call.name), [
    'idempotencyStore.find',
    'rawDraftRepository',
    'planningPolicy',
    'rawCaseRepository',
    'auditPort',
    'idempotencyStore.record',
  ]);
  assertSanitizedIdempotencyLookup(calls[0].payload);
  assertSanitizedDraftLookup(calls[1].payload);
  assert.equal(calls[2].payload.draft.reasonCode, 'REPAIR_INTAKE_DRAFT_REPOSITORY_CONTRACT_DRAFT_READY');
  assert.equal(calls[3].payload.draftId, 'draft_task1082');
  assert.equal(calls[3].payload.organizationId, 'org_task1082');
  assert.equal(calls[3].payload.tenantId, 'tenant_task1082');
  assert.equal(calls[3].payload.requestId, 'req_task1082');
  assert.equal(calls[3].payload.draft.summary.title, 'safe draft summary task1082');
  assert.equal(calls[3].payload.plan.reasonCode, 'PLAN_READY_TASK1082');
  assert.equal(calls[4].payload.decision, 'submitted');
  assert.equal(calls[5].payload.idempotencyKey, 'idem_task1082');
  assert.equal(calls[5].payload.result.reasonCode, 'REPAIR_INTAKE_CASE_REPOSITORY_CONTRACT_CASE_CREATED');
  assertNoUnsafeText(calls.map((call) => call.payload));

  assert.equal(response.ok, true);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.action, 'repair_intake_draft_to_case_submit');
  assert.equal(response.body.reasonCode, 'REPAIR_INTAKE_CASE_REPOSITORY_CONTRACT_CASE_CREATED');
  assert.equal(response.body.submitted, true);
  assert.equal(response.body.caseRef.id, 'case_task1082');
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
        draftId: 'draft_task1082',
        organizationId: 'org_task1082',
        tenantId: 'tenant_task1082',
        status: 'submitted',
        reasonCode: 'REPLAY_READY_TASK1082',
        plan: {
          status: 'planned',
          reasonCode: 'PLAN_READY_TASK1082',
          finalAppointmentId: 'unsafe_task1082_final',
          rawRows: [{ phone: '+886900001082' }],
          stack: 'unsafe task1082 replay plan stack',
        },
        caseRef: {
          id: 'case_task1082',
          organizationId: 'org_task1082',
          sourceDraftId: 'draft_task1082',
          status: 'created',
          finalAppointmentId: 'unsafe_task1082_final',
          stack: 'unsafe task1082 replay case stack',
        },
        auditEvent: {
          eventType: 'repair_intake_draft_to_case_decision',
          outcome: 'submitted',
          finalAppointmentId: 'unsafe_task1082_final',
          stack: 'unsafe task1082 replay audit stack',
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
  assert.equal(response.body.reasonCode, 'REPLAY_READY_TASK1082');
  assert.equal(response.body.caseRef.id, 'case_task1082');
  assertNoUnsafeText(response);
});

test('case repository contract failure remains sanitized through mounted submit route', async () => {
  for (const rawCaseRepositoryOptions of [{ throwCreate: true }, { rejectCreate: true }]) {
    const calls = [];
    const mountTarget = mountFullSyntheticChain(calls, { rawCaseRepositoryOptions });

    const response = await mountTarget.dispatch(
      'POST',
      '/repair-intake/drafts/:draftId/case/submit',
      unsafeRequestLike(),
    );

    assert.deepEqual(calls.map((call) => call.name), [
      'idempotencyStore.find',
      'rawDraftRepository',
      'planningPolicy',
      'rawCaseRepository',
      'auditPort',
      'idempotencyStore.record',
    ]);
    assertSanitizedDraftLookup(calls[1].payload);
    assert.equal(calls[3].payload.plan.reasonCode, 'PLAN_READY_TASK1082');
    assert.equal(calls[4].payload.caseRef.reasonCode, 'REPAIR_INTAKE_CASE_REPOSITORY_CONTRACT_CREATE_FAILED');
    assert.equal(response.body.status, 'failed');
    assert.equal(response.body.reasonCode, 'REPAIR_INTAKE_CASE_REPOSITORY_CONTRACT_CREATE_FAILED');
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

test('case repository full synthetic chain integration test avoids forbidden runtime coupling imports', () => {
  const source = fs.readFileSync(__filename, 'utf8');
  const sourceWithoutSelfCheck = stripTestBlock(
    source,
    'case repository full synthetic chain integration test avoids forbidden runtime coupling imports',
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
      `forbidden case full synthetic chain source marker ${forbidden}`,
    );
  }
});
