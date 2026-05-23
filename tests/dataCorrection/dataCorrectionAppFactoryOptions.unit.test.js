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
  CORRECTION_FIELD_GROUPS,
  DATA_CORRECTION_DECISIONS,
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

const repoRoot = path.resolve(__dirname, '../..');
const appFile = path.join(repoRoot, 'src/app.js');

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

  if (authOverrides !== undefined) {
    req.auth = auth(authOverrides);
  }

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

function requestApp(app, body, authOverrides) {
  return new Promise((resolve, reject) => {
    const req = createRequest('/data-correction/governance', body, authOverrides);
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
    organizationId: 'org_data_correction_app_001',
    userId: 'dispatcher_data_correction_app_001',
    role: 'dispatch_assistant',
    permissions: [
      'appointment.follow_up.propose',
      'appointment.result.record',
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
      caseId: 'case_data_correction_app_001',
      organizationId: 'org_data_correction_app_001',
    },
    appointmentContext: {
      appointmentId: 'apt_data_correction_app_001',
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

function unablePayload(overrides = {}) {
  return {
    caseContext: {
      caseId: 'case_data_correction_app_001',
      organizationId: 'org_data_correction_app_001',
    },
    appointmentContext: {
      appointmentId: 'apt_data_correction_app_001',
      organizationId: 'org_data_correction_app_001',
      assignedEngineerId: 'engineer_data_correction_app_001',
      arrived: true,
    },
    result: {
      reasonCode: 'unable_to_complete',
      terminalState: TERMINAL_STATES.UNABLE_TO_COMPLETE,
      note: 'site condition mismatch',
      finalAppointmentId: 'final_appointment_should_not_leak',
    },
    ...overrides,
  };
}

function followUpPayload(overrides = {}) {
  return {
    caseContext: {
      caseId: 'case_data_correction_app_001',
      organizationId: 'org_data_correction_app_001',
    },
    appointmentContext: {
      appointmentId: 'apt_data_correction_app_001',
      organizationId: 'org_data_correction_app_001',
      terminalState: FOLLOW_UP_TERMINAL_STATES.FOLLOW_UP_REQUIRED,
    },
    proposal: {
      proposalType: FOLLOW_UP_PROPOSAL_TYPES.FOLLOW_UP_APPOINTMENT,
      reasonCode: 'follow_up_required',
      note: 'schedule follow up',
      finalAppointmentId: 'final_appointment_should_not_leak',
    },
    ...overrides,
  };
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

function assertSafeOutput(value) {
  const serialized = JSON.stringify(value);

  for (const forbiddenValue of [
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
  ]) {
    assert.equal(serialized.includes(forbiddenValue), false, `leaked ${forbiddenValue}`);
  }

  assert.equal(serialized.includes('"finalAppointmentId"'), false);
}

function assertSafeAuditMetadata(payload, expected = {}) {
  const expectedAppointmentId = Object.prototype.hasOwnProperty.call(expected, 'appointmentId')
    ? expected.appointmentId
    : 'apt_data_correction_app_001';

  assert.equal(payload.organizationId, expected.organizationId || 'org_data_correction_app_001');
  assert.equal(payload.caseId, expected.caseId || 'case_data_correction_app_001');
  assert.equal(payload.appointmentId, expectedAppointmentId);
  assert.deepEqual(payload.actor, {
    userId: expected.userId || 'dispatcher_data_correction_app_001',
    role: expected.role || 'dispatch_assistant',
  });
  assert.deepEqual(payload.correction, {
    fieldKey: expected.fieldKey || 'issueSummary',
    fieldGroup: expected.fieldGroup || CORRECTION_FIELD_GROUPS.DISPATCH_OPERATIONAL,
  });
  assert.equal(payload.decision, expected.decision);
  assert.equal(payload.reasonCode, expected.reasonCode);
  assert.equal(payload.safeMessageKey, expected.safeMessageKey);
  assert.equal(payload.correction.fromValue, undefined);
  assert.equal(payload.correction.toValue, undefined);
  assert.equal(payload.correction.rawPhone, undefined);
  assert.equal(payload.correction.rawAddress, undefined);
  assert.equal(payload.correction.finalAppointmentId, undefined);
  assert.equal(payload.rawPayload, undefined);
  assert.equal(payload.stack, undefined);
  assertSafeOutput(payload);
}

function writerCalls() {
  return {
    appointmentResult: [],
    audit: [],
    contactLog: [],
    correction: [],
    dispatchNote: [],
    engineerNotification: [],
    evidence: [],
    followUpDraft: [],
  };
}

function appDataCorrectionOptions(calls) {
  return {
    appointmentResultWriter(payload) {
      calls.appointmentResult.push(payload);
    },
    auditWriter(payload) {
      calls.audit.push(payload);
    },
    contactLogWriter(payload) {
      calls.contactLog.push(payload);
    },
    correctionWriter(payload) {
      calls.correction.push(payload);
    },
    dispatchNoteWriter(payload) {
      calls.dispatchNote.push(payload);
    },
    engineerNotificationWriter(payload) {
      calls.engineerNotification.push(payload);
    },
    evidenceWriter(payload) {
      calls.evidence.push(payload);
    },
    followUpDraftWriter(payload) {
      calls.followUpDraft.push(payload);
    },
  };
}

function createAsyncPersistenceRepositoryShortcut(options = {}) {
  const capturedSpecs = [];
  const execute = (querySpec) => {
    capturedSpecs.push(querySpec);

    if (options.rejectExecutor) {
      return Promise.reject(new Error('writer_failure_should_not_leak token_should_not_leak'));
    }

    return Promise.resolve({ ok: true });
  };
  const repositoryOptions = {
    allowNonExecutableForTest: true,
    asyncWriters: true,
  };

  if (options.useQueryExecutor) {
    repositoryOptions.queryExecutor = execute;
  } else {
    repositoryOptions.executor = execute;
  }

  const repository = createDataCorrectionPersistenceRepository(repositoryOptions);

  return {
    capturedSpecs,
    repository,
  };
}

function recordTypes(capturedSpecs) {
  return capturedSpecs.map((querySpec) => querySpec.recordType);
}

test('src/app.js exports default app and createApp factory', () => {
  assert.ok(defaultApp);
  assert.equal(typeof defaultApp.handle, 'function');
  assert.equal(typeof createApp, 'function');
});

test('src/app.js exports immutable data correction shortcut option key contract', () => {
  assert.equal(Object.isFrozen(DATA_CORRECTION_APP_SHORTCUT_OPTION_KEY_MAP), true);
  assert.deepEqual(DATA_CORRECTION_APP_SHORTCUT_OPTION_KEY_MAP, {
    CORRECTION_REPOSITORY: 'dataCorrectionRepository',
    WRITER_SET: 'dataCorrectionWriterSet',
    APPOINTMENT_RESULT_WRITER: 'dataCorrectionAppointmentResultWriter',
    AUDIT_WRITER: 'dataCorrectionAuditWriter',
    CONTACT_LOG_WRITER: 'dataCorrectionContactLogWriter',
    CORRECTION_WRITER: 'dataCorrectionCorrectionWriter',
    DECISION_AUDIT_WRITER: 'dataCorrectionDecisionAuditWriter',
    DISPATCH_NOTE_WRITER: 'dataCorrectionDispatchNoteWriter',
    ENGINEER_NOTIFICATION_WRITER: 'dataCorrectionEngineerNotificationWriter',
    EVIDENCE_WRITER: 'dataCorrectionEvidenceWriter',
    FOLLOW_UP_DRAFT_WRITER: 'dataCorrectionFollowUpDraftWriter',
  });
  assert.equal(Object.isFrozen(DATA_CORRECTION_APP_SHORTCUT_OPTION_KEYS), true);
  assert.deepEqual(DATA_CORRECTION_APP_SHORTCUT_OPTION_KEYS, [
    'dataCorrectionRepository',
    'dataCorrectionWriterSet',
    'dataCorrectionAppointmentResultWriter',
    'dataCorrectionAuditWriter',
    'dataCorrectionContactLogWriter',
    'dataCorrectionCorrectionWriter',
    'dataCorrectionDecisionAuditWriter',
    'dataCorrectionDispatchNoteWriter',
    'dataCorrectionEngineerNotificationWriter',
    'dataCorrectionEvidenceWriter',
    'dataCorrectionFollowUpDraftWriter',
  ]);

  assert.throws(() => {
    DATA_CORRECTION_APP_SHORTCUT_OPTION_KEY_MAP.WRITER_SET = 'unsafeWriterSet';
  }, TypeError);
  assert.throws(() => {
    DATA_CORRECTION_APP_SHORTCUT_OPTION_KEYS.push('unexpectedDataCorrectionOption');
  }, TypeError);
});

test('default app includes data correction route with no-options safe deny', async () => {
  const response = await requestApp(defaultApp, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.PRE_DEPARTURE_APPLY,
    correctionPayload(),
  ));

  assert.equal(response.statusCode, 403);
  assert.equal(response.body.status, 'deny');
  assert.equal(response.body.messageKey, 'dataCorrection.unavailable');
  assertSafeOutput(response.body);
});

test('createApp with dataCorrection correctionWriter supports pre-departure apply and calls writer on request only', async () => {
  const correctionCalls = [];
  const app = createApp({
    dataCorrection: {
      correctionWriter(payload) {
        correctionCalls.push(payload);
      },
    },
  });

  assert.deepEqual(correctionCalls, []);

  const response = await requestApp(app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.PRE_DEPARTURE_APPLY,
    correctionPayload(),
  ), {});

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'ok');
  assert.equal(correctionCalls.length, 1);
  assertSafeOutput([response.body, correctionCalls]);
});

test('createApp supports dataCorrection correction writer shortcut option', async () => {
  const correctionCalls = [];
  const app = createApp({
    dataCorrectionCorrectionWriter(payload) {
      correctionCalls.push(payload);
    },
  });

  assert.deepEqual(correctionCalls, []);

  const response = await requestApp(app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.PRE_DEPARTURE_APPLY,
    correctionPayload(),
  ), {});

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'ok');
  assert.equal(correctionCalls.length, 1);
  assertSafeOutput([response.body, correctionCalls]);
});

