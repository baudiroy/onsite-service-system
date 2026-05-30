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

function callAuditWriter(auditWriter, event) {
  if (typeof auditWriter === 'function') {
    return auditWriter(event);
  }

  if (isObject(auditWriter) && typeof auditWriter.write === 'function') {
    return auditWriter.write(event);
  }

  if (isObject(auditWriter) && typeof auditWriter.record === 'function') {
    return auditWriter.record(event);
  }

  return undefined;
}

function writeRegistrationAudit(auditWriter, routes) {
  if (
    typeof auditWriter !== 'function'
    && !(isObject(auditWriter) && (
      typeof auditWriter.write === 'function'
      || typeof auditWriter.record === 'function'
    ))
  ) {
    return;
  }

  Promise.resolve().then(async () => {
    for (const route of routes) {
      try {
        await callAuditWriter(auditWriter, {
          eventType: 'engineer_mobile.route_registration.success',
          module: ENGINEER_MOBILE_PRODUCTION_MOUNT_MODULE,
          method: route.method,
          path: route.path,
        });
      } catch (error) {
        // Audit is a side channel. Registration summaries must stay stable.
      }
    }
  });
}

function createEngineerMobileProductionMountComposition(input = {}) {
  const options = isObject(input) ? input : {};
  const router = options.router;

  if (!isSupportedRouter(router)) {
    return failureSummary('mount_target_invalid');
  }

  try {
    registerEngineerMobileRoutes(router, options);
    registerEngineerMobileTaskDetailRoutes(router, options);
    registerEngineerMobileVisitActionRoutes(router, options);
  } catch (error) {
    return failureSummary('route_registration_failed');
  }

  const summary = successSummary();
  writeRegistrationAudit(options.auditWriter, summary.routes);

  return summary;
}

module.exports = {
  ENGINEER_MOBILE_PRODUCTION_MOUNT_MODULE,
  ENGINEER_MOBILE_PRODUCTION_ROUTES,
  createEngineerMobileProductionMountComposition,
};
