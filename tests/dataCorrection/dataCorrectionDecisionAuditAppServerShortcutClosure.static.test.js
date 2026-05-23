'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Readable, Writable } = require('node:stream');
const test = require('node:test');

const {
  DATA_CORRECTION_APP_SHORTCUT_OPTION_KEY_MAP,
  createApp,
} = require('../../src/app');
const {
  DATA_CORRECTION_SERVER_SHORTCUT_OPTION_KEY_MAP,
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

const FILES = Object.freeze({
  task893Doc: 'docs/task-893-data-correction-decision-audit-injected-writer-app-server-options-path-no-real-db-no-api-shape-change.md',
  task893Test: 'tests/dataCorrection/dataCorrectionDecisionAuditInjectedWriterAppServerOptions.unit.test.js',
  appOptionsTest: 'tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js',
  serverOptionsTest: 'tests/dataCorrection/dataCorrectionServerOptions.unit.test.js',
  app: 'src/app.js',
  server: 'src/server.js',
  requestService: 'src/dataCorrection/dataCorrectionRequestService.js',
  applyService: 'src/dataCorrection/preDepartureCorrectionApplicationService.js',
  controller: 'src/controllers/dataCorrectionController.js',
  route: 'src/routes/dataCorrectionRoutes.js',
  orchestrator: 'src/dataCorrection/dataCorrectionGovernanceOrchestrator.js',
});

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(path.join(repoRoot, relativePath));
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

function createRequest(pathname, requestBody, authOverrides = {}) {
  const bodyText = JSON.stringify(requestBody || {});
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
    organizationId: 'org_data_correction_app_server_shortcut_closure_001',
    userId: 'dispatcher_data_correction_app_server_shortcut_closure_001',
    role: 'dispatch_assistant',
    permissions: [
      'case.correction.apply',
      'case.correction.request',
      'data_correction.apply',
      'data_correction.request',
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
      caseId: 'case_data_correction_app_server_shortcut_closure_001',
      organizationId: 'org_data_correction_app_server_shortcut_closure_001',
    },
    appointmentContext: {
      appointmentId: 'apt_data_correction_app_server_shortcut_closure_001',
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
    '"auditIntent"',
    '"decisionAuditWriterResult"',
    '"rawPhone"',
    '"rawAddress"',
    '"rawLineUserId"',
    '"fromValue"',
    '"toValue"',
    '"finalAppointmentId"',
    '"fieldServiceReportId"',
    '"reportId"',
  ].forEach((needle) => {
    assert.equal(serialized.includes(needle), false, `public output leaked ${needle}`);
  });
}

function assertSafeIntent(intent, expected = {}) {
  assert.equal(intent.action, expected.action);
  assert.equal(intent.eventType, expected.eventType);
  assert.equal(intent.resultStatus, expected.resultStatus);
  assert.equal(intent.organizationId, 'org_data_correction_app_server_shortcut_closure_001');
  assert.equal(intent.caseId, 'case_data_correction_app_server_shortcut_closure_001');
  assert.equal(intent.appointmentId, 'apt_data_correction_app_server_shortcut_closure_001');
  assert.equal(intent.actorId, 'dispatcher_data_correction_app_server_shortcut_closure_001');
  assert.equal(intent.actorRole, 'dispatch_assistant');
  assert.equal(intent.fieldKey, 'issueSummary');
  assert.equal(intent.fieldGroup, CORRECTION_FIELD_GROUPS.DISPATCH_OPERATIONAL);
  assert.equal(intent.auditWritten, false);
  assert.equal(Object.prototype.hasOwnProperty.call(intent, 'fromValue'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(intent, 'toValue'), false);
  assertSafeOutput(intent);
}

test('Task893 evidence remains present before Task894 shortcut closure', () => {
  [
    FILES.task893Doc,
    FILES.task893Test,
    FILES.appOptionsTest,
    FILES.serverOptionsTest,
    FILES.app,
    FILES.server,
  ].forEach((relativePath) => {
    assert.equal(exists(relativePath), true, `${relativePath} is missing`);
  });

  const doc = read(FILES.task893Doc);

  [
    'optional injected',
    'no default `decisionAuditWriter`',
    'does not connect a real DB',
    'no public API response shape change',
    'no public API response shape change',
    'no migration',
    'no provider / LINE / SMS / App push / webhook / email runtime',
    'no AI / RAG runtime',
    'no billing / settlement runtime',
  ].forEach((phrase) => {
    assert.match(doc, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), `missing phrase: ${phrase}`);
  });
});

test('app and server expose only explicit shortcut option pass-through for decision audit writer', () => {
  assert.equal(
    DATA_CORRECTION_APP_SHORTCUT_OPTION_KEY_MAP.DECISION_AUDIT_WRITER,
    'dataCorrectionDecisionAuditWriter',
  );
  assert.equal(
    DATA_CORRECTION_SERVER_SHORTCUT_OPTION_KEY_MAP.DECISION_AUDIT_WRITER,
    'dataCorrectionDecisionAuditWriter',
  );

  const appSource = read(FILES.app);
  const serverSource = read(FILES.server);

  assert.match(
    appSource,
    /decisionAuditWriter:\s*options\[DATA_CORRECTION_APP_SHORTCUT_OPTION_KEY_MAP\.DECISION_AUDIT_WRITER\]/,
  );
  assert.match(
    serverSource,
    /decisionAuditWriter:\s*options\[DATA_CORRECTION_SERVER_SHORTCUT_OPTION_KEY_MAP\.DECISION_AUDIT_WRITER\]/,
  );
  assert.deepEqual(appSource.match(/decisionAuditWriter:/g), ['decisionAuditWriter:']);
  assert.deepEqual(serverSource.match(/decisionAuditWriter:/g), ['decisionAuditWriter:']);
});

test('app and server do not import decision audit repository writer DB provider AI billing or migration runtime', () => {
  const appSpecifiers = requireSpecifiers(read(FILES.app));
  const serverSpecifiers = requireSpecifiers(read(FILES.server));
  const combinedSpecifiers = [...appSpecifiers, ...serverSpecifiers].join('\n');
  const combinedSource = [read(FILES.app), read(FILES.server)].join('\n');

  [
    'dataCorrectionDecisionAuditRepository',
    'dataCorrectionDecisionAuditWriter',
    './db',
    './database',
    './pool',
    'pg',
  ].forEach((specifier) => {
    assert.equal(combinedSpecifiers.includes(specifier), false, `unexpected direct import ${specifier}`);
  });

  [
    /createDataCorrectionDecisionAuditRepository\s*\(/,
    /createDataCorrectionDecisionAuditWriter\s*\(/,
    /new\s+Pool\s*\(/,
    /pool\.query\s*\(/,
    /client\.query\s*\(/,
    /db\.query\s*\(/,
    /psql/i,
    /db:migrate/i,
    /025_create_data_correction_decision_audit_events/i,
    /CREATE\s+TABLE/i,
    /ALTER\s+TABLE/i,
    /DROP\s+TABLE/i,
    /dry[-_ ]?run/i,
    /LINE_CHANNEL/i,
    /LINE_ACCESS/i,
    /SMS/i,
    /APP_PUSH/i,
    /WEBHOOK/i,
    /OPENAI/i,
    /RAG/i,
    /billing/i,
    /settlement/i,
  ].forEach((pattern) => {
    assert.equal(pattern.test(combinedSource), false, `app/server matched forbidden pattern ${pattern}`);
  });
});

test('default app response has no decision audit side-channel and no default writer', async () => {
  const app = createApp();
  const response = await requestApp(app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.DATA_CORRECTION_REQUEST,
    correctionPayload(),
  ));

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'ok');
  assert.equal(response.body.result.decision, DATA_CORRECTION_DECISIONS.ALLOW_PRE_DEPARTURE_CORRECTION);
  assertSafeOutput(response.body);
});

test('explicit app shortcut writer records safe intent without changing public response or request/apply separation', async () => {
  const decisionAuditCalls = [];
  const correctionCalls = [];
  const app = createApp({
    dataCorrectionDecisionAuditWriter(intent) {
      decisionAuditCalls.push(intent);
      return { recorded: true };
    },
    dataCorrectionCorrectionWriter(payload) {
      correctionCalls.push(payload);
      return { recorded: true };
    },
  });

  const requestResponse = await requestApp(app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.DATA_CORRECTION_REQUEST,
    correctionPayload(),
  ));
  const applyResponse = await requestApp(app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.PRE_DEPARTURE_APPLY,
    correctionPayload(),
  ));

  assert.equal(requestResponse.statusCode, 200);
  assert.equal(requestResponse.body.result.correctionApplicationReady, true);
  assert.equal(applyResponse.statusCode, 200);
  assert.equal(applyResponse.body.result.correctionApplied, true);
  assert.equal(correctionCalls.length, 1, 'data_correction_request must not apply the correction writer');
  assert.equal(decisionAuditCalls.length, 2);
  assertSafeIntent(decisionAuditCalls[0], {
    action: DATA_CORRECTION_AUDIT_ACTIONS.REQUEST,
    eventType: 'data_correction_request_accepted',
    resultStatus: DATA_CORRECTION_AUDIT_RESULTS.ALLOWED,
  });
  assertSafeIntent(decisionAuditCalls[1], {
    action: DATA_CORRECTION_AUDIT_ACTIONS.APPLY,
    eventType: 'data_correction_apply_allowed',
    resultStatus: DATA_CORRECTION_AUDIT_RESULTS.ALLOWED,
  });
  assertSafeOutput([requestResponse.body, applyResponse.body]);
});

test('explicit server shortcut writer records safe intent without changing public response', async () => {
  const decisionAuditCalls = [];
  const bootstrap = createServerBootstrap({
    dataCorrectionDecisionAuditWriter: {
      write(intent) {
        decisionAuditCalls.push(intent);
        return { recorded: true };
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
  assertSafeIntent(decisionAuditCalls[0], {
    action: DATA_CORRECTION_AUDIT_ACTIONS.REQUEST,
    eventType: 'data_correction_request_accepted',
    resultStatus: DATA_CORRECTION_AUDIT_RESULTS.ALLOWED,
  });
  assertSafeOutput(response.body);
});

test('explicit shortcut writer failure remains side-effect bounded and does not change correction outcome', async () => {
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

test('route controller and orchestrator keep injected writer side-channel out of public response promotion', () => {
  const requestService = read(FILES.requestService);
  const applyService = read(FILES.applyService);
  const controller = read(FILES.controller);
  const route = read(FILES.route);
  const orchestrator = read(FILES.orchestrator);

  [
    requestService,
    applyService,
  ].forEach((source) => {
    assert.match(source, /decisionAuditWriter/);
  });

  [
    controller,
    route,
    orchestrator,
  ].forEach((source) => {
    assert.equal(/auditIntent/.test(source), false);
    assert.equal(/decisionAuditWriterResult/.test(source), false);
  });
});
