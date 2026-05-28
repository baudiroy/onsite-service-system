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
  ENGINEER_MOBILE_VISIT_ACTION_RUNTIME_BOOTSTRAP_KIND,
  createEngineerMobileVisitActionRuntimeBootstrap,
} = require('../../src/engineerMobile/engineerMobileVisitActionRuntimeBootstrap');

const DEFAULT_PATH = '/engineer-mobile/appointments/:appointmentId/actions/:action';
const NOW = '2026-05-28T16:00:00.000Z';

function actor(overrides = {}) {
  return {
    id: 'eng_task_1814',
    organizationId: 'org_task_1814',
    permissions: [ENGINEER_MOBILE_START_TRAVEL_PERMISSION],
    token: 'token_should_not_leak',
    ...overrides,
  };
}

function appointment(overrides = {}) {
  return {
    appointmentId: 'apt_task_1814',
    caseId: 'case_task_1814',
    organizationId: 'org_task_1814',
    assignedEngineerId: 'eng_task_1814',
    status: 'scheduled',
    customerPhone: 'raw_phone_should_not_leak',
    address: 'raw_address_should_not_leak',
    lineUserId: 'raw_line_should_not_leak',
    customerName: 'raw_customer_should_not_leak',
    privateNote: 'raw_private_note_should_not_leak',
    reportDraftBody: 'raw_report_draft_should_not_leak',
    ...overrides,
  };
}

function command(overrides = {}) {
  return {
    action: ENGINEER_MOBILE_START_TRAVEL_ACTION,
    actor: actor(overrides.actorOverrides),
    appointment: appointment(overrides.appointmentOverrides),
    now: NOW,
    ...overrides.commandOverrides,
  };
}

function request(overrides = {}) {
  return {
    requestId: 'req_task_1814',
    params: {
      appointmentId: 'apt_task_1814',
    },
    body: command(overrides),
  };
}

function recordVisitResultCommand() {
  return command({
    actorOverrides: {
      permissions: [ENGINEER_MOBILE_RECORD_VISIT_RESULT_PERMISSION],
    },
    appointmentOverrides: {
      mobileVisitStatus: 'work_finished',
    },
    commandOverrides: {
      action: ENGINEER_MOBILE_RECORD_VISIT_RESULT_ACTION,
      visitResult: 'resolved',
    },
  });
}

function writers() {
  const calls = [];
  const transitionWriter = {
    write(intent) {
      calls.push({ name: 'transition', payload: intent });
      return { ok: true };
    },
  };
  const auditWriter = {
    record(intent) {
      calls.push({ name: 'audit', payload: intent });
      return { ok: true };
    },
  };

  return {
    calls,
    transitionWriter,
    auditWriter,
  };
}

function adapterWriterSources() {
  const calls = [];
  const patchWriter = {
    write(patchEnvelope) {
      calls.push({ name: 'patch', payload: patchEnvelope });
      return { ok: true };
    },
  };
  const auditEventWriter = {
    record(auditEventEnvelope) {
      calls.push({ name: 'audit_event', payload: auditEventEnvelope });
      return { ok: true };
    },
  };

  return {
    calls,
    patchWriter,
    auditEventWriter,
  };
}

