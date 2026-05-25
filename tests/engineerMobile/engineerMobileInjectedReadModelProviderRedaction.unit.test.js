'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  createApp,
} = require('../../src/app');

const repoRoot = path.resolve(__dirname, '../..');
const testFile = path.join(repoRoot, 'tests/engineerMobile/engineerMobileInjectedReadModelProviderRedaction.unit.test.js');

function auth(overrides = {}) {
  return {
    organizationId: 'org_engineer_mobile_redaction',
    engineerId: 'eng_engineer_mobile_redaction',
    userId: 'user_engineer_mobile_redaction',
    role: 'engineer',
    permissions: ['engineer_mobile.tasks.read'],
    ...overrides,
  };
}

function request(overrides = {}) {
  return {
    auth: auth(),
    query: {},
    ...overrides,
  };
}

function createResponse() {
  return {
    statusCalls: [],
    jsonCalls: [],
    status(statusCode) {
      this.statusCalls.push(statusCode);
      return this;
    },
    json(body) {
      this.jsonCalls.push(body);
      return this;
    },
  };
}

function appRouter(appInstance) {
  const routerLayer = appInstance._router.stack.find((layer) => (
    layer.handle
    && Array.isArray(layer.handle.stack)
    && layer.name === 'router'
  ));

  assert.ok(routerLayer, 'app router layer missing');
  return routerLayer.handle;
}

function findRoute(appInstance, method, pathname) {
  return appRouter(appInstance).stack.find((layer) => (
    layer.route
    && layer.route.path === pathname
    && layer.route.methods[method.toLowerCase()]
  ));
}

function callMountedEngineerRoute(appInstance, req) {
  const route = findRoute(appInstance, 'get', '/engineer-mobile/tasks');
  const res = createResponse();
  let index = 0;

  assert.ok(route, 'engineer mobile task list route should be mounted');

  function next() {
    index += 1;
    const layer = route.route.stack[index];

    if (layer) {
      return layer.handle(req, res, next);
    }

    return undefined;
  }

  route.route.stack[0].handle(req, res, next);

  return res;
}

function requireSpecifiers(source) {
  const specifiers = [];
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
  let match;

  while ((match = requireRegex.exec(source)) !== null) {
    specifiers.push(match[1]);
  }

  return specifiers;
}

function unsafeTask(overrides = {}) {
  return {
    appointmentId: 'apt_engineer_mobile_redaction_001',
    assignedEngineerId: 'eng_engineer_mobile_redaction',
    caseId: 'case_engineer_mobile_redaction_001',
    organizationId: 'org_engineer_mobile_redaction',
    scheduledStart: '2026-05-21T01:00:00.000Z',
    scheduledEnd: '2026-05-21T02:00:00.000Z',
    status: 'confirmed',
    customerNameMasked: 'Fixture Customer',
    customerPhoneMasked: '09xx-xxx-001',
    addressSummary: 'Taipei district only, no street number',
    productSummary: 'Fixture appliance model family',
    issueSummary: 'Fixture issue summary',
    serviceType: 'onsite_service',
    rawPhone: '0912-345-678',
    rawAddress: '台北市測試區測試路一段88號',
    rawLineUserId: 'raw_line_user_id_should_not_leak',
    internalNote: 'internal_note_should_not_leak',
    auditPayload: 'audit_payload_should_not_leak',
    auditLog: 'audit_log_should_not_leak',
    aiRawPayload: 'ai_raw_payload_should_not_leak',
    billingInternal: 'billing_internal_should_not_leak',
    settlementInternal: 'settlement_internal_should_not_leak',
    databaseUrl: 'postgres://user:pass@example.invalid/db',
    token: 'token_should_not_leak',
    secret: 'secret_should_not_leak',
    fieldServiceReportId: 'field_service_report_should_not_leak',
    serviceReportId: 'service_report_should_not_leak',
    completionReportId: 'completion_report_should_not_leak',
    finalAppointmentId: 'final_appointment_should_not_leak',
    fullPayload: 'full_payload_should_not_leak',
    providerMetadata: 'provider_metadata_should_not_leak',
    ...overrides,
  };
}

function unsafeProviderPayload() {
  return {
    tasks: [
      unsafeTask(),
      unsafeTask({
        appointmentId: 'apt_engineer_mobile_redaction_002',
        caseId: 'case_engineer_mobile_redaction_001',
        scheduledStart: '2026-05-22T01:00:00.000Z',
        status: 'completed',
      }),
      unsafeTask({
        appointmentId: 'apt_engineer_mobile_redaction_wrong_org',
        caseId: 'case_engineer_mobile_redaction_wrong_org',
        organizationId: 'org_other',
      }),
    ],
    providerMetadata: {
      rawLineUserId: 'raw_line_user_id_metadata_should_not_leak',
      internalNote: 'internal_note_metadata_should_not_leak',
      token: 'metadata_token_should_not_leak',
      secret: 'metadata_secret_should_not_leak',
      finalAppointmentId: 'metadata_final_appointment_should_not_leak',
      fullPayload: 'metadata_full_payload_should_not_leak',
    },
  };
}

