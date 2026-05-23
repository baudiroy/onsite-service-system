'use strict';

const {
  createEngineerAssignedAppointmentDetailProjectionHandler,
} = require('./engineerAssignedAppointmentDetailProjectionHandler');

const DEFAULT_INTERNAL_ASSIGNED_APPOINTMENT_DETAIL_PATH = '/__internal/engineer-mobile/assigned-appointments/:appointmentId';
const SAFE_UNAVAILABLE_MESSAGE_KEY = 'engineerMobile.assignedAppointmentDetail.unavailable';

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stringValue(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function safeNotRegistered() {
  return {
    registered: false,
    messageKey: SAFE_UNAVAILABLE_MESSAGE_KEY,
    engineerMobileVisible: false,
  };
}

function registerEngineerAssignedAppointmentDetailRoute(options = {}) {
  if (!isObject(options)) {
    return safeNotRegistered();
  }

  const target = options.app || options.router;

  if (!target || typeof target.get !== 'function') {
    return safeNotRegistered();
  }

  if (!options.dbClient || typeof options.dbClient.query !== 'function') {
    return safeNotRegistered();
  }

  const path = stringValue(options.path) || DEFAULT_INTERNAL_ASSIGNED_APPOINTMENT_DETAIL_PATH;
  const handler = createEngineerAssignedAppointmentDetailProjectionHandler({
    dbClient: options.dbClient,
  });

  try {
    target.get(path, handler);
  } catch (_error) {
    return safeNotRegistered();
  }

  return {
    registered: true,
    method: 'GET',
    path,
    handler,
  };
}

module.exports = {
  DEFAULT_INTERNAL_ASSIGNED_APPOINTMENT_DETAIL_PATH,
  registerEngineerAssignedAppointmentDetailRoute,
};