function persistencePortSource() {
  const calls = [];
  const persistencePort = {
    persist(payload) {
      calls.push(payload);
      return { ok: true };
    },
  };

  return {
    calls,
    persistencePort,
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

function routePostMountTarget() {
  const registrations = [];

  return {
    registrations,
    route(path) {
      return {
        post(handler) {
          registrations.push({
            method: 'POST',
            mountStyle: 'route.post',
            path,
            handler,
          });
        },
      };
    },
  };
}

function registerMountTarget() {
  const registrations = [];

  return {
    registrations,
    register(route) {
      registrations.push({
        method: route.method,
        mountStyle: 'register',
        path: route.path,
        handler: route.handler,
      });
    },
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
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
    'token_should_not_leak',
    'secret',
    'select * from',
    'stack',
    'completionReport',
    'fieldServiceReport',
    'finalAppointmentId',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

function assertServiceOnly(result, expectedWriterSources = {
  transitionWriter: 'direct',
  auditWriter: 'direct',
}) {
  assert.equal(result.kind, ENGINEER_MOBILE_VISIT_ACTION_RUNTIME_BOOTSTRAP_KIND);
  assert.equal(result.ok, true);
  assert.equal(result.reasonCode, 'service_only');
  assert.equal(result.mounted, 0);
  assert.deepEqual(result.routes, []);
  assert.deepEqual(result.writerSources, expectedWriterSources);
  assert.equal(typeof result.visitActionService.handleEngineerMobileVisitAction, 'function');
  assertNoSensitiveLeak(result);
}

function assertMounted(
  result,
  mountTarget,
  expectedPath = DEFAULT_PATH,
  expectedStyle = 'post',
  expectedWriterSources = {
    transitionWriter: 'direct',
    auditWriter: 'direct',
  },
) {
  assert.equal(result.kind, ENGINEER_MOBILE_VISIT_ACTION_RUNTIME_BOOTSTRAP_KIND);
  assert.equal(result.ok, true);
  assert.equal(result.reasonCode, 'mounted');
  assert.equal(result.mounted, 1);
  assert.deepEqual(result.routes, [{ method: 'POST', path: expectedPath }]);
  assert.deepEqual(result.writerSources, expectedWriterSources);
  assert.equal(result.mountSummary.reasonCode, 'mounted');
  assert.equal(result.mountSummary.mountStyle, expectedStyle);
  assert.equal(mountTarget.registrations.length, 1);
  assert.equal(mountTarget.registrations[0].method, 'POST');
  assert.equal(mountTarget.registrations[0].mountStyle, expectedStyle);
  assert.equal(mountTarget.registrations[0].path, expectedPath);
  assert.equal(typeof mountTarget.registrations[0].handler, 'function');
  assert.equal(typeof result.visitActionService.handleEngineerMobileVisitAction, 'function');
  assertNoSensitiveLeak(result);
}

test('creates service-only bootstrap when no mount target is provided', () => {
  const fake = writers();
  const result = createEngineerMobileVisitActionRuntimeBootstrap({
    transitionWriter: fake.transitionWriter,
    auditWriter: fake.auditWriter,
  });

  assertServiceOnly(result);
});

test('service-only bootstrap does not call transition writer or audit writer', () => {
  const fake = writers();

  createEngineerMobileVisitActionRuntimeBootstrap({
    transitionWriter: fake.transitionWriter,
    auditWriter: fake.auditWriter,
  });

  assert.deepEqual(fake.calls, []);
});

test('service-only bootstrap with missing writer sources reports missing and preserves safe service behavior', () => {
  const result = createEngineerMobileVisitActionRuntimeBootstrap({});
  const response = result.visitActionService.handleEngineerMobileVisitAction(command());

  assertServiceOnly(result, {
    transitionWriter: 'missing',
    auditWriter: 'missing',
  });
  assert.equal(response.ok, false);
  assert.equal(response.allowed, true);
  assert.equal(response.reasonCode, 'transition_writer_required');
  assertNoSensitiveLeak(response);
});

test('bootstrapped service can handle a synthetic denied request without writers being called', () => {
  const fake = writers();
  const result = createEngineerMobileVisitActionRuntimeBootstrap({
    transitionWriter: fake.transitionWriter,
    auditWriter: fake.auditWriter,
  });
  const response = result.visitActionService.handleEngineerMobileVisitAction(command({
    actorOverrides: {
      permissions: [],
    },
  }));

  assert.equal(response.ok, false);
  assert.equal(response.allowed, false);
  assert.equal(response.reasonCode, 'permission_required');
  assert.deepEqual(fake.calls, []);
  assertNoSensitiveLeak(response);
});

test('bootstrapped service can handle a synthetic accepted start_travel request using injected synthetic writers', () => {
  const fake = writers();
  const result = createEngineerMobileVisitActionRuntimeBootstrap({
    transitionWriter: fake.transitionWriter,
    auditWriter: fake.auditWriter,
  });
  const response = result.visitActionService.handleEngineerMobileVisitAction(command());

  assert.equal(response.ok, true);
  assert.equal(response.allowed, true);
  assert.equal(response.reasonCode, 'applied');
  assert.equal(response.transitionApplied, true);
  assert.equal(response.auditRecorded, true);
  assert.deepEqual(fake.calls.map((call) => call.name), ['transition', 'audit']);
  assertNoSensitiveLeak(response);
  assertNoSensitiveLeak(fake.calls);
});

test('patchWriter creates transition writer adapter when transitionWriter is absent', () => {
  const fake = adapterWriterSources();
  const result = createEngineerMobileVisitActionRuntimeBootstrap({
    patchWriter: fake.patchWriter,
    now: NOW,
  });
  const response = result.visitActionService.handleEngineerMobileVisitAction(command());

  assertServiceOnly(result, {
    transitionWriter: 'patch_writer_adapter',
    auditWriter: 'missing',
  });
  assert.equal(response.ok, true);
  assert.equal(response.allowed, true);
  assert.equal(response.reasonCode, 'applied');
  assert.equal(response.transitionApplied, true);
  assert.equal(response.auditRecorded, false);
  assert.deepEqual(fake.calls.map((call) => call.name), ['patch']);
  assert.equal(fake.calls[0].payload.patch.mobileVisitStatus, 'traveling');
  assertNoSensitiveLeak(response);
  assertNoSensitiveLeak(fake.calls);
});

test('direct transitionWriter takes precedence over patchWriter', () => {
  const direct = writers();
  const adapter = adapterWriterSources();
  const result = createEngineerMobileVisitActionRuntimeBootstrap({
    transitionWriter: direct.transitionWriter,
    patchWriter: adapter.patchWriter,
    now: NOW,
  });
  const response = result.visitActionService.handleEngineerMobileVisitAction(command());

  assertServiceOnly(result, {
    transitionWriter: 'direct',
    auditWriter: 'missing',
  });
  assert.equal(response.ok, true);
  assert.equal(response.auditRecorded, false);
  assert.deepEqual(direct.calls.map((call) => call.name), ['transition']);
  assert.deepEqual(adapter.calls, []);
  assertNoSensitiveLeak(response);
});

test('auditEventWriter creates audit writer adapter when auditWriter is absent', () => {
  const direct = writers();
  const adapter = adapterWriterSources();
  const result = createEngineerMobileVisitActionRuntimeBootstrap({
    transitionWriter: direct.transitionWriter,
    auditEventWriter: adapter.auditEventWriter,
    now: NOW,
  });
  const response = result.visitActionService.handleEngineerMobileVisitAction(command());

  assertServiceOnly(result, {
    transitionWriter: 'direct',
    auditWriter: 'audit_event_writer_adapter',
  });
  assert.equal(response.ok, true);
  assert.equal(response.auditRecorded, true);
  assert.deepEqual(direct.calls.map((call) => call.name), ['transition']);
  assert.deepEqual(adapter.calls.map((call) => call.name), ['audit_event']);
  assert.equal(adapter.calls[0].payload.auditEvent.entityType, 'appointment');
  assertNoSensitiveLeak(response);
  assertNoSensitiveLeak(adapter.calls);
});

test('direct auditWriter takes precedence over auditEventWriter', () => {
  const direct = writers();
  const adapter = adapterWriterSources();
  const result = createEngineerMobileVisitActionRuntimeBootstrap({
    transitionWriter: direct.transitionWriter,
    auditWriter: direct.auditWriter,
    auditEventWriter: adapter.auditEventWriter,
    now: NOW,
  });
  const response = result.visitActionService.handleEngineerMobileVisitAction(command());

  assertServiceOnly(result, {
    transitionWriter: 'direct',
    auditWriter: 'direct',
  });
  assert.equal(response.ok, true);
  assert.equal(response.auditRecorded, true);
  assert.deepEqual(direct.calls.map((call) => call.name), ['transition', 'audit']);
  assert.deepEqual(adapter.calls, []);
  assertNoSensitiveLeak(response);
});

test('bootstrap does not call direct writers patch writer audit event writer or persistencePort during bootstrap', () => {
  const direct = writers();
  const adapter = adapterWriterSources();
  const fake = persistencePortSource();

  createEngineerMobileVisitActionRuntimeBootstrap({
    transitionWriter: direct.transitionWriter,
    auditWriter: direct.auditWriter,
    patchWriter: adapter.patchWriter,
    auditEventWriter: adapter.auditEventWriter,
    persistencePort: fake.persistencePort,
    now: NOW,
  });

  assert.deepEqual(direct.calls, []);
  assert.deepEqual(adapter.calls, []);
  assert.deepEqual(fake.calls, []);
});

test('bootstrapped service can handle accepted start_travel through adapter-created transition and audit writers', () => {
  const fake = adapterWriterSources();
  const result = createEngineerMobileVisitActionRuntimeBootstrap({
    patchWriter: fake.patchWriter,
    auditEventWriter: fake.auditEventWriter,
    now: NOW,
  });
  const response = result.visitActionService.handleEngineerMobileVisitAction(command());

  assertServiceOnly(result, {
    transitionWriter: 'patch_writer_adapter',
    auditWriter: 'audit_event_writer_adapter',
  });
  assert.equal(response.ok, true);
  assert.equal(response.allowed, true);
  assert.equal(response.transitionApplied, true);
  assert.equal(response.auditRecorded, true);
  assert.deepEqual(fake.calls.map((call) => call.name), ['patch', 'audit_event']);
  assertNoSensitiveLeak(response);
  assertNoSensitiveLeak(fake.calls);
});

test('persistencePort creates integrated persistence writer when direct transitionWriter is absent', () => {
  const fake = persistencePortSource();
  const result = createEngineerMobileVisitActionRuntimeBootstrap({
    persistencePort: fake.persistencePort,
    now: NOW,
  });
  const response = result.visitActionService.handleEngineerMobileVisitAction(command());

  assertServiceOnly(result, {
    transitionWriter: 'integrated_persistence_writer',
    auditWriter: 'integrated_persistence_writer',
  });
  assert.equal(response.ok, true);
  assert.equal(response.allowed, true);
  assert.equal(response.transitionApplied, true);
  assert.equal(response.auditRecorded, false);
  assert.equal(fake.calls.length, 1);
  assert.equal(fake.calls[0].transitionPatchEnvelope.entityId, 'apt_task_1814');
  assert.equal(fake.calls[0].transitionPatchEnvelope.patch.mobileVisitStatus, 'traveling');
  assert.equal(fake.calls[0].auditEventEnvelope.entityId, 'apt_task_1814');
  assert.equal(fake.calls[0].auditEventEnvelope.action, 'engineer_mobile.start_travel.allowed');
  assertNoSensitiveLeak(response);
  assertNoSensitiveLeak(fake.calls);
});

test('direct transitionWriter takes precedence over persistencePort', () => {
  const direct = writers();
  const fake = persistencePortSource();
  const result = createEngineerMobileVisitActionRuntimeBootstrap({
    transitionWriter: direct.transitionWriter,
    persistencePort: fake.persistencePort,
    now: NOW,
  });
  const response = result.visitActionService.handleEngineerMobileVisitAction(command());

  assertServiceOnly(result, {
    transitionWriter: 'direct',
    auditWriter: 'missing',
  });
  assert.equal(response.ok, true);
  assert.equal(response.auditRecorded, false);
  assert.deepEqual(direct.calls.map((call) => call.name), ['transition']);
  assert.deepEqual(fake.calls, []);
  assertNoSensitiveLeak(response);
});

test('persistencePort takes precedence over patchWriter', () => {
  const adapter = adapterWriterSources();
  const fake = persistencePortSource();
  const result = createEngineerMobileVisitActionRuntimeBootstrap({
    patchWriter: adapter.patchWriter,
    persistencePort: fake.persistencePort,
    now: NOW,
  });
  const response = result.visitActionService.handleEngineerMobileVisitAction(command());

  assertServiceOnly(result, {
    transitionWriter: 'integrated_persistence_writer',
    auditWriter: 'integrated_persistence_writer',
  });
  assert.equal(response.ok, true);
  assert.equal(fake.calls.length, 1);
  assert.equal(fake.calls[0].transitionPatchEnvelope.patch.mobileVisitStatus, 'traveling');
  assert.deepEqual(adapter.calls, []);
  assertNoSensitiveLeak(response);
  assertNoSensitiveLeak(fake.calls);
});

test('direct auditWriter takes precedence over persistencePort audit event handling', () => {
  const direct = writers();
  const fake = persistencePortSource();
  const result = createEngineerMobileVisitActionRuntimeBootstrap({
    auditWriter: direct.auditWriter,
    persistencePort: fake.persistencePort,
    now: NOW,
  });
  const response = result.visitActionService.handleEngineerMobileVisitAction(command());

  assertServiceOnly(result, {
    transitionWriter: 'integrated_persistence_writer',
    auditWriter: 'direct',
  });
  assert.equal(response.ok, true);
  assert.equal(response.auditRecorded, true);
  assert.equal(fake.calls.length, 1);
  assert.equal(fake.calls[0].auditEventEnvelope, undefined);
  assert.deepEqual(direct.calls.map((call) => call.name), ['audit']);
  assertNoSensitiveLeak(response);
  assertNoSensitiveLeak(fake.calls);
});

test('when persistencePort is used no separate audit writer is created from auditEventWriter', () => {
  const adapter = adapterWriterSources();
  const fake = persistencePortSource();
  const result = createEngineerMobileVisitActionRuntimeBootstrap({
    auditEventWriter: adapter.auditEventWriter,
    persistencePort: fake.persistencePort,
    now: NOW,
  });
  const response = result.visitActionService.handleEngineerMobileVisitAction(command());

  assertServiceOnly(result, {
    transitionWriter: 'integrated_persistence_writer',
    auditWriter: 'integrated_persistence_writer',
  });
  assert.equal(response.ok, true);
  assert.equal(fake.calls.length, 1);
  assert.equal(fake.calls[0].auditEventEnvelope.action, 'engineer_mobile.start_travel.allowed');
  assert.deepEqual(adapter.calls, []);
  assertNoSensitiveLeak(response);
  assertNoSensitiveLeak(fake.calls);
});

test('service-only bootstrap with persistencePort can handle accepted record_visit_result', () => {
  const fake = persistencePortSource();
  const result = createEngineerMobileVisitActionRuntimeBootstrap({
    persistencePort: fake.persistencePort,
    now: NOW,
  });
  const response = result.visitActionService.handleEngineerMobileVisitAction(recordVisitResultCommand());

  assertServiceOnly(result, {
    transitionWriter: 'integrated_persistence_writer',
    auditWriter: 'integrated_persistence_writer',
  });
  assert.equal(response.ok, true);
  assert.equal(response.action, ENGINEER_MOBILE_RECORD_VISIT_RESULT_ACTION);
  assert.equal(fake.calls.length, 1);
  assert.equal(fake.calls[0].transitionPatchEnvelope.patch.mobileVisitStatus, 'visit_result_recorded');
  assert.equal(fake.calls[0].transitionPatchEnvelope.patch.visitResult, 'resolved');
  assert.equal(fake.calls[0].auditEventEnvelope.action, 'engineer_mobile.record_visit_result.allowed');
  assertNoSensitiveLeak(response);
  assertNoSensitiveLeak(fake.calls);
});

test('with mountTarget.post bootstrap mounts exactly one POST handler', () => {
  const fake = writers();
  const mountTarget = postMountTarget();
  const result = createEngineerMobileVisitActionRuntimeBootstrap({
    transitionWriter: fake.transitionWriter,
    auditWriter: fake.auditWriter,
    mountTarget,
  });

  assertMounted(result, mountTarget);
  assert.deepEqual(fake.calls, []);
});

test('with mountTarget.route(path).post(handler) bootstrap mounts exactly one POST handler', () => {
  const fake = writers();
  const mountTarget = routePostMountTarget();
  const result = createEngineerMobileVisitActionRuntimeBootstrap({
    transitionWriter: fake.transitionWriter,
    auditWriter: fake.auditWriter,
    mountTarget,
  });

  assertMounted(result, mountTarget, DEFAULT_PATH, 'route.post');
  assert.deepEqual(fake.calls, []);
});

test('with mountTarget.register({ method, path, handler }) bootstrap mounts exactly one POST handler', () => {
  const fake = writers();
  const mountTarget = registerMountTarget();
  const result = createEngineerMobileVisitActionRuntimeBootstrap({
    transitionWriter: fake.transitionWriter,
    auditWriter: fake.auditWriter,
    mountTarget,
  });

  assertMounted(result, mountTarget, DEFAULT_PATH, 'register');
  assert.deepEqual(fake.calls, []);
});

test('mounted handler can process a synthetic accepted request through the bootstrapped service', async () => {
  const fake = writers();
  const mountTarget = postMountTarget();
  const result = createEngineerMobileVisitActionRuntimeBootstrap({
    transitionWriter: fake.transitionWriter,
    auditWriter: fake.auditWriter,
    mountTarget,
  });
  const response = await mountTarget.registrations[0].handler(request());

  assert.equal(result.ok, true);
  assert.equal(response.statusCode, 202);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.accepted, true);
  assert.equal(response.body.action, ENGINEER_MOBILE_START_TRAVEL_ACTION);
  assert.equal(response.body.appointmentId, 'apt_task_1814');
  assert.equal(response.body.caseId, 'case_task_1814');
  assert.deepEqual(fake.calls.map((call) => call.name), ['transition', 'audit']);
  assertNoSensitiveLeak(response);
});

test('mounted handler processes synthetic accepted request through adapter-created writers', async () => {
  const fake = adapterWriterSources();
  const mountTarget = postMountTarget();
  const result = createEngineerMobileVisitActionRuntimeBootstrap({
    patchWriter: fake.patchWriter,
    auditEventWriter: fake.auditEventWriter,
    mountTarget,
    now: NOW,
  });
  const response = await mountTarget.registrations[0].handler(request());

  assertMounted(result, mountTarget, DEFAULT_PATH, 'post', {
    transitionWriter: 'patch_writer_adapter',
    auditWriter: 'audit_event_writer_adapter',
  });
  assert.equal(response.statusCode, 202);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.accepted, true);
  assert.deepEqual(fake.calls.map((call) => call.name), ['patch', 'audit_event']);
  assertNoSensitiveLeak(response);
  assertNoSensitiveLeak(fake.calls);
});

test('mounted handler with persistencePort can process synthetic accepted request', async () => {
  const fake = persistencePortSource();
  const mountTarget = postMountTarget();
  const result = createEngineerMobileVisitActionRuntimeBootstrap({
    persistencePort: fake.persistencePort,
    mountTarget,
    now: NOW,
  });
  const response = await mountTarget.registrations[0].handler(request());

  assertMounted(result, mountTarget, DEFAULT_PATH, 'post', {
    transitionWriter: 'integrated_persistence_writer',
    auditWriter: 'integrated_persistence_writer',
  });
  assert.equal(response.statusCode, 202);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.accepted, true);
  assert.equal(fake.calls.length, 1);
  assert.equal(fake.calls[0].transitionPatchEnvelope.patch.mobileVisitStatus, 'traveling');
  assert.equal(fake.calls[0].auditEventEnvelope.action, 'engineer_mobile.start_travel.allowed');
  assertNoSensitiveLeak(response);
  assertNoSensitiveLeak(fake.calls);
});

test('unsupported mount target returns sanitized failure with unsupported_mount_target', () => {
  const fake = writers();
  const result = createEngineerMobileVisitActionRuntimeBootstrap({
    transitionWriter: fake.transitionWriter,
    auditWriter: fake.auditWriter,
    mountTarget: {},
  });

  assert.equal(result.kind, ENGINEER_MOBILE_VISIT_ACTION_RUNTIME_BOOTSTRAP_KIND);
  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'unsupported_mount_target');
  assert.equal(result.mounted, 0);
  assert.deepEqual(result.routes, []);
  assert.equal(result.mountSummary.reasonCode, 'unsupported_mount_target');
  assert.equal(typeof result.visitActionService.handleEngineerMobileVisitAction, 'function');
  assert.deepEqual(fake.calls, []);
  assertNoSensitiveLeak(result);
});

