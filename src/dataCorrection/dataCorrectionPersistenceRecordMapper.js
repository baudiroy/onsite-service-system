'use strict';

const {
  DATA_CORRECTION_WRITER_TYPES,
  sanitizeDataCorrectionWriterPayload,
} = require('./dataCorrectionSafeWriters');

const DATA_CORRECTION_PERSISTENCE_RECORD_TYPES = Object.freeze({
  ...DATA_CORRECTION_WRITER_TYPES,
});

const TABLE_HINTS = Object.freeze({
  [DATA_CORRECTION_PERSISTENCE_RECORD_TYPES.APPOINTMENT_RESULT]: 'data_correction_appointment_results',
  [DATA_CORRECTION_PERSISTENCE_RECORD_TYPES.AUDIT]: 'data_correction_audit_events',
  [DATA_CORRECTION_PERSISTENCE_RECORD_TYPES.CONTACT_LOG]: 'data_correction_contact_logs',
  [DATA_CORRECTION_PERSISTENCE_RECORD_TYPES.CORRECTION_APPLICATION]: 'data_correction_application_records',
  [DATA_CORRECTION_PERSISTENCE_RECORD_TYPES.DISPATCH_NOTE]: 'data_correction_dispatch_notes',
  [DATA_CORRECTION_PERSISTENCE_RECORD_TYPES.ENGINEER_NOTIFICATION_INTENT]: 'data_correction_engineer_notification_intents',
  [DATA_CORRECTION_PERSISTENCE_RECORD_TYPES.EVIDENCE]: 'data_correction_evidence_refs',
  [DATA_CORRECTION_PERSISTENCE_RECORD_TYPES.FOLLOW_UP_DRAFT]: 'data_correction_follow_up_drafts',
});

const APPOINTMENT_REQUIRED_TYPES = new Set([
  DATA_CORRECTION_PERSISTENCE_RECORD_TYPES.APPOINTMENT_RESULT,
  DATA_CORRECTION_PERSISTENCE_RECORD_TYPES.CONTACT_LOG,
  DATA_CORRECTION_PERSISTENCE_RECORD_TYPES.CORRECTION_APPLICATION,
  DATA_CORRECTION_PERSISTENCE_RECORD_TYPES.DISPATCH_NOTE,
  DATA_CORRECTION_PERSISTENCE_RECORD_TYPES.ENGINEER_NOTIFICATION_INTENT,
  DATA_CORRECTION_PERSISTENCE_RECORD_TYPES.EVIDENCE,
  DATA_CORRECTION_PERSISTENCE_RECORD_TYPES.FOLLOW_UP_DRAFT,
]);

const DATA_CORRECTION_PERSISTENCE_TABLE_HINTS = Object.freeze({
  ...TABLE_HINTS,
});

const DATA_CORRECTION_APPOINTMENT_REQUIRED_RECORD_TYPES = Object.freeze([
  ...APPOINTMENT_REQUIRED_TYPES,
]);

const DATA_CORRECTION_PERSISTENCE_QUERY_NAME = 'dataCorrectionPersistenceInsert';

const DATA_CORRECTION_PERSISTENCE_FIELDS = Object.freeze({
  actionType: 'action_type',
  actorRole: 'actor_role',
  actorUserId: 'actor_user_id',
  appointmentId: 'appointment_id',
  caseId: 'case_id',
  decision: 'decision',
  occurredAt: 'occurred_at',
  organizationId: 'organization_id',
  reasonCode: 'reason_code',
  recordType: 'record_type',
  safeMessageKey: 'safe_message_key',
  safeMetadata: 'safe_metadata',
});

