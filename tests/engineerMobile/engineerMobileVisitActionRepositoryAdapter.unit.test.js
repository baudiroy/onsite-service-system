'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  ENGINEER_MOBILE_VISIT_ACTION_REPOSITORY_ADAPTER_KIND,
  createEngineerMobileVisitActionRepositoryAdapter,
} = require('../../src/engineerMobile/engineerMobileVisitActionRepositoryAdapter');

const NOW = '2026-05-28T18:30:00.000Z';

function transitionPatchEnvelope(overrides = {}) {
  const patch = {
    mobileVisitStatus: 'traveling',
    updatedBy: 'eng_task_1844',
    updatedAt: NOW,
    ...(overrides.patch || {}),
  };

  return {
    patchKind: 'engineer_mobile.visit_action_transition_patch',
    entityType: 'appointment',
    entityId: 'apt_task_1844',
    organizationId: 'org_task_1844',
    action: 'engineer_mobile.start_travel',
    patch,
    auditContext: {
      actorId: 'eng_task_1844',
      appointmentId: 'apt_task_1844',
      requestId: 'req_task_1844',
    },
    ...Object.fromEntries(Object.entries(overrides).filter(([key]) => key !== 'patch')),
  };
}

function auditEventEnvelope(overrides = {}) {
  const action = overrides.action || 'engineer_mobile.start_travel.allowed';
  const auditEvent = {
    action,
    entityType: 'appointment',
    entityId: 'apt_task_1844',
    actorId: 'eng_task_1844',
    organizationId: 'org_task_1844',
    occurredAt: NOW,
    caseId: 'case_task_1844',
    appointmentId: 'apt_task_1844',
    requestId: 'req_task_1844',
    ...(overrides.auditEvent || {}),
  };

  return {
    eventKind: 'engineer_mobile.visit_action_audit_event',
    action,
    entityType: 'appointment',
    entityId: 'apt_task_1844',
    actorId: 'eng_task_1844',
    organizationId: 'org_task_1844',
    occurredAt: NOW,
    auditEvent,
    ...Object.fromEntries(Object.entries(overrides).filter(([key]) => key !== 'auditEvent')),
  };
}

function validInput(overrides = {}) {
  return {
    transitionPatchEnvelope: transitionPatchEnvelope(overrides.transitionPatchEnvelope || {}),
    ...(
      overrides.auditEventEnvelope === undefined
        ? {}
        : { auditEventEnvelope: auditEventEnvelope(overrides.auditEventEnvelope || {}) }
    ),
  };
}

function createAdapter({ calls = [], executeImpl } = {}) {
  return createEngineerMobileVisitActionRepositoryAdapter({
    dbClient: {
      execute(operationIntent) {
        calls.push(operationIntent);
        return executeImpl ? executeImpl(operationIntent) : { ok: true };
      },
    },
  });
}

function assertFailure(result, reasonCode) {
  assert.equal(result.ok, false);
  assert.equal(result.adapterKind, ENGINEER_MOBILE_VISIT_ACTION_REPOSITORY_ADAPTER_KIND);
  assert.equal(result.reasonCode, reasonCode);
}

function assertSuccess(result, auditRecorded = 'not_provided') {
  assert.equal(result.ok, true);
  assert.equal(result.adapterKind, ENGINEER_MOBILE_VISIT_ACTION_REPOSITORY_ADAPTER_KIND);
  assert.equal(result.reasonCode, 'repository_write_succeeded');
  assert.equal(result.transitionPersisted, true);
  assert.equal(result.auditRecorded, auditRecorded);
}

