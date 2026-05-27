'use strict';

const {
  buildEngineerMobileAssignedAppointmentDetailQuerySpec,
  buildEngineerMobileAssignedAppointmentListQuerySpec,
} = require('./engineerMobileAssignedAppointmentSqlQueryBuilder');
const {
  mapAssignedAppointmentDetailDbRow,
  mapAssignedAppointmentListDbRow,
} = require('./engineerMobileAssignedAppointmentDbRowMapper');

const SAFE_REPOSITORY_ADAPTER_ERROR_MESSAGE = 'engineerMobile.assignedAppointmentDbRepository.unavailable';

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function safeString(value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    return trimmed.length > 0 ? trimmed : undefined;
  }

  return String(value);
}

function firstString(source, keys) {
  for (const key of keys) {
    const value = safeString(source[key]);

    if (value) {
      return value;
    }
  }

  return undefined;
}

function safeRepositoryAdapterError() {
  return new Error(SAFE_REPOSITORY_ADAPTER_ERROR_MESSAGE);
}

function resolveExecutor(queryExecutor) {
  if (typeof queryExecutor === 'function') {
    return queryExecutor;
  }

  if (!isObject(queryExecutor)) {
    return undefined;
  }

  for (const methodName of ['execute', 'query', 'run']) {
    if (typeof queryExecutor[methodName] === 'function') {
      return queryExecutor[methodName].bind(queryExecutor);
    }
  }

  return undefined;
}

function normalizeRows(result) {
  if (Array.isArray(result)) {
    return result;
  }

  if (isObject(result) && Array.isArray(result.rows)) {
    return result.rows;
  }

  return [];
}

function mapRowsForRepository(rows, detail) {
  const mapper = detail ? mapAssignedAppointmentDetailDbRow : mapAssignedAppointmentListDbRow;

  return rows.map(mapper).filter(Boolean);
}

function normalizeListInput(input) {
  const source = isObject(input) ? input : {};
  const organizationId = firstString(source, ['organizationId', 'organization_id']);
  const engineerUserId = firstString(source, [
    'engineerUserId',
    'engineer_user_id',
    'engineerId',
    'engineer_id',
  ]);

  if (!organizationId || !engineerUserId) {
    return undefined;
  }

  return Object.freeze({
    engineerUserId,
    filters: isObject(source.filters) ? source.filters : {},
    organizationId,
  });
}

function normalizeDetailInput(input) {
  const source = isObject(input) ? input : {};
  const appointmentId = firstString(source, ['appointmentId', 'appointment_id']);
  const organizationId = firstString(source, ['organizationId', 'organization_id']);
  const engineerUserId = firstString(source, [
    'engineerUserId',
    'engineer_user_id',
    'engineerId',
    'engineer_id',
  ]);

  if (!organizationId || !engineerUserId || !appointmentId) {
    return undefined;
  }

  return Object.freeze({
    appointmentId,
    engineerUserId,
    organizationId,
  });
}

function selectedBuilder(queryBuilder, methodName, fallback) {
  if (isObject(queryBuilder) && typeof queryBuilder[methodName] === 'function') {
    return queryBuilder[methodName].bind(queryBuilder);
  }

  if (typeof queryBuilder === 'function') {
    return queryBuilder;
  }

  return fallback;
}

async function emitSafeAudit(auditLogger, metadata) {
  if (!auditLogger) {
    return;
  }

  try {
    if (typeof auditLogger === 'function') {
      await auditLogger(metadata);
      return;
    }

    if (isObject(auditLogger) && typeof auditLogger.record === 'function') {
      await auditLogger.record(metadata);
      return;
    }

    if (isObject(auditLogger) && typeof auditLogger.log === 'function') {
      await auditLogger.log(metadata);
      return;
    }

    if (isObject(auditLogger) && typeof auditLogger.write === 'function') {
      await auditLogger.write(metadata);
    }
  } catch (error) {
    // Optional repository audit metadata must never affect read behavior.
  }
}

