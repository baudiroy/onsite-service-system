'use strict';

const {
  getEngineerAssignedAppointmentsProjection,
} = require('./engineerAssignedAppointmentsProjectionService');

const SAFE_DENY_MESSAGE_KEY = 'engineerMobile.assignedAppointments.unavailable';

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
      appointments: [],
    },
    error: {
      messageKey: SAFE_DENY_MESSAGE_KEY,
    },
  };
}

function statusCodeForEnvelope(envelope) {
  return envelope && envelope.status === 'allow' ? 200 : 404;
}

function requestQuery(request) {
  return isObject(request.query) ? request.query : {};
}

function engineerContextFromRequest(request) {
  return isObject(request.engineerContext) ? request.engineerContext : undefined;
}

function safeDateValue(value) {
  const raw = stringValue(value);

  if (!raw) {
    return undefined;
  }

  if (raw.length > 40 || Number.isNaN(Date.parse(raw))) {
    return null;
  }

  return raw;
}

function safeStatusValue(value) {
  const raw = stringValue(value);

  if (!raw) {
    return undefined;
  }

  if (raw.length > 64 || !/^[a-zA-Z0-9_.:-]+$/.test(raw)) {
    return null;
  }

  return raw;
}

function buildSafeFilters(request) {
  const query = requestQuery(request);
  const dateFrom = safeDateValue(query.dateFrom || query.from);
  const dateTo = safeDateValue(query.dateTo || query.to);
  const status = safeStatusValue(query.status);

  if (dateFrom === null || dateTo === null || status === null) {
    return undefined;
  }

  return {
    dateRange: {
      from: dateFrom,
      to: dateTo,
    },
    statusFilter: status,
  };
}

async function handleEngineerAssignedAppointmentsProjectionRequest(options = {}) {
  if (!isObject(options)) {
    return {
      statusCode: 404,
      body: safeDenyEnvelope(),
    };
  }

  const request = isObject(options.request) ? options.request : {};
  const filters = buildSafeFilters(request);

  if (!filters) {
    return {
      statusCode: 404,
      body: safeDenyEnvelope(),
    };
  }

  const envelope = await getEngineerAssignedAppointmentsProjection({
    dbClient: options.dbClient,
    engineerContext: engineerContextFromRequest(request),
    dateRange: filters.dateRange,
    statusFilter: filters.statusFilter,
  });

  return {
    statusCode: statusCodeForEnvelope(envelope),
    body: envelope,
  };
}

function createEngineerAssignedAppointmentsProjectionHandler(options = {}) {
  const dbClient = isObject(options) ? options.dbClient : undefined;

  return async function handleEngineerAssignedAppointmentsProjectionHttpRequest(req, res) {
    const response = await handleEngineerAssignedAppointmentsProjectionRequest({
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
  createEngineerAssignedAppointmentsProjectionHandler,
  handleEngineerAssignedAppointmentsProjectionRequest,
};
