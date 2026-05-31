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
  createRepairIntakeIdempotencyRepositoryContract,
} = require('../../src/repairIntake/repairIntakeIdempotencyRepositoryContract');
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
  'SQL SELECT * FROM unsafe_task1088_draft_table',
  'DATABASE_URL=postgres://unsafe-task1088-draft',
  'phone +886900001088',
  'address unsafe task1088 draft address',
  'lineUserId unsafe_task1088_draft_line',
  'finalAppointmentId unsafe_task1088_final',
  'stack trace unsafe task1088 draft',
].join(' ');

const UNSAFE_CASE_ERROR_MESSAGE = [
  'SQL SELECT * FROM unsafe_task1088_case_table',
  'DATABASE_URL=postgres://unsafe-task1088-case',
  'phone +886900001088',
  'address unsafe task1088 case address',
  'customerName unsafe task1088 customer',
  'lineUserId unsafe_task1088_case_line',
  'lineAccessToken unsafe_task1088_case_line_token',
  'finalAppointmentId unsafe_task1088_final',
  'stack trace unsafe task1088 case',
].join(' ');

const UNSAFE_IDEMPOTENCY_ERROR_MESSAGE = [
  'SQL SELECT * FROM unsafe_task1088_idempotency_table',
  'DATABASE_URL=postgres://unsafe-task1088-idempotency',
  'phone +886900001088',
  'address unsafe task1088 idempotency address',
  'customerName unsafe task1088 customer',
  'lineUserId unsafe_task1088_idempotency_line',
  'lineAccessToken unsafe_task1088_idempotency_line_token',
  'finalAppointmentId unsafe_task1088_final',
  'stack trace unsafe task1088 idempotency',
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
    post: (routePath, handler) => add('POST', routePath, handler),
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
      draftId: 'draft_task1088',
      phone: '+886900001088',
    },
    query: {
      preview: 'true',
      sql: 'SELECT * FROM unsafe_query_task1088',
    },
    body: {
      organizationId: 'org_task1088',
      tenantId: 'tenant_task1088',
      idempotencyKey: 'idem_task1088',
      permissionContext: {
        canCreateCaseFromRepairIntakeDraft: true,
      },
      approvalContext: {
        accepted: true,
      },
      phone: '+886900001088',
      address: 'unsafe task1088 address',
      customerName: 'unsafe task1088 customer',
      lineUserId: 'unsafe_task1088_line',
      lineAccessToken: 'unsafe_task1088_line_token',
      finalAppointmentId: 'unsafe_task1088_final',
      DATABASE_URL: 'postgres://unsafe-task1088',
    },
    context: {
      organizationId: 'org_task1088',
      actorId: 'actor_task1088',
      requestId: 'req_task1088',
      tenantId: 'tenant_task1088',
      lineUserId: 'unsafe_context_line_task1088',
    },
    organizationId: 'org_task1088',
    tenantId: 'tenant_task1088',
    requestId: 'req_task1088',
    actorId: 'actor_task1088',
    rawBody: 'unsafe raw body task1088',
    headers: {
      authorization: 'Bearer unsafe_task1088',
      cookie: 'unsafe_cookie_task1088=1',
    },
  };
}

function createRawDraftRepository(calls) {
  return {
    findDraftForConversion: async (lookup) => {
      calls.push({ name: 'rawDraftRepository', payload: lookup });

      return {
        draftId: 'draft_task1088',
        organizationId: 'org_task1088',
        tenantId: 'tenant_task1088',
        status: 'ready',
        source: 'repair_intake',
        sourceRef: 'source_task1088',
        intakeSource: 'manual',
        summary: {
          title: 'safe draft summary task1088',
          phone: '+886900001088',
        },
        metadata: {
          safeKey: 'safe draft metadata task1088',
          rawRows: [{ phone: '+886900001088' }],
        },
        warnings: ['safe draft warning task1088'],
        rawRows: [{ phone: '+886900001088' }],
        sql: 'SELECT * FROM unsafe_draft_task1088',
        databaseUrl: 'postgres://unsafe-task1088-draft',
        authorization: 'Bearer unsafe_task1088',
        phone: '+886900001088',
        address: 'unsafe task1088 draft address',
        lineUserId: 'unsafe_task1088_draft_line',
        lineAccessToken: 'unsafe_task1088_draft_line_token',
        finalAppointmentId: 'unsafe_task1088_final',
        stack: 'unsafe task1088 draft stack',
        error: new Error(UNSAFE_DRAFT_ERROR_MESSAGE),
        repository: { unsafe: true },
      };
    },
  };
}

