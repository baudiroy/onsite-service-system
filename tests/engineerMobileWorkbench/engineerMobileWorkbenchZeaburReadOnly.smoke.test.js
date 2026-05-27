'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const { Readable, Writable } = require('node:stream');
const test = require('node:test');
const { Pool } = require('pg');

const { createApp } = require('../../src/app');
const { createServerBootstrap } = require('../../src/server');

const SECRET_FILE_PATH = '/private/tmp/task1696_zeabur_smoke_secrets.json';

const REQUIRED_TABLE_COLUMNS = {
  engineer_mobile_task_read_models: [
    'organization_id',
    'case_id',
    'appointment_id',
    'assigned_engineer_id',
    'scheduled_start',
    'scheduled_end',
    'status',
    'customer_name_masked',
    'customer_phone_masked',
    'address_summary',
    'product_summary',
    'issue_summary',
    'service_summary',
    'service_type',
    'site_note_safe',
    'checklist_summary',
    'evidence_refs',
  ],
  organizations: [
    'id',
    'organization_code',
    'organization_name',
  ],
  user_organizations: [
    'user_id',
    'organization_id',
    'deleted_at',
  ],
  users: [
    'id',
    'display_name',
    'mobile',
    'user_type',
    'status',
    'password_hash',
    'auth_provider',
    'deleted_at',
  ],
};

function safeString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function isLocalDatabaseUrl(value) {
  return /(?:localhost|127\.0\.0\.1|\[?::1\]?)/i.test(String(value || ''));
}

function readSecretDatabaseUrl() {
  if (!fs.existsSync(SECRET_FILE_PATH)) {
    return undefined;
  }

  const parsed = JSON.parse(fs.readFileSync(SECRET_FILE_PATH, 'utf8'));
  return safeString(parsed.databaseUrl);
}

function requireZeaburDatabaseUrl() {
  const candidates = [
    process.env.TASK1726_ZEABUR_DATABASE_URL,
    process.env.ZEABUR_DATABASE_URL,
    readSecretDatabaseUrl(),
    process.env.DATABASE_URL,
  ].map(safeString).filter(Boolean);

  const databaseUrl = candidates.find((candidate) => !isLocalDatabaseUrl(candidate));

  if (!databaseUrl) {
    throw new Error('A non-local Zeabur DATABASE_URL is required for this smoke test and was not printed.');
  }

  return databaseUrl;
}

function createDbClient(pool) {
  const calls = [];

  return {
    calls,
    async query(text, params) {
      calls.push({ text, params });
      const result = await pool.query(text, params);

      return {
        ...result,
        rows: result.rows.map((row) => ({ ...row })),
      };
    },
  };
}

function uniqueText(prefix) {
  return `${prefix}_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
}

function auth({ organizationId, engineerId }) {
  return {
    engineerId,
    organizationId,
    permissions: [
      'engineer_mobile.tasks.read',
      'engineer_mobile.workbench.access',
    ],
    role: 'engineer',
    userId: engineerId,
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

function requestApp(app, pathname, requestAuth) {
  return new Promise((resolve, reject) => {
    const req = createRequest(pathname, requestAuth);
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

async function columnSet(pool, tableName) {
  const result = await pool.query(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = $1
      ORDER BY column_name
    `,
    [tableName],
  );

  return new Set(result.rows.map((row) => row.column_name));
}

async function introspectRequiredSchema(pool) {
  const missing = [];

  for (const [tableName, requiredColumns] of Object.entries(REQUIRED_TABLE_COLUMNS)) {
    const columns = await columnSet(pool, tableName);

    if (columns.size === 0) {
      missing.push(`${tableName}.*`);
      continue;
    }

    for (const columnName of requiredColumns) {
      if (!columns.has(columnName)) {
        missing.push(`${tableName}.${columnName}`);
      }
    }
  }

  return {
    missing,
    ok: missing.length === 0,
  };
}

