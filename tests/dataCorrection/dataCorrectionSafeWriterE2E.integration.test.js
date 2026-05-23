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
  createDataCorrectionSafeWriterSet,
} = require('../../src/dataCorrection/dataCorrectionSafeWriters');
const {
  createServerBootstrap,
} = require('../../src/server');

const testFile = __filename;

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

function auth(overrides = {}) {
  return {
    organizationId: 'org_data_correction_safe_writer_e2e_001',
    userId: 'dispatcher_data_correction_safe_writer_e2e_001',
    role: 'dispatch_assistant',
    permissions: ['case.correction.apply'],
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
      caseId: 'case_data_correction_safe_writer_e2e_001',
      organizationId: 'org_data_correction_safe_writer_e2e_001',
    },
    appointmentContext: {
      appointmentId: 'apt_data_correction_safe_writer_e2e_001',
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
      caseId: 'case_data_correction_safe_writer_e2e_001',
      organizationId: 'org_data_correction_safe_writer_e2e_001',
    },
    appointmentContext: {
      appointmentId: 'apt_data_correction_safe_writer_e2e_001',
      organizationId: 'org_data_correction_safe_writer_e2e_001',
      assignedEngineerId: 'engineer_data_correction_safe_writer_e2e_001',
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
      caseId: 'case_data_correction_safe_writer_e2e_001',
      organizationId: 'org_data_correction_safe_writer_e2e_001',
    },
    appointmentContext: {
      appointmentId: 'apt_data_correction_safe_writer_e2e_001',
      organizationId: 'org_data_correction_safe_writer_e2e_001',
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

function writesByType(store, writerType) {
  return store.list().filter((write) => write.writerType === writerType);
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
    'DATABASE_URL',
    'internalNote',
    'auditRawPayload',
    'aiRawPayload',
    'finalAppointmentId',
  ]) {
    assert.equal(serialized.includes(`"${forbiddenKey}"`), false, `leaked key ${forbiddenKey}`);
  }
}

