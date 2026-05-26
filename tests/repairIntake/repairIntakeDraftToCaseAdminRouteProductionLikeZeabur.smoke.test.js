'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { createRequire } = require('node:module');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const requireFromRepo = createRequire(`${repoRoot}/package.json`);
const { Pool } = requireFromRepo('pg');
const {
  resolveServerApp,
} = requireFromRepo('./src/server');
const {
  REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH,
} = requireFromRepo('./src/routes/repairIntakeDraftToCase.routes');

const optionRootKey = ['repair', 'Intake', 'Draft', 'To', 'Case'].join('');
const idGeneratorOptionKey = `${optionRootKey}IdGenerator`;
const caseNumberGeneratorOptionKey = `${optionRootKey}CaseNumberGenerator`;

function requireDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required and was not printed.');
  }

  return process.env.DATABASE_URL;
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
  await pool.query(
    'DELETE FROM repair_intake_audit_events WHERE organization_id = $1 AND tenant_id = $2',
    [ids.organizationId, ids.tenantId],
  ).catch(() => {});
  await pool.query(
    'DELETE FROM repair_intake_idempotency_records WHERE organization_id = $1 AND tenant_id = $2',
    [ids.organizationId, ids.tenantId],
  ).catch(() => {});
  await pool.query(
    'DELETE FROM repair_intake_draft_case_conversions WHERE organization_id = $1 AND tenant_id = $2',
    [ids.organizationId, ids.tenantId],
  ).catch(() => {});
  await pool.query('DELETE FROM cases WHERE organization_id = $1', [ids.organizationId]).catch(() => {});
  await pool.query(
    'DELETE FROM repair_intake_drafts WHERE organization_id = $1 AND tenant_id = $2',
    [ids.organizationId, ids.tenantId],
  ).catch(() => {});
  await pool.query('DELETE FROM customers WHERE organization_id = $1', [ids.organizationId]).catch(() => {});
  await pool.query('DELETE FROM organizations WHERE id = $1', [ids.organizationId]).catch(() => {});
}

async function rowCount(pool, sql, params) {
  const result = await pool.query(sql, params);

  return result.rows[0].count;
}

async function insertHappyFixture(pool, ids) {
  await pool.query(
    'INSERT INTO organizations (id, organization_code, organization_name) VALUES ($1, $2, $3)',
    [ids.organizationId, uniqueText('task1682_org'), 'Task1682 Test Organization'],
  );
  await pool.query(
    [
      'INSERT INTO customers (id, organization_id, customer_name, mobile, city, address, source, metadata)',
      'VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)',
    ].join('\n'),
    [
      ids.customerId,
      ids.organizationId,
      'Task1682 Test Customer',
      uniqueText('task1682_mobile'),
      'Task1682 City',
      'Task1682 Test Address',
      'website',
      JSON.stringify({ testScope: 'task1682' }),
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
      "    'task1682_production_like_smoke',",
      '    $5::jsonb,',
      '    $6::jsonb,',
      "    'pending',",
      '    $7::jsonb',
      ')',
    ].join('\n'),
    [
      ids.draftId,
      ids.organizationId,
      ids.tenantId,
      uniqueText('task1682_source'),
      JSON.stringify({
        customerId: ids.customerId,
        title: 'Task1682 safe production-like intake summary',
        source: 'website',
        brand: 'Task1682 Brand',
        productType: 'Task1682 Product',
        modelNo: 'Task1682 Model',
        problemDescription: 'Task1682 safe issue summary',
        serviceRegion: 'Task1682 Region',
      }),
      JSON.stringify({ testScope: 'task1682' }),
      JSON.stringify([]),
    ],
  );
}

function createServerResolvedApp(pool, ids) {
  return resolveServerApp({
    env: {
      REPAIR_INTAKE_DRAFT_TO_CASE_ROUTES_ENABLED: 'true',
    },
    [idGeneratorOptionKey]: (scope = {}) => {
      if (scope.kind === 'repair_intake_draft_case_conversion') {
        return `ri_repair_intake_draft_case_conversion_${ids.conversionId}`;
      }

      if (scope.kind === 'repair_intake_audit_event') {
        return `ri_repair_intake_audit_event_${ids.auditEventId}`;
      }

      return `ri_record_${ids.caseId}`;
    },
    [caseNumberGeneratorOptionKey]: () => ids.caseNo,
    [optionRootKey]: {
      clock: () => '2026-05-26T00:00:00.000Z',
      dbClient: createDbClient(pool),
    },
  });
}

function requestFor(ids, overrides = {}) {
  return {
    params: {
      draftId: overrides.draftId || ids.draftId,
    },
    context: {
      organizationId: ids.organizationId,
      requestId: overrides.requestId || ids.requestId,
      tenantId: ids.tenantId,
    },
    requestId: overrides.requestId || ids.requestId,
    user: {
      id: ids.actorId,
      organizationId: ids.organizationId,
      tenantId: ids.tenantId,
      permissions: overrides.permissions || ['cases.create'],
    },
    body: {
      approvalContext: {
        accepted: true,
      },
      idempotencyKey: overrides.idempotencyKey || ids.idempotencyKey,
      organizationId: uniqueText('task1682_body_org_should_not_win'),
      requestId: overrides.requestId || ids.requestId,
      tenantId: ids.tenantId,
    },
  };
}

