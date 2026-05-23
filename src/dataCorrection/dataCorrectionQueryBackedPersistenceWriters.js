'use strict';

const {
  DATA_CORRECTION_PERSISTENCE_WRITER_TYPES,
  createDataCorrectionPersistenceWriterSet,
} = require('./dataCorrectionPersistenceWriters');
const {
  buildDataCorrectionPersistenceQuerySpec,
} = require('./dataCorrectionPersistenceRecordMapper');

const DATA_CORRECTION_QUERY_BACKED_WRITER_REASON_CODES = Object.freeze({
  ASYNC_EXECUTOR_NOT_SUPPORTED: 'ASYNC_EXECUTOR_NOT_SUPPORTED',
  EXECUTOR_FAILED: 'EXECUTOR_FAILED',
  EXECUTOR_RESULT_MALFORMED: 'EXECUTOR_RESULT_MALFORMED',
  INVALID_QUERY_SPEC: 'INVALID_QUERY_SPEC',
  MISSING_EXECUTOR: 'MISSING_EXECUTOR',
  QUERY_SPEC_NOT_EXECUTABLE: 'QUERY_SPEC_NOT_EXECUTABLE',
});

const QUERY_BACKED_WRITER_BINDINGS = Object.freeze([
  {
    highLevelKey: 'appointmentResultWriter',
    lowLevelKey: 'appointmentResultPersistenceWriter',
    writerType: DATA_CORRECTION_PERSISTENCE_WRITER_TYPES.APPOINTMENT_RESULT,
  },
  {
    highLevelKey: 'auditWriter',
    lowLevelKey: 'auditPersistenceWriter',
    writerType: DATA_CORRECTION_PERSISTENCE_WRITER_TYPES.AUDIT,
  },
  {
    highLevelKey: 'contactLogWriter',
    lowLevelKey: 'contactLogPersistenceWriter',
    writerType: DATA_CORRECTION_PERSISTENCE_WRITER_TYPES.CONTACT_LOG,
  },
  {
    highLevelKey: 'correctionWriter',
    lowLevelKey: 'correctionApplicationPersistenceWriter',
    writerType: DATA_CORRECTION_PERSISTENCE_WRITER_TYPES.CORRECTION_APPLICATION,
  },
  {
    highLevelKey: 'dispatchNoteWriter',
    lowLevelKey: 'dispatchNotePersistenceWriter',
    writerType: DATA_CORRECTION_PERSISTENCE_WRITER_TYPES.DISPATCH_NOTE,
  },
  {
    highLevelKey: 'engineerNotificationWriter',
    lowLevelKey: 'engineerNotificationIntentPersistenceWriter',
    writerType: DATA_CORRECTION_PERSISTENCE_WRITER_TYPES.ENGINEER_NOTIFICATION_INTENT,
  },
  {
    highLevelKey: 'evidenceWriter',
    lowLevelKey: 'evidencePersistenceWriter',
    writerType: DATA_CORRECTION_PERSISTENCE_WRITER_TYPES.EVIDENCE,
  },
  {
    highLevelKey: 'followUpDraftWriter',
    lowLevelKey: 'followUpDraftPersistenceWriter',
    writerType: DATA_CORRECTION_PERSISTENCE_WRITER_TYPES.FOLLOW_UP_DRAFT,
  },
].map((binding) => Object.freeze(binding)));

const DATA_CORRECTION_QUERY_BACKED_HIGH_LEVEL_WRITER_KEYS = Object.freeze(
  QUERY_BACKED_WRITER_BINDINGS.map((binding) => binding.highLevelKey),
);

const DATA_CORRECTION_QUERY_BACKED_LOW_LEVEL_WRITER_KEYS = Object.freeze(
  QUERY_BACKED_WRITER_BINDINGS.map((binding) => binding.lowLevelKey),
);

const DATA_CORRECTION_QUERY_BACKED_WRITER_TYPES = Object.freeze(
  QUERY_BACKED_WRITER_BINDINGS.map((binding) => binding.writerType),
);

function executorOptions(options) {
  return {
    allowNonExecutableForTest: options.allowNonExecutableForTest === true,
    executor: Object.prototype.hasOwnProperty.call(options, 'queryExecutor')
      ? options.queryExecutor
      : options.executor,
  };
}

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

