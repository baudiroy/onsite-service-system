'use strict';

const assert = require('node:assert/strict');
const { Readable, Writable } = require('node:stream');
const test = require('node:test');

const { createApp } = require('../../src/app');
const {
  createServerBootstrap,
  resolveServerApp,
} = require('../../src/server');
const {
  CORRECTION_FIELD_GROUPS,
} = require('../../src/dataCorrection/dataCorrectionPolicyEngine');
const {
  DATA_CORRECTION_GOVERNANCE_ACTIONS,
} = require('../../src/dataCorrection/dataCorrectionGovernanceOrchestrator');
const {
  FOLLOW_UP_PROPOSAL_TYPES,
  FOLLOW_UP_TERMINAL_STATES,
} = require('../../src/dataCorrection/followUpAppointmentProposalService');
const {
  TERMINAL_STATES,
} = require('../../src/dataCorrection/unableToCompleteAppointmentResultService');
const {
  createDataCorrectionPersistenceRepository,
} = require('../../src/dataCorrection/dataCorrectionPersistenceRepository');

const FORBIDDEN_VALUES = Object.freeze([
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
  'final_appointment_should_not_leak',
  'writer_failure_should_not_leak',
]);

function createSyntheticApp(calls) {
  const safeCalls = Array.isArray(calls) ? calls : [];

  return {
    listen(port, callback) {
      safeCalls.push({ event: 'listen', port });

      if (callback) {
        callback();
      }

      return {
        close(closeCallback) {
          safeCalls.push({ event: 'close' });

          if (closeCallback) {
            closeCallback();
          }
        },
      };
    },
  };
}

function createRequest(pathname, requestBody, authOverrides) {
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
    organizationId: 'org_data_correction_repository_e2e_001',
    userId: 'dispatcher_data_correction_repository_e2e_001',
    role: 'dispatch_assistant',
    permissions: ['case.correction.apply', 'case.correction.request', 'appointment.follow_up.propose'],
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
      caseId: 'case_data_correction_repository_e2e_001',
      organizationId: 'org_data_correction_repository_e2e_001',
    },
    appointmentContext: {
      appointmentId: 'apt_data_correction_repository_e2e_001',
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
      finalAppointmentId: 'final_appointment_should_not_leak',
    },
    ...overrides,
  };
}

function persistencePayload(overrides = {}) {
  return {
    organizationId: 'org_data_correction_repository_e2e_001',
    caseId: 'case_data_correction_repository_e2e_001',
    appointmentId: 'apt_data_correction_repository_e2e_001',
    actorUserId: 'dispatcher_data_correction_repository_e2e_001',
    actorRole: 'dispatch_assistant',
    actionType: 'pre_departure_apply',
    fieldKey: 'issueSummary',
    fieldGroup: CORRECTION_FIELD_GROUPS.DISPATCH_OPERATIONAL,
    decision: 'allowed',
    reasonCode: 'PRE_DEPARTURE_CORRECTION_ALLOWED',
    safeMessageKey: 'dataCorrection.ok',
    timestamp: '2026-05-21T00:00:00.000Z',
    ...overrides,
  };
}

function unablePayload(overrides = {}) {
  return {
    caseContext: {
      caseId: 'case_data_correction_repository_e2e_001',
      organizationId: 'org_data_correction_repository_e2e_001',
    },
    appointmentContext: {
      appointmentId: 'apt_data_correction_repository_e2e_001',
      organizationId: 'org_data_correction_repository_e2e_001',
      assignedEngineerId: 'engineer_data_correction_repository_e2e_001',
      arrived: true,
    },
    result: {
      reasonCode: 'unable_to_complete',
      terminalState: TERMINAL_STATES.UNABLE_TO_COMPLETE,
      note: 'site condition mismatch',
      evidenceRefs: [
        'attach_safe_001',
      ],
      finalAppointmentId: 'final_appointment_should_not_leak',
    },
    ...overrides,
  };
}

function followUpPayload(overrides = {}) {
  return {
    caseContext: {
      caseId: 'case_data_correction_repository_e2e_001',
      organizationId: 'org_data_correction_repository_e2e_001',
    },
    appointmentContext: {
      appointmentId: 'apt_data_correction_repository_e2e_001',
      organizationId: 'org_data_correction_repository_e2e_001',
      terminalState: FOLLOW_UP_TERMINAL_STATES.FOLLOW_UP_REQUIRED,
    },
    proposal: {
      proposalType: FOLLOW_UP_PROPOSAL_TYPES.FOLLOW_UP_APPOINTMENT,
      reasonCode: 'follow_up_required',
      note: 'schedule follow up',
      requiredPartsRefs: [
        'part_safe_001',
      ],
      finalAppointmentId: 'final_appointment_should_not_leak',
    },
    ...overrides,
  };
}

