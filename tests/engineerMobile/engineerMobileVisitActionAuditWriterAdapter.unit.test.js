'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  ENGINEER_MOBILE_VISIT_ACTION_AUDIT_EVENT_ACTIONS,
} = require('../../src/engineerMobile/engineerMobileVisitActionAuditEventBuilder');

const {
  ENGINEER_MOBILE_VISIT_ACTION_AUDIT_WRITER_ADAPTER_KIND,
  createEngineerMobileVisitActionAuditWriterAdapter,
} = require('../../src/engineerMobile/engineerMobileVisitActionAuditWriterAdapter');

const NOW = '2026-05-28T15:00:00.000Z';

function auditIntent(overrides = {}) {
  return {
    action: ENGINEER_MOBILE_VISIT_ACTION_AUDIT_EVENT_ACTIONS.START_TRAVEL_ALLOWED,
    entityType: 'appointment',
    entityId: 'apt_task_1824',
    actorId: 'eng_task_1824',
    organizationId: 'org_task_1824',
    caseId: 'case_task_1824',
    appointmentId: 'apt_task_1824',
    requestId: 'req_task_1824',
    ...overrides,
  };
}

function adapterWithWriter({
  calls = [],
  writerImpl,
  now = NOW,
} = {}) {
  return createEngineerMobileVisitActionAuditWriterAdapter({
    now,
    auditEventWriter: {
      record(auditEventEnvelope) {
        calls.push(auditEventEnvelope);
        return writerImpl ? writerImpl(auditEventEnvelope) : { ok: true };
      },
    },
  });
}

function assertFailure(result, reasonCode) {
  assert.equal(result.ok, false);
  assert.equal(result.recorded, false);
  assert.equal(result.adapterKind, ENGINEER_MOBILE_VISIT_ACTION_AUDIT_WRITER_ADAPTER_KIND);
  assert.equal(result.reasonCode, reasonCode);
}

function assertAuditEventRecorded(result, action) {
  assert.equal(result.ok, true);
  assert.equal(result.recorded, true);
  assert.equal(result.adapterKind, ENGINEER_MOBILE_VISIT_ACTION_AUDIT_WRITER_ADAPTER_KIND);
  assert.equal(result.reasonCode, 'audit_event_recorded');
  assert.equal(result.action, action);
  assert.equal(result.entityType, 'appointment');
  assert.equal(result.entityId, 'apt_task_1824');
  assert.equal(result.actorId, 'eng_task_1824');
  assert.equal(result.organizationId, 'org_task_1824');
  assert.equal(result.caseId, 'case_task_1824');
  assert.equal(result.appointmentId, 'apt_task_1824');
  assert.equal(result.requestId, 'req_task_1824');
  assert.deepEqual(result.auditEventEnvelope.auditEvent, {
    action,
    entityType: 'appointment',
    entityId: 'apt_task_1824',
    actorId: 'eng_task_1824',
    organizationId: 'org_task_1824',
    occurredAt: NOW,
    caseId: 'case_task_1824',
    appointmentId: 'apt_task_1824',
    requestId: 'req_task_1824',
  });
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
    'raw_audit_event_writer_error_should_not_leak',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test('missing auditEventWriter returns audit_event_writer_required', () => {
  const adapter = createEngineerMobileVisitActionAuditWriterAdapter({});
  const result = adapter.record(auditIntent());

  assert.equal(adapter.kind, ENGINEER_MOBILE_VISIT_ACTION_AUDIT_WRITER_ADAPTER_KIND);
  assertFailure(result, 'audit_event_writer_required');
});

test('missing auditEventWriter.record returns audit_event_writer_required', () => {
  const adapter = createEngineerMobileVisitActionAuditWriterAdapter({
    auditEventWriter: {},
  });
  const result = adapter.record(auditIntent());

  assertFailure(result, 'audit_event_writer_required');
});

test('valid start_travel.allowed audit intent calls audit event writer once with sanitized event envelope', () => {
  const calls = [];
  const adapter = adapterWithWriter({ calls });
  const result = adapter.record(auditIntent());

  assertAuditEventRecorded(result, ENGINEER_MOBILE_VISIT_ACTION_AUDIT_EVENT_ACTIONS.START_TRAVEL_ALLOWED);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].auditEvent, result.auditEventEnvelope.auditEvent);
  assertNoLeak(calls);
});

test('valid arrive.allowed audit intent calls audit event writer once', () => {
  const calls = [];
  const adapter = adapterWithWriter({ calls });
  const result = adapter.record(auditIntent({
    action: ENGINEER_MOBILE_VISIT_ACTION_AUDIT_EVENT_ACTIONS.ARRIVE_ALLOWED,
  }));

  assertAuditEventRecorded(result, ENGINEER_MOBILE_VISIT_ACTION_AUDIT_EVENT_ACTIONS.ARRIVE_ALLOWED);
  assert.equal(calls.length, 1);
});

test('valid start_work.allowed audit intent calls audit event writer once', () => {
  const calls = [];
  const adapter = adapterWithWriter({ calls });
  const result = adapter.record(auditIntent({
    action: ENGINEER_MOBILE_VISIT_ACTION_AUDIT_EVENT_ACTIONS.START_WORK_ALLOWED,
  }));

  assertAuditEventRecorded(result, ENGINEER_MOBILE_VISIT_ACTION_AUDIT_EVENT_ACTIONS.START_WORK_ALLOWED);
  assert.equal(calls.length, 1);
});

