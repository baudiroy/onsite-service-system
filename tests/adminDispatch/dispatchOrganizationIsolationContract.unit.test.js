'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  DISPATCH_ORGANIZATION_ISOLATION_CONTRACT_KIND,
  evaluateDispatchOrganizationIsolationContract,
} = require('../../src/guards/DispatchOrganizationIsolationContract');
const {
  buildServiceInput,
} = require('../../src/routes/dispatchAssignment.routes');
const {
  createDispatchAppointmentAssignmentService,
} = require('../../src/services/DispatchAppointmentAssignmentService');
const {
  createDispatchAssignmentSqlRepositoryAdapter,
} = require('../../src/repositories/DispatchAssignmentSqlRepositoryAdapter');

const ASSIGNMENT_ID = '11111111-1111-4111-8111-111111111111';
const ORG_ID = '33333333-3333-4333-8333-333333333333';
const OTHER_ORG_ID = '99999999-9999-4999-8999-999999999999';
const DISPATCH_UNIT_ID = '44444444-4444-4444-8444-444444444444';
const ENGINEER_ID = '55555555-5555-4555-8555-555555555555';
const ACTOR_ID = '66666666-6666-4666-8666-666666666666';
const REQUEST_ID = 'req_task_1903';

function request(overrides = {}) {
  return {
    params: {
      assignmentId: ASSIGNMENT_ID,
      ...(overrides.params || {}),
    },
    body: {
      dispatchUnitId: DISPATCH_UNIT_ID,
      assignedEngineerId: ENGINEER_ID,
      dispatchStatus: 'assigned',
      ...(overrides.body || {}),
    },
    context: {
      requestId: REQUEST_ID,
      ...(overrides.context || {}),
    },
    requestId: REQUEST_ID,
    user: {
      id: ACTOR_ID,
      organizationId: ORG_ID,
      permissions: ['dispatch.manage'],
      ...(overrides.user || {}),
    },
  };
}

function assignment(overrides = {}) {
  return {
    dispatchAssignmentId: ASSIGNMENT_ID,
    organizationId: ORG_ID,
    dispatchUnitId: DISPATCH_UNIT_ID,
    assignedEngineerId: ENGINEER_ID,
    dispatchStatus: 'assigned',
    ...overrides,
  };
}

function assertFailure(result, reasonCode) {
  assert.equal(result.ok, false);
  assert.equal(result.isolated, false);
  assert.equal(result.contractKind, DISPATCH_ORGANIZATION_ISOLATION_CONTRACT_KIND);
  assert.equal(result.reasonCode, reasonCode);
}

function assertNoUnsafeLeak(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'raw cross organization row should not leak',
    'raw service error should not leak',
    'DATABASE_URL',
    'postgres' + '://',
    'stack',
    'sql',
    'token',
    'secret',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('route-built service input satisfies actor permission and organization contract', () => {
  const input = buildServiceInput(request());
  const result = evaluateDispatchOrganizationIsolationContract(input);

  assert.equal(result.ok, true);
  assert.equal(result.isolated, true);
  assert.equal(result.contractKind, DISPATCH_ORGANIZATION_ISOLATION_CONTRACT_KIND);
  assert.equal(result.reasonCode, 'dispatch_organization_isolation_contract_satisfied');
  assert.equal(result.organizationId, ORG_ID);
  assertNoUnsafeLeak(result);
});

test('repository read and write query specs include organization predicate and cases join', async () => {
  const calls = [];
  const dbClient = {
    query(querySpec) {
      calls.push(querySpec);

      return {
        rowCount: 1,
        rows: [{
          dispatch_assignment_id: ASSIGNMENT_ID,
          organization_id: ORG_ID,
          dispatch_unit_id: DISPATCH_UNIT_ID,
          assigned_engineer_id: ENGINEER_ID,
          dispatch_status: 'assigned',
        }],
      };
    },
  };
  const adapter = createDispatchAssignmentSqlRepositoryAdapter({ dbClient });

  await adapter.findAssignmentState({
    assignmentId: ASSIGNMENT_ID,
    organizationId: ORG_ID,
    requestId: REQUEST_ID,
  });
  await adapter.recordAssignmentIntent({
    assignmentId: ASSIGNMENT_ID,
    organizationId: ORG_ID,
    dispatchUnitId: DISPATCH_UNIT_ID,
    assignedEngineerId: ENGINEER_ID,
    actorId: ACTOR_ID,
    requestId: REQUEST_ID,
  });

  const result = evaluateDispatchOrganizationIsolationContract({
    actorId: ACTOR_ID,
    organizationId: ORG_ID,
    permissionContext: {
      canManageDispatch: true,
    },
    repositorySpecs: calls,
    requestId: REQUEST_ID,
  });

  assert.equal(calls.length, 2);
  assert.equal(result.ok, true);
  assert.equal(result.isolated, true);
});

test('service requires organization before repository write', async () => {
  const calls = [];
  const service = createDispatchAppointmentAssignmentService({
    assignmentRepository: {
      async findAssignmentState(input) {
        calls.push({ method: 'findAssignmentState', input });
        return { ok: true, found: true, assignment: assignment() };
      },
      async recordAssignmentIntent(input) {
        calls.push({ method: 'recordAssignmentIntent', input });
        return { ok: true, written: true, assignment: assignment() };
      },
    },
  });

  const result = await service.assignAppointment({
    assignmentId: ASSIGNMENT_ID,
    actorId: ACTOR_ID,
    dispatchUnitId: DISPATCH_UNIT_ID,
    permissionContext: {
      canManageDispatch: true,
    },
    requestId: REQUEST_ID,
  });

  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'organization_id_required');
  assert.equal(calls.length, 0);
});

test('organization mismatch safe-denies and raw cross-organization data is not exposed', async () => {
  const calls = [];
  const service = createDispatchAppointmentAssignmentService({
    assignmentRepository: {
      async findAssignmentState(input) {
        calls.push({ method: 'findAssignmentState', input });
        return {
          ok: true,
          found: true,
          assignment: assignment({
            organizationId: OTHER_ORG_ID,
            raw_payload: 'raw cross organization row should not leak',
          }),
        };
      },
      async recordAssignmentIntent(input) {
        calls.push({ method: 'recordAssignmentIntent', input });
        return { ok: true, written: true, assignment: assignment() };
      },
    },
  });

  const result = await service.assignAppointment({
    assignmentId: ASSIGNMENT_ID,
    organizationId: ORG_ID,
    actorId: ACTOR_ID,
    dispatchUnitId: DISPATCH_UNIT_ID,
    permissionContext: {
      canManageDispatch: true,
    },
    requestId: REQUEST_ID,
  });

  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'dispatch_assignment_not_found_or_denied');
  assert.equal(calls.length, 1);
  assertNoUnsafeLeak(result);
});

test('contract denies global organization fallback and repository specs without org predicate', () => {
  assertFailure(
    evaluateDispatchOrganizationIsolationContract({
      actorId: ACTOR_ID,
      organizationId: ORG_ID,
      organizationSource: 'global',
      permissionContext: {
        canManageDispatch: true,
      },
    }),
    'global_organization_fallback_forbidden',
  );
  assertFailure(
    evaluateDispatchOrganizationIsolationContract({
      actorId: ACTOR_ID,
      organizationId: ORG_ID,
      permissionContext: {
        canManageDispatch: true,
      },
      repositorySpec: {
        text: 'SELECT * FROM dispatch_assignments WHERE id = $1',
        values: [ASSIGNMENT_ID],
      },
    }),
    'repository_organization_predicate_required',
  );
});
