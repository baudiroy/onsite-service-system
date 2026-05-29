'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  DISPATCH_ASSIGNMENT_SQL_REPOSITORY_ADAPTER_KIND,
  createDispatchAssignmentSqlRepositoryAdapter,
} = require('../../src/repositories/DispatchAssignmentSqlRepositoryAdapter');

const ASSIGNMENT_ID = '11111111-1111-4111-8111-111111111111';
const CASE_ID = '22222222-2222-4222-8222-222222222222';
const ORG_ID = '33333333-3333-4333-8333-333333333333';
const DISPATCH_UNIT_ID = '44444444-4444-4444-8444-444444444444';
const ENGINEER_ID = '55555555-5555-4555-8555-555555555555';
const ACTOR_ID = '66666666-6666-4666-8666-666666666666';
const REQUEST_ID = 'req_task_1899';
const NOW = '2026-05-29T05:30:00.000Z';

function assignmentRecord(overrides = {}) {
  return {
    dispatch_assignment_id: ASSIGNMENT_ID,
    case_id: CASE_ID,
    organization_id: ORG_ID,
    dispatch_unit_id: DISPATCH_UNIT_ID,
    assigned_engineer_id: ENGINEER_ID,
    dispatch_status: 'accepted',
    assignment_note: 'safe assignment note',
    assigned_at: NOW,
    assigned_by_user_id: ACTOR_ID,
    reassigned_by_user_id: null,
    reassigned_at: null,
    updated_at: NOW,
    ...overrides,
  };
}

function createSyntheticDbClient({ calls = [], queryImpl } = {}) {
  return {
    query(querySpec) {
      calls.push(querySpec);

      if (queryImpl) {
        return queryImpl(querySpec, calls.length);
      }

      return {
        rowCount: 1,
        rows: [assignmentRecord({
          raw_payload: 'raw payload should not leak',
          database_url: 'DATABASE_URL should not leak',
          provider_payload: 'provider payload should not leak',
          field_service_report_marker: 'field service report should not leak',
        })],
      };
    },
  };
}

function assertFailure(result, reasonCode) {
  assert.equal(result.ok, false);
  assert.equal(result.found, false);
  assert.equal(result.written, false);
  assert.equal(result.adapterKind, DISPATCH_ASSIGNMENT_SQL_REPOSITORY_ADAPTER_KIND);
  assert.equal(result.reasonCode, reasonCode);
}

function assertNoUnsafeLeak(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'raw payload should not leak',
    'raw client failure should not leak',
    'database password should not leak',
    'DATABASE_URL should not leak',
    'postgres' + '://',
    'provider payload should not leak',
    'field service report should not leak',
    'rows',
    'stack',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

function assertParameterized(querySpec) {
  assert.equal(typeof querySpec.text, 'string');
  assert.equal(Array.isArray(querySpec.values), true);
  assert.equal(Object.isFrozen(querySpec.values), true);
  assert.equal(querySpec.text.includes('${'), false);

  for (const value of querySpec.values.filter(Boolean)) {
    assert.equal(querySpec.text.includes(String(value)), false, `query text includes raw value ${value}`);
  }
}

test('missing dbClient query or execute returns db_client_required', async () => {
  const missing = createDispatchAssignmentSqlRepositoryAdapter({});
  const malformed = createDispatchAssignmentSqlRepositoryAdapter({ dbClient: {} });

  assert.equal(missing.kind, DISPATCH_ASSIGNMENT_SQL_REPOSITORY_ADAPTER_KIND);
  assertFailure(await missing.findAssignmentState({ assignmentId: ASSIGNMENT_ID, organizationId: ORG_ID }), 'db_client_required');
  assertFailure(await malformed.recordAssignmentIntent({ assignmentId: ASSIGNMENT_ID, organizationId: ORG_ID }), 'db_client_required');
});

test('read by assignment id uses organization-scoped parameterized query and sanitized envelope', async () => {
  const calls = [];
  const adapter = createDispatchAssignmentSqlRepositoryAdapter({
    dbClient: createSyntheticDbClient({ calls }),
  });

  const result = await adapter.findAssignmentState({
    assignmentId: ASSIGNMENT_ID,
    organizationId: ORG_ID,
    requestId: REQUEST_ID,
  });

  assert.equal(result.ok, true);
  assert.equal(result.found, true);
  assert.equal(result.written, false);
  assert.equal(result.reasonCode, 'dispatch_assignment_read_succeeded');
  assert.equal(result.requestId, REQUEST_ID);
  assert.deepEqual(result.assignment, {
    dispatchAssignmentId: ASSIGNMENT_ID,
    caseId: CASE_ID,
    organizationId: ORG_ID,
    dispatchUnitId: DISPATCH_UNIT_ID,
    assignedEngineerId: ENGINEER_ID,
    dispatchStatus: 'accepted',
    assignmentNote: 'safe assignment note',
    assignedAt: NOW,
    assignedByUserId: ACTOR_ID,
    reassignedByUserId: null,
    reassignedAt: null,
    updatedAt: NOW,
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].name, 'adminDispatchReadAssignmentById');
  assert.match(calls[0].text, /^SELECT/);
  assert.match(calls[0].text, /JOIN cases AS c ON c\.id = da\.case_id/);
  assert.match(calls[0].text, /c\.organization_id = \$2::uuid/);
  assert.deepEqual(calls[0].values, [ASSIGNMENT_ID, ORG_ID]);
  assertParameterized(calls[0]);
  assertNoUnsafeLeak(result);
});

test('read by case id uses current assignment query when assignment id is absent', async () => {
  const calls = [];
  const adapter = createDispatchAssignmentSqlRepositoryAdapter({
    dbClient: createSyntheticDbClient({ calls }),
  });

  const result = await adapter.findAssignmentState({
    caseId: CASE_ID,
    organizationId: ORG_ID,
  });

  assert.equal(result.ok, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].name, 'adminDispatchReadAssignmentByCase');
  assert.match(calls[0].text, /WHERE da\.case_id = \$1::uuid/);
  assert.match(calls[0].text, /ORDER BY da\.created_at DESC/);
  assert.deepEqual(calls[0].values, [CASE_ID, ORG_ID]);
});