function createRawCaseRepository(calls) {
  return {
    createCaseFromDraft: async (input) => {
      calls.push({ name: 'rawCaseRepository', payload: input });

      return {
        caseId: 'case_task1088',
        caseRef: {
          caseId: 'case_task1088_ref',
          organizationId: 'org_task1088',
          finalAppointmentId: 'unsafe_task1088_final',
        },
        organizationId: 'org_task1088',
        tenantId: 'tenant_task1088',
        sourceDraftId: 'draft_task1088',
        status: 'created',
        source: 'repair_intake',
        summary: {
          title: 'safe case summary task1088',
          phone: '+886900001088',
        },
        metadata: {
          safeKey: 'safe case metadata task1088',
          rawRows: [{ phone: '+886900001088' }],
        },
        warnings: ['safe case warning task1088'],
        rawRows: [{ phone: '+886900001088' }],
        sql: 'SELECT * FROM unsafe_case_task1088',
        query: 'SELECT unsafe query task1088',
        paramsSql: ['unsafe param task1088'],
        db: 'unsafe db task1088',
        databaseUrl: 'postgres://unsafe-task1088-case',
        authorization: 'Bearer unsafe_task1088',
        phone: '+886900001088',
        address: 'unsafe task1088 case address',
        customerName: 'unsafe task1088 customer',
        lineUserId: 'unsafe_task1088_case_line',
        lineAccessToken: 'unsafe_task1088_case_line_token',
        finalAppointmentId: 'unsafe_task1088_final',
        stack: 'unsafe task1088 case stack',
        error: new Error(UNSAFE_CASE_ERROR_MESSAGE),
        repository: { unsafe: true },
        connection: { unsafe: true },
      };
    },
  };
}

function createRawIdempotencyRepository(calls, options = {}) {
  return {
    findExistingDraftToCaseResult: async (lookup) => {
      calls.push({ name: 'rawIdempotencyFind', payload: lookup });

      if (options.throwFind) {
        throw new Error(UNSAFE_IDEMPOTENCY_ERROR_MESSAGE);
      }

      if (options.rejectFind) {
        return Promise.reject(new Error(UNSAFE_IDEMPOTENCY_ERROR_MESSAGE));
      }

      if (options.existingResult) {
        return options.existingResult;
      }

      return null;
    },
    recordDraftToCaseResult: async (input) => {
      calls.push({ name: 'rawIdempotencyRecord', payload: input });

      if (options.throwRecord) {
        throw new Error(UNSAFE_IDEMPOTENCY_ERROR_MESSAGE);
      }

      if (options.rejectRecord) {
        return Promise.reject(new Error(UNSAFE_IDEMPOTENCY_ERROR_MESSAGE));
      }

      return {
        ok: true,
        action: 'repair_intake_draft_to_case_submit',
        recordId: 'record_task1088',
        idempotencyKey: 'idem_task1088',
        draftId: 'draft_task1088',
        organizationId: 'org_task1088',
        tenantId: 'tenant_task1088',
        requestId: 'req_task1088',
        status: 'recorded',
        submitted: true,
        reasonCode: 'RECORDED_TASK1088',
        requiredActions: ['stored'],
        result: input.result,
        caseRef: {
          id: 'case_task1088',
          sourceDraftId: 'draft_task1088',
          organizationId: 'org_task1088',
          status: 'created',
          finalAppointmentId: 'unsafe_task1088_final',
        },
        metadata: {
          safeKey: 'safe idempotency record metadata task1088',
          rawRows: [{ phone: '+886900001088' }],
        },
        rawRows: [{ phone: '+886900001088' }],
        sql: 'SELECT * FROM unsafe_idempotency_record_task1088',
        databaseUrl: 'postgres://unsafe-task1088-idempotency',
        authorization: 'Bearer unsafe_task1088',
        phone: '+886900001088',
        address: 'unsafe task1088 idempotency address',
        customerName: 'unsafe task1088 customer',
        lineUserId: 'unsafe_task1088_idempotency_line',
        lineAccessToken: 'unsafe_task1088_idempotency_line_token',
        finalAppointmentId: 'unsafe_task1088_final',
        stack: 'unsafe idempotency record stack task1088',
        error: new Error(UNSAFE_IDEMPOTENCY_ERROR_MESSAGE),
        repository: { unsafe: true },
      };
    },
  };
}

