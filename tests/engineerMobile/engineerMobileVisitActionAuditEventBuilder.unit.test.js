'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  ENGINEER_MOBILE_VISIT_ACTION_AUDIT_EVENT_ACTIONS,
  ENGINEER_MOBILE_VISIT_ACTION_AUDIT_EVENT_BUILDER_KIND,
  buildEngineerMobileVisitActionAuditEvent,
} = require('../../src/engineerMobile/engineerMobileVisitActionAuditEventBuilder');

const NOW = '2026-05-28T15:00:00.000Z';

function auditIntent(overrides = {}) {
  return {
    action: ENGINEER_MOBILE_VISIT_ACTION_AUDIT_EVENT_ACTIONS.START_TRAVEL_ALLOWED,
    entityType: 'appointment',
    entityId: 'apt_task_1822',
    actorId: 'eng_task_1822',
    organizationId: 'org_task_1822',
    caseId: 'case_task_1822',
    appointmentId: 'apt_task_1822',
    requestId: 'req_task_1822',
    ...overrides,
  };
}

function build(overrides = {}, options = {}) {
  return buildEngineerMobileVisitActionAuditEvent({
    auditIntent: auditIntent(overrides),
    now: options.now,
  });
}

function assertBuilt(result, action, extraEvent = {}) {
  assert.equal(result.ok, true);
  assert.equal(result.auditEventBuilt, true);
  assert.equal(
    result.auditEventBuilderKind,
    ENGINEER_MOBILE_VISIT_ACTION_AUDIT_EVENT_BUILDER_KIND,
  );
  assert.equal(result.reasonCode, 'audit_event_built');
  assert.equal(result.action, action);
  assert.equal(result.entityType, 'appointment');
  assert.equal(result.entityId, 'apt_task_1822');
  assert.equal(result.actorId, 'eng_task_1822');
  assert.equal(result.organizationId, 'org_task_1822');
  assert.deepEqual(result.auditEvent, {
    action,
    entityType: 'appointment',
    entityId: 'apt_task_1822',
    actorId: 'eng_task_1822',
    organizationId: 'org_task_1822',
    occurredAt: NOW,
    caseId: 'case_task_1822',
    appointmentId: 'apt_task_1822',
    requestId: 'req_task_1822',
    ...extraEvent,
  });
}

