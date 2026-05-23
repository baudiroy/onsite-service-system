'use strict';

const {
  DATA_CORRECTION_QUERY_BACKED_HIGH_LEVEL_WRITER_KEYS,
  createDataCorrectionAsyncQueryBackedPersistenceWriters,
  createDataCorrectionQueryBackedPersistenceWriters,
} = require('./dataCorrectionQueryBackedPersistenceWriters');

const DATA_CORRECTION_PERSISTENCE_REPOSITORY_WRITER_KEYS = Object.freeze([
  ...DATA_CORRECTION_QUERY_BACKED_HIGH_LEVEL_WRITER_KEYS,
]);

const METHOD_TO_WRITER_KEY = Object.freeze({
  writeAppointmentResult: 'appointmentResultWriter',
  writeAudit: 'auditWriter',
  writeContactLog: 'contactLogWriter',
  writeCorrectionApplication: 'correctionWriter',
  writeDispatchNote: 'dispatchNoteWriter',
  writeEngineerNotificationIntent: 'engineerNotificationWriter',
  writeEvidence: 'evidenceWriter',
  writeFollowUpDraft: 'followUpDraftWriter',
});

const DATA_CORRECTION_PERSISTENCE_REPOSITORY_METHOD_TO_WRITER_KEY = Object.freeze({
  ...METHOD_TO_WRITER_KEY,
});

const DATA_CORRECTION_PERSISTENCE_REPOSITORY_WRITE_METHODS = Object.freeze(
  Object.keys(METHOD_TO_WRITER_KEY),
);

const DATA_CORRECTION_PERSISTENCE_REPOSITORY_READ_METHODS = Object.freeze([
  'getWriterSet',
]);

const DATA_CORRECTION_PERSISTENCE_REPOSITORY_METHODS = Object.freeze([
  ...DATA_CORRECTION_PERSISTENCE_REPOSITORY_READ_METHODS,
  ...DATA_CORRECTION_PERSISTENCE_REPOSITORY_WRITE_METHODS,
]);

const DATA_CORRECTION_PERSISTENCE_REPOSITORY_MODE_FLAGS = Object.freeze({
  ASYNC_WRITERS: 'asyncWriters',
  USE_ASYNC_WRITERS: 'useAsyncWriters',
});

function createRepositoryMethod(writerSet, methodName) {
  const writerKey = METHOD_TO_WRITER_KEY[methodName];

  return function dataCorrectionPersistenceRepositoryMethod(payload) {
    return writerSet[writerKey](payload);
  };
}

function createDataCorrectionPersistenceRepository(options = {}) {
  const writerSet = options[DATA_CORRECTION_PERSISTENCE_REPOSITORY_MODE_FLAGS.ASYNC_WRITERS] === true
    || options[DATA_CORRECTION_PERSISTENCE_REPOSITORY_MODE_FLAGS.USE_ASYNC_WRITERS] === true
    ? createDataCorrectionAsyncQueryBackedPersistenceWriters(options)
    : createDataCorrectionQueryBackedPersistenceWriters(options);
  const repository = {
    getWriterSet() {
      return writerSet;
    },
  };

  for (const methodName of Object.keys(METHOD_TO_WRITER_KEY)) {
    repository[methodName] = createRepositoryMethod(writerSet, methodName);
  }

  return Object.freeze(repository);
}

module.exports = {
  DATA_CORRECTION_PERSISTENCE_REPOSITORY_METHOD_TO_WRITER_KEY,
  DATA_CORRECTION_PERSISTENCE_REPOSITORY_METHODS,
  DATA_CORRECTION_PERSISTENCE_REPOSITORY_MODE_FLAGS,
  DATA_CORRECTION_PERSISTENCE_REPOSITORY_READ_METHODS,
  DATA_CORRECTION_PERSISTENCE_REPOSITORY_WRITE_METHODS,
  DATA_CORRECTION_PERSISTENCE_REPOSITORY_WRITER_KEYS,
  createDataCorrectionPersistenceRepository,
};
