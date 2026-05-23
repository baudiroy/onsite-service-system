'use strict';

const {
  evaluateEngineerPreDepartureActionEligibility,
} = require('./engineerPreDepartureActionEligibility');

const SAFE_DENY_MESSAGE_KEY = 'engineerMobile.assignedAppointmentDetail.unavailable';
const ALLOW_MESSAGE_KEY = 'engineerMobile.assignedAppointmentDetail.available';

const READ_PERMISSION = 'engineer_mobile.assigned_appointments.read';

const ASSIGNED_APPOINTMENT_DETAIL_QUERY_TEXT = [
  'select appointment_id, case_reference, appointment_window, scheduled_start, scheduled_end,',
  'service_type, customer_display_name, location_label, appointment_status, priority_label,',
  'service_summary, public_customer_notes, checklist_preview, organization_id, assigned_engineer_id',
  'from engineer_mobile_assigned_appointments',
  'where organization_id = $1',
  'and assigned_engineer_id = $2',
  'and appointment_id = $3',
  'limit 1',
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

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return undefined;
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

function normalizeAppointmentId(value) {
  const appointmentId = stringValue(value);

  if (!appointmentId || appointmentId.length > 128 || !/^[a-zA-Z0-9_.:-]+$/.test(appointmentId)) {
    return undefined;
  }

  return appointmentId;
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

function buildQuerySpec({
  organizationId,
  engineerId,
  appointmentId,
}) {
  return Object.freeze({
    name: 'engineerMobileAssignedAppointmentDetailProjection',
    readOnly: true,
    text: ASSIGNED_APPOINTMENT_DETAIL_QUERY_TEXT,
    values: Object.freeze([
      organizationId,
      engineerId,
      appointmentId,
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
  appointmentId,
}) {
  if (!isObject(row)) {
    return false;
  }

  const rowOrganizationId = rowValue(row, 'organization_id', 'organizationId');
  const rowEngineerId = rowValue(row, 'assigned_engineer_id', 'assignedEngineerId', 'engineerId');
  const rowAppointmentId = rowValue(row, 'appointment_id', 'appointmentId');

  return rowOrganizationId === organizationId
    && rowEngineerId === engineerId
    && rowAppointmentId === appointmentId;
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

function mapChecklistItem(item) {
  if (typeof item === 'string') {
    const label = stringValue(item);

    return label ? { label } : undefined;
  }

  if (!isObject(item)) {
    return undefined;
  }

  const label = rowValue(item, 'label', 'title', 'name');
  const status = rowValue(item, 'status', 'state');

  if (!label) {
    return undefined;
  }

  return status ? { label, status } : { label };
}

function safeChecklistPreview(value) {
  if (Array.isArray(value)) {
    const items = value
      .map(mapChecklistItem)
      .filter(Boolean)
      .slice(0, 10);

    return items.length > 0 ? items : undefined;
  }

  const singleItem = mapChecklistItem(value);

  return singleItem ? [singleItem] : undefined;
}

function assignIfPresent(target, key, value) {
  if (value !== undefined) {
    target[key] = value;
  }
}

function mapAppointmentDetailProjection(row, engineerContext) {
  if (!isObject(row)) {
    return undefined;
  }

  const appointmentId = rowValue(row, 'appointment_id', 'appointmentId');
  const caseReference = rowValue(row, 'case_reference', 'caseReference', 'caseDisplayId');
  const status = rowValue(row, 'appointment_status', 'status');

  if (!appointmentId || !caseReference) {
    return undefined;
  }

  const appointment = {
    appointmentId,
    caseReference,
    canOpenDetails: true,
  };

  assignIfPresent(appointment, 'appointmentWindow', rowValue(row, 'appointment_window', 'appointmentWindow'));
  assignIfPresent(appointment, 'scheduledStart', rowValue(row, 'scheduled_start', 'scheduledStart'));
  assignIfPresent(appointment, 'scheduledEnd', rowValue(row, 'scheduled_end', 'scheduledEnd'));
  assignIfPresent(appointment, 'serviceType', rowValue(row, 'service_type', 'serviceType'));
  assignIfPresent(appointment, 'customerDisplayName', rowValue(row, 'customer_display_name', 'customerDisplayName'));
  assignIfPresent(appointment, 'locationLabel', rowValue(row, 'location_label', 'locationLabel'));
  assignIfPresent(appointment, 'status', status);
  assignIfPresent(appointment, 'priorityLabel', rowValue(row, 'priority_label', 'priorityLabel'));
  assignIfPresent(appointment, 'serviceSummary', rowValue(row, 'service_summary', 'serviceSummary'));
  assignIfPresent(appointment, 'publicCustomerNotes', rowValue(row, 'public_customer_notes', 'publicCustomerNotes'));
  assignIfPresent(appointment, 'checklistPreview', safeChecklistPreview(row.checklist_preview || row.checklistPreview));

  Object.assign(appointment, preDepartureEligibilityHints(engineerContext, row));

  return appointment;
}

async function queryAssignedAppointmentDetail(dbClient, querySpec) {
  if (!isObject(dbClient) || typeof dbClient.query !== 'function') {
    return [];
  }

  const result = await dbClient.query(querySpec);

  return rowsFromResult(result);
}

async function getEngineerAssignedAppointmentDetailProjection(options = {}) {
  if (!isObject(options)) {
    return buildSafeDenyEnvelope();
  }

  const { dbClient, engineerContext } = options;
  const appointmentId = normalizeAppointmentId(options.appointmentId);

  if (!isObject(dbClient) || typeof dbClient.query !== 'function') {
    return buildSafeDenyEnvelope();
  }

  if (!isAuthorizedEngineerContext(engineerContext) || !appointmentId) {
    return buildSafeDenyEnvelope();
  }

  const organizationId = contextOrganizationId(engineerContext);
  const engineerId = contextEngineerId(engineerContext);
  const querySpec = buildQuerySpec({
    organizationId,
    engineerId,
    appointmentId,
  });

  try {
    const rows = await queryAssignedAppointmentDetail(dbClient, querySpec);
    const row = rows.find((candidate) => isExpectedRow(candidate, {
      organizationId,
      engineerId,
      appointmentId,
    }));
    const appointment = mapAppointmentDetailProjection(row, engineerContext);

    return appointment ? buildAllowEnvelope(appointment) : buildSafeDenyEnvelope();
  } catch (error) {
    return buildSafeDenyEnvelope();
  }
}

module.exports = {
  getEngineerAssignedAppointmentDetailProjection,
};
