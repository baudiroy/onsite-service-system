'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Readable, Writable } = require('node:stream');
const test = require('node:test');

const {
  createServerBootstrap,
} = require('../../src/server');

const repoRoot = path.resolve(__dirname, '../..');
const taskDocFile = path.join(
  repoRoot,
  'docs/task-1715-engineer-mobile-workbench-injected-read-only-runtime-acceptance-no-db.md'
);
const sourceFiles = [
  'src/controllers/EngineerMobileWorkbenchController.js',
  'src/routes/engineerMobileWorkbench.routes.js',
  'src/routes/index.js',
  'src/server.js',
].map((file) => path.join(repoRoot, file));

function createRequest(pathname, authOverrides, options = {}) {
  const bodyText = options.body ? JSON.stringify(options.body) : '';
  let sent = false;
  const req = new Readable({
    read() {
      if (sent) {
        this.push(null);
        return;
      }

      sent = true;
      if (bodyText) {
        this.push(bodyText);
      }
      this.push(null);
    },
  });

  req.method = options.method || 'GET';
  req.url = pathname;
  req.originalUrl = pathname;
  req.headers = bodyText
    ? {
      'content-length': String(Buffer.byteLength(bodyText)),
      'content-type': 'application/json',
    }
    : {};
  req.connection = {};
  req.auth = {
    organizationId: 'org_workbench_acceptance_001',
    engineerId: 'eng_workbench_acceptance_001',
    userId: 'user_workbench_acceptance_001',
    role: 'engineer',
    permissions: [
      'engineer_mobile.tasks.read',
      'engineer_mobile.workbench.access',
    ],
    ...(authOverrides || {}),
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

function requestApp(app, pathname, authOverrides = {}, options = {}) {
  return new Promise((resolve, reject) => {
    const req = createRequest(pathname, authOverrides, options);
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

function task(overrides = {}) {
  return {
    appointmentId: 'apt_workbench_acceptance_001',
    assignedEngineerId: 'eng_workbench_acceptance_001',
    caseId: 'case_workbench_acceptance_001',
    organizationId: 'org_workbench_acceptance_001',
    scheduledStart: '2026-05-21T09:00:00+08:00',
    scheduledEnd: '2026-05-21T10:00:00+08:00',
    status: 'confirmed',
    customerNameMasked: 'Customer A',
    customerPhoneMasked: '09xx-xxx-123',
    addressSummary: 'Taipei',
    productSummary: 'AC',
    issueSummary: 'Not cooling',
    serviceType: 'repair',
    internalNote: 'internal_note_should_not_leak',
    auditLog: 'audit_log_should_not_leak',
    aiRawPayload: 'ai_raw_payload_should_not_leak',
    billingInternal: 'billing_internal_should_not_leak',
    settlementInternal: 'settlement_internal_should_not_leak',
    rawPhone: 'raw_phone_should_not_leak',
    rawAddress: 'raw_address_should_not_leak',
    rawLineUserId: 'line_user_should_not_leak',
    token: 'token_should_not_leak',
    secret: 'secret_should_not_leak',
    finalAppointmentId: 'final_appointment_should_not_leak',
    ...overrides,
  };
}

function assertNoForbiddenOutput(value) {
  const serialized = JSON.stringify(value);

  for (const forbiddenValue of [
    'internal_note_should_not_leak',
    'audit_log_should_not_leak',
    'ai_raw_payload_should_not_leak',
    'billing_internal_should_not_leak',
    'settlement_internal_should_not_leak',
    'raw_phone_should_not_leak',
    'raw_address_should_not_leak',
    'line_user_should_not_leak',
    'token_should_not_leak',
    'secret_should_not_leak',
    'final_appointment_should_not_leak',
  ]) {
    assert.equal(serialized.includes(forbiddenValue), false, `leaked ${forbiddenValue}`);
  }

  for (const forbiddenKey of [
    '"rawPhone"',
    '"rawAddress"',
    '"rawLineUserId"',
    '"internalNote"',
    '"auditLog"',
    '"aiRawPayload"',
    '"billingInternal"',
    '"settlementInternal"',
    '"finalAppointmentId"',
  ]) {
    assert.equal(serialized.includes(forbiddenKey), false, `leaked ${forbiddenKey}`);
  }
}

test('Task1715 Workbench injected read-only context/list/detail routes return non-501 safe envelopes', async () => {
  const calls = [];
  const bootstrap = createServerBootstrap({
    engineerMobileWorkbench: {
      contextProvider: {
        getCurrentContext(input) {
          calls.push({ type: 'context', input });
          return {
            engineerDisplayName: 'Engineer Acceptance',
            organizationName: 'Acceptance Org',
            timezone: 'Asia/Taipei',
            locale: 'zh-TW',
            capabilities: ['tasks.read', 'task.detail.read'],
            rawPhone: 'raw_phone_should_not_leak',
            token: 'token_should_not_leak',
            secret: 'secret_should_not_leak',
          };
        },
      },
      taskProvider: {
        listTasks(input) {
          calls.push({ type: 'list', input });
          return [
            task(),
            task({
              appointmentId: 'apt_wrong_org_should_not_appear',
              organizationId: 'org_other',
            }),
            task({
              appointmentId: 'apt_wrong_engineer_should_not_appear',
              assignedEngineerId: 'eng_other',
            }),
          ];
        },
        getTaskDetail(input) {
          calls.push({ type: 'detail', input });
          return {
            task: task({
              appointmentId: input.appointmentId,
              caseId: 'case_workbench_acceptance_detail_001',
              siteNoteSafe: 'Gate code at lobby desk',
              evidenceRefs: [
                {
                  id: 'file_acceptance_photo_001',
                  label: 'before photo',
                  type: 'photo',
                  rawBinary: 'raw_binary_should_not_leak',
                },
              ],
            }),
          };
        },
      },
    },
  });

  const contextResponse = await requestApp(
    bootstrap.app,
    '/api/v1/engineer/mobile-workbench/context'
  );
  const listResponse = await requestApp(
    bootstrap.app,
    '/api/v1/engineer/mobile-workbench/tasks'
  );
  const detailResponse = await requestApp(
    bootstrap.app,
    '/api/v1/engineer/mobile-workbench/tasks/apt_workbench_acceptance_001'
  );

  assert.equal(contextResponse.statusCode, 200);
  assert.equal(contextResponse.body.status, 'allow');
  assert.equal(contextResponse.body.context.engineerDisplayName, 'Engineer Acceptance');

  assert.equal(listResponse.statusCode, 200);
  assert.equal(listResponse.body.status, 'allow');
  assert.deepEqual(listResponse.body.tasks.map((entry) => entry.appointmentId), [
    'apt_workbench_acceptance_001',
  ]);

  assert.equal(detailResponse.statusCode, 200);
  assert.equal(detailResponse.body.status, 'allow');
  assert.equal(detailResponse.body.detail.appointmentId, 'apt_workbench_acceptance_001');
  assert.equal(detailResponse.body.detail.caseId, 'case_workbench_acceptance_detail_001');
  assert.deepEqual(detailResponse.body.detail.evidenceRefs[0], {
    id: 'file_acceptance_photo_001',
    label: 'before photo',
    type: 'photo',
  });

  assert.deepEqual(calls.map((call) => call.type), ['context', 'list', 'detail']);
  assert.deepEqual(calls[0].input, {
    organizationId: 'org_workbench_acceptance_001',
    engineerId: 'eng_workbench_acceptance_001',
    userId: 'user_workbench_acceptance_001',
    role: 'engineer',
    permissions: [
      'engineer_mobile.tasks.read',
      'engineer_mobile.workbench.access',
    ],
  });
  assert.deepEqual(calls[1].input, {
    dateRange: undefined,
    organizationId: 'org_workbench_acceptance_001',
    engineerId: 'eng_workbench_acceptance_001',
  });
  assert.deepEqual(calls[2].input, {
    appointmentId: 'apt_workbench_acceptance_001',
    engineerId: 'eng_workbench_acceptance_001',
    organizationId: 'org_workbench_acceptance_001',
  });
  assertNoForbiddenOutput([contextResponse.body, listResponse.body, detailResponse.body, calls]);
});

test('Task1715 Workbench injected read-only slice leaves action and completion routes as skeleton 501', async () => {
  const bootstrap = createServerBootstrap({
    engineerMobileWorkbench: {
      contextProvider: {
        getCurrentContext() {
          return {
            engineerDisplayName: 'Engineer Acceptance',
          };
        },
      },
      taskProvider: {
        listTasks() {
          return [task()];
        },
        getTaskDetail(input) {
          return {
            task: task({
              appointmentId: input.appointmentId,
            }),
          };
        },
      },
    },
  });
  const arrivedResponse = await requestApp(
    bootstrap.app,
    '/api/v1/engineer/mobile-workbench/tasks/apt_workbench_acceptance_001/arrived',
    {},
    {
      method: 'POST',
      body: {
        clientRequestId: 'client_request_acceptance_arrived_001',
      },
    }
  );
  const startedResponse = await requestApp(
    bootstrap.app,
    '/api/v1/engineer/mobile-workbench/tasks/apt_workbench_acceptance_001/started',
    {},
    {
      method: 'POST',
      body: {
        clientRequestId: 'client_request_acceptance_started_001',
      },
    }
  );
  const completionResponse = await requestApp(
    bootstrap.app,
    '/api/v1/engineer/mobile-workbench/tasks/apt_workbench_acceptance_001/completion-submissions',
    {},
    {
      method: 'POST',
      body: {
        resultStatus: 'completed',
        finalAppointmentId: 'final_appointment_should_not_leak',
      },
    }
  );

  for (const response of [arrivedResponse, startedResponse, completionResponse]) {
    assert.equal(response.statusCode, 501);
    assert.equal(response.body.error.code, 'ENGINEER_MOBILE_WORKBENCH_NOT_IMPLEMENTED');
    assertNoForbiddenOutput(response.body);
  }
});

test('Task1715 acceptance source and doc record no DB, migration, provider sending, or API shape change', () => {
  const combinedSource = sourceFiles
    .map((file) => fs.readFileSync(file, 'utf8'))
    .join('\n');
  const doc = fs.readFileSync(taskDocFile, 'utf8');

  assert.equal(/require\(['"].*db['"]\)/i.test(combinedSource), false);
  assert.equal(/DATABASE_URL|access_token|channel_secret/i.test(combinedSource), false);
  assert.equal(/AIProvider|RAG|vector|externalProvider|notificationProvider/i.test(combinedSource), false);
  assert.match(doc, /No DB/i);
  assert.match(doc, /No migration/i);
  assert.match(doc, /No API shape change/i);
  assert.match(doc, /No Field Service Report write/i);
  assert.match(doc, /finalAppointmentId remains backend\/system-owned/i);
});
