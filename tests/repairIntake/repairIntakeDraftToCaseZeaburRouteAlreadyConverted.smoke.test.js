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

function requestLike({
  actorId,
  draftId,
  idempotencyKey,
  organizationId,
  requestId,
  tenantId,
}) {
  return {
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
}

test('Zeabur DB route already-converted smoke blocks duplicate submit with new idempotency key', async (t) => {
  const pool = new Pool({
    connectionString: requireDatabaseUrl(),
    max: 1,
  });

  const actorId = crypto.randomUUID();
  const auditEventIds = [crypto.randomUUID(), crypto.randomUUID()];
  const caseIds = [crypto.randomUUID(), crypto.randomUUID()];
  const conversionIds = [crypto.randomUUID(), crypto.randomUUID()];
  const customerId = crypto.randomUUID();
  const draftId = crypto.randomUUID();
  const organizationId = crypto.randomUUID();
  const tenantId = crypto.randomUUID();
  const caseNos = [uniqueText('TASK1662_CASE_A'), uniqueText('TASK1662_CASE_B')];
  const idempotencyKeys = [uniqueText('task1662_idem_a'), uniqueText('task1662_idem_b')];
  const requestIds = [uniqueText('task1662_req_a'), uniqueText('task1662_req_b')];
  const safeRequestFingerprints = [uniqueText('task1662_fp_a'), uniqueText('task1662_fp_b')];
  const sourceRef = uniqueText('task1662_source');
  const dbClient = createDbClient(pool);
  let auditWrites = 0;
  let caseCreateCalls = 0;
  let conversionWrites = 0;
  let idempotencyRecordCalls = 0;
  let planCalls = 0;

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
      [organizationId, uniqueText('task1662_org'), 'Task1662 Test Organization'],
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
        'Task1662 Test Customer',
        uniqueText('task1662_mobile'),
        'Task1662 City',
        'Task1662 Test Address',
        'website',
        JSON.stringify({ testScope: 'task1662' }),
      ],
    );

    await pool.query(
      [
        'INSERT INTO repair_intake_drafts (',
        '    id, organization_id, tenant_id, draft_status, source, source_ref, intake_source,',
        '    safe_summary, safe_metadata, validation_status, validation_errors_safe',
        ') VALUES (',
        "    $1, $2, $3, 'ready_for_conversion', 'website', $4, 'task1662_route_already_converted_smoke',",
        "    $5::jsonb, $6::jsonb, 'pending', $7::jsonb",
        ')',
      ].join('\n'),
      [
        draftId,
        organizationId,
        tenantId,
        sourceRef,
        JSON.stringify({ title: 'Task1662 safe already-converted route summary' }),
        JSON.stringify({ testScope: 'task1662', caseNos }),
        JSON.stringify([]),
      ],
    );

    const draftRepository = createRepairIntakeDraftRepository({
      dbClient,
    });
    const caseRepository = createRepairIntakeCaseRepositoryAdapter({
      clock: () => '2026-05-26T00:00:00.000Z',
      dbClient,
      idGenerator: () => caseIds[Math.min(Math.max(caseCreateCalls - 1, 0), caseIds.length - 1)],
    });
    const idempotencyRepository = createRepairIntakeIdempotencyRepository({
      dbClient,
    });
    const runtimePorts = {
      draftRepository,
      planningPolicy: {
        async planCaseFromDraft(input) {
          const index = Math.min(planCalls, caseNos.length - 1);
          planCalls += 1;

          return {
            status: 'planned',
            reasonCode: 'TASK1662_ROUTE_ALREADY_CONVERTED_PLAN_READY',
            candidate: {
              sourceDraftId: input.draftId,
              organizationId: input.organizationId,
              tenantId: input.tenantId,
              caseNo: caseNos[index],
              customerId,
              source: 'web',
              brand: 'Task1662 Brand',
              productType: 'Task1662 Product',
              modelNo: 'Task1662 Model',
              problemDescription: 'Task1662 safe issue summary',
              serviceType: 'onsite',
              priority: 'normal',
              metadata: {
                testScope: 'task1662',
                sourceRef,
              },
            },
          };
        },
      },
      caseCreationPort: {
        async createCaseFromDraft(input) {
          const index = Math.min(caseCreateCalls, caseIds.length - 1);
          caseCreateCalls += 1;

          const created = await caseRepository.createCaseFromRepairIntakeCandidate({
            command: {
              actorId,
              draftId,
              idempotencyKey: input.idempotencyKey,
              organizationId,
              requestId: input.requestId,
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
              conversionIds[index],
              organizationId,
              tenantId,
              draftId,
              caseIds[index],
              caseNos[index],
              input.idempotencyKey,
              actorId,
              input.requestId,
              JSON.stringify({ testScope: 'task1662', duplicateAttemptIndex: index }),
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
            caseRef: caseNos[index],
          };
        },
      },
      auditPort: {
        async recordDraftToCaseDecision(input) {
          const index = Math.min(auditWrites, auditEventIds.length - 1);
          auditWrites += 1;

          await pool.query(
            [
              'INSERT INTO repair_intake_audit_events (',
              '    id, organization_id, tenant_id, event_type, draft_id, case_id, case_ref,',
              '    actor_id, actor_type, request_id, decision, outcome, reason_code, safe_metadata, visibility, occurred_at',
              ') VALUES (',
              "    $1, $2, $3, 'repair_intake_draft_to_case_submission', $4, $5, $6,",
              "    $7, 'system', $8, 'case_created_from_already_converted_smoke', 'submitted',",
              "    'TASK1662_ROUTE_ALREADY_CONVERTED_RECORDED', $9::jsonb, 'internal_only', now()",
              ')',
            ].join('\n'),
            [
              auditEventIds[index],
              organizationId,
              tenantId,
              draftId,
              caseIds[index],
              caseNos[index],
              actorId,
              input.requestId,
              JSON.stringify({ testScope: 'task1662', conversionId: conversionIds[index] }),
            ],
          );

          return {
            ok: true,
            eventType: 'repair_intake_draft_to_case_submission',
            outcome: 'submitted',
            draftId,
            organizationId,
            tenantId,
            caseId: caseIds[index],
            reasonCode: 'TASK1662_ROUTE_ALREADY_CONVERTED_AUDIT_RECORDED',
          };
        },
      },
      idempotencyStore: {
        findExistingDraftToCaseResult: (input) => (
          idempotencyRepository.findExistingDraftToCaseResult(input)
        ),
        recordDraftToCaseResult: async (input) => {
          const index = Math.min(idempotencyRecordCalls, safeRequestFingerprints.length - 1);
          idempotencyRecordCalls += 1;

          return idempotencyRepository.recordDraftToCaseResult({
            ...input,
            actorId,
            caseId: caseIds[index],
            caseRef: caseNos[index],
            recordStatus: 'completed',
            safeRequestFingerprint: safeRequestFingerprints[index],
          });
        },
      },
    };
    const mountTarget = createSyntheticMountTarget();
    const summary = createRepairIntakeDraftToCaseInjectedRouteComposition({
      runtimePorts,
      mountTarget,
      basePath: '/task1662',
    });

    assert.equal(summary.ok, true);
    assert.equal(summary.mounted, 2);

    const firstResponse = await mountTarget.dispatch(
      'POST',
      '/task1662/repair-intake/drafts/:draftId/case/submit',
      requestLike({
        actorId,
        draftId,
        idempotencyKey: idempotencyKeys[0],
        organizationId,
        requestId: requestIds[0],
        tenantId,
      }),
    );
    const secondResponse = await mountTarget.dispatch(
      'POST',
      '/task1662/repair-intake/drafts/:draftId/case/submit',
      requestLike({
        actorId,
        draftId,
        idempotencyKey: idempotencyKeys[1],
        organizationId,
        requestId: requestIds[1],
        tenantId,
      }),
    );

    assert.equal(firstResponse.ok, true);
    assert.equal(firstResponse.body.ok, true);
    assert.equal(firstResponse.body.submitted, true);
    assert.equal(firstResponse.body.caseRef.id, caseIds[0]);

    assert.equal(secondResponse.ok, false);
    assert.equal(secondResponse.body.ok, false);
    assert.equal(secondResponse.body.submitted, false);
    assert.match(secondResponse.body.reasonCode, /ALREADY|CONVERTED|BLOCKED/);
    assert.notEqual(
      secondResponse.body.reasonCode,
      'REPAIR_INTAKE_CASE_CREATOR_PORT_ADAPTER_CREATE_FAILED',
    );
    assert.equal(caseCreateCalls, 1);
    assert.equal(conversionWrites, 1);
    assert.equal(auditWrites, 1);
    assert.equal(idempotencyRecordCalls, 1);

    const caseCount = await pool.query(
      [
        'SELECT count(*)::int AS count',
        'FROM cases',
        'WHERE organization_id = $1',
        '  AND id = ANY($2::uuid[])',
      ].join('\n'),
      [organizationId, caseIds],
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
        '  AND idempotency_key = ANY($3::text[])',
      ].join('\n'),
      [organizationId, tenantId, idempotencyKeys],
    );

    assert.equal(caseCount.rows[0].count, 1);
    assert.equal(conversionCount.rows[0].count, 1);
    assert.equal(auditCount.rows[0].count, 1);
    assert.equal(idempotencyCount.rows[0].count, 1);
  } finally {
    await pool.query(
      [
        'DELETE FROM repair_intake_audit_events',
        'WHERE organization_id = $1',
        '  AND tenant_id = $2',
        '  AND draft_id = $3',
      ].join('\n'),
      [organizationId, tenantId, draftId],
    ).catch(() => {});
    await pool.query(
      [
        'DELETE FROM repair_intake_idempotency_records',
        'WHERE organization_id = $1',
        '  AND tenant_id = $2',
        "  AND operation_type = 'draft_to_case'",
        '  AND idempotency_key = ANY($3::text[])',
      ].join('\n'),
      [organizationId, tenantId, idempotencyKeys],
    ).catch(() => {});
    await pool.query(
      [
        'DELETE FROM repair_intake_draft_case_conversions',
        'WHERE organization_id = $1',
        '  AND tenant_id = $2',
        '  AND draft_id = $3',
      ].join('\n'),
      [organizationId, tenantId, draftId],
    ).catch(() => {});
    await pool.query(
      'DELETE FROM cases WHERE organization_id = $1 AND id = ANY($2::uuid[])',
      [organizationId, caseIds],
    ).catch(() => {});
    await pool.query(
      'DELETE FROM repair_intake_drafts WHERE id = $1 AND organization_id = $2 AND tenant_id = $3',
      [draftId, organizationId, tenantId],
    ).catch(() => {});
    await pool.query(
      'DELETE FROM customers WHERE id = $1 AND organization_id = $2',
      [customerId, organizationId],
    ).catch(() => {});
    await pool.query('DELETE FROM organizations WHERE id = $1', [organizationId]).catch(() => {});
    await pool.end();
  }
});
