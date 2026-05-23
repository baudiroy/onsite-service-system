'use strict';

class RepairIntakeTransactionRunnerError extends Error {
  constructor(reasonCode, requiredActions = ['retry_or_manual_review']) {
    super(reasonCode);
    this.name = 'RepairIntakeTransactionRunnerError';
    this.reasonCode = reasonCode;
    this.requiredActions = requiredActions;
  }
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function safeError(reasonCode, requiredActions) {
  return new RepairIntakeTransactionRunnerError(reasonCode, requiredActions);
}

function resolveTransactionRunner(dbClient) {
  if (!isObject(dbClient)) {
    return undefined;
  }

  if (typeof dbClient.transaction === 'function') {
    return dbClient.transaction.bind(dbClient);
  }

  if (typeof dbClient.runInTransaction === 'function') {
    return dbClient.runInTransaction.bind(dbClient);
  }

  if (typeof dbClient.withTransaction === 'function') {
    return dbClient.withTransaction.bind(dbClient);
  }

  return undefined;
}

function createRepairIntakeTransactionRunnerAdapter(options = {}) {
  const safeOptions = isObject(options) ? options : {};
  const dbClient = isObject(safeOptions.dbClient) ? safeOptions.dbClient : null;
  const runTransaction = resolveTransactionRunner(dbClient);

  async function runInTransaction(callback) {
    if (!dbClient) {
      throw safeError(
        'REPAIR_INTAKE_TRANSACTION_RUNNER_DB_CLIENT_NOT_CONFIGURED',
        ['configure_db_client'],
      );
    }

    if (!runTransaction) {
      throw safeError(
        'REPAIR_INTAKE_TRANSACTION_RUNNER_METHOD_NOT_CONFIGURED',
        ['configure_transaction_method'],
      );
    }

    if (typeof callback !== 'function') {
      throw safeError(
        'REPAIR_INTAKE_TRANSACTION_RUNNER_CALLBACK_MISSING',
        ['provide_transaction_callback'],
      );
    }

    try {
      return await runTransaction(async (tx) => callback(tx));
    } catch (error) {
      if (error instanceof RepairIntakeTransactionRunnerError) {
        throw error;
      }

      throw safeError(
        'REPAIR_INTAKE_TRANSACTION_RUNNER_FAILED',
        ['retry_or_manual_review'],
      );
    }
  }

  return {
    runInTransaction,
    transaction: runInTransaction,
  };
}

module.exports = {
  RepairIntakeTransactionRunnerError,
  createRepairIntakeTransactionRunnerAdapter,
};
