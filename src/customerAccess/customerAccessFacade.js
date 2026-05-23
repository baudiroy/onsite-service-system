'use strict';

const { mapCustomerAccessRequest } = require('./customerAccessRequestMapper');
const { buildCustomerAccessResponse } = require('./customerAccessService');

function buildCustomerAccessFacadeResponse(input) {
  const mappedInput = mapCustomerAccessRequest(input);
  return buildCustomerAccessResponse(mappedInput);
}

module.exports = {
  buildCustomerAccessFacadeResponse,
};
