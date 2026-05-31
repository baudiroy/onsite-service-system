'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createRepairIntakeAuditWriterPortAdapter,
} = require('../../src/repairIntake/repairIntakeAuditWriterPortAdapter');
const {
  createRepairIntakeDraftCaseAuditWriterAdapter,
} = require('../../src/repairIntake/repairIntakeDraftCaseAuditWriterAdapter');
const {
  createRepairIntakeDraftToCaseApplicationService,
} = require('../../src/repairIntake/repairIntakeDraftToCaseApplicationService');

function baseCommand(overrides = {}) {
  return {
    draftId: 'draft_task2332_001',
    organizationId: 'org_task2332',
    tenantId: 'tenant_task2332',
    actorId: 'actor_task2332',
    requestId: 'request_task2332',
    idempotencyKey: 'idem_task2332',
    source: 'repair_intake_admin',
    body: {
      approvalContext: { accepted: true },
      permissionContext: { canCreateCaseFromRepairIntakeDraft: true },
    },
    ...overrides,
  };
}

function safeDraft(overrides = {}) {
  return {
    ok: true,
    id: 'draft_task2332_001',
    draftId: 'draft_task2332_001',
    organizationId: 'org_task2332',
    tenantId: 'tenant_task2332',
    status: 'ready_for_conversion',
    source: 'admin',
    summary: { title: 'safe repair intake draft' },
    ...overrides,
  };
}

function safePlan() {
  return {
    status: 'planned',
    candidate: { title: 'safe repair intake case candidate' },
    requiredActions: [],
  };
}

function safeCaseRef(overrides = {}) {
  return {
    ok: true,
    id: 'case_task2332_001',
    caseId: 'case_task2332_001',
    organizationId: 'org_task2332',
    tenantId: 'tenant_task2332',
    sourceDraftId: 'draft_task2332_001',
    status: 'submitted',
    reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_SUBMITTED',
    summary: {
      caseRef: 'case_ref_task2332_001',
    },
    ...overrides,
  };
}

function auditEventFromPortInput(input) {
  const caseRef = input.caseRef || {};

  return {
    eventType: 'repair_intake_draft_to_case_submission',
    outcome: 'submitted',
    decision: input.decision || 'submitted',
    draftId: input.draftId,
    organizationId: input.organizationId,
    tenantId: input.tenantId,
    actorId: input.actorId,
    actorType: input.actorRole || 'admin_user',
    requestId: input.requestId,
    idempotencyKey: input.idempotencyKey,
    source: input.source || (input.draft && input.draft.source),
    caseRef: {
      id: caseRef.id || caseRef.caseId,
      ref: caseRef.caseRef || (caseRef.summary && caseRef.summary.caseRef),
    },
    reasonCode: caseRef.reasonCode || 'REPAIR_INTAKE_DRAFT_TO_CASE_SUBMITTED',
    requiredActions: [],
  };
}

function createAuditWriter({ dbClient, calls }) {
  const persistenceWriter = createRepairIntakeDraftCaseAuditWriterAdapter({
    dbClient,
    idGenerator: () => 'audit_task2332_001',
    clock: () => '2026-05-31T00:00:00.000Z',
  });

  const auditPort = {
    recordDraftToCaseDecision: async (input) => {
      calls.auditPortInputs.push(input);

      return persistenceWriter.recordRepairIntakeDraftToCaseCreated({
        auditEvent: auditEventFromPortInput(input),
      });
    },
  };

  return createRepairIntakeAuditWriterPortAdapter({ auditPort });
}

function createService({ dbClient, calls }) {
  return createRepairIntakeDraftToCaseApplicationService({
    draftReader: {
      getDraftForConversion: async (input) => {
        calls.draftReaderInputs.push(input);
        return safeDraft();
      },
    },
    casePlanner: {
      planCaseFromDraft: async (input) => {
        calls.casePlannerInputs.push(input);
        return safePlan();
      },
    },
    caseCreator: {
      createCaseFromDraft: async (input) => {
        calls.caseCreatorInputs.push(input);
        return safeCaseRef();
      },
    },
    auditWriter: createAuditWriter({ dbClient, calls }),
  });
}

function createFakeDbClient(calls, options = {}) {
  return {
    insert: async (tableName, payload) => {
      calls.dbInserts.push({ tableName, payload });

      if (options.throwInsert) {
        throw new Error('select * stack trace providerPayload token secret phone address customerPayload');
      }

      if (options.rejectInsert) {
        return Promise.reject(new Error('select * stack trace providerPayload token secret'));
      }

      if (options.malformedResult) {
        return null;
      }

      return {
        ok: true,
        rows: [{
          rawRows: [{ phone: 'phone', address: 'address' }],
          sql: 'select * from unsafe',
          token: 'token',
          providerPayload: 'providerPayload',
        }],
      };
    },
  };
}

function createCalls() {
  return {
    auditPortInputs: [],
    caseCreatorInputs: [],
    casePlannerInputs: [],
    dbInserts: [],
    draftReaderInputs: [],
  };
}

