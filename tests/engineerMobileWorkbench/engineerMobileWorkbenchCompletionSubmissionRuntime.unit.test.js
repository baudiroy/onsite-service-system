'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  EngineerMobileWorkbenchController,
} = require('../../src/controllers/EngineerMobileWorkbenchController');
const {
  buildEngineerMobileWorkbenchCompletionSubmissionResponseAsync,
} = require('../../src/engineerMobileWorkbench/engineerMobileWorkbenchCompletionSubmissionService');
const {
  createEngineerMobileWorkbenchRouter,
} = require('../../src/routes/engineerMobileWorkbench.routes');
const { createAppRouter } = require('../../src/routes');

const repoRoot = path.resolve(__dirname, '../..');
const submissionServiceFile = path.join(
  repoRoot,
  'src/engineerMobileWorkbench/engineerMobileWorkbenchCompletionSubmissionService.js'
);
const controllerFile = path.join(repoRoot, 'src/controllers/EngineerMobileWorkbenchController.js');
const routeFile = path.join(repoRoot, 'src/routes/engineerMobileWorkbench.routes.js');

function createResponse() {
  return {
    statusCalls: [],
    jsonCalls: [],
    status(statusCode) {
      this.statusCalls.push(statusCode);
      return this;
    },
    json(body) {
      this.jsonCalls.push(body);
      return this;
    },
  };
}

function auth(overrides = {}) {
  return {
    organizationId: 'org_workbench_submit_001',
    engineerId: 'eng_workbench_submit_001',
    userId: 'user_workbench_submit_001',
    role: 'engineer',
    permissions: [
      'appointment.result.record',
    ],
    ...overrides,
  };
}

function request(overrides = {}) {
  return {
    auth: auth(),
    body: {
      resultStatus: 'pending_parts',
      clientRequestId: 'client_request_submit_001',
      engineerNote: '現場確認需要待料',
      customerSignatureStatus: 'exception',
      signatureExceptionReason: 'customer_unavailable',
      photoRefs: [
        {
          id: 'file_ref_photo_001',
          type: 'photo',
          label: '現場照片',
          rawBinary: 'raw_binary_should_not_leak',
        },
      ],
      partRefs: [
        {
          id: 'part_ref_001',
          type: 'part',
          label: '濾網',
        },
      ],
      signatureRefs: [
        {
          id: 'sig_ref_001',
          type: 'signature_exception',
          label: '簽名例外',
        },
      ],
      finalAppointmentId: 'final_appointment_should_not_pass',
      formalFieldServiceReportContent: 'formal_fsr_should_not_pass',
      billingSettlementAmount: 'billing_amount_should_not_pass',
      rawPhone: 'raw_phone_should_not_pass',
      rawLineUserId: 'line_user_should_not_pass',
      token: 'token_should_not_pass',
      secret: 'secret_should_not_pass',
    },
    params: {
      taskId: 'apt_workbench_submit_001',
    },
    requestId: 'req_workbench_submit_001',
    ...overrides,
  };
}

function submissionResult(overrides = {}) {
  return {
    status: 'accepted',
    submissionId: 'sub_workbench_submit_001',
    receivedAt: '2026-05-21T09:20:00+08:00',
    messageKey: 'engineer_mobile.completion_submission.accepted',
    rawPhone: 'raw_phone_should_not_leak',
    rawLineUserId: 'line_user_should_not_leak',
    token: 'token_should_not_leak',
    secret: 'secret_should_not_leak',
    internalNote: 'internal_note_should_not_leak',
    auditLog: 'audit_log_should_not_leak',
    aiRawPayload: 'ai_raw_payload_should_not_leak',
    finalAppointmentId: 'final_appointment_should_not_leak',
    formalFieldServiceReportContent: 'formal_fsr_should_not_leak',
    billingSettlementAmount: 'billing_amount_should_not_leak',
    ...overrides,
  };
}

function findRoute(router, method, pathname) {
  return router.stack.find((layer) => (
    layer.route
    && layer.route.path === pathname
    && layer.route.methods[method.toLowerCase()]
  ));
}

