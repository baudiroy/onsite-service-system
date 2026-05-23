'use strict';

const {
  evaluateEngineerPreDepartureActionEligibility,
} = require('./engineerPreDepartureActionEligibility');

const SAFE_DENY_MESSAGE_KEY = 'engineerMobile.assignedAppointments.unavailable';
const ALLOW_MESSAGE_KEY = 'engineerMobile.assignedAppointments.available';

const READ_PERMISSION = 'engineer_mobile.assigned_appointments.read';

const ASSIGNED_APPOINTMENTS_QUERY_TEXT = [
  'select appointment_id, case_reference, appointment_window, scheduled_start, scheduled_end,',
  'service_type, customer_display_name, location_label, appointment_status, priority_label,',
  'organization_id, assigned_engineer_id',
  'from engineer_mobile_assigned_appointments',
  'where organization_id = $1',
  'and assigned_engineer_id = $2',
  'and ($3::timestamptz is null or scheduled_start >= $3::timestamptz)',
  'and ($4::timestamptz is null or scheduled_start <= $4::timestamptz)',
  'and ($5::text is null or appointment_status = $5::text)',
  'order by scheduled_start asc, appointment_id asc',
].join(' ');

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

function arrayIncludes(values, expected) {
  return Array.isArray(values) && values.includes(expected);
}

function contextOrganizationId(context) {
  return stringValue(context.organizationId)
    || stringValue(context.auth && context.auth.organizationId)
    || stringValue(context.organization && context.organization.organizationId)
    || stringValue(context.organization && context.organization.id);
}

function contextEngineerId(context) {
  return stringValue(context.engineerId)
    || stringValue(context.auth && context.auth.engineerId)
    || stringValue(context.engineer && context.engineer.engineerId)
    || stringValue(context.engineer && context.engineer.id);
}

