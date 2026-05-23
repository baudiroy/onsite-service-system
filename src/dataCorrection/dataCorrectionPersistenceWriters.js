'use strict';

const {
  DATA_CORRECTION_WRITER_TYPES,
  sanitizeDataCorrectionWriterPayload,
} = require('./dataCorrectionSafeWriters');

const DATA_CORRECTION_PERSISTENCE_WRITER_TYPES = Object.freeze({
  ...DATA_CORRECTION_WRITER_TYPES,
});

const LOW_LEVEL_WRITER_KEYS = Object.freeze({
  [DATA_CORRECTION_PERSISTENCE_WRITER_TYPES.APPOINTMENT_RESULT]: 'appointmentResultPersistenceWriter',
  [DATA_CORRECTION_PERSISTENCE_WRITER_TYPES.AUDIT]: 'auditPersistenceWriter',
  [DATA_CORRECTION_PERSISTENCE_WRITER_TYPES.CONTACT_LOG]: 'contactLogPersistenceWriter',
  [DATA_CORRECTION_PERSISTENCE_WRITER_TYPES.CORRECTION_APPLICATION]: 'correctionApplicationPersistenceWriter',
  [DATA_CORRECTION_PERSISTENCE_WRITER_TYPES.DISPATCH_NOTE]: 'dispatchNotePersistenceWriter',
  [DATA_CORRECTION_PERSISTENCE_WRITER_TYPES.ENGINEER_NOTIFICATION_INTENT]: 'engineerNotificationIntentPersistenceWriter',
  [DATA_CORRECTION_PERSISTENCE_WRITER_TYPES.EVIDENCE]: 'evidencePersistenceWriter',
  [DATA_CORRECTION_PERSISTENCE_WRITER_TYPES.FOLLOW_UP_DRAFT]: 'followUpDraftPersistenceWriter',
});

const DATA_CORRECTION_PERSISTENCE_LOW_LEVEL_WRITER_KEYS = Object.freeze({
  ...LOW_LEVEL_WRITER_KEYS,
});

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function resolveWrite(writer) {
  if (typeof writer === 'function') {
    return writer;
  }

  if (isPlainObject(writer) && typeof writer.write === 'function') {
    return writer.write.bind(writer);
  }

  return null;
}

function fail(writerType, reasonCode) {
  return {
    ok: false,
    writerType,
    persisted: false,
    reasonCode,
  };
}

function success(writerType) {
  return {
    ok: true,
    writerType,
    persisted: true,
  };
}

function createDataCorrectionPersistenceWriterContract(options = {}) {
  const writerType = options.writerType;
  const write = resolveWrite(options.writer);

  return function dataCorrectionPersistenceWriter(payload) {
    if (!DATA_CORRECTION_PERSISTENCE_WRITER_TYPES || !Object.values(DATA_CORRECTION_PERSISTENCE_WRITER_TYPES).includes(writerType)) {
      return fail(writerType || 'unknown', 'WRITER_TYPE_NOT_SUPPORTED');
    }

    if (!write) {
      return fail(writerType, 'WRITER_NOT_CONFIGURED');
    }

    const sanitized = sanitizeDataCorrectionWriterPayload(payload);

    if (!sanitized.ok) {
      return fail(writerType, sanitized.reasonCode || 'UNSAFE_PAYLOAD');
    }

    try {
      write(sanitized.payload);
    } catch (error) {
      return fail(writerType, 'WRITER_FAILED');
    }

    return success(writerType);
  };
}

function createDataCorrectionPersistenceWriterSet(options = {}) {
  return {
    auditWriter: createDataCorrectionPersistenceWriterContract({
      writerType: DATA_CORRECTION_PERSISTENCE_WRITER_TYPES.AUDIT,
      writer: options[LOW_LEVEL_WRITER_KEYS[DATA_CORRECTION_PERSISTENCE_WRITER_TYPES.AUDIT]],
    }),
    contactLogWriter: createDataCorrectionPersistenceWriterContract({
      writerType: DATA_CORRECTION_PERSISTENCE_WRITER_TYPES.CONTACT_LOG,
      writer: options[LOW_LEVEL_WRITER_KEYS[DATA_CORRECTION_PERSISTENCE_WRITER_TYPES.CONTACT_LOG]],
    }),
    dispatchNoteWriter: createDataCorrectionPersistenceWriterContract({
      writerType: DATA_CORRECTION_PERSISTENCE_WRITER_TYPES.DISPATCH_NOTE,
      writer: options[LOW_LEVEL_WRITER_KEYS[DATA_CORRECTION_PERSISTENCE_WRITER_TYPES.DISPATCH_NOTE]],
    }),
    engineerNotificationWriter: createDataCorrectionPersistenceWriterContract({
      writerType: DATA_CORRECTION_PERSISTENCE_WRITER_TYPES.ENGINEER_NOTIFICATION_INTENT,
      writer: options[LOW_LEVEL_WRITER_KEYS[DATA_CORRECTION_PERSISTENCE_WRITER_TYPES.ENGINEER_NOTIFICATION_INTENT]],
    }),
    appointmentResultWriter: createDataCorrectionPersistenceWriterContract({
      writerType: DATA_CORRECTION_PERSISTENCE_WRITER_TYPES.APPOINTMENT_RESULT,
      writer: options[LOW_LEVEL_WRITER_KEYS[DATA_CORRECTION_PERSISTENCE_WRITER_TYPES.APPOINTMENT_RESULT]],
    }),
    evidenceWriter: createDataCorrectionPersistenceWriterContract({
      writerType: DATA_CORRECTION_PERSISTENCE_WRITER_TYPES.EVIDENCE,
      writer: options[LOW_LEVEL_WRITER_KEYS[DATA_CORRECTION_PERSISTENCE_WRITER_TYPES.EVIDENCE]],
    }),
    followUpDraftWriter: createDataCorrectionPersistenceWriterContract({
      writerType: DATA_CORRECTION_PERSISTENCE_WRITER_TYPES.FOLLOW_UP_DRAFT,
      writer: options[LOW_LEVEL_WRITER_KEYS[DATA_CORRECTION_PERSISTENCE_WRITER_TYPES.FOLLOW_UP_DRAFT]],
    }),
    correctionWriter: createDataCorrectionPersistenceWriterContract({
      writerType: DATA_CORRECTION_PERSISTENCE_WRITER_TYPES.CORRECTION_APPLICATION,
      writer: options[LOW_LEVEL_WRITER_KEYS[DATA_CORRECTION_PERSISTENCE_WRITER_TYPES.CORRECTION_APPLICATION]],
    }),
  };
}

module.exports = {
  DATA_CORRECTION_PERSISTENCE_LOW_LEVEL_WRITER_KEYS,
  DATA_CORRECTION_PERSISTENCE_WRITER_TYPES,
  createDataCorrectionPersistenceWriterContract,
  createDataCorrectionPersistenceWriterSet,
};
