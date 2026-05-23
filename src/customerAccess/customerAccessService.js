'use strict';

const { resolveCustomerAccess } = require('./customerAccessResolver');
const { buildCustomerAccessEnvelope } = require('./customerAccessResponseEnvelope');

function buildCustomerAccessResponse(input) {
  const decision = resolveCustomerAccess(input);

  if (!decision.allowed) {
    return buildCustomerAccessEnvelope({ decision });
  }

  const data = input && (input.customerVisibleData || input.data);

  return buildCustomerAccessEnvelope({
    decision,
    data,
  });
}

module.exports = {
  buildCustomerAccessResponse,
};
