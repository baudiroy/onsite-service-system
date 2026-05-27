'use strict';

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

function rowValue(row, ...keys) {
  for (const key of keys) {
    const value = stringFromAny(row && row[key]);

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

function projectEngineerMobileAssignedAppointmentListItem(row) {
  if (!isObject(row)) {
    return undefined;
  }

  const appointmentId = rowValue(row, 'appointmentId', 'appointment_id');

  if (!appointmentId) {
    return undefined;
  }

  const appointment = {
    appointmentId,
  };

  assignIfPresent(appointment, 'caseReference', rowValue(row, 'caseReference', 'case_reference', 'caseDisplayId'));
  assignIfPresent(appointment, 'appointmentWindow', rowValue(row, 'appointmentWindow', 'appointment_window'));
  assignIfPresent(appointment, 'scheduledStart', rowValue(row, 'scheduledStart', 'scheduled_start'));
  assignIfPresent(appointment, 'scheduledEnd', rowValue(row, 'scheduledEnd', 'scheduled_end'));
  assignIfPresent(appointment, 'serviceType', rowValue(row, 'serviceType', 'service_type'));
  assignIfPresent(appointment, 'customerDisplayName', rowValue(row, 'customerDisplayName', 'customer_display_name'));
  assignIfPresent(appointment, 'locationLabel', rowValue(row, 'locationLabel', 'location_label'));
  assignIfPresent(appointment, 'status', rowValue(row, 'status', 'appointmentStatus', 'appointment_status'));
  assignIfPresent(appointment, 'priorityLabel', rowValue(row, 'priorityLabel', 'priority_label'));

  appointment.canOpenDetails = true;

  return appointment;
}

function projectEngineerMobileAssignedAppointmentDetail(row) {
  if (!isObject(row)) {
    return undefined;
  }

  const appointmentId = rowValue(row, 'appointmentId', 'appointment_id');

  if (!appointmentId) {
    return undefined;
  }

  const appointment = {
    appointmentId,
    canOpenDetails: true,
  };

  assignIfPresent(appointment, 'caseReference', rowValue(row, 'caseReference', 'case_reference', 'caseDisplayId'));
  assignIfPresent(appointment, 'appointmentWindow', rowValue(row, 'appointmentWindow', 'appointment_window'));
  assignIfPresent(appointment, 'scheduledStart', rowValue(row, 'scheduledStart', 'scheduled_start'));
  assignIfPresent(appointment, 'scheduledEnd', rowValue(row, 'scheduledEnd', 'scheduled_end'));
  assignIfPresent(appointment, 'serviceType', rowValue(row, 'serviceType', 'service_type'));
  assignIfPresent(appointment, 'customerDisplayName', rowValue(row, 'customerDisplayName', 'customer_display_name'));
  assignIfPresent(appointment, 'locationLabel', rowValue(row, 'locationLabel', 'location_label'));
  assignIfPresent(appointment, 'status', rowValue(row, 'status', 'appointmentStatus', 'appointment_status'));
  assignIfPresent(appointment, 'priorityLabel', rowValue(row, 'priorityLabel', 'priority_label'));
  assignIfPresent(appointment, 'serviceSummary', rowValue(row, 'serviceSummary', 'service_summary'));
  assignIfPresent(appointment, 'publicCustomerNotes', rowValue(row, 'publicCustomerNotes', 'public_customer_notes'));
  assignIfPresent(appointment, 'checklistPreview', safeChecklistPreview(row.checklistPreview || row.checklist_preview));

  return appointment;
}

module.exports = {
  projectEngineerMobileAssignedAppointmentDetail,
  projectEngineerMobileAssignedAppointmentListItem,
};
