'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  ENGINEER_MOBILE_VISIT_ACTION_TRANSITION_PATCH_BUILDER_KIND,
  buildEngineerMobileVisitActionTransitionPatch,
} = require('../../src/engineerMobile/engineerMobileVisitActionTransitionPatchBuilder');

const NOW = '2026-05-28T14:00:00.000Z';
const PLANNED_AT = '2026-05-28T13:30:00.000Z';

function transitionIntent(overrides = {}) {
  return {
    kind: 'engineer_mobile.visit_action_transition_intent',
    action: 'engineer_mobile.start_travel',
    actorId: 'eng_task_1818',
    appointmentId: 'apt_task_1818',
    caseId: 'case_task_1818',
    organizationId: 'org_task_1818',
    mobileVisitStatus: 'traveling',
    plannedAt: PLANNED_AT,
    ...overrides,
  };
}

function build(overrides = {}, options = {}) {
  return buildEngineerMobileVisitActionTransitionPatch({
    transitionIntent: transitionIntent(overrides),
    now: options.now,
  });
}

function assertBuilt(result, mobileVisitStatus, extraPatch = {}) {
  assert.equal(result.ok, true);
  assert.equal(result.patchBuilt, true);
  assert.equal(
    result.patchBuilderKind,
    ENGINEER_MOBILE_VISIT_ACTION_TRANSITION_PATCH_BUILDER_KIND,
  );
  assert.equal(result.reasonCode, 'patch_built');
  assert.equal(result.actorId, 'eng_task_1818');
  assert.equal(result.appointmentId, 'apt_task_1818');
  assert.equal(result.caseId, 'case_task_1818');
  assert.equal(result.organizationId, 'org_task_1818');
  assert.deepEqual(result.patch, {
    appointmentId: 'apt_task_1818',
    caseId: 'case_task_1818',
    organizationId: 'org_task_1818',
    mobileVisitStatus,
    updatedAt: PLANNED_AT,
    updatedBy: 'eng_task_1818',
    ...extraPatch,
  });
}

function assertDenied(result, reasonCode) {
  assert.deepEqual(result, {
    ok: false,
    patchBuilt: false,
    patchBuilderKind: ENGINEER_MOBILE_VISIT_ACTION_TRANSITION_PATCH_BUILDER_KIND,
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
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test('builds patch for traveling', () => {
  assertBuilt(build({ mobileVisitStatus: 'traveling' }), 'traveling');
});

test('builds patch for arrived', () => {
  assertBuilt(build({
    action: 'engineer_mobile.arrive',
    mobileVisitStatus: 'arrived',
  }), 'arrived');
});

test('builds patch for working', () => {
  assertBuilt(build({
    action: 'engineer_mobile.start_work',
    mobileVisitStatus: 'working',
  }), 'working');
});

test('builds patch for work_finished', () => {
  assertBuilt(build({
    action: 'engineer_mobile.finish_work',
    mobileVisitStatus: 'work_finished',
  }), 'work_finished');
});

test('builds patch for visit_result_recorded with valid visitResult', () => {
  const result = build({
    action: 'engineer_mobile.record_visit_result',
    mobileVisitStatus: 'visit_result_recorded',
    visitResult: 'parts_required',
  });

  assertBuilt(result, 'visit_result_recorded', { visitResult: 'parts_required' });
});

test('uses now as updatedAt when provided', () => {
  const result = build({ mobileVisitStatus: 'arrived' }, { now: NOW });

  assert.equal(result.patch.updatedAt, NOW);
});

test('falls back to plannedAt as updatedAt when now is missing', () => {
  const result = build({ plannedAt: PLANNED_AT });

  assert.equal(result.patch.updatedAt, PLANNED_AT);
});

test('falls back to null when both now and plannedAt are missing', () => {
  const result = build({ plannedAt: undefined });

  assert.equal(result.patch.updatedAt, null);
});

test('denies missing transition intent', () => {
  assertDenied(buildEngineerMobileVisitActionTransitionPatch({}), 'transition_intent_required');
});

test('denies missing appointment id', () => {
  assertDenied(build({ appointmentId: undefined }), 'appointment_id_required');
});

test('denies missing organization id', () => {
  assertDenied(build({ organizationId: undefined }), 'organization_id_required');
});

test('denies missing actor id', () => {
  assertDenied(build({ actorId: undefined }), 'actor_id_required');
});

test('denies missing action', () => {
  assertDenied(build({ action: undefined }), 'action_required');
});

test('denies missing mobile visit status', () => {
  assertDenied(build({ mobileVisitStatus: undefined }), 'mobile_visit_status_required');
});

test('denies unsupported mobile visit status', () => {
  assertDenied(build({ mobileVisitStatus: 'finished_report_created' }), 'unsupported_mobile_visit_status');
});

test('denies invalid visit result', () => {
  assertDenied(build({
    mobileVisitStatus: 'visit_result_recorded',
    visitResult: 'raw_custom_result',
  }), 'invalid_visit_result');
});

test('denies visit-result-recorded without visit result', () => {
  assertDenied(build({
    mobileVisitStatus: 'visit_result_recorded',
    visitResult: undefined,
  }), 'invalid_visit_result');
});

test('denies completion-report boundary indicators', () => {
  assertDenied(build({
    completionReportId: 'cr_task_1818',
  }), 'completion_report_boundary');
});

test('denies finalAppointmentId boundary indicators', () => {
  assertDenied(build({
    finalAppointmentId: 'apt_final_should_not_be_mutated',
  }), 'final_appointment_boundary');
});

test('output does not include phone address LINE customer private note or report draft fields', () => {
  const result = build({
    customerPhone: 'raw_phone_should_not_leak',
    address: 'raw_address_should_not_leak',
    lineUserId: 'raw_line_should_not_leak',
    customerName: 'raw_customer_should_not_leak',
    privateNote: 'raw_private_note_should_not_leak',
    reportDraftBody: 'raw_report_draft_should_not_leak',
  });

  assertDenied(result, 'completion_report_boundary');
  assertNoLeak(result);
});

test('output does not include DB repository provider or customer-visible publication fields', () => {
  const result = build({
    dbMetadata: 'raw_db_metadata_should_not_leak',
    repositoryName: 'raw_repository_should_not_leak',
    providerPayload: 'raw_provider_payload_should_not_leak',
    customerVisiblePublication: 'raw_publication_should_not_leak',
  });

  assert.equal(result.ok, true);
  assertNoLeak(result);
  assert.deepEqual(Object.keys(result.patch).sort(), [
    'appointmentId',
    'caseId',
    'mobileVisitStatus',
    'organizationId',
    'updatedAt',
    'updatedBy',
  ].sort());
});

test('input transitionIntent is not mutated', () => {
  const intent = transitionIntent({
    mobileVisitStatus: 'visit_result_recorded',
    visitResult: 'customer_unavailable',
  });
  const before = clone(intent);

  buildEngineerMobileVisitActionTransitionPatch({ transitionIntent: intent, now: NOW });

  assert.deepEqual(intent, before);
});
