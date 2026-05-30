'use strict';

const {
  buildEngineerMobilePermissionContext,
} = require('../engineerMobile/engineerMobilePermissionMiddleware');
const {
  createEngineerMobileVisitActionHttpHandlerAdapter,
} = require('../engineerMobile/engineerMobileVisitActionHttpHandlerAdapter');
const {
  buildEngineerMobileAuditEvent,
} = require('../engineerMobile/engineerMobileAuditEventBuilder');
const {
  writeEngineerMobileAuditEvent,
} = require('../engineerMobile/engineerMobileAuditWriterAdapter');

const ENGINEER_MOBILE_VISIT_ACTION_ROUTE_PATH = '/engineer-mobile/appointments/:appointmentId/actions/:action';
const ENGINEER_MOBILE_VISIT_ACTION_AUDIT_ROUTE = '/engineer-mobile/appointments/:appointmentId/actions/:action';
const ENGINEER_MOBILE_VISIT_ACTION_AUDIT_METHOD = 'POST';
const ENGINEER_MOBILE_VISIT_ACTION_AUDIT_SOURCE = 'engineer_mobile_visit_action_handler';

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stringValue(value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return undefined;
}

function compactRecord(record) {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined),
  );
}

function bodyFrom(req) {
  return isObject(req && req.body) ? req.body : {};
}

function paramsFrom(req) {
  return isObject(req && req.params) ? req.params : {};
}

function permissionContextFrom(req) {
  if (isObject(req && req.engineerMobilePermissionContext)) {
    return req.engineerMobilePermissionContext;
  }

  return isObject(req && req.auth) ? req.auth : {};
}

function actorFromRequest(req) {
  const context = permissionContextFrom(req);

  return compactRecord({
    id: stringValue(context.engineerId) || stringValue(context.userId),
    engineerId: stringValue(context.engineerId),
    userId: stringValue(context.userId),
    organizationId: stringValue(context.organizationId),
    permissions: Array.isArray(context.permissions)
      ? context.permissions.map(stringValue).filter(Boolean)
      : undefined,
  });
}

function visitActionOptions(options = {}) {
  if (isObject(options.visitAction)) {
    return options.visitAction;
  }

  return {};
}

function visitActionServiceFrom(options = {}) {
  const nested = visitActionOptions(options);

  return options.visitActionService || nested.visitActionService;
}

function hasVisitActionAuditWriter(options) {
  return isObject(options) && typeof options.auditWriter === 'function';
}

function buildVisitActionAuditMetadata(context, params, allowed) {
  return {
    routeMatched: true,
    contextPresent: isObject(context) && Object.keys(context).length > 0,
    identifierValid: Boolean(context.organizationId && context.engineerId && params.appointmentId),
    permissionPassed: allowed === true,
    actionAllowed: allowed === true,
  };
}

function buildEngineerMobileVisitActionAuditEvent(req, response) {
  const context = permissionContextFrom(req);
  const params = paramsFrom(req);
  const allowed = isObject(response)
    && response.statusCode >= 200
    && response.statusCode < 300
    && isObject(response.body)
    && response.body.accepted === true;
  const input = {
    eventType: allowed
      ? 'engineer_mobile.visit_action.allow'
      : 'engineer_mobile.visit_action.deny',
    actorType: isObject(context) && Object.keys(context).length > 0 ? 'engineer' : 'runtime',
    action: stringValue(params.action),
    appointmentId: stringValue(params.appointmentId),
    decision: allowed ? 'allow' : 'deny',
    engineerId: stringValue(context.engineerId),
    method: ENGINEER_MOBILE_VISIT_ACTION_AUDIT_METHOD,
    metadata: buildVisitActionAuditMetadata(context, params, allowed),
    organizationId: stringValue(context.organizationId),
    route: ENGINEER_MOBILE_VISIT_ACTION_AUDIT_ROUTE,
    source: ENGINEER_MOBILE_VISIT_ACTION_AUDIT_SOURCE,
  };

  if (!allowed) {
    input.reasonCode = 'engineerMobile.unavailable';
  }

  const result = buildEngineerMobileAuditEvent(input);

  return isObject(result) && result.ok === true && isObject(result.auditEvent)
    ? result.auditEvent
    : undefined;
}

function writeEngineerMobileVisitActionAuditSideChannel(req, response, options = {}) {
  if (!hasVisitActionAuditWriter(options)) {
    return undefined;
  }

  const auditEvent = buildEngineerMobileVisitActionAuditEvent(req, response);

  if (!auditEvent) {
    return undefined;
  }

  const writeResult = writeEngineerMobileAuditEvent({
    auditEvent,
    auditWriter: options.auditWriter,
  });

  if (writeResult && typeof writeResult.catch === 'function') {
    writeResult.catch(() => undefined);
  }

  return undefined;
}