function assertDenied(result, reasonCode) {
  assert.deepEqual(result, {
    ok: false,
    auditEventBuilt: false,
    auditEventBuilderKind: ENGINEER_MOBILE_VISIT_ACTION_AUDIT_EVENT_BUILDER_KIND,
    reasonCode,
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
    'raw_error_should_not_leak',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test('builds audit event for engineer_mobile.start_travel.allowed', () => {
  assertBuilt(
    build({ action: ENGINEER_MOBILE_VISIT_ACTION_AUDIT_EVENT_ACTIONS.START_TRAVEL_ALLOWED }, { now: NOW }),
    ENGINEER_MOBILE_VISIT_ACTION_AUDIT_EVENT_ACTIONS.START_TRAVEL_ALLOWED,
  );
});

test('builds audit event for engineer_mobile.arrive.allowed', () => {
  assertBuilt(
    build({ action: ENGINEER_MOBILE_VISIT_ACTION_AUDIT_EVENT_ACTIONS.ARRIVE_ALLOWED }, { now: NOW }),
    ENGINEER_MOBILE_VISIT_ACTION_AUDIT_EVENT_ACTIONS.ARRIVE_ALLOWED,
  );
});

test('builds audit event for engineer_mobile.start_work.allowed', () => {
  assertBuilt(
    build({ action: ENGINEER_MOBILE_VISIT_ACTION_AUDIT_EVENT_ACTIONS.START_WORK_ALLOWED }, { now: NOW }),
    ENGINEER_MOBILE_VISIT_ACTION_AUDIT_EVENT_ACTIONS.START_WORK_ALLOWED,
  );
});

test('builds audit event for engineer_mobile.finish_work.allowed', () => {
  assertBuilt(
    build({ action: ENGINEER_MOBILE_VISIT_ACTION_AUDIT_EVENT_ACTIONS.FINISH_WORK_ALLOWED }, { now: NOW }),
    ENGINEER_MOBILE_VISIT_ACTION_AUDIT_EVENT_ACTIONS.FINISH_WORK_ALLOWED,
  );
});

test('builds audit event for engineer_mobile.record_visit_result.allowed', () => {
  assertBuilt(
    build({ action: ENGINEER_MOBILE_VISIT_ACTION_AUDIT_EVENT_ACTIONS.RECORD_VISIT_RESULT_ALLOWED }, { now: NOW }),
    ENGINEER_MOBILE_VISIT_ACTION_AUDIT_EVENT_ACTIONS.RECORD_VISIT_RESULT_ALLOWED,
  );
});

test('uses caller-provided now as occurredAt', () => {
  const result = build({}, { now: NOW });

  assert.equal(result.auditEvent.occurredAt, NOW);
});

test('falls back to null when now is missing', () => {
  const result = build({}, { now: undefined });

  assert.equal(result.auditEvent.occurredAt, null);
});

test('copies only safe optional caseId appointmentId and requestId', () => {
  const result = build({
    caseId: 'case_safe',
    appointmentId: 'apt_safe',
    requestId: 'req_safe',
    unsafeExtraId: 'unsafe_extra_should_not_copy',
  }, { now: NOW });

  assert.equal(result.caseId, 'case_safe');
  assert.equal(result.appointmentId, 'apt_safe');
  assert.equal(result.requestId, 'req_safe');
  assert.deepEqual(Object.keys(result.auditEvent).sort(), [
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
  assert.equal(JSON.stringify(result).includes('unsafe_extra_should_not_copy'), false);
});

test('denies missing audit intent', () => {
  assertDenied(buildEngineerMobileVisitActionAuditEvent({}), 'audit_intent_required');
});

test('denies missing action', () => {
  assertDenied(build({ action: undefined }), 'audit_action_required');
});

test('denies unsupported action', () => {
  assertDenied(build({ action: 'engineer_mobile.finish_report.allowed' }), 'unsupported_audit_action');
});

test('denies missing entityType', () => {
  assertDenied(build({ entityType: undefined }), 'entity_type_required');
});

test('denies unsupported entityType', () => {
  assertDenied(build({ entityType: 'case' }), 'unsupported_entity_type');
});

test('denies missing entityId', () => {
  assertDenied(build({ entityId: undefined }), 'entity_id_required');
});

test('denies missing organizationId', () => {
  assertDenied(build({ organizationId: undefined }), 'organization_id_required');
});

test('denies missing actorId', () => {
  assertDenied(build({ actorId: undefined }), 'actor_id_required');
});

test('denies completion-report boundary indicators', () => {
  const result = build({
    completionReportId: 'completion_report_should_not_pass',
    reportDraftBody: 'raw_report_draft_should_not_leak',
  });

  assertDenied(result, 'completion_report_boundary');
  assertNoLeak(result);
});

test('denies finalAppointmentId boundary indicators', () => {
  assertDenied(build({
    finalAppointmentId: 'apt_final_should_not_be_mutated',
  }), 'final_appointment_boundary');
});

test('output does not include phone address LINE customer raw data private notes or report draft fields', () => {
  const result = build({
    customerPhone: 'raw_phone_should_not_leak',
    address: 'raw_address_should_not_leak',
    lineUserId: 'raw_line_should_not_leak',
    customerName: 'raw_customer_should_not_leak',
    privateNote: 'raw_private_note_should_not_leak',
  }, { now: NOW });

  assert.equal(result.ok, true);
  assertNoLeak(result);
});

test('output does not include DB repository provider or customer-visible publication fields', () => {
  const result = build({
    dbMetadata: 'raw_db_metadata_should_not_leak',
    repositoryName: 'raw_repository_should_not_leak',
    providerPayload: 'raw_provider_payload_should_not_leak',
    customerVisiblePublication: 'raw_publication_should_not_leak',
    rawError: 'raw_error_should_not_leak',
  }, { now: NOW });

  assert.equal(result.ok, true);
  assertNoLeak(result);
  assert.deepEqual(Object.keys(result.auditEvent).sort(), [
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

test('unsupported object and array action values fail safely', () => {
  assertDenied(build({ action: { raw: 'engineer_mobile.start_travel.allowed' } }), 'unsupported_audit_action');
  assertDenied(build({ action: ['engineer_mobile.start_travel.allowed'] }), 'unsupported_audit_action');
});

test('input auditIntent is not mutated', () => {
  const intent = auditIntent({
    action: ENGINEER_MOBILE_VISIT_ACTION_AUDIT_EVENT_ACTIONS.RECORD_VISIT_RESULT_ALLOWED,
  });
  const before = clone(intent);

  buildEngineerMobileVisitActionAuditEvent({ auditIntent: intent, now: NOW });

  assert.deepEqual(intent, before);
});