test('createApp awaits async dataCorrection correction writer shortcut option', async () => {
  const correctionCalls = [];
  const app = createApp({
    async dataCorrectionCorrectionWriter(payload) {
      correctionCalls.push(payload);
      return { recorded: true };
    },
  });

  assert.deepEqual(correctionCalls, []);

  const response = await requestApp(app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.PRE_DEPARTURE_APPLY,
    correctionPayload(),
  ), {});

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'ok');
  assert.equal(correctionCalls.length, 1);
  assertSafeOutput([response.body, correctionCalls]);
});

test('createApp handles async dataCorrection correction writer shortcut failure safely', async () => {
  const contactLogCalls = [];
  const dispatchNoteCalls = [];
  const app = createApp({
    async dataCorrectionCorrectionWriter() {
      return { recorded: false, rawError: 'writer_failure_should_not_leak' };
    },
    dataCorrectionContactLogWriter(payload) {
      contactLogCalls.push(payload);
    },
    dataCorrectionDispatchNoteWriter(payload) {
      dispatchNoteCalls.push(payload);
    },
  });

  const response = await requestApp(app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.PRE_DEPARTURE_APPLY,
    correctionPayload(),
  ), {});

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'failed');
  assert.equal(response.body.safeMessageKey, 'dataCorrection.writerFailed');
  assert.equal(response.body.result.correctionApplicationReady, false);
  assert.equal(response.body.result.correctionApplied, false);
  assert.equal(response.body.result.writerResults.correction.status, 'failed');
  assert.equal(response.body.result.writerResults.contactLog, undefined);
  assert.equal(response.body.result.writerResults.dispatchNote, undefined);
  assert.equal(contactLogCalls.length, 0);
  assert.equal(dispatchNoteCalls.length, 0);
  assertSafeOutput([response.body, contactLogCalls, dispatchNoteCalls]);
});

test('createApp correction writer throw fails safely without manual fallback writers', async () => {
  const auditCalls = [];
  const contactLogCalls = [];
  const dispatchNoteCalls = [];
  const app = createApp({
    dataCorrection: {
      auditWriter(payload) {
        auditCalls.push(payload);
      },
      correctionWriter() {
        throw new Error('writer_failure_should_not_leak');
      },
      contactLogWriter(payload) {
        contactLogCalls.push(payload);
      },
      dispatchNoteWriter(payload) {
        dispatchNoteCalls.push(payload);
      },
    },
  });

  const response = await requestApp(app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.PRE_DEPARTURE_APPLY,
    correctionPayload(),
  ), {});

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'failed');
  assert.equal(response.body.safeMessageKey, 'dataCorrection.writerFailed');
  assert.equal(response.body.result.correctionApplicationReady, false);
  assert.equal(response.body.result.correctionApplied, false);
  assert.equal(response.body.result.writerResults.audit.status, 'recorded');
  assert.equal(response.body.result.writerResults.correction.status, 'failed');
  assert.equal(response.body.result.writerResults.contactLog, undefined);
  assert.equal(response.body.result.writerResults.dispatchNote, undefined);
  assert.equal(auditCalls.length, 1);
  assert.equal(contactLogCalls.length, 0);
  assert.equal(dispatchNoteCalls.length, 0);
  assertSafeAuditMetadata(auditCalls[0], {
    decision: DATA_CORRECTION_DECISIONS.ALLOW_PRE_DEPARTURE_CORRECTION,
    reasonCode: 'PRE_DEPARTURE_CORRECTION_ALLOWED',
    safeMessageKey: 'dataCorrection.allowed',
  });
  assert.equal(JSON.stringify(auditCalls[0]).includes('writer_failure_should_not_leak'), false);
  assertSafeOutput([response.body, auditCalls, contactLogCalls, dispatchNoteCalls]);
});

test('createApp awaits async post-departure freeze shortcut writers', async () => {
  const calls = writerCalls();
  const app = createApp({
    async dataCorrectionAuditWriter(payload) {
      calls.audit.push(payload);
      return { ok: true };
    },
    async dataCorrectionContactLogWriter(payload) {
      calls.contactLog.push(payload);
      return { recorded: true };
    },
    async dataCorrectionDispatchNoteWriter(payload) {
      calls.dispatchNote.push(payload);
      return { persisted: true };
    },
  });

  assert.deepEqual(calls, writerCalls());

  const response = await requestApp(app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.POST_DEPARTURE_FREEZE,
    correctionPayload({
      appointmentContext: {
        appointmentId: 'apt_data_correction_app_001',
        engineerReceivedTask: true,
        engineerDeparted: true,
        routeStarted: false,
        arrived: false,
      },
    }),
  ), {});

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'ok');
  assert.equal(response.body.result.manualHandlingRequired, true);
  assert.equal(calls.audit.length, 1);
  assert.equal(calls.contactLog.length, 1);
  assert.equal(calls.dispatchNote.length, 1);
  assertSafeOutput([response.body, calls]);
});

