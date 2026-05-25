'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createRepairIntakeDraftToCaseApplicationService,
} = require('../../src/repairIntake/repairIntakeDraftToCaseApplicationService');

function unsafeInput() {
  return {
    draftId: 'draft_task1018_top',
    organizationId: 'org_task1018_top',
    actorId: 'actor_task1018_top',
    requestId: 'req_task1018_top',
    idempotencyKey: 'idem_task1018_top',
    tenantId: 'tenant_task1018_top',
    approvalContext: {
      approvedBy: 'lead_task1018',
      stack: 'unsafe approval stack',
    },
    permissionContext: {
      scope: 'repair_intake_submit',
      token: 'unsafe permission token',
    },
    params: {
      draftId: 'draft_task1018',
      phone: '+886900001018',
    },
    query: {
      preview: 'true',
      sql: 'select * from unsafe_query',
    },
    body: {
      organizationId: 'org_task1018',
      tenantId: 'tenant_task1018',
      idempotencyKey: 'idem_task1018',
      permissionContext: {
        canCreateCaseFromRepairIntakeDraft: true,
      },
      approvalContext: {
        approvedBy: 'body_lead_task1018',
        accepted: true,
      },
      phone: '+886900001018',
      address: 'unsafe address task1018',
      customerName: 'unsafe customer task1018',
      lineUserId: 'unsafe_line_task1018',
      lineAccessToken: 'unsafe_line_token_task1018',
      finalAppointmentId: 'unsafe_final_task1018',
      rawInput: { unsafe: true },
    },
    context: {
      organizationId: 'org_task1018_context',
      actorId: 'actor_task1018_context',
      requestId: 'req_task1018_context',
      permissionContext: {
        scope: 'context_scope_task1018',
      },
    },
    raw: {
      body: 'unsafe raw input object',
    },
    db: {
      unsafe: true,
    },
    headers: {
      authorization: 'Bearer unsafe',
    },
  };
}

const draftOutput = {
  id: 'draft_task1018',
  organizationId: 'org_task1018',
  status: 'ready',
  source: 'repair_intake',
  sourceRef: 'source_task1018',
  intakeSource: 'manual',
  summary: {
    title: 'safe draft summary',
    phone: '+886900001018',
  },
  rawRows: [{ phone: '+886900001018' }],
  rawDraft: { address: 'unsafe raw draft address' },
  phone: '+886900001018',
  address: 'unsafe address task1018',
  sql: 'select * from unsafe_draft',
};

const planOutput = {
  status: 'planned',
  reasonCode: 'PLAN_READY_TASK1018',
  requiredActions: [],
  candidate: {
    sourceDraftId: 'draft_task1018',
    organizationId: 'org_task1018',
    customerPhone: '+886900001018',
  },
  summary: {
    readiness: 'ready',
    stack: 'unsafe plan stack',
  },
  rawPortOutput: { db: 'unsafe raw port object' },
  rawRows: [{ unsafe: true }],
  lineUserId: 'unsafe_line_task1018',
};

const caseRefOutput = {
  id: 'case_task1018',
  organizationId: 'org_task1018',
  sourceDraftId: 'draft_task1018',
  status: 'created',
  reasonCode: 'SUBMIT_READY_TASK1018',
  requiredActions: [],
  summary: {
    queue: 'repair',
    token: 'unsafe case token',
  },
  finalAppointmentId: 'unsafe_final_task1018',
  databaseUrl: 'postgres://unsafe',
};

