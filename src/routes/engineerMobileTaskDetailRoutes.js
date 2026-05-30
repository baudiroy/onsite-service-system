'use strict';

const {
  createEngineerMobileTaskDetailHandler,
  writeEngineerMobileTaskDetailAuditSideChannel,
} = require('../controllers/engineerMobileTaskDetailController');
const {
  buildEngineerMobilePermissionContext,
} = require('../engineerMobile/engineerMobilePermissionMiddleware');

const ENGINEER_MOBILE_TASK_DETAIL_ROUTE_PATH = '/engineer-mobile/tasks/:appointmentId';

function writeDeniedResponse(res, decision) {
  if (!res || typeof res.status !== 'function' || typeof res.json !== 'function') {
    return decision;
  }

  return res.status(decision.statusCode).json(decision.responseBody);
}

function createEngineerMobileTaskDetailPermissionMiddleware(options = {}) {
  return function engineerMobileTaskDetailPermissionMiddleware(req, res, next) {
    const decision = buildEngineerMobilePermissionContext(req, options.permission);

    if (!decision.allowed) {
      writeEngineerMobileTaskDetailAuditSideChannel(req, {
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

function registerEngineerMobileTaskDetailRoutes(router, options = {}) {
  if (!router || typeof router.get !== 'function') {
    return router;
  }

  router.get(
    ENGINEER_MOBILE_TASK_DETAIL_ROUTE_PATH,
    createEngineerMobileTaskDetailPermissionMiddleware(options),
    createEngineerMobileTaskDetailHandler(options),
  );

  return router;
}

module.exports = {
  ENGINEER_MOBILE_TASK_DETAIL_ROUTE_PATH,
  registerEngineerMobileTaskDetailRoutes,
};
