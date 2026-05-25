'use strict';

const {
  buildEngineerMobileTaskDetailAsync,
  buildEngineerMobileTaskDetail,
} = require('../engineerMobile/engineerMobileTaskDetailService');

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function buildForbiddenResponse() {
  return {
    body: {
      detail: null,
      messageKey: 'engineerMobile.forbidden',
      status: 'deny',
    },
    statusCode: 403,
  };
}

function buildUnavailableResponse() {
  return {
    body: {
      detail: null,
      messageKey: 'engineerMobile.taskDetailUnavailable',
      status: 'deny',
    },
    statusCode: 404,
  };
}

function buildEngineerMobileTaskDetailResponse(req, options = {}) {
  const request = isPlainObject(req) ? req : {};
  const auth = isPlainObject(request.auth) ? request.auth : {};
  const params = isPlainObject(request.params) ? request.params : {};

  if (!auth.organizationId || !auth.engineerId) {
    return buildForbiddenResponse();
  }

  if (!params.appointmentId) {
    return buildUnavailableResponse();
  }

  const envelope = buildEngineerMobileTaskDetail({
    appointmentId: params.appointmentId,
    engineerId: auth.engineerId,
    organizationId: auth.organizationId,
  }, options);

  if (envelope.status !== 'allow') {
    return buildUnavailableResponse();
  }

  return {
    body: envelope,
    statusCode: 200,
  };
}

async function buildEngineerMobileTaskDetailResponseAsync(req, options = {}) {
  const request = isPlainObject(req) ? req : {};
  const auth = isPlainObject(request.auth) ? request.auth : {};
  const params = isPlainObject(request.params) ? request.params : {};

  if (!auth.organizationId || !auth.engineerId) {
    return buildForbiddenResponse();
  }

  if (!params.appointmentId) {
    return buildUnavailableResponse();
  }

  const envelope = await buildEngineerMobileTaskDetailAsync({
    appointmentId: params.appointmentId,
    engineerId: auth.engineerId,
    organizationId: auth.organizationId,
  }, options);

  if (envelope.status !== 'allow') {
    return buildUnavailableResponse();
  }

  return {
    body: envelope,
    statusCode: 200,
  };
}

function handleEngineerMobileTaskDetailRequest(req, res, options = {}) {
  const response = buildEngineerMobileTaskDetailResponse(req, options);

  return res.status(response.statusCode).json(response.body);
}

async function handleEngineerMobileTaskDetailRequestAsync(req, res, options = {}) {
  const response = await buildEngineerMobileTaskDetailResponseAsync(req, options);

  return res.status(response.statusCode).json(response.body);
}

function hasAsyncReadSource(options = {}) {
  return Boolean(
    typeof options.readModelAsync === 'function'
    || typeof options.taskProviderAsync === 'function'
    || (
      isPlainObject(options.repository)
      && (
        typeof options.repository.getTaskDetailAsync === 'function'
        || typeof options.repository.getReadModelAsync === 'function'
        || typeof options.repository.getTaskListAsync === 'function'
      )
    )
    || (
      isPlainObject(options.readModel)
      && (
        typeof options.readModel.getTaskDetailAsync === 'function'
        || typeof options.readModel.getReadModelAsync === 'function'
        || typeof options.readModel.getTaskListAsync === 'function'
        || typeof options.readModel.listTasksAsync === 'function'
      )
    )
    || (
      isPlainObject(options.taskProvider)
      && (
        typeof options.taskProvider.getTaskDetailAsync === 'function'
        || typeof options.taskProvider.getTaskListAsync === 'function'
        || typeof options.taskProvider.listTasksAsync === 'function'
      )
    )
  );
}

function createEngineerMobileTaskDetailHandler(options = {}) {
  return function engineerMobileTaskDetailHandler(req, res) {
    if (hasAsyncReadSource(options)) {
      return handleEngineerMobileTaskDetailRequestAsync(req, res, options);
    }

    return handleEngineerMobileTaskDetailRequest(req, res, options);
  };
}

module.exports = {
  buildEngineerMobileTaskDetailResponseAsync,
  buildEngineerMobileTaskDetailResponse,
  createEngineerMobileTaskDetailHandler,
  handleEngineerMobileTaskDetailRequestAsync,
  handleEngineerMobileTaskDetailRequest,
};
