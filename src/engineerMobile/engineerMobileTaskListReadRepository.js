'use strict';

const {
  buildEngineerMobileTaskListQuerySpec,
  mapEngineerMobileTaskListRows,
} = require('./engineerMobileTaskListReadModelMapper');

const ENGINEER_MOBILE_TASK_LIST_READ_REPOSITORY_NAME = 'engineerMobileTaskListReadRepository';

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function emptyReadModel() {
  return {
    tasks: [],
  };
}

function cloneValue(value) {
  if (value === undefined || value === null) {
    return value;
  }

  return JSON.parse(JSON.stringify(value));
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) {
    return value;
  }

  Object.freeze(value);

  for (const key of Object.keys(value)) {
    deepFreeze(value[key]);
  }

  return value;
}

function resolveExecutor(options) {
  if (!isPlainObject(options)) {
    return undefined;
  }

  if (typeof options.executor === 'function') {
    return options.executor;
  }

  if (options.executor && typeof options.executor.execute === 'function') {
    return options.executor.execute.bind(options.executor);
  }

  if (typeof options.queryExecutor === 'function') {
    return options.queryExecutor;
  }

  if (options.queryExecutor && typeof options.queryExecutor.execute === 'function') {
    return options.queryExecutor.execute.bind(options.queryExecutor);
  }

  return undefined;
}

function rowsFromExecutorResult(result) {
  if (Array.isArray(result)) {
    return result;
  }

  if (isPlainObject(result) && Array.isArray(result.rows)) {
    return result.rows;
  }

  return undefined;
}

function mapReadModelFromRows(rows, request) {
  if (!Array.isArray(rows)) {
    return emptyReadModel();
  }

  return {
    tasks: mapEngineerMobileTaskListRows(rows, {
      engineerId: request.engineerId,
      organizationId: request.organizationId,
    }),
  };
}

function createEngineerMobileTaskListReadRepository(options = {}) {
  const safeOptions = isPlainObject(options) ? options : {};
  const allowNonExecutableForTest = safeOptions.allowNonExecutableForTest === true;
  const execute = resolveExecutor(safeOptions);

  function buildExecutableRequest(input = {}) {
    const request = isPlainObject(input) ? input : {};
    const querySpec = buildEngineerMobileTaskListQuerySpec(request);

    if (!querySpec.ok || !request.organizationId || !request.engineerId) {
      return undefined;
    }

    if (!querySpec.executable && !allowNonExecutableForTest) {
      return undefined;
    }

    if (typeof execute !== 'function') {
      return undefined;
    }

    return {
      protectedSpec: deepFreeze(cloneValue(querySpec)),
      request,
    };
  }

  function getReadModel(input = {}) {
    const executableRequest = buildExecutableRequest(input);

    if (!executableRequest) {
      return emptyReadModel();
    }

    try {
      const result = execute(executableRequest.protectedSpec);
      const rows = rowsFromExecutorResult(result);

      return mapReadModelFromRows(rows, executableRequest.request);
    } catch (error) {
      return emptyReadModel();
    }
  }

  async function getReadModelAsync(input = {}) {
    const executableRequest = buildExecutableRequest(input);

    if (!executableRequest) {
      return emptyReadModel();
    }

    try {
      const result = await execute(executableRequest.protectedSpec);
      const rows = rowsFromExecutorResult(result);

      return mapReadModelFromRows(rows, executableRequest.request);
    } catch (error) {
      return emptyReadModel();
    }
  }

  return {
    getReadModel,
    getReadModelAsync,
    getTaskList: getReadModel,
    getTaskListAsync: getReadModelAsync,
    name: ENGINEER_MOBILE_TASK_LIST_READ_REPOSITORY_NAME,
  };
}

module.exports = {
  ENGINEER_MOBILE_TASK_LIST_READ_REPOSITORY_NAME,
  createEngineerMobileTaskListReadRepository,
};
