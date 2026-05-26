'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const test = require('node:test');
const { Pool } = require('pg');

const {
  createRepairIntakeIdempotencyRepository,
} = require('../../src/repairIntake/repairIntakeIdempotencyRepository');

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

test('Zeabur DB smoke writes reads duplicate no-op and cleans repair intake idempotency record', async () => {
  const pool = new Pool({
    connectionString: requireDatabaseUrl(),
    max: 1,
  });

  const organizationId = crypto.randomUUID();
  const tenantId = crypto.randomUUID();
  const idempotencyKey = uniqueText('task1636_idem');
  const operationType = 'draft_to_case';
  const caseId = crypto.randomUUID();
  const caseRef = uniqueText('TASK1636_CASE');
  const safeRequestFingerprint = uniqueText('task1636_fp');
  const repository = createRepairIntakeIdempotencyRepository({
    dbClient: createDbClient(pool),
  });

  async function rowCount() {
    const result = await pool.query(
      [
        'SELECT count(*)::int AS count',
        'FROM repair_intake_idempotency_records',
        'WHERE organization_id = $1',
        '  AND tenant_id = $2',
        '  AND operation_type = $3',
        '  AND idempotency_key = $4',
      ].join('\n'),
      [organizationId, tenantId, operationType, idempotencyKey],
    );

    return Number(result.rows[0].count);
  }

  try {
    const before = await repository.findExistingDraftToCaseResult({
      idempotencyKey,
      operationType,
      organizationId,
      tenantId,
    });

    assert.equal(before, null);

    const recordInput = {
      actorId: crypto.randomUUID(),
      caseId,
      caseRef,
      idempotencyKey,
      operationType,
      organizationId,
      recordStatus: 'completed',
      requestId: uniqueText('task1636_req'),
      result: {
        caseId,
        caseRef,
        safeValue: 'task1636 safe replay',
        status: 'submitted',
      },
      safeRequestFingerprint,
      tenantId,
    };

    const recorded = await repository.recordDraftToCaseResult(recordInput);

    assert.equal(recorded.reasonCode, 'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_RECORDED');
    assert.equal(recorded.idempotencyKey, idempotencyKey);
    assert.equal(recorded.organizationId, organizationId);
    assert.equal(recorded.tenantId, tenantId);
    assert.equal(recorded.caseId, caseId);
    assert.equal(await rowCount(), 1);

    const duplicate = await repository.recordDraftToCaseResult(recordInput);

    assert.equal(duplicate.reasonCode, 'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_RECORDED');
    assert.equal(await rowCount(), 1);

    const replay = await repository.findExistingDraftToCaseResult({
      idempotencyKey,
      operationType,
      organizationId,
      tenantId,
    });

    assert.equal(replay.reasonCode, 'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_REPLAY_READY');
    assert.equal(replay.idempotencyKey, idempotencyKey);
    assert.equal(replay.organizationId, organizationId);
    assert.equal(replay.tenantId, tenantId);
    assert.equal(replay.caseId, caseId);
    assert.equal(replay.result.safeValue, 'task1636 safe replay');
  } finally {
    await pool.query(
      [
        'DELETE FROM repair_intake_idempotency_records',
        'WHERE organization_id = $1',
        '  AND tenant_id = $2',
        '  AND operation_type = $3',
        '  AND idempotency_key = $4',
      ].join('\n'),
      [organizationId, tenantId, operationType, idempotencyKey],
    ).catch(() => {});
    await pool.end();
  }
});
