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

test('Zeabur DB route not-found smoke performs no persistence writes', async (t) => {
  const pool = new Pool({
    connectionString: requireDatabaseUrl(),
    max: 1,
  });

  const actorId = crypto.randomUUID();
  const draftId = crypto.randomUUID();
  const organizationId = crypto.randomUUID();
  const tenantId = crypto.randomUUID();
  const caseNo = uniqueText('TASK1658_CASE');
  const idempotencyKey = uniqueText('task1658_idem');
  const requestId = uniqueText('task1658_req');
  const dbClient = createDbClient(pool);
  let planningCalls = 0;
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
      [organizationId, uniqueText('task1658_org'), 'Task1658 Test Organization'],
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
            planningCalls += 1;

            if (
              input.draft
              && (
                input.draft.status === 'failed'
                || input.draft.reasonCode === 'REPAIR_INTAKE_DRAFT_READER_PORT_ADAPTER_DRAFT_NOT_FOUND'
              )
            ) {
              throw new Error('TASK1658_DRAFT_NOT_FOUND');
            }

            return {
              status: 'planned',
              candidate: {
                sourceDraftId: draftId,
                organizationId,
                tenantId,
                caseNo,
              },
            };
          },
        },
        caseCreationPort: {
          async createCaseFromDraft(input) {
            caseCreationCalls += 1;

            if (input.plan && input.plan.status === 'failed') {
              throw new Error('TASK1658_CASE_CREATION_BLOCKED_BY_FAILED_PLAN');
            }

            return {
              ok: false,
              status: 'failed',
              reasonCode: 'TASK1658_CASE_CREATION_SHOULD_NOT_RUN',
            };
          },
        },
        auditPort: {
          async recordDraftToCaseDecision() {
            auditCalls += 1;

            throw new Error('TASK1658_AUDIT_BLOCKED_FOR_NOT_FOUND_DRAFT');
          },
        },
        idempotencyStore: {
          async findExistingDraftToCaseResult(input) {
            idempotencyFindCalls += 1;

            return idempotencyRepository.findExistingDraftToCaseResult(input);
          },
          async recordDraftToCaseResult(input) {
            idempotencyRecordCalls += 1;

            throw new Error('TASK1658_IDEMPOTENCY_RECORD_BLOCKED_FOR_NOT_FOUND_DRAFT');
          },
        },
      },
      mountTarget,
      basePath: '/task1658',
    });

    assert.equal(summary.ok, true);
    assert.equal(summary.mounted, 2);

    const response = await mountTarget.dispatch(
      'POST',
      '/task1658/repair-intake/drafts/:draftId/case/submit',
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
            canCreateCaseFromRepairIntakeDraft: true,
          },
          requestId,
          tenantId,
        },
      },
    );

    assert.equal(response.ok, true);
    assert.equal(response.body.ok, true);
    assert.equal(
      response.body.reasonCode,
      'REPAIR_INTAKE_CASE_CREATOR_PORT_ADAPTER_CREATE_FAILED',
    );
    assert.equal(response.body.status, 'failed');
    assert.equal(idempotencyFindCalls, 1);
    assert.equal(planningCalls, 1);
    assert.equal(caseCreationCalls, 1);
    assert.equal(auditCalls, 1);
    assert.equal(idempotencyRecordCalls, 1);

    const draftCount = await pool.query(
      [
        'SELECT count(*)::int AS count',
        'FROM repair_intake_drafts',
        'WHERE id = $1',
        '  AND organization_id = $2',
        '  AND tenant_id = $3',
      ].join('\n'),
      [draftId, organizationId, tenantId],
    );
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

    assert.equal(draftCount.rows[0].count, 0);
    assert.equal(caseCount.rows[0].count, 0);
    assert.equal(conversionCount.rows[0].count, 0);
    assert.equal(auditCount.rows[0].count, 0);
    assert.equal(idempotencyCount.rows[0].count, 0);
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
    await pool.query('DELETE FROM organizations WHERE id = $1', [organizationId]).catch(() => {});
    await pool.end();
  }
});
