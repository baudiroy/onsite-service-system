'use strict';

const {
  validateEngineerMobileVisitActionRepositoryInput,
} = require('./engineerMobileVisitActionRepositoryContract');

const ENGINEER_MOBILE_VISIT_ACTION_SQL_REPOSITORY_ADAPTER_KIND = 'engineer_mobile.visit_action_sql_repository_adapter';

const UPDATE_APPOINTMENT_QUERY_NAME = 'engineerMobileVisitActionUpdateAppointment';
const INSERT_AUDIT_QUERY_NAME = 'engineerMobileVisitActionInsertAuditLog';

const UPDATE_APPOINTMENT_SQL = `
UPDATE appointments AS a
SET mobile_visit_status = $3::text,
    visit_result = CASE
      WHEN $3::text = 'visit_result_recorded' THEN $4::text
      ELSE visit_result
    END,
    mobile_visit_status_updated_at = COALESCE($5::timestamptz, now()),
    mobile_visit_status_updated_by = $6::uuid,
    travel_started_at = CASE
      WHEN $3::text = 'traveling' THEN COALESCE($5::timestamptz, now())
      ELSE travel_started_at
    END,
    arrived_at = CASE
      WHEN $3::text = 'arrived' THEN COALESCE($5::timestamptz, now())
      ELSE arrived_at
    END,
    work_started_at = CASE
      WHEN $3::text = 'working' THEN COALESCE($5::timestamptz, now())
      ELSE work_started_at
    END,
    work_finished_at = CASE
      WHEN $3::text = 'work_finished' THEN COALESCE($5::timestamptz, now())
      ELSE work_finished_at
    END
FROM cases AS c
WHERE a.id = $1::uuid
  AND a.case_id = c.id
  AND c.organization_id = $2::uuid
  AND a.deleted_at IS NULL
  AND c.deleted_at IS NULL
RETURNING a.id AS appointment_id
`.trim();

const INSERT_AUDIT_SQL = `
INSERT INTO audit_logs (
  actor_type,
  actor_id,
  action,
  entity_type,
  entity_id,
  metadata,
  created_at
)
VALUES (
  'engineer',
  $1::uuid,
  $2::text,
  'appointment',
  $3::uuid,
  jsonb_strip_nulls(jsonb_build_object(
    'organizationId', $4::text,
    'caseId', $5::text,
    'appointmentId', $6::text,
    'requestId', $7::text
  )),
  COALESCE($8::timestamptz, now())
)
RETURNING id
`.trim();

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isPromiseLike(value) {
  return Boolean(value) && typeof value.then === 'function';
}

function stringValue(value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return undefined;
}

function compactRecord(record) {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined),
  );
}

function freezeQuerySpec(spec) {
  Object.freeze(spec.values);

  return Object.freeze(spec);
}

function failure(reasonCode, validation) {
  return compactRecord({
    ok: false,
    persisted: false,
    adapterKind: ENGINEER_MOBILE_VISIT_ACTION_SQL_REPOSITORY_ADAPTER_KIND,
    reasonCode,
    validationReasonCode: validation && validation.reasonCode,
  });
}

function success({ auditRecorded }) {
  return compactRecord({
    ok: true,
    persisted: true,
    written: true,
    transitionPersisted: true,
    auditRecorded: auditRecorded === true,
    adapterKind: ENGINEER_MOBILE_VISIT_ACTION_SQL_REPOSITORY_ADAPTER_KIND,
    reasonCode: 'repository_write_succeeded',
  });
}

function buildAppointmentUpdateSpec(transitionPatch) {
  return freezeQuerySpec({
    name: UPDATE_APPOINTMENT_QUERY_NAME,
    text: UPDATE_APPOINTMENT_SQL,
    values: [
      transitionPatch.entityId,
      transitionPatch.organizationId,
      transitionPatch.mobileVisitStatus,
      transitionPatch.visitResult || null,
      transitionPatch.updatedAt || null,
      transitionPatch.updatedBy,
    ],
  });
}

function auditMetadataFrom(input, transitionPatch) {
  const source = isObject(input) ? input : {};
  const transitionEnvelope = isObject(source.transitionPatchEnvelope)
    ? source.transitionPatchEnvelope
    : {};
  const auditContext = isObject(transitionEnvelope.auditContext)
    ? transitionEnvelope.auditContext
    : {};
  const auditEnvelope = isObject(source.auditEventEnvelope) ? source.auditEventEnvelope : {};
  const auditEvent = isObject(auditEnvelope.auditEvent) ? auditEnvelope.auditEvent : {};

  return compactRecord({
    caseId: stringValue(auditContext.caseId) || stringValue(auditEvent.caseId),
    appointmentId: transitionPatch.entityId,
    requestId: stringValue(auditContext.requestId) || stringValue(auditEvent.requestId),
  });
}

function buildAuditInsertSpec(auditEvent, metadata) {
  if (!isObject(auditEvent)) {
    return undefined;
  }

  return freezeQuerySpec({
    name: INSERT_AUDIT_QUERY_NAME,
    text: INSERT_AUDIT_SQL,
    values: [
      auditEvent.actorId,
      auditEvent.action,
      auditEvent.entityId,
      auditEvent.organizationId,
      metadata.caseId || null,
      metadata.appointmentId || auditEvent.entityId,
      metadata.requestId || null,
      auditEvent.occurredAt || null,
    ],
  });
}

