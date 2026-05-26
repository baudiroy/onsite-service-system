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
    'created_by',
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
    'created_at',
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

test('Zeabur DB smoke runs repair intake draft to case persistence flow and cleans test rows', async (t) => {
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
  const caseNo = uniqueText('TASK1647_CASE');
  const idempotencyKey = uniqueText('task1647_idem');
  const requestId = uniqueText('task1647_req');
  const sourceRef = uniqueText('task1647_source');
  const safeRequestFingerprint = uniqueText('task1647_fp');
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
      [organizationId, uniqueText('task1647_org'), 'Task1647 Test Organization'],
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
        'Task1647 Test Customer',
        uniqueText('task1647_mobile'),
        'Task1647 City',
        'Task1647 Test Address',
        'website',
        JSON.stringify({ testScope: 'task1647' }),
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
        "    'task1647_smoke',",
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
        JSON.stringify({ title: 'Task1647 safe repair intake summary' }),
        JSON.stringify({ testScope: 'task1647', caseNo }),
        JSON.stringify([]),
      ],
    );

    const draftRepository = createRepairIntakeDraftRepository({
      dbClient,
    });
    const draft = await draftRepository.findDraftForConversion({
      draftId,
      organizationId,
      tenantId,
    });

    assert.equal(draft.draftId, draftId);
    assert.equal(draft.organizationId, organizationId);
    assert.equal(draft.tenantId, tenantId);
    assert.equal(draft.status, 'ready_for_conversion');
    assert.equal(draft.source, 'website');
    assert.equal(draft.sourceRef, sourceRef);

    const caseRepository = createRepairIntakeCaseRepositoryAdapter({
      clock: () => '2026-05-26T00:00:00.000Z',
      dbClient,
      idGenerator: () => caseId,
    });
    const created = await caseRepository.createCaseFromRepairIntakeCandidate({
      command: {
        actorId,
        draftId,
        idempotencyKey,
        organizationId,
        requestId,
      },
      caseCandidate: {
        sourceDraftId: draftId,
        organizationId,
        caseNo,
        customerId,
        source: 'web',
        brand: 'Task1647 Brand',
        productType: 'Task1647 Product',
        modelNo: 'Task1647 Model',
        problemDescription: 'Task1647 safe issue summary',
        serviceType: 'onsite',
        priority: 'normal',
        serviceRegion: 'Task1647 Region',
        metadata: {
          testScope: 'task1647',
          sourceRef,
        },
      },
    });

    assert.deepEqual(created, {
      id: caseId,
      organizationId,
      sourceDraftId: draftId,
      status: 'created',
    });

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
        JSON.stringify({ testScope: 'task1647', caseStatus: created.status }),
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
        "    'case_created_from_repair_intake_draft',",
        "    'submitted',",
        "    'TASK1647_DRAFT_TO_CASE_FLOW_RECORDED',",
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
        JSON.stringify({ testScope: 'task1647', conversionId }),
      ],
    );

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

    const idempotencyRepository = createRepairIntakeIdempotencyRepository({
      dbClient,
    });
    const beforeRecord = await idempotencyRepository.findExistingDraftToCaseResult({
      idempotencyKey,
      operationType: 'draft_to_case',
      organizationId,
      tenantId,
    });

    assert.equal(beforeRecord, null);

    const recorded = await idempotencyRepository.recordDraftToCaseResult({
      actorId,
      caseId,
      caseRef: caseNo,
      draftId,
      idempotencyKey,
      operationType: 'draft_to_case',
      organizationId,
      recordStatus: 'completed',
      requestId,
      result: {
        caseId,
        caseRef: caseNo,
        draftId,
        organizationId,
        safeValue: 'task1647 safe replay',
        status: 'submitted',
      },
      safeRequestFingerprint,
      tenantId,
    });

    assert.equal(recorded.reasonCode, 'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_RECORDED');
    assert.equal(recorded.caseId, caseId);
    assert.equal(recorded.caseRef.caseRef, caseNo);
    assert.equal(recorded.draftId, draftId);
    assert.equal(recorded.idempotencyKey, idempotencyKey);
    assert.equal(recorded.organizationId, organizationId);
    assert.equal(recorded.tenantId, tenantId);

    const replay = await idempotencyRepository.findExistingDraftToCaseResult({
      idempotencyKey,
      operationType: 'draft_to_case',
      organizationId,
      tenantId,
    });

    assert.equal(replay.reasonCode, 'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_REPLAY_READY');
    assert.equal(replay.caseId, caseId);
    assert.equal(replay.caseRef.caseRef, caseNo);
    assert.equal(replay.draftId, draftId);
    assert.equal(replay.organizationId, organizationId);
    assert.equal(replay.tenantId, tenantId);
    assert.equal(replay.result.safeValue, 'task1647 safe replay');
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