function createPorts(calls) {
  return {
    draftReader: {
      getDraftForConversion: async (payload) => {
        calls.push({ name: 'draftReader', payload });
        return draftOutput;
      },
    },
    casePlanner: {
      planCaseFromDraft: async (payload) => {
        calls.push({ name: 'casePlanner', payload });
        return planOutput;
      },
    },
    caseCreator: {
      createCaseFromDraft: async (payload) => {
        calls.push({ name: 'caseCreator', payload });
        return caseRefOutput;
      },
    },
    auditWriter: {
      recordDraftToCaseDecision: async (payload) => {
        calls.push({ name: 'auditWriter', payload });
        return {
          eventType: 'repair_intake_draft_to_case_decision',
          outcome: 'submitted',
          draftId: 'draft_task1018',
          organizationId: 'org_task1018',
          stack: 'unsafe audit stack',
          token: 'unsafe audit token',
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

function assertNoUnsafePayload(value) {
  const keys = collectKeys(value);

  for (const forbiddenKey of [
    'authorization',
    'customerName',
    'customerPhone',
    'databaseUrl',
    'db',
    'error',
    'finalAppointmentId',
    'headers',
    'lineAccessToken',
    'lineUserId',
    'phone',
    'raw',
    'rawDraft',
    'rawInput',
    'rawPortOutput',
    'rawRows',
    'sql',
    'stack',
    'token',
  ]) {
    assert.equal(keys.has(forbiddenKey), false, `forwarded unsafe key ${forbiddenKey}`);
  }

  const serialized = JSON.stringify(value);

  for (const forbiddenValue of [
    '+886900001018',
    'unsafe address task1018',
    'unsafe approval stack',
    'unsafe audit stack',
    'unsafe case token',
    'unsafe customer task1018',
    'unsafe_draft',
    'unsafe_final_task1018',
    'unsafe_line_task1018',
    'unsafe_line_token_task1018',
    'unsafe permission token',
    'unsafe plan stack',
    'unsafe_query',
    'unsafe raw draft address',
    'unsafe raw input object',
    'unsafe raw port object',
    'Bearer unsafe',
    'postgres://unsafe',
    'select *',
  ]) {
    assert.equal(serialized.includes(forbiddenValue), false, `leaked unsafe value ${forbiddenValue}`);
  }
}

function assertSafeInputFields(payload) {
  assert.equal(payload.draftId, 'draft_task1018_top');
  assert.equal(payload.organizationId, 'org_task1018_top');
  assert.equal(payload.actorId, 'actor_task1018_top');
  assert.equal(payload.requestId, 'req_task1018_top');
  assert.equal(payload.idempotencyKey, 'idem_task1018_top');
  assert.equal(payload.tenantId, 'tenant_task1018_top');
  assert.equal(payload.approvalContext.approvedBy, 'lead_task1018');
  assert.equal(payload.permissionContext.scope, 'repair_intake_submit');
  assert.equal(payload.params.draftId, 'draft_task1018');
  assert.equal(payload.query.preview, 'true');
  assert.equal(payload.body.organizationId, 'org_task1018');
  assert.equal(payload.body.tenantId, 'tenant_task1018');
  assert.equal(payload.body.idempotencyKey, 'idem_task1018');
  assert.equal(payload.context.organizationId, 'org_task1018_context');
  assert.equal(payload.context.actorId, 'actor_task1018_context');
  assert.equal(payload.context.requestId, 'req_task1018_context');
}

test('planDraftToCase sends sanitized summary payloads only to draftReader and casePlanner', async () => {
  const calls = [];
  const service = createRepairIntakeDraftToCaseApplicationService(createPorts(calls));

  const result = await service.planDraftToCase(unsafeInput());

  assert.deepEqual(calls.map((call) => call.name), ['draftReader', 'casePlanner']);

  const [draftReaderCall, casePlannerCall] = calls;
  assertSafeInputFields(draftReaderCall.payload);
  assert.equal(draftReaderCall.payload.draft, undefined);
  assert.equal(draftReaderCall.payload.plan, undefined);
  assert.equal(draftReaderCall.payload.caseRef, undefined);
  assertNoUnsafePayload(draftReaderCall.payload);

  assertSafeInputFields(casePlannerCall.payload);
  assert.notEqual(casePlannerCall.payload.draft, draftOutput);
  assert.equal(casePlannerCall.payload.draft.id, 'draft_task1018');
  assert.equal(casePlannerCall.payload.draft.status, 'ready');
  assert.equal(casePlannerCall.payload.draft.summary.title, 'safe draft summary');
  assert.equal(casePlannerCall.payload.plan, undefined);
  assert.equal(casePlannerCall.payload.caseRef, undefined);
  assertNoUnsafePayload(casePlannerCall.payload);

  assert.equal(result.ok, true);
  assert.equal(result.submitted, false);
  assert.equal(result.reasonCode, 'PLAN_READY_TASK1018');
  assertNoUnsafePayload(calls.map((call) => call.payload));
});

test('submitDraftToCase sends sanitized draft, plan, and caseRef summaries to downstream ports', async () => {
  const calls = [];
  const service = createRepairIntakeDraftToCaseApplicationService(createPorts(calls));

  const result = await service.submitDraftToCase(unsafeInput());

  assert.deepEqual(calls.map((call) => call.name), [
    'draftReader',
    'casePlanner',
    'caseCreator',
    'auditWriter',
  ]);

  const [draftReaderCall, casePlannerCall, caseCreatorCall, auditWriterCall] = calls;

  assertSafeInputFields(draftReaderCall.payload);
  assert.equal(draftReaderCall.payload.draft, undefined);
  assert.equal(draftReaderCall.payload.plan, undefined);
  assert.equal(draftReaderCall.payload.caseRef, undefined);

  assertSafeInputFields(casePlannerCall.payload);
  assert.notEqual(casePlannerCall.payload.draft, draftOutput);
  assert.equal(casePlannerCall.payload.draft.id, 'draft_task1018');
  assert.equal(casePlannerCall.payload.plan, undefined);
  assert.equal(casePlannerCall.payload.caseRef, undefined);

  assertSafeInputFields(caseCreatorCall.payload);
  assert.notEqual(caseCreatorCall.payload.draft, draftOutput);
  assert.notEqual(caseCreatorCall.payload.plan, planOutput);
  assert.equal(caseCreatorCall.payload.draft.summary.title, 'safe draft summary');
  assert.equal(caseCreatorCall.payload.plan.reasonCode, 'PLAN_READY_TASK1018');
  assert.equal(caseCreatorCall.payload.plan.candidate.sourceDraftId, 'draft_task1018');
  assert.equal(caseCreatorCall.payload.caseRef, undefined);

  assertSafeInputFields(auditWriterCall.payload);
  assert.notEqual(auditWriterCall.payload.draft, draftOutput);
  assert.notEqual(auditWriterCall.payload.plan, planOutput);
  assert.notEqual(auditWriterCall.payload.caseRef, caseRefOutput);
  assert.equal(auditWriterCall.payload.draft.id, 'draft_task1018');
  assert.equal(auditWriterCall.payload.plan.status, 'planned');
  assert.equal(auditWriterCall.payload.caseRef.id, 'case_task1018');
  assert.equal(auditWriterCall.payload.caseRef.status, 'created');
  assert.equal(auditWriterCall.payload.decision, 'submitted');

  assert.equal(result.ok, true);
  assert.equal(result.submitted, true);
  assert.equal(result.reasonCode, 'SUBMIT_READY_TASK1018');
  assertNoUnsafePayload(calls.map((call) => call.payload));
});
