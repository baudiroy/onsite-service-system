'use strict';

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

function assignIfPresent(target, key, value) {
  if (value !== undefined) {
    target[key] = value;
  }
}

function mapChecklistItem(item) {
  if (typeof item === 'string') {
    const label = safeString(item);

    return label ? { label } : undefined;
  }

  if (!isObject(item)) {
    return undefined;
  }

  const label = firstString(item, ['label', 'title', 'name']);
  const status = firstString(item, ['status', 'state']);

  if (!label) {
    return undefined;
  }

  return status ? { label, status } : { label };
}

function mapChecklistPreview(value) {
  if (Array.isArray(value)) {
    const items = value.map(mapChecklistItem).filter(Boolean).slice(0, 10);

    return items.length > 0 ? Object.freeze(items.map((item) => Object.freeze(item))) : undefined;
  }

  const singleItem = mapChecklistItem(value);

  return singleItem ? Object.freeze([Object.freeze(singleItem)]) : undefined;
}

function mapAssignedAppointmentDbRow(row) {
  if (!isObject(row)) {
    return undefined;
  }

  const appointmentId = firstString(row, ['appointmentId', 'appointment_id']);

  if (!appointmentId) {
    return undefined;
  }

  const mapped = {
    appointmentId,
  };

  assignIfPresent(mapped, 'organizationId', firstString(row, ['organizationId', 'organization_id']));
  assignIfPresent(mapped, 'engineerUserId', firstString(row, [
    'engineerUserId',
    'engineer_user_id',
    'assignedEngineerId',
    'assigned_engineer_id',
    'engineerId',
    'engineer_id',
  ]));
  assignIfPresent(mapped, 'caseId', firstString(row, ['caseId', 'case_id']));
  assignIfPresent(mapped, 'caseReference', firstString(row, [
    'caseReference',
    'case_reference',
    'caseDisplayId',
    'case_display_id',
  ]));
  assignIfPresent(mapped, 'appointmentWindow', firstString(row, [
    'appointmentWindow',
    'appointment_window',
  ]));
  assignIfPresent(mapped, 'scheduledStart', firstString(row, [
    'scheduledStart',
    'scheduled_start',
    'scheduledStartAt',
    'scheduled_start_at',
  ]));
  assignIfPresent(mapped, 'scheduledEnd', firstString(row, [
    'scheduledEnd',
    'scheduled_end',
    'scheduledEndAt',
    'scheduled_end_at',
  ]));
  assignIfPresent(mapped, 'serviceType', firstString(row, ['serviceType', 'service_type']));
  assignIfPresent(mapped, 'customerDisplayName', firstString(row, [
    'customerDisplayName',
    'customer_display_name',
  ]));
  assignIfPresent(mapped, 'locationLabel', firstString(row, ['locationLabel', 'location_label']));
  assignIfPresent(mapped, 'status', firstString(row, [
    'status',
    'appointmentStatus',
    'appointment_status',
  ]));
  assignIfPresent(mapped, 'priorityLabel', firstString(row, ['priorityLabel', 'priority_label']));
  assignIfPresent(mapped, 'serviceSummary', firstString(row, ['serviceSummary', 'service_summary']));
  assignIfPresent(mapped, 'publicCustomerNotes', firstString(row, [
    'publicCustomerNotes',
    'public_customer_notes',
  ]));
  assignIfPresent(mapped, 'checklistPreview', mapChecklistPreview(
    row.checklistPreview || row.checklist_preview,
  ));

  return Object.freeze(mapped);
}

function mapAssignedAppointmentListDbRow(row) {
  return mapAssignedAppointmentDbRow(row);
}

function mapAssignedAppointmentDetailDbRow(row) {
  return mapAssignedAppointmentDbRow(row);
}

module.exports = {
  mapAssignedAppointmentDetailDbRow,
  mapAssignedAppointmentListDbRow,
};
