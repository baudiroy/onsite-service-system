'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Readable, Writable } = require('node:stream');
const test = require('node:test');

const {
  createApp,
} = require('../../src/app');
const {
  createServerBootstrap,
} = require('../../src/server');
const {
  createDataCorrectionAsyncQueryBackedPersistenceWriters,
  createDataCorrectionQueryBackedPersistenceWriters,
} = require('../../src/dataCorrection/dataCorrectionQueryBackedPersistenceWriters');

const testFile = __filename;
const repoRoot = path.resolve(__dirname, '../..');
const queryBackedWriterFile = path.join(
  repoRoot,
  'src/dataCorrection/dataCorrectionQueryBackedPersistenceWriters.js',
);

const ACTIONS = Object.freeze({
  FOLLOW_UP_PROPOSAL: 'follow_up_proposal',
  POST_DEPARTURE_FREEZE: 'post_departure_freeze',
  PRE_DEPARTURE_APPLY: 'pre_departure_apply',
  UNABLE_TO_COMPLETE_RESULT: 'unable_to_complete_result',
});

const FIELD_GROUPS = Object.freeze({
  DISPATCH_OPERATIONAL: 'dispatch_operational',
  PHONE_IDENTITY: 'phone_identity',
});

function createQueryExecutorHarness(options = {}) {
  const calls = [];

  return {
    calls,
    executor(querySpec) {
      calls.push(querySpec);

      if (options.throwOnRecordType === querySpec.recordType) {
        throw new Error('writer_failure_should_not_leak token_should_not_leak');
      }

      if (options.asyncOnRecordType === querySpec.recordType) {
        return Promise.resolve({
          ok: true,
          token: 'token_should_not_leak',
        });
      }

      return {
        ok: true,
        persistedId: `${querySpec.recordType}_should_not_be_reflected`,
      };
    },
    callsByType(recordType) {
      return calls.filter((call) => call.recordType === recordType);
    },
  };
}

function createQueryBackedWriterSet(harness, options = {}) {
  return createDataCorrectionQueryBackedPersistenceWriters({
    allowNonExecutableForTest: options.allowNonExecutableForTest === true,
    executor: harness.executor,
  });
}

function createAsyncQueryBackedWriterSet(harness, options = {}) {
  return createDataCorrectionAsyncQueryBackedPersistenceWriters({
    allowNonExecutableForTest: options.allowNonExecutableForTest === true,
    executor: harness.executor,
  });
}

function auth(overrides = {}) {
  return {
    organizationId: 'org_data_correction_query_e2e_001',
    userId: 'dispatcher_data_correction_query_e2e_001',
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
      caseId: 'case_data_correction_query_e2e_001',
      organizationId: 'org_data_correction_query_e2e_001',
    },
    appointmentContext: {
      appointmentId: 'apt_data_correction_query_e2e_001',
      engineerReceivedTask: false,
      engineerDeparted: false,
      routeStarted: false,
      arrived: false,
    },
    correction: {
      fieldKey: 'issueSummary',
      fieldGroup: FIELD_GROUPS.DISPATCH_OPERATIONAL,
      fromValue: 'old_value_should_not_leak',
      toValue: 'safe updated issue',
      rawPhone: 'raw_phone_should_not_leak',
      rawAddress: 'raw_address_should_not_leak',
      rawLineUserId: 'line_user_should_not_leak',
      line_user_id: 'line_user_should_not_leak',
      token: 'token_should_not_leak',
      secret: 'secret_should_not_leak',
      DATABASE_URL: 'DATABASE_URL_should_not_leak',
      DB_URL: 'DB_URL_should_not_leak',
      POSTGRES_URL: 'POSTGRES_URL_should_not_leak',
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
      caseId: 'case_data_correction_query_e2e_001',
      organizationId: 'org_data_correction_query_e2e_001',
    },
    appointmentContext: {
      appointmentId: 'apt_data_correction_query_e2e_001',
      organizationId: 'org_data_correction_query_e2e_001',
      assignedEngineerId: 'engineer_data_correction_query_e2e_001',
      arrived: true,
    },
    result: {
      reasonCode: 'unable_to_complete',
      terminalState: 'unable_to_complete',
      note: 'site condition mismatch',
      evidenceRefs: ['photo_ref_test_001', 'signature_ref_test_002'],
      finalAppointmentId: 'final_appointment_should_not_leak',
    },
    ...overrides,
  };
}