test('createApp handles async post-departure freeze shortcut writer failure safely', async () => {
  const app = createApp({
    async dataCorrectionContactLogWriter() {
      return { recorded: false, rawError: 'writer_failure_should_not_leak' };
    },
  });

  const response = await requestApp(app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.POST_DEPARTURE_FREEZE,
    correctionPayload({
      appointmentContext: {
        appointmentId: 'apt_data_correction_app_001',
        engineerReceivedTask: true,
        engineerDeparted: true,
        routeStarted: false,
        arrived: false,
      },
    }),
  ), {});

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'failed');
  assert.equal(response.body.safeMessageKey, 'dataCorrection.writerFailed');
  assertSafeOutput(response.body);
});

test('createApp awaits async unable-to-complete shortcut writers', async () => {
  const calls = writerCalls();
  const app = createApp({
    async dataCorrectionAppointmentResultWriter(payload) {
      calls.appointmentResult.push(payload);
      return { recorded: true };
    },
    async dataCorrectionEvidenceWriter(payload) {
      calls.evidence.push(payload);
      return { persisted: true };
    },
    async dataCorrectionAuditWriter(payload) {
      calls.audit.push(payload);
      return { ok: true };
    },
  });

  assert.deepEqual(calls, writerCalls());

  const response = await requestApp(app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.UNABLE_TO_COMPLETE_RESULT,
    unablePayload({
      result: {
        reasonCode: 'unable_to_complete',
        terminalState: TERMINAL_STATES.UNABLE_TO_COMPLETE,
        note: 'site condition mismatch',
        evidenceRefs: ['photo_ref_test_001'],
        finalAppointmentId: 'final_appointment_should_not_leak',
      },
    }),
  ), {
    userId: 'engineer_data_correction_app_001',
    role: 'engineer',
    permissions: ['appointment.result.record'],
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'ok');
  assert.equal(response.body.result.fieldServiceReportCreated, false);
  assert.equal(calls.appointmentResult.length, 1);
  assert.equal(calls.evidence.length, 1);
  assert.equal(calls.audit.length, 1);
  assertSafeOutput([response.body, calls]);
});

test('createApp handles async unable-to-complete shortcut writer failure safely', async () => {
  const app = createApp({
    async dataCorrectionAppointmentResultWriter() {
      return { recorded: false, rawError: 'writer_failure_should_not_leak' };
    },
  });

  const response = await requestApp(app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.UNABLE_TO_COMPLETE_RESULT,
    unablePayload(),
  ), {
    userId: 'engineer_data_correction_app_001',
    role: 'engineer',
    permissions: ['appointment.result.record'],
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'failed');
  assert.equal(response.body.safeMessageKey, 'appointmentResult.writerFailed');
  assertSafeOutput(response.body);
});

test('createApp awaits async follow-up proposal shortcut writers', async () => {
  const calls = writerCalls();
  const app = createApp({
    async dataCorrectionFollowUpDraftWriter(payload) {
      calls.followUpDraft.push(payload);
      return { recorded: true };
    },
    async dataCorrectionDispatchNoteWriter(payload) {
      calls.dispatchNote.push(payload);
      return { persisted: true };
    },
    async dataCorrectionAuditWriter(payload) {
      calls.audit.push(payload);
      return { ok: true };
    },
  });

  assert.deepEqual(calls, writerCalls());

  const response = await requestApp(app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.FOLLOW_UP_PROPOSAL,
    followUpPayload({
      proposal: {
        proposalType: FOLLOW_UP_PROPOSAL_TYPES.FOLLOW_UP_APPOINTMENT,
        reasonCode: 'follow_up_required',
        note: 'schedule follow up',
        requiredPartsRefs: ['part_ref_test_001'],
        finalAppointmentId: 'final_appointment_should_not_leak',
      },
    }),
  ), {});

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'ok');
  assert.equal(response.body.result.formalAppointmentCreated, false);
  assert.equal(calls.followUpDraft.length, 1);
  assert.equal(calls.dispatchNote.length, 1);
  assert.equal(calls.audit.length, 1);
  assertSafeOutput([response.body, calls]);
});

test('createApp handles async follow-up proposal shortcut writer failure safely', async () => {
  const app = createApp({
    async dataCorrectionFollowUpDraftWriter() {
      return { recorded: false, rawError: 'writer_failure_should_not_leak' };
    },
  });

  const response = await requestApp(app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.FOLLOW_UP_PROPOSAL,
    followUpPayload(),
  ), {});

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'failed');
  assert.equal(response.body.safeMessageKey, 'followUpProposal.writerFailed');
  assertSafeOutput(response.body);
});

test('createApp supports dataCorrection writer set shortcut option', async () => {
  const calls = writerCalls();
  const app = createApp({
    dataCorrectionWriterSet: appDataCorrectionOptions(calls),
  });

  assert.deepEqual(calls, writerCalls());

  const response = await requestApp(app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.PRE_DEPARTURE_APPLY,
    correctionPayload(),
  ), {});

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'ok');
  assert.equal(calls.correction.length, 1);
  assertSafeOutput([response.body, calls]);
});

test('createApp awaits async dataCorrection writer set shortcut option', async () => {
  const calls = writerCalls();
  const app = createApp({
    dataCorrectionWriterSet: {
      async followUpDraftWriter(payload) {
        calls.followUpDraft.push(payload);
        return { recorded: true };
      },
      async dispatchNoteWriter(payload) {
        calls.dispatchNote.push(payload);
        return { persisted: true };
      },
      async auditWriter(payload) {
        calls.audit.push(payload);
        return { ok: true };
      },
    },
  });

  assert.deepEqual(calls, writerCalls());

  const response = await requestApp(app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.FOLLOW_UP_PROPOSAL,
    followUpPayload(),
  ), {});

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'ok');
  assert.equal(response.body.result.formalAppointmentCreated, false);
  assert.equal(calls.followUpDraft.length, 1);
  assert.equal(calls.dispatchNote.length, 1);
  assert.equal(calls.audit.length, 1);
  assertSafeOutput([response.body, calls]);
});

test('createApp awaits async dataCorrection request writers through writer set shortcut', async () => {
  const calls = writerCalls();
  const app = createApp({
    dataCorrectionWriterSet: {
      async correctionWriter(payload) {
        calls.correction.push(payload);
        return { persisted: true };
      },
      async contactLogWriter(payload) {
        await Promise.resolve();
        calls.contactLog.push(payload);
        return { recorded: true };
      },
      async dispatchNoteWriter(payload) {
        await Promise.resolve();
        calls.dispatchNote.push(payload);
        return { persisted: true };
      },
      async auditWriter(payload) {
        await Promise.resolve();
        calls.audit.push(payload);
        return { ok: true };
      },
    },
  });

  assert.deepEqual(calls, writerCalls());

  const response = await requestApp(app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.DATA_CORRECTION_REQUEST,
    correctionPayload({
      appointmentContext: {
        appointmentId: 'apt_data_correction_app_001',
        engineerReceivedTask: true,
        engineerDeparted: true,
        routeStarted: false,
        arrived: false,
      },
    }),
  ), {});

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'ok');
  assert.equal(response.body.result.manualHandlingRequired, true);
  assert.equal(calls.correction.length, 0);
  assert.equal(calls.contactLog.length, 1);
  assert.equal(calls.dispatchNote.length, 1);
  assert.equal(calls.audit.length, 1);
  assertSafeOutput([response.body, calls]);
});

