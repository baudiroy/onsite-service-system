'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  DEPOT_REPAIR_STATUS_BOUNDARY_KIND,
  evaluateDepotRepairStatusTransition,
} = require('../../src/guards/DepotRepairStatusBoundary');

const ORG_ID = 'org_task_1910';
const ACTOR_ID = 'actor_task_1910';
const DEPOT_INTAKE_ID = 'depot_intake_task_1910';
const REQUEST_ID = 'req_task_1910';

function validInput(overrides = {}) {
  return {
    actorId: ACTOR_ID,
    organizationId: ORG_ID,
    requestId: REQUEST_ID,
    depotIntake: {
      draftId: DEPOT_INTAKE_ID,
      organizationId: ORG_ID,
      workflowType: 'depot',
      depotStatus: 'intake_received',
    },
    targetStatus: 'diagnosis_pending',
    ...overrides,
  };
}

function assertDenied(result, reasonCode) {
  assert.equal(result.ok, false);
  assert.equal(result.allowed, false);
  assert.equal(result.boundaryKind, DEPOT_REPAIR_STATUS_BOUNDARY_KIND);
  assert.equal(result.reasonCode, reasonCode);
}

function assertNoForbiddenLeak(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'finalAppointmentId',
    'final_appointment_id',
    'fieldServiceReport',
    'field_service_report',
    'completionReport',
    'completion_report',
    'customerVisiblePublication',
    'providerPayload',
    'billingInternals',
    'aiProviderOutput',
    'raw provider',
    'unsafe billing',
    'unsafe ai',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('valid synthetic depot status transition returns bounded transition intent', () => {
  const result = evaluateDepotRepairStatusTransition(validInput());

  assert.equal(result.ok, true);
  assert.equal(result.allowed, true);
  assert.equal(result.boundaryKind, DEPOT_REPAIR_STATUS_BOUNDARY_KIND);
  assert.equal(result.reasonCode, 'depot_repair_status_transition_allowed');
  assert.equal(result.requestId, REQUEST_ID);
  assert.deepEqual(result.transitionIntent, {
    depotIntakeId: DEPOT_INTAKE_ID,
    organizationId: ORG_ID,
    workflowType: 'depot',
    actorId: ACTOR_ID,
    currentStatus: 'intake_received',
    targetStatus: 'diagnosis_pending',
    requestId: REQUEST_ID,
  });
  assert.deepEqual(result.mutationIntent, {
    depotStatus: 'diagnosis_pending',
    updatedBy: ACTOR_ID,
  });
  assertNoForbiddenLeak(result);
});

test('supports explicitly scoped depot workflow lifecycle transitions only', () => {
  const allowedPairs = [
    ['diagnosis_pending', 'diagnosis_completed'],
    ['diagnosis_completed', 'quote_pending'],
    ['quote_pending', 'quote_approved'],
    ['quote_approved', 'repair_in_progress'],
    ['repair_in_progress', 'quality_check'],
    ['quality_check', 'ready_for_return'],
    ['ready_for_return', 'returned'],
    ['returned', 'closed'],
  ];

  for (const [currentStatus, targetStatus] of allowedPairs) {
    const result = evaluateDepotRepairStatusTransition(validInput({
      depotIntake: {
        draftId: DEPOT_INTAKE_ID,
        organizationId: ORG_ID,
        workflowType: 'carry_in',
        depotStatus: currentStatus,
      },
      targetStatus,
    }));

    assert.equal(result.ok, true, `${currentStatus} -> ${targetStatus}`);
    assert.equal(result.transitionIntent.workflowType, 'carry_in');
  }
});

test('unknown and unsupported statuses fail closed', () => {
  assertDenied(evaluateDepotRepairStatusTransition(validInput({
    depotIntake: {
      draftId: DEPOT_INTAKE_ID,
      organizationId: ORG_ID,
      workflowType: 'depot',
      depotStatus: 'mystery_status',
    },
    targetStatus: 'diagnosis_pending',
  })), 'depot_repair_current_status_unknown');

  assertDenied(evaluateDepotRepairStatusTransition(validInput({
    targetStatus: 'onsite_completed',
  })), 'depot_repair_target_status_unsupported');
});

test('invalid transition and closed/finalized state fail closed', () => {
  assertDenied(evaluateDepotRepairStatusTransition(validInput({
    depotIntake: {
      draftId: DEPOT_INTAKE_ID,
      organizationId: ORG_ID,
      workflowType: 'depot',
      depotStatus: 'quote_pending',
    },
    targetStatus: 'quality_check',
  })), 'depot_repair_status_transition_invalid');

  assertDenied(evaluateDepotRepairStatusTransition(validInput({
    depotIntake: {
      draftId: DEPOT_INTAKE_ID,
      organizationId: ORG_ID,
      workflowType: 'depot',
      depotStatus: 'closed',
    },
    targetStatus: 'repair_in_progress',
  })), 'depot_repair_status_closed_or_finalized');

  assertDenied(evaluateDepotRepairStatusTransition(validInput({
    finalized: true,
  })), 'depot_repair_status_closed_or_finalized');
});

test('missing actor organization and mismatched workflow or organization fail closed', () => {
  assertDenied(evaluateDepotRepairStatusTransition(validInput({
    actorId: undefined,
  })), 'depot_status_actor_required');

  assertDenied(evaluateDepotRepairStatusTransition(validInput({
    organizationId: undefined,
    depotIntake: {
      draftId: DEPOT_INTAKE_ID,
      workflowType: 'depot',
      depotStatus: 'intake_received',
    },
  })), 'organization_id_required');

  assertDenied(evaluateDepotRepairStatusTransition(validInput({
    organizationId: 'org_other',
  })), 'depot_status_organization_mismatch');

  assertDenied(evaluateDepotRepairStatusTransition(validInput({
    workflowType: 'onsite',
  })), 'depot_workflow_type_unsupported');

  assertDenied(evaluateDepotRepairStatusTransition(validInput({
    workflowType: 'mail_in',
  })), 'depot_workflow_type_mismatch');
});

test('forbidden mutation intent cannot map depot state into FSR completion provider AI billing or publication fields', () => {
  for (const mutationIntent of [
    { finalAppointmentId: 'unsafe_final' },
    { fieldServiceReport: 'unsafe_fsr' },
    { completionReport: 'unsafe_completion' },
    { customerVisiblePublication: true },
    { providerPayload: 'raw provider' },
    { billingInternals: 'unsafe billing' },
    { aiProviderOutput: 'unsafe ai' },
  ]) {
    assertDenied(evaluateDepotRepairStatusTransition(validInput({ mutationIntent })), 'depot_repair_status_mutation_scope_forbidden');
  }

  assertDenied(evaluateDepotRepairStatusTransition(validInput({
    finalAppointmentId: 'unsafe_final_top_level',
  })), 'depot_repair_status_mutation_scope_forbidden');
});