function buildAuditMetadata({
  method,
  outcome,
  reason,
  organizationId,
  engineerUserId,
  appointmentId,
  rowCount,
}) {
  const metadata = {
    event: 'engineerMobile.assignedAppointmentDbRepository.read',
    method,
    outcome,
  };

  if (organizationId) {
    metadata.organizationId = organizationId;
  }

  if (engineerUserId) {
    metadata.engineerUserId = engineerUserId;
  }

  if (appointmentId) {
    metadata.appointmentId = appointmentId;
  }

  if (Number.isInteger(rowCount)) {
    metadata.rowCount = rowCount;
  }

  if (reason) {
    metadata.reason = reason;
  }

  return Object.freeze(metadata);
}

function createEngineerMobileAssignedAppointmentDbRepository(options = {}) {
  const dependencies = isObject(options) ? options : {};
  const { auditLogger, queryBuilder, queryExecutor } = dependencies;
  const execute = resolveExecutor(queryExecutor);
  const buildListSpec = selectedBuilder(
    queryBuilder,
    'buildEngineerMobileAssignedAppointmentListQuerySpec',
    buildEngineerMobileAssignedAppointmentListQuerySpec,
  );
  const buildDetailSpec = selectedBuilder(
    queryBuilder,
    'buildEngineerMobileAssignedAppointmentDetailQuerySpec',
    buildEngineerMobileAssignedAppointmentDetailQuerySpec,
  );

  async function executeSpec({ method, query, spec, detail = false }) {
    if (!execute || !spec || spec.ok !== true) {
      await emitSafeAudit(auditLogger, buildAuditMetadata({
        appointmentId: query && query.appointmentId,
        engineerUserId: query && query.engineerUserId,
        method,
        organizationId: query && query.organizationId,
        outcome: 'deny',
        reason: execute ? 'query_spec_unavailable' : 'missing_query_executor',
      }));

      throw safeRepositoryAdapterError();
    }

    try {
      const rows = mapRowsForRepository(normalizeRows(await execute(spec)), detail);

      await emitSafeAudit(auditLogger, buildAuditMetadata({
        appointmentId: query.appointmentId,
        engineerUserId: query.engineerUserId,
        method,
        organizationId: query.organizationId,
        outcome: 'allow',
        rowCount: rows.length,
      }));

      return detail ? rows[0] : rows;
    } catch (error) {
      await emitSafeAudit(auditLogger, buildAuditMetadata({
        appointmentId: query.appointmentId,
        engineerUserId: query.engineerUserId,
        method,
        organizationId: query.organizationId,
        outcome: 'deny',
        reason: 'query_executor_unavailable',
      }));

      throw safeRepositoryAdapterError();
    }
  }

  async function findAssignedAppointments(input = {}) {
    const method = 'findAssignedAppointments';
    const query = normalizeListInput(input);

    if (!query) {
      await emitSafeAudit(auditLogger, buildAuditMetadata({
        method,
        outcome: 'deny',
        reason: 'missing_scope',
      }));

      throw safeRepositoryAdapterError();
    }

    let spec;

    try {
      spec = buildListSpec(query);
    } catch (error) {
      await emitSafeAudit(auditLogger, buildAuditMetadata({
        engineerUserId: query.engineerUserId,
        method,
        organizationId: query.organizationId,
        outcome: 'deny',
        reason: 'query_builder_unavailable',
      }));

      throw safeRepositoryAdapterError();
    }

    return executeSpec({ method, query, spec });
  }

  async function findAssignedAppointmentDetail(input = {}) {
    const method = 'findAssignedAppointmentDetail';
    const query = normalizeDetailInput(input);

    if (!query) {
      await emitSafeAudit(auditLogger, buildAuditMetadata({
        method,
        outcome: 'deny',
        reason: 'missing_scope',
      }));

      throw safeRepositoryAdapterError();
    }

    let spec;

    try {
      spec = buildDetailSpec(query);
    } catch (error) {
      await emitSafeAudit(auditLogger, buildAuditMetadata({
        appointmentId: query.appointmentId,
        engineerUserId: query.engineerUserId,
        method,
        organizationId: query.organizationId,
        outcome: 'deny',
        reason: 'query_builder_unavailable',
      }));

      throw safeRepositoryAdapterError();
    }

    return executeSpec({
      detail: true,
      method,
      query,
      spec,
    });
  }

  return Object.freeze({
    findAssignedAppointmentDetail,
    findAssignedAppointments,
  });
}

module.exports = {
  SAFE_REPOSITORY_ADAPTER_ERROR_MESSAGE,
  createEngineerMobileAssignedAppointmentDbRepository,
};
