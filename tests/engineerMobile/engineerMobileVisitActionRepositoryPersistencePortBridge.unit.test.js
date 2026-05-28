'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  ENGINEER_MOBILE_VISIT_ACTION_REPOSITORY_PERSISTENCE_PORT_BRIDGE_KIND,
  createEngineerMobileVisitActionRepositoryPersistencePortBridge,
} = require('../../src/engineerMobile/engineerMobileVisitActionRepositoryPersistencePortBridge');

const NOW = '2026-05-28T19:00:00.000Z';

function transitionPatchEnvelope(overrides = {}) {
  const patch = {
    mobileVisitStatus: 'traveling',
    updatedBy: 'eng_task_1846',
    updatedAt: NOW,
    ...(overrides.patch || {}),
  };

  return {
    patchKind: 'engineer_mobile.visit_action_transition_patch',
    entityType: 'appointment',
    entityId: 'apt_task_1846',
    organizationId: 'org_task_1846',
    action: 'engineer_mobile.start_travel',
    patch,
    auditContext: {
      actorId: 'eng_task_1846',
      appointmentId: 'apt_task_1846',
      requestId: 'req_task_1846',
    },
    ...Object.fromEntries(Object.entries(overrides).filter(([key]) => key !== 'patch')),
  };
}

function builderTransitionPatchEnvelope(overrides = {}) {
  const envelope = transitionPatchEnvelope(overrides);

  delete envelope.patchKind;
  envelope.patchBuilderKind = 'engineer_mobile.visit_action_transition_patch_builder';

  return envelope;
}

function auditEventEnvelope(overrides = {}) {
  const action = overrides.action || 'engineer_mobile.start_travel.allowed';
  const auditEvent = {
    action,
    entityType: 'appointment',
    entityId: 'apt_task_1846',
    actorId: 'eng_task_1846',
    organizationId: 'org_task_1846',
    occurredAt: NOW,
    caseId: 'case_task_1846',
    appointmentId: 'apt_task_1846',
    requestId: 'req_task_1846',
    ...(overrides.auditEvent || {}),
  };

  return {
    eventKind: 'engineer_mobile.visit_action_audit_event',
    action,
    entityType: 'appointment',
    entityId: 'apt_task_1846',
    actorId: 'eng_task_1846',
    organizationId: 'org_task_1846',
    occurredAt: NOW,
    auditEvent,
    ...Object.fromEntries(Object.entries(overrides).filter(([key]) => key !== 'auditEvent')),
  };
}

function builderAuditEventEnvelope(overrides = {}) {
  const envelope = auditEventEnvelope(overrides);

  delete envelope.eventKind;
  envelope.auditEventBuilderKind = 'engineer_mobile.visit_action_audit_event_builder';

  return envelope;
}

function validInput(overrides = {}) {
  return {
    transitionPatchEnvelope: overrides.transitionPatchEnvelope || transitionPatchEnvelope(),
    ...(
      overrides.auditEventEnvelope === undefined
        ? {}
        : { auditEventEnvelope: overrides.auditEventEnvelope || auditEventEnvelope() }
    ),
  };
}

function createBridge({ calls = [], persistImpl } = {}) {
  return createEngineerMobileVisitActionRepositoryPersistencePortBridge({
    repositoryAdapter: {
      persist(payload) {
        calls.push(payload);
        return persistImpl ? persistImpl(payload) : { ok: true, auditRecorded: payload.auditEventEnvelope ? true : undefined };
      },
    },
  });
}

function assertFailure(result, reasonCode) {
  assert.equal(result.ok, false);
  assert.equal(result.persisted, false);
  assert.equal(result.bridgeKind, ENGINEER_MOBILE_VISIT_ACTION_REPOSITORY_PERSISTENCE_PORT_BRIDGE_KIND);
  assert.equal(result.reasonCode, reasonCode);
}

function assertPersisted(result, auditRecorded = 'not_provided') {
  assert.equal(result.ok, true);
  assert.equal(result.persisted, true);
  assert.equal(result.bridgeKind, ENGINEER_MOBILE_VISIT_ACTION_REPOSITORY_PERSISTENCE_PORT_BRIDGE_KIND);
  assert.equal(result.reasonCode, 'persistence_port_written');
  assert.equal(result.repositoryReasonCode, 'repository_write_succeeded');
  assert.equal(result.transitionPersisted, true);
  assert.equal(result.auditRecorded, auditRecorded);
  assert.equal(result.validationReasonCode, 'repository_input_valid');
}

