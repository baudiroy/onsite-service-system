'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  DISPATCH_APPOINTMENT_ASSIGNMENT_SERVICE_KIND,
  createDispatchAppointmentAssignmentService,
} = require('../../src/services/DispatchAppointmentAssignmentService');

const ASSIGNMENT_ID = '11111111-1111-4111-8111-111111111111';
const CASE_ID = '22222222-2222-4222-8222-222222222222';
const ORG_ID = '33333333-3333-4333-8333-333333333333';
const OTHER_ORG_ID = '99999999-9999-4999-8999-999999999999';
const DISPATCH_UNIT_ID = '44444444-4444-4444-8444-444444444444';
const ENGINEER_ID = '55555555-5555-4555-8555-555555555555';
const ACTOR_ID = '66666666-6666-4666-8666-666666666666';
const REQUEST_ID = 'req_task_1900';
const NOW = '2026-05-29T06:30:00.000Z';

function assignment(overrides = {}) {
  return {
    dispatchAssignmentId: ASSIGNMENT_ID,
    caseId: CASE_ID,
    organizationId: ORG_ID,
    dispatchUnitId: DISPATCH_UNIT_ID,
    assignedEngineerId: ENGINEER_ID,
    dispatchStatus: 'assigned',
    assignmentNote: 'safe assignment note',
    assignedAt: NOW,
    assignedByUserId: ACTOR_ID,
    reassignedByUserId: null,
    reassignedAt: null,
    updatedAt: NOW,
    ...overrides,
  };
}

function command(overrides = {}) {
  return {
    assignmentId: ASSIGNMENT_ID,
    organizationId: ORG_ID,
    dispatchUnitId: DISPATCH_UNIT_ID,
    assignedEngineerId: ENGINEER_ID,
    dispatchStatus: 'assigned',
    assignmentNote: 'safe assignment note',
    actorId: ACTOR_ID,
    occurredAt: NOW,
    requestId: REQUEST_ID,
    permissionContext: {
      canManageDispatch: true,
      permission: 'dispatch.manage',
    },
    ...overrides,
  };
}

function createSyntheticRepository({ calls = [], readResult, writeResult, readImpl, writeImpl } = {}) {
  return {
    async findAssignmentState(input) {
      calls.push({ method: 'findAssignmentState', input });

      if (readImpl) {
        return readImpl(input);
      }

      return readResult || {
        ok: true,
        found: true,
        assignment: assignment({
          raw_payload: 'raw repository payload should not leak',
          database_url: 'DATABASE_URL should not leak',
        }),
      };
    },

    async recordAssignmentIntent(input) {
      calls.push({ method: 'recordAssignmentIntent', input });

      if (writeImpl) {
        return writeImpl(input);
      }

      return writeResult || {
        ok: true,
        written: true,
        assignment: assignment({
          provider_payload: 'provider payload should not leak',
          field_service_report_marker: 'field service report should not leak',
        }),
      };
    },
  };
}

function assertFailure(result, reasonCode) {
  assert.equal(result.ok, false);
  assert.equal(result.assigned, false);
  assert.equal(result.serviceKind, DISPATCH_APPOINTMENT_ASSIGNMENT_SERVICE_KIND);
  assert.equal(result.reasonCode, reasonCode);
}

