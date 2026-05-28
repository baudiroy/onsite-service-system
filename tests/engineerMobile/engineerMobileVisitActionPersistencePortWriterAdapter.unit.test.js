'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  ENGINEER_MOBILE_VISIT_ACTION_PERSISTENCE_PORT_WRITER_ADAPTER_KIND,
  createEngineerMobileVisitActionPersistencePortWriterAdapter,
} = require('../../src/engineerMobile/engineerMobileVisitActionPersistencePortWriterAdapter');

const NOW = '2026-05-28T18:00:00.000Z';

function transitionPatchEnvelope(overrides = {}) {
  const patch = {
    mobileVisitStatus: 'traveling',
    updatedBy: 'eng_task_1830',
    updatedAt: NOW,
    ...(overrides.patch || {}),
  };

  return {
    patchKind: 'engineer_mobile.visit_action_transition_patch',
    entityType: 'appointment',
    entityId: 'apt_task_1830',
    organizationId: 'org_task_1830',
    action: 'engineer_mobile.start_travel',
    patch,
    auditContext: {
      actorId: 'eng_task_1830',
      appointmentId: 'apt_task_1830',
      requestId: 'req_task_1830',
    },
    ...Object.fromEntries(Object.entries(overrides).filter(([key]) => key !== 'patch')),
  };
}

function auditEventEnvelope(overrides = {}) {
  const action = overrides.action || 'engineer_mobile.start_travel.allowed';
  const auditEvent = {
    action,
    entityType: 'appointment',
    entityId: 'apt_task_1830',
    actorId: 'eng_task_1830',
    organizationId: 'org_task_1830',
    occurredAt: NOW,
    caseId: 'case_task_1830',
    appointmentId: 'apt_task_1830',
    requestId: 'req_task_1830',
    ...(overrides.auditEvent || {}),
  };

  return {
    eventKind: 'engineer_mobile.visit_action_audit_event',
    action,
    entityType: 'appointment',
    entityId: 'apt_task_1830',
    actorId: 'eng_task_1830',
    organizationId: 'org_task_1830',
    occurredAt: NOW,
    auditEvent,
    ...Object.fromEntries(Object.entries(overrides).filter(([key]) => key !== 'auditEvent')),
  };
}

function adapterWithPort({ calls = [], portImpl } = {}) {
  return createEngineerMobileVisitActionPersistencePortWriterAdapter({
    persistencePort: {
      persist(payload) {
        calls.push(payload);
        return portImpl ? portImpl(payload) : { ok: true };
      },
    },
  });
}

function assertFailure(result, reasonCode) {
  assert.equal(result.ok, false);
  assert.equal(result.persisted, false);
  assert.equal(result.adapterKind, ENGINEER_MOBILE_VISIT_ACTION_PERSISTENCE_PORT_WRITER_ADAPTER_KIND);
  assert.equal(result.reasonCode, reasonCode);
}

function assertPersisted(result) {
  assert.equal(result.ok, true);
  assert.equal(result.persisted, true);
  assert.equal(result.adapterKind, ENGINEER_MOBILE_VISIT_ACTION_PERSISTENCE_PORT_WRITER_ADAPTER_KIND);
  assert.equal(result.reasonCode, 'persistence_port_written');
  assert.equal(result.validation.reasonCode, 'persistence_port_input_valid');
  assert.equal(result.validation.transitionPatch.entityId, 'apt_task_1830');
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
    'raw_repository_should_not_leak',
    'raw_publication_should_not_leak',
    'raw_persistence_port_error_should_not_leak',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test('missing persistencePort returns persistence_port_required', () => {
  const adapter = createEngineerMobileVisitActionPersistencePortWriterAdapter({});
  const result = adapter.persist({ transitionPatchEnvelope: transitionPatchEnvelope() });

  assert.equal(adapter.kind, ENGINEER_MOBILE_VISIT_ACTION_PERSISTENCE_PORT_WRITER_ADAPTER_KIND);
  assertFailure(result, 'persistence_port_required');
});

test('missing persistencePort.persist returns persistence_port_required', () => {
  const adapter = createEngineerMobileVisitActionPersistencePortWriterAdapter({
    persistencePort: {},
  });

  assertFailure(
    adapter.persist({ transitionPatchEnvelope: transitionPatchEnvelope() }),
    'persistence_port_required',
  );
});

test('valid transition patch without audit event calls persistencePort.persist once', () => {
  const calls = [];
  const adapter = adapterWithPort({ calls });
  const result = adapter.persist({ transitionPatchEnvelope: transitionPatchEnvelope() });

  assertPersisted(result);
  assert.equal(result.validation.auditEvent, undefined);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].transitionPatchEnvelope.entityId, 'apt_task_1830');
  assert.equal(calls[0].auditEventEnvelope, undefined);
});

test('valid transition patch with valid audit event calls persistencePort.persist once', () => {
  const calls = [];
  const adapter = adapterWithPort({ calls });
  const result = adapter.persist({
    transitionPatchEnvelope: transitionPatchEnvelope(),
    auditEventEnvelope: auditEventEnvelope(),
  });

  assertPersisted(result);
  assert.equal(result.validation.auditEvent.entityId, 'apt_task_1830');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].auditEventEnvelope.entityId, 'apt_task_1830');
});

test('contract denial is preserved for entity_id_required', () => {
  const calls = [];
  const adapter = adapterWithPort({ calls });
  const result = adapter.persist({
    transitionPatchEnvelope: transitionPatchEnvelope({ entityId: undefined }),
  });

  assertFailure(result, 'entity_id_required');
  assert.equal(result.contractReasonCode, 'transition_patch_invalid');
  assert.equal(result.transitionReasonCode, 'entity_id_required');
  assert.deepEqual(calls, []);
});

