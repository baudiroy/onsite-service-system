'use strict';

const {
  createEngineerMobileTaskListHandler,
  writeEngineerMobileTaskListAuditSideChannel,
} = require('../controllers/engineerMobileController');
const {
  buildEngineerMobilePermissionContext,
} = require('../engineerMobile/engineerMobilePermissionMiddleware');

const ENGINEER_MOBILE_TASKS_ROUTE_PATH = '/engineer-mobile/tasks';

function writeDeniedResponse(res, decision) {
  if (!res || typeof res.status !== 'function' || typeof res.json !== 'function') {
    return decision;
  }

  return res.status(decision.statusCode).json(decision.responseBody);
}

function createEngineerMobileTaskListPermissionMiddleware(options = {}) {
  return function engineerMobileTaskListPermissionMiddleware(req, res, next) {
    const decision = buildEngineerMobilePermissionContext(req, options.permission);

    if (!decision.allowed) {
      writeEngineerMobileTaskListAuditSideChannel(req, {
        statusCode: decision.statusCode,
        body: decision.responseBody,
      }, options);

      return writeDeniedResponse(res, decision);
    }

    if (req && typeof req === 'object' && !Array.isArray(req)) {
      req.engineerMobilePermissionContext = decision.permissionContext;
    }

    if (typeof next === 'function') {
      return next();
    }

    return decision;
  };
}

function registerEngineerMobileRoutes(router, options = {}) {
  if (!router || typeof router.get !== 'function') {
    return router;
  }

  router.get(
    ENGINEER_MOBILE_TASKS_ROUTE_PATH,
    createEngineerMobileTaskListPermissionMiddleware(options),
    createEngineerMobileTaskListHandler(options),
  );

  return router;
}

module.exports = {
  ENGINEER_MOBILE_TASKS_ROUTE_PATH,
  registerEngineerMobileRoutes,
};