function assertNoRawLeak(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'raw phone should not leak',
    'raw address should not leak',
    'raw line should not leak',
    'raw customer should not leak',
    'raw private note should not leak',
    'raw report draft should not leak',
    'raw provider payload should not leak',
    'raw db metadata should not leak',
    'raw sql should not leak',
    'raw credential should not leak',
    'raw publication should not leak',
    'raw thrown error should not leak',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test('missing dbClient returns db_client_required', () => {
  const adapter = createEngineerMobileVisitActionRepositoryAdapter({});
  const result = adapter.persist(validInput());

  assert.equal(adapter.kind, ENGINEER_MOBILE_VISIT_ACTION_REPOSITORY_ADAPTER_KIND);
  assertFailure(result, 'db_client_required');
});

test('missing dbClient.execute returns db_client_required', () => {
  const adapter = createEngineerMobileVisitActionRepositoryAdapter({ dbClient: {} });

  assertFailure(adapter.persist(validInput()), 'db_client_required');
});

test('valid transition-only input calls dbClient.execute once with sanitized operation intent', () => {
  const calls = [];
  const adapter = createAdapter({ calls });
  const result = adapter.persist(validInput());

  assertSuccess(result);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], {
    operationKind: 'engineer_mobile.visit_action_repository.operation_intent',
    operationName: 'persist_engineer_mobile_visit_action',
    entityType: 'appointment',
    entityId: 'apt_task_1844',
    organizationId: 'org_task_1844',
    action: 'engineer_mobile.start_travel',
    parameters: {
      mobileVisitStatus: 'traveling',
      updatedBy: 'eng_task_1844',
      updatedAt: NOW,
    },
  });
});

test('valid transition plus audit input calls dbClient.execute once with sanitized operation intent', () => {
  const calls = [];
  const adapter = createAdapter({ calls });
  const result = adapter.persist(validInput({ auditEventEnvelope: {} }));

  assertSuccess(result, true);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].parameters.auditEvent, {
    eventKind: 'engineer_mobile.visit_action_audit_event',
    action: 'engineer_mobile.start_travel.allowed',
    entityType: 'appointment',
    entityId: 'apt_task_1844',
    actorId: 'eng_task_1844',
    organizationId: 'org_task_1844',
    occurredAt: NOW,
    caseId: 'case_task_1844',
    appointmentId: 'apt_task_1844',
    requestId: 'req_task_1844',
  });
});

test('validation denial is preserved for entity_id_required', () => {
  const calls = [];
  const adapter = createAdapter({ calls });
  const result = adapter.persist(validInput({
    transitionPatchEnvelope: { entityId: undefined },
  }));

  assertFailure(result, 'entity_id_required');
  assert.equal(result.validationReasonCode, 'entity_id_required');
  assert.deepEqual(calls, []);
});

test('organization mismatch is preserved', () => {
  const calls = [];
  const adapter = createAdapter({ calls });
  const result = adapter.persist(validInput({
    auditEventEnvelope: { organizationId: 'org_other' },
  }));

  assertFailure(result, 'organization_mismatch');
  assert.deepEqual(calls, []);
});

test('entity mismatch is preserved', () => {
  const calls = [];
  const adapter = createAdapter({ calls });
  const result = adapter.persist(validInput({
    auditEventEnvelope: { entityId: 'apt_other' },
  }));

  assertFailure(result, 'entity_mismatch');
  assert.deepEqual(calls, []);
});

test('dbClient success variants normalize to persisted success', () => {
  for (const executeResult of [
    undefined,
    null,
    true,
    { ok: true },
    { accepted: true },
    { persisted: true },
    { written: true },
    { appointmentUpdated: true },
  ]) {
    const adapter = createAdapter({
      executeImpl() {
        return executeResult;
      },
    });

    assertSuccess(adapter.persist(validInput()));
  }
});

test('dbClient failure variants return repository_write_failed', () => {
  for (const executeResult of [
    false,
    { ok: false },
    { accepted: false },
    { persisted: false },
    { written: false },
    { appointmentUpdated: false },
    { error: 'raw db metadata should not leak' },
  ]) {
    const adapter = createAdapter({
      executeImpl() {
        return executeResult;
      },
    });
    const result = adapter.persist(validInput());

    assertFailure(result, 'repository_write_failed');
    assertNoRawLeak(result);
  }
});

