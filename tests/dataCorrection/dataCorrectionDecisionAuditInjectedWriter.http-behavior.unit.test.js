'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Readable, Writable } = require('node:stream');
const test = require('node:test');

const {
  app: defaultApp,
  createApp,
} = require('../../src/app');
const {
  createServerBootstrap,
} = require('../../src/server');
const {
  DATA_CORRECTION_AUDIT_ACTIONS,
  DATA_CORRECTION_AUDIT_RESULTS,
} = require('../../src/dataCorrection/dataCorrectionDecisionAuditIntentBuilder');
const {
  DATA_CORRECTION_GOVERNANCE_ACTIONS,
} = require('../../src/dataCorrection/dataCorrectionGovernanceOrchestrator');
const {
  CORRECTION_FIELD_GROUPS,
  DATA_CORRECTION_DECISIONS,
} = require('../../src/dataCorrection/dataCorrectionPolicyEngine');

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
  req.auth = {
    organizationId: 'org_decision_audit_http_001',
    userId: 'dispatcher_decision_audit_http_001',
    role: 'dispatch_assistant',
    permissions: [
      'case.correction.apply',
      'case.correction.request',
    ],
    ...authOverrides,
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

function body(actionType, payload) {
  return {
    actionType,
    payload,
  };
}

function correctionPayload(overrides = {}) {
  return {
    caseContext: {
      caseId: 'case_decision_audit_http_001',
      organizationId: 'org_decision_audit_http_001',
    },
    appointmentContext: {
      appointmentId: 'apt_decision_audit_http_001',
      engineerReceivedTask: false,
      engineerDeparted: false,
      routeStarted: false,
      arrived: false,
    },
    correction: {
      fieldKey: 'issueSummary',
      fieldGroup: CORRECTION_FIELD_GROUPS.DISPATCH_OPERATIONAL,
      fromValue: 'from_value_should_not_leak',
      toValue: 'safe public update',
      rawPhone: 'raw_phone_should_not_leak',
      rawAddress: 'raw_address_should_not_leak',
      rawLineUserId: 'raw_line_user_should_not_leak',
      token: 'token_should_not_leak',
      secret: 'secret_should_not_leak',
      internalNote: 'internal_note_should_not_leak',
      auditRawPayload: 'audit_raw_should_not_leak',
      aiRawPayload: 'ai_raw_should_not_leak',
      billingInternalData: 'billing_internal_should_not_leak',
      settlementInternalData: 'settlement_internal_should_not_leak',
      finalAppointmentId: 'final_appointment_should_not_leak',
      fieldServiceReportId: 'field_service_report_should_not_leak',
      reportId: 'report_should_not_leak',
    },
    ...overrides,
  };
}

function assertSafePublicBody(value) {
  const serialized = JSON.stringify(value);

  [
    'from_value_should_not_leak',
    'raw_phone_should_not_leak',
    'raw_address_should_not_leak',
    'raw_line_user_should_not_leak',
    'token_should_not_leak',
    'secret_should_not_leak',
    'internal_note_should_not_leak',
    'audit_raw_should_not_leak',
    'ai_raw_should_not_leak',
    'billing_internal_should_not_leak',
    'settlement_internal_should_not_leak',
    'final_appointment_should_not_leak',
    'field_service_report_should_not_leak',
    'report_should_not_leak',
    'writer_failure_marker_should_not_leak',
    'unsafe_sql_marker_should_not_leak',
    'unsafe_db_url_marker_should_not_leak',
  ].forEach((needle) => {
    assert.equal(serialized.includes(needle), false, `public body leaked ${needle}`);
  });

  [
    '"auditIntent"',
    '"decisionAuditWriterResult"',
    '"writerResult"',
    '"rawWriterResult"',
    '"finalAppointmentId"',
    '"fieldServiceReportId"',
    '"reportId"',
    '"rawPhone"',
    '"rawAddress"',
    '"rawLineUserId"',
  ].forEach((needle) => {
    assert.equal(serialized.includes(needle), false, `public body leaked field ${needle}`);
  });
}

function assertSafeAuditIntent(intent, expected) {
  assert.equal(intent.organizationId, 'org_decision_audit_http_001');
  assert.equal(intent.caseId, 'case_decision_audit_http_001');
  assert.equal(intent.appointmentId, 'apt_decision_audit_http_001');
  assert.equal(intent.actorId, 'dispatcher_decision_audit_http_001');
  assert.equal(intent.actorRole, 'dispatch_assistant');
  assert.equal(intent.fieldKey, 'issueSummary');
  assert.equal(intent.fieldGroup, CORRECTION_FIELD_GROUPS.DISPATCH_OPERATIONAL);
  assert.equal(intent.action, expected.action);
  assert.equal(intent.eventType, expected.eventType);
  assert.equal(intent.resultStatus, expected.resultStatus);
  assert.equal(intent.auditWritten, false);

  [
    'fromValue',
    'toValue',
    'rawPhone',
    'rawAddress',
    'rawLineUserId',
    'finalAppointmentId',
    'fieldServiceReportId',
    'reportId',
  ].forEach((key) => {
    assert.equal(Object.prototype.hasOwnProperty.call(intent, key), false, `${key} leaked into audit intent`);
  });
  assertSafePublicBody(intent);
}

function requireSpecifiers(source) {
  const specifiers = [];
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
  let match;

  while ((match = requireRegex.exec(source)) !== null) {
    specifiers.push(match[1]);
  }

  return specifiers.sort();
}

test('default app-like HTTP path has no decision audit writer and no public side-channel body', async () => {
  const response = await requestApp(defaultApp, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.DATA_CORRECTION_REQUEST,
    correctionPayload(),
  ));

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'ok');
  assert.equal(response.body.result.decision, DATA_CORRECTION_DECISIONS.ALLOW_PRE_DEPARTURE_CORRECTION);
  assertSafePublicBody(response.body);
});

