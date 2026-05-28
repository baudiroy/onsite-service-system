'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  ENGINEER_MOBILE_VISIT_ACTION_TRANSITION_WRITER_ADAPTER_KIND,
  createEngineerMobileVisitActionTransitionWriterAdapter,
} = require('../../src/engineerMobile/engineerMobileVisitActionTransitionWriterAdapter');

const NOW = '2026-05-28T15:00:00.000Z';
const PLANNED_AT = '2026-05-28T14:30:00.000Z';

function transitionIntent(overrides = {}) {
  return {
    kind: 'engineer_mobile.visit_action_transition_intent',
    action: 'engineer_mobile.start_travel',
    actorId: 'eng_task_1820',
    appointmentId: 'apt_task_1820',
    caseId: 'case_task_1820',
    organizationId: 'org_task_1820',
    mobileVisitStatus: 'traveling',
    plannedAt: PLANNED_AT,
    ...overrides,
  };
}

function adapterWithWriter({
  calls = [],
  writerImpl,
  now = NOW,
} = {}) {
  return createEngineerMobileVisitActionTransitionWriterAdapter({
    now,
    patchWriter: {
      write(patchEnvelope) {
        calls.push(patchEnvelope);
        return writerImpl ? writerImpl(patchEnvelope) : { ok: true };
      },
    },
  });
}

function assertPatchWritten(result, status, extraPatch = {}) {
  assert.equal(result.ok, true);
  assert.equal(result.written, true);
  assert.equal(result.adapterKind, ENGINEER_MOBILE_VISIT_ACTION_TRANSITION_WRITER_ADAPTER_KIND);
  assert.equal(result.reasonCode, 'patch_written');
  assert.equal(result.action, result.patchEnvelope.action);
  assert.equal(result.actorId, 'eng_task_1820');
  assert.equal(result.appointmentId, 'apt_task_1820');
  assert.equal(result.caseId, 'case_task_1820');
  assert.equal(result.organizationId, 'org_task_1820');
  assert.deepEqual(result.patchEnvelope.patch, {
    appointmentId: 'apt_task_1820',
    caseId: 'case_task_1820',
    organizationId: 'org_task_1820',
    mobileVisitStatus: status,
    updatedAt: NOW,
    updatedBy: 'eng_task_1820',
    ...extraPatch,
  });
}

function assertFailure(result, reasonCode) {
  assert.equal(result.ok, false);
  assert.equal(result.written, false);
  assert.equal(result.adapterKind, ENGINEER_MOBILE_VISIT_ACTION_TRANSITION_WRITER_ADAPTER_KIND);
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
    'raw_patch_writer_error_should_not_leak',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test('missing patchWriter returns patch_writer_required', () => {
  const adapter = createEngineerMobileVisitActionTransitionWriterAdapter({});
  const result = adapter.write(transitionIntent());

  assert.equal(adapter.kind, ENGINEER_MOBILE_VISIT_ACTION_TRANSITION_WRITER_ADAPTER_KIND);
  assertFailure(result, 'patch_writer_required');
});

test('missing patchWriter.write returns patch_writer_required', () => {
  const adapter = createEngineerMobileVisitActionTransitionWriterAdapter({
    patchWriter: {},
  });
  const result = adapter.write(transitionIntent());

  assertFailure(result, 'patch_writer_required');
});

test('valid traveling transition calls patch writer once with sanitized patch envelope', () => {
  const calls = [];
  const adapter = adapterWithWriter({ calls });
  const result = adapter.write(transitionIntent());

  assertPatchWritten(result, 'traveling');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].patch.mobileVisitStatus, 'traveling');
  assertNoLeak(calls);
});

test('valid arrived transition calls patch writer once', () => {
  const calls = [];
  const adapter = adapterWithWriter({ calls });
  const result = adapter.write(transitionIntent({
    action: 'engineer_mobile.arrive',
    mobileVisitStatus: 'arrived',
  }));

  assertPatchWritten(result, 'arrived');
  assert.equal(calls.length, 1);
});

test('valid working transition calls patch writer once', () => {
  const calls = [];
  const adapter = adapterWithWriter({ calls });
  const result = adapter.write(transitionIntent({
    action: 'engineer_mobile.start_work',
    mobileVisitStatus: 'working',
  }));

  assertPatchWritten(result, 'working');
  assert.equal(calls.length, 1);
});

