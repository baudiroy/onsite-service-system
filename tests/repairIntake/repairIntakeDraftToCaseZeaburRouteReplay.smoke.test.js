'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const test = require('node:test');
const { Pool } = require('pg');

const {
  createRepairIntakeCaseRepositoryAdapter,
} = require('../../src/repairIntake/repairIntakeCaseRepositoryAdapter');
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
    'metadata',
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

test('Zeabur DB route replay smoke prevents duplicate case conversion audit writes', async (t) => {
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
  const caseNo = uniqueText('TASK1653_CASE');
  const idempotencyKey = uniqueText('task1653_idem');
  const requestId = uniqueText('task1653_req');
  const sourceRef = uniqueText('task1653_source');
  const safeRequestFingerprint = uniqueText('task1653_fp');
  const dbClient = createDbClient(pool);

  let caseCreateCalls = 0;
  let conversionWrites = 0;
  let auditWrites = 0;
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
      [organizationId, uniqueText('task1653_org'), 'Task1653 Test Organization'],
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
        'Task1653 Test Customer',
        uniqueText('task1653_mobile'),
        'Task1653 City',
        'Task1653 Test Address',
        'website',
        JSON.stringify({ testScope: 'task1653' }),
      ],
    );

    await pool.query(
      [
        'INSERT INTO repair_intake_drafts (',
        '    id, organization_id, tenant_id, draft_status, source, source_ref, intake_source,',
        '    safe_summary, safe_metadata, validation_status, validation_errors_safe',
        ') VALUES (',
        "    $1, $2, $3, 'ready_for_conversion', 'website', $4, 'task1653_route_replay_smoke',",
        "    $5::jsonb, $6::jsonb, 'pending', $7::jsonb",
        ')',
      ].join('\n'),
      [
        draftId,
        organizationId,
        tenantId,
        sourceRef,
        JSON.stringify({ title: 'Task1653 safe route replay summary' }),
        JSON.stringify({ testScope: 'task1653', caseNo }),
        JSON.stringify([]),
      ],
    );

    const draftRepository = createRepairIntakeDraftRepository({
      dbClient,
    });
    const caseRepository = createRepairIntakeCaseRepositoryAdapter({
      clock: () => '2026-05-26T00:00:00.000Z',
      dbClient,
      idGenerator: () => caseId,
    });
    const idempotencyRepository = createRepairIntakeIdempotencyRepository({
      dbClient,
    });
    const runtimePorts = {
      draftRepository,
      planningPolicy: {
        async planCaseFromDraft(input) {
          return {
            status: 'planned',
            reasonCode: 'TASK1653_ROUTE_REPLAY_PLAN_READY',
            candidate: {
              sourceDraftId: input.draftId,
              organizationId: input.organizationId,
              tenantId: input.tenantId,
              caseNo,
              customerId,
              source: 'web',
              brand: 'Task1653 Brand',
              productType: 'Task1653 Product',
              modelNo: 'Task1653 Model',
              problemDescription: 'Task1653 safe issue summary',
              serviceType: 'onsite',
              priority: 'normal',
              metadata: {
                testScope: 'task1653',
                sourceRef,
              },
            },
          };
        },
      },
      caseCreationPort: {
        async createCaseFromDraft(input) {
          caseCreateCalls += 1;

          const created = await caseRepository.createCaseFromRepairIntakeCandidate({
            command: {
              actorId,
              draftId,
              idempotencyKey,
              organizationId,
              requestId,
            },
            caseCandidate: input.plan && input.plan.candidate,
          });

          if (!created || created.status !== 'created') {
            return created;
          }

          conversionWrites += 1;
          await pool.query(
            [
              'INSERT INTO repair_intake_draft_case_conversions (',
              '    id, organization_id, tenant_id, draft_id, case_id, case_ref, conversion_status,',
              '    idempotency_key, actor_id, actor_type, request_id, safe_metadata, submitted_at, converted_at',
              ') VALUES (',
              "    $1, $2, $3, $4, $5, $6, 'converted', $7, $8, 'system', $9, $10::jsonb, now(), now()",
              ')',
            ].join('\n'),
            [
              conversionId,
              organizationId,
              tenantId,
              draftId,
              caseId,
              caseNo,
              idempotencyKey,
              actorId,
              requestId,
              JSON.stringify({ testScope: 'task1653', replaySmoke: true }),
            ],
          );

          await pool.query(
            [
              'UPDATE repair_intake_drafts',
              "SET draft_status = 'converted', converted_at = now()",
              'WHERE id = $1 AND organization_id = $2 AND tenant_id = $3',
            ].join('\n'),
            [draftId, organizationId, tenantId],
          );

          return {
            ...created,
            caseRef: caseNo,
          };
        },
      },
      auditPort: {
        async recordDraftToCaseDecision(input) {
          auditWrites += 1;

          await pool.query(
            [
              'INSERT INTO repair_intake_audit_events (',
              '    id, organization_id, tenant_id, event_type, draft_id, case_id, case_ref,',
              '    actor_id, actor_type, request_id, decision, outcome, reason_code, safe_metadata, visibility, occurred_at',
              ') VALUES (',
              "    $1, $2, $3, 'repair_intake_draft_to_case_submission', $4, $5, $6,",
              "    $7, 'system', $8, 'case_created_from_route_replay', 'submitted',",
              "    'TASK1653_ROUTE_REPLAY_RECORDED', $9::jsonb, 'internal_only', now()",
              ')',
            ].join('\n'),
            [
              auditEventId,
              organizationId,
              tenantId,
              draftId,
              caseId,
              caseNo,
              actorId,
              requestId,
              JSON.stringify({ testScope: 'task1653', conversionId }),
            ],
          );

          return {
            ok: true,
            eventType: 'repair_intake_draft_to_case_submission',
            outcome: 'submitted',
            draftId,
            organizationId,
            tenantId,
            caseId,
            reasonCode: 'TASK1653_ROUTE_REPLAY_AUDIT_RECORDED',
          };
        },
      },
      idempotencyStore: {
        findExistingDraftToCaseResult: (input) => (
          idempotencyRepository.findExistingDraftToCaseResult(input)
        ),
        recordDraftToCaseResult: async (input) => {
          idempotencyRecordCalls += 1;

          return idempotencyRepository.recordDraftToCaseResult({
            ...input,
            actorId,
            caseId,
            caseRef: caseNo,
            recordStatus: 'completed',
            safeRequestFingerprint,
          });
        },
      },
    };
    const mountTarget = createSyntheticMountTarget();
    const summary = createRepairIntakeDraftToCaseInjectedRouteComposition({
      runtimePorts,
      mountTarget,
      basePath: '/task1653',
    });

    assert.equal(summary.ok, true);
    assert.equal(summary.mounted, 2);

    const requestLike = {
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
    };
    const firstResponse = await mountTarget.dispatch(
      'POST',
      '/task1653/repair-intake/drafts/:draftId/case/submit',
      requestLike,
    );
    const secondResponse = await mountTarget.dispatch(
      'POST',
      '/task1653/repair-intake/drafts/:draftId/case/submit',
      requestLike,
    );

    assert.equal(firstResponse.ok, true);
    assert.equal(firstResponse.body.submitted, true);
    assert.equal(firstResponse.body.caseRef.id, caseId);
    assert.equal(secondResponse.ok, true);
    assert.equal(secondResponse.body.idempotentReplay, true);
    assert.equal(secondResponse.body.submitted, true);
    assert.equal(secondResponse.body.caseRef.caseRef, caseNo);
    assert.equal(caseCreateCalls, 1);
    assert.equal(conversionWrites, 1);
    assert.equal(auditWrites, 1);
    assert.equal(idempotencyRecordCalls, 1);

    const caseCount = await pool.query(
      [
        'SELECT count(*)::int AS count',
        'FROM cases',
        'WHERE id = $1 AND organization_id = $2',
      ].join('\n'),
      [caseId, organizationId],
    );
    const conversionCount = await pool.query(
      [
        'SELECT count(*)::int AS count',
        'FROM repair_intake_draft_case_conversions',
        'WHERE organization_id = $1 AND tenant_id = $2 AND idempotency_key = $3',
      ].join('\n'),
      [organizationId, tenantId, idempotencyKey],
    );
    const auditCount = await pool.query(
      [
        'SELECT count(*)::int AS count',
        'FROM repair_intake_audit_events',
        'WHERE organization_id = $1 AND tenant_id = $2 AND request_id = $3',
      ].join('\n'),
      [organizationId, tenantId, requestId],
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

    assert.equal(caseCount.rows[0].count, 1);
    assert.equal(conversionCount.rows[0].count, 1);
    assert.equal(auditCount.rows[0].count, 1);
    assert.equal(idempotencyCount.rows[0].count, 1);
  } finally {
    await pool.query(
      'DELETE FROM repair_intake_audit_events WHERE id = $1 AND organization_id = $2 AND tenant_id = $3',
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
      'DELETE FROM repair_intake_draft_case_conversions WHERE id = $1 AND organization_id = $2 AND tenant_id = $3',
      [conversionId, organizationId, tenantId],
    ).catch(() => {});
    await pool.query('DELETE FROM cases WHERE id = $1 AND organization_id = $2', [caseId, organizationId]).catch(() => {});
    await pool.query(
      'DELETE FROM repair_intake_drafts WHERE id = $1 AND organization_id = $2 AND tenant_id = $3',
      [draftId, organizationId, tenantId],
    ).catch(() => {});
    await pool.query('DELETE FROM customers WHERE id = $1 AND organization_id = $2', [customerId, organizationId]).catch(() => {});
    await pool.query('DELETE FROM organizations WHERE id = $1', [organizationId]).catch(() => {});
    await pool.end();
  }
});