test('explicit createApp decisionAuditWriter records safe request intent without public response expansion', async () => {
  const auditCalls = [];
  const app = createApp({
    dataCorrectionDecisionAuditWriter(intent) {
      auditCalls.push(intent);
      return { ok: true, unsafe: 'writer_internal_should_not_leak' };
    },
  });

  const response = await requestApp(app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.DATA_CORRECTION_REQUEST,
    correctionPayload(),
  ));

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'ok');
  assert.equal(response.body.result.correctionApplicationReady, true);
  assert.equal(auditCalls.length, 1);
  assertSafeAuditIntent(auditCalls[0], {
    action: DATA_CORRECTION_AUDIT_ACTIONS.REQUEST,
    eventType: 'data_correction_request_accepted',
    resultStatus: DATA_CORRECTION_AUDIT_RESULTS.ALLOWED,
  });
  assertSafePublicBody(response.body);
});

test('explicit createApp decisionAuditWriter records safe apply intent without changing apply outcome', async () => {
  const auditCalls = [];
  const correctionCalls = [];
  const app = createApp({
    dataCorrectionDecisionAuditWriter: {
      write(intent) {
        auditCalls.push(intent);
        return { persisted: true };
      },
    },
    dataCorrectionCorrectionWriter(payload) {
      correctionCalls.push(payload);
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
  assert.equal(correctionCalls.length, 1);
  assert.equal(auditCalls.length, 1);
  assertSafeAuditIntent(auditCalls[0], {
    action: DATA_CORRECTION_AUDIT_ACTIONS.APPLY,
    eventType: 'data_correction_apply_allowed',
    resultStatus: DATA_CORRECTION_AUDIT_RESULTS.ALLOWED,
  });
  assertSafePublicBody([response.body, correctionCalls]);
});

test('explicit createServerBootstrap decisionAuditWriter remains app-like and does not start listen', async () => {
  const auditCalls = [];
  const bootstrap = createServerBootstrap({
    dataCorrectionDecisionAuditWriter(intent) {
      auditCalls.push(intent);
      return { ok: true };
    },
  });

  const response = await requestApp(bootstrap.app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.DATA_CORRECTION_REQUEST,
    correctionPayload(),
  ));

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'ok');
  assert.equal(response.body.result.correctionApplicationReady, true);
  assert.equal(auditCalls.length, 1);
  assertSafeAuditIntent(auditCalls[0], {
    action: DATA_CORRECTION_AUDIT_ACTIONS.REQUEST,
    eventType: 'data_correction_request_accepted',
    resultStatus: DATA_CORRECTION_AUDIT_RESULTS.ALLOWED,
  });
  assertSafePublicBody(response.body);
});

test('decisionAuditWriter failure is redacted and does not change apply outcome', async () => {
  const correctionCalls = [];
  const app = createApp({
    dataCorrectionDecisionAuditWriter() {
      throw new Error('writer_failure_marker_should_not_leak unsafe_sql_marker_should_not_leak unsafe_db_url_marker_should_not_leak');
    },
    dataCorrectionCorrectionWriter(payload) {
      correctionCalls.push(payload);
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
  assert.equal(correctionCalls.length, 1);
  assertSafePublicBody([response.body, correctionCalls]);
});

test('HTTP behavior unit stays app-like and avoids server start or external runtime imports', () => {
  const source = fs.readFileSync(__filename, 'utf8');
  const appSource = fs.readFileSync(path.join(repoRoot, 'src/app.js'), 'utf8');
  const serverSource = fs.readFileSync(path.join(repoRoot, 'src/server.js'), 'utf8');
  const testSpecifiers = requireSpecifiers(source);
  const appServerSpecifiers = [
    ...requireSpecifiers(appSource),
    ...requireSpecifiers(serverSource),
  ].join('\n');

  assert.equal(testSpecifiers.includes('super' + 'test'), false);
  assert.equal(testSpecifiers.includes('node:' + 'http'), false);
  assert.equal(testSpecifiers.includes('node:' + 'https'), false);
  assert.equal(testSpecifiers.includes('node:' + 'net'), false);
  assert.equal(/\.listen\s*\(/.test(source), false);
  assert.equal(testSpecifiers.some((specifier) => /pg|provider|billing|settlement|rag|openai/i.test(specifier)), false);
  assert.equal(appServerSpecifiers.includes('dataCorrectionDecisionAuditRepository'), false);
  assert.equal(appServerSpecifiers.includes('dataCorrectionDecisionAuditWriter'), false);
});