function assertNoUnsafeLeak(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'raw repository payload should not leak',
    'raw client failure should not leak',
    'database password should not leak',
    'DATABASE_URL should not leak',
    'postgres' + '://',
    'provider payload should not leak',
    'field service report should not leak',
    'rows',
    'stack',
    'sql',
    'token',
    'secret',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('synthetic allow assignment path coordinates repository read and write', async () => {
  const calls = [];
  const service = createDispatchAppointmentAssignmentService({
    assignmentRepository: createSyntheticRepository({ calls }),
  });

  const result = await service.assignAppointment(command());

  assert.equal(service.kind, DISPATCH_APPOINTMENT_ASSIGNMENT_SERVICE_KIND);
  assert.equal(result.ok, true);
  assert.equal(result.assigned, true);
  assert.equal(result.reasonCode, 'dispatch_assignment_intent_accepted');
  assert.equal(result.requestId, REQUEST_ID);
  assert.deepEqual(result.assignment, assignment());
  assert.deepEqual(result.auditContext, {
    actorId: ACTOR_ID,
    organizationId: ORG_ID,
    permission: 'dispatch.manage',
    requestId: REQUEST_ID,
  });
  assert.deepEqual(calls, [
    {
      method: 'findAssignmentState',
      input: {
        assignmentId: ASSIGNMENT_ID,
        organizationId: ORG_ID,
        requestId: REQUEST_ID,
      },
    },
    {
      method: 'recordAssignmentIntent',
      input: {
        assignmentId: ASSIGNMENT_ID,
        organizationId: ORG_ID,
        dispatchUnitId: DISPATCH_UNIT_ID,
        assignedEngineerId: ENGINEER_ID,
        dispatchStatus: 'assigned',
        assignmentNote: 'safe assignment note',
        actorId: ACTOR_ID,
        occurredAt: NOW,
        requestId: REQUEST_ID,
      },
    },
  ]);
  assertNoUnsafeLeak(result);
});

test('repository denied or not found read path returns safe failure and skips write', async () => {
  const calls = [];
  const service = createDispatchAppointmentAssignmentService({
    assignmentRepository: createSyntheticRepository({
      calls,
      readResult: {
        ok: false,
        found: false,
        reasonCode: 'raw repository denial should not leak',
        rows: [{ raw: 'raw repository payload should not leak' }],
      },
    }),
  });

  const result = await service.assignAppointment(command());

  assertFailure(result, 'dispatch_assignment_not_found_or_denied');
  assert.equal(calls.length, 1);
  assertNoUnsafeLeak(result);
});

test('organization mismatch from repository result fails closed without write', async () => {
  const calls = [];
  const service = createDispatchAppointmentAssignmentService({
    assignmentRepository: createSyntheticRepository({
      calls,
      readResult: {
        ok: true,
        found: true,
        assignment: assignment({ organizationId: OTHER_ORG_ID }),
      },
    }),
  });

  const result = await service.assignAppointment(command());

  assertFailure(result, 'dispatch_assignment_not_found_or_denied');
  assert.equal(calls.length, 1);
});

test('missing actor admin context and permission context fail safely before repository access', async () => {
  const calls = [];
  const service = createDispatchAppointmentAssignmentService({
    assignmentRepository: createSyntheticRepository({ calls }),
  });

  assertFailure(await service.assignAppointment(command({ actorId: undefined })), 'admin_actor_required');
  assertFailure(await service.assignAppointment(command({ permissionContext: {} })), 'dispatch_permission_context_required');
  assertFailure(await service.assignAppointment(command({ assignmentId: undefined })), 'dispatch_assignment_id_required');
  assertFailure(await service.assignAppointment(command({ organizationId: undefined })), 'organization_id_required');
  assert.equal(calls.length, 0);
});

test('repository write denial returns sanitized failure', async () => {
  const service = createDispatchAppointmentAssignmentService({
    assignmentRepository: createSyntheticRepository({
      writeResult: {
        ok: false,
        written: false,
        reasonCode: 'raw write denial should not leak',
        error: {
          message: 'raw client failure should not leak database password should not leak',
        },
      },
    }),
  });

  const result = await service.assignAppointment(command());

  assertFailure(result, 'dispatch_assignment_write_denied');
  assertNoUnsafeLeak(result);
});

test('repository/client failures are sanitized', async () => {
  const service = createDispatchAppointmentAssignmentService({
    assignmentRepository: createSyntheticRepository({
      readImpl() {
        throw new Error('raw client failure should not leak database password should not leak');
      },
    }),
  });

  const result = await service.assignAppointment(command());

  assertFailure(result, 'dispatch_assignment_service_failed');
  assertNoUnsafeLeak(result);
});

test('missing repository dependency fails safely', async () => {
  const service = createDispatchAppointmentAssignmentService({});
  const result = await service.assignAppointment(command());

  assertFailure(result, 'assignment_repository_required');
  assertNoUnsafeLeak(result);
});