test('valid finish_work.allowed audit intent calls audit event writer once', () => {
  const calls = [];
  const adapter = adapterWithWriter({ calls });
  const result = adapter.record(auditIntent({
    action: ENGINEER_MOBILE_VISIT_ACTION_AUDIT_EVENT_ACTIONS.FINISH_WORK_ALLOWED,
  }));

  assertAuditEventRecorded(result, ENGINEER_MOBILE_VISIT_ACTION_AUDIT_EVENT_ACTIONS.FINISH_WORK_ALLOWED);
  assert.equal(calls.length, 1);
});

test('valid record_visit_result.allowed audit intent calls audit event writer once', () => {
  const calls = [];
  const adapter = adapterWithWriter({ calls });
  const result = adapter.record(auditIntent({
    action: ENGINEER_MOBILE_VISIT_ACTION_AUDIT_EVENT_ACTIONS.RECORD_VISIT_RESULT_ALLOWED,
  }));

  assertAuditEventRecorded(result, ENGINEER_MOBILE_VISIT_ACTION_AUDIT_EVENT_ACTIONS.RECORD_VISIT_RESULT_ALLOWED);
  assert.equal(calls.length, 1);
});

test('audit event builder denial is preserved', () => {
  const calls = [];
  const adapter = adapterWithWriter({ calls });
  const result = adapter.record(auditIntent({ entityId: undefined }));

  assertFailure(result, 'entity_id_required');
  assert.equal(result.auditEventEnvelope.reasonCode, 'entity_id_required');
  assert.deepEqual(calls, []);
});

test('audit event writer success variants succeed', () => {
  for (const writerResult of [
    undefined,
    null,
    true,
    { ok: true },
    { accepted: true },
    { recorded: true },
    { persisted: true },
  ]) {
    const adapter = adapterWithWriter({
      writerImpl() {
        return writerResult;
      },
    });
    const result = adapter.record(auditIntent());

    assertAuditEventRecorded(result, ENGINEER_MOBILE_VISIT_ACTION_AUDIT_EVENT_ACTIONS.START_TRAVEL_ALLOWED);
  }
});

test('audit event writer failure variants return audit_event_write_failed', () => {
  for (const writerResult of [
    false,
    { ok: false },
    { accepted: false },
    { recorded: false },
    { persisted: false },
    { error: 'raw_audit_event_writer_error_should_not_leak' },
    { message: 'unknown object shape fails closed' },
  ]) {
    const adapter = adapterWithWriter({
      writerImpl() {
        return writerResult;
      },
    });
    const result = adapter.record(auditIntent());

    assertFailure(result, 'audit_event_write_failed');
    assertNoLeak(result);
  }
});

test('audit event writer thrown error returns audit_event_write_failed without raw error', () => {
  const adapter = adapterWithWriter({
    writerImpl() {
      throw new Error('raw_audit_event_writer_error_should_not_leak');
    },
  });
  const result = adapter.record(auditIntent());

  assertFailure(result, 'audit_event_write_failed');
  assertNoLeak(result);
});

test('audit event writer is not called when audit event builder denies', () => {
  const calls = [];
  const adapter = adapterWithWriter({ calls });
  const result = adapter.record(auditIntent({ organizationId: undefined }));

  assertFailure(result, 'organization_id_required');
  assert.deepEqual(calls, []);
});

test('output does not include phone address LINE customer raw data private notes or report draft fields', () => {
  const adapter = adapterWithWriter();
  const result = adapter.record(auditIntent({
    customerPhone: 'raw_phone_should_not_leak',
    address: 'raw_address_should_not_leak',
    lineUserId: 'raw_line_should_not_leak',
    customerName: 'raw_customer_should_not_leak',
    privateNote: 'raw_private_note_should_not_leak',
    reportDraftBody: 'raw_report_draft_should_not_leak',
  }));

  assertFailure(result, 'completion_report_boundary');
  assertNoLeak(result);
});

test('audit writer payload does not include DB repository provider or customer-visible publication fields', () => {
  const calls = [];
  const adapter = adapterWithWriter({ calls });
  const result = adapter.record(auditIntent({
    dbMetadata: 'raw_db_metadata_should_not_leak',
    repositoryName: 'raw_repository_should_not_leak',
    providerPayload: 'raw_provider_payload_should_not_leak',
    customerVisiblePublication: 'raw_publication_should_not_leak',
  }));

  assertAuditEventRecorded(result, ENGINEER_MOBILE_VISIT_ACTION_AUDIT_EVENT_ACTIONS.START_TRAVEL_ALLOWED);
  assertNoLeak(calls);
  assert.deepEqual(Object.keys(calls[0].auditEvent).sort(), [
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

test('input auditIntent is not mutated', () => {
  const intent = auditIntent({
    action: ENGINEER_MOBILE_VISIT_ACTION_AUDIT_EVENT_ACTIONS.RECORD_VISIT_RESULT_ALLOWED,
  });
  const before = clone(intent);
  const adapter = adapterWithWriter();

  adapter.record(intent);

  assert.deepEqual(intent, before);
});

test('audit writer mutation of received payload does not mutate returned safe result', () => {
  const adapter = adapterWithWriter({
    writerImpl(auditEventEnvelope) {
      auditEventEnvelope.auditEvent.action = 'mutated_action';
      auditEventEnvelope.rawProviderPayload = 'raw_provider_payload_should_not_leak';
      return { ok: true };
    },
  });
  const result = adapter.record(auditIntent());

  assertAuditEventRecorded(result, ENGINEER_MOBILE_VISIT_ACTION_AUDIT_EVENT_ACTIONS.START_TRAVEL_ALLOWED);
  assertNoLeak(result);
});