function fail(recordType, reasonCode) {
  const safeRecordType = Object.values(DATA_CORRECTION_PERSISTENCE_WRITER_TYPES).includes(recordType)
    ? recordType
    : 'unknown';

  return {
    ok: false,
    persisted: false,
    writerType: safeRecordType,
    recordType: safeRecordType,
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

function isPromiseLike(value) {
  return Boolean(value) && (
    typeof value === 'object'
    || typeof value === 'function'
  ) && typeof value.then === 'function';
}

function settleRejectedPromise(value) {
  if (isPromiseLike(value) && typeof value.catch === 'function') {
    value.catch(() => {});
  }
}

function executeDataCorrectionPersistenceQuerySync(input = {}, options = {}) {
  const querySpec = buildDataCorrectionPersistenceQuerySpec(input);

  if (!querySpec.ok) {
    return fail(
      querySpec.recordType,
      querySpec.reasonCode || DATA_CORRECTION_QUERY_BACKED_WRITER_REASON_CODES.INVALID_QUERY_SPEC,
    );
  }

  if (querySpec.executable !== true && options.allowNonExecutableForTest !== true) {
    return fail(querySpec.recordType, DATA_CORRECTION_QUERY_BACKED_WRITER_REASON_CODES.QUERY_SPEC_NOT_EXECUTABLE);
  }

  const executor = resolveExecutor(options.executor);

  if (!executor) {
    return fail(querySpec.recordType, DATA_CORRECTION_QUERY_BACKED_WRITER_REASON_CODES.MISSING_EXECUTOR);
  }

  try {
    const executorResult = executor(deepFreeze(clone(querySpec)));

    if (isPromiseLike(executorResult)) {
      settleRejectedPromise(executorResult);
      return fail(querySpec.recordType, DATA_CORRECTION_QUERY_BACKED_WRITER_REASON_CODES.ASYNC_EXECUTOR_NOT_SUPPORTED);
    }

    if (!isPlainObject(executorResult) || executorResult.ok !== true) {
      return fail(
        querySpec.recordType,
        DATA_CORRECTION_QUERY_BACKED_WRITER_REASON_CODES.EXECUTOR_RESULT_MALFORMED,
      );
    }
  } catch (error) {
    return fail(querySpec.recordType, DATA_CORRECTION_QUERY_BACKED_WRITER_REASON_CODES.EXECUTOR_FAILED);
  }

  return success(querySpec.recordType);
}

async function executeDataCorrectionPersistenceQueryAsync(input = {}, options = {}) {
  const querySpec = buildDataCorrectionPersistenceQuerySpec(input);

  if (!querySpec.ok) {
    return fail(
      querySpec.recordType,
      querySpec.reasonCode || DATA_CORRECTION_QUERY_BACKED_WRITER_REASON_CODES.INVALID_QUERY_SPEC,
    );
  }

  if (querySpec.executable !== true && options.allowNonExecutableForTest !== true) {
    return fail(querySpec.recordType, DATA_CORRECTION_QUERY_BACKED_WRITER_REASON_CODES.QUERY_SPEC_NOT_EXECUTABLE);
  }

  const executor = resolveExecutor(options.executor);

  if (!executor) {
    return fail(querySpec.recordType, DATA_CORRECTION_QUERY_BACKED_WRITER_REASON_CODES.MISSING_EXECUTOR);
  }

  try {
    const executorResult = await executor(deepFreeze(clone(querySpec)));

    if (!isPlainObject(executorResult) || executorResult.ok !== true) {
      return fail(
        querySpec.recordType,
        DATA_CORRECTION_QUERY_BACKED_WRITER_REASON_CODES.EXECUTOR_RESULT_MALFORMED,
      );
    }
  } catch (error) {
    return fail(querySpec.recordType, DATA_CORRECTION_QUERY_BACKED_WRITER_REASON_CODES.EXECUTOR_FAILED);
  }

  return success(querySpec.recordType);
}

function createLowLevelWriter(writerType, options) {
  return function dataCorrectionQueryBackedLowLevelWriter(payload) {
    return executeDataCorrectionPersistenceQuerySync({
      writerType,
      payload,
    }, executorOptions(options));
  };
}

function createAsyncLowLevelWriter(writerType, options) {
  return async function dataCorrectionAsyncQueryBackedLowLevelWriter(payload) {
    return executeDataCorrectionPersistenceQueryAsync({
      writerType,
      payload,
    }, executorOptions(options));
  };
}

function createDataCorrectionQueryBackedLowLevelWriters(options = {}) {
  const writers = {};

  for (const binding of QUERY_BACKED_WRITER_BINDINGS) {
    writers[binding.lowLevelKey] = createLowLevelWriter(binding.writerType, options);
  }

  return writers;
}

function createDataCorrectionAsyncQueryBackedLowLevelWriters(options = {}) {
  const writers = {};

  for (const binding of QUERY_BACKED_WRITER_BINDINGS) {
    writers[binding.lowLevelKey] = createAsyncLowLevelWriter(binding.writerType, options);
  }

  return writers;
}

function createDataCorrectionQueryBackedPersistenceWriters(options = {}) {
  const lowLevelWriters = createDataCorrectionQueryBackedLowLevelWriters(options);
  const contractShape = createDataCorrectionPersistenceWriterSet(lowLevelWriters);
  const writerSet = {};

  for (const binding of QUERY_BACKED_WRITER_BINDINGS) {
    if (typeof contractShape[binding.highLevelKey] === 'function') {
      writerSet[binding.highLevelKey] = lowLevelWriters[binding.lowLevelKey];
    }
  }

  return writerSet;
}

function createDataCorrectionAsyncQueryBackedPersistenceWriters(options = {}) {
  const lowLevelWriters = createDataCorrectionAsyncQueryBackedLowLevelWriters(options);
  const writerSet = {};

  for (const binding of QUERY_BACKED_WRITER_BINDINGS) {
    writerSet[binding.highLevelKey] = lowLevelWriters[binding.lowLevelKey];
  }

  return writerSet;
}

module.exports = {
  DATA_CORRECTION_QUERY_BACKED_HIGH_LEVEL_WRITER_KEYS,
  DATA_CORRECTION_QUERY_BACKED_LOW_LEVEL_WRITER_KEYS,
  DATA_CORRECTION_QUERY_BACKED_WRITER_TYPES,
  DATA_CORRECTION_QUERY_BACKED_WRITER_REASON_CODES,
  QUERY_BACKED_WRITER_BINDINGS,
  createDataCorrectionAsyncQueryBackedLowLevelWriters,
  createDataCorrectionAsyncQueryBackedPersistenceWriters,
  createDataCorrectionQueryBackedLowLevelWriters,
  createDataCorrectionQueryBackedPersistenceWriters,
  executeDataCorrectionPersistenceQueryAsync,
  executeDataCorrectionPersistenceQuerySync,
};
