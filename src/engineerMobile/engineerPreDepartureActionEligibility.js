'use strict';

const READ_PERMISSION = 'engineer_mobile.assigned_appointments.read';
const WORKBENCH_PERMISSION = 'engineer_mobile.workbench.read';

const ALLOW_START_TRAVEL_STATUSES = new Set([
  'assigned',
  'scheduled',
  'confirmed',
  'ready_to_start',
]);

const DENY_START_TRAVEL_STATUSES = new Set([
  'travel_started',
  'traveling',
  'arrived',
  'in_progress',
  'completed',
  'cancelled',
  'canceled',
  'closed',
]);

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

function contextPermissions(context) {
  const auth = isObject(context.auth) ? context.auth : {};

  return Array.isArray(context.permissions) ? context.permissions : auth.permissions;
}

function contextReadAllowed(context) {
  const access = isObject(context.access) ? context.access : {};
  const permissions = contextPermissions(context);

  return context.assignedAppointmentsReadAllowed === true
    || context.engineerMobileWorkbenchReadAllowed === true
    || context.workbenchReadAllowed === true
    || access.assignedAppointmentsReadAllowed === true
    || access.engineerMobileWorkbenchReadAllowed === true
    || access.workbenchReadAllowed === true
    || arrayIncludes(permissions, READ_PERMISSION)
    || arrayIncludes(permissions, WORKBENCH_PERMISSION);
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

function appointmentOrganizationId(appointment) {
  return rowValue(appointment, 'organization_id', 'organizationId');
}

function appointmentEngineerId(appointment) {
  return rowValue(appointment, 'assigned_engineer_id', 'assignedEngineerId', 'engineerId');
}

function appointmentStatus(appointment) {
  const status = rowValue(appointment, 'appointment_status', 'appointmentStatus', 'status');

  return status ? status.toLowerCase() : undefined;
}

function deny(reason) {
  return {
    ok: false,
    canStartTravel: false,
    canRecordArrival: false,
    canPrepareCompletionDraft: false,
    reasons: [reason],
  };
}

function allow() {
  return {
    ok: true,
    canStartTravel: true,
    canRecordArrival: false,
    canPrepareCompletionDraft: false,
    reasons: [],
  };
}

function evaluateEngineerPreDepartureActionEligibility(options = {}) {
  if (!isObject(options)) {
    return deny('missing_context');
  }

  const engineerContext = isObject(options.engineerContext) ? options.engineerContext : undefined;
  const appointment = isObject(options.appointment) ? options.appointment : undefined;

  if (!engineerContext) {
    return deny('missing_context');
  }

  const organizationId = contextOrganizationId(engineerContext);
  const engineerId = contextEngineerId(engineerContext);

  if (!organizationId) {
    return deny('missing_organization');
  }

  if (!engineerId) {
    return deny('missing_engineer');
  }

  if (!appointment) {
    return deny('missing_appointment');
  }

  if (appointmentOrganizationId(appointment) !== organizationId) {
    return deny('organization_mismatch');
  }

  if (appointmentEngineerId(appointment) !== engineerId) {
    return deny('engineer_mismatch');
  }

  if (!contextReadAllowed(engineerContext)) {
    return deny('permission_denied');
  }

  const status = appointmentStatus(appointment);

  if (ALLOW_START_TRAVEL_STATUSES.has(status)) {
    return allow();
  }

  if (DENY_START_TRAVEL_STATUSES.has(status)) {
    return deny('not_pre_departure');
  }

  return deny('unsupported_status');
}

module.exports = {
  evaluateEngineerPreDepartureActionEligibility,
};
