'use strict';

const {
  getEngineerAssignedAppointmentDetailProjection,
} = require('./engineerAssignedAppointmentDetailProjectionService');

const SAFE_DENY_MESSAGE_KEY = 'engineerMobile.assignedAppointmentDetail.unavailable';

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
    engineerMobileVisible: false,
    data: {
      appointment: null,
    },
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

function engineerContextFromRequest(request) {
  return isObject(request.engineerContext) ? request.engineerContext : undefined;
}

function safeAppointmentIdFromRequest(request) {
  const params = requestParams(request);
  const appointmentId = stringValue(params.appointmentId);

  if (!appointmentId || appointmentId.length > 128 || !/^[a-zA-Z0-9_.:-]+$/.test(appointmentId)) {
    return undefined;
  }

  return appointmentId;
}

async function handleEngineerAssignedAppointmentDetailProjectionRequest(options = {}) {
  if (!isObject(options)) {
    return {
      statusCode: 404,
      body: safeDenyEnvelope(),
    };
  }

  const request = isObject(options.request) ? options.request : {};
  const appointmentId = safeAppointmentIdFromRequest(request);

  if (!appointmentId) {
    return {
      statusCode: 404,
      body: safeDenyEnvelope(),
    };
  }

  const envelope = await getEngineerAssignedAppointmentDetailProjection({
    dbClient: options.dbClient,
    engineerContext: engineerContextFromRequest(request),
    appointmentId,
  });

  return {
    statusCode: statusCodeForEnvelope(envelope),
    body: envelope,
  };
}

function createEngineerAssignedAppointmentDetailProjectionHandler(options = {}) {
  const dbClient = isObject(options) ? options.dbClient : undefined;

  return async function handleEngineerAssignedAppointmentDetailProjectionHttpRequest(req, res) {
    const response = await handleEngineerAssignedAppointmentDetailProjectionRequest({
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
  createEngineerAssignedAppointmentDetailProjectionHandler,
  handleEngineerAssignedAppointmentDetailProjectionRequest,
};