function assertNoLeak(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'raw_phone_should_not_leak',
    'raw_address_should_not_leak',
    'raw_line_should_not_leak',
    'raw_customer_should_not_leak',
    'raw_private_note_should_not_leak',
    'raw_report_draft_should_not_leak',
    'raw_provider_payload_should_not_leak',
    'raw_db_metadata_should_not_leak',
    'raw_sql_should_not_leak',
    'raw_credential_should_not_leak',
    'raw_publication_should_not_leak',
    'raw_repository_error_should_not_leak',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test('missing repositoryAdapter returns repository_adapter_required', () => {
  const bridge = createEngineerMobileVisitActionRepositoryPersistencePortBridge({});
  const result = bridge.persist(validInput());

  assert.equal(bridge.kind, ENGINEER_MOBILE_VISIT_ACTION_REPOSITORY_PERSISTENCE_PORT_BRIDGE_KIND);
  assertFailure(result, 'repository_adapter_required');
});

test('missing repositoryAdapter.persist returns repository_adapter_required', () => {
  const bridge = createEngineerMobileVisitActionRepositoryPersistencePortBridge({
    repositoryAdapter: {},
  });

  assertFailure(bridge.persist(validInput()), 'repository_adapter_required');
});

test('valid transition-only input calls repository adapter once', () => {
  const calls = [];
  const bridge = createBridge({ calls });
  const result = bridge.persist(validInput());

  assertPersisted(result);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], {
    transitionPatchEnvelope: transitionPatchEnvelope(),
  });
});

test('valid transition plus audit input calls repository adapter once', () => {
  const calls = [];
  const bridge = createBridge({ calls });
  const result = bridge.persist(validInput({ auditEventEnvelope: auditEventEnvelope() }));

  assertPersisted(result, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].transitionPatchEnvelope.entityId, 'apt_task_1846');
  assert.equal(calls[0].auditEventEnvelope.entityId, 'apt_task_1846');
});

test('builder envelope variants are converted before repository validation', () => {
  const calls = [];
  const bridge = createBridge({ calls });
  const result = bridge.persist({
    transitionPatchEnvelope: builderTransitionPatchEnvelope(),
    auditEventEnvelope: builderAuditEventEnvelope(),
  });

  assertPersisted(result, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].transitionPatchEnvelope.patchKind, 'engineer_mobile.visit_action_transition_patch');
  assert.equal(calls[0].transitionPatchEnvelope.patchBuilderKind, undefined);
  assert.equal(calls[0].auditEventEnvelope.eventKind, 'engineer_mobile.visit_action_audit_event');
  assert.equal(calls[0].auditEventEnvelope.auditEventBuilderKind, undefined);
});

test('validation denial is preserved for entity_id_required', () => {
  const calls = [];
  const bridge = createBridge({ calls });
  const result = bridge.persist(validInput({
    transitionPatchEnvelope: transitionPatchEnvelope({ entityId: undefined }),
  }));

  assertFailure(result, 'entity_id_required');
  assert.equal(result.validationReasonCode, 'entity_id_required');
  assert.deepEqual(calls, []);
});

test('organization mismatch is preserved', () => {
  const calls = [];
  const bridge = createBridge({ calls });
  const result = bridge.persist(validInput({
    auditEventEnvelope: auditEventEnvelope({ organizationId: 'org_other' }),
  }));

  assertFailure(result, 'organization_mismatch');
  assert.deepEqual(calls, []);
});

test('entity mismatch is preserved', () => {
  const calls = [];
  const bridge = createBridge({ calls });
  const result = bridge.persist(validInput({
    auditEventEnvelope: auditEventEnvelope({ entityId: 'apt_other' }),
  }));

  assertFailure(result, 'entity_mismatch');
  assert.deepEqual(calls, []);
});

test('repository success variants normalize to persistence-port-compatible success', () => {
  for (const repositoryResult of [
    undefined,
    null,
    true,
    { ok: true },
    { persisted: true },
    { written: true },
    { transitionPersisted: true },
  ]) {
    const bridge = createBridge({
      persistImpl() {
        return repositoryResult;
      },
    });

    assertPersisted(bridge.persist(validInput()));
  }
});

test('repository failure variants return repository_adapter_write_failed', () => {
  for (const repositoryResult of [
    false,
    { ok: false },
    { persisted: false },
    { written: false },
    { error: 'raw_repository_error_should_not_leak' },
  ]) {
    const bridge = createBridge({
      persistImpl() {
        return repositoryResult;
      },
    });
    const result = bridge.persist(validInput());

    assertFailure(result, 'repository_adapter_write_failed');
    assertNoLeak(result);
  }
});