const RECORD_FIELD_ORDER = Object.freeze([
  'organizationId',
  'caseId',
  'appointmentId',
  'actorUserId',
  'actorRole',
  'actionType',
  'decision',
  'reasonCode',
  'safeMessageKey',
  'occurredAt',
  'recordType',
  'safeMetadata',
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

function isSupportedRecordType(recordType) {
  return Object.values(DATA_CORRECTION_PERSISTENCE_RECORD_TYPES).includes(recordType);
}

function fail(recordType, reasonCode) {
  return {
    ok: false,
    recordType: isSupportedRecordType(recordType) ? recordType : 'unknown',
    reasonCode,
  };
}

function buildSafeMetadata(payload) {
  const metadata = {};

  for (const key of [
    'fieldKey',
    'fieldGroup',
    'terminalState',
    'proposalType',
  ]) {
    const value = safeString(payload[key]);

    if (value) {
      metadata[key] = value;
    }
  }

  if (Array.isArray(payload.evidenceRefs)) {
    metadata.evidenceRefs = clone(payload.evidenceRefs);
  }

  if (Array.isArray(payload.requiredPartsRefs)) {
    metadata.requiredPartsRefs = clone(payload.requiredPartsRefs);
  }

  return metadata;
}

function buildRecord(recordType, payload) {
  const record = {
    organizationId: payload.organizationId,
    caseId: payload.caseId,
    appointmentId: payload.appointmentId,
    actorUserId: payload.actorUserId,
    actorRole: payload.actorRole,
    actionType: payload.actionType,
    decision: payload.decision,
    reasonCode: payload.reasonCode,
    safeMessageKey: payload.safeMessageKey,
    occurredAt: payload.timestamp,
    recordType,
    safeMetadata: buildSafeMetadata(payload),
  };

  for (const key of Object.keys(record)) {
    if (record[key] === undefined) {
      delete record[key];
    }
  }

  if (!Object.keys(record.safeMetadata).length) {
    delete record.safeMetadata;
  }

  return record;
}

function validateRecord(recordType, payload) {
  if (!payload.organizationId) {
    return 'MISSING_ORGANIZATION_ID';
  }

  if (!payload.caseId) {
    return 'MISSING_CASE_ID';
  }

  if (APPOINTMENT_REQUIRED_TYPES.has(recordType) && !payload.appointmentId) {
    return 'MISSING_APPOINTMENT_ID';
  }

  return null;
}

function mapDataCorrectionWriterPayloadToRecord(input = {}) {
  const request = isPlainObject(input) ? input : {};
  const recordType = safeString(request.writerType);

  if (!isSupportedRecordType(recordType)) {
    return fail(recordType, 'UNSUPPORTED_RECORD_TYPE');
  }

  const payload = request.payload || {};
  const normalizedPayload = isPlainObject(payload)
    ? {
      ...payload,
      appointmentId: payload.appointmentId === undefined
        ? payload.sourceAppointmentId
        : payload.appointmentId,
    }
    : payload;
  const sanitized = sanitizeDataCorrectionWriterPayload(normalizedPayload);

  if (!sanitized.ok) {
    return fail(recordType, 'UNSAFE_OR_INVALID_PAYLOAD');
  }

  const validationError = validateRecord(recordType, sanitized.payload);

  if (validationError) {
    return fail(recordType, validationError);
  }

  return {
    ok: true,
    recordType,
    tableHint: TABLE_HINTS[recordType],
    record: buildRecord(recordType, sanitized.payload),
  };
}

function orderedRecordKeys(record) {
  return RECORD_FIELD_ORDER.filter((field) => Object.prototype.hasOwnProperty.call(record, field));
}

function buildDataCorrectionPersistenceQuerySpec(input = {}) {
  const mapped = mapDataCorrectionWriterPayloadToRecord(input);

  if (!mapped.ok) {
    return {
      ...mapped,
      executable: false,
    };
  }

  const params = orderedRecordKeys(mapped.record);
  const fields = params.map((param) => DATA_CORRECTION_PERSISTENCE_FIELDS[param]);
  const placeholders = fields.map((field, index) => `$${index + 1}`);

  return {
    ok: true,
    executable: false,
    name: DATA_CORRECTION_PERSISTENCE_QUERY_NAME,
    recordType: mapped.recordType,
    tableHint: mapped.tableHint,
    fields,
    values: params.map((param) => mapped.record[param]),
    sql: `INSERT INTO ${mapped.tableHint} (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`,
    params,
  };
}

module.exports = {
  DATA_CORRECTION_APPOINTMENT_REQUIRED_RECORD_TYPES,
  DATA_CORRECTION_PERSISTENCE_FIELDS,
  DATA_CORRECTION_PERSISTENCE_QUERY_NAME,
  DATA_CORRECTION_PERSISTENCE_RECORD_TYPES,
  DATA_CORRECTION_PERSISTENCE_TABLE_HINTS,
  buildDataCorrectionPersistenceQuerySpec,
  mapDataCorrectionWriterPayloadToRecord,
};