async function seedWorkbenchRows(pool, ids) {
  await pool.query(
    [
      'INSERT INTO organizations (id, organization_code, organization_name)',
      'VALUES ($1, $2, $3), ($4, $5, $6)',
    ].join('\n'),
    [
      ids.organizationId,
      uniqueText('task1726_org'),
      'Task1726 Test Organization',
      ids.otherOrganizationId,
      uniqueText('task1726_other_org'),
      'Task1726 Other Organization',
    ],
  );

  await pool.query(
    [
      'INSERT INTO users (',
      '  id, display_name, mobile, user_type, status, password_hash, auth_provider, external_auth_id, metadata',
      ') VALUES (',
      '  $1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb',
      '), (',
      '  $10, $11, $12, $13, $14, $15, $16, $17, $18::jsonb',
      ')',
    ].join('\n'),
    [
      ids.engineerId,
      'Task1726 Engineer',
      'raw_phone_should_not_leak',
      'engineer',
      'active',
      'secret_should_not_leak',
      'system',
      uniqueText('task1726_engineer_ext'),
      JSON.stringify({ token: 'token_should_not_leak' }),
      ids.otherEngineerId,
      'Task1726 Other Engineer',
      'other_raw_phone_should_not_leak',
      'engineer',
      'active',
      'other_secret_should_not_leak',
      'system',
      uniqueText('task1726_other_engineer_ext'),
      JSON.stringify({ token: 'other_token_should_not_leak' }),
    ],
  );

  await pool.query(
    [
      'INSERT INTO user_organizations (user_id, organization_id, role_note)',
      'VALUES ($1, $2, $3), ($4, $5, $6)',
    ].join('\n'),
    [
      ids.engineerId,
      ids.organizationId,
      'task1726 primary engineer',
      ids.otherEngineerId,
      ids.organizationId,
      'task1726 other engineer',
    ],
  );

  await pool.query(
    [
      'INSERT INTO engineer_mobile_task_read_models (',
      '  organization_id, case_id, appointment_id, assigned_engineer_id,',
      '  scheduled_start, scheduled_end, status, customer_name_masked, customer_phone_masked,',
      '  address_summary, product_summary, issue_summary, service_summary, service_type,',
      '  site_note_safe, checklist_summary, evidence_refs',
      ') VALUES (',
      '  $1, $2, $3, $4, $5::timestamptz, $6::timestamptz, $7, $8, $9,',
      '  $10, $11, $12, $13, $14, $15, $16::jsonb, $17::jsonb',
      '), (',
      '  $18, $19, $20, $21, $22::timestamptz, $23::timestamptz, $24, $25, $26,',
      '  $27, $28, $29, $30, $31, $32, $33::jsonb, $34::jsonb',
      '), (',
      '  $35, $36, $37, $38, $39::timestamptz, $40::timestamptz, $41, $42, $43,',
      '  $44, $45, $46, $47, $48, $49, $50::jsonb, $51::jsonb',
      ')',
    ].join('\n'),
    [
      ids.organizationId,
      ids.caseId,
      ids.appointmentId,
      ids.engineerId,
      '2026-05-27T01:00:00.000Z',
      '2026-05-27T02:00:00.000Z',
      'confirmed',
      'Task1726 Customer',
      '09xx-xxx-1726',
      'Task1726 safe address area',
      'Task1726 Product',
      'Task1726 safe issue summary',
      'Task1726 safe service summary',
      'repair',
      'Task1726 safe site note',
      JSON.stringify([{ id: 'check_task1726_power', label: 'Power checked' }]),
      JSON.stringify([
        { id: 'file_task1726_safe_photo', label: 'safe photo', type: 'photo' },
        { id: 'signed_url_should_not_leak', label: 'unsafe', type: 'photo', url: 'https://example.invalid/signed?token=token_should_not_leak' },
      ]),
      ids.organizationId,
      ids.otherEngineerCaseId,
      ids.otherEngineerAppointmentId,
      ids.otherEngineerId,
      '2026-05-27T03:00:00.000Z',
      '2026-05-27T04:00:00.000Z',
      'confirmed',
      'Task1726 Other Engineer Customer',
      '09xx-xxx-0002',
      'Task1726 other engineer address area',
      'Task1726 Other Product',
      'Task1726 other engineer issue summary',
      'Task1726 other engineer service summary',
      'repair',
      'Task1726 other engineer safe note',
      JSON.stringify([]),
      JSON.stringify([]),
      ids.otherOrganizationId,
      ids.otherOrgCaseId,
      ids.otherOrgAppointmentId,
      ids.engineerId,
      '2026-05-27T05:00:00.000Z',
      '2026-05-27T06:00:00.000Z',
      'confirmed',
      'Task1726 Other Org Customer',
      '09xx-xxx-0003',
      'Task1726 other org address area',
      'Task1726 Other Org Product',
      'Task1726 other org issue summary',
      'Task1726 other org service summary',
      'repair',
      'Task1726 other org safe note',
      JSON.stringify([]),
      JSON.stringify([]),
    ],
  );
}

