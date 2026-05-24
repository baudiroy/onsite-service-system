'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  RepairIntakeAuditWriterPortAdapterError,
  createRepairIntakeAuditWriterPortAdapter,
} = require('../../src/repairIntake/repairIntakeAuditWriterPortAdapter');

const UNSAFE_ERROR_MESSAGE = [
  'SQL select * from unsafe_audit_table',
  'DATABASE_URL=postgres://unsafe-audit',
  'phone +886900001037',
  'address unsafe audit address',
  'customer unsafe audit name',
  'lineUserId unsafe_audit_line',
  'LINE access token unsafe_audit_line_token',
  'finalAppointmentId unsafe_audit_final',
  'stack trace at unsafe audit',
].join(' ');

function unsafeAuditInput() {
  return {
    draftId: 'draft_task1037_top',
    organizationId: 'org_task1037_top',
    tenantId: 'tenant_task1037_top',
    requestId: 'req_task1037_top',
    decision: 'submitted',
    actor: {
      actorId: 'actor_task1037',
      token: 'unsafe actor token',
    },
    metadata: {
      source: 'integration_test',
      sql: 'select * from unsafe_metadata',
    },
    warnings: ['needs_review'],
    draft: {
      id: 'draft_task1037',
      organizationId: 'org_task1037',
      tenantId: 'tenant_task1037',
      status: 'ready',
      summary: {
        title: 'safe draft summary',
        phone: '+886900001037',
      },
      rawRows: [{ phone: '+886900001037' }],
      phone: '+886900001037',
      address: 'unsafe audit address',
      lineUserId: 'unsafe_audit_line',
      finalAppointmentId: 'unsafe_audit_final',
      sql: 'select * from unsafe_draft',
      stack: 'unsafe draft stack',
    },
    plan: {
      status: 'planned',
      reasonCode: 'PLAN_READY_TASK1037',
      candidate: {
        sourceDraftId: 'draft_task1037',
        organizationId: 'org_task1037',
        customerPhone: '+886900001037',
      },
      rawRows: [{ unsafe: true }],
      stack: 'unsafe plan stack',
    },
    caseRef: {
      id: 'case_task1037',
      organizationId: 'org_task1037',
      tenantId: 'tenant_task1037',
      sourceDraftId: 'draft_task1037',
      status: 'created',
      reasonCode: 'CASE_CREATED_TASK1037',
      summary: {
        title: 'safe case summary',
        phone: '+886900001037',
      },
      finalAppointmentId: 'unsafe_audit_final',
      databaseUrl: 'postgres://unsafe',
      stack: 'unsafe case stack',
    },
    rawAudit: {
      db: 'unsafe raw audit',
    },
    headers: {
      authorization: 'Bearer unsafe',
    },
  };
}

function createAuditPort(calls, options = {}) {
  return {
    recordDraftToCaseDecision: async (auditInput) => {
      calls.push(auditInput);

      if (options.throwRecord) {
        throw new Error(UNSAFE_ERROR_MESSAGE);
      }

      if (options.rejectRecord) {
        return Promise.reject(new Error(UNSAFE_ERROR_MESSAGE));
      }

      if (options.invalidResult) {
        return null;
      }

      return {
        eventType: 'repair_intake_draft_to_case_decision',
        outcome: 'submitted',
        draftId: 'draft_task1037',
        organizationId: 'org_task1037',
        tenantId: 'tenant_task1037',
        caseId: 'case_task1037',
        reasonCode: 'AUDIT_RECORDED_TASK1037',
        metadata: {
          recordedBy: 'synthetic_port',
          token: 'unsafe metadata token',
        },
        rawRows: [{ unsafe: true }],
        finalAppointmentId: 'unsafe_audit_final',
        stack: 'unsafe audit stack',
      };
    },
  };
}