async function callRoute(router, req, pathname = '/tasks/:taskId/completion-submissions') {
  const route = findRoute(router, 'post', pathname);
  const res = createResponse();

  assert.ok(route, `workbench route missing: POST ${pathname}`);

  await route.route.stack[0].handle(req, res, () => {});
  await new Promise((resolve) => setImmediate(resolve));

  return res;
}

async function callNestedWorkbenchSubmissionRoute(appRouter, req) {
  const pathname = '/tasks/:taskId/completion-submissions';
  const workbenchLayer = appRouter.stack.find((layer) => (
    layer.name === 'router'
    && layer.handle
    && Array.isArray(layer.handle.stack)
    && Boolean(findRoute(layer.handle, 'post', pathname))
  ));

  assert.ok(workbenchLayer, 'mounted workbench completion-submission router missing');

  return callRoute(workbenchLayer.handle, req, pathname);
}

function assertNoForbiddenOutput(value) {
  const serialized = JSON.stringify(value);

  for (const forbiddenValue of [
    'raw_phone_should_not_leak',
    'line_user_should_not_leak',
    'token_should_not_leak',
    'secret_should_not_leak',
    'internal_note_should_not_leak',
    'audit_log_should_not_leak',
    'ai_raw_payload_should_not_leak',
    'final_appointment_should_not_leak',
    'formal_fsr_should_not_leak',
    'billing_amount_should_not_leak',
    'raw_binary_should_not_leak',
    'final_appointment_should_not_pass',
    'formal_fsr_should_not_pass',
    'billing_amount_should_not_pass',
    'raw_phone_should_not_pass',
    'line_user_should_not_pass',
    'token_should_not_pass',
    'secret_should_not_pass',
  ]) {
    assert.equal(serialized.includes(forbiddenValue), false, `leaked ${forbiddenValue}`);
  }

  assert.equal(serialized.includes('"finalAppointmentId"'), false);
  assert.equal(serialized.includes('"formalFieldServiceReportContent"'), false);
  assert.equal(serialized.includes('"billingSettlementAmount"'), false);
  assert.equal(serialized.includes('"rawBinary"'), false);
  assert.equal(serialized.includes('"rawPhone"'), false);
  assert.equal(serialized.includes('"rawLineUserId"'), false);
}

test('completion submission service passes only scoped source-data to injected provider', async () => {
  const calls = [];
  const response = await buildEngineerMobileWorkbenchCompletionSubmissionResponseAsync(request(), {
    completionSubmissionProvider: {
      createCompletionSubmission(input) {
        calls.push(input);
        return submissionResult();
      },
    },
  });

  assert.deepEqual(calls, [
    {
      organizationId: 'org_workbench_submit_001',
      engineerId: 'eng_workbench_submit_001',
      userId: 'user_workbench_submit_001',
      taskId: 'apt_workbench_submit_001',
      resultStatus: 'pending_parts',
      clientRequestId: 'client_request_submit_001',
      engineerNote: '現場確認需要待料',
      customerSignatureStatus: 'exception',
      signatureExceptionReason: 'customer_unavailable',
      photoRefs: [
        {
          id: 'file_ref_photo_001',
          label: '現場照片',
          type: 'photo',
        },
      ],
      partRefs: [
        {
          id: 'part_ref_001',
          label: '濾網',
          type: 'part',
        },
      ],
      signatureRefs: [
        {
          id: 'sig_ref_001',
          label: '簽名例外',
          type: 'signature_exception',
        },
      ],
    },
  ]);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'allow');
  assert.deepEqual(response.body.submission, {
    taskId: 'apt_workbench_submit_001',
    resultStatus: 'pending_parts',
    status: 'accepted',
    submissionId: 'sub_workbench_submit_001',
    receivedAt: '2026-05-21T09:20:00+08:00',
    messageKey: 'engineer_mobile.completion_submission.accepted',
  });
  assertNoForbiddenOutput(response.body);
});