test('invalid custom basePath does not create unsafe path behavior', () => {
  for (const basePath of ['unsafe', '', '   ', 42, {}]) {
    const fake = writers();
    const mountTarget = postMountTarget();
    const result = createEngineerMobileVisitActionRuntimeBootstrap({
      transitionWriter: fake.transitionWriter,
      auditWriter: fake.auditWriter,
      mountTarget,
      basePath,
    });

    assertMounted(result, mountTarget);
    assert.deepEqual(fake.calls, []);
  }
});

test('valid custom basePath is forwarded to injected mount adapter', () => {
  const fake = writers();
  const mountTarget = postMountTarget();
  const result = createEngineerMobileVisitActionRuntimeBootstrap({
    transitionWriter: fake.transitionWriter,
    auditWriter: fake.auditWriter,
    mountTarget,
    basePath: '/internal/engineer-mobile/',
  });

  assertMounted(
    result,
    mountTarget,
    '/internal/engineer-mobile/appointments/:appointmentId/actions/:action',
  );
});

test('does not call listen even if mountTarget has a listen function', () => {
  let listenCalls = 0;
  const fake = writers();
  const mountTarget = postMountTarget({
    listen() {
      listenCalls += 1;
    },
  });

  createEngineerMobileVisitActionRuntimeBootstrap({
    transitionWriter: fake.transitionWriter,
    auditWriter: fake.auditWriter,
    mountTarget,
  });

  assert.equal(listenCalls, 0);
  assert.deepEqual(fake.calls, []);
});

