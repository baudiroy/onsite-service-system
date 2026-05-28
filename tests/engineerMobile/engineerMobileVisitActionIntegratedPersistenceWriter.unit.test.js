'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  ENGINEER_MOBILE_VISIT_ACTION_INTEGRATED_PERSISTENCE_WRITER_KIND,
  createEngineerMobileVisitActionIntegratedPersistenceWriter,
} = require('../../src/engineerMobile/engineerMobileVisitActionIntegratedPersistenceWriter');

const NOW = '2026-05-28T19:00:00.000Z';

function transitionIntent(overrides = {}) {
  return {
    action: 'engineer_mobile.start_travel',
    actorId: 'eng_task_1832',
    appointmentId: 'apt_task_1832',
    caseId: 'case_task_1832',
    organizationId: 'org_task_1832',
    mobileVisitStatus: 'traveling',
    plannedAt: NOW,
    ...overrides,
  };
}

function auditIntent(overrides = {}) {
  return {
    action: 'engineer_mobile.start_travel.allowed',
    entityType: 'appointment',
    entityId: 'apt_task_1832',
    actorId: 'eng_task_1832',
    organizationId: 'org_task_1832',
    caseId: 'case_task_1832',
    appointmentId: 'apt_task_1832',
    requestId: 'req_task_1832',
    ...overrides,
  };
}

function writerWithPort({ calls = [], portImpl, now = NOW } = {}) {
  return createEngineerMobileVisitActionIntegratedPersistenceWriter({
    now,
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
  assert.equal(result.writerKind, ENGINEER_MOBILE_VISIT_ACTION_INTEGRATED_PERSISTENCE_WRITER_KIND);
  assert.equal(result.reasonCode, reasonCode);
}

function assertPersisted(result) {
  assert.equal(result.ok, true);
  assert.equal(result.persisted, true);
  assert.equal(result.writerKind, ENGINEER_MOBILE_VISIT_ACTION_INTEGRATED_PERSISTENCE_WRITER_KIND);
  assert.equal(result.reasonCode, 'persistence_port_written');
  assert.equal(result.validation.reasonCode, 'persistence_port_input_valid');
  assert.equal(result.validation.transitionPatch.entityId, 'apt_task_1832');
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
    'apt_final_should_not_leak',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test('missing persistencePort returns persistence_port_required', () => {
  const writer = createEngineerMobileVisitActionIntegratedPersistenceWriter({ now: NOW });
  const result = writer.write({ transitionIntent: transitionIntent() });

  assert.equal(writer.kind, ENGINEER_MOBILE_VISIT_ACTION_INTEGRATED_PERSISTENCE_WRITER_KIND);
  assertFailure(result, 'persistence_port_required');
});

test('valid transition intent without audit intent persists once', () => {
  const calls = [];
  const writer = writerWithPort({ calls });
  const result = writer.write({ transitionIntent: transitionIntent() });

  assertPersisted(result);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].transitionPatchEnvelope.entityId, 'apt_task_1832');
  assert.equal(calls[0].transitionPatchEnvelope.patch.mobileVisitStatus, 'traveling');
  assert.equal(calls[0].auditEventEnvelope, undefined);
});

test('valid transition intent with valid audit intent persists once', () => {
  const calls = [];
  const writer = writerWithPort({ calls });
  const result = writer.write({
    transitionIntent: transitionIntent(),
    auditIntent: auditIntent(),
  });

  assertPersisted(result);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].auditEventEnvelope.entityId, 'apt_task_1832');
  assert.equal(result.validation.auditEvent.entityId, 'apt_task_1832');
});

test('valid visit_result_recorded transition with audit persists once', () => {
  const calls = [];
  const writer = writerWithPort({ calls });
  const result = writer.write({
    transitionIntent: transitionIntent({
      action: 'engineer_mobile.record_visit_result',
      mobileVisitStatus: 'visit_result_recorded',
      visitResult: 'resolved',
    }),
    auditIntent: auditIntent({ action: 'engineer_mobile.record_visit_result.allowed' }),
  });

  assertPersisted(result);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].transitionPatchEnvelope.patch.visitResult, 'resolved');
});

test('transition builder denial is preserved', () => {
  const calls = [];
  const writer = writerWithPort({ calls });
  const result = writer.write({
    transitionIntent: transitionIntent({ appointmentId: undefined }),
    auditIntent: auditIntent(),
  });

  assertFailure(result, 'appointment_id_required');
  assert.deepEqual(calls, []);
});

test('audit builder denial is preserved and does not call persistence port', () => {
  const calls = [];
  const writer = writerWithPort({ calls });
  const result = writer.write({
    transitionIntent: transitionIntent(),
    auditIntent: auditIntent({ entityId: undefined }),
  });

  assertFailure(result, 'entity_id_required');
  assert.deepEqual(calls, []);
});

test('persistence writer adapter failure is preserved as persistence_port_write_failed', () => {
  const writer = writerWithPort({
    portImpl() {
      return { persisted: false };
    },
  });
  const result = writer.write({ transitionIntent: transitionIntent() });

  assertFailure(result, 'persistence_port_write_failed');
});