function resolveQueryExecutor(dbClient) {
  if (!isObject(dbClient)) {
    return undefined;
  }

  if (typeof dbClient.query === 'function') {
    return dbClient.query.bind(dbClient);
  }

  if (typeof dbClient.execute === 'function') {
    return dbClient.execute.bind(dbClient);
  }

  return undefined;
}

function resolveTransactionRunner(dbClient) {
  if (!isObject(dbClient)) {
    return undefined;
  }

  if (typeof dbClient.transaction === 'function') {
    return dbClient.transaction.bind(dbClient);
  }

  if (typeof dbClient.withTransaction === 'function') {
    return dbClient.withTransaction.bind(dbClient);
  }

  return undefined;
}

function queryResultFailed(result) {
  return isObject(result) && (
    result.ok === false
    || result.success === false
    || result.persisted === false
    || result.written === false
    || result.error !== undefined
  );
}

function rowCountFrom(result) {
  if (Array.isArray(result)) {
    return result.length;
  }

  if (!isObject(result)) {
    return undefined;
  }

  if (Number.isInteger(result.rowCount)) {
    return result.rowCount;
  }

  if (Array.isArray(result.rows)) {
    return result.rows.length;
  }

  return undefined;
}

function hasQuerySuccess(result) {
  if (result === undefined || result === null || result === true) {
    return true;
  }

  if (result === false || queryResultFailed(result)) {
    return false;
  }

  if (Array.isArray(result)) {
    return true;
  }

  return isObject(result);
}

function executeQuery(dbClient, querySpec) {
  const query = resolveQueryExecutor(dbClient);

  if (typeof query !== 'function') {
    throw new Error('query_executor_required');
  }

  return query(querySpec);
}

function normalizeAppointmentUpdateResult(result, validation) {
  if (!hasQuerySuccess(result)) {
    return failure('repository_write_failed', validation);
  }

  const rowCount = rowCountFrom(result);

  if (rowCount === 0) {
    return failure('appointment_not_found_or_denied', validation);
  }

  return undefined;
}

function normalizeAuditInsertResult(result, validation) {
  if (!hasQuerySuccess(result)) {
    return failure('audit_write_failed', validation);
  }

  const rowCount = rowCountFrom(result);

  if (rowCount === 0) {
    return failure('audit_write_failed', validation);
  }

  return undefined;
}

function persistWithClient(client, input, validation) {
  const updateSpec = buildAppointmentUpdateSpec(validation.transitionPatch);
  const auditSpec = buildAuditInsertSpec(
    validation.auditEvent,
    auditMetadataFrom(input, validation.transitionPatch),
  );
  const updateResult = executeQuery(client, updateSpec);
  const continueAfterUpdate = (resolvedUpdateResult) => {
    const updateFailure = normalizeAppointmentUpdateResult(resolvedUpdateResult, validation);

    if (updateFailure) {
      return updateFailure;
    }

    if (!auditSpec) {
      return success({ auditRecorded: false });
    }

    const auditResult = executeQuery(client, auditSpec);
    const continueAfterAudit = (resolvedAuditResult) => {
      const auditFailure = normalizeAuditInsertResult(resolvedAuditResult, validation);

      return auditFailure || success({ auditRecorded: true });
    };

    return isPromiseLike(auditResult)
      ? auditResult.then(continueAfterAudit)
      : continueAfterAudit(auditResult);
  };

  return isPromiseLike(updateResult)
    ? updateResult.then(continueAfterUpdate)
    : continueAfterUpdate(updateResult);
}

function runPersistence(dbClient, input, validation) {
  const transaction = resolveTransactionRunner(dbClient);

  if (typeof transaction === 'function') {
    return transaction((transactionClient) => persistWithClient(
      transactionClient || dbClient,
      input,
      validation,
    ));
  }

  return persistWithClient(dbClient, input, validation);
}

function createEngineerMobileVisitActionSqlRepositoryAdapter(options = {}) {
  const source = isObject(options) ? options : {};
  const dbClient = source.dbClient;

  return {
    kind: ENGINEER_MOBILE_VISIT_ACTION_SQL_REPOSITORY_ADAPTER_KIND,

    persist(input = {}) {
      if (!resolveQueryExecutor(dbClient)) {
        return failure('db_client_required');
      }

      const validation = validateEngineerMobileVisitActionRepositoryInput(input);

      if (!isObject(validation) || validation.ok !== true) {
        return failure(validation && validation.reasonCode
          ? validation.reasonCode
          : 'repository_write_failed', validation);
      }

      try {
        const result = runPersistence(dbClient, input, validation);

        return isPromiseLike(result)
          ? result.catch(() => failure('repository_write_failed', validation))
          : result;
      } catch (caught) {
        return failure('repository_write_failed', validation);
      }
    },
  };
}

module.exports = {
  ENGINEER_MOBILE_VISIT_ACTION_SQL_REPOSITORY_ADAPTER_KIND,
  createEngineerMobileVisitActionSqlRepositoryAdapter,
};