function writeDeniedResponse(res, decision) {
  if (!res || typeof res.status !== 'function' || typeof res.json !== 'function') {
    return decision;
  }

  return res.status(decision.statusCode).json(decision.responseBody);
}

function createEngineerMobileVisitActionPermissionMiddleware(options = {}) {
  return function engineerMobileVisitActionPermissionMiddleware(req, res, next) {
    const decision = buildEngineerMobilePermissionContext(req, options.permission);

    if (!decision.allowed) {
      writeEngineerMobileVisitActionAuditSideChannel(req, {
        statusCode: decision.statusCode,
        body: decision.responseBody,
      }, options);

      return writeDeniedResponse(res, decision);
    }

    if (isObject(req)) {
      req.engineerMobilePermissionContext = decision.permissionContext;
    }

    if (typeof next === 'function') {
      return next();
    }

    return decision;
  };
}

function appointmentProviderFrom(options = {}) {
  const nested = visitActionOptions(options);

  return options.visitActionAppointmentProvider
    || options.appointmentProvider
    || nested.appointmentProvider
    || nested.visitActionAppointmentProvider;
}

function nowFrom(options = {}, req) {
  const nested = visitActionOptions(options);
  const now = options.now || nested.now;

  if (typeof now === 'function') {
    return stringValue(now(req));
  }

  return stringValue(now);
}

function normalizeAppointmentResult(result) {
  if (!isObject(result)) {
    return undefined;
  }

  if (isObject(result.appointment)) {
    return result.appointment;
  }

  if (isObject(result.task)) {
    return result.task;
  }

  if (isObject(result.detail)) {
    return result.detail;
  }

  return result;
}

async function resolveAppointment(req, options = {}) {
  const provider = appointmentProviderFrom(options);

  if (!provider) {
    return undefined;
  }

  const context = permissionContextFrom(req);
  const params = paramsFrom(req);
  const input = compactRecord({
    appointmentId: stringValue(params.appointmentId),
    action: stringValue(params.action),
    engineerId: stringValue(context.engineerId),
    organizationId: stringValue(context.organizationId),
    requestId: stringValue(req && req.requestId),
    userId: stringValue(context.userId),
  });

  if (typeof provider === 'function') {
    return normalizeAppointmentResult(await provider(input));
  }

  if (isObject(provider) && typeof provider.getAppointmentForVisitAction === 'function') {
    return normalizeAppointmentResult(await provider.getAppointmentForVisitAction(input));
  }

  if (isObject(provider) && typeof provider.resolveAppointment === 'function') {
    return normalizeAppointmentResult(await provider.resolveAppointment(input));
  }

  if (isObject(provider) && typeof provider.getAppointment === 'function') {
    return normalizeAppointmentResult(await provider.getAppointment(input));
  }

  if (isObject(provider) && typeof provider.getTaskDetail === 'function') {
    return normalizeAppointmentResult(await provider.getTaskDetail(input));
  }

  return undefined;
}

function syntheticHandlerRequest({ req, appointment, options }) {
  const params = paramsFrom(req);
  const body = bodyFrom(req);

  return {
    actor: actorFromRequest(req),
    appointment,
    body: compactRecord({
      action: stringValue(params.action),
      visitResult: stringValue(body.visitResult),
    }),
    now: nowFrom(options, req),
    params: {
      action: stringValue(params.action),
      appointmentId: stringValue(params.appointmentId),
    },
    requestId: stringValue(req && req.requestId),
  };
}

function createEngineerMobileVisitActionRouteHandler(options = {}) {
  const httpHandlerAdapter = createEngineerMobileVisitActionHttpHandlerAdapter({
    visitActionService: visitActionServiceFrom(options),
  });

  return async function engineerMobileVisitActionRouteHandler(req, res, next) {
    try {
      const appointment = await resolveAppointment(req, options);
      const response = await httpHandlerAdapter.handleEngineerMobileVisitActionRequest(
        syntheticHandlerRequest({ req, appointment, options }),
      );

      writeEngineerMobileVisitActionAuditSideChannel(req, response, options);

      return res.status(response.statusCode).json(response.body);
    } catch (error) {
      return next(error);
    }
  };
}

function registerEngineerMobileVisitActionRoutes(router, options = {}) {
  if (!router || typeof router.post !== 'function') {
    return router;
  }

  router.post(
    ENGINEER_MOBILE_VISIT_ACTION_ROUTE_PATH,
    createEngineerMobileVisitActionPermissionMiddleware(options),
    createEngineerMobileVisitActionRouteHandler(options),
  );

  return router;
}

module.exports = {
  ENGINEER_MOBILE_VISIT_ACTION_ROUTE_PATH,
  createEngineerMobileVisitActionRouteHandler,
  registerEngineerMobileVisitActionRoutes,
  buildEngineerMobileVisitActionAuditEvent,
  writeEngineerMobileVisitActionAuditSideChannel,
};
