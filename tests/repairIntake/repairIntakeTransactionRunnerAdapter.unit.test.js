'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  RepairIntakeTransactionRunnerError,
  createRepairIntakeTransactionRunnerAdapter,
} = require('../../src/repairIntake/repairIntakeTransactionRunnerAdapter');

const SOURCE_PATH = path.join(__dirname, '../../src/repairIntake/repairIntakeTransactionRunnerAdapter.js');

function assertNoForbiddenFields(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'finalAppointmentId',
    'final_appointment_id',
    'phone',
    'address',
    'customerPayload',
    'rawImportedRowPayload',
    'rawPayload',
    'select *',
    'stack trace',
    'providerPayload',
    'token',
    'secret',
    'lineAccessToken',
    'LINE access token',
    'rows',
    'sql',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

async function assertSafeReject(promise, reasonCode) {
  await assert.rejects(
    promise,
    (error) => {
      assert.equal(error instanceof RepairIntakeTransactionRunnerError, true);
      assert.equal(error.message, reasonCode);
      assert.equal(error.reasonCode, reasonCode);
      assertNoForbiddenFields({
        name: error.name,
        message: error.message,
        reasonCode: error.reasonCode,
        requiredActions: error.requiredActions,
      });
      assertNoForbiddenFields(String(error));
      return true;
    },
  );
}

test('happy path with dbClient.transaction propagates callback result', async () => {
  const tx = { txId: 'tx_task954_transaction' };
  const dbClient = {
    transaction: async (callback) => callback(tx),
  };
  const runner = createRepairIntakeTransactionRunnerAdapter({ dbClient });

  const result = await runner.runInTransaction(async (receivedTx) => {
    assert.equal(receivedTx, tx);
    return { ok: true, value: 'created' };
  });

  assert.deepEqual(result, { ok: true, value: 'created' });
});

test('happy path with dbClient.runInTransaction propagates callback result', async () => {
  const tx = { txId: 'tx_task954_run' };
  const dbClient = {
    runInTransaction: async (callback) => callback(tx),
  };
  const runner = createRepairIntakeTransactionRunnerAdapter({ dbClient });

  const result = await runner.runInTransaction(async (receivedTx) => {
    assert.equal(receivedTx, tx);
    return 'ok_task954';
  });

  assert.equal(result, 'ok_task954');
});

test('happy path with dbClient.withTransaction propagates callback result', async () => {
  const tx = { txId: 'tx_task954_with' };
  const dbClient = {
    withTransaction: async (callback) => callback(tx),
  };
  const runner = createRepairIntakeTransactionRunnerAdapter({ dbClient });

  const result = await runner.runInTransaction(async (receivedTx) => {
    assert.equal(receivedTx, tx);
    return 954;
  });

  assert.equal(result, 954);
});

test('transaction alias works', async () => {
  const tx = { txId: 'tx_task954_alias' };
  const runner = createRepairIntakeTransactionRunnerAdapter({
    dbClient: {
      transaction: async (callback) => callback(tx),
    },
  });

  const result = await runner.transaction(async (receivedTx) => {
    assert.equal(receivedTx, tx);
    return { alias: true };
  });

  assert.deepEqual(result, { alias: true });
});

test('missing dbClient fails safely', async () => {
  const runner = createRepairIntakeTransactionRunnerAdapter();

  await assertSafeReject(
    runner.runInTransaction(async () => 'unused'),
    'REPAIR_INTAKE_TRANSACTION_RUNNER_DB_CLIENT_NOT_CONFIGURED',
  );
});

test('missing transaction method fails safely', async () => {
  const runner = createRepairIntakeTransactionRunnerAdapter({ dbClient: {} });

  await assertSafeReject(
    runner.runInTransaction(async () => 'unused'),
    'REPAIR_INTAKE_TRANSACTION_RUNNER_METHOD_NOT_CONFIGURED',
  );
});

test('missing callback fails safely', async () => {
  const runner = createRepairIntakeTransactionRunnerAdapter({
    dbClient: {
      transaction: async (callback) => callback({ txId: 'tx_should_not_run' }),
    },
  });

  await assertSafeReject(
    runner.runInTransaction(null),
    'REPAIR_INTAKE_TRANSACTION_RUNNER_CALLBACK_MISSING',
  );
});

test('callback receives only synthetic tx object', async () => {
  const tx = {
    txId: 'tx_task954_only',
    phone: 'phone',
    address: 'address',
    token: 'token',
  };
  const runner = createRepairIntakeTransactionRunnerAdapter({
    dbClient: {
      transaction: async (callback) => callback(tx, { shouldNotPass: true }),
    },
  });

  const result = await runner.runInTransaction(async (...args) => {
    assert.equal(args.length, 1);
    assert.equal(args[0], tx);
    return { ok: true };
  });

  assert.deepEqual(result, { ok: true });
});

test('callback return value is propagated without exposing transaction internals', async () => {
  const runner = createRepairIntakeTransactionRunnerAdapter({
    dbClient: {
      transaction: async (callback) => callback({ txId: 'tx_task954_value' }),
    },
  });

  const result = await runner.runInTransaction(async () => ({
    id: 'case_task954_001',
    organizationId: 'org_task954',
    sourceDraftId: 'draft_task954_001',
    status: 'created',
  }));

  assert.deepEqual(result, {
    id: 'case_task954_001',
    organizationId: 'org_task954',
    sourceDraftId: 'draft_task954_001',
    status: 'created',
  });
});

test('callback throw does not leak raw error details', async () => {
  const runner = createRepairIntakeTransactionRunnerAdapter({
    dbClient: {
      transaction: async (callback) => callback({ txId: 'tx_task954_callback_throw' }),
    },
  });

  await assertSafeReject(
    runner.runInTransaction(async () => {
      throw new Error('select * stack trace providerPayload token secret phone address customerPayload lineAccessToken finalAppointmentId');
    }),
    'REPAIR_INTAKE_TRANSACTION_RUNNER_FAILED',
  );
});

test('transaction method throw does not leak raw error details', async () => {
  const runner = createRepairIntakeTransactionRunnerAdapter({
    dbClient: {
      transaction: async () => {
        throw new Error('select * stack trace providerPayload token secret phone address customerPayload lineAccessToken finalAppointmentId');
      },
    },
  });

  await assertSafeReject(
    runner.runInTransaction(async () => 'unused'),
    'REPAIR_INTAKE_TRANSACTION_RUNNER_FAILED',
  );
});

test('safe failures do not return SQL text or raw sensitive payloads', async () => {
  const runner = createRepairIntakeTransactionRunnerAdapter({
    dbClient: {
      withTransaction: async () => {
        throw new Error('sql select * rows phone address customerPayload token secret LINE access token finalAppointmentId');
      },
    },
  });

  await assertSafeReject(
    runner.transaction(async () => ({
      sql: 'select *',
      phone: 'phone',
      address: 'address',
      token: 'token',
    })),
    'REPAIR_INTAKE_TRANSACTION_RUNNER_FAILED',
  );
});

test('adapter source does not import global DB API provider AI admin billing smoke or concrete runtime', () => {
  const source = fs.readFileSync(SOURCE_PATH, 'utf8');
  const specifiers = [];
  const requirePattern = /\brequire\(\s*['"]([^'"]+)['"]\s*\)/g;
  let match;

  while ((match = requirePattern.exec(source)) !== null) {
    specifiers.push(match[1]);
  }

  assert.deepEqual(specifiers, []);

  for (const forbidden of [
    '../repositories',
    '../routes',
    '../controllers',
    '../providers',
    '../ai',
    '../billing',
    '../admin',
    '../smoke',
    'pg',
    'sequelize',
    'knex',
    'openai',
    'line',
    'sms',
  ]) {
    assert.equal(source.includes(`require('${forbidden}`), false, `source should not import ${forbidden}`);
    assert.equal(source.includes(`require("${forbidden}`), false, `source should not import ${forbidden}`);
    assert.equal(source.includes(`from '${forbidden}`), false, `source should not import ${forbidden}`);
    assert.equal(source.includes(`from "${forbidden}`), false, `source should not import ${forbidden}`);
  }

  for (const forbiddenRuntime of [
    'createDefault',
    'defaultDbClient',
    'defaultTransactionRunner',
    'caseRepository',
    'draftRepository',
    'auditWriter',
    'idempotencyStore',
    'query(',
    'execute(',
  ]) {
    assert.equal(source.includes(forbiddenRuntime), false, `source should not include ${forbiddenRuntime}`);
  }
});
