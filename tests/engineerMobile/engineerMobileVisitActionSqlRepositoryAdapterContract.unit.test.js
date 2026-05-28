'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createEngineerMobileVisitActionSqlRepositoryAdapter,
} = require('../../src/engineerMobile/engineerMobileVisitActionSqlRepositoryAdapter');
const {
  normalizeEngineerMobileVisitActionRepositoryResult,
} = require('../../src/engineerMobile/engineerMobileVisitActionRepositoryContract');
const {
  normalizeEngineerMobileVisitActionWriterResult,
} = require('../../src/engineerMobile/engineerMobileVisitActionWriterResultNormalizer');

const NOW = '2026-05-29T04:15:00.000Z';
const ACTOR_ID = '11111111-1111-4111-8111-111111111111';
const APPOINTMENT_ID = '22222222-2222-4222-8222-222222222222';
const ORGANIZATION_ID = '33333333-3333-4333-8333-333333333333';
const CASE_ID = '44444444-4444-4444-8444-444444444444';

function transitionPatchEnvelope(overrides = {}) {
  const patch = {
    mobileVisitStatus: 'working',
    updatedBy: ACTOR_ID,
    updatedAt: NOW,
    ...(overrides.patch || {}),
  };

  return {
    patchKind: 'engineer_mobile.visit_action_transition_patch',
    entityType: 'appointment',
    entityId: APPOINTMENT_ID,
    organizationId: ORGANIZATION_ID,
    action: 'engineer_mobile.start_work',
    patch,
    auditContext: {
      actorId: ACTOR_ID,
      caseId: CASE_ID,
      appointmentId: APPOINTMENT_ID,
      requestId: 'req_task_1866',
    },
    ...Object.fromEntries(Object.entries(overrides).filter(([key]) => key !== 'patch')),
  };
}

function auditEventEnvelope(overrides = {}) {
  const action = overrides.action || 'engineer_mobile.start_work.allowed';
  const auditEvent = {
    action,
    entityType: 'appointment',
    entityId: APPOINTMENT_ID,
    actorId: ACTOR_ID,
    organizationId: ORGANIZATION_ID,
    occurredAt: NOW,
    caseId: CASE_ID,
    appointmentId: APPOINTMENT_ID,
    requestId: 'req_task_1866',
    ...(overrides.auditEvent || {}),
  };

  return {
    eventKind: 'engineer_mobile.visit_action_audit_event',
    action,
    entityType: 'appointment',
    entityId: APPOINTMENT_ID,
    actorId: ACTOR_ID,
    organizationId: ORGANIZATION_ID,
    occurredAt: NOW,
    auditEvent,
    ...Object.fromEntries(Object.entries(overrides).filter(([key]) => key !== 'auditEvent')),
  };
}

function validInput(overrides = {}) {
  return {
    transitionPatchEnvelope: transitionPatchEnvelope(overrides.transitionPatchEnvelope || {}),
    auditEventEnvelope: auditEventEnvelope(overrides.auditEventEnvelope || {}),
  };
}

