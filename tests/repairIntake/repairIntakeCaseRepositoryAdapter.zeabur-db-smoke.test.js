'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const test = require('node:test');
const { Pool } = require('pg');

const {
  createRepairIntakeCaseRepositoryAdapter,
} = require('../../src/repairIntake/repairIntakeCaseRepositoryAdapter');

const REQUIRED_CASE_COLUMNS = [
  'id',
  'organization_id',
  'source_repair_intake_draft_id',
  'brand_id',
  'service_provider_id',
  'intake_source',
  'service_type',
  'priority',
  'status',
  'created_by_actor_id',
  'created_at',
  'request_id',
  'idempotency_key',
];

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

async function introspectCasesSchema(pool) {
  const table = await pool.query(
    `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = current_schema()
          AND table_name = 'cases'
      ) AS exists
    `,
  );

  if (!table.rows[0].exists) {
    return {
      ok: false,
      reason: 'cases_table_missing',
      missingColumns: REQUIRED_CASE_COLUMNS,
    };
  }

  const columns = await pool.query(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = 'cases'
      ORDER BY column_name
    `,
  );
  const columnNames = new Set(columns.rows.map((row) => row.column_name));
  const missingColumns = REQUIRED_CASE_COLUMNS.filter((columnName) => !columnNames.has(columnName));

  if (missingColumns.length > 0) {
    return {
      ok: false,
      reason: 'cases_required_columns_missing',
      missingColumns,
    };
  }

  const constraints = await pool.query(
    `
      SELECT pg_get_constraintdef(c.oid) AS definition
      FROM pg_constraint c
      JOIN pg_class r ON r.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = r.relnamespace
      WHERE n.nspname = current_schema()
        AND r.relname = 'cases'
        AND c.contype = 'c'
    `,
  );
  const statusConstraints = constraints.rows
    .map((row) => row.definition)
    .filter((definition) => /\bstatus\b/.test(definition));
  const statusSupportsCreated = statusConstraints.length === 0
    || statusConstraints.some((definition) => definition.includes("'created'"));

  if (!statusSupportsCreated) {
    return {
      ok: false,
      reason: 'cases_status_created_not_supported',
      missingColumns: [],
    };
  }

  return {
    ok: true,
    missingColumns: [],
  };
}

test('Zeabur DB smoke safely creates reads and cleans repair intake case when schema supports it', async (t) => {
  const pool = new Pool({
    connectionString: requireDatabaseUrl(),
    max: 1,
  });

  const caseId = crypto.randomUUID();
  const organizationId = crypto.randomUUID();
  const sourceDraftId = crypto.randomUUID();

  try {
    const schema = await introspectCasesSchema(pool);

    if (!schema.ok) {
      t.skip(`safe block: ${schema.reason}; missing=${schema.missingColumns.join(',') || 'none'}`);
      return;
    }

    const repository = createRepairIntakeCaseRepositoryAdapter({
      clock: () => '2026-05-26T00:00:00.000Z',
      dbClient: createDbClient(pool),
      idGenerator: () => caseId,
    });

    const result = await repository.createCaseFromRepairIntakeCandidate({
      command: {
        draftId: sourceDraftId,
        idempotencyKey: uniqueText('task1640_idem'),
        organizationId,
        requestId: uniqueText('task1640_req'),
      },
      caseCandidate: {
        sourceDraftId,
        organizationId,
        intakeSource: 'web',
        serviceType: 'onsite',
        priority: 'normal',
      },
    });

    assert.deepEqual(result, {
      id: caseId,
      organizationId,
      sourceDraftId,
      status: 'created',
    });

    const inserted = await pool.query(
      [
        'SELECT id, organization_id, source_repair_intake_draft_id, status',
        'FROM cases',
        'WHERE id = $1',
        '  AND organization_id = $2',
      ].join('\n'),
      [caseId, organizationId],
    );

    assert.equal(inserted.rowCount, 1);
    assert.equal(inserted.rows[0].id, caseId);
    assert.equal(inserted.rows[0].organization_id, organizationId);
    assert.equal(inserted.rows[0].source_repair_intake_draft_id, sourceDraftId);
    assert.equal(inserted.rows[0].status, 'created');
  } finally {
    await pool.query(
      [
        'DELETE FROM cases',
        'WHERE id = $1',
        '  AND organization_id = $2',
      ].join('\n'),
      [caseId, organizationId],
    ).catch(() => {});
    await pool.end();
  }
});
