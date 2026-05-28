'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  ENGINEER_MOBILE_START_TRAVEL_ACTION,
  ENGINEER_MOBILE_START_TRAVEL_PERMISSION,
} = require('../../src/engineerMobile/engineerMobileStartTravelActionPolicy');
const {
  ENGINEER_MOBILE_RECORD_VISIT_RESULT_ACTION,
  ENGINEER_MOBILE_RECORD_VISIT_RESULT_PERMISSION,
} = require('../../src/engineerMobile/engineerMobileRecordVisitResultActionPolicy');
const {
  createEngineerMobileVisitActionRuntimeBootstrap,
} = require('../../src/engineerMobile/engineerMobileVisitActionRuntimeBootstrap');
const {
  createEngineerMobileVisitActionRepositoryAdapter,
} = require('../../src/engineerMobile/engineerMobileVisitActionRepositoryAdapter');

const NOW = '2026-05-28T20:20:00.000Z';
const DEFAULT_PATH = '/engineer-mobile/appointments/:appointmentId/actions/:action';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function actor(overrides = {}) {
  return {
    id: 'eng_task_1850',
    organizationId: 'org_task_1850',
    permissions: [ENGINEER_MOBILE_START_TRAVEL_PERMISSION],
    token: 'token_should_not_leak',
    secret: 'secret_should_not_leak',
    ...overrides,
  };
}

function appointment(overrides = {}) {
  return {
    appointmentId: 'apt_task_1850',
    caseId: 'case_task_1850',
    organizationId: 'org_task_1850',
    assignedEngineerId: 'eng_task_1850',
    status: 'scheduled',
    phone: 'raw_phone_should_not_leak',
    customerPhone: 'raw_phone_should_not_leak',
    address: 'raw_address_should_not_leak',
    lineUserId: 'raw_line_should_not_leak',
    customerName: 'raw_customer_should_not_leak',
    privateNote: 'raw_private_note_should_not_leak',
    reportDraftBody: 'raw_report_draft_should_not_leak',
    providerPayload: 'raw_provider_payload_should_not_leak',
    customerVisiblePublication: 'raw_publication_should_not_leak',
    ...overrides,
  };
}

function startTravelCommand(overrides = {}) {
  return {
    action: ENGINEER_MOBILE_START_TRAVEL_ACTION,
    actor: actor(overrides.actorOverrides),
    appointment: appointment(overrides.appointmentOverrides),
    now: NOW,
    ...overrides.commandOverrides,
  };
}

function recordVisitResultCommand(overrides = {}) {
  return startTravelCommand({
    actorOverrides: {
      permissions: [ENGINEER_MOBILE_RECORD_VISIT_RESULT_PERMISSION],
      ...(overrides.actorOverrides || {}),
    },
    appointmentOverrides: {
      mobileVisitStatus: 'work_finished',
      ...(overrides.appointmentOverrides || {}),
    },
    commandOverrides: {
      action: ENGINEER_MOBILE_RECORD_VISIT_RESULT_ACTION,
      visitResult: 'resolved',
      ...(overrides.commandOverrides || {}),
    },
  });
}

function requestFrom(command, overrides = {}) {
  return {
    requestId: 'req_task_1850',
    params: {
      appointmentId: command.appointment.appointmentId,
    },
    body: clone(command),
    ...overrides,
  };
}

function postMountTarget(extra = {}) {
  const registrations = [];

  return {
    registrations,
    post(path, handler) {
      registrations.push({
        method: 'POST',
        mountStyle: 'post',
        path,
        handler,
      });
    },
    ...extra,
  };
}

function bootstrapWithSyntheticClient({ calls = [], executeImpl } = {}) {
  const dbClient = {
    execute(operationIntent) {
      calls.push(clone(operationIntent));
      return executeImpl ? executeImpl(operationIntent) : { ok: true };
    },
  };
  const repositoryAdapter = createEngineerMobileVisitActionRepositoryAdapter({ dbClient });
  const bootstrap = createEngineerMobileVisitActionRuntimeBootstrap({
    repositoryAdapter,
    now: NOW,
  });

  return {
    bootstrap,
    calls,
    dbClient,
    repositoryAdapter,
  };
}