test('createApp dataCorrection request success envelope redacts writer internals', async () => {
  const calls = writerCalls();
  const app = createApp({
    dataCorrectionWriterSet: {
      async correctionWriter(payload) {
        calls.correction.push(payload);
        return {
          persisted: true,
          rawAddress: 'raw_address_should_not_leak',
        };
      },
      async contactLogWriter(payload) {
        await Promise.resolve();
        calls.contactLog.push(payload);
        return {
          recorded: true,
          fullPhone: 'raw_phone_should_not_leak',
        };
      },
      async dispatchNoteWriter(payload) {
        await Promise.resolve();
        calls.dispatchNote.push(payload);
        return {
          persisted: true,
          internalNote: 'internal_note_should_not_leak',
        };
      },
      async auditWriter(payload) {
        await Promise.resolve();
        calls.audit.push(payload);
        return {
          ok: true,
          rawPayload: 'audit_raw_should_not_leak',
          token: 'token_should_not_leak',
        };
      },
    },
  });

  const response = await requestApp(app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.DATA_CORRECTION_REQUEST,
    correctionPayload({
      appointmentContext: {
        appointmentId: 'apt_data_correction_app_001',
        engineerReceivedTask: true,
        engineerDeparted: true,
        routeStarted: false,
        arrived: false,
      },
    }),
  ), {});

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'ok');
  assert.equal(response.body.safeMessageKey, 'dataCorrection.unavailable');
  assert.equal(response.body.result.manualHandlingRequired, true);
  assert.equal(response.body.result.correctionApplicationReady, false);
  assert.deepEqual(response.body.result.writerResults, {
    audit: {
      status: 'recorded',
    },
    contactLog: {
      status: 'recorded',
    },
    dispatchNote: {
      status: 'recorded',
    },
  });
  assert.equal(calls.correction.length, 0);
  assert.equal(calls.contactLog.length, 1);
  assert.equal(calls.dispatchNote.length, 1);
  assert.equal(calls.audit.length, 1);
  assertSafeOutput([response.body, calls]);
});

test('createApp invalid dataCorrection request fail-closes before manual writers', async () => {
  const calls = writerCalls();
  const app = createApp({
    dataCorrection: appDataCorrectionOptions(calls),
  });

  const response = await requestApp(app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.DATA_CORRECTION_REQUEST,
    correctionPayload({
      appointmentContext: {
        appointmentId: 'apt_data_correction_app_001',
        engineerReceivedTask: true,
        engineerDeparted: true,
        routeStarted: false,
        arrived: false,
      },
      correction: {
        fromValue: 'old_value_should_not_leak',
        toValue: 'new_value_should_not_leak',
        rawPhone: 'raw_phone_should_not_leak',
        rawAddress: 'raw_address_should_not_leak',
        token: 'token_should_not_leak',
        secret: 'secret_should_not_leak',
        validationDebug: 'validation_internal_should_not_leak',
      },
    }),
  ), {});
  const serialized = JSON.stringify(response.body);

  assert.equal(response.statusCode, 403);
  assert.equal(response.body.status, 'deny');
  assert.equal(response.body.safeMessageKey, 'dataCorrection.forbidden');
  assert.equal(calls.audit.length, 0);
  assert.equal(calls.contactLog.length, 0);
  assert.equal(calls.dispatchNote.length, 0);
  assert.equal(calls.correction.length, 0);
  assert.equal(serialized.includes('validation_internal_should_not_leak'), false);
  assertSafeOutput([response.body, calls]);
});

test('createApp supports dataCorrection repository shortcut option', async () => {
  const calls = writerCalls();
  const repositoryCalls = [];
  const app = createApp({
    dataCorrectionRepository: {
      getWriterSet() {
        repositoryCalls.push('getWriterSet');
        return appDataCorrectionOptions(calls);
      },
    },
  });

  assert.deepEqual(repositoryCalls, ['getWriterSet']);
  assert.deepEqual(calls, writerCalls());

  const response = await requestApp(app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.PRE_DEPARTURE_APPLY,
    correctionPayload(),
  ), {});

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'ok');
  assert.equal(calls.correction.length, 1);
  assertSafeOutput([response.body, calls, repositoryCalls]);
});

test('createApp awaits async dataCorrection repository writer set shortcut option', async () => {
  const calls = writerCalls();
  const repositoryCalls = [];
  const app = createApp({
    dataCorrectionRepository: {
      getWriterSet() {
        repositoryCalls.push('getWriterSet');
        return {
          async followUpDraftWriter(payload) {
            calls.followUpDraft.push(payload);
            return { recorded: true };
          },
          async dispatchNoteWriter(payload) {
            calls.dispatchNote.push(payload);
            return { persisted: true };
          },
          async auditWriter(payload) {
            calls.audit.push(payload);
            return { ok: true };
          },
        };
      },
    },
  });

  assert.deepEqual(repositoryCalls, ['getWriterSet']);
  assert.deepEqual(calls, writerCalls());

  const response = await requestApp(app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.FOLLOW_UP_PROPOSAL,
    followUpPayload(),
  ), {});

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'ok');
  assert.equal(response.body.result.formalAppointmentCreated, false);
  assert.equal(calls.followUpDraft.length, 1);
  assert.equal(calls.dispatchNote.length, 1);
  assert.equal(calls.audit.length, 1);
  assertSafeOutput([response.body, calls, repositoryCalls]);
});

test('createApp awaits async persistence repository through dataCorrectionRepository shortcut option', async () => {
  const { capturedSpecs, repository } = createAsyncPersistenceRepositoryShortcut();
  const app = createApp({
    dataCorrectionRepository: repository,
  });

  assert.deepEqual(capturedSpecs, []);

  const response = await requestApp(app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.FOLLOW_UP_PROPOSAL,
    followUpPayload(),
  ), {});

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'ok');
  assert.equal(response.body.result.formalAppointmentCreated, false);
  assert.deepEqual(recordTypes(capturedSpecs), [
    'follow_up_draft',
    'dispatch_note',
    'audit',
  ]);
  assertSafeOutput([response.body, capturedSpecs]);
});

test('createApp dataCorrection request through persistence repository does not write correction application', async () => {
  const { capturedSpecs, repository } = createAsyncPersistenceRepositoryShortcut();
  const app = createApp({
    dataCorrectionRepository: repository,
  });

  const response = await requestApp(app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.DATA_CORRECTION_REQUEST,
    correctionPayload({
      appointmentContext: {
        appointmentId: 'apt_data_correction_app_001',
        engineerReceivedTask: true,
        engineerDeparted: true,
        routeStarted: false,
        arrived: false,
      },
    }),
  ), {});

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'ok');
  assert.equal(response.body.result.manualHandlingRequired, true);
  assert.deepEqual(recordTypes(capturedSpecs), [
    'audit',
    'contact_log',
    'dispatch_note',
  ]);
  assert.equal(recordTypes(capturedSpecs).includes('correction_application'), false);
  assertSafeOutput([response.body, capturedSpecs]);
});

