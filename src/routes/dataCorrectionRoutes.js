'use strict';

const {
  createDataCorrectionGovernanceHandler,
} = require('../controllers/dataCorrectionController');
const {
  createDataCorrectionPermissionMiddleware,
} = require('../dataCorrection/dataCorrectionPermissionMiddleware');

const DATA_CORRECTION_GOVERNANCE_ROUTE_PATH = '/data-correction/governance';

const DATA_CORRECTION_GOVERNANCE_ROUTE_CONTRACT = Object.freeze({
  METHOD: 'post',
  PATH: DATA_CORRECTION_GOVERNANCE_ROUTE_PATH,
});

const DATA_CORRECTION_GOVERNANCE_ROUTE_HANDLER_CONTRACT = Object.freeze({
  PERMISSION_MIDDLEWARE_INDEX: 0,
  GOVERNANCE_HANDLER_INDEX: 1,
  HANDLER_COUNT: 2,
});

const DATA_CORRECTION_GOVERNANCE_ROUTE_OPTION_KEYS = Object.freeze({
  PERMISSION: 'permission',
});

function registerDataCorrectionRoutes(router, options = {}) {
  if (!router || typeof router[DATA_CORRECTION_GOVERNANCE_ROUTE_CONTRACT.METHOD] !== 'function') {
    return router;
  }

  const handlers = [
    createDataCorrectionPermissionMiddleware(options && options[DATA_CORRECTION_GOVERNANCE_ROUTE_OPTION_KEYS.PERMISSION]),
    createDataCorrectionGovernanceHandler(options),
  ];

  router[DATA_CORRECTION_GOVERNANCE_ROUTE_CONTRACT.METHOD](
    DATA_CORRECTION_GOVERNANCE_ROUTE_CONTRACT.PATH,
    ...handlers,
  );

  return router;
}

module.exports = {
  DATA_CORRECTION_GOVERNANCE_ROUTE_HANDLER_CONTRACT,
  DATA_CORRECTION_GOVERNANCE_ROUTE_CONTRACT,
  DATA_CORRECTION_GOVERNANCE_ROUTE_OPTION_KEYS,
  DATA_CORRECTION_GOVERNANCE_ROUTE_PATH,
  registerDataCorrectionRoutes,
};
