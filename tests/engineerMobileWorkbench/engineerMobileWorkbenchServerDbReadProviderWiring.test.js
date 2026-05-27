'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Readable, Writable } = require('node:stream');
const test = require('node:test');

const { createServerBootstrap } = require('../../src/server');

const repoRoot = path.resolve(__dirname, '../..');
const appSourcePath = path.join(repoRoot, 'src/app.js');
const serverSourcePath = path.join(repoRoot, 'src/server.js');

function auth(overrides = {}) {
  return {
    organizationId: 'org_task1730_001',
    engineerId: 'eng_task1730_001',
    userId: 'eng_task1730_001',
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
    organization_id: 'org_task1730_001',
    case_id: 'case_task1730_001',
    appointment_id: 'apt_task1730_001',
    assigned_engineer_id: 'eng_task1730_001',
    scheduled_start: '2026-05-27T09:00:00.000Z',
    scheduled_end: '2026-05-27T10:00:00.000Z',
    status: 'confirmed',
    customer_name_masked: 'Task1730 Customer',
    customer_phone_masked: '09xx-xxx-1730',
    address_summary: 'Task1730 safe area',
    product_summary: 'Task1730 product',
    issue_summary: 'Task1730 safe issue',
    service_summary: 'Task1730 safe service',
    service_type: 'repair',
    site_note_safe: 'Task1730 safe note',
    evidence_refs: [
      {
        id: 'file_task1730_photo',
        label: 'safe photo',
        type: 'photo',
      },
      {
        id: 'signed_url_should_not_leak',
        label: 'unsafe',
        type: 'photo',
        url: 'https://example.invalid/signed?token=token_should_not_leak',
      },
    ],
    raw_phone: 'raw_phone_should_not_leak',
    token: 'token_should_not_leak',
    secret: 'secret_should_not_leak',
    final_appointment_id: 'final_appointment_should_not_leak',
    ...overrides,
  };
}

function createFakeDbClient() {
  const calls = [];

  return {
    calls,
    async query(sql, values) {
      calls.push({ sql, values });

      if (/from users u/i.test(sql)) {
        return {
          rows: [
            {
              engineer_display_name: 'Task1730 Engineer',
              organization_name: 'Task1730 Organization',
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
              case_id: 'case_task1730_detail_001',
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

      throw new Error('unexpected Task1730 query');
    },
  };
}

function assertNoForbiddenOutput(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'raw_phone_should_not_leak',
    'token_should_not_leak',
    'secret_should_not_leak',
    'final_appointment_should_not_leak',
    'signed_url_should_not_leak',
    'apt_wrong_org_should_not_appear',
    'apt_wrong_engineer_should_not_appear',
    'fieldServiceReportId',
    'serviceReportId',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

function assertReadOnlyDbCalls(calls) {
  assert.equal(calls.length, 3);

  for (const call of calls) {
    assert.match(call.sql, /^select/i);
    assert.doesNotMatch(call.sql, /\b(insert|update|delete|truncate|alter|drop|create)\b/i);
    assert.doesNotMatch(call.sql, /field_service_reports|final_appointment_id|finalAppointmentId/i);
  }
}

test('Task1730 server Workbench dbClient shortcut reaches DB-backed read-only providers without app.listen', async () => {
  const dbClient = createFakeDbClient();
  const bootstrap = createServerBootstrap({
    engineerMobileWorkbenchDbClient: dbClient,
  });

  assert.equal(dbClient.calls.length, 0, 'dbClient must not be queried during bootstrap');

  const contextResponse = await requestApp(
    bootstrap.app,
    '/api/v1/engineer/mobile-workbench/context',
  );
  const listResponse = await requestApp(
    bootstrap.app,
    '/api/v1/engineer/mobile-workbench/tasks',
  );
  const detailResponse = await requestApp(
    bootstrap.app,
    '/api/v1/engineer/mobile-workbench/tasks/apt_task1730_001',
  );

  assert.equal(contextResponse.statusCode, 200);
  assert.equal(contextResponse.body.status, 'allow');
  assert.equal(contextResponse.body.context.engineerDisplayName, 'Task1730 Engineer');
  assert.equal(contextResponse.body.context.organizationName, 'Task1730 Organization');

  assert.equal(listResponse.statusCode, 200);
  assert.equal(listResponse.body.status, 'allow');
  assert.deepEqual(listResponse.body.tasks.map((task) => task.appointmentId), [
    'apt_task1730_001',
  ]);

  assert.equal(detailResponse.statusCode, 200);
  assert.equal(detailResponse.body.status, 'allow');
  assert.equal(detailResponse.body.detail.appointmentId, 'apt_task1730_001');
  assert.equal(detailResponse.body.detail.caseId, 'case_task1730_detail_001');
  assert.deepEqual(detailResponse.body.detail.evidenceRefs, [
    {
      id: 'file_task1730_photo',
      label: 'safe photo',
      type: 'photo',
    },
  ]);

  assertReadOnlyDbCalls(dbClient.calls);
  assertNoForbiddenOutput([
    contextResponse.body,
    listResponse.body,
    detailResponse.body,
  ]);
});

test('Task1730 node server entrypoint configures deployed Workbench DB provider without changing packages', () => {
  const appSource = fs.readFileSync(appSourcePath, 'utf8');
  const serverSource = fs.readFileSync(serverSourcePath, 'utf8');

  assert.match(serverSource, /if \(require\.main === module\) \{/);
  assert.match(serverSource, /const pool = loadDefaultPool\(\);/);
  assert.match(serverSource, /engineerMobileWorkbenchDbClient: pool/);
  assert.match(serverSource, /createWorkbenchHttpContext/);
  assert.match(serverSource, /\/api\/v1\/engineer\/mobile-workbench/);
  assert.match(appSource, /engineerMobileWorkbenchHttpContext/);
  assert.doesNotMatch(serverSource, /engineerMobileWorkbenchDbClient:\s*loadDefaultPool\(\)\.query/);
  assert.doesNotMatch(appSource, /\b(insert|update|delete|truncate|alter|drop|create table)\b/i);
});