function createPorts(calls, options = {}) {
  const draftRepositoryContract = createRepairIntakeDraftRepositoryContract({
    draftRepository: createRawDraftRepository(calls),
  });
  const caseRepositoryContract = createRepairIntakeCaseRepositoryContract({
    caseRepository: createRawCaseRepository(calls),
  });
  const idempotencyRepositoryContract = createRepairIntakeIdempotencyRepositoryContract({
    idempotencyRepository: createRawIdempotencyRepository(calls, options.rawIdempotencyOptions),
  });

  return {
    idempotencyStore: idempotencyRepositoryContract,
    draftRepository: draftRepositoryContract,
    caseRepository: caseRepositoryContract,
    planningPolicy: {
      planCaseFromDraft: async (payload) => {
        calls.push({ name: 'planningPolicy', payload });
        return {
          status: 'planned',
          reasonCode: 'PLAN_READY_TASK1088',
          requiredActions: ['prepare'],
          candidate: {
            sourceDraftId: 'draft_task1088',
            organizationId: 'org_task1088',
            tenantId: 'tenant_task1088',
            customerPhone: '+886900001088',
          },
          summary: {
            title: 'safe plan summary task1088',
            phone: '+886900001088',
          },
          rawRows: [{ phone: '+886900001088' }],
          finalAppointmentId: 'unsafe_task1088_final',
          lineUserId: 'unsafe_plan_line_task1088',
          token: 'unsafe_plan_token_task1088',
          stack: 'unsafe task1088 planner stack',
        };
      },
    },
    auditPort: {
      recordDraftToCaseDecision: async (payload) => {
        calls.push({ name: 'auditPort', payload });
        return {
          eventType: 'repair_intake_draft_to_case_decision',
          outcome: 'submitted',
          draftId: 'draft_task1088',
          organizationId: 'org_task1088',
          tenantId: 'tenant_task1088',
          caseId: 'case_task1088',
          reasonCode: 'AUDIT_RECORDED_TASK1088',
          requiredActions: [],
          metadata: {
            lineUserId: 'unsafe_audit_line_task1088',
            phone: '+886900001088',
            sql: 'SELECT * FROM unsafe_audit_task1088',
          },
          finalAppointmentId: 'unsafe_task1088_final',
          token: 'unsafe_audit_token_task1088',
          stack: 'unsafe task1088 audit stack',
        };
      },
    },
  };
}

function createFullSyntheticApiModule(calls, options = {}) {
  const ports = createPorts(calls, options);
  const idempotencyStore = {
    ...ports.idempotencyStore,
    recordDraftToCaseResult: (input) => ports.idempotencyStore.recordDraftToCaseResult({
      ...input,
      safeRequestFingerprint: input.safeRequestFingerprint || 'fingerprint_task1088',
    }),
  };
  const idempotencyPort = createRepairIntakeIdempotencyPortAdapter({
    idempotencyStore,
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
    'unsafe_task1088',
    'unsafe task1088',
    'unsafe_query_task1088',
    'unsafe_draft_task1088',
    'unsafe_case_task1088',
    'unsafe_audit_task1088',
    'unsafe_idempotency',
    'postgres://unsafe-task1088',
    '+886900001088',
    'Bearer unsafe_task1088',
    'unsafe_cookie_task1088',
  ]) {
    assert.equal(serialized.includes(forbiddenText), false, `leaked ${forbiddenText}`);
  }
}

