'use strict';

const { mapCustomerAccessHttpContext } = require('./customerAccessHttpContextAdapter');
const { buildCustomerAccessFacadeResponse } = require('./customerAccessFacade');

function buildCustomerAccessHttpResponse(input) {
  const mappedInput = mapCustomerAccessHttpContext(input);
  return buildCustomerAccessFacadeResponse(mappedInput);
}

module.exports = {
  buildCustomerAccessHttpResponse,
};
