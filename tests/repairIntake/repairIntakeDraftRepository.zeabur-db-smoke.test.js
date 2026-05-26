'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const test = require('node:test');
const { Pool } = require('pg');

const {
  createRepairIntakeDraftRepository,
} = require('../../src/repairIntake/repairIntakeDraftRepository');

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

test('Zeabur DB smoke inserts reads and cleans repair intake draft', async () => {
  const pool = new Pool({
    connectionString: requireDatabaseUrl(),
    max: 1,
  });

  const draftId = crypto.randomUUID();
  const organizationId = crypto.randomUUID();
  const tenantId = crypto.randomUUID();
  const sourceRef = uniqueText('task1638_source');
  const repository = createRepairIntakeDraftRepository({
    dbClient: createDbClient(pool),
  });

  try {
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
        "    'zeabur_db_smoke',",
        '    $4,',
        "    'task1638_smoke',",
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
        JSON.stringify({ title: 'task1638 safe summary' }),
        JSON.stringify({ safeKey: 'task1638 safe metadata' }),
        JSON.stringify(['task1638 safe warning']),
      ],
    );

    const draft = await repository.findDraftForConversion({
      draftId,
      organizationId,
      tenantId,
    });

    assert.deepEqual(draft, {
      draftId,
      organizationId,
      tenantId,
      status: 'ready_for_conversion',
      source: 'zeabur_db_smoke',
      sourceRef,
      intakeSource: 'task1638_smoke',
      summary: {
        title: 'task1638 safe summary',
      },
      metadata: {
        safeKey: 'task1638 safe metadata',
      },
      warnings: ['task1638 safe warning'],
    });
  } finally {
    await pool.query(
      [
        'DELETE FROM repair_intake_drafts',
        'WHERE id = $1',
        '  AND organization_id = $2',
        '  AND tenant_id = $3',
      ].join('\n'),
      [draftId, organizationId, tenantId],
    ).catch(() => {});
    await pool.end();
  }
});