function assertNoUnsafeText(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'select *',
    'stack trace',
    'providerPayload',
    'token',
    'password',
    'secret',
    'phone',
    'address',
    'customerPayload',
    'rawRows',
    'raw request body',
    'raw draft input',
    'openai',
    'vector',
    'billing',
    'settlement',
    'invoice',
    'payment',
    'private customer',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('successful application submit writes fake audit persistence payload aligned to repair_intake_audit_events', async () => {
  const calls = createCalls();
  const fakeDbClient = createFakeDbClient(calls);
  const service = createService({ dbClient: fakeDbClient, calls });
  const command = baseCommand();
  const commandSnapshot = JSON.stringify(command);
  const dependencySnapshot = JSON.stringify(fakeDbClient);

  const result = await service.submitDraftToCase(command);

  assert.equal(result.ok, true);
  assert.equal(result.auditEvent.eventType, 'repair_intake_draft_to_case_submission');
  assert.equal(result.auditEvent.organizationId, 'org_task2332');
  assert.equal(result.auditEvent.draftId, 'draft_task2332_001');
  assert.equal(calls.dbInserts.length, 1);
  assert.deepEqual(calls.dbInserts[0], {
    tableName: 'repair_intake_audit_events',
    payload: {
      id: 'audit_task2332_001',
      event_type: 'repair_intake_draft_to_case_submission',
      organization_id: 'org_task2332',
      tenant_id: 'tenant_task2332',
      draft_id: 'draft_task2332_001',
      case_id: 'case_task2332_001',
      case_ref: 'case_ref_task2332_001',
      actor_id: 'actor_task2332',
      actor_type: 'admin_user',
      request_id: 'request_task2332',
      decision: 'submitted',
      outcome: 'submitted',
      reason_code: 'REPAIR_INTAKE_DRAFT_TO_CASE_SUBMITTED',
      safe_metadata: {},
      visibility: 'internal_only',
      occurred_at: '2026-05-31T00:00:00.000Z',
    },
  });
  assert.equal(JSON.stringify(command), commandSnapshot);
  assert.equal(JSON.stringify(fakeDbClient), dependencySnapshot);
  assertNoUnsafeText(result);
});

test('missing organization and malformed event contract fail closed before fake DB call', async () => {
  for (const auditEvent of [
    auditEventFromPortInput({ ...baseCommand(), organizationId: '' }),
    { ...auditEventFromPortInput(baseCommand()), eventType: 'unexpected_event' },
    { ...auditEventFromPortInput(baseCommand()), outcome: 'unexpected_outcome' },
  ]) {
    const calls = createCalls();
    const writer = createRepairIntakeDraftCaseAuditWriterAdapter({
      dbClient: createFakeDbClient(calls),
      idGenerator: () => 'audit_task2332_001',
    });

    const result = await writer.recordRepairIntakeDraftToCaseCreated({ auditEvent });

    assert.equal(result.ok, false);
    assert.equal(result.status, 'blocked');
    assert.equal(calls.dbInserts.length, 0);
    assertNoUnsafeText(result);
  }
});

test('fake DB thrown rejected and malformed results fail closed through application submit without raw leakage', async () => {
  for (const options of [
    { throwInsert: true },
    { rejectInsert: true },
    { malformedResult: true },
  ]) {
    const calls = createCalls();
    const service = createService({
      dbClient: createFakeDbClient(calls, options),
      calls,
    });
    const fakeResultSnapshot = JSON.stringify(calls);

    const result = await service.submitDraftToCase(baseCommand());

    assert.equal(result.ok, false);
    assert.equal(result.status, 'failed');
    assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_SUBMIT_FAILED');
    assert.equal(calls.dbInserts.length, 1);
    assertNoUnsafeText(result);
    assertNoUnsafeText(calls.auditPortInputs);
    assert.equal(JSON.stringify(calls).includes('select * stack trace'), false);
    assert.notEqual(JSON.stringify(calls), fakeResultSnapshot);
  }
});

test('unsafe audit context values are stripped before fake persistence payload and inputs remain immutable', async () => {
  const calls = createCalls();
  const service = createService({
    dbClient: createFakeDbClient(calls),
    calls,
  });
  const command = baseCommand({
    requestId: "request_task2332'; select * from field_service_reports; --",
    idempotencyKey: 'idem_task2332_providerPayload_token_secret',
    source: 'openai vector billing',
    body: {
      approvalContext: { accepted: true },
      permissionContext: { canCreateCaseFromRepairIntakeDraft: true },
      rawBody: 'raw request body',
      draftInput: 'raw draft input',
      providerPayload: 'providerPayload',
      token: 'token',
      customerAddress: 'private customer address',
    },
  });
  const snapshot = JSON.stringify(command);

  const result = await service.submitDraftToCase(command);

  assert.equal(result.ok, true);
  assert.equal(calls.dbInserts[0].payload.request_id, null);
  assert.deepEqual(calls.dbInserts[0].payload.safe_metadata, {});
  assert.equal(JSON.stringify(command), snapshot);
  assertNoUnsafeText(calls.dbInserts[0]);
  assertNoUnsafeText(result);
});
