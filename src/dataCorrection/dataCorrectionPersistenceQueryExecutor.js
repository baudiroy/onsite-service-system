'use strict';

const {
  DATA_CORRECTION_PERSISTENCE_RECORD_TYPES,
  buildDataCorrectionPersistenceQuerySpec,
} = require('./dataCorrectionPersistenceRecordMapper');

const DATA_CORRECTION_PERSISTENCE_QUERY_EXECUTOR_REASON_CODES = Object.freeze({
  EXECUTOR_FAILED: 'EXECUTOR_FAILED',
  EXECUTOR_RESULT_MALFORMED: 'EXECUTOR_RESULT_MALFORMED',
  INVALID_QUERY_SPEC: 'INVALID_QUERY_SPEC',
  MISSING_EXECUTOR: 'MISSING_EXECUTOR',
  QUERY_SPEC_NOT_EXECUTABLE: 'QUERY_SPEC_NOT_EXECUTABLE',
});

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function deepFreeze(value) {
  if (!isPlainObject(value) && !Array.isArray(value)) {
    return value;
  }

  Object.freeze(value);

  for (const nestedValue of Object.values(value)) {
    deepFreeze(nestedValue);
  }

  return value;
}

function isSupportedRecordType(recordType) {
  return Object.values(DATA_CORRECTION_PERSISTENCE_RECORD_TYPES).includes(recordType);
}

function hasOwnOption(options, key) {
  return Boolean(options) && Object.prototype.hasOwnProperty.call(options, key);
}

function executorFromOptions(options = {}) {
  return hasOwnOption(options, 'queryExecutor')
    ? options.queryExecutor
    : options.executor;
}

function safeRecordType(recordType) {
  return isSupportedRecordType(recordType) ? recordType : 'unknown';
}

function fail(recordType, reasonCode) {
  const safeType = safeRecordType(recordType);

  return {
    ok: false,
    persisted: false,
    writerType: safeType,
    recordType: safeType,
    reasonCode,
  };
}

function success(recordType) {
  return {
    ok: true,
    persisted: true,
    writerType: recordType,
    recordType,
  };
}

function resolveExecutor(executor) {
  if (typeof executor === 'function') {
    return executor;
  }

  if (isPlainObject(executor) && typeof executor.execute === 'function') {
    return executor.execute.bind(executor);
  }

  return null;
}

function isSuccessfulExecutorResult(result) {
  return isPlainObject(result) && result.ok === true;
}

async function executeDataCorrectionPersistenceQuery(input = {}, options = {}) {
  const querySpec = buildDataCorrectionPersistenceQuerySpec(input);

  if (!querySpec.ok) {
    return fail(
      querySpec.recordType,
      querySpec.reasonCode || DATA_CORRECTION_PERSISTENCE_QUERY_EXECUTOR_REASON_CODES.INVALID_QUERY_SPEC,
    );
  }

  if (querySpec.executable !== true && options.allowNonExecutableForTest !== true) {
    return fail(
      querySpec.recordType,
      DATA_CORRECTION_PERSISTENCE_QUERY_EXECUTOR_REASON_CODES.QUERY_SPEC_NOT_EXECUTABLE,
    );
  }

  const executor = resolveExecutor(executorFromOptions(options));

  if (!executor) {
    return fail(querySpec.recordType, DATA_CORRECTION_PERSISTENCE_QUERY_EXECUTOR_REASON_CODES.MISSING_EXECUTOR);
  }

  try {
    const executorResult = await executor(deepFreeze(clone(querySpec)));

    if (!isSuccessfulExecutorResult(executorResult)) {
      return fail(
        querySpec.recordType,
        DATA_CORRECTION_PERSISTENCE_QUERY_EXECUTOR_REASON_CODES.EXECUTOR_RESULT_MALFORMED,
      );
    }
  } catch (error) {
    return fail(querySpec.recordType, DATA_CORRECTION_PERSISTENCE_QUERY_EXECUTOR_REASON_CODES.EXECUTOR_FAILED);
  }

  return success(querySpec.recordType);
}

function createDataCorrectionPersistenceQueryExecutor(options = {}) {
  const defaultOptions = {
    allowNonExecutableForTest: options.allowNonExecutableForTest === true,
    executor: executorFromOptions(options),
  };

  return function dataCorrectionPersistenceQueryExecutor(input = {}, runtimeOptions = {}) {
    return executeDataCorrectionPersistenceQuery(input, {
      allowNonExecutableForTest: runtimeOptions.allowNonExecutableForTest === true
        || defaultOptions.allowNonExecutableForTest,
      executor: hasOwnOption(runtimeOptions, 'queryExecutor')
        ? runtimeOptions.queryExecutor
        : hasOwnOption(runtimeOptions, 'executor')
          ? runtimeOptions.executor
        : defaultOptions.executor,
    });
  };
}

module.exports = {
  DATA_CORRECTION_PERSISTENCE_QUERY_EXECUTOR_REASON_CODES,
  createDataCorrectionPersistenceQueryExecutor,
  executeDataCorrectionPersistenceQuery,
};