test('record assignment intent uses injected client and parameterized update query', async () => {
  const calls = [];
  const adapter = createDispatchAssignmentSqlRepositoryAdapter({
    dbClient: createSyntheticDbClient({ calls }),
  });

  const result = await adapter.recordAssignmentIntent({
    assignmentId: ASSIGNMENT_ID,
    organizationId: ORG_ID,
    dispatchUnitId: DISPATCH_UNIT_ID,
    assignedEngineerId: ENGINEER_ID,
    dispatchStatus: 'accepted',
    assignmentNote: 'safe assignment note',
    actorId: ACTOR_ID,
    occurredAt: NOW,
    requestId: REQUEST_ID,
  });

  assert.equal(result.ok, true);
  assert.equal(result.found, true);
  assert.equal(result.written, true);
  assert.equal(result.reasonCode, 'dispatch_assignment_intent_recorded');
  assert.equal(result.requestId, REQUEST_ID);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].name, 'adminDispatchRecordAssignmentIntent');
  assert.match(calls[0].text, /^UPDATE dispatch_assignments AS da/);
  assert.match(calls[0].text, /FROM cases AS c/);
  assert.match(calls[0].text, /c\.organization_id = \$2::uuid/);
  assert.deepEqual(calls[0].values, [
    ASSIGNMENT_ID,
    ORG_ID,
    DISPATCH_UNIT_ID,
    ENGINEER_ID,
    'accepted',
    'safe assignment note',
    ACTOR_ID,
    NOW,
  ]);
  assertParameterized(calls[0]);
  assertNoUnsafeLeak(result);
});

test('not found or denied read and write paths return safe envelopes', async () => {
  const calls = [];
  const adapter = createDispatchAssignmentSqlRepositoryAdapter({
    dbClient: createSyntheticDbClient({
      calls,
      queryImpl() {
        return {
          rowCount: 0,
          rows: [],
        };
      },
    }),
  });

  assertFailure(await adapter.findAssignmentState({
    assignmentId: ASSIGNMENT_ID,
    organizationId: ORG_ID,
  }), 'dispatch_assignment_not_found_or_denied');

  assertFailure(await adapter.recordAssignmentIntent({
    assignmentId: ASSIGNMENT_ID,
    organizationId: ORG_ID,
    assignedEngineerId: ENGINEER_ID,
    actorId: ACTOR_ID,
  }), 'dispatch_assignment_not_found_or_denied');
  assert.equal(calls.length, 2);
});

test('client failures and unsupported inputs are sanitized', async () => {
  const adapter = createDispatchAssignmentSqlRepositoryAdapter({
    dbClient: createSyntheticDbClient({
      queryImpl() {
        throw new Error('raw client failure should not leak database password should not leak');
      },
    }),
  });

  const failedRead = await adapter.findAssignmentState({
    assignmentId: ASSIGNMENT_ID,
    organizationId: ORG_ID,
    requestId: REQUEST_ID,
  });
  const failedWrite = await adapter.recordAssignmentIntent({
    assignmentId: ASSIGNMENT_ID,
    organizationId: ORG_ID,
    assignedEngineerId: ENGINEER_ID,
    actorId: ACTOR_ID,
    requestId: REQUEST_ID,
  });
  const invalidStatus = await adapter.recordAssignmentIntent({
    assignmentId: ASSIGNMENT_ID,
    organizationId: ORG_ID,
    dispatchStatus: 'provider_sent',
    actorId: ACTOR_ID,
  });

  assertFailure(failedRead, 'dispatch_assignment_read_failed');
  assertFailure(failedWrite, 'dispatch_assignment_write_failed');
  assertFailure(invalidStatus, 'dispatch_status_unsupported');
  assertNoUnsafeLeak(failedRead);
  assertNoUnsafeLeak(failedWrite);
  assertNoUnsafeLeak(invalidStatus);
});

test('validation requires organization isolation, actor for writes, and a bounded intent', async () => {
  const adapter = createDispatchAssignmentSqlRepositoryAdapter({
    dbClient: createSyntheticDbClient(),
  });

  assertFailure(await adapter.findAssignmentState({ assignmentId: ASSIGNMENT_ID }), 'organization_id_required');
  assertFailure(await adapter.findAssignmentState({ organizationId: ORG_ID }), 'dispatch_assignment_identifier_required');
  assertFailure(await adapter.recordAssignmentIntent({ organizationId: ORG_ID, actorId: ACTOR_ID }), 'dispatch_assignment_id_required');
  assertFailure(await adapter.recordAssignmentIntent({ assignmentId: ASSIGNMENT_ID, actorId: ACTOR_ID }), 'organization_id_required');
  assertFailure(await adapter.recordAssignmentIntent({ assignmentId: ASSIGNMENT_ID, organizationId: ORG_ID }), 'actor_id_required');
  assertFailure(await adapter.recordAssignmentIntent({
    assignmentId: ASSIGNMENT_ID,
    organizationId: ORG_ID,
    actorId: ACTOR_ID,
  }), 'dispatch_assignment_intent_required');
});
