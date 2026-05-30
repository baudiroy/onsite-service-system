'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  ENGINEER_MOBILE_START_TRAVEL_ACTION,
  ENGINEER_MOBILE_START_TRAVEL_PERMISSION,
} = require('../../src/engineerMobile/engineerMobileStartTravelActionPolicy');
const {
  ENGINEER_MOBILE_ARRIVE_ACTION,
  ENGINEER_MOBILE_ARRIVE_PERMISSION,
} = require('../../src/engineerMobile/engineerMobileArriveActionPolicy');
const {
  ENGINEER_MOBILE_START_WORK_ACTION,
  ENGINEER_MOBILE_START_WORK_PERMISSION,
} = require('../../src/engineerMobile/engineerMobileStartWorkActionPolicy');
const {
  ENGINEER_MOBILE_FINISH_WORK_ACTION,
  ENGINEER_MOBILE_FINISH_WORK_PERMISSION,
} = require('../../src/engineerMobile/engineerMobileFinishWorkActionPolicy');
const {
  ENGINEER_MOBILE_RECORD_VISIT_RESULT_ACTION,
  ENGINEER_MOBILE_RECORD_VISIT_RESULT_PERMISSION,
} = require('../../src/engineerMobile/engineerMobileRecordVisitResultActionPolicy');
const {
  ENGINEER_MOBILE_VISIT_ACTION_APPLICATION_SERVICE_KIND,
  createEngineerMobileVisitActionApplicationService,
} = require('../../src/engineerMobile/engineerMobileVisitActionApplicationService');

const NOW = '2026-05-28T13:00:00.000Z';

function actor(permission, overrides = {}) {
  return {
    id: 'eng_task_1808',
    organizationId: 'org_task_1808',
    permissions: [permission],
    ...overrides,
  };
}

function appointment(overrides = {}) {
  return {
    appointmentId: 'apt_task_1808',
    caseId: 'case_task_1808',
    organizationId: 'org_task_1808',
    assignedEngineerId: 'eng_task_1808',
    status: 'scheduled',
    customerPhone: 'raw_phone_should_not_leak',
    address: 'raw_address_should_not_leak',
    lineUserId: 'raw_line_should_not_leak',
    customerName: 'raw_customer_should_not_leak',
    privateNote: 'raw_private_note_should_not_leak',
    reportDraftBody: 'raw_report_draft_should_not_leak',
    providerPayload: 'raw_provider_payload_should_not_leak',
    ...overrides,
  };
}

function command({
  action,
  permission,
  appointmentOverrides,
  actorOverrides,
  visitResult,
  requestId,
}) {
  const payload = {
    action,
    actor: actor(permission, actorOverrides),
    appointment: appointment(appointmentOverrides),
    visitResult,
    now: NOW,
  };

  if (requestId !== undefined) {
    payload.requestId = requestId;
  }

  return payload;
}

function serviceWithWriters({
  calls = [],
  transitionImpl,
  auditImpl,
} = {}) {
  const transitionWriter = {
    write(intent) {
      calls.push({ name: 'transition', payload: intent });
      return transitionImpl ? transitionImpl(intent) : { ok: true };
    },
  };
  const auditWriter = auditImpl === undefined
    ? {
      record(intent) {
        calls.push({ name: 'audit', payload: intent });
        return { ok: true };
      },
    }
    : {
      record(intent) {
        calls.push({ name: 'audit', payload: intent });
        return auditImpl(intent);
      },
    };

  return createEngineerMobileVisitActionApplicationService({
    transitionWriter,
    auditWriter,
  });
}

