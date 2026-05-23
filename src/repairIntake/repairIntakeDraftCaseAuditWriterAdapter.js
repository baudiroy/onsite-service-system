'use strict';

const DEFAULT_TABLE_NAME = 'audit_events';
const AUDIT_EVENT_TYPE = 'repair_intake_draft_to_case_submission';
const SUBJECT_TYPE = 'repair_intake_draft';
const ALLOWED_OUTCOMES = new Set(['submitted', 'blocked', 'failed']);

const FORBIDDEN_INPUT_FIELDS = new Set([
  'address',
  'caseId',
  'case_id',
  'customerPayload',
  'finalAppointmentId',
  'final_appointment_id',
  'fullAddress',
  'lineAccessToken',
  'phone',
  'phoneNumber',
  'providerPayload',
  'rawAddress',
  'rawCustomerPayload',
  'rawImportedRow',
  'rawImportedRowPayload',
  'rawPayload',
  'secret',
  'token',
  'tokenSecret',
]);

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stringValue(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function safeArray(value) {
  return Array.isArray(value)
    ? value.map((item) => stringValue(item)).filter(Boolean)
    : [];
}

function safeTableName(value) {
  const tableName = stringValue(value) || DEFAULT_TABLE_NAME;

  return /^[a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)?$/.test(tableName) ? tableName : null;
}

function blocked({
  auditEventId = null,
  eventType = null,
  organizationId = null,
  subjectId = null,
  reasonCode,
  requiredActions,
}) {
  return {
    ok: false,
    auditEventId,
    eventType,
    organizationId,
    subjectId,
    status: 'blocked',
    reasonCode,
    requiredActions,
  };
}

function failed({
  auditEventId = null,
  eventType = null,
  organizationId = null,
  subjectId = null,
  reasonCode,
  requiredActions,
}) {
  return {
    ok: false,
    auditEventId,
    eventType,
    organizationId,
    subjectId,
    status: 'failed',
    reasonCode,
    requiredActions,
  };
}

function recorded({ auditEventId, eventType, organizationId, subjectId }) {
  return {
    ok: true,
    auditEventId,
    eventType,
    organizationId,
    subjectId,
    status: 'recorded',
    reasonCode: 'REPAIR_INTAKE_DRAFT_CASE_AUDIT_RECORDED',
    requiredActions: [],
  };
}

function hasForbiddenInputField(value) {
  if (Array.isArray(value)) {
    return value.some((item) => hasForbiddenInputField(item));
  }

  if (!isObject(value)) {
    return false;
  }

  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_INPUT_FIELDS.has(key) || hasForbiddenInputField(child)) {
      return true;
    }
  }

  return false;
}

function inputAuditEvent(input) {
  return isObject(input.auditEvent) ? input.auditEvent : input;
}

function sanitizeCaseRef(value) {
  if (!isObject(value)) {
    return null;
  }

  const id = stringValue(value.id);

  return id ? { id } : null;
}

function sanitizeAuditEvent(auditEvent) {
  if (!isObject(auditEvent)) {
    return null;
  }

  const eventType = stringValue(auditEvent.eventType);
  const outcome = stringValue(auditEvent.outcome);
  const draftId = stringValue(auditEvent.draftId);
  const organizationId = stringValue(auditEvent.organizationId);
  const actorId = stringValue(auditEvent.actorId);

  return {
    eventType,
    outcome,
    draftId,
    organizationId,
    actorId,
    requestId: stringValue(auditEvent.requestId) || null,
    idempotencyKey: stringValue(auditEvent.idempotencyKey) || null,
    caseRef: sanitizeCaseRef(auditEvent.caseRef),
    reasonCode: stringValue(auditEvent.reasonCode) || null,
    requiredActions: safeArray(auditEvent.requiredActions),
  };
}

