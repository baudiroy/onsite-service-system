'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Readable, Writable } = require('node:stream');
const test = require('node:test');

const {
  createApp,
} = require('../../src/app');

const repoRoot = path.resolve(__dirname, '../..');
const testFile = path.join(repoRoot, 'tests/engineerMobile/engineerMobileActionIntentBoundary.unit.test.js');
const sourceDir = path.join(repoRoot, 'src/engineerMobile');

function auth(overrides = {}) {
  return {
    organizationId: 'org_engineer_mobile_action_boundary',
    engineerId: 'eng_engineer_mobile_action_boundary',
    userId: 'user_engineer_mobile_action_boundary',
    role: 'engineer',
    permissions: ['engineer_mobile.tasks.read'],
    ...overrides,
  };
}

function createRequest(pathname, authOverrides = {}) {
  let sent = false;
  const req = new Readable({
    read() {
      if (sent) {
        this.push(null);
        return;
      }

      sent = true;
      this.push(null);
    },
  });

  req.method = 'GET';
  req.url = pathname;
  req.originalUrl = pathname;
  req.headers = {};
  req.connection = {};
  req.auth = auth(authOverrides);
  req.body = {
    submitCompletion: true,
    createReport: true,
    finalAppointmentId: 'body_final_appointment_should_not_leak',
    token: 'body_token_should_not_leak',
    secret: 'body_secret_should_not_leak',
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

function requestApp(app, pathname, authOverrides) {
  return new Promise((resolve, reject) => {
    const req = createRequest(pathname, authOverrides);
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

function requireSpecifiers(source) {
  const specifiers = [];
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
  let match;

  while ((match = requireRegex.exec(source)) !== null) {
    specifiers.push(match[1]);
  }

  return specifiers;
}

function listSourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        return listSourceFiles(fullPath);
      }

      return entry.isFile() && entry.name.endsWith('.js') ? [fullPath] : [];
    });
}

function unsafeActionTask(overrides = {}) {
  return {
    appointmentId: 'apt_engineer_mobile_action_boundary_001',
    assignedEngineerId: 'eng_engineer_mobile_action_boundary',
    caseId: 'case_engineer_mobile_action_boundary_001',
    organizationId: 'org_engineer_mobile_action_boundary',
    scheduledStart: '2026-05-21T01:00:00.000Z',
    scheduledEnd: '2026-05-21T02:00:00.000Z',
    status: 'confirmed',
    customerNameMasked: 'Fixture Action Customer',
    customerPhoneMasked: '09xx-xxx-303',
    addressSummary: 'Taipei district only, no street number',
    productSummary: 'Fixture action appliance',
    issueSummary: 'Fixture action issue',
    serviceType: 'onsite_service',
    siteNoteSafe: 'Safe engineer task note.',
    checklistSummary: 'Safe checklist summary.',
    evidenceRefs: [
      {
        id: 'safe_action_ref_001',
        label: 'Safe evidence label',
        type: 'photo',
      },
    ],
    submitCompletion: true,
    createReport: true,
    updateReport: true,
    approveReport: true,
    publishReport: true,
    mutateFinalAppointmentId: true,
    sendProviderMessage: true,
    dispatchPush: true,
    writeCorrection: true,
    brandChannelWebhook: true,
    completionSubmissionUrl: 'https://example.invalid/submit-completion',
    createReportUrl: 'https://example.invalid/create-report',
    finalAppointmentId: 'final_appointment_should_not_leak',
    fieldServiceReportId: 'field_service_report_should_not_leak',
    serviceReportId: 'service_report_should_not_leak',
    completionReportId: 'completion_report_should_not_leak',
    providerPayload: 'provider_payload_should_not_leak',
    providerMetadata: 'provider_metadata_should_not_leak',
    token: 'token_should_not_leak',
    secret: 'secret_should_not_leak',
    ...overrides,
  };
}

function createActionApp() {
  return createApp({
    engineerMobile: {
      readModel() {
        return {
          tasks: [
            unsafeActionTask(),
            unsafeActionTask({
              appointmentId: 'apt_engineer_mobile_action_boundary_002',
              caseId: 'case_engineer_mobile_action_boundary_001',
              status: 'completed',
            }),
            unsafeActionTask({
              appointmentId: 'apt_engineer_mobile_action_boundary_wrong_org',
              caseId: 'case_engineer_mobile_action_boundary_wrong_org',
              organizationId: 'org_other',
            }),
          ],
          providerMetadata: {
            submitCompletion: true,
            token: 'metadata_token_should_not_leak',
            finalAppointmentId: 'metadata_final_appointment_should_not_leak',
          },
        };
      },
    },
  });
}

function assertNoActionIntent(value) {
  const serialized = JSON.stringify(value);
  const lower = serialized.toLowerCase();

  for (const forbidden of [
    'submitCompletion',
    'submit_completion',
    'completionSubmission',
    'completion_submission',
    'createReport',
    'create_report',
    'updateReport',
    'update_report',
    'approveReport',
    'approve_report',
    'publishReport',
    'publish_report',
    'mutateFinalAppointmentId',
    'mutate_final_appointment_id',
    'sendProviderMessage',
    'send_provider_message',
    'dispatchPush',
    'dispatch_push',
    'writeCorrection',
    'write_correction',
    'brandChannelWebhook',
    'brand_channel_webhook',
    'submit-completion',
    'create-report',
    'providerPayload',
    'provider_payload',
    'providerMetadata',
    'provider_metadata',
    'fieldServiceReportId',
    'field_service_report',
    'serviceReportId',
    'service_report',
    'completionReportId',
    'completion_report',
    'finalAppointmentId',
    'final_appointment_id',
    'token',
    'secret',
    'password',
    'credential',
  ]) {
    assert.equal(lower.includes(forbidden.toLowerCase()), false, `leaked ${forbidden}`);
  }
}

test('unit test imports only app factory and Node built-ins', () => {
  const specifiers = requireSpecifiers(fs.readFileSync(testFile, 'utf8'));
  const allowed = [
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:stream',
    'node:test',
    '../../src/app',
  ];

  assert.deepEqual(specifiers.sort(), allowed.sort());
  assert.equal(
    specifiers.some((specifier) => /db|pool|repositories?|transaction|provider|server|migration|psql|openai|rag|vector|smoke|browser|fieldservicereport/i.test(specifier)),
    false,
  );
});

test('task-list response strips injected action intent and write fields', async () => {
  const response = await requestApp(createActionApp(), '/engineer-mobile/tasks', {});

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'allow');
  assert.deepEqual(response.body.tasks.map((entry) => entry.appointmentId), [
    'apt_engineer_mobile_action_boundary_001',
    'apt_engineer_mobile_action_boundary_002',
  ]);
  assert.equal(response.body.tasks[0].caseId, 'case_engineer_mobile_action_boundary_001');
  assertNoActionIntent(response.body);
});

