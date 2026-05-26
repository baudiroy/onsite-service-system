'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const test = require('node:test');
const { Pool } = require('pg');

const {
  createRepairIntakeDraftRepository,
} = require('../../src/repairIntake/repairIntakeDraftRepository');
const {
  createRepairIntakeDraftToCaseInjectedRouteComposition,
} = require('../../src/repairIntake/repairIntakeDraftToCaseInjectedRouteComposition');
const {
  createRepairIntakeIdempotencyRepository,
} = require('../../src/repairIntake/repairIntakeIdempotencyRepository');

const REQUIRED_TABLE_COLUMNS = {
  cases: ['id', 'case_no', 'organization_id'],
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
  organizations: ['id', 'organization_code', 'organization_name'],
  repair_intake_audit_events: [
    'organization_id',
    'tenant_id',
    'draft_id',
    'request_id',
  ],
  repair_intake_draft_case_conversions: [
    'organization_id',
    'tenant_id',
    'draft_id',
    'idempotency_key',
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
    'organization_id',
    'tenant_id',
    'idempotency_key',
    'operation_type',
    'draft_id',
  ],
};

function requireDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required for the Zeabur DB smoke test and was not printed.');
  }

  return databaseUrl;
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

function uniqueText(prefix) {
  return `${prefix}_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
}

function createSyntheticMountTarget() {
  const routeHandlers = new Map();

  return {
    post: (routePath, handler) => {
      routeHandlers.set(`POST ${routePath}`, handler);
    },
    async dispatch(method, routePath, requestLike) {
      const handler = routeHandlers.get(`${method.toUpperCase()} ${routePath}`);

      if (!handler) {
        return {
          ok: false,
          body: {
            ok: false,
            reasonCode: 'SYNTHETIC_ROUTE_NOT_FOUND',
            requiredActions: ['configure_route'],
          },
        };
      }

      const response = await handler(requestLike);

      return {
        ok: response && response.ok === true,
        body: response && (response.body || response),
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

test('Zeabur DB route denied smoke performs no persistence writes', async (t) => {
  const pool = new Pool({
    connectionString: requireDatabaseUrl(),
    max: 1,
  });

  const actorId = crypto.randomUUID();
  const customerId = crypto.randomUUID();
  const draftId = crypto.randomUUID();
  const organizationId = crypto.randomUUID();
  const tenantId = crypto.randomUUID();
  const caseNo = uniqueText('TASK1655_CASE');
  const idempotencyKey = uniqueText('task1655_idem');
  const requestId = uniqueText('task1655_req');
  const sourceRef = uniqueText('task1655_source');
  const dbClient = createDbClient(pool);
  let caseCreationCalls = 0;
  let auditCalls = 0;
  let idempotencyFindCalls = 0;
  let idempotencyRecordCalls = 0;

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
      [organizationId, uniqueText('task1655_org'), 'Task1655 Test Organization'],
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
        'Task1655 Test Customer',
        uniqueText('task1655_mobile'),
        'Task1655 City',
        'Task1655 Test Address',
        'website',
        JSON.stringify({ testScope: 'task1655' }),
      ],
    );

    await pool.query(
      [
        'INSERT INTO repair_intake_drafts (',
        '    id, organization_id, tenant_id, draft_status, source, source_ref, intake_source,',
        '    safe_summary, safe_metadata, validation_status, validation_errors_safe',
        ') VALUES (',
        "    $1, $2, $3, 'ready_for_conversion', 'website', $4, 'task1655_route_denied_smoke',",
        "    $5::jsonb, $6::jsonb, 'pending', $7::jsonb",
        ')',
      ].join('\n'),
      [
        draftId,
        organizationId,
        tenantId,
        sourceRef,
        JSON.stringify({ title: 'Task1655 safe denied route summary' }),
        JSON.stringify({ testScope: 'task1655', caseNo }),
        JSON.stringify([]),
      ],
    );

    const idempotencyRepository = createRepairIntakeIdempotencyRepository({
      dbClient,
    });
    const mountTarget = createSyntheticMountTarget();
    const summary = createRepairIntakeDraftToCaseInjectedRouteComposition({
      runtimePorts: {
        draftRepository: createRepairIntakeDraftRepository({
          dbClient,
        }),
        planningPolicy: {
          async planCaseFromDraft(input) {
            return {
              status: 'planned',
              candidate: {
                sourceDraftId: input.draftId,
                organizationId: input.organizationId,
                tenantId: input.tenantId,
                caseNo,
                customerId,
                source: 'web',
                brand: 'Task1655 Brand',
                productType: 'Task1655 Product',
                modelNo: 'Task1655 Model',
                problemDescription: 'Task1655 safe issue summary',
              },
            };
          },
        },
        caseCreationPort: {
          async createCaseFromDraft() {
            caseCreationCalls += 1;

            return {
              ok: false,
              status: 'failed',
              reasonCode: 'TASK1655_CASE_CREATION_SHOULD_NOT_RUN',
            };
          },
        },
        auditPort: {
          async recordDraftToCaseDecision() {
            auditCalls += 1;

            return {
              ok: false,
              reasonCode: 'TASK1655_AUDIT_SHOULD_NOT_RUN',
            };
          },
        },
        idempotencyStore: {
          async findExistingDraftToCaseResult(input) {
            idempotencyFindCalls += 1;

            return idempotencyRepository.findExistingDraftToCaseResult(input);
          },
          async recordDraftToCaseResult(input) {
            idempotencyRecordCalls += 1;

            return idempotencyRepository.recordDraftToCaseResult(input);
          },
        },
      },
      mountTarget,
      basePath: '/task1655',
    });

    assert.equal(summary.ok, true);
    assert.equal(summary.mounted, 2);

    const response = await mountTarget.dispatch(
      'POST',
      '/task1655/repair-intake/drafts/:draftId/case/submit',
      {
        params: {
          draftId,
        },
        context: {
          actorId,
          organizationId,
          requestId,
          tenantId,
        },
        requestId,
        body: {
          actorId,
          approvalContext: {
            accepted: true,
          },
          idempotencyKey,
          organizationId,
          permissionContext: {
            canCreateCaseFromRepairIntakeDraft: false,
          },
          requestId,
          tenantId,
        },
      },
    );

    assert.equal(response.ok, false);
    assert.equal(response.body.ok, false);
    assert.equal(
      response.body.reasonCode,
      'REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_PERMISSION_REQUIRED',
    );
    assert.deepEqual(response.body.requiredActions, ['provide_case_creation_permission']);
    assert.equal(caseCreationCalls, 0);
    assert.equal(auditCalls, 0);
    assert.equal(idempotencyFindCalls, 0);
    assert.equal(idempotencyRecordCalls, 0);

    const caseCount = await pool.query(
      [
        'SELECT count(*)::int AS count',
        'FROM cases',
        'WHERE organization_id = $1',
        '  AND case_no = $2',
      ].join('\n'),
      [organizationId, caseNo],
    );
    const conversionCount = await pool.query(
      [
        'SELECT count(*)::int AS count',
        'FROM repair_intake_draft_case_conversions',
        'WHERE organization_id = $1',
        '  AND tenant_id = $2',
        '  AND draft_id = $3',
      ].join('\n'),
      [organizationId, tenantId, draftId],
    );
    const auditCount = await pool.query(
      [
        'SELECT count(*)::int AS count',
        'FROM repair_intake_audit_events',
        'WHERE organization_id = $1',
        '  AND tenant_id = $2',
        '  AND draft_id = $3',
      ].join('\n'),
      [organizationId, tenantId, draftId],
    );
    const idempotencyCount = await pool.query(
      [
        'SELECT count(*)::int AS count',
        'FROM repair_intake_idempotency_records',
        'WHERE organization_id = $1',
        '  AND tenant_id = $2',
        "  AND operation_type = 'draft_to_case'",
        '  AND idempotency_key = $3',
      ].join('\n'),
      [organizationId, tenantId, idempotencyKey],
    );
    const draft = await pool.query(
      [
        'SELECT draft_status, converted_at',
        'FROM repair_intake_drafts',
        'WHERE id = $1',
        '  AND organization_id = $2',
        '  AND tenant_id = $3',
      ].join('\n'),
      [draftId, organizationId, tenantId],
    );

    assert.equal(caseCount.rows[0].count, 0);
    assert.equal(conversionCount.rows[0].count, 0);
    assert.equal(auditCount.rows[0].count, 0);
    assert.equal(idempotencyCount.rows[0].count, 0);
    assert.equal(draft.rowCount, 1);
    assert.equal(draft.rows[0].draft_status, 'ready_for_conversion');
    assert.equal(draft.rows[0].converted_at, null);
  } finally {
    await pool.query(
      'DELETE FROM repair_intake_idempotency_records WHERE organization_id = $1 AND tenant_id = $2 AND idempotency_key = $3',
      [organizationId, tenantId, idempotencyKey],
    ).catch(() => {});
    await pool.query(
      'DELETE FROM repair_intake_audit_events WHERE organization_id = $1 AND tenant_id = $2 AND draft_id = $3',
      [organizationId, tenantId, draftId],
    ).catch(() => {});
    await pool.query(
      'DELETE FROM repair_intake_draft_case_conversions WHERE organization_id = $1 AND tenant_id = $2 AND draft_id = $3',
      [organizationId, tenantId, draftId],
    ).catch(() => {});
    await pool.query('DELETE FROM cases WHERE organization_id = $1 AND case_no = $2', [organizationId, caseNo]).catch(() => {});
    await pool.query(
      'DELETE FROM repair_intake_drafts WHERE id = $1 AND organization_id = $2 AND tenant_id = $3',
      [draftId, organizationId, tenantId],
    ).catch(() => {});
    await pool.query('DELETE FROM customers WHERE id = $1 AND organization_id = $2', [customerId, organizationId]).catch(() => {});
    await pool.query('DELETE FROM organizations WHERE id = $1', [organizationId]).catch(() => {});
    await pool.end();
  }
});
