'use strict';

const {
  createEngineerMobileTaskDetailHandler,
} = require('../controllers/engineerMobileTaskDetailController');
const {
  createEngineerMobilePermissionMiddleware,
} = require('../engineerMobile/engineerMobilePermissionMiddleware');

const ENGINEER_MOBILE_TASK_DETAIL_ROUTE_PATH = '/engineer-mobile/tasks/:appointmentId';

function registerEngineerMobileTaskDetailRoutes(router, options = {}) {
  if (!router || typeof router.get !== 'function') {
    return router;
  }

  router.get(
    ENGINEER_MOBILE_TASK_DETAIL_ROUTE_PATH,
    createEngineerMobilePermissionMiddleware(options.permission),
    createEngineerMobileTaskDetailHandler(options),
  );

  return router;
}

module.exports = {
  ENGINEER_MOBILE_TASK_DETAIL_ROUTE_PATH,
  registerEngineerMobileTaskDetailRoutes,
};
