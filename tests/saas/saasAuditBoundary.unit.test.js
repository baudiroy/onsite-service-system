'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  SAAS_AUDIT_BOUNDARY_KIND,
  buildSaasAuditEvent,
  writeSaasAuditEvent,
} = require('../../src/saas/saasAuditBoundary');

const ORG_ID = '33333333-3333-4333-8333-333333333333';
const ACTOR_ID = '66666666-6666-4666-8666-666666666666';
const REQUEST_ID = 'req_task_1925';

function baseInput(overrides = {}) {
  return {
    actionType: 'saas.entitlement.allowed',
    organizationId: ORG_ID,
    actorId: ACTOR_ID,
    requestId: REQUEST_ID,
    entitlementDecision: {
      ok: true,
      allowed: true,
      reasonCode: 'organization_entitlement_allowed',
      requiredEntitlement: 'customer.access.basic',
    },
    plan: {
      planCode: 'professional',
      planTier: 'professional',
      effectiveStatus: 'active',
    },
    usage: {
      metricKey: 'customer_report.views.count',
      quantity: 1,
      projectedQuantity: 4,
      limit: 10,
    },
    trial: {
      trialState: 'not_trial',
      trialApplied: false,
      reasonCode: 'trial_limit_not_applicable_paid_plan',
    },
    permission: {
      requiredPermission: 'saas.feature.use',
      granted: true,
      reasonCode: 'saas_permission_contract_allowed',
    },
    billingContactRef: {
      refId: 'billing_ref_task_1925',
      type: 'billing_contact',
      rawPhone: 'raw_phone_should_not_leak',
      rawAddress: 'raw_address_should_not_leak',
    },
    occurredAt: '2026-05-29T00:00:00.000Z',
    ...overrides,
  };
}

function assertNoUnsafeLeak(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'DATABASE_URL',
    'JWT_SECRET',
    'postgres' + '://',
    'secret',
    'token',
    'stack trace should not leak',
    'SELECT * FROM unsafe_table',
    'raw_phone_should_not_leak',
    'raw_address_should_not_leak',
    'provider_payload_should_not_leak',
    'payment_method_should_not_leak',
    'invoice_detail_should_not_leak',
    'ai_output_should_not_leak',
    'fsr_internal_should_not_leak',
    'final_appointment_should_not_leak',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('builds entitlement allow audit event with sanitized internal-only metadata', () => {
  const result = buildSaasAuditEvent(baseInput());

  assert.equal(result.ok, true);
  assert.equal(result.built, true);
  assert.equal(result.boundaryKind, SAAS_AUDIT_BOUNDARY_KIND);
  assert.equal(result.reasonCode, 'saas_audit_event_built');
  assert.equal(result.event.visibility, 'internal_only');
  assert.equal(result.event.customerVisible, false);
  assert.equal(result.event.organizationId, ORG_ID);
  assert.equal(result.event.actorId, ACTOR_ID);
  assert.equal(result.event.entitlementDecision.reasonCode, 'organization_entitlement_allowed');
  assert.equal(result.event.plan.planCode, 'professional');
  assert.equal(result.event.usage.metricKey, 'customer_report.views.count');
  assert.equal(result.event.trial.trialState, 'not_trial');
  assert.equal(result.event.permission.requiredPermission, 'saas.feature.use');
  assert.deepEqual(result.event.billingContactRef, {
    refId: 'billing_ref_task_1925',
    type: 'billing_contact',
    kind: 'billing_contact_ref',
  });
  assert.equal(result.event.invoiceCreated, false);
  assert.equal(result.event.paymentCreated, false);
  assert.equal(result.event.paymentMethodCollected, false);
  assert.equal(result.event.billingProviderCalled, false);
  assert.equal(result.event.organizationBillingStateMutated, false);
  assert.equal(result.event.providerSendTriggered, false);
  assertNoUnsafeLeak(result);
});

test('writes denied suspended and limit-exceeded audit metadata with synthetic writer', async () => {
  const calls = [];
  const writer = {
    async write(event) {
      calls.push(event);
      return { eventId: 'audit_event_task_1925' };
    },
  };
  const result = await writeSaasAuditEvent(baseInput({
    actionType: 'saas.usage.limit_exceeded',
    entitlementDecision: {
      ok: false,
      allowed: false,
      reasonCode: 'usage_metering_limit_exceeded',
      requiredEntitlement: 'engineer.mobile.basic',
    },
    usage: {
      metricKey: 'engineer_mobile.actions.count',
      quantity: 3,
      projectedQuantity: 12,
      limit: 10,
      rawDbRow: 'raw row should not leak',
    },
  }), { auditWriter: writer });

  assert.equal(result.ok, true);
  assert.equal(result.written, true);
  assert.equal(result.eventId, 'audit_event_task_1925');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].actionType, 'saas.usage.limit_exceeded');
  assert.equal(calls[0].usage.metricKey, 'engineer_mobile.actions.count');
  assertNoUnsafeLeak({ result, calls });
});

test('audit writer failure is sanitized and does not expose raw error', async () => {
  const result = await writeSaasAuditEvent(baseInput(), {
    auditWriter: {
      async write() {
        throw new Error('stack trace should not leak SELECT * FROM unsafe_table DATABASE_URL token');
      },
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.written, false);
  assert.equal(result.reasonCode, 'saas_audit_writer_failed');
  assert.equal(result.writerFailureSanitized, true);
  assertNoUnsafeLeak(result);
});

test('forbidden fields are excluded from audit event output', () => {
  const result = buildSaasAuditEvent(baseInput({
    rawDbRow: 'raw row should not leak',
    providerPayload: 'provider_payload_should_not_leak',
    paymentMethod: 'payment_method_should_not_leak',
    invoice: 'invoice_detail_should_not_leak',
    aiOutput: 'ai_output_should_not_leak',
    fieldServiceReport: 'fsr_internal_should_not_leak',
    finalAppointmentId: 'final_appointment_should_not_leak',
  }));

  assert.equal(result.ok, true);
  assertNoUnsafeLeak(result);
});
