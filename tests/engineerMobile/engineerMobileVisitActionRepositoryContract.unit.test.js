'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  ENGINEER_MOBILE_VISIT_ACTION_REPOSITORY_CONTRACT_KIND,
  normalizeEngineerMobileVisitActionRepositoryResult,
  validateEngineerMobileVisitActionRepositoryInput,
  validateEngineerMobileVisitActionRepositoryResult,
} = require('../../src/engineerMobile/engineerMobileVisitActionRepositoryContract');

const NOW = '2026-05-28T17:30:00.000Z';
const TRANSITION_PATCH_KIND = 'engineer_mobile.visit_action_transition_patch';
const AUDIT_EVENT_KIND = 'engineer_mobile.visit_action_audit_event';

function transitionEnvelope(overrides = {}) {
  const patch = {
    mobileVisitStatus: 'traveling',
    updatedBy: 'eng_task_1842',
    updatedAt: NOW,
    ...(overrides.patch || {}),
  };

  return {
    patchKind: TRANSITION_PATCH_KIND,
    entityType: 'appointment',
    entityId: 'apt_task_1842',
    organizationId: 'org_task_1842',
    action: 'engineer_mobile.start_travel',
    patch,
    auditContext: {
      actorId: 'eng_task_1842',
      appointmentId: 'apt_task_1842',
      requestId: 'req_task_1842',
    },
    ...Object.fromEntries(Object.entries(overrides).filter(([key]) => key !== 'patch')),
  };
}

function auditEnvelope(overrides = {}) {
  const action = overrides.action || 'engineer_mobile.start_travel.allowed';
  const auditEvent = {
    action,
    entityType: 'appointment',
    entityId: 'apt_task_1842',
    actorId: 'eng_task_1842',
    organizationId: 'org_task_1842',
    occurredAt: NOW,
    caseId: 'case_task_1842',
    appointmentId: 'apt_task_1842',
    requestId: 'req_task_1842',
    ...(overrides.auditEvent || {}),
  };

  return {
    eventKind: AUDIT_EVENT_KIND,
    action,
    entityType: 'appointment',
    entityId: 'apt_task_1842',
    actorId: 'eng_task_1842',
    organizationId: 'org_task_1842',
    occurredAt: NOW,
    auditEvent,
    ...Object.fromEntries(Object.entries(overrides).filter(([key]) => key !== 'auditEvent')),
  };
}

function repositoryInput(overrides = {}) {
  return {
    transitionPatchEnvelope: transitionEnvelope(overrides.transitionPatchEnvelope || {}),
    ...(
      overrides.auditEventEnvelope === undefined
        ? {}
        : { auditEventEnvelope: auditEnvelope(overrides.auditEventEnvelope || {}) }
    ),
    ...Object.fromEntries(
      Object.entries(overrides).filter(([key]) => (
        key !== 'transitionPatchEnvelope' && key !== 'auditEventEnvelope'
      )),
    ),
  };
}

function assertValid(result, reasonCode = 'repository_input_valid') {
  assert.equal(result.ok, true);
  assert.equal(result.valid, true);
  assert.equal(result.contractKind, ENGINEER_MOBILE_VISIT_ACTION_REPOSITORY_CONTRACT_KIND);
  assert.equal(result.reasonCode, reasonCode);
}