test('does not mutate transitionWriter auditWriter mountTarget actor appointment or request', async () => {
  const fake = writers();
  const mountTarget = postMountTarget();
  const sourceCommand = command();
  const sourceRequest = request();
  const beforeCommand = clone(sourceCommand);
  const beforeRequest = clone(sourceRequest);
  const transitionBeforeKeys = Object.keys(fake.transitionWriter);
  const auditBeforeKeys = Object.keys(fake.auditWriter);

  const result = createEngineerMobileVisitActionRuntimeBootstrap({
    transitionWriter: fake.transitionWriter,
    auditWriter: fake.auditWriter,
    mountTarget,
  });

  result.visitActionService.handleEngineerMobileVisitAction(sourceCommand);
  await mountTarget.registrations[0].handler(sourceRequest);

  assert.deepEqual(sourceCommand, beforeCommand);
  assert.deepEqual(sourceRequest, beforeRequest);
  assert.deepEqual(Object.keys(fake.transitionWriter), transitionBeforeKeys);
  assert.deepEqual(Object.keys(fake.auditWriter), auditBeforeKeys);
  assert.equal(mountTarget.registrations.length, 1);
});

test('output and mounted handler response are sanitized with no raw customer or report draft fields', async () => {
  const fake = writers();
  const mountTarget = postMountTarget();
  const result = createEngineerMobileVisitActionRuntimeBootstrap({
    transitionWriter: fake.transitionWriter,
    auditWriter: fake.auditWriter,
    mountTarget,
  });
  const response = await mountTarget.registrations[0].handler(request());

  assertNoSensitiveLeak(result);
  assertNoSensitiveLeak(response);
});

test('no Completion Report Field Service Report or finalAppointmentId behavior appears in returned results', async () => {
  const fake = writers();
  const mountTarget = postMountTarget();
  const result = createEngineerMobileVisitActionRuntimeBootstrap({
    transitionWriter: fake.transitionWriter,
    auditWriter: fake.auditWriter,
    mountTarget,
  });
  const response = await mountTarget.registrations[0].handler(request());

  assertNoSensitiveLeak(result);
  assertNoSensitiveLeak(response);
});
