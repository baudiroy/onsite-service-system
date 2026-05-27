'use strict';

const DEFAULT_WORKBENCH_ASSIGNED_APPOINTMENTS_PATH = '/engineer-mobile/appointments';
const DEFAULT_WORKBENCH_ASSIGNED_APPOINTMENT_DETAIL_PATH = '/engineer-mobile/appointments/:appointmentId';
const INTERNAL_WORKBENCH_ASSIGNED_APPOINTMENTS_ALIAS_PATH = '/__internal/engineer-mobile/workbench/assigned-appointments';
const INTERNAL_WORKBENCH_ASSIGNED_APPOINTMENT_DETAIL_ALIAS_PATH = '/__internal/engineer-mobile/workbench/assigned-appointments/:appointmentId';
const LIST_UNAVAILABLE_MESSAGE_KEY = 'engineerMobile.assignedAppointments.unavailable';
const DETAIL_UNAVAILABLE_MESSAGE_KEY = 'engineerMobile.assignedAppointmentDetail.unavailable';

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stringValue(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function safePath(value, fallback) {
  return stringValue(value) || fallback;
}

function safeListDenyEnvelope() {
  return {
    status: 'deny',
    messageKey: LIST_UNAVAILABLE_MESSAGE_KEY,
    engineerMobileVisible: false,
    data: {
      appointments: [],
    },
    error: {
      messageKey: LIST_UNAVAILABLE_MESSAGE_KEY,
    },
  };
}

function safeDetailDenyEnvelope() {
  return {
    status: 'deny',
    messageKey: DETAIL_UNAVAILABLE_MESSAGE_KEY,
    engineerMobileVisible: false,
    data: {
      appointment: null,
    },
    error: {
      messageKey: DETAIL_UNAVAILABLE_MESSAGE_KEY,
    },
  };
}

function safeNotRegistered() {
  return {
    registered: false,
    messageKey: 'engineerMobile.workbenchReadOnly.unavailable',
    engineerMobileVisible: false,
  };
}

function statusCodeForEnvelope(envelope) {
  return envelope && envelope.status === 'allow' ? 200 : 404;
}

function targetFromOptions(options) {
  return options.app || options.router;
}

function handlersFromOptions(options) {
  const handlers = isObject(options.handlers) ? options.handlers : {};

  return {
    assignedAppointmentsHandler: options.assignedAppointmentsHandler || handlers.assignedAppointmentsHandler,
    assignedAppointmentDetailHandler: options.assignedAppointmentDetailHandler || handlers.assignedAppointmentDetailHandler,
  };
}

function queryFromRequest(request) {
  return isObject(request.query) ? request.query : {};
}

function paramsFromRequest(request) {
  return isObject(request.params) ? request.params : {};
}

function normalizeAppointmentId(value) {
  const appointmentId = stringValue(value);

  if (!appointmentId || appointmentId.length > 128 || !/^[a-zA-Z0-9_.:-]+$/.test(appointmentId)) {
    return undefined;
  }

  return appointmentId;
}

function appointmentIdFromRequest(request) {
  const params = paramsFromRequest(request);
  const query = queryFromRequest(request);

  return normalizeAppointmentId(params.appointmentId)
    || normalizeAppointmentId(params.id)
    || normalizeAppointmentId(query.appointmentId)
    || normalizeAppointmentId(query.id);
}

async function contextFromRequest(getContext, request) {
  if (typeof getContext !== 'function') {
    return undefined;
  }

  const context = await getContext(request);

  return isObject(context) ? context : undefined;
}

function buildResponse(envelope) {
  return {
    statusCode: statusCodeForEnvelope(envelope),
    body: envelope,
  };
}

function writeResponse(response, res) {
  if (res && typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(response.statusCode).json(response.body);
  }

  return response;
}

function createListRouteHandler({ assignedAppointmentsHandler, getContext }) {
  return async function engineerMobileWorkbenchAssignedAppointmentsReadOnlyHttpHandler(req, res) {
    const request = isObject(req) ? req : {};

    try {
      const context = await contextFromRequest(getContext, request);

      if (!context) {
        return writeResponse(buildResponse(safeListDenyEnvelope()), res);
      }

      const envelope = await assignedAppointmentsHandler({
        context,
        filters: queryFromRequest(request),
      });

      return writeResponse(buildResponse(envelope), res);
    } catch (_error) {
      return writeResponse(buildResponse(safeListDenyEnvelope()), res);
    }
  };
}

function createDetailRouteHandler({ assignedAppointmentDetailHandler, getContext }) {
  return async function engineerMobileWorkbenchAssignedAppointmentDetailReadOnlyHttpHandler(req, res) {
    const request = isObject(req) ? req : {};
    const appointmentId = appointmentIdFromRequest(request);

    if (!appointmentId) {
      return writeResponse(buildResponse(safeDetailDenyEnvelope()), res);
    }

    try {
      const context = await contextFromRequest(getContext, request);

      if (!context) {
        return writeResponse(buildResponse(safeDetailDenyEnvelope()), res);
      }

      const envelope = await assignedAppointmentDetailHandler({
        context,
        input: {
          appointmentId,
          params: {
            appointmentId,
          },
        },
      });

      return writeResponse(buildResponse(envelope), res);
    } catch (_error) {
      return writeResponse(buildResponse(safeDetailDenyEnvelope()), res);
    }
  };
}

function buildPathSummary({ listPath, detailPath, internalListPath, internalDetailPath }) {
  const paths = {
    assignedAppointments: listPath,
    assignedAppointmentDetail: detailPath,
  };

  if (internalListPath) {
    paths.internalAssignedAppointmentsAlias = internalListPath;
  }

  if (internalDetailPath) {
    paths.internalAssignedAppointmentDetailAlias = internalDetailPath;
  }

  return paths;
}

function mountEngineerMobileWorkbenchReadOnlyRoutes(options = {}) {
  if (!isObject(options)) {
    return safeNotRegistered();
  }

  const target = targetFromOptions(options);
  const {
    assignedAppointmentsHandler,
    assignedAppointmentDetailHandler,
  } = handlersFromOptions(options);

  if (
    !target
    || typeof target.get !== 'function'
    || typeof assignedAppointmentsHandler !== 'function'
    || typeof assignedAppointmentDetailHandler !== 'function'
    || typeof options.getContext !== 'function'
  ) {
    return safeNotRegistered();
  }

  const listPath = safePath(options.listPath, DEFAULT_WORKBENCH_ASSIGNED_APPOINTMENTS_PATH);
  const detailPath = safePath(options.detailPath, DEFAULT_WORKBENCH_ASSIGNED_APPOINTMENT_DETAIL_PATH);
  const includeInternalAliases = options.includeInternalAliases !== false;
  const internalListPath = includeInternalAliases
    ? safePath(options.internalListPath, INTERNAL_WORKBENCH_ASSIGNED_APPOINTMENTS_ALIAS_PATH)
    : undefined;
  const internalDetailPath = includeInternalAliases
    ? safePath(options.internalDetailPath, INTERNAL_WORKBENCH_ASSIGNED_APPOINTMENT_DETAIL_ALIAS_PATH)
    : undefined;
  const listHandler = createListRouteHandler({
    assignedAppointmentsHandler,
    getContext: options.getContext,
  });
  const detailHandler = createDetailRouteHandler({
    assignedAppointmentDetailHandler,
    getContext: options.getContext,
  });

  try {
    target.get(listPath, listHandler);
    target.get(detailPath, detailHandler);

    if (includeInternalAliases) {
      target.get(internalListPath, listHandler);
      target.get(internalDetailPath, detailHandler);
    }
  } catch (_error) {
    return safeNotRegistered();
  }

  return {
    registered: true,
    method: 'GET',
    paths: buildPathSummary({
      listPath,
      detailPath,
      internalListPath,
      internalDetailPath,
    }),
    handlers: {
      assignedAppointments: listHandler,
      assignedAppointmentDetail: detailHandler,
    },
  };
}

function createEngineerMobileWorkbenchReadOnlyHttpAdapter(options = {}) {
  const dependencies = isObject(options) ? options : {};

  return {
    register(registerOptions = {}) {
      const overrides = isObject(registerOptions) ? registerOptions : {};

      return mountEngineerMobileWorkbenchReadOnlyRoutes({
        ...dependencies,
        ...overrides,
        handlers: {
          ...(isObject(dependencies.handlers) ? dependencies.handlers : {}),
          ...(isObject(overrides.handlers) ? overrides.handlers : {}),
        },
      });
    },
  };
}

module.exports = {
  DEFAULT_WORKBENCH_ASSIGNED_APPOINTMENTS_PATH,
  DEFAULT_WORKBENCH_ASSIGNED_APPOINTMENT_DETAIL_PATH,
  INTERNAL_WORKBENCH_ASSIGNED_APPOINTMENTS_ALIAS_PATH,
  INTERNAL_WORKBENCH_ASSIGNED_APPOINTMENT_DETAIL_ALIAS_PATH,
  createEngineerMobileWorkbenchReadOnlyHttpAdapter,
  mountEngineerMobileWorkbenchReadOnlyRoutes,
};
