'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const test = require('node:test');
const { Pool } = require('pg');

const {
  resolveServerApp,
} = require('../../src/server');
const {
  REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH,
} = require('../../src/routes/repairIntakeDraftToCase.routes');

const optionRootKey = ['repair', 'Intake', 'Draft', 'To', 'Case'].join('');
const idGeneratorOptionKey = `${optionRootKey}IdGenerator`;
const caseNumberGeneratorOptionKey = `${optionRootKey}CaseNumberGenerator`;

const REQUIRED_TABLE_COLUMNS = {
  cases: [
    'id',
    'case_no',
    'customer_id',
    'organization_id',
    'status',
    'priority',
    'source',
    'brand',
    'case_type',
    'product_type',
    'model_no',
    'problem_description',
    'service_region',
    'metadata',
    'created_at',
  ],
  customers: [
    'id',
    'customer_name',
    'mobile',
    'city',
    'address',
    'source',
    'metadata',
    'organization_id',
  ],
  organizations: [
    'id',
    'organization_code',
    'organization_name',
  ],
  repair_intake_audit_events: [
    'id',
    'organization_id',
    'tenant_id',
    'event_type',
    'draft_id',
    'case_id',
    'case_ref',
    'actor_id',
    'actor_type',
    'request_id',
    'decision',
    'outcome',
    'reason_code',
    'safe_metadata',
    'visibility',
    'occurred_at',
  ],
  repair_intake_draft_case_conversions: [
    'id',
    'organization_id',
    'tenant_id',
    'draft_id',
    'case_id',
    'case_ref',
    'conversion_status',
    'idempotency_key',
    'actor_id',
    'actor_type',
    'request_id',
    'safe_metadata',
    'submitted_at',
    'converted_at',
  ],
  repair_intake_drafts: [
    'id',
    'organization_id',
    'tenant_id',
    'draft_status',
    'source',
    'source_ref',
    'intake_source',
    'safe_summary',
    'safe_metadata',
    'validation_status',
    'validation_errors_safe',
    'converted_at',
  ],
  repair_intake_idempotency_records: [
    'id',
    'organization_id',
    'tenant_id',
    'idempotency_key',
    'operation_type',
    'draft_id',
    'safe_request_fingerprint',
    'replay_case_id',
    'replay_case_ref',
    'replay_result_safe',
    'record_status',
    'completed_at',
  ],
};

function requireDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required for the Zeabur server startup smoke test and was not printed.');
  }

  return databaseUrl;
}

