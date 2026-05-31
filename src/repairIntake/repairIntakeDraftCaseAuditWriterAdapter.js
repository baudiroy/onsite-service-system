'use strict';

const DEFAULT_TABLE_NAME = 'repair_intake_audit_events';
const AUDIT_EVENT_TYPES = new Set([
  'repair_intake_draft_to_case_submission',
  'repair_intake_draft_to_case_permission_denied',
]);
const ALLOWED_OUTCOMES = new Set(['submitted', 'blocked', 'failed']);
const DEFAULT_VISIBILITY = 'internal_only';

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

const FORBIDDEN_TEXT_PATTERNS = Object.freeze([
  /\bselect\s+\*/i,
  /drop\s+table/i,
  /insert\s+into/i,
  /update\s+[a-z_]/i,
  /delete\s+from/i,
  /\bdatabase_url\b/i,
  /\bpostgres:\/\//i,
  /stack\s+trace/i,
  /providerPayload/i,
  /token/i,
  /password/i,
  /secret/i,
  /phone/i,
  /address/i,
  /customerPayload/i,
  /lineAccessToken/i,
  /\bLINE access token\b/i,
  /finalAppointmentId/i,
  /\bfield_service_reports\b/i,
  /\bopenai\b/i,
  /\bvector\b/i,
  /\bbilling\b/i,
  /\bsettlement\b/i,
  /\binvoice\b/i,
  /\bpayment\b/i,
]);

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stringValue(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function stringHasUnsafeContent(value) {
  const text = stringValue(value);

  return Boolean(text) && FORBIDDEN_TEXT_PATTERNS.some((pattern) => pattern.test(text));
}

function safeAuditText(value) {
  const text = stringValue(value);

  return text && !stringHasUnsafeContent(text) ? text : undefined;
}

function safeArray(value) {
  return Array.isArray(value)
    ? value.map((item) => safeAuditText(item)).filter(Boolean)
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

  const id = safeAuditText(value.id || value.caseId);
  const ref = safeAuditText(value.caseRef || value.caseNo || value.ref);

  if (!id && !ref) {
    return null;
  }

  return {
    ...(id ? { id } : {}),
    ...(ref ? { ref } : {}),
  };
}

function safeMetadata(auditEvent) {
  return {
    ...(safeAuditText(auditEvent.source) ? { source: safeAuditText(auditEvent.source) } : {}),
    ...(safeAuditText(auditEvent.idempotencyKey) ? { idempotencyKey: safeAuditText(auditEvent.idempotencyKey) } : {}),
    ...(safeArray(auditEvent.requiredActions).length > 0 ? { requiredActions: safeArray(auditEvent.requiredActions) } : {}),
  };
}

function sanitizeAuditEvent(auditEvent) {
  if (!isObject(auditEvent)) {
    return null;
  }

  const eventType = stringValue(auditEvent.eventType);
  const outcome = stringValue(auditEvent.outcome);
  const draftId = safeAuditText(auditEvent.draftId);
  const organizationId = safeAuditText(auditEvent.organizationId);
  const tenantId = safeAuditText(auditEvent.tenantId);
  const actorId = safeAuditText(auditEvent.actorId);
  const actorType = safeAuditText(auditEvent.actorType || auditEvent.actorRole);
  const requestId = safeAuditText(auditEvent.requestId);
  const decision = safeAuditText(auditEvent.decision) || outcome;

  return {
    eventType,
    outcome,
    draftId,
    organizationId,
    tenantId: tenantId || null,
    actorId,
    actorType: actorType || null,
    requestId: requestId || null,
    caseRef: sanitizeCaseRef(auditEvent.caseRef),
    decision: decision || null,
    reasonCode: safeAuditText(auditEvent.reasonCode) || null,
    requiredActions: safeArray(auditEvent.requiredActions),
    safeMetadata: safeMetadata(auditEvent),
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

  if (!AUDIT_EVENT_TYPES.has(auditEvent.eventType)) {
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
    organization_id: auditEvent.organizationId,
    tenant_id: auditEvent.tenantId,
    draft_id: auditEvent.draftId,
    case_id: auditEvent.caseRef ? auditEvent.caseRef.id || null : null,
    case_ref: auditEvent.caseRef ? auditEvent.caseRef.ref || auditEvent.caseRef.id || null : null,
    actor_id: auditEvent.actorId,
    actor_type: auditEvent.actorType,
    request_id: auditEvent.requestId,
    decision: auditEvent.decision,
    outcome: auditEvent.outcome,
    reason_code: auditEvent.reasonCode,
    safe_metadata: auditEvent.safeMetadata,
    visibility: DEFAULT_VISIBILITY,
    occurred_at: createdAt,
  };
}

function queryText(tableName) {
  return [
    `insert into ${tableName} (`,
    'id, organization_id, tenant_id, event_type, draft_id, case_id, case_ref,',
    'actor_id, actor_type, request_id, decision, outcome, reason_code,',
    'safe_metadata, visibility, occurred_at',
    ') values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::jsonb, $15, $16)',
  ].join(' ');
}

function queryValues(payload) {
  return [
    payload.id,
    payload.organization_id,
    payload.tenant_id,
    payload.event_type,
    payload.draft_id,
    payload.case_id,
    payload.case_ref,
    payload.actor_id,
    payload.actor_type,
    payload.request_id,
    payload.decision,
    payload.outcome,
    payload.reason_code,
    JSON.stringify(payload.safe_metadata),
    payload.visibility,
    payload.occurred_at,
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
      subjectId: payload.draft_id,
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
        subjectId: payload.draft_id,
        reasonCode: 'REPAIR_INTAKE_DRAFT_CASE_AUDIT_DB_CLIENT_UNSUPPORTED',
        requiredActions: ['configure_db_client'],
      });
    }

    if (isObject(result) && result.ok === false) {
      return failed({
        auditEventId: payload.id,
        eventType: payload.event_type,
        organizationId: payload.organization_id,
        subjectId: payload.draft_id,
        reasonCode: 'REPAIR_INTAKE_DRAFT_CASE_AUDIT_WRITE_FAILED',
        requiredActions: ['retry_or_manual_review'],
      });
    }

    return recorded({
      auditEventId: payload.id,
      eventType: payload.event_type,
      organizationId: payload.organization_id,
      subjectId: payload.draft_id,
    });
  } catch (error) {
    return failed({
      auditEventId: payload.id,
      eventType: payload.event_type,
      organizationId: payload.organization_id,
      subjectId: payload.draft_id,
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