function assertNoSensitiveLeak(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'raw_phone_should_not_leak',
    'raw_address_should_not_leak',
    'raw_line_should_not_leak',
    'raw_customer_should_not_leak',
    'raw_private_note_should_not_leak',
    'raw_report_draft_should_not_leak',
    'raw_provider_payload_should_not_leak',
    'raw_writer_error_should_not_leak',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertApplied(result, action, mobileVisitStatus, auditRecorded = true) {
  assert.equal(result.ok, true);
  assert.equal(result.allowed, true);
  assert.equal(result.serviceKind, ENGINEER_MOBILE_VISIT_ACTION_APPLICATION_SERVICE_KIND);
  assert.equal(result.action, action);
  assert.equal(result.reasonCode, 'applied');
  assert.equal(result.actorId, 'eng_task_1808');
  assert.equal(result.appointmentId, 'apt_task_1808');
  assert.equal(result.caseId, 'case_task_1808');
  assert.equal(result.organizationId, 'org_task_1808');
  assert.equal(result.transitionApplied, true);
  assert.equal(result.auditRecorded, auditRecorded);
  assert.equal(result.transitionIntent.mobileVisitStatus, mobileVisitStatus);
  assertNoSensitiveLeak(result);
}

test('denied planner result returns sanitized denial and calls no writers', () => {
  const calls = [];
  const service = serviceWithWriters({ calls });
  const result = service.handleEngineerMobileVisitAction(command({
    action: ENGINEER_MOBILE_FINISH_WORK_ACTION,
    permission: ENGINEER_MOBILE_FINISH_WORK_PERMISSION,
    actorOverrides: { permissions: [] },
    appointmentOverrides: { mobileVisitStatus: 'working' },
  }));

  assert.equal(result.ok, false);
  assert.equal(result.allowed, false);
  assert.equal(result.reasonCode, 'invalid_context');
  assert.equal(result.transitionApplied, false);
  assert.equal(result.auditRecorded, false);
  assert.deepEqual(calls, []);
  assertNoSensitiveLeak(result);
});

test('missing transitionWriter.write returns transition_writer_required', () => {
  const service = createEngineerMobileVisitActionApplicationService({});
  const result = service.handleEngineerMobileVisitAction(command({
    action: ENGINEER_MOBILE_START_TRAVEL_ACTION,
    permission: ENGINEER_MOBILE_START_TRAVEL_PERMISSION,
  }));

  assert.equal(service.kind, ENGINEER_MOBILE_VISIT_ACTION_APPLICATION_SERVICE_KIND);
  assert.equal(result.ok, false);
  assert.equal(result.allowed, true);
  assert.equal(result.reasonCode, 'transition_writer_required');
  assert.equal(result.transitionApplied, false);
  assert.equal(result.auditRecorded, false);
  assertNoSensitiveLeak(result);
});

test('allowed start_travel calls transition writer once with sanitized transition intent', () => {
  const calls = [];
  const service = serviceWithWriters({ calls });
  const result = service.handleEngineerMobileVisitAction(command({
    action: ENGINEER_MOBILE_START_TRAVEL_ACTION,
    permission: ENGINEER_MOBILE_START_TRAVEL_PERMISSION,
  }));

  assertApplied(result, ENGINEER_MOBILE_START_TRAVEL_ACTION, 'traveling');
  assert.equal(calls.filter((call) => call.name === 'transition').length, 1);
  assert.equal(calls[0].payload.mobileVisitStatus, 'traveling');
  assertNoSensitiveLeak(calls[0].payload);
});

test('allowed arrive calls transition writer once', () => {
  const calls = [];
  const service = serviceWithWriters({ calls });
  const result = service.handleEngineerMobileVisitAction(command({
    action: ENGINEER_MOBILE_ARRIVE_ACTION,
    permission: ENGINEER_MOBILE_ARRIVE_PERMISSION,
    appointmentOverrides: { mobileVisitStatus: 'traveling' },
  }));

  assertApplied(result, ENGINEER_MOBILE_ARRIVE_ACTION, 'arrived');
  assert.equal(calls.filter((call) => call.name === 'transition').length, 1);
});

test('allowed start_work calls transition writer once', () => {
  const calls = [];
  const service = serviceWithWriters({ calls });
  const result = service.handleEngineerMobileVisitAction(command({
    action: ENGINEER_MOBILE_START_WORK_ACTION,
    permission: ENGINEER_MOBILE_START_WORK_PERMISSION,
    appointmentOverrides: { mobileVisitStatus: 'arrived' },
  }));

  assertApplied(result, ENGINEER_MOBILE_START_WORK_ACTION, 'working');
  assert.equal(calls.filter((call) => call.name === 'transition').length, 1);
});

test('allowed finish_work calls transition writer once', () => {
  const calls = [];
  const service = serviceWithWriters({ calls });
  const result = service.handleEngineerMobileVisitAction(command({
    action: ENGINEER_MOBILE_FINISH_WORK_ACTION,
    permission: ENGINEER_MOBILE_FINISH_WORK_PERMISSION,
    appointmentOverrides: { mobileVisitStatus: 'working' },
  }));

  assertApplied(result, ENGINEER_MOBILE_FINISH_WORK_ACTION, 'work_finished');
  assert.equal(calls.filter((call) => call.name === 'transition').length, 1);
});

test('allowed record_visit_result forwards safe visitResult through transition intent', () => {
  const calls = [];
  const service = serviceWithWriters({ calls });
  const result = service.handleEngineerMobileVisitAction(command({
    action: ENGINEER_MOBILE_RECORD_VISIT_RESULT_ACTION,
    permission: ENGINEER_MOBILE_RECORD_VISIT_RESULT_PERMISSION,
    appointmentOverrides: { mobileVisitStatus: 'work_finished' },
    visitResult: 'parts_required',
  }));

  assertApplied(result, ENGINEER_MOBILE_RECORD_VISIT_RESULT_ACTION, 'visit_result_recorded');
  assert.equal(result.transitionIntent.visitResult, 'parts_required');
  assert.equal(calls[0].payload.visitResult, 'parts_required');
});

test('audit writer is called after transition writer when present', () => {
  const calls = [];
  const service = serviceWithWriters({ calls });
  const result = service.handleEngineerMobileVisitAction(command({
    action: ENGINEER_MOBILE_START_TRAVEL_ACTION,
    permission: ENGINEER_MOBILE_START_TRAVEL_PERMISSION,
  }));

  assertApplied(result, ENGINEER_MOBILE_START_TRAVEL_ACTION, 'traveling');
  assert.deepEqual(calls.map((call) => call.name), ['transition', 'audit']);
});

test('requestId is preserved through service result transition writer and audit writer payloads', () => {
  const calls = [];
  const service = serviceWithWriters({ calls });
  const result = service.handleEngineerMobileVisitAction(command({
    action: ENGINEER_MOBILE_START_TRAVEL_ACTION,
    permission: ENGINEER_MOBILE_START_TRAVEL_PERMISSION,
    requestId: 'req_task_1873',
  }));

  assertApplied(result, ENGINEER_MOBILE_START_TRAVEL_ACTION, 'traveling');
  assert.equal(result.requestId, 'req_task_1873');
  assert.equal(result.transitionIntent.requestId, 'req_task_1873');
  assert.equal(result.auditIntent.requestId, 'req_task_1873');
  assert.equal(calls[0].payload.requestId, 'req_task_1873');
  assert.equal(calls[1].payload.requestId, 'req_task_1873');
  assertNoSensitiveLeak(result);
  assertNoSensitiveLeak(calls);
});

test('audit writer is skipped safely when absent', () => {
  const calls = [];
  const service = createEngineerMobileVisitActionApplicationService({
    transitionWriter: {
      write(intent) {
        calls.push({ name: 'transition', payload: intent });
        return { ok: true };
      },
    },
  });
  const result = service.handleEngineerMobileVisitAction(command({
    action: ENGINEER_MOBILE_START_TRAVEL_ACTION,
    permission: ENGINEER_MOBILE_START_TRAVEL_PERMISSION,
  }));

  assertApplied(result, ENGINEER_MOBILE_START_TRAVEL_ACTION, 'traveling', false);
  assert.deepEqual(calls.map((call) => call.name), ['transition']);
});

test('transition writer thrown error returns transition_write_failed without raw error', () => {
  const service = serviceWithWriters({
    transitionImpl() {
      throw new Error('raw_writer_error_should_not_leak');
    },
  });
  const result = service.handleEngineerMobileVisitAction(command({
    action: ENGINEER_MOBILE_START_TRAVEL_ACTION,
    permission: ENGINEER_MOBILE_START_TRAVEL_PERMISSION,
  }));

  assert.equal(result.ok, false);
  assert.equal(result.allowed, true);
  assert.equal(result.reasonCode, 'transition_write_failed');
  assert.equal(result.transitionApplied, false);
  assert.equal(result.auditRecorded, false);
  assertNoSensitiveLeak(result);
});

test('transition writer failed result returns transition_write_failed', () => {
  const service = serviceWithWriters({
    transitionImpl() {
      return { ok: false, error: 'raw_writer_error_should_not_leak' };
    },
  });
  const result = service.handleEngineerMobileVisitAction(command({
    action: ENGINEER_MOBILE_START_TRAVEL_ACTION,
    permission: ENGINEER_MOBILE_START_TRAVEL_PERMISSION,
  }));

  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'transition_write_failed');
  assertNoSensitiveLeak(result);
});

