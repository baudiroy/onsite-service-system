'use strict';

const SAFE_UNAVAILABLE_MESSAGE = 'engineerMobile.assignedAppointmentRepository.unavailable';

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stringValue(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function stringFromAny(value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'string') {
    return stringValue(value);
  }

  return String(value);
}

function firstString(...values) {
  for (const value of values) {
    const text = stringFromAny(value);

    if (text) {
      return text;
    }
  }

  return undefined;
}

function normalizeAppointmentId(value) {
  const appointmentId = stringValue(value);

  if (!appointmentId || appointmentId.length > 128 || !/^[a-zA-Z0-9_.:-]+$/.test(appointmentId)) {
    return undefined;
  }

  return appointmentId;
}

function normalizeFilters(filters) {
  const source = isObject(filters) ? filters : {};
  const dateRange = isObject(source.dateRange) ? source.dateRange : {};
  const normalized = {};
  const from = firstString(source.from, dateRange.from, source.scheduledFrom);
  const to = firstString(source.to, dateRange.to, source.scheduledTo);
  const status = firstString(source.status, source.appointmentStatus);

  if (from) {
    normalized.from = from;
  }

  if (to) {
    normalized.to = to;
  }

  if (status) {
    normalized.status = status;
  }

  return Object.freeze(normalized);
}

function safeRepositoryError() {
  return new Error(SAFE_UNAVAILABLE_MESSAGE);
}

async function emitSafeAuditIntent(auditLogger, metadata) {
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
    // Optional guard metadata must never affect the read-only repository contract.
  }
}

function buildAuditMetadata({
  method,
  outcome,
  reason,
  organizationId,
  engineerUserId,
  appointmentId,
}) {
  const metadata = {
    event: 'engineerMobile.assignedAppointmentRepositoryGuard.read',
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

  if (reason) {
    metadata.reason = reason;
  }

  return metadata;
}

function delegateMethod(delegateRepository, methodName) {
  if (!isObject(delegateRepository) || typeof delegateRepository[methodName] !== 'function') {
    return undefined;
  }

  return delegateRepository[methodName].bind(delegateRepository);
}

function scopedListQuery(input) {
  const source = isObject(input) ? input : {};
  const organizationId = firstString(source.organizationId, source.organization_id);
  const engineerUserId = firstString(
    source.engineerUserId,
    source.engineer_user_id,
    source.engineerId,
    source.engineer_id,
  );

  if (!organizationId || !engineerUserId) {
    return undefined;
  }

  return Object.freeze({
    organizationId,
    engineerUserId,
    filters: normalizeFilters(source.filters),
  });
}

function scopedDetailQuery(input) {
  const source = isObject(input) ? input : {};
  const organizationId = firstString(source.organizationId, source.organization_id);
  const engineerUserId = firstString(
    source.engineerUserId,
    source.engineer_user_id,
    source.engineerId,
    source.engineer_id,
  );
  const appointmentId = normalizeAppointmentId(firstString(source.appointmentId, source.appointment_id));

  if (!organizationId || !engineerUserId || !appointmentId) {
    return undefined;
  }

  return Object.freeze({
    organizationId,
    engineerUserId,
    appointmentId,
  });
}

function createEngineerMobileAssignedAppointmentRepositoryGuard(options = {}) {
  const dependencies = isObject(options) ? options : {};
  const { auditLogger, delegateRepository } = dependencies;

  async function findAssignedAppointments(input = {}) {
    const method = 'findAssignedAppointments';
    const query = scopedListQuery(input);
    const read = delegateMethod(delegateRepository, method);

    if (!query || !read) {
      await emitSafeAuditIntent(auditLogger, buildAuditMetadata({
        method,
        outcome: 'deny',
        reason: query ? 'missing_delegate_method' : 'missing_scope',
        organizationId: query && query.organizationId,
        engineerUserId: query && query.engineerUserId,
      }));

      throw safeRepositoryError();
    }

    try {
      const result = await read(query);

      await emitSafeAuditIntent(auditLogger, buildAuditMetadata({
        method,
        outcome: 'allow',
        organizationId: query.organizationId,
        engineerUserId: query.engineerUserId,
      }));

      return result;
    } catch (error) {
      await emitSafeAuditIntent(auditLogger, buildAuditMetadata({
        method,
        outcome: 'deny',
        reason: 'delegate_unavailable',
        organizationId: query.organizationId,
        engineerUserId: query.engineerUserId,
      }));

      throw safeRepositoryError();
    }
  }

  async function findAssignedAppointmentDetail(input = {}) {
    const method = 'findAssignedAppointmentDetail';
    const query = scopedDetailQuery(input);
    const read = delegateMethod(delegateRepository, method);

    if (!query || !read) {
      await emitSafeAuditIntent(auditLogger, buildAuditMetadata({
        method,
        outcome: 'deny',
        reason: query ? 'missing_delegate_method' : 'missing_scope',
        organizationId: query && query.organizationId,
        engineerUserId: query && query.engineerUserId,
        appointmentId: query && query.appointmentId,
      }));

      throw safeRepositoryError();
    }

    try {
      const result = await read(query);

      await emitSafeAuditIntent(auditLogger, buildAuditMetadata({
        method,
        outcome: 'allow',
        organizationId: query.organizationId,
        engineerUserId: query.engineerUserId,
        appointmentId: query.appointmentId,
      }));

      return result;
    } catch (error) {
      await emitSafeAuditIntent(auditLogger, buildAuditMetadata({
        method,
        outcome: 'deny',
        reason: 'delegate_unavailable',
        organizationId: query.organizationId,
        engineerUserId: query.engineerUserId,
        appointmentId: query.appointmentId,
      }));

      throw safeRepositoryError();
    }
  }

  return Object.freeze({
    findAssignedAppointmentDetail,
    findAssignedAppointments,
  });
}

module.exports = {
  SAFE_UNAVAILABLE_MESSAGE,
  createEngineerMobileAssignedAppointmentRepositoryGuard,
};
