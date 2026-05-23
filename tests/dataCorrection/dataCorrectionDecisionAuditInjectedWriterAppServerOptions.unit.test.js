'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Readable, Writable } = require('node:stream');
const test = require('node:test');

const {
  DATA_CORRECTION_APP_SHORTCUT_OPTION_KEY_MAP,
  DATA_CORRECTION_APP_SHORTCUT_OPTION_KEYS,
  app: defaultApp,
  createApp,
} = require('../../src/app');
const {
  DATA_CORRECTION_SERVER_SHORTCUT_OPTION_KEY_MAP,
  DATA_CORRECTION_SERVER_SHORTCUT_OPTION_KEYS,
  createServerBootstrap,
} = require('../../src/server');
const {
  CORRECTION_FIELD_GROUPS,
  DATA_CORRECTION_DECISIONS,
} = require('../../src/dataCorrection/dataCorrectionPolicyEngine');
const {
  DATA_CORRECTION_AUDIT_ACTIONS,
  DATA_CORRECTION_AUDIT_RESULTS,
} = require('../../src/dataCorrection/dataCorrectionDecisionAuditIntentBuilder');
const {
  DATA_CORRECTION_GOVERNANCE_ACTIONS,
} = require('../../src/dataCorrection/dataCorrectionGovernanceOrchestrator');

const repoRoot = path.resolve(__dirname, '../..');