test('task-detail response strips injected action intent and write fields', async () => {
  const response = await requestApp(createActionApp(), '/engineer-mobile/tasks/apt_engineer_mobile_action_boundary_001', {});

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'allow');
  assert.equal(response.body.detail.appointmentId, 'apt_engineer_mobile_action_boundary_001');
  assert.equal(response.body.detail.caseId, 'case_engineer_mobile_action_boundary_001');
  assertNoActionIntent(response.body);
});

test('wrong organization detail rows do not leak action intent in safe unavailable response', async () => {
  const app = createApp({
    engineerMobile: {
      readModel() {
        return {
          tasks: [
            unsafeActionTask({
              appointmentId: 'apt_engineer_mobile_action_boundary_001',
              organizationId: 'org_other',
            }),
          ],
        };
      },
    },
  });
  const response = await requestApp(app, '/engineer-mobile/tasks/apt_engineer_mobile_action_boundary_001', {});

  assert.equal(response.statusCode, 404);
  assert.deepEqual(response.body, {
    detail: null,
    messageKey: 'engineerMobile.taskDetailUnavailable',
    status: 'deny',
  });
  assertNoActionIntent(response.body);
});

test('provider throw and malformed results do not leak action intent', async () => {
  const throwingApp = createApp({
    engineerMobile: {
      readModel() {
        throw new Error('submitCompletion createReport finalAppointmentId token secret should not leak');
      },
    },
  });
  const malformedApp = createApp({
    engineerMobile: {
      readModel() {
        return {
          providerMetadata: {
            submitCompletion: true,
            finalAppointmentId: 'metadata_final_appointment_should_not_leak',
            token: 'metadata_token_should_not_leak',
          },
        };
      },
    },
  });
  const listError = await requestApp(throwingApp, '/engineer-mobile/tasks', {});
  const detailError = await requestApp(throwingApp, '/engineer-mobile/tasks/apt_engineer_mobile_action_boundary_001', {});
  const detailMalformed = await requestApp(malformedApp, '/engineer-mobile/tasks/apt_engineer_mobile_action_boundary_001', {});

  assert.equal(listError.statusCode, 403);
  assert.deepEqual(listError.body, {
    messageKey: 'engineerMobile.forbidden',
    status: 'deny',
    tasks: [],
  });
  assert.equal(detailError.statusCode, 404);
  assert.deepEqual(detailError.body, {
    detail: null,
    messageKey: 'engineerMobile.taskDetailUnavailable',
    status: 'deny',
  });
  assert.equal(detailMalformed.statusCode, 404);
  assert.deepEqual(detailMalformed.body, {
    detail: null,
    messageKey: 'engineerMobile.taskDetailUnavailable',
    status: 'deny',
  });
  assertNoActionIntent({
    detailError: detailError.body,
    detailMalformed: detailMalformed.body,
    listError: listError.body,
  });
});

test('Engineer Mobile source does not import completion report writer DB provider sending or AI modules', () => {
  const sourceFiles = listSourceFiles(sourceDir);
  const allowedDbAdapterImports = new Set([
    './engineerMobileAssignedAppointmentDbRepository',
    './engineerMobileAssignedAppointmentDbRowMapper',
  ]);

  assert.ok(sourceFiles.length > 0, 'expected Engineer Mobile source files');

  for (const file of sourceFiles) {
    const source = fs.readFileSync(file, 'utf8');
    const specifiers = requireSpecifiers(source);

    assert.equal(
      specifiers.some((specifier) => (
        !allowedDbAdapterImports.has(specifier)
        && /FieldServiceReport|Completion|repositories?|db|pool|transaction|provider|notification|line|sms|email|push|openai|rag|vector/i.test(specifier)
      )),
      false,
      `forbidden import in ${path.relative(repoRoot, file)}`,
    );
  }
});

test('multi-appointment same-case read path does not imply multiple formal reports', async () => {
  const response = await requestApp(createActionApp(), '/engineer-mobile/tasks', {});
  const sameCase = response.body.tasks.filter((entry) => entry.caseId === 'case_engineer_mobile_action_boundary_001');

  assert.equal(sameCase.length, 2);
  assertNoActionIntent(sameCase);
});
