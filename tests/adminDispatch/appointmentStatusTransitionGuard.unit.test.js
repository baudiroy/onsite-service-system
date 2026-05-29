'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  APPOINTMENT_STATUS_TRANSITION_GUARD_KIND,
  evaluateAppointmentStatusTransition,
} = require('../../src/guards/AppointmentStatusTransitionGuard');

const APPOINTMENT_ID = '22222222-2222-4222-8222-222222222222';
const ORG_ID = '33333333-3333-4333-8333-333333333333';
const OTHER_ORG_ID = '99999999-9999-4999-8999-999999999999';
const ACTOR_ID = '66666666-6666-4666-8666-666666666666';
const REQUEST_ID = 'req_task_1902';

function command(overrides = {}) {
  return {
    appointment: {
      id: APPOINTMENT_ID,
      organizationId: ORG_ID,
      appointmentStatus: 'scheduled',
      ...(overrides.appointment || {}),
    },
    assignment: {
      organizationId: ORG_ID,
      visible: true,
      eligible: true,
      ...(overrides.assignment || {}),
    },
    organizationId: ORG_ID,
    actorId: ACTOR_ID,
    targetStatus: 'rescheduled',
    requestId: REQUEST_ID,
    ...Object.fromEntries(Object.entries(overrides).filter(([key]) => !['appointment', 'assignment'].includes(key))),
  };
}

function assertFailure(result, reasonCode) {
  assert.equal(result.ok, false);
  assert.equal(result.allowed, false);
  assert.equal(result.guardKind, APPOINTMENT_STATUS_TRANSITION_GUARD_KIND);
  assert.equal(result.reasonCode, reasonCode);
}

function assertNoUnsafeLeak(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'raw provider payload should not leak',
    'raw db row should not leak',
    'DATABASE_URL',
    'postgres' + '://',
    'field_service_reports',
    'completion_reports',
    'customer_visible_publication',
    'stack',
    'sql',
    'token',
    'secret',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('allowed transition intent returns safe mutation intent only', () => {
  const result = evaluateAppointmentStatusTransition(command());

  assert.equal(result.ok, true);
  assert.equal(result.allowed, true);
  assert.equal(result.guardKind, APPOINTMENT_STATUS_TRANSITION_GUARD_KIND);
  assert.equal(result.reasonCode, 'appointment_status_transition_allowed');
  assert.deepEqual(result.transitionIntent, {
    appointmentId: APPOINTMENT_ID,
    organizationId: ORG_ID,
    actorId: ACTOR_ID,
    currentStatus: 'scheduled',
    targetStatus: 'rescheduled',
    requestId: REQUEST_ID,
  });
  assert.deepEqual(result.mutationIntent, {
    appointmentStatus: 'rescheduled',
    updatedBy: ACTOR_ID,
  });
  assert.equal(Object.prototype.hasOwnProperty.call(result.mutationIntent, 'finalAppointmentId'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(result.mutationIntent, 'final_appointment_id'), false);
  assertNoUnsafeLeak(result);
});

test('unsupported and invalid transitions are denied', () => {
  assertFailure(
    evaluateAppointmentStatusTransition(command({
      appointment: { appointmentStatus: 'unknown_status' },
    })),
    'appointment_current_status_unknown',
  );
  assertFailure(
    evaluateAppointmentStatusTransition(command({ targetStatus: 'provider_sent' })),
    'appointment_target_status_unsupported',
  );
  assertFailure(
    evaluateAppointmentStatusTransition(command({
      appointment: { appointmentStatus: 'scheduled' },
      targetStatus: 'completed',
    })),
    'appointment_status_transition_invalid',
  );
});

test('closed cancelled and finalized states are denied', () => {
  for (const status of ['cancelled', 'completed', 'no_show']) {
    assertFailure(
      evaluateAppointmentStatusTransition(command({
        appointment: { appointmentStatus: status },
        targetStatus: 'scheduled',
      })),
      'appointment_status_closed_or_finalized',
    );
  }

  assertFailure(
    evaluateAppointmentStatusTransition(command({
      appointment: { finalized: true },
    })),
    'appointment_status_closed_or_finalized',
  );
});

test('organization mismatch and assignment invisibility are denied', () => {
  assertFailure(
    evaluateAppointmentStatusTransition(command({
      appointment: { organizationId: OTHER_ORG_ID },
    })),
    'appointment_organization_mismatch',
  );
  assertFailure(
    evaluateAppointmentStatusTransition(command({
      assignment: { organizationId: OTHER_ORG_ID },
    })),
    'assignment_organization_mismatch',
  );
  assertFailure(
    evaluateAppointmentStatusTransition(command({
      assignment: { visible: false, eligible: false },
    })),
    'assignment_not_visible_or_eligible',
  );
});

test('missing actor and organization context are denied', () => {
  assertFailure(
    evaluateAppointmentStatusTransition(command({ actorId: undefined, actor: {} })),
    'admin_actor_required',
  );
  assertFailure(
    evaluateAppointmentStatusTransition({
      appointment: {
        id: APPOINTMENT_ID,
        appointmentStatus: 'scheduled',
      },
      assignment: {
        visible: true,
        eligible: true,
      },
      actorId: ACTOR_ID,
      targetStatus: 'rescheduled',
      requestId: REQUEST_ID,
    }),
    'organization_id_required',
  );
});

test('forbidden mutation intent keys are denied without leaking raw data', () => {
  const result = evaluateAppointmentStatusTransition(command({
    mutationIntent: {
      finalAppointmentId: 'should_not_be_allowed',
      provider_payload: 'raw provider payload should not leak',
    },
  }));

  assertFailure(result, 'appointment_status_mutation_scope_forbidden');
  assertNoUnsafeLeak(result);
});
