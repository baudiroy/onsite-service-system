'use strict';

const { buildCustomerAccessHttpResponse } = require('../customerAccess/customerAccessHttpFacade');

function buildCustomerAccessControllerResponse(req) {
  const request = req && typeof req === 'object' ? req : {};

  return buildCustomerAccessHttpResponse({
    params: request.params || {},
    auth: request.auth || {},
    channel: request.channel || {},
    access: request.access || {},
    customerVisibleData: request.customerVisibleData || {},
  });
}

function statusCodeForEnvelope(envelope) {
  return envelope && envelope.status === 'allow' ? 200 : 404;
}

function handleCustomerAccessRequest(req, res) {
  const envelope = buildCustomerAccessControllerResponse(req);
  const statusCode = statusCodeForEnvelope(envelope);

  return res.status(statusCode).json(envelope);
}

module.exports = {
  buildCustomerAccessControllerResponse,
  handleCustomerAccessRequest,
};