function assertSanitizedDraftLookup(lookup) {
  assert.deepEqual(lookup, {
    draftId: 'draft_task1088',
    organizationId: 'org_task1088',
    tenantId: 'tenant_task1088',
    requestId: 'req_task1088',
    actorId: 'actor_task1088',
  });
}

function assertSanitizedIdempotencyLookup(lookup) {
  assert.deepEqual(lookup, {
    idempotencyKey: 'idem_task1088',
    draftId: 'draft_task1088',
    organizationId: 'org_task1088',
    tenantId: 'tenant_task1088',
    requestId: 'req_task1088',
  });
}

function assertSanitizedIdempotencyRecord(recordInput) {
  assert.equal(recordInput.idempotencyKey, 'idem_task1088');
  assert.equal(recordInput.draftId, 'draft_task1088');
  assert.equal(recordInput.organizationId, 'org_task1088');
  assert.equal(recordInput.tenantId, 'tenant_task1088');
  assert.equal(recordInput.requestId, 'req_task1088');
  assert.equal(recordInput.result.reasonCode, 'REPAIR_INTAKE_CASE_REPOSITORY_CONTRACT_CASE_CREATED');
  assert.equal(recordInput.result.caseRef.id, 'case_task1088');
  assert.equal(recordInput.result.plan.reasonCode, 'PLAN_READY_TASK1088');
  assert.equal(recordInput.result.auditEvent.reasonCode, 'AUDIT_RECORDED_TASK1088');
  assertNoUnsafeText(recordInput);
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

test('submit route no-existing uses idempotency, draft, and case contracts with sanitized payloads', async () => {
  const calls = [];
  const mountTarget = mountFullSyntheticChain(calls, { basePath: '/internal/v1' });

  const response = await mountTarget.dispatch(
    'POST',
    '/internal/v1/repair-intake/drafts/:draftId/case/submit',
    unsafeRequestLike(),
  );

  assert.deepEqual(calls.map((call) => call.name), [
    'rawIdempotencyFind',
    'rawDraftRepository',
    'planningPolicy',
    'rawCaseRepository',
    'auditPort',
    'rawIdempotencyRecord',
  ]);
  assertSanitizedIdempotencyLookup(calls[0].payload);
  assertSanitizedDraftLookup(calls[1].payload);
  assert.equal(calls[2].payload.draft.reasonCode, 'REPAIR_INTAKE_DRAFT_REPOSITORY_CONTRACT_DRAFT_READY');
  assert.equal(calls[3].payload.draftId, 'draft_task1088');
  assert.equal(calls[3].payload.organizationId, 'org_task1088');
  assert.equal(calls[3].payload.tenantId, 'tenant_task1088');
  assert.equal(calls[3].payload.requestId, 'req_task1088');
  assert.equal(calls[3].payload.draft.summary.title, 'safe draft summary task1088');
  assert.equal(calls[3].payload.plan.reasonCode, 'PLAN_READY_TASK1088');
  assert.equal(calls[4].payload.decision, 'submitted');
  assertSanitizedIdempotencyRecord(calls[5].payload);
  assert.equal(calls[5].payload.result.reasonCode, 'REPAIR_INTAKE_CASE_REPOSITORY_CONTRACT_CASE_CREATED');
  assertNoUnsafeText(calls.map((call) => call.payload));

  assert.equal(response.ok, true);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.action, 'repair_intake_draft_to_case_submit');
  assert.equal(response.body.reasonCode, 'REPAIR_INTAKE_CASE_REPOSITORY_CONTRACT_CASE_CREATED');
  assert.equal(response.body.submitted, true);
  assert.equal(response.body.caseRef.id, 'case_task1088');
  assert.equal(response.body.auditEvent.eventType, 'repair_intake_draft_to_case_decision');
  assertNoUnsafeText(response);
});