test('unknown repository result fails closed', () => {
  const bridge = createBridge({
    persistImpl() {
      return { message: 'unknown repository shape fails closed' };
    },
  });

  assertFailure(bridge.persist(validInput()), 'repository_adapter_write_failed');
});

test('repository throw returns repository_adapter_write_failed without raw error', () => {
  const bridge = createBridge({
    persistImpl() {
      throw new Error('raw_repository_error_should_not_leak');
    },
  });
  const result = bridge.persist(validInput());

  assertFailure(result, 'repository_adapter_write_failed');
  assertNoLeak(result);
});

test('repository adapter is not called when validation fails', () => {
  const calls = [];
  const bridge = createBridge({ calls });
  const result = bridge.persist(validInput({
    transitionPatchEnvelope: transitionPatchEnvelope({
      patch: { privateNote: 'raw_private_note_should_not_leak' },
    }),
  }));

  assertFailure(result, 'unsafe_field_detected');
  assert.deepEqual(calls, []);
  assertNoLeak(result);
});

test('repository payload does not include phone address LINE customer raw data private notes or report draft fields', () => {
  const calls = [];
  const bridge = createBridge({ calls });
  const result = bridge.persist({
    transitionPatchEnvelope: transitionPatchEnvelope(),
    auditEventEnvelope: auditEventEnvelope(),
    phone: 'raw_phone_should_not_leak',
    address: 'raw_address_should_not_leak',
    lineProfile: 'raw_line_should_not_leak',
    customerName: 'raw_customer_should_not_leak',
    privateNote: 'raw_private_note_should_not_leak',
    reportDraft: 'raw_report_draft_should_not_leak',
  });

  assertPersisted(result, true);
  assertNoLeak(calls);
  assert.deepEqual(Object.keys(calls[0]).sort(), [
    'auditEventEnvelope',
    'transitionPatchEnvelope',
  ].sort());
});

test('repository payload does not include raw SQL strings DB URLs credentials provider payloads or publication fields', () => {
  const calls = [];
  const bridge = createBridge({ calls });
  const result = bridge.persist({
    transitionPatchEnvelope: transitionPatchEnvelope(),
    rawSql: 'raw_sql_should_not_leak',
    dbUrl: 'postgres' + '://raw_credential_should_not_leak',
    providerPayload: 'raw_provider_payload_should_not_leak',
    customerVisiblePublication: 'raw_publication_should_not_leak',
  });

  assertPersisted(result);
  assertNoLeak(calls);
});

test('inputs are not mutated', () => {
  const input = validInput({
    transitionPatchEnvelope: transitionPatchEnvelope({
      action: 'engineer_mobile.record_visit_result',
      patch: {
        mobileVisitStatus: 'visit_result_recorded',
        visitResult: 'resolved',
      },
    }),
    auditEventEnvelope: auditEventEnvelope({
      action: 'engineer_mobile.record_visit_result.allowed',
    }),
  });
  const before = clone(input);
  const bridge = createBridge();

  bridge.persist(input);

  assert.deepEqual(input, before);
});

test('repository adapter mutation of received payload does not mutate returned safe result', () => {
  const bridge = createBridge({
    persistImpl(payload) {
      payload.transitionPatchEnvelope.entityId = 'raw_customer_should_not_leak';
      payload.providerPayload = 'raw_provider_payload_should_not_leak';
      return { ok: true, auditRecorded: payload.auditEventEnvelope ? true : undefined };
    },
  });
  const result = bridge.persist(validInput({ auditEventEnvelope: auditEventEnvelope() }));

  assertPersisted(result, true);
  assertNoLeak(result);
});

test('no Completion Report Field Service Report or finalAppointmentId behavior appears in results', () => {
  const bridge = createBridge();
  const completionResult = bridge.persist(validInput({
    transitionPatchEnvelope: transitionPatchEnvelope({ completionReportId: 'raw_report_draft_should_not_leak' }),
  }));
  const finalAppointmentResult = bridge.persist(validInput({
    transitionPatchEnvelope: transitionPatchEnvelope({ finalAppointmentId: 'apt_final_should_not_pass' }),
  }));
  const successResult = bridge.persist(validInput());

  assertFailure(completionResult, 'completion_report_boundary');
  assertFailure(finalAppointmentResult, 'final_appointment_boundary');
  assertNoLeak(successResult);
  assert.equal(JSON.stringify(successResult).includes('finalAppointmentId'), false);
  assert.equal(JSON.stringify(successResult).includes('FieldServiceReport'), false);
  assert.equal(JSON.stringify(successResult).includes('CompletionReport'), false);
});