test('createApp dataCorrection request through failing persistence repository remains safe', async () => {
  const { capturedSpecs, repository } = createAsyncPersistenceRepositoryShortcut({
    rejectExecutor: true,
  });
  const app = createApp({
    dataCorrectionRepository: repository,
  });

  const response = await requestApp(app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.DATA_CORRECTION_REQUEST,
    correctionPayload({
      appointmentContext: {
        appointmentId: 'apt_data_correction_app_001',
        engineerReceivedTask: true,
        engineerDeparted: true,
        routeStarted: false,
        arrived: false,
      },
    }),
  ), {});

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'failed');
  assert.equal(response.body.safeMessageKey, 'dataCorrection.writerFailed');
  assert.equal(response.body.result.manualHandlingRequired, true);
  assert.deepEqual(recordTypes(capturedSpecs), [
    'audit',
    'contact_log',
    'dispatch_note',
  ]);
  assert.equal(recordTypes(capturedSpecs).includes('correction_application'), false);
  assert.equal(response.body.result.writerResults.audit.status, 'failed');
  assert.equal(response.body.result.writerResults.contactLog.status, 'failed');
  assert.equal(response.body.result.writerResults.dispatchNote.status, 'failed');
  assertSafeOutput([response.body, capturedSpecs]);
});

test('createApp dataCorrection request through queryExecutor persistence repository does not write correction application', async () => {
  const { capturedSpecs, repository } = createAsyncPersistenceRepositoryShortcut({
    useQueryExecutor: true,
  });
  const app = createApp({
    dataCorrectionRepository: repository,
  });

  const response = await requestApp(app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.DATA_CORRECTION_REQUEST,
    correctionPayload({
      appointmentContext: {
        appointmentId: 'apt_data_correction_app_001',
        engineerReceivedTask: true,
        engineerDeparted: true,
        routeStarted: false,
        arrived: false,
      },
    }),
  ), {});

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'ok');
  assert.equal(response.body.result.manualHandlingRequired, true);
  assert.deepEqual(recordTypes(capturedSpecs), [
    'audit',
    'contact_log',
    'dispatch_note',
  ]);
  assert.equal(recordTypes(capturedSpecs).includes('correction_application'), false);
  assertSafeOutput([response.body, capturedSpecs]);
});

test('createApp dataCorrection request through failing queryExecutor persistence repository remains safe', async () => {
  const { capturedSpecs, repository } = createAsyncPersistenceRepositoryShortcut({
    rejectExecutor: true,
    useQueryExecutor: true,
  });
  const app = createApp({
    dataCorrectionRepository: repository,
  });

  const response = await requestApp(app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.DATA_CORRECTION_REQUEST,
    correctionPayload({
      appointmentContext: {
        appointmentId: 'apt_data_correction_app_001',
        engineerReceivedTask: true,
        engineerDeparted: true,
        routeStarted: false,
        arrived: false,
      },
    }),
  ), {});

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'failed');
  assert.equal(response.body.safeMessageKey, 'dataCorrection.writerFailed');
  assert.equal(response.body.result.manualHandlingRequired, true);
  assert.deepEqual(recordTypes(capturedSpecs), [
    'audit',
    'contact_log',
    'dispatch_note',
  ]);
  assert.equal(recordTypes(capturedSpecs).includes('correction_application'), false);
  assert.equal(response.body.result.writerResults.audit.status, 'failed');
  assert.equal(response.body.result.writerResults.contactLog.status, 'failed');
  assert.equal(response.body.result.writerResults.dispatchNote.status, 'failed');
  assertSafeOutput([response.body, capturedSpecs]);
});

test('createApp awaits async persistence repository with queryExecutor alias through dataCorrectionRepository shortcut option', async () => {
  const { capturedSpecs, repository } = createAsyncPersistenceRepositoryShortcut({
    useQueryExecutor: true,
  });
  const app = createApp({
    dataCorrectionRepository: repository,
  });

  const response = await requestApp(app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.FOLLOW_UP_PROPOSAL,
    followUpPayload(),
  ), {});

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'ok');
  assert.equal(response.body.result.formalAppointmentCreated, false);
  assert.deepEqual(recordTypes(capturedSpecs), [
    'follow_up_draft',
    'dispatch_note',
    'audit',
  ]);
  assertSafeOutput([response.body, capturedSpecs]);
});

test('createApp handles async persistence repository shortcut failure safely', async () => {
  const { capturedSpecs, repository } = createAsyncPersistenceRepositoryShortcut({
    rejectExecutor: true,
  });
  const app = createApp({
    dataCorrectionRepository: repository,
  });

  const response = await requestApp(app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.FOLLOW_UP_PROPOSAL,
    followUpPayload(),
  ), {});

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'failed');
  assert.equal(response.body.safeMessageKey, 'followUpProposal.writerFailed');
  assert.deepEqual(recordTypes(capturedSpecs), [
    'follow_up_draft',
    'dispatch_note',
    'audit',
  ]);
  assertSafeOutput([response.body, capturedSpecs]);
});

test('createApp maps all dataCorrection shortcut writers to governance paths', async () => {
  const calls = writerCalls();
  const app = createApp({
    dataCorrectionAppointmentResultWriter(payload) {
      calls.appointmentResult.push(payload);
    },
    dataCorrectionAuditWriter(payload) {
      calls.audit.push(payload);
    },
    dataCorrectionContactLogWriter(payload) {
      calls.contactLog.push(payload);
    },
    dataCorrectionCorrectionWriter(payload) {
      calls.correction.push(payload);
    },
    dataCorrectionDispatchNoteWriter(payload) {
      calls.dispatchNote.push(payload);
    },
    dataCorrectionEngineerNotificationWriter(payload) {
      calls.engineerNotification.push(payload);
    },
    dataCorrectionEvidenceWriter(payload) {
      calls.evidence.push(payload);
    },
    dataCorrectionFollowUpDraftWriter(payload) {
      calls.followUpDraft.push(payload);
    },
  });

  const preDepartureResponse = await requestApp(app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.PRE_DEPARTURE_APPLY,
    correctionPayload({
      appointmentContext: {
        appointmentId: 'apt_data_correction_app_001',
        engineerReceivedTask: true,
        engineerDeparted: false,
        routeStarted: false,
        arrived: false,
      },
    }),
  ), {});
  const postDepartureResponse = await requestApp(app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.POST_DEPARTURE_FREEZE,
    correctionPayload({
      appointmentContext: {
        appointmentId: 'apt_data_correction_app_001',
        engineerReceivedTask: true,
        engineerDeparted: true,
        routeStarted: false,
        arrived: false,
      },
    }),
  ), {});
  const unableResponse = await requestApp(app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.UNABLE_TO_COMPLETE_RESULT,
    unablePayload({
      result: {
        reasonCode: 'unable_to_complete',
        terminalState: TERMINAL_STATES.UNABLE_TO_COMPLETE,
        note: 'site condition mismatch',
        evidenceRefs: ['photo_ref_test_001'],
        finalAppointmentId: 'final_appointment_should_not_leak',
      },
    }),
  ), {
    userId: 'engineer_data_correction_app_001',
    role: 'engineer',
    permissions: ['appointment.result.record'],
  });
  const followUpResponse = await requestApp(app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.FOLLOW_UP_PROPOSAL,
    followUpPayload(),
  ), {});

  assert.equal(preDepartureResponse.statusCode, 200);
  assert.equal(postDepartureResponse.statusCode, 200);
  assert.equal(unableResponse.statusCode, 200);
  assert.equal(followUpResponse.statusCode, 200);
  assert.equal(calls.correction.length, 1);
  assert.equal(calls.engineerNotification.length, 2);
  assert.equal(calls.contactLog.length, 1);
  assert.equal(calls.appointmentResult.length, 1);
  assert.equal(calls.evidence.length, 1);
  assert.equal(calls.followUpDraft.length, 1);
  assert.ok(calls.dispatchNote.length >= 2);
  assert.ok(calls.audit.length >= 3);
  assertSafeOutput([
    preDepartureResponse.body,
    postDepartureResponse.body,
    unableResponse.body,
    followUpResponse.body,
    calls,
  ]);
});