function assertSafeOutput(value) {
  const serialized = JSON.stringify(value);

  for (const forbiddenValue of FORBIDDEN_VALUES) {
    assert.equal(serialized.includes(forbiddenValue), false, `leaked ${forbiddenValue}`);
  }

  for (const forbiddenKey of [
    'finalAppointmentId',
    'rawPhone',
    'rawAddress',
    'rawLineUserId',
    'lineUserId',
    'token',
    'secret',
    'DATABASE_URL',
    'internalNote',
    'aiRawPayload',
  ]) {
    assert.equal(serialized.includes(`"${forbiddenKey}"`), false, `leaked key ${forbiddenKey}`);
  }
}

function createSyntheticRepository(options = {}) {
  const capturedSpecs = [];
  const repository = createDataCorrectionPersistenceRepository({
    allowNonExecutableForTest: true,
    asyncWriters: options.asyncWriters === true,
    executor(querySpec) {
      capturedSpecs.push(querySpec);

      if (options.throwExecutor) {
        throw new Error('writer_failure_should_not_leak token_should_not_leak');
      }

      if (options.asyncExecutor) {
        return Promise.resolve({ ok: true });
      }

      return { ok: true };
    },
  });

  return {
    capturedSpecs,
    repository,
  };
}

function recordTypes(capturedSpecs) {
  return capturedSpecs.map((querySpec) => querySpec.recordType);
}

function assertExecutorSpecsSafe(capturedSpecs) {
  for (const querySpec of capturedSpecs) {
    assert.equal(Object.isFrozen(querySpec), true);
    assertSafeOutput(querySpec);
  }
}

test('repository default writer set fail-closes and does not call executor', () => {
  let called = false;
  const repository = createDataCorrectionPersistenceRepository({
    executor() {
      called = true;
      return { ok: true };
    },
  });
  const result = repository.getWriterSet().auditWriter(persistencePayload());

  assert.equal(called, false);
  assert.equal(result.ok, false);
  assert.equal(result.persisted, false);
  assert.equal(result.reasonCode, 'QUERY_SPEC_NOT_EXECUTABLE');
  assertSafeOutput(result);
});

test('repository synthetic writer set calls injected executor', () => {
  const { capturedSpecs, repository } = createSyntheticRepository();
  const result = repository.getWriterSet().auditWriter(persistencePayload());

  assert.equal(result.ok, true);
  assert.deepEqual(recordTypes(capturedSpecs), ['audit']);
  assertExecutorSpecsSafe(capturedSpecs);
});

test('createApp dataCorrection repository path handles pre-departure apply', async () => {
  const { capturedSpecs, repository } = createSyntheticRepository();
  const app = createApp({
    dataCorrection: repository.getWriterSet(),
  });
  const response = await requestApp(app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.PRE_DEPARTURE_APPLY,
    correctionPayload(),
  ));

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'ok');
  assert.deepEqual(recordTypes(capturedSpecs), [
    'audit',
    'correction_application',
    'engineer_notification_intent',
  ]);
  assertSafeOutput(response.body);
  assertExecutorSpecsSafe(capturedSpecs);
});

test('createApp dataCorrection async repository path awaits async executor', async () => {
  const { capturedSpecs, repository } = createSyntheticRepository({
    asyncExecutor: true,
    asyncWriters: true,
  });
  const app = createApp({
    dataCorrection: repository.getWriterSet(),
  });
  const response = await requestApp(app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.PRE_DEPARTURE_APPLY,
    correctionPayload(),
  ));

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'ok');
  assert.deepEqual(recordTypes(capturedSpecs), [
    'audit',
    'correction_application',
    'engineer_notification_intent',
  ]);
  assertSafeOutput(response.body);
  assertExecutorSpecsSafe(capturedSpecs);
});

test('post-departure freeze calls contact log dispatch note and audit through repository', async () => {
  const { capturedSpecs, repository } = createSyntheticRepository();
  const app = createApp({
    dataCorrection: repository.getWriterSet(),
  });
  const response = await requestApp(app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.POST_DEPARTURE_FREEZE,
    correctionPayload({
      appointmentContext: {
        appointmentId: 'apt_data_correction_repository_e2e_001',
        engineerReceivedTask: true,
        engineerDeparted: true,
        routeStarted: false,
        arrived: false,
      },
    }),
  ));

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.result.manualHandlingRequired, true);
  assert.deepEqual(recordTypes(capturedSpecs), [
    'audit',
    'contact_log',
    'dispatch_note',
    'engineer_notification_intent',
  ]);
  assertSafeOutput(response.body);
  assertExecutorSpecsSafe(capturedSpecs);
});

