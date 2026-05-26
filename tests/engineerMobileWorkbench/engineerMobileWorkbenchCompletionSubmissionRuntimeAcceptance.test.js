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
  'docs/task-1719-engineer-mobile-workbench-completion-submission-runtime-acceptance-no-db.md'
);
const sourceFiles = [
  'src/controllers/EngineerMobileWorkbenchController.js',
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
    organizationId: 'org_workbench_completion_acceptance_001',
    engineerId: 'eng_workbench_completion_acceptance_001',
    userId: 'user_workbench_completion_acceptance_001',
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
    'raw_binary_should_not_leak',
    'raw_phone_should_not_leak',
    'raw_address_should_not_leak',
    'line_user_should_not_leak',
    'token_should_not_leak',
    'secret_should_not_leak',
    'internal_note_should_not_leak',
    'audit_log_should_not_leak',
    'ai_raw_payload_should_not_leak',
    'billing_amount_should_not_leak',
    'settlement_internal_should_not_leak',
    'provider_sending_should_not_happen',
    'formal_fsr_write_should_not_happen',
    'final_appointment_should_not_leak',
  ]) {
    assert.equal(serialized.includes(forbiddenValue), false, `leaked ${forbiddenValue}`);
  }

  for (const forbiddenKey of [
    '"rawBinary"',
    '"rawPhone"',
    '"rawAddress"',
    '"rawLineUserId"',
    '"token"',
    '"secret"',
    '"internalNote"',
    '"auditLog"',
    '"aiRawPayload"',
    '"billingSettlementAmount"',
    '"settlementInternal"',
    '"providerSending"',
    '"providerDispatch"',
    '"formalFieldServiceReportWrite"',
    '"formalFieldServiceReportId"',
    '"fieldServiceReportId"',
    '"finalAppointmentId"',
  ]) {
    assert.equal(serialized.includes(forbiddenKey), false, `leaked ${forbiddenKey}`);
  }
}

function completionDraftBody(overrides = {}) {
  return {
    resultStatus: 'pending_parts',
    clientRequestId: 'client_request_completion_acceptance_001',
    engineerNote: 'Parts needed before completion.',
    customerSignatureStatus: 'exception',
    signatureExceptionReason: 'customer_unavailable',
    photoRefs: [
      {
        id: 'file_completion_acceptance_photo_001',
        label: 'before repair photo',
        type: 'photo',
        rawBinary: 'raw_binary_should_not_leak',
      },
    ],
    partRefs: [
      {
        id: 'part_completion_acceptance_001',
        label: 'filter',
        type: 'part',
        settlementInternal: 'settlement_internal_should_not_leak',
      },
    ],
    signatureRefs: [
      {
        id: 'sig_completion_acceptance_001',
        label: 'signature exception',
        type: 'signature_exception',
      },
    ],
    finalAppointmentId: 'final_appointment_should_not_leak',
    formalFieldServiceReportWrite: 'formal_fsr_write_should_not_happen',
    fieldServiceReportId: 'formal_fsr_write_should_not_happen',
    providerSending: 'provider_sending_should_not_happen',
    rawPhone: 'raw_phone_should_not_leak',
    rawAddress: 'raw_address_should_not_leak',
    rawLineUserId: 'line_user_should_not_leak',
    token: 'token_should_not_leak',
    secret: 'secret_should_not_leak',
    ...overrides,
  };
}

test('Task1719 Workbench completion-submission remains skeleton without injected provider', async () => {
  const bootstrap = createServerBootstrap();
  const response = await requestApp(
    bootstrap.app,
    '/api/v1/engineer/mobile-workbench/tasks/apt_workbench_completion_acceptance_001/completion-submissions',
    {
      body: completionDraftBody(),
    }
  );

  assert.equal(response.statusCode, 501);
  assert.equal(response.body.error.code, 'ENGINEER_MOBILE_WORKBENCH_NOT_IMPLEMENTED');
  assertNoForbiddenOutput(response.body);
});

test('Task1719 injected no-DB provider receives completion draft payload without formal FSR mutation', async () => {
  const calls = [];
  const bootstrap = createServerBootstrap({
    engineerMobileWorkbench: {
      completionSubmissionProvider: {
        createCompletionSubmission(input) {
          calls.push(input);
          return {
            receivedAt: '2026-05-21T09:45:00+08:00',
            status: 'accepted',
            submissionId: 'sub_workbench_completion_acceptance_001',
            finalAppointmentId: 'final_appointment_should_not_leak',
            formalFieldServiceReportId: 'formal_fsr_write_should_not_happen',
            fieldServiceReportId: 'formal_fsr_write_should_not_happen',
            providerSending: 'provider_sending_should_not_happen',
            rawPhone: 'raw_phone_should_not_leak',
            internalNote: 'internal_note_should_not_leak',
            auditLog: 'audit_log_should_not_leak',
            aiRawPayload: 'ai_raw_payload_should_not_leak',
          };
        },
      },
    },
  });

  const response = await requestApp(
    bootstrap.app,
    '/api/v1/engineer/mobile-workbench/tasks/apt_workbench_completion_acceptance_001/completion-submissions',
    {
      body: completionDraftBody(),
    }
  );

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, {
    status: 'allow',
    submission: {
      taskId: 'apt_workbench_completion_acceptance_001',
      resultStatus: 'pending_parts',
      status: 'accepted',
      submissionId: 'sub_workbench_completion_acceptance_001',
      receivedAt: '2026-05-21T09:45:00+08:00',
      messageKey: null,
    },
  });
  assert.deepEqual(calls, [
    {
      organizationId: 'org_workbench_completion_acceptance_001',
      engineerId: 'eng_workbench_completion_acceptance_001',
      userId: 'user_workbench_completion_acceptance_001',
      taskId: 'apt_workbench_completion_acceptance_001',
      resultStatus: 'pending_parts',
      clientRequestId: 'client_request_completion_acceptance_001',
      engineerNote: 'Parts needed before completion.',
      customerSignatureStatus: 'exception',
      signatureExceptionReason: 'customer_unavailable',
      photoRefs: [
        {
          id: 'file_completion_acceptance_photo_001',
          label: 'before repair photo',
          type: 'photo',
        },
      ],
      partRefs: [
        {
          id: 'part_completion_acceptance_001',
          label: 'filter',
          type: 'part',
        },
      ],
      signatureRefs: [
        {
          id: 'sig_completion_acceptance_001',
          label: 'signature exception',
          type: 'signature_exception',
        },
      ],
    },
  ]);
  assertNoForbiddenOutput([response.body, calls]);
});

test('Task1719 acceptance source and doc preserve completion no-DB and no-FSR boundaries', () => {
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
  assert.match(doc, /completion submission remains source-data only/i);
  assert.match(doc, /finalAppointmentId remains backend\/system-owned/i);
});