test('createApp explicit dataCorrection options take priority over shortcuts', async () => {
  const nestedCalls = [];
  const shortcutCalls = [];
  const app = createApp({
    dataCorrection: {
      correctionWriter(payload) {
        nestedCalls.push(payload);
      },
    },
    dataCorrectionCorrectionWriter(payload) {
      shortcutCalls.push(payload);
    },
  });
  const response = await requestApp(app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.PRE_DEPARTURE_APPLY,
    correctionPayload(),
  ), {});

  assert.equal(response.statusCode, 200);
  assert.equal(nestedCalls.length, 1);
  assert.equal(shortcutCalls.length, 0);
  assertSafeOutput([response.body, nestedCalls, shortcutCalls]);
});

test('createApp explicit dataCorrection options take priority over writer set shortcut', async () => {
  const nestedCalls = writerCalls();
  const writerSetShortcutCalls = writerCalls();
  const app = createApp({
    dataCorrection: appDataCorrectionOptions(nestedCalls),
    dataCorrectionWriterSet: appDataCorrectionOptions(writerSetShortcutCalls),
  });
  const response = await requestApp(app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.PRE_DEPARTURE_APPLY,
    correctionPayload(),
  ), {});

  assert.equal(response.statusCode, 200);
  assert.equal(nestedCalls.correction.length, 1);
  assert.deepEqual(writerSetShortcutCalls, writerCalls());
  assertSafeOutput([response.body, nestedCalls, writerSetShortcutCalls]);
});

test('createApp explicit dataCorrection options take priority over repository shortcut', async () => {
  const nestedCalls = writerCalls();
  const repositoryCalls = writerCalls();
  const app = createApp({
    dataCorrection: appDataCorrectionOptions(nestedCalls),
    dataCorrectionRepository: {
      getWriterSet() {
        return appDataCorrectionOptions(repositoryCalls);
      },
    },
  });

  const response = await requestApp(app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.PRE_DEPARTURE_APPLY,
    correctionPayload(),
  ), {});

  assert.equal(response.statusCode, 200);
  assert.equal(nestedCalls.correction.length, 1);
  assert.deepEqual(repositoryCalls, writerCalls());
  assertSafeOutput([response.body, nestedCalls, repositoryCalls]);
});

test('createApp explicit dataCorrection request options override repository shortcut without correction application', async () => {
  const nestedCalls = writerCalls();
  const repositoryCalls = writerCalls();
  const app = createApp({
    dataCorrection: appDataCorrectionOptions(nestedCalls),
    dataCorrectionRepository: {
      getWriterSet() {
        return appDataCorrectionOptions(repositoryCalls);
      },
    },
  });

  const response = await requestApp(app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.DATA_CORRECTION_REQUEST,
    correctionPayload({
      appointmentContext: {
        appointmentId: 'apt_data_correction_app_001',
        engineerReceivedTask: true,
        engineerDeparted: true,
        routeStarted: false,
        arrived: false,
      },
    }),
  ), {});

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.result.manualHandlingRequired, true);
  assert.equal(response.body.result.correctionApplicationReady, false);
  assert.equal(response.body.result.writerResults.correction, undefined);
  assert.equal(nestedCalls.audit.length, 1);
  assert.equal(nestedCalls.contactLog.length, 1);
  assert.equal(nestedCalls.dispatchNote.length, 1);
  assert.equal(nestedCalls.correction.length, 0);
  assert.deepEqual(repositoryCalls, writerCalls());
  assertSafeOutput([response.body, nestedCalls, repositoryCalls]);
});

test('createApp dataCorrection writer set shortcut takes priority over repository shortcut', async () => {
  const writerSetCalls = writerCalls();
  const repositoryCalls = writerCalls();
  const app = createApp({
    dataCorrectionWriterSet: appDataCorrectionOptions(writerSetCalls),
    dataCorrectionRepository: {
      getWriterSet() {
        return appDataCorrectionOptions(repositoryCalls);
      },
    },
  });

  const response = await requestApp(app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.PRE_DEPARTURE_APPLY,
    correctionPayload(),
  ), {});

  assert.equal(response.statusCode, 200);
  assert.equal(writerSetCalls.correction.length, 1);
  assert.deepEqual(repositoryCalls, writerCalls());
  assertSafeOutput([response.body, writerSetCalls, repositoryCalls]);
});

test('createApp dataCorrection request writer set shortcut overrides repository without correction application', async () => {
  const writerSetCalls = writerCalls();
  const repositoryCalls = writerCalls();
  const app = createApp({
    dataCorrectionWriterSet: appDataCorrectionOptions(writerSetCalls),
    dataCorrectionRepository: {
      getWriterSet() {
        return appDataCorrectionOptions(repositoryCalls);
      },
    },
  });

  const response = await requestApp(app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.DATA_CORRECTION_REQUEST,
    correctionPayload({
      appointmentContext: {
        appointmentId: 'apt_data_correction_app_001',
        engineerReceivedTask: true,
        engineerDeparted: true,
        routeStarted: false,
        arrived: false,
      },
    }),
  ), {});

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.result.manualHandlingRequired, true);
  assert.equal(response.body.result.correctionApplicationReady, false);
  assert.equal(response.body.result.writerResults.correction, undefined);
  assert.equal(writerSetCalls.audit.length, 1);
  assert.equal(writerSetCalls.contactLog.length, 1);
  assert.equal(writerSetCalls.dispatchNote.length, 1);
  assert.equal(writerSetCalls.correction.length, 0);
  assert.deepEqual(repositoryCalls, writerCalls());
  assertSafeOutput([response.body, writerSetCalls, repositoryCalls]);
});