function assertApplied(response, action) {
  assert.equal(response.ok, true);
  assert.equal(response.allowed, true);
  assert.equal(response.reasonCode, 'applied');
  assert.equal(response.action, action);
  assert.equal(response.transitionApplied, true);
  assert.equal(response.auditRecorded, false);
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
    'raw_publication_should_not_leak',
    'raw_db_client_error_should_not_leak',
    'token_should_not_leak',
    'secret_should_not_leak',
    'credential_should_not_leak',
    'DATABASE_URL',
    'providerPayload',
    'customerVisiblePublication',
    'completionReport',
    'fieldServiceReport',
    ['final', 'AppointmentId'].join(''),
    'reportDraftBody',
    'privateNote',
    'customerName',
    'lineUserId',
    'customerPhone',
    'phone',
    'address',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }

  for (const forbidden of [
    ['SEL', 'ECT'].join(''),
    ['INS', 'ERT'].join(''),
    ['UPD', 'ATE'].join(''),
    ['DEL', 'ETE'].join(''),
    'postgres' + '://',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `contains ${forbidden}`);
  }
}

function assertStartTravelOperationIntent(operationIntent) {
  assert.deepEqual(Object.keys(operationIntent).sort(), [
    'action',
    'entityId',
    'entityType',
    'operationKind',
    'operationName',
    'organizationId',
    'parameters',
  ].sort());
  assert.equal(operationIntent.operationKind, 'engineer_mobile.visit_action_repository.operation_intent');
  assert.equal(operationIntent.operationName, 'persist_engineer_mobile_visit_action');
  assert.equal(operationIntent.entityType, 'appointment');
  assert.equal(operationIntent.entityId, 'apt_task_1850');
  assert.equal(operationIntent.organizationId, 'org_task_1850');
  assert.equal(operationIntent.action, ENGINEER_MOBILE_START_TRAVEL_ACTION);
  assert.deepEqual(Object.keys(operationIntent.parameters).sort(), [
    'auditEvent',
    'mobileVisitStatus',
    'updatedAt',
    'updatedBy',
  ].sort());
  assert.equal(operationIntent.parameters.mobileVisitStatus, 'traveling');
  assert.equal(operationIntent.parameters.updatedBy, 'eng_task_1850');
  assert.equal(operationIntent.parameters.updatedAt, NOW);
  assert.deepEqual(operationIntent.parameters.auditEvent, {
    eventKind: 'engineer_mobile.visit_action_audit_event',
    action: 'engineer_mobile.start_travel.allowed',
    entityType: 'appointment',
    entityId: 'apt_task_1850',
    actorId: 'eng_task_1850',
    organizationId: 'org_task_1850',
    occurredAt: NOW,
  });
  assertNoSensitiveLeak(operationIntent);
}

function assertRecordVisitResultOperationIntent(operationIntent) {
  assert.equal(operationIntent.action, ENGINEER_MOBILE_RECORD_VISIT_RESULT_ACTION);
  assert.equal(operationIntent.parameters.mobileVisitStatus, 'visit_result_recorded');
  assert.equal(operationIntent.parameters.visitResult, 'resolved');
  assert.equal(operationIntent.parameters.auditEvent.action, 'engineer_mobile.record_visit_result.allowed');
  assert.deepEqual(Object.keys(operationIntent.parameters).sort(), [
    'auditEvent',
    'mobileVisitStatus',
    'updatedAt',
    'updatedBy',
    'visitResult',
  ].sort());
  assertNoSensitiveLeak(operationIntent);
}

test('service-only bootstrap with repository adapter and synthetic db client accepts start_travel', () => {
  const calls = [];
  const { bootstrap } = bootstrapWithSyntheticClient({ calls });
  const response = bootstrap.visitActionService.handleEngineerMobileVisitAction(startTravelCommand());

  assert.deepEqual(bootstrap.writerSources, {
    transitionWriter: 'repository_bridge_integrated_writer',
    auditWriter: 'repository_bridge_integrated_writer',
  });
  assertApplied(response, ENGINEER_MOBILE_START_TRAVEL_ACTION);
  assert.equal(calls.length, 1);
  assertStartTravelOperationIntent(calls[0]);
  assertNoSensitiveLeak(response);
});

test('service-only bootstrap with repository adapter accepts record_visit_result with safe visit result', () => {
  const calls = [];
  const { bootstrap } = bootstrapWithSyntheticClient({ calls });
  const response = bootstrap.visitActionService.handleEngineerMobileVisitAction(recordVisitResultCommand());

  assertApplied(response, ENGINEER_MOBILE_RECORD_VISIT_RESULT_ACTION);
  assert.equal(calls.length, 1);
  assertRecordVisitResultOperationIntent(calls[0]);
  assertNoSensitiveLeak(response);
});

