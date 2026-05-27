'use strict';

const {
  createEngineerMobileAssignedAppointmentDetailHandler,
} = require('./engineerMobileAssignedAppointmentDetailHandler');
const {
  createEngineerMobileAssignedAppointmentsHandler,
} = require('./engineerMobileAssignedAppointmentsHandler');
const {
  createEngineerMobileAssignedAppointmentRepositoryGuard,
} = require('./engineerMobileAssignedAppointmentRepositoryGuard');
const {
  createEngineerMobileWorkbenchReadOnlyHttpAdapter,
} = require('./engineerMobileWorkbenchReadOnlyHttpAdapter');
const {
  createEngineerMobileWorkbenchRequestContextResolver,
} = require('./engineerMobileWorkbenchRequestContextResolver');

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

function contextFromResolverResult(result) {
  if (
    isObject(result)
    && result.status === 'allow'
    && isObject(result.context)
  ) {
    return result.context;
  }

  return undefined;
}

function requestContextResolverFrom(source) {
  if (typeof source.requestContextResolver === 'function') {
    return source.requestContextResolver;
  }

  if (source.requestContextResolver === true || source.useRequestContextResolver === true) {
    return createEngineerMobileWorkbenchRequestContextResolver({
      clock: source.clock,
      auditLogger: source.requestContextAuditLogger,
    });
  }

  return undefined;
}

function getContextFrom(source) {
  if (typeof source.getContext === 'function') {
    return source.getContext;
  }

  const requestContextResolver = requestContextResolverFrom(source);

  if (!requestContextResolver) {
    return undefined;
  }

  return async function engineerMobileWorkbenchReadOnlyModuleGetContext(request) {
    const result = await requestContextResolver({ request });

    return contextFromResolverResult(result);
  };
}

function routeOptionsFrom(source) {
  const options = isObject(source) ? source : {};
  const routeOptions = {};

  for (const key of [
    'app',
    'router',
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

  const getContext = getContextFrom(options);

  if (getContext) {
    routeOptions.getContext = getContext;
  }

  return routeOptions;
}

function assignedAppointmentRepositoryFrom(options) {
  if (options.useRepositoryGuard !== true && options.repositoryGuardEnabled !== true) {
    return options.assignedAppointmentRepository;
  }

  return createEngineerMobileAssignedAppointmentRepositoryGuard({
    auditLogger: options.repositoryGuardAuditLogger || options.auditLogger,
    delegateRepository: options.delegateAssignedAppointmentRepository
      || options.assignedAppointmentRepository,
  });
}

function createEngineerMobileWorkbenchReadOnlyModule(options = {}) {
  if (!isObject(options)) {
    return createUnavailableWorkbenchModule('invalid_options');
  }

  const {
    auditLogger,
  } = options;
  const assignedAppointmentRepository = assignedAppointmentRepositoryFrom(options);

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