function normalizeInput(input) {
  if (!isObject(input)) {
    return blocked({
      reasonCode: 'REPAIR_INTAKE_DRAFT_CASE_AUDIT_INPUT_MISSING',
      requiredActions: ['provide_audit_event'],
    });
  }

  if (hasForbiddenInputField(input)) {
    return blocked({
      reasonCode: 'REPAIR_INTAKE_DRAFT_CASE_AUDIT_UNSAFE_INPUT',
      requiredActions: ['provide_sanitized_audit_event'],
    });
  }

  const auditEvent = sanitizeAuditEvent(inputAuditEvent(input));

  if (!auditEvent) {
    return blocked({
      reasonCode: 'REPAIR_INTAKE_DRAFT_CASE_AUDIT_EVENT_MISSING',
      requiredActions: ['provide_audit_event'],
    });
  }

  if (auditEvent.eventType !== AUDIT_EVENT_TYPE) {
    return blocked({
      eventType: auditEvent.eventType || null,
      organizationId: auditEvent.organizationId || null,
      subjectId: auditEvent.draftId || null,
      reasonCode: 'REPAIR_INTAKE_DRAFT_CASE_AUDIT_EVENT_TYPE_INVALID',
      requiredActions: ['provide_supported_audit_event_type'],
    });
  }

  if (!ALLOWED_OUTCOMES.has(auditEvent.outcome)) {
    return blocked({
      eventType: auditEvent.eventType,
      organizationId: auditEvent.organizationId || null,
      subjectId: auditEvent.draftId || null,
      reasonCode: 'REPAIR_INTAKE_DRAFT_CASE_AUDIT_OUTCOME_INVALID',
      requiredActions: ['provide_supported_audit_outcome'],
    });
  }

  if (!auditEvent.draftId) {
    return blocked({
      eventType: auditEvent.eventType,
      organizationId: auditEvent.organizationId || null,
      reasonCode: 'REPAIR_INTAKE_DRAFT_CASE_AUDIT_DRAFT_ID_MISSING',
      requiredActions: ['provide_draft_id'],
    });
  }

  if (!auditEvent.organizationId) {
    return blocked({
      eventType: auditEvent.eventType,
      subjectId: auditEvent.draftId,
      reasonCode: 'REPAIR_INTAKE_DRAFT_CASE_AUDIT_ORGANIZATION_MISSING',
      requiredActions: ['provide_organization_scope'],
    });
  }

  if (!auditEvent.actorId) {
    return blocked({
      eventType: auditEvent.eventType,
      organizationId: auditEvent.organizationId,
      subjectId: auditEvent.draftId,
      reasonCode: 'REPAIR_INTAKE_DRAFT_CASE_AUDIT_ACTOR_MISSING',
      requiredActions: ['provide_actor_id'],
    });
  }

  return {
    ok: true,
    auditEvent,
    tx: isObject(input.tx) ? input.tx : null,
  };
}

function resolveClock(clock) {
  if (typeof clock === 'function') {
    return clock;
  }

  if (isObject(clock) && typeof clock.now === 'function') {
    return clock.now.bind(clock);
  }

  return undefined;
}

function timestamp(clock) {
  if (!clock) {
    return null;
  }

  let value;

  try {
    value = clock();
  } catch (error) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return stringValue(value) || null;
}

function resolveIdGenerator(idGenerator) {
  if (typeof idGenerator === 'function') {
    return idGenerator;
  }

  if (isObject(idGenerator) && typeof idGenerator.generate === 'function') {
    return idGenerator.generate.bind(idGenerator);
  }

  if (isObject(idGenerator) && typeof idGenerator.next === 'function') {
    return idGenerator.next.bind(idGenerator);
  }

  return undefined;
}

function payloadFor({ id, auditEvent, createdAt }) {
  return {
    id,
    event_type: auditEvent.eventType,
    outcome: auditEvent.outcome,
    organization_id: auditEvent.organizationId,
    actor_id: auditEvent.actorId,
    request_id: auditEvent.requestId,
    idempotency_key: auditEvent.idempotencyKey,
    subject_type: SUBJECT_TYPE,
    subject_id: auditEvent.draftId,
    related_case_id: auditEvent.caseRef ? auditEvent.caseRef.id : null,
    reason_code: auditEvent.reasonCode,
    required_actions: auditEvent.requiredActions,
    created_at: createdAt,
  };
}

function queryText(tableName) {
  return [
    `insert into ${tableName} (`,
    'id, event_type, outcome, organization_id, actor_id, request_id, idempotency_key,',
    'subject_type, subject_id, related_case_id, reason_code, required_actions, created_at',
    ') values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)',
  ].join(' ');
}

function queryValues(payload) {
  return [
    payload.id,
    payload.event_type,
    payload.outcome,
    payload.organization_id,
    payload.actor_id,
    payload.request_id,
    payload.idempotency_key,
    payload.subject_type,
    payload.subject_id,
    payload.related_case_id,
    payload.reason_code,
    payload.required_actions,
    payload.created_at,
  ];
}

function dbClientFor(input, baseClient) {
  return input.tx || baseClient;
}

