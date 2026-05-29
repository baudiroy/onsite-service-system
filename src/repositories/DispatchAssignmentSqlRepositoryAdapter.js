'use strict';

const DISPATCH_ASSIGNMENT_SQL_REPOSITORY_ADAPTER_KIND = 'admin_dispatch.dispatch_assignment_sql_repository_adapter';

const READ_ASSIGNMENT_BY_ID_QUERY_NAME = 'adminDispatchReadAssignmentById';
const READ_ASSIGNMENT_BY_CASE_QUERY_NAME = 'adminDispatchReadAssignmentByCase';
const RECORD_ASSIGNMENT_INTENT_QUERY_NAME = 'adminDispatchRecordAssignmentIntent';

const DISPATCH_ASSIGNMENT_SELECT_COLUMNS = [
  '  da.id AS dispatch_assignment_id,',
  '  da.case_id,',
  '  c.organization_id,',
  '  da.dispatch_unit_id,',
  '  da.assigned_engineer_id,',
  '  da.dispatch_status,',
  '  da.assignment_note,',
  '  da.assigned_at,',
  '  da.assigned_by_user_id,',
  '  da.reassigned_by_user_id,',
  '  da.reassigned_at,',
  '  da.updated_at',
].join('\n');

const READ_ASSIGNMENT_BY_ID_SQL = [
  'SELECT',
  DISPATCH_ASSIGNMENT_SELECT_COLUMNS,
  'FROM dispatch_assignments AS da',
  'JOIN cases AS c ON c.id = da.case_id',
  'WHERE da.id = $1::uuid',
  '  AND c.organization_id = $2::uuid',
  '  AND da.deleted_at IS NULL',
  '  AND c.deleted_at IS NULL',
  'LIMIT 1',
].join('\n');

const READ_ASSIGNMENT_BY_CASE_SQL = [
  'SELECT',
  DISPATCH_ASSIGNMENT_SELECT_COLUMNS,
  'FROM dispatch_assignments AS da',
  'JOIN cases AS c ON c.id = da.case_id',
  'WHERE da.case_id = $1::uuid',
  '  AND c.organization_id = $2::uuid',
  '  AND da.deleted_at IS NULL',
  '  AND c.deleted_at IS NULL',
  'ORDER BY da.created_at DESC',
  'LIMIT 1',
].join('\n');

const RECORD_ASSIGNMENT_INTENT_SQL = [
  'UPDATE dispatch_assignments AS da',
  'SET dispatch_unit_id = COALESCE($3::uuid, da.dispatch_unit_id),',
  '    assigned_engineer_id = COALESCE($4::uuid, da.assigned_engineer_id),',
  '    dispatch_status = COALESCE($5::text, da.dispatch_status),',
  '    assignment_note = COALESCE($6::text, da.assignment_note),',
  '    assigned_at = CASE',
  '      WHEN $4::uuid IS NOT NULL THEN COALESCE($8::timestamptz, now())',
  '      ELSE da.assigned_at',
  '    END,',
  '    reassigned_by_user_id = CASE',
  '      WHEN $3::uuid IS NOT NULL OR $4::uuid IS NOT NULL THEN $7::uuid',
  '      ELSE da.reassigned_by_user_id',
  '    END,',
  '    reassigned_at = CASE',
  '      WHEN $3::uuid IS NOT NULL OR $4::uuid IS NOT NULL THEN COALESCE($8::timestamptz, now())',
  '      ELSE da.reassigned_at',
  '    END,',
  '    updated_by = $7::uuid',
  'FROM cases AS c',
  'WHERE da.id = $1::uuid',
  '  AND da.case_id = c.id',
  '  AND c.organization_id = $2::uuid',
  '  AND da.deleted_at IS NULL',
  '  AND c.deleted_at IS NULL',
  'RETURNING',
  DISPATCH_ASSIGNMENT_SELECT_COLUMNS,
].join('\n');

const ALLOWED_DISPATCH_STATUSES = new Set([
  'pending',
  'assigned',
  'accepted',
  'rejected',
  'cancelled',
  'completed',
]);

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
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

function optionalString(value) {
  if (value === undefined || value === null) {
    return undefined;
  }

  return stringValue(value) || null;
}

