'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Readable, Writable } = require('node:stream');
const test = require('node:test');

const {
  createEngineerMobileWorkbenchDbReadProviderFactory,
} = require('../../src/engineerMobileWorkbench/engineerMobileWorkbenchDbReadProviderFactory');
const {
  createServerBootstrap,
} = require('../../src/server');

const repoRoot = path.resolve(__dirname, '../..');
const sourceFile = path.join(
  repoRoot,
  'src/engineerMobileWorkbench/engineerMobileWorkbenchDbReadProviderFactory.js'
);
const docFile = path.join(
  repoRoot,
  'docs/task-1722-engineer-mobile-workbench-db-read-provider-factory-no-migration.md'
);

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
  req.auth = {
    organizationId: 'org_workbench_db_001',
    engineerId: 'eng_workbench_db_001',
    userId: 'user_workbench_db_001',
    role: 'engineer',
    permissions: [
      'engineer_mobile.tasks.read',
      'engineer_mobile.workbench.access',
    ],
    ...authOverrides,
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
    organization_id: 'org_workbench_db_001',
    case_id: 'case_workbench_db_001',
    appointment_id: 'apt_workbench_db_001',
    assigned_engineer_id: 'eng_workbench_db_001',
    scheduled_start: '2026-05-21T09:00:00.000Z',
    scheduled_end: '2026-05-21T10:00:00.000Z',
    status: 'confirmed',
    customer_name_masked: 'Customer DB',
    customer_phone_masked: '09xx-xxx-123',
    address_summary: 'Taipei',
    product_summary: 'AC',
    issue_summary: 'Not cooling',
    service_summary: 'Repair visit',
    service_type: 'repair',
    site_note_safe: 'Front desk check-in',
    checklist_summary: [
      {
        id: 'check_power',
        label: 'Power checked',
      },
    ],
    evidence_refs: [
      {
        id: 'file_photo_db_001',
        label: 'before photo',
        type: 'photo',
      },
    ],
    raw_phone: 'raw_phone_should_not_leak',
    raw_address: 'raw_address_should_not_leak',
    token: 'token_should_not_leak',
    secret: 'secret_should_not_leak',
    internal_note: 'internal_note_should_not_leak',
    audit_log: 'audit_log_should_not_leak',
    ai_raw_payload: 'ai_raw_payload_should_not_leak',
    billing_internal: 'billing_internal_should_not_leak',
    settlement_internal: 'settlement_internal_should_not_leak',
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
      calls.push({
        sql,
        values,
      });

      if (/from users u/i.test(sql)) {
        return {
          rows: [
            {
              engineer_display_name: 'Engineer DB',
              organization_name: 'DB Org',
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
              case_id: 'case_workbench_db_detail_001',
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
    'internal_note_should_not_leak',
    'audit_log_should_not_leak',
    'ai_raw_payload_should_not_leak',
    'billing_internal_should_not_leak',
    'settlement_internal_should_not_leak',
    'final_appointment_should_not_leak',
    '"finalAppointmentId"',
    '"final_appointment_id"',
    '"fieldServiceReportId"',
    '"serviceReportId"',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('Task1722 injected DB-backed Workbench provider returns safe context list and detail', async () => {
  const dbClient = createFakeDbClient();
  const bootstrap = createServerBootstrap({
    engineerMobileWorkbench: createEngineerMobileWorkbenchDbReadProviderFactory({
      dbClient,
    }),
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
    '/api/v1/engineer/mobile-workbench/tasks/apt_workbench_db_001'
  );

  assert.equal(contextResponse.statusCode, 200);
  assert.equal(contextResponse.body.status, 'allow');
  assert.equal(contextResponse.body.context.engineerDisplayName, 'Engineer DB');
  assert.equal(contextResponse.body.context.organizationName, 'DB Org');

  assert.equal(listResponse.statusCode, 200);
  assert.equal(listResponse.body.status, 'allow');
  assert.deepEqual(listResponse.body.tasks.map((task) => task.appointmentId), [
    'apt_workbench_db_001',
  ]);

  assert.equal(detailResponse.statusCode, 200);
  assert.equal(detailResponse.body.status, 'allow');
  assert.equal(detailResponse.body.detail.appointmentId, 'apt_workbench_db_001');
  assert.equal(detailResponse.body.detail.caseId, 'case_workbench_db_detail_001');
  assert.deepEqual(detailResponse.body.detail.evidenceRefs[0], {
    id: 'file_photo_db_001',
    label: 'before photo',
    type: 'photo',
  });

  assert.equal(dbClient.calls.length, 3);
  assert.deepEqual(dbClient.calls[0].values, [
    'org_workbench_db_001',
    'eng_workbench_db_001',
  ]);
  assert.deepEqual(dbClient.calls[1].values, [
    'org_workbench_db_001',
    'eng_workbench_db_001',
    null,
    null,
  ]);
  assert.deepEqual(dbClient.calls[2].values, [
    'org_workbench_db_001',
    'eng_workbench_db_001',
    'apt_workbench_db_001',
  ]);

  for (const call of dbClient.calls) {
    assert.match(call.sql, /^select/i);
    assert.doesNotMatch(call.sql, /\b(insert|update|delete|truncate|alter|drop)\b/i);
    assert.doesNotMatch(call.sql, /field_service_reports|final_appointment_id/i);
  }
  assertNoForbiddenOutput([
    contextResponse.body,
    listResponse.body,
    detailResponse.body,
  ]);
});

test('Task1722 context fails closed without injected dbClient query and task reads stay empty', async () => {
  const bootstrap = createServerBootstrap({
    engineerMobileWorkbench: createEngineerMobileWorkbenchDbReadProviderFactory(),
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
    '/api/v1/engineer/mobile-workbench/tasks/apt_workbench_db_001'
  );

  assert.equal(contextResponse.statusCode, 403);
  assert.equal(contextResponse.body.status, 'deny');
  assert.equal(listResponse.statusCode, 200);
  assert.deepEqual(listResponse.body.tasks, []);
  assert.equal(detailResponse.statusCode, 404);
  assert.equal(detailResponse.body.status, 'deny');
  assertNoForbiddenOutput([
    contextResponse.body,
    listResponse.body,
    detailResponse.body,
  ]);
});

test('Task1722 factory source and doc keep no-default-DB and no-write boundaries', () => {
  const source = fs.readFileSync(sourceFile, 'utf8');
  const doc = fs.readFileSync(docFile, 'utf8');

  assert.doesNotMatch(source, /require\(['"].*(?:db\/pool|config\/env|repositories\/BaseRepository|FieldServiceReportRepository|AppointmentRepository)['"]\)/i);
  assert.doesNotMatch(source, /\b(pool|DATABASE_URL|process\.env|psql|db:migrate)\b/i);
  assert.doesNotMatch(source, /\b(insert|update|delete|truncate|alter|drop)\b/i);
  assert.doesNotMatch(source, /field_service_reports|final_appointment_id|finalAppointmentId/i);
  assert.doesNotMatch(source, /line|sms|email|webhook|openai|rag|vector|billing|settlement/i);

  assert.match(doc, /injected dbClient\.query only/i);
  assert.match(doc, /No default DB/i);
  assert.match(doc, /No migration apply/i);
  assert.match(doc, /No Field Service Report write/i);
  assert.match(doc, /finalAppointmentId remains backend\/system-owned/i);
});
