'use strict';

const {
  projectEngineerMobileAssignedAppointmentDetail,
} = require('./engineerMobileAssignedAppointmentProjection');

const SAFE_DENY_MESSAGE_KEY = 'engineerMobile.assignedAppointmentDetail.unavailable';
const ALLOW_MESSAGE_KEY = 'engineerMobile.assignedAppointmentDetail.available';
const READ_PERMISSION = 'engineer_mobile.assigned_appointments.read';

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

function arrayIncludes(values, expected) {
  return Array.isArray(values) && values.includes(expected);
}

function contextOrganizationId(context) {
  const auth = isObject(context.auth) ? context.auth : {};
  const engineerContext = isObject(context.engineerContext) ? context.engineerContext : {};
  const organization = isObject(context.organization) ? context.organization : {};

  return firstString(
    context.organizationId,
    auth.organizationId,
    engineerContext.organizationId,
    engineerContext.auth && engineerContext.auth.organizationId,
    organization.organizationId,
    organization.id,
  );
}

function contextEngineerUserId(context) {
  const auth = isObject(context.auth) ? context.auth : {};
  const engineerContext = isObject(context.engineerContext) ? context.engineerContext : {};
  const engineer = isObject(context.engineer) ? context.engineer : {};

  return firstString(
    context.engineerUserId,
    context.engineerId,
    auth.engineerUserId,
    auth.engineerId,
    engineerContext.engineerUserId,
    engineerContext.engineerId,
    engineerContext.auth && engineerContext.auth.engineerUserId,
    engineerContext.auth && engineerContext.auth.engineerId,
    engineer.engineerUserId,
    engineer.engineerId,
    engineer.id,
  );
}

function contextPermissions(context) {
  const auth = isObject(context.auth) ? context.auth : {};
  const engineerContext = isObject(context.engineerContext) ? context.engineerContext : {};
  const engineerAuth = isObject(engineerContext.auth) ? engineerContext.auth : {};

  if (Array.isArray(context.permissions)) {
    return context.permissions;
  }

  if (Array.isArray(auth.permissions)) {
    return auth.permissions;
  }

  if (Array.isArray(engineerContext.permissions)) {
    return engineerContext.permissions;
  }

  return Array.isArray(engineerAuth.permissions) ? engineerAuth.permissions : [];
}

function isReadAllowed(context) {
  const access = isObject(context.access) ? context.access : {};
  const engineerContext = isObject(context.engineerContext) ? context.engineerContext : {};
  const engineerAccess = isObject(engineerContext.access) ? engineerContext.access : {};

  return context.assignedAppointmentsReadAllowed === true
    || access.assignedAppointmentsReadAllowed === true
    || engineerContext.assignedAppointmentsReadAllowed === true
    || engineerAccess.assignedAppointmentsReadAllowed === true
    || arrayIncludes(contextPermissions(context), READ_PERMISSION);
}

function normalizeAppointmentId(value) {
  const appointmentId = stringValue(value);

  if (!appointmentId || appointmentId.length > 128 || !/^[a-zA-Z0-9_.:-]+$/.test(appointmentId)) {
    return undefined;
  }

  return appointmentId;
}

function appointmentIdFromInput(input) {
  const source = isObject(input) ? input : {};
  const params = isObject(source.params) ? source.params : {};

  return normalizeAppointmentId(firstString(
    source.appointmentId,
    source.id,
    params.appointmentId,
    params.id,
  ));
}

function buildSafeDenyEnvelope() {
  return {
    status: 'deny',
    messageKey: SAFE_DENY_MESSAGE_KEY,
    engineerMobileVisible: false,
    data: {
      appointment: null,
    },
    error: {
      messageKey: SAFE_DENY_MESSAGE_KEY,
    },
  };
}

function buildAllowEnvelope(appointment) {
  return {
    status: 'allow',
    messageKey: ALLOW_MESSAGE_KEY,
    engineerMobileVisible: true,
    data: {
      appointment,
    },
  };
}

function rowValue(row, ...keys) {
  for (const key of keys) {
    const value = stringFromAny(row && row[key]);

    if (value) {
      return value;
    }
  }

  return undefined;
}

function rowFromRepositoryResult(result) {
  if (Array.isArray(result)) {
    return result[0];
  }

  if (isObject(result) && isObject(result.appointment)) {
    return result.appointment;
  }

  if (isObject(result) && isObject(result.row)) {
    return result.row;
  }

  if (isObject(result) && Array.isArray(result.rows)) {
    return result.rows[0];
  }

  return isObject(result) ? result : undefined;
}