function followUpPayload(overrides = {}) {
  return {
    caseContext: {
      caseId: 'case_data_correction_query_e2e_001',
      organizationId: 'org_data_correction_query_e2e_001',
    },
    appointmentContext: {
      appointmentId: 'apt_data_correction_query_e2e_001',
      organizationId: 'org_data_correction_query_e2e_001',
      terminalState: 'follow_up_required',
    },
    proposal: {
      proposalType: 'follow_up_appointment',
      reasonCode: 'follow_up_required',
      note: 'schedule follow up',
      requiredPartsRefs: ['part_ref_test_001'],
      finalAppointmentId: 'final_appointment_should_not_leak',
    },
    ...overrides,
  };
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

function assertSafeOutput(value) {
  const serialized = JSON.stringify(value);

  for (const forbiddenValue of [
    'old_value_should_not_leak',
    'new_value_should_not_leak',
    'raw_phone_should_not_leak',
    'raw_address_should_not_leak',
    'line_user_should_not_leak',
    'token_should_not_leak',
    'secret_should_not_leak',
    'password_should_not_leak',
    'DATABASE_URL_should_not_leak',
    'DB_URL_should_not_leak',
    'POSTGRES_URL_should_not_leak',
    'internal_note_should_not_leak',
    'audit_raw_should_not_leak',
    'ai_raw_payload_should_not_leak',
    'final_appointment_should_not_leak',
    'writer_failure_should_not_leak',
  ]) {
    assert.equal(serialized.includes(forbiddenValue), false, `leaked ${forbiddenValue}`);
  }

  for (const forbiddenKey of [
    'fromValue',
    'toValue',
    'rawPhone',
    'rawAddress',
    'rawLineUserId',
    'lineUserId',
    'line_user_id',
    'token',
    'secret',
    'password',
    'DATABASE_URL',
    'DB_URL',
    'POSTGRES_URL',
    'internalNote',
    'auditRawPayload',
    'aiRawPayload',
    'finalAppointmentId',
    'request',
    'req',
    'body',
    'headers',
    'cookies',
  ]) {
    assert.equal(serialized.includes(`"${forbiddenKey}"`), false, `leaked key ${forbiddenKey}`);
  }
}

function assertQuerySpecsSafe(calls) {
  for (const querySpec of calls) {
    assert.equal(querySpec.name, 'dataCorrectionPersistenceInsert');
    assert.equal(querySpec.executable, false);
    assert.equal(Array.isArray(querySpec.fields), true);
    assert.equal(Array.isArray(querySpec.values), true);
    assert.equal(Array.isArray(querySpec.params), true);
    assert.doesNotMatch(querySpec.sql, /raw_phone|raw_address|line_user|token|secret|DATABASE_URL|final_appointment/i);
  }

  assertSafeOutput(calls);
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

test('default non-executable query-backed writers do not call executor and fail downstream safely', async () => {
  const harness = createQueryExecutorHarness();
  const app = createApp({
    dataCorrection: createQueryBackedWriterSet(harness),
  });
  const response = await requestApp(app, body(
    ACTIONS.PRE_DEPARTURE_APPLY,
    correctionPayload(),
  ), {
    role: 'dispatch_assistant',
    permissions: ['case.correction.apply'],
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'failed');
  assert.equal(response.body.result.status, 'failed');
  assert.equal(response.body.result.correctionApplied, false);
  assert.deepEqual(harness.calls, []);
  assertSafeOutput(response.body);
});

test('synthetic sync executor path applies pre-departure correction through mounted app route', async () => {
  const harness = createQueryExecutorHarness();
  const app = createApp({
    dataCorrection: createQueryBackedWriterSet(harness, {
      allowNonExecutableForTest: true,
    }),
  });
  const response = await requestApp(app, body(
    ACTIONS.PRE_DEPARTURE_APPLY,
    correctionPayload(),
  ), {
    role: 'dispatch_assistant',
    permissions: ['case.correction.apply'],
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'ok');
  assert.equal(harness.callsByType('correction_application').length, 1);
  assert.equal(harness.callsByType('audit').length, 1);
  assertSafeOutput([response.body, harness.calls]);
  assertQuerySpecsSafe(harness.calls);
});

test('post-departure freeze calls query executor for contact log dispatch note and audit', async () => {
  const harness = createQueryExecutorHarness();
  const app = createApp({
    dataCorrection: createQueryBackedWriterSet(harness, {
      allowNonExecutableForTest: true,
    }),
  });
  const response = await requestApp(app, body(
    ACTIONS.POST_DEPARTURE_FREEZE,
    correctionPayload({
      appointmentContext: {
        appointmentId: 'apt_data_correction_query_e2e_001',
        engineerReceivedTask: true,
        engineerDeparted: true,
        routeStarted: false,
        arrived: false,
      },
    }),
  ), {
    role: 'dispatch_assistant',
    permissions: ['case.correction.request'],
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'ok');
  assert.equal(harness.callsByType('contact_log').length, 1);
  assert.equal(harness.callsByType('dispatch_note').length, 1);
  assert.equal(harness.callsByType('audit').length, 1);
  assertSafeOutput([response.body, harness.calls]);
  assertQuerySpecsSafe(harness.calls);
});

test('unable-to-complete result calls query executor for appointment result evidence and audit', async () => {
  const harness = createQueryExecutorHarness();
  const app = createApp({
    dataCorrection: createQueryBackedWriterSet(harness, {
      allowNonExecutableForTest: true,
    }),
  });
  const response = await requestApp(app, body(
    ACTIONS.UNABLE_TO_COMPLETE_RESULT,
    unablePayload(),
  ), {
    userId: 'engineer_data_correction_query_e2e_001',
    role: 'engineer',
    permissions: ['appointment.result.record'],
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'ok');
  assert.equal(harness.callsByType('appointment_result').length, 1);
  assert.equal(harness.callsByType('evidence').length, 1);
  assert.equal(harness.callsByType('audit').length, 1);
  assert.equal(response.body.result.fieldServiceReportCreated, false);
  assertSafeOutput([response.body, harness.calls]);
  assertQuerySpecsSafe(harness.calls);
});

test('follow-up proposal calls query executor for follow-up draft dispatch note and audit', async () => {
  const harness = createQueryExecutorHarness();
  const app = createApp({
    dataCorrection: createQueryBackedWriterSet(harness, {
      allowNonExecutableForTest: true,
    }),
  });
  const response = await requestApp(app, body(
    ACTIONS.FOLLOW_UP_PROPOSAL,
    followUpPayload(),
  ), {
    role: 'dispatch_assistant',
    permissions: ['appointment.follow_up.propose'],
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'ok');
  assert.equal(harness.callsByType('follow_up_draft').length, 1);
  assert.equal(harness.callsByType('dispatch_note').length, 1);
  assert.equal(harness.callsByType('audit').length, 1);
  for (const querySpec of harness.calls) {
    assert.equal(querySpec.params.includes('appointmentId'), true);
    assert.equal(querySpec.params.includes('sourceAppointmentId'), false);
    assert.equal(querySpec.values.includes('apt_data_correction_query_e2e_001'), true);
  }
  assert.equal(response.body.result.formalAppointmentCreated, false);
  assertSafeOutput([response.body, harness.calls]);
  assertQuerySpecsSafe(harness.calls);
});

test('phone correction returns re-verification and does not call correction application executor', async () => {
  const harness = createQueryExecutorHarness();
  const app = createApp({
    dataCorrection: createQueryBackedWriterSet(harness, {
      allowNonExecutableForTest: true,
    }),
  });
  const response = await requestApp(app, body(
    ACTIONS.PRE_DEPARTURE_APPLY,
    correctionPayload({
      correction: {
        fieldKey: 'phoneNumber',
        fieldGroup: FIELD_GROUPS.PHONE_IDENTITY,
        toValue: 'raw_phone_should_not_leak',
      },
    }),
  ), {
    role: 'dispatch_assistant',
    permissions: ['case.correction.apply'],
  });

  assert.equal(response.statusCode, 403);
  assert.equal(response.body.phoneReverificationRequired, true);
  assert.equal(harness.callsByType('correction_application').length, 0);
  assertSafeOutput([response.body, harness.calls]);
  assertQuerySpecsSafe(harness.calls);
});

test('AI role is denied before query executor', async () => {
  const harness = createQueryExecutorHarness();
  const app = createApp({
    dataCorrection: createQueryBackedWriterSet(harness, {
      allowNonExecutableForTest: true,
    }),
  });
  const response = await requestApp(app, body(
    ACTIONS.PRE_DEPARTURE_APPLY,
    correctionPayload(),
  ), {
    role: 'ai',
    permissions: ['case.correction.apply'],
  });

  assert.equal(response.statusCode, 403);
  assert.deepEqual(harness.calls, []);
  assertSafeOutput(response.body);
});

test('query executor throw returns safe failure without raw error leak', async () => {
  const harness = createQueryExecutorHarness({
    throwOnRecordType: 'correction_application',
  });
  const app = createApp({
    dataCorrection: createQueryBackedWriterSet(harness, {
      allowNonExecutableForTest: true,
    }),
  });
  const response = await requestApp(app, body(
    ACTIONS.PRE_DEPARTURE_APPLY,
    correctionPayload(),
  ), {
    role: 'dispatch_assistant',
    permissions: ['case.correction.apply'],
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'failed');
  assert.equal(harness.callsByType('correction_application').length, 1);
  assertSafeOutput([response.body, harness.calls]);
  assertQuerySpecsSafe(harness.calls);
});

test('async executor is rejected and not treated as downstream success', async () => {
  const harness = createQueryExecutorHarness({
    asyncOnRecordType: 'correction_application',
  });
  const app = createApp({
    dataCorrection: createQueryBackedWriterSet(harness, {
      allowNonExecutableForTest: true,
    }),
  });
  const response = await requestApp(app, body(
    ACTIONS.PRE_DEPARTURE_APPLY,
    correctionPayload(),
  ), {
    role: 'dispatch_assistant',
    permissions: ['case.correction.apply'],
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'failed');
  assert.equal(response.body.result.correctionApplied, false);
  assert.equal(harness.callsByType('correction_application').length, 1);
  assertSafeOutput([response.body, harness.calls]);
  assertQuerySpecsSafe(harness.calls);
});

test('async query-backed writer set awaits async executor through mounted app route', async () => {
  const harness = createQueryExecutorHarness({
    asyncOnRecordType: 'correction_application',
  });
  const app = createApp({
    dataCorrection: createAsyncQueryBackedWriterSet(harness, {
      allowNonExecutableForTest: true,
    }),
  });
  const response = await requestApp(app, body(
    ACTIONS.PRE_DEPARTURE_APPLY,
    correctionPayload(),
  ), {
    role: 'dispatch_assistant',
    permissions: ['case.correction.apply'],
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'ok');
  assert.equal(response.body.result.correctionApplied, true);
  assert.equal(harness.callsByType('correction_application').length, 1);
  assert.equal(harness.callsByType('audit').length, 1);
  assertSafeOutput([response.body, harness.calls]);
  assertQuerySpecsSafe(harness.calls);
});

test('server createServerBootstrap path works with query-backed writers without listen', async () => {
  const harness = createQueryExecutorHarness();
  const bootstrap = createServerBootstrap({
    dataCorrection: createQueryBackedWriterSet(harness, {
      allowNonExecutableForTest: true,
    }),
    port: 4074,
  });

  assert.equal(typeof bootstrap.app.handle, 'function');
  assert.deepEqual(harness.calls, []);

  const response = await requestApp(bootstrap.app, body(
    ACTIONS.PRE_DEPARTURE_APPLY,
    correctionPayload(),
  ), {
    role: 'dispatch_assistant',
    permissions: ['case.correction.apply'],
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'ok');
  assert.equal(harness.callsByType('correction_application').length, 1);
  assertSafeOutput([response.body, harness.calls]);
  assertQuerySpecsSafe(harness.calls);
});

test('server options.app priority bypasses dataCorrection query-backed writers', async () => {
  const ignoredHarness = createQueryExecutorHarness();
  const activeHarness = createQueryExecutorHarness();
  const customApp = createApp({
    dataCorrection: createQueryBackedWriterSet(activeHarness, {
      allowNonExecutableForTest: true,
    }),
  });
  const bootstrap = createServerBootstrap({
    app: customApp,
    dataCorrection: createQueryBackedWriterSet(ignoredHarness, {
      allowNonExecutableForTest: true,
    }),
    port: 4074,
  });
  const response = await requestApp(bootstrap.app, body(
    ACTIONS.PRE_DEPARTURE_APPLY,
    correctionPayload(),
  ), {
    role: 'dispatch_assistant',
    permissions: ['case.correction.apply'],
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'ok');
  assert.equal(activeHarness.callsByType('correction_application').length, 1);
  assert.deepEqual(ignoredHarness.calls, []);
  assertSafeOutput([response.body, activeHarness.calls, ignoredHarness.calls]);
  assertQuerySpecsSafe(activeHarness.calls);
});

test('test and query-backed writer source avoid DB repository provider AI smoke and browser dependencies', () => {
  const testSource = fs.readFileSync(testFile, 'utf8');
  const writerSource = fs.readFileSync(queryBackedWriterFile, 'utf8');
  const specifiers = requireSpecifiers(testSource);

  assert.deepEqual(specifiers.sort(), [
    '../../src/app',
    '../../src/dataCorrection/dataCorrectionQueryBackedPersistenceWriters',
    '../../src/server',
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:stream',
    'node:test',
  ]);
  assert.deepEqual(requireSpecifiers(writerSource), [
    './dataCorrectionPersistenceWriters',
    './dataCorrectionPersistenceRecordMapper',
  ]);
  assert.doesNotMatch(specifiers.join('\n'), /supertest|playwright|browser|smoke|db\/pool|repositories?|transaction|provider|lineProvider|sms|email|push|rag|vector|openai|aiProvider/i);
  assert.doesNotMatch(writerSource, /\b(SELECT|INSERT|UPDATE|DELETE|CREATE TABLE|ALTER TABLE)\b/i);
});