test('valid work_finished transition calls patch writer once', () => {
  const calls = [];
  const adapter = adapterWithWriter({ calls });
  const result = adapter.write(transitionIntent({
    action: 'engineer_mobile.finish_work',
    mobileVisitStatus: 'work_finished',
  }));

  assertPatchWritten(result, 'work_finished');
  assert.equal(calls.length, 1);
});

test('valid visit_result_recorded transition forwards safe visitResult', () => {
  const calls = [];
  const adapter = adapterWithWriter({ calls });
  const result = adapter.write(transitionIntent({
    action: 'engineer_mobile.record_visit_result',
    mobileVisitStatus: 'visit_result_recorded',
    visitResult: 'cannot_repair',
  }));

  assertPatchWritten(result, 'visit_result_recorded', { visitResult: 'cannot_repair' });
  assert.equal(calls[0].patch.visitResult, 'cannot_repair');
});

test('patch builder denial is preserved', () => {
  const calls = [];
  const adapter = adapterWithWriter({ calls });
  const result = adapter.write(transitionIntent({ appointmentId: undefined }));

  assertFailure(result, 'appointment_id_required');
  assert.equal(result.patchEnvelope.reasonCode, 'appointment_id_required');
  assert.deepEqual(calls, []);
});

test('patch writer success variants succeed', () => {
  for (const writerResult of [
    undefined,
    null,
    true,
    { ok: true },
    { accepted: true },
    { written: true },
    { persisted: true },
  ]) {
    const adapter = adapterWithWriter({
      writerImpl() {
        return writerResult;
      },
    });
    const result = adapter.write(transitionIntent());

    assertPatchWritten(result, 'traveling');
  }
});

test('patch writer failure variants return patch_write_failed', () => {
  for (const writerResult of [
    false,
    { ok: false },
    { accepted: false },
    { written: false },
    { persisted: false },
    { error: 'raw_patch_writer_error_should_not_leak' },
    { message: 'unknown object shape fails closed' },
  ]) {
    const adapter = adapterWithWriter({
      writerImpl() {
        return writerResult;
      },
    });
    const result = adapter.write(transitionIntent());

    assertFailure(result, 'patch_write_failed');
    assertNoLeak(result);
  }
});

test('patch writer thrown error returns patch_write_failed without raw error', () => {
  const adapter = adapterWithWriter({
    writerImpl() {
      throw new Error('raw_patch_writer_error_should_not_leak');
    },
  });
  const result = adapter.write(transitionIntent());

  assertFailure(result, 'patch_write_failed');
  assertNoLeak(result);
});

test('patch writer is not called when patch builder denies', () => {
  const calls = [];
  const adapter = adapterWithWriter({ calls });
  const result = adapter.write(transitionIntent({ organizationId: undefined }));

  assertFailure(result, 'organization_id_required');
  assert.deepEqual(calls, []);
});

test('output does not include phone address LINE customer private note or report draft fields', () => {
  const adapter = adapterWithWriter();
  const result = adapter.write(transitionIntent({
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

test('patch writer payload does not include DB repository provider or publication fields', () => {
  const calls = [];
  const adapter = adapterWithWriter({ calls });
  const result = adapter.write(transitionIntent({
    dbMetadata: 'raw_db_metadata_should_not_leak',
    repositoryName: 'raw_repository_should_not_leak',
    providerPayload: 'raw_provider_payload_should_not_leak',
    customerVisiblePublication: 'raw_publication_should_not_leak',
  }));

  assertPatchWritten(result, 'traveling');
  assertNoLeak(calls);
  assert.deepEqual(Object.keys(calls[0].patch).sort(), [
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
    visitResult: 'resolved',
  });
  const before = clone(intent);
  const adapter = adapterWithWriter();

  adapter.write(intent);

  assert.deepEqual(intent, before);
});

test('patch writer mutation of received payload does not mutate returned safe result', () => {
  const adapter = adapterWithWriter({
    writerImpl(patchEnvelope) {
      patchEnvelope.patch.mobileVisitStatus = 'mutated_status';
      patchEnvelope.rawProviderPayload = 'raw_provider_payload_should_not_leak';
      return { ok: true };
    },
  });
  const result = adapter.write(transitionIntent());

  assertPatchWritten(result, 'traveling');
  assertNoLeak(result);
});