function assertStoreAllowListed(store) {
  const allowedPayloadKeys = new Set([
    'actionType',
    'actorRole',
    'actorUserId',
    'appointmentId',
    'caseId',
    'decision',
    'evidenceRefs',
    'fieldGroup',
    'fieldKey',
    'organizationId',
    'proposalType',
    'reasonCode',
    'requiredPartsRefs',
    'safeMessageKey',
    'terminalState',
    'timestamp',
  ]);

  for (const write of store.list()) {
    assert.equal(typeof write.id, 'string');
    assert.equal(typeof write.writerType, 'string');

    for (const key of Object.keys(write.payload)) {
      assert.equal(allowedPayloadKeys.has(key), true, `unexpected stored key ${key}`);
    }
  }
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

test('createApp path pre-departure apply writes sanitized correction_application record', async () => {
  const writerSet = createDataCorrectionSafeWriterSet();
  const app = createApp({
    dataCorrection: writerSet,
  });
  const response = await requestApp(app, body(
    ACTIONS.PRE_DEPARTURE_APPLY,
    correctionPayload(),
  ), {
    role: 'dispatch_assistant',
    permissions: ['case.correction.apply'],
  });

  assert.equal(response.statusCode, 200);
  assert.equal(writesByType(writerSet.store, 'correction_application').length, 1);
  assert.equal(writesByType(writerSet.store, 'audit').length, 1);
  assertSafeOutput([response.body, writerSet.store.list()]);
  assertStoreAllowListed(writerSet.store);
});

test('createApp path post-departure freeze writes sanitized contact_log, dispatch_note, and audit records', async () => {
  const writerSet = createDataCorrectionSafeWriterSet();
  const app = createApp({
    dataCorrection: writerSet,
  });
  const response = await requestApp(app, body(
    ACTIONS.POST_DEPARTURE_FREEZE,
    correctionPayload({
      appointmentContext: {
        appointmentId: 'apt_data_correction_safe_writer_e2e_001',
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
  assert.equal(writesByType(writerSet.store, 'contact_log').length, 1);
  assert.equal(writesByType(writerSet.store, 'dispatch_note').length, 1);
  assert.equal(writesByType(writerSet.store, 'audit').length, 1);
  assertSafeOutput([response.body, writerSet.store.list()]);
  assertStoreAllowListed(writerSet.store);
});

test('unable-to-complete result writes sanitized appointment_result and audit records with optional evidence', async () => {
  const writerSet = createDataCorrectionSafeWriterSet();
  const app = createApp({
    dataCorrection: writerSet,
  });
  const response = await requestApp(app, body(
    ACTIONS.UNABLE_TO_COMPLETE_RESULT,
    unablePayload(),
  ), {
    userId: 'engineer_data_correction_safe_writer_e2e_001',
    role: 'engineer',
    permissions: ['appointment.result.record'],
  });

  assert.equal(response.statusCode, 200);
  assert.equal(writesByType(writerSet.store, 'appointment_result').length, 1);
  assert.equal(writesByType(writerSet.store, 'audit').length, 1);
  assert.ok(writesByType(writerSet.store, 'evidence').length <= 1);
  assertSafeOutput([response.body, writerSet.store.list()]);
  assertStoreAllowListed(writerSet.store);
});

test('follow-up proposal writes sanitized follow_up_draft, dispatch_note, and audit records', async () => {
  const writerSet = createDataCorrectionSafeWriterSet();
  const app = createApp({
    dataCorrection: writerSet,
  });
  const response = await requestApp(app, body(
    ACTIONS.FOLLOW_UP_PROPOSAL,
    followUpPayload(),
  ), {
    role: 'dispatch_assistant',
    permissions: ['appointment.follow_up.propose'],
  });

  assert.equal(response.statusCode, 200);
  assert.equal(writesByType(writerSet.store, 'follow_up_draft').length, 1);
  assert.equal(writesByType(writerSet.store, 'dispatch_note').length, 1);
  assert.equal(writesByType(writerSet.store, 'audit').length, 1);
  assert.deepEqual(writesByType(writerSet.store, 'follow_up_draft')[0].payload.requiredPartsRefs, ['part_ref_test_001']);
  assertSafeOutput([response.body, writerSet.store.list()]);
  assertStoreAllowListed(writerSet.store);
});

test('phone correction with valid permission does not write correction application and returns re-verification', async () => {
  const writerSet = createDataCorrectionSafeWriterSet();
  const app = createApp({
    dataCorrection: writerSet,
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
  assert.equal(writesByType(writerSet.store, 'correction_application').length, 0);
  assertSafeOutput([response.body, writerSet.store.list()]);
  assertStoreAllowListed(writerSet.store);
});

test('engineer unable-to-complete path works with engineer permission and safe writer set', async () => {
  const writerSet = createDataCorrectionSafeWriterSet();
  const app = createApp({
    dataCorrection: writerSet,
  });
  const response = await requestApp(app, body(
    ACTIONS.UNABLE_TO_COMPLETE_RESULT,
    unablePayload(),
  ), {
    userId: 'engineer_data_correction_safe_writer_e2e_001',
    role: 'engineer',
    permissions: ['appointment.result.record'],
  });

  assert.equal(response.statusCode, 200);
  assert.equal(writesByType(writerSet.store, 'appointment_result').length, 1);
  assertStoreAllowListed(writerSet.store);
});

test('AI role is denied before writers', async () => {
  const writerSet = createDataCorrectionSafeWriterSet();
  const app = createApp({
    dataCorrection: writerSet,
  });
  const response = await requestApp(app, body(
    ACTIONS.PRE_DEPARTURE_APPLY,
    correctionPayload(),
  ), {
    role: 'ai',
    permissions: ['case.correction.apply'],
  });

  assert.equal(response.statusCode, 403);
  assert.deepEqual(writerSet.store.list(), []);
  assertSafeOutput(response.body);
});

test('store contains only sanitized allow-listed payload keys and no sensitive values', async () => {
  const writerSet = createDataCorrectionSafeWriterSet();
  const app = createApp({
    dataCorrection: writerSet,
  });

  await requestApp(app, body(
    ACTIONS.PRE_DEPARTURE_APPLY,
    correctionPayload(),
  ), {
    role: 'dispatch_assistant',
    permissions: ['case.correction.apply'],
  });

  assertStoreAllowListed(writerSet.store);
  assertSafeOutput(writerSet.store.list());
});

test('store list returns copy and cannot mutate internal writes', async () => {
  const writerSet = createDataCorrectionSafeWriterSet();
  const app = createApp({
    dataCorrection: writerSet,
  });

  await requestApp(app, body(
    ACTIONS.PRE_DEPARTURE_APPLY,
    correctionPayload(),
  ), {
    role: 'dispatch_assistant',
    permissions: ['case.correction.apply'],
  });

  const writes = writerSet.store.list();
  writes[0].payload.organizationId = 'mutated';
  writes.push({ id: 'external_mutation' });

  assert.notEqual(writerSet.store.list()[0].payload.organizationId, 'mutated');
  assert.notEqual(writerSet.store.list().length, writes.length);
});

test('server createServerBootstrap route path works with safe writer set without listen', async () => {
  const writerSet = createDataCorrectionSafeWriterSet();
  const bootstrap = createServerBootstrap({
    dataCorrection: writerSet,
    port: 4073,
  });

  assert.equal(typeof bootstrap.app.handle, 'function');
  assert.deepEqual(writerSet.store.list(), []);

  const response = await requestApp(bootstrap.app, body(
    ACTIONS.PRE_DEPARTURE_APPLY,
    correctionPayload(),
  ), {
    role: 'dispatch_assistant',
    permissions: ['case.correction.apply'],
  });

  assert.equal(response.statusCode, 200);
  assert.equal(writesByType(writerSet.store, 'correction_application').length, 1);
  assertSafeOutput([response.body, writerSet.store.list()]);
  assertStoreAllowListed(writerSet.store);
});

test('integration test source imports no DB, repository, provider, AI, smoke, or browser modules', () => {
  const source = fs.readFileSync(testFile, 'utf8');
  const specifiers = requireSpecifiers(source);
  const importedSpecifiers = specifiers.join('\n');

  assert.deepEqual(specifiers.sort(), [
    '../../src/app',
    '../../src/dataCorrection/dataCorrectionSafeWriters',
    '../../src/server',
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:stream',
    'node:test',
  ]);
  assert.doesNotMatch(importedSpecifiers, /supertest|playwright|browser|smoke|db\/pool|repositories?|transaction|provider|lineProvider|sms|email|push|rag|vector|openai|aiProvider/i);
});
