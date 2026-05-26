'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const test = require('node:test');
const { Pool } = require('pg');

const {
  createRepairIntakeCaseRepositoryAdapter,
} = require('../../src/repairIntake/repairIntakeCaseRepositoryAdapter');

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
    'created_at',
  ],
  customers: [
    'id',
    'customer_name',
    'mobile',
    'city',
    'address',
    'source',
    'organization_id',
  ],
  organizations: [
    'id',
    'organization_code',
    'organization_name',
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

test('Zeabur DB smoke creates reads and cleans formal case through Repair Intake adapter', async (t) => {
  const pool = new Pool({
    connectionString: requireDatabaseUrl(),
    max: 1,
  });

  const organizationId = crypto.randomUUID();
  const customerId = crypto.randomUUID();
  const caseId = crypto.randomUUID();
  const sourceDraftId = crypto.randomUUID();
  const caseNo = uniqueText('TASK1645_CASE');

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
      [organizationId, uniqueText('task1645_org'), 'Task1645 Test Organization'],
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
        'Task1645 Test Customer',
        uniqueText('task1645_mobile'),
        'Task1645 City',
        'Task1645 Test Address',
        'website',
        JSON.stringify({ testScope: 'task1645' }),
      ],
    );

    const repository = createRepairIntakeCaseRepositoryAdapter({
      clock: () => '2026-05-26T00:00:00.000Z',
      dbClient: createDbClient(pool),
      idGenerator: () => caseId,
    });

    const result = await repository.createCaseFromRepairIntakeCandidate({
      command: {
        draftId: sourceDraftId,
        idempotencyKey: uniqueText('task1645_idem'),
        organizationId,
        requestId: uniqueText('task1645_req'),
      },
      caseCandidate: {
        sourceDraftId,
        organizationId,
        caseNo,
        customerId,
        source: 'web',
        brand: 'Task1645 Brand',
        productType: 'Task1645 Product',
        modelNo: 'Task1645 Model',
        problemDescription: 'Task1645 safe issue summary',
        serviceType: 'onsite',
        priority: 'normal',
        serviceRegion: 'Task1645 Region',
        metadata: {
          testScope: 'task1645',
        },
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
        'SELECT id, case_no, customer_id, organization_id, status, source, brand,',
        '       case_type, product_type, model_no, problem_description, service_region, metadata',
        'FROM cases',
        'WHERE id = $1',
        '  AND organization_id = $2',
      ].join('\n'),
      [caseId, organizationId],
    );

    assert.equal(inserted.rowCount, 1);
    assert.equal(inserted.rows[0].id, caseId);
    assert.equal(inserted.rows[0].case_no, caseNo);
    assert.equal(inserted.rows[0].customer_id, customerId);
    assert.equal(inserted.rows[0].organization_id, organizationId);
    assert.equal(inserted.rows[0].status, 'draft');
    assert.equal(inserted.rows[0].source, 'website');
    assert.equal(inserted.rows[0].brand, 'Task1645 Brand');
    assert.equal(inserted.rows[0].case_type, 'repair');
    assert.equal(inserted.rows[0].product_type, 'Task1645 Product');
    assert.equal(inserted.rows[0].model_no, 'Task1645 Model');
    assert.equal(inserted.rows[0].problem_description, 'Task1645 safe issue summary');
    assert.equal(inserted.rows[0].service_region, 'Task1645 Region');
    assert.equal(inserted.rows[0].metadata.testScope, 'task1645');
  } finally {
    await pool.query('DELETE FROM cases WHERE id = $1 AND organization_id = $2', [caseId, organizationId]).catch(() => {});
    await pool.query('DELETE FROM customers WHERE id = $1 AND organization_id = $2', [customerId, organizationId]).catch(() => {});
    await pool.query('DELETE FROM organizations WHERE id = $1', [organizationId]).catch(() => {});
    await pool.end();
  }
});