test('audit writer thrown error returns audit_write_failed without raw error', () => {
  const service = serviceWithWriters({
    auditImpl() {
      throw new Error('raw_writer_error_should_not_leak');
    },
  });
  const result = service.handleEngineerMobileVisitAction(command({
    action: ENGINEER_MOBILE_START_TRAVEL_ACTION,
    permission: ENGINEER_MOBILE_START_TRAVEL_PERMISSION,
  }));

  assert.equal(result.ok, false);
  assert.equal(result.allowed, true);
  assert.equal(result.reasonCode, 'audit_write_failed');
  assert.equal(result.transitionApplied, true);
  assert.equal(result.auditRecorded, false);
  assertNoSensitiveLeak(result);
});

test('audit writer failed result returns audit_write_failed', () => {
  const service = serviceWithWriters({
    auditImpl() {
      return { success: false, error: 'raw_writer_error_should_not_leak' };
    },
  });
  const result = service.handleEngineerMobileVisitAction(command({
    action: ENGINEER_MOBILE_START_TRAVEL_ACTION,
    permission: ENGINEER_MOBILE_START_TRAVEL_PERMISSION,
  }));

  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'audit_write_failed');
  assertNoSensitiveLeak(result);
});

test('output is sanitized with no raw appointment customer or report draft fields', () => {
  const service = serviceWithWriters();
  const result = service.handleEngineerMobileVisitAction(command({
    action: ENGINEER_MOBILE_RECORD_VISIT_RESULT_ACTION,
    permission: ENGINEER_MOBILE_RECORD_VISIT_RESULT_PERMISSION,
    appointmentOverrides: { mobileVisitStatus: 'work_finished' },
    visitResult: 'resolved',
  }));

  assert.equal(result.ok, true);
  assertNoSensitiveLeak(result);
});