function isAuthorizedEngineerContext(context) {
  if (!isObject(context)) {
    return false;
  }

  const access = isObject(context.access) ? context.access : {};
  const auth = isObject(context.auth) ? context.auth : {};
  const permissions = Array.isArray(context.permissions) ? context.permissions : auth.permissions;
  const organizationScopeMatched = context.organizationScopeMatched === true
    || access.organizationScopeMatched === true
    || access.organizationScope === true;
  const engineerAssignmentScopeMatched = context.engineerAssignmentScopeMatched === true
    || access.engineerAssignmentScopeMatched === true
    || access.assignedEngineerScope === true;
  const readAllowed = context.assignedAppointmentsReadAllowed === true
    || access.assignedAppointmentsReadAllowed === true
    || arrayIncludes(permissions, READ_PERMISSION);

  return Boolean(
    contextOrganizationId(context)
    && contextEngineerId(context)
    && organizationScopeMatched
    && engineerAssignmentScopeMatched
    && readAllowed
  );
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

function buildSafeDenyEnvelope() {
  return {
    status: 'deny',
    messageKey: SAFE_DENY_MESSAGE_KEY,
    engineerMobileVisible: false,
    data: {
      appointments: [],
    },
    error: {
      messageKey: SAFE_DENY_MESSAGE_KEY,
    },
  };
}

function buildAllowEnvelope(appointments) {
  return {
    status: 'allow',
    messageKey: ALLOW_MESSAGE_KEY,
    engineerMobileVisible: true,
    data: {
      appointments,
    },
  };
}

function normalizeDateBoundary(value) {
  const date = stringFromAny(value);

  return date || null;
}

function normalizeStatusFilter(statusFilter) {
  if (typeof statusFilter === 'string') {
    return stringValue(statusFilter) || null;
  }

  if (isObject(statusFilter)) {
    return stringValue(statusFilter.status) || stringValue(statusFilter.appointmentStatus) || null;
  }

  return null;
}

function buildQuerySpec({
  organizationId,
  engineerId,
  dateRange,
  statusFilter,
}) {
  const safeDateRange = isObject(dateRange) ? dateRange : {};

  return Object.freeze({
    name: 'engineerMobileAssignedAppointmentsProjection',
    readOnly: true,
    text: ASSIGNED_APPOINTMENTS_QUERY_TEXT,
    values: Object.freeze([
      organizationId,
      engineerId,
      normalizeDateBoundary(safeDateRange.from),
      normalizeDateBoundary(safeDateRange.to),
      normalizeStatusFilter(statusFilter),
    ]),
  });
}

function rowsFromResult(result) {
  if (Array.isArray(result)) {
    return result;
  }

  if (isObject(result) && Array.isArray(result.rows)) {
    return result.rows;
  }

  return [];
}

function isExpectedRow(row, {
  organizationId,
  engineerId,
  statusFilter,
}) {
  if (!isObject(row)) {
    return false;
  }

  const rowOrganizationId = rowValue(row, 'organization_id', 'organizationId');
  const rowEngineerId = rowValue(row, 'assigned_engineer_id', 'assignedEngineerId', 'engineerId');
  const wantedStatus = normalizeStatusFilter(statusFilter);
  const rowStatus = rowValue(row, 'appointment_status', 'status');

  if (rowOrganizationId !== organizationId || rowEngineerId !== engineerId) {
    return false;
  }

  if (wantedStatus && rowStatus !== wantedStatus) {
    return false;
  }

  return true;
}

function preDepartureEligibilityHints(engineerContext, appointment) {
  const eligibility = evaluateEngineerPreDepartureActionEligibility({
    engineerContext,
    appointment,
  });

  return {
    canStartTravel: eligibility.canStartTravel === true,
    canRecordArrival: eligibility.canRecordArrival === true,
    canPrepareCompletionDraft: eligibility.canPrepareCompletionDraft === true,
  };
}

function mapAppointmentProjection(row, engineerContext) {
  if (!isObject(row)) {
    return undefined;
  }

  const appointment = {};
  const appointmentId = rowValue(row, 'appointment_id', 'appointmentId');
  const caseReference = rowValue(row, 'case_reference', 'caseReference', 'caseDisplayId');
  const appointmentWindow = rowValue(row, 'appointment_window', 'appointmentWindow');
  const scheduledStart = rowValue(row, 'scheduled_start', 'scheduledStart');
  const scheduledEnd = rowValue(row, 'scheduled_end', 'scheduledEnd');
  const serviceType = rowValue(row, 'service_type', 'serviceType');
  const customerDisplayName = rowValue(row, 'customer_display_name', 'customerDisplayName');
  const locationLabel = rowValue(row, 'location_label', 'locationLabel');
  const status = rowValue(row, 'appointment_status', 'status');
  const priorityLabel = rowValue(row, 'priority_label', 'priorityLabel');

  if (appointmentId) {
    appointment.appointmentId = appointmentId;
  }
  if (caseReference) {
    appointment.caseReference = caseReference;
  }
  if (appointmentWindow) {
    appointment.appointmentWindow = appointmentWindow;
  }
  if (scheduledStart) {
    appointment.scheduledStart = scheduledStart;
  }
  if (scheduledEnd) {
    appointment.scheduledEnd = scheduledEnd;
  }
  if (serviceType) {
    appointment.serviceType = serviceType;
  }
  if (customerDisplayName) {
    appointment.customerDisplayName = customerDisplayName;
  }
  if (locationLabel) {
    appointment.locationLabel = locationLabel;
  }
  if (status) {
    appointment.status = status;
  }
  if (priorityLabel) {
    appointment.priorityLabel = priorityLabel;
  }

  appointment.canOpenDetails = true;
  Object.assign(appointment, preDepartureEligibilityHints(engineerContext, row));

  return appointmentId && caseReference ? appointment : undefined;
}

function sortAppointment(a, b) {
  const aStart = a.scheduledStart || '';
  const bStart = b.scheduledStart || '';

  if (aStart !== bStart) {
    return aStart.localeCompare(bStart);
  }

  return (a.appointmentId || '').localeCompare(b.appointmentId || '');
}

async function queryAssignedAppointments(dbClient, querySpec) {
  if (!isObject(dbClient) || typeof dbClient.query !== 'function') {
    return [];
  }

  const result = await dbClient.query(querySpec);

  return rowsFromResult(result);
}

async function getEngineerAssignedAppointmentsProjection(options = {}) {
  if (!isObject(options)) {
    return buildSafeDenyEnvelope();
  }

  const { dbClient, engineerContext, dateRange, statusFilter } = options;

  if (!isObject(dbClient) || typeof dbClient.query !== 'function') {
    return buildSafeDenyEnvelope();
  }

  if (!isAuthorizedEngineerContext(engineerContext)) {
    return buildSafeDenyEnvelope();
  }

  const organizationId = contextOrganizationId(engineerContext);
  const engineerId = contextEngineerId(engineerContext);
  const querySpec = buildQuerySpec({
    organizationId,
    engineerId,
    dateRange,
    statusFilter,
  });

  try {
    const rows = await queryAssignedAppointments(dbClient, querySpec);
    const appointments = rows
      .filter((row) => isExpectedRow(row, { organizationId, engineerId, statusFilter }))
      .map((row) => mapAppointmentProjection(row, engineerContext))
      .filter(Boolean)
      .sort(sortAppointment);

    return buildAllowEnvelope(appointments);
  } catch (error) {
    return buildSafeDenyEnvelope();
  }
}

module.exports = {
  getEngineerAssignedAppointmentsProjection,
};