test('Zeabur production-like admin route covers happy denied and not-found paths through server startup', async () => {
  const pool = new Pool({
    connectionString: requireDatabaseUrl(),
    max: 1,
  });
  const ids = {
    actorId: crypto.randomUUID(),
    auditEventId: crypto.randomUUID(),
    caseId: crypto.randomUUID(),
    conversionId: crypto.randomUUID(),
    customerId: crypto.randomUUID(),
    draftId: crypto.randomUUID(),
    organizationId: crypto.randomUUID(),
    tenantId: crypto.randomUUID(),
    caseNo: uniqueText('TASK1682_CASE'),
    idempotencyKey: uniqueText('task1682_idem'),
    requestId: uniqueText('task1682_req'),
  };

  try {
    await insertHappyFixture(pool, ids);

    const app = createServerResolvedApp(pool, ids);
    const route = findRoute(app, 'post', REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH);

    assert.ok(route, 'missing protected admin submit route from server path');

    const happy = await dispatchRoute(route, requestFor(ids));

    assert.ifError(happy.error);
    assert.deepEqual(happy.res.statusCalls, [200]);
    assert.equal(happy.res.jsonCalls[0].ok, true);
    assert.equal(happy.res.jsonCalls[0].submitted, true);
    assert.equal(happy.res.jsonCalls[0].caseRef.id, ids.caseId);
    assert.equal(happy.res.jsonCalls[0].caseRef.caseId, ids.caseId);
    assert.notEqual(happy.res.jsonCalls[0].caseRef.id, ids.caseNo);
    assert.equal(happy.res.jsonCalls[0].caseRef.summary.caseRef, ids.caseNo);

    assert.equal(
      await rowCount(pool, 'SELECT COUNT(*)::int AS count FROM cases WHERE id = $1 AND organization_id = $2', [ids.caseId, ids.organizationId]),
      1,
    );
    assert.equal(
      await rowCount(pool, 'SELECT COUNT(*)::int AS count FROM repair_intake_draft_case_conversions WHERE id = $1 AND organization_id = $2 AND tenant_id = $3', [ids.conversionId, ids.organizationId, ids.tenantId]),
      1,
    );
    assert.equal(
      await rowCount(pool, 'SELECT COUNT(*)::int AS count FROM repair_intake_audit_events WHERE id = $1 AND organization_id = $2 AND tenant_id = $3', [ids.auditEventId, ids.organizationId, ids.tenantId]),
      1,
    );
    assert.equal(
      await rowCount(pool, 'SELECT COUNT(*)::int AS count FROM repair_intake_idempotency_records WHERE organization_id = $1 AND tenant_id = $2 AND idempotency_key = $3', [ids.organizationId, ids.tenantId, ids.idempotencyKey]),
      1,
    );

    const deniedKey = uniqueText('task1682_denied_idem');
    const denied = await dispatchRoute(route, requestFor(ids, {
      idempotencyKey: deniedKey,
      permissions: [],
      requestId: uniqueText('task1682_denied_req'),
    }));

    assert.ok(denied.error, 'denied path should stop in permission middleware');
    assert.equal(
      await rowCount(pool, 'SELECT COUNT(*)::int AS count FROM repair_intake_idempotency_records WHERE organization_id = $1 AND tenant_id = $2 AND idempotency_key = $3', [ids.organizationId, ids.tenantId, deniedKey]),
      0,
    );

    const notFoundKey = uniqueText('task1682_not_found_idem');
    const notFoundDraftId = crypto.randomUUID();
    const notFound = await dispatchRoute(route, requestFor(ids, {
      draftId: notFoundDraftId,
      idempotencyKey: notFoundKey,
      requestId: uniqueText('task1682_not_found_req'),
    }));

    assert.ifError(notFound.error);
    assert.equal(notFound.res.jsonCalls[0].ok, false);
    assert.equal(notFound.res.jsonCalls[0].reasonCode, 'REPAIR_INTAKE_DRAFT_READER_PORT_ADAPTER_DRAFT_NOT_FOUND');
    assert.equal(
      await rowCount(pool, 'SELECT COUNT(*)::int AS count FROM repair_intake_draft_case_conversions WHERE organization_id = $1 AND tenant_id = $2 AND draft_id = $3', [ids.organizationId, ids.tenantId, notFoundDraftId]),
      0,
    );
    assert.equal(
      await rowCount(pool, 'SELECT COUNT(*)::int AS count FROM repair_intake_idempotency_records WHERE organization_id = $1 AND tenant_id = $2 AND idempotency_key = $3', [ids.organizationId, ids.tenantId, notFoundKey]),
      0,
    );

    await cleanup(pool, ids);
    assert.equal(
      await rowCount(pool, 'SELECT COUNT(*)::int AS count FROM cases WHERE organization_id = $1', [ids.organizationId]),
      0,
    );
    assert.equal(
      await rowCount(pool, 'SELECT COUNT(*)::int AS count FROM repair_intake_drafts WHERE organization_id = $1 AND tenant_id = $2', [ids.organizationId, ids.tenantId]),
      0,
    );
    assert.equal(
      await rowCount(pool, 'SELECT COUNT(*)::int AS count FROM organizations WHERE id = $1', [ids.organizationId]),
      0,
    );

  } finally {
    await cleanup(pool, ids);
    await pool.end();
  }
});
