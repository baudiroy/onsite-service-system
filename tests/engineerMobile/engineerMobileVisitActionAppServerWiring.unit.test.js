'use strict';

const assert = require('node:assert/strict');
const { Readable, Writable } = require('node:stream');
const test = require('node:test');

const { createApp } = require('../../src/app');
const { createServerBootstrap } = require('../../src/server');

const ROUTE_PATH = '/engineer-mobile/appointments/apt_visit_action_wiring_001/actions/engineer_mobile.start_travel';

function auth(overrides = {}) {
  return {
    organizationId: 'org_visit_action_wiring_001',
    engineerId: 'eng_visit_action_wiring_001',
    userId: 'user_visit_action_wiring_001',
    role: 'engineer',
    permissions: [
      'engineer_mobile.tasks.read',
      'engineer_mobile.visit.start_travel',
    ],
    ...overrides,
  };
}

function task(overrides = {}) {
  return {
    caseId: 'case_visit_action_wiring_001',
    appointmentId: 'apt_visit_action_wiring_001',
    organizationId: 'org_visit_action_wiring_001',
    assignedEngineerId: 'eng_visit_action_wiring_001',
    scheduledStart: '2026-05-21T09:00:00+08:00',
    scheduledEnd: '2026-05-21T10:00:00+08:00',
    status: 'scheduled',
    customerNameMasked: '林○○',
    customerPhoneMasked: '09xx-xxx-456',
    addressSummary: '新北市板橋區',
    productSummary: '冷氣',
    issueSummary: '不冷',
    serviceType: 'repair',
    rawPhone: 'raw_phone_should_not_leak',
    rawAddress: 'raw_address_should_not_leak',
    rawLineUserId: 'raw_line_should_not_leak',
    privateNote: 'private_note_should_not_leak',
    finalAppointmentId: 'final_appointment_should_not_leak',
    token: 'token_should_not_leak',
    secret: 'secret_should_not_leak',
    ...overrides,
  };
}

function acceptedService(calls = []) {
  return {
    async handleEngineerMobileVisitAction(payload) {
      calls.push(payload);

      return {
        ok: true,
        allowed: true,
        action: payload.action,
        reasonCode: 'applied',
        appointmentId: payload.appointmentId,
        caseId: payload.appointment && payload.appointment.caseId,
        organizationId: payload.appointment && payload.appointment.organizationId,
        transitionApplied: true,
        auditRecorded: true,
        transitionIntent: {
          mobileVisitStatus: 'traveling',
        },
        rawPhone: 'raw_phone_should_not_leak',
        finalAppointmentId: 'final_appointment_should_not_leak',
      };
    },
  };
}

function createRequest(pathname, options = {}) {
  const bodyText = JSON.stringify(options.body || {});
  let sent = false;
  const req = new Readable({
    read() {
      if (sent) {
        this.push(null);
        return;
      }

      sent = true;
      this.push(bodyText);
      this.push(null);
    },
  });

  req.method = 'POST';
  req.url = pathname;
  req.originalUrl = pathname;
  req.headers = {
    'content-length': String(Buffer.byteLength(bodyText)),
    'content-type': 'application/json',
  };
  req.connection = {};
  req.auth = auth(options.auth);

  return req;
}

function createResponse() {
  const chunks = [];
  const headers = {};
  const res = new Writable({
    write(chunk, encoding, callback) {
      chunks.push(Buffer.from(chunk));
      callback();
    },
  });

  res.statusCode = 200;
  res.setHeader = (name, value) => {
    headers[name.toLowerCase()] = value;
  };
  res.getHeader = (name) => headers[name.toLowerCase()];
  res.removeHeader = (name) => {
    delete headers[name.toLowerCase()];
  };
  res.writeHead = (statusCode, headerValues) => {
    res.statusCode = statusCode;
    if (headerValues && typeof headerValues === 'object') {
      for (const [name, value] of Object.entries(headerValues)) {
        res.setHeader(name, value);
      }
    }
    return res;
  };
  res.end = (chunk, encoding, callback) => {
    if (chunk) {
      chunks.push(Buffer.from(chunk, encoding));
    }
    Writable.prototype.end.call(res, callback);
    return res;
  };
  res.bodyText = () => Buffer.concat(chunks).toString('utf8');
  res.bodyJson = () => JSON.parse(res.bodyText());

  return res;
}

function requestApp(app, pathname = ROUTE_PATH, options = {}) {
  return new Promise((resolve, reject) => {
    const req = createRequest(pathname, {
      body: {
        actor: {
          id: 'body_actor_should_be_ignored',
          organizationId: 'body_org_should_be_ignored',
        },
        appointment: {
          appointmentId: 'body_appointment_should_be_ignored',
        },
        rawPhone: 'body_raw_phone_should_not_leak',
      },
      ...options,
    });
    const res = createResponse();

    res.on('finish', () => {
      try {
        resolve({
          body: res.bodyJson(),
          bodyText: res.bodyText(),
          statusCode: res.statusCode,
        });
      } catch (error) {
        reject(error);
      }
    });
    res.on('error', reject);
    app.handle(req, res);
  });
}

function assertNoForbiddenOutput(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'body_actor_should_be_ignored',
    'body_org_should_be_ignored',
    'body_appointment_should_be_ignored',
    'body_raw_phone_should_not_leak',
    'raw_phone_should_not_leak',
    'raw_address_should_not_leak',
    'raw_line_should_not_leak',
    'private_note_should_not_leak',
    'final_appointment_should_not_leak',
    'token_should_not_leak',
    'secret_should_not_leak',
    'rawPhone',
    'rawAddress',
    'rawLineUserId',
    'privateNote',
    'finalAppointmentId',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('createApp wires visit action service through existing request-aware Engineer Mobile detail provider', async () => {
  const serviceCalls = [];
  const app = createApp({
    engineerMobile: {
      repository: {
        getTaskDetail() {
          return [task()];
        },
      },
      useRequestAwareProvider: true,
      visitActionService: acceptedService(serviceCalls),
    },
  });
  const response = await requestApp(app);

  assert.equal(response.statusCode, 202);
  assert.equal(response.body.accepted, true);
  assert.equal(serviceCalls.length, 1);
  assert.equal(serviceCalls[0].actor.id, 'eng_visit_action_wiring_001');
  assert.equal(serviceCalls[0].actor.organizationId, 'org_visit_action_wiring_001');
  assert.equal(serviceCalls[0].appointment.appointmentId, 'apt_visit_action_wiring_001');
  assertNoForbiddenOutput([response.body, serviceCalls]);
});

test('createServerBootstrap forwards visit action shortcut service with read repository appointment provider', async () => {
  const serviceCalls = [];
  const repositoryCalls = [];
  const bootstrap = createServerBootstrap({
    engineerMobileReadRepository: {
      getTaskDetail(input) {
        repositoryCalls.push(input);
        return [task()];
      },
    },
    engineerMobileVisitActionService: acceptedService(serviceCalls),
  });
  const response = await requestApp(bootstrap.app);

  assert.equal(response.statusCode, 202);
  assert.equal(response.body.accepted, true);
  assert.deepEqual(repositoryCalls, [{
    appointmentId: 'apt_visit_action_wiring_001',
    engineerId: 'eng_visit_action_wiring_001',
    organizationId: 'org_visit_action_wiring_001',
  }]);
  assert.equal(serviceCalls.length, 1);
  assert.equal(serviceCalls[0].appointment.appointmentId, 'apt_visit_action_wiring_001');
  assertNoForbiddenOutput([response.body, repositoryCalls, serviceCalls]);
});
