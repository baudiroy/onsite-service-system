'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  ENGINEER_MOBILE_VISIT_ACTION_INJECTED_MOUNT_ADAPTER_KIND,
  createEngineerMobileVisitActionInjectedMountAdapter,
} = require('../../src/engineerMobile/engineerMobileVisitActionInjectedMountAdapter');

const DEFAULT_PATH = '/engineer-mobile/appointments/:appointmentId/actions/:action';

function acceptedService() {
  const calls = [];

  return {
    calls,
    service: {
      async handleEngineerMobileVisitAction(payload) {
        calls.push(payload);

        return {
          ok: true,
          allowed: true,
          action: payload.action,
          reasonCode: 'applied',
          appointmentId: payload.appointment && payload.appointment.appointmentId,
          caseId: payload.appointment && payload.appointment.caseId,
          organizationId: payload.appointment && payload.appointment.organizationId,
          transitionApplied: true,
          auditRecorded: true,
          transitionIntent: {
            mobileVisitStatus: 'traveling',
          },
          phone: 'raw_phone_should_not_leak',
          address: 'raw_address_should_not_leak',
          lineUserId: 'raw_line_should_not_leak',
          customerName: 'raw_customer_should_not_leak',
          privateNote: 'raw_private_note_should_not_leak',
          reportDraftBody: 'raw_report_draft_should_not_leak',
        };
      },
    },
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

function request() {
  return {
    requestId: 'req_task_1812',
    params: {
      appointmentId: 'apt_task_1812',
    },
    body: {
      action: 'engineer_mobile.start_travel',
      actor: {
        id: 'eng_task_1812',
        organizationId: 'org_task_1812',
        permissions: ['engineer_mobile.visit.start_travel'],
        token: 'token_should_not_leak',
      },
      appointment: {
        appointmentId: 'apt_task_1812',
        caseId: 'case_task_1812',
        organizationId: 'org_task_1812',
        assignedEngineerId: 'eng_task_1812',
        status: 'scheduled',
        phone: 'raw_phone_should_not_leak',
        address: 'raw_address_should_not_leak',
        lineUserId: 'raw_line_should_not_leak',
        customerName: 'raw_customer_should_not_leak',
        privateNote: 'raw_private_note_should_not_leak',
        reportDraftBody: 'raw_report_draft_should_not_leak',
      },
      now: '2026-05-28T15:00:00.000Z',
    },
  };
}

function assertNoForbiddenLeak(value) {
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
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

function assertMounted(result, mountTarget, expectedPath = DEFAULT_PATH, expectedStyle = 'post') {
  assert.equal(result.kind, ENGINEER_MOBILE_VISIT_ACTION_INJECTED_MOUNT_ADAPTER_KIND);
  assert.equal(result.ok, true);
  assert.equal(result.reasonCode, 'mounted');
  assert.equal(result.mounted, 1);
  assert.equal(result.mountStyle, expectedStyle);
  assert.deepEqual(result.routes, [{ method: 'POST', path: expectedPath }]);
  assert.equal(mountTarget.registrations.length, 1);
  assert.equal(mountTarget.registrations[0].method, 'POST');
  assert.equal(mountTarget.registrations[0].mountStyle, expectedStyle);
  assert.equal(mountTarget.registrations[0].path, expectedPath);
  assert.equal(typeof mountTarget.registrations[0].handler, 'function');
  assertNoForbiddenLeak(result);
}

test('mounts via mountTarget.post(path, handler)', () => {
  const mountTarget = postMountTarget();
  const fake = acceptedService();
  const result = createEngineerMobileVisitActionInjectedMountAdapter({
    mountTarget,
    visitActionService: fake.service,
  });

  assertMounted(result, mountTarget);
});

test('mounts via mountTarget.route(path).post(handler)', () => {
  const mountTarget = routePostMountTarget();
  const fake = acceptedService();
  const result = createEngineerMobileVisitActionInjectedMountAdapter({
    mountTarget,
    visitActionService: fake.service,
  });

  assertMounted(result, mountTarget, DEFAULT_PATH, 'route.post');
});

test('mounts via mountTarget.register({ method, path, handler })', () => {
  const mountTarget = registerMountTarget();
  const fake = acceptedService();
  const result = createEngineerMobileVisitActionInjectedMountAdapter({
    mountTarget,
    visitActionService: fake.service,
  });

  assertMounted(result, mountTarget, DEFAULT_PATH, 'register');
});

test('uses default path when no basePath is provided', () => {
  const mountTarget = postMountTarget();
  const fake = acceptedService();

  createEngineerMobileVisitActionInjectedMountAdapter({
    mountTarget,
    visitActionService: fake.service,
  });

  assert.equal(mountTarget.registrations[0].path, DEFAULT_PATH);
});

test('uses custom valid basePath', () => {
  const mountTarget = postMountTarget();
  const fake = acceptedService();
  const result = createEngineerMobileVisitActionInjectedMountAdapter({
    mountTarget,
    visitActionService: fake.service,
    basePath: '/internal/engineer-mobile/',
  });

  assertMounted(
    result,
    mountTarget,
    '/internal/engineer-mobile/appointments/:appointmentId/actions/:action',
  );
});

test('rejects missing mount target with mount_target_required', () => {
  for (const mountTarget of [undefined, null, 'target', [], 42]) {
    const result = createEngineerMobileVisitActionInjectedMountAdapter({
      mountTarget,
      visitActionService: acceptedService().service,
    });

    assert.equal(result.ok, false);
    assert.equal(result.reasonCode, 'mount_target_required');
    assert.equal(result.mounted, 0);
    assert.deepEqual(result.routes, []);
    assertNoForbiddenLeak(result);
  }
});

test('rejects unsupported mount target with unsupported_mount_target', () => {
  const result = createEngineerMobileVisitActionInjectedMountAdapter({
    mountTarget: {},
    visitActionService: acceptedService().service,
  });

  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'unsupported_mount_target');
  assert.equal(result.mounted, 0);
  assert.deepEqual(result.routes, []);
  assertNoForbiddenLeak(result);
});

test('rejects invalid custom basePath by falling back to default path', () => {
  for (const basePath of ['internal', '', '   ', 12, {}]) {
    const mountTarget = postMountTarget();
    const fake = acceptedService();
    const result = createEngineerMobileVisitActionInjectedMountAdapter({
      mountTarget,
      visitActionService: fake.service,
      basePath,
    });

    assertMounted(result, mountTarget);
  }
});

test('registered handler can process a synthetic accepted request through injected service', async () => {
  const mountTarget = postMountTarget();
  const fake = acceptedService();

  createEngineerMobileVisitActionInjectedMountAdapter({
    mountTarget,
    visitActionService: fake.service,
  });

  const response = await mountTarget.registrations[0].handler(request());

  assert.equal(response.statusCode, 202);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.action, 'engineer_mobile.start_travel');
  assert.equal(response.body.appointmentId, 'apt_task_1812');
  assert.equal(response.body.caseId, 'case_task_1812');
  assert.equal(fake.calls.length, 1);
  assert.equal(fake.calls[0].action, 'engineer_mobile.start_travel');
  assertNoForbiddenLeak(response);
  assertNoForbiddenLeak(fake.calls[0]);
});

test('registered handler does not expose phone address LINE customer private or report draft fields', async () => {
  const mountTarget = postMountTarget();
  const fake = acceptedService();

  createEngineerMobileVisitActionInjectedMountAdapter({
    mountTarget,
    visitActionService: fake.service,
  });

  const response = await mountTarget.registrations[0].handler(request());

  assertNoForbiddenLeak(response);
});

test('does not call listen even if mountTarget has a listen function', () => {
  let listenCalls = 0;
  const mountTarget = postMountTarget({
    listen() {
      listenCalls += 1;
    },
  });
  const fake = acceptedService();

  createEngineerMobileVisitActionInjectedMountAdapter({
    mountTarget,
    visitActionService: fake.service,
  });

  assert.equal(listenCalls, 0);
});

test('does not mutate visitActionService or request payload', async () => {
  const mountTarget = postMountTarget();
  const fake = acceptedService();
  const serviceKeys = Object.keys(fake.service);
  const serviceHandler = fake.service.handleEngineerMobileVisitAction;
  const req = request();
  const requestSnapshot = structuredClone(req);

  createEngineerMobileVisitActionInjectedMountAdapter({
    mountTarget,
    visitActionService: fake.service,
  });

  await mountTarget.registrations[0].handler(req);

  assert.deepEqual(Object.keys(fake.service), serviceKeys);
  assert.equal(fake.service.handleEngineerMobileVisitAction, serviceHandler);
  assert.deepEqual(req, requestSnapshot);
});
