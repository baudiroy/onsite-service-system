'use strict';

const {
  buildEngineerMobileTaskListAsync,
  buildEngineerMobileTaskList,
} = require('../engineerMobile/engineerMobileTaskListService');

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function buildForbiddenResponse() {
  return {
    statusCode: 403,
    body: {
      status: 'deny',
      messageKey: 'engineerMobile.forbidden',
      tasks: [],
    },
  };
}

function buildDateRange(query) {
  const safeQuery = isPlainObject(query) ? query : {};
  const dateRange = {};

  if (typeof safeQuery.from === 'string' && safeQuery.from.trim()) {
    dateRange.from = safeQuery.from.trim();
  }

  if (typeof safeQuery.to === 'string' && safeQuery.to.trim()) {
    dateRange.to = safeQuery.to.trim();
  }

  return Object.keys(dateRange).length > 0 ? dateRange : undefined;
}

function buildEngineerMobileTaskListResponse(req, options = {}) {
  const request = isPlainObject(req) ? req : {};
  const auth = isPlainObject(request.auth) ? request.auth : {};

  if (!auth.organizationId || !auth.engineerId) {
    return buildForbiddenResponse();
  }

  const envelope = buildEngineerMobileTaskList({
    organizationId: auth.organizationId,
    engineerId: auth.engineerId,
    dateRange: buildDateRange(request.query),
  }, options);

  return {
    statusCode: envelope.status === 'allow' ? 200 : 403,
    body: envelope.status === 'allow'
      ? envelope
      : buildForbiddenResponse().body,
  };
}

async function buildEngineerMobileTaskListResponseAsync(req, options = {}) {
  const request = isPlainObject(req) ? req : {};
  const auth = isPlainObject(request.auth) ? request.auth : {};

  if (!auth.organizationId || !auth.engineerId) {
    return buildForbiddenResponse();
  }

  const envelope = await buildEngineerMobileTaskListAsync({
    organizationId: auth.organizationId,
    engineerId: auth.engineerId,
    dateRange: buildDateRange(request.query),
  }, options);

  return {
    statusCode: envelope.status === 'allow' ? 200 : 403,
    body: envelope.status === 'allow'
      ? envelope
      : buildForbiddenResponse().body,
  };
}

function handleEngineerMobileTaskListRequest(req, res, options = {}) {
  const response = buildEngineerMobileTaskListResponse(req, options);

  return res.status(response.statusCode).json(response.body);
}

async function handleEngineerMobileTaskListRequestAsync(req, res, options = {}) {
  const response = await buildEngineerMobileTaskListResponseAsync(req, options);

  return res.status(response.statusCode).json(response.body);
}

function hasAsyncReadSource(options = {}) {
  return Boolean(
    typeof options.readModelAsync === 'function'
    || typeof options.taskProviderAsync === 'function'
    || (
      isPlainObject(options.repository)
      && (
        typeof options.repository.getReadModelAsync === 'function'
        || typeof options.repository.getTaskListAsync === 'function'
      )
    )
    || (
      isPlainObject(options.readModel)
      && (
        typeof options.readModel.getReadModelAsync === 'function'
        || typeof options.readModel.getTaskListAsync === 'function'
        || typeof options.readModel.listTasksAsync === 'function'
      )
    )
    || (
      isPlainObject(options.taskProvider)
      && (
        typeof options.taskProvider.getTaskListAsync === 'function'
        || typeof options.taskProvider.listTasksAsync === 'function'
      )
    )
  );
}

function createEngineerMobileTaskListHandler(options = {}) {
  return function engineerMobileTaskListHandler(req, res) {
    if (hasAsyncReadSource(options)) {
      return handleEngineerMobileTaskListRequestAsync(req, res, options);
    }

    return handleEngineerMobileTaskListRequest(req, res, options);
  };
}

module.exports = {
  buildEngineerMobileTaskListResponseAsync,
  buildEngineerMobileTaskListResponse,
  createEngineerMobileTaskListHandler,
  handleEngineerMobileTaskListRequestAsync,
  handleEngineerMobileTaskListRequest,
};