function assertNoLeak(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'raw rejected error should not leak',
    'raw transaction client row should not leak',
    'raw stack trace should not leak',
    'raw SQL detail should not leak',
    'raw provider send should not leak',
    'raw completion report should not leak',
    'raw final appointment should not leak',
    'raw customer publication should not leak',
    ['DATABASE', '_URL'].join(''),
    'postgres' + '://',
    'fieldServiceReport',
    'completionReport',
    'finalAppointmentId',
    'customerVisiblePublication',
    'providerPayload',
    'rows',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

function assertResultEnvelopeAllowlist(result) {
  const allowedKeys = [
    'adapterKind',
    'auditRecorded',
    'ok',
    'persisted',
    'reasonCode',
    'transitionPersisted',
    'validationReasonCode',
    'written',
  ];

  for (const key of Object.keys(result)) {
    assert.equal(allowedKeys.includes(key), true, `unexpected result key ${key}`);
  }
}

function assertQuerySpecIsParameterized(querySpec) {
  assert.equal(typeof querySpec.text, 'string');
  assert.equal(Array.isArray(querySpec.values), true);
  assert.equal(Object.isFrozen(querySpec.values), true);
  assert.equal(querySpec.text.includes('${'), false);
  assert.equal(querySpec.text.includes(APPOINTMENT_ID), false);
  assert.equal(querySpec.text.includes(ORGANIZATION_ID), false);
  assert.equal(querySpec.text.includes(ACTOR_ID), false);
  assert.equal(querySpec.text.includes(CASE_ID), false);
  assert.equal(querySpec.text.includes('req_task_1866'), false);
}

test('successful adapter result satisfies repository and writer normalizer contracts', async () => {
  const calls = [];
  const adapter = createEngineerMobileVisitActionSqlRepositoryAdapter({
    dbClient: {
      query(querySpec) {
        calls.push(querySpec);

        return {
          rowCount: 1,
          rows: [{ rawRow: 'raw transaction client row should not leak' }],
        };
      },
    },
  });
  const result = await adapter.persist(validInput());
  const repositoryResult = normalizeEngineerMobileVisitActionRepositoryResult(result);
  const writerResult = normalizeEngineerMobileVisitActionWriterResult({
    writerKind: 'transition',
    result,
  });

  assert.equal(result.ok, true);
  assert.equal(repositoryResult.ok, true);
  assert.equal(repositoryResult.transitionPersisted, true);
  assert.equal(repositoryResult.auditRecorded, true);
  assert.equal(writerResult.ok, true);
  assertResultEnvelopeAllowlist(result);
  assert.equal(calls.length, 2);
  calls.forEach(assertQuerySpecIsParameterized);
  assertNoLeak(result);
});

test('failure adapter result remains compatible with writer failure behavior', async () => {
  const adapter = createEngineerMobileVisitActionSqlRepositoryAdapter({
    dbClient: {
      query() {
        return {
          rowCount: 0,
          rows: [{ rawRow: 'raw SQL detail should not leak' }],
        };
      },
    },
  });
  const result = await adapter.persist(validInput());
  const writerResult = normalizeEngineerMobileVisitActionWriterResult({
    writerKind: 'transition',
    result,
  });

  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'appointment_not_found_or_denied');
  assert.equal(writerResult.ok, false);
  assert.equal(writerResult.reasonCode, 'writer_failed');
  assertResultEnvelopeAllowlist(result);
  assertNoLeak(result);
});

test('rejected async query is sanitized and exposes no raw client error', async () => {
  const adapter = createEngineerMobileVisitActionSqlRepositoryAdapter({
    dbClient: {
      query() {
        return Promise.reject(new Error('raw rejected error should not leak'));
      },
    },
  });
  const result = await adapter.persist(validInput());

  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'repository_write_failed');
  assertResultEnvelopeAllowlist(result);
  assertNoLeak(result);
});

test('transaction client is used when provided and root client is not queried inside transaction', async () => {
  const rootCalls = [];
  const transactionCalls = [];
  const adapter = createEngineerMobileVisitActionSqlRepositoryAdapter({
    dbClient: {
      query(querySpec) {
        rootCalls.push(querySpec);
        throw new Error('root client should not be queried');
      },
      transaction(callback) {
        return callback({
          query(querySpec) {
            transactionCalls.push(querySpec);

            return { rowCount: 1 };
          },
        });
      },
    },
  });
  const result = await adapter.persist(validInput());

  assert.equal(result.ok, true);
  assert.deepEqual(rootCalls, []);
  assert.equal(transactionCalls.length, 2);
  transactionCalls.forEach(assertQuerySpecIsParameterized);
  assertNoLeak(result);
});

test('unsafe completion report final appointment and publication input is denied before query', async () => {
  const calls = [];
  const adapter = createEngineerMobileVisitActionSqlRepositoryAdapter({
    dbClient: {
      query(querySpec) {
        calls.push(querySpec);

        return { rowCount: 1 };
      },
    },
  });
  const result = await adapter.persist(validInput({
    transitionPatchEnvelope: {
      patch: {
        fieldServiceReport: 'raw completion report should not leak',
      },
    },
  }));
  const finalAppointmentResult = await adapter.persist(validInput({
    transitionPatchEnvelope: {
      finalAppointmentId: 'raw final appointment should not leak',
    },
  }));

  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'completion_report_boundary');
  assert.equal(finalAppointmentResult.ok, false);
  assert.equal(finalAppointmentResult.reasonCode, 'final_appointment_boundary');
  assert.deepEqual(calls, []);
  assertNoLeak(result);
  assertNoLeak(finalAppointmentResult);
});
