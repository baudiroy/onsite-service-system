'use strict';

const {
  projectEngineerMobileAssignedAppointmentListItem,
} = require('./engineerMobileAssignedAppointmentProjection');
const {
  createEngineerMobileWorkbenchDenyEnvelope,
  createEngineerMobileWorkbenchSuccessEnvelope,
} = require('./engineerMobileWorkbenchSafeEnvelope');

const SAFE_DENY_MESSAGE_KEY = 'engineerMobile.assignedAppointments.unavailable';
const ALLOW_MESSAGE_KEY = 'engineerMobile.assignedAppointments.available';
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

function buildSafeDenyEnvelope() {
  return createEngineerMobileWorkbenchDenyEnvelope({
    messageKey: SAFE_DENY_MESSAGE_KEY,
    data: {
      appointments: [],
    },
  });
}

function buildAllowEnvelope(appointments) {
  return createEngineerMobileWorkbenchSuccessEnvelope({
    messageKey: ALLOW_MESSAGE_KEY,
    data: {
      appointments,
    },
  });
}

function rowsFromRepositoryResult(result) {
  if (Array.isArray(result)) {
    return result;
  }

  if (isObject(result) && Array.isArray(result.appointments)) {
    return result.appointments;
  }

  if (isObject(result) && Array.isArray(result.rows)) {
    return result.rows;
  }

  return [];
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

function rowMatchesScope(row, { organizationId, engineerUserId }) {
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

  if (rowOrganizationId && rowOrganizationId !== organizationId) {
    return false;
  }

  if (rowEngineerUserId && rowEngineerUserId !== engineerUserId) {
    return false;
  }

  return true;
}

function sortAppointment(a, b) {
  const aStart = a.scheduledStart || '';
  const bStart = b.scheduledStart || '';

  if (aStart !== bStart) {
    return aStart.localeCompare(bStart);
  }

  return (a.appointmentId || '').localeCompare(b.appointmentId || '');
}

function buildAuditIntentMetadata({
  outcome,
  organizationId,
  engineerUserId,
  appointmentCount,
  reason,
}) {
  const metadata = {
    event: 'engineerMobile.assignedAppointments.read',
    outcome,
    organizationId,
    engineerUserId,
    appointmentCount: Number.isInteger(appointmentCount) ? appointmentCount : 0,
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
    // Audit intent logging is optional and must never widen read behavior.
  }
}

function repositoryReader(assignedAppointmentRepository) {
  if (!isObject(assignedAppointmentRepository)) {
    return undefined;
  }

  return typeof assignedAppointmentRepository.findAssignedAppointments === 'function'
    ? assignedAppointmentRepository.findAssignedAppointments.bind(assignedAppointmentRepository)
    : undefined;
}

async function getEngineerMobileAssignedAppointments(options = {}) {
  if (!isObject(options)) {
    return buildSafeDenyEnvelope();
  }

  const {
    assignedAppointmentRepository,
    auditLogger,
    context = {},
    filters = {},
  } = options;
  const safeContext = isObject(context) ? context : {};
  const organizationId = contextOrganizationId(safeContext);
  const engineerUserId = contextEngineerUserId(safeContext);
  const read = repositoryReader(assignedAppointmentRepository);

  if (!organizationId || !engineerUserId || !isReadAllowed(safeContext) || !read) {
    await emitSafeAuditIntent(auditLogger, buildAuditIntentMetadata({
      outcome: 'deny',
      organizationId,
      engineerUserId,
      reason: 'missing_or_unauthorized_context',
    }));

    return buildSafeDenyEnvelope();
  }

  const query = Object.freeze({
    organizationId,
    engineerUserId,
    filters: normalizeFilters(filters),
  });

  try {
    const rows = rowsFromRepositoryResult(await read(query));
    const appointments = rows
      .filter((row) => rowMatchesScope(row, { organizationId, engineerUserId }))
      .map(projectEngineerMobileAssignedAppointmentListItem)
      .filter(Boolean)
      .sort(sortAppointment);

    await emitSafeAuditIntent(auditLogger, buildAuditIntentMetadata({
      outcome: 'allow',
      organizationId,
      engineerUserId,
      appointmentCount: appointments.length,
    }));

    return buildAllowEnvelope(appointments);
  } catch (error) {
    await emitSafeAuditIntent(auditLogger, buildAuditIntentMetadata({
      outcome: 'deny',
      organizationId,
      engineerUserId,
      reason: 'repository_unavailable',
    }));

    return buildSafeDenyEnvelope();
  }
}

function createEngineerMobileAssignedAppointmentsHandler(options = {}) {
  const dependencies = isObject(options) ? options : {};

  return async function engineerMobileAssignedAppointmentsHandler(request = {}) {
    const safeRequest = isObject(request) ? request : {};

    return getEngineerMobileAssignedAppointments({
      assignedAppointmentRepository: dependencies.assignedAppointmentRepository,
      auditLogger: dependencies.auditLogger,
      context: safeRequest.context || safeRequest.engineerContext || safeRequest.auth || {},
      filters: safeRequest.filters || safeRequest.query || {},
    });
  };
}

module.exports = {
  createEngineerMobileAssignedAppointmentsHandler,
  getEngineerMobileAssignedAppointments,
};