function rowMatchesScope(row, { organizationId, engineerUserId, appointmentId }) {
  if (!isObject(row)) {
    return false;
  }

  const rowOrganizationId = rowValue(row, 'organizationId', 'organization_id');
  const rowEngineerUserId = rowValue(
    row,
    'engineerUserId',
    'engineer_user_id',
    'assignedEngineerId',
    'assigned_engineer_id',
    'engineerId',
    'engineer_id',
  );
  const rowAppointmentId = rowValue(row, 'appointmentId', 'appointment_id');

  if (rowOrganizationId && rowOrganizationId !== organizationId) {
    return false;
  }

  if (rowEngineerUserId && rowEngineerUserId !== engineerUserId) {
    return false;
  }

  if (rowAppointmentId && rowAppointmentId !== appointmentId) {
    return false;
  }

  return true;
}

function buildAuditIntentMetadata({
  outcome,
  organizationId,
  engineerUserId,
  appointmentId,
  reason,
}) {
  const metadata = {
    event: 'engineerMobile.assignedAppointmentDetail.read',
    outcome,
    organizationId,
    engineerUserId,
    appointmentId,
  };

  if (reason) {
    metadata.reason = reason;
  }

  return metadata;
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
    // Optional audit intent logging must never affect read-only detail results.
  }
}

function repositoryReader(assignedAppointmentRepository) {
  if (!isObject(assignedAppointmentRepository)) {
    return undefined;
  }

  return typeof assignedAppointmentRepository.findAssignedAppointmentDetail === 'function'
    ? assignedAppointmentRepository.findAssignedAppointmentDetail.bind(assignedAppointmentRepository)
    : undefined;
}

async function getEngineerMobileAssignedAppointmentDetail(options = {}) {
  if (!isObject(options)) {
    return buildSafeDenyEnvelope();
  }

  const {
    assignedAppointmentRepository,
    auditLogger,
    context = {},
    input = {},
  } = options;
  const safeContext = isObject(context) ? context : {};
  const organizationId = contextOrganizationId(safeContext);
  const engineerUserId = contextEngineerUserId(safeContext);
  const appointmentId = appointmentIdFromInput(input);
  const read = repositoryReader(assignedAppointmentRepository);

  if (!organizationId || !engineerUserId || !appointmentId || !isReadAllowed(safeContext) || !read) {
    await emitSafeAuditIntent(auditLogger, buildAuditIntentMetadata({
      outcome: 'deny',
      organizationId,
      engineerUserId,
      appointmentId,
      reason: 'missing_or_unauthorized_context',
    }));

    return buildSafeDenyEnvelope();
  }

  const query = Object.freeze({
    organizationId,
    engineerUserId,
    appointmentId,
  });

  try {
    const row = rowFromRepositoryResult(await read(query));

    if (!rowMatchesScope(row, { organizationId, engineerUserId, appointmentId })) {
      await emitSafeAuditIntent(auditLogger, buildAuditIntentMetadata({
        outcome: 'deny',
        organizationId,
        engineerUserId,
        appointmentId,
        reason: 'not_found_or_cross_scope',
      }));

      return buildSafeDenyEnvelope();
    }

    const appointment = projectEngineerMobileAssignedAppointmentDetail(row);

    if (!appointment) {
      await emitSafeAuditIntent(auditLogger, buildAuditIntentMetadata({
        outcome: 'deny',
        organizationId,
        engineerUserId,
        appointmentId,
        reason: 'not_found_or_cross_scope',
      }));

      return buildSafeDenyEnvelope();
    }

    await emitSafeAuditIntent(auditLogger, buildAuditIntentMetadata({
      outcome: 'allow',
      organizationId,
      engineerUserId,
      appointmentId,
    }));

    return buildAllowEnvelope(appointment);
  } catch (error) {
    await emitSafeAuditIntent(auditLogger, buildAuditIntentMetadata({
      outcome: 'deny',
      organizationId,
      engineerUserId,
      appointmentId,
      reason: 'repository_unavailable',
    }));

    return buildSafeDenyEnvelope();
  }
}

function createEngineerMobileAssignedAppointmentDetailHandler(options = {}) {
  const dependencies = isObject(options) ? options : {};

  return async function engineerMobileAssignedAppointmentDetailHandler(request = {}) {
    const safeRequest = isObject(request) ? request : {};

    return getEngineerMobileAssignedAppointmentDetail({
      assignedAppointmentRepository: dependencies.assignedAppointmentRepository,
      auditLogger: dependencies.auditLogger,
      context: safeRequest.context || safeRequest.engineerContext || safeRequest.auth || {},
      input: safeRequest.input || safeRequest.params || safeRequest.query || safeRequest,
    });
  };
}

module.exports = {
  createEngineerMobileAssignedAppointmentDetailHandler,
  getEngineerMobileAssignedAppointmentDetail,
};
