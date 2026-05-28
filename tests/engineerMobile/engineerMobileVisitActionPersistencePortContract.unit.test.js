'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  ENGINEER_MOBILE_VISIT_ACTION_PERSISTENCE_PORT_CONTRACT_KIND,
  validateEngineerMobileVisitActionAuditEventEnvelope,
  validateEngineerMobileVisitActionPersistencePortInput,
  validateEngineerMobileVisitActionTransitionPatchEnvelope,
} = require('../../src/engineerMobile/engineerMobileVisitActionPersistencePortContract');

const NOW = '2026-05-28T17:00:00.000Z';
const TRANSITION_PATCH_KIND = 'engineer_mobile.visit_action_transition_patch';
const AUDIT_EVENT_KIND = 'engineer_mobile.visit_action_audit_event';

const AUDIT_ACTIONS = Object.freeze([
  'engineer_mobile.start_travel.allowed',
  'engineer_mobile.arrive.allowed',
  'engineer_mobile.start_work.allowed',
  'engineer_mobile.finish_work.allowed',
  'engineer_mobile.record_visit_result.allowed',
]);

function transitionEnvelope(overrides = {}) {
  const patch = {
    mobileVisitStatus: 'traveling',
    updatedBy: 'eng_task_1828',
    updatedAt: NOW,
    ...(overrides.patch || {}),
  };

  return {
    patchKind: TRANSITION_PATCH_KIND,
    entityType: 'appointment',
    entityId: 'apt_task_1828',
    organizationId: 'org_task_1828',
    action: 'engineer_mobile.start_travel',
    patch,
    auditContext: {
      actorId: 'eng_task_1828',
      appointmentId: 'apt_task_1828',
      requestId: 'req_task_1828',
    },
    ...Object.fromEntries(Object.entries(overrides).filter(([key]) => key !== 'patch')),
  };
}

function auditEnvelope(overrides = {}) {
  const action = overrides.action || 'engineer_mobile.start_travel.allowed';
  const auditEvent = {
    action,
    entityType: 'appointment',
    entityId: 'apt_task_1828',
    actorId: 'eng_task_1828',
    organizationId: 'org_task_1828',
    occurredAt: NOW,
    caseId: 'case_task_1828',
    appointmentId: 'apt_task_1828',
    requestId: 'req_task_1828',
    ...(overrides.auditEvent || {}),
  };

  return {
    eventKind: AUDIT_EVENT_KIND,
    action,
    entityType: 'appointment',
    entityId: 'apt_task_1828',
    actorId: 'eng_task_1828',
    organizationId: 'org_task_1828',
    occurredAt: NOW,
    auditEvent,
    ...Object.fromEntries(Object.entries(overrides).filter(([key]) => key !== 'auditEvent')),
  };
}

function assertValid(result, reasonCode) {
  assert.equal(result.ok, true);
  assert.equal(result.valid, true);
  assert.equal(result.contractKind, ENGINEER_MOBILE_VISIT_ACTION_PERSISTENCE_PORT_CONTRACT_KIND);
  assert.equal(result.reasonCode, reasonCode);
}