function uniqueText(prefix) {
  return `${prefix}_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
}

function createDbClient(pool) {
  return {
    query: async (text, params) => {
      const result = await pool.query(text, params);

      return {
        ...result,
        rows: result.rows.map((row) => ({ ...row })),
      };
    },
  };
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
    ok: missing.length === 0,
    missing,
  };
}

function routeLayers(layerContainer) {
  const stack = Array.isArray(layerContainer && layerContainer.stack)
    ? layerContainer.stack
    : [];
  const layers = [];

  for (const layer of stack) {
    if (layer && layer.route) {
      layers.push(layer);
      continue;
    }

    if (layer && layer.handle && Array.isArray(layer.handle.stack)) {
      layers.push(...routeLayers(layer.handle));
    }
  }

  return layers;
}

function findRoute(app, method, pathname) {
  return routeLayers(app._router).find((layer) => (
    layer.route
    && layer.route.path === pathname
    && layer.route.methods[method.toLowerCase()]
  ));
}

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

function invokeLayer(layer, req, res) {
  return new Promise((resolve) => {
    let settled = false;

    function finish(error) {
      if (settled) {
        return;
      }

      settled = true;
      resolve(error || null);
    }

    try {
      const maybePromise = layer.handle(req, res, finish);

      if (maybePromise && typeof maybePromise.then === 'function') {
        maybePromise.then(() => finish()).catch(finish);
        return;
      }

      if (layer.handle.length < 3) {
        finish();
      }
    } catch (error) {
      finish(error);
    }
  });
}

async function dispatchRoute(route, req) {
  const res = createResponse();

  for (const layer of route.route.stack) {
    const error = await invokeLayer(layer, req, res);

    if (error) {
      return {
        error,
        res,
      };
    }
  }

  return {
    error: null,
    res,
  };
}

async function cleanup(pool, ids) {
  const {
    auditEventId,
    caseId,
    conversionId,
    customerId,
    draftId,
    idempotencyKey,
    organizationId,
    tenantId,
  } = ids;

  await pool.query(
    [
      'DELETE FROM repair_intake_audit_events',
      'WHERE id = $1',
      '  AND organization_id = $2',
      '  AND tenant_id = $3',
    ].join('\n'),
    [auditEventId, organizationId, tenantId],
  ).catch(() => {});
  await pool.query(
    [
      'DELETE FROM repair_intake_idempotency_records',
      'WHERE organization_id = $1',
      '  AND tenant_id = $2',
      "  AND operation_type = 'draft_to_case'",
      '  AND idempotency_key = $3',
    ].join('\n'),
    [organizationId, tenantId, idempotencyKey],
  ).catch(() => {});
  await pool.query(
    [
      'DELETE FROM repair_intake_draft_case_conversions',
      'WHERE id = $1',
      '  AND organization_id = $2',
      '  AND tenant_id = $3',
    ].join('\n'),
    [conversionId, organizationId, tenantId],
  ).catch(() => {});
  await pool.query('DELETE FROM cases WHERE id = $1 AND organization_id = $2', [caseId, organizationId]).catch(() => {});
  await pool.query(
    [
      'DELETE FROM repair_intake_drafts',
      'WHERE id = $1',
      '  AND organization_id = $2',
      '  AND tenant_id = $3',
    ].join('\n'),
    [draftId, organizationId, tenantId],
  ).catch(() => {});
  await pool.query('DELETE FROM customers WHERE id = $1 AND organization_id = $2', [customerId, organizationId]).catch(() => {});
  await pool.query('DELETE FROM organizations WHERE id = $1', [organizationId]).catch(() => {});
}

async function assertCleaned(pool, ids) {
  const {
    auditEventId,
    caseId,
    conversionId,
    customerId,
    draftId,
    idempotencyKey,
    organizationId,
    tenantId,
  } = ids;
  const checks = [
    {
      name: 'repair_intake_audit_events',
      sql: [
        'SELECT COUNT(*)::int AS count FROM repair_intake_audit_events',
        'WHERE id = $1 AND organization_id = $2 AND tenant_id = $3',
      ].join('\n'),
      params: [auditEventId, organizationId, tenantId],
    },
    {
      name: 'repair_intake_idempotency_records',
      sql: [
        'SELECT COUNT(*)::int AS count FROM repair_intake_idempotency_records',
        'WHERE organization_id = $1',
        '  AND tenant_id = $2',
        "  AND operation_type = 'draft_to_case'",
        '  AND idempotency_key = $3',
      ].join('\n'),
      params: [organizationId, tenantId, idempotencyKey],
    },
    {
      name: 'repair_intake_draft_case_conversions',
      sql: [
        'SELECT COUNT(*)::int AS count FROM repair_intake_draft_case_conversions',
        'WHERE id = $1 AND organization_id = $2 AND tenant_id = $3',
      ].join('\n'),
      params: [conversionId, organizationId, tenantId],
    },
    {
      name: 'cases',
      sql: 'SELECT COUNT(*)::int AS count FROM cases WHERE id = $1 AND organization_id = $2',
      params: [caseId, organizationId],
    },
    {
      name: 'repair_intake_drafts',
      sql: [
        'SELECT COUNT(*)::int AS count FROM repair_intake_drafts',
        'WHERE id = $1 AND organization_id = $2 AND tenant_id = $3',
      ].join('\n'),
      params: [draftId, organizationId, tenantId],
    },
    {
      name: 'customers',
      sql: 'SELECT COUNT(*)::int AS count FROM customers WHERE id = $1 AND organization_id = $2',
      params: [customerId, organizationId],
    },
    {
      name: 'organizations',
      sql: 'SELECT COUNT(*)::int AS count FROM organizations WHERE id = $1',
      params: [organizationId],
    },
  ];

  for (const check of checks) {
    const result = await pool.query(check.sql, check.params);

    assert.equal(result.rows[0].count, 0, `${check.name} cleanup left rows behind`);
  }
}

test('Zeabur smoke resolves server startup app and posts protected admin Draft to Case route', async (t) => {
  const pool = new Pool({
    connectionString: requireDatabaseUrl(),
    max: 1,
  });

  const actorId = crypto.randomUUID();
  const auditEventId = crypto.randomUUID();
  const caseId = crypto.randomUUID();
  const conversionId = crypto.randomUUID();
  const customerId = crypto.randomUUID();
  const draftId = crypto.randomUUID();
  const organizationId = crypto.randomUUID();
  const tenantId = crypto.randomUUID();
  const caseNo = uniqueText('TASK1677_CASE');
  const idempotencyKey = uniqueText('task1677_idem');
  const requestId = uniqueText('task1677_req');
  const sourceRef = uniqueText('task1677_source');
  const ids = {
    auditEventId,
    caseId,
    conversionId,
    customerId,
    draftId,
    idempotencyKey,
    organizationId,
    tenantId,
  };

  try {
    const schema = await introspectRequiredSchema(pool);

    if (!schema.ok) {
      t.skip(`safe block: required_schema_missing; missing=${schema.missing.join(',')}`);
      return;
    }

    await pool.query(
      [
        'INSERT INTO organizations (id, organization_code, organization_name)',
        'VALUES ($1, $2, $3)',
      ].join('\n'),
      [organizationId, uniqueText('task1677_org'), 'Task1677 Test Organization'],
    );

    await pool.query(
      [
        'INSERT INTO customers (',
        '    id, organization_id, customer_name, mobile, city, address, source, metadata',
        ') VALUES (',
        '    $1, $2, $3, $4, $5, $6, $7, $8::jsonb',
        ')',
      ].join('\n'),
      [
        customerId,
        organizationId,
        'Task1677 Test Customer',
        uniqueText('task1677_mobile'),
        'Task1677 City',
        'Task1677 Test Address',
        'website',
        JSON.stringify({ testScope: 'task1677' }),
      ],
    );

    await pool.query(
      [
        'INSERT INTO repair_intake_drafts (',
        '    id, organization_id, tenant_id, draft_status, source, source_ref,',
        '    intake_source, safe_summary, safe_metadata, validation_status, validation_errors_safe',
        ') VALUES (',
        '    $1, $2, $3,',
        "    'ready_for_conversion',",
        "    'website',",
        '    $4,',
        "    'task1677_server_startup_smoke',",
        '    $5::jsonb,',
        '    $6::jsonb,',
        "    'pending',",
        '    $7::jsonb',
        ')',
      ].join('\n'),
      [
        draftId,
        organizationId,
        tenantId,
        sourceRef,
        JSON.stringify({
          customerId,
          title: 'Task1677 safe server startup intake summary',
          source: 'website',
          brand: 'Task1677 Brand',
          productType: 'Task1677 Product',
          modelNo: 'Task1677 Model',
          problemDescription: 'Task1677 safe issue summary',
          serviceRegion: 'Task1677 Region',
        }),
        JSON.stringify({ testScope: 'task1677' }),
        JSON.stringify([]),
      ],
    );

    const app = resolveServerApp({
      env: {
        REPAIR_INTAKE_DRAFT_TO_CASE_ROUTES_ENABLED: 'true',
      },
      [idGeneratorOptionKey]: (scope = {}) => {
        if (scope.kind === 'repair_intake_draft_case_conversion') {
          return conversionId;
        }

        if (scope.kind === 'repair_intake_audit_event') {
          return auditEventId;
        }

        return caseId;
      },
      [caseNumberGeneratorOptionKey]: () => caseNo,
      [optionRootKey]: {
        dbClient: createDbClient(pool),
        clock: () => '2026-05-26T00:00:00.000Z',
      },
    });
    const route = findRoute(app, 'post', REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH);

    assert.ok(route, 'missing protected admin Draft to Case submit route from server startup path');
    assert.equal(route.route.stack.length, 2);
    assert.equal(findRoute(app, 'post', '/api/v1/admin/repair-intake/drafts/:draftId/case/plan'), undefined);

    const response = await dispatchRoute(route, {
      params: {
        draftId,
      },
      context: {
        organizationId,
        requestId,
        tenantId,
      },
      requestId,
      user: {
        id: actorId,
        organizationId,
        tenantId,
        permissions: ['cases.create'],
      },
      body: {
        approvalContext: {
          accepted: true,
        },
        idempotencyKey,
        organizationId: uniqueText('task1677_body_org_should_not_win'),
        permissionContext: {
          canCreateCaseFromRepairIntakeDraft: false,
        },
        requestId,
        tenantId,
      },
    });

    assert.ifError(response.error);
    assert.deepEqual(response.res.statusCalls, [200]);
    assert.equal(response.res.jsonCalls.length, 1);
    assert.equal(response.res.jsonCalls[0].ok, true);
    assert.equal(response.res.jsonCalls[0].action, 'repair_intake_draft_to_case_submit');
    assert.equal(response.res.jsonCalls[0].draftId, draftId);
    assert.equal(response.res.jsonCalls[0].organizationId, organizationId);
    assert.equal(response.res.jsonCalls[0].submitted, true);
    assert.equal(response.res.jsonCalls[0].caseRef.id, caseId);
    assert.equal(response.res.jsonCalls[0].auditEvent.caseId, caseId);

    const insertedCase = await pool.query(
      [
        'SELECT id, case_no, customer_id, organization_id, status, source, brand,',
        '       case_type, product_type, model_no, problem_description, service_region, metadata',
        'FROM cases',
        'WHERE id = $1',
        '  AND organization_id = $2',
      ].join('\n'),
      [caseId, organizationId],
    );

    assert.equal(insertedCase.rowCount, 1);
    assert.equal(insertedCase.rows[0].case_no, caseNo);
    assert.equal(insertedCase.rows[0].customer_id, customerId);
    assert.equal(insertedCase.rows[0].status, 'draft');
    assert.equal(insertedCase.rows[0].source, 'website');
    assert.equal(insertedCase.rows[0].brand, 'Task1677 Brand');
    assert.equal(insertedCase.rows[0].case_type, 'repair');
    assert.equal(insertedCase.rows[0].metadata.repairIntakeDraftId, draftId);

    const conversion = await pool.query(
      [
        'SELECT id, draft_id, case_id, case_ref, conversion_status, idempotency_key, actor_id',
        'FROM repair_intake_draft_case_conversions',
        'WHERE id = $1',
        '  AND organization_id = $2',
        '  AND tenant_id = $3',
      ].join('\n'),
      [conversionId, organizationId, tenantId],
    );

    assert.equal(conversion.rowCount, 1);
    assert.equal(conversion.rows[0].draft_id, draftId);
    assert.equal(conversion.rows[0].case_id, caseId);
    assert.equal(conversion.rows[0].case_ref, caseNo);
    assert.equal(conversion.rows[0].conversion_status, 'converted');

    const audit = await pool.query(
      [
        'SELECT id, event_type, draft_id, case_id, case_ref, actor_id, outcome, visibility',
        'FROM repair_intake_audit_events',
        'WHERE id = $1',
        '  AND organization_id = $2',
        '  AND tenant_id = $3',
      ].join('\n'),
      [auditEventId, organizationId, tenantId],
    );

    assert.equal(audit.rowCount, 1);
    assert.equal(audit.rows[0].event_type, 'repair_intake_draft_to_case_submission');
    assert.equal(audit.rows[0].draft_id, draftId);
    assert.equal(audit.rows[0].case_id, caseId);
    assert.equal(audit.rows[0].case_ref, caseNo);
    assert.equal(audit.rows[0].outcome, 'submitted');
    assert.equal(audit.rows[0].visibility, 'internal_only');

    const idempotency = await pool.query(
      [
        'SELECT draft_id, replay_case_id, replay_case_ref, record_status, replay_result_safe',
        'FROM repair_intake_idempotency_records',
        'WHERE organization_id = $1',
        '  AND tenant_id = $2',
        "  AND operation_type = 'draft_to_case'",
        '  AND idempotency_key = $3',
      ].join('\n'),
      [organizationId, tenantId, idempotencyKey],
    );

    assert.equal(idempotency.rowCount, 1);
    assert.equal(idempotency.rows[0].draft_id, draftId);
    assert.equal(idempotency.rows[0].replay_case_id, caseId);
    assert.equal(idempotency.rows[0].replay_case_ref, caseNo);
    assert.equal(idempotency.rows[0].record_status, 'completed');
    assert.equal(idempotency.rows[0].replay_result_safe.submitted, true);

    await cleanup(pool, ids);
    await assertCleaned(pool, ids);
  } finally {
    await cleanup(pool, ids);
    await pool.end();
  }
});