test('planner or policy denial does not call synthetic db client and preserves safe reasonCode', () => {
  const calls = [];
  const { bootstrap } = bootstrapWithSyntheticClient({ calls });
  const response = bootstrap.visitActionService.handleEngineerMobileVisitAction(startTravelCommand({
    actorOverrides: {
      permissions: [],
    },
  }));

  assert.equal(response.ok, false);
  assert.equal(response.allowed, false);
  assert.equal(response.reasonCode, 'permission_required');
  assert.equal(response.transitionApplied, false);
  assert.equal(response.auditRecorded, false);
  assert.deepEqual(calls, []);
  assertNoSensitiveLeak(response);
});

test('mounted bootstrap with injected mount target and repository adapter processes accepted request', async () => {
  let listenCalls = 0;
  const calls = [];
  const mountTarget = postMountTarget({
    listen() {
      listenCalls += 1;
    },
  });
  const repositoryAdapter = createEngineerMobileVisitActionRepositoryAdapter({
    dbClient: {
      execute(operationIntent) {
        calls.push(clone(operationIntent));
        return { ok: true };
      },
    },
  });
  const bootstrap = createEngineerMobileVisitActionRuntimeBootstrap({
    repositoryAdapter,
    mountTarget,
    now: NOW,
  });
  const response = await mountTarget.registrations[0].handler(requestFrom(startTravelCommand()));

  assert.equal(bootstrap.ok, true);
  assert.equal(bootstrap.reasonCode, 'mounted');
  assert.equal(bootstrap.mounted, 1);
  assert.deepEqual(bootstrap.routes, [{ method: 'POST', path: DEFAULT_PATH }]);
  assert.equal(mountTarget.registrations.length, 1);
  assert.equal(mountTarget.registrations[0].mountStyle, 'post');
  assert.equal(listenCalls, 0);
  assert.equal(response.statusCode, 202);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.accepted, true);
  assert.equal(calls.length, 1);
  assertStartTravelOperationIntent(calls[0]);
  assertNoSensitiveLeak(response);
});

test('synthetic db client failure returns sanitized transition failure without raw client error', () => {
  const calls = [];
  const { bootstrap } = bootstrapWithSyntheticClient({
    calls,
    executeImpl() {
      return {
        ok: false,
        error: 'raw_db_client_error_should_not_leak',
      };
    },
  });
  const response = bootstrap.visitActionService.handleEngineerMobileVisitAction(startTravelCommand());

  assert.equal(response.ok, false);
  assert.equal(response.allowed, true);
  assert.equal(response.reasonCode, 'transition_write_failed');
  assert.equal(response.transitionApplied, false);
  assert.equal(response.auditRecorded, false);
  assert.equal(calls.length, 1);
  assertStartTravelOperationIntent(calls[0]);
  assertNoSensitiveLeak(response);
});

test('synthetic db client unknown object result fails closed', () => {
  const calls = [];
  const { bootstrap } = bootstrapWithSyntheticClient({
    calls,
    executeImpl() {
      return {
        message: 'unknown object shape should fail closed',
        rawDbDetail: 'raw_db_client_error_should_not_leak',
      };
    },
  });
  const response = bootstrap.visitActionService.handleEngineerMobileVisitAction(startTravelCommand());

  assert.equal(response.ok, false);
  assert.equal(response.allowed, true);
  assert.equal(response.reasonCode, 'transition_write_failed');
  assert.equal(calls.length, 1);
  assertNoSensitiveLeak(response);
});

test('bootstrap repository adapter path does not mutate inputs or injected dependencies', async () => {
  const calls = [];
  const command = recordVisitResultCommand();
  const request = requestFrom(startTravelCommand());
  const commandBefore = clone(command);
  const requestBefore = clone(request);
  const { bootstrap, dbClient, repositoryAdapter } = bootstrapWithSyntheticClient({ calls });
  const mountTarget = postMountTarget();
  const mounted = createEngineerMobileVisitActionRuntimeBootstrap({
    repositoryAdapter,
    mountTarget,
    now: NOW,
  });
  const dbClientKeys = Object.keys(dbClient);
  const repositoryAdapterKeys = Object.keys(repositoryAdapter);

  bootstrap.visitActionService.handleEngineerMobileVisitAction(command);
  await mountTarget.registrations[0].handler(request);

  assert.deepEqual(command, commandBefore);
  assert.deepEqual(request, requestBefore);
  assert.deepEqual(Object.keys(dbClient), dbClientKeys);
  assert.deepEqual(Object.keys(repositoryAdapter), repositoryAdapterKeys);
  assert.equal(mounted.ok, true);
  assert.equal(calls.length, 2);
  assertNoSensitiveLeak(calls);
});
