'use strict';

const DATA_CORRECTION_WRITER_TYPES = Object.freeze({
  APPOINTMENT_RESULT: 'appointment_result',
  AUDIT: 'audit',
  CONTACT_LOG: 'contact_log',
  CORRECTION_APPLICATION: 'correction_application',
  DISPATCH_NOTE: 'dispatch_note',
  ENGINEER_NOTIFICATION_INTENT: 'engineer_notification_intent',
  EVIDENCE: 'evidence',
  FOLLOW_UP_DRAFT: 'follow_up_draft',
});

const SAFE_PAYLOAD_KEYS = Object.freeze([
  'actionType',
  'actorRole',
  'actorUserId',
  'appointmentId',
  'caseId',
  'decision',
  'fieldGroup',
  'fieldKey',
  'organizationId',
  'proposalType',
  'reasonCode',
  'safeMessageKey',
  'terminalState',
  'timestamp',
]);

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function safeString(value) {
  if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
    return undefined;
  }

  const stringValue = String(value).trim();

  return stringValue || undefined;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isSafeRef(value) {
  if (typeof value !== 'string') {
    return false;
  }

  const ref = value.trim();

  return Boolean(ref) && /^[A-Za-z0-9_-]+$/.test(ref);
}

function safeRefs(value) {
  if (value === undefined) {
    return {
      ok: true,
      refs: undefined,
    };
  }

  if (!Array.isArray(value)) {
    return {
      ok: false,
      refs: undefined,
    };
  }

  const refs = [];

  for (const ref of value) {
    if (!isSafeRef(ref)) {
      return {
        ok: false,
        refs: undefined,
      };
    }

    refs.push(ref.trim());
  }

  return {
    ok: true,
    refs,
  };
}

function pickDirectSafeValues(payload) {
  const sanitized = {};

  for (const key of SAFE_PAYLOAD_KEYS) {
    const value = safeString(payload[key]);

    if (value !== undefined) {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

function addNestedSafeValues(sanitized, payload) {
  const actor = isPlainObject(payload.actor) ? payload.actor : {};
  const correction = isPlainObject(payload.correction) ? payload.correction : {};

  if (!sanitized.actorUserId) {
    const actorUserId = safeString(actor.userId);

    if (actorUserId) {
      sanitized.actorUserId = actorUserId;
    }
  }

  if (!sanitized.actorRole) {
    const actorRole = safeString(actor.role);

    if (actorRole) {
      sanitized.actorRole = actorRole;
    }
  }

  if (!sanitized.fieldKey) {
    const fieldKey = safeString(correction.fieldKey);

    if (fieldKey) {
      sanitized.fieldKey = fieldKey;
    }
  }

  if (!sanitized.fieldGroup) {
    const fieldGroup = safeString(correction.fieldGroup);

    if (fieldGroup) {
      sanitized.fieldGroup = fieldGroup;
    }
  }
}

function sanitizeDataCorrectionWriterPayload(payload = {}) {
  if (!isPlainObject(payload)) {
    return {
      ok: false,
      reasonCode: 'UNSAFE_PAYLOAD',
      payload: null,
    };
  }

  const sanitized = pickDirectSafeValues(payload);

  addNestedSafeValues(sanitized, payload);

  const evidenceRefs = safeRefs(payload.evidenceRefs);
  const requiredPartsRefs = safeRefs(payload.requiredPartsRefs);

  if (!evidenceRefs.ok || !requiredPartsRefs.ok) {
    return {
      ok: false,
      reasonCode: 'UNSAFE_PAYLOAD',
      payload: null,
    };
  }

  if (evidenceRefs.refs !== undefined) {
    sanitized.evidenceRefs = evidenceRefs.refs;
  }

  if (requiredPartsRefs.refs !== undefined) {
    sanitized.requiredPartsRefs = requiredPartsRefs.refs;
  }

  return {
    ok: true,
    payload: sanitized,
  };
}

function createInMemoryDataCorrectionWriterStore() {
  const writes = [];

  function list() {
    return clone(writes);
  }

  function add(write) {
    const safeWrite = clone(write);

    writes.push(safeWrite);

    return safeWrite;
  }

  return {
    get writes() {
      return list();
    },
    add,
    list,
  };
}

function createWriter(writerType, store) {
  return function dataCorrectionSafeWriter(payload) {
    const sanitized = sanitizeDataCorrectionWriterPayload(payload);

    if (!sanitized.ok) {
      return {
        ok: false,
        writerType,
        reasonCode: sanitized.reasonCode,
      };
    }

    const id = `data_correction_write_${String(store.list().length + 1).padStart(6, '0')}`;

    store.add({
      id,
      writerType,
      payload: sanitized.payload,
    });

    return {
      ok: true,
      writerType,
      id,
    };
  };
}

function createDataCorrectionSafeWriterSet(options = {}) {
  const store = options.store || createInMemoryDataCorrectionWriterStore();

  return {
    auditWriter: createWriter(DATA_CORRECTION_WRITER_TYPES.AUDIT, store),
    contactLogWriter: createWriter(DATA_CORRECTION_WRITER_TYPES.CONTACT_LOG, store),
    dispatchNoteWriter: createWriter(DATA_CORRECTION_WRITER_TYPES.DISPATCH_NOTE, store),
    engineerNotificationWriter: createWriter(DATA_CORRECTION_WRITER_TYPES.ENGINEER_NOTIFICATION_INTENT, store),
    appointmentResultWriter: createWriter(DATA_CORRECTION_WRITER_TYPES.APPOINTMENT_RESULT, store),
    evidenceWriter: createWriter(DATA_CORRECTION_WRITER_TYPES.EVIDENCE, store),
    followUpDraftWriter: createWriter(DATA_CORRECTION_WRITER_TYPES.FOLLOW_UP_DRAFT, store),
    correctionWriter: createWriter(DATA_CORRECTION_WRITER_TYPES.CORRECTION_APPLICATION, store),
    store,
  };
}

module.exports = {
  DATA_CORRECTION_WRITER_TYPES,
  createDataCorrectionSafeWriterSet,
  createInMemoryDataCorrectionWriterStore,
  sanitizeDataCorrectionWriterPayload,
};