test('unknown object result fails closed', () => {
  const adapter = createAdapter({
    executeImpl() {
      return { message: 'unknown shape should fail closed' };
    },
  });

  assertFailure(adapter.persist(validInput()), 'repository_write_failed');
});

test('dbClient thrown error returns repository_write_failed without raw error', () => {
  const adapter = createAdapter({
    executeImpl() {
      throw new Error('raw thrown error should not leak');
    },
  });
  const result = adapter.persist(validInput());

  assertFailure(result, 'repository_write_failed');
  assertNoRawLeak(result);
});

test('dbClient is not called when input validation fails', () => {
  const calls = [];
  const adapter = createAdapter({ calls });
  const result = adapter.persist(validInput({
    transitionPatchEnvelope: {
      patch: { customerPhone: 'raw phone should not leak' },
    },
  }));

  assertFailure(result, 'unsafe_field_detected');
  assert.deepEqual(calls, []);
  assertNoRawLeak(result);
});

test('operation intent does not include phone address LINE customer raw data private notes or report draft fields', () => {
  const calls = [];
  const adapter = createAdapter({ calls });
  const result = adapter.persist(validInput({
    auditEventEnvelope: {},
  }));
  const serialized = JSON.stringify(calls[0]);

  assertSuccess(result, true);
  assert.equal(serialized.includes('phone'), false);
  assert.equal(serialized.includes('address'), false);
  assert.equal(serialized.includes('line'), false);
  assert.equal(serialized.includes('customer'), false);
  assert.equal(serialized.includes('privateNote'), false);
  assert.equal(serialized.includes('reportDraft'), false);
});

test('operation intent does not include raw SQL strings DB URLs credentials provider payloads or publication fields', () => {
  const calls = [];
  const adapter = createAdapter({ calls });

  assertSuccess(adapter.persist(validInput()));

  const serialized = JSON.stringify(calls[0]);

  for (const forbidden of [
    'SELECT',
    'INSERT',
    'UPDATE',
    'DELETE',
    'postgres' + '://',
    'DATABASE_URL',
    'raw credential should not leak',
    'raw provider payload should not leak',
    'raw publication should not leak',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `operation intent contains ${forbidden}`);
  }
});

test('inputs are not mutated', () => {
  const input = validInput({
    transitionPatchEnvelope: {
      action: 'engineer_mobile.record_visit_result',
      patch: {
        mobileVisitStatus: 'visit_result_recorded',
        visitResult: 'parts_required',
      },
    },
    auditEventEnvelope: {
      action: 'engineer_mobile.record_visit_result.allowed',
    },
  });
  const before = clone(input);
  const adapter = createAdapter();

  adapter.persist(input);

  assert.deepEqual(input, before);
});

test('dbClient mutation of received operation intent does not mutate returned safe result', () => {
  const adapter = createAdapter({
    executeImpl(operationIntent) {
      operationIntent.parameters.mobileVisitStatus = 'raw customer should not leak';
      operationIntent.parameters.providerPayload = 'raw provider payload should not leak';
      return { ok: true };
    },
  });
  const result = adapter.persist(validInput());

  assertSuccess(result);
  assertNoRawLeak(result);
});

test('no Completion Report Field Service Report or finalAppointmentId behavior appears in results', () => {
  const adapter = createAdapter();
  const completionResult = adapter.persist(validInput({
    transitionPatchEnvelope: { completionReportId: 'raw report draft should not leak' },
  }));
  const finalAppointmentResult = adapter.persist(validInput({
    transitionPatchEnvelope: { finalAppointmentId: 'apt_final_should_not_pass' },
  }));
  const successResult = adapter.persist(validInput());

  assertFailure(completionResult, 'completion_report_boundary');
  assertFailure(finalAppointmentResult, 'final_appointment_boundary');
  assertNoRawLeak(successResult);
  assert.equal(JSON.stringify(successResult).includes('finalAppointmentId'), false);
  assert.equal(JSON.stringify(successResult).includes('FieldServiceReport'), false);
  assert.equal(JSON.stringify(successResult).includes('CompletionReport'), false);
});
