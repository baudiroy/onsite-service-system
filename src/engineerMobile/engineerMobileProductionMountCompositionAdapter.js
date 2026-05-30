'use strict';

const {
  ENGINEER_MOBILE_TASKS_ROUTE_PATH,
  registerEngineerMobileRoutes,
} = require('../routes/engineerMobileRoutes');
const {
  ENGINEER_MOBILE_TASK_DETAIL_ROUTE_PATH,
  registerEngineerMobileTaskDetailRoutes,
} = require('../routes/engineerMobileTaskDetailRoutes');
const {
  ENGINEER_MOBILE_VISIT_ACTION_ROUTE_PATH,
  registerEngineerMobileVisitActionRoutes,
} = require('../routes/engineerMobileVisitActionRoutes');
const {
  buildEngineerMobileAuditEvent,
} = require('./engineerMobileAuditEventBuilder');
const {
  writeEngineerMobileAuditEvent,
} = require('./engineerMobileAuditWriterAdapter');

const ENGINEER_MOBILE_PRODUCTION_MOUNT_MODULE = 'engineerMobile';
const ENGINEER_MOBILE_PRODUCTION_MOUNT_MESSAGE_KEY = 'engineerMobile.unavailable';

const ENGINEER_MOBILE_PRODUCTION_ROUTES = Object.freeze([
  Object.freeze({
    method: 'GET',
    path: ENGINEER_MOBILE_TASKS_ROUTE_PATH,
  }),
  Object.freeze({
    method: 'GET',
    path: ENGINEER_MOBILE_TASK_DETAIL_ROUTE_PATH,
  }),
  Object.freeze({
    method: 'POST',
    path: ENGINEER_MOBILE_VISIT_ACTION_ROUTE_PATH,
  }),
]);

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function successSummary() {
  return {
    registered: true,
    module: ENGINEER_MOBILE_PRODUCTION_MOUNT_MODULE,
    routes: ENGINEER_MOBILE_PRODUCTION_ROUTES.map((route) => ({ ...route })),
  };
}

function failureSummary(reasonCode) {
  return {
    registered: false,
    module: ENGINEER_MOBILE_PRODUCTION_MOUNT_MODULE,
    messageKey: ENGINEER_MOBILE_PRODUCTION_MOUNT_MESSAGE_KEY,
    customerVisible: false,
    reasonCode,
  };
}

function isSupportedRouter(router) {
  return isObject(router)
    && typeof router.get === 'function'
    && typeof router.post === 'function';
}

function hasRegistrationAuditWriter(auditWriter) {
  return typeof auditWriter === 'function';
}

function buildRegistrationAuditEvent(input) {
  const source = isObject(input) ? input : {};
  const result = buildEngineerMobileAuditEvent({
    eventType: source.success
      ? 'engineer_mobile.route_registration.success'
      : 'engineer_mobile.route_registration.failure',
    decision: source.success ? 'success' : 'failure',
    method: source.route && source.route.method,
    metadata: {
      dependencyValid: source.success === true,
      registrationResult: source.success ? 'success' : source.registrationResult,
    },
    reasonCode: source.success ? undefined : source.reasonCode,
    route: source.route && source.route.path,
    source: 'engineer_mobile_route_registration',
  });

  return isObject(result) && result.ok === true && isObject(result.auditEvent)
    ? result.auditEvent
    : undefined;
}

function writeRegistrationAuditEvent(auditWriter, auditEvent) {
  if (!auditEvent) {
    return;
  }

  const writeResult = writeEngineerMobileAuditEvent({
    auditEvent,
    auditWriter,
  });

  if (writeResult && typeof writeResult.catch === 'function') {
    writeResult.catch(() => undefined);
  }
}

function writeRegistrationSuccessAudits(auditWriter, routes) {
  if (!hasRegistrationAuditWriter(auditWriter)) {
    return;
  }

  for (const route of routes) {
    writeRegistrationAuditEvent(auditWriter, buildRegistrationAuditEvent({
      route,
      success: true,
    }));
  }
}

function writeRegistrationFailureAudit(auditWriter, route, reasonCode) {
  if (!hasRegistrationAuditWriter(auditWriter) || !route) {
    return;
  }

  writeRegistrationAuditEvent(auditWriter, buildRegistrationAuditEvent({
    reasonCode,
    registrationResult: 'failure',
    route,
    success: false,
  }));
}

function createEngineerMobileProductionMountComposition(input = {}) {
  const options = isObject(input) ? input : {};
  const router = options.router;

  if (!isSupportedRouter(router)) {
    return failureSummary('mount_target_invalid');
  }

  let currentRoute;

  try {
    currentRoute = ENGINEER_MOBILE_PRODUCTION_ROUTES[0];
    registerEngineerMobileRoutes(router, options);
    currentRoute = ENGINEER_MOBILE_PRODUCTION_ROUTES[1];
    registerEngineerMobileTaskDetailRoutes(router, options);
    currentRoute = ENGINEER_MOBILE_PRODUCTION_ROUTES[2];
    registerEngineerMobileVisitActionRoutes(router, options);
  } catch (error) {
    writeRegistrationFailureAudit(options.auditWriter, currentRoute, 'route_registration_failed');

    return failureSummary('route_registration_failed');
  }

  const summary = successSummary();
  writeRegistrationSuccessAudits(options.auditWriter, summary.routes);

  return summary;
}

module.exports = {
  ENGINEER_MOBILE_PRODUCTION_MOUNT_MODULE,
  ENGINEER_MOBILE_PRODUCTION_ROUTES,
  createEngineerMobileProductionMountComposition,
};