test('inputs are not mutated', () => {
  const sourceCommand = command({
    action: ENGINEER_MOBILE_RECORD_VISIT_RESULT_ACTION,
    permission: ENGINEER_MOBILE_RECORD_VISIT_RESULT_PERMISSION,
    appointmentOverrides: { mobileVisitStatus: 'work_finished' },
    visitResult: 'resolved',
  });
  const before = clone(sourceCommand);
  const service = serviceWithWriters();

  service.handleEngineerMobileVisitAction(sourceCommand);

  assert.deepEqual(sourceCommand, before);
});

test('writer call payloads contain no unsafe publication or provider fields', () => {
  const calls = [];
  const transitionPayloadKeys = [];
  const service = serviceWithWriters({
    calls,
    transitionImpl(intent) {
      transitionPayloadKeys.push(Object.keys(intent).sort());
      intent.mutatedByWriter = true;
      return { ok: true };
    },
    auditImpl(intent) {
      intent.mutatedByWriter = true;
      return { ok: true };
    },
  });
  const result = service.handleEngineerMobileVisitAction(command({
    action: ENGINEER_MOBILE_RECORD_VISIT_RESULT_ACTION,
    permission: ENGINEER_MOBILE_RECORD_VISIT_RESULT_PERMISSION,
    appointmentOverrides: { mobileVisitStatus: 'work_finished' },
    visitResult: 'customer_unavailable',
  }));

  assert.equal(result.transitionIntent.mutatedByWriter, undefined);
  assert.equal(result.auditIntent.mutatedByWriter, undefined);
  assert.deepEqual(transitionPayloadKeys[0], [
    'action',
    'actorId',
    'appointmentId',
    'caseId',
    'kind',
    'mobileVisitStatus',
    'organizationId',
    'plannedAt',
    'visitResult',
  ].sort());
  assertNoSensitiveLeak(calls);
});