async function recordWithClient({ client, tableName, payload }) {
  if (!isObject(client)) {
    return failed({
      auditEventId: payload.id,
      eventType: payload.event_type,
      organizationId: payload.organization_id,
      subjectId: payload.subject_id,
      reasonCode: 'REPAIR_INTAKE_DRAFT_CASE_AUDIT_DB_CLIENT_NOT_CONFIGURED',
      requiredActions: ['configure_db_client'],
    });
  }

  try {
    let result;

    if (typeof client.insert === 'function') {
      result = await client.insert(tableName, payload);
    } else if (typeof client.query === 'function') {
      result = await client.query(queryText(tableName), queryValues(payload));
    } else if (typeof client.execute === 'function') {
      result = await client.execute(queryText(tableName), queryValues(payload));
    } else {
      return failed({
        auditEventId: payload.id,
        eventType: payload.event_type,
        organizationId: payload.organization_id,
        subjectId: payload.subject_id,
        reasonCode: 'REPAIR_INTAKE_DRAFT_CASE_AUDIT_DB_CLIENT_UNSUPPORTED',
        requiredActions: ['configure_db_client'],
      });
    }

    if (isObject(result) && result.ok === false) {
      return failed({
        auditEventId: payload.id,
        eventType: payload.event_type,
        organizationId: payload.organization_id,
        subjectId: payload.subject_id,
        reasonCode: 'REPAIR_INTAKE_DRAFT_CASE_AUDIT_WRITE_FAILED',
        requiredActions: ['retry_or_manual_review'],
      });
    }

    return recorded({
      auditEventId: payload.id,
      eventType: payload.event_type,
      organizationId: payload.organization_id,
      subjectId: payload.subject_id,
    });
  } catch (error) {
    return failed({
      auditEventId: payload.id,
      eventType: payload.event_type,
      organizationId: payload.organization_id,
      subjectId: payload.subject_id,
      reasonCode: 'REPAIR_INTAKE_DRAFT_CASE_AUDIT_WRITE_FAILED',
      requiredActions: ['retry_or_manual_review'],
    });
  }
}

function createRepairIntakeDraftCaseAuditWriterAdapter(options = {}) {
  const safeOptions = isObject(options) ? options : {};
  const dbClient = isObject(safeOptions.dbClient) ? safeOptions.dbClient : null;
  const tableName = safeTableName(safeOptions.tableName);
  const now = resolveClock(safeOptions.clock);
  const generateId = resolveIdGenerator(safeOptions.idGenerator);

  async function recordRepairIntakeDraftToCaseCreated(input = {}) {
    const normalizedInput = normalizeInput(input);

    if (!isObject(normalizedInput) || normalizedInput.ok !== true) {
      return normalizedInput;
    }

    const { auditEvent } = normalizedInput;

    if (!dbClient) {
      return failed({
        eventType: auditEvent.eventType,
        organizationId: auditEvent.organizationId,
        subjectId: auditEvent.draftId,
        reasonCode: 'REPAIR_INTAKE_DRAFT_CASE_AUDIT_DB_CLIENT_NOT_CONFIGURED',
        requiredActions: ['configure_db_client'],
      });
    }

    if (!tableName) {
      return failed({
        eventType: auditEvent.eventType,
        organizationId: auditEvent.organizationId,
        subjectId: auditEvent.draftId,
        reasonCode: 'REPAIR_INTAKE_DRAFT_CASE_AUDIT_TABLE_NAME_INVALID',
        requiredActions: ['configure_repository_table'],
      });
    }

    if (!generateId) {
      return failed({
        eventType: auditEvent.eventType,
        organizationId: auditEvent.organizationId,
        subjectId: auditEvent.draftId,
        reasonCode: 'REPAIR_INTAKE_DRAFT_CASE_AUDIT_ID_GENERATOR_NOT_CONFIGURED',
        requiredActions: ['configure_id_generator'],
      });
    }

    let id;

    try {
      id = stringValue(await generateId({
        eventType: auditEvent.eventType,
        organizationId: auditEvent.organizationId,
        subjectId: auditEvent.draftId,
      }));
    } catch (error) {
      return failed({
        eventType: auditEvent.eventType,
        organizationId: auditEvent.organizationId,
        subjectId: auditEvent.draftId,
        reasonCode: 'REPAIR_INTAKE_DRAFT_CASE_AUDIT_ID_GENERATION_FAILED',
        requiredActions: ['retry_or_manual_review'],
      });
    }

    if (!id) {
      return blocked({
        eventType: auditEvent.eventType,
        organizationId: auditEvent.organizationId,
        subjectId: auditEvent.draftId,
        reasonCode: 'REPAIR_INTAKE_DRAFT_CASE_AUDIT_ID_MISSING',
        requiredActions: ['provide_audit_event_id_generator'],
      });
    }

    return recordWithClient({
      client: dbClientFor(normalizedInput, dbClient),
      tableName,
      payload: payloadFor({
        id,
        auditEvent,
        createdAt: timestamp(now),
      }),
    });
  }

  return {
    recordRepairIntakeDraftToCaseCreated,
    record: recordRepairIntakeDraftToCaseCreated,
  };
}

module.exports = {
  createRepairIntakeDraftCaseAuditWriterAdapter,
};