function assertNoUnsafeText(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'select *',
    'unsafe_audit_table',
    'unsafe_metadata',
    'unsafe_draft',
    'DATABASE_URL',
    'postgres://',
    '+886900001037',
    'unsafe audit address',
    'unsafe audit name',
    'unsafe_audit_line',
    'unsafe_audit_line_token',
    'LINE access token',
    'unsafe_audit_final',
    'unsafe actor token',
    'unsafe raw audit',
    'unsafe draft stack',
    'unsafe plan stack',
    'unsafe case stack',
    'unsafe audit stack',
    'unsafe metadata token',
    'stack trace',
    'Bearer unsafe',
    'rawRows',
    'rawAudit',
    'headers',
    'authorization',
    'phone',
    'address',
    'customerPhone',
    'lineUserId',
    'lineAccessToken',
    'finalAppointmentId',
    'databaseUrl',
    'sql',
    'stack',
    'token',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('factory requires injected auditPort.recordDraftToCaseDecision', () => {
  for (const options of [
    undefined,
    null,
    {},
    { auditPort: null },
    { auditPort: {} },
    { auditPort: { recordDraftToCaseDecision: 'not-a-function' } },
  ]) {
    assert.throws(
      () => createRepairIntakeAuditWriterPortAdapter(options),
      (error) => {
        assert.equal(error instanceof RepairIntakeAuditWriterPortAdapterError, true);
        assert.equal(
          error.reasonCode,
          'REPAIR_INTAKE_AUDIT_WRITER_PORT_ADAPTER_AUDIT_PORT_REQUIRED',
        );
        assert.deepEqual(error.requiredActions, [
          'configure_audit_port_record_draft_to_case_decision',
        ]);
        assertNoUnsafeText(error);
        return true;
      },
    );
  }
});

test('recordDraftToCaseDecision forwards only sanitized audit context and returns sanitized audit envelope', async () => {
  const calls = [];
  const adapter = createRepairIntakeAuditWriterPortAdapter({
    auditPort: createAuditPort(calls),
  });

  const result = await adapter.recordDraftToCaseDecision(unsafeAuditInput());

  assert.equal(calls.length, 1);
  assert.equal(calls[0].draftId, 'draft_task1037_top');
  assert.equal(calls[0].organizationId, 'org_task1037_top');
  assert.equal(calls[0].tenantId, 'tenant_task1037_top');
  assert.equal(calls[0].requestId, 'req_task1037_top');
  assert.equal(calls[0].actor.actorId, 'actor_task1037');
  assert.equal(calls[0].decision, 'submitted');
  assert.equal(calls[0].draft.id, 'draft_task1037');
  assert.equal(calls[0].plan.reasonCode, 'PLAN_READY_TASK1037');
  assert.equal(calls[0].caseRef.id, 'case_task1037');
  assert.equal(result.ok, true);
  assert.equal(result.eventType, 'repair_intake_draft_to_case_decision');
  assert.equal(result.outcome, 'submitted');
  assert.equal(result.caseId, 'case_task1037');
  assert.equal(result.reasonCode, 'AUDIT_RECORDED_TASK1037');
  assertNoUnsafeText(calls);
  assertNoUnsafeText(result);
});

test('invalid input fails closed before audit port call', async () => {
  for (const invalidInput of [
    undefined,
    null,
    'input',
    42,
    true,
    [],
    () => {},
    {},
    { draft: null, plan: {}, caseRef: {} },
    { draft: {}, plan: null, caseRef: {} },
    { draft: {}, plan: {}, caseRef: null },
  ]) {
    const calls = [];
    const adapter = createRepairIntakeAuditWriterPortAdapter({
      auditPort: createAuditPort(calls),
    });

    const result = await adapter.recordDraftToCaseDecision(invalidInput);

    assert.equal(result.ok, false);
    assert.equal(result.reasonCode, 'REPAIR_INTAKE_AUDIT_WRITER_PORT_ADAPTER_INPUT_INVALID');
    assert.deepEqual(calls, []);
    assertNoUnsafeText(result);
  }
});

test('audit port thrown errors and rejections return sanitized record failure envelopes', async () => {
  for (const options of [{ throwRecord: true }, { rejectRecord: true }, { invalidResult: true }]) {
    const calls = [];
    const adapter = createRepairIntakeAuditWriterPortAdapter({
      auditPort: createAuditPort(calls, options),
    });

    const result = await adapter.recordDraftToCaseDecision(unsafeAuditInput());

    assert.equal(calls.length, 1);
    assert.equal(result.ok, false);
    assert.equal(result.reasonCode, 'REPAIR_INTAKE_AUDIT_WRITER_PORT_ADAPTER_RECORD_FAILED');
    assertNoUnsafeText(calls);
    assertNoUnsafeText(result);
  }
});