test('submit route replay uses raw idempotency find only and returns sanitized replay', async () => {
  const calls = [];
  const mountTarget = mountFullSyntheticChain(calls, {
    rawIdempotencyOptions: {
      existingResult: {
        ok: true,
        action: 'repair_intake_draft_to_case_submit',
        draftId: 'draft_task1088',
        organizationId: 'org_task1088',
        tenantId: 'tenant_task1088',
        status: 'submitted',
        submitted: true,
        reasonCode: 'REPLAY_READY_TASK1088',
        requiredActions: ['noop'],
        plan: {
          status: 'planned',
          reasonCode: 'PLAN_READY_TASK1088',
          finalAppointmentId: 'unsafe_task1088_final',
          rawRows: [{ phone: '+886900001088' }],
          stack: 'unsafe task1088 replay plan stack',
        },
        caseRef: {
          id: 'case_task1088',
          organizationId: 'org_task1088',
          sourceDraftId: 'draft_task1088',
          status: 'created',
          finalAppointmentId: 'unsafe_task1088_final',
          stack: 'unsafe task1088 replay case stack',
        },
        auditEvent: {
          eventType: 'repair_intake_draft_to_case_decision',
          outcome: 'submitted',
          finalAppointmentId: 'unsafe_task1088_final',
          stack: 'unsafe task1088 replay audit stack',
        },
      },
    },
  });

  const response = await mountTarget.dispatch(
    'POST',
    '/repair-intake/drafts/:draftId/case/submit',
    unsafeRequestLike(),
  );

  assert.deepEqual(calls.map((call) => call.name), ['rawIdempotencyFind']);
  assertSanitizedIdempotencyLookup(calls[0].payload);
  assert.equal(response.ok, true);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.idempotentReplay, true);
  assert.equal(response.body.reasonCode, 'REPLAY_READY_TASK1088');
  assert.equal(response.body.caseRef.id, 'case_task1088');
  assertNoUnsafeText(response);
});

test('idempotency find failure remains sanitized and falls through as safe no-existing behavior', async () => {
  for (const rawIdempotencyOptions of [{ throwFind: true }, { rejectFind: true }]) {
    const calls = [];
    const mountTarget = mountFullSyntheticChain(calls, { rawIdempotencyOptions });

    const response = await mountTarget.dispatch(
      'POST',
      '/repair-intake/drafts/:draftId/case/submit',
      unsafeRequestLike(),
    );

    assert.deepEqual(calls.map((call) => call.name), [
      'rawIdempotencyFind',
      'rawDraftRepository',
      'planningPolicy',
      'rawCaseRepository',
      'auditPort',
      'rawIdempotencyRecord',
    ]);
    assertSanitizedIdempotencyLookup(calls[0].payload);
    assert.equal(response.ok, true);
    assert.equal(response.body.reasonCode, 'REPAIR_INTAKE_CASE_REPOSITORY_CONTRACT_CASE_CREATED');
    assertNoUnsafeText(calls.map((call) => call.payload));
    assertNoUnsafeText(response);
  }
});

test('idempotency record failure remains sanitized and does not leak through mounted submit', async () => {
  for (const rawIdempotencyOptions of [{ throwRecord: true }, { rejectRecord: true }]) {
    const calls = [];
    const mountTarget = mountFullSyntheticChain(calls, { rawIdempotencyOptions });

    const response = await mountTarget.dispatch(
      'POST',
      '/repair-intake/drafts/:draftId/case/submit',
      unsafeRequestLike(),
    );

    assert.deepEqual(calls.map((call) => call.name), [
      'rawIdempotencyFind',
      'rawDraftRepository',
      'planningPolicy',
      'rawCaseRepository',
      'auditPort',
      'rawIdempotencyRecord',
    ]);
    assertSanitizedIdempotencyRecord(calls[5].payload);
    assert.equal(response.ok, true);
    assert.equal(response.body.reasonCode, 'REPAIR_INTAKE_CASE_REPOSITORY_CONTRACT_CASE_CREATED');
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

test('idempotency repository full synthetic chain integration test avoids forbidden runtime coupling imports', () => {
  const source = fs.readFileSync(__filename, 'utf8');
  const sourceWithoutSelfCheck = stripTestBlock(
    source,
    'idempotency repository full synthetic chain integration test avoids forbidden runtime coupling imports',
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
      `forbidden idempotency full synthetic chain source marker ${forbidden}`,
    );
  }
});