function assertNoForbiddenOutput(value) {
  const serialized = JSON.stringify(value);
  const lower = serialized.toLowerCase();

  for (const forbidden of [
    'postgres://',
    'postgresql://',
    'mysql://',
    'mongodb://',
    'databaseurl',
    'database_url',
    'bearer ',
    'raw_line_user_id',
    'rawLineUserId',
    'line_user_id',
    'fullpayload',
    'full_payload',
    'field_service_report',
    'fieldServiceReportId',
    'serviceReportId',
    'completionReportId',
    'finalAppointmentId',
    'final_appointment_id',
    'internal_note',
    'internalNote',
    'audit_payload',
    'auditPayload',
    'audit_log',
    'auditLog',
    'ai_raw_payload',
    'aiRawPayload',
    'billing_internal',
    'billingInternal',
    'settlement_internal',
    'settlementInternal',
    'providerMetadata',
    'token',
    'secret',
    'password',
    'credential',
  ]) {
    assert.equal(lower.includes(forbidden.toLowerCase()), false, `leaked ${forbidden}`);
  }

  assert.equal(/09\d{2}[-\s]?\d{3}[-\s]?\d{3}/.test(serialized), false);
  assert.equal(/台北市.+\d+號/.test(serialized), false);
}

test('unit test imports only app factory and Node built-ins', () => {
  const specifiers = requireSpecifiers(fs.readFileSync(testFile, 'utf8'));
  const allowed = [
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:test',
    '../../src/app',
  ];

  assert.deepEqual(specifiers.sort(), allowed.sort());
  assert.equal(
    specifiers.some((specifier) => /db|pool|repositories?|transaction|provider|server|migration|psql|openai|rag|vector|smoke|browser/i.test(specifier)),
    false,
  );
});

test('injected provider rows are normalized and unsafe extra fields are redacted', () => {
  const providerCalls = [];
  const app = createApp({
    engineerMobile: {
      readModel(input) {
        providerCalls.push(input);
        return unsafeProviderPayload();
      },
    },
  });
  const res = callMountedEngineerRoute(app, request());

  assert.deepEqual(res.statusCalls, [200]);
  assert.equal(providerCalls.length, 1);
  assert.equal(res.jsonCalls[0].status, 'allow');
  assert.deepEqual(res.jsonCalls[0].tasks.map((entry) => entry.appointmentId), [
    'apt_engineer_mobile_redaction_001',
    'apt_engineer_mobile_redaction_002',
  ]);
  assert.deepEqual(Object.keys(res.jsonCalls[0].tasks[0]).sort(), [
    'addressSummary',
    'appointmentId',
    'caseId',
    'customerNameMasked',
    'customerPhoneMasked',
    'issueSummary',
    'productSummary',
    'scheduledEnd',
    'scheduledStart',
    'serviceType',
    'status',
  ].sort());
  assertNoForbiddenOutput(res.jsonCalls[0]);
});

test('provider metadata wrapper is ignored and not copied to response', () => {
  const app = createApp({
    engineerMobile: {
      readModel() {
        return unsafeProviderPayload();
      },
    },
  });
  const res = callMountedEngineerRoute(app, request());
  const serialized = JSON.stringify(res.jsonCalls[0]);

  assert.equal(serialized.includes('providerMetadata'), false);
  assert.equal(serialized.includes('metadata_token_should_not_leak'), false);
  assert.equal(serialized.includes('metadata_secret_should_not_leak'), false);
  assertNoForbiddenOutput(res.jsonCalls[0]);
});

test('provider thrown error with unsafe message returns safe deny envelope', () => {
  const app = createApp({
    engineerMobile: {
      readModel() {
        throw new Error('DATABASE_URL postgres://user:pass@example.invalid/db token secret raw_line_user_id 0912-345-678');
      },
    },
  });
  const res = callMountedEngineerRoute(app, request());

  assert.deepEqual(res.statusCalls, [403]);
  assert.deepEqual(res.jsonCalls[0], {
    status: 'deny',
    messageKey: 'engineerMobile.forbidden',
    tasks: [],
  });
  assertNoForbiddenOutput(res.jsonCalls[0]);
});

test('empty and malformed provider results stay safe and non-leaky', () => {
  const emptyApp = createApp({
    engineerMobile: {
      readModel() {
        return { tasks: [] };
      },
    },
  });
  const malformedApp = createApp({
    engineerMobile: {
      readModel() {
        return {
          providerMetadata: {
            token: 'metadata_token_should_not_leak',
          },
        };
      },
    },
  });
  const empty = callMountedEngineerRoute(emptyApp, request());
  const malformed = callMountedEngineerRoute(malformedApp, request());

  assert.deepEqual(empty.statusCalls, [200]);
  assert.deepEqual(empty.jsonCalls[0], {
    status: 'allow',
    tasks: [],
  });
  assert.deepEqual(malformed.statusCalls, [403]);
  assert.deepEqual(malformed.jsonCalls[0], {
    status: 'deny',
    messageKey: 'engineerMobile.forbidden',
    tasks: [],
  });
  assertNoForbiddenOutput({ empty: empty.jsonCalls[0], malformed: malformed.jsonCalls[0] });
});

test('multi-appointment same-case remains allowed without completion report ownership', () => {
  const app = createApp({
    engineerMobile: {
      readModel() {
        return unsafeProviderPayload();
      },
    },
  });
  const res = callMountedEngineerRoute(app, request());
  const sameCase = res.jsonCalls[0].tasks.filter((entry) => entry.caseId === 'case_engineer_mobile_redaction_001');
  const serialized = JSON.stringify(sameCase);

  assert.equal(sameCase.length, 2);
  assert.equal(serialized.includes('fieldServiceReportId'), false);
  assert.equal(serialized.includes('completionReportId'), false);
  assert.equal(serialized.includes('finalAppointmentId'), false);
  assertNoForbiddenOutput(sameCase);
});