function assertDenied(result, reasonCode) {
  assert.equal(result.ok, false);
  assert.equal(result.valid, false);
  assert.equal(result.contractKind, ENGINEER_MOBILE_VISIT_ACTION_REPOSITORY_CONTRACT_KIND);
  assert.equal(result.reasonCode, reasonCode);
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
    'raw stack should not leak',
    'raw publication should not leak',
    'raw secret should not leak',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test('accepts valid transition patch only', () => {
  const input = repositoryInput();
  const result = validateEngineerMobileVisitActionRepositoryInput(input);

  assertValid(result);
  assert.deepEqual(result.transitionPatch, {
    patchKind: TRANSITION_PATCH_KIND,
    entityType: 'appointment',
    entityId: 'apt_task_1842',
    organizationId: 'org_task_1842',
    action: 'engineer_mobile.start_travel',
    mobileVisitStatus: 'traveling',
    updatedBy: 'eng_task_1842',
    updatedAt: NOW,
  });
  assert.equal(result.auditEvent, undefined);
});

test('accepts valid transition patch with matching audit event', () => {
  const result = validateEngineerMobileVisitActionRepositoryInput(
    repositoryInput({ auditEventEnvelope: {} }),
  );

  assertValid(result);
  assert.deepEqual(result.auditEvent, {
    eventKind: AUDIT_EVENT_KIND,
    action: 'engineer_mobile.start_travel.allowed',
    entityType: 'appointment',
    entityId: 'apt_task_1842',
    actorId: 'eng_task_1842',
    organizationId: 'org_task_1842',
    occurredAt: NOW,
  });
});

test('denies missing transition patch', () => {
  assertDenied(
    validateEngineerMobileVisitActionRepositoryInput({}),
    'transition_patch_required',
  );
});

test('denies unsupported entity type', () => {
  assertDenied(
    validateEngineerMobileVisitActionRepositoryInput(
      repositoryInput({ transitionPatchEnvelope: { entityType: 'case' } }),
    ),
    'unsupported_entity_type',
  );
});

test('denies unsupported mobile visit status', () => {
  assertDenied(
    validateEngineerMobileVisitActionRepositoryInput(
      repositoryInput({
        transitionPatchEnvelope: {
          patch: { mobileVisitStatus: 'completion_report_created' },
        },
      }),
    ),
    'unsupported_mobile_visit_status',
  );
});

test('denies invalid visit result', () => {
  assertDenied(
    validateEngineerMobileVisitActionRepositoryInput(
      repositoryInput({
        transitionPatchEnvelope: {
          action: 'engineer_mobile.record_visit_result',
          patch: {
            mobileVisitStatus: 'visit_result_recorded',
            visitResult: 'raw_custom_result',
          },
        },
      }),
    ),
    'invalid_visit_result',
  );
});

test('denies unsafe extra field in transition root', () => {
  const result = validateEngineerMobileVisitActionRepositoryInput(
    repositoryInput({ transitionPatchEnvelope: { customerPhone: 'raw phone should not leak' } }),
  );

  assertDenied(result, 'unsafe_field_detected');
  assertNoRawLeak(result);
});

test('denies unsafe extra field in patch', () => {
  const result = validateEngineerMobileVisitActionRepositoryInput(
    repositoryInput({
      transitionPatchEnvelope: {
        patch: { customerAddress: 'raw address should not leak' },
      },
    }),
  );

  assertDenied(result, 'unsafe_field_detected');
  assertNoRawLeak(result);
});

test('denies unsafe extra field in audit root', () => {
  const result = validateEngineerMobileVisitActionRepositoryInput(
    repositoryInput({
      auditEventEnvelope: { customerName: 'raw customer should not leak' },
    }),
  );

  assertDenied(result, 'unsafe_field_detected');
  assertNoRawLeak(result);
});

test('denies unsafe extra field in auditEvent', () => {
  const result = validateEngineerMobileVisitActionRepositoryInput(
    repositoryInput({
      auditEventEnvelope: {
        auditEvent: { privateNote: 'raw private note should not leak' },
      },
    }),
  );

  assertDenied(result, 'unsafe_field_detected');
  assertNoRawLeak(result);
});

test('denies organization mismatch', () => {
  assertDenied(
    validateEngineerMobileVisitActionRepositoryInput(
      repositoryInput({ auditEventEnvelope: { organizationId: 'org_other' } }),
    ),
    'organization_mismatch',
  );
});

test('denies entity mismatch', () => {
  assertDenied(
    validateEngineerMobileVisitActionRepositoryInput(
      repositoryInput({ auditEventEnvelope: { entityId: 'apt_other' } }),
    ),
    'entity_mismatch',
  );
});

test('denies completion-report boundary indicators', () => {
  const transitionResult = validateEngineerMobileVisitActionRepositoryInput(
    repositoryInput({ transitionPatchEnvelope: { completionReportId: 'raw report draft should not leak' } }),
  );
  const auditResult = validateEngineerMobileVisitActionRepositoryInput(
    repositoryInput({ auditEventEnvelope: { auditEvent: { fieldServiceReportId: 'raw report draft should not leak' } } }),
  );

  assertDenied(transitionResult, 'completion_report_boundary');
  assertDenied(auditResult, 'completion_report_boundary');
  assertNoRawLeak(transitionResult);
  assertNoRawLeak(auditResult);
});

test('denies finalAppointmentId boundary indicators', () => {
  assertDenied(
    validateEngineerMobileVisitActionRepositoryInput(
      repositoryInput({ transitionPatchEnvelope: { finalAppointmentId: 'apt_final_should_not_pass' } }),
    ),
    'final_appointment_boundary',
  );
  assertDenied(
    validateEngineerMobileVisitActionRepositoryInput(
      repositoryInput({ auditEventEnvelope: { auditEvent: { finalAppointmentId: 'apt_final_should_not_pass' } } }),
    ),
    'final_appointment_boundary',
  );
});

test('normalizes success repository result variants', () => {
  for (const result of [
    undefined,
    null,
    true,
    { ok: true },
    { persisted: true },
    { written: true },
    { transitionPersisted: true },
    { ok: true, transitionPersisted: true, auditRecorded: true },
  ]) {
    const normalized = normalizeEngineerMobileVisitActionRepositoryResult(result);

    assert.equal(normalized.ok, true);
    assert.equal(normalized.contractKind, ENGINEER_MOBILE_VISIT_ACTION_REPOSITORY_CONTRACT_KIND);
    assert.equal(normalized.reasonCode, 'repository_write_succeeded');
    assert.equal(normalized.transitionPersisted, true);
  }
});

test('normalizes auditRecorded as not_provided when no audit was involved', () => {
  assert.deepEqual(normalizeEngineerMobileVisitActionRepositoryResult({ ok: true }), {
    ok: true,
    contractKind: ENGINEER_MOBILE_VISIT_ACTION_REPOSITORY_CONTRACT_KIND,
    reasonCode: 'repository_write_succeeded',
    transitionPersisted: true,
    auditRecorded: 'not_provided',
  });
});

test('normalizes failure result variants to repository_write_failed', () => {
  for (const result of [false, { ok: false }, { persisted: false }, { written: false }]) {
    const normalized = normalizeEngineerMobileVisitActionRepositoryResult(result);

    assert.equal(normalized.ok, false);
    assert.equal(normalized.contractKind, ENGINEER_MOBILE_VISIT_ACTION_REPOSITORY_CONTRACT_KIND);
    assert.equal(normalized.reasonCode, 'repository_write_failed');
  }
});

test('unknown object result fails closed', () => {
  assert.deepEqual(normalizeEngineerMobileVisitActionRepositoryResult({ message: 'looks fine' }), {
    ok: false,
    contractKind: ENGINEER_MOBILE_VISIT_ACTION_REPOSITORY_CONTRACT_KIND,
    reasonCode: 'repository_result_unrecognized',
  });
});

test('raw error secret SQL stack customer data does not leak', () => {
  const normalized = normalizeEngineerMobileVisitActionRepositoryResult({
    error: 'raw secret should not leak',
    sql: 'raw sql should not leak',
    stack: 'raw stack should not leak',
    customerPhone: 'raw phone should not leak',
    providerPayload: 'raw provider payload should not leak',
    publicationPayload: 'raw publication should not leak',
    ok: false,
  });

  assert.deepEqual(normalized, {
    ok: false,
    contractKind: ENGINEER_MOBILE_VISIT_ACTION_REPOSITORY_CONTRACT_KIND,
    reasonCode: 'repository_write_failed',
  });
  assertNoRawLeak(normalized);
});

test('inputs are not mutated', () => {
  const input = repositoryInput({
    transitionPatchEnvelope: {
      action: 'engineer_mobile.record_visit_result',
      patch: {
        mobileVisitStatus: 'visit_result_recorded',
        visitResult: 'customer_unavailable',
      },
    },
    auditEventEnvelope: {
      action: 'engineer_mobile.record_visit_result.allowed',
    },
  });
  const before = clone(input);

  validateEngineerMobileVisitActionRepositoryInput(input);

  assert.deepEqual(input, before);
});

test('validateEngineerMobileVisitActionRepositoryResult is the sanitized normalizer alias', () => {
  assert.deepEqual(
    validateEngineerMobileVisitActionRepositoryResult({ ok: true, auditRecorded: true }),
    normalizeEngineerMobileVisitActionRepositoryResult({ ok: true, auditRecorded: true }),
  );
});