test('completion submission service denies missing auth invalid result and provider errors safely', async () => {
  let called = false;
  const missingAuth = await buildEngineerMobileWorkbenchCompletionSubmissionResponseAsync(
    request({ auth: undefined }),
    {
      completionSubmissionProvider: {
        createCompletionSubmission() {
          called = true;
          return submissionResult();
        },
      },
    }
  );
  const invalidResult = await buildEngineerMobileWorkbenchCompletionSubmissionResponseAsync(
    request({ body: { resultStatus: 'force_completed' } }),
    {
      completionSubmissionProvider: {
        createCompletionSubmission() {
          called = true;
          return submissionResult();
        },
      },
    }
  );
  const providerError = await buildEngineerMobileWorkbenchCompletionSubmissionResponseAsync(
    request(),
    {
      completionSubmissionProvider: {
        createCompletionSubmission() {
          throw new Error('secret_should_not_leak');
        },
      },
    }
  );

  assert.equal(called, false);
  for (const response of [missingAuth, invalidResult, providerError]) {
    assert.equal(response.statusCode, 403);
    assert.equal(response.body.status, 'deny');
    assertNoForbiddenOutput(response.body);
  }
});

test('controller submitCompletion keeps default skeleton behavior without injected provider', async () => {
  const controller = new EngineerMobileWorkbenchController();
  const res = createResponse();

  await controller.submitCompletion(request(), res);

  assert.deepEqual(res.statusCalls, [501]);
  assert.equal(res.jsonCalls[0].error.code, 'ENGINEER_MOBILE_WORKBENCH_NOT_IMPLEMENTED');
  assertNoForbiddenOutput(res.jsonCalls[0]);
});

test('controller submitCompletion returns injected safe source-data result', async () => {
  const controller = new EngineerMobileWorkbenchController({
    engineerMobileWorkbenchCompletionSubmissionOptions: {
      submissionProvider: {
        submitCompletion() {
          return submissionResult();
        },
      },
    },
  });
  const res = createResponse();

  await controller.submitCompletion(request(), res);

  assert.deepEqual(res.statusCalls, [200]);
  assert.equal(res.jsonCalls[0].status, 'allow');
  assert.equal(res.jsonCalls[0].submission.resultStatus, 'pending_parts');
  assertNoForbiddenOutput(res.jsonCalls[0]);
});

test('workbench router factory supports injected completion submission provider without DB access', async () => {
  const calls = [];
  const router = createEngineerMobileWorkbenchRouter({
    completionSubmissionProvider: {
      createCompletionSubmission(input) {
        calls.push(input);
        return submissionResult({
          submissionId: 'sub_workbench_route_submit_001',
        });
      },
    },
  });
  const res = await callRoute(router, request());

  assert.equal(calls.length, 1);
  assert.equal(calls[0].taskId, 'apt_workbench_submit_001');
  assert.equal(calls[0].resultStatus, 'pending_parts');
  assert.deepEqual(res.statusCalls, [200]);
  assert.equal(res.jsonCalls[0].submission.submissionId, 'sub_workbench_route_submit_001');
  assertNoForbiddenOutput(res.jsonCalls[0]);
});

test('central router passes engineerMobile options into mounted workbench completion submission route', async () => {
  const appRouter = createAppRouter({
    engineerMobile: {
      completionSubmissionProvider: {
        createCompletionSubmission() {
          return submissionResult({
            submissionId: 'sub_workbench_index_submit_001',
          });
        },
      },
    },
  });

  const res = await callNestedWorkbenchSubmissionRoute(appRouter, request());

  assert.deepEqual(res.statusCalls, [200]);
  assert.equal(res.jsonCalls[0].submission.submissionId, 'sub_workbench_index_submit_001');
  assertNoForbiddenOutput(res.jsonCalls[0]);
});

test('workbench completion submission runtime files avoid DB AI RAG provider sending and secret imports', () => {
  const serviceSource = fs.readFileSync(submissionServiceFile, 'utf8');
  const controllerSource = fs.readFileSync(controllerFile, 'utf8');
  const routeSource = fs.readFileSync(routeFile, 'utf8');
  const combined = `${serviceSource}\n${controllerSource}\n${routeSource}`;

  assert.equal(/require\(['"].*db['"]\)/i.test(combined), false);
  assert.equal(/AIProvider|externalProvider|notificationProvider/i.test(combined), false);
  assert.equal(/AIProvider|RAG|vector/i.test(combined), false);
  assert.equal(/DATABASE_URL|access_token|channel_secret/i.test(combined), false);
});
