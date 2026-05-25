'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Readable, Writable } = require('node:stream');
const test = require('node:test');

const {
  createApp,
} = require('../../src/app');

const repoRoot = path.resolve(__dirname, '../..');
const testFile = path.join(repoRoot, 'tests/engineerMobile/engineerMobileInjectedDetailProviderRedaction.unit.test.js');

function auth(overrides = {}) {
  return {
    organizationId: 'org_engineer_mobile_detail_redaction',
    engineerId: 'eng_engineer_mobile_detail_redaction',
    userId: 'user_engineer_mobile_detail_redaction',
    role: 'engineer',
    permissions: ['engineer_mobile.tasks.read'],
    ...overrides,
  };
}

function createRequest(pathname, authOverrides = {}) {
  let sent = false;
  const req = new Readable({
    read() {
      if (sent) {
        this.push(null);
        return;
      }

      sent = true;
      this.push(null);
    },
  });

  req.method = 'GET';
  req.url = pathname;
  req.originalUrl = pathname;
  req.headers = {};
  req.connection = {};
  req.auth = auth(authOverrides);
  req.body = {
    organizationId: 'body_org_should_be_ignored',
    engineerId: 'body_engineer_should_be_ignored',
    appointmentId: 'body_appointment_should_be_ignored',
    token: 'body_token_should_not_leak',
    secret: 'body_secret_should_not_leak',
    rawPhone: '0912-345-678',
  };

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

function requestApp(app, pathname, authOverrides) {
  return new Promise((resolve, reject) => {
    const req = createRequest(pathname, authOverrides);
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

function requireSpecifiers(source) {
  const specifiers = [];
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
  let match;

  while ((match = requireRegex.exec(source)) !== null) {
    specifiers.push(match[1]);
  }

  return specifiers;
}

function unsafeDetailTask(overrides = {}) {
  return {
    appointmentId: 'apt_engineer_mobile_detail_redaction_001',
    assignedEngineerId: 'eng_engineer_mobile_detail_redaction',
    caseId: 'case_engineer_mobile_detail_redaction_001',
    organizationId: 'org_engineer_mobile_detail_redaction',
    scheduledStart: '2026-05-21T01:00:00.000Z',
    scheduledEnd: '2026-05-21T02:00:00.000Z',
    status: 'confirmed',
    customerNameMasked: 'Fixture Detail Customer',
    customerPhoneMasked: '09xx-xxx-101',
    addressSummary: 'Taipei district only, no street number',
    productSummary: 'Fixture detail appliance',
    issueSummary: 'Fixture detail issue summary',
    serviceType: 'onsite_service',
    siteNoteSafe: 'Safe on-site note for assigned engineer only.',
    checklistSummary: 'Safe checklist summary.',
    evidenceRefs: [
      {
        id: 'safe_detail_ref_001',
        label: 'Safe evidence label',
        type: 'photo',
        token: 'evidence_token_should_not_leak',
        secret: 'evidence_secret_should_not_leak',
        storagePath: 'storage_path_should_not_leak',
      },
    ],
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
    task: unsafeDetailTask(),
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
    'storage_path',
    'storagePath',
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
    'node:stream',
    'node:test',
    '../../src/app',
  ];

  assert.deepEqual(specifiers.sort(), allowed.sort());
  assert.equal(
    specifiers.some((specifier) => /db|pool|repositories?|transaction|provider|server|migration|psql|openai|rag|vector|smoke|browser/i.test(specifier)),
    false,
  );
});

test('injected detail provider task is normalized and unsafe extra fields are redacted', async () => {
  const providerCalls = [];
  const app = createApp({
    engineerMobile: {
      readModel(input) {
        providerCalls.push(input);
        return unsafeProviderPayload();
      },
    },
  });
  const response = await requestApp(app, '/engineer-mobile/tasks/apt_engineer_mobile_detail_redaction_001', {});

  assert.equal(response.statusCode, 200);
  assert.deepEqual(providerCalls, [{
    appointmentId: 'apt_engineer_mobile_detail_redaction_001',
    engineerId: 'eng_engineer_mobile_detail_redaction',
    organizationId: 'org_engineer_mobile_detail_redaction',
  }]);
  assert.equal(response.body.status, 'allow');
  assert.deepEqual(Object.keys(response.body.detail).sort(), [
    'addressSummary',
    'appointmentId',
    'assignedEngineerId',
    'caseId',
    'checklistSummary',
    'customerNameMasked',
    'customerPhoneMasked',
    'evidenceRefs',
    'issueSummary',
    'organizationId',
    'productSummary',
    'scheduledEnd',
    'scheduledStart',
    'serviceType',
    'siteNoteSafe',
    'status',
  ].sort());
  assert.deepEqual(response.body.detail.evidenceRefs, [
    {
      id: 'safe_detail_ref_001',
      label: 'Safe evidence label',
      type: 'photo',
    },
  ]);
  assertNoForbiddenOutput(response.body);
});

test('provider metadata wrapper is ignored and not copied to detail response', async () => {
  const app = createApp({
    engineerMobile: {
      readModel() {
        return unsafeProviderPayload();
      },
    },
  });
  const response = await requestApp(app, '/engineer-mobile/tasks/apt_engineer_mobile_detail_redaction_001', {});
  const serialized = JSON.stringify(response.body);

  assert.equal(response.statusCode, 200);
  assert.equal(serialized.includes('providerMetadata'), false);
  assert.equal(serialized.includes('metadata_token_should_not_leak'), false);
  assert.equal(serialized.includes('metadata_secret_should_not_leak'), false);
  assertNoForbiddenOutput(response.body);
});

test('wrong organization engineer or appointment returns safe unavailable envelope', async () => {
  const app = createApp({
    engineerMobile: {
      readModel() {
        return {
          tasks: [
            unsafeDetailTask({ caseId: 'case_wrong_org', organizationId: 'org_other' }),
            unsafeDetailTask({ caseId: 'case_wrong_engineer', assignedEngineerId: 'eng_other' }),
            unsafeDetailTask({ appointmentId: 'apt_other' }),
          ],
        };
      },
    },
  });
  const response = await requestApp(app, '/engineer-mobile/tasks/apt_engineer_mobile_detail_redaction_001', {});

  assert.equal(response.statusCode, 404);
  assert.deepEqual(response.body, {
    detail: null,
    messageKey: 'engineerMobile.taskDetailUnavailable',
    status: 'deny',
  });
  assertNoForbiddenOutput(response.body);
});

test('provider thrown error with unsafe message returns safe unavailable envelope', async () => {
  const app = createApp({
    engineerMobile: {
      readModel() {
        throw new Error('DATABASE_URL postgres://user:pass@example.invalid/db token secret raw_line_user_id 0912-345-678');
      },
    },
  });
  const response = await requestApp(app, '/engineer-mobile/tasks/apt_engineer_mobile_detail_redaction_001', {});

  assert.equal(response.statusCode, 404);
  assert.deepEqual(response.body, {
    detail: null,
    messageKey: 'engineerMobile.taskDetailUnavailable',
    status: 'deny',
  });
  assertNoForbiddenOutput(response.body);
});

test('empty and malformed provider results stay safe and non-leaky', async () => {
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
  const empty = await requestApp(emptyApp, '/engineer-mobile/tasks/apt_engineer_mobile_detail_redaction_001', {});
  const malformed = await requestApp(malformedApp, '/engineer-mobile/tasks/apt_engineer_mobile_detail_redaction_001', {});

  assert.equal(empty.statusCode, 404);
  assert.deepEqual(empty.body, {
    detail: null,
    messageKey: 'engineerMobile.taskDetailUnavailable',
    status: 'deny',
  });
  assert.equal(malformed.statusCode, 404);
  assert.deepEqual(malformed.body, {
    detail: null,
    messageKey: 'engineerMobile.taskDetailUnavailable',
    status: 'deny',
  });
  assertNoForbiddenOutput({ empty: empty.body, malformed: malformed.body });
});

test('multi-appointment same-case remains allowed without completion report ownership', async () => {
  const app = createApp({
    engineerMobile: {
      readModel() {
        return {
          tasks: [
            unsafeDetailTask({ appointmentId: 'apt_engineer_mobile_detail_redaction_previous', status: 'completed' }),
            unsafeDetailTask(),
          ],
        };
      },
    },
  });
  const response = await requestApp(app, '/engineer-mobile/tasks/apt_engineer_mobile_detail_redaction_001', {});
  const serialized = JSON.stringify(response.body);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.detail.caseId, 'case_engineer_mobile_detail_redaction_001');
  assert.equal(response.body.detail.appointmentId, 'apt_engineer_mobile_detail_redaction_001');
  assert.equal(serialized.includes('fieldServiceReportId'), false);
  assert.equal(serialized.includes('completionReportId'), false);
  assert.equal(serialized.includes('finalAppointmentId'), false);
  assertNoForbiddenOutput(response.body);
});
