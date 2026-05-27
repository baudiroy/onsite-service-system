'use strict';

const {
  createEngineerMobileAssignedAppointmentDetailHandler,
} = require('./engineerMobileAssignedAppointmentDetailHandler');
const {
  createEngineerMobileAssignedAppointmentsHandler,
} = require('./engineerMobileAssignedAppointmentsHandler');
const {
  createEngineerMobileWorkbenchReadOnlyHttpAdapter,
} = require('./engineerMobileWorkbenchReadOnlyHttpAdapter');

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function hasAssignedAppointmentRepositoryReader(assignedAppointmentRepository) {
  return isObject(assignedAppointmentRepository)
    && typeof assignedAppointmentRepository.findAssignedAppointments === 'function'
    && typeof assignedAppointmentRepository.findAssignedAppointmentDetail === 'function';
}

function safeUnavailableRegistration(reason) {
  return {
    registered: false,
    messageKey: 'engineerMobile.workbenchReadOnly.unavailable',
    engineerMobileVisible: false,
    reason,
  };
}

function createUnavailableWorkbenchModule(reason) {
  const registerResult = safeUnavailableRegistration(reason);

  return Object.freeze({
    configured: false,
    reason,
    handlers: Object.freeze({}),
    register() {
      return registerResult;
    },
  });
}

function routeOptionsFrom(source) {
  const options = isObject(source) ? source : {};
  const routeOptions = {};

  for (const key of [
    'app',
    'router',
    'getContext',
    'listPath',
    'detailPath',
    'includeInternalAliases',
    'internalListPath',
    'internalDetailPath',
  ]) {
    if (Object.prototype.hasOwnProperty.call(options, key)) {
      routeOptions[key] = options[key];
    }
  }

  return routeOptions;
}

function createEngineerMobileWorkbenchReadOnlyModule(options = {}) {
  if (!isObject(options)) {
    return createUnavailableWorkbenchModule('invalid_options');
  }

  const {
    assignedAppointmentRepository,
    auditLogger,
  } = options;

  if (!hasAssignedAppointmentRepositoryReader(assignedAppointmentRepository)) {
    return createUnavailableWorkbenchModule('missing_assigned_appointment_repository');
  }

  const assignedAppointmentsHandler = createEngineerMobileAssignedAppointmentsHandler({
    assignedAppointmentRepository,
    auditLogger,
  });
  const assignedAppointmentDetailHandler = createEngineerMobileAssignedAppointmentDetailHandler({
    assignedAppointmentRepository,
    auditLogger,
  });
  const baseRouteOptions = routeOptionsFrom(options);
  const adapter = createEngineerMobileWorkbenchReadOnlyHttpAdapter({
    ...baseRouteOptions,
    assignedAppointmentsHandler,
    assignedAppointmentDetailHandler,
  });

  return Object.freeze({
    configured: true,
    handlers: Object.freeze({
      assignedAppointmentsHandler,
      assignedAppointmentDetailHandler,
    }),
    register(registerOptions = {}) {
      const overrides = routeOptionsFrom(registerOptions);

      return adapter.register({
        ...overrides,
      });
    },
  });
}

module.exports = {
  createEngineerMobileWorkbenchReadOnlyModule,
};