function toIso(value) {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value.toISOString() : stringValue(value) || null;
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

function failure(reasonCode, context = {}) {
  return compactRecord({
    ok: false,
    found: false,
    written: false,
    adapterKind: DISPATCH_ASSIGNMENT_SQL_REPOSITORY_ADAPTER_KIND,
    reasonCode,
    requestId: stringValue(context.requestId),
  });
}

function readSuccess(assignment, context = {}) {
  return compactRecord({
    ok: true,
    found: true,
    written: false,
    adapterKind: DISPATCH_ASSIGNMENT_SQL_REPOSITORY_ADAPTER_KIND,
    reasonCode: 'dispatch_assignment_read_succeeded',
    requestId: stringValue(context.requestId),
    assignment,
  });
}

function writeSuccess(assignment, context = {}) {
  return compactRecord({
    ok: true,
    found: true,
    written: true,
    adapterKind: DISPATCH_ASSIGNMENT_SQL_REPOSITORY_ADAPTER_KIND,
    reasonCode: 'dispatch_assignment_intent_recorded',
    requestId: stringValue(context.requestId),
    assignment,
  });
}

function assignmentFromRecord(record) {
  if (!isObject(record)) {
    return undefined;
  }

  return {
    dispatchAssignmentId: stringValue(record.dispatch_assignment_id),
    caseId: stringValue(record.case_id),
    organizationId: stringValue(record.organization_id),
    dispatchUnitId: stringValue(record.dispatch_unit_id),
    assignedEngineerId: stringValue(record.assigned_engineer_id) || null,
    dispatchStatus: stringValue(record.dispatch_status) || null,
    assignmentNote: stringValue(record.assignment_note) || null,
    assignedAt: toIso(record.assigned_at),
    assignedByUserId: stringValue(record.assigned_by_user_id) || null,
    reassignedByUserId: stringValue(record.reassigned_by_user_id) || null,
    reassignedAt: toIso(record.reassigned_at),
    updatedAt: toIso(record.updated_at),
  };
}

function resultRecords(result) {
  if (Array.isArray(result)) {
    return result;
  }

  if (isObject(result) && Array.isArray(result.rows)) {
    return result.rows;
  }

  return [];
}

function resultFailed(result) {
  return isObject(result) && (
    result.ok === false
    || result.success === false
    || result.error !== undefined
  );
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

function executeQuery(dbClient, querySpec) {
  const query = resolveQueryExecutor(dbClient);

  if (typeof query !== 'function') {
    throw new Error('query_executor_required');
  }

  return query(querySpec);
}

function buildReadSpec(validation) {
  if (validation.assignmentId) {
    return freezeQuerySpec({
      name: READ_ASSIGNMENT_BY_ID_QUERY_NAME,
      text: READ_ASSIGNMENT_BY_ID_SQL,
      values: [validation.assignmentId, validation.organizationId],
    });
  }

  return freezeQuerySpec({
    name: READ_ASSIGNMENT_BY_CASE_QUERY_NAME,
    text: READ_ASSIGNMENT_BY_CASE_SQL,
    values: [validation.caseId, validation.organizationId],
  });
}

function buildRecordIntentSpec(validation) {
  return freezeQuerySpec({
    name: RECORD_ASSIGNMENT_INTENT_QUERY_NAME,
    text: RECORD_ASSIGNMENT_INTENT_SQL,
    values: [
      validation.assignmentId,
      validation.organizationId,
      validation.dispatchUnitId || null,
      validation.assignedEngineerId || null,
      validation.dispatchStatus || null,
      validation.assignmentNote === undefined ? null : validation.assignmentNote,
      validation.actorId,
      validation.occurredAt || null,
    ],
  });
}

function validateReadInput(input) {
  const source = isObject(input) ? input : {};
  const organizationId = stringValue(source.organizationId);
  const assignmentId = stringValue(source.assignmentId) || stringValue(source.dispatchAssignmentId);
  const caseId = stringValue(source.caseId);

  if (!organizationId) {
    return { ok: false, reasonCode: 'organization_id_required', requestId: source.requestId };
  }

  if (!assignmentId && !caseId) {
    return { ok: false, reasonCode: 'dispatch_assignment_identifier_required', requestId: source.requestId };
  }

  return {
    ok: true,
    organizationId,
    assignmentId,
    caseId,
    requestId: stringValue(source.requestId),
  };
}

function validateRecordIntentInput(input) {
  const source = isObject(input) ? input : {};
  const assignmentId = stringValue(source.assignmentId) || stringValue(source.dispatchAssignmentId);
  const organizationId = stringValue(source.organizationId);
  const dispatchUnitId = stringValue(source.dispatchUnitId);
  const assignedEngineerId = stringValue(source.assignedEngineerId);
  const dispatchStatus = stringValue(source.dispatchStatus);
  const assignmentNote = optionalString(source.assignmentNote);
  const actorId = stringValue(source.actorId);
  const occurredAt = stringValue(source.occurredAt);
  const requestId = stringValue(source.requestId);

  if (!assignmentId) {
    return { ok: false, reasonCode: 'dispatch_assignment_id_required', requestId };
  }

  if (!organizationId) {
    return { ok: false, reasonCode: 'organization_id_required', requestId };
  }

  if (!actorId) {
    return { ok: false, reasonCode: 'actor_id_required', requestId };
  }

  if (dispatchStatus && !ALLOWED_DISPATCH_STATUSES.has(dispatchStatus)) {
    return { ok: false, reasonCode: 'dispatch_status_unsupported', requestId };
  }

  if (!dispatchUnitId && !assignedEngineerId && !dispatchStatus && assignmentNote === undefined) {
    return { ok: false, reasonCode: 'dispatch_assignment_intent_required', requestId };
  }

  return {
    ok: true,
    assignmentId,
    organizationId,
    dispatchUnitId,
    assignedEngineerId,
    dispatchStatus,
    assignmentNote,
    actorId,
    occurredAt,
    requestId,
  };
}

function normalizeReadResult(result, context) {
  if (resultFailed(result)) {
    return failure('dispatch_assignment_read_failed', context);
  }

  const [record] = resultRecords(result);
  const assignment = assignmentFromRecord(record);

  if (!assignment || !assignment.dispatchAssignmentId) {
    return failure('dispatch_assignment_not_found_or_denied', context);
  }

  return readSuccess(assignment, context);
}

function normalizeWriteResult(result, context) {
  if (resultFailed(result)) {
    return failure('dispatch_assignment_write_failed', context);
  }

  const [record] = resultRecords(result);
  const assignment = assignmentFromRecord(record);

  if (!assignment || !assignment.dispatchAssignmentId) {
    return failure('dispatch_assignment_not_found_or_denied', context);
  }

  return writeSuccess(assignment, context);
}

function createDispatchAssignmentSqlRepositoryAdapter(options = {}) {
  const source = isObject(options) ? options : {};
  const dbClient = source.dbClient;

  return {
    kind: DISPATCH_ASSIGNMENT_SQL_REPOSITORY_ADAPTER_KIND,

    async findAssignmentState(input = {}) {
      if (!resolveQueryExecutor(dbClient)) {
        return failure('db_client_required', input);
      }

      const validation = validateReadInput(input);

      if (!validation.ok) {
        return failure(validation.reasonCode, validation);
      }

      try {
        const result = await executeQuery(dbClient, buildReadSpec(validation));

        return normalizeReadResult(result, validation);
      } catch (caught) {
        return failure('dispatch_assignment_read_failed', validation);
      }
    },

    async recordAssignmentIntent(input = {}) {
      if (!resolveQueryExecutor(dbClient)) {
        return failure('db_client_required', input);
      }

      const validation = validateRecordIntentInput(input);

      if (!validation.ok) {
        return failure(validation.reasonCode, validation);
      }

      try {
        const result = await executeQuery(dbClient, buildRecordIntentSpec(validation));

        return normalizeWriteResult(result, validation);
      } catch (caught) {
        return failure('dispatch_assignment_write_failed', validation);
      }
    },
  };
}

module.exports = {
  DISPATCH_ASSIGNMENT_SQL_REPOSITORY_ADAPTER_KIND,
  createDispatchAssignmentSqlRepositoryAdapter,
};
