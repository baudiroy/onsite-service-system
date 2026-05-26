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
  'docs/task-1717-engineer-mobile-workbench-status-action-runtime-acceptance-no-db.md'
);
const sourceFiles = [
  'src/controllers/EngineerMobileWorkbenchController.js',
  'src/engineerMobileWorkbench/engineerMobileWorkbenchTaskStatusOperationService.js',
  'src/engineerMobileWorkbench/engineerMobileWorkbenchCompletionSubmissionService.js',
  'src/routes/engineerMobileWorkbench.routes.js',
  'src/routes/index.js',
  'src/server.js',
].map((file) => path.join(repoRoot, file));

function createRequest(pathname, options = {}) {
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

  req.method = options.method || 'POST';
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
    organizationId: 'org_workbench_status_acceptance_001',
    engineerId: 'eng_workbench_status_acceptance_001',
    userId: 'user_workbench_status_acceptance_001',
    role: 'engineer',
    permissions: [
      'engineer_mobile.tasks.read',
      'engineer_mobile.workbench.access',
    ],
    ...(options.auth || {}),
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

function requestApp(app, pathname, options = {}) {
  return new Promise((resolve, reject) => {
    const req = createRequest(pathname, options);
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
    'provider_sending_should_not_happen',
    'formal_fsr_write_should_not_happen',
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
    '"providerSending"',
    '"formalFieldServiceReportWrite"',
    '"formalFieldServiceReportId"',
    '"fieldServiceReportId"',
    '"finalAppointmentId"',
  ]) {
    assert.equal(serialized.includes(forbiddenKey), false, `leaked ${forbiddenKey}`);
  }
}

test('Task1717 Workbench status and completion actions remain skeleton without injected providers', async () => {
  const bootstrap = createServerBootstrap();
  const arrivedResponse = await requestApp(
    bootstrap.app,
    '/api/v1/engineer/mobile-workbench/tasks/apt_workbench_status_acceptance_001/arrived',
    {
      body: {
        clientRequestId: 'client_request_status_acceptance_arrived_001',
        finalAppointmentId: 'final_appointment_should_not_leak',
        token: 'token_should_not_leak',
      },
    }
  );
  const startedResponse = await requestApp(
    bootstrap.app,
    '/api/v1/engineer/mobile-workbench/tasks/apt_workbench_status_acceptance_001/started',
    {
      body: {
        clientRequestId: 'client_request_status_acceptance_started_001',
        finalAppointmentId: 'final_appointment_should_not_leak',
        secret: 'secret_should_not_leak',
      },
    }
  );
  const completionResponse = await requestApp(
    bootstrap.app,
    '/api/v1/engineer/mobile-workbench/tasks/apt_workbench_status_acceptance_001/completion-submissions',
    {
      body: {
        resultStatus: 'completed',
        clientRequestId: 'client_request_status_acceptance_completion_001',
        finalAppointmentId: 'final_appointment_should_not_leak',
        formalFieldServiceReportWrite: 'formal_fsr_write_should_not_happen',
        providerSending: 'provider_sending_should_not_happen',
      },
    }
  );

  for (const response of [arrivedResponse, startedResponse, completionResponse]) {
    assert.equal(response.statusCode, 501);
    assert.equal(response.body.error.code, 'ENGINEER_MOBILE_WORKBENCH_NOT_IMPLEMENTED');
    assertNoForbiddenOutput(response.body);
  }
});

test('Task1717 Workbench injected no-DB providers accept status and completion actions safely', async () => {
  const calls = [];
  const bootstrap = createServerBootstrap({
    engineerMobileWorkbench: {
      arrivedProvider: {
        markArrived(input) {
          calls.push({ type: 'arrived', input });
          return {
            operationId: 'op_workbench_status_acceptance_arrived_001',
            occurredAt: '2026-05-21T09:05:00+08:00',
            status: 'accepted',
            taskStatus: 'arrived',
            rawPhone: 'raw_phone_should_not_leak',
            finalAppointmentId: 'final_appointment_should_not_leak',
            providerSending: 'provider_sending_should_not_happen',
          };
        },
      },
      startedProvider: {
        markStarted(input) {
          calls.push({ type: 'started', input });
          return {
            operationId: 'op_workbench_status_acceptance_started_001',
            occurredAt: '2026-05-21T09:10:00+08:00',
            status: 'accepted',
            taskStatus: 'in_progress',
            secret: 'secret_should_not_leak',
            formalFieldServiceReportId: 'formal_fsr_write_should_not_happen',
          };
        },
      },
      completionSubmissionProvider: {
        createCompletionSubmission(input) {
          calls.push({ type: 'completion', input });
          return {
            receivedAt: '2026-05-21T09:30:00+08:00',
            status: 'accepted',
            submissionId: 'sub_workbench_status_acceptance_001',
            token: 'token_should_not_leak',
            finalAppointmentId: 'final_appointment_should_not_leak',
            fieldServiceReportId: 'formal_fsr_write_should_not_happen',
          };
        },
      },
    },
  });

  const arrivedResponse = await requestApp(
    bootstrap.app,
    '/api/v1/engineer/mobile-workbench/tasks/apt_workbench_status_acceptance_001/arrived',
    {
      body: {
        clientRequestId: 'client_request_status_acceptance_arrived_001',
        finalAppointmentId: 'final_appointment_should_not_leak',
        rawPhone: 'raw_phone_should_not_leak',
      },
    }
  );
  const startedResponse = await requestApp(
    bootstrap.app,
    '/api/v1/engineer/mobile-workbench/tasks/apt_workbench_status_acceptance_001/started',
    {
      body: {
        clientRequestId: 'client_request_status_acceptance_started_001',
        finalAppointmentId: 'final_appointment_should_not_leak',
        secret: 'secret_should_not_leak',
      },
    }
  );
  const completionResponse = await requestApp(
    bootstrap.app,
    '/api/v1/engineer/mobile-workbench/tasks/apt_workbench_status_acceptance_001/completion-submissions',
    {
      body: {
        resultStatus: 'completed',
        clientRequestId: 'client_request_status_acceptance_completion_001',
        engineerNote: 'Source-data only completion note',
        customerSignatureStatus: 'captured',
        photoRefs: [
          {
            id: 'file_status_acceptance_photo_001',
            label: 'before photo',
            type: 'photo',
            rawBinary: 'raw_binary_should_not_leak',
          },
        ],
        finalAppointmentId: 'final_appointment_should_not_leak',
        formalFieldServiceReportWrite: 'formal_fsr_write_should_not_happen',
        providerSending: 'provider_sending_should_not_happen',
      },
    }
  );

  assert.equal(arrivedResponse.statusCode, 200);
  assert.deepEqual(arrivedResponse.body.operation, {
    operation: 'arrived',
    taskId: 'apt_workbench_status_acceptance_001',
    status: 'accepted',
    taskStatus: 'arrived',
    operationId: 'op_workbench_status_acceptance_arrived_001',
    occurredAt: '2026-05-21T09:05:00+08:00',
    messageKey: null,
  });

  assert.equal(startedResponse.statusCode, 200);
  assert.deepEqual(startedResponse.body.operation, {
    operation: 'started',
    taskId: 'apt_workbench_status_acceptance_001',
    status: 'accepted',
    taskStatus: 'in_progress',
    operationId: 'op_workbench_status_acceptance_started_001',
    occurredAt: '2026-05-21T09:10:00+08:00',
    messageKey: null,
  });

  assert.equal(completionResponse.statusCode, 200);
  assert.deepEqual(completionResponse.body.submission, {
    taskId: 'apt_workbench_status_acceptance_001',
    resultStatus: 'completed',
    status: 'accepted',
    submissionId: 'sub_workbench_status_acceptance_001',
    receivedAt: '2026-05-21T09:30:00+08:00',
    messageKey: null,
  });

  assert.deepEqual(calls, [
    {
      type: 'arrived',
      input: {
        organizationId: 'org_workbench_status_acceptance_001',
        engineerId: 'eng_workbench_status_acceptance_001',
        userId: 'user_workbench_status_acceptance_001',
        taskId: 'apt_workbench_status_acceptance_001',
        operation: 'arrived',
        clientRequestId: 'client_request_status_acceptance_arrived_001',
      },
    },
    {
      type: 'started',
      input: {
        organizationId: 'org_workbench_status_acceptance_001',
        engineerId: 'eng_workbench_status_acceptance_001',
        userId: 'user_workbench_status_acceptance_001',
        taskId: 'apt_workbench_status_acceptance_001',
        operation: 'started',
        clientRequestId: 'client_request_status_acceptance_started_001',
      },
    },
    {
      type: 'completion',
      input: {
        organizationId: 'org_workbench_status_acceptance_001',
        engineerId: 'eng_workbench_status_acceptance_001',
        userId: 'user_workbench_status_acceptance_001',
        taskId: 'apt_workbench_status_acceptance_001',
        resultStatus: 'completed',
        clientRequestId: 'client_request_status_acceptance_completion_001',
        engineerNote: 'Source-data only completion note',
        customerSignatureStatus: 'captured',
        signatureExceptionReason: null,
        photoRefs: [
          {
            id: 'file_status_acceptance_photo_001',
            label: 'before photo',
            type: 'photo',
          },
        ],
        partRefs: [],
        signatureRefs: [],
      },
    },
  ]);
  assertNoForbiddenOutput([
    arrivedResponse.body,
    startedResponse.body,
    completionResponse.body,
    calls,
  ]);
});

test('Task1717 acceptance source and doc preserve no DB, FSR, provider sending, and API boundaries', () => {
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
  assert.match(doc, /No provider sending/i);
  assert.match(doc, /No Field Service Report write/i);
  assert.match(doc, /finalAppointmentId remains backend\/system-owned/i);
});
