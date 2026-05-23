'use strict';

const {
  CUSTOMER_ACCESS_ROUTE_PATH,
  registerCustomerAccessRoutes,
} = require('../routes/customerAccessRoutes');

function registerCustomerAccessModuleRoutes(router) {
  return registerCustomerAccessRoutes(router);
}

function getCustomerAccessRouteDefinitions() {
  return [
    {
      module: 'customerAccess',
      method: 'GET',
      path: CUSTOMER_ACCESS_ROUTE_PATH,
    },
  ];
}

module.exports = {
  getCustomerAccessRouteDefinitions,
  registerCustomerAccessModuleRoutes,
};
