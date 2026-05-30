'use strict';

const {
  buildEngineerMobileTaskDetailAsync,
  buildEngineerMobileTaskDetail,
} = require('../engineerMobile/engineerMobileTaskDetailService');
const {
  buildEngineerMobileAuditEvent,
} = require('../engineerMobile/engineerMobileAuditEventBuilder');
const {
  writeEngineerMobileAuditEvent,
} = require('../engineerMobile/engineerMobileAuditWriterAdapter');

const ENGINEER_MOBILE_TASK_DETAIL_AUDIT_ROUTE = '/engineer-mobile/tasks/:appointmentId';
const ENGINEER_MOBILE_TASK_DETAIL_AUDIT_METHOD = 'GET';
const ENGINEER_MOBILE_TASK_DETAIL_AUDIT_SOURCE = 'engineer_mobile_task_detail_handler';

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

function hasTaskDetailAuditWriter(options) {
  return isPlainObject(options) && typeof options.auditWriter === 'function';
}

function buildTaskDetailAuditMetadata(auth, params, allowed) {
  return {
    routeMatched: true,
    contextPresent: isPlainObject(auth) && Object.keys(auth).length > 0,
    identifierValid: Boolean(auth.organizationId && auth.engineerId && params.appointmentId),
    permissionPassed: allowed === true,
  };
}

function buildEngineerMobileTaskDetailAuditEvent(req, response) {
  const request = isPlainObject(req) ? req : {};
  const auth = isPlainObject(request.auth) ? request.auth : {};
  const params = isPlainObject(request.params) ? request.params : {};
  const allowed = isPlainObject(response)
    && response.statusCode === 200
    && isPlainObject(response.body)
    && response.body.status === 'allow';
  const input = {
    eventType: allowed
      ? 'engineer_mobile.task_detail.allow'
      : 'engineer_mobile.task_detail.deny',
    actorType: isPlainObject(auth) && Object.keys(auth).length > 0 ? 'engineer' : 'runtime',
    decision: allowed ? 'allow' : 'deny',
    route: ENGINEER_MOBILE_TASK_DETAIL_AUDIT_ROUTE,
    method: ENGINEER_MOBILE_TASK_DETAIL_AUDIT_METHOD,
    source: ENGINEER_MOBILE_TASK_DETAIL_AUDIT_SOURCE,
    metadata: buildTaskDetailAuditMetadata(auth, params, allowed),
  };

  if (!allowed) {
    input.reasonCode = 'engineerMobile.unavailable';
  }

  if (auth.organizationId) {
    input.organizationId = auth.organizationId;
  }

  if (auth.engineerId) {
    input.engineerId = auth.engineerId;
  }

  if (params.appointmentId) {
    input.appointmentId = params.appointmentId;
  }

  const result = buildEngineerMobileAuditEvent(input);

  return isPlainObject(result) && result.ok === true && isPlainObject(result.auditEvent)
    ? result.auditEvent
    : undefined;
}

function writeEngineerMobileTaskDetailAuditSideChannel(req, response, options = {}) {
  if (!hasTaskDetailAuditWriter(options)) {
    return undefined;
  }

  const auditEvent = buildEngineerMobileTaskDetailAuditEvent(req, response);

  if (!auditEvent) {
    return undefined;
  }

  const writeResult = writeEngineerMobileAuditEvent({
    auditEvent,
    auditWriter: options.auditWriter,
  });

  if (writeResult && typeof writeResult.catch === 'function') {
    writeResult.catch(() => undefined);
  }

  return undefined;
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

  writeEngineerMobileTaskDetailAuditSideChannel(req, response, options);

  return res.status(response.statusCode).json(response.body);
}

async function handleEngineerMobileTaskDetailRequestAsync(req, res, options = {}) {
  const response = await buildEngineerMobileTaskDetailResponseAsync(req, options);

  writeEngineerMobileTaskDetailAuditSideChannel(req, response, options);

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
  buildEngineerMobileTaskDetailAuditEvent,
  buildEngineerMobileTaskDetailResponseAsync,
  buildEngineerMobileTaskDetailResponse,
  createEngineerMobileTaskDetailHandler,
  handleEngineerMobileTaskDetailRequestAsync,
  handleEngineerMobileTaskDetailRequest,
  writeEngineerMobileTaskDetailAuditSideChannel,
};