async function cleanupWorkbenchRows(pool, ids) {
  const organizationIds = [ids.organizationId, ids.otherOrganizationId];
  const userIds = [ids.engineerId, ids.otherEngineerId];

  await pool.query(
    'DELETE FROM engineer_mobile_task_read_models WHERE organization_id = ANY($1::uuid[])',
    [organizationIds],
  ).catch(() => {});
  await pool.query(
    'DELETE FROM user_organizations WHERE user_id = ANY($1::uuid[]) OR organization_id = ANY($2::uuid[])',
    [userIds, organizationIds],
  ).catch(() => {});
  await pool.query(
    'DELETE FROM users WHERE id = ANY($1::uuid[])',
    [userIds],
  ).catch(() => {});
  await pool.query(
    'DELETE FROM organizations WHERE id = ANY($1::uuid[])',
    [organizationIds],
  ).catch(() => {});
}

function assertNoForbiddenOutput(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'raw_phone_should_not_leak',
    'other_raw_phone_should_not_leak',
    'token_should_not_leak',
    'other_token_should_not_leak',
    'secret_should_not_leak',
    'other_secret_should_not_leak',
    'signed_url_should_not_leak',
    'final_appointment_should_not_leak',
    'finalAppointmentId',
    'final_appointment_id',
    'fieldServiceReportId',
    'serviceReportId',
    'password_hash',
    'metadata',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

function assertDbReadCallsAreSelectOnly(calls) {
  assert.ok(calls.length >= 3, 'expected DB-backed reads to use injected dbClient');

  for (const call of calls) {
    assert.match(call.text, /^select/i);
    assert.doesNotMatch(call.text, /\b(insert|update|delete|truncate|alter|drop|create)\b/i);
    assert.doesNotMatch(call.text, /field_service_reports|final_appointment_id|finalAppointmentId/i);
  }
}

async function assertWorkbenchEndpointsReadZeaburRows(app, ids) {
  const currentAuth = {
    engineerId: ids.engineerId,
    organizationId: ids.organizationId,
  };

  const contextResponse = await requestApp(
    app,
    '/api/v1/engineer/mobile-workbench/context',
    currentAuth,
  );
  const listResponse = await requestApp(
    app,
    '/api/v1/engineer/mobile-workbench/tasks',
    currentAuth,
  );
  const detailResponse = await requestApp(
    app,
    `/api/v1/engineer/mobile-workbench/tasks/${ids.appointmentId}`,
    currentAuth,
  );

  assert.equal(contextResponse.statusCode, 200);
  assert.equal(contextResponse.body.status, 'allow');
  assert.equal(contextResponse.body.context.engineerDisplayName, 'Task1726 Engineer');
  assert.equal(contextResponse.body.context.organizationName, 'Task1726 Test Organization');

  assert.equal(listResponse.statusCode, 200);
  assert.equal(listResponse.body.status, 'allow');
  assert.deepEqual(listResponse.body.tasks.map((task) => task.appointmentId), [
    ids.appointmentId,
  ]);
  assert.equal(listResponse.body.tasks[0].caseId, ids.caseId);
  assert.equal(listResponse.body.tasks[0].customerPhoneMasked, '09xx-xxx-1726');

  assert.equal(detailResponse.statusCode, 200);
  assert.equal(detailResponse.body.status, 'allow');
  assert.equal(detailResponse.body.detail.appointmentId, ids.appointmentId);
  assert.equal(detailResponse.body.detail.assignedEngineerId, ids.engineerId);
  assert.equal(detailResponse.body.detail.caseId, ids.caseId);
  assert.equal(detailResponse.body.detail.organizationId, ids.organizationId);
  assert.deepEqual(detailResponse.body.detail.evidenceRefs, [
    { id: 'file_task1726_safe_photo', label: 'safe photo', type: 'photo' },
  ]);

  const wrongEngineerListResponse = await requestApp(
    app,
    '/api/v1/engineer/mobile-workbench/tasks',
    {
      engineerId: ids.otherEngineerId,
      organizationId: ids.organizationId,
    },
  );
  const wrongEngineerDetailResponse = await requestApp(
    app,
    `/api/v1/engineer/mobile-workbench/tasks/${ids.appointmentId}`,
    {
      engineerId: ids.otherEngineerId,
      organizationId: ids.organizationId,
    },
  );
  const wrongOrganizationDetailResponse = await requestApp(
    app,
    `/api/v1/engineer/mobile-workbench/tasks/${ids.appointmentId}`,
    {
      engineerId: ids.engineerId,
      organizationId: ids.otherOrganizationId,
    },
  );

  assert.equal(wrongEngineerListResponse.statusCode, 200);
  assert.deepEqual(wrongEngineerListResponse.body.tasks.map((task) => task.appointmentId), [
    ids.otherEngineerAppointmentId,
  ]);
  assert.equal(wrongEngineerDetailResponse.statusCode, 404);
  assert.equal(wrongEngineerDetailResponse.body.status, 'deny');
  assert.equal(wrongOrganizationDetailResponse.statusCode, 404);
  assert.equal(wrongOrganizationDetailResponse.body.status, 'deny');

  assertNoForbiddenOutput([
    contextResponse.body,
    listResponse.body,
    detailResponse.body,
    wrongEngineerListResponse.body,
    wrongEngineerDetailResponse.body,
    wrongOrganizationDetailResponse.body,
  ]);
}

test('Task1726 Zeabur read-only smoke uses app/server Workbench DB wiring without app.listen', async (t) => {
  const pool = new Pool({
    connectionString: requireZeaburDatabaseUrl(),
    max: 1,
  });
  const ids = {
    appointmentId: crypto.randomUUID(),
    caseId: crypto.randomUUID(),
    engineerId: crypto.randomUUID(),
    organizationId: crypto.randomUUID(),
    otherEngineerAppointmentId: crypto.randomUUID(),
    otherEngineerCaseId: crypto.randomUUID(),
    otherEngineerId: crypto.randomUUID(),
    otherOrgAppointmentId: crypto.randomUUID(),
    otherOrgCaseId: crypto.randomUUID(),
    otherOrganizationId: crypto.randomUUID(),
  };

  try {
    const schema = await introspectRequiredSchema(pool);

    if (!schema.ok) {
      t.skip(`safe block: required_schema_missing; missing=${schema.missing.join(',')}`);
      return;
    }

    await seedWorkbenchRows(pool, ids);

    const serverDbClient = createDbClient(pool);
    const bootstrap = createServerBootstrap({
      engineerMobileWorkbench: {
        dbClient: serverDbClient,
      },
    });

    await assertWorkbenchEndpointsReadZeaburRows(bootstrap.app, ids);
    assertDbReadCallsAreSelectOnly(serverDbClient.calls);

    const appDbClient = createDbClient(pool);
    const app = createApp({
      engineerMobileWorkbenchDbClient: appDbClient,
    });

    await assertWorkbenchEndpointsReadZeaburRows(app, ids);
    assertDbReadCallsAreSelectOnly(appDbClient.calls);
  } finally {
    await cleanupWorkbenchRows(pool, ids);
    await pool.end();
  }
});