test('createApp explicit dataCorrection options take priority over all shortcut writers', async () => {
  const nestedCalls = writerCalls();
  const shortcutCalls = writerCalls();
  const app = createApp({
    dataCorrection: appDataCorrectionOptions(nestedCalls),
    dataCorrectionAppointmentResultWriter(payload) {
      shortcutCalls.appointmentResult.push(payload);
    },
    dataCorrectionAuditWriter(payload) {
      shortcutCalls.audit.push(payload);
    },
    dataCorrectionContactLogWriter(payload) {
      shortcutCalls.contactLog.push(payload);
    },
    dataCorrectionCorrectionWriter(payload) {
      shortcutCalls.correction.push(payload);
    },
    dataCorrectionDispatchNoteWriter(payload) {
      shortcutCalls.dispatchNote.push(payload);
    },
    dataCorrectionEngineerNotificationWriter(payload) {
      shortcutCalls.engineerNotification.push(payload);
    },
    dataCorrectionEvidenceWriter(payload) {
      shortcutCalls.evidence.push(payload);
    },
    dataCorrectionFollowUpDraftWriter(payload) {
      shortcutCalls.followUpDraft.push(payload);
    },
  });

  const preDepartureResponse = await requestApp(app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.PRE_DEPARTURE_APPLY,
    correctionPayload({
      appointmentContext: {
        appointmentId: 'apt_data_correction_app_001',
        engineerReceivedTask: true,
        engineerDeparted: false,
        routeStarted: false,
        arrived: false,
      },
    }),
  ), {});
  const postDepartureResponse = await requestApp(app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.POST_DEPARTURE_FREEZE,
    correctionPayload({
      appointmentContext: {
        appointmentId: 'apt_data_correction_app_001',
        engineerReceivedTask: true,
        engineerDeparted: true,
        routeStarted: false,
        arrived: false,
      },
    }),
  ), {});
  const unableResponse = await requestApp(app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.UNABLE_TO_COMPLETE_RESULT,
    unablePayload({
      result: {
        reasonCode: 'unable_to_complete',
        terminalState: TERMINAL_STATES.UNABLE_TO_COMPLETE,
        note: 'site condition mismatch',
        evidenceRefs: ['photo_ref_test_001'],
        finalAppointmentId: 'final_appointment_should_not_leak',
      },
    }),
  ), {
    userId: 'engineer_data_correction_app_001',
    role: 'engineer',
    permissions: ['appointment.result.record'],
  });
  const followUpResponse = await requestApp(app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.FOLLOW_UP_PROPOSAL,
    followUpPayload(),
  ), {});

  assert.equal(preDepartureResponse.statusCode, 200);
  assert.equal(postDepartureResponse.statusCode, 200);
  assert.equal(unableResponse.statusCode, 200);
  assert.equal(followUpResponse.statusCode, 200);
  assert.equal(nestedCalls.correction.length, 1);
  assert.equal(nestedCalls.engineerNotification.length, 2);
  assert.equal(nestedCalls.contactLog.length, 1);
  assert.equal(nestedCalls.appointmentResult.length, 1);
  assert.equal(nestedCalls.evidence.length, 1);
  assert.equal(nestedCalls.followUpDraft.length, 1);
  assert.ok(nestedCalls.dispatchNote.length >= 2);
  assert.ok(nestedCalls.audit.length >= 3);
  assert.deepEqual(shortcutCalls, writerCalls());
  assertSafeOutput([
    preDepartureResponse.body,
    postDepartureResponse.body,
    unableResponse.body,
    followUpResponse.body,
    nestedCalls,
    shortcutCalls,
  ]);
});

test('phone correction through app requires reverification and does not call correctionWriter', async () => {
  const correctionCalls = [];
  const app = createApp({
    dataCorrection: {
      correctionWriter(payload) {
        correctionCalls.push(payload);
      },
    },
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
  ), {});

  assert.equal(response.statusCode, 403);
  assert.equal(response.body.status, 'deny');
  assert.equal(response.body.phoneReverificationRequired, true);
  assert.equal(correctionCalls.length, 0);
  assertSafeOutput(response.body);
});

test('post-departure freeze through app calls contact, dispatch, and audit writers', async () => {
  const contactLogCalls = [];
  const dispatchNoteCalls = [];
  const auditCalls = [];
  const app = createApp({
    dataCorrection: {
      contactLogWriter(payload) {
        contactLogCalls.push(payload);
      },
      dispatchNoteWriter(payload) {
        dispatchNoteCalls.push(payload);
      },
      auditWriter(payload) {
        auditCalls.push(payload);
      },
    },
  });
  const response = await requestApp(app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.POST_DEPARTURE_FREEZE,
    correctionPayload({
      appointmentContext: {
        appointmentId: 'apt_data_correction_app_001',
        engineerReceivedTask: true,
        engineerDeparted: true,
        routeStarted: false,
        arrived: false,
      },
    }),
  ), {});

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.result.manualHandlingRequired, true);
  assert.equal(contactLogCalls.length, 1);
  assert.equal(dispatchNoteCalls.length, 1);
  assert.equal(auditCalls.length, 1);
  assertSafeOutput([response.body, contactLogCalls, dispatchNoteCalls, auditCalls]);
});

test('post-departure pre-departure apply through app blocks correction and manual request writers', async () => {
  const calls = writerCalls();
  const repositoryCalls = writerCalls();
  const app = createApp({
    dataCorrection: appDataCorrectionOptions(calls),
    dataCorrectionRepository: {
      getWriterSet() {
        return appDataCorrectionOptions(repositoryCalls);
      },
    },
  });
  const response = await requestApp(app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.PRE_DEPARTURE_APPLY,
    correctionPayload({
      appointmentContext: {
        appointmentId: 'apt_data_correction_app_001',
        engineerReceivedTask: true,
        engineerDeparted: true,
        routeStarted: false,
        arrived: false,
      },
    }),
  ), {});

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'ok');
  assert.equal(response.body.result.allowed, false);
  assert.equal(response.body.result.reasonCode, 'CORRECTION_FROZEN_AFTER_DEPARTURE');
  assert.equal(response.body.result.correctionApplicationReady, false);
  assert.equal(response.body.result.correctionApplied, false);
  assert.equal(response.body.result.manualHandlingRequired, true);
  assert.equal(response.body.result.writerResults.audit.status, 'recorded');
  assert.equal(response.body.result.writerResults.contactLog.status, 'skipped');
  assert.equal(response.body.result.writerResults.dispatchNote.status, 'skipped');
  assert.equal(response.body.result.writerResults.correction, undefined);
  assert.equal(calls.audit.length, 1);
  assert.equal(calls.contactLog.length, 0);
  assert.equal(calls.dispatchNote.length, 0);
  assert.equal(calls.correction.length, 0);
  assert.equal(calls.engineerNotification.length, 0);
  assert.deepEqual(repositoryCalls, writerCalls());
  assertSafeAuditMetadata(calls.audit[0], {
    decision: DATA_CORRECTION_DECISIONS.MANUAL_DISPATCH_CONTACT_REQUIRED,
    reasonCode: 'CORRECTION_FROZEN_AFTER_DEPARTURE',
    safeMessageKey: 'dataCorrection.unavailable',
  });
  assertSafeOutput([response.body, calls, repositoryCalls]);
});

test('pre-departure apply through app calls correction writer without manual request writers', async () => {
  const calls = writerCalls();
  const repositoryCalls = writerCalls();
  const app = createApp({
    dataCorrection: appDataCorrectionOptions(calls),
    dataCorrectionRepository: {
      getWriterSet() {
        return appDataCorrectionOptions(repositoryCalls);
      },
    },
  });
  const response = await requestApp(app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.PRE_DEPARTURE_APPLY,
    correctionPayload({
      appointmentContext: {
        engineerReceivedTask: false,
        engineerDeparted: false,
        routeStarted: false,
        arrived: false,
      },
    }),
  ), {});

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'ok');
  assert.equal(response.body.result.allowed, true);
  assert.equal(response.body.result.reasonCode, 'PRE_DEPARTURE_CORRECTION_ALLOWED');
  assert.equal(response.body.result.correctionApplicationReady, true);
  assert.equal(response.body.result.correctionApplied, true);
  assert.equal(response.body.result.manualHandlingRequired, false);
  assert.equal(response.body.result.writerResults.audit.status, 'recorded');
  assert.equal(response.body.result.writerResults.correction.status, 'recorded');
  assert.equal(response.body.result.writerResults.contactLog, undefined);
  assert.equal(response.body.result.writerResults.dispatchNote, undefined);
  assert.equal(calls.audit.length, 1);
  assert.equal(calls.correction.length, 1);
  assert.equal(calls.contactLog.length, 0);
  assert.equal(calls.dispatchNote.length, 0);
  assert.equal(calls.engineerNotification.length, 0);
  assert.deepEqual(repositoryCalls, writerCalls());
  assertSafeAuditMetadata(calls.audit[0], {
    appointmentId: undefined,
    decision: DATA_CORRECTION_DECISIONS.ALLOW_PRE_DEPARTURE_CORRECTION,
    reasonCode: 'PRE_DEPARTURE_CORRECTION_ALLOWED',
    safeMessageKey: 'dataCorrection.allowed',
  });
  assertSafeOutput([response.body, calls, repositoryCalls]);
});