test('transition writer success variants still accept after normalization', () => {
  for (const transitionResult of [
    undefined,
    null,
    true,
    { ok: true },
    { accepted: true },
    { written: true },
    { persisted: true },
  ]) {
    const service = serviceWithWriters({
      transitionImpl() {
        return transitionResult;
      },
    });
    const result = service.handleEngineerMobileVisitAction(command({
      action: ENGINEER_MOBILE_START_TRAVEL_ACTION,
      permission: ENGINEER_MOBILE_START_TRAVEL_PERMISSION,
    }));

    assertApplied(result, ENGINEER_MOBILE_START_TRAVEL_ACTION, 'traveling');
  }
});

test('transition writer failure variants return transition_write_failed after normalization', () => {
  for (const transitionResult of [
    false,
    { ok: false, error: 'raw_writer_error_should_not_leak' },
    { written: false, error: 'raw_writer_error_should_not_leak' },
    { persisted: false, error: 'raw_writer_error_should_not_leak' },
    { error: 'raw_writer_error_should_not_leak' },
    { message: 'unknown shape fails closed' },
  ]) {
    const calls = [];
    const service = serviceWithWriters({
      calls,
      transitionImpl() {
        return transitionResult;
      },
    });
    const result = service.handleEngineerMobileVisitAction(command({
      action: ENGINEER_MOBILE_START_TRAVEL_ACTION,
      permission: ENGINEER_MOBILE_START_TRAVEL_PERMISSION,
    }));

    assert.equal(result.ok, false);
    assert.equal(result.allowed, true);
    assert.equal(result.reasonCode, 'transition_write_failed');
    assert.equal(result.transitionApplied, false);
    assert.equal(result.auditRecorded, false);
    assert.deepEqual(calls.map((call) => call.name), ['transition']);
    assertNoSensitiveLeak(result);
  }
});

test('audit writer success variants still record after normalization', () => {
  for (const auditResult of [
    undefined,
    null,
    true,
    { ok: true },
    { success: true },
    { accepted: true },
    { recorded: true },
  ]) {
    const service = serviceWithWriters({
      auditImpl() {
        return auditResult;
      },
    });
    const result = service.handleEngineerMobileVisitAction(command({
      action: ENGINEER_MOBILE_START_TRAVEL_ACTION,
      permission: ENGINEER_MOBILE_START_TRAVEL_PERMISSION,
    }));

    assertApplied(result, ENGINEER_MOBILE_START_TRAVEL_ACTION, 'traveling');
  }
});

test('audit writer failure variants return audit_write_failed after normalization', () => {
  for (const auditResult of [
    false,
    { ok: false, error: 'raw_writer_error_should_not_leak' },
    { success: false, error: 'raw_writer_error_should_not_leak' },
    { recorded: false, error: 'raw_writer_error_should_not_leak' },
    { error: 'raw_writer_error_should_not_leak' },
    { message: 'unknown shape fails closed' },
  ]) {
    const service = serviceWithWriters({
      auditImpl() {
        return auditResult;
      },
    });
    const result = service.handleEngineerMobileVisitAction(command({
      action: ENGINEER_MOBILE_START_TRAVEL_ACTION,
      permission: ENGINEER_MOBILE_START_TRAVEL_PERMISSION,
    }));

    assert.equal(result.ok, false);
    assert.equal(result.allowed, true);
    assert.equal(result.reasonCode, 'audit_write_failed');
    assert.equal(result.transitionApplied, true);
    assert.equal(result.auditRecorded, false);
    assertNoSensitiveLeak(result);
  }
});

test('raw writer result details do not leak through normalized application service failures', () => {
  const service = serviceWithWriters({
    transitionImpl() {
      return {
        error: 'raw_writer_error_should_not_leak',
        sql: 'raw_sql_should_not_leak',
        providerPayload: 'raw_provider_payload_should_not_leak',
        customerPhone: 'raw_phone_should_not_leak',
        reportDraftBody: 'raw_report_draft_should_not_leak',
      };
    },
  });
  const result = service.handleEngineerMobileVisitAction(command({
    action: ENGINEER_MOBILE_START_TRAVEL_ACTION,
    permission: ENGINEER_MOBILE_START_TRAVEL_PERMISSION,
  }));

  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'transition_write_failed');
  assertNoSensitiveLeak(result);
  assert.equal(JSON.stringify(result).includes('raw_sql_should_not_leak'), false);
});