test('persistence port throw returns persistence_port_write_failed without raw error', () => {
  const writer = writerWithPort({
    portImpl() {
      throw new Error('raw_persistence_port_error_should_not_leak');
    },
  });
  const result = writer.write({ transitionIntent: transitionIntent() });

  assertFailure(result, 'persistence_port_write_failed');
  assertNoLeak(result);
});

test('persistence port unknown object result fails closed', () => {
  const writer = writerWithPort({
    portImpl() {
      return { message: 'unknown object shape' };
    },
  });
  const result = writer.write({ transitionIntent: transitionIntent() });

  assertFailure(result, 'persistence_port_write_failed');
});

test('persistence payload contains safe transition patch envelope and optional safe audit event envelope only', () => {
  const calls = [];
  const writer = writerWithPort({ calls });
  const result = writer.write({
    transitionIntent: transitionIntent({
      dbMetadata: 'raw_db_metadata_should_not_leak',
      repositoryName: 'raw_repository_should_not_leak',
      providerPayload: 'raw_provider_payload_should_not_leak',
      customerVisiblePublication: 'raw_publication_should_not_leak',
    }),
    auditIntent: auditIntent({
      dbMetadata: 'raw_db_metadata_should_not_leak',
      repositoryName: 'raw_repository_should_not_leak',
      providerPayload: 'raw_provider_payload_should_not_leak',
      customerVisiblePublication: 'raw_publication_should_not_leak',
    }),
  });

  assertPersisted(result);
  assertNoLeak(calls);
  assert.deepEqual(Object.keys(calls[0]).sort(), [
    'auditEventEnvelope',
    'transitionPatchEnvelope',
  ].sort());
  assert.deepEqual(Object.keys(calls[0].transitionPatchEnvelope.patch).sort(), [
    'mobileVisitStatus',
    'updatedAt',
    'updatedBy',
  ].sort());
  assert.deepEqual(Object.keys(calls[0].auditEventEnvelope.auditEvent).sort(), [
    'action',
    'actorId',
    'appointmentId',
    'caseId',
    'entityId',
    'entityType',
    'occurredAt',
    'organizationId',
    'requestId',
  ].sort());
});

test('output does not include phone address LINE customer raw data private notes or report draft fields', () => {
  const writer = writerWithPort();
  const result = writer.write({
    transitionIntent: transitionIntent({
      customerPhone: 'raw_phone_should_not_leak',
      address: 'raw_address_should_not_leak',
      lineUserId: 'raw_line_should_not_leak',
      customerName: 'raw_customer_should_not_leak',
      privateNote: 'raw_private_note_should_not_leak',
    }),
    auditIntent: auditIntent({
      customerPhone: 'raw_phone_should_not_leak',
      address: 'raw_address_should_not_leak',
      lineUserId: 'raw_line_should_not_leak',
      customerName: 'raw_customer_should_not_leak',
      privateNote: 'raw_private_note_should_not_leak',
    }),
  });

  assertPersisted(result);
  assertNoLeak(result);
});

test('output does not include DB repository provider or customer-visible publication fields', () => {
  const writer = writerWithPort();
  const result = writer.write({
    transitionIntent: transitionIntent({
      dbMetadata: 'raw_db_metadata_should_not_leak',
      repositoryName: 'raw_repository_should_not_leak',
      providerPayload: 'raw_provider_payload_should_not_leak',
      customerVisiblePublication: 'raw_publication_should_not_leak',
    }),
  });

  assertPersisted(result);
  assertNoLeak(result);
});

test('inputs are not mutated', () => {
  const transition = transitionIntent({
    action: 'engineer_mobile.record_visit_result',
    mobileVisitStatus: 'visit_result_recorded',
    visitResult: 'follow_up_required',
  });
  const audit = auditIntent({ action: 'engineer_mobile.record_visit_result.allowed' });
  const beforeTransition = clone(transition);
  const beforeAudit = clone(audit);
  const writer = writerWithPort();

  writer.write({ transitionIntent: transition, auditIntent: audit });

  assert.deepEqual(transition, beforeTransition);
  assert.deepEqual(audit, beforeAudit);
});

test('persistence port mutation of received payload does not mutate returned safe result', () => {
  const writer = writerWithPort({
    portImpl(payload) {
      payload.transitionPatchEnvelope.entityId = 'mutated_apt';
      payload.transitionPatchEnvelope.rawProviderPayload = 'raw_provider_payload_should_not_leak';
      return { ok: true };
    },
  });
  const result = writer.write({
    transitionIntent: transitionIntent(),
    auditIntent: auditIntent(),
  });

  assertPersisted(result);
  assert.equal(result.validation.transitionPatch.entityId, 'apt_task_1832');
  assertNoLeak(result);
});

test('no completion report field service report or finalAppointmentId behavior appears in results', () => {
  const writer = writerWithPort();
  const result = writer.write({
    transitionIntent: transitionIntent({
      finalAppointmentId: 'apt_final_should_not_leak',
    }),
  });

  assertFailure(result, 'final_appointment_boundary');
  assertNoLeak(result);
});