function createRequest(pathname, body, authOverrides) {
  const bodyText = JSON.stringify(body || {});
  const bodyBuffer = Buffer.from(bodyText);
  let sent = false;
  const req = new Readable({
    read() {
      if (sent) {
        this.push(null);
        return;
      }

      sent = true;
      this.push(bodyBuffer);
      this.push(null);
    },
  });

  req.method = 'POST';
  req.url = pathname;
  req.originalUrl = pathname;
  req.headers = {
    'content-type': 'application/json',
    'content-length': String(bodyBuffer.length),
  };
  req.connection = {};
  req.auth = auth(authOverrides);

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

function requestApp(app, requestBody, authOverrides = {}) {
  return new Promise((resolve, reject) => {
    const req = createRequest('/data-correction/governance', requestBody, authOverrides);
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

function auth(overrides = {}) {
  return {
    organizationId: 'org_data_correction_decision_app_server_001',
    userId: 'dispatcher_data_correction_decision_app_server_001',
    role: 'dispatch_assistant',
    permissions: [
      'case.correction.apply',
      'case.correction.request',
    ],
    ...overrides,
  };
}

function body(actionType, payload) {
  return {
    actionType,
    payload,
  };
}

function correctionPayload(overrides = {}) {
  return {
    caseContext: {
      caseId: 'case_data_correction_decision_app_server_001',
      organizationId: 'org_data_correction_decision_app_server_001',
    },
    appointmentContext: {
      appointmentId: 'apt_data_correction_decision_app_server_001',
      engineerReceivedTask: false,
      engineerDeparted: false,
      routeStarted: false,
      arrived: false,
    },
    correction: {
      fieldKey: 'issueSummary',
      fieldGroup: CORRECTION_FIELD_GROUPS.DISPATCH_OPERATIONAL,
      fromValue: 'old_value_should_not_leak',
      toValue: 'safe updated issue',
      rawPhone: 'raw_phone_should_not_leak',
      rawAddress: 'raw_address_should_not_leak',
      rawLineUserId: 'line_user_should_not_leak',
      token: 'token_should_not_leak',
      secret: 'secret_should_not_leak',
      DATABASE_URL: 'DATABASE_URL_should_not_leak',
      internalNote: 'internal_note_should_not_leak',
      auditRawPayload: 'audit_raw_should_not_leak',
      aiRawPayload: 'ai_raw_payload_should_not_leak',
      billingInternalData: 'billing_internal_should_not_leak',
      settlementInternalData: 'settlement_internal_should_not_leak',
      finalAppointmentId: 'final_appointment_should_not_leak',
      fieldServiceReportId: 'fsr_should_not_leak',
      reportId: 'report_should_not_leak',
    },
    ...overrides,
  };
}

function assertSafeOutput(value) {
  const serialized = JSON.stringify(value);

  [
    'old_value_should_not_leak',
    'raw_phone_should_not_leak',
    'raw_address_should_not_leak',
    'line_user_should_not_leak',
    'token_should_not_leak',
    'secret_should_not_leak',
    'DATABASE_URL_should_not_leak',
    'internal_note_should_not_leak',
    'audit_raw_should_not_leak',
    'ai_raw_payload_should_not_leak',
    'billing_internal_should_not_leak',
    'settlement_internal_should_not_leak',
    'final_appointment_should_not_leak',
    'fsr_should_not_leak',
    'report_should_not_leak',
    'writer_failure_should_not_leak',
    'postgres://unsafe',
    'SELECT * FROM unsafe',
  ].forEach((needle) => {
    assert.equal(serialized.includes(needle), false, `leaked ${needle}`);
  });

  [
    '"auditIntent"',
    '"decisionAuditWriterResult"',
    '"finalAppointmentId"',
    '"fieldServiceReportId"',
    '"reportId"',
    '"rawPhone"',
    '"rawAddress"',
    '"rawLineUserId"',
  ].forEach((needle) => {
    assert.equal(serialized.includes(needle), false, `public output leaked ${needle}`);
  });
}

function assertSafeAuditIntent(intent, expected = {}) {
  assert.equal(intent.action, expected.action);
  assert.equal(intent.organizationId, 'org_data_correction_decision_app_server_001');
  assert.equal(intent.caseId, 'case_data_correction_decision_app_server_001');
  assert.equal(intent.appointmentId, 'apt_data_correction_decision_app_server_001');
  assert.equal(intent.actorId, 'dispatcher_data_correction_decision_app_server_001');
  assert.equal(intent.actorRole, 'dispatch_assistant');
  assert.equal(intent.fieldKey, 'issueSummary');
  assert.equal(intent.fieldGroup, CORRECTION_FIELD_GROUPS.DISPATCH_OPERATIONAL);
  assert.equal(intent.auditWritten, false);
  assert.equal(intent.eventType, expected.eventType);
  assert.equal(intent.resultStatus, expected.resultStatus);
  assert.equal(Object.prototype.hasOwnProperty.call(intent, 'fromValue'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(intent, 'toValue'), false);
  assertSafeOutput(intent);
}

function requireSpecifiers(relativePath) {
  const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
  const specifiers = [];
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
  let match;

  while ((match = requireRegex.exec(source)) !== null) {
    specifiers.push(match[1]);
  }

  return specifiers.sort();
}

test('app and server expose decision audit writer as immutable shortcut option only', () => {
  assert.equal(
    DATA_CORRECTION_APP_SHORTCUT_OPTION_KEY_MAP.DECISION_AUDIT_WRITER,
    'dataCorrectionDecisionAuditWriter',
  );
  assert.equal(
    DATA_CORRECTION_SERVER_SHORTCUT_OPTION_KEY_MAP.DECISION_AUDIT_WRITER,
    'dataCorrectionDecisionAuditWriter',
  );
  assert.equal(DATA_CORRECTION_APP_SHORTCUT_OPTION_KEYS.includes('dataCorrectionDecisionAuditWriter'), true);
  assert.equal(DATA_CORRECTION_SERVER_SHORTCUT_OPTION_KEYS.includes('dataCorrectionDecisionAuditWriter'), true);

  assert.throws(() => {
    DATA_CORRECTION_APP_SHORTCUT_OPTION_KEY_MAP.DECISION_AUDIT_WRITER = 'unsafe';
  }, TypeError);
  assert.throws(() => {
    DATA_CORRECTION_SERVER_SHORTCUT_OPTION_KEYS.push('unsafeDecisionWriter');
  }, TypeError);
});

test('default app has no decision audit writer and keeps public response shape unchanged', async () => {
  const response = await requestApp(defaultApp, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.DATA_CORRECTION_REQUEST,
    correctionPayload(),
  ));

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'ok');
  assert.equal(response.body.result.decision, DATA_CORRECTION_DECISIONS.ALLOW_PRE_DEPARTURE_CORRECTION);
  assertSafeOutput(response.body);
});

test('createApp shortcut passes injected decision audit writer without public response expansion', async () => {
  const decisionAuditCalls = [];
  const correctionCalls = [];
  const app = createApp({
    dataCorrectionDecisionAuditWriter(intent) {
      decisionAuditCalls.push(intent);

      return { recorded: true };
    },
    dataCorrectionCorrectionWriter(payload) {
      correctionCalls.push(payload);
    },
  });

  const response = await requestApp(app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.PRE_DEPARTURE_APPLY,
    correctionPayload(),
  ));

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'ok');
  assert.equal(response.body.result.correctionApplied, true);
  assert.equal(correctionCalls.length, 1);
  assert.equal(decisionAuditCalls.length, 1);
  assertSafeAuditIntent(decisionAuditCalls[0], {
    action: DATA_CORRECTION_AUDIT_ACTIONS.APPLY,
    eventType: 'data_correction_apply_allowed',
    resultStatus: DATA_CORRECTION_AUDIT_RESULTS.ALLOWED,
  });
  assertSafeOutput([response.body, correctionCalls]);
});

test('createServerBootstrap shortcut passes injected decision audit writer without public response expansion', async () => {
  const decisionAuditCalls = [];
  const bootstrap = createServerBootstrap({
    dataCorrectionDecisionAuditWriter: {
      write(intent) {
        decisionAuditCalls.push(intent);

        return { ok: true };
      },
    },
  });

  const response = await requestApp(bootstrap.app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.DATA_CORRECTION_REQUEST,
    correctionPayload(),
  ));

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'ok');
  assert.equal(response.body.result.correctionApplicationReady, true);
  assert.equal(decisionAuditCalls.length, 1);
  assertSafeAuditIntent(decisionAuditCalls[0], {
    action: DATA_CORRECTION_AUDIT_ACTIONS.REQUEST,
    eventType: 'data_correction_request_accepted',
    resultStatus: DATA_CORRECTION_AUDIT_RESULTS.ALLOWED,
  });
  assertSafeOutput(response.body);
});

test('injected decision audit writer failure remains safe and does not change public outcome', async () => {
  const app = createApp({
    dataCorrectionDecisionAuditWriter() {
      throw new Error('writer_failure_should_not_leak token_should_not_leak postgres://unsafe SELECT * FROM unsafe');
    },
    dataCorrectionCorrectionWriter() {
      return { recorded: true };
    },
  });

  const response = await requestApp(app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.PRE_DEPARTURE_APPLY,
    correctionPayload(),
  ));

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'ok');
  assert.equal(response.body.result.correctionApplied, true);
  assertSafeOutput(response.body);
});

test('app/server option path does not import decision audit repository writer or DB runtime', () => {
  const appSpecifiers = requireSpecifiers('src/app.js');
  const serverSpecifiers = requireSpecifiers('src/server.js');
  const combined = [...appSpecifiers, ...serverSpecifiers].join('\n');

  assert.equal(combined.includes('dataCorrectionDecisionAuditRepository'), false);
  assert.equal(combined.includes('dataCorrectionDecisionAuditWriter'), false);
  assert.equal(combined.includes('./db/pool'), false);
  assert.equal(combined.includes('pg'), false);
});
