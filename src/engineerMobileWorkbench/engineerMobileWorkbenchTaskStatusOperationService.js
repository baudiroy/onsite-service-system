'use strict';

const DENY_RESPONSE = {
  statusCode: 403,
  body: {
    status: 'deny',
    code: 'ENGINEER_MOBILE_WORKBENCH_TASK_STATUS_OPERATION_DENIED',
    message: 'Engineer mobile workbench task status operation is unavailable.'
  }
};

const MAX_SAFE_TEXT_LENGTH = 120;
const SUPPORTED_OPERATIONS = new Set(['arrived', 'started']);

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function sanitizeText(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue || trimmedValue.length > MAX_SAFE_TEXT_LENGTH) {
    return null;
  }

  return trimmedValue;
}

function authFromRequest(req = {}) {
  return isObject(req.auth) ? req.auth : {};
}

function buildOperationInput(req = {}, operation) {
  if (!SUPPORTED_OPERATIONS.has(operation)) {
    return null;
  }

  const auth = authFromRequest(req);
  const organizationId = sanitizeText(auth.organizationId);
  const engineerId = sanitizeText(auth.engineerId);
  const taskId = sanitizeText(req.params && (req.params.taskId || req.params.appointmentId));

  if (!organizationId || !engineerId || !taskId) {
    return null;
  }

  return {
    organizationId,
    engineerId,
    userId: sanitizeText(auth.userId),
    taskId,
    operation,
    clientRequestId: sanitizeText(req.body && req.body.clientRequestId)
  };
}

function pickStatusProvider(options = {}, operation) {
  if (!isObject(options)) {
    return null;
  }

  if (operation === 'arrived' && isObject(options.arrivedProvider)) {
    return options.arrivedProvider;
  }

  if (operation === 'started' && isObject(options.startedProvider)) {
    return options.startedProvider;
  }

  if (isObject(options.taskStatusProvider)) {
    return options.taskStatusProvider;
  }

  if (isObject(options.statusOperationProvider)) {
    return options.statusOperationProvider;
  }

  if (isObject(options.engineerMobileWorkbenchTaskStatus)) {
    return options.engineerMobileWorkbenchTaskStatus;
  }

  return null;
}

async function executeOperation(provider, input) {
  if (!provider) {
    return null;
  }

  if (input.operation === 'arrived' && typeof provider.markArrived === 'function') {
    return provider.markArrived(input);
  }

  if (input.operation === 'started' && typeof provider.markStarted === 'function') {
    return provider.markStarted(input);
  }

  if (typeof provider.markTaskStatus === 'function') {
    return provider.markTaskStatus(input);
  }

  if (typeof provider.execute === 'function') {
    return provider.execute(input);
  }

  return null;
}

function sanitizeOperationResult(input, providerResult = {}) {
  const result = isObject(providerResult) ? providerResult : {};

  return {
    operation: input.operation,
    taskId: input.taskId,
    status: sanitizeText(result.status) || 'accepted',
    taskStatus: sanitizeText(result.taskStatus),
    operationId: sanitizeText(result.operationId),
    occurredAt: sanitizeText(result.occurredAt),
    messageKey: sanitizeText(result.messageKey)
  };
}

async function buildEngineerMobileWorkbenchTaskStatusOperationResponseAsync(
  req = {},
  operation,
  options = {}
) {
  const input = buildOperationInput(req, operation);

  if (!input) {
    return DENY_RESPONSE;
  }

  try {
    const providerResult = await executeOperation(pickStatusProvider(options, operation), input);

    if (!providerResult) {
      return DENY_RESPONSE;
    }

    return {
      statusCode: 200,
      body: {
        status: 'allow',
        operation: sanitizeOperationResult(input, providerResult)
      }
    };
  } catch (error) {
    return DENY_RESPONSE;
  }
}

module.exports = {
  buildEngineerMobileWorkbenchTaskStatusOperationResponseAsync,
  buildOperationInput,
  sanitizeOperationResult
};
