'use strict';

const {
  createEngineerAssignedAppointmentsProjectionHandler,
} = require('./engineerAssignedAppointmentsProjectionHandler');

const DEFAULT_INTERNAL_ASSIGNED_APPOINTMENTS_PATH = '/__internal/engineer-mobile/assigned-appointments';
const SAFE_UNAVAILABLE_MESSAGE_KEY = 'engineerMobile.assignedAppointments.unavailable';

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

function registerEngineerAssignedAppointmentsRoute(options = {}) {
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

  const path = stringValue(options.path) || DEFAULT_INTERNAL_ASSIGNED_APPOINTMENTS_PATH;
  const handler = createEngineerAssignedAppointmentsProjectionHandler({
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
  DEFAULT_INTERNAL_ASSIGNED_APPOINTMENTS_PATH,
  registerEngineerAssignedAppointmentsRoute,
};
