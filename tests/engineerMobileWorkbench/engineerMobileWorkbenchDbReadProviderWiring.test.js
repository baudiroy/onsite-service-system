'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Readable, Writable } = require('node:stream');
const test = require('node:test');

const { createApp } = require('../../src/app');
const { createServerBootstrap } = require('../../src/server');

const repoRoot = path.resolve(__dirname, '../..');
const appFile = path.join(repoRoot, 'src/app.js');
const serverFile = path.join(repoRoot, 'src/server.js');

function auth(overrides = {}) {
  return {
    organizationId: 'org_workbench_wiring_001',
    engineerId: 'eng_workbench_wiring_001',
    userId: 'user_workbench_wiring_001',
    role: 'engineer',
    permissions: [
      'engineer_mobile.tasks.read',
      'engineer_mobile.workbench.access',
    ],
    ...overrides,
  };
}

function createRequest(pathname, authOverrides = {}) {
  const req = new Readable({
    read() {
      this.push(null);
    },
  });

  req.method = 'GET';
  req.url = pathname;
  req.originalUrl = pathname;
  req.headers = {};
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

function requestApp(app, pathname, authOverrides = {}) {
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

function readModelRow(overrides = {}) {
  return {
    organization_id: 'org_workbench_wiring_001',
    case_id: 'case_workbench_wiring_001',
    appointment_id: 'apt_workbench_wiring_001',
    assigned_engineer_id: 'eng_workbench_wiring_001',
    scheduled_start: '2026-05-21T09:00:00.000Z',
    scheduled_end: '2026-05-21T10:00:00.000Z',
    status: 'confirmed',
    customer_name_masked: 'Customer Wiring',
    customer_phone_masked: '09xx-xxx-789',
    address_summary: 'Taipei',
    product_summary: 'Washer',
    issue_summary: 'Noise',
    service_summary: 'Inspection',
    service_type: 'repair',
    site_note_safe: 'Lobby check-in',
    evidence_refs: [
      {
        id: 'file_wiring_photo_001',
        label: 'safe photo',
        type: 'photo',
      },
    ],
    raw_phone: 'raw_phone_should_not_leak',
    raw_address: 'raw_address_should_not_leak',
    token: 'token_should_not_leak',
    secret: 'secret_should_not_leak',
    final_appointment_id: 'final_appointment_should_not_leak',
    finalAppointmentId: 'final_appointment_should_not_leak',
    ...overrides,
  };
}

function createFakeDbClient() {
  const calls = [];
  const dbClient = {
    calls,
    async query(sql, values) {
      calls.push({ sql, values });

      if (/from users u/i.test(sql)) {
        return {
          rows: [
            {
              engineer_display_name: 'Engineer Wiring',
              organization_name: 'Wiring Org',
              mobile: 'raw_phone_should_not_leak',
              password_hash: 'secret_should_not_leak',
            },
          ],
        };
      }

      if (/from engineer_mobile_task_read_models/i.test(sql) && /appointment_id = \$3/i.test(sql)) {
        return {
          rows: [
            readModelRow({
              appointment_id: values[2],
              case_id: 'case_workbench_wiring_detail_001',
            }),
          ],
        };
      }

      if (/from engineer_mobile_task_read_models/i.test(sql)) {
        return {
          rows: [
            readModelRow(),
            readModelRow({
              appointment_id: 'apt_wrong_org_should_not_appear',
              organization_id: 'org_other',
            }),
            readModelRow({
              appointment_id: 'apt_wrong_engineer_should_not_appear',
              assigned_engineer_id: 'eng_other',
            }),
          ],
        };
      }

      throw new Error('unexpected query');
    },
  };

  return dbClient;
}

function assertNoForbiddenOutput(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'raw_phone_should_not_leak',
    'raw_address_should_not_leak',
    'token_should_not_leak',
    'secret_should_not_leak',
    'final_appointment_should_not_leak',
    'apt_wrong_org_should_not_appear',
    'apt_wrong_engineer_should_not_appear',
    'fieldServiceReportId',
    'serviceReportId',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

function assertDbCalls(calls) {
  assert.equal(calls.length, 3);
  assert.deepEqual(calls[0].values, [
    'org_workbench_wiring_001',
    'eng_workbench_wiring_001',
  ]);
  assert.deepEqual(calls[1].values, [
    'org_workbench_wiring_001',
    'eng_workbench_wiring_001',
    null,
    null,
  ]);
  assert.deepEqual(calls[2].values, [
    'org_workbench_wiring_001',
    'eng_workbench_wiring_001',
    'apt_workbench_wiring_001',
  ]);

  for (const call of calls) {
    assert.match(call.sql, /^select/i);
    assert.doesNotMatch(call.sql, /\b(insert|update|delete|truncate|alter|drop)\b/i);
    assert.doesNotMatch(call.sql, /field_service_reports|final_appointment_id/i);
  }
}

async function assertWorkbenchReadsUseDbProvider(app, dbClient) {
  const contextResponse = await requestApp(
    app,
    '/api/v1/engineer/mobile-workbench/context'
  );
  const listResponse = await requestApp(
    app,
    '/api/v1/engineer/mobile-workbench/tasks'
  );
  const detailResponse = await requestApp(
    app,
    '/api/v1/engineer/mobile-workbench/tasks/apt_workbench_wiring_001'
  );

  assert.equal(contextResponse.statusCode, 200);
  assert.equal(contextResponse.body.context.engineerDisplayName, 'Engineer Wiring');
  assert.equal(contextResponse.body.context.organizationName, 'Wiring Org');

  assert.equal(listResponse.statusCode, 200);
  assert.deepEqual(listResponse.body.tasks.map((task) => task.appointmentId), [
    'apt_workbench_wiring_001',
  ]);

  assert.equal(detailResponse.statusCode, 200);
  assert.equal(detailResponse.body.detail.appointmentId, 'apt_workbench_wiring_001');
  assert.equal(detailResponse.body.detail.caseId, 'case_workbench_wiring_detail_001');
  assert.deepEqual(detailResponse.body.detail.evidenceRefs[0], {
    id: 'file_wiring_photo_001',
    label: 'safe photo',
    type: 'photo',
  });

  assertDbCalls(dbClient.calls);
  assertNoForbiddenOutput([
    contextResponse.body,
    listResponse.body,
    detailResponse.body,
  ]);
}

test('Task1724 createApp wires top-level injected Workbench dbClient into safe DB-backed reads', async () => {
  const dbClient = createFakeDbClient();
  const app = createApp({
    engineerMobileWorkbenchDbClient: dbClient,
  });

  assert.equal(dbClient.calls.length, 0, 'dbClient must not be queried during app creation');

  await assertWorkbenchReadsUseDbProvider(app, dbClient);
});

test('Task1724 createServerBootstrap wires nested Workbench dbClient without startup query', async () => {
  const dbClient = createFakeDbClient();
  const bootstrap = createServerBootstrap({
    engineerMobileWorkbench: {
      dbClient,
    },
  });

  assert.equal(dbClient.calls.length, 0, 'dbClient must not be queried during server bootstrap');

  await assertWorkbenchReadsUseDbProvider(bootstrap.app, dbClient);
});

test('Task1724 Workbench skeleton remains safe without injected dbClient', async () => {
  const bootstrap = createServerBootstrap({
    engineerMobileWorkbenchDbClient: null,
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
    '/api/v1/engineer/mobile-workbench/tasks/apt_workbench_wiring_001'
  );

  assert.equal(contextResponse.statusCode, 501);
  assert.equal(listResponse.statusCode, 501);
  assert.equal(detailResponse.statusCode, 501);
  assert.notEqual(contextResponse.bodyText.length, 0);
  assert.notEqual(listResponse.bodyText.length, 0);
  assert.notEqual(detailResponse.bodyText.length, 0);
  assertNoForbiddenOutput([
    contextResponse.body,
    listResponse.body,
    detailResponse.body,
  ]);
});

test('Task1724 explicit Workbench providers keep priority over dbClient shortcut', async () => {
  const dbClient = createFakeDbClient();
  const bootstrap = createServerBootstrap({
    engineerMobileWorkbench: {
      dbClient,
      contextProvider: {
        getCurrentContext() {
          return {
            engineerDisplayName: 'Explicit Provider',
            organizationName: 'Explicit Org',
          };
        },
      },
    },
  });

  const response = await requestApp(
    bootstrap.app,
    '/api/v1/engineer/mobile-workbench/context'
  );

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.context.engineerDisplayName, 'Explicit Provider');
  assert.equal(dbClient.calls.length, 0);
  assertNoForbiddenOutput(response.body);
});

test('Task1724 app and server wiring stay injected-only and read-only', () => {
  const appSource = fs.readFileSync(appFile, 'utf8');
  const serverSource = fs.readFileSync(serverFile, 'utf8');
  const combined = `${appSource}\n${serverSource}`;

  assert.match(combined, /createEngineerMobileWorkbenchDbReadProviderFactory/);
  assert.match(combined, /engineerMobileWorkbenchDbClient/);

  for (const source of [appSource, serverSource]) {
    const start = source.indexOf('function buildEngineerMobileWorkbenchDbReadOptions');
    const end = source.indexOf('function omitEngineerMobileWorkbenchDbReadOptions', start);
    const dbReadFunction = source.slice(start, end);

    assert.notEqual(start, -1);
    assert.notEqual(end, -1);
    assert.doesNotMatch(dbReadFunction, /process\.env|DATABASE_URL|loadDefaultPool|db\/pool|createPool/i);
    assert.doesNotMatch(dbReadFunction, /\b(insert|update|delete|truncate|alter|drop)\b/i);
    assert.doesNotMatch(dbReadFunction, /field_service_reports|final_appointment_id|finalAppointmentId/i);
    assert.doesNotMatch(dbReadFunction, /line|sms|email|webhook|openai|rag|vector|billing|settlement/i);
  }
});