function assertDenied(result, reasonCode) {
  assert.equal(result.ok, false);
  assert.equal(result.valid, false);
  assert.equal(result.contractKind, ENGINEER_MOBILE_VISIT_ACTION_PERSISTENCE_PORT_CONTRACT_KIND);
  assert.equal(result.reasonCode, reasonCode);
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

for (const mobileVisitStatus of ['traveling', 'arrived', 'working', 'work_finished']) {
  test(`accepts valid transition patch for ${mobileVisitStatus}`, () => {
    const result = validateEngineerMobileVisitActionTransitionPatchEnvelope(
      transitionEnvelope({ patch: { mobileVisitStatus } }),
    );

    assertValid(result, 'transition_patch_valid');
    assert.deepEqual(result.transitionPatch, {
      patchKind: TRANSITION_PATCH_KIND,
      entityType: 'appointment',
      entityId: 'apt_task_1828',
      organizationId: 'org_task_1828',
      action: 'engineer_mobile.start_travel',
      mobileVisitStatus,
      updatedBy: 'eng_task_1828',
      updatedAt: NOW,
    });
  });
}

test('accepts valid transition patch for visit_result_recorded with valid visitResult', () => {
  const result = validateEngineerMobileVisitActionTransitionPatchEnvelope(
    transitionEnvelope({
      action: 'engineer_mobile.record_visit_result',
      patch: {
        mobileVisitStatus: 'visit_result_recorded',
        visitResult: 'parts_required',
      },
    }),
  );

  assertValid(result, 'transition_patch_valid');
  assert.equal(result.transitionPatch.visitResult, 'parts_required');
});

test('denies transition patch with missing entity id', () => {
  assertDenied(
    validateEngineerMobileVisitActionTransitionPatchEnvelope(transitionEnvelope({ entityId: undefined })),
    'entity_id_required',
  );
});

test('denies transition patch with unsupported mobile visit status', () => {
  assertDenied(
    validateEngineerMobileVisitActionTransitionPatchEnvelope(
      transitionEnvelope({ patch: { mobileVisitStatus: 'completion_report_created' } }),
    ),
    'unsupported_mobile_visit_status',
  );
});

test('denies transition patch with invalid visit result', () => {
  assertDenied(
    validateEngineerMobileVisitActionTransitionPatchEnvelope(
      transitionEnvelope({
        patch: {
          mobileVisitStatus: 'visit_result_recorded',
          visitResult: 'raw_custom_result',
        },
      }),
    ),
    'invalid_visit_result',
  );
});

test('denies transition patch with unsafe extra field in root', () => {
  assertDenied(
    validateEngineerMobileVisitActionTransitionPatchEnvelope(
      transitionEnvelope({ customerPhone: 'raw_phone_should_not_leak' }),
    ),
    'unsafe_field_detected',
  );
});

test('denies transition patch with unsafe extra field inside patch', () => {
  assertDenied(
    validateEngineerMobileVisitActionTransitionPatchEnvelope(
      transitionEnvelope({ patch: { customerAddress: 'raw_address_should_not_leak' } }),
    ),
    'unsafe_field_detected',
  );
});

for (const action of AUDIT_ACTIONS) {
  test(`accepts valid audit event for ${action}`, () => {
    const result = validateEngineerMobileVisitActionAuditEventEnvelope(
      auditEnvelope({ action }),
    );

    assertValid(result, 'audit_event_valid');
    assert.deepEqual(result.auditEvent, {
      eventKind: AUDIT_EVENT_KIND,
      action,
      entityType: 'appointment',
      entityId: 'apt_task_1828',
      actorId: 'eng_task_1828',
      organizationId: 'org_task_1828',
      occurredAt: NOW,
    });
  });
}

test('denies audit event with unsupported action', () => {
  assertDenied(
    validateEngineerMobileVisitActionAuditEventEnvelope(
      auditEnvelope({ action: 'engineer_mobile.create_completion_report.allowed' }),
    ),
    'unsupported_audit_action',
  );
});

test('denies audit event with unsafe extra field in root', () => {
  assertDenied(
    validateEngineerMobileVisitActionAuditEventEnvelope(
      auditEnvelope({ customerPhone: 'raw_phone_should_not_leak' }),
    ),
    'unsafe_field_detected',
  );
});

test('denies audit event with unsafe extra field inside auditEvent', () => {
  assertDenied(
    validateEngineerMobileVisitActionAuditEventEnvelope(
      auditEnvelope({ auditEvent: { privateNote: 'raw_private_note_should_not_leak' } }),
    ),
    'unsafe_field_detected',
  );
});

test('combined validation accepts transition patch with matching audit event', () => {
  const result = validateEngineerMobileVisitActionPersistencePortInput({
    transitionPatchEnvelope: transitionEnvelope(),
    auditEventEnvelope: auditEnvelope(),
  });

  assertValid(result, 'persistence_port_input_valid');
  assert.equal(result.transitionPatch.entityId, 'apt_task_1828');
  assert.equal(result.auditEvent.entityId, 'apt_task_1828');
});

test('combined validation accepts transition patch without audit event', () => {
  const result = validateEngineerMobileVisitActionPersistencePortInput({
    transitionPatchEnvelope: transitionEnvelope(),
  });

  assertValid(result, 'persistence_port_input_valid');
  assert.equal(result.auditEvent, undefined);
});

test('combined validation denies organization mismatch', () => {
  assertDenied(
    validateEngineerMobileVisitActionPersistencePortInput({
      transitionPatchEnvelope: transitionEnvelope(),
      auditEventEnvelope: auditEnvelope({ organizationId: 'org_other' }),
    }),
    'organization_mismatch',
  );
});

test('combined validation denies entity mismatch', () => {
  assertDenied(
    validateEngineerMobileVisitActionPersistencePortInput({
      transitionPatchEnvelope: transitionEnvelope(),
      auditEventEnvelope: auditEnvelope({ entityId: 'apt_other' }),
    }),
    'entity_mismatch',
  );
});

test('denies completion-report boundary indicators', () => {
  const transitionResult = validateEngineerMobileVisitActionTransitionPatchEnvelope(
    transitionEnvelope({ completionReportId: 'completion_report_should_not_pass' }),
  );
  const auditResult = validateEngineerMobileVisitActionAuditEventEnvelope(
    auditEnvelope({ auditEvent: { reportDraftBody: 'raw_report_draft_should_not_leak' } }),
  );

  assertDenied(transitionResult, 'completion_report_boundary');
  assertDenied(auditResult, 'completion_report_boundary');
  assertNoLeak(transitionResult);
  assertNoLeak(auditResult);
});

test('denies finalAppointmentId boundary indicators', () => {
  assertDenied(
    validateEngineerMobileVisitActionTransitionPatchEnvelope(
      transitionEnvelope({ finalAppointmentId: 'apt_final_should_not_be_mutated' }),
    ),
    'final_appointment_boundary',
  );
  assertDenied(
    validateEngineerMobileVisitActionAuditEventEnvelope(
      auditEnvelope({ finalAppointmentId: 'apt_final_should_not_be_mutated' }),
    ),
    'final_appointment_boundary',
  );
});

test('output does not include phone address LINE customer raw data private notes or report draft fields', () => {
  const result = validateEngineerMobileVisitActionTransitionPatchEnvelope(
    transitionEnvelope({ customerName: 'raw_customer_should_not_leak' }),
  );
  const auditResult = validateEngineerMobileVisitActionAuditEventEnvelope(
    auditEnvelope({ auditEvent: { customerPhone: 'raw_phone_should_not_leak' } }),
  );

  assertDenied(result, 'unsafe_field_detected');
  assertDenied(auditResult, 'unsafe_field_detected');
  assertNoLeak(result);
  assertNoLeak(auditResult);
});

test('output does not include DB repository provider or customer-visible publication fields', () => {
  const result = validateEngineerMobileVisitActionTransitionPatchEnvelope(
    transitionEnvelope({ auditContext: { providerPayload: 'raw_provider_payload_should_not_leak' } }),
  );
  const auditResult = validateEngineerMobileVisitActionAuditEventEnvelope(
    auditEnvelope({ auditEvent: { rawError: 'raw_error_should_not_leak' } }),
  );

  assertDenied(result, 'unsafe_field_detected');
  assertDenied(auditResult, 'unsafe_field_detected');
  assertNoLeak(result);
  assertNoLeak(auditResult);

  const validResult = validateEngineerMobileVisitActionPersistencePortInput({
    transitionPatchEnvelope: transitionEnvelope(),
    auditEventEnvelope: auditEnvelope(),
  });

  assertNoLeak(validResult);
});

test('inputs are not mutated', () => {
  const transitionPatchEnvelope = transitionEnvelope({
    patch: {
      mobileVisitStatus: 'visit_result_recorded',
      visitResult: 'customer_unavailable',
    },
  });
  const auditEventEnvelope = auditEnvelope({
    action: 'engineer_mobile.record_visit_result.allowed',
  });
  const beforeTransition = clone(transitionPatchEnvelope);
  const beforeAudit = clone(auditEventEnvelope);

  validateEngineerMobileVisitActionPersistencePortInput({
    transitionPatchEnvelope,
    auditEventEnvelope,
  });

  assert.deepEqual(transitionPatchEnvelope, beforeTransition);
  assert.deepEqual(auditEventEnvelope, beforeAudit);
});