test('permission-denied data correction request through app does not call manual writers', async () => {
  const calls = writerCalls();
  const app = createApp({
    dataCorrection: appDataCorrectionOptions(calls),
  });
  const response = await requestApp(app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.DATA_CORRECTION_REQUEST,
    correctionPayload({
      appointmentContext: {
        appointmentId: 'apt_data_correction_app_001',
        engineerReceivedTask: true,
        engineerDeparted: true,
        routeStarted: false,
        arrived: false,
      },
    }),
  ), {
    permissions: [],
    permissionDebug: 'case.correction.request_should_not_leak',
  });
  const serialized = JSON.stringify(response.body);

  assert.equal(response.statusCode, 403);
  assert.equal(response.body.status, 'deny');
  assert.equal(response.body.messageKey, 'dataCorrection.unavailable');
  assert.equal(calls.audit.length, 0);
  assert.equal(calls.contactLog.length, 0);
  assert.equal(calls.dispatchNote.length, 0);
  assert.equal(calls.correction.length, 0);
  assert.equal(serialized.includes('case.correction.request_should_not_leak'), false);
  assert.equal(serialized.includes('case.correction.request'), false);
  assert.equal(serialized.includes('data_correction.request'), false);
  assertSafeOutput([response.body, calls]);
});

test('permission-denied pre-departure apply through app does not call correction or manual writers', async () => {
  const calls = writerCalls();
  const repositoryCalls = writerCalls();
  let repositoryShortcutCalled = false;
  const app = createApp({
    dataCorrection: appDataCorrectionOptions(calls),
    dataCorrectionRepository: {
      getWriterSet() {
        repositoryShortcutCalled = true;
        return appDataCorrectionOptions(repositoryCalls);
      },
    },
  });
  const response = await requestApp(app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.PRE_DEPARTURE_APPLY,
    correctionPayload({
      appointmentContext: {
        appointmentId: 'apt_data_correction_app_001',
        engineerReceivedTask: false,
        engineerDeparted: false,
        routeStarted: false,
        arrived: false,
      },
    }),
  ), {
    permissions: [],
    permissionDebug: 'case.correction.apply_should_not_leak',
  });
  const serialized = JSON.stringify(response.body);

  assert.equal(response.statusCode, 403);
  assert.equal(response.body.status, 'deny');
  assert.equal(response.body.messageKey, 'dataCorrection.unavailable');
  assert.equal(response.body.result, undefined);
  assert.deepEqual(calls, writerCalls());
  assert.deepEqual(repositoryCalls, writerCalls());
  assert.equal(repositoryShortcutCalled, false);
  assert.equal(serialized.includes('case.correction.apply_should_not_leak'), false);
  assert.equal(serialized.includes('case.correction.apply'), false);
  assert.equal(serialized.includes('data_correction.apply'), false);
  assertSafeOutput([response.body, calls, repositoryCalls]);
});

test('invalid pre-departure apply through app fail-closes before correction or manual writers', async () => {
  const malformedCorrections = [
    {
      name: 'missing fieldKey',
      correction: {
        fieldGroup: CORRECTION_FIELD_GROUPS.DISPATCH_OPERATIONAL,
        toValue: 'safe updated issue',
        rawPhone: 'raw_phone_should_not_leak',
        rawAddress: 'raw_address_should_not_leak',
        token: 'token_should_not_leak',
        secret: 'secret_should_not_leak',
        validationDebug: 'validation_internal_should_not_leak',
      },
    },
    {
      name: 'blank fieldGroup',
      correction: {
        fieldKey: 'issueSummary',
        fieldGroup: '   ',
        toValue: 'safe updated issue',
        rawPhone: 'raw_phone_should_not_leak',
        rawAddress: 'raw_address_should_not_leak',
        token: 'token_should_not_leak',
        secret: 'secret_should_not_leak',
        validationDebug: 'validation_internal_should_not_leak',
      },
    },
  ];

  for (const { name, correction } of malformedCorrections) {
    const calls = writerCalls();
    const repositoryCalls = writerCalls();
    let repositoryShortcutCalled = false;
    const app = createApp({
      dataCorrection: appDataCorrectionOptions(calls),
      dataCorrectionRepository: {
        getWriterSet() {
          repositoryShortcutCalled = true;
          return appDataCorrectionOptions(repositoryCalls);
        },
      },
    });
    const response = await requestApp(app, body(
      DATA_CORRECTION_GOVERNANCE_ACTIONS.PRE_DEPARTURE_APPLY,
      correctionPayload({
        appointmentContext: {
          appointmentId: 'apt_data_correction_app_001',
          engineerReceivedTask: false,
          engineerDeparted: false,
          routeStarted: false,
          arrived: false,
        },
        correction,
      }),
    ), {});
    const serialized = JSON.stringify(response.body);

    assert.equal(response.statusCode, 403, name);
    assert.equal(response.body.status, 'deny', name);
    assert.equal(response.body.result, undefined, name);
    assert.deepEqual(calls, writerCalls(), name);
    assert.deepEqual(repositoryCalls, writerCalls(), name);
    assert.equal(repositoryShortcutCalled, false, name);
    assert.equal(serialized.includes('validation_internal_should_not_leak'), false, name);
    assertSafeOutput([response.body, calls, repositoryCalls]);
  }
});

test('unable-to-complete result through app calls appointmentResultWriter', async () => {
  const appointmentResultCalls = [];
  const app = createApp({
    dataCorrection: {
      appointmentResultWriter(payload) {
        appointmentResultCalls.push(payload);
      },
    },
  });
  const response = await requestApp(app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.UNABLE_TO_COMPLETE_RESULT,
    unablePayload(),
  ), {
    userId: 'engineer_data_correction_app_001',
    role: 'engineer',
    permissions: ['appointment.result.record'],
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.result.fieldServiceReportCreated, false);
  assert.equal(appointmentResultCalls.length, 1);
  assertSafeOutput([response.body, appointmentResultCalls]);
});

test('follow-up proposal through app calls followUpDraftWriter', async () => {
  const followUpCalls = [];
  const app = createApp({
    dataCorrection: {
      followUpDraftWriter(payload) {
        followUpCalls.push(payload);
      },
    },
  });
  const response = await requestApp(app, body(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.FOLLOW_UP_PROPOSAL,
    followUpPayload(),
  ), {});

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.result.formalAppointmentCreated, false);
  assert.equal(followUpCalls.length, 1);
  assertSafeOutput([response.body, followUpCalls]);
});

test('app.js source does not import DB, repository, external providers, AI, or server bootstrap', () => {
  const source = fs.readFileSync(appFile, 'utf8');
  const specifiers = requireSpecifiers(source);

  assert.equal(specifiers.includes('./routes'), true);
  assert.equal(specifiers.includes('./server'), false);
  assert.equal(source.includes('dataCorrectionRepository'), true);
  assert.equal(source.includes('dataCorrectionWriterSet'), true);
  assert.equal(specifiers.some((specifier) => /db|pool|repositories?|transaction|lineProvider|sms|email|push|rag|vector/i.test(specifier)), false);
  assert.doesNotMatch(source, /app\.listen|server\.listen|createServer|require\(['"]\.\/server['"]\)/);
});
