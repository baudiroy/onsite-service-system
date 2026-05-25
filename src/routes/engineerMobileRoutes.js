'use strict';

const {
  createEngineerMobileTaskListHandler,
} = require('../controllers/engineerMobileController');
const {
  createEngineerMobilePermissionMiddleware,
} = require('../engineerMobile/engineerMobilePermissionMiddleware');

const ENGINEER_MOBILE_TASKS_ROUTE_PATH = '/engineer-mobile/tasks';

function registerEngineerMobileRoutes(router, options = {}) {
  if (!router || typeof router.get !== 'function') {
    return router;
  }

  router.get(
    ENGINEER_MOBILE_TASKS_ROUTE_PATH,
    createEngineerMobilePermissionMiddleware(options.permission),
    createEngineerMobileTaskListHandler(options),
  );

  return router;
}

module.exports = {
  ENGINEER_MOBILE_TASKS_ROUTE_PATH,
  registerEngineerMobileRoutes,
};
