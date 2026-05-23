'use strict';

const {
  getCustomerServiceReportProjection,
} = require('./customerServiceReportProjectionService');

const SAFE_DENY_MESSAGE_KEY = 'customerAccess.unavailable';

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stringValue(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function safeDenyEnvelope() {
  return {
    status: 'deny',
    messageKey: SAFE_DENY_MESSAGE_KEY,
    customerVisible: false,
    data: null,
    error: {
      messageKey: SAFE_DENY_MESSAGE_KEY,
    },
  };
}

function statusCodeForEnvelope(envelope) {
  return envelope && envelope.status === 'allow' ? 200 : 404;
}

function requestParams(request) {
  return isObject(request.params) ? request.params : {};
}

function requestQuery(request) {
  return isObject(request.query) ? request.query : {};
}

function customerAccessContextFromRequest(request) {
  return isObject(request.customerAccessContext) ? request.customerAccessContext : undefined;
}

async function handleCustomerServiceReportProjectionRequest(options = {}) {
  if (!isObject(options)) {
    return {
      statusCode: 404,
      body: safeDenyEnvelope(),
    };
  }

  const request = isObject(options.request) ? options.request : {};
  const params = requestParams(request);
  const query = requestQuery(request);
  const envelope = await getCustomerServiceReportProjection({
    dbClient: options.dbClient,
    customerAccessContext: customerAccessContextFromRequest(request),
    caseId: stringValue(params.caseId),
    reportId: stringValue(params.reportId) || stringValue(query.reportId),
  });

  return {
    statusCode: statusCodeForEnvelope(envelope),
    body: envelope,
  };
}

function createCustomerServiceReportProjectionHandler(options = {}) {
  const dbClient = isObject(options) ? options.dbClient : undefined;

  return async function handleCustomerServiceReportProjectionHttpRequest(req, res) {
    const response = await handleCustomerServiceReportProjectionRequest({
      request: req,
      dbClient,
    });

    if (res && typeof res.status === 'function' && typeof res.json === 'function') {
      return res.status(response.statusCode).json(response.body);
    }

    return response;
  };
}

module.exports = {
  createCustomerServiceReportProjectionHandler,
  handleCustomerServiceReportProjectionRequest,
};
