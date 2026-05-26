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
  const registrations = [];

  function add(method, routePath, handler) {
    registrations.push({ method, path: routePath, handler });
    routeHandlers.set(`${method.toUpperCase()} ${routePath}`, handler);
  }

  return {
    registrations,
    post: (routePath, handler) => {
      add('POST', routePath, handler);
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

test('Zeabur DB smoke dispatches injected route Draft to Case flow and cleans test rows', async (t) => {
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
  const caseNo = uniqueText('TASK1649_CASE');
  const idempotencyKey = uniqueText('task1649_idem');
  const requestId = uniqueText('task1649_req');
  const sourceRef = uniqueText('task1649_source');
  const safeRequestFingerprint = uniqueText('task1649_fp');
  const dbClient = createDbClient(pool);

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
      [organizationId, uniqueText('task1649_org'), 'Task1649 Test Organization'],
    );

    await pool.query(
      [
        'INSERT INTO customers (',
        '    id,',
        '    organization_id,',
        '    customer_name,',
        '    mobile,',
        '    city,',
        '    address,',
        '    source,',
        '    metadata',
        ') VALUES (',
        '    $1,',
        '    $2,',
        '    $3,',
        '    $4,',
        '    $5,',
        '    $6,',
        '    $7,',
        '    $8::jsonb',
        ')',
      ].join('\n'),
      [
        customerId,
        organizationId,
        'Task1649 Test Customer',
        uniqueText('task1649_mobile'),
        'Task1649 City',
        'Task1649 Test Address',
        'website',
        JSON.stringify({ testScope: 'task1649' }),
      ],
    );

    await pool.query(
      [
        'INSERT INTO repair_intake_drafts (',
        '    id,',
        '    organization_id,',
        '    tenant_id,',
        '    draft_status,',
        '    source,',
        '    source_ref,',
        '    intake_source,',
        '    safe_summary,',
        '    safe_metadata,',
        '    validation_status,',
        '    validation_errors_safe',
        ') VALUES (',
        '    $1,',
        '    $2,',
        '    $3,',
        "    'ready_for_conversion',",
        "    'website',",
        '    $4,',
        "    'task1649_route_smoke',",
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
        JSON.stringify({ title: 'Task1649 safe route intake summary' }),
        JSON.stringify({ testScope: 'task1649', caseNo }),
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
    let idempotencyFindCalled = false;
    let recordedIdempotencyResult = null;

    const runtimePorts = {
      draftRepository,
      planningPolicy: {
        async planCaseFromDraft(input) {
          return {
            status: 'planned',
            reasonCode: 'TASK1649_ROUTE_PLAN_READY',
            candidate: {
              sourceDraftId: input.draftId,
              organizationId: input.organizationId,
              tenantId: input.tenantId,
              caseNo,
              customerId,
              source: 'web',
              brand: 'Task1649 Brand',
              productType: 'Task1649 Product',
              modelNo: 'Task1649 Model',
              problemDescription: 'Task1649 safe issue summary',
              serviceType: 'onsite',
              priority: 'normal',
              serviceRegion: 'Task1649 Region',
              metadata: {
                testScope: 'task1649',
                sourceRef,
              },
            },
          };
        },
      },
      caseCreationPort: {
        async createCaseFromDraft(input) {
          const candidate = input.plan && input.plan.candidate;
          const created = await caseRepository.createCaseFromRepairIntakeCandidate({
            command: {
              actorId,
              draftId,
              idempotencyKey,
              organizationId,
              requestId,
            },
            caseCandidate: candidate,
          });

          if (!created || created.status !== 'created') {
            return created;
          }

          await pool.query(
            [
              'INSERT INTO repair_intake_draft_case_conversions (',
              '    id,',
              '    organization_id,',
              '    tenant_id,',
              '    draft_id,',
              '    case_id,',
              '    case_ref,',
              '    conversion_status,',
              '    idempotency_key,',
              '    actor_id,',
              '    actor_type,',
              '    request_id,',
              '    safe_metadata,',
              '    submitted_at,',
              '    converted_at',
              ') VALUES (',
              '    $1,',
              '    $2,',
              '    $3,',
              '    $4,',
              '    $5,',
              '    $6,',
              "    'converted',",
              '    $7,',
              '    $8,',
              "    'system',",
              '    $9,',
              '    $10::jsonb,',
              '    now(),',
              '    now()',
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
              JSON.stringify({ testScope: 'task1649', routeLevel: true }),
            ],
          );

          await pool.query(
            [
              'UPDATE repair_intake_drafts',
              "SET draft_status = 'converted', converted_at = now()",
              'WHERE id = $1',
              '  AND organization_id = $2',
              '  AND tenant_id = $3',
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
          await pool.query(
            [
              'INSERT INTO repair_intake_audit_events (',
              '    id,',
              '    organization_id,',
              '    tenant_id,',
              '    event_type,',
              '    draft_id,',
              '    case_id,',
              '    case_ref,',
              '    actor_id,',
              '    actor_type,',
              '    request_id,',
              '    decision,',
              '    outcome,',
              '    reason_code,',
              '    safe_metadata,',
              '    visibility,',
              '    occurred_at',
              ') VALUES (',
              '    $1,',
              '    $2,',
              '    $3,',
              "    'repair_intake_draft_to_case_submission',",
              '    $4,',
              '    $5,',
              '    $6,',
              '    $7,',
              "    'system',",
              '    $8,',
              "    'case_created_from_route_composition',",
              "    'submitted',",
              "    'TASK1649_ROUTE_FLOW_RECORDED',",
              '    $9::jsonb,',
              "    'internal_only',",
              '    now()',
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
              JSON.stringify({
                testScope: 'task1649',
                conversionId,
                auditDraftId: input.draftId,
              }),
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
            reasonCode: 'TASK1649_ROUTE_AUDIT_RECORDED',
            metadata: {
              testScope: 'task1649',
            },
          };
        },
      },
      idempotencyStore: {
        findExistingDraftToCaseResult: (input) => {
          idempotencyFindCalled = true;

          return idempotencyRepository.findExistingDraftToCaseResult(input);
        },
        recordDraftToCaseResult: async (input) => {
          try {
            recordedIdempotencyResult = await idempotencyRepository.recordDraftToCaseResult({
              ...input,
              actorId,
              caseId,
              caseRef: caseNo,
              recordStatus: 'completed',
              safeRequestFingerprint,
            });
          } catch (error) {
            recordedIdempotencyResult = {
              ok: false,
              reasonCode: error && error.reasonCode,
              requiredActions: error && error.requiredActions,
            };
          }

          return recordedIdempotencyResult;
        },
      },
    };
    const mountTarget = createSyntheticMountTarget();
    const summary = createRepairIntakeDraftToCaseInjectedRouteComposition({
      runtimePorts,
      mountTarget,
      basePath: '/task1649',
    });

    assert.equal(summary.ok, true);
    assert.equal(summary.mounted, 2);
    assert.deepEqual(summary.routes, [
      {
        method: 'POST',
        path: '/task1649/repair-intake/drafts/:draftId/case/plan',
      },
      {
        method: 'POST',
        path: '/task1649/repair-intake/drafts/:draftId/case/submit',
      },
    ]);

    const response = await mountTarget.dispatch(
      'POST',
      '/task1649/repair-intake/drafts/:draftId/case/submit',
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
          approvalContext: {
            accepted: true,
          },
          actorId,
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
    assert.equal(response.body.action, 'repair_intake_draft_to_case_submit');
    assert.equal(response.body.draftId, draftId);
    assert.equal(response.body.organizationId, organizationId);
    assert.equal(response.body.submitted, true);
    assert.equal(response.body.caseRef.id, caseId);
    assert.equal(response.body.auditEvent.caseId, caseId);
    assert.equal(idempotencyFindCalled, true);

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
    assert.equal(insertedCase.rows[0].brand, 'Task1649 Brand');
    assert.equal(insertedCase.rows[0].case_type, 'repair');
    assert.equal(insertedCase.rows[0].metadata.testScope, 'task1649');

    const conversion = await pool.query(
      [
        'SELECT id, draft_id, case_id, case_ref, conversion_status, idempotency_key',
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
    assert.equal(conversion.rows[0].idempotency_key, idempotencyKey);

    const audit = await pool.query(
      [
        'SELECT id, event_type, draft_id, case_id, case_ref, outcome, visibility',
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
    assert.equal(
      recordedIdempotencyResult && recordedIdempotencyResult.reasonCode,
      'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_RECORDED',
    );

    const idempotency = await pool.query(
      [
        'SELECT id, draft_id, replay_case_id, replay_case_ref, record_status, replay_result_safe',
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
  } finally {
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
    await pool.end();
  }
});
