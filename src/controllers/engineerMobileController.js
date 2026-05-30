'use strict';

const {
  buildEngineerMobileTaskListAsync,
  buildEngineerMobileTaskList,
} = require('../engineerMobile/engineerMobileTaskListService');
const {
  buildEngineerMobileAuditEvent,
} = require('../engineerMobile/engineerMobileAuditEventBuilder');
const {
  writeEngineerMobileAuditEvent,
} = require('../engineerMobile/engineerMobileAuditWriterAdapter');

const ENGINEER_MOBILE_TASK_LIST_AUDIT_ROUTE = '/engineer-mobile/tasks';
const ENGINEER_MOBILE_TASK_LIST_AUDIT_METHOD = 'GET';
const ENGINEER_MOBILE_TASK_LIST_AUDIT_SOURCE = 'engineer_mobile_task_list_handler';

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

function hasTaskListAuditWriter(options) {
  return isPlainObject(options) && typeof options.auditWriter === 'function';
}

function buildTaskListAuditMetadata(auth, allowed) {
  return {
    routeMatched: true,
    contextPresent: isPlainObject(auth) && Object.keys(auth).length > 0,
    identifierValid: Boolean(auth.organizationId && auth.engineerId),
    permissionPassed: allowed === true,
  };
}

function buildEngineerMobileTaskListAuditEvent(req, response) {
  const request = isPlainObject(req) ? req : {};
  const auth = isPlainObject(request.auth) ? request.auth : {};
  const allowed = isPlainObject(response)
    && response.statusCode === 200
    && isPlainObject(response.body)
    && response.body.status === 'allow';
  const input = {
    eventType: allowed
      ? 'engineer_mobile.task_list.allow'
      : 'engineer_mobile.task_list.deny',
    actorType: isPlainObject(auth) && Object.keys(auth).length > 0 ? 'engineer' : 'runtime',
    decision: allowed ? 'allow' : 'deny',
    route: ENGINEER_MOBILE_TASK_LIST_AUDIT_ROUTE,
    method: ENGINEER_MOBILE_TASK_LIST_AUDIT_METHOD,
    source: ENGINEER_MOBILE_TASK_LIST_AUDIT_SOURCE,
    metadata: buildTaskListAuditMetadata(auth, allowed),
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

  const result = buildEngineerMobileAuditEvent(input);

  return isPlainObject(result) && result.ok === true && isPlainObject(result.auditEvent)
    ? result.auditEvent
    : undefined;
}

function writeEngineerMobileTaskListAuditSideChannel(req, response, options = {}) {
  if (!hasTaskListAuditWriter(options)) {
    return undefined;
  }

  const auditEvent = buildEngineerMobileTaskListAuditEvent(req, response);

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

  writeEngineerMobileTaskListAuditSideChannel(req, response, options);

  return res.status(response.statusCode).json(response.body);
}

async function handleEngineerMobileTaskListRequestAsync(req, res, options = {}) {
  const response = await buildEngineerMobileTaskListResponseAsync(req, options);

  writeEngineerMobileTaskListAuditSideChannel(req, response, options);

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
  buildEngineerMobileTaskListAuditEvent,
  buildEngineerMobileTaskListResponseAsync,
  buildEngineerMobileTaskListResponse,
  createEngineerMobileTaskListHandler,
  handleEngineerMobileTaskListRequestAsync,
  handleEngineerMobileTaskListRequest,
  writeEngineerMobileTaskListAuditSideChannel,
};