test('organization mismatch is preserved', () => {
  const calls = [];
  const adapter = adapterWithPort({ calls });
  const result = adapter.persist({
    transitionPatchEnvelope: transitionPatchEnvelope(),
    auditEventEnvelope: auditEventEnvelope({ organizationId: 'org_other' }),
  });

  assertFailure(result, 'organization_mismatch');
  assert.equal(result.contractReasonCode, 'organization_mismatch');
  assert.deepEqual(calls, []);
});

test('entity mismatch is preserved', () => {
  const calls = [];
  const adapter = adapterWithPort({ calls });
  const result = adapter.persist({
    transitionPatchEnvelope: transitionPatchEnvelope(),
    auditEventEnvelope: auditEventEnvelope({ entityId: 'apt_other' }),
  });

  assertFailure(result, 'entity_mismatch');
  assert.equal(result.contractReasonCode, 'entity_mismatch');
  assert.deepEqual(calls, []);
});

test('persistence success variants succeed', () => {
  for (const portResult of [
    undefined,
    null,
    true,
    { ok: true },
    { accepted: true },
    { persisted: true },
    { written: true },
  ]) {
    const adapter = adapterWithPort({
      portImpl() {
        return portResult;
      },
    });

    assertPersisted(adapter.persist({ transitionPatchEnvelope: transitionPatchEnvelope() }));
  }
});

test('persistence failure variants return persistence_port_write_failed', () => {
  for (const portResult of [
    false,
    { ok: false },
    { accepted: false },
    { persisted: false },
    { written: false },
    { error: 'raw_persistence_port_error_should_not_leak' },
  ]) {
    const adapter = adapterWithPort({
      portImpl() {
        return portResult;
      },
    });
    const result = adapter.persist({ transitionPatchEnvelope: transitionPatchEnvelope() });

    assertFailure(result, 'persistence_port_write_failed');
    assertNoLeak(result);
  }
});

test('unknown object result fails closed', () => {
  const adapter = adapterWithPort({
    portImpl() {
      return { message: 'unknown object shape fails closed' };
    },
  });
  const result = adapter.persist({ transitionPatchEnvelope: transitionPatchEnvelope() });

  assertFailure(result, 'persistence_port_write_failed');
});

test('persistence throw returns persistence_port_write_failed without raw error', () => {
  const adapter = adapterWithPort({
    portImpl() {
      throw new Error('raw_persistence_port_error_should_not_leak');
    },
  });
  const result = adapter.persist({ transitionPatchEnvelope: transitionPatchEnvelope() });

  assertFailure(result, 'persistence_port_write_failed');
  assertNoLeak(result);
});

test('persistence port is not called when contract validation fails', () => {
  const calls = [];
  const adapter = adapterWithPort({ calls });
  const result = adapter.persist({
    transitionPatchEnvelope: transitionPatchEnvelope({ patch: { privateNote: 'raw_private_note_should_not_leak' } }),
  });

  assertFailure(result, 'unsafe_field_detected');
  assert.deepEqual(calls, []);
  assertNoLeak(result);
});

test('output does not include phone address LINE customer raw data private notes or report draft fields', () => {
  const adapter = adapterWithPort();
  const result = adapter.persist({
    transitionPatchEnvelope: transitionPatchEnvelope({ customerPhone: 'raw_phone_should_not_leak' }),
  });

  assertFailure(result, 'unsafe_field_detected');
  assertNoLeak(result);
});

test('persistence payload does not include DB repository provider or customer-visible publication fields', () => {
  const calls = [];
  const adapter = adapterWithPort({ calls });
  const result = adapter.persist({
    transitionPatchEnvelope: transitionPatchEnvelope(),
    auditEventEnvelope: auditEventEnvelope(),
    dbMetadata: 'raw_db_metadata_should_not_leak',
    repositoryName: 'raw_repository_should_not_leak',
    providerPayload: 'raw_provider_payload_should_not_leak',
    customerVisiblePublication: 'raw_publication_should_not_leak',
  });

  assertPersisted(result);
  assertNoLeak(calls);
  assert.deepEqual(Object.keys(calls[0]).sort(), [
    'auditEventEnvelope',
    'transitionPatchEnvelope',
  ].sort());
});

test('inputs are not mutated', () => {
  const transition = transitionPatchEnvelope({
    patch: {
      mobileVisitStatus: 'visit_result_recorded',
      visitResult: 'resolved',
    },
  });
  const audit = auditEventEnvelope({ action: 'engineer_mobile.record_visit_result.allowed' });
  const beforeTransition = clone(transition);
  const beforeAudit = clone(audit);
  const adapter = adapterWithPort();

  adapter.persist({ transitionPatchEnvelope: transition, auditEventEnvelope: audit });

  assert.deepEqual(transition, beforeTransition);
  assert.deepEqual(audit, beforeAudit);
});

test('persistence port mutation of received payload does not mutate returned safe result', () => {
  const adapter = adapterWithPort({
    portImpl(payload) {
      payload.transitionPatchEnvelope.entityId = 'mutated_apt';
      payload.transitionPatchEnvelope.rawProviderPayload = 'raw_provider_payload_should_not_leak';
      return { ok: true };
    },
  });
  const result = adapter.persist({
    transitionPatchEnvelope: transitionPatchEnvelope(),
    auditEventEnvelope: auditEventEnvelope(),
  });

  assertPersisted(result);
  assert.equal(result.validation.transitionPatch.entityId, 'apt_task_1830');
  assertNoLeak(result);
});