test('unable-to-complete calls appointment result evidence and audit through repository', async () => {
  const { capturedSpecs, repository } = createSyntheticRepository();
  const app = createApp({
    dataCorrection: repository.getWriterSet(),
  });
  const response = await requestApp(app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.UNABLE_TO_COMPLETE_RESULT,
    unablePayload(),
  ), {
    userId: 'engineer_data_correction_repository_e2e_001',
    role: 'engineer',
    permissions: ['appointment.result.record'],
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.result.fieldServiceReportCreated, false);
  assert.deepEqual(recordTypes(capturedSpecs), ['appointment_result', 'evidence', 'audit']);
  assertSafeOutput(response.body);
  assertExecutorSpecsSafe(capturedSpecs);
});

test('follow-up proposal calls follow-up draft dispatch note and audit through repository', async () => {
  const { capturedSpecs, repository } = createSyntheticRepository();
  const app = createApp({
    dataCorrection: repository.getWriterSet(),
  });
  const response = await requestApp(app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.FOLLOW_UP_PROPOSAL,
    followUpPayload(),
  ));

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.result.formalAppointmentCreated, false);
  assert.deepEqual(recordTypes(capturedSpecs), ['follow_up_draft', 'dispatch_note', 'audit']);
  assertSafeOutput(response.body);
  assertExecutorSpecsSafe(capturedSpecs);
});

test('phone correction returns re-verification and does not write correction application', async () => {
  const { capturedSpecs, repository } = createSyntheticRepository();
  const app = createApp({
    dataCorrection: repository.getWriterSet(),
  });
  const response = await requestApp(app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.PRE_DEPARTURE_APPLY,
    correctionPayload({
      correction: {
        fieldKey: 'phoneNumber',
        fieldGroup: CORRECTION_FIELD_GROUPS.PHONE_IDENTITY,
        toValue: 'raw_phone_should_not_leak',
      },
    }),
  ));

  assert.equal(response.statusCode, 403);
  assert.equal(response.body.phoneReverificationRequired, true);
  assert.deepEqual(recordTypes(capturedSpecs), ['audit']);
  assertSafeOutput(response.body);
  assertExecutorSpecsSafe(capturedSpecs);
});

test('AI role is denied before repository executor is called', async () => {
  const { capturedSpecs, repository } = createSyntheticRepository();
  const app = createApp({
    dataCorrection: repository.getWriterSet(),
  });
  const response = await requestApp(app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.PRE_DEPARTURE_APPLY,
    correctionPayload(),
  ), {
    role: 'ai',
    permissions: ['case.correction.apply'],
  });

  assert.equal(response.statusCode, 403);
  assert.equal(response.body.status, 'deny');
  assert.deepEqual(capturedSpecs, []);
  assertSafeOutput(response.body);
});

test('executor throw returns safe failure through app route without raw error leak', async () => {
  const { capturedSpecs, repository } = createSyntheticRepository({
    throwExecutor: true,
  });
  const app = createApp({
    dataCorrection: repository.getWriterSet(),
  });
  const response = await requestApp(app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.PRE_DEPARTURE_APPLY,
    correctionPayload(),
  ));

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'failed');
  assert.equal(capturedSpecs.length >= 1, true);
  assertSafeOutput(response.body);
  assertExecutorSpecsSafe(capturedSpecs);
});

test('createServerBootstrap dataCorrection repository path works without listen', async () => {
  const { capturedSpecs, repository } = createSyntheticRepository();
  const bootstrap = createServerBootstrap({
    dataCorrection: repository.getWriterSet(),
  });
  const response = await requestApp(bootstrap.app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.PRE_DEPARTURE_APPLY,
    correctionPayload(),
  ));

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'ok');
  assert.deepEqual(recordTypes(capturedSpecs), [
    'audit',
    'correction_application',
    'engineer_notification_intent',
  ]);
  assertSafeOutput(response.body);
  assertExecutorSpecsSafe(capturedSpecs);
});

test('server options.app priority bypasses repository writer path', () => {
  const { capturedSpecs, repository } = createSyntheticRepository();
  const listenCalls = [];
  const injectedApp = createSyntheticApp(listenCalls);
  const app = resolveServerApp({
    app: injectedApp,
    dataCorrection: repository.getWriterSet(),
  });

  assert.equal(app, injectedApp);
  assert.deepEqual(capturedSpecs, []);
  assert.deepEqual(listenCalls, []);
});
